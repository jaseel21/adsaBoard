import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Check,
  Sparkles,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';
import { useTokenLockStatus } from '../../utils/useTokenLockStatus';
import {
  addDaysToDate,
  getMonthCalendarDays,
  formatFriendlyDate,
} from '../../utils/studentExceptionService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DateGridPickerModal({
  isOpen,
  onClose,
  selectedDate = '',
  onSelectDate,
  minDate = '',
  maxDate = '',
  title,
}) {
  const { feedback } = useFeedback();
  const { t } = useLanguage();
  const { todayIST } = useTokenLockStatus();
  const resolvedTitle = title || t('selectCalendarDate', 'Select Calendar Date');

  const [activeDate, setActiveDate] = useState(() => selectedDate || todayIST);

  const [currentYear, setCurrentYear] = useState(() => {
    const base = selectedDate || todayIST;
    const [y] = base.split('-').map(Number);
    return y;
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const base = selectedDate || todayIST;
    const [, m] = base.split('-').map(Number);
    return m - 1;
  });

  // Sync when selectedDate changes or modal opens
  React.useEffect(() => {
    if (isOpen) {
      const base = selectedDate || todayIST;
      setActiveDate(base);
      const [y, m] = base.split('-').map(Number);
      setCurrentYear(y);
      setCurrentMonth(m - 1);
    }
  }, [isOpen, selectedDate, todayIST]);

  if (!isOpen) return null;

  const handlePrevMonth = () => {
    feedback('tick');
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    feedback('tick');
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const calendarDays = getMonthCalendarDays(currentYear, currentMonth);

  const dayKeys = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
  const dayHeaders = dayKeys.map((k) => t('days.' + k) || k.toUpperCase());

  const handleDayClick = (dateStr) => {
    feedback('pop');
    setActiveDate(dateStr);
  };

  const handleConfirm = () => {
    feedback('success');
    if (onSelectDate) onSelectDate(activeDate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/90 dark:border-white/10 shadow-2xl p-5 space-y-4 relative backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{resolvedTitle}</h3>
              <p className="text-[11px] text-gray-500">{activeDate ? formatFriendlyDate(activeDate, true) : 'Pick a date'}</p>
            </div>
          </div>
          <button
            onClick={() => {
              feedback('tick');
              onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between p-2 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
          <button
            type="button"
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs font-extrabold text-gray-900 dark:text-white">
            {t('monthsFull.' + currentMonth) || MONTH_NAMES[currentMonth]} {currentYear}
          </span>
          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* 7 Columns */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-7 gap-1 text-center">
            {dayHeaders.map((dh) => (
              <span key={dh} className="text-[10px] font-bold text-gray-400">
                {dh}
              </span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day) => {
              if (day.isBlank) {
                return <div key={day.key} className="w-full aspect-square" />;
              }

              const isSelected = activeDate === day.dateStr;
              const isPast = minDate ? day.dateStr < minDate : false;
              const isFutureBlocked = maxDate ? day.dateStr > maxDate : false;
              const isDisabled = isPast || isFutureBlocked;

              return (
                <button
                  key={day.key}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleDayClick(day.dateStr)}
                  className={`w-full aspect-square rounded-xl font-mono text-xs font-bold flex flex-col items-center justify-center transition-all ${
                    isDisabled
                      ? 'text-gray-300 dark:text-gray-700 opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-500/30 scale-105'
                      : day.isToday
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-300/60'
                      : 'hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200'
                  }`}
                >
                  <span>{day.dayNumber}</span>
                  {day.isToday && (
                    <span className="w-1 h-1 rounded-full bg-emerald-500 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex items-center gap-1.5 pt-1 border-t border-gray-100 dark:border-white/5">
          <button
            type="button"
            onClick={() => handleDayClick(todayIST)}
            className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] font-bold text-gray-600 dark:text-gray-400 hover:text-emerald-500"
          >
            {t('today', 'Today')}
          </button>
          <button
            type="button"
            onClick={() => handleDayClick(addDaysToDate(todayIST, 1))}
            className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-[10px] font-bold text-gray-600 dark:text-gray-400 hover:text-emerald-500"
          >
            {t('tomorrow', 'Tomorrow')}
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/5">
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              onClose();
            }}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
          >
            {t('cancel', 'Cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-xs shadow-md shadow-emerald-500/20 hover:from-emerald-700 hover:to-green-700"
          >
            {t('confirmSelection', 'Select Date')}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
