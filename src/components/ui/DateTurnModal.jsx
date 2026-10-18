import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Coffee,
  Utensils,
  Check,
  RotateCcw,
  Sparkles,
  Calendar,
  Layers,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import {
  formatFriendlyDate,
  getDayOfWeekShort,
  getTodayISTDate,
  addDaysToDate,
  calculateEffectiveDateMeals,
} from '../../utils/studentExceptionService';

const QUICK_REASONS = [
  'Leave / Going Home',
  'Fasting',
  'Out of Campus / Travel',
  'Exam / Event',
];

export default function DateTurnModal({
  isOpen,
  onClose,
  dateStr,
  student,
  onSaveException,
  onRemoveException,
  onApplyRange,
}) {
  const { feedback } = useFeedback();

  const todayIST = useMemo(() => getTodayISTDate(), []);
  const maxExceptionDate = useMemo(() => addDaysToDate(todayIST, 365), [todayIST]);

  // Determine current meal status from student routine + existing exception
  const statusInfo = useMemo(() => {
    if (!student || !dateStr) {
      return {
        breakfast: true,
        lunch: true,
        routineBreakfast: true,
        routineLunch: true,
        hasException: false,
        label: '',
      };
    }
    return calculateEffectiveDateMeals(student, dateStr);
  }, [student, dateStr]);

  const [localBf, setLocalBf] = useState(true);
  const [localLunch, setLocalLunch] = useState(true);
  const [reasonLabel, setReasonLabel] = useState('');

  // Multi-day range state
  const [isRangeMode, setIsRangeMode] = useState(false);
  const [rangeEndDate, setRangeEndDate] = useState('');

  // Sync state when dateStr or modal opens
  useEffect(() => {
    if (isOpen && dateStr) {
      setLocalBf(statusInfo.breakfast);
      setLocalLunch(statusInfo.lunch);
      setReasonLabel(statusInfo.label || '');
      setIsRangeMode(false);
      setRangeEndDate(addDaysToDate(dateStr, 2) <= maxExceptionDate ? addDaysToDate(dateStr, 2) : dateStr);
    }
  }, [isOpen, dateStr, statusInfo, maxExceptionDate]);

  if (!isOpen || !dateStr) return null;

  const isToday = dateStr === todayIST;
  const dayKey = getDayOfWeekShort(dateStr);
  const routineBf = statusInfo.routineBreakfast;
  const routineLunch = statusInfo.routineLunch;

  // Single-Click Presets
  const handleTurnDayOff = () => {
    feedback('pop');
    setLocalBf(false);
    setLocalLunch(false);
    if (!reasonLabel) setReasonLabel('Leave / Skipped');
  };

  const handleTurnDayOn = () => {
    feedback('pop');
    setLocalBf(true);
    setLocalLunch(true);
  };

  const handleResetToRoutine = () => {
    feedback('warning');
    if (onRemoveException) {
      onRemoveException(dateStr);
    }
    onClose();
  };

  const handleConfirmSave = () => {
    feedback('success');
    if (isRangeMode && onApplyRange && rangeEndDate >= dateStr) {
      onApplyRange(dateStr, rangeEndDate, {
        breakfast: localBf,
        lunch: localLunch,
        label: reasonLabel.trim(),
      });
    } else if (onSaveException) {
      onSaveException(dateStr, {
        breakfast: localBf,
        lunch: localLunch,
        label: reasonLabel.trim(),
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
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/90 dark:border-white/10 shadow-2xl p-5 sm:p-7 space-y-5 relative overflow-hidden backdrop-blur-2xl max-h-[92vh] overflow-y-auto"
      >
        {/* Close Button */}
        <button
          onClick={() => {
            feedback('tick');
            onClose();
          }}
          className="absolute right-4 top-4 p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-mono font-extrabold text-base flex flex-col items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
            <span>{dateStr.split('-')[2]}</span>
            <span className="text-[9px] uppercase font-sans font-bold -mt-1 opacity-80">{dayKey}</span>
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
                {formatFriendlyDate(dateStr, true)}
              </h3>
              {isToday && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-600 border border-emerald-500/30">
                  Today
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400">
              {statusInfo.hasException ? (
                <span className="text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Custom Override Active: {statusInfo.label || 'Modified'}
                </span>
              ) : (
                <span>
                  Following Weekly Schedule ({routineBf ? 'Breakfast ON' : 'Breakfast OFF'}, {routineLunch ? 'Lunch ON' : 'Lunch OFF'})
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ================= TACTILE MEAL SWITCHES ================= */}
        <div className="space-y-3 pt-1">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
            Turn Meals On or Off for this Date
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Breakfast Switch Card */}
            <button
              type="button"
              onClick={() => {
                feedback('pop');
                setLocalBf((prev) => !prev);
              }}
              className={`p-4 rounded-2xl text-left border transition-all duration-200 transform active:scale-95 flex items-center justify-between ${
                localBf
                  ? 'bg-gradient-to-br from-amber-50 to-amber-100/70 dark:from-amber-950/40 dark:to-amber-900/20 border-amber-300 dark:border-amber-500/40 shadow-sm'
                  : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    localBf
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-gray-200 dark:bg-white/10 text-gray-400'
                  }`}
                >
                  <Coffee className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold block text-gray-900 dark:text-white">
                    Breakfast
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Routine: {routineBf ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              <div
                className={`px-3 py-1.5 rounded-xl font-mono font-extrabold text-xs shadow-sm transition-all ${
                  localBf
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/25'
                }`}
              >
                {localBf ? 'ON' : 'OFF'}
              </div>
            </button>

            {/* Lunch Switch Card */}
            <button
              type="button"
              onClick={() => {
                feedback('pop');
                setLocalLunch((prev) => !prev);
              }}
              className={`p-4 rounded-2xl text-left border transition-all duration-200 transform active:scale-95 flex items-center justify-between ${
                localLunch
                  ? 'bg-gradient-to-br from-emerald-50 to-emerald-100/70 dark:from-emerald-950/40 dark:to-emerald-900/20 border-emerald-300 dark:border-emerald-500/40 shadow-sm'
                  : 'bg-gray-50 dark:bg-white/[0.03] border-gray-200 dark:border-white/10 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                    localLunch
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-gray-200 dark:bg-white/10 text-gray-400'
                  }`}
                >
                  <Utensils className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-sm font-bold block text-gray-900 dark:text-white">
                    Lunch
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    Routine: {routineLunch ? 'ON' : 'OFF'}
                  </span>
                </div>
              </div>

              <div
                className={`px-3 py-1.5 rounded-xl font-mono font-extrabold text-xs shadow-sm transition-all ${
                  localLunch
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/25'
                    : 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-rose-500/25'
                }`}
              >
                {localLunch ? 'ON' : 'OFF'}
              </div>
            </button>
          </div>
        </div>

        {/* ================= ONE-TAP PRESET BUTTONS ================= */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
            1-Tap Quick Actions
          </span>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleTurnDayOff}
              className="py-2.5 px-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 hover:bg-rose-100 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-center"
            >
              <span className="text-[11px] leading-tight">🛑 All OFF</span>
              <span className="text-[9px] font-normal opacity-75">Leave / Fast</span>
            </button>

            <button
              type="button"
              onClick={handleTurnDayOn}
              className="py-2.5 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-center"
            >
              <span className="text-[11px] leading-tight">🟢 All ON</span>
              <span className="text-[9px] font-normal opacity-75">Attend Meals</span>
            </button>

            <button
              type="button"
              onClick={handleResetToRoutine}
              className="py-2.5 px-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-200 font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all active:scale-95 text-center"
            >
              <span className="text-[11px] leading-tight">🔄 Reset Routine</span>
              <span className="text-[9px] font-normal opacity-75">Clear Override</span>
            </button>
          </div>
        </div>

        {/* Optional Reason Tag */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 block">
            Reason / Tag (Optional)
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {QUICK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  feedback('tick');
                  setReasonLabel(r);
                }}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  reasonLabel === r
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={reasonLabel}
            onChange={(e) => setReasonLabel(e.target.value)}
            placeholder="e.g. Visiting home, Medical appointment, Fasting..."
            className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-[#131b18] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        {/* Multi-Day Leave / Range Toggle */}
        <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 space-y-2.5">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
              <span>Apply across Multiple Days (Leave Range)</span>
            </span>
            <input
              type="checkbox"
              checked={isRangeMode}
              onChange={(e) => {
                feedback('tick');
                setIsRangeMode(e.target.checked);
              }}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
          </label>

          {isRangeMode && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="pt-2 border-t border-gray-200/60 dark:border-white/5 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">From: <strong>{dateStr}</strong></span>
                <span className="text-gray-400">→</span>
                <div className="flex items-center gap-1">
                  <span className="text-gray-500">Until:</span>
                  <input
                    type="date"
                    min={dateStr}
                    max={maxExceptionDate}
                    value={rangeEndDate}
                    onChange={(e) => setRangeEndDate(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#15221e] border border-gray-300 dark:border-white/20 text-xs font-bold text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <p className="text-[10px] text-gray-400">
                This will apply {localBf ? 'Breakfast ON' : 'Breakfast OFF'} and {localLunch ? 'Lunch ON' : 'Lunch OFF'} to all dates in this range.
              </p>
            </motion.div>
          )}
        </div>

        {/* Modal Controls / Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100 dark:border-white/5">
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              onClose();
            }}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirmSave}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 hover:from-emerald-700 hover:to-green-700 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>{isRangeMode ? 'Apply to Date Range' : 'Save Date Setting'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
