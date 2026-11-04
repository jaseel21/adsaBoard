import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Lock,
  Unlock,
  Clock,
  Sliders,
  Check,
  X,
  Radio,
  RotateCcw,
  Volume2,
  VolumeX,
  Sun,
  Tv,
  Tablet,
  Smartphone,
  Laptop,
  Cpu,
  Info,
  Calendar,
} from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { dialog } from '../../../utils/dialog';
import {
  DEFAULT_SECURITY_POLICY,
  subscribeToGlobalSecurityPolicy,
  updateGlobalSecurityPolicy,
  getCachedGlobalSecurityPolicy,
} from '../../../utils/securityPolicyService';
import { TIMEOUT_PRESETS } from '../../../utils/deviceProfileService';

export default function GlobalSecurityPolicyModal({ isOpen, onClose, user, role }) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  // Cloud state
  const [cloudPolicy, setCloudPolicy] = useState(getCachedGlobalSecurityPolicy);
  const [draftPolicy, setDraftPolicy] = useState(getCachedGlobalSecurityPolicy);
  const [isSaving, setIsSaving] = useState(false);

  // Subscribe to real-time Firestore updates
  useEffect(() => {
    if (!isOpen) return;

    const unsub = subscribeToGlobalSecurityPolicy((latest) => {
      setCloudPolicy(latest);
      setDraftPolicy((prev) => ({
        ...latest,
        ...prev, // Keep unsaved user edits if currently typing
      }));
    });

    return () => unsub();
  }, [isOpen]);

  // Synchronize draft on open
  useEffect(() => {
    if (isOpen) {
      const current = getCachedGlobalSecurityPolicy();
      setCloudPolicy(current);
      setDraftPolicy(current);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleAllowOverrides = () => {
    feedback('tick');
    setDraftPolicy((prev) => ({
      ...prev,
      allowDeviceOverrides: !prev.allowDeviceOverrides,
    }));
  };

  const handleSelectDefaultPersona = (personaId) => {
    feedback('tick');
    setDraftPolicy((prev) => ({
      ...prev,
      defaultPersona: personaId,
    }));
  };

  const handleSelectPreset = (preset) => {
    feedback('tick');
    setDraftPolicy((prev) => ({
      ...prev,
      defaultTimeoutMs: preset.timeoutMs,
      defaultWarningMs: preset.warningMs,
    }));
  };

  const handleSliderChange = (e) => {
    const sec = parseInt(e.target.value, 10);
    const ms = sec * 1000;
    const warnMs = Math.min(draftPolicy.defaultWarningMs || 15000, Math.floor(ms / 2));
    setDraftPolicy((prev) => ({
      ...prev,
      defaultTimeoutMs: ms,
      defaultWarningMs: warnMs,
    }));
  };

  const handleToggleSound = () => {
    feedback('tick');
    setDraftPolicy((prev) => ({
      ...prev,
      soundAlertsEnabled: !prev.soundAlertsEnabled,
    }));
  };

  const handleToggleCountdown = () => {
    feedback('tick');
    setDraftPolicy((prev) => ({
      ...prev,
      countdownTickEnabled: !prev.countdownTickEnabled,
    }));
  };

  const handleToggleWakeLock = () => {
    feedback('tick');
    setDraftPolicy((prev) => ({
      ...prev,
      wakeLockEnabled: !prev.wakeLockEnabled,
    }));
  };

  const handleSavePolicy = async () => {
    feedback('tick');

    const confirmed = await dialog.confirm({
      title: language === 'ml' ? 'ഗ്ലോബൽ സെക്യൂരിറ്റി പോളിസി സേവ് ചെയ്യണോ?' : 'Deploy Campus Fleet Security Policy?',
      message: language === 'ml'
        ? draftPolicy.allowDeviceOverrides === false
          ? 'ശ്രദ്ധിക്കുക: ഡിവൈസ് അടിസ്ഥാനമാക്കിയുള്ള മാറ്റങ്ങൾ തടഞ്ഞിരിക്കുന്നു. കാമ്പസിലെ എല്ലാ ടെർമിനലുകളും ഈ ഗ്ലോബൽ പോളിസിയിലേക്ക് നിർബന്ധപൂർവ്വം മാറും.'
          : 'ഈ മാറ്റങ്ങൾ കാമ്പസിലെ എല്ലാ ടെർമിനലുകളിലേക്കും തത്സമയം ബാധകമാകും.'
        : draftPolicy.allowDeviceOverrides === false
        ? 'Warning: Local device overrides are set to BLOCKED. All terminals across campus will be forced to obey this global policy immediately.'
        : 'This will update the central campus security baseline. Unspecialized terminals will instantly adopt these parameters.',
      confirmText: language === 'ml' ? 'സേവ് ചെയ്യുക' : 'Deploy Policy',
      cancelText: language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel',
      confirmColor: draftPolicy.allowDeviceOverrides === false ? 'amber' : 'emerald',
      icon: 'shield',
    });

    if (!confirmed) return;

    setIsSaving(true);
    try {
      await updateGlobalSecurityPolicy(draftPolicy, {
        uid: user?.uid,
        displayName: user?.displayName || user?.email,
        email: user?.email,
        role,
      });

      feedback('success');
      dialog.toast.success(
        language === 'ml' ? 'പോളിസി അപ്ഡേറ്റ് ചെയ്തു' : 'Fleet Policy Deployed',
        language === 'ml'
          ? 'കാമ്പസ് ഗ്ലോബൽ സെക്യൂരിറ്റി ക്രമീകരണങ്ങൾ ക്ലൗഡിൽ സേവ് ചെയ്തു.'
          : 'Campus Fleet Security Policy successfully updated in Firestore.'
      );
      onClose();
    } catch (err) {
      console.error('Failed to update global security policy:', err);
      feedback('warning');
      dialog.toast.error('Deployment Error', 'Failed to update global policy in Firestore.');
    } finally {
      setIsSaving(false);
    }
  };

  const personaOptions = [
    { id: 'public_kiosk', labelEn: 'Public Kiosk Tablet', labelMl: 'പൊതു കിയോസ്ക് ടാബ്‌ലെറ്റ്', icon: Tablet },
    { id: 'auto_detect', labelEn: 'Auto-Detect Hardware', labelMl: 'ഓട്ടോമാറ്റിക് ഡിറ്റക്ഷൻ', icon: Cpu },
    { id: 'personal_mobile', labelEn: 'Personal Smartphone', labelMl: 'സ്വന്തം മൊബൈൽ ഫോൺ', icon: Smartphone },
    { id: 'kitchen_wallboard', labelEn: 'Kitchen Display (KDS)', labelMl: 'അടുക്കള ഡിസ്‌പ്ലേ (KDS)', icon: Tv },
    { id: 'admin_workstation', labelEn: 'Committee Workstation', labelMl: 'കമ്മിറ്റി വർക്ക്സ്റ്റേഷൻ', icon: Laptop },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/60 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl my-6 rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 border-b border-gray-200 dark:border-white/10 flex items-start justify-between gap-4 bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                    {language === 'ml' ? 'കാമ്പസ് ഫ്ലീറ്റ് സെക്യൂരിറ്റി പോളിസി' : 'Campus Fleet Security & Inactivity Policy'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    Central Cloud
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {language === 'ml'
                    ? 'കാമ്പസിലെ എല്ലാ കിയോസ്കുകളുടെയും പൊതുവായ ഓട്ടോ-ലോഗൗട്ട് സമയവും പോളിസിയും നിശ്ചയിക്കുക'
                    : 'Manage campus-wide kiosk timeouts, default personas, and local terminal override rules'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 space-y-6 overflow-y-auto">
            {/* 1. MASTER FLEET TOGGLE: ALLOW VS BLOCK LOCAL OVERRIDES */}
            <div className={`p-4 sm:p-5 rounded-3xl border transition-all ${
              draftPolicy.allowDeviceOverrides
                ? 'bg-emerald-500/5 border-emerald-500/30 dark:bg-emerald-500/10'
                : 'bg-amber-500/10 border-amber-500/40 dark:bg-amber-500/15'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {draftPolicy.allowDeviceOverrides ? (
                      <Unlock className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Lock className="w-4 h-4 text-amber-500" />
                    )}
                    <span className="text-sm font-black text-gray-900 dark:text-white">
                      {language === 'ml' ? 'ഡിവൈസ് പ്രത്യേക ക്രമീകരണങ്ങൾ അനുവദിക്കുക' : 'Allow Device-Specific Configurations'}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      draftPolicy.allowDeviceOverrides
                        ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold'
                    }`}>
                      {draftPolicy.allowDeviceOverrides ? 'Flexible Mode' : 'Strict Fleet Lock'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 max-w-xl">
                    {draftPolicy.allowDeviceOverrides
                      ? (language === 'ml'
                          ? 'ഓരോ ഡിവൈസിലും അഡ്മിൻ ലോഗിൻ ചെയ്ത ശേഷം ആ ഡിവൈസിന് മാത്രമായി പ്രത്യേക പെർസോണയും ടൈംഔട്ടും ക്രമീകരിക്കാം.'
                          : 'Admins can configure station-specific overrides locally on individual tablets (e.g. wallboard kitchen displays, dedicated dining counters).')
                      : (language === 'ml'
                          ? 'ശ്രദ്ധിക്കുക: കാമ്പസിലെ എല്ലാ ഡിവൈസുകളിലെയും പ്രത്യേക ക്രമീകരണങ്ങൾ തടഞ്ഞിരിക്കുന്നു. എല്ലാ ടെർമിനലുകളും ഈ ഗ്ലോബൽ പോളിസി പാലിക്കാൻ നിർബന്ധിതമാണ്.'
                          : 'Strict Lockdown Active: All physical terminals across campus are forced to obey this Global Fleet Policy. Local device overrides are blocked.')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggleAllowOverrides}
                  className={`px-4 py-2 rounded-2xl font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 shrink-0 ${
                    draftPolicy.allowDeviceOverrides
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      : 'bg-amber-600 hover:bg-amber-500 text-white'
                  }`}
                >
                  {draftPolicy.allowDeviceOverrides ? (
                    <>
                      <Unlock className="w-3.5 h-3.5" />
                      <span>{language === 'ml' ? 'അനുവദിച്ചിരിക്കുന്നു' : 'Overrides Allowed'}</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>{language === 'ml' ? 'ബ്ലോക്ക് ചെയ്തു' : 'Overrides Blocked'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 2. CAMPUS DEFAULT PERSONA */}
            <div className="space-y-3">
              <div>
                <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-0.5">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    <span>{language === 'ml' ? 'കാമ്പസ് ഡിഫോൾട്ട് പെർസോണ' : 'Campus Default Inactivity Role'}</span>
                  </span>
                </label>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {language === 'ml'
                    ? 'പ്രത്യേകം നിശ്ചയിക്കാത്ത എല്ലാ ടെർമിനലുകളും ഉപയോഗിക്കേണ്ട ഡിഫോൾട്ട് റോൾ'
                    : 'The baseline role applied to public terminals tracking the global cloud policy'}
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {personaOptions.map((opt) => {
                  const isSelected = draftPolicy.defaultPersona === opt.id;
                  const Icon = opt.icon;

                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleSelectDefaultPersona(opt.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/30'
                          : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-emerald-500' : 'text-gray-400'}`} />
                        <span className="text-xs font-bold">{language === 'ml' ? opt.labelMl : opt.labelEn}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 3. CAMPUS DEFAULT TIMEOUT PRESETS & SLIDER */}
            <div className="space-y-3 p-4 rounded-3xl bg-gray-50/70 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-0.5">
                    <span className="flex items-center gap-1.5">
                      <Sliders className="w-4 h-4 text-emerald-500" />
                      <span>{language === 'ml' ? 'ഗ്ലോബൽ നിഷ്ക്രിയ സമയ പരിധി' : 'Global Inactivity Timeout'}</span>
                    </span>
                  </label>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    {language === 'ml'
                      ? 'നിഷ്ക്രിയ സെഷനുകൾ അവസാനിപ്പിക്കേണ്ട കേന്ദ്ര സമയം'
                      : 'Campus-wide inactivity expiration threshold across the terminal fleet'}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                    {draftPolicy.defaultTimeoutMs >= 86400000
                      ? '24 Hours'
                      : draftPolicy.defaultTimeoutMs >= 60000
                      ? `${Math.round(draftPolicy.defaultTimeoutMs / 60000)} min`
                      : `${Math.round(draftPolicy.defaultTimeoutMs / 1000)} sec`}
                  </span>
                  <span className="text-[10px] text-gray-400 block font-medium">
                    Warning: {Math.round(draftPolicy.defaultWarningMs / 1000)}s
                  </span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5 pt-1">
                {TIMEOUT_PRESETS.map((preset) => {
                  const isPresetActive = draftPolicy.defaultTimeoutMs === preset.timeoutMs;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all ${
                        isPresetActive
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                          : 'bg-white dark:bg-white/5 border-gray-200/60 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                      title={preset.desc}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>

              {/* Slider */}
              {draftPolicy.defaultTimeoutMs < 86400000 && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-[11px] font-medium text-gray-500">
                    <span>Slider Calibration</span>
                    <span>{Math.round(draftPolicy.defaultTimeoutMs / 1000)}s</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="1800"
                    step="15"
                    value={Math.round(draftPolicy.defaultTimeoutMs / 1000)}
                    onChange={handleSliderChange}
                    className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                  />
                </div>
              )}
            </div>

            {/* 4. HARDWARE TOGGLES BASELINE */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block">
                <span>{language === 'ml' ? 'ഹാർഡ്‌വെയർ മുന്നറിയിപ്പ് ക്രമീകരണങ്ങൾ' : 'Fleet Hardware Alerts Baseline'}</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    draftPolicy.soundAlertsEnabled
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200/60 dark:border-white/5 text-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {draftPolicy.soundAlertsEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4" />}
                    <span className="text-xs font-bold">Warning Chime</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase">{draftPolicy.soundAlertsEnabled ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleCountdown}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    draftPolicy.countdownTickEnabled
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200/60 dark:border-white/5 text-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clock className={`w-4 h-4 ${draftPolicy.countdownTickEnabled ? 'text-emerald-500' : ''}`} />
                    <span className="text-xs font-bold">5s Ticking Pulse</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase">{draftPolicy.countdownTickEnabled ? 'ON' : 'OFF'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleToggleWakeLock}
                  className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    draftPolicy.wakeLockEnabled
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-100'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200/60 dark:border-white/5 text-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Sun className={`w-4 h-4 ${draftPolicy.wakeLockEnabled ? 'text-emerald-500' : ''}`} />
                    <span className="text-xs font-bold">Screen WakeLock</span>
                  </div>
                  <span className="text-[10px] font-bold uppercase">{draftPolicy.wakeLockEnabled ? 'ON' : 'OFF'}</span>
                </button>
              </div>
            </div>

            {/* 5. POLICY AUDIT REASON */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block">
                <span>{language === 'ml' ? 'പോളിസി കുറിപ്പ് & കാരണം' : 'Administrative Justification Note'}</span>
              </label>
              <input
                type="text"
                value={draftPolicy.policyReason || ''}
                onChange={(e) => setDraftPolicy((prev) => ({ ...prev, policyReason: e.target.value }))}
                placeholder="e.g. Standard academic schedule, peak exam rush, or Ramadan hours"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              />
              {cloudPolicy.updatedAt && (
                <div className="text-[10px] text-gray-400 flex items-center gap-1.5 pt-1">
                  <Info className="w-3 h-3" />
                  <span>
                    Last deployed by <strong className="text-gray-700 dark:text-gray-300">{cloudPolicy.updatedByName || 'Admin'}</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setDraftPolicy(cloudPolicy);
              }}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{language === 'ml' ? 'മാറ്റങ്ങൾ ഒഴിവാക്കുക' : 'Reset Changes'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-medium text-gray-500 hover:text-gray-800 dark:hover:text-white transition-colors"
              >
                {language === 'ml' ? 'ക്ലോസ്' : 'Cancel'}
              </button>

              <button
                type="button"
                onClick={handleSavePolicy}
                disabled={isSaving}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md shadow-emerald-900/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{isSaving ? 'Deploying...' : language === 'ml' ? 'പോളിസി നടപ്പിലാക്കുക' : 'Deploy Fleet Policy'}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
