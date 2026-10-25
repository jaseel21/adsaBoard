import firebase from '../firebase/config';
import { addDaysToDate, getDayOfWeekShort } from './studentExceptionService';
import { getCachedMealSchedule, getCanonicalMealTiming } from './mealScheduleService';

// Day key mappings
export const DAY_KEYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

export const DAY_NAMES = {
  su: 'Sunday',
  mo: 'Monday',
  tu: 'Tuesday',
  we: 'Wednesday',
  th: 'Thursday',
  fr: 'Friday',
  sa: 'Saturday',
};

export const DAY_SHORTS = {
  su: 'Sun',
  mo: 'Mon',
  tu: 'Tue',
  we: 'Wed',
  th: 'Thu',
  fr: 'Fri',
  sa: 'Sat',
};

/**
 * Creates a neutral, blank 7-day schedule map with empty meal slots
 * and dynamically campus-synced meal timings. Never hardcodes dishes.
 */
export function createEmptyWeeklyMenu() {
  const emptyMenu = {};
  DAY_KEYS.forEach((k) => {
    emptyMenu[k] = {
      dayKey: k,
      dayName: DAY_NAMES[k],
      dayShort: DAY_SHORTS[k],
      isArchived: false,
      archiveReason: '',
      note: '',
      breakfast: {
        title: '',
        items: [],
        category: '',
        timing: getCanonicalMealTiming(k, 'breakfast'),
        timeMode: 'clock',
        isAvailable: true,
        isArchived: false,
        isSpecialMeal: false,
        specialTitle: '',
        specialSponsor: '',
        specialNotes: '',
      },
      lunch: {
        title: '',
        items: [],
        category: '',
        timing: getCanonicalMealTiming(k, 'lunch'),
        timeMode: 'clock',
        isAvailable: true,
        isArchived: false,
        isSpecialMeal: false,
        specialTitle: '',
        specialSponsor: '',
        specialNotes: '',
      },
      evening: {
        title: '',
        items: [],
        category: '',
        timing: getCanonicalMealTiming(k, 'evening'),
        timeMode: 'clock',
        isAvailable: true,
        isArchived: false,
        isSpecialMeal: false,
        specialTitle: '',
        specialSponsor: '',
        specialNotes: '',
      },
      dinner: {
        title: '',
        items: [],
        category: '',
        timing: getCanonicalMealTiming(k, 'dinner'),
        timeMode: 'clock',
        isAvailable: true,
        isArchived: false,
        isSpecialMeal: false,
        specialTitle: '',
        specialSponsor: '',
        specialNotes: '',
      },
    };
  });
  return emptyMenu;
}

// Canonical structural baseline - completely dynamic with blank dish titles and campus timings
export const DEFAULT_WEEKLY_MENU = createEmptyWeeklyMenu();

// Curated library of traditional Malabar Dars delicacies for fast autocomplete / preset insertion
export const DISH_PRESETS = {
  breakfast: [
    { title: 'Porotta & Kadala', items: ['Kerala Porotta', 'Spicy Kadala Curry', 'Hot Tea'], category: 'Veg', timing: '07:30 AM - 08:45 AM', timeMode: 'clock' },
    { title: 'Appam & Veg Curry', items: ['Vellayappam', 'Mixed Veg Stew', 'Milk Tea'], category: 'Veg', timing: '07:30 AM - 08:45 AM', timeMode: 'clock' },
    { title: 'Appam & Egg Roast', items: ['Vellayappam', 'Egg Roast', 'Tea'], category: 'Egg', timing: '07:30 AM - 08:45 AM', timeMode: 'clock' },
    { title: 'Idli & Sambar', items: ['Steamed Idli', 'Vegetable Sambar', 'Coconut Chutney'], category: 'Veg', timing: '07:30 AM - 08:45 AM', timeMode: 'clock' },
    { title: 'Dosa & Chutney', items: ['Crispy Dosa', 'Tomato Chutney', 'Coconut Chutney'], category: 'Veg', timing: '07:30 AM - 08:45 AM', timeMode: 'clock' },
    { title: 'Puttu & Kadala', items: ['Rice Puttu', 'Kadala Curry', 'Pappadam'], category: 'Veg', timing: '07:30 AM - 08:45 AM', timeMode: 'clock' },
    { title: 'Puttu & Payar', items: ['Rice Puttu', 'Cherupayar Puzhukku', 'Pappadam'], category: 'Veg', timing: '07:30 AM - 08:45 AM', timeMode: 'clock' },
    { title: 'Pathiri & Chicken Curry', items: ['Ari Pathiri', 'Chicken Curry', 'Cardamom Tea'], category: 'Non-Veg', timing: '07:30 AM - 08:45 AM', timeMode: 'clock' },
    { title: 'Porotta & Egg Curry', items: ['Kerala Porotta', 'Egg Curry', 'Hot Tea'], category: 'Egg', timing: '07:30 AM - 08:45 AM', timeMode: 'clock' },
    { title: 'Poori & Masala', items: ['Fluffy Poori', 'Potato Masala', 'Tea'], category: 'Veg', timing: '07:30 AM - 08:45 AM', timeMode: 'clock' },
  ],
  lunch: [
    { title: 'Rice & Beef/Fish Curry', items: ['Matta Rice', 'Beef Roast / Curry', 'Fried Fish', 'Sambar', 'Pickle'], category: 'Non-Veg', timing: '12:45 PM - 02:00 PM', timeMode: 'clock' },
    { title: 'Rice & Chicken/Fish Curry', items: ['Matta Rice', 'Chicken Curry', 'Ayala Fish Curry', 'Thoran', 'Pickle'], category: 'Non-Veg', timing: '12:45 PM - 02:00 PM', timeMode: 'clock' },
    { title: 'Special Dum Biriyani', items: ['Malabar Dum Biriyani', 'Chicken 65', 'Date Pickle', 'Raita', 'Papad'], category: 'Special', timing: '12:45 PM - 02:00 PM', timeMode: 'clock' },
    { title: 'Ghee Rice & Chicken Roast', items: ['Neychoru (Ghee Rice)', 'Chicken Roast', 'Dalcha / Kurma', 'Salad'], category: 'Special', timing: '12:45 PM - 02:00 PM', timeMode: 'clock' },
    { title: 'Rice & Fish Curry/Veg', items: ['Matta Rice', 'Fresh Fish Curry', 'Aviyal / Pulissery', 'Pickle'], category: 'Non-Veg', timing: '12:45 PM - 02:00 PM', timeMode: 'clock' },
    { title: 'Rice & Meat Curry', items: ['Matta Rice', 'Kerala Beef Curry', 'Fish Fry', 'Beetroot Thoran'], category: 'Non-Veg', timing: '12:45 PM - 02:00 PM', timeMode: 'clock' },
    { title: 'Traditional Sadya (Veg)', items: ['Matta Rice', 'Sambar', 'Aviyal', 'Thoran', 'Payasam', 'Papad'], category: 'Veg', timing: '12:45 PM - 02:00 PM', timeMode: 'clock' },
  ],
  evening: [
    { title: 'Sulaimani & Snacks', items: ['Hot Sulaimani', 'Parippuvada / Samosa'], category: 'Veg', timing: '04:30 PM - 05:30 PM', timeMode: 'clock' },
    { title: 'Tea & Pazhampori', items: ['Milk Tea', 'Banana Fritters (Pazhampori)'], category: 'Veg', timing: '04:30 PM - 05:30 PM', timeMode: 'clock' },
    { title: 'Black Tea & Uzhunnuvada', items: ['Cardamom Black Tea', 'Crispy Medu Vada'], category: 'Veg', timing: '04:30 PM - 05:30 PM', timeMode: 'clock' },
    { title: 'Sulaimani & Sukhiyan', items: ['Sulaimani', 'Sweet Sukhiyan'], category: 'Veg', timing: '04:30 PM - 05:30 PM', timeMode: 'clock' },
    { title: 'Tea & Cutlet', items: ['Hot Milk Tea', 'Meat / Veg Cutlet'], category: 'Non-Veg', timing: '04:30 PM - 05:30 PM', timeMode: 'clock' },
  ],
  dinner: [
    { title: 'Steamed Rice & Veg Thoran', items: ['Steamed Rice', 'Payar Thoran', 'Pappadam', 'Morukari'], category: 'Veg', timing: '08:30 PM - 09:30 PM', timeMode: 'clock' },
    { title: 'Kanji & Payar Thoran', items: ['Puzhukal Rice Kanji', 'Vanpayar Thoran', 'Pappadam', 'Chammanthi'], category: 'Veg', timing: '08:30 PM - 09:30 PM', timeMode: 'clock' },
    { title: 'Chapathi & Veg Kurma', items: ['Wheat Chapathi', 'Vegetable Kurma', 'Black Tea'], category: 'Veg', timing: '08:30 PM - 09:30 PM', timeMode: 'clock' },
    { title: 'Rice & Fish Curry', items: ['Warm Rice', 'Fish Curry', 'Papad', 'Pickle'], category: 'Non-Veg', timing: '08:30 PM - 09:30 PM', timeMode: 'clock' },
    { title: 'Chapathi & Egg Curry', items: ['Soft Chapathi', 'Egg Roast Gravy'], category: 'Egg', timing: '08:30 PM - 09:30 PM', timeMode: 'clock' },
  ],
};

const MENU_DOC_REF = () =>
  firebase.firestore().collection('canteen_menu').doc('weekly_schedule');

const DEFAULT_TEMPLATE_DOC_REF = () =>
  firebase.firestore().collection('canteen_menu').doc('default_template');

const OVERRIDES_COL_REF = () =>
  firebase.firestore().collection('canteen_menu_overrides');

/**
 * Subscribe to real-time weekly schedule updates.
 * Automatically seeds Firestore if document does not exist yet.
 */
export function subscribeToWeeklyMenu(onUpdate, onError) {
  const docRef = MENU_DOC_REF();

  return docRef.onSnapshot(
    async (snapshot) => {
      if (snapshot.exists && snapshot.data()?.days) {
        onUpdate(snapshot.data().days);
      } else {
        // Document unseeded: Try to inherit from saved baseline template, or clean skeleton
        try {
          const tplSnap = await DEFAULT_TEMPLATE_DOC_REF().get();
          const initialDays = (tplSnap.exists && tplSnap.data()?.days)
            ? tplSnap.data().days
            : createEmptyWeeklyMenu();

          await docRef.set(
            {
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
              updatedBy: 'system-initial-seed',
              days: initialDays,
            },
            { merge: true }
          );
          onUpdate(initialDays);
        } catch (err) {
          console.warn('Could not initialize weekly menu from template, using clean skeleton:', err);
          onUpdate(createEmptyWeeklyMenu());
        }
      }
    },
    (error) => {
      console.error('Error listening to weekly menu:', error);
      if (onError) onError(error);
      onUpdate(createEmptyWeeklyMenu());
    }
  );
}

/**
 * Persist the entire weekly schedule.
 */
export async function saveWeeklyMenu(daysData, userEmail = 'admin') {
  const docRef = MENU_DOC_REF();
  await docRef.set(
    {
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: userEmail,
      days: daysData,
    },
    { merge: true }
  );
}

/**
 * Persist an individual day's menu.
 */
export async function saveDayMenu(dayKey, dayData, userEmail = 'admin') {
  const docRef = MENU_DOC_REF();
  await docRef.set(
    {
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: userEmail,
      days: {
        [dayKey]: dayData,
      },
    },
    { merge: true }
  );
}

/**
 * Subscribe to real-time editable default template updates.
 */
export function subscribeToDefaultTemplate(onUpdate, onError) {
  const docRef = DEFAULT_TEMPLATE_DOC_REF();

  return docRef.onSnapshot(
    async (snapshot) => {
      if (snapshot.exists && snapshot.data()?.days) {
        onUpdate(snapshot.data().days);
      } else {
        try {
          const initialDays = createEmptyWeeklyMenu();
          await docRef.set({
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'system-seed-defaults',
            days: initialDays,
          });
          onUpdate(initialDays);
        } catch (err) {
          console.warn('Could not seed default template to Firestore, using memory fallback:', err);
          onUpdate(createEmptyWeeklyMenu());
        }
      }
    },
    (error) => {
      console.error('Error listening to default template:', error);
      if (onError) onError(error);
      onUpdate(createEmptyWeeklyMenu());
    }
  );
}

/**
 * Save user-customized default template to Firestore.
 */
export async function saveDefaultTemplate(templateDays, userEmail = 'admin') {
  const docRef = DEFAULT_TEMPLATE_DOC_REF();
  await docRef.set(
    {
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: userEmail,
      days: templateDays,
    },
    { merge: true }
  );
}

/**
 * Reset active weekly schedule from Firestore custom default template.
 */
export async function resetWeeklyMenuToDefault(userEmail = 'admin') {
  let targetDefaults = null;
  try {
    const snap = await DEFAULT_TEMPLATE_DOC_REF().get();
    if (snap.exists && snap.data()?.days) {
      targetDefaults = snap.data().days;
    }
  } catch (err) {
    console.warn('Could not read custom default template, falling back to clean skeleton:', err);
  }

  if (!targetDefaults) {
    targetDefaults = createEmptyWeeklyMenu();
  }

  const docRef = MENU_DOC_REF();
  await docRef.set({
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: userEmail,
    days: targetDefaults,
  });
  return targetDefaults;
}

/**
 * Reset / Clear the entire week to empty (blank slate).
 */
export async function resetMenuToEmpty(userEmail = 'admin') {
  const empty = createEmptyWeeklyMenu();
  const docRef = MENU_DOC_REF();
  await docRef.set({
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: userEmail,
    days: empty,
  });
  return empty;
}

/**
 * Clear a specific day to blank dishes.
 */
export async function clearDayMenu(dayKey, userEmail = 'admin') {
  const blankDay = {
    dayKey,
    dayName: DAY_NAMES[dayKey] || dayKey,
    dayShort: DAY_SHORTS[dayKey] || dayKey,
    isArchived: false,
    archiveReason: '',
    note: '',
    breakfast: { title: '', items: [], category: '', timing: getCanonicalMealTiming(dayKey, 'breakfast'), isAvailable: true, isArchived: false },
    lunch: { title: '', items: [], category: '', timing: getCanonicalMealTiming(dayKey, 'lunch'), isAvailable: true, isArchived: false },
    evening: { title: '', items: [], category: '', timing: getCanonicalMealTiming(dayKey, 'evening'), isAvailable: true, isArchived: false },
    dinner: { title: '', items: [], category: '', timing: getCanonicalMealTiming(dayKey, 'dinner'), isAvailable: true, isArchived: false },
  };

  const docRef = MENU_DOC_REF();
  await docRef.set(
    {
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: userEmail,
      days: {
        [dayKey]: blankDay,
      },
    },
    { merge: true }
  );
  return blankDay;
}

/**
 * Archive or unarchive an entire day (e.g., Sunday closed).
 */
export async function archiveDay(dayKey, isArchived, reason = '', currentDayData = {}, userEmail = 'admin') {
  const updatedDay = {
    ...currentDayData,
    dayKey,
    isArchived,
    archiveReason: reason,
  };

  const docRef = MENU_DOC_REF();
  await docRef.set(
    {
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: userEmail,
      days: {
        [dayKey]: updatedDay,
      },
    },
    { merge: true }
  );
  return updatedDay;
}

/**
 * Archive or unarchive a specific meal slot (e.g., Evening Tea, Dinner).
 */
export async function archiveSlot(dayKey, slotKey, isArchived, reason = '', currentDayData = {}, userEmail = 'admin') {
  const currentSlot = currentDayData[slotKey] || {};
  const updatedSlot = {
    ...currentSlot,
    isArchived,
    isAvailable: !isArchived,
    archiveReason: reason,
  };

  const updatedDay = {
    ...currentDayData,
    dayKey,
    [slotKey]: updatedSlot,
  };

  const docRef = MENU_DOC_REF();
  await docRef.set(
    {
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: userEmail,
      days: {
        [dayKey]: updatedDay,
      },
    },
    { merge: true }
  );
  return updatedDay;
}

/**
 * Subscribe to date-specific special menu overrides (e.g., Eid feast, Ramadan Iftar).
 */
export function subscribeToDateOverrides(onUpdate, onError) {
  return OVERRIDES_COL_REF().onSnapshot(
    (snapshot) => {
      const overrides = {};
      snapshot.forEach((doc) => {
        overrides[doc.id] = { id: doc.id, ...doc.data() };
      });
      onUpdate(overrides);
    },
    (err) => {
      console.error('Error listening to date overrides:', err);
      if (onError) onError(err);
      onUpdate({});
    }
  );
}

/**
 * Save or update a date override document (keyed by YYYY-MM-DD).
 */
export async function saveDateOverride(dateKey, overrideData, userEmail = 'admin') {
  await OVERRIDES_COL_REF().doc(dateKey).set({
    ...overrideData,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: userEmail,
  });
}

/**
 * Delete a date override document.
 */
export async function deleteDateOverride(dateKey) {
  await OVERRIDES_COL_REF().doc(dateKey).delete();
}

/**
 * Save or update multiple date overrides in a single atomic batch
 */
export async function saveMultipleDatesOverride(datesArray, overrideData, userEmail = 'admin') {
  if (!Array.isArray(datesArray) || datesArray.length === 0) return;
  const batch = firebase.firestore().batch();
  const colRef = OVERRIDES_COL_REF();

  datesArray.forEach((dateKey) => {
    const docRef = colRef.doc(dateKey);
    batch.set(
      docRef,
      {
        ...overrideData,
        date: dateKey,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        updatedBy: userEmail,
      },
      { merge: true }
    );
  });

  await batch.commit();
}

/**
 * Save a date-range override (e.g. 2026-11-01 to 2026-11-15), with optional day-of-week filtering (e.g. only Fridays)
 */
export async function saveDateRangeOverride(startDateStr, endDateStr, overrideData, dayFilter = [], userEmail = 'admin') {
  if (!startDateStr || !endDateStr) return [];
  const dates = [];
  let curr = startDateStr;
  while (curr <= endDateStr) {
    const dow = getDayOfWeekShort(curr);
    if (!dayFilter || dayFilter.length === 0 || dayFilter.includes(dow)) {
      dates.push(curr);
    }
    curr = addDaysToDate(curr, 1);
  }
  await saveMultipleDatesOverride(dates, overrideData, userEmail);
  return dates;
}

/**
 * Delete multiple date overrides in a batch
 */
export async function deleteDateOverrides(datesArray) {
  if (!Array.isArray(datesArray) || datesArray.length === 0) return;
  const batch = firebase.firestore().batch();
  const colRef = OVERRIDES_COL_REF();

  datesArray.forEach((dateKey) => {
    const docRef = colRef.doc(dateKey);
    batch.delete(docRef);
  });

  await batch.commit();
}

/**
 * Resolves the effective menu for any specific calendar date, merging overrides on top of weekly routine.
 * Defaults meal timings to the universal dynamic meal schedule unless manually customized.
 */
export function getEffectiveMenuForDate(dateStr, weeklyMenu = null, overrides = {}) {
  const dow = getDayOfWeekShort(dateStr);
  const defDay = DEFAULT_WEEKLY_MENU[dow] || {};
  const routineDay = (weeklyMenu && weeklyMenu[dow]) ? weeklyMenu[dow] : defDay;
  const override = overrides ? overrides[dateStr] : null;

  // Retrieve dynamic universal schedule
  const dynamicSchedule = getCachedMealSchedule();
  const daySched = dynamicSchedule?.[dow] || dynamicSchedule?.fr;
  const dynamicBfTiming = daySched?.breakfast?.label || '07:30 AM - 08:45 AM';
  const dynamicLunchTiming = daySched?.lunch?.label || (dow === 'fr' ? '01:15 PM - 02:15 PM' : '12:45 PM - 02:00 PM');

  // Helper to ensure dynamic timing fallback and slot status preservation
  const dynamicEveningTiming = getCanonicalMealTiming(dow, 'evening') || '04:30 PM - 05:30 PM';
  const dynamicDinnerTiming = getCanonicalMealTiming(dow, 'dinner') || '08:30 PM - 09:30 PM';

  const resolveMealSlot = (routineSlot, overrideSlot, fallbackTiming, slotKey = '') => {
    const base = routineSlot || {};
    const ovr = overrideSlot || {};
    const isSpecial = Boolean(ovr.isSpecialMeal !== undefined ? ovr.isSpecialMeal : base.isSpecialMeal);

    const merged = {
      ...base,
      ...ovr,
      timing: ovr.timing || base.timing || fallbackTiming,
      timeMode: ovr.timeMode || base.timeMode || 'clock',
      slotStatus: ovr.slotStatus || base.slotStatus || (ovr.isArchived || base.isArchived ? 'leave' : isSpecial ? 'event' : 'serving'),
      isAvailable: ovr.slotStatus === 'leave' ? false : (ovr.isAvailable !== undefined ? ovr.isAvailable : base.isAvailable !== undefined ? base.isAvailable : true),
      isArchived: Boolean(ovr.slotStatus === 'leave' || ovr.isArchived || base.isArchived),
      isSpecialMeal: isSpecial,
      specialTitle: ovr.specialTitle || base.specialTitle || (isSpecial ? (ovr.title || base.title || '') : ''),
      specialSponsor: ovr.specialSponsor || base.specialSponsor || '',
      specialNotes: ovr.specialNotes || base.specialNotes || '',
      specialTiming: ovr.specialTiming || base.specialTiming || '',
      leaveReason: ovr.leaveReason || base.leaveReason || '',
      eventTitle: ovr.eventTitle || base.eventTitle || '',
      eventVenue: ovr.eventVenue || base.eventVenue || '',
      eventSponsor: ovr.eventSponsor || base.eventSponsor || '',
      eventNotes: ovr.eventNotes || base.eventNotes || '',
      fastingTitle: ovr.fastingTitle || base.fastingTitle || '',
    };
    return merged;
  };

  const bfSlot = resolveMealSlot(routineDay.breakfast, override?.breakfast, dynamicBfTiming, 'breakfast');
  const lunchSlot = resolveMealSlot(routineDay.lunch, override?.lunch, dynamicLunchTiming, 'lunch');
  const eveningSlot = resolveMealSlot(routineDay.evening, override?.evening, dynamicEveningTiming, 'evening');
  const dinnerSlot = resolveMealSlot(routineDay.dinner, override?.dinner, dynamicDinnerTiming, 'dinner');

  if (!override) {
    const isDayClosed = Boolean(routineDay.isArchived || routineDay.isClosed || routineDay.dayStatus === 'leave');
    return {
      ...routineDay,
      date: dateStr,
      isOverride: false,
      dayStatus: routineDay.dayStatus || (isDayClosed ? 'leave' : 'standard'),
      isClosed: isDayClosed,
      isArchived: isDayClosed,
      breakfast: bfSlot,
      lunch: lunchSlot,
      evening: eveningSlot,
      dinner: dinnerSlot,
    };
  }

  // Merge override on top of routine
  const isDayClosed = Boolean(
    override.dayStatus === 'leave' ||
    override.isHoliday ||
    override.isClosed ||
    routineDay.isArchived ||
    routineDay.isClosed
  );

  const resolvedDayStatus = override.dayStatus ||
    (isDayClosed ? 'leave' : override.occasion ? 'event' : routineDay.dayStatus || 'standard');

  return {
    ...routineDay,
    ...override,
    date: dateStr,
    isOverride: true,
    dayStatus: resolvedDayStatus,
    occasion: override.occasion || override.eventTitle || routineDay.note || '',
    note: override.note || override.occasion || override.eventTitle || routineDay.note || '',
    eventTitle: override.eventTitle || override.occasion || '',
    eventVenue: override.eventVenue || '',
    eventSponsor: override.eventSponsor || '',
    eventNotes: override.eventNotes || '',
    fastingTitle: override.fastingTitle || '',
    isHoliday: Boolean(override.isHoliday || isDayClosed),
    isClosed: isDayClosed,
    isArchived: isDayClosed,
    closureReason: override.closureReason || override.leaveReason || override.holidayReason || routineDay.closureReason || '',
    leaveReason: override.leaveReason || override.closureReason || override.holidayReason || '',
    holidayReason: override.holidayReason || override.closureReason || '',
    breakfast: bfSlot,
    lunch: lunchSlot,
    evening: eveningSlot,
    dinner: dinnerSlot,
  };
}

/**
 * Intelligently determine which meal slot is active / upcoming right now in IST,
 * taking into account archived days and archived meal slots.
 */
export function determineActiveMealSlot(timeHms, todayDayData = null) {
  const baseOrder = ['breakfast', 'lunch', 'evening', 'dinner'];

  // If today is marked archived/closed, skip today
  if (todayDayData?.isArchived) {
    return {
      slot: 'lunch',
      isTomorrow: true,
      statusLabel: 'Today: Canteen Closed',
      badgeColor: 'amber',
      isArchivedDay: true,
    };
  }

  // Time candidate
  let candidateSlot = 'breakfast';
  let isTomorrow = false;
  let statusLabel = 'This Morning';
  let badgeColor = 'amber';

  if (!timeHms || timeHms < '09:30:00') {
    candidateSlot = 'breakfast';
    statusLabel = 'This Morning';
    badgeColor = 'amber';
  } else if (timeHms >= '09:30:00' && timeHms < '14:00:00') {
    candidateSlot = 'lunch';
    statusLabel = 'Lunch Time';
    badgeColor = 'emerald';
  } else if (timeHms >= '14:00:00' && timeHms < '18:00:00') {
    candidateSlot = 'evening';
    statusLabel = 'Evening Refreshment';
    badgeColor = 'blue';
  } else {
    // After 18:00 (Cutoff) -> Shifts to Tomorrow
    candidateSlot = 'breakfast';
    isTomorrow = true;
    statusLabel = "Tomorrow's Schedule";
    badgeColor = 'purple';
  }

  // If we're looking at today's slots, check if candidate slot is archived
  if (!isTomorrow && todayDayData) {
    const startIdx = baseOrder.indexOf(candidateSlot);
    let foundActive = null;

    // Search forward for next non-archived slot today
    for (let i = startIdx; i < baseOrder.length; i++) {
      const s = baseOrder[i];
      const slotData = todayDayData[s];
      if (slotData && !slotData.isArchived && slotData.isAvailable !== false) {
        foundActive = s;
        break;
      }
    }

    if (foundActive) {
      candidateSlot = foundActive;
      if (foundActive === 'lunch') statusLabel = 'Lunch Time';
      if (foundActive === 'evening') statusLabel = 'Evening Refreshment';
      if (foundActive === 'dinner') statusLabel = 'Dinner / Supper';
    } else {
      // All remaining slots today are archived -> Advance to Tomorrow
      isTomorrow = true;
      candidateSlot = 'breakfast';
      statusLabel = "Tomorrow's Schedule (Today Completed)";
      badgeColor = 'purple';
    }
  }

  return {
    slot: candidateSlot,
    isTomorrow,
    statusLabel,
    badgeColor,
    isArchivedDay: false,
  };
}

const PRESETS_DOC_REF = () =>
  firebase.firestore().collection('canteen_menu').doc('dish_presets');

/**
 * Subscribe to dynamic dish presets from Firestore
 */
export function subscribeToDishPresets(onUpdate, onError) {
  const docRef = PRESETS_DOC_REF();
  return docRef.onSnapshot(
    async (snapshot) => {
      if (snapshot.exists && snapshot.data()?.presets) {
        onUpdate(snapshot.data().presets);
      } else {
        try {
          await docRef.set({
            presets: DISH_PRESETS,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          onUpdate(DISH_PRESETS);
        } catch (err) {
          console.warn('Could not seed presets to Firestore, using local defaults:', err);
          onUpdate(DISH_PRESETS);
        }
      }
    },
    (err) => {
      console.error('Error subscribing to dish presets:', err);
      if (onError) onError(err);
      onUpdate(DISH_PRESETS);
    }
  );
}

/**
 * Save complete dish presets map
 */
export async function saveDishPresets(presetsMap) {
  const docRef = PRESETS_DOC_REF();
  await docRef.set({
    presets: presetsMap,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

/**
 * Add a new preset to a specific meal slot (breakfast, lunch, evening, dinner)
 */
export async function addDishPreset(slotKey, preset) {
  const docRef = PRESETS_DOC_REF();
  const snap = await docRef.get();
  const current = snap.exists && snap.data()?.presets ? snap.data().presets : { ...DISH_PRESETS };

  const slotPresets = Array.isArray(current[slotKey]) ? [...current[slotKey]] : [];
  slotPresets.push({
    title: preset.title.trim(),
    items: Array.isArray(preset.items) ? preset.items : [preset.title.trim()],
    category: preset.category || 'Veg',
    ...(preset.timing ? { timing: preset.timing.trim() } : {}),
    ...(preset.timeMode ? { timeMode: preset.timeMode } : {}),
    ...(preset.specialTag ? { specialTag: preset.specialTag } : {}),
  });

  current[slotKey] = slotPresets;
  await saveDishPresets(current);
}

/**
 * Update an existing preset in a specific meal slot (Breakfast, Lunch, Evening, Dinner)
 */
export async function updateDishPreset(slotKey, oldTitle, updatedPreset) {
  const docRef = PRESETS_DOC_REF();
  const snap = await docRef.get();
  const current = snap.exists && snap.data()?.presets ? snap.data().presets : { ...DISH_PRESETS };

  if (Array.isArray(current[slotKey])) {
    const idx = current[slotKey].findIndex((p) => p.title === oldTitle);
    const newObj = {
      title: updatedPreset.title.trim(),
      items: Array.isArray(updatedPreset.items) ? updatedPreset.items : [updatedPreset.title.trim()],
      category: updatedPreset.category || 'Veg',
      ...(updatedPreset.timing ? { timing: updatedPreset.timing.trim() } : {}),
      ...(updatedPreset.timeMode ? { timeMode: updatedPreset.timeMode } : {}),
      ...(updatedPreset.specialTag ? { specialTag: updatedPreset.specialTag } : {}),
    };
    if (idx !== -1) {
      current[slotKey][idx] = newObj;
    } else {
      current[slotKey].push(newObj);
    }
    await saveDishPresets(current);
  }
}

/**
 * Delete a preset from a meal slot
 */
export async function deleteDishPreset(slotKey, titleToDelete) {
  const docRef = PRESETS_DOC_REF();
  const snap = await docRef.get();
  const current = snap.exists && snap.data()?.presets ? snap.data().presets : { ...DISH_PRESETS };

  if (Array.isArray(current[slotKey])) {
    current[slotKey] = current[slotKey].filter((p) => p.title !== titleToDelete);
    await saveDishPresets(current);
  }
}

/**
 * Bulk update a meal across multiple days (e.g. Monday + Tuesday + Wednesday)
 */
export async function bulkUpdateMealAcrossDays(dayKeysArray, slotKey, mealData, userEmail = 'admin') {
  const docRef = MENU_DOC_REF();
  const snap = await docRef.get();
  const currentDays = snap.exists && snap.data()?.days ? snap.data().days : { ...DEFAULT_WEEKLY_MENU };

  const updatedDays = { ...currentDays };
  dayKeysArray.forEach((dKey) => {
    if (updatedDays[dKey]) {
      updatedDays[dKey] = {
        ...updatedDays[dKey],
        [slotKey]: {
          ...updatedDays[dKey][slotKey],
          ...mealData,
        },
      };
    }
  });

  await docRef.set({
    days: updatedDays,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: userEmail,
  }, { merge: true });
}

