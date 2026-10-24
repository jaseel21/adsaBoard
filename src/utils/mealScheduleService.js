import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';
import { formatTime12 } from './useTokenLockStatus';

export const DAY_KEYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

export const DAY_NAMES = {
  su: { en: 'Sunday', ml: 'ഞായർ' },
  mo: { en: 'Monday', ml: 'തിങ്കൾ' },
  tu: { en: 'Tuesday', ml: 'ചൊവ്വ' },
  we: { en: 'Wednesday', ml: 'ബുധൻ' },
  th: { en: 'Thursday', ml: 'വ്യാഴം' },
  fr: { en: 'Friday', ml: 'വെള്ളി' },
  sa: { en: 'Saturday', ml: 'ശനി' },
};

/**
 * Standard Default Meal Schedule
 * Friday lunch is tailored for Jumu'ah prayer timing (01:15 PM - 02:15 PM).
 */
export const DEFAULT_MEAL_SCHEDULE = {
  su: {
    breakfast: { startTime: '07:30', endTime: '08:45', isServed: true, label: '07:30 AM - 08:45 AM' },
    lunch: { startTime: '12:45', endTime: '14:00', isServed: true, label: '12:45 PM - 02:00 PM' },
  },
  mo: {
    breakfast: { startTime: '07:30', endTime: '08:45', isServed: true, label: '07:30 AM - 08:45 AM' },
    lunch: { startTime: '12:45', endTime: '14:00', isServed: true, label: '12:45 PM - 02:00 PM' },
  },
  tu: {
    breakfast: { startTime: '07:30', endTime: '08:45', isServed: true, label: '07:30 AM - 08:45 AM' },
    lunch: { startTime: '12:45', endTime: '14:00', isServed: true, label: '12:45 PM - 02:00 PM' },
  },
  we: {
    breakfast: { startTime: '07:30', endTime: '08:45', isServed: true, label: '07:30 AM - 08:45 AM' },
    lunch: { startTime: '12:45', endTime: '14:00', isServed: true, label: '12:45 PM - 02:00 PM' },
  },
  th: {
    breakfast: { startTime: '07:30', endTime: '08:45', isServed: true, label: '07:30 AM - 08:45 AM' },
    lunch: { startTime: '12:45', endTime: '14:00', isServed: true, label: '12:45 PM - 02:00 PM' },
  },
  fr: {
    breakfast: { startTime: '07:30', endTime: '08:45', isServed: true, label: '07:30 AM - 08:45 AM' },
    lunch: { startTime: '13:15', endTime: '14:15', isServed: true, label: '01:15 PM - 02:15 PM', isFridaySpecial: true },
  },
  sa: {
    breakfast: { startTime: '07:30', endTime: '08:45', isServed: true, label: '07:30 AM - 08:45 AM' },
    lunch: { startTime: '12:45', endTime: '14:00', isServed: true, label: '12:45 PM - 02:00 PM' },
  },
};

/**
 * Standard Fine Policy Matrix (Food Waste / Late / Skipped Meal Penalties)
 * - All days' breakfast: ₹50
 * - All days' lunch: ₹50
 * - Friday breakfast: ₹100
 * - Friday lunch: ₹200
 */
export const DEFAULT_FINE_POLICY = {
  su: { breakfast: 50, lunch: 50 },
  mo: { breakfast: 50, lunch: 50 },
  tu: { breakfast: 50, lunch: 50 },
  we: { breakfast: 50, lunch: 50 },
  th: { breakfast: 50, lunch: 50 },
  fr: { breakfast: 100, lunch: 200 },
  sa: { breakfast: 50, lunch: 50 },
};

export const BLOCK_REASON_CATEGORIES = {
  food_waste: {
    id: 'food_waste',
    labelEn: 'Food Waste (Skipped Meal after Token ON)',
    labelMl: 'ഭക്ഷണം പാഴാക്കൽ (ടോക്കൺ ഓൺ ചെയ്ത് വരാതിരിക്കൽ)',
    badgeColor: 'rose',
  },
  late_arrival: {
    id: 'late_arrival',
    labelEn: 'Late Arrival (Serving Cutoff Passed)',
    labelMl: 'ഭക്ഷണ സമയത്ത് വൈകി വരൽ',
    badgeColor: 'amber',
  },
  skipped_meal: {
    id: 'skipped_meal',
    labelEn: 'Unnotified Meal Absence',
    labelMl: 'അറിയിപ്പില്ലാതെ ഭക്ഷണം ഒഴിവാക്കൽ',
    badgeColor: 'orange',
  },
  mess_dues: {
    id: 'mess_dues',
    labelEn: 'Pending Mess Dues / Arrears',
    labelMl: 'മെസ്സ് ഫീസ് കുടിശ്ശിക',
    badgeColor: 'purple',
  },
  disciplinary: {
    id: 'disciplinary',
    labelEn: 'Canteen Discipline Action',
    labelMl: 'അച്ചടക്ക നടപടി',
    badgeColor: 'blue',
  },
  other: {
    id: 'other',
    labelEn: 'Administrative Review',
    labelMl: 'മറ്റ് അഡ്മിനിസ്ട്രേറ്റീവ് കാര്യങ്ങൾ',
    badgeColor: 'gray',
  },
};

const CANTEEN_CONFIG_DOC_REF = () =>
  firebase.firestore().collection('settings').doc('canteen_config');

let cachedSchedule = { ...DEFAULT_MEAL_SCHEDULE };
let cachedFinePolicy = { ...DEFAULT_FINE_POLICY };

/**
 * Formats a 24h start/end time into a friendly display string (e.g., "07:30 AM - 08:45 AM")
 */
export function formatMealTimeRange(startTime, endTime) {
  if (!startTime || !endTime) return '';
  const start12 = formatTime12(startTime, false);
  const end12 = formatTime12(endTime, false);
  return `${start12} - ${end12}`;
}

/**
 * Convert HH:mm string to minutes since midnight for robust comparison
 */
export function timeStringToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [hh, mm] = timeStr.split(':').map(Number);
  return (hh || 0) * 60 + (mm || 0);
}

/**
 * Returns currently cached meal schedule synchronously
 */
export function getCachedMealSchedule() {
  return cachedSchedule;
}

/**
 * Returns currently cached fine policy synchronously
 */
export function getCachedFinePolicy() {
  return cachedFinePolicy;
}

/**
 * Real-time listener for meal schedule and fine policies.
 */
export function subscribeToMealScheduleAndFines(onUpdate, onError) {
  const docRef = CANTEEN_CONFIG_DOC_REF();

  return docRef.onSnapshot(
    (snapshot) => {
      if (snapshot.exists) {
        const data = snapshot.data() || {};
        if (data.mealSchedule) {
          cachedSchedule = mergeWithDefaultSchedule(data.mealSchedule);
        }
        if (data.finePolicy) {
          cachedFinePolicy = mergeWithDefaultFinePolicy(data.finePolicy);
        }
        if (typeof onUpdate === 'function') {
          onUpdate({
            mealSchedule: cachedSchedule,
            finePolicy: cachedFinePolicy,
            sectionChunkSize: Number(data.sectionChunkSize) || 25,
            defaultViewMode: data.defaultViewMode || 'sections',
            updatedAt: data.updatedAt || null,
            updatedByName: data.updatedByName || '',
          });
        }
      } else {
        // Document doesn't exist yet, seed with defaults
        docRef
          .set(
            {
              mealSchedule: DEFAULT_MEAL_SCHEDULE,
              finePolicy: DEFAULT_FINE_POLICY,
              sectionChunkSize: 25,
              defaultViewMode: 'sections',
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
              updatedByName: 'System Auto-Seed',
            },
            { merge: true }
          )
          .catch((err) => console.warn('Could not auto-seed meal schedule:', err));

        if (typeof onUpdate === 'function') {
          onUpdate({
            mealSchedule: cachedSchedule,
            finePolicy: cachedFinePolicy,
          });
        }
      }
    },
    (err) => {
      console.error('Error in meal schedule subscription:', err);
      if (typeof onError === 'function') onError(err);
    }
  );
}

function mergeWithDefaultSchedule(remote) {
  const merged = {};
  DAY_KEYS.forEach((d) => {
    merged[d] = {
      breakfast: {
        ...DEFAULT_MEAL_SCHEDULE[d].breakfast,
        ...(remote?.[d]?.breakfast || {}),
      },
      lunch: {
        ...DEFAULT_MEAL_SCHEDULE[d].lunch,
        ...(remote?.[d]?.lunch || {}),
      },
    };
    // Ensure display label is up to date
    merged[d].breakfast.label = formatMealTimeRange(
      merged[d].breakfast.startTime,
      merged[d].breakfast.endTime
    );
    merged[d].lunch.label = formatMealTimeRange(
      merged[d].lunch.startTime,
      merged[d].lunch.endTime
    );
  });
  return merged;
}

function mergeWithDefaultFinePolicy(remote) {
  const merged = {};
  DAY_KEYS.forEach((d) => {
    merged[d] = {
      breakfast: Number(remote?.[d]?.breakfast) >= 0 ? Number(remote[d].breakfast) : DEFAULT_FINE_POLICY[d].breakfast,
      lunch: Number(remote?.[d]?.lunch) >= 0 ? Number(remote[d].lunch) : DEFAULT_FINE_POLICY[d].lunch,
    };
  });
  return merged;
}

/**
 * Calculates fine amount for a blocked student.
 * If student record has an explicit `fineAmount`, uses that.
 * Otherwise resolves from dynamic fine policy by day and meal.
 */
export function getStudentFineAmount(student, finePolicy = cachedFinePolicy) {
  if (!student) return 0;
  if (typeof student.fineAmount === 'number' && !isNaN(student.fineAmount)) {
    return student.fineAmount;
  }

  const day = (student.blockDay || 'fr').toLowerCase();
  const meal = (student.blockMeal || 'lunch').toLowerCase();
  const dayRates = finePolicy[day] || finePolicy.fr || DEFAULT_FINE_POLICY.fr;

  if (meal === 'both') {
    return (dayRates.breakfast || 50) + (dayRates.lunch || 50);
  }
  return dayRates[meal] !== undefined ? dayRates[meal] : 50;
}

/**
 * Admin utility to update the fine amount for an individual student.
 * Persists to Firestore `students/{studentId}` and logs an audit trail event.
 */
export async function updateStudentFineAmount({
  studentId,
  tokenNo,
  studentName = '',
  newFineAmount,
  reason = '',
  actor = {},
}) {
  if (!studentId) throw new Error('Student ID is required to update fine.');

  const amount = Number(newFineAmount);
  if (isNaN(amount) || amount < 0) {
    throw new Error('Valid fine amount is required (>= 0).');
  }

  const docRef = firebase.firestore().collection('students').doc(studentId);
  const snap = await docRef.get();
  const existingData = snap.exists ? snap.data() : {};
  const previousFine = existingData.fineAmount !== undefined ? existingData.fineAmount : null;

  const updates = {
    fineAmount: amount,
    fineReason: reason.trim() || existingData.fineReason || '',
    updatedAt: new Date().toISOString(),
    lastFineEditedAt: new Date().toISOString(),
    lastFineEditedBy: actor.displayName || actor.email || 'Admin',
  };

  // If fine amount is set to 0, mark as waived automatically
  if (amount === 0 && existingData.fineStatus !== 'waived') {
    updates.fineStatus = 'waived';
  } else if (amount > 0 && existingData.fineStatus === 'waived') {
    updates.fineStatus = 'unpaid';
  }

  await docRef.update(updates);

  // Log Audit Event
  try {
    await logAuditEvent({
      action: 'UPDATE_STUDENT_FINE_AMOUNT',
      category: AUDIT_CATEGORIES.TOKENS,
      severity: AUDIT_SEVERITIES.INFO,
      actor: {
        uid: actor.uid || '',
        displayName: actor.displayName || actor.email || 'Admin',
        role: actor.role || 'canteen_committee',
      },
      target: {
        type: 'student',
        id: studentId,
        label: `Token #${tokenNo || existingData.tokenNo || studentId}`,
        tokenNo: Number(tokenNo || existingData.tokenNo),
      },
      changes: {
        diffSummary: `Updated fine for Token #${tokenNo || existingData.tokenNo}: ₹${previousFine ?? 'Standard'} -> ₹${amount} (${reason.trim() || 'Admin adjustment'})`,
        before: { fineAmount: previousFine },
        after: { fineAmount: amount, reason: reason.trim() },
      },
    });
  } catch (logErr) {
    console.warn('Failed to record fine update audit log:', logErr);
  }

  return { success: true, newAmount: amount };
}

/**
 * Save updated meal schedule and/or fine policy to Firestore with full audit logging.
 */
export async function saveMealScheduleAndFines({
  mealSchedule = null,
  finePolicy = null,
  actor = {},
}) {
  const docRef = CANTEEN_CONFIG_DOC_REF();
  const updates = {
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: actor.uid || 'admin',
    updatedByName: actor.displayName || actor.email || 'Admin',
  };

  const beforeSchedule = { ...cachedSchedule };
  const beforeFine = { ...cachedFinePolicy };

  if (mealSchedule) {
    updates.mealSchedule = mealSchedule;
    cachedSchedule = mealSchedule;
  }
  if (finePolicy) {
    updates.finePolicy = finePolicy;
    cachedFinePolicy = finePolicy;
  }

  await docRef.set(updates, { merge: true });

  // Record Audit Event
  try {
    await logAuditEvent({
      action: 'UPDATE_MEAL_SCHEDULE_AND_FINES',
      category: AUDIT_CATEGORIES.SYSTEM,
      severity: AUDIT_SEVERITIES.INFO,
      actor: {
        uid: actor.uid || '',
        displayName: actor.displayName || actor.email || 'Admin',
        role: actor.role || 'canteen_committee',
      },
      target: {
        type: 'config',
        id: 'canteen_config',
        label: 'Canteen Meal Timings & Fine Policy',
      },
      changes: {
        diffSummary: 'Updated universal canteen meal schedule and fine rate matrix',
        before: { mealSchedule: beforeSchedule, finePolicy: beforeFine },
        after: { mealSchedule: updates.mealSchedule, finePolicy: updates.finePolicy },
      },
    });
  } catch (logErr) {
    console.warn('Could not record audit log for meal schedule update:', logErr);
  }

  return { success: true };
}

/**
 * Live Meal Phase Radar Engine
 * Analyzes the current IST time against the active day's meal schedule.
 * Returns exact status for Breakfast, Lunch, and current active/upcoming phase.
 */
export function getLiveMealRadar(timeHms, dayShort = 'fr', schedule = cachedSchedule) {
  const dow = (dayShort || 'fr').toLowerCase();
  const daySchedule = schedule[dow] || schedule.fr || DEFAULT_MEAL_SCHEDULE.fr;

  const currentMins = timeStringToMinutes(timeHms || '12:00:00');

  const bfStart = timeStringToMinutes(daySchedule.breakfast.startTime);
  const bfEnd = timeStringToMinutes(daySchedule.breakfast.endTime);
  const lunchStart = timeStringToMinutes(daySchedule.lunch.startTime);
  const lunchEnd = timeStringToMinutes(daySchedule.lunch.endTime);

  // Status for Breakfast
  let bfStatus = 'upcoming'; // 'upcoming' | 'serving' | 'completed'
  let bfRemainingMins = 0;
  if (currentMins < bfStart) {
    bfStatus = 'upcoming';
    bfRemainingMins = bfStart - currentMins;
  } else if (currentMins <= bfEnd) {
    bfStatus = 'serving';
    bfRemainingMins = bfEnd - currentMins;
  } else {
    bfStatus = 'completed';
  }

  // Status for Lunch
  let lunchStatus = 'upcoming';
  let lunchRemainingMins = 0;
  if (currentMins < lunchStart) {
    lunchStatus = 'upcoming';
    lunchRemainingMins = lunchStart - currentMins;
  } else if (currentMins <= lunchEnd) {
    lunchStatus = 'serving';
    lunchRemainingMins = lunchEnd - currentMins;
  } else {
    lunchStatus = 'completed';
  }

  // Active Spotlight
  let activePhase = 'bf_upcoming';
  let bannerTitleEn = '';
  let bannerTitleMl = '';
  let countdownTextEn = '';
  let countdownTextMl = '';
  let highlightMeal = 'breakfast';
  let isServing = false;

  const formatCountdown = (diffMins) => {
    const h = Math.floor(diffMins / 60);
    const m = diffMins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const isFriday = dow === 'fr';

  if (bfStatus === 'serving') {
    activePhase = 'bf_serving';
    highlightMeal = 'breakfast';
    isServing = true;
    bannerTitleEn = 'Breakfast Serving Active';
    bannerTitleMl = 'പ്രഭാതഭക്ഷണ വിതരണം നടക്കുന്നു';
    countdownTextEn = `${formatCountdown(bfRemainingMins)} left (until ${formatTime12(daySchedule.breakfast.endTime, false)})`;
    countdownTextMl = `${bfRemainingMins} മിനിറ്റ് ബാക്കി`;
  } else if (bfStatus === 'upcoming') {
    activePhase = 'bf_upcoming';
    highlightMeal = 'breakfast';
    bannerTitleEn = 'Next: Morning Breakfast';
    bannerTitleMl = 'അടുത്തത്: പ്രഭാതഭക്ഷണം';
    countdownTextEn = `Starts in ${formatCountdown(bfRemainingMins)} (${formatTime12(daySchedule.breakfast.startTime, false)})`;
    countdownTextMl = `${formatCountdown(bfRemainingMins)} ശേഷം ആരംഭിക്കും`;
  } else if (lunchStatus === 'serving') {
    activePhase = 'lunch_serving';
    highlightMeal = 'lunch';
    isServing = true;
    bannerTitleEn = isFriday ? "Friday Jumu'ah Lunch Serving" : 'Lunch Serving Active';
    bannerTitleMl = isFriday ? 'ജുമുഅ സ്പെഷ്യൽ ഉച്ചഭക്ഷണ വിതരണം നടക്കുന്നു' : 'ഉച്ചഭക്ഷണ വിതരണം നടക്കുന്നു';
    countdownTextEn = `${formatCountdown(lunchRemainingMins)} left (until ${formatTime12(daySchedule.lunch.endTime, false)})`;
    countdownTextMl = `${lunchRemainingMins} മിനിറ്റ് ബാക്കി`;
  } else if (lunchStatus === 'upcoming') {
    activePhase = 'lunch_upcoming';
    highlightMeal = 'lunch';
    bannerTitleEn = isFriday ? "Upcoming: Friday Jumu'ah Lunch" : 'Next: Campus Lunch';
    bannerTitleMl = isFriday ? 'അടുത്തത്: ജുമുഅ ഉച്ചഭക്ഷണം' : 'അടുത്തത്: ഉച്ചഭക്ഷണം';
    countdownTextEn = `Starts in ${formatCountdown(lunchRemainingMins)} (${formatTime12(daySchedule.lunch.startTime, false)})`;
    countdownTextMl = `${formatCountdown(lunchRemainingMins)} ശേഷം ആരംഭിക്കും`;
  } else {
    activePhase = 'meals_completed';
    highlightMeal = 'breakfast';
    bannerTitleEn = "Today's Meal Services Completed";
    bannerTitleMl = 'ഇന്നത്തെ ഭക്ഷണ വിതരണം പൂർത്തിയായി';
    countdownTextEn = 'Token updates open for tomorrow';
    countdownTextMl = 'നാളത്തെ ടോക്കൺ മാറ്റങ്ങൾ തുറന്നിരിക്കുന്നു';
  }

  return {
    dayKey: dow,
    isFriday,
    daySchedule,
    breakfast: {
      status: bfStatus,
      remainingMins: bfRemainingMins,
      timing: daySchedule.breakfast.label,
      startTime12: formatTime12(daySchedule.breakfast.startTime, false),
      endTime12: formatTime12(daySchedule.breakfast.endTime, false),
    },
    lunch: {
      status: lunchStatus,
      remainingMins: lunchRemainingMins,
      timing: daySchedule.lunch.label,
      startTime12: formatTime12(daySchedule.lunch.startTime, false),
      endTime12: formatTime12(daySchedule.lunch.endTime, false),
      isFridaySpecial: isFriday,
    },
    activePhase,
    highlightMeal,
    isServing,
    bannerTitleEn,
    bannerTitleMl,
    countdownTextEn,
    countdownTextMl,
  };
}
