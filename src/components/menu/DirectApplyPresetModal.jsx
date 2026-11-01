import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  Calendar,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Coffee,
  Utensils,
  Moon,
  Sparkles,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';
import {
  DAY_KEYS,
  DAY_NAMES,
  DAY_SHORTS,
  applyPresetToTarget,
} from '../../utils/menuService';
import { getTodayISTDate, addDaysToDate, formatFriendlyDate } from '../../utils/studentExceptionService';

const SLOT_CONFIGS = [
  { key: 'breakfast', label: 'Breakfast', icon: Coffee },
  { key: 'lunch', label: 'Lunch', icon: Utensils },
  { key: 'evening', label: 'Evening Tea', icon: Coffee },
  { key: 'dinner', label: 'Dinner', icon: Moon },
];

export default function DirectApplyPresetModal({
  isOpen,
  onClose,
  preset = null,
  userEmail = 'admin',
  onApplied,
}) {
  const { feedback } = useFeedback();
  const todayIST = getTodayISTDate();

  // Target Destination: 'live' (Current Week) | 'baseline' (Standard Routine) | 'date' (Calendar Date Overrides)
  const [targetType, setTargetType] = useState('live');

  // Multi-day selection for live/baseline (default: Monday)
  const [selectedDayKeys, setSelectedDayKeys] = useState(['mo']);

  // Target date for date overrides (default: today)
  const [targetDateInput, setTargetDateInput] = useState(todayIST);
  const [additionalDates, setAdditionalDates] = useState([]);

  // Meal Slot target (defaults to preset's native slot if given)
  const [targetSlot, setTargetSlot] = useState('breakfast');

  const [applying, setApplying] = useState(false);

  // Sync initial slot from preset
  useEffect(() => {
    if (preset?.sourceSlot && ['breakfast', 'lunch', 'evening', 'dinner'].includes(preset.sourceSlot)) {
      setTargetSlot(preset.sourceSlot);
    }
  }, [preset]);

  if (!isOpen || !preset) return null;

  // Toggle day selection
  const handleToggleDay = (dKey) => {
    feedback('tick');
    setSelectedDayKeys((prev) => {
      if (prev.includes(dKey)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter((k) => k !== dKey);
      }
      return [...prev, dKey];
    });
  };

  // Quick day selections
  const handleQuickSelectDays = (mode) => {
    feedback('tick');
    if (mode === 'all') setSelectedDayKeys([...DAY_KEYS]);
    if (mode === 'weekdays') setSelectedDayKeys(['mo', 'tu', 'we', 'th']);
    if (mode === 'weekends') setSelectedDayKeys(['fr', 'sa', 'su']);
  };

  // Add date to additionalDates
  const handleAddDate = () => {
    if (!targetDateInput) return;
    if (!additionalDates.includes(targetDateInput)) {
      feedback('pop');
      setAdditionalDates((prev) => [...prev, targetDateInput]);
    }
  };

  // Execute Direct Apply
  const handleExecuteApply = async () => {
    let targetKeys = [];
    if (targetType === 'live' || targetType === 'baseline') {
      targetKeys = selectedDayKeys;
    } else {
      targetKeys = Array.from(new Set([targetDateInput, ...additionalDates])).filter(Boolean);
    }

    if (targetKeys.length === 0) {
      dialog.alert({
        type: 'warning',
        title: 'Target Required',
        message: 'Please select at least one day or calendar date to apply this preset.',
      });
      return;
    }

    try {
      setApplying(true);
      feedback('pop');

      await applyPresetToTarget({
        preset,
        targetType,
        targetKeys,
        slotKey: targetSlot,
        userEmail,
      });

      const destLabel =
        targetType === 'live'
          ? `Live Schedule (${targetKeys.map((k) => DAY_SHORTS[k]).join(', ')})`
          : targetType === 'baseline'
          ? `Baseline Template (${targetKeys.map((k) => DAY_SHORTS[k]).join(', ')})`
          : `${targetKeys.length} Date(s)`;

      dialog.toast.success(
        'Preset Applied Directly',
        `Populated "${preset.title}" into ${targetSlot.toUpperCase()} for ${destLabel}.`
      );

      if (onApplied) onApplied({ preset, targetType, targetKeys, slotKey: targetSlot });
      onClose();
    } catch (err) {
      console.error('Error applying preset:', err);
      dialog.alert({
        type: 'error',
        title: 'Application Failed',
        message: err.message,
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-xl rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden space-y-5 p-5 sm:p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span>Direct Apply Preset</span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Instantly publish this dish across multiple days or specific dates.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dish Preset Preview Banner */}
          <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold text-sm text-purple-950 dark:text-purple-200">
                {preset.title}
              </span>
              {preset.category && (
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-200/80 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300">
                  {preset.category}
                </span>
              )}
            </div>
            {Array.isArray(preset.items) && preset.items.length > 0 && (
              <p className="text-xs text-purple-700 dark:text-purple-300">
                {preset.items.join(' • ')}
              </p>
            )}
          </div>

          {/* 1. Target Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
              1. Select Destination Scope
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'live', label: 'Live Supply Week', desc: 'Current active week' },
                { id: 'baseline', label: 'Baseline Template', desc: 'Recurring standard' },
                { id: 'date', label: 'Calendar Dates', desc: 'Custom overrides' },
              ].map((dest) => {
                const isSelected = targetType === dest.id;
                return (
                  <button
                    key={dest.id}
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setTargetType(dest.id);
                    }}
                    className={`p-3 rounded-2xl text-left border transition-all ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/40 ring-2 ring-purple-500/20 shadow-xs'
                        : 'border-gray-200/80 dark:border-white/10 hover:border-gray-300'
                    }`}
                  >
                    <span className="font-black text-xs block text-gray-900 dark:text-white">
                      {dest.label}
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      {dest.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Target Meal Slot Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
              2. Target Meal Slot
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {SLOT_CONFIGS.map((slot) => {
                const Icon = slot.icon;
                const isSelected = targetSlot === slot.key;
                return (
                  <button
                    key={slot.key}
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setTargetSlot(slot.key);
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                        : 'border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{slot.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Days / Dates Selection */}
          {(targetType === 'live' || targetType === 'baseline') && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                  3. Select Days (Multi-Select Supported)
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleQuickSelectDays('all')}
                    className="text-[10px] font-bold text-purple-600 hover:underline"
                  >
                    All Days
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={() => handleQuickSelectDays('weekdays')}
                    className="text-[10px] font-bold text-purple-600 hover:underline"
                  >
                    Weekdays
                  </button>
                  <span className="text-gray-300">•</span>
                  <button
                    type="button"
                    onClick={() => handleQuickSelectDays('weekends')}
                    className="text-[10px] font-bold text-purple-600 hover:underline"
                  >
                    Weekends
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {DAY_KEYS.map((dKey) => {
                  const isSelected = selectedDayKeys.includes(dKey);
                  return (
                    <button
                      key={dKey}
                      type="button"
                      onClick={() => handleToggleDay(dKey)}
                      className={`py-2 rounded-xl text-xs font-extrabold transition-all text-center border ${
                        isSelected
                          ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                          : 'border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 bg-gray-50/50 dark:bg-white/5'
                      }`}
                    >
                      <span className="block text-[10px] uppercase opacity-75">{DAY_SHORTS[dKey]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {targetType === 'date' && (
            <div className="space-y-2">
              <label className="text-xs font-extrabold text-gray-700 dark:text-gray-300 uppercase tracking-wider block">
                3. Target Calendar Date(s)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={targetDateInput}
                  onChange={(e) => setTargetDateInput(e.target.value)}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121c19] text-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={handleAddDate}
                  className="px-3 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800/40"
                >
                  + Add Date
                </button>
              </div>

              {additionalDates.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {additionalDates.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 text-xs font-bold"
                    >
                      <span>{formatFriendlyDate(d)}</span>
                      <button
                        type="button"
                        onClick={() => setAdditionalDates((prev) => prev.filter((x) => x !== d))}
                        className="hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Bottom Action Deck */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={applying}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleExecuteApply}
              disabled={applying}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{applying ? 'Applying...' : 'Apply Preset Now'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
