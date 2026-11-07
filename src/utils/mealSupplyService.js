import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';
import { getEffectiveStudentMealStatus } from './studentExceptionService';
import { safeLocalStorage } from './storage';

/**
 * ADSA T-Board Meal Supply & Live Serving Sentinel Service
 * Provides real-time synchronization across multiple dining counters,
 * sub-second token verification, duplicate serving protection,
 * grace plate logging, and ration depletion tracking.
 */

const LOCAL_STORAGE_PREFIX = 'adsa_serving_ledger_';

/**
 * Standard Firestore document ID for a meal service date
 * @param {'breakfast' | 'lunch'} meal
 * @param {string} targetDateIST - 'YYYY-MM-DD'
 */
export function getMealServiceDocId(meal = 'lunch', targetDateIST) {
  const cleanMeal = String(meal || 'lunch').toLowerCase();
  const cleanDate = targetDateIST || new Date().toISOString().split('T')[0];
  return `${cleanMeal}_${cleanDate}`;
}

/**
 * Load offline cached serving map from localStorage
 */
function getCachedServedMap(docId) {
  if (typeof window === 'undefined') return {};
  return safeLocalStorage.getJSON(`${LOCAL_STORAGE_PREFIX}${docId}`, {});
}

/**
 * Save offline cached serving map to localStorage
 */
function setCachedServedMap(docId, map) {
  if (typeof window === 'undefined') return;
  safeLocalStorage.setJSON(`${LOCAL_STORAGE_PREFIX}${docId}`, map);
}

/**
 * Real-time subscription to meal serving ledger
 * Listens to both summary document and served_records subcollection
 *
 * @param {'breakfast' | 'lunch'} meal
 * @param {string} targetDateIST
 * @param {Function} onUpdate - callback({ summary, servedMap, unservedMap, loading, error })
 * @returns {Function} unsubscribe
 */
export function subscribeToMealSupplyLedger(meal, targetDateIST, onUpdate) {
  if (!meal || !targetDateIST) {
    onUpdate({ summary: null, servedMap: new Map(), loading: false });
    return () => {};
  }

  const docId = getMealServiceDocId(meal, targetDateIST);
  const db = firebase.firestore();
  const summaryRef = db.collection('meal_servings').doc(docId);
  const recordsRef = summaryRef.collection('served_records');

  let currentSummary = null;
  let currentServedMap = new Map();
  let isInitialLoad = true;

  // Hydrate immediately from local cache for zero-latency initial paint
  const cached = getCachedServedMap(docId);
  if (cached && Object.keys(cached).length > 0) {
    const hydMap = new Map();
    Object.entries(cached).forEach(([k, v]) => hydMap.set(Number(k), v));
    currentServedMap = hydMap;
    onUpdate({
      summary: { id: docId, meal, targetDateIST, totalServed: hydMap.size, isFromCache: true },
      servedMap: hydMap,
      loading: false,
    });
  }

  // 1. Subscribe to summary doc
  const unsubSummary = summaryRef.onSnapshot(
    (snap) => {
      if (snap.exists) {
        currentSummary = { id: snap.id, ...snap.data() };
      } else {
        currentSummary = {
          id: docId,
          meal,
          targetDateIST,
          totalServed: 0,
          gracePlatesCount: 0,
          unauthorizedInterceptionsCount: 0,
          status: 'idle',
        };
      }
      onUpdate({
        summary: currentSummary,
        servedMap: currentServedMap,
        loading: false,
      });
    },
    (err) => {
      console.warn('Meal supply summary listener error:', err);
    }
  );

  // 2. Subscribe to individual served_records subcollection
  const unsubRecords = recordsRef.onSnapshot(
    (snap) => {
      const nextMap = new Map();
      const plainObj = {};

      snap.forEach((doc) => {
        const data = doc.data();
        const tokenNo = Number(doc.id || data.tokenNo);
        const record = {
          id: doc.id,
          tokenNo,
          ...data,
        };
        nextMap.set(tokenNo, record);
        plainObj[tokenNo] = {
          tokenNo,
          servedAtIso: data.servedAtIso || new Date().toISOString(),
          servedByName: data.servedByName || 'Staff',
          counterId: data.counterId || 'Counter 1',
          isGracePlate: Boolean(data.isGracePlate),
        };
      });

      currentServedMap = nextMap;
      setCachedServedMap(docId, plainObj);

      onUpdate({
        summary: currentSummary || { id: docId, meal, targetDateIST, totalServed: nextMap.size },
        servedMap: nextMap,
        loading: false,
      });
      isInitialLoad = false;
    },
    (err) => {
      console.warn('Meal supply records listener error:', err);
      onUpdate({
        summary: currentSummary,
        servedMap: currentServedMap,
        loading: false,
        error: err,
      });
    }
  );

  return () => {
    unsubSummary();
    unsubRecords();
  };
}

/**
 * Mark a student token as SERVED in real-time
 *
 * @param {Object} params
 * @param {string} params.meal - 'breakfast' | 'lunch'
 * @param {string} params.targetDateIST - 'YYYY-MM-DD'
 * @param {number} params.tokenNo - Student token number
 * @param {Object} [params.student] - Student record
 * @param {Object} [params.serverUser] - Current logged-in staff user
 * @param {string} [params.serverRole] - User role
 * @param {string} [params.counterId] - Counter / station name ('Counter 1', 'East Row')
 * @param {string} [params.method] - 'numpad' | 'matrix' | 'scanner' | 'voice' | 'table_row'
 * @param {string} [params.dishNotes] - Optional custom serving note
 */
export async function markTokenServed({
  meal,
  targetDateIST,
  tokenNo,
  student,
  serverUser,
  serverRole,
  counterId = 'Counter 1',
  method = 'numpad',
  dishNotes = null,
}) {
  const cleanTokenNo = Number(tokenNo);
  if (!cleanTokenNo) throw new Error('Valid token number is required');

  const docId = getMealServiceDocId(meal, targetDateIST);
  const db = firebase.firestore();
  const summaryRef = db.collection('meal_servings').doc(docId);
  const recordRef = summaryRef.collection('served_records').doc(String(cleanTokenNo));

  const serverName =
    serverUser?.displayName ||
    serverUser?.email?.split('@')[0] ||
    'Canteen Staff';

  const studentName =
    student?.uname ||
    student?.name ||
    student?.studentName ||
    `Token #${cleanTokenNo}`;

  const servingData = {
    tokenNo: cleanTokenNo,
    studentId: student?.id || student?.documentId || null,
    studentName,
    batch: student?.batch || '',
    servedAt: firebase.firestore.FieldValue.serverTimestamp(),
    servedAtIso: new Date().toISOString(),
    servedByUid: serverUser?.uid || null,
    servedByName: serverName,
    servedByRole: serverRole || 'staff',
    counterId,
    method,
    dietarySnapshot: student?.obj2 || {},
    isGracePlate: false,
    dishNotes: dishNotes || null,
  };

  const batch = db.batch();

  // 1. Write the serving record
  batch.set(recordRef, servingData);

  // 2. Atomically upsert top-level summary metrics
  batch.set(
    summaryRef,
    {
      meal,
      targetDateIST,
      lastServedToken: cleanTokenNo,
      lastServedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastServedAtIso: new Date().toISOString(),
      lastServedBy: serverName,
      lastCounterId: counterId,
      totalServed: firebase.firestore.FieldValue.increment(1),
      status: 'active',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();

  // 3. Log structured audit event
  logAuditEvent({
    category: AUDIT_CATEGORIES.CANTEEN,
    action: 'TOKEN_SERVED',
    severity: AUDIT_SEVERITIES.INFO,
    user: serverUser,
    role: serverRole,
    details: `Token #${cleanTokenNo} (${studentName}) verified & marked served for ${meal} at ${counterId} via ${method}.`,
    metadata: {
      meal,
      targetDateIST,
      tokenNo: cleanTokenNo,
      studentId: student?.id,
      counterId,
      method,
    },
  }).catch((err) => console.warn('Audit log error on serve:', err));

  return { success: true, tokenNo: cleanTokenNo, servingData };
}

/**
 * Unmark / Undo a served token (in case of server mis-tap)
 */
export async function unmarkTokenServed({
  meal,
  targetDateIST,
  tokenNo,
  student,
  serverUser,
  serverRole,
  reason = 'Server operator reversal / correction',
}) {
  const cleanTokenNo = Number(tokenNo);
  if (!cleanTokenNo) throw new Error('Valid token number is required');

  const docId = getMealServiceDocId(meal, targetDateIST);
  const db = firebase.firestore();
  const summaryRef = db.collection('meal_servings').doc(docId);
  const recordRef = summaryRef.collection('served_records').doc(String(cleanTokenNo));

  const serverName =
    serverUser?.displayName ||
    serverUser?.email?.split('@')[0] ||
    'Canteen Staff';

  const batch = db.batch();
  batch.delete(recordRef);
  batch.set(
    summaryRef,
    {
      totalServed: firebase.firestore.FieldValue.increment(-1),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();

  logAuditEvent({
    category: AUDIT_CATEGORIES.CANTEEN,
    action: 'TOKEN_UNSERVED',
    severity: AUDIT_SEVERITIES.NOTICE,
    user: serverUser,
    role: serverRole,
    details: `Token #${cleanTokenNo} was un-marked/reversed for ${meal} on ${targetDateIST}. Reason: ${reason}`,
    metadata: {
      meal,
      targetDateIST,
      tokenNo: cleanTokenNo,
      reason,
    },
  }).catch((err) => console.warn('Audit log error on unserve:', err));

  return { success: true, tokenNo: cleanTokenNo };
}

/**
 * Issue a Compassionate Grace Plate (കരുണ പ്ലേറ്റ്)
 * For students whose token is OFF, allowing them to eat with dignity
 * Dispatches an automated, friendly advisory notification (no penalty fee, no punitive block).
 */
export async function issueGracePlate({
  meal,
  targetDateIST,
  tokenNo,
  student,
  serverUser,
  serverRole,
  counterId = 'Counter 1',
  reasonNote = 'Forgot to turn on token / Courtesy meal',
}) {
  const cleanTokenNo = Number(tokenNo);
  if (!cleanTokenNo) throw new Error('Valid token number is required');

  const docId = getMealServiceDocId(meal, targetDateIST);
  const db = firebase.firestore();
  const summaryRef = db.collection('meal_servings').doc(docId);
  const recordRef = summaryRef.collection('served_records').doc(String(cleanTokenNo));

  const serverName =
    serverUser?.displayName ||
    serverUser?.email?.split('@')[0] ||
    'Canteen Staff';

  const studentName =
    student?.uname ||
    student?.name ||
    `Token #${cleanTokenNo}`;

  const servingData = {
    tokenNo: cleanTokenNo,
    studentId: student?.id || student?.documentId || null,
    studentName,
    batch: student?.batch || '',
    servedAt: firebase.firestore.FieldValue.serverTimestamp(),
    servedAtIso: new Date().toISOString(),
    servedByUid: serverUser?.uid || null,
    servedByName: serverName,
    servedByRole: serverRole || 'staff',
    counterId,
    method: 'grace_plate',
    dietarySnapshot: student?.obj2 || {},
    isGracePlate: true,
    graceReason: reasonNote,
  };

  const batch = db.batch();

  // 1. Write served record flagged as Grace Plate
  batch.set(recordRef, servingData);

  // 2. Increment totalServed & gracePlatesCount
  batch.set(
    summaryRef,
    {
      meal,
      targetDateIST,
      totalServed: firebase.firestore.FieldValue.increment(1),
      gracePlatesCount: firebase.firestore.FieldValue.increment(1),
      lastGraceToken: cleanTokenNo,
      lastServedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // 3. Dispatch a polite, friendly advisory notice to student
  const studentNoticeRef = db.collection('notifications').doc();
  const mealLabelEn = meal === 'breakfast' ? 'Breakfast' : 'Lunch';
  const mealLabelMl = meal === 'breakfast' ? 'പ്രാതൽ' : 'ഉച്ചഭക്ഷണം';

  const friendlyTitle = `Courtesy Meal Provided / ഭക്ഷണ അറിയിപ്പ് (${mealLabelEn})`;
  const friendlyBody =
    `Token #${cleanTokenNo} (${studentName}): A courtesy meal was provided for ${mealLabelEn} on ${targetDateIST} while your token was inactive. Please review and update your dining schedule on T-Board to ensure adequate kitchen preparations for upcoming meals.\n\n` +
    `ഇന്ന് (${targetDateIST}) ${mealLabelMl} ടോക്കൺ ഓഫായിരുന്നിട്ടും താങ്കൾക്ക് ഭക്ഷണം നൽകിയിട്ടുണ്ട്. അടുക്കളയിൽ കൃത്യമായ അളവിൽ ഭക്ഷണം പാചകം ചെയ്യാൻ ദയവായി ടോക്കൺ ബോർഡിൽ താങ്കളുടെ ഷെഡ്യൂൾ പരിശോധിക്കുക.`;

  batch.set(studentNoticeRef, {
    title: friendlyTitle,
    body: friendlyBody,
    type: 'courtesy_grace_meal',
    category: 'canteen_advisory',
    targetStudentId: student?.id || student?.documentId || null,
    targetTokenNo: cleanTokenNo,
    studentName,
    meal,
    targetDateIST,
    reason: reasonNote,
    issuedBy: serverName,
    status: 'active',
    isRead: false,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdAtIso: new Date().toISOString(),
  });

  await batch.commit();

  logAuditEvent({
    category: AUDIT_CATEGORIES.CANTEEN,
    action: 'GRACE_PLATE_ISSUED',
    severity: AUDIT_SEVERITIES.NOTICE,
    user: serverUser,
    role: serverRole,
    details: `Compassionate Grace Plate issued to Token #${cleanTokenNo} (${studentName}) for ${meal} at ${counterId}. Reason: ${reasonNote}`,
    metadata: {
      meal,
      targetDateIST,
      tokenNo: cleanTokenNo,
      reason: reasonNote,
    },
  }).catch((err) => console.warn('Audit log error on grace plate:', err));

  return { success: true, tokenNo: cleanTokenNo, servingData };
}

/**
 * Log an intercepted unauthorized dining attempt (prevented before food touched plate)
 */
export async function logUnauthorizedAttempt({
  meal,
  targetDateIST,
  tokenNo,
  student,
  serverUser,
  serverRole,
  counterId = 'Counter 1',
  attemptType = 'avoider_interception',
  notes = '',
}) {
  const cleanTokenNo = Number(tokenNo);
  if (!cleanTokenNo) return;

  const docId = getMealServiceDocId(meal, targetDateIST);
  const db = firebase.firestore();
  const summaryRef = db.collection('meal_servings').doc(docId);
  const attemptRef = summaryRef.collection('intercepted_attempts').doc();

  const serverName =
    serverUser?.displayName ||
    serverUser?.email?.split('@')[0] ||
    'Canteen Staff';

  const studentName =
    student?.uname ||
    student?.name ||
    `Token #${cleanTokenNo}`;

  const attemptData = {
    tokenNo: cleanTokenNo,
    studentId: student?.id || student?.documentId || null,
    studentName,
    batch: student?.batch || '',
    attemptedAt: firebase.firestore.FieldValue.serverTimestamp(),
    attemptedAtIso: new Date().toISOString(),
    preventedBy: serverName,
    preventedByRole: serverRole || 'staff',
    counterId,
    attemptType,
    notes,
  };

  const batch = db.batch();
  batch.set(attemptRef, attemptData);
  batch.set(
    summaryRef,
    {
      unauthorizedInterceptionsCount: firebase.firestore.FieldValue.increment(1),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();

  logAuditEvent({
    category: AUDIT_CATEGORIES.CANTEEN,
    action: 'UNAUTHORIZED_ATTEMPT_INTERCEPTED',
    severity: AUDIT_SEVERITIES.WARNING,
    user: serverUser,
    role: serverRole,
    details: `Unauthorized plate-taking intercepted for Token #${cleanTokenNo} (${studentName}) for ${meal} at ${counterId}. Food was prevented from being taken without active token.`,
    metadata: {
      meal,
      targetDateIST,
      tokenNo: cleanTokenNo,
      counterId,
      attemptType,
    },
  }).catch((err) => console.warn('Audit log error on attempt:', err));
}

/**
 * Compute high-precision dining telemetry and counts
 *
 * @param {Object} params
 * @param {Array} params.documents - All student documents
 * @param {Map} params.servedMap - Map of served token records
 * @param {'breakfast' | 'lunch'} params.meal
 * @param {string} params.targetDateIST
 * @param {string} params.effectiveDay
 * @returns {Object} Structured telemetry
 */
export function computeServingMetrics({
  documents = [],
  servedMap = new Map(),
  meal = 'lunch',
  targetDateIST,
  effectiveDay,
}) {
  const cleanMeal = String(meal || 'lunch').toLowerCase();

  const eligibleList = [];
  const avoiderList = [];
  const dietaryCounts = {
    allVeg: 0,
    fishAvoiders: 0,
    beefAvoiders: 0,
    chickenAvoiders: 0,
    muttonAvoiders: 0,
  };

  documents.forEach((doc) => {
    const isEligible = getEffectiveStudentMealStatus(doc, targetDateIST, effectiveDay, cleanMeal);
    if (isEligible) {
      eligibleList.push(doc);

      // Track dietary preferences for eligible diners
      const d = doc.obj2 || {};
      if (d.fish === false) dietaryCounts.fishAvoiders++;
      if (d.beef === false) dietaryCounts.beefAvoiders++;
      if (d.chicken === false) dietaryCounts.chickenAvoiders++;
      if (d.mutton === false) dietaryCounts.muttonAvoiders++;
    } else {
      avoiderList.push(doc);
    }
  });

  const totalRegistered = documents.length;
  const totalEligible = eligibleList.length;
  const totalAvoiders = avoiderList.length;
  const totalServed = servedMap.size;

  let eligibleServedCount = 0;
  let gracePlatesCount = 0;

  servedMap.forEach((record) => {
    if (record.isGracePlate) {
      gracePlatesCount++;
    } else {
      eligibleServedCount++;
    }
  });

  const remainingEligibleCount = Math.max(0, totalEligible - eligibleServedCount);
  const completionPercentage = totalEligible > 0 ? Math.min(100, Math.round((eligibleServedCount / totalEligible) * 100)) : 0;

  // Compute remaining unserved dietary breakdown
  const remainingDietaryCounts = { ...dietaryCounts };
  servedMap.forEach((rec) => {
    const d = rec.dietarySnapshot || {};
    if (d.fish === false && remainingDietaryCounts.fishAvoiders > 0) remainingDietaryCounts.fishAvoiders--;
    if (d.beef === false && remainingDietaryCounts.beefAvoiders > 0) remainingDietaryCounts.beefAvoiders--;
  });

  return {
    totalRegistered,
    totalEligible,
    totalAvoiders,
    totalServed,
    eligibleServedCount,
    remainingEligibleCount,
    gracePlatesCount,
    completionPercentage,
    dietaryCounts,
    remainingDietaryCounts,
    eligibleList,
    avoiderList,
  };
}
