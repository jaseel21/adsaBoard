import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

export const NOTIFICATION_CATEGORIES = {
  GENERAL: 'general',
  MENU: 'menu',
  CUTOFF: 'cutoff',
  URGENT: 'urgent',
  FEAST: 'feast',
  MAINTENANCE: 'maintenance',
};

export const NOTIFICATION_SEVERITIES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  CRITICAL: 'critical',
  FESTIVE: 'festive',
};

export const DISPLAY_STYLES = {
  DRAWER: 'drawer',   // Slide-out drawer notification
  BANNER: 'banner',   // Ambient sticky top banner
  DIALOG: 'dialog',   // High-urgency popup / modal dialog box
  ALL: 'all',         // Multi-channel: Modal + Banner + Drawer
};

export const SENDER_AUTHORITIES = {
  CENTRAL_COMMITTEE: 'central_committee',
  CANTEEN_WING: 'canteen_wing',
  KITCHEN_CHEFS: 'kitchen_chefs',
  DEVELOPERS: 'developers',
  EXEC_LEADERSHIP: 'exec_leadership',
  WARDEN: 'warden',
  CUSTOM: 'custom',
};

export const AUTHORITY_METADATA = {
  [SENDER_AUTHORITIES.CENTRAL_COMMITTEE]: {
    key: 'central_committee',
    labelEn: 'ADSA Central Committee',
    labelMl: 'അഡ്സ സെൻട്രൽ കമ്മിറ്റി',
    color: 'emerald',
    badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  [SENDER_AUTHORITIES.CANTEEN_WING]: {
    key: 'canteen_wing',
    labelEn: 'Canteen Sub-Committee',
    labelMl: 'കാന്റീൻ സബ് കമ്മിറ്റി',
    color: 'blue',
    badgeClass: 'bg-blue-500/15 text-blue-700 dark:text-blue-300 border-blue-500/30',
  },
  [SENDER_AUTHORITIES.KITCHEN_CHEFS]: {
    key: 'kitchen_chefs',
    labelEn: 'Kitchen & Catering Wing',
    labelMl: 'കിച്ചൺ & കാറ്ററിംഗ് വിഭാഗം',
    color: 'amber',
    badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
  [SENDER_AUTHORITIES.DEVELOPERS]: {
    key: 'developers',
    labelEn: 'System Architect & Developers',
    labelMl: 'സിസ്റ്റം ഡെവലപ്പർ ടീം',
    color: 'purple',
    badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
  },
  [SENDER_AUTHORITIES.EXEC_LEADERSHIP]: {
    key: 'exec_leadership',
    labelEn: 'President / General Secretary',
    labelMl: 'പ്രസിഡന്റ് / ജനറൽ സെക്രട്ടറി',
    color: 'teal',
    badgeClass: 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30',
  },
  [SENDER_AUTHORITIES.WARDEN]: {
    key: 'warden',
    labelEn: 'Campus & Hostel Warden',
    labelMl: 'ഹോസ്റ്റൽ വാർഡൻ',
    color: 'rose',
    badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  },
  [SENDER_AUTHORITIES.CUSTOM]: {
    key: 'custom',
    labelEn: 'Official Campus Authority',
    labelMl: 'ഔദ്യോഗിക അതോറിറ്റി',
    color: 'gray',
    badgeClass: 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30',
  },
};

export const TARGET_AUDIENCE_TYPES = {
  ALL: 'all',              // Everyone (public visitors + all students + staff + screens)
  STUDENTS: 'students',    // All registered students
  BATCHES: 'batches',      // Specific batch list (e.g. ['2024-26'])
  TOKENS: 'tokens',        // Specific token IDs or range
  STAFF: 'staff',          // Kitchen cooks & committee officers
  COMMITTEE: 'committee',  // Committee officers only
  TV_SCREEN: 'tv_screen',  // Dedicated TV Notice Board screens
};

/**
 * Evaluates whether a notification applies to a specific user context
 */
export function isNotificationApplicable(notification, userContext = {}) {
  if (!notification || notification.status !== 'active') return false;

  const target = notification.targetAudience || { type: TARGET_AUDIENCE_TYPES.ALL };
  const targetType = target.type || TARGET_AUDIENCE_TYPES.ALL;

  // TV Screen Context
  if (userContext.isTvScreen) {
    return targetType === TARGET_AUDIENCE_TYPES.ALL || targetType === 'public' || targetType === TARGET_AUDIENCE_TYPES.TV_SCREEN;
  }

  // 1. Broadest: Target 'all' or 'public'
  if (targetType === TARGET_AUDIENCE_TYPES.ALL || targetType === 'public') {
    return true;
  }

  const { isStaff, role, tokenNo, batch } = userContext;

  // 2. Staff & Committee Targeting
  if (targetType === TARGET_AUDIENCE_TYPES.STAFF) {
    return Boolean(isStaff);
  }
  if (targetType === TARGET_AUDIENCE_TYPES.COMMITTEE) {
    return Boolean(isStaff && role !== 'cook');
  }

  // 3. Registered Students Targeting
  if (targetType === TARGET_AUDIENCE_TYPES.STUDENTS) {
    return Boolean(tokenNo !== undefined && tokenNo !== null);
  }

  // 4. Batch Specific
  if (targetType === TARGET_AUDIENCE_TYPES.BATCHES) {
    if (!batch) return false;
    const targetBatches = Array.isArray(target.batches) ? target.batches : [];
    return targetBatches.includes(String(batch));
  }

  // 5. Token Specific
  if (targetType === TARGET_AUDIENCE_TYPES.TOKENS) {
    if (!tokenNo) return false;
    const targetTokens = Array.isArray(target.tokens) ? target.tokens : [];
    return targetTokens.map(String).includes(String(tokenNo));
  }

  return false;
}

/**
 * Subscribe to Active Broadcast Notifications in Real-time
 */
export function subscribeToActiveNotifications({ onUpdate, onError }) {
  try {
    const query = firebase
      .firestore()
      .collection('notifications')
      .where('status', '==', 'active')
      .orderBy('createdAt', 'desc')
      .limit(30);

    return query.onSnapshot(
      (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (onUpdate) onUpdate(notifications);
      },
      (error) => {
        console.error('[NotificationService] Subscribe Error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.error('[NotificationService] Failed to establish listener:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Subscribe to All Notifications (Admin Ledger View)
 */
export function subscribeToAllNotifications({ onUpdate, onError }) {
  try {
    const query = firebase
      .firestore()
      .collection('notifications')
      .orderBy('createdAt', 'desc')
      .limit(60);

    return query.onSnapshot(
      (snapshot) => {
        const notifications = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (onUpdate) onUpdate(notifications);
      },
      (error) => {
        console.error('[NotificationService] Admin Subscribe Error:', error);
        if (onError) onError(error);
      }
    );
  } catch (err) {
    console.error('[NotificationService] Admin listener failed:', err);
    if (onError) onError(err);
    return () => {};
  }
}

/**
 * Create and Broadcast a New Notification
 */
export async function createNotification(notificationData, actor = null) {
  const db = firebase.firestore();
  const now = firebase.firestore.FieldValue.serverTimestamp();

  const record = {
    title: String(notificationData.title || '').trim(),
    body: String(notificationData.body || '').trim(),
    category: notificationData.category || NOTIFICATION_CATEGORIES.GENERAL,
    severity: notificationData.severity || NOTIFICATION_SEVERITIES.INFO,
    targetAudience: notificationData.targetAudience || { type: TARGET_AUDIENCE_TYPES.ALL },
    cta: notificationData.cta || null,
    bannerPinned: Boolean(notificationData.bannerPinned),
    allowDismiss: notificationData.allowDismiss !== false,
    displayStyle: notificationData.displayStyle || (notificationData.bannerPinned ? DISPLAY_STYLES.BANNER : DISPLAY_STYLES.DRAWER),
    requireExplicitAck: Boolean(notificationData.requireExplicitAck),
    senderAttribution: notificationData.senderAttribution || {
      showSender: true,
      authorityType: SENDER_AUTHORITIES.CANTEEN_WING,
      customTitle: '',
      signOffName: '',
      showPersonalName: false,
    },
    status: notificationData.status || 'active',
    publishAt: notificationData.publishAt || now,
    expiresAt: notificationData.expiresAt || null,
    createdBy: {
      uid: actor?.uid || 'system',
      name: actor?.displayName || actor?.name || 'ADSA Committee',
      role: actor?.role || 'admin',
      email: actor?.email || '',
    },
    stats: {
      viewCount: 0,
      ackCount: 0,
      lastAckAt: null,
    },
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await db.collection('notifications').add(record);

  // Audit Log Entry
  try {
    await logAuditEvent({
      action: 'NOTIFICATION_BROADCAST_CREATED',
      category: AUDIT_CATEGORIES.NOTIFICATIONS,
      severity: record.severity === 'critical' ? AUDIT_SEVERITIES.CRITICAL : AUDIT_SEVERITIES.NOTICE,
      actor: {
        id: actor?.uid || 'system',
        name: actor?.displayName || actor?.name || 'Administrator',
        role: actor?.role || 'developer',
      },
      target: {
        id: docRef.id,
        name: record.title,
        type: 'broadcast_notification',
      },
      metadata: {
        category: record.category,
        severity: record.severity,
        targetType: record.targetAudience?.type,
        bannerPinned: record.bannerPinned,
      },
    });
  } catch (auditErr) {
    console.warn('[NotificationService] Audit logging failed:', auditErr);
  }

  return { id: docRef.id, ...record };
}

/**
 * Update an Existing Notification
 */
export async function updateNotification(id, updates, actor = null) {
  if (!id) throw new Error('Notification ID required for update');

  const db = firebase.firestore();
  const now = firebase.firestore.FieldValue.serverTimestamp();

  const updatePayload = {
    ...updates,
    updatedAt: now,
  };

  await db.collection('notifications').doc(id).update(updatePayload);

  // Audit Log Entry
  try {
    await logAuditEvent({
      action: 'NOTIFICATION_BROADCAST_UPDATED',
      category: AUDIT_CATEGORIES.NOTIFICATIONS,
      severity: AUDIT_SEVERITIES.INFO,
      actor: {
        id: actor?.uid || 'system',
        name: actor?.displayName || actor?.name || 'Administrator',
        role: actor?.role || 'developer',
      },
      target: {
        id,
        name: updates.title || 'Notification',
        type: 'broadcast_notification',
      },
      metadata: {
        updatedFields: Object.keys(updates),
      },
    });
  } catch (auditErr) {
    console.warn('[NotificationService] Audit logging failed:', auditErr);
  }

  return true;
}

/**
 * Quick Toggle Pinned Banner Status
 */
export async function togglePinNotification(id, bannerPinned, actor = null) {
  return updateNotification(id, { bannerPinned }, actor);
}

/**
 * Archive a Notification Immediately
 */
export async function archiveNotification(id, actor = null) {
  return updateNotification(id, { status: 'archived' }, actor);
}

/**
 * Delete a Notification Permanently
 */
export async function deleteNotification(id, title = 'Notification', actor = null) {
  if (!id) throw new Error('Notification ID required for deletion');

  const db = firebase.firestore();
  await db.collection('notifications').doc(id).delete();

  // Audit Log Entry
  try {
    await logAuditEvent({
      action: 'NOTIFICATION_BROADCAST_DELETED',
      category: AUDIT_CATEGORIES.NOTIFICATIONS,
      severity: AUDIT_SEVERITIES.WARNING,
      actor: {
        id: actor?.uid || 'system',
        name: actor?.displayName || actor?.name || 'Administrator',
        role: actor?.role || 'developer',
      },
      target: {
        id,
        name: title,
        type: 'broadcast_notification',
      },
    });
  } catch (auditErr) {
    console.warn('[NotificationService] Audit logging failed:', auditErr);
  }

  return true;
}

/**
 * Safely increment view counter
 */
export async function incrementNotificationView(id) {
  if (!id) return;
  try {
    const ref = firebase.firestore().collection('notifications').doc(id);
    await ref.update({
      'stats.viewCount': firebase.firestore.FieldValue.increment(1),
    });
  } catch (_) {
    // Non-blocking telemetry
  }
}

/**
 * Safely increment acknowledgement counter
 */
export async function incrementNotificationAck(id) {
  if (!id) return;
  try {
    const ref = firebase.firestore().collection('notifications').doc(id);
    await ref.update({
      'stats.ackCount': firebase.firestore.FieldValue.increment(1),
      'stats.lastAckAt': firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch (_) {
    // Non-blocking telemetry
  }
}
