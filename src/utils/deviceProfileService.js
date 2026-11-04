/**
 * ADSA T-Board Device Identity & Hardware Profiling Service (KioskGuard 2.0)
 * Manages device-specific persona assignments, hardware heuristics, custom timeout limits,
 * and persistent local hardware configuration.
 */

import { getCachedGlobalSecurityPolicy } from './securityPolicyService';

const STORAGE_KEY = 'adsa_device_profile';
const REMOTE_POLICY_KEY = 'adsa_sentinel_remote_idle_policy';

export const DEVICE_PERSONAS = [
  {
    id: 'inherit_global',
    labelEn: 'Inherit Campus Policy',
    labelMl: 'ക്ലൗഡ് പോളിസി പിന്തുടരുക',
    descEn: 'Track centralized Campus Fleet Security Policy set by Central Committee',
    descMl: 'സെൻട്രൽ കമ്മിറ്റി നിശ്ചയിച്ച പൊതുവായ സമയവും പോളിസിയും പിന്തുടരുക',
    icon: 'Radio',
    defaultTimeoutMs: 60000,
    defaultWarningMs: 15000,
    wakeLockEnabled: true,
    soundAlertsEnabled: true,
    countdownTickEnabled: true,
    enabled: true,
  },
  {
    id: 'public_kiosk',
    labelEn: 'Public Kiosk Tablet',
    labelMl: 'പൊതു കിയോസ്ക് ടാബ്‌ലെറ്റ്',
    descEn: 'Shared dining counter • 60s timeout • 15s warning chime • Auto session purge',
    descMl: 'ഡൈനിംഗ് ഹാളിലെ പൊതു ടാബ്‌ലെറ്റ് • 60 സെക്കന്റ് ഓട്ടോ ലോഗൗട്ട്',
    icon: 'Tablet',
    defaultTimeoutMs: 60000, // 60s
    defaultWarningMs: 15000, // 15s
    wakeLockEnabled: true,
    soundAlertsEnabled: true,
    countdownTickEnabled: true,
    enabled: true,
  },
  {
    id: 'kitchen_wallboard',
    labelEn: 'Kitchen Display (KDS)',
    labelMl: 'അടുക്കള ഡിസ്‌പ്ലേ (KDS)',
    descEn: 'Wall-mounted chef screen • Persistent display (24h) • Wake lock active',
    descMl: 'അടുക്കളയിലെ സ്ഥിരം ഡിസ്‌പ്ലേ • 24 മണിക്കൂർ സ്ക്രീൻ ഓൺ',
    icon: 'Tv',
    defaultTimeoutMs: 86400000, // 24h
    defaultWarningMs: 60000,
    wakeLockEnabled: true,
    soundAlertsEnabled: false,
    countdownTickEnabled: false,
    enabled: false, // Inactivity auto-logout disabled for continuous KDS
  },
  {
    id: 'personal_mobile',
    labelEn: 'Personal Smartphone (BYOD)',
    labelMl: 'സ്വന്തം മൊബൈൽ ഫോൺ',
    descEn: 'Student personal mobile • 15m relaxed timeout • 30s gentle warning',
    descMl: 'വിദ്യാർത്ഥികളുടെ സ്വന്തം ഫോണുകൾ • 15 മിനിറ്റ് സമയം',
    icon: 'Smartphone',
    defaultTimeoutMs: 900000, // 15m
    defaultWarningMs: 30000, // 30s
    wakeLockEnabled: false,
    soundAlertsEnabled: true,
    countdownTickEnabled: false,
    enabled: true,
  },
  {
    id: 'admin_workstation',
    labelEn: 'Committee Workstation',
    labelMl: 'കമ്മിറ്റി വർക്ക്സ്റ്റേഷൻ',
    descEn: 'Desktop / Laptop office station • 30m timeout • 60s warning',
    descMl: 'ഓഫീസ് ലാപ്ടോപ്പ് / പിസി • 30 മിനിറ്റ് സമയം',
    icon: 'Laptop',
    defaultTimeoutMs: 1800000, // 30m
    defaultWarningMs: 60000, // 60s
    wakeLockEnabled: false,
    soundAlertsEnabled: true,
    countdownTickEnabled: false,
    enabled: true,
  },
  {
    id: 'auto_detect',
    labelEn: 'Auto-Detect Hardware',
    labelMl: 'ഓട്ടോമാറ്റിക് ഡിറ്റക്ഷൻ',
    descEn: 'Infer profile dynamically from screen size, touch capability and display mode',
    descMl: 'സ്ക്രീൻ വലിപ്പവും ടച്ചും അനുസരിച്ച് സ്വയം നിശ്ചയിക്കുക',
    icon: 'Cpu',
    defaultTimeoutMs: 60000,
    defaultWarningMs: 15000,
    wakeLockEnabled: true,
    soundAlertsEnabled: true,
    countdownTickEnabled: true,
    enabled: true,
  },
];

export const TIMEOUT_PRESETS = [
  { label: '30s', timeoutMs: 30000, warningMs: 10000, desc: 'Ultra-fast rush line' },
  { label: '45s', timeoutMs: 45000, warningMs: 10000, desc: 'Dining peak hours' },
  { label: '60s', timeoutMs: 60000, warningMs: 15000, desc: 'Standard public kiosk' },
  { label: '90s', timeoutMs: 90000, warningMs: 15000, desc: 'Relaxed public terminal' },
  { label: '5m', timeoutMs: 300000, warningMs: 30000, desc: 'Extended cafeteria' },
  { label: '15m', timeoutMs: 900000, warningMs: 30000, desc: 'Personal mobile device' },
  { label: '30m', timeoutMs: 1800000, warningMs: 60000, desc: 'Admin office desk' },
  { label: '24h', timeoutMs: 86400000, warningMs: 60000, desc: 'Persistent wallboard' },
];

/**
 * Generate a unique, persistent hardware fingerprint/ID for this terminal
 */
export function getOrCreateDeviceId() {
  if (typeof window === 'undefined') return 'dev_ssr_placeholder';
  try {
    let id = localStorage.getItem('adsa_device_id');
    if (!id) {
      if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        id = 'dev_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12);
      } else {
        id = 'dev_' + Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      }
      localStorage.setItem('adsa_device_id', id);
    }
    return id;
  } catch (_) {
    return 'dev_temp_' + Math.random().toString(36).substring(2, 8);
  }
}

/**
 * Heuristically infer the device persona based on browser & hardware characteristics
 */
export function detectHardwarePersona() {
  if (typeof window === 'undefined') return 'personal_mobile';

  const width = window.innerWidth;
  const isTouch = 'ontouchstart' in window || (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);

  // Touch screen phone (student personal device)
  if (isTouch && width < 768) {
    return 'personal_mobile';
  }

  // Tablet in dining room (e.g. wall or counter stand)
  if (isTouch && width >= 768 && width <= 1366) {
    return 'public_kiosk';
  }

  // Large desktop workstation or laptop
  if (!isTouch && width >= 1024) {
    return 'admin_workstation';
  }

  // Fallback default
  return width < 768 ? 'personal_mobile' : 'auto_detect';
}

/**
 * Read the current device profile from localStorage
 */
export function getDeviceProfile() {
  const deviceId = getOrCreateDeviceId();
  const defaultProfile = {
    deviceId,
    deviceName: `Terminal ${deviceId.slice(-4).toUpperCase()}`,
    campusZone: 'canteen_hall',
    persona: 'auto_detect', // Auto-detect persona based on mobile phone vs tablet vs workstation
    customTimeoutMs: null,
    customWarningMs: null,
    soundAlertsEnabled: true,
    countdownTickEnabled: true,
    wakeLockEnabled: true,
    adminConfigured: false,
    adminConfiguredAt: null,
    adminConfiguredBy: null,
    lastModifiedAt: new Date().toISOString(),
  };

  if (typeof window === 'undefined') return defaultProfile;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw);
    const profile = {
      ...defaultProfile,
      ...parsed,
      deviceId, // ensure ID never drifts
    };

    // Auto-migrate legacy profiles that defaulted to 'public_kiosk' on mobile phones (unless admin configured)
    if (
      profile.persona === 'public_kiosk' &&
      !parsed.isUserExplicitPersona &&
      !parsed.adminConfigured &&
      detectHardwarePersona() === 'personal_mobile'
    ) {
      profile.persona = 'auto_detect';
    }

    return profile;
  } catch (err) {
    console.warn('Could not read device profile, using defaults:', err);
    return defaultProfile;
  }
}

/**
 * Persist updates to device-specific profile
 */
export function updateDeviceProfile(updates) {
  if (typeof window === 'undefined') return getDeviceProfile();

  try {
    const current = getDeviceProfile();
    const updated = {
      ...current,
      ...updates,
      isUserExplicitPersona: updates.persona ? true : current.isUserExplicitPersona,
      adminConfigured: updates.adminConfigured !== undefined ? updates.adminConfigured : current.adminConfigured,
      adminConfiguredAt: updates.adminConfiguredAt !== undefined ? updates.adminConfiguredAt : current.adminConfiguredAt,
      adminConfiguredBy: updates.adminConfiguredBy !== undefined ? updates.adminConfiguredBy : current.adminConfiguredBy,
      lastModifiedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

    // Dispatch global event for live reactive subscribers
    window.dispatchEvent(new CustomEvent('adsa:device_profile_updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.error('Failed to update device profile:', err);
    return getDeviceProfile();
  }
}

/**
 * Check if the device profile is configured by an administrator
 */
export function isDeviceProfileAdminConfigured() {
  const profile = getDeviceProfile();
  return Boolean(profile && profile.adminConfigured);
}

/**
 * Reset terminal profile back to default auto-detection (Admin action)
 */
export function resetDeviceProfileToDefaults() {
  if (typeof window === 'undefined') return getDeviceProfile();

  try {
    const deviceId = getOrCreateDeviceId();
    const defaultProfile = {
      deviceId,
      deviceName: `Terminal ${deviceId.slice(-4).toUpperCase()}`,
      campusZone: 'canteen_hall',
      persona: 'auto_detect',
      customTimeoutMs: null,
      customWarningMs: null,
      soundAlertsEnabled: true,
      countdownTickEnabled: true,
      wakeLockEnabled: true,
      adminConfigured: false,
      adminConfiguredAt: null,
      adminConfiguredBy: null,
      lastModifiedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultProfile));
    window.dispatchEvent(new CustomEvent('adsa:device_profile_updated', { detail: defaultProfile }));
    return defaultProfile;
  } catch (err) {
    console.error('Failed to reset device profile to defaults:', err);
    return getDeviceProfile();
  }
}

/**
 * Save Sentinel remote policy override (pushed by Central Committee admin)
 */
export function setRemoteIdlePolicy(policy) {
  if (typeof window === 'undefined') return;
  try {
    if (policy) {
      localStorage.setItem(REMOTE_POLICY_KEY, JSON.stringify({
        ...policy,
        receivedAt: new Date().toISOString(),
      }));
    } else {
      localStorage.removeItem(REMOTE_POLICY_KEY);
    }
    window.dispatchEvent(new CustomEvent('adsa:device_profile_updated'));
  } catch (_) {}
}

/**
 * Get active Sentinel remote policy override, if any
 */
export function getRemoteIdlePolicy() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(REMOTE_POLICY_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}

/**
 * Resolves the effective Idle Guard configuration using the Resolution Waterfall:
 * 1. Sentinel Remote Fleet Override (Emergency / Admin Lock)
 * 2. Central Committee Fleet Override Gate (If allowDeviceOverrides === false, forces global policy)
 * 3. Device Hardware Profile (LocalStorage adsa_device_profile, if allowed and not inherit_global)
 * 4. Campus Global Cloud Policy (Firestore settings/security_policy)
 * 5. Automatic Hardware Heuristics Fallback (detectHardwarePersona)
 *
 * @param {Object} [overrideProfile] - Optional explicit profile
 * @returns {{ timeoutMs: number, warningMs: number, enabled: boolean, persona: string, soundAlerts: boolean, countdownTick: boolean, wakeLock: boolean, isRemoteOverride: boolean, isGlobalPolicyForced: boolean, isInheritedGlobal: boolean, isLocalDeviceOverride: boolean, allowDeviceOverrides: boolean }}
 */
export function resolveEffectiveIdleConfig(overrideProfile = null) {
  const remotePolicy = getRemoteIdlePolicy();
  const profile = overrideProfile || getDeviceProfile();
  const globalPolicy = getCachedGlobalSecurityPolicy();

  // 1. Sentinel Remote Override takes top priority (Emergency Incident / Broadcast Lock)
  if (remotePolicy && remotePolicy.timeoutMs) {
    return {
      timeoutMs: Number(remotePolicy.timeoutMs),
      warningMs: Number(remotePolicy.warningMs || 15000),
      enabled: remotePolicy.enabled !== false,
      persona: remotePolicy.persona || profile.persona || 'public_kiosk',
      soundAlerts: remotePolicy.soundAlertsEnabled ?? true,
      countdownTick: remotePolicy.countdownTickEnabled ?? true,
      wakeLock: remotePolicy.wakeLockEnabled ?? true,
      isRemoteOverride: true,
      isGlobalPolicyForced: false,
      isInheritedGlobal: false,
      isLocalDeviceOverride: false,
      allowDeviceOverrides: globalPolicy?.allowDeviceOverrides !== false,
      remoteReason: remotePolicy.reason || 'Central Committee emergency override',
      source: 'sentinel_remote',
      deviceName: profile.deviceName,
      campusZone: profile.campusZone,
    };
  }

  // 2. Central Committee Fleet Lock: Are local device overrides blocked campus-wide?
  const isLocalOverrideBlocked = globalPolicy && globalPolicy.allowDeviceOverrides === false;

  if (isLocalOverrideBlocked) {
    const effectivePersona = globalPolicy.defaultPersona || 'public_kiosk';
    const personaMeta = DEVICE_PERSONAS.find((p) => p.id === effectivePersona) || DEVICE_PERSONAS[1] || DEVICE_PERSONAS[0];
    const timeoutMs = Number(globalPolicy.defaultTimeoutMs) || personaMeta.defaultTimeoutMs;
    const warningMs = Number(globalPolicy.defaultWarningMs) || personaMeta.defaultWarningMs;
    const enabled = effectivePersona === 'kitchen_wallboard' ? false : (personaMeta.enabled && timeoutMs < 86400000);

    return {
      timeoutMs,
      warningMs: Math.min(warningMs, Math.floor(timeoutMs / 2)),
      enabled,
      persona: effectivePersona,
      soundAlerts: globalPolicy.soundAlertsEnabled ?? personaMeta.soundAlertsEnabled,
      countdownTick: globalPolicy.countdownTickEnabled ?? personaMeta.countdownTickEnabled,
      wakeLock: globalPolicy.wakeLockEnabled ?? personaMeta.wakeLockEnabled,
      isRemoteOverride: false,
      isGlobalPolicyForced: true,
      isInheritedGlobal: false,
      isLocalDeviceOverride: false,
      allowDeviceOverrides: false,
      policyReason: globalPolicy.policyReason || 'Central Committee fleet lock: Device-specific overrides blocked',
      source: 'global_fleet_forced',
      deviceName: profile.deviceName,
      campusZone: profile.campusZone,
    };
  }

  // 3. Local Device Override: If allowed and terminal has an explicit non-inherit configuration
  const isLocalConfigured = Boolean(profile.adminConfigured || profile.isUserExplicitPersona);
  const isExplicitInherit = profile.persona === 'inherit_global';

  if (isLocalConfigured && !isExplicitInherit && profile.persona && profile.persona !== 'auto_detect') {
    const effectivePersona = profile.persona;
    const personaMeta = DEVICE_PERSONAS.find((p) => p.id === effectivePersona) || DEVICE_PERSONAS[1] || DEVICE_PERSONAS[0];
    const timeoutMs = profile.customTimeoutMs && profile.customTimeoutMs > 0
      ? Number(profile.customTimeoutMs)
      : personaMeta.defaultTimeoutMs;
    const warningMs = profile.customWarningMs && profile.customWarningMs > 0
      ? Number(profile.customWarningMs)
      : personaMeta.defaultWarningMs;
    const enabled = effectivePersona === 'kitchen_wallboard' ? false : (personaMeta.enabled && timeoutMs < 86400000);

    return {
      timeoutMs,
      warningMs: Math.min(warningMs, Math.floor(timeoutMs / 2)),
      enabled,
      persona: effectivePersona,
      soundAlerts: profile.soundAlertsEnabled ?? personaMeta.soundAlertsEnabled,
      countdownTick: profile.countdownTickEnabled ?? personaMeta.countdownTickEnabled,
      wakeLock: profile.wakeLockEnabled ?? personaMeta.wakeLockEnabled,
      isRemoteOverride: false,
      isGlobalPolicyForced: false,
      isInheritedGlobal: false,
      isLocalDeviceOverride: true,
      allowDeviceOverrides: true,
      source: 'local_device_override',
      deviceName: profile.deviceName,
      campusZone: profile.campusZone,
    };
  }

  // 4. Inheriting Campus Global Cloud Policy (Explicit 'inherit_global' or general campus default)
  if (isExplicitInherit || (globalPolicy && globalPolicy.defaultTimeoutMs)) {
    let effectivePersona = isExplicitInherit
      ? (globalPolicy.defaultPersona || 'public_kiosk')
      : (profile.persona === 'auto_detect' ? detectHardwarePersona() : (globalPolicy.defaultPersona || 'public_kiosk'));

    const personaMeta = DEVICE_PERSONAS.find((p) => p.id === effectivePersona) || DEVICE_PERSONAS[1] || DEVICE_PERSONAS[0];
    const timeoutMs = Number(globalPolicy.defaultTimeoutMs) || personaMeta.defaultTimeoutMs;
    const warningMs = Number(globalPolicy.defaultWarningMs) || personaMeta.defaultWarningMs;
    const enabled = effectivePersona === 'kitchen_wallboard' ? false : (personaMeta.enabled && timeoutMs < 86400000);

    return {
      timeoutMs,
      warningMs: Math.min(warningMs, Math.floor(timeoutMs / 2)),
      enabled,
      persona: effectivePersona,
      soundAlerts: globalPolicy.soundAlertsEnabled ?? personaMeta.soundAlertsEnabled,
      countdownTick: globalPolicy.countdownTickEnabled ?? personaMeta.countdownTickEnabled,
      wakeLock: globalPolicy.wakeLockEnabled ?? personaMeta.wakeLockEnabled,
      isRemoteOverride: false,
      isGlobalPolicyForced: false,
      isInheritedGlobal: true,
      isLocalDeviceOverride: false,
      allowDeviceOverrides: true,
      policyReason: globalPolicy.policyReason,
      source: 'global_fleet_inherited',
      deviceName: profile.deviceName,
      campusZone: profile.campusZone,
    };
  }

  // 5. Automatic Hardware Heuristics Fallback
  let effectivePersona = profile.persona;
  if (!effectivePersona || effectivePersona === 'auto_detect') {
    effectivePersona = detectHardwarePersona();
  }

  const personaMeta = DEVICE_PERSONAS.find((p) => p.id === effectivePersona) || DEVICE_PERSONAS[1] || DEVICE_PERSONAS[0];
  const timeoutMs = profile.customTimeoutMs && profile.customTimeoutMs > 0
    ? Number(profile.customTimeoutMs)
    : personaMeta.defaultTimeoutMs;

  const warningMs = profile.customWarningMs && profile.customWarningMs > 0
    ? Number(profile.customWarningMs)
    : personaMeta.defaultWarningMs;

  const enabled = effectivePersona === 'kitchen_wallboard' ? false : (personaMeta.enabled && timeoutMs < 86400000);

  return {
    timeoutMs,
    warningMs: Math.min(warningMs, Math.floor(timeoutMs / 2)),
    enabled,
    persona: effectivePersona,
    soundAlerts: profile.soundAlertsEnabled ?? personaMeta.soundAlertsEnabled,
    countdownTick: profile.countdownTickEnabled ?? personaMeta.countdownTickEnabled,
    wakeLock: profile.wakeLockEnabled ?? personaMeta.wakeLockEnabled,
    isRemoteOverride: false,
    isGlobalPolicyForced: false,
    isInheritedGlobal: false,
    isLocalDeviceOverride: false,
    allowDeviceOverrides: true,
    source: 'hardware_heuristics',
    deviceName: profile.deviceName,
    campusZone: profile.campusZone,
  };
}
