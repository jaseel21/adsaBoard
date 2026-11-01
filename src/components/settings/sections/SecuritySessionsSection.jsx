import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Shield,
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
} from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { dialog } from '../../../utils/dialog';
import { liveSyncManager } from '../../../utils/liveSyncManager';
import {
  DEVICE_PERSONAS,
  TIMEOUT_PRESETS,
  getDeviceProfile,
  updateDeviceProfile,
  resolveEffectiveIdleConfig,
  getRemoteIdlePolicy,
} from '../../../utils/deviceProfileService';

export default function SecuritySessionsSection({
  preferences,
  setPreference,
  user,
  stdata,
}) {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  // Local state for device profile
  const [profile, setProfile] = useState(() => getDeviceProfile());
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

  // Sync profile when external events occur
  useEffect(() => {
    const handleProfileSync = () => {
      setProfile(getDeviceProfile());
      setRemotePolicy(getRemoteIdlePolicy());
    };
    window.addEventListener('adsa:device_profile_updated', handleProfileSync);
    return () => window.removeEventListener('adsa:device_profile_updated', handleProfileSync);
  }, []);

  const activeConfig = resolveEffectiveIdleConfig(profile);

  const handlePersonaSelect = (personaId) => {
    feedback('tick');
    const updated = updateDeviceProfile({
      persona: personaId,
      customTimeoutMs: null, // Reset custom slider to persona default
      customWarningMs: null,
    });
    setProfile(updated);
    setPreference('kioskTimeoutMode', personaId);
  };

  const handlePresetSelect = (preset) => {
    feedback('tick');
    const updated = updateDeviceProfile({
      customTimeoutMs: preset.timeoutMs,
      customWarningMs: preset.warningMs,
    });
    setProfile(updated);
  };

  const handleCustomSliderChange = (e) => {
    const sec = parseInt(e.target.value, 10);
    const ms = sec * 1000;
    const warnMs = Math.min(profile.customWarningMs || 15000, Math.floor(ms / 2));
    const updated = updateDeviceProfile({
      customTimeoutMs: ms,
      customWarningMs: warnMs,
    });
    setProfile(updated);
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
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>{language === 'ml' ? 'ഡിവൈസ് പെർസോണ & കിയോസ്ക് റോൾ' : 'Device Persona & Inactivity Role'}</span>
            </span>
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'ഈ ഡിവൈസിന്റെ ഉപയോഗ രീതി അനുസരിച്ച് അനുയോജ്യമായ പ്രൊഫൈൽ തിരഞ്ഞെടുക്കുക'
              : 'Select how this specific device is deployed on campus to automatically configure its idle protection policies.'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {DEVICE_PERSONAS.map((item) => {
            const isSelected = profile.persona === item.id;
            const Icon = getPersonaIcon(item.id);

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handlePersonaSelect(item.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/30'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : 'text-gray-400'}`} />
                    <span className="text-xs font-bold">{language === 'ml' ? item.labelMl : item.labelEn}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-medium">
                  {language === 'ml' ? item.descMl : item.descEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Timeout Custom Fine-Tuning & Presets */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-0.5">
              <span className="flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-emerald-500" />
                <span>{language === 'ml' ? 'സമയ പരിധി ക്രമീകരണം' : 'Timeout Fine-Tuning & Presets'}</span>
              </span>
            </label>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {language === 'ml'
                ? 'നിശ്ചിത സമയത്തിന് ശേഷം നിഷ്ക്രിയ സെഷൻ തനിയെ അവസാനിക്കും'
                : 'Choose a rapid preset or adjust the slider to customize exact inactivity duration.'}
            </p>
          </div>
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

        {/* Quick Presets Grid */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {TIMEOUT_PRESETS.map((preset) => {
            const isPresetActive = activeConfig.timeoutMs === preset.timeoutMs;
            return (
              <button
                key={preset.label}
                type="button"
                onClick={() => handlePresetSelect(preset)}
                className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all ${
                  isPresetActive
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200/60 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
                title={preset.desc}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {/* Custom Slider (15s to 3600s) */}
        {activeConfig.timeoutMs < 86400000 && (
          <div className="space-y-1.5 pt-2">
            <div className="flex items-center justify-between text-[11px] font-medium text-gray-500">
              <span>Slider Adjustment</span>
              <span>{Math.round(activeConfig.timeoutMs / 1000)}s</span>
            </div>
            <input
              type="range"
              min="15"
              max="1800"
              step="15"
              value={Math.round(activeConfig.timeoutMs / 1000)}
              onChange={handleCustomSliderChange}
              className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
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
