import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Check, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { useFeedback } from '../../../utils/useFeedback';
import { useLanguage } from '../../../store/LanguageContext';

const MONTH_KEYS = [
  'jan', 'feb', 'mar', 'apr', 'may', 'jun',
  'jul', 'aug', 'sep', 'oct', 'nov', 'dec'
];

const MONTH_NAMES_FALLBACK = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthJumpPopover({
  isOpen,
  onClose,
  currentYear,
  currentMonth,
  onSelectMonth,
  todayIST,
  anchorRef,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const popoverRef = useRef(null);

  // Active year inside the popover picker
  const [pickerYear, setPickerYear] = useState(currentYear);

  // Parse today's year and month
  const [todayY, todayM] = (todayIST || '').split('-').map(Number);
  const isTodayMonth = (mIndex, y) => todayY === y && todayM === mIndex + 1;

  // Sync picker year when popover opens or currentYear changes
  useEffect(() => {
    if (isOpen) {
      setPickerYear(currentYear);
    }
  }, [isOpen, currentYear]);

  // Click outside and escape handler
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(e) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target) &&
        (!anchorRef?.current || !anchorRef.current.contains(e.target))
      ) {
        onClose();
      }
    }

    function handleKeyDown(e) {
      if (e.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  const handlePrevYear = (e) => {
    e.stopPropagation();
    feedback('tick');
    setPickerYear((y) => y - 1);
  };

  const handleNextYear = (e) => {
    e.stopPropagation();
    feedback('tick');
    setPickerYear((y) => y + 1);
  };

  const handleSelect = (mIndex) => {
    feedback('pop');
    onSelectMonth(mIndex, pickerYear);
    onClose();
  };

  const handleSelectTodayMonth = () => {
    feedback('pop');
    if (todayY && todayM) {
      onSelectMonth(todayM - 1, todayY);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={popoverRef}
        initial={{ opacity: 0, y: -8, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -6, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        className="absolute top-full right-0 sm:left-1/2 sm:-translate-x-1/2 mt-2 z-50 w-72 xs:w-80 p-3.5 rounded-2xl bg-white/95 dark:bg-[#121c19]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-white/15 shadow-2xl shadow-emerald-950/20 text-gray-900 dark:text-white select-none"
        role="dialog"
        aria-label="Fast Month & Year Selector"
      >
        {/* Header: Year Stepper */}
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100 dark:border-white/10">
          <div className="flex items-center gap-1.5">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <CalendarIcon className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-black tracking-wide text-gray-700 dark:text-gray-300 uppercase">
              {t('selectMonth', 'Jump to Month')}
            </span>
          </div>

          <div className="flex items-center gap-1 bg-gray-100/80 dark:bg-white/5 p-0.5 rounded-xl border border-gray-200/60 dark:border-white/10">
            <button
              type="button"
              onClick={handlePrevYear}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors"
              title="Previous Year"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-black font-mono px-2 text-gray-900 dark:text-white min-w-[48px] text-center">
              {pickerYear}
            </span>
            <button
              type="button"
              onClick={handleNextYear}
              className="p-1 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors"
              title="Next Year"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 3x4 Month Grid */}
        <div className="grid grid-cols-3 gap-1.5">
          {MONTH_KEYS.map((key, idx) => {
            const isSelected = pickerYear === currentYear && currentMonth === idx;
            const isToday = isTodayMonth(idx, pickerYear);
            const monthLabel = t(`monthsFull.${idx}`, MONTH_NAMES_FALLBACK[idx]);
            const shortLabel = monthLabel.slice(0, 3);

            return (
              <button
                key={key}
                type="button"
                onClick={() => handleSelect(idx)}
                className={`relative group px-2 py-2 rounded-xl text-xs font-extrabold transition-all duration-150 flex flex-col items-center justify-center gap-0.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 ring-2 ring-emerald-500/40'
                    : isToday
                    ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/20'
                    : 'bg-gray-50/70 hover:bg-gray-100 dark:bg-white/[0.04] dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'
                }`}
              >
                <div className="flex items-center gap-1">
                  <span>{shortLabel}</span>
                  {isSelected && <Check className="w-3 h-3 text-white flex-shrink-0" />}
                </div>

                {/* Sub-label or Today pill indicator */}
                {isToday && (
                  <span
                    className={`text-[9px] font-bold px-1.5 rounded-full ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer: Jump to Current Academic Month */}
        <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-[11px]">
          <span className="text-gray-400 dark:text-gray-500 font-medium">
            1-click instant month jump
          </span>
          <button
            type="button"
            onClick={handleSelectTodayMonth}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 transition-colors"
          >
            <Sparkles className="w-3 h-3" />
            <span>{t('currentMonth', 'Current Month')}</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
