import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

/**
 * ADSA T-Board Centralized Dietary Preference Change Request Service
 * Powers student-initiated change requests, real-time committee review,
 * automated student profile synchronization, and audit traceability.
 */

export const REASON_CATEGORIES = {
  allergy: {
    id: 'allergy',
    labelEn: 'Medical / Food Allergy',
    labelMl: 'മെഡിക്കൽ / അലർജി',
  },
  doctor_advice: {
    id: 'doctor_advice',
    labelEn: 'Doctor Advice / Treatment',
    labelMl: 'ഡോക്ടറുടെ നിർദ്ദേശം',
  },
  personal: {
    id: 'personal',
    labelEn: 'Personal Preference',
    labelMl: 'വ്യക്തിപരമായ താത്പര്യം',
  },
  temporary: {
    id: 'temporary',
    labelEn: 'Temporary Health Issue',
    labelMl: 'താത്കാലിക അസുഖം',
  },
  other: {
    id: 'other',
    labelEn: 'Other Concern',
    labelMl: 'മറ്റ് കാരണങ്ങൾ',
  },
};

/**
 * Helper to compute differences between current and requested dietary preferences
 */
export function computeDietaryChanges(currentDietary = {}, requestedDietary = {}, preferencesList = []) {
  const changes = [];
  const allKeys = new Set([
    ...Object.keys(currentDietary || {}),
    ...Object.keys(requestedDietary || {}),
    ...preferencesList.map((p) => p.id),
  ]);

  allKeys.forEach((prefId) => {
    if (!prefId) return;
    const prefMeta = preferencesList.find((p) => p.id === prefId) || {
      id: prefId,
      labelEn: prefId.charAt(0).toUpperCase() + prefId.slice(1),
      labelMl: prefId,
    };

    // Current: true or undefined = included, false = excluded
    const fromVal = currentDietary[prefId] !== false && currentDietary[prefId.toLowerCase()] !== false;
    const toVal = requestedDietary[prefId] !== false && requestedDietary[prefId.toLowerCase()] !== false;

    if (fromVal !== toVal) {
      changes.push({
        prefId,
        labelEn: prefMeta.labelEn || prefId,
        labelMl: prefMeta.labelMl || prefMeta.labelEn || prefId,
        from: fromVal, // true: Included, false: Excluded
        to: toVal,     // true: Included, false: Excluded
      });
    }
  });

  return changes;
}

/**
 * Submit a student request to change their assigned dietary preferences
 */
export async function submitDietaryChangeRequest({
  student,
  currentDietary,
  requestedDietary,
  preferencesList = [],
  reasonCategory = 'personal',
  reasonText = '',
  urgency = 'normal',
}) {
  const db = firebase.firestore();
  const tokenNo = Number(student.tokenNo);
  const studentId = student.documentId || student.id;

  if (!tokenNo || !studentId) {
    throw new Error('Valid student token and record ID are required.');
  }

  const changes = computeDietaryChanges(currentDietary, requestedDietary, preferencesList);
  if (changes.length === 0) {
    throw new Error('No dietary changes detected. Please modify at least one preference.');
  }

  const now = firebase.firestore.FieldValue.serverTimestamp();
  const requestPayload = {
    tokenNo,
    studentId,
    studentName: student.name || `Student #${tokenNo}`,
    batch: student.batch || '',
    phone: student.phone || '',
    currentDietary: currentDietary || {},
    requestedDietary: requestedDietary || {},
    changes,
    reasonCategory: reasonCategory || 'personal',
    reasonText: (reasonText || '').trim(),
    urgency: urgency || 'normal',
    status: 'pending',
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  const requestRef = db.collection('dietary_requests').doc();

  // 1. Add request document
  batch.set(requestRef, requestPayload);

  // 2. Mirror pending state on student record for instant UI lookup
  const studentRef = db.collection('students').doc(studentId);
  batch.update(studentRef, {
    pendingDietaryRequest: {
      requestId: requestRef.id,
      status: 'pending',
      changes,
      requestedDietary,
      reasonCategory,
      reasonText: (reasonText || '').trim(),
      urgency,
      createdAt: new Date().toISOString(),
    },
    updatedAt: now,
  });

  await batch.commit();

  // Log in Audit Trail
  logAuditEvent({
    category: AUDIT_CATEGORIES.DIETARY,
    action: 'CREATE_DIETARY_REQUEST',
    severity: urgency === 'urgent' ? AUDIT_SEVERITIES.WARNING : AUDIT_SEVERITIES.INFO,
    actor: {
      uid: `token-${tokenNo}`,
      name: student.name || `Student #${tokenNo}`,
      role: 'student',
    },
    target: {
      type: 'dietary_request',
      id: requestRef.id,
      name: `Token #${tokenNo} Dietary Change Request`,
    },
    metadata: {
      tokenNo,
      changesCount: changes.length,
      changes,
      reasonCategory,
      reasonText,
    },
  }).catch((err) => console.warn('Audit logging failed for dietary request:', err));

  return { id: requestRef.id, ...requestPayload };
}

/**
 * Cancel / withdraw a pending dietary change request before committee review
 */
export async function cancelDietaryChangeRequest(requestId, studentId, studentTokenNo) {
  const db = firebase.firestore();
  const now = firebase.firestore.FieldValue.serverTimestamp();

  const batch = db.batch();
  const requestRef = db.collection('dietary_requests').doc(requestId);
  batch.update(requestRef, {
    status: 'cancelled',
    updatedAt: now,
  });

  if (studentId) {
    const studentRef = db.collection('students').doc(studentId);
    batch.update(studentRef, {
      pendingDietaryRequest: null,
      updatedAt: now,
    });
  }

  await batch.commit();

  logAuditEvent({
    category: AUDIT_CATEGORIES.DIETARY,
    action: 'CANCEL_DIETARY_REQUEST',
    severity: AUDIT_SEVERITIES.INFO,
    actor: {
      uid: `token-${studentTokenNo || 'unknown'}`,
      name: `Student #${studentTokenNo || 'unknown'}`,
      role: 'student',
    },
    target: {
      type: 'dietary_request',
      id: requestId,
      name: `Dietary Change Request Cancelled`,
    },
  }).catch(() => {});

  return true;
}

/**
 * Approve a student's dietary change request and apply preferences to student record
 */
export async function approveDietaryChangeRequest(requestId, adminActor = {}) {
  const db = firebase.firestore();
  const requestRef = db.collection('dietary_requests').doc(requestId);
  const snap = await requestRef.get();

  if (!snap.exists) {
    throw new Error('Dietary request not found.');
  }

  const reqData = snap.data();
  if (reqData.status !== 'pending') {
    throw new Error(`Cannot approve request with status "${reqData.status}".`);
  }

  const now = firebase.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  // 1. Mark request as approved
  batch.update(requestRef, {
    status: 'approved',
    reviewedBy: {
      uid: adminActor.uid || 'admin',
      name: adminActor.displayName || adminActor.name || 'Canteen Committee Admin',
      role: adminActor.role || 'canteen_admin',
      email: adminActor.email || '',
    },
    reviewedAt: now,
    updatedAt: now,
  });

  // 2. Synchronize target student's obj2 and clear pending request
  const studentRef = db.collection('students').doc(reqData.studentId);
  batch.update(studentRef, {
    obj2: reqData.requestedDietary,
    pendingDietaryRequest: null,
    updatedAt: now,
  });

  await batch.commit();

  // Log in Audit Trail
  logAuditEvent({
    category: AUDIT_CATEGORIES.DIETARY,
    action: 'APPROVE_DIETARY_REQUEST',
    severity: AUDIT_SEVERITIES.NOTICE,
    actor: {
      uid: adminActor.uid || 'admin',
      name: adminActor.displayName || adminActor.name || 'Canteen Admin',
      role: adminActor.role || 'canteen_admin',
    },
    target: {
      type: 'student',
      id: reqData.studentId,
      name: `Token #${reqData.tokenNo} (${reqData.studentName})`,
    },
    metadata: {
      requestId,
      tokenNo: reqData.tokenNo,
      appliedDietary: reqData.requestedDietary,
      changes: reqData.changes,
    },
  }).catch(() => {});

  return true;
}

/**
 * Reject a student's dietary change request with an optional explanation
 */
export async function rejectDietaryChangeRequest(requestId, adminActor = {}, rejectionReason = '') {
  const db = firebase.firestore();
  const requestRef = db.collection('dietary_requests').doc(requestId);
  const snap = await requestRef.get();

  if (!snap.exists) {
    throw new Error('Dietary request not found.');
  }

  const reqData = snap.data();
  if (reqData.status !== 'pending') {
    throw new Error(`Cannot reject request with status "${reqData.status}".`);
  }

  const now = firebase.firestore.FieldValue.serverTimestamp();
  const batch = db.batch();

  // 1. Mark request as rejected
  batch.update(requestRef, {
    status: 'rejected',
    rejectionReason: (rejectionReason || 'Declined by Canteen Committee.').trim(),
    reviewedBy: {
      uid: adminActor.uid || 'admin',
      name: adminActor.displayName || adminActor.name || 'Canteen Committee Admin',
      role: adminActor.role || 'canteen_admin',
      email: adminActor.email || '',
    },
    reviewedAt: now,
    updatedAt: now,
  });

  // 2. Clear pending state on student record
  const studentRef = db.collection('students').doc(reqData.studentId);
  batch.update(studentRef, {
    pendingDietaryRequest: null,
    updatedAt: now,
  });

  await batch.commit();

  logAuditEvent({
    category: AUDIT_CATEGORIES.DIETARY,
    action: 'REJECT_DIETARY_REQUEST',
    severity: AUDIT_SEVERITIES.NOTICE,
    actor: {
      uid: adminActor.uid || 'admin',
      name: adminActor.displayName || adminActor.name || 'Canteen Admin',
      role: adminActor.role || 'canteen_admin',
    },
    target: {
      type: 'student',
      id: reqData.studentId,
      name: `Token #${reqData.tokenNo}`,
    },
    metadata: {
      requestId,
      tokenNo: reqData.tokenNo,
      rejectionReason,
    },
  }).catch(() => {});

  return true;
}

/**
 * Real-time listener for a specific student's active pending request
 */
export function subscribeStudentPendingDietaryRequest(tokenNo, onUpdate, onError) {
  if (!tokenNo) return () => {};
  const db = firebase.firestore();

  return db
    .collection('dietary_requests')
    .where('tokenNo', '==', Number(tokenNo))
    .where('status', '==', 'pending')
    .limit(1)
    .onSnapshot(
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate(null);
        } else {
          const doc = snapshot.docs[0];
          onUpdate({ id: doc.id, ...doc.data() });
        }
      },
      (err) => {
        console.error('Error subscribing to student dietary request:', err);
        if (onError) onError(err);
      }
    );
}

/**
 * Real-time listener for all dietary requests for Canteen Management Console
 */
export function subscribeAllDietaryRequests(onUpdate, onError) {
  const db = firebase.firestore();

  return db
    .collection('dietary_requests')
    .orderBy('createdAt', 'desc')
    .limit(150)
    .onSnapshot(
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (onUpdate) onUpdate(list);
      },
      (err) => {
        console.error('Error subscribing to all dietary requests:', err);
        if (onError) onError(err);
      }
    );
}
