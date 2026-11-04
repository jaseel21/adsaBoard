import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

export const DEFAULT_SECURITY_POLICY = {
  // Master Fleet Override Gate
  allowDeviceOverrides: true, // If false, Central Admin blocks all local device overrides campus-wide

  // Campus-wide Default Inactivity Settings
  defaultPersona: 'public_kiosk', // 'public_kiosk' | 'auto_detect' | 'personal_mobile' | 'kitchen_wallboard' | 'admin_workstation'
  defaultTimeoutMs: 60000, // 60s
  defaultWarningMs: 15000, // 15s

  // Hardware Toggles Defaults
  soundAlertsEnabled: true,
  countdownTickEnabled: true,
  wakeLockEnabled: true,

  // Metadata
  policyReason: 'Standard Campus Security Baseline',
  updatedAt: null,
  updatedBy: '',
  updatedByName: '',
};

const SECURITY_POLICY_DOC_REF = () =>
  firebase.firestore().collection('settings').doc('security_policy');

const LOCAL_STORAGE_CACHE_KEY = 'adsa_cached_global_security_policy';

let cachedPolicy = (() => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
      if (raw) {
        return { ...DEFAULT_SECURITY_POLICY, ...JSON.parse(raw) };
      }
    } catch (_) {}
  }
  return { ...DEFAULT_SECURITY_POLICY };
})();

/**
 * Real-time listener for campus global security policy.
 * Automatically synchronizes with Firestore and seeds initial document if not yet created.
 */
export function subscribeToGlobalSecurityPolicy(onUpdate, onError) {
  const docRef = SECURITY_POLICY_DOC_REF();

  return docRef.onSnapshot(
    async (snapshot) => {
      if (snapshot.exists) {
        const data = snapshot.data() || {};
        const parsedPolicy = {
          allowDeviceOverrides: data.allowDeviceOverrides !== undefined ? Boolean(data.allowDeviceOverrides) : DEFAULT_SECURITY_POLICY.allowDeviceOverrides,
          defaultPersona: data.defaultPersona || DEFAULT_SECURITY_POLICY.defaultPersona,
          defaultTimeoutMs: Number(data.defaultTimeoutMs) > 0 ? Number(data.defaultTimeoutMs) : DEFAULT_SECURITY_POLICY.defaultTimeoutMs,
          defaultWarningMs: Number(data.defaultWarningMs) > 0 ? Number(data.defaultWarningMs) : DEFAULT_SECURITY_POLICY.defaultWarningMs,
          soundAlertsEnabled: data.soundAlertsEnabled !== undefined ? Boolean(data.soundAlertsEnabled) : DEFAULT_SECURITY_POLICY.soundAlertsEnabled,
          countdownTickEnabled: data.countdownTickEnabled !== undefined ? Boolean(data.countdownTickEnabled) : DEFAULT_SECURITY_POLICY.countdownTickEnabled,
          wakeLockEnabled: data.wakeLockEnabled !== undefined ? Boolean(data.wakeLockEnabled) : DEFAULT_SECURITY_POLICY.wakeLockEnabled,
          policyReason: data.policyReason || DEFAULT_SECURITY_POLICY.policyReason,
          updatedAt: data.updatedAt || null,
          updatedBy: data.updatedBy || '',
          updatedByName: data.updatedByName || '',
        };

        cachedPolicy = parsedPolicy;

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(parsedPolicy));
            window.dispatchEvent(new CustomEvent('adsa:global_security_policy_updated', { detail: parsedPolicy }));
          } catch (_) {}
        }

        if (typeof onUpdate === 'function') {
          onUpdate(parsedPolicy);
        }
      } else {
        // Seed initial default security policy document in Firestore
        try {
          const initialSeed = {
            ...DEFAULT_SECURITY_POLICY,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedByName: 'System Auto-Seed',
          };
          await docRef.set(initialSeed);
          cachedPolicy = { ...DEFAULT_SECURITY_POLICY };
          if (typeof onUpdate === 'function') {
            onUpdate(cachedPolicy);
          }
        } catch (seedErr) {
          console.warn('Could not seed default security policy in Firestore:', seedErr);
          if (typeof onUpdate === 'function') {
            onUpdate(cachedPolicy);
          }
        }
      }
    },
    (err) => {
      console.warn('Error in global security policy snapshot listener:', err);
      if (typeof onError === 'function') {
        onError(err);
      } else if (typeof onUpdate === 'function') {
        onUpdate(cachedPolicy);
      }
    }
  );
}

/**
 * Returns the currently cached global security policy synchronously.
 */
export function getCachedGlobalSecurityPolicy() {
  if (typeof window !== 'undefined' && (!cachedPolicy || !cachedPolicy.defaultTimeoutMs)) {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_CACHE_KEY);
      if (raw) {
        cachedPolicy = { ...DEFAULT_SECURITY_POLICY, ...JSON.parse(raw) };
      }
    } catch (_) {}
  }
  return cachedPolicy || { ...DEFAULT_SECURITY_POLICY };
}

/**
 * Update the global campus security policy in Firestore.
 * Requires administrator privileges (Central Committee / Developer / Canteen Committee).
 *
 * @param {Object} updates
 * @param {Object} actor - { uid, displayName, email, role }
 */
export async function updateGlobalSecurityPolicy(updates, actor = {}) {
  const docRef = SECURITY_POLICY_DOC_REF();

  const prevPolicy = getCachedGlobalSecurityPolicy();
  const payload = {
    ...updates,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: actor.uid || 'admin',
    updatedByName: actor.displayName || actor.email || 'Central Committee Admin',
  };

  await docRef.set(payload, { merge: true });

  const merged = {
    ...prevPolicy,
    ...updates,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.uid || 'admin',
    updatedByName: actor.displayName || actor.email || 'Central Committee Admin',
  };

  cachedPolicy = merged;

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(LOCAL_STORAGE_CACHE_KEY, JSON.stringify(merged));
      window.dispatchEvent(new CustomEvent('adsa:global_security_policy_updated', { detail: merged }));
      window.dispatchEvent(new CustomEvent('adsa:device_profile_updated'));
    } catch (_) {}
  }

  // Record structured audit trail entry
  try {
    await logAuditEvent({
      category: AUDIT_CATEGORIES.SECURITY,
      action: 'UPDATE_GLOBAL_SECURITY_POLICY',
      severity: AUDIT_SEVERITIES.WARNING,
      actor: {
        uid: actor.uid || 'admin',
        displayName: actor.displayName || actor.email || 'Admin',
        email: actor.email || '',
        role: actor.role || 'admin',
      },
      target: {
        type: 'system',
        id: 'security_policy',
        label: 'Campus Fleet Security Policy',
      },
      changes: {
        allowDeviceOverrides: {
          from: prevPolicy.allowDeviceOverrides,
          to: updates.allowDeviceOverrides ?? prevPolicy.allowDeviceOverrides,
        },
        defaultTimeoutMs: {
          from: prevPolicy.defaultTimeoutMs,
          to: updates.defaultTimeoutMs ?? prevPolicy.defaultTimeoutMs,
        },
        defaultPersona: {
          from: prevPolicy.defaultPersona,
          to: updates.defaultPersona ?? prevPolicy.defaultPersona,
        },
        diffSummary: `Global security policy updated: ${
          updates.allowDeviceOverrides === false
            ? 'Local device overrides BLOCKED'
            : updates.allowDeviceOverrides === true
            ? 'Local device overrides ALLOWED'
            : ''
        } ${updates.defaultTimeoutMs ? `Timeout: ${Math.round(updates.defaultTimeoutMs / 1000)}s` : ''}`.trim(),
      },
      metadata: {
        reason: updates.policyReason || 'Central Committee fleet policy update',
      },
    });
  } catch (auditErr) {
    console.warn('Could not record security policy audit log:', auditErr);
  }

  return merged;
}
