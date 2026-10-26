import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

export const DEFAULT_MASTER_GOVERNANCE = {
  // Institutional Emergency Switches
  maintenanceMode: false,
  maintenanceMessage: 'ADSA T-Board is currently undergoing scheduled institutional maintenance. Dining services and token systems will resume shortly.',
  readOnlyLockdown: false,
  allowStudentSelfToggles: true,
  emergencyMealOverrideActive: false,
  emergencyMealOverrideNote: '',

  // Standard Meal Windows & Cutoff Timers (IST)
  mealWindows: {
    breakfast: {
      servingStartTime: '07:00',
      servingEndTime: '09:00',
      cutoffTime: '21:00', // Previous evening 9:00 PM IST
      graceMinutes: 15,
      enforceLock: true,
      costPerMeal: 35,
      fineForLateCancel: 15,
    },
    lunch: {
      servingStartTime: '12:30',
      servingEndTime: '14:30',
      cutoffTime: '08:30', // Morning 8:30 AM IST
      graceMinutes: 15,
      enforceLock: true,
      costPerMeal: 50,
      fineForLateCancel: 20,
    },
  },

  // Dining Hall Layout & UI
  sectionChunkSize: 25,
  defaultBoardDensity: 'matrix', // 'compact' | 'matrix' | 'cards'
  
  // Security & Auditing Constraints
  auditLogRetentionDays: 365,
  maxConcurrentSessionsPerUser: 3,
  sessionIdleTimeoutMinutes: 60,

  // Version counter for optimistic concurrency
  version: 1,
};

const GOVERNANCE_DOC_REF = () =>
  firebase.firestore().collection('settings').doc('master_governance');

let cachedGovernance = { ...DEFAULT_MASTER_GOVERNANCE };

/**
 * Real-time listener for institutional master governance settings.
 * Automatically seeds default document if not yet existing.
 */
export function subscribeToMasterGovernance(onUpdate, onError) {
  const docRef = GOVERNANCE_DOC_REF();

  return docRef.onSnapshot(
    async (snapshot) => {
      if (snapshot.exists) {
        const data = snapshot.data() || {};
        const parsedGovernance = {
          ...DEFAULT_MASTER_GOVERNANCE,
          ...data,
          mealWindows: {
            breakfast: {
              ...DEFAULT_MASTER_GOVERNANCE.mealWindows.breakfast,
              ...(data.mealWindows?.breakfast || {}),
            },
            lunch: {
              ...DEFAULT_MASTER_GOVERNANCE.mealWindows.lunch,
              ...(data.mealWindows?.lunch || {}),
            },
          },
          updatedAt: data.updatedAt || null,
          updatedBy: data.updatedBy || null,
        };
        cachedGovernance = parsedGovernance;
        if (typeof onUpdate === 'function') {
          onUpdate(parsedGovernance);
        }
      } else {
        // Automatically seed default master governance in Firestore
        try {
          await docRef.set({
            ...DEFAULT_MASTER_GOVERNANCE,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: {
              uid: 'system',
              displayName: 'System Auto-Seed',
              role: 'system',
            },
          });
          cachedGovernance = { ...DEFAULT_MASTER_GOVERNANCE };
          if (typeof onUpdate === 'function') {
            onUpdate(cachedGovernance);
          }
        } catch (seedErr) {
          console.warn('Could not seed default master governance doc:', seedErr);
          if (typeof onUpdate === 'function') {
            onUpdate(cachedGovernance);
          }
        }
      }
    },
    (err) => {
      console.error('Error in masterGovernance listener:', err);
      if (typeof onError === 'function') {
        onError(err);
      } else if (typeof onUpdate === 'function') {
        onUpdate(cachedGovernance);
      }
    }
  );
}

/**
 * Synchronous cached accessor for instant UI initialization.
 */
export function getCachedMasterGovernance() {
  return cachedGovernance;
}

/**
 * Update general master governance settings with audit logging.
 */
export async function updateMasterGovernanceSettings(updates = {}, actor = {}) {
  const docRef = GOVERNANCE_DOC_REF();
  const prevData = { ...cachedGovernance };

  const mergedUpdates = {
    ...updates,
    version: (prevData.version || 1) + 1,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: {
      uid: actor.uid || 'admin',
      displayName: actor.displayName || actor.email || 'Admin',
      role: actor.role || 'developer',
    },
  };

  await docRef.set(mergedUpdates, { merge: true });

  // Update memory cache
  cachedGovernance = {
    ...cachedGovernance,
    ...updates,
    version: mergedUpdates.version,
  };

  // Log audit event
  try {
    await logAuditEvent({
      action: 'UPDATE_MASTER_GOVERNANCE',
      category: AUDIT_CATEGORIES.SYSTEM,
      severity: AUDIT_SEVERITIES.NOTICE,
      actor: {
        uid: actor.uid || '',
        displayName: actor.displayName || actor.email || 'Admin',
        role: actor.role || 'developer',
      },
      target: {
        type: 'settings',
        id: 'master_governance',
        label: 'Institutional Master Governance',
      },
      details: {
        changedFields: Object.keys(updates),
        newValues: updates,
      },
    });
  } catch (logErr) {
    console.warn('Audit log error on master governance update:', logErr);
  }

  return cachedGovernance;
}

/**
 * Toggle Institutional Maintenance Mode
 */
export async function toggleMaintenanceMode(enabled, customMessage = '', actor = {}) {
  const updates = {
    maintenanceMode: Boolean(enabled),
  };
  if (customMessage && typeof customMessage === 'string') {
    updates.maintenanceMessage = customMessage.trim();
  }

  await updateMasterGovernanceSettings(updates, actor);

  try {
    await logAuditEvent({
      action: enabled ? 'ENGAGE_MAINTENANCE_MODE' : 'DISENGAGE_MAINTENANCE_MODE',
      category: AUDIT_CATEGORIES.SYSTEM,
      severity: enabled ? AUDIT_SEVERITIES.CRITICAL : AUDIT_SEVERITIES.NOTICE,
      actor: {
        uid: actor.uid || '',
        displayName: actor.displayName || actor.email || 'Admin',
        role: actor.role || 'developer',
      },
      target: {
        type: 'settings',
        id: 'master_governance',
        label: 'Institutional Maintenance Mode',
      },
      details: {
        maintenanceMode: enabled,
        maintenanceMessage: updates.maintenanceMessage || cachedGovernance.maintenanceMessage,
      },
    });
  } catch (err) {
    console.warn('Audit error on maintenance toggle:', err);
  }
}

/**
 * Toggle Institutional Read-Only Lockdown
 */
export async function toggleReadOnlyLockdown(enabled, actor = {}) {
  await updateMasterGovernanceSettings({ readOnlyLockdown: Boolean(enabled) }, actor);

  try {
    await logAuditEvent({
      action: enabled ? 'ENGAGE_READ_ONLY_LOCKDOWN' : 'DISENGAGE_READ_ONLY_LOCKDOWN',
      category: AUDIT_CATEGORIES.SYSTEM,
      severity: enabled ? AUDIT_SEVERITIES.WARNING : AUDIT_SEVERITIES.INFO,
      actor: {
        uid: actor.uid || '',
        displayName: actor.displayName || actor.email || 'Admin',
        role: actor.role || 'developer',
      },
      target: {
        type: 'settings',
        id: 'master_governance',
        label: 'Institutional Read-Only Lockdown',
      },
      details: {
        readOnlyLockdown: Boolean(enabled),
      },
    });
  } catch (err) {
    console.warn('Audit error on read-only lockdown toggle:', err);
  }
}

/**
 * Toggle Emergency Meal Override (Unlocks all meal tokens campus-wide)
 */
export async function toggleEmergencyMealOverride(enabled, note = '', actor = {}) {
  const updates = {
    emergencyMealOverrideActive: Boolean(enabled),
    emergencyMealOverrideNote: note ? note.trim() : '',
  };

  await updateMasterGovernanceSettings(updates, actor);

  try {
    await logAuditEvent({
      action: enabled ? 'ENGAGE_EMERGENCY_MEAL_OVERRIDE' : 'DISENGAGE_EMERGENCY_MEAL_OVERRIDE',
      category: AUDIT_CATEGORIES.TOKEN_BOARD,
      severity: enabled ? AUDIT_SEVERITIES.CRITICAL : AUDIT_SEVERITIES.NOTICE,
      actor: {
        uid: actor.uid || '',
        displayName: actor.displayName || actor.email || 'Admin',
        role: actor.role || 'developer',
      },
      target: {
        type: 'settings',
        id: 'master_governance',
        label: 'Emergency Meal Override',
      },
      details: {
        overrideActive: Boolean(enabled),
        note: updates.emergencyMealOverrideNote,
      },
    });
  } catch (err) {
    console.warn('Audit error on emergency meal override toggle:', err);
  }
}

/**
 * Update Meal Window Cutoff & Serving Configuration
 */
export async function updateMealWindowConfig(mealKey, windowConfig = {}, actor = {}) {
  if (!['breakfast', 'lunch'].includes(mealKey)) {
    throw new Error(`Invalid mealKey: ${mealKey}`);
  }

  const currentMealWindows = cachedGovernance.mealWindows || DEFAULT_MASTER_GOVERNANCE.mealWindows;
  const updatedMealWindows = {
    ...currentMealWindows,
    [mealKey]: {
      ...currentMealWindows[mealKey],
      ...windowConfig,
    },
  };

  return await updateMasterGovernanceSettings({ mealWindows: updatedMealWindows }, actor);
}
