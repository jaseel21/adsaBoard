import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

/**
 * ADSA Profile Photo Moderation & Approval Service
 * Manages photo submissions, pending admin approval queue,
 * real-time status synchronization, and audit logging.
 */

export const PHOTO_REJECTION_REASONS = [
  { id: 'informal', labelEn: 'Informal / Campus Dress Code', labelMl: 'അനുയോജ്യമല്ലാത്ത വസ്ത്രധാരണം' },
  { id: 'blurry', labelEn: 'Blurry / Poor Lighting', labelMl: 'വ്യക്തതയില്ലാത്ത ചിത്രം' },
  { id: 'not_face', labelEn: 'Not a Student Portrait', labelMl: 'വിദ്യാർത്ഥിയുടെ മുഖചിത്രമല്ല' },
  { id: 'inappropriate', labelEn: 'Does not follow Dars etiquette', labelMl: 'ദർസ് മര്യാദകൾക്ക് അനുയോജ്യമല്ല' },
];

/**
 * Student submits a photo for Central Committee review
 */
export async function submitPhotoRequest({ student, dataUrl, reason = '' }) {
  const db = firebase.firestore();
  const tokenNo = Number(student.tokenNo);
  const studentId = student.documentId || student.id;

  if (!tokenNo || !studentId) {
    throw new Error('Valid student token and record ID are required.');
  }

  if (!dataUrl) {
    throw new Error('Profile photo data is missing.');
  }

  const nowIso = new Date().toISOString();
  const requestPayload = {
    studentId,
    tokenNo,
    studentName: student.nameEn || student.name || `Token #${tokenNo}`,
    batch: student.batch || '',
    photoURL: dataUrl,
    submissionNote: (reason || '').trim(),
    status: 'pending', // 'pending' | 'approved' | 'rejected' | 'cancelled'
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  const batch = db.batch();
  const requestRef = db.collection('photo_requests').doc();

  // 1. Record photo moderation request
  batch.set(requestRef, requestPayload);

  // 2. Mirror pending state on student record for instant UI reactivity
  const studentRef = db.collection('students').doc(studentId);
  batch.update(studentRef, {
    pendingPhotoRequest: {
      requestId: requestRef.id,
      status: 'pending',
      photoURL: dataUrl,
      submissionNote: (reason || '').trim(),
      requestedAt: nowIso,
    },
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return {
    requestId: requestRef.id,
    status: 'pending',
  };
}

/**
 * Central Committee / Admin approves a pending photo
 */
export async function approvePhotoRequest({ requestId, studentId, photoURL, tokenNo, studentName, adminEmail }) {
  const db = firebase.firestore();
  const batch = db.batch();
  const nowIso = new Date().toISOString();

  // 1. Update request status
  if (requestId) {
    const requestRef = db.collection('photo_requests').doc(requestId);
    batch.update(requestRef, {
      status: 'approved',
      reviewedBy: adminEmail || 'admin',
      reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 2. Commit photo directly to student document and clear pending state
  const studentRef = db.collection('students').doc(studentId);
  batch.update(studentRef, {
    photoURL: photoURL,
    photoApprovedAt: nowIso,
    pendingPhotoRequest: null,
    lastUpdatedBy: adminEmail || 'admin',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  // 3. Log Audit Trail
  await logAuditEvent({
    category: AUDIT_CATEGORIES.STUDENTS,
    action: 'STUDENT_UPDATE',
    severity: AUDIT_SEVERITIES.NOTICE,
    target: {
      type: 'student',
      id: studentId,
      label: `Token #${tokenNo} (${studentName || 'Student'})`,
      tokenNo: Number(tokenNo),
    },
    changes: {
      diffSummary: `Approved new profile photo for Token #${tokenNo}`,
      fieldsChanged: ['photoURL', 'photoApprovedAt', 'pendingPhotoRequest'],
      before: { photoURL: null },
      after: { photoURL: 'Approved Photo' },
    },
    role: 'central_committee',
  });

  return { success: true };
}

/**
 * Central Committee / Admin rejects a pending photo
 */
export async function rejectPhotoRequest({ requestId, studentId, reason, tokenNo, studentName, adminEmail }) {
  const db = firebase.firestore();
  const batch = db.batch();
  const nowIso = new Date().toISOString();

  if (requestId) {
    const requestRef = db.collection('photo_requests').doc(requestId);
    batch.update(requestRef, {
      status: 'rejected',
      rejectionReason: reason || 'Does not meet campus guidelines',
      reviewedBy: adminEmail || 'admin',
      reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  const studentRef = db.collection('students').doc(studentId);
  batch.update(studentRef, {
    pendingPhotoRequest: {
      status: 'rejected',
      rejectionReason: reason || 'Does not meet campus guidelines',
      reviewedAt: nowIso,
    },
    lastUpdatedBy: adminEmail || 'admin',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  await logAuditEvent({
    category: AUDIT_CATEGORIES.STUDENTS,
    action: 'STUDENT_UPDATE',
    severity: AUDIT_SEVERITIES.WARNING,
    target: {
      type: 'student',
      id: studentId,
      label: `Token #${tokenNo} (${studentName || 'Student'})`,
      tokenNo: Number(tokenNo),
    },
    changes: {
      diffSummary: `Rejected profile photo for Token #${tokenNo}: ${reason || 'Unspecified'}`,
      fieldsChanged: ['pendingPhotoRequest'],
      before: { status: 'pending' },
      after: { status: 'rejected', reason },
    },
    role: 'central_committee',
  });

  return { success: true };
}

/**
 * Student cancels their pending photo upload
 */
export async function cancelPhotoRequest({ requestId, studentId }) {
  const db = firebase.firestore();
  const batch = db.batch();

  if (requestId) {
    const requestRef = db.collection('photo_requests').doc(requestId);
    batch.update(requestRef, {
      status: 'cancelled',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  const studentRef = db.collection('students').doc(studentId);
  batch.update(studentRef, {
    pendingPhotoRequest: null,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return { success: true };
}

/**
 * Admin removes an existing approved photo
 */
export async function removeApprovedPhoto({ studentId, tokenNo, adminEmail }) {
  const db = firebase.firestore();
  const studentRef = db.collection('students').doc(studentId);

  await studentRef.update({
    photoURL: firebase.firestore.FieldValue.delete(),
    photoApprovedAt: firebase.firestore.FieldValue.delete(),
    pendingPhotoRequest: null,
    lastUpdatedBy: adminEmail || 'admin',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  await logAuditEvent({
    category: AUDIT_CATEGORIES.STUDENTS,
    action: 'STUDENT_UPDATE',
    severity: AUDIT_SEVERITIES.NOTICE,
    target: {
      type: 'student',
      id: studentId,
      label: `Token #${tokenNo}`,
      tokenNo: Number(tokenNo),
    },
    changes: {
      diffSummary: `Removed approved profile photo for Token #${tokenNo}`,
      fieldsChanged: ['photoURL'],
      before: { photoURL: 'Approved Photo' },
      after: { photoURL: null },
    },
    role: 'central_committee',
  });

  return { success: true };
}

/**
 * Real-time listener for pending photo moderation requests
 */
export function subscribePendingPhotoRequests(callback) {
  return firebase
    .firestore()
    .collection('photo_requests')
    .where('status', '==', 'pending')
    .onSnapshot(
      (snap) => {
        const requests = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        requests.sort((a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0));
        callback(requests);
      },
      (err) => {
        console.warn('Error subscribing to pending photo requests:', err);
        callback([]);
      }
    );
}
