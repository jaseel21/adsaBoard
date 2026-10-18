import firebase from '../firebase/config';

// Verified canonical Alathurpadi Dars canteen schedule (System Baseline)
export const DEFAULT_WEEKLY_MENU = {
  su: {
    dayKey: 'su',
    dayName: 'Sunday',
    dayShort: 'Sun',
    isArchived: false,
    archiveReason: '',
    note: 'Sunday Special Canteen Routine',
    breakfast: {
      title: 'Porotta & Kadala',
      items: ['Kerala Porotta', 'Spicy Kadala Curry', 'Hot Tea'],
      category: 'Veg',
      timing: '07:00 AM - 08:30 AM',
      isAvailable: true,
      isArchived: false,
    },
    lunch: {
      title: 'Rice & Beef/Fish Curry',
      items: ['Matta Rice', 'Beef Roast / Curry', 'Fried Fish', 'Sambar', 'Lime Pickle'],
      category: 'Non-Veg',
      timing: '12:30 PM - 02:00 PM',
      isAvailable: true,
      isArchived: false,
    },
    evening: {
      title: 'Sulaimani & Snacks',
      items: ['Malabar Sulaimani Tea', 'Parippuvada / Samosa'],
      category: 'Veg',
      timing: '04:30 PM - 05:30 PM',
      isAvailable: true,
      isArchived: false,
    },
    dinner: {
      title: 'Steamed Rice & Veg Thoran',
      items: ['Steamed Rice', 'Payar Thoran', 'Pappadam', 'Morukari'],
      category: 'Veg',
      timing: '08:30 PM - 09:30 PM',
      isAvailable: true,
      isArchived: false,
    },
  },
  mo: {
    dayKey: 'mo',
    dayName: 'Monday',
    dayShort: 'Mon',
    isArchived: false,
    archiveReason: '',
    note: 'Standard Weekday Routine',
    breakfast: {
      title: 'Appam & Veg Curry',
      items: ['Vellayappam', 'Mixed Vegetable Stew', 'Milk Tea'],
      category: 'Veg',
      timing: '07:00 AM - 08:30 AM',
      isAvailable: true,
      isArchived: false,
    },
    lunch: {
      title: 'Rice & Chicken/Fish Curry',
      items: ['Matta Rice', 'Chicken Curry', 'Ayala Fish Curry', 'Cabbage Thoran', 'Pickle'],
      category: 'Non-Veg',
      timing: '12:30 PM - 02:00 PM',
      isAvailable: true,
      isArchived: false,
    },
    evening: {
      title: 'Tea & Snacks',
      items: ['Cardamom Black Tea', 'Uzhunnuvada / Biscuit'],
      category: 'Veg',
      timing: '04:30 PM - 05:30 PM',
      isAvailable: true,
      isArchived: false,
    },
    dinner: {
      title: 'Rice & Fish Curry',
      items: ['Warm Rice', 'Fish Curry', 'Papad'],
      category: 'Non-Veg',
      timing: '08:30 PM - 09:30 PM',
      isAvailable: true,
      isArchived: false,
    },
  },
  tu: {
    dayKey: 'tu',
    dayName: 'Tuesday',
    dayShort: 'Tue',
    isArchived: false,
    archiveReason: '',
    note: 'Standard Weekday Routine',
    breakfast: {
      title: 'Idli & Sambar',
      items: ['Steamed Idli', 'Vegetable Sambar', 'Coconut Chutney', 'Tea'],
      category: 'Veg',
      timing: '07:00 AM - 08:30 AM',
      isAvailable: true,
      isArchived: false,
    },
    lunch: {
      title: 'Rice & Fish Curry/Veg',
      items: ['Matta Rice', 'Fresh Fish Curry', 'Aviyal / Pulissery', 'Pickle'],
      category: 'Non-Veg',
      timing: '12:30 PM - 02:00 PM',
      isAvailable: true,
      isArchived: false,
    },
    evening: {
      title: 'Tea & Snacks',
      items: ['Sulaimani', 'Banana Fritters (Pazhampori)'],
      category: 'Veg',
      timing: '04:30 PM - 05:30 PM',
      isAvailable: true,
      isArchived: false,
    },
    dinner: {
      title: 'Rice & Veg Curry',
      items: ['Rice', 'Sambar', 'Morukari'],
      category: 'Veg',
      timing: '08:30 PM - 09:30 PM',
      isAvailable: true,
      isArchived: false,
    },
  },
  we: {
    dayKey: 'we',
    dayName: 'Wednesday',
    dayShort: 'Wed',
    isArchived: false,
    archiveReason: '',
    note: 'Mid-week Canteen Special',
    breakfast: {
      title: 'Dosa & Chutney',
      items: ['Crispy Dosa', 'Tomato Chutney', 'Coconut Chutney', 'Tea'],
      category: 'Veg',
      timing: '07:00 AM - 08:30 AM',
      isAvailable: true,
      isArchived: false,
    },
    lunch: {
      title: 'Rice & Meat Curry',
      items: ['Matta Rice', 'Kerala Beef / Mutton Curry', 'Fish Fry', 'Beetroot Thoran', 'Pickle'],
      category: 'Non-Veg',
      timing: '12:30 PM - 02:00 PM',
      isAvailable: true,
      isArchived: false,
    },
    evening: {
      title: 'Tea & Snacks',
      items: ['Black Tea', 'Sukhiyan / Parippuvada'],
      category: 'Veg',
      timing: '04:30 PM - 05:30 PM',
      isAvailable: true,
      isArchived: false,
    },
    dinner: {
      title: 'Kanji & Payar Thoran',
      items: ['Puzhukal Rice Kanji', 'Vanpayar Thoran', 'Pappadam', 'Chammanthi'],
      category: 'Veg',
      timing: '08:30 PM - 09:30 PM',
      isAvailable: true,
      isArchived: false,
    },
  },
  th: {
    dayKey: 'th',
    dayName: 'Thursday',
    dayShort: 'Thu',
    isArchived: false,
    archiveReason: '',
    note: 'Thursday Traditional Menu',
    breakfast: {
      title: 'Puttu & Kadala',
      items: ['Rice Puttu', 'Spicy Kadala Curry', 'Pappadam', 'Black Tea'],
      category: 'Veg',
      timing: '07:00 AM - 08:30 AM',
      isAvailable: true,
      isArchived: false,
    },
    lunch: {
      title: 'Rice & Fish Curry',
      items: ['Matta Rice', 'Kottayam Style Fish Curry', 'Aviyal', 'Papad', 'Pickle'],
      category: 'Non-Veg',
      timing: '12:30 PM - 02:00 PM',
      isAvailable: true,
      isArchived: false,
    },
    evening: {
      title: 'Tea & Snacks',
      items: ['Sulaimani', 'Mutta Bajji / Samosa'],
      category: 'Egg',
      timing: '04:30 PM - 05:30 PM',
      isAvailable: true,
      isArchived: false,
    },
    dinner: {
      title: 'Rice & Ozhukku Curry',
      items: ['Steamed Rice', 'Fish / Veg Curry', 'Pickle'],
      category: 'Non-Veg',
      timing: '08:30 PM - 09:30 PM',
      isAvailable: true,
      isArchived: false,
    },
  },
  fr: {
    dayKey: 'fr',
    dayName: 'Friday',
    dayShort: 'Fri',
    isArchived: false,
    archiveReason: '',
    note: "Jum'ah Mubarak Special Lunch - Service starts after 1:15 PM",
    breakfast: {
      title: 'Pathiri & Curry',
      items: ['Thin Ari Pathiri', 'Chicken Curry / Mutton Gravy', 'Cardamom Tea'],
      category: 'Non-Veg',
      timing: '07:00 AM - 08:30 AM',
      isAvailable: true,
      isArchived: false,
    },
    lunch: {
      title: 'Special Biriyani / Ghee Rice',
      items: ['Malabar Dum Biriyani', 'Ghee Rice & Chicken Roast', 'Date Pickle', 'Raita', 'Pappadam'],
      category: 'Special',
      timing: '01:15 PM - 02:30 PM',
      isAvailable: true,
      isArchived: false,
    },
    evening: {
      title: 'Sulaimani & Sweet Snacks',
      items: ['Sulaimani', 'Pazhampori / Halwa'],
      category: 'Veg',
      timing: '04:30 PM - 05:30 PM',
      isAvailable: true,
      isArchived: false,
    },
    dinner: {
      title: 'Chapathi & Veg Kurma',
      items: ['Wheat Chapathi', 'Vegetable Kurma', 'Tea'],
      category: 'Veg',
      timing: '08:30 PM - 09:30 PM',
      isAvailable: true,
      isArchived: false,
    },
  },
  sa: {
    dayKey: 'sa',
    dayName: 'Saturday',
    dayShort: 'Sat',
    isArchived: false,
    archiveReason: '',
    note: 'Weekend Menu Schedule',
    breakfast: {
      title: 'Porotta & Egg Curry',
      items: ['Kerala Porotta', 'Egg Roast Curry', 'Hot Tea'],
      category: 'Egg',
      timing: '07:00 AM - 08:30 AM',
      isAvailable: true,
      isArchived: false,
    },
    lunch: {
      title: 'Rice & Fish Curry',
      items: ['Matta Rice', 'Fish Curry & Fry', 'Thoran', 'Sambar', 'Pickle'],
      category: 'Non-Veg',
      timing: '12:30 PM - 02:00 PM',
      isAvailable: true,
      isArchived: false,
    },
    evening: {
      title: 'Tea & Snacks',
      items: ['Milk Tea', 'Parippuvada / Biscuits'],
      category: 'Veg',
      timing: '04:30 PM - 05:30 PM',
      isAvailable: true,
      isArchived: false,
    },
    dinner: {
      title: 'Rice & Fish Curry',
      items: ['Rice', 'Fish Gravy', 'Morukari'],
      category: 'Non-Veg',
      timing: '08:30 PM - 09:30 PM',
      isAvailable: true,
      isArchived: false,
    },
  },
};

const DAY_NAMES = {
  su: 'Sunday',
  mo: 'Monday',
  tu: 'Tuesday',
  we: 'Wednesday',
  th: 'Thursday',
  fr: 'Friday',
  sa: 'Saturday',
};

const DAY_SHORTS = {
  su: 'Sun',
  mo: 'Mon',
  tu: 'Tue',
  we: 'Wed',
  th: 'Thu',
  fr: 'Fri',
  sa: 'Sat',
};

/**
 * Creates a completely blank 7-day schedule map with empty meal slots.
 */
export function createEmptyWeeklyMenu() {
  const emptyMenu = {};
  ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'].forEach((k) => {
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
        category: 'Veg',
        timing: '07:00 AM - 08:30 AM',
        isAvailable: true,
        isArchived: false,
      },
      lunch: {
        title: '',
        items: [],
        category: 'Non-Veg',
        timing: '12:30 PM - 02:00 PM',
        isAvailable: true,
        isArchived: false,
      },
      evening: {
        title: '',
        items: [],
        category: 'Veg',
        timing: '04:30 PM - 05:30 PM',
        isAvailable: true,
        isArchived: false,
      },
      dinner: {
        title: '',
        items: [],
        category: 'Veg',
        timing: '08:30 PM - 09:30 PM',
        isAvailable: false,
        isArchived: false,
      },
    };
  });
  return emptyMenu;
}

// Curated library of traditional Malabar Dars delicacies for fast autocomplete / preset insertion
export const DISH_PRESETS = {
  breakfast: [
    { title: 'Porotta & Kadala', items: ['Kerala Porotta', 'Spicy Kadala Curry', 'Hot Tea'], category: 'Veg' },
    { title: 'Appam & Veg Curry', items: ['Vellayappam', 'Mixed Veg Stew', 'Milk Tea'], category: 'Veg' },
    { title: 'Appam & Egg Roast', items: ['Vellayappam', 'Egg Roast', 'Tea'], category: 'Egg' },
    { title: 'Idli & Sambar', items: ['Steamed Idli', 'Vegetable Sambar', 'Coconut Chutney'], category: 'Veg' },
    { title: 'Dosa & Chutney', items: ['Crispy Dosa', 'Tomato Chutney', 'Coconut Chutney'], category: 'Veg' },
    { title: 'Puttu & Kadala', items: ['Rice Puttu', 'Kadala Curry', 'Pappadam'], category: 'Veg' },
    { title: 'Puttu & Payar', items: ['Rice Puttu', 'Cherupayar Puzhukku', 'Pappadam'], category: 'Veg' },
    { title: 'Pathiri & Chicken Curry', items: ['Ari Pathiri', 'Chicken Curry', 'Cardamom Tea'], category: 'Non-Veg' },
    { title: 'Porotta & Egg Curry', items: ['Kerala Porotta', 'Egg Curry', 'Hot Tea'], category: 'Egg' },
    { title: 'Poori & Masala', items: ['Fluffy Poori', 'Potato Masala', 'Tea'], category: 'Veg' },
  ],
  lunch: [
    { title: 'Rice & Beef/Fish Curry', items: ['Matta Rice', 'Beef Roast / Curry', 'Fried Fish', 'Sambar', 'Pickle'], category: 'Non-Veg' },
    { title: 'Rice & Chicken/Fish Curry', items: ['Matta Rice', 'Chicken Curry', 'Ayala Fish Curry', 'Thoran', 'Pickle'], category: 'Non-Veg' },
    { title: 'Special Dum Biriyani', items: ['Malabar Dum Biriyani', 'Chicken 65', 'Date Pickle', 'Raita', 'Papad'], category: 'Special' },
    { title: 'Ghee Rice & Chicken Roast', items: ['Neychoru (Ghee Rice)', 'Chicken Roast', 'Dalcha / Kurma', 'Salad'], category: 'Special' },
    { title: 'Rice & Fish Curry/Veg', items: ['Matta Rice', 'Fresh Fish Curry', 'Aviyal / Pulissery', 'Pickle'], category: 'Non-Veg' },
    { title: 'Rice & Meat Curry', items: ['Matta Rice', 'Kerala Beef Curry', 'Fish Fry', 'Beetroot Thoran'], category: 'Non-Veg' },
    { title: 'Traditional Sadya (Veg)', items: ['Matta Rice', 'Sambar', 'Aviyal', 'Thoran', 'Payasam', 'Papad'], category: 'Veg' },
  ],
  evening: [
    { title: 'Sulaimani & Snacks', items: ['Hot Sulaimani', 'Parippuvada / Samosa'], category: 'Veg' },
    { title: 'Tea & Pazhampori', items: ['Milk Tea', 'Banana Fritters (Pazhampori)'], category: 'Veg' },
    { title: 'Black Tea & Uzhunnuvada', items: ['Cardamom Black Tea', 'Crispy Medu Vada'], category: 'Veg' },
    { title: 'Sulaimani & Sukhiyan', items: ['Sulaimani', 'Sweet Sukhiyan'], category: 'Veg' },
    { title: 'Tea & Cutlet', items: ['Hot Milk Tea', 'Meat / Veg Cutlet'], category: 'Non-Veg' },
  ],
  dinner: [
    { title: 'Steamed Rice & Veg Thoran', items: ['Steamed Rice', 'Payar Thoran', 'Pappadam', 'Morukari'], category: 'Veg' },
    { title: 'Kanji & Payar Thoran', items: ['Puzhukal Rice Kanji', 'Vanpayar Thoran', 'Pappadam', 'Chammanthi'], category: 'Veg' },
    { title: 'Chapathi & Veg Kurma', items: ['Wheat Chapathi', 'Vegetable Kurma', 'Black Tea'], category: 'Veg' },
    { title: 'Rice & Fish Curry', items: ['Warm Rice', 'Fish Curry', 'Papad', 'Pickle'], category: 'Non-Veg' },
    { title: 'Chapathi & Egg Curry', items: ['Soft Chapathi', 'Egg Roast Gravy'], category: 'Egg' },
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
        // Unseeded: Seed initial canonical menu into Firestore
        try {
          await docRef.set(
            {
              updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
              updatedBy: 'system-initial-seed',
              days: DEFAULT_WEEKLY_MENU,
            },
            { merge: true }
          );
          onUpdate(DEFAULT_WEEKLY_MENU);
        } catch (err) {
          console.warn('Failed to seed default menu to Firestore, falling back locally:', err);
          onUpdate(DEFAULT_WEEKLY_MENU);
        }
      }
    },
    (error) => {
      console.error('Error listening to weekly menu:', error);
      if (onError) onError(error);
      onUpdate(DEFAULT_WEEKLY_MENU);
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
        // Seed initial default template with baseline
        try {
          await docRef.set({
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: 'system-seed-defaults',
            days: DEFAULT_WEEKLY_MENU,
          });
          onUpdate(DEFAULT_WEEKLY_MENU);
        } catch (err) {
          console.warn('Could not seed default template to Firestore, using memory fallback:', err);
          onUpdate(DEFAULT_WEEKLY_MENU);
        }
      }
    },
    (error) => {
      console.error('Error listening to default template:', error);
      if (onError) onError(error);
      onUpdate(DEFAULT_WEEKLY_MENU);
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
  let targetDefaults = DEFAULT_WEEKLY_MENU;
  try {
    const snap = await DEFAULT_TEMPLATE_DOC_REF().get();
    if (snap.exists && snap.data()?.days) {
      targetDefaults = snap.data().days;
    }
  } catch (err) {
    console.warn('Could not read custom default template, falling back to canonical defaults:', err);
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
    breakfast: { title: '', items: [], category: 'Veg', timing: '07:00 AM - 08:30 AM', isAvailable: true, isArchived: false },
    lunch: { title: '', items: [], category: 'Non-Veg', timing: '12:30 PM - 02:00 PM', isAvailable: true, isArchived: false },
    evening: { title: '', items: [], category: 'Veg', timing: '04:30 PM - 05:30 PM', isAvailable: true, isArchived: false },
    dinner: { title: '', items: [], category: 'Veg', timing: '08:30 PM - 09:30 PM', isAvailable: false, isArchived: false },
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
  });

  current[slotKey] = slotPresets;
  await saveDishPresets(current);
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

