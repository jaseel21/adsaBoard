import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Coffee,
  Utensils,
  Sparkles,
  Plane,
  RotateCcw,
  CheckSquare,
  CalendarDays,
} from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';

export default function MultiDateActionBar({
  selectedDates = [],
  onClearSelection,
  onSelectAllMonth,
  onSelectWeekdays,
  onSelectWeekends,
  onApplyMealState, // ({ breakfast?: bool, lunch?: bool, label: string })
  totalMonthDaysCount = 0,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  if (!selectedDates || selectedDates.length === 0) return null;

  const count = selectedDates.length;

  const handleAction = (settings) => {
    feedback('tick');
    onApplyMealState(settings);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className="fixed bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-40 w-[95%] max-w-2xl"
      >
        <div className="p-2 sm:p-3 rounded-2xl bg-gray-900/95 dark:bg-[#0c1412]/95 text-white border border-white/15 shadow-2xl backdrop-blur-2xl flex flex-col sm:flex-row items-center justify-between gap-2.5">
          {/* Left: Selected count & Quick pickers */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-500/20 text-emerald-400 font-mono font-black text-xs flex items-center justify-center border border-emerald-500/30">
                {count}
              </span>
              <span className="text-xs font-bold text-gray-200">
                {count === 1 ? '1 date selected' : `${count} dates selected`}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={onSelectAllMonth}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Select all days in current month"
              >
                All ({totalMonthDaysCount})
              </button>
              <button
                type="button"
                onClick={onSelectWeekdays}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Select weekdays only"
              >
                Weekdays
              </button>
              <button
                type="button"
                onClick={onSelectWeekends}
                className="px-2 py-1 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/15 text-gray-300 hover:text-white transition-colors cursor-pointer"
                title="Select weekend days (Fri/Sat)"
              >
                Weekends
              </button>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end flex-wrap">
            {/* Both ON */}
            <button
              type="button"
              onClick={() => handleAction({ breakfast: true, lunch: true, label: 'Eating (Both ON)' })}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
              title="Set Both Breakfast & Lunch to Active ON for selected dates"
            >
              <Sparkles className="w-3 h-3" />
              <span>Both ON</span>
            </button>

            {/* Leave / Both OFF */}
            <button
              type="button"
              onClick={() => handleAction({ breakfast: false, lunch: false, label: 'Leave (Full Day OFF)' })}
              className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-[11px] shadow-sm flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
              title="Mark selected dates as Leave (Both meals OFF)"
            >
              <Plane className="w-3 h-3" />
              <span>Leave (OFF)</span>
            </button>

            {/* Breakfast Toggle */}
            <div className="inline-flex rounded-xl bg-white/10 p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => handleAction({ breakfast: true, label: 'Breakfast ON' })}
                className="px-1.5 py-1 rounded-lg text-[10px] font-bold text-teal-300 hover:bg-white/10 transition-colors flex items-center gap-0.5"
                title="Turn Breakfast ON"
              >
                <Coffee className="w-2.5 h-2.5" />
                <span>Bf ON</span>
              </button>
              <button
                type="button"
                onClick={() => handleAction({ breakfast: false, label: 'Breakfast OFF' })}
                className="px-1.5 py-1 rounded-lg text-[10px] font-bold text-rose-300 hover:bg-white/10 transition-colors flex items-center gap-0.5"
                title="Turn Breakfast OFF"
              >
                <span>Bf OFF</span>
              </button>
            </div>

            {/* Lunch Toggle */}
            <div className="inline-flex rounded-xl bg-white/10 p-0.5 border border-white/10">
              <button
                type="button"
                onClick={() => handleAction({ lunch: true, label: 'Lunch ON' })}
                className="px-1.5 py-1 rounded-lg text-[10px] font-bold text-emerald-300 hover:bg-white/10 transition-colors flex items-center gap-0.5"
                title="Turn Lunch ON"
              >
                <Utensils className="w-2.5 h-2.5" />
                <span>Lu ON</span>
              </button>
              <button
                type="button"
                onClick={() => handleAction({ lunch: false, label: 'Lunch OFF' })}
                className="px-1.5 py-1 rounded-lg text-[10px] font-bold text-rose-300 hover:bg-white/10 transition-colors flex items-center gap-0.5"
                title="Turn Lunch OFF"
              >
                <span>Lu OFF</span>
              </button>
            </div>

            {/* Clear / Dismiss */}
            <button
              type="button"
              onClick={onClearSelection}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white transition-colors cursor-pointer"
              title="Deselect all"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
