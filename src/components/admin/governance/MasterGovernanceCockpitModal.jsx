import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert,
  AlertTriangle,
  Lock,
  Unlock,
  Power,
  Zap,
  Clock,
  Coffee,
  Utensils,
  Save,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  X,
  Sliders,
  DollarSign,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { useMasterGovernance } from '../../../store/MasterGovernanceContext';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';
import { useLanguage } from '../../../store/LanguageContext';
import { dialog } from '../../../utils/dialog';

export default function MasterGovernanceCockpitModal({ isOpen, onClose }) {
  const { t } = useLanguage();
  const {
    governance,
    loadingGovernance,
    isMaintenanceMode,
    maintenanceMessage,
    isReadOnlyLockdown,
    isEmergencyMealOverrideActive,
    emergencyMealOverrideNote,
    toggleMaintenance,
    toggleReadOnly,
    toggleEmergencyOverride,
    updateMealWindow,
    updateSettings,
  } = useMasterGovernance();

  // Local editing states
  const [activeTab, setActiveTab] = useState('switches'); // 'switches' | 'schedules' | 'layout'
  const [localMsg, setLocalMsg] = useState(maintenanceMessage || '');
  const [localOverrideNote, setLocalOverrideNote] = useState(emergencyMealOverrideNote || '');
  const [saving, setSaving] = useState(false);

  // Meal windows local states
  const [breakfastConfig, setBreakfastConfig] = useState(governance.mealWindows?.breakfast || {});
  const [lunchConfig, setLunchConfig] = useState(governance.mealWindows?.lunch || {});
  const [chunkSize, setChunkSize] = useState(governance.sectionChunkSize || 25);

  useEffect(() => {
    if (isOpen) {
      setLocalMsg(maintenanceMessage || '');
      setLocalOverrideNote(emergencyMealOverrideNote || '');
      setBreakfastConfig(governance.mealWindows?.breakfast || {});
      setLunchConfig(governance.mealWindows?.lunch || {});
      setChunkSize(governance.sectionChunkSize || 25);
    }
  }, [isOpen, governance, maintenanceMessage, emergencyMealOverrideNote]);

  if (!isOpen) return null;

  // Handlers
  const handleToggleMaintenance = async () => {
    const nextState = !isMaintenanceMode;
    const confirmed = await dialog.confirm({
      title: nextState ? 'Engage Institutional Maintenance Mode?' : 'Disengage Maintenance Mode?',
      message: nextState
        ? 'Public viewers and students will see a maintenance screen. Only Central Committee and Super Admins can access the console.'
        : 'Institutional dining and student self-service portals will immediately resume normal operation.',
      confirmLabel: nextState ? 'Engage Lockdown' : 'Resume Public Access',
      tone: nextState ? 'danger' : 'primary',
    });

    if (!confirmed) return;

    soundEngine.playPop();
    hapticEngine.mediumTick();
    setSaving(true);
    try {
      await toggleMaintenance(nextState, localMsg);
      soundEngine.playSoftChime();
      hapticEngine.successPulse();
    } catch (err) {
      soundEngine.playCautionThud();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleReadOnly = async () => {
    const nextState = !isReadOnlyLockdown;
    const confirmed = await dialog.confirm({
      title: nextState ? 'Engage Institutional Read-Only Lockdown?' : 'Release Read-Only Lockdown?',
      message: nextState
        ? 'All token toggles and dining schedule modifications will be strictly frozen across the campus.'
        : 'Student and staff token modifications will resume standard operating rules.',
      confirmLabel: nextState ? 'Engage Freeze' : 'Release Freeze',
      tone: nextState ? 'warning' : 'primary',
    });

    if (!confirmed) return;

    soundEngine.playPop();
    hapticEngine.mediumTick();
    setSaving(true);
    try {
      await toggleReadOnly(nextState);
      soundEngine.playSoftChime();
      hapticEngine.successPulse();
    } catch (err) {
      soundEngine.playCautionThud();
    } finally {
      setSaving(false);
    }
  };

  const handleToggleEmergencyOverride = async () => {
    const nextState = !isEmergencyMealOverrideActive;
    const confirmed = await dialog.confirm({
      title: nextState ? 'Engage Emergency Meal Override?' : 'Deactivate Emergency Meal Override?',
      message: nextState
        ? 'All locked meal tokens will be forcibly unlocked campus-wide. Students will be allowed to dine regardless of previous cutoff restrictions.'
        : 'Standard meal cutoff locks will immediately re-engage.',
      confirmLabel: nextState ? 'Override All Locks' : 'Restore Standard Locks',
      tone: nextState ? 'danger' : 'primary',
    });

    if (!confirmed) return;

    soundEngine.playPop();
    hapticEngine.mediumTick();
    setSaving(true);
    try {
      await toggleEmergencyOverride(nextState, localOverrideNote);
      soundEngine.playSoftChime();
      hapticEngine.successPulse();
    } catch (err) {
      soundEngine.playCautionThud();
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSchedules = async () => {
    soundEngine.playPop();
    hapticEngine.mediumTick();
    setSaving(true);
    try {
      await updateMealWindow('breakfast', breakfastConfig);
      await updateMealWindow('lunch', lunchConfig);
      await updateSettings({
        sectionChunkSize: Number(chunkSize) || 25,
        maintenanceMessage: localMsg,
        emergencyMealOverrideNote: localOverrideNote,
      });
      soundEngine.playSoftChime();
      hapticEngine.successPulse();
      await dialog.alert({
        title: 'Governance Settings Committed',
        message: 'Master institutional cutoff rules and layout configurations updated in real-time.',
        tone: 'success',
      });
    } catch (err) {
      soundEngine.playCautionThud();
      await dialog.alert({
        title: 'Commit Error',
        message: err.message || 'Failed to update governance settings.',
        tone: 'danger',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-md overflow-y-auto"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="relative w-full max-w-4xl bg-white dark:bg-[#0c1310] border border-gray-200 dark:border-emerald-500/20 rounded-3xl shadow-2xl overflow-hidden flex flex-col my-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="relative px-6 py-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-black/20 backdrop-blur-md flex items-center justify-center text-emerald-300 border border-white/10 shadow-inner">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-wide flex items-center gap-2">
                Apex Master Governance Cockpit
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-white/20 tracking-wider">
                  Super Admin
                </span>
              </h2>
              <p className="text-xs text-white/80 font-medium">
                Campus Dining Sovereignty, Global Killswitches & Cutoff Matrix
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white/90 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center border-b border-gray-200 dark:border-white/10 px-6 bg-gray-50/50 dark:bg-black/20">
          <button
            type="button"
            onClick={() => setActiveTab('switches')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'switches'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            Master Killswitches
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('schedules')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'schedules'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Meal Cutoffs & Fines
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('layout')}
            className={`py-3.5 px-4 text-xs font-bold border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'layout'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Floor Layout & Rules
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* TAB 1: MASTER KILLSWITCHES */}
          {activeTab === 'switches' && (
            <div className="space-y-4">
              {/* Switch 1: Maintenance Mode */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  isMaintenanceMode
                    ? 'bg-rose-500/10 border-rose-500/40 dark:bg-rose-950/30 dark:border-rose-500/50'
                    : 'bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        isMaintenanceMode
                          ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <Power className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                          Institutional Maintenance Lockdown
                        </h3>
                        {isMaintenanceMode && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500 text-white animate-pulse">
                            ACTIVE LOCKDOWN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                        Halts public and student access with a branded maintenance splash screen. Only Central Committee and Super Admins retain console access.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleToggleMaintenance}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                      isMaintenanceMode
                        ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30'
                        : 'bg-gray-900 hover:bg-black dark:bg-white/10 dark:hover:bg-white/20 text-white'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    {isMaintenanceMode ? 'Deactivate Maintenance' : 'Engage Maintenance'}
                  </button>
                </div>

                {/* Maintenance Custom Message */}
                <div className="mt-4 pt-3 border-t border-gray-200/60 dark:border-white/5">
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Custom Maintenance Announcement
                  </label>
                  <input
                    type="text"
                    value={localMsg}
                    onChange={(e) => setLocalMsg(e.target.value)}
                    placeholder="Enter broadcast reason for students..."
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Switch 2: Read-Only Lockdown */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  isReadOnlyLockdown
                    ? 'bg-amber-500/10 border-amber-500/40 dark:bg-amber-950/30 dark:border-amber-500/50'
                    : 'bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        isReadOnlyLockdown
                          ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/30'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <Lock className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                          Institutional Read-Only Lockdown
                        </h3>
                        {isReadOnlyLockdown && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500 text-white animate-pulse">
                            FROZEN
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                        Freezes all student and staff token updates across the entire platform. Useful during database migrations, audits, or meal counting cutoffs.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleToggleReadOnly}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                      isReadOnlyLockdown
                        ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30'
                        : 'bg-gray-900 hover:bg-black dark:bg-white/10 dark:hover:bg-white/20 text-white'
                    }`}
                  >
                    {isReadOnlyLockdown ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                    {isReadOnlyLockdown ? 'Release Freeze' : 'Freeze System'}
                  </button>
                </div>
              </div>

              {/* Switch 3: Emergency Meal Override */}
              <div
                className={`p-5 rounded-2xl border transition-all ${
                  isEmergencyMealOverrideActive
                    ? 'bg-emerald-500/10 border-emerald-500/40 dark:bg-emerald-950/30 dark:border-emerald-500/50'
                    : 'bg-white dark:bg-white/[0.03] border-gray-200 dark:border-white/10'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                        isEmergencyMealOverrideActive
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                          Emergency Meal Override (Universal Unlock)
                        </h3>
                        {isEmergencyMealOverrideActive && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white animate-pulse">
                            ACTIVE OVERRIDE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xl">
                        Suspends all meal lock cutoffs campus-wide. Enables all students to modify dining tokens regardless of standard cutoff times.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleToggleEmergencyOverride}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-md transition-all active:scale-95 ${
                      isEmergencyMealOverrideActive
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30'
                        : 'bg-gray-900 hover:bg-black dark:bg-white/10 dark:hover:bg-white/20 text-white'
                    }`}
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {isEmergencyMealOverrideActive ? 'Deactivate Override' : 'Engage Universal Unlock'}
                  </button>
                </div>

                {/* Override Reason Note */}
                <div className="mt-4 pt-3 border-t border-gray-200/60 dark:border-white/5">
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Emergency Event / Reason Note
                  </label>
                  <input
                    type="text"
                    value={localOverrideNote}
                    onChange={(e) => setLocalOverrideNote(e.target.value)}
                    placeholder="e.g. Special Eid Banquet / Exam Night Leniency"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: MEAL CUTOFFS & FINES */}
          {activeTab === 'schedules' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Breakfast Config Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 space-y-4">
                <div className="flex items-center gap-2.5 text-amber-500 font-bold text-sm">
                  <Coffee className="w-4 h-4" />
                  <span>Breakfast Service Window & Cutoff</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Serving Start</label>
                    <input
                      type="time"
                      value={breakfastConfig.servingStartTime || '07:00'}
                      onChange={(e) => setBreakfastConfig({ ...breakfastConfig, servingStartTime: e.target.value })}
                      className="w-full mt-1 text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Serving End</label>
                    <input
                      type="time"
                      value={breakfastConfig.servingEndTime || '09:00'}
                      onChange={(e) => setBreakfastConfig({ ...breakfastConfig, servingEndTime: e.target.value })}
                      className="w-full mt-1 text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Lock Cutoff (IST)</label>
                    <input
                      type="time"
                      value={breakfastConfig.cutoffTime || '21:00'}
                      onChange={(e) => setBreakfastConfig({ ...breakfastConfig, cutoffTime: e.target.value })}
                      className="w-full mt-1 text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Grace (Mins)</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={breakfastConfig.graceMinutes ?? 15}
                      onChange={(e) => setBreakfastConfig({ ...breakfastConfig, graceMinutes: Number(e.target.value) })}
                      className="w-full mt-1 text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-white/5">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Meal Cost (₹)</label>
                    <input
                      type="number"
                      value={breakfastConfig.costPerMeal ?? 35}
                      onChange={(e) => setBreakfastConfig({ ...breakfastConfig, costPerMeal: Number(e.target.value) })}
                      className="w-full mt-1 text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Late Cancel Fine (₹)</label>
                    <input
                      type="number"
                      value={breakfastConfig.fineForLateCancel ?? 15}
                      onChange={(e) => setBreakfastConfig({ ...breakfastConfig, fineForLateCancel: Number(e.target.value) })}
                      className="w-full mt-1 text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Lunch Config Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 space-y-4">
                <div className="flex items-center gap-2.5 text-emerald-500 font-bold text-sm">
                  <Utensils className="w-4 h-4" />
                  <span>Lunch Service Window & Cutoff</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Serving Start</label>
                    <input
                      type="time"
                      value={lunchConfig.servingStartTime || '12:30'}
                      onChange={(e) => setLunchConfig({ ...lunchConfig, servingStartTime: e.target.value })}
                      className="w-full mt-1 text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Serving End</label>
                    <input
                      type="time"
                      value={lunchConfig.servingEndTime || '14:30'}
                      onChange={(e) => setLunchConfig({ ...lunchConfig, servingEndTime: e.target.value })}
                      className="w-full mt-1 text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Lock Cutoff (IST)</label>
                    <input
                      type="time"
                      value={lunchConfig.cutoffTime || '08:30'}
                      onChange={(e) => setLunchConfig({ ...lunchConfig, cutoffTime: e.target.value })}
                      className="w-full mt-1 text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Grace (Mins)</label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={lunchConfig.graceMinutes ?? 15}
                      onChange={(e) => setLunchConfig({ ...lunchConfig, graceMinutes: Number(e.target.value) })}
                      className="w-full mt-1 text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-white/5">
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Meal Cost (₹)</label>
                    <input
                      type="number"
                      value={lunchConfig.costPerMeal ?? 50}
                      onChange={(e) => setLunchConfig({ ...lunchConfig, costPerMeal: Number(e.target.value) })}
                      className="w-full mt-1 text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">Late Cancel Fine (₹)</label>
                    <input
                      type="number"
                      value={lunchConfig.fineForLateCancel ?? 20}
                      onChange={(e) => setLunchConfig({ ...lunchConfig, fineForLateCancel: Number(e.target.value) })}
                      className="w-full mt-1 text-xs px-3 py-2 rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-300 dark:border-white/10 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: FLOOR LAYOUT */}
          {activeTab === 'layout' && (
            <div className="space-y-4">
              <div className="p-5 rounded-2xl bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Dining Table Section Chunk Size
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Controls how many tokens are grouped into each mess table section on public and print manifests.
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={chunkSize}
                    onChange={(e) => setChunkSize(Number(e.target.value))}
                    className="flex-1 accent-emerald-500 h-2 bg-gray-200 dark:bg-white/10 rounded-lg cursor-pointer"
                  />
                  <span className="w-16 text-center px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 font-black font-mono text-sm">
                    {chunkSize}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-gray-50/70 dark:bg-black/30 border-t border-gray-200 dark:border-white/10 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-emerald-500" />
            Changes sync to Firestore in real-time with automated audit logging.
          </span>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveSchedules}
              className="px-5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 flex items-center gap-2 transition-all active:scale-95"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? 'Committing...' : 'Commit Settings'}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
