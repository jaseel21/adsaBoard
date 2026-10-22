import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Lock,
  Unlock,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Sparkles,
  Sliders,
  Timer,
  Check,
  X,
  Info,
  RotateCcw,
  Zap,
  Save,
} from 'lucide-react';
import { dialog } from '../utils/dialog';
import { useFeedback } from '../utils/useFeedback';
import { useTokenLockStatus, formatTime12 } from '../utils/useTokenLockStatus';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../utils/auditLogger';
import { subscribeToCanteenConfig, updateSectionChunkSize } from '../utils/canteenConfigService';
import { useLanguage } from '../store/LanguageContext';

const PRESETS = [
  { label: 'Standard (2:00 PM - 11:00 PM Cutoff)', start: '14:00', end: '23:00' },
  { label: 'Midnight (2:00 PM - 11:59 PM Cutoff)', start: '14:00', end: '23:59' },
  { label: 'Early (2:00 PM - 9:00 PM Cutoff)', start: '14:00', end: '21:00' },
  { label: 'Evening (2:00 PM - 10:00 PM Cutoff)', start: '14:00', end: '22:00' },
];

const DAYS_META = [
  { key: 'su', label: 'Sun', full: 'Sunday', fullKey: 'daysFull.0' },
  { key: 'mo', label: 'Mon', full: 'Monday', fullKey: 'daysFull.1' },
  { key: 'tu', label: 'Tue', full: 'Tuesday', fullKey: 'daysFull.2' },
  { key: 'we', label: 'Wed', full: 'Wednesday', fullKey: 'daysFull.3' },
  { key: 'th', label: 'Thu', full: 'Thursday', fullKey: 'daysFull.4' },
  { key: 'fr', label: 'Fri', full: 'Friday', fullKey: 'daysFull.5' },
  { key: 'sa', label: 'Sat', full: 'Saturday', fullKey: 'daysFull.6' },
];

export default function TokenLockManagerModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const {
    config,
    effectiveMode,
    isTomorrowLocked,
    tomorrowLockInfo,
    activeWindow,
    startTime,
    endTime,
    currentTime,
    tomorrowIST,
    todayIST,
    saveLockConfig,
  } = useTokenLockStatus();

  // Working form state
  const [mode, setMode] = useState(config.overrideMode || 'auto');
  const [startInput, setStartInput] = useState(config.window?.startTime || '14:00');
  const [endInput, setEndInput] = useState(config.window?.endTime || '23:00');
  const [scheduleEnabled, setScheduleEnabled] = useState(Boolean(config.schedule?.enabled));
  const [daySchedules, setDaySchedules] = useState(() => config.schedule?.days || {});
  const [overrideReason, setOverrideReason] = useState(config.temporaryOverride?.reason || '');
  const [sectionChunkSize, setSectionChunkSize] = useState(25);
  const [saving, setSaving] = useState(false);

  // Sync section chunk size from database
  useEffect(() => {
    const unsub = subscribeToCanteenConfig((cfg) => {
      if (cfg?.sectionChunkSize) {
        setSectionChunkSize(cfg.sectionChunkSize);
      }
    });
    return () => unsub();
  }, []);

  // Sync state whenever modal opens or config updates from Firestore
  useEffect(() => {
    if (isOpen) {
      setMode(config.overrideMode || 'auto');
      setStartInput(config.window?.startTime || '14:00');
      setEndInput(config.window?.endTime || '23:00');
      setScheduleEnabled(Boolean(config.schedule?.enabled));
      setDaySchedules(config.schedule?.days || {});
      setOverrideReason(config.temporaryOverride?.reason || '');
    }
  }, [isOpen, config]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset) => {
    feedback('tick');
    setStartInput(preset.start);
    setEndInput(preset.end);
    dialog.toast.info('Preset Selected', `Cutoff window set to ${preset.label}`);
  };

  const handleDayScheduleChange = (dayKey, field, value) => {
    setDaySchedules((prev) => ({
      ...prev,
      [dayKey]: {
        ...(prev[dayKey] || { startTime: startInput, endTime: endInput }),
        [field]: value,
      },
    }));
  };

  const handleQuickTimedUnlock = async (durationMinutes, label) => {
    feedback('tick');
    const confirmed = await dialog.confirm({
      title: `Temporary Unlock (${label})?`,
      message: `Token updates will be forcibly unlocked for all students until the timer expires, then automatically return to scheduled cutoffs.`,
      confirmText: 'Start Temporary Unlock',
      confirmColor: 'emerald',
    });

    if (!confirmed) return;

    setSaving(true);
    const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
    const result = await saveLockConfig({
      overrideMode: 'auto',
      temporaryOverride: {
        active: true,
        mode: 'force_unlocked',
        expiresAt,
        reason: `Temporary Admin Extension (${label})`,
      },
    });

    setSaving(false);
    if (result.success) {
      await logAuditEvent({
        category: AUDIT_CATEGORIES.TOKENS,
        action: 'OVERRIDE_APPLIED',
        severity: AUDIT_SEVERITIES.WARNING,
        target: { type: 'system_config', id: 'tokenboard', label: 'Token Board Cutoff' },
        changes: {
          diffSummary: `Temporary unlock activated for ${label}`,
          fieldsChanged: ['temporaryOverride'],
          before: null,
          after: { active: true, minutes: durationMinutes, expiresAt },
        },
        metadata: {
          reason: `Temporary Admin Extension (${label})`,
        },
      });
      dialog.toast.success('Temporary Unlock Active', `Tokens unlocked for ${label}.`);
      onClose();
    } else {
      dialog.alert({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not activate temporary unlock.',
      });
    }
  };

  const handleCancelTemporaryOverride = async () => {
    feedback('tick');
    setSaving(true);
    await saveLockConfig({
      temporaryOverride: {
        active: false,
        mode: 'force_unlocked',
        expiresAt: null,
        reason: '',
      },
    });
    await logAuditEvent({
      category: AUDIT_CATEGORIES.TOKENS,
      action: 'OVERRIDE_CANCELLED',
      severity: AUDIT_SEVERITIES.NOTICE,
      target: { type: 'system_config', id: 'tokenboard', label: 'Token Board Cutoff' },
      changes: {
        diffSummary: 'Temporary unlock override was cancelled early',
        fieldsChanged: ['temporaryOverride'],
        before: { active: true },
        after: { active: false },
      },
    });
    setSaving(false);
    dialog.toast.info('Temporary Override Cancelled', 'Reverted back to normal scheduled window.');
  };

  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    feedback('tick');
    setSaving(true);

    try {
      const updates = {
        overrideMode: mode,
        window: {
          startTime: startInput,
          endTime: endInput,
          timezone: 'Asia/Kolkata',
        },
        schedule: {
          enabled: scheduleEnabled,
          days: daySchedules,
        },
        note: overrideReason.trim() || 'Updated via Admin Center',
      };

      const result = await saveLockConfig(updates);
      if (result.success) {
        await updateSectionChunkSize(sectionChunkSize, {
          displayName: 'Committee Admin',
          role: 'admin',
        });
        await logAuditEvent({
          category: AUDIT_CATEGORIES.TOKENS,
          action: 'CUTOFF_WINDOW_CHANGE',
          severity: mode === 'force_locked' ? AUDIT_SEVERITIES.CRITICAL : AUDIT_SEVERITIES.WARNING,
          target: { type: 'system_config', id: 'tokenboard', label: 'Cutoff Rules' },
          changes: {
            diffSummary: `Cutoff Mode: ${mode.toUpperCase()}, Window: ${startInput} - ${endInput}`,
            fieldsChanged: ['overrideMode', 'window', 'schedule'],
            before: null,
            after: updates,
          },
          metadata: {
            reason: overrideReason.trim() || 'Cutoff configuration updated by committee admin',
          },
        });
        dialog.toast.success('Configuration Saved', 'Token locking rules updated in real-time.');
        onClose();
      } else {
        throw result.error || new Error('Failed to save config');
      }
    } catch (err) {
      console.error('Save lock config error:', err);
      dialog.alert({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not update token board locking rules.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.35 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200 dark:border-white/10 shadow-2xl p-4 sm:p-7 space-y-5 sm:space-y-6 max-h-[90dvh] overflow-y-auto pb-safe"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-white/5 pb-3.5 sm:pb-4">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <Sliders className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <span>{t('tokenCutoffEngine', 'Token Cutoff & Locking Engine')}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {t('istSynced', 'IST Synced')}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t('configureWindowsDesc', 'Configure update windows, cutoff deadlines, and emergency overrides.')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Simulator & Status Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-gray-50 to-emerald-50/40 dark:from-white/[0.02] dark:to-emerald-950/20 border border-emerald-500/20 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              {t('liveServerIstTime', 'Live Server IST Time:')} <strong className="font-mono text-gray-900 dark:text-white">{currentTime || '--:--:--'}</strong>
            </span>
            <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
              {t('activeModeColon', 'Active Mode:')} <b>{effectiveMode.toUpperCase()}</b>
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">{t('today', 'Today')} ({todayIST})</span>
              <span className="font-black text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1 mt-0.5">
                <Lock className="w-3 h-3" /> {t('closed', 'Closed')}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">{t('tomorrow', 'Tomorrow')} ({tomorrowIST})</span>
              <span className={`font-black flex items-center justify-center gap-1 mt-0.5 ${
                !isTomorrowLocked
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`}>
                {!isTomorrowLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {!isTomorrowLocked ? t('openForEdits', 'Open for Edits') : t('lockedCutoff', 'Locked (Cutoff)')}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">{t('futureDates', 'Future Dates')}</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-0.5">
                <Unlock className="w-3 h-3" /> {t('alwaysOpen', 'Always Open')}
              </span>
            </div>
          </div>
        </div>

        {/* Temporary Override Banner if active */}
        {config.temporaryOverride?.active && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 flex items-center justify-between gap-3 text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-amber-500 animate-pulse" />
              <span>
                <b>{t('timedUnlockActive', 'Timed Temporary Unlock Active:')}</b> {config.temporaryOverride.reason || 'Manual extension in progress'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleCancelTemporaryOverride}
              className="px-2.5 py-1 rounded-lg bg-amber-200/80 hover:bg-amber-300 dark:bg-amber-900/60 dark:hover:bg-amber-800 font-bold text-[11px] text-amber-900 dark:text-amber-100 transition-colors"
            >
              {t('cancelExtension', 'Cancel Extension')}
            </button>
          </div>
        )}

        <form onSubmit={handleSaveAll} className="space-y-6">
          {/* Section 1: Master Operating Mode */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              {t('masterOperatingMode', '1. Master Operating Mode')}
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Auto */}
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setMode('auto');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  mode === 'auto'
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900 dark:text-emerald-100'
                    : 'bg-gray-50/60 dark:bg-white/[0.02] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-emerald-500" />
                    {t('autoSchedule', 'Automatic Schedule')}
                  </span>
                  {mode === 'auto' && <Check className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                  {t('autoScheduleDesc', 'Updates for tomorrow remain open all day until the cutoff deadline passes on the day before. Future dates remain open for advance booking.')}
                </p>
              </button>

              {/* Force Unlocked */}
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setMode('force_unlocked');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  mode === 'force_unlocked'
                    ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 dark:text-blue-100'
                    : 'bg-gray-50/60 dark:bg-white/[0.02] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs flex items-center gap-1.5">
                    <Unlock className="w-4 h-4 text-blue-500" />
                    {t('forceUnlocked247', 'Force Unlocked (24/7)')}
                  </span>
                  {mode === 'force_unlocked' && <Check className="w-4 h-4 text-blue-500" />}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                  {t('forceUnlockedDesc', 'Emergency override. Bypasses all cutoff hours; students can update any date anytime.')}
                </p>
              </button>

              {/* Force Locked */}
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setMode('force_locked');
                }}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  mode === 'force_locked'
                    ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/20 text-rose-900 dark:text-rose-100'
                    : 'bg-gray-50/60 dark:bg-white/[0.02] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-rose-500" />
                    {t('emergencyFreeze', 'Emergency Freeze')}
                  </span>
                  {mode === 'force_locked' && <Check className="w-4 h-4 text-rose-500" />}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
                  {t('emergencyFreezeDesc', 'Complete lockdown. Pauses student login and prohibits all edits across all dates.')}
                </p>
              </button>
            </div>
          </div>

          {/* Section 2: Dynamic Time Window */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {t('dynamicDailyCutoffWindow', '2. Daily Cutoff Schedule & Deadline')}
              </label>
              <span className="text-[11px] text-gray-500 dark:text-gray-400">
                {t('currentColon', 'Cutoff Deadline:')} <b>{formatTime12(endInput)}</b>
              </span>
            </div>

            {/* Presets Strip */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <span className="text-[11px] text-gray-400 font-semibold flex-shrink-0">{t('presetsColon', 'Presets:')}</span>
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors flex-shrink-0"
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Time Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">
                  {t('windowOpensStart', 'Window Opens (Start Time):')}
                </span>
                <div className="relative">
                  <input
                    type="time"
                    value={startInput}
                    onChange={(e) => setStartInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 dark:text-emerald-400 pointer-events-none">
                    {formatTime12(startInput, false)}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-gray-600 dark:text-gray-400 block">
                  {t('cutoffDeadlineEnd', 'Cutoff Deadline (End Time):')}
                </span>
                <div className="relative">
                  <input
                    type="time"
                    value={endInput}
                    onChange={(e) => setEndInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-emerald-600 dark:text-emerald-400 pointer-events-none">
                    {formatTime12(endInput, false)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Quick Timed Extension */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-500" />
                {t('quickTemporaryExtension', 'Quick Temporary Extension')}
              </span>
              <span className="text-[11px] text-gray-500">{t('autoRevertsDesc', 'Auto-reverts to schedule upon expiry')}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleQuickTimedUnlock(30, '30 Mins')}
                className="py-2 px-3 rounded-xl bg-white dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors"
              >
                + 30 Mins
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleQuickTimedUnlock(60, '1 Hour')}
                className="py-2 px-3 rounded-xl bg-white dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors"
              >
                + 1 Hour
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleQuickTimedUnlock(120, '2 Hours')}
                className="py-2 px-3 rounded-xl bg-white dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors"
              >
                + 2 Hours
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => handleQuickTimedUnlock(360, 'Until Midnight')}
                className="py-2 px-3 rounded-xl bg-white dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 transition-colors"
              >
                {t('untilMidnight', 'Until Midnight')}
              </button>
            </div>
          </div>

          {/* Section 4: Day-Specific Custom Schedules (Optional Collapsible) */}
          <div className="border border-gray-200/80 dark:border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider block">
                  {t('dayOfWeekCustomCutoffs', 'Day-of-Week Custom Cutoff Schedules')}
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t('enableCustomDeadlinesDesc', 'Enable custom deadlines for specific days (e.g. earlier Friday cutoff at 9:00 PM)')}
                </span>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={scheduleEnabled}
                  onChange={(e) => setScheduleEnabled(e.target.value === 'true' || e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {scheduleEnabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-gray-100 dark:border-white/5">
                {DAYS_META.map((day) => {
                  const dayConf = daySchedules[day.key] || { startTime: startInput, endTime: endInput };
                  return (
                    <div
                      key={day.key}
                      className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-gray-700 dark:text-gray-200 w-16">
                        {day.fullKey ? t(day.fullKey, day.full) : day.full}:
                      </span>
                      <div className="flex items-center gap-1.5 font-mono">
                        <input
                          type="time"
                          value={dayConf.startTime || startInput}
                          onChange={(e) => handleDayScheduleChange(day.key, 'startTime', e.target.value)}
                          className="px-1.5 py-1 rounded bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-[11px]"
                        />
                        <span>–</span>
                        <input
                          type="time"
                          value={dayConf.endTime || endInput}
                          onChange={(e) => handleDayScheduleChange(day.key, 'endTime', e.target.value)}
                          className="px-1.5 py-1 rounded bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-[11px]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 5: Mess Distribution Section Size Configuration */}
          <div className="border border-gray-200/80 dark:border-white/10 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider block flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                  Mess Distribution Section Size
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Tokens per section column for kitchen manifests &amp; dining distribution
                </span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                {sectionChunkSize} tokens / section
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {[15, 20, 25, 30, 40, 50].map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setSectionChunkSize(sz);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    sectionChunkSize === sz
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-emerald-500/40'
                  }`}
                >
                  {sz} tokens {sz === 25 ? '(Default)' : ''}
                </button>
              ))}
            </div>
          </div>

          {/* Section 6: Note / Audit Trail */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              {t('overrideReasonAuditNote', 'Override Reason / Audit Note (Optional)')}
            </label>
            <input
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder={t('overrideReasonPlaceholder', 'e.g. Extended window for Ramadan or Exam preparations')}
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? t('saving', 'Saving...') : t('applyAndSaveRules', 'Apply & Save Locking Rules')}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
