import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';
import { getEffectiveStudentMealStatus } from './studentExceptionService';

/**
 * Manifest Print Service
 * Manages physical kitchen & dining hall print state tracking,
 * deterministic content fingerprinting, duplicate print cost guards,
 * and real-time kitchen desynchronization detection.
 */

export const MANIFEST_STATUS = {
  NEVER_PRINTED: 'NEVER_PRINTED',
  FRESH_IDENTICAL: 'FRESH_IDENTICAL',
  STALE_OUTDATED: 'STALE_OUTDATED',
};

/**
 * Constructs standard Firestore document ID for a meal service date
 * @param {'breakfast' | 'lunch'} meal
 * @param {string} targetDateIST - 'YYYY-MM-DD'
 */
export function getManifestPrintDocId(meal = 'lunch', targetDateIST) {
  const cleanMeal = String(meal).toLowerCase();
  return `${cleanMeal}_${targetDateIST}`;
}

/**
 * Computes deterministic canonical fingerprint and structured summary for a manifest
 */
export function computeManifestFingerprint({
  documents = [],
  targetDateIST,
  effectiveDay,
  meal = 'lunch',
}) {
  const mealKey = String(meal).toLowerCase();
  const sortedDocs = [...documents].sort(
    (a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0)
  );

  const activeTokens = [];
  const canceledTokens = [];
  const dietaryAvoiders = {}; // { [prefId]: [tokenNos] }
  const uniqueDietaryAvoidersSet = new Set();

  sortedDocs.forEach((doc) => {
    const tokenNo = Number(doc.tokenNo);
    if (!tokenNo) return;

    const isActive = getEffectiveStudentMealStatus(doc, targetDateIST, effectiveDay, mealKey);

    if (isActive) {
      activeTokens.push(tokenNo);

      // Check dietary avoidances for active diners
      const obj2 = doc.obj2 || {};
      Object.entries(obj2).forEach(([catKey, isAllowed]) => {
        if (isAllowed === false) {
          if (!dietaryAvoiders[catKey]) {
            dietaryAvoiders[catKey] = [];
          }
          dietaryAvoiders[catKey].push(tokenNo);
          uniqueDietaryAvoidersSet.add(tokenNo);
        }
      });
    } else {
      canceledTokens.push(tokenNo);
    }
  });

  // Ensure deterministic sorted order for dietary avoiders
  const sortedDietaryKeys = Object.keys(dietaryAvoiders).sort();
  const dietaryBreakdown = {};
  const serializedDietaryParts = [];

  sortedDietaryKeys.forEach((k) => {
    dietaryAvoiders[k].sort((a, b) => a - b);
    dietaryBreakdown[k] = dietaryAvoiders[k].length;
    serializedDietaryParts.push(`${k}:${dietaryAvoiders[k].join(',')}`);
  });

  // Deterministic canonical string
  const fingerprint = [
    `total:${sortedDocs.length}`,
    `active:${activeTokens.length}`,
    `canc:${canceledTokens.join(',')}`,
    `diet:${serializedDietaryParts.join(';')}`,
  ].join('|');

  return {
    fingerprint,
    summary: {
      totalStudents: sortedDocs.length,
      activeCount: activeTokens.length,
      canceledCount: canceledTokens.length,
      canceledTokens,
      dietaryAvoidersCount: uniqueDietaryAvoidersSet.size,
      dietaryBreakdown,
      dietaryAvoiders,
    },
  };
}

/**
 * Calculates human-readable differences between current live state and printed state
 */
export function calculateManifestDelta(currentSummary, printedSummary) {
  if (!currentSummary || !printedSummary) {
    return {
      hasChanges: false,
      tokensTurnedOff: [],
      tokensTurnedOn: [],
      dietaryChanges: [],
      summaryText: 'No previous print data available',
      totalChangesCount: 0,
    };
  }

  const prevCanceledSet = new Set(printedSummary.canceledTokens || []);
  const currCanceledSet = new Set(currentSummary.canceledTokens || []);

  // Tokens turned OFF after print (in current canceled, but wasn't in printed canceled)
  const tokensTurnedOff = (currentSummary.canceledTokens || []).filter(
    (t) => !prevCanceledSet.has(t)
  );

  // Tokens turned ON after print (was in printed canceled, but not in current canceled)
  const tokensTurnedOn = (printedSummary.canceledTokens || []).filter(
    (t) => !currCanceledSet.has(t)
  );

  // Dietary differences
  const prevDietary = printedSummary.dietaryAvoiders || {};
  const currDietary = currentSummary.dietaryAvoiders || {};
  const allDietaryKeys = Array.from(
    new Set([...Object.keys(prevDietary), ...Object.keys(currDietary)])
  );

  const dietaryChanges = [];

  allDietaryKeys.forEach((catKey) => {
    const prevList = new Set(prevDietary[catKey] || []);
    const currList = new Set(currDietary[catKey] || []);

    const newlyAvoiding = (currDietary[catKey] || []).filter((t) => !prevList.has(t));
    const noLongerAvoiding = (prevDietary[catKey] || []).filter((t) => !currList.has(t));

    if (newlyAvoiding.length > 0) {
      dietaryChanges.push({
        category: catKey,
        type: 'added_avoiders',
        tokens: newlyAvoiding,
        label: `Added to ${catKey} avoiders: #${newlyAvoiding.join(', #')}`,
      });
    }

    if (noLongerAvoiding.length > 0) {
      dietaryChanges.push({
        category: catKey,
        type: 'removed_avoiders',
        tokens: noLongerAvoiding,
        label: `Removed from ${catKey} avoiders: #${noLongerAvoiding.join(', #')}`,
      });
    }
  });

  const totalChangesCount =
    tokensTurnedOff.length + tokensTurnedOn.length + dietaryChanges.reduce((acc, c) => acc + c.tokens.length, 0);

  const textParts = [];
  if (tokensTurnedOff.length > 0) {
    textParts.push(`${tokensTurnedOff.length} meal(s) canceled (#${tokensTurnedOff.join(', #')})`);
  }
  if (tokensTurnedOn.length > 0) {
    textParts.push(`${tokensTurnedOn.length} meal(s) reactivated (#${tokensTurnedOn.join(', #')})`);
  }
  if (dietaryChanges.length > 0) {
    textParts.push(`${dietaryChanges.length} dietary preference change(s)`);
  }

  return {
    hasChanges: totalChangesCount > 0,
    tokensTurnedOff,
    tokensTurnedOn,
    dietaryChanges,
    totalChangesCount,
    summaryText: textParts.length > 0 ? textParts.join('; ') : 'No changes detected',
  };
}

/**
 * Evaluates whether live manifest is identical or stale compared to last print
 */
export function evaluateManifestFreshness(currentComputed, printRecord) {
  if (!printRecord || !printRecord.printedAt) {
    return {
      status: MANIFEST_STATUS.NEVER_PRINTED,
      revision: 0,
      nextRevision: 1,
      delta: null,
      printRecord: null,
    };
  }

  const isIdentical = currentComputed.fingerprint === printRecord.contentFingerprint;

  if (isIdentical) {
    return {
      status: MANIFEST_STATUS.FRESH_IDENTICAL,
      revision: printRecord.revision || 1,
      nextRevision: (printRecord.revision || 1) + 1,
      printedAt: printRecord.printedAt,
      printedBy: printRecord.printedBy,
      delta: null,
      printRecord,
    };
  }

  const delta = calculateManifestDelta(currentComputed.summary, printRecord.summary);

  return {
    status: MANIFEST_STATUS.STALE_OUTDATED,
    revision: printRecord.revision || 1,
    nextRevision: (printRecord.revision || 1) + 1,
    printedAt: printRecord.printedAt,
    printedBy: printRecord.printedBy,
    delta,
    printRecord,
  };
}

/**
 * Real-time listener for manifest print status of a specific meal and service date
 */
export function subscribeToManifestPrint(meal, targetDateIST, onUpdate, onError) {
  if (!meal || !targetDateIST) {
    if (typeof onUpdate === 'function') onUpdate(null);
    return () => {};
  }

  const docId = getManifestPrintDocId(meal, targetDateIST);
  const docRef = firebase.firestore().collection('canteen_manifest_prints').doc(docId);

  return docRef.onSnapshot(
    (snap) => {
      if (snap.exists) {
        onUpdate({ id: snap.id, ...snap.data() });
      } else {
        onUpdate(null);
      }
    },
    (err) => {
      console.error('[ManifestPrintService] Subscription error:', err);
      if (typeof onError === 'function') onError(err);
    }
  );
}

/**
 * One-off fetch of manifest print record
 */
export async function getManifestPrintRecord(meal, targetDateIST) {
  try {
    const docId = getManifestPrintDocId(meal, targetDateIST);
    const snap = await firebase.firestore().collection('canteen_manifest_prints').doc(docId).get();
    if (snap.exists) {
      return { id: snap.id, ...snap.data() };
    }
    return null;
  } catch (err) {
    console.warn('[ManifestPrintService] Failed to get print record:', err);
    return null;
  }
}

/**
 * Records or updates a manifest print job in Firestore and logs an audit event
 */
export async function recordManifestPrint({
  meal = 'lunch',
  targetDateIST,
  documents = [],
  effectiveDay,
  user = null,
  role = 'canteen_committee',
  printType = 'supply_manifest',
  isDuplicateReprint = false,
}) {
  const cleanMeal = String(meal).toLowerCase();
  const docId = getManifestPrintDocId(cleanMeal, targetDateIST);
  const docRef = firebase.firestore().collection('canteen_manifest_prints').doc(docId);

  const { fingerprint, summary } = computeManifestFingerprint({
    documents,
    targetDateIST,
    effectiveDay,
    meal: cleanMeal,
  });

  const nowIso = new Date().toISOString();
  const actor = {
    uid: user?.uid || 'admin',
    email: user?.email || 'canteen@adsa',
    displayName: user?.displayName || user?.email?.split('@')[0] || 'Canteen Admin',
    role: role || 'canteen_committee',
  };

  let newRevision = 1;
  let reprintHistory = [];

  try {
    const existingSnap = await docRef.get();
    if (existingSnap.exists) {
      const prevData = existingSnap.data();
      reprintHistory = Array.isArray(prevData.reprintHistory) ? prevData.reprintHistory : [];

      if (isDuplicateReprint && prevData.contentFingerprint === fingerprint) {
        // Duplicate reprint of identical sheet: keep same revision number
        newRevision = prevData.revision || 1;
      } else {
        // Content changed or increment requested
        newRevision = (prevData.revision || 1) + 1;
      }

      // Append previous print to history
      reprintHistory.unshift({
        revision: prevData.revision || 1,
        printedAt: prevData.printedAt || nowIso,
        printedBy: prevData.printedBy || actor,
        printType: prevData.printType || printType,
        summary: prevData.summary || null,
      });

      // Keep up to 10 historical prints
      reprintHistory = reprintHistory.slice(0, 10);
    }

    const payload = {
      id: docId,
      meal: cleanMeal,
      targetDateIST,
      revision: newRevision,
      printedAt: nowIso,
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
      printedBy: actor,
      printType,
      contentFingerprint: fingerprint,
      summary,
      reprintHistory,
    };

    await docRef.set(payload, { merge: true });

    // Log Centralized Audit Event
    const mealLabel = cleanMeal === 'lunch' ? 'Lunch' : 'Breakfast';
    const actionName = isDuplicateReprint ? 'MANIFEST_REPRINT_DUPLICATE' : 'MANIFEST_PRINT';

    await logAuditEvent({
      category: AUDIT_CATEGORIES.CANTEEN,
      action: actionName,
      severity: isDuplicateReprint ? AUDIT_SEVERITIES.WARNING : AUDIT_SEVERITIES.INFO,
      actor,
      target: {
        type: 'canteen_manifest',
        id: docId,
        label: `${mealLabel} Kitchen Manifest (${targetDateIST})`,
      },
      changes: {
        diffSummary: `${isDuplicateReprint ? 'Reprinted duplicate' : 'Printed'} ${mealLabel} Manifest Rev ${newRevision} (${targetDateIST}) • ${summary.activeCount} meals to cook`,
        fieldsChanged: ['revision', 'printedAt', 'contentFingerprint'],
        after: {
          revision: newRevision,
          activeCount: summary.activeCount,
          canceledCount: summary.canceledCount,
          dietaryAvoidersCount: summary.dietaryAvoidersCount,
        },
      },
      metadata: {
        meal: cleanMeal,
        targetDateIST,
        revision: newRevision,
        isDuplicateReprint,
        printType,
        activeCount: summary.activeCount,
        canceledCount: summary.canceledCount,
        dietaryAvoidersCount: summary.dietaryAvoidersCount,
      },
    });

    // Notify window components
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('adsa:manifest_printed', {
          detail: payload,
        })
      );
    }

    return { success: true, revision: newRevision, payload };
  } catch (err) {
    console.error('[ManifestPrintService] Error recording print job:', err);
    return { success: false, error: err };
  }
}

/**
 * Quick checker used during student edits or dietary changes to see if
 * today or tomorrow's manifest is already printed and now invalidated
 */
export async function checkActivePrintsForDates(dateStrings = []) {
  try {
    const dates = Array.isArray(dateStrings) ? dateStrings : [dateStrings];
    const meals = ['breakfast', 'lunch'];
    const activePrints = [];

    for (const d of dates) {
      if (!d) continue;
      for (const m of meals) {
        const record = await getManifestPrintRecord(m, d);
        if (record && record.printedAt) {
          activePrints.push(record);
        }
      }
    }

    return activePrints;
  } catch (err) {
    console.warn('[ManifestPrintService] checkActivePrintsForDates error:', err);
    return [];
  }
}
