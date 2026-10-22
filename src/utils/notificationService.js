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

export const TARGET_AUDIENCE_TYPES = {
  ALL: 'all',              // Everyone (public visitors + all students + staff)
  STUDENTS: 'students',    // All registered students
  BATCHES: 'batches',      // Specific batch list (e.g. ['2024-26'])
  TOKENS: 'tokens',        // Specific token IDs or range
  STAFF: 'staff',          // Kitchen cooks & committee officers
  COMMITTEE: 'committee',  // Committee officers only
};

/**
 * Evaluates whether a notification applies to a specific user context
 */
export function isNotificationApplicable(notification, userContext = {}) {
  if (!notification || notification.status !== 'active') return false;

  const target = notification.targetAudience || { type: TARGET_AUDIENCE_TYPES.ALL };
  const targetType = target.type || TARGET_AUDIENCE_TYPES.ALL;

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
