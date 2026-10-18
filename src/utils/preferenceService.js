import firebase from '../firebase/config';

export const DEFAULT_PREFERENCES = [
  {
    id: 'beef',
    labelEn: 'Beef',
    labelMl: 'ബീഫ്',
    icon: 'Beef',
    defaultVal: true,
    isActive: true,
    order: 1,
  },
  {
    id: 'chicken',
    labelEn: 'Chicken',
    labelMl: 'ചിക്കൻ',
    icon: 'Drumstick',
    defaultVal: true,
    isActive: true,
    order: 2,
  },
  {
    id: 'fish',
    labelEn: 'Fish',
    labelMl: 'മത്സ്യം',
    icon: 'Fish',
    defaultVal: true,
    isActive: true,
    order: 3,
  },
  {
    id: 'mutton',
    labelEn: 'Mutton',
    labelMl: 'മട്ടൺ',
    icon: 'UtensilsCrossed',
    defaultVal: true,
    isActive: true,
    order: 4,
  },
];

const PREFS_DOC_REF = () =>
  firebase.firestore().collection('settings').doc('meal_preferences');

/**
 * Real-time listener for meal preferences.
 * Automatically seeds defaults if not initialized.
 */
export function subscribeToPreferences(onUpdate, onError) {
  const docRef = PREFS_DOC_REF();

  return docRef.onSnapshot(
    async (snapshot) => {
      if (snapshot.exists && Array.isArray(snapshot.data()?.list)) {
        onUpdate(snapshot.data().list);
      } else {
        try {
          await docRef.set({
            list: DEFAULT_PREFERENCES,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          }, { merge: true });
          onUpdate(DEFAULT_PREFERENCES);
        } catch (err) {
          console.warn('Could not seed preferences to Firestore, using defaults:', err);
          onUpdate(DEFAULT_PREFERENCES);
        }
      }
    },
    (err) => {
      console.error('Error in preferences subscription:', err);
      if (onError) onError(err);
      onUpdate(DEFAULT_PREFERENCES);
    }
  );
}

/**
 * Save complete list of meal preferences
 */
export async function savePreferences(list) {
  const docRef = PREFS_DOC_REF();
  await docRef.set({
    list,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

/**
 * Add a new meal preference option
 */
export async function addPreference(newPref) {
  const docRef = PREFS_DOC_REF();
  const snap = await docRef.get();
  const current = (snap.exists && Array.isArray(snap.data()?.list))
    ? snap.data().list
    : DEFAULT_PREFERENCES;

  // Sanitize ID
  const cleanId = (newPref.id || newPref.labelEn)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]/g, '_');

  if (current.some(p => p.id === cleanId)) {
    throw new Error(`A preference with ID "${cleanId}" already exists.`);
  }

  const prefToInsert = {
    id: cleanId,
    labelEn: newPref.labelEn.trim(),
    labelMl: (newPref.labelMl || newPref.labelEn).trim(),
    icon: newPref.icon || 'Utensils',
    defaultVal: newPref.defaultVal !== undefined ? newPref.defaultVal : true,
    isActive: true,
    order: current.length + 1,
  };

  const updated = [...current, prefToInsert];
  await savePreferences(updated);
  return prefToInsert;
}

/**
 * Update an existing preference
 */
export async function updatePreference(id, updates) {
  const docRef = PREFS_DOC_REF();
  const snap = await docRef.get();
  const current = (snap.exists && Array.isArray(snap.data()?.list))
    ? snap.data().list
    : DEFAULT_PREFERENCES;

  const updated = current.map(item => {
    if (item.id === id) {
      return { ...item, ...updates };
    }
    return item;
  });

  await savePreferences(updated);
}

/**
 * Delete a preference option.
 * Note: This only removes it from the active options list.
 * Any existing student data in obj2 for this key is safely preserved.
 */
export async function deletePreference(id) {
  const docRef = PREFS_DOC_REF();
  const snap = await docRef.get();
  const current = (snap.exists && Array.isArray(snap.data()?.list))
    ? snap.data().list
    : DEFAULT_PREFERENCES;

  const updated = current.filter(item => item.id !== id);
  await savePreferences(updated);
}
