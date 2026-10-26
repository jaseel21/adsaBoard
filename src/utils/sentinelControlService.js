import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

/**
 * Sentinel Administrative Remote Control & Audit Dispatch Service
 * Issues real-time interventions targeting specific user sessions, tokens, roles, or the entire campus fleet,
 * while automatically generating immutable records in the central audit_logs collection.
 */

/**
 * Helper to resolve the authenticated administrator identity
 */
function resolveCurrentAdminActor() {
  const authUser = firebase.auth().currentUser;
  if (!authUser) {
    return {
      uid: 'admin_console',
      email: 'central@adsa',
      displayName: 'Central Committee Admin',
      role: 'central_committee',
    };
  }

  return {
    uid: authUser.uid,
    email: authUser.email || 'staff@adsa',
    displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Administrator',
    role: 'admin',
  };
}

/**
 * Low-level Command Dispatcher
 */
export async function dispatchRemoteCommand({
  targetType = 'single_session', // 'single_session' | 'single_token' | 'role_broadcast' | 'fleet_broadcast'
  targetSession = null,
  targetSessionId = null,
  targetTokenNo = null,
  targetRole = null,
  action, // 'FORCE_LOGOUT' | 'NAVIGATE_TO' | 'ALERT_MODAL' | 'FREEZE_PORTAL' | 'UNFREEZE_PORTAL' | 'REQUEST_PING' | 'RELOAD_CLIENT'
  payload = {},
  reason = 'Administrative action',
}) {
  try {
    const adminActor = resolveCurrentAdminActor();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 10 * 60 * 1000).toISOString(); // 10 minutes TTL

    const resolvedSessionId = targetSession?.sessionId || targetSessionId || (targetType === 'fleet_broadcast' ? 'all' : null);
    const resolvedTokenNo = targetSession?.tokenNo || targetTokenNo || null;

    const commandPayload = {
      targetType,
      targetSessionId: resolvedSessionId,
      targetTokenNo: resolvedTokenNo,
      targetRole: targetSession?.role || targetRole || null,
      action,
      payload: {
        reason,
        ...payload,
      },
      issuedBy: adminActor,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      createdAtIso: now.toISOString(),
      expiresAt,
      acknowledgedSessions: [],
    };

    // 1. Post to session_commands collection
    const cmdRef = await firebase.firestore().collection('session_commands').add(commandPayload);

    // 2. If action is FREEZE or UNFREEZE, mutate the presence session directly
    if (resolvedSessionId && resolvedSessionId !== 'all') {
      if (action === 'FREEZE_PORTAL') {
        await firebase
          .firestore()
          .collection('presence_sessions')
          .doc(resolvedSessionId)
          .set({ isFrozen: true, freezeReason: reason }, { merge: true })
          .catch(() => {});
      } else if (action === 'UNFREEZE_PORTAL') {
        await firebase
          .firestore()
          .collection('presence_sessions')
          .doc(resolvedSessionId)
          .set({ isFrozen: false, freezeReason: null }, { merge: true })
          .catch(() => {});
      }
    }

    // 3. Log audit event to existing central audit_logs
    let auditSeverity = AUDIT_SEVERITIES.WARNING;
    if (action === 'FORCE_LOGOUT' || action === 'FREEZE_PORTAL') {
      auditSeverity = AUDIT_SEVERITIES.CRITICAL;
    } else if (action === 'REQUEST_PING') {
      auditSeverity = AUDIT_SEVERITIES.INFO;
    }

    const targetLabel =
      targetSession?.identifier ||
      (resolvedTokenNo ? `Token #${resolvedTokenNo}` : null) ||
      (resolvedSessionId === 'all' ? 'All Campus Devices (Fleet Broadcast)' : `Session ${resolvedSessionId}`);

    await logAuditEvent({
      category: AUDIT_CATEGORIES.SECURITY,
      action: `REMOTE_${action}`,
      severity: auditSeverity,
      actor: adminActor,
      target: {
        type: 'session',
        id: resolvedSessionId || cmdRef.id,
        tokenNo: resolvedTokenNo,
        label: targetLabel,
      },
      changes: {
        diffSummary: `Admin remotely triggered ${action} on ${targetLabel}. Reason: ${reason}`,
        fieldsChanged: ['sessionCommand', action.toLowerCase()],
        before: { targetStatus: targetSession?.status || 'active' },
        after: { action, reason, executedAt: now.toISOString() },
      },
      metadata: {
        commandId: cmdRef.id,
        targetSessionId: resolvedSessionId,
        targetTokenNo: resolvedTokenNo,
        deviceType: targetSession?.device?.type || 'unknown',
        route: targetSession?.route || 'unknown',
        reason,
        ...payload,
      },
    });

    return cmdRef.id;
  } catch (err) {
    console.error('[SentinelControlService] Failed to dispatch command:', err);
    throw err;
  }
}

/**
 * 1. Remote Force Logout / Session Termination
 */
export async function remoteTerminateSession(session, reason = 'Security compliance logout') {
  return dispatchRemoteCommand({
    targetType: 'single_session',
    targetSession: session,
    action: 'FORCE_LOGOUT',
    payload: {
      message: `Your active session has been securely concluded by ADSA Administration. Reason: ${reason}`,
    },
    reason,
  });
}

/**
 * 2. Remote Route Teleportation / Navigation
 */
export async function remoteTeleportRoute(session, targetRoute, reason = 'Directing user to designated view') {
  return dispatchRemoteCommand({
    targetType: 'single_session',
    targetSession: session,
    action: 'NAVIGATE_TO',
    payload: {
      targetRoute,
    },
    reason,
  });
}

/**
 * 3. Targeted or Fleet Alert Modal
 */
export async function remoteBroadcastAlert({
  targetSession = null,
  isFleet = false,
  title,
  message,
  severity = 'warning',
  requireAcknowledgement = true,
  reason = 'Official administrative notice',
}) {
  return dispatchRemoteCommand({
    targetType: isFleet ? 'fleet_broadcast' : 'single_session',
    targetSession: isFleet ? null : targetSession,
    targetSessionId: isFleet ? 'all' : targetSession?.sessionId,
    action: 'ALERT_MODAL',
    payload: {
      title,
      message,
      severity,
      requireAcknowledgement,
    },
    reason,
  });
}

/**
 * 4. Freeze Student Portal (Lockdown)
 */
export async function remoteFreezePortal(session, reason = 'Dining portal temporarily locked for audit review') {
  return dispatchRemoteCommand({
    targetType: 'single_session',
    targetSession: session,
    action: 'FREEZE_PORTAL',
    payload: {
      message: reason,
    },
    reason,
  });
}

/**
 * 5. Unfreeze Student Portal
 */
export async function remoteUnfreezePortal(session, reason = 'Administrative review completed') {
  return dispatchRemoteCommand({
    targetType: 'single_session',
    targetSession: session,
    action: 'UNFREEZE_PORTAL',
    payload: {
      message: 'Your dining portal access has been restored.',
    },
    reason,
  });
}

/**
 * 6. Remote Attention Ping
 */
export async function remotePingUser(session, note = 'Administrator verified client connection') {
  return dispatchRemoteCommand({
    targetType: 'single_session',
    targetSession: session,
    action: 'REQUEST_PING',
    payload: {
      message: note,
    },
    reason: note,
  });
}

/**
 * 7. Force App Reload
 */
export async function remoteReloadClient(session, reason = 'Applying critical updates') {
  return dispatchRemoteCommand({
    targetType: 'single_session',
    targetSession: session,
    action: 'RELOAD_CLIENT',
    payload: {},
    reason,
  });
}
