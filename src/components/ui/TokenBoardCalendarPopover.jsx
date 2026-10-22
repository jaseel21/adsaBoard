import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  RotateCcw,
  Clock,
  Sparkles,
  History,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  getMonthCalendarDays,
  addDaysToDate,
  formatFriendlyDate,
} from '../../utils/studentExceptionService';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_NAMES_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/**
 * TokenBoardCalendarPopover
 *
 * Full-featured tactical calendar popover for Home and Master Token Board:
 * - Unrestricted date inspection backward (historical ledger) and forward (upcoming schedules)
 * - Quick presets: Yesterday, Today, Tomorrow, and Auto Mode
 * - Month & Year browser with fast steppers and selector dropdowns
 * - Tactile day cells with visual badges for Today, Tomorrow, and Selected target date
 * - Embedded native date input fallback
 */
export default function TokenBoardCalendarPopover({
  isOpen,
  onClose,
  controller,
  anchorRef = null,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const popoverRef = useRef(null);

  const {
    targetDateIST,
    todayIST,
    dateMode,
    setDateToToday,
    setDateToTomorrow,
    setDateToCustom,
    setDateToAuto,
    isPostEveningCutoff,
  } = controller;

  // Active viewing month and year inside calendar
  const [viewYear, setViewYear] = useState(() => {
    const base = targetDateIST || todayIST;
    const [y] = base.split('-').map(Number);
    return y || new Date().getFullYear();
  });

  const [viewMonth, setViewMonth] = useState(() => {
    const base = targetDateIST || todayIST;
    const [, m] = base.split('-').map(Number);
    return (m ? m - 1 : new Date().getMonth());
  });

  // Sync view month/year when target date changes or popover opens
  useEffect(() => {
    if (isOpen && targetDateIST) {
      const [y, m] = targetDateIST.split('-').map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  }, [isOpen, targetDateIST]);

  // Click outside to dismiss
  useEffect(() => {
    if (!isOpen) return;

    function handleClickOutside(event) {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target) &&
        (!anchorRef?.current || !anchorRef.current.contains(event.target))
      ) {
        onClose();
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose, anchorRef]);

  // Calendar days grid for current month
  const calendarDays = useMemo(() => {
    return getMonthCalendarDays(viewYear, viewMonth);
  }, [viewYear, viewMonth]);

  const tomorrowIST = useMemo(() => addDaysToDate(todayIST, 1), [todayIST]);
  const yesterdayIST = useMemo(() => addDaysToDate(todayIST, -1), [todayIST]);

  // Navigation handlers
  const handlePrevMonth = () => {
    feedback('tick');
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    feedback('tick');
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    feedback('tick');
    const [y, m] = todayIST.split('-').map(Number);
    setViewYear(y);
    setViewMonth(m - 1);
    setDateToToday();
  };

  const handleSelectDate = (dateStr) => {
    feedback('tick');
    if (dateStr === todayIST) {
      setDateToToday();
    } else if (dateStr === tomorrowIST) {
      setDateToTomorrow();
    } else {
      setDateToCustom(dateStr);
    }
  };

  // Generate Year options from 3 years ago to 2 years ahead
  const currentBaseYear = Number(todayIST.split('-')[0]) || new Date().getFullYear();
  const yearOptions = useMemo(() => {
    const list = [];
    for (let y = currentBaseYear - 3; y <= currentBaseYear + 2; y++) {
      list.push(y);
    }
    return list;
  }, [currentBaseYear]);

  if (!isOpen) return null;

  const modalContent = (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            feedback('tick');
            onClose();
          }
        }}
      >
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.16, ease: 'easeOut' }}
          className="w-full max-w-[370px] rounded-3xl bg-white/95 dark:bg-[#0c1412]/95 border border-gray-200/90 dark:border-white/10 shadow-2xl backdrop-blur-2xl p-4 sm:p-5 text-gray-900 dark:text-white select-none z-[10000] overflow-hidden max-h-[92vh] overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-label={t('calendarPicker', 'Calendar')}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-sm font-black tracking-tight text-gray-900 dark:text-white truncate">
                  {t('calendarPicker', 'Calendar')}
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                  {formatFriendlyDate(targetDateIST)}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                feedback('tick');
                onClose();
              }}
              className="w-7 h-7 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 hover:text-gray-900 dark:hover:text-white flex items-center justify-center transition-colors shrink-0"
              title={t('closeCalendar', 'Close Calendar')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Preset Shortcuts Bar */}
          <div className="pt-3 pb-2 flex items-center gap-1.5 flex-wrap">
            {/* Yesterday */}
            <button
              type="button"
              onClick={() => {
                handleSelectDate(yesterdayIST);
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border shrink-0 ${
                targetDateIST === yesterdayIST
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-gray-100/80 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:bg-gray-200/70 dark:hover:bg-white/10'
              }`}
            >
              {t('yesterday', 'Yesterday')}
            </button>

            {/* Today Preset */}
            <button
              type="button"
              onClick={handleJumpToToday}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border shrink-0 ${
                targetDateIST === todayIST
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-gray-100/80 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:bg-gray-200/70 dark:hover:bg-white/10'
              }`}
            >
              {t('today', 'Today')}
            </button>

            {/* Tomorrow Preset */}
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setDateToTomorrow();
              }}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all border shrink-0 ${
                targetDateIST === tomorrowIST
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-gray-100/80 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:bg-gray-200/70 dark:hover:bg-white/10'
              }`}
            >
              {t('tomorrow', 'Tomorrow')}
            </button>

            {/* Restore Auto Mode */}
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setDateToAuto();
              }}
              title={t('resetToAutoHint', 'Restore automatic cutoff schedule (Today/Tomorrow)')}
              className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-all border ml-auto shrink-0 flex items-center gap-1 ${
                dateMode === 'auto'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-gray-100/80 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white border-gray-200/80 dark:border-white/10'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('resetToAuto', 'Auto')}</span>
            </button>
          </div>

          {/* Month & Year Navigation Row */}
          <div className="py-2.5 flex items-center justify-between gap-1 border-t border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {/* Month & Year Selectors */}
            <div className="flex items-center gap-1.5">
              <select
                value={viewMonth}
                onChange={(e) => {
                  feedback('tick');
                  setViewMonth(Number(e.target.value));
                }}
                className="px-2 py-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {MONTH_NAMES.map((name, idx) => (
                  <option key={name} value={idx} className="bg-white dark:bg-[#0f1715] text-gray-900 dark:text-white">
                    {name}
                  </option>
                ))}
              </select>

              <select
                value={viewYear}
                onChange={(e) => {
                  feedback('tick');
                  setViewYear(Number(e.target.value));
                }}
                className="px-2 py-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {yearOptions.map((y) => (
                  <option key={y} value={y} className="bg-white dark:bg-[#0f1715] text-gray-900 dark:text-white">
                    {y}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* 7-Column Day Names */}
          <div className="grid grid-cols-7 gap-1 text-center py-1 text-[11px] font-extrabold text-gray-400 dark:text-gray-500">
            {WEEKDAY_NAMES_SHORT.map((wd, i) => (
              <div key={wd} className={i === 0 || i === 6 ? 'text-emerald-500/80' : ''}>
                {wd}
              </div>
            ))}
          </div>

          {/* 7-Column Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 pt-1 pb-2">
            {calendarDays.map((cell) => {
              if (cell.isBlank) {
                return <div key={cell.key} className="h-9 rounded-xl opacity-0 pointer-events-none" />;
              }

              const isSelected = cell.dateStr === targetDateIST;
              const isCellToday = cell.dateStr === todayIST;
              const isCellTomorrow = cell.dateStr === tomorrowIST;
              const isPast = cell.dateStr < todayIST;

              return (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => handleSelectDate(cell.dateStr)}
                  className={`h-9 w-full rounded-xl text-xs font-bold flex flex-col items-center justify-center relative transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/25 font-black scale-105 z-10'
                      : isCellToday
                      ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 ring-2 ring-emerald-500/50 hover:bg-emerald-500/25'
                      : isCellTomorrow
                      ? 'bg-teal-500/10 text-teal-600 dark:text-teal-400 ring-1 ring-teal-500/40 hover:bg-teal-500/20'
                      : isPast
                      ? 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5'
                      : 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10'
                  }`}
                  title={`${cell.dateStr}${isCellToday ? ' (Today)' : isCellTomorrow ? ' (Tomorrow)' : isPast ? ' (Past Record)' : ''}`}
                >
                  <span>{cell.dayNumber}</span>

                  {/* Micro-dot Indicator for Today & Tomorrow */}
                  {isCellToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-emerald-500 absolute bottom-1" />
                  )}
                  {isCellTomorrow && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-teal-500 absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer: Native Date Input Fallback & Meta */}
          <div className="pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2">
            <span className="text-[10px] text-gray-400 font-medium">
              {targetDateIST < todayIST ? (
                <span className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
                  <History className="w-3 h-3" />
                  {t('historicalNotice', 'Historical Record')}
                </span>
              ) : targetDateIST === todayIST ? (
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {t('todayIST', 'Today (IST)')}
                </span>
              ) : targetDateIST === tomorrowIST ? (
                <span className="text-teal-600 dark:text-teal-400 font-bold">
                  {t('tomorrow', 'Tomorrow')}
                  {isPostEveningCutoff && dateMode === 'auto' ? ' (Auto)' : ''}
                </span>
              ) : (
                <span className="text-blue-600 dark:text-blue-400 font-bold">
                  {t('upcomingDate', 'Upcoming Schedule')}
                </span>
              )}
            </span>

            {/* Direct date picker fallback without min constraint */}
            <div className="relative inline-flex items-center">
              <input
                type="date"
                value={targetDateIST}
                onChange={(e) => {
                  if (e.target.value) {
                    handleSelectDate(e.target.value);
                  }
                }}
                className="px-2 py-1 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200/80 dark:hover:bg-white/10 border border-gray-200/80 dark:border-white/10 text-[11px] font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                title={t('pickAnyDate', 'Pick any calendar date (past or future) to inspect')}
              />
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(modalContent, document.body);
}
