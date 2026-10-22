import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';
import { generateTicketNumber, saveLocalRecentTicket, appendTicketMessage } from './supportTicketService';

/**
 * ADSA T-Board Centralized Unblock Request Service
 * Powers student-initiated unblock appeals, real-time status reflection,
 * Central Committee 1-click approvals, and audit traceability.
 */

export const UNBLOCK_REASONS = {
  fee_cleared: {
    id: 'fee_cleared',
    key: 'reasonFeeCleared',
    labelEn: 'Mess Dues Cleared',
    labelMl: 'മെസ്സ് ഫീസ് അടച്ചുതീർത്തു',
    icon: 'Receipt',
    descriptionEn: 'Mess fees or arrears have been settled with accounts.',
    descriptionMl: 'മെസ്സ് ഫീസ് അല്ലെങ്കിൽ കുടിശ്ശിക അക്കൗണ്ട്സിൽ അടച്ചുതീർത്തു.',
  },
  leave_rectified: {
    id: 'leave_rectified',
    key: 'reasonLeaveReturn',
    labelEn: 'Returned from Leave',
    labelMl: 'അവധി കഴിഞ്ഞ് തിരിച്ചെത്തി',
    icon: 'CalendarCheck',
    descriptionEn: 'Returned from home leave, medical leave, or campus absence.',
    descriptionMl: 'അവധി കഴിഞ്ഞ് കാമ്പസിൽ തിരിച്ചെത്തി.',
  },
  mistake_dispute: {
    id: 'mistake_dispute',
    key: 'reasonDispute',
    labelEn: 'Lockout in Error / Dispute',
    labelMl: 'അബദ്ധത്തിൽ സംഭവിച്ചത്',
    icon: 'AlertCircle',
    descriptionEn: 'Token was blocked by mistake or disagreement over status.',
    descriptionMl: 'ടോക്കൺ അബദ്ധത്തിൽ തടഞ്ഞുവെച്ചതാണ്.',
  },
  emergency_meal: {
    id: 'emergency_meal',
    key: 'reasonEmergency',
    labelEn: 'Emergency Mess Access Needed',
    labelMl: 'അടിയന്തര ഭക്ഷണം ആവശ്യമുണ്ട്',
    icon: 'Utensils',
    descriptionEn: 'Urgent dining token access required for upcoming meal service.',
    descriptionMl: 'ഇന്നത്തെ ഭക്ഷണത്തിന് അടിയന്തര ടോക്കൺ ആവശ്യമുണ്ട്.',
  },
  other: {
    id: 'other',
    key: 'reasonOther',
    labelEn: 'Other Concern',
    labelMl: 'മറ്റ് കാരണങ്ങൾ',
    icon: 'HelpCircle',
    descriptionEn: 'Other administrative justification or personal clarification.',
    descriptionMl: 'മറ്റ് അഡ്മിനിസ്ട്രേറ്റീവ് കാര്യങ്ങൾ.',
  },
};

/**
 * Submit a student appeal to request unblocking of a locked dining token
 */
export async function submitUnblockRequest({
  student,
  reasonCategory = 'fee_cleared',
  reasonNote = '',
  phone = '',
  attachment = null,
}) {
  const db = firebase.firestore();
  const tokenNo = Number(student.tokenNo);
  const studentDocId = student.documentId || student.id;

  if (!tokenNo || !studentDocId) {
    throw new Error('Valid student token number and record ID are required.');
  }

  const ticketNumber = generateTicketNumber();
  const now = firebase.firestore.FieldValue.serverTimestamp();
  const isoNow = new Date().toISOString();

  const reasonMeta = UNBLOCK_REASONS[reasonCategory] || UNBLOCK_REASONS.other;
  const subject = `Token #${tokenNo} Unblock Request (${student.name || 'Student'}) - ${reasonMeta.labelEn}`;
  const description = `Unblock requested by Student #${tokenNo} (${student.name || 'Student'}).\nReason: ${reasonMeta.labelEn}\nNotes: ${reasonNote.trim() || 'No additional note provided.'}`;

  const ticketPayload = {
    ticketNumber,
    category: 'token_lock',
    urgency: 'critical',
    status: 'new',
    subject,
    description,
    isUnblockRequest: true,
    unblockDetails: {
      reasonCategory,
      reasonLabel: reasonMeta.labelEn,
      reasonNote: reasonNote.trim(),
      phone: phone.trim() || student.phone || '',
      hasAttachment: Boolean(attachment),
    },
    rating: null,
    tags: ['unblock', 'EmergencyUnblock', 'token_locked'],
    student: {
      isAnonymous: false,
      tokenNumber: tokenNo,
      studentId: studentDocId,
      name: student.name || `Student #${tokenNo}`,
      batch: student.batch || '',
      phone: phone.trim() || student.phone || '',
    },
    attachments: attachment ? [attachment] : [],
    assignment: null,
    thread: [
      {
        id: `msg_${Date.now()}`,
        senderType: 'student',
        senderName: student.name || `Student #${tokenNo}`,
        message: description,
        timestamp: isoNow,
        isInternal: false,
      },
    ],
    resolution: null,
    createdAt: now,
    updatedAt: now,
  };

  const batch = db.batch();
  const ticketRef = db.collection('support_tickets').doc();
  batch.set(ticketRef, ticketPayload);

  const studentRef = db.collection('students').doc(studentDocId);
  const pendingPayload = {
    ticketId: ticketRef.id,
    ticketNumber,
    reasonCategory,
    reasonLabel: reasonMeta.labelEn,
    reasonNote: reasonNote.trim(),
    phone: phone.trim() || student.phone || '',
    hasAttachment: Boolean(attachment),
    status: 'pending',
    requestedAt: isoNow,
  };
  batch.update(studentRef, {
    pendingUnblockRequest: pendingPayload,
    updatedAt: now,
  });

  await batch.commit();

  saveLocalRecentTicket({
    id: ticketRef.id,
    ticketNumber,
    subject,
    category: 'token_lock',
  });

  logAuditEvent({
    category: AUDIT_CATEGORIES.TOKENS,
    action: 'REQUEST_UNBLOCK',
    severity: AUDIT_SEVERITIES.WARNING,
    actor: {
      uid: `token-${tokenNo}`,
      name: student.name || `Token #${tokenNo}`,
      role: 'student',
    },
    target: {
      type: 'student_token',
      id: studentDocId,
      name: `Token #${tokenNo}`,
    },
    metadata: {
      ticketNumber,
      ticketId: ticketRef.id,
      reasonCategory,
      reasonNote: reasonNote.trim(),
    },
  }).catch(() => {});

  return {
    ticketId: ticketRef.id,
    ticketNumber,
    ...pendingPayload,
  };
}

/**
 * Approve and execute 1-click unblock for a student token
 */
export async function approveUnblockRequest({
  studentId,
  tokenNo,
  ticketId,
  reviewerInfo = {},
  resolutionNote = '',
}) {
  const db = firebase.firestore();
  const now = firebase.firestore.FieldValue.serverTimestamp();
  const isoNow = new Date().toISOString();
  const reviewerName = reviewerInfo.name || reviewerInfo.email?.split('@')[0] || 'Central Committee';

  // 1. Locate student doc
  let targetStudentDoc = null;
  if (studentId) {
    const docSnap = await db.collection('students').doc(studentId).get();
    if (docSnap.exists) {
      targetStudentDoc = docSnap;
    }
  }
  if (!targetStudentDoc && tokenNo) {
    const snap = await db.collection('students').where('tokenNo', '==', Number(tokenNo)).get();
    if (!snap.empty) {
      targetStudentDoc = snap.docs[0];
    }
  }

  const batch = db.batch();

  if (targetStudentDoc) {
    batch.update(targetStudentDoc.ref, {
      block: false,
      blockReason: '',
      pendingUnblockRequest: null,
      lastUnblockedAt: isoNow,
      lastUnblockedBy: reviewerName,
      updatedAt: now,
    });
  }

  // 2. Resolve support ticket if ticketId exists
  if (ticketId) {
    const ticketRef = db.collection('support_tickets').doc(ticketId);
    batch.update(ticketRef, {
      status: 'resolved',
      updatedAt: now,
      resolution: {
        resolvedBy: reviewerName,
        resolvedAt: now,
        note: resolutionNote.trim() || 'Token lock lifted and dining privileges restored.',
      },
    });
  }

  await batch.commit();

  // Append resolution message to ticket thread
  if (ticketId) {
    appendTicketMessage(ticketId, {
      senderType: 'staff',
      senderName: reviewerName,
      message: `Token #${tokenNo || targetStudentDoc?.data()?.tokenNo || ''} has been verified and successfully unblocked in the central registry. ${
        resolutionNote ? `Note: "${resolutionNote}"` : 'All dining privileges and switches are now fully active.'
      }`,
      isInternal: false,
    }).catch(() => {});
  }

  // Log Audit Event
  logAuditEvent({
    category: AUDIT_CATEGORIES.TOKENS,
    action: 'STUDENT_UNBLOCK',
    severity: AUDIT_SEVERITIES.INFO,
    actor: {
      uid: reviewerInfo.uid || 'admin',
      name: reviewerName,
      email: reviewerInfo.email || '',
      role: reviewerInfo.role || 'central_committee',
    },
    target: {
      type: 'student_token',
      id: targetStudentDoc ? targetStudentDoc.id : studentId,
      name: `Token #${tokenNo || targetStudentDoc?.data()?.tokenNo}`,
    },
    metadata: {
      ticketId,
      resolutionNote,
    },
  }).catch(() => {});

  return { success: true };
}

/**
 * Cancel or withdraw an unblock request
 */
export async function cancelUnblockRequest({
  studentId,
  tokenNo,
  ticketId,
  reason = 'Withdrawn by student',
}) {
  const db = firebase.firestore();
  const now = firebase.firestore.FieldValue.serverTimestamp();

  let targetStudentDoc = null;
  if (studentId) {
    const docSnap = await db.collection('students').doc(studentId).get();
    if (docSnap.exists) targetStudentDoc = docSnap;
  }
  if (!targetStudentDoc && tokenNo) {
    const snap = await db.collection('students').where('tokenNo', '==', Number(tokenNo)).get();
    if (!snap.empty) targetStudentDoc = snap.docs[0];
  }

  const batch = db.batch();
  if (targetStudentDoc) {
    batch.update(targetStudentDoc.ref, {
      pendingUnblockRequest: null,
      updatedAt: now,
    });
  }

  if (ticketId) {
    const ticketRef = db.collection('support_tickets').doc(ticketId);
    batch.update(ticketRef, {
      status: 'closed',
      updatedAt: now,
    });
  }

  await batch.commit();

  if (ticketId) {
    appendTicketMessage(ticketId, {
      senderType: 'student',
      senderName: targetStudentDoc?.data()?.name || `Student #${tokenNo}`,
      message: `Unblock request cancelled/withdrawn: ${reason}`,
      isInternal: false,
    }).catch(() => {});
  }

  return { success: true };
}

/**
 * Real-time listener for student unblock request and lock status
 */
export function subscribeStudentPendingUnblockRequest(tokenNo, onUpdate, onError) {
  if (!tokenNo) return () => {};
  const db = firebase.firestore();

  return db
    .collection('students')
    .where('tokenNo', '==', Number(tokenNo))
    .limit(1)
    .onSnapshot(
      (snapshot) => {
        if (snapshot.empty) {
          onUpdate(null);
        } else {
          const doc = snapshot.docs[0];
          const data = doc.data();
          onUpdate({
            studentId: doc.id,
            block: Boolean(data.block),
            blockReason: data.blockReason || '',
            pendingUnblockRequest: data.pendingUnblockRequest || null,
          });
        }
      },
      (err) => {
        console.error('Error subscribing to student unblock request:', err);
        if (onError) onError(err);
      }
    );
}
