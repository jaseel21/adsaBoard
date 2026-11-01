import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';
import { addDaysToDate } from './studentExceptionService';

/**
 * Predefined reasons for Canteen Food Supply being turned OFF or ON.
 * All reasons strictly provide pure English and pure Malayalam keys (no brackets or mixed scripts).
 */
export const FOOD_SUPPLY_REASONS = [
  {
    key: 'dars_leave',
    labelEn: 'Monthly Dars Leave',
    labelMl: 'മാസാന്ത ദർസ് അവധി',
    descEn: 'Canteen food supply is suspended for the scheduled monthly Dars holiday.',
    descMl: 'മാസാന്ത ദർസ് അവധി പ്രമാണിച്ച് കാന്റീൻ പ്രവർത്തനം ഉണ്ടായിരിക്കുന്നതല്ല.',
    badgeEn: 'Monthly Leave',
    badgeMl: 'മാസാവധി',
    category: 'dars_leave',
    severity: 'info',
  },
  {
    key: 'nikah',
    labelEn: 'Nikah Ceremony Feast',
    labelMl: 'നിക്കാഹ് സൽക്കാരം',
    descEn: 'Canteen noon mess is cancelled; dining is provided at the Nikah ceremony.',
    descMl: 'നിക്കാഹ് സൽക്കാരത്തോടനുബന്ധിച്ച് കാന്റീൻ ഉച്ചഭക്ഷണം ഒഴിവാക്കിയിരിക്കുന്നു.',
    badgeEn: 'Nikah Feast',
    badgeMl: 'നിക്കാഹ് സൽക്കാരം',
    category: 'nikah',
    severity: 'festive',
  },
  {
    key: 'temporary_close',
    labelEn: 'Temporary Canteen Close',
    labelMl: 'താത്കാലിക കാന്റീൻ അവധി',
    descEn: 'Canteen meal service is temporarily suspended for maintenance or holiday.',
    descMl: 'അറ്റകുറ്റപ്പണികൾ കാരണം കാന്റീൻ പ്രവർത്തനം താത്കാലികമായി നിർത്തിവെച്ചിരിക്കുന്നു.',
    badgeEn: 'Canteen Closed',
    badgeMl: 'കാന്റീൻ അവധി',
    category: 'temporary_close',
    severity: 'critical',
  },
  {
    key: 'special_feast',
    labelEn: 'Special Dars Feast',
    labelMl: 'പ്രത്യേക ദർസ് വിരുന്ന്',
    descEn: 'Special dining arranged for campus students; normal routine suspended.',
    descMl: 'വിദ്യാർത്ഥികൾക്കായി പ്രത്യേക വിരുന്ന് ക്രമീകരിച്ചിരിക്കുന്നു.',
    badgeEn: 'Special Feast',
    badgeMl: 'പ്രത്യേക വിരുന്ന്',
    category: 'special_feast',
    severity: 'festive',
  },
  {
    key: 'holiday',
    labelEn: 'Campus Holiday',
    labelMl: 'കാമ്പസ് അവധി',
    descEn: 'Institutional holiday observed across the campus.',
    descMl: 'സ്ഥാപനത്തിലെ അവധി പ്രമാണിച്ച് കാന്റീൻ പ്രവർത്തിക്കുന്നതല്ല.',
    badgeEn: 'Holiday',
    badgeMl: 'അവധി',
    category: 'holiday',
    severity: 'info',
  },
  {
    key: 'custom',
    labelEn: 'Custom Notice',
    labelMl: 'പ്രത്യേക അറിയിപ്പ്',
    descEn: 'Canteen food service suspended as per administrative notice.',
    descMl: 'കാന്റീൻ മാനേജ്‌മെന്റ് നിർദ്ദേശപ്രകാരം ഭക്ഷണം നൽകുന്നതല്ല.',
    badgeEn: 'Notice',
    badgeMl: 'അറിയിപ്പ്',
    category: 'general',
    severity: 'warning',
  },
];

const BOARD_SERVICE_DOC_REF = () =>
  firebase.firestore().collection('settings').doc('board_service');

let cachedBoardService = {};

/**
 * Real-time listener for Board Food Supply Schedule (settings/board_service).
 * Stores date-level food supply on/off status for breakfast and lunch.
 */
export function subscribeToBoardServiceSchedule(onUpdate, onError) {
  const docRef = BOARD_SERVICE_DOC_REF();

  return docRef.onSnapshot(
    async (snapshot) => {
      if (snapshot.exists) {
        const data = snapshot.data() || {};
        const schedule = data.schedule || {};
        cachedBoardService = schedule;
        if (typeof onUpdate === 'function') {
          onUpdate(schedule);
        }
      } else {
        // Seed initial empty structure
        try {
          await docRef.set({
            schedule: {},
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedByName: 'System Auto-Seed',
          });
          cachedBoardService = {};
          if (typeof onUpdate === 'function') {
            onUpdate({});
          }
        } catch (seedErr) {
          console.warn('[boardServiceSchedule] Could not seed default doc:', seedErr);
          if (typeof onUpdate === 'function') {
            onUpdate({});
          }
        }
      }
    },
    (err) => {
      console.error('[boardServiceSchedule] Snapshot error:', err);
      if (typeof onError === 'function') {
        onError(err);
      } else if (typeof onUpdate === 'function') {
        onUpdate(cachedBoardService);
      }
    }
  );
}

/**
 * Synchronous getter for current cached food supply schedule.
 */
export function getCachedBoardServiceSchedule() {
  return cachedBoardService;
}

/**
 * Returns the food supply operational status for a specific date and meal.
 * If no override exists, food supply is ON by default (normal canteen operation).
 *
 * @param {Object} schedule - Schedule map from settings/board_service
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @param {string} mealType - 'breakfast' | 'lunch'
 * @returns {Object} { isSupplying: boolean, reasonKey: string, reasonObj: Object, noteEn: string, noteMl: string }
 */
export function getMealSupplyStatus(schedule = {}, dateStr, mealType = 'lunch') {
  if (!dateStr || !schedule || !schedule[dateStr]) {
    return {
      isSupplying: true,
      reasonKey: null,
      reasonObj: null,
      noteEn: '',
      noteMl: '',
      isOverridden: false,
    };
  }

  const dateRecord = schedule[dateStr];
  const mealRecord = dateRecord[mealType];

  if (!mealRecord || mealRecord.isSupplying !== false) {
    return {
      isSupplying: true,
      reasonKey: mealRecord?.reasonKey || null,
      reasonObj: null,
      noteEn: mealRecord?.noteEn || '',
      noteMl: mealRecord?.noteMl || '',
      isOverridden: false,
    };
  }

  const reasonObj = FOOD_SUPPLY_REASONS.find((r) => r.key === mealRecord.reasonKey) || FOOD_SUPPLY_REASONS[0];

  return {
    isSupplying: false, // NO FOOD SUPPLY IN CANTEEN!
    reasonKey: mealRecord.reasonKey || 'temporary_close',
    reasonObj,
    noteEn: mealRecord.noteEn || reasonObj.labelEn,
    noteMl: mealRecord.noteMl || reasonObj.labelMl,
    descEn: mealRecord.descEn || reasonObj.descEn,
    descMl: mealRecord.descMl || reasonObj.descMl,
    isOverridden: true,
  };
}

/**
 * Turns Food Supply ON or OFF for a specific meal on a given date.
 */
export async function setBoardMealSupply({
  dateStr,
  mealType, // 'breakfast' | 'lunch'
  isSupplying, // true = ON (food served); false = OFF (no food supply)
  reasonKey = 'temporary_close',
  noteEn = '',
  noteMl = '',
  descEn = '',
  descMl = '',
  actor = {},
}) {
  if (!dateStr || !mealType) {
    throw new Error('dateStr and mealType are required.');
  }

  const docRef = BOARD_SERVICE_DOC_REF();
  const snap = await docRef.get();
  const currentSchedule = snap.exists ? (snap.data()?.schedule || {}) : {};

  const existingDateRec = currentSchedule[dateStr] || {
    date: dateStr,
    breakfast: { isSupplying: true },
    lunch: { isSupplying: true },
  };

  const updatedDateRec = {
    ...existingDateRec,
    date: dateStr,
    [mealType]: {
      isSupplying: Boolean(isSupplying),
      reasonKey: isSupplying ? null : reasonKey,
      noteEn: isSupplying ? '' : noteEn,
      noteMl: isSupplying ? '' : noteMl,
      descEn: isSupplying ? '' : descEn,
      descMl: isSupplying ? '' : descMl,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.displayName || actor.email || 'Admin',
    },
    updatedAt: new Date().toISOString(),
  };

  // If both meals are supplying normally, remove the date record to keep doc minimal
  if (updatedDateRec.breakfast?.isSupplying !== false && updatedDateRec.lunch?.isSupplying !== false) {
    delete currentSchedule[dateStr];
  } else {
    currentSchedule[dateStr] = updatedDateRec;
  }

  await docRef.set(
    {
      schedule: currentSchedule,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastUpdatedBy: actor.displayName || actor.email || 'Admin',
    },
    { merge: true }
  );

  // Log audit trail
  const reasonObj = FOOD_SUPPLY_REASONS.find((r) => r.key === reasonKey);
  await logAuditEvent({
    category: AUDIT_CATEGORIES.TOKENS,
    action: isSupplying ? 'BOARD_SUPPLY_TURN_ON' : 'BOARD_SUPPLY_TURN_OFF',
    severity: isSupplying ? AUDIT_SEVERITIES.INFO : AUDIT_SEVERITIES.WARNING,
    actor: {
      uid: actor.uid || 'admin',
      displayName: actor.displayName || 'Admin',
      email: actor.email || '',
      role: actor.role || 'canteen_committee',
    },
    target: {
      type: 'tokenboard_supply',
      id: `${dateStr}_${mealType}`,
      label: `Canteen Food Supply (${dateStr} • ${mealType.toUpperCase()})`,
    },
    changes: {
      diffSummary: `Turned Board Food Supply ${isSupplying ? 'ON (Serving)' : 'OFF (No Supply)'} for ${mealType.toUpperCase()} on ${dateStr}${!isSupplying ? ` - Reason: ${reasonObj?.labelEn || reasonKey}` : ''}`,
      dateStr,
      mealType,
      isSupplying,
      reasonKey: isSupplying ? null : reasonKey,
    },
  });

  return updatedDateRec;
}

/**
 * Turns Food Supply ON or OFF for the ENTIRE DAY (Both Breakfast & Lunch).
 */
export async function setBoardDaySupply({
  dateStr,
  isSupplying, // true = ON; false = OFF
  reasonKey = 'dars_leave',
  noteEn = '',
  noteMl = '',
  descEn = '',
  descMl = '',
  actor = {},
}) {
  if (!dateStr) {
    throw new Error('dateStr is required.');
  }

  const docRef = BOARD_SERVICE_DOC_REF();
  const snap = await docRef.get();
  const currentSchedule = snap.exists ? (snap.data()?.schedule || {}) : {};

  if (isSupplying) {
    // Both meals active -> delete date override
    delete currentSchedule[dateStr];
  } else {
    const reasonObj = FOOD_SUPPLY_REASONS.find((r) => r.key === reasonKey);
    const finalNoteEn = noteEn || reasonObj?.labelEn || 'Canteen Closed';
    const finalNoteMl = noteMl || reasonObj?.labelMl || 'കാന്റീൻ അവധി';
    const finalDescEn = descEn || reasonObj?.descEn || '';
    const finalDescMl = descMl || reasonObj?.descMl || '';

    currentSchedule[dateStr] = {
      date: dateStr,
      breakfast: {
        isSupplying: false,
        reasonKey,
        noteEn: finalNoteEn,
        noteMl: finalNoteMl,
        descEn: finalDescEn,
        descMl: finalDescMl,
        updatedAt: new Date().toISOString(),
        updatedBy: actor.displayName || actor.email || 'Admin',
      },
      lunch: {
        isSupplying: false,
        reasonKey,
        noteEn: finalNoteEn,
        noteMl: finalNoteMl,
        descEn: finalDescEn,
        descMl: finalDescMl,
        updatedAt: new Date().toISOString(),
        updatedBy: actor.displayName || actor.email || 'Admin',
      },
      updatedAt: new Date().toISOString(),
    };
  }

  await docRef.set(
    {
      schedule: currentSchedule,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastUpdatedBy: actor.displayName || actor.email || 'Admin',
    },
    { merge: true }
  );

  // Log audit event
  const reasonObj = FOOD_SUPPLY_REASONS.find((r) => r.key === reasonKey);
  await logAuditEvent({
    category: AUDIT_CATEGORIES.TOKENS,
    action: isSupplying ? 'BOARD_DAY_SUPPLY_TURN_ON' : 'BOARD_DAY_SUPPLY_TURN_OFF',
    severity: isSupplying ? AUDIT_SEVERITIES.INFO : AUDIT_SEVERITIES.WARNING,
    actor: {
      uid: actor.uid || 'admin',
      displayName: actor.displayName || 'Admin',
      email: actor.email || '',
      role: actor.role || 'canteen_committee',
    },
    target: {
      type: 'tokenboard_supply',
      id: dateStr,
      label: `Canteen Food Supply (${dateStr} • FULL DAY)`,
    },
    changes: {
      diffSummary: `Turned Board Food Supply ${isSupplying ? 'ON (Serving)' : 'OFF (No Supply)'} for FULL DAY on ${dateStr}${!isSupplying ? ` - Reason: ${reasonObj?.labelEn || reasonKey}` : ''}`,
      dateStr,
      isSupplying,
      reasonKey: isSupplying ? null : reasonKey,
    },
  });

  return currentSchedule[dateStr] || null;
}

/**
 * Turns Food Supply ON or OFF for a multi-day range (e.g. Monthly Dars Leave weekend).
 */
export async function setBoardRangeSupply({
  startDate,
  endDate,
  mealScope = 'both', // 'both' | 'breakfast' | 'lunch'
  isSupplying = false, // true = ON; false = OFF
  reasonKey = 'dars_leave',
  noteEn = '',
  noteMl = '',
  descEn = '',
  descMl = '',
  actor = {},
}) {
  if (!startDate || !endDate) {
    throw new Error('startDate and endDate are required.');
  }

  const start = startDate <= endDate ? startDate : endDate;
  const end = startDate <= endDate ? endDate : startDate;

  const docRef = BOARD_SERVICE_DOC_REF();
  const snap = await docRef.get();
  const currentSchedule = snap.exists ? (snap.data()?.schedule || {}) : {};

  const reasonObj = FOOD_SUPPLY_REASONS.find((r) => r.key === reasonKey);
  const finalNoteEn = noteEn || reasonObj?.labelEn || 'Canteen Closed';
  const finalNoteMl = noteMl || reasonObj?.labelMl || 'കാന്റീൻ അവധി';
  const finalDescEn = descEn || reasonObj?.descEn || '';
  const finalDescMl = descMl || reasonObj?.descMl || '';

  let curr = start;
  let safetyCount = 0;
  const affectedDates = [];

  while (curr <= end && safetyCount < 366) {
    affectedDates.push(curr);

    if (isSupplying) {
      if (mealScope === 'both') {
        delete currentSchedule[curr];
      } else {
        const existing = currentSchedule[curr] || {
          date: curr,
          breakfast: { isSupplying: true },
          lunch: { isSupplying: true },
        };
        existing[mealScope] = {
          isSupplying: true,
          reasonKey: null,
          noteEn: '',
          noteMl: '',
          descEn: '',
          descMl: '',
          updatedAt: new Date().toISOString(),
          updatedBy: actor.displayName || actor.email || 'Admin',
        };
        if (existing.breakfast?.isSupplying !== false && existing.lunch?.isSupplying !== false) {
          delete currentSchedule[curr];
        } else {
          currentSchedule[curr] = existing;
        }
      }
    } else {
      // Turning OFF
      const existing = currentSchedule[curr] || {
        date: curr,
        breakfast: { isSupplying: true },
        lunch: { isSupplying: true },
      };

      const mealPayload = {
        isSupplying: false,
        reasonKey,
        noteEn: finalNoteEn,
        noteMl: finalNoteMl,
        descEn: finalDescEn,
        descMl: finalDescMl,
        updatedAt: new Date().toISOString(),
        updatedBy: actor.displayName || actor.email || 'Admin',
      };

      if (mealScope === 'both') {
        currentSchedule[curr] = {
          date: curr,
          breakfast: { ...mealPayload },
          lunch: { ...mealPayload },
          updatedAt: new Date().toISOString(),
        };
      } else {
        currentSchedule[curr] = {
          ...existing,
          date: curr,
          [mealScope]: { ...mealPayload },
          updatedAt: new Date().toISOString(),
        };
      }
    }

    curr = addDaysToDate(curr, 1);
    safetyCount++;
  }

  await docRef.set(
    {
      schedule: currentSchedule,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastUpdatedBy: actor.displayName || actor.email || 'Admin',
    },
    { merge: true }
  );

  // Log audit event
  await logAuditEvent({
    category: AUDIT_CATEGORIES.TOKENS,
    action: isSupplying ? 'BOARD_RANGE_SUPPLY_TURN_ON' : 'BOARD_RANGE_SUPPLY_TURN_OFF',
    severity: isSupplying ? AUDIT_SEVERITIES.INFO : AUDIT_SEVERITIES.WARNING,
    actor: {
      uid: actor.uid || 'admin',
      displayName: actor.displayName || 'Admin',
      email: actor.email || '',
      role: actor.role || 'canteen_committee',
    },
    target: {
      type: 'tokenboard_supply',
      id: `${start}_to_${end}`,
      label: `Canteen Food Supply (${start} to ${end} • ${mealScope.toUpperCase()})`,
    },
    changes: {
      diffSummary: `Turned Board Food Supply ${isSupplying ? 'ON (Serving)' : 'OFF (No Supply)'} from ${start} to ${end} (${mealScope.toUpperCase()})${!isSupplying ? ` - Reason: ${reasonObj?.labelEn || reasonKey}` : ''}`,
      startDate: start,
      endDate: end,
      mealScope,
      isSupplying,
      affectedDaysCount: affectedDates.length,
      reasonKey: isSupplying ? null : reasonKey,
    },
  });

  return currentSchedule;
}

/**
 * Clears date overrides, restoring standard recurring canteen operation.
 */
export async function clearBoardServiceOverride(dateStr, actor = {}) {
  return setBoardDaySupply({
    dateStr,
    isSupplying: true,
    actor,
  });
}
