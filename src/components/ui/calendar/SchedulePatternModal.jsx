import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Calendar,
  Check,
  Utensils,
  Coffee,
  ShieldCheck,
  Clock,
  Layers,
  ArrowRight,
  Sun,
  Moon,
  Info,
} from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { useTokenLockStatus } from '../../../utils/useTokenLockStatus';
import {
  addDaysToDate,
  getDayOfWeekShort,
  formatFriendlyDate,
  calculateEffectiveDateMeals,
} from '../../../utils/studentExceptionService';

const DAYS_LIST = [
  { key: 'su', label: 'Sun', full: 'Sunday' },
  { key: 'mo', label: 'Mon', full: 'Monday' },
  { key: 'tu', label: 'Tue', full: 'Tuesday' },
  { key: 'we', label: 'Wed', full: 'Wednesday' },
  { key: 'th', label: 'Thu', full: 'Thursday' },
  { key: 'fr', label: 'Fri', full: 'Friday' },
  { key: 'sa', label: 'Sat', full: 'Saturday' },
];

export default function SchedulePatternModal({
  isOpen,
  onClose,
  student,
  currentYear,
  currentMonth,
  onApplySchedulePattern,
  isAdmin = false,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const { todayIST, tomorrowIST, isTomorrowLocked, getDateLockStatus } = useTokenLockStatus();

  // Pattern Preset: 'all_on' | 'weekdays' | 'weekend_off' | 'fasting' | 'custom'
  const [selectedPreset, setSelectedPreset] = useState('all_on');

  // Custom 7-day pattern state: { breakfast: { su: bool, ... }, lunch: { su: bool, ... } }
  const [customPattern, setCustomPattern] = useState(() => {
    const initBf = {};
    const initLu = {};
    DAYS_LIST.forEach(({ key }) => {
      initBf[key] = student?.obj?.breakfast?.[key] !== undefined ? Boolean(student.obj.breakfast[key]) : true;
      initLu[key] = student?.obj?.lunch?.[key] !== undefined ? Boolean(student.obj.lunch[key]) : true;
    });
    return { breakfast: initBf, lunch: initLu };
  });

  // Scope: 'month' | '30days' | '90days' | 'year'
  const [scope, setScope] = useState('month');

  // Resolve target dates based on scope
  const targetDates = useMemo(() => {
    if (!isOpen) return [];
    const dates = [];
    if (scope === 'month') {
      const totalDaysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      for (let d = 1; d <= totalDaysInMonth; d++) {
        const dayStr = String(d).padStart(2, '0');
        const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
        if (dateStr >= todayIST) {
          dates.push(dateStr);
        }
      }
    } else if (scope === '30days') {
      for (let i = 0; i <= 30; i++) {
        dates.push(addDaysToDate(todayIST, i));
      }
    } else if (scope === '90days') {
      for (let i = 0; i <= 90; i++) {
        dates.push(addDaysToDate(todayIST, i));
      }
    } else if (scope === 'year') {
      for (let i = 0; i <= 365; i++) {
        dates.push(addDaysToDate(todayIST, i));
      }
    }
    return dates;
  }, [isOpen, scope, currentYear, currentMonth, todayIST]);

  // Compute pattern to apply for any day of week key
  const getPatternForDay = (dayKey) => {
    if (selectedPreset === 'all_on') {
      return { breakfast: true, lunch: true };
    }
    if (selectedPreset === 'weekdays') {
      // Sun-Thu on, Fri/Sat off
      const isWeekend = dayKey === 'fr' || dayKey === 'sa';
      return {
        breakfast: !isWeekend,
        lunch: !isWeekend,
      };
    }
    if (selectedPreset === 'weekend_off') {
      // Fri both off, Sat breakfast off, Sat lunch on, others on
      if (dayKey === 'fr') return { breakfast: false, lunch: false };
      if (dayKey === 'sa') return { breakfast: false, lunch: true };
      return { breakfast: true, lunch: true };
    }
    if (selectedPreset === 'fasting') {
      // Mon & Thu fasting -> lunch is off
      const isFasting = dayKey === 'mo' || dayKey === 'th';
      return {
        breakfast: true,
        lunch: !isFasting,
      };
    }
    // custom
    return {
      breakfast: Boolean(customPattern.breakfast[dayKey]),
      lunch: Boolean(customPattern.lunch[dayKey]),
    };
  };

  // Calculate preview count and locked days protected
  const { totalApplicable, lockedCount } = useMemo(() => {
    if (!isOpen) return { totalApplicable: 0, lockedCount: 0 };
    let applicable = 0;
    let locked = 0;
    targetDates.forEach((dateStr) => {
      const lockInfo = getDateLockStatus(dateStr, { isAdmin });
      if (lockInfo.isLocked && !isAdmin) {
        locked++;
      } else {
        applicable++;
      }
    });
    return { totalApplicable: applicable, lockedCount: locked };
  }, [isOpen, targetDates, getDateLockStatus, isAdmin]);

  if (!isOpen) return null;

  const handleToggleCustom = (meal, dayKey) => {
    feedback('tick');
    setCustomPattern((prev) => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        [dayKey]: !prev[meal][dayKey],
      },
    }));
  };

  const handleApply = () => {
    feedback('success');
    const updatedExceptions = { ...(student?.dateExceptions || {}) };
    let appliedDatesCount = 0;

    targetDates.forEach((dateStr) => {
      const lockInfo = getDateLockStatus(dateStr, { isAdmin });
      // Protect locked dates for students
      if (!isAdmin && lockInfo.isLocked) {
        return;
      }

      const dayKey = getDayOfWeekShort(dateStr);
      const mealSettings = getPatternForDay(dayKey);

      updatedExceptions[dateStr] = {
        breakfast: mealSettings.breakfast,
        lunch: mealSettings.lunch,
        label: selectedPreset === 'all_on'
          ? 'Full Dining'
          : selectedPreset === 'weekend_off'
          ? 'Weekend Leave'
          : selectedPreset === 'fasting'
          ? 'Fasting'
          : 'Schedule Pattern',
        updatedAt: new Date().toISOString(),
      };
      appliedDatesCount++;
    });

    if (onApplySchedulePattern) {
      onApplySchedulePattern(updatedExceptions, {
        preset: selectedPreset,
        scope,
        appliedDatesCount,
        lockedCount,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                {t('applySchedulePattern', 'Apply Dining Schedule Pattern')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('applyPatternDesc', 'Quickly configure meal days across multiple weeks or months')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Step 1: Pattern Preset Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <span>1. {t('selectPatternPreset', 'Select Schedule Pattern')}</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {/* Preset: All Days Active */}
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setSelectedPreset('all_on');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedPreset === 'all_on'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-950 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500/40'
                    : 'bg-gray-50/80 dark:bg-white/5 border-gray-200/80 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 text-gray-700 dark:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">All Days Active</span>
                  {selectedPreset === 'all_on' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block">7 Days Breakfast & Lunch ON</span>
              </button>

              {/* Preset: Weekend Off */}
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setSelectedPreset('weekend_off');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedPreset === 'weekend_off'
                    ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-500 text-purple-950 dark:text-purple-100 shadow-sm ring-1 ring-purple-500/40'
                    : 'bg-gray-50/80 dark:bg-white/5 border-gray-200/80 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 text-gray-700 dark:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">Weekend Leave</span>
                  {selectedPreset === 'weekend_off' && <Check className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />}
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Fri Off + Sat Morning Off</span>
              </button>

              {/* Preset: Sunnah Fasting */}
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setSelectedPreset('fasting');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedPreset === 'fasting'
                    ? 'bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-950 dark:text-teal-100 shadow-sm ring-1 ring-teal-500/40'
                    : 'bg-gray-50/80 dark:bg-white/5 border-gray-200/80 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 text-gray-700 dark:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">Mon & Thu Fasting</span>
                  {selectedPreset === 'fasting' && <Check className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />}
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Lunch OFF Mon & Thu</span>
              </button>

              {/* Preset: Weekdays Only */}
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setSelectedPreset('weekdays');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedPreset === 'weekdays'
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-950 dark:text-blue-100 shadow-sm ring-1 ring-blue-500/40'
                    : 'bg-gray-50/80 dark:bg-white/5 border-gray-200/80 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 text-gray-700 dark:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">Weekdays Only</span>
                  {selectedPreset === 'weekdays' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Sun–Thu Active, Weekend Off</span>
              </button>

              {/* Preset: Custom 7-Day Pattern */}
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setSelectedPreset('custom');
                }}
                className={`p-3 rounded-2xl border text-left transition-all cursor-pointer col-span-2 sm:col-span-2 ${
                  selectedPreset === 'custom'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-500 text-amber-950 dark:text-amber-100 shadow-sm ring-1 ring-amber-500/40'
                    : 'bg-gray-50/80 dark:bg-white/5 border-gray-200/80 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10 text-gray-700 dark:text-gray-200'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-black">Custom 7-Day Matrix</span>
                  {selectedPreset === 'custom' && <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />}
                </div>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block">Pick exact meals for each day (Sun–Sat)</span>
              </button>
            </div>
          </div>

          {/* Interactive Custom Matrix Editor if Custom is selected */}
          {selectedPreset === 'custom' && (
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-3">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
                Tap days to toggle meals ON/OFF in your custom weekly pattern:
              </span>

              {/* Breakfast row */}
              <div className="space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-teal-700 dark:text-teal-300">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Breakfast</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {DAYS_LIST.map(({ key, label }) => {
                    const isOn = Boolean(customPattern.breakfast[key]);
                    return (
                      <button
                        key={`bf-${key}`}
                        type="button"
                        onClick={() => handleToggleCustom('breakfast', key)}
                        className={`py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                          isOn
                            ? 'bg-teal-600 text-white shadow-xs'
                            : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Lunch row */}
              <div className="space-y-1.5 pt-2 border-t border-gray-200/60 dark:border-white/5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Lunch</span>
                </div>
                <div className="grid grid-cols-7 gap-1.5 text-center">
                  {DAYS_LIST.map(({ key, label }) => {
                    const isOn = Boolean(customPattern.lunch[key]);
                    return (
                      <button
                        key={`lu-${key}`}
                        type="button"
                        onClick={() => handleToggleCustom('lunch', key)}
                        className={`py-2 rounded-xl text-xs font-bold font-mono transition-all cursor-pointer ${
                          isOn
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Target Scope Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
              <span>2. {t('applyToScope', 'Apply Pattern To Which Horizon?')}</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setScope('month');
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  scope === 'month'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                This Month
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setScope('30days');
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  scope === '30days'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                Next 30 Days
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setScope('90days');
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  scope === '90days'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                Term (90 Days)
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setScope('year');
                }}
                className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-center transition-all cursor-pointer ${
                  scope === 'year'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                Academic Year
              </button>
            </div>
          </div>

          {/* Impact & Safeguard Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-1 text-emerald-950 dark:text-emerald-200">
            <div className="flex items-center gap-2 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>
                Will update {totalApplicable} upcoming calendar dates
              </span>
            </div>
            {lockedCount > 0 && !isAdmin && (
              <p className="text-[11px] text-emerald-800 dark:text-emerald-300 pl-6">
                🛡️ {lockedCount} locked date(s) (Today / Tomorrow past cutoff) will be preserved safely.
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-3 bg-gray-50/50 dark:bg-black/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/25 active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Apply Schedule Pattern</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
