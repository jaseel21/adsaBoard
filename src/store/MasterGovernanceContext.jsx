import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import {
  DEFAULT_MASTER_GOVERNANCE,
  subscribeToMasterGovernance,
  getCachedMasterGovernance,
  updateMasterGovernanceSettings,
  toggleMaintenanceMode,
  toggleReadOnlyLockdown,
  toggleEmergencyMealOverride,
  updateMealWindowConfig,
} from '../utils/masterGovernanceService';
import { AuthContext } from './AuthContext';
import { ROLES } from '../utils/rbac';

export const MasterGovernanceContext = createContext({
  governance: DEFAULT_MASTER_GOVERNANCE,
  loadingGovernance: true,
  isMaintenanceMode: false,
  maintenanceMessage: '',
  isReadOnlyLockdown: false,
  isEmergencyMealOverrideActive: false,
  emergencyMealOverrideNote: '',
  allowStudentSelfToggles: true,
  mealWindows: DEFAULT_MASTER_GOVERNANCE.mealWindows,
  sectionChunkSize: DEFAULT_MASTER_GOVERNANCE.sectionChunkSize,
  toggleMaintenance: async () => {},
  toggleReadOnly: async () => {},
  toggleEmergencyOverride: async () => {},
  updateMealWindow: async () => {},
  updateSettings: async () => {},
});

export function MasterGovernanceProvider({ children }) {
  const { user, role, isCentralCommittee } = useContext(AuthContext);
  const [governance, setGovernance] = useState(getCachedMasterGovernance);
  const [loadingGovernance, setLoadingGovernance] = useState(true);

  useEffect(() => {
    const unsub = subscribeToMasterGovernance(
      (updated) => {
        setGovernance(updated);
        setLoadingGovernance(false);
      },
      (err) => {
        console.error('MasterGovernance subscription error:', err);
        setLoadingGovernance(false);
      }
    );

    return () => unsub();
  }, []);

  const actor = useMemo(() => ({
    uid: user?.uid || 'system',
    displayName: user?.displayName || user?.email || 'Admin',
    email: user?.email || '',
    role: role || 'admin',
  }), [user, role]);

  const isStaffExemptFromMaintenance = useMemo(() => {
    return Boolean(
      isCentralCommittee ||
      role === ROLES.DEVELOPER ||
      role === ROLES.CENTRAL_COMMITTEE
    );
  }, [isCentralCommittee, role]);

  const value = useMemo(() => {
    return {
      governance,
      loadingGovernance,
      isMaintenanceMode: Boolean(governance.maintenanceMode),
      maintenanceMessage: governance.maintenanceMessage || DEFAULT_MASTER_GOVERNANCE.maintenanceMessage,
      isReadOnlyLockdown: Boolean(governance.readOnlyLockdown),
      isEmergencyMealOverrideActive: Boolean(governance.emergencyMealOverrideActive),
      emergencyMealOverrideNote: governance.emergencyMealOverrideNote || '',
      allowStudentSelfToggles: Boolean(governance.allowStudentSelfToggles),
      mealWindows: governance.mealWindows || DEFAULT_MASTER_GOVERNANCE.mealWindows,
      sectionChunkSize: Number(governance.sectionChunkSize) || 25,
      isStaffExemptFromMaintenance,

      toggleMaintenance: async (enabled, msg) => {
        return await toggleMaintenanceMode(enabled, msg, actor);
      },
      toggleReadOnly: async (enabled) => {
        return await toggleReadOnlyLockdown(enabled, actor);
      },
      toggleEmergencyOverride: async (enabled, note) => {
        return await toggleEmergencyMealOverride(enabled, note, actor);
      },
      updateMealWindow: async (mealKey, config) => {
        return await updateMealWindowConfig(mealKey, config, actor);
      },
      updateSettings: async (updates) => {
        return await updateMasterGovernanceSettings(updates, actor);
      },
    };
  }, [governance, loadingGovernance, isStaffExemptFromMaintenance, actor]);

  return (
    <MasterGovernanceContext.Provider value={value}>
      {children}
    </MasterGovernanceContext.Provider>
  );
}

export function useMasterGovernance() {
  const context = useContext(MasterGovernanceContext);
  if (!context) {
    throw new Error('useMasterGovernance must be used within a MasterGovernanceProvider');
  }
  return context;
}
