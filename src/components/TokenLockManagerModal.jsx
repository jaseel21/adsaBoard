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
  Plus,
  Trash2,
  CalendarRange,
  PlayCircle,
  Eye,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { dialog } from '../utils/dialog';
import { useFeedback } from '../utils/useFeedback';
import { useTokenLockStatus, formatTime12 } from '../utils/useTokenLockStatus';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../utils/auditLogger';
import { subscribeToCanteenConfig, updateSectionChunkSize } from '../utils/canteenConfigService';
import { useLanguage } from '../store/LanguageContext';
import { addDaysToDate, formatFriendlyDate, normalizeTimeToHms } from '../utils/studentExceptionService';

const PRESETS = [
  { label: 'Standard (11:00 PM Cutoff)', end: '23:00' },
  { label: 'Midnight (11:59 PM Cutoff)', end: '23:59' },
  { label: 'Evening (10:00 PM Cutoff)', end: '22:00' },
  { label: 'Early (9:00 PM Cutoff)', end: '21:00' },
];

const BOARD_SWITCH_PRESETS = [
  { label: '01:30 PM (Early)', time: '13:30' },
  { label: '02:00 PM (Standard)', time: '14:00' },
  { label: '02:15 PM (Jumu\'ah)', time: '14:15' },
  { label: '02:30 PM (Late Lunch)', time: '14:30' },
  { label: '03:00 PM (Afternoon)', time: '15:00' },
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
    activeScheduledEvent,
    saveLockConfig,
    getDateLockStatus,
    rawBoardSwitchTime,
    boardSwitchTime,
    isPastBoardSwitch,
  } = useTokenLockStatus();

  // Active navigation tab: 'operating_mode' | 'timed_timer' | 'scheduled_events' | 'simulator'
  const [activeTab, setActiveTab] = useState('operating_mode');

  // Working form state - Operating Mode & Window
  const [mode, setMode] = useState(config.overrideMode || 'auto');
  const [deadlineInput, setDeadlineInput] = useState(config.cutoff?.deadlineTime || config.window?.endTime || '23:00');
  const [restrictOpenTime, setRestrictOpenTime] = useState(Boolean(config.cutoff?.restrictOpenTime));
  const [startInput, setStartInput] = useState(config.cutoff?.openTime || config.window?.startTime || '00:00');

  // Dedicated Board Today-Tomorrow Display Transition State
  const [boardSwitchEnabled, setBoardSwitchEnabled] = useState(
    Boolean(config.boardSwitch?.enabled !== false)
  );
  const [boardSwitchTimeInput, setBoardSwitchTimeInput] = useState(
    config.boardSwitch?.autoShiftTime || '14:00'
  );
  const [fridaySpecialEnabled, setFridaySpecialEnabled] = useState(
    Boolean(config.boardSwitch?.days?.fr?.autoShiftTime)
  );
  const [fridaySwitchTimeInput, setFridaySwitchTimeInput] = useState(
    config.boardSwitch?.days?.fr?.autoShiftTime || '14:15'
  );
  
  // Day-Specific Schedules
  const [scheduleEnabled, setScheduleEnabled] = useState(Boolean(config.schedule?.enabled));
  const [daySchedules, setDaySchedules] = useState(() => config.schedule?.days || {});
  
  // Section Chunk Size
  const [sectionChunkSize, setSectionChunkSize] = useState(25);
  const [overrideReason, setOverrideReason] = useState(config.temporaryOverride?.reason || '');
  const [saving, setSaving] = useState(false);

  // Timed Override working form state
  const [timedMode, setTimedMode] = useState('force_unlocked'); // 'force_unlocked' | 'force_locked'
  const [timedMinutes, setTimedMinutes] = useState(60);
  const [timedReason, setTimedReason] = useState('');

  // Scheduled Calendar Events working list
  const [scheduledEvents, setScheduledEvents] = useState(() => config.scheduledEvents || []);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState('lock'); // 'lock' | 'unlock' | 'custom_cutoff'
  const [newEventStartDate, setNewEventStartDate] = useState(tomorrowIST);
  const [newEventEndDate, setNewEventEndDate] = useState(addDaysToDate(tomorrowIST, 2));
  const [newEventCutoff, setNewEventCutoff] = useState('20:00');
  const [newEventReason, setNewEventReason] = useState('');
  const [showAddEventForm, setShowAddEventForm] = useState(false);

  // Live Rule Simulator & Sandbox State
  const [simDate, setSimDate] = useState(tomorrowIST);
  const [simTime, setSimTime] = useState('15:00');
  const [simIsAdmin, setSimIsAdmin] = useState(false);

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
      setDeadlineInput(config.cutoff?.deadlineTime || config.window?.endTime || '23:00');
      setRestrictOpenTime(Boolean(config.cutoff?.restrictOpenTime));
      setStartInput(config.cutoff?.openTime || config.window?.startTime || '00:00');
      setBoardSwitchEnabled(config.boardSwitch?.enabled !== false);
      setBoardSwitchTimeInput(config.boardSwitch?.autoShiftTime || '14:00');
      setFridaySpecialEnabled(Boolean(config.boardSwitch?.days?.fr?.autoShiftTime));
      setFridaySwitchTimeInput(config.boardSwitch?.days?.fr?.autoShiftTime || '14:15');
      setScheduleEnabled(Boolean(config.schedule?.enabled));
      setDaySchedules(config.schedule?.days || {});
      setOverrideReason(config.temporaryOverride?.reason || '');
      setScheduledEvents(config.scheduledEvents || []);
      setSimDate(tomorrowIST);
    }
  }, [isOpen, config, tomorrowIST]);

  const handleApplyPreset = (preset) => {
    feedback('tick');
    setDeadlineInput(preset.end);
    dialog.toast.info('Cutoff Selected', `Cutoff deadline set to ${preset.label}`);
  };

  const handleDayScheduleChange = (dayKey, field, value) => {
    setDaySchedules((prev) => ({
      ...prev,
      [dayKey]: {
        ...(prev[dayKey] || { deadlineTime: deadlineInput, startTime: startInput, endTime: deadlineInput }),
        [field]: value,
        deadlineTime: field === 'endTime' ? value : (prev[dayKey]?.deadlineTime || deadlineInput),
      },
    }));
  };

  // Timed Extension or Timed Freeze Activation
  const handleStartTimedOverride = async (minutes, targetMode, label) => {
    feedback('tick');
    const isLock = targetMode === 'force_locked';
    const actionTitle = isLock ? `Temporary Freeze (${label})` : `Temporary Extension (${label})`;
    const confirmMessage = isLock
      ? `Token updates will be temporarily FROZEN for all regular students for ${label}. Upon expiry, normal cutoff schedules automatically resume.`
      : `Token updates will be forcibly UNLOCKED for all students for ${label}, even if past cutoff. Upon expiry, normal cutoff schedules automatically resume.`;

    const confirmed = await dialog.confirm({
      title: `${actionTitle}?`,
      message: confirmMessage,
      confirmText: isLock ? 'Start Temporary Freeze' : 'Start Temporary Extension',
      confirmColor: isLock ? 'rose' : 'emerald',
    });

    if (!confirmed) return;

    setSaving(true);
    const expiresAt = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    const reasonText = timedReason.trim() || (isLock ? `Administrative Temporary Freeze (${label})` : `Administrative Temporary Extension (${label})`);

    const result = await saveLockConfig({
      overrideMode: 'auto',
      temporaryOverride: {
        active: true,
        mode: targetMode,
        expiresAt,
        reason: reasonText,
        startedAt: new Date().toISOString(),
      },
    });

    setSaving(false);
    if (result.success) {
      await logAuditEvent({
        category: AUDIT_CATEGORIES.TOKENS,
        action: isLock ? 'TIMED_LOCK_APPLIED' : 'TIMED_UNLOCK_APPLIED',
        severity: isLock ? AUDIT_SEVERITIES.WARNING : AUDIT_SEVERITIES.NOTICE,
        target: { type: 'system_config', id: 'tokenboard', label: 'Token Board Cutoff' },
        changes: {
          diffSummary: `${isLock ? 'Timed Freeze' : 'Timed Extension'} activated for ${label}`,
          fieldsChanged: ['temporaryOverride'],
          before: null,
          after: { active: true, mode: targetMode, minutes, expiresAt, reason: reasonText },
        },
        metadata: {
          reason: reasonText,
        },
      });
      dialog.toast.success(
        isLock ? 'Timed Freeze Active' : 'Timed Extension Active',
        `Tokens ${isLock ? 'frozen' : 'unlocked'} for ${label}.`
      );
    } else {
      dialog.alert({
        type: 'error',
        title: 'Action Failed',
        message: 'Could not activate timed override.',
      });
    }
  };

  // Cancel Timed Override Early
  const handleCancelTemporaryOverride = async () => {
    feedback('tick');
    setSaving(true);
    const prevMode = config.temporaryOverride?.mode || 'override';
    await saveLockConfig({
      temporaryOverride: {
        active: false,
        mode: 'force_unlocked',
        expiresAt: null,
        reason: '',
        startedAt: null,
      },
    });
    await logAuditEvent({
      category: AUDIT_CATEGORIES.TOKENS,
      action: 'OVERRIDE_CANCELLED',
      severity: AUDIT_SEVERITIES.NOTICE,
      target: { type: 'system_config', id: 'tokenboard', label: 'Token Board Cutoff' },
      changes: {
        diffSummary: `Temporary override (${prevMode}) was cancelled early`,
        fieldsChanged: ['temporaryOverride'],
        before: { active: true },
        after: { active: false },
      },
    });
    setSaving(false);
    dialog.toast.info('Override Cancelled', 'Reverted back to normal scheduled rules.');
  };

  // Add a New Scheduled Event
  const handleAddScheduledEvent = () => {
    if (!newEventTitle.trim()) {
      dialog.toast.error('Missing Title', 'Please enter a title for this scheduled event.');
      return;
    }
    if (!newEventStartDate || !newEventEndDate || newEventStartDate > newEventEndDate) {
      dialog.toast.error('Invalid Date Range', 'End date must be on or after start date.');
      return;
    }

    const newEvent = {
      id: `evt_${Date.now()}`,
      title: newEventTitle.trim(),
      type: newEventType,
      startDate: newEventStartDate,
      endDate: newEventEndDate,
      customCutoffTime: newEventType === 'custom_cutoff' ? newEventCutoff : null,
      reason: newEventReason.trim() || newEventTitle.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    };

    setScheduledEvents((prev) => [...prev, newEvent]);
    setNewEventTitle('');
    setNewEventReason('');
    setShowAddEventForm(false);
    feedback('success');
    dialog.toast.success('Event Added', 'Scheduled event added to pending changes. Remember to click "Apply & Save".');
  };

  // Remove a Scheduled Event
  const handleDeleteScheduledEvent = (id) => {
    feedback('pop');
    setScheduledEvents((prev) => prev.filter((e) => e.id !== id));
  };

  // Toggle Scheduled Event Active State
  const handleToggleScheduledEvent = (id) => {
    feedback('tick');
    setScheduledEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, active: !e.active } : e))
    );
  };

  // Master Save Handler
  const handleSaveAll = async (e) => {
    if (e) e.preventDefault();
    feedback('tick');
    setSaving(true);

    try {
      const updates = {
        overrideMode: mode,
        cutoff: {
          deadlineTime: deadlineInput,
          openTime: restrictOpenTime ? startInput : '00:00',
          restrictOpenTime,
          timezone: 'Asia/Kolkata',
        },
        window: {
          startTime: restrictOpenTime ? startInput : '00:00',
          endTime: deadlineInput,
          timezone: 'Asia/Kolkata',
        },
        boardSwitch: {
          enabled: boardSwitchEnabled,
          autoShiftTime: boardSwitchTimeInput,
          timezone: 'Asia/Kolkata',
          days: {
            ...(config.boardSwitch?.days || {}),
            ...(fridaySpecialEnabled ? { fr: { autoShiftTime: fridaySwitchTimeInput } } : {}),
          },
        },
        schedule: {
          enabled: scheduleEnabled,
          days: daySchedules,
        },
        scheduledEvents,
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
            diffSummary: `Cutoff: ${mode.toUpperCase()} (${deadlineInput}), Board Switch: ${boardSwitchEnabled ? boardSwitchTimeInput : 'Disabled'}${fridaySpecialEnabled ? ` (Fri: ${fridaySwitchTimeInput})` : ''}, Events: ${scheduledEvents.length}`,
            fieldsChanged: ['overrideMode', 'cutoff', 'window', 'boardSwitch', 'schedule', 'scheduledEvents'],
            before: null,
            after: updates,
          },
          metadata: {
            reason: overrideReason.trim() || 'Cutoff configuration updated by committee admin',
          },
        });
        dialog.toast.success('Configuration Saved', 'Token locking rules updated in real-time across the platform.');
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

  // Live Simulator Computed Lock Evaluation
  const simEvaluation = useMemo(() => {
    return getDateLockStatus(simDate, { isAdmin: simIsAdmin });
  }, [getDateLockStatus, simDate, simIsAdmin]);

  if (!isOpen) return null;

  return (
    <div
      data-lenis-prevent
      className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-5 bg-black/70 backdrop-blur-md overflow-y-auto overscroll-contain"
      onClick={onClose}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="token-lock-modal-title"
        data-lenis-prevent
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.35 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-3xl rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200 dark:border-white/10 shadow-2xl p-4 sm:p-6 space-y-4 sm:space-y-5 max-h-[92dvh] overflow-y-auto pb-safe overscroll-contain"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-white/5 pb-3">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20 flex-shrink-0">
              <Sliders className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h2
                id="token-lock-modal-title"
                className="text-base sm:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5 sm:gap-2 flex-wrap"
              >
                <span>{t('tokenCutoffEngine', 'Token Cutoff & Locking Engine')}</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  {t('istSynced', 'IST Synced')}
                </span>
              </h2>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t('configureWindowsDesc', 'Manage daily cutoff deadlines, timed overrides, and scheduled calendar freezes.')}
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

        {/* Live Status Bar Card */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-gray-50 to-emerald-50/40 dark:from-white/[0.02] dark:to-emerald-950/20 border border-emerald-500/20 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-extrabold uppercase tracking-wider text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              {t('liveServerIstTime', 'Live Server Time:')} <strong className="font-mono text-gray-900 dark:text-white">{currentTime || '--:--:--'} IST</strong>
            </span>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                Mode: <b className="text-emerald-600 dark:text-emerald-400">{effectiveMode.toUpperCase()}</b>
              </span>
              <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400">
                Cutoff: <b className="text-gray-900 dark:text-white">{formatTime12(deadlineInput, false)}</b>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-white/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Today ({todayIST})</span>
              <span className="font-black text-rose-600 dark:text-rose-400 flex items-center justify-center gap-1 mt-0.5 text-[11px]">
                <Lock className="w-3 h-3" /> Finalized
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Tomorrow ({tomorrowIST})</span>
              <span className={`font-black flex items-center justify-center gap-1 mt-0.5 text-[11px] ${
                !isTomorrowLocked ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'
              }`}>
                {!isTomorrowLocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                {!isTomorrowLocked ? `Open until ${formatTime12(deadlineInput || '23:00', false)}` : 'Locked (Cutoff Passed)'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-white/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
              <span className="text-[10px] font-bold text-gray-400 uppercase block">Future Dates</span>
              <span className="font-black text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1 mt-0.5 text-[11px]">
                <Unlock className="w-3 h-3" /> Always Open
              </span>
            </div>
          </div>
        </div>

        {/* Timed Override Active Banner */}
        {config.temporaryOverride?.active && (
          <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs ${
            config.temporaryOverride.mode === 'force_locked'
              ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-500/30 text-rose-800 dark:text-rose-200'
              : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30 text-amber-800 dark:text-amber-200'
          }`}>
            <div className="flex items-center gap-2">
              <Timer className={`w-4 h-4 animate-pulse ${config.temporaryOverride.mode === 'force_locked' ? 'text-rose-500' : 'text-amber-500'}`} />
              <div>
                <span className="font-bold block">
                  {config.temporaryOverride.mode === 'force_locked' ? 'Timed Emergency Freeze Active' : 'Timed Extension Active'}
                </span>
                <span className="text-[11px] opacity-90">
                  {config.temporaryOverride.reason || 'Manual override in progress'} • Expires at {new Date(config.temporaryOverride.expiresAt).toLocaleTimeString()}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelTemporaryOverride}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-black/40 hover:opacity-90 font-bold text-xs border border-current shadow-xs transition-opacity flex-shrink-0"
            >
              Cancel Early
            </button>
          </div>
        )}

        {/* Calendar Scheduled Event Active Banner */}
        {activeScheduledEvent && (
          <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/30 flex items-center justify-between text-xs text-purple-900 dark:text-purple-200">
            <div className="flex items-center gap-2">
              <CalendarRange className="w-4 h-4 text-purple-500" />
              <span>
                <b>Scheduled Event Active:</b> {activeScheduledEvent.title} ({activeScheduledEvent.startDate} to {activeScheduledEvent.endDate})
              </span>
            </div>
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-purple-500/20">
              {activeScheduledEvent.type.toUpperCase()}
            </span>
          </div>
        )}

        {/* Tab Navigation Navigation */}
        <div className="flex items-center gap-1.5 border-b border-gray-200 dark:border-white/10 pb-2 overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('operating_mode')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'operating_mode'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Mode &amp; Cutoff</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('timed_timer')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'timed_timer'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <Timer className="w-3.5 h-3.5" />
            <span>Timed Timer Engine</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scheduled_events')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'scheduled_events'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <CalendarRange className="w-3.5 h-3.5" />
            <span>Scheduled Events</span>
            {scheduledEvents.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 font-mono">
                {scheduledEvents.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 flex-shrink-0 ${
              activeTab === 'simulator'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
            }`}
          >
            <PlayCircle className="w-3.5 h-3.5" />
            <span>Rule Simulator</span>
          </button>
        </div>

        {/* Tab 1: Operating Mode & Cutoff Schedule */}
        {activeTab === 'operating_mode' && (
          <div className="space-y-4">
            {/* Section 1: Master Operating Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                1. Master Operating Mode
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* Auto */}
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setMode('auto');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    mode === 'auto'
                      ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900 dark:text-emerald-100'
                      : 'bg-gray-50/60 dark:bg-white/[0.02] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      Automatic Cutoff
                    </span>
                    {mode === 'auto' && <Check className="w-4 h-4 text-emerald-500" />}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Tomorrow is open all day until the cutoff deadline. Today is finalized for kitchen prep. Future dates remain open for advance booking.
                  </p>
                </button>

                {/* Force Unlocked */}
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setMode('force_unlocked');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    mode === 'force_unlocked'
                      ? 'bg-blue-50/80 dark:bg-blue-950/30 border-blue-500 ring-2 ring-blue-500/20 text-blue-900 dark:text-blue-100'
                      : 'bg-gray-50/60 dark:bg-white/[0.02] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs flex items-center gap-1.5">
                      <Unlock className="w-4 h-4 text-blue-500" />
                      Force Unlocked (24/7)
                    </span>
                    {mode === 'force_unlocked' && <Check className="w-4 h-4 text-blue-500" />}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Emergency override. Bypasses all cutoff hours; students can update any date anytime.
                  </p>
                </button>

                {/* Force Locked */}
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setMode('force_locked');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    mode === 'force_locked'
                      ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-500 ring-2 ring-rose-500/20 text-rose-900 dark:text-rose-100'
                      : 'bg-gray-50/60 dark:bg-white/[0.02] border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs flex items-center gap-1.5">
                      <Lock className="w-4 h-4 text-rose-500" />
                      Emergency Freeze
                    </span>
                    {mode === 'force_locked' && <Check className="w-4 h-4 text-rose-500" />}
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    Complete lockdown. Pauses student token updates across all dates.
                  </p>
                </button>
              </div>
            </div>

            {/* Section 2: Daily Cutoff Schedule */}
            <div className="space-y-3 p-4 rounded-2xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                    2. Daily Cutoff Deadline
                  </label>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Students can freely update tomorrow&apos;s meals from 12:00 AM until this deadline.
                  </span>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                  {formatTime12(deadlineInput, false)} IST
                </span>
              </div>

              {/* Presets Strip */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] text-gray-400 font-semibold flex-shrink-0">Presets:</span>
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex-shrink-0 ${
                      deadlineInput === p.end
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Deadline Input & Optional Opening Restriction */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block">
                    Cutoff Deadline (Closing Time):
                  </span>
                  <input
                    type="time"
                    value={deadlineInput}
                    onChange={(e) => setDeadlineInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                        Restrict Opening Window
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">
                        Default is OFF (Open all day). Enable only if tokens should open later.
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={restrictOpenTime}
                        onChange={(e) => setRestrictOpenTime(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                    </label>
                  </div>

                  {restrictOpenTime && (
                    <div className="pt-2 border-t border-gray-100 dark:border-white/5">
                      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                        Opens at (Start Time):
                      </span>
                      <input
                        type="time"
                        value={startInput}
                        onChange={(e) => setStartInput(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs font-mono font-bold text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Section 3: Today-Tomorrow Display Transition (Board Auto-Shift) */}
            <div className="space-y-3 p-4 rounded-2xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5">
              <div className="flex items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider">
                      3. Today-Tomorrow Display Transition (Board Auto-Shift)
                    </label>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      Display Engine
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Controls when public screens, kitchen displays, and mess sections automatically transition their default date view from Today&apos;s meals to Tomorrow&apos;s meals.
                  </p>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={boardSwitchEnabled}
                    onChange={(e) => setBoardSwitchEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Decoupling Notice */}
              <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-500/20 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">
                  <strong>Decoupled from Cutoff:</strong> Student editing remains open until <strong>{formatTime12(deadlineInput, false)}</strong>. This setting strictly controls whether boards show Today (Breakfast &amp; Lunch) or Tomorrow (Dinner &amp; Advance Prep) by default.
                </span>
              </div>

              {boardSwitchEnabled ? (
                <div className="space-y-3 pt-1">
                  {/* Presets Strip */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                    <span className="text-[11px] text-gray-400 font-semibold flex-shrink-0">Presets:</span>
                    {BOARD_SWITCH_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          setBoardSwitchTimeInput(p.time);
                          dialog.toast.info('Switch Time Set', `Board auto-shift time set to ${p.label}`);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex-shrink-0 ${
                          boardSwitchTimeInput === p.time
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Main Switch Input & Friday Override Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                          Default Auto-Shift Time:
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                          {formatTime12(boardSwitchTimeInput, false)}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400 block">
                        Screens show Today before this time, then advance to Tomorrow.
                      </span>
                      <input
                        type="time"
                        value={boardSwitchTimeInput}
                        onChange={(e) => setBoardSwitchTimeInput(e.target.value)}
                        className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-mono font-bold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    {/* Friday Jumu'ah Override */}
                    <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                            Friday Jumu&apos;ah Timing
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            Extends Today display for Friday prayers and lunch service.
                          </span>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                          <input
                            type="checkbox"
                            checked={fridaySpecialEnabled}
                            onChange={(e) => setFridaySpecialEnabled(e.target.checked)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {fridaySpecialEnabled && (
                        <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2">
                          <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                            Friday Shift Time:
                          </span>
                          <input
                            type="time"
                            value={fridaySwitchTimeInput}
                            onChange={(e) => setFridaySwitchTimeInput(e.target.value)}
                            className="px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs font-mono font-bold text-gray-900 dark:text-white"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Live Status Chip */}
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200/60 dark:border-white/5 text-xs">
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      Live Display Status at <strong className="font-mono text-gray-800 dark:text-gray-200">{currentTime || '--:--'} IST</strong>:
                    </span>
                    <span className={`font-bold px-2.5 py-0.5 rounded-full text-[11px] flex items-center gap-1.5 ${
                      isPastBoardSwitch
                        ? 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}>
                      <span className={`w-2 h-2 rounded-full ${isPastBoardSwitch ? 'bg-purple-500' : 'bg-emerald-500'} animate-pulse`} />
                      {isPastBoardSwitch ? `Showing Tomorrow (Switched at ${formatTime12(boardSwitchTimeInput, false)})` : `Showing Today (Advances at ${formatTime12(boardSwitchTimeInput, false)})`}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300">
                  Auto-shift is disabled. Public boards will continuously display <strong>Today&apos;s meals</strong> until midnight (11:59 PM).
                </div>
              )}
            </div>

            {/* Section 4: Day-of-Week Custom Schedules */}
            <div className="border border-gray-200/80 dark:border-white/10 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider block">
                    4. Day-of-Week Custom Cutoff Schedules
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Enable custom deadlines for specific days (e.g., earlier Friday cutoff at 9:00 PM)
                  </span>
                </div>

                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={(e) => setScheduleEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-white/10 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {scheduleEnabled && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-gray-100 dark:border-white/5">
                  {DAYS_META.map((day) => {
                    const dayConf = daySchedules[day.key] || { deadlineTime: deadlineInput, endTime: deadlineInput };
                    return (
                      <div
                        key={day.key}
                        className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 flex items-center justify-between text-xs"
                      >
                        <span className="font-bold text-gray-700 dark:text-gray-200 w-16">
                          {day.full}:
                        </span>
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="text-[10px] text-gray-400">Cutoff:</span>
                          <input
                            type="time"
                            value={dayConf.deadlineTime || dayConf.endTime || deadlineInput}
                            onChange={(e) => handleDayScheduleChange(day.key, 'endTime', e.target.value)}
                            className="px-2 py-1 rounded bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs font-bold"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Section 5: Mess Distribution Section Size */}
            <div className="border border-gray-200/80 dark:border-white/10 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider block flex items-center gap-1.5">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
                    5. Mess Distribution Section Size
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
          </div>
        )}

        {/* Tab 2: Timed Open/Lock Engine */}
        {activeTab === 'timed_timer' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 space-y-2">
              <span className="text-xs font-extrabold text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                <Timer className="w-4 h-4 text-amber-500" />
                Temporary Timed Overrides
              </span>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                Start a timed override that automatically expires and reverts back to the standard cutoff schedule once the timer runs out. Ideal for granting extensions or carrying out emergency kitchen stock reviews.
              </p>
            </div>

            {/* Mode Selector: Timed Extension vs Timed Freeze */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTimedMode('force_unlocked')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  timedMode === 'force_unlocked'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-900 dark:text-emerald-100'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="flex items-center gap-1.5">
                    <Unlock className="w-4 h-4 text-emerald-500" />
                    Timed Extension (Unlock)
                  </span>
                  {timedMode === 'force_unlocked' && <Check className="w-4 h-4 text-emerald-500" />}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Re-opens closed tokens for students who missed the deadline.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setTimedMode('force_locked')}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  timedMode === 'force_locked'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20 text-rose-900 dark:text-rose-100'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between font-bold text-xs">
                  <span className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-rose-500" />
                    Timed Freeze (Lock)
                  </span>
                  {timedMode === 'force_locked' && <Check className="w-4 h-4 text-rose-500" />}
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                  Temporarily suspends token changes for inventory or audits.
                </p>
              </button>
            </div>

            {/* Duration Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Select Duration
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { mins: 15, label: '+ 15 Mins' },
                  { mins: 30, label: '+ 30 Mins' },
                  { mins: 60, label: '+ 1 Hour' },
                  { mins: 120, label: '+ 2 Hours' },
                  { mins: 240, label: '+ 4 Hours' },
                  { mins: 360, label: 'Until Midnight' },
                ].map((dur) => (
                  <button
                    key={dur.mins}
                    type="button"
                    onClick={() => handleStartTimedOverride(dur.mins, timedMode, dur.label)}
                    disabled={saving}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all ${
                      timedMode === 'force_locked'
                        ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 border-rose-200 dark:border-rose-500/20 text-rose-900 dark:text-rose-200'
                        : 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
                    }`}
                  >
                    {dur.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Minutes Input & Start */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5 space-y-2">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                Custom Duration &amp; Student Broadcast Reason
              </span>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="5"
                  max="1440"
                  value={timedMinutes}
                  onChange={(e) => setTimedMinutes(parseInt(e.target.value, 10) || 30)}
                  className="w-28 px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white"
                  placeholder="Minutes"
                />
                <input
                  type="text"
                  value={timedReason}
                  onChange={(e) => setTimedReason(e.target.value)}
                  placeholder="Reason displayed to students (e.g. Sports practice extension)"
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => handleStartTimedOverride(timedMinutes, timedMode, `${timedMinutes} Mins`)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-black font-extrabold text-xs transition-colors flex-shrink-0"
                >
                  Start
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Scheduled Calendar Events */}
        {activeTab === 'scheduled_events' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 uppercase tracking-wider block">
                  Calendar Date-Range Scheduled Overrides
                </span>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  Plan in advance for Ramadan break, Eid vacations, exam periods, or campus maintenance.
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowAddEventForm(!showAddEventForm)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddEventForm ? 'Cancel Form' : 'Add Event'}</span>
              </button>
            </div>

            {/* Add Event Form Modal/Drawer */}
            {showAddEventForm && (
              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-3">
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase block">
                  New Calendar Override Event
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                      Event Title:
                    </span>
                    <input
                      type="text"
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="e.g. Ramadan Vacation Freeze"
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                      Action Type:
                    </span>
                    <select
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white"
                    >
                      <option value="lock">Freeze All Dates (Full Lock)</option>
                      <option value="unlock">Force Unlock (24/7 Advance Open)</option>
                      <option value="custom_cutoff">Custom Cutoff Deadline</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                      Start Date:
                    </span>
                    <input
                      type="date"
                      value={newEventStartDate}
                      onChange={(e) => setNewEventStartDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs font-mono text-gray-900 dark:text-white"
                    />
                  </div>

                  <div>
                    <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                      End Date:
                    </span>
                    <input
                      type="date"
                      value={newEventEndDate}
                      onChange={(e) => setNewEventEndDate(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs font-mono text-gray-900 dark:text-white"
                    />
                  </div>

                  {newEventType === 'custom_cutoff' && (
                    <div>
                      <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                        Cutoff Time:
                      </span>
                      <input
                        type="time"
                        value={newEventCutoff}
                        onChange={(e) => setNewEventCutoff(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs font-mono font-bold text-gray-900 dark:text-white"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 block mb-1">
                    Student Notice / Explanation:
                  </span>
                  <input
                    type="text"
                    value={newEventReason}
                    onChange={(e) => setNewEventReason(e.target.value)}
                    placeholder="e.g. Canteen operations paused during Ramadan vacation"
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={handleAddScheduledEvent}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                  >
                    Add Event to List
                  </button>
                </div>
              </div>
            )}

            {/* Scheduled Events List */}
            {scheduledEvents.length === 0 ? (
              <div className="p-6 rounded-2xl bg-gray-50/60 dark:bg-white/[0.02] border border-dashed border-gray-300 dark:border-white/10 text-center space-y-1">
                <Calendar className="w-6 h-6 mx-auto text-gray-400" />
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                  No Scheduled Calendar Events
                </span>
                <p className="text-[11px] text-gray-500">
                  Click &quot;Add Event&quot; above to schedule vacation freezes or holiday advance windows.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {scheduledEvents.map((evt) => {
                  const isActive = todayIST >= evt.startDate && todayIST <= evt.endDate && evt.active;
                  const isPast = todayIST > evt.endDate;
                  return (
                    <div
                      key={evt.id}
                      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all ${
                        isActive
                          ? 'bg-purple-50/80 dark:bg-purple-950/30 border-purple-400 dark:border-purple-500/40 shadow-xs'
                          : 'bg-gray-50 dark:bg-white/[0.02] border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-gray-900 dark:text-white">
                            {evt.title}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase ${
                            evt.type === 'lock'
                              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                          }`}>
                            {evt.type}
                          </span>
                          {isActive && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-purple-600 text-white animate-pulse">
                              Active Now
                            </span>
                          )}
                          {isPast && (
                            <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-gray-200 dark:bg-white/10 text-gray-500">
                              Expired
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 font-mono">
                          {evt.startDate} to {evt.endDate} {evt.customCutoffTime ? `• Cutoff: ${evt.customCutoffTime}` : ''}
                        </p>
                        {evt.reason && (
                          <p className="text-[11px] text-gray-600 dark:text-gray-400">
                            Notice: {evt.reason}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleScheduledEvent(evt.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                            evt.active
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-200'
                              : 'bg-gray-200 text-gray-600 border-gray-300 dark:bg-white/10 dark:text-gray-400'
                          }`}
                        >
                          {evt.active ? 'Enabled' : 'Paused'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteScheduledEvent(evt.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                          title="Delete Event"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Interactive Rule Simulator & Tester */}
        {activeTab === 'simulator' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/30 space-y-1">
              <span className="text-xs font-extrabold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider flex items-center gap-1.5">
                <PlayCircle className="w-4 h-4 text-emerald-500" />
                Live Rule Simulator &amp; Sandbox
              </span>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Test any date and time scenario to preview how the engine evaluates lock statuses and what messages students see.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/5">
              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Target Date:
                </span>
                <input
                  type="date"
                  value={simDate}
                  onChange={(e) => setSimDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs font-mono font-bold text-gray-900 dark:text-white"
                />
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setSimDate(todayIST)}
                    className="px-2 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-[10px] font-bold"
                  >
                    Today
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimDate(tomorrowIST)}
                    className="px-2 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-[10px] font-bold"
                  >
                    Tomorrow
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimDate(addDaysToDate(todayIST, 3))}
                    className="px-2 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-[10px] font-bold"
                  >
                    +3 Days
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  Simulation Time (IST):
                </span>
                <input
                  type="time"
                  value={simTime}
                  onChange={(e) => setSimTime(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-xs font-mono font-bold text-gray-900 dark:text-white"
                />
                <div className="flex gap-1.5 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setSimTime('10:00')}
                    className="px-2 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-[10px] font-bold"
                  >
                    Morning (10 AM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimTime('22:30')}
                    className="px-2 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-[10px] font-bold"
                  >
                    Night (10:30 PM)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimTime('23:30')}
                    className="px-2 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-[10px] font-bold"
                  >
                    Post-Cutoff
                  </button>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-1">
                  User Role:
                </span>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setSimIsAdmin(false)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      !simIsAdmin
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10'
                    }`}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimIsAdmin(true)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      simIsAdmin
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10'
                    }`}
                  >
                    Admin
                  </button>
                </div>
              </div>
            </div>

            {/* Evaluation Result Card */}
            <div className={`p-4 rounded-2xl border space-y-2 ${
              !simEvaluation.isLocked
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/40 text-emerald-900 dark:text-emerald-100'
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-500/40 text-rose-900 dark:text-rose-100'
            }`}>
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm flex items-center gap-1.5">
                  {!simEvaluation.isLocked ? <Unlock className="w-4 h-4 text-emerald-500" /> : <Lock className="w-4 h-4 text-rose-500" />}
                  Evaluation Result: {!simEvaluation.isLocked ? 'UNLOCKED / EDITABLE' : 'LOCKED / READ-ONLY'}
                </span>
                <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-full bg-black/10 dark:bg-white/10">
                  CODE: {simEvaluation.code}
                </span>
              </div>
              <p className="text-xs font-medium leading-relaxed">
                <b>Student Explanation:</b> {simEvaluation.reason}
              </p>
              {simEvaluation.isAdminOverride && (
                <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin override authority is active for this scenario.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Section 6: Note / Audit Trail & Submit */}
        <form onSubmit={handleSaveAll} className="space-y-4 pt-2 border-t border-gray-100 dark:border-white/5">
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              {t('overrideReasonAuditNote', 'Audit Note / Reason for Updates (Optional)')}
            </label>
            <input
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              placeholder="e.g. Set cutoff to 11:00 PM; added Ramadan vacation freeze event"
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
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
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
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
