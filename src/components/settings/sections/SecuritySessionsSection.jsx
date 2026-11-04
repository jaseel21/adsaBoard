import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Lock,
  Unlock,
  Clock,
  Laptop,
  Tablet,
  Smartphone,
  Tv,
  Cpu,
  AlertTriangle,
  LogOut,
  Check,
  Volume2,
  VolumeX,
  BellRing,
  Sun,
  Edit2,
  Sliders,
  BatteryCharging,
  Radio,
  RotateCcw,
} from 'lucide-react';
import { AuthContext } from '../../../store/AuthContext';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { dialog } from '../../../utils/dialog';
import { liveSyncManager } from '../../../utils/liveSyncManager';
import {
  DEVICE_PERSONAS,
  TIMEOUT_PRESETS,
  getDeviceProfile,
  updateDeviceProfile,
  resetDeviceProfileToDefaults,
  resolveEffectiveIdleConfig,
  getRemoteIdlePolicy,
} from '../../../utils/deviceProfileService';
import {
  subscribeToGlobalSecurityPolicy,
  getCachedGlobalSecurityPolicy,
} from '../../../utils/securityPolicyService';

export default function SecuritySessionsSection({
  preferences,
  setPreference,
  user: userProp,
  isAdmin: isAdminProp,
  role: roleProp,
  stdata,
}) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  // Resolve authentication state with multiple fail-safes
  const authContext = useContext(AuthContext);
  const user = userProp ?? authContext?.user;
  const isAdmin = Boolean(isAdminProp ?? authContext?.isAdmin);
  const role = roleProp ?? authContext?.role;

  // Local state for device profile & global cloud policy
  const [profile, setProfile] = useState(() => getDeviceProfile());
  const [globalPolicy, setGlobalPolicy] = useState(() => getCachedGlobalSecurityPolicy());
  const [remotePolicy, setRemotePolicy] = useState(() => getRemoteIdlePolicy());
  const [batteryInfo, setBatteryInfo] = useState(null);
  const [isEditingName, setIsEditingName] = useState(false);
  const [customNameInput, setCustomNameInput] = useState(profile.deviceName || '');

  // Battery status API inspection
  useEffect(() => {
    let batteryInstance = null;
    if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
      navigator.getBattery().then((battery) => {
        batteryInstance = battery;
        const updateBattery = () => {
          setBatteryInfo({
            level: Math.round(battery.level * 100),
            charging: battery.charging,
          });
        };
        updateBattery();
        battery.addEventListener('levelchange', updateBattery);
        battery.addEventListener('chargingchange', updateBattery);
      }).catch(() => {});
    }
    return () => {
      if (batteryInstance) {
        batteryInstance.removeEventListener('levelchange', () => {});
        batteryInstance.removeEventListener('chargingchange', () => {});
      }
    };
  }, []);

  // Sync profile & global cloud policy when external events or Firestore updates occur
  useEffect(() => {
    const handleProfileSync = () => {
      setProfile(getDeviceProfile());
      setRemotePolicy(getRemoteIdlePolicy());
      setGlobalPolicy(getCachedGlobalSecurityPolicy());
    };

    const unsubPolicy = subscribeToGlobalSecurityPolicy((latest) => {
      setGlobalPolicy(latest);
      setProfile(getDeviceProfile());
    });

    window.addEventListener('adsa:device_profile_updated', handleProfileSync);
    window.addEventListener('adsa:global_security_policy_updated', handleProfileSync);

    return () => {
      unsubPolicy();
      window.removeEventListener('adsa:device_profile_updated', handleProfileSync);
      window.removeEventListener('adsa:global_security_policy_updated', handleProfileSync);
    };
  }, []);

  const activeConfig = resolveEffectiveIdleConfig(profile);
  const isOverridesBlocked = Boolean(globalPolicy && globalPolicy.allowDeviceOverrides === false);

  const handleBlockedAction = async (featureName) => {
    feedback('warning');
    const confirmed = await dialog.confirm({
      title: language === 'ml' ? 'അഡ്മിൻ ലോഗിൻ ആവശ്യമാണ്' : 'Administrator Authorization Required',
      message: language === 'ml'
        ? `'${featureName}' ക്രമീകരിക്കാൻ അഡ്മിൻ ആയി ലോഗിൻ ചെയ്യണം. ഇവിടെ നൽകുന്ന ക്രമീകരണങ്ങൾ ലോഗൗട്ടിന് ശേഷവും ഈ ഡിവൈസിൽ നിലനിൽക്കുന്നതാണ്. ഇപ്പോൾ ലോഗിൻ പേജിലേക്ക് പോകണോ?`
        : `'${featureName}' can only be configured after logging in as an administrator. Once set, these security parameters remain active on this terminal even after logout. Would you like to log in as an administrator now?`,
      confirmText: language === 'ml' ? 'അഡ്മിൻ ലോഗിൻ' : 'Log In as Admin',
      cancelText: language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel',
      confirmColor: 'emerald',
      icon: 'shield',
    });

    if (confirmed) {
      navigate('/alogin', {
        state: {
          from: '/settings#security',
          notice: 'Please log in as an administrator to configure device persona and inactivity timeout presets.',
        },
      });
    }
  };

  const handlePersonaSelect = (personaId) => {
    if (isOverridesBlocked && personaId !== 'inherit_global') {
      feedback('warning');
      dialog.toast.warning(
        language === 'ml' ? 'ഡിവൈസ് മാറ്റങ്ങൾ തടഞ്ഞിരിക്കുന്നു' : 'Device Overrides Blocked',
        language === 'ml'
          ? 'സെൻട്രൽ കമ്മിറ്റി എല്ലാ ടെർമിനലുകളിലെയും പ്രാദേശിക ക്രമീകരണങ്ങൾ തടഞ്ഞിരിക്കുന്നു. ഗ്ലോബൽ പോളിസി സജീവമാണ്.'
          : 'Central Committee has locked all campus terminals to the Global Security Policy. Local overrides are disabled.'
      );
      return;
    }

    if (!isAdmin) {
      handleBlockedAction(language === 'ml' ? 'ഡിവൈസ് പെർസോണ' : 'Device Persona & Inactivity Role');
      return;
    }

    feedback('tick');
    const updated = updateDeviceProfile({
      persona: personaId,
      customTimeoutMs: null, // Reset custom slider to persona default
      customWarningMs: null,
      adminConfigured: true,
      adminConfiguredAt: new Date().toISOString(),
      adminConfiguredBy: user?.email || 'admin',
      isUserExplicitPersona: true,
    });
    setProfile(updated);
    if (setPreference) {
      setPreference('kioskTimeoutMode', personaId);
    }

    // Persist directly to preferences in localStorage for synchronization
    try {
      const prefsRaw = localStorage.getItem('adsatboard-app-preferences');
      if (prefsRaw) {
        const p = JSON.parse(prefsRaw);
        p.kioskTimeoutMode = personaId;
        localStorage.setItem('adsatboard-app-preferences', JSON.stringify(p));
      }
    } catch (_) {}

    dialog.toast.success(
      language === 'ml' ? 'ഡിവൈസ് പെർസോണ സേവ് ചെയ്തു' : 'Device Persona Saved',
      language === 'ml'
        ? personaId === 'inherit_global'
          ? 'ഈ ഡിവൈസ് ഇനി സെൻട്രൽ ക്ലൗഡ് പോളിസി പിന്തുടരും.'
          : 'ഈ ക്രമീകരണം ലോഗൗട്ടിന് ശേഷവും ഈ ഡിവൈസിൽ നിലനിൽക്കും.'
        : personaId === 'inherit_global'
        ? 'This terminal is now tracking the centralized Campus Fleet Security Policy.'
        : 'Configuration saved. This persona will persist on this terminal even after logging out.'
    );
  };

  const handlePresetSelect = (preset) => {
    if (isOverridesBlocked) {
      feedback('warning');
      dialog.toast.warning(
        language === 'ml' ? 'ഡിവൈസ് മാറ്റങ്ങൾ തടഞ്ഞിരിക്കുന്നു' : 'Device Overrides Blocked',
        language === 'ml'
          ? 'സെൻട്രൽ കമ്മിറ്റി എല്ലാ ടെർമിനലുകളിലെയും പ്രാദേശിക ക്രമീകരണങ്ങൾ തടഞ്ഞിരിക്കുന്നു.'
          : 'Central Committee has locked all campus terminals to the Global Security Policy.'
      );
      return;
    }

    if (!isAdmin) {
      handleBlockedAction(language === 'ml' ? 'സമയ പരിധി' : 'Timeout Fine-Tuning & Presets');
      return;
    }

    feedback('tick');
    const updated = updateDeviceProfile({
      customTimeoutMs: preset.timeoutMs,
      customWarningMs: preset.warningMs,
      adminConfigured: true,
      adminConfiguredAt: new Date().toISOString(),
      adminConfiguredBy: user?.email || 'admin',
    });
    setProfile(updated);

    dialog.toast.success(
      language === 'ml' ? 'സമയ പരിധി മാറ്റി' : 'Timeout Preset Saved',
      language === 'ml'
        ? `${preset.label} നിഷ്ക്രിയ സമയം സേവ് ചെയ്തു. ലോഗൗട്ടിന് ശേഷവും നിലനിൽക്കും.`
        : `${preset.label} inactivity timeout saved. This setting will persist even after logout.`
    );
  };

  const handleCustomSliderChange = (e) => {
    if (isOverridesBlocked || !isAdmin) {
      if (!isAdmin) {
        handleBlockedAction(language === 'ml' ? 'സമയ പരിധി' : 'Timeout Fine-Tuning & Presets');
      }
      return;
    }

    const sec = parseInt(e.target.value, 10);
    const ms = sec * 1000;
    const warnMs = Math.min(profile.customWarningMs || 15000, Math.floor(ms / 2));
    const updated = updateDeviceProfile({
      customTimeoutMs: ms,
      customWarningMs: warnMs,
      adminConfigured: true,
      adminConfiguredAt: new Date().toISOString(),
      adminConfiguredBy: user?.email || 'admin',
    });
    setProfile(updated);
  };

  const handleResetProfileToDefaults = async () => {
    if (!isAdmin) return;

    const confirmed = await dialog.confirm({
      title: language === 'ml' ? 'ഡിവൈസ് പ്രൊഫൈൽ റീസെറ്റ് ചെയ്യണോ?' : 'Reset Terminal Idle Profile?',
      message: language === 'ml'
        ? 'ഇത് ഈ ടെർമിനലിലെ അഡ്മിൻ ക്രമീകരിച്ച പെർസോണയും ടൈംഔട്ടും മാറ്റി ഓട്ടോ-ഡിറ്റക്ഷൻ രീതിയിലേക്ക് തിരികെ നൽകും.'
        : 'This will clear the admin-enforced persona and timeout presets on this terminal, restoring hardware auto-detection.',
      confirmText: language === 'ml' ? 'റീസെറ്റ് ചെയ്യുക' : 'Reset to Defaults',
      cancelText: language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel',
      confirmColor: 'amber',
      icon: 'warning',
    });

    if (confirmed) {
      const reset = resetDeviceProfileToDefaults();
      setProfile(reset);
      feedback('pop');
      dialog.toast.info('Profile Reset', 'Terminal idle profile returned to automatic hardware heuristics.');
    }
  };

  const handleToggleSound = () => {
    feedback('tick');
    const updated = updateDeviceProfile({
      soundAlertsEnabled: !profile.soundAlertsEnabled,
    });
    setProfile(updated);
  };

  const handleToggleCountdownTick = () => {
    feedback('tick');
    const updated = updateDeviceProfile({
      countdownTickEnabled: !profile.countdownTickEnabled,
    });
    setProfile(updated);
  };

  const handleToggleWakeLock = () => {
    feedback('tick');
    const updated = updateDeviceProfile({
      wakeLockEnabled: !profile.wakeLockEnabled,
    });
    setProfile(updated);
  };

  const handleSaveDeviceName = () => {
    if (customNameInput.trim()) {
      feedback('success');
      const updated = updateDeviceProfile({
        deviceName: customNameInput.trim(),
      });
      setProfile(updated);
      setIsEditingName(false);
    }
  };

  const handlePurgeAllSessions = async () => {
    const confirmed = await dialog.confirm({
      title: language === 'ml' ? 'സെഷൻ ക്ലിയർ ചെയ്യണോ?' : 'Purge Active Client Sessions?',
      message: language === 'ml'
        ? 'ഇത് ഈ ബ്രൗസറിലെ എല്ലാ താൽക്കാലിക ലോഗിൻ വിവരങ്ങളും ക്ലിയർ ചെയ്യും.'
        : 'This will terminate current session tokens and clear all cached credentials on this device.',
      confirmText: language === 'ml' ? 'ക്ലിയർ ചെയ്യുക' : 'Purge Sessions',
      cancelText: language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel',
      confirmColor: 'rose',
      icon: 'warning',
    });

    if (confirmed) {
      sessionStorage.clear();
      liveSyncManager.broadcast('SESSION_PURGE');
      window.dispatchEvent(new CustomEvent('adsa:session_purged'));
      feedback('pop');
      dialog.toast.info('Sessions Cleared', 'Active tokens cleared from this terminal.');
      navigate('/', { replace: true });
    }
  };

  const screenResolution = typeof window !== 'undefined' ? `${window.innerWidth} x ${window.innerHeight}` : 'Standard';
  const isStandalone = typeof window !== 'undefined' && (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone);

  const getPersonaIcon = (id) => {
    switch (id) {
      case 'inherit_global':
        return Radio;
      case 'kitchen_wallboard':
        return Tv;
      case 'personal_mobile':
        return Smartphone;
      case 'admin_workstation':
        return Laptop;
      case 'auto_detect':
        return Cpu;
      default:
        return Tablet;
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-3 border-b border-gray-200/80 dark:border-white/10">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500" />
          <span>{language === 'ml' ? 'സുരക്ഷ & കിയോസ്ക് ഗാർഡ്' : 'Security, Sessions & Kiosk Guards'}</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ml'
            ? 'ഡിവൈസ് അടിസ്ഥാനമാക്കിയുള്ള ഓട്ടോ-ലോഗൗട്ട്, കിയോസ്ക് സമയം, സെഷൻ സുരക്ഷ എന്നിവ ക്രമീകരിക്കുക'
            : 'Configure device-specific inactivity guards, public kiosk timeouts, and terminal telemetry'}
        </p>
      </div>

      {/* Remote Policy Banner (if active) */}
      {remotePolicy && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-800 dark:text-amber-200">
          <Radio className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5 animate-pulse" />
          <div>
            <div className="font-extrabold flex items-center gap-2">
              <span>Sentinel Remote Policy Enforced</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400">
                Active Override
              </span>
            </div>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80 mt-0.5">
              {remotePolicy.reason || 'Central Committee policy active on this terminal.'} Timeout locked to{' '}
              <span className="font-bold">{Math.round(remotePolicy.timeoutMs / 1000)}s</span>.
            </p>
          </div>
        </div>
      )}

      {/* 1. Device Hardware Identity Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tablet className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
              {language === 'ml' ? 'ഈ ഡിവൈസിന്റെ ഐഡന്റിറ്റി' : 'Device Terminal Identity'}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
            {profile.deviceId}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
          <div className="space-y-1">
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block">
              {language === 'ml' ? 'ഡിവൈസ് പേര് & സോൺ' : 'Terminal Friendly Name'}
            </span>
            {isEditingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customNameInput}
                  onChange={(e) => setCustomNameInput(e.target.value)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-emerald-500 bg-white dark:bg-[#080d0b] text-gray-800 dark:text-white"
                  placeholder="e.g. Dining Tablet #1"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveDeviceName}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg bg-emerald-500 text-white"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditingName(false)}
                  className="px-2.5 py-1 text-xs font-medium text-gray-500"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                  {profile.deviceName}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setCustomNameInput(profile.deviceName || '');
                    setIsEditingName(true);
                  }}
                  className="text-gray-400 hover:text-emerald-500 transition-colors"
                  title="Rename Device"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            <span className="text-[11px] text-gray-500 dark:text-gray-400 block font-medium">
              Campus Zone: <span className="capitalize font-bold text-gray-700 dark:text-gray-300">{profile.campusZone.replace('_', ' ')}</span>
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap text-[10px]">
            <span className="px-2 py-1 rounded-lg bg-gray-200/60 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-medium">
              {screenResolution}
            </span>
            <span className="px-2 py-1 rounded-lg bg-gray-200/60 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-medium">
              {isStandalone ? 'PWA Kiosk Mode' : 'Web Browser'}
            </span>
            {batteryInfo && (
              <span className="px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <BatteryCharging className="w-3 h-3" />
                <span>{batteryInfo.level}% {batteryInfo.charging ? '(Plugged)' : ''}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 2. Device Persona Selector */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-500" />
                <span>{language === 'ml' ? 'ഡിവൈസ് പെർസോണ & കിയോസ്ക് റോൾ' : 'Device Persona & Inactivity Role'}</span>
              </span>
            </label>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {language === 'ml'
                ? 'ഈ ഡിവൈസിന്റെ ഉപയോഗ രീതി അനുസരിച്ച് അനുയോജ്യമായ പ്രൊഫൈൽ തിരഞ്ഞെടുക്കുക (അഡ്മിൻ ലോഗിൻ ആവശ്യമുള്ള ക്രമീകരണം)'
                : 'Select how this specific device is deployed on campus to automatically configure its idle protection policies.'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
            {isOverridesBlocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'ml' ? 'ഫ്ലീറ്റ് ലോക്ക് സജീവം' : 'Fleet Lock Enforced'}</span>
              </span>
            ) : isAdmin ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>{language === 'ml' ? 'അഡ്മിൻ അൺലോക്ക്ഡ്' : 'Admin Configurable'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'ml' ? 'അഡ്മിൻ ലോക്ക്ഡ്' : 'Admin Protected'}</span>
              </span>
            )}
          </div>
        </div>

        {/* Informational Guidance Banner */}
        {isOverridesBlocked ? (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-xs">
                {language === 'ml' ? 'സെൻട്രൽ ഫ്ലീറ്റ് പോളിസി നിർബന്ധമാക്കി' : 'Campus Fleet Lock Enforced (Local Overrides Blocked)'}
              </span>
              <span className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-0.5 block">
                {language === 'ml'
                  ? `സെൻട്രൽ കമ്മിറ്റി എല്ലാ ടെർമിനലുകളിലെയും പ്രാദേശിക ക്രമീകരണങ്ങൾ തടഞ്ഞിരിക്കുന്നു. ഈ ഡിവൈസ് ക്ലൗഡ് പോളിസി (${Math.round(globalPolicy.defaultTimeoutMs / 1000)}s) നിർബന്ധപൂർവ്വം ഉപയോഗിക്കുന്നു.`
                  : `The Central Committee has blocked local terminal overrides. All campus stations are strictly enforced to the Global Fleet Policy (${Math.round(globalPolicy.defaultTimeoutMs / 1000)}s timeout, ${globalPolicy.defaultPersona.replace('_', ' ')}).`}
              </span>
            </div>
          </div>
        ) : !isAdmin ? (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block text-xs">
                  {language === 'ml' ? 'അഡ്മിൻ അനുമതി ആവശ്യമാണ്' : 'Administrator Authorization Required'}
                </span>
                <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5 block">
                  {language === 'ml'
                    ? 'ഡിവൈസ് പെർസോണ മാറ്റാൻ അഡ്മിൻ ആയി ലോഗിൻ ചെയ്യണം. നൽകിയ ക്രമീകരണങ്ങൾ ലോഗൗട്ടിന് ശേഷവും ഈ ഡിവൈസിൽ നിലനിൽക്കും.'
                    : 'Device persona can only be configured after logging in as admin. Configured settings are kept on this device even after logout.'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleBlockedAction(language === 'ml' ? 'ഡിവൈസ് പെർസോണ' : 'Device Persona & Inactivity Role')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-xs transition-all whitespace-nowrap self-end sm:self-center cursor-pointer"
            >
              {language === 'ml' ? 'അഡ്മിൻ ലോഗിൻ' : 'Sign In as Admin'}
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-200">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span className="text-[11px]">
                {language === 'ml'
                  ? 'നിങ്ങൾ അഡ്മിൻ ആയി ലോഗിൻ ചെയ്തിരിക്കുന്നു. മാറ്റങ്ങൾ ഈ ഡിവൈസിൽ ലോഗൗട്ടിന് ശേഷവും നിലനിൽക്കും.'
                  : 'Administrator Mode: Modifications will be stored on this device and kept even after logging out.'}
              </span>
            </div>
            {profile.adminConfigured && (
              <button
                type="button"
                onClick={handleResetProfileToDefaults}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold transition-colors self-end sm:self-center cursor-pointer"
                title="Reset to default auto-detection"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{language === 'ml' ? 'റീസെറ്റ്' : 'Reset Defaults'}</span>
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {DEVICE_PERSONAS.map((item) => {
            const isSelected = activeConfig.persona === item.id || (profile.persona === item.id);
            const Icon = getPersonaIcon(item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  if (isOverridesBlocked) {
                    dialog.toast.warning(
                      language === 'ml' ? 'ഡിവൈസ് മാറ്റങ്ങൾ തടഞ്ഞിരിക്കുന്നു' : 'Device Overrides Blocked',
                      language === 'ml'
                        ? 'സെൻട്രൽ കമ്മിറ്റി പ്രാദേശിക മാറ്റങ്ങൾ തടഞ്ഞിരിക്കുന്നു. ഗ്ലോബൽ പോളിസി സജീവമാണ്.'
                        : 'Central Committee has locked all campus terminals to the Global Security Policy.'
                    );
                    return;
                  }
                  if (!isAdmin) {
                    handleBlockedAction(language === 'ml' ? 'ഡിവൈസ് പെർസോണ' : 'Device Persona & Inactivity Role');
                  } else {
                    handlePersonaSelect(item.id);
                  }
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/30'
                    : isOverridesBlocked
                    ? 'bg-gray-50/40 dark:bg-white/5 border-gray-200/30 dark:border-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-60'
                    : isAdmin
                    ? 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer'
                    : 'bg-gray-50/60 dark:bg-white/5 border-gray-200/40 dark:border-white/5 text-gray-400 dark:text-gray-500 cursor-pointer opacity-75'
                }`}
                title={
                  isOverridesBlocked
                    ? (language === 'ml' ? 'സെൻട്രൽ പോളിസി ലോക്ക് ചെയ്തിരിക്കുന്നു' : 'Device overrides blocked by Central Admin')
                    : !isAdmin
                    ? (language === 'ml' ? 'അഡ്മിൻ അനുമതി ആവശ്യമാണ്' : 'Admin authorization required to change persona')
                    : undefined
                }
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : isAdmin && !isOverridesBlocked ? 'text-gray-400' : 'text-gray-400/70'}`} />
                      <span className="text-xs font-bold">{language === 'ml' ? item.labelMl : item.labelEn}</span>
                    </div>
                    {isSelected ? (
                      <div className="flex items-center gap-1">
                        {!isAdmin && <Lock className="w-3 h-3 text-amber-500" title="Admin Enforced" />}
                        <Check className="w-4 h-4 text-emerald-500" />
                      </div>
                    ) : (
                      (!isAdmin || isOverridesBlocked) && <Lock className="w-3 h-3 text-gray-300 dark:text-gray-600" />
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-medium block">
                    {language === 'ml' ? item.descMl : item.descEn}
                  </span>
                </div>

                {isSelected && (
                  <div className="mt-2.5 pt-2 border-t border-emerald-500/20 flex items-center justify-between text-[9px] font-bold">
                    <span className="text-emerald-600 dark:text-emerald-400">
                      {item.id === 'inherit_global'
                        ? (language === 'ml' ? 'ക്ലൗഡ് പോളിസി പിന്തുടരുന്നു' : 'Tracking Campus Cloud Policy')
                        : (language === 'ml' ? 'സജീവ പെർസോണ' : 'Active Inactivity Role')}
                    </span>
                    {isOverridesBlocked ? (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <ShieldAlert className="w-2.5 h-2.5" />
                        <span>{language === 'ml' ? 'ഫ്ലീറ്റ് ലോക്ക്' : 'Fleet Locked'}</span>
                      </span>
                    ) : !isAdmin ? (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" />
                        <span>{language === 'ml' ? 'ലോക്ക്ഡ്' : 'Admin Protected'}</span>
                      </span>
                    ) : null}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Timeout Custom Fine-Tuning & Presets */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-0.5">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <span>{language === 'ml' ? 'സമയ പരിധി ക്രമീകരണം' : 'Timeout Fine-Tuning & Presets'}</span>
              </span>
            </label>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {language === 'ml'
                ? 'നിശ്ചിത സമയത്തിന് ശേഷം നിഷ്ക്രിയ സെഷൻ തനിയെ അവസാനിക്കും (അഡ്മിൻ ലോഗിൻ ആവശ്യമുള്ള ക്രമീകരണം)'
                : 'Choose a rapid preset or adjust the slider to customize exact inactivity duration.'}
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-center">
            {isOverridesBlocked ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/40">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'ml' ? 'ഫ്ലീറ്റ് ലോക്ക്' : 'Fleet Enforced'}</span>
              </span>
            ) : isAdmin ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>{language === 'ml' ? 'അഡ്മിൻ അൺലോക്ക്ഡ്' : 'Admin Configurable'}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                <Lock className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'ml' ? 'അഡ്മിൻ ലോക്ക്ഡ്' : 'Admin Protected'}</span>
              </span>
            )}
            <div className="text-right">
              <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                {activeConfig.timeoutMs >= 86400000
                  ? '24 Hours'
                  : activeConfig.timeoutMs >= 60000
                  ? `${Math.round(activeConfig.timeoutMs / 60000)} min`
                  : `${Math.round(activeConfig.timeoutMs / 1000)} sec`}
              </span>
              <span className="text-[10px] text-gray-400 block font-medium">
                Warning: {Math.round(activeConfig.warningMs / 1000)}s
              </span>
            </div>
          </div>
        </div>

        {/* Informational Guidance Banner */}
        {isOverridesBlocked ? (
          <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block text-xs">
                {language === 'ml' ? 'സമയ പരിധി സെൻട്രൽ പോളിസിയിൽ ലോക്ക് ചെയ്തിരിക്കുന്നു' : 'Timeouts Locked to Central Fleet Policy'}
              </span>
              <span className="text-[11px] text-amber-800/90 dark:text-amber-300/90 mt-0.5 block">
                {language === 'ml'
                  ? 'സെൻട്രൽ കമ്മിറ്റി നിർദ്ദേശിച്ച സമയം ഈ ടെർമിനലിൽ നിർബന്ധമാക്കിയിരിക്കുന്നു. അഡ്മിൻ കൺസോളിൽ മാത്രമേ മാറ്റം സാധ്യമാകൂ.'
                  : 'Individual timeout adjustments are disabled while Central Committee Fleet Lock is active. Timeouts can be adjusted centrally in the Admin Console.'}
              </span>
            </div>
          </div>
        ) : !isAdmin ? (
          <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200">
            <div className="flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block text-xs">
                  {language === 'ml' ? 'ടൈംഔട്ട് പരിധികൾ അഡ്മിൻ സംരക്ഷിതമാണ്' : 'Inactivity Timeouts Admin Protected'}
                </span>
                <span className="text-[11px] text-amber-800/80 dark:text-amber-300/80 mt-0.5 block">
                  {language === 'ml'
                    ? 'ഈ ടെർമിനലിലെ നിഷ്ക്രിയ സമയ പരിധി അഡ്മിൻ ക്രമീകരിച്ചതാണ്. മാറ്റങ്ങൾ വരുത്താൻ അഡ്മിൻ ലോഗിൻ വേണം. സേവ് ചെയ്ത സമയം ലോഗൗട്ടിന് ശേഷവും നിലനിൽക്കും.'
                    : 'Terminal timeout presets and custom slider are protected by admin policy. Log in as admin to configure. Settings persist across logouts.'}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleBlockedAction(language === 'ml' ? 'സമയ പരിധി' : 'Timeout Fine-Tuning & Presets')}
              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-xs transition-all whitespace-nowrap self-end sm:self-center cursor-pointer"
            >
              {language === 'ml' ? 'അഡ്മിൻ ലോഗിൻ' : 'Sign In as Admin'}
            </button>
          </div>
        ) : (
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="text-[11px]">
              {language === 'ml'
                ? 'അഡ്മിൻ മോഡ് സജീവം: പ്രീസെറ്റ് അല്ലെങ്കിൽ സ്ലൈഡർ മാറ്റങ്ങൾ ഈ ഡിവൈസിൽ ലോഗൗട്ടിന് ശേഷവും നിലനിൽക്കും.'
                : 'Administrator Mode: Preset selections or slider adjustments are saved permanently to this terminal and kept across logouts.'}
            </span>
          </div>
        )}

        {/* Quick Presets Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {TIMEOUT_PRESETS.map((preset) => {
            const isPresetActive = activeConfig.timeoutMs === preset.timeoutMs;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => {
                  if (isOverridesBlocked) {
                    dialog.toast.warning(
                      language === 'ml' ? 'ഡിവൈസ് മാറ്റങ്ങൾ തടഞ്ഞിരിക്കുന്നു' : 'Device Overrides Blocked',
                      language === 'ml'
                        ? 'സെൻട്രൽ കമ്മിറ്റി പ്രാദേശിക മാറ്റങ്ങൾ തടഞ്ഞിരിക്കുന്നു. ഗ്ലോബൽ പോളിസി സജീവമാണ്.'
                        : 'Central Committee has locked all campus terminals to the Global Security Policy.'
                    );
                    return;
                  }
                  if (!isAdmin) {
                    handleBlockedAction(language === 'ml' ? 'സമയ പരിധി' : 'Timeout Fine-Tuning & Presets');
                  } else {
                    handlePresetSelect(preset);
                  }
                }}
                disabled={isOverridesBlocked}
                className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all flex items-center justify-center gap-1 ${
                  isPresetActive
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : isOverridesBlocked
                    ? 'bg-gray-50/40 dark:bg-white/5 border-gray-200/30 dark:border-white/5 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50'
                    : isAdmin
                    ? 'bg-gray-50 dark:bg-white/5 border-gray-200/60 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 cursor-pointer'
                    : 'bg-gray-50/60 dark:bg-white/5 border-gray-200/40 dark:border-white/5 text-gray-400 dark:text-gray-500 cursor-pointer opacity-60'
                }`}
                title={
                  isOverridesBlocked
                    ? (language === 'ml' ? 'ഫ്ലീറ്റ് ലോക്ക് സജീവം' : 'Timeouts locked to central fleet policy')
                    : !isAdmin
                    ? (language === 'ml' ? 'അഡ്മിൻ അനുമതി ആവശ്യമാണ്' : 'Admin authorization required')
                    : preset.desc
                }
              >
                <span>{preset.label}</span>
                {isPresetActive && (!isAdmin || isOverridesBlocked) && <Lock className="w-2.5 h-2.5 text-white/80" />}
              </button>
            );
          })}
        </div>

        {/* Custom Slider (15s to 1800s) */}
        {activeConfig.timeoutMs < 86400000 && (
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-500">
              <span className="flex items-center gap-1.5">
                <span>{language === 'ml' ? 'സ്ലൈഡർ അഡ്ജസ്റ്റ്‌മെന്റ്' : 'Slider Adjustment'}</span>
                {(isOverridesBlocked || !isAdmin) && (
                  <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-bold">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{isOverridesBlocked ? (language === 'ml' ? 'ഫ്ലീറ്റ് ലോക്ക്' : 'Fleet Lock') : (language === 'ml' ? 'ലോക്ക്ഡ്' : 'Admin Locked')}</span>
                  </span>
                )}
              </span>
              <span>{Math.round(activeConfig.timeoutMs / 1000)}s</span>
            </div>
            <input
              type="range"
              min="15"
              max="1800"
              step="15"
              value={Math.round(activeConfig.timeoutMs / 1000)}
              onChange={handleCustomSliderChange}
              disabled={isOverridesBlocked || !isAdmin}
              className={`w-full h-1.5 rounded-lg appearance-none transition-all ${
                isAdmin && !isOverridesBlocked
                  ? 'bg-gray-200 dark:bg-white/10 cursor-pointer accent-emerald-500'
                  : 'bg-gray-200/60 dark:bg-white/5 cursor-not-allowed accent-gray-400 opacity-60'
              }`}
            />
          </div>
        )}
      </div>

      {/* 4. Auditory, Tactile & Screen WakeLock Toggles */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-3">
        <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block">
          <span className="flex items-center gap-1.5">
            <BellRing className="w-4 h-4 text-emerald-500" />
            <span>{language === 'ml' ? 'ശബ്ദ & സ്ക്രീൻ ഗാർഡ് ക്രമീകരണം' : 'Auditory, Tactile & WakeLock Preferences'}</span>
          </span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {/* Warning Chime Toggle */}
          <button
            type="button"
            onClick={handleToggleSound}
            className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
              profile.soundAlertsEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                : 'bg-gray-50 dark:bg-white/5 border-gray-200/60 dark:border-white/5 text-gray-500'
            }`}
          >
            <div className="flex items-center gap-2">
              {profile.soundAlertsEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4" />}
              <span className="text-xs font-bold">Warning Chime</span>
            </div>
            <span className="text-[10px] font-bold uppercase">{profile.soundAlertsEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Countdown Ticking Pulse */}
          <button
            type="button"
            onClick={handleToggleCountdownTick}
            className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
              profile.countdownTickEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                : 'bg-gray-50 dark:bg-white/5 border-gray-200/60 dark:border-white/5 text-gray-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${profile.countdownTickEnabled ? 'text-emerald-500' : ''}`} />
              <span className="text-xs font-bold">5s Ticking Alert</span>
            </div>
            <span className="text-[10px] font-bold uppercase">{profile.countdownTickEnabled ? 'ON' : 'OFF'}</span>
          </button>

          {/* Screen WakeLock */}
          <button
            type="button"
            onClick={handleToggleWakeLock}
            className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
              profile.wakeLockEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                : 'bg-gray-50 dark:bg-white/5 border-gray-200/60 dark:border-white/5 text-gray-500'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sun className={`w-4 h-4 ${profile.wakeLockEnabled ? 'text-emerald-500' : ''}`} />
              <span className="text-xs font-bold">Screen WakeLock</span>
            </div>
            <span className="text-[10px] font-bold uppercase">{profile.wakeLockEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* 5. Active Session Telemetry & Emergency Purge */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
              {language === 'ml' ? 'സെഷൻ വിവരങ്ങൾ & എമർജൻസി ക്ലിയർ' : 'Current Client Session Telemetry'}
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Active Guard
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[10px] text-gray-400 font-bold block mb-1">Active Authentication</span>
            <span className="font-extrabold text-gray-800 dark:text-gray-200">
              {stdata ? `Student Token ${stdata.tokenNo}` : user ? user.email : 'Unauthenticated Guest'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[10px] text-gray-400 font-bold block mb-1">Active Persona Policy</span>
            <span className="font-mono text-gray-800 dark:text-gray-200 font-bold capitalize">
              {activeConfig.persona.replace('_', ' ')} ({Math.round(activeConfig.timeoutMs / 1000)}s)
            </span>
            {activeConfig.isGlobalPolicyForced ? (
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1 mt-1">
                <ShieldAlert className="w-3 h-3" />
                <span>
                  {language === 'ml'
                    ? 'സെൻട്രൽ ഫ്ലീറ്റ് ലോക്ക് • മാറ്റങ്ങൾ തടഞ്ഞിരിക്കുന്നു'
                    : 'Central Fleet Lock • Overrides Blocked'}
                </span>
              </span>
            ) : activeConfig.isInheritedGlobal ? (
              <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold flex items-center gap-1 mt-1">
                <Radio className="w-3 h-3 text-teal-500" />
                <span>
                  {language === 'ml'
                    ? 'ക്ലൗഡ് പോളിസി ട്രാക്ക് ചെയ്യുന്നു'
                    : 'Tracking Campus Global Policy'}
                </span>
              </span>
            ) : profile.adminConfigured ? (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 mt-1">
                <ShieldCheck className="w-3 h-3" />
                <span>
                  {language === 'ml'
                    ? 'ഡിവൈസ് അഡ്മിൻ ക്രമീകരണം • ലോഗൗട്ടിന് ശേഷവും സജീവം'
                    : 'Dedicated Device Override • Kept Across Logouts'}
                </span>
              </span>
            ) : null}
          </div>
        </div>

        {/* Emergency Session Purge */}
        <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml' ? 'പൊതു കമ്പ്യൂട്ടറുകളിൽ നിന്ന് ഇറങ്ങുമ്പോൾ സെഷൻ ക്ലിയർ ചെയ്യുക' : 'Safely invalidate cached session tokens on shared devices'}
          </span>
          <button
            type="button"
            onClick={handlePurgeAllSessions}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{language === 'ml' ? 'സെഷൻ മായ്‌ക്കുക' : 'Purge Session'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
