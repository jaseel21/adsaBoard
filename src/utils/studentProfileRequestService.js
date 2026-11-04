import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

/**
 * ADSA Omnichannel Student Profile, Identity & Change Request Service
 * Handles phone & email binding, global uniqueness validation,
 * profile change requests (Phone, Email, Name) with Central Committee moderation,
 * photo deletion, and immutable audit trails.
 */

export const PROFILE_REQUEST_TYPES = {
  PHONE: 'phone',
  EMAIL: 'email',
  NAME: 'name',
};

export const REASON_OPTIONS = {
  phone: [
    { id: 'sim_lost', labelEn: 'Lost SIM card / Changed personal number', labelMl: 'സിം കാർഡ് നഷ്ടപ്പെട്ടു / പുതിയ നമ്പർ എടുത്തു' },
    { id: 'typo', labelEn: 'Typo / Number registered incorrectly', labelMl: 'നമ്പർ രേഖപ്പെടുത്തിയതിൽ തെറ്റ് പറ്റി' },
    { id: 'guardian', labelEn: 'Switched to personal / guardian number', labelMl: 'രക്ഷിതാവിന്റെ / സ്വന്തം നമ്പറിലേക്ക് മാറ്റി' },
    { id: 'carrier', labelEn: 'Ported to new carrier / coverage issue', labelMl: 'കവറേജ് പ്രശ്നം / പുതിയ നെറ്റ്‌വർക്കിലേക്ക് മാറി' },
    { id: 'other', labelEn: 'Other official reason', labelMl: 'മറ്റ് കാരണങ്ങൾ' },
  ],
  email: [
    { id: 'inaccessible', labelEn: 'Previous email inaccessible / forgotten password', labelMl: 'പഴയ ഇമെയിൽ തുറക്കാൻ സാധിക്കുന്നില്ല' },
    { id: 'typo', labelEn: 'Typo in previous email address', labelMl: 'ഇമെയിൽ വിലാസത്തിൽ തെറ്റ് സംഭവിച്ചു' },
    { id: 'personal', labelEn: 'Switched to official personal email', labelMl: 'പുതിയ വ്യക്തിഗത ഇമെയിലിലേക്ക് മാറ്റി' },
    { id: 'other', labelEn: 'Other official reason', labelMl: 'മറ്റ് കാരണങ്ങൾ' },
  ],
  name: [
    { id: 'spelling', labelEn: 'Spelling correction in English / Malayalam', labelMl: 'പേരിലെ അക്ഷരത്തെറ്റ് തിരുത്താൻ' },
    { id: 'certificate', labelEn: 'Match official SSLC / Aadhaar / Madrassa certificate', labelMl: 'എസ്.എസ്.എൽ.സി / ആധാർ സർട്ടിഫിക്കറ്റ് പ്രകാരം മാറ്റാൻ' },
    { id: 'initials', labelEn: 'Add initials / house name / family name', labelMl: 'ഇനീഷ്യൽ / വീട്ടുപേര് ചേർക്കാൻ' },
    { id: 'other', labelEn: 'Other official reason', labelMl: 'മറ്റ് കാരണങ്ങൾ' },
  ],
};

/**
 * Normalize phone number:
 * - Strips all non-digit characters
 * - Strips leading '91' if 12 digits
 * - Strips leading '0' if 11 digits
 * - Returns clean 10 digits or empty string
 */
export function normalizePhone(raw) {
  if (!raw) return '';
  let digits = String(raw).replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

/**
 * Format 10-digit phone for human display:
 * "+91 98471 23456"
 */
export function formatPhoneDisplay(raw) {
  const norm = normalizePhone(raw);
  if (norm.length === 10) {
    return `+91 ${norm.slice(0, 5)} ${norm.slice(5)}`;
  }
  return raw || '';
}

/**
 * Normalize email: lowercase, trimmed
 */
export function normalizeEmail(raw) {
  if (!raw) return '';
  return String(raw).trim().toLowerCase();
}

/**
 * Validate phone number format (Standard 10-digit Indian Mobile)
 */
export function validatePhoneFormat(raw) {
  const norm = normalizePhone(raw);
  if (!norm) {
    return { isValid: false, error: 'Please enter a mobile phone number.' };
  }
  if (norm.length !== 10) {
    return { isValid: false, error: 'Mobile number must be exactly 10 digits.' };
  }
  if (!/^[6-9]\d{9}$/.test(norm)) {
    return { isValid: false, error: 'Mobile number must start with 6, 7, 8, or 9.' };
  }
  return { isValid: true, error: '', normalized: norm };
}

/**
 * Validate email address format
 */
export function validateEmailFormat(raw) {
  const norm = normalizeEmail(raw);
  if (!norm) {
    return { isValid: false, error: 'Please enter an email address.' };
  }
  // Standard RFC 5322 regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  if (!emailRegex.test(norm)) {
    return { isValid: false, error: 'Please enter a valid email address (e.g. name@domain.com).' };
  }
  return { isValid: true, error: '', normalized: norm };
}

/**
 * Validate Name format (English and Malayalam)
 */
export function validateNameFormat(nameEn, nameMl) {
  const cleanEn = (nameEn || '').trim();
  const cleanMl = (nameMl || '').trim();

  if (!cleanEn) {
    return { isValid: false, error: 'English student name is required.' };
  }
  if (cleanEn.length < 2) {
    return { isValid: false, error: 'English name must be at least 2 characters.' };
  }
  if (cleanMl && cleanMl.length < 2) {
    return { isValid: false, error: 'Malayalam name must be at least 2 characters if provided.' };
  }
  return { isValid: true, error: '', nameEn: cleanEn, nameMl: cleanMl };
}

/**
 * Global Uniqueness Check across all student accounts in Firestore
 * Checks phone, email, username, or tokenNo against existing records.
 */
export async function checkIdentifierUniqueness({
  phone = null,
  email = null,
  username = null,
  tokenNo = null,
  excludeStudentId = null,
}) {
  const db = firebase.firestore();
  const studentsRef = db.collection('students');

  // 1. Phone uniqueness check
  if (phone) {
    const norm = normalizePhone(phone);
    if (norm) {
      const display = formatPhoneDisplay(norm);
      const withPlus = `+91${norm}`;

      const [pExact, pNorm, pDisplay, pPlus] = await Promise.all([
        studentsRef.where('phone', '==', phone).limit(2).get(),
        studentsRef.where('phone', '==', norm).limit(2).get(),
        studentsRef.where('phone', '==', display).limit(2).get(),
        studentsRef.where('phone', '==', withPlus).limit(2).get(),
      ]);

      const allDocs = [...pExact.docs, ...pNorm.docs, ...pDisplay.docs, ...pPlus.docs];
      const conflict = allDocs.find((d) => d.id !== excludeStudentId);
      if (conflict) {
        return {
          isUnique: false,
          field: 'phone',
          message: 'This mobile number is already registered to another student account.',
          messageMl: 'ഈ മൊബൈൽ നമ്പർ മറ്റൊരു വിദ്യാർത്ഥി അക്കൗണ്ടിൽ ഇതിനകം രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്.',
        };
      }
    }
  }

  // 2. Email uniqueness check
  if (email) {
    const normEmail = normalizeEmail(email);
    if (normEmail) {
      const eSnap = await studentsRef.where('email', '==', normEmail).limit(2).get();
      const conflict = eSnap.docs.find((d) => d.id !== excludeStudentId);
      if (conflict) {
        return {
          isUnique: false,
          field: 'email',
          message: 'This email address is already registered to another student account.',
          messageMl: 'ഈ ഇമെയിൽ വിലാസം മറ്റൊരു വിദ്യാർത്ഥി അക്കൗണ്ടിൽ ഇതിനകം രജിസ്റ്റർ ചെയ്തിട്ടുണ്ട്.',
        };
      }
    }
  }

  // 3. Username uniqueness check
  if (username) {
    const cleanUname = username.trim().toLowerCase().replace(/^@/, '');
    if (cleanUname) {
      const [uSnap, unameSnap] = await Promise.all([
        studentsRef.where('username', '==', cleanUname).limit(2).get(),
        studentsRef.where('uname', '==', cleanUname).limit(2).get(),
      ]);
      const allDocs = [...uSnap.docs, ...unameSnap.docs];
      const conflict = allDocs.find((d) => d.id !== excludeStudentId);
      if (conflict) {
        return {
          isUnique: false,
          field: 'username',
          message: `Username '@${cleanUname}' is already taken by another student.`,
          messageMl: `@${cleanUname} എന്ന യൂസർനെയിം മറ്റൊരു വിദ്യാർത്ഥി ഉപയോഗിക്കുന്നുണ്ട്.`,
        };
      }
    }
  }

  // 4. Token number uniqueness check
  if (tokenNo !== null && tokenNo !== undefined) {
    const num = Number(tokenNo);
    if (!isNaN(num) && num > 0) {
      const tSnap = await studentsRef.where('tokenNo', '==', num).limit(2).get();
      const conflict = tSnap.docs.find((d) => d.id !== excludeStudentId);
      if (conflict) {
        return {
          isUnique: false,
          field: 'tokenNo',
          message: `Token #${num} already exists.`,
          messageMl: `ടോക്കൺ #${num} നിലവിലുണ്ട്.`,
        };
      }
    }
  }

  return { isUnique: true };
}

/**
 * Direct Contact Addition for Unlinked Phone / Email
 * Can only be called when field is currently empty.
 */
export async function addStudentContact({
  studentId,
  tokenNo,
  studentName = '',
  type, // 'phone' | 'email'
  value,
}) {
  if (!studentId) {
    throw new Error('Student document ID is required.');
  }

  const db = firebase.firestore();
  const studentRef = db.collection('students').doc(studentId);
  const nowIso = new Date().toISOString();

  if (type === 'phone') {
    const validation = validatePhoneFormat(value);
    if (!validation.isValid) throw new Error(validation.error);

    const uniqueness = await checkIdentifierUniqueness({
      phone: validation.normalized,
      excludeStudentId: studentId,
    });
    if (!uniqueness.isUnique) throw new Error(uniqueness.message);

    const displayPhone = formatPhoneDisplay(validation.normalized);
    await studentRef.update({
      phone: displayPhone,
      phoneNormalized: validation.normalized,
      phoneVerifiedAt: nowIso,
      lastUpdatedBy: `student_${tokenNo}`,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await logAuditEvent({
      category: AUDIT_CATEGORIES.SECURITY,
      action: 'STUDENT_BIND_PHONE',
      severity: AUDIT_SEVERITIES.NOTICE,
      actor: {
        uid: `student_${tokenNo}`,
        displayName: studentName || `Student #${tokenNo}`,
        role: 'student',
      },
      target: {
        type: 'student',
        id: studentId,
        label: `Token #${tokenNo}`,
        tokenNo: Number(tokenNo),
      },
      changes: {
        diffSummary: `Bound new mobile number for Token #${tokenNo}: ${displayPhone}`,
        fieldsChanged: ['phone', 'phoneNormalized', 'phoneVerifiedAt'],
      },
    });

    return { success: true, value: displayPhone, normalized: validation.normalized };
  }

  if (type === 'email') {
    const validation = validateEmailFormat(value);
    if (!validation.isValid) throw new Error(validation.error);

    const uniqueness = await checkIdentifierUniqueness({
      email: validation.normalized,
      excludeStudentId: studentId,
    });
    if (!uniqueness.isUnique) throw new Error(uniqueness.message);

    await studentRef.update({
      email: validation.normalized,
      emailVerifiedAt: nowIso,
      lastUpdatedBy: `student_${tokenNo}`,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });

    await logAuditEvent({
      category: AUDIT_CATEGORIES.SECURITY,
      action: 'STUDENT_BIND_EMAIL',
      severity: AUDIT_SEVERITIES.NOTICE,
      actor: {
        uid: `student_${tokenNo}`,
        displayName: studentName || `Student #${tokenNo}`,
        role: 'student',
      },
      target: {
        type: 'student',
        id: studentId,
        label: `Token #${tokenNo}`,
        tokenNo: Number(tokenNo),
      },
      changes: {
        diffSummary: `Bound new email address for Token #${tokenNo}: ${validation.normalized}`,
        fieldsChanged: ['email', 'emailVerifiedAt'],
      },
    });

    return { success: true, value: validation.normalized };
  }

  throw new Error(`Unsupported contact type: ${type}`);
}

/**
 * Submit Profile Change Request (Phone, Email, or Name)
 * Queues request for Central Committee review and sets pending status on student doc.
 */
export async function submitProfileChangeRequest({
  student,
  type, // 'phone' | 'email' | 'name'
  requestedValue,
  reason = 'other',
  notes = '',
}) {
  const db = firebase.firestore();
  const tokenNo = Number(student.tokenNo);
  const studentId = student.documentId || student.id;

  if (!tokenNo || !studentId) {
    throw new Error('Valid student token and record ID are required.');
  }

  let currentValue = null;
  let formattedRequested = null;
  let normalizedRequested = null;

  if (type === 'phone') {
    const validation = validatePhoneFormat(requestedValue);
    if (!validation.isValid) throw new Error(validation.error);

    const uniqueness = await checkIdentifierUniqueness({
      phone: validation.normalized,
      excludeStudentId: studentId,
    });
    if (!uniqueness.isUnique) throw new Error(uniqueness.message);

    currentValue = student.phone || 'None';
    formattedRequested = formatPhoneDisplay(validation.normalized);
    normalizedRequested = validation.normalized;
  } else if (type === 'email') {
    const validation = validateEmailFormat(requestedValue);
    if (!validation.isValid) throw new Error(validation.error);

    const uniqueness = await checkIdentifierUniqueness({
      email: validation.normalized,
      excludeStudentId: studentId,
    });
    if (!uniqueness.isUnique) throw new Error(uniqueness.message);

    currentValue = student.email || 'None';
    formattedRequested = validation.normalized;
    normalizedRequested = validation.normalized;
  } else if (type === 'name') {
    const validation = validateNameFormat(requestedValue.nameEn, requestedValue.nameMl);
    if (!validation.isValid) throw new Error(validation.error);

    currentValue = {
      nameEn: student.nameEn || student.name || '',
      nameMl: student.nameMl || '',
    };
    formattedRequested = {
      nameEn: validation.nameEn,
      nameMl: validation.nameMl,
    };
    normalizedRequested = validation.nameEn;
  } else {
    throw new Error(`Invalid request type: ${type}`);
  }

  const nowIso = new Date().toISOString();
  const requestPayload = {
    studentId,
    tokenNo,
    studentName: student.nameEn || student.name || `Token #${tokenNo}`,
    batch: student.batch || 'General',
    type,
    currentValue,
    requestedValue: formattedRequested,
    normalizedValue: normalizedRequested,
    reason: (reason || 'other').trim(),
    notes: (notes || '').trim(),
    status: 'pending',
    rejectionReason: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  const batch = db.batch();
  const requestRef = db.collection('contact_requests').doc();

  // 1. Write request to contact_requests collection
  batch.set(requestRef, requestPayload);

  // 2. Mirror pending state on student record for instant UI reactivity
  const mirrorKey =
    type === 'phone'
      ? 'pendingPhoneRequest'
      : type === 'email'
      ? 'pendingEmailRequest'
      : 'pendingNameRequest';

  const studentRef = db.collection('students').doc(studentId);
  batch.update(studentRef, {
    [mirrorKey]: {
      requestId: requestRef.id,
      type,
      currentValue,
      requestedValue: formattedRequested,
      reason,
      notes,
      requestedAt: nowIso,
      status: 'pending',
    },
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  await logAuditEvent({
    category: AUDIT_CATEGORIES.STUDENTS,
    action: 'CREATE_PROFILE_CHANGE_REQUEST',
    severity: AUDIT_SEVERITIES.INFO,
    actor: {
      uid: `student_${tokenNo}`,
      displayName: student.name || `Student #${tokenNo}`,
      role: 'student',
    },
    target: {
      type: 'student',
      id: studentId,
      label: `Token #${tokenNo}`,
      tokenNo,
    },
    changes: {
      diffSummary: `Submitted ${type} change request for Token #${tokenNo}`,
      type,
      requestedValue: formattedRequested,
      reason,
    },
  });

  return { requestId: requestRef.id, status: 'pending' };
}

/**
 * Cancel a pending profile change request by the student
 */
export async function cancelProfileChangeRequest({ requestId, studentId, type }) {
  const db = firebase.firestore();
  const batch = db.batch();

  if (requestId) {
    const reqRef = db.collection('contact_requests').doc(requestId);
    batch.update(reqRef, {
      status: 'cancelled',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  const mirrorKey =
    type === 'phone'
      ? 'pendingPhoneRequest'
      : type === 'email'
      ? 'pendingEmailRequest'
      : 'pendingNameRequest';

  const studentRef = db.collection('students').doc(studentId);
  batch.update(studentRef, {
    [mirrorKey]: firebase.firestore.FieldValue.delete(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();
  return { success: true };
}

/**
 * Central Committee / Admin approves a pending profile change request
 */
export async function approveProfileChangeRequest({
  requestId,
  studentId,
  type,
  requestedValue,
  tokenNo,
  studentName = '',
  adminEmail = 'admin',
}) {
  const db = firebase.firestore();
  const nowIso = new Date().toISOString();

  // Pre-commit safety uniqueness check for phone / email
  if (type === 'phone') {
    const uniqueness = await checkIdentifierUniqueness({
      phone: requestedValue,
      excludeStudentId: studentId,
    });
    if (!uniqueness.isUnique) throw new Error(uniqueness.message);
  } else if (type === 'email') {
    const uniqueness = await checkIdentifierUniqueness({
      email: requestedValue,
      excludeStudentId: studentId,
    });
    if (!uniqueness.isUnique) throw new Error(uniqueness.message);
  }

  const batch = db.batch();

  // 1. Mark request approved
  if (requestId) {
    const reqRef = db.collection('contact_requests').doc(requestId);
    batch.update(reqRef, {
      status: 'approved',
      reviewedBy: adminEmail,
      reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 2. Commit update to student document
  const studentRef = db.collection('students').doc(studentId);
  const studentUpdates = {
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    lastUpdatedBy: adminEmail,
  };

  if (type === 'phone') {
    studentUpdates.phone = formatPhoneDisplay(requestedValue);
    studentUpdates.phoneNormalized = normalizePhone(requestedValue);
    studentUpdates.phoneVerifiedAt = nowIso;
    studentUpdates.pendingPhoneRequest = firebase.firestore.FieldValue.delete();
  } else if (type === 'email') {
    studentUpdates.email = normalizeEmail(requestedValue);
    studentUpdates.emailVerifiedAt = nowIso;
    studentUpdates.pendingEmailRequest = firebase.firestore.FieldValue.delete();
  } else if (type === 'name') {
    studentUpdates.nameEn = requestedValue.nameEn;
    studentUpdates.name = requestedValue.nameEn;
    if (requestedValue.nameMl !== undefined) {
      studentUpdates.nameMl = requestedValue.nameMl;
    }
    studentUpdates.nameUpdatedAt = nowIso;
    studentUpdates.pendingNameRequest = firebase.firestore.FieldValue.delete();
  }

  batch.update(studentRef, studentUpdates);
  await batch.commit();

  // 3. Log Audit Trail
  await logAuditEvent({
    category: AUDIT_CATEGORIES.STUDENTS,
    action: 'APPROVE_PROFILE_CHANGE',
    severity: AUDIT_SEVERITIES.NOTICE,
    target: {
      type: 'student',
      id: studentId,
      label: `Token #${tokenNo} (${studentName || 'Student'})`,
      tokenNo: Number(tokenNo),
    },
    changes: {
      diffSummary: `Approved ${type} change request for Token #${tokenNo}`,
      type,
      requestedValue,
      approvedBy: adminEmail,
    },
    role: 'central_committee',
  });

  return { success: true };
}

/**
 * Central Committee / Admin rejects a pending profile change request
 */
export async function rejectProfileChangeRequest({
  requestId,
  studentId,
  type,
  reason = 'Does not meet institutional verification guidelines',
  tokenNo,
  studentName = '',
  adminEmail = 'admin',
}) {
  const db = firebase.firestore();
  const batch = db.batch();
  const nowIso = new Date().toISOString();

  // 1. Mark request rejected
  if (requestId) {
    const reqRef = db.collection('contact_requests').doc(requestId);
    batch.update(reqRef, {
      status: 'rejected',
      rejectionReason: reason,
      reviewedBy: adminEmail,
      reviewedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  // 2. Clear pending state or mark rejected on student record
  const mirrorKey =
    type === 'phone'
      ? 'pendingPhoneRequest'
      : type === 'email'
      ? 'pendingEmailRequest'
      : 'pendingNameRequest';

  const studentRef = db.collection('students').doc(studentId);
  batch.update(studentRef, {
    [mirrorKey]: firebase.firestore.FieldValue.delete(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  await logAuditEvent({
    category: AUDIT_CATEGORIES.STUDENTS,
    action: 'REJECT_PROFILE_CHANGE',
    severity: AUDIT_SEVERITIES.WARNING,
    target: {
      type: 'student',
      id: studentId,
      label: `Token #${tokenNo} (${studentName || 'Student'})`,
      tokenNo: Number(tokenNo),
    },
    changes: {
      diffSummary: `Rejected ${type} change request for Token #${tokenNo}: ${reason}`,
      type,
      reason,
      rejectedBy: adminEmail,
    },
    role: 'central_committee',
  });

  return { success: true };
}

/**
 * Student removes their approved profile photo (CRUD - Delete)
 * Reverts avatar back to the standard Islamic calligraphy/token keycap.
 */
export async function studentRemoveApprovedPhoto({ studentId, tokenNo, studentName = '' }) {
  if (!studentId) throw new Error('Student document ID is required.');

  const db = firebase.firestore();
  const studentRef = db.collection('students').doc(studentId);

  await studentRef.update({
    photoURL: firebase.firestore.FieldValue.delete(),
    photoApprovedAt: firebase.firestore.FieldValue.delete(),
    pendingPhotoRequest: firebase.firestore.FieldValue.delete(),
    lastUpdatedBy: `student_${tokenNo}`,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  await logAuditEvent({
    category: AUDIT_CATEGORIES.STUDENTS,
    action: 'STUDENT_REMOVE_PHOTO',
    severity: AUDIT_SEVERITIES.INFO,
    actor: {
      uid: `student_${tokenNo}`,
      displayName: studentName || `Student #${tokenNo}`,
      role: 'student',
    },
    target: {
      type: 'student',
      id: studentId,
      label: `Token #${tokenNo}`,
      tokenNo: Number(tokenNo),
    },
    changes: {
      diffSummary: `Student removed profile photo for Token #${tokenNo}`,
      fieldsChanged: ['photoURL', 'photoApprovedAt'],
    },
  });

  return { success: true };
}

/**
 * Real-time listener for pending contact and profile requests for Central Committee
 */
export function subscribePendingProfileRequests(callback) {
  return firebase
    .firestore()
    .collection('contact_requests')
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
        console.warn('Error subscribing to pending contact requests:', err);
        callback([]);
      }
    );
}
