import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

/**
 * Board Notice & Event Presets
 * Pre-engineered institutional milestones tailored for Alathurpadi Dars:
 * - Monthly Dars Leave (മാസാന്ത ദർസ് അവധി / മാസാവധി)
 * - Nikah Ceremony (നിക്കാഹ് മജ്‌ലിസ് / സൽക്കാരം)
 * - Temporary Canteen Close (താത്കാലിക കാന്റീൻ പ്രവർത്തനം നിർത്തിവെക്കൽ)
 * - Special Dars Feast (പ്രത്യേക ദർസ് വിരുന്ന്)
 * - Exam Study Leave (പരീക്ഷാ അവധി)
 * - General Campus Notice (പൊതു അറിയിപ്പ്)
 */
export const BOARD_NOTICE_PRESETS = [
  {
    id: 'dars_leave',
    category: 'dars_leave',
    title: 'Monthly Dars Leave',
    titleMl: 'മാസാന്ത ദർസ് അവധി',
    badgeText: 'മാസാവധി',
    badgeTextEn: 'Monthly Leave',
    severity: 'info',
    defaultMealScope: 'both',
    defaultCanteenStatus: 'normal_with_leave',
    description: 'Monthly institutional Dars holiday. Students on scheduled home leave; tokens marked off.',
    descriptionMl: 'സ്ഥാപനത്തിലെ മാസാന്ത ദർസ് അവധി. വിദ്യാർത്ഥികൾക്ക് അവധി അനുവദിച്ചിരിക്കുന്നു.',
    iconName: 'calendar',
    defaultAutoBulkLeave: true,
  },
  {
    id: 'nikah_ceremony',
    category: 'nikah',
    title: 'Nikah Ceremony / Feast',
    titleMl: 'നിക്കാഹ് മജ്‌ലിസ് / സൽക്കാരം',
    badgeText: 'നിക്കാഹ് സൽക്കാരം',
    badgeTextEn: 'Nikah Feast',
    severity: 'festive',
    defaultMealScope: 'lunch',
    defaultCanteenStatus: 'closed',
    description: 'Special Nikah feast arranged. Canteen noon mess suspended; lunch tokens marked on leave.',
    descriptionMl: 'നിക്കാഹ് സൽക്കാരത്തോടനുബന്ധിച്ച് കാന്റീൻ ഉച്ചഭക്ഷണം ഒഴിവാക്കിയിരിക്കുന്നു.',
    iconName: 'sparkles',
    defaultAutoBulkLeave: true,
  },
  {
    id: 'temporary_close',
    category: 'temporary_close',
    title: 'Temporary Canteen Close',
    titleMl: 'താത്കാലിക കാന്റീൻ അവധി',
    badgeText: 'കാന്റീൻ അവധി',
    badgeTextEn: 'Canteen Closed',
    severity: 'critical',
    defaultMealScope: 'both',
    defaultCanteenStatus: 'closed',
    description: 'Canteen meal service temporarily suspended for kitchen maintenance or holiday.',
    descriptionMl: 'അറ്റകുറ്റപ്പണികൾ / അവധി കാരണം കാന്റീൻ പ്രവർത്തനം താത്കാലികമായി നിർത്തിവെച്ചിരിക്കുന്നു.',
    iconName: 'alert-triangle',
    defaultAutoBulkLeave: true,
  },
  {
    id: 'special_feast',
    category: 'special_feast',
    title: 'Special Dars Feast',
    titleMl: 'പ്രത്യേക ദർസ് വിരുന്ന്',
    badgeText: 'പ്രത്യേക വിരുന്ന്',
    badgeTextEn: 'Special Feast',
    severity: 'festive',
    defaultMealScope: 'lunch',
    defaultCanteenStatus: 'open_special',
    description: 'Festive dining arranged for students and staff. Special menu in effect.',
    descriptionMl: 'വിദ്യാർത്ഥികൾക്കായി പ്രത്യേക വിരുന്ന് ക്രമീകരിച്ചിരിക്കുന്നു.',
    iconName: 'chef-hat',
    defaultAutoBulkLeave: false,
  },
  {
    id: 'exam_leave',
    category: 'exam_leave',
    title: 'Exam Study Vacation',
    titleMl: 'പരീക്ഷാ അവധി',
    badgeText: 'പരീക്ഷാ അവധി',
    badgeTextEn: 'Exam Vacation',
    severity: 'warning',
    defaultMealScope: 'both',
    defaultCanteenStatus: 'normal_with_leave',
    description: 'Academic exam vacation in effect. Dining tokens marked as per leave roster.',
    descriptionMl: 'പരീക്ഷാ അവധി പ്രമാണിച്ച് വിദ്യാർത്ഥികൾക്ക് ലീവ് രേഖപ്പെടുത്തിയിരിക്കുന്നു.',
    iconName: 'book-open',
    defaultAutoBulkLeave: true,
  },
  {
    id: 'general',
    category: 'general',
    title: 'Campus Notice',
    titleMl: 'പൊതു അറിയിപ്പ്',
    badgeText: 'അറിയിപ്പ്',
    badgeTextEn: 'Notice',
    severity: 'info',
    defaultMealScope: 'both',
    defaultCanteenStatus: 'notice_only',
    description: 'Important dining notification for campus students and faculty.',
    descriptionMl: 'കാന്റീനുമായി ബന്ധപ്പെട്ട പൊതു അറിയിപ്പ്.',
    iconName: 'info',
    defaultAutoBulkLeave: false,
  },
];

const BOARD_NOTICES_DOC_REF = () =>
  firebase.firestore().collection('settings').doc('board_notices');

let cachedNotices = [];

/**
 * Real-time listener for Board Notices and Date Events.
 * Persisted in Firestore settings/board_notices.
 * Automatically seeds initial document if non-existent.
 */
export function subscribeToBoardNotices(onUpdate, onError) {
  const docRef = BOARD_NOTICES_DOC_REF();

  return docRef.onSnapshot(
    async (snapshot) => {
      if (snapshot.exists) {
        const data = snapshot.data() || {};
        const rawList = Array.isArray(data.notices) ? data.notices : [];
        // Sort: active/upcoming first by startDate desc
        const sorted = [...rawList].sort((a, b) => {
          const dateDiff = (b.startDate || '').localeCompare(a.startDate || '');
          if (dateDiff !== 0) return dateDiff;
          return (b.createdAt || '').localeCompare(a.createdAt || '');
        });
        cachedNotices = sorted;
        if (typeof onUpdate === 'function') {
          onUpdate(sorted);
        }
      } else {
        // Seed initial empty structure
        try {
          await docRef.set({
            notices: [],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedByName: 'System Auto-Seed',
          });
          cachedNotices = [];
          if (typeof onUpdate === 'function') {
            onUpdate([]);
          }
        } catch (seedErr) {
          console.warn('[boardNoticeService] Could not seed default board_notices:', seedErr);
          if (typeof onUpdate === 'function') {
            onUpdate([]);
          }
        }
      }
    },
    (err) => {
      console.error('[boardNoticeService] Snapshot error:', err);
      if (typeof onError === 'function') {
        onError(err);
      } else if (typeof onUpdate === 'function') {
        onUpdate(cachedNotices);
      }
    }
  );
}

/**
 * Returns currently cached notices synchronously.
 */
export function getCachedBoardNotices() {
  return cachedNotices;
}

/**
 * Filters notices applicable to a specific target date (YYYY-MM-DD) and optional meal ('breakfast' | 'lunch').
 */
export function getNoticesForDate(notices = [], targetDate, meal = null) {
  if (!targetDate || !Array.isArray(notices)) return [];
  return notices.filter((notice) => {
    const sDate = notice.startDate;
    const eDate = notice.endDate || notice.startDate;
    const isInDateRange = targetDate >= sDate && targetDate <= eDate;
    if (!isInDateRange) return false;

    if (meal && notice.mealScope && notice.mealScope !== 'both') {
      return notice.mealScope === meal;
    }
    return true;
  });
}

/**
 * Determines whether the canteen is marked as closed for a specific date and meal.
 */
export function isCanteenClosedForDate(notices = [], targetDate, meal = null) {
  const matching = getNoticesForDate(notices, targetDate, meal);
  return matching.some((n) => n.canteenStatus === 'closed');
}

/**
 * Creates a new Board Notice in Firestore with audit logging.
 */
export async function createBoardNotice(noticeData, actor = {}) {
  const docRef = BOARD_NOTICES_DOC_REF();
  const id = noticeData.id || `notice_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newNotice = {
    id,
    title: noticeData.title?.trim() || 'Notice Note',
    titleMl: noticeData.titleMl?.trim() || noticeData.title?.trim() || 'അറിയിപ്പ്',
    category: noticeData.category || 'general',
    startDate: noticeData.startDate,
    endDate: noticeData.endDate || noticeData.startDate,
    mealScope: noticeData.mealScope || 'both', // 'both' | 'breakfast' | 'lunch'
    canteenStatus: noticeData.canteenStatus || 'normal_with_leave', // 'closed' | 'open_special' | 'normal_with_leave' | 'notice_only'
    targetBatches: noticeData.targetBatches || 'all',
    description: noticeData.description?.trim() || '',
    badgeText: noticeData.badgeText?.trim() || '',
    badgeTextEn: noticeData.badgeTextEn?.trim() || '',
    severity: noticeData.severity || 'info', // 'info' | 'warning' | 'critical' | 'festive'
    isPinnedToBanner: noticeData.isPinnedToBanner !== false,
    autoBulkLeaveApplied: Boolean(noticeData.autoBulkLeaveApplied),
    affectedTokenCount: Number(noticeData.affectedTokenCount) || 0,
    createdAt: now,
    updatedAt: now,
    createdBy: {
      uid: actor.uid || 'admin',
      displayName: actor.displayName || actor.email || 'Admin',
      role: actor.role || 'canteen_committee',
    },
  };

  const snap = await docRef.get();
  const currentNotices = snap.exists && Array.isArray(snap.data()?.notices) ? snap.data().notices : [];
  const updatedNotices = [newNotice, ...currentNotices];

  await docRef.set(
    {
      notices: updatedNotices,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastUpdatedBy: actor.displayName || actor.email || 'Admin',
    },
    { merge: true }
  );

  // Record audit log
  await logAuditEvent({
    category: AUDIT_CATEGORIES.SYSTEM,
    action: 'BOARD_NOTICE_CREATED',
    severity: AUDIT_SEVERITIES.WARNING,
    actor: {
      uid: actor.uid || 'admin',
      displayName: actor.displayName || 'Admin',
      email: actor.email || '',
      role: actor.role || 'canteen_committee',
    },
    target: {
      type: 'board_notice',
      id,
      label: newNotice.title,
    },
    changes: {
      diffSummary: `Created Board Notice "${newNotice.title}" (${newNotice.startDate} to ${newNotice.endDate})`,
      category: newNotice.category,
      mealScope: newNotice.mealScope,
      canteenStatus: newNotice.canteenStatus,
      autoBulkLeaveApplied: newNotice.autoBulkLeaveApplied,
    },
  });

  return newNotice;
}

/**
 * Updates an existing Board Notice in Firestore.
 */
export async function updateBoardNotice(noticeId, updateFields, actor = {}) {
  const docRef = BOARD_NOTICES_DOC_REF();
  const now = new Date().toISOString();

  const snap = await docRef.get();
  if (!snap.exists) throw new Error('Board notices document does not exist.');

  const currentNotices = Array.isArray(snap.data()?.notices) ? snap.data().notices : [];
  const idx = currentNotices.findIndex((n) => n.id === noticeId);
  if (idx === -1) throw new Error(`Notice with ID "${noticeId}" not found.`);

  const oldNotice = currentNotices[idx];
  const updatedNotice = {
    ...oldNotice,
    ...updateFields,
    updatedAt: now,
    updatedBy: {
      uid: actor.uid || 'admin',
      displayName: actor.displayName || actor.email || 'Admin',
      role: actor.role || 'canteen_committee',
    },
  };

  currentNotices[idx] = updatedNotice;

  await docRef.set(
    {
      notices: currentNotices,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastUpdatedBy: actor.displayName || actor.email || 'Admin',
    },
    { merge: true }
  );

  // Record audit log
  await logAuditEvent({
    category: AUDIT_CATEGORIES.SYSTEM,
    action: 'BOARD_NOTICE_UPDATED',
    severity: AUDIT_SEVERITIES.INFO,
    actor: {
      uid: actor.uid || 'admin',
      displayName: actor.displayName || 'Admin',
      email: actor.email || '',
      role: actor.role || 'canteen_committee',
    },
    target: {
      type: 'board_notice',
      id: noticeId,
      label: updatedNotice.title,
    },
    changes: {
      diffSummary: `Updated Board Notice "${updatedNotice.title}"`,
      fieldsChanged: Object.keys(updateFields),
    },
  });

  return updatedNotice;
}

/**
 * Deletes a Board Notice from Firestore.
 */
export async function deleteBoardNotice(noticeId, actor = {}) {
  const docRef = BOARD_NOTICES_DOC_REF();

  const snap = await docRef.get();
  if (!snap.exists) return;

  const currentNotices = Array.isArray(snap.data()?.notices) ? snap.data().notices : [];
  const target = currentNotices.find((n) => n.id === noticeId);
  const filtered = currentNotices.filter((n) => n.id !== noticeId);

  await docRef.set(
    {
      notices: filtered,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      lastUpdatedBy: actor.displayName || actor.email || 'Admin',
    },
    { merge: true }
  );

  // Record audit log
  if (target) {
    await logAuditEvent({
      category: AUDIT_CATEGORIES.SYSTEM,
      action: 'BOARD_NOTICE_DELETED',
      severity: AUDIT_SEVERITIES.WARNING,
      actor: {
        uid: actor.uid || 'admin',
        displayName: actor.displayName || 'Admin',
        email: actor.email || '',
        role: actor.role || 'canteen_committee',
      },
      target: {
        type: 'board_notice',
        id: noticeId,
        label: target.title,
      },
      changes: {
        diffSummary: `Deleted Board Notice "${target.title}" (${target.startDate})`,
      },
    });
  }
}
