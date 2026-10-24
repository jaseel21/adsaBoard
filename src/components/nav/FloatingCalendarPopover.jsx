import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  X,
  Sparkles,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { usePreferences } from '../../store/PreferencesContext';
import { useFeedback } from '../../utils/useFeedback';
import { useWorldTime } from '../../utils/time';
import { getCalibratedHijriDate } from '../../utils/hijriCalendar';
import { getMonthCalendarDays } from '../../utils/studentExceptionService';

const MONTH_NAMES_EN = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_NAMES_ML = [
  'ജനുവരി', 'ഫെബ്രുവരി', 'മാർച്ച്', 'ഏപ്രിൽ', 'മേയ്', 'ജൂൺ',
  'ജൂലൈ', 'ഓഗസ്റ്റ്', 'സെപ്റ്റംബർ', 'ഒക്ടോബർ', 'നവംബർ', 'ഡിസംബർ'
];

const WEEKDAYS_SHORT_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const WEEKDAYS_SHORT_ML = ['ഞാ', 'തി', 'ചൊ', 'ബു', 'വ്യാ', 'വെ', 'ശ'];

export default function FloatingCalendarPopover({
  isOpen,
  onClose,
  anchorRect,
}) {
  const { lang, t } = useLanguage();
  const { preferences } = usePreferences();
  const { feedback } = useFeedback();
  const popoverRef = useRef(null);
  const { todayIST, dayFull, longDate, nowDate } = useWorldTime('Asia/Kolkata');

  // Month & Year state
  const [viewYear, setViewYear] = useState(() => {
    return nowDate ? nowDate.getFullYear() : new Date().getFullYear();
  });
  const [viewMonth, setViewMonth] = useState(() => {
    return nowDate ? nowDate.getMonth() : new Date().getMonth();
  });
  const [selectedDate, setSelectedDate] = useState(() => todayIST);

  // Sync to today when opened
  useEffect(() => {
    if (isOpen && todayIST) {
      const [y, m] = todayIST.split('-').map(Number);
      if (y && m) {
        setViewYear(y);
        setViewMonth(m - 1);
        setSelectedDate(todayIST);
      }
    }
  }, [isOpen, todayIST]);

  // Click outside and escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handlePrevMonth = () => {
    feedback('tick');
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((prev) => prev - 1);
    } else {
      setViewMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    feedback('tick');
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((prev) => prev + 1);
    } else {
      setViewMonth((prev) => prev + 1);
    }
  };

  const handleJumpToToday = () => {
    feedback('pop');
    if (todayIST) {
      const [y, m] = todayIST.split('-').map(Number);
      setViewYear(y);
      setViewMonth(m - 1);
      setSelectedDate(todayIST);
    }
  };

  const monthName = lang === 'ml' ? MONTH_NAMES_ML[viewMonth] : MONTH_NAMES_EN[viewMonth];
  const weekdays = lang === 'ml' ? WEEKDAYS_SHORT_ML : WEEKDAYS_SHORT_EN;
  const calendarCells = getMonthCalendarDays(viewYear, viewMonth);
  const hijriData = nowDate
    ? getCalibratedHijriDate(nowDate, preferences?.hijriDateOffset || 0)
    : null;
  const hijriString = hijriData
    ? lang === 'ml'
      ? hijriData.formattedMl
      : hijriData.formattedEn
    : '';

  // Viewport-aware clamped positioning (zero transform conflict with Framer Motion)
  const style = {};
  if (typeof window !== 'undefined') {
    const popoverWidth = Math.min(320, window.innerWidth - 24);
    const isMobile = window.innerWidth < 768;
    const padding = isMobile ? 12 : 16;
    let targetLeft;

    if (anchorRect) {
      targetLeft = anchorRect.left + (anchorRect.width / 2) - (popoverWidth / 2);
    } else {
      targetLeft = (window.innerWidth - popoverWidth) / 2;
    }

    const clampedLeft = Math.max(padding, Math.min(window.innerWidth - popoverWidth - padding, targetLeft));
    style.left = `${clampedLeft}px`;
    style.top = anchorRect ? `${Math.max(8, anchorRect.bottom + 8)}px` : '64px';
    style.width = `${popoverWidth}px`;
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Scrim backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-xs pointer-events-auto"
        />

        {/* Popover Card */}
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          style={style}
          className="fixed pointer-events-auto max-w-[calc(100vw-24px)] max-h-[calc(100vh-80px)] overflow-y-auto rounded-3xl bg-white/95 dark:bg-[#0c1412]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-white/15 shadow-2xl p-4 select-none z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <CalendarDays className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-900 dark:text-white tracking-tight">
                  {monthName} {viewYear}
                </h4>
                <p className="text-[10px] text-gray-400 font-medium">
                  {lang === 'ml' ? 'ഇന്ത്യൻ സ്റ്റാൻഡേർഡ് കലണ്ടർ' : 'Indian Standard Time (IST)'}
                </p>
              </div>
            </div>

            {/* Steppers & Today */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleJumpToToday}
                title="Jump to Today"
                className="px-2 py-1 rounded-lg text-[10px] font-extrabold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-100 transition-colors"
              >
                {t('jumpToToday', 'Today')}
              </button>

              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 pt-3 pb-1 text-center">
            {weekdays.map((wd, i) => (
              <span
                key={wd}
                className={`text-[10px] font-extrabold tracking-wider ${
                  i === 0 ? 'text-rose-500' : i === 5 ? 'text-emerald-500' : 'text-gray-400'
                }`}
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarCells.map((cell) => {
              const isToday = cell.dateStr === todayIST;
              const isSelected = cell.dateStr === selectedDate;
              const isCurrentMonth = cell.isCurrentMonth;

              return (
                <button
                  key={cell.dateStr}
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setSelectedDate(cell.dateStr);
                  }}
                  className={`relative h-8 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                    !isCurrentMonth
                      ? 'text-gray-300 dark:text-white/20'
                      : isToday
                      ? 'bg-emerald-600 text-white font-extrabold shadow-sm'
                      : isSelected
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-500/40'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5'
                  }`}
                >
                  <span>{cell.dayNumber}</span>
                  {isToday && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-white" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer Info: Hijri Date & Today Readout */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/10 flex flex-col gap-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-gray-500 dark:text-gray-400 font-medium">
                {dayFull}, {longDate}
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                IST
              </span>
            </div>

            {preferences?.showHijriDate !== false && hijriString && (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-700/80 dark:text-emerald-300/80 font-medium">
                <Sparkles className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                <span>{hijriString}</span>
                {hijriData?.isSacredMonth && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                    {lang === 'ml' ? 'ഹറാം മാസം' : 'Sacred'}
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
