import React, { useState, useRef } from 'react';
import {
  CalendarDays,
  Calendar,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  History,
  Clock,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';
import { formatFriendlyDate, addDaysToDate } from '../../utils/studentExceptionService';
import TokenBoardCalendarPopover from './TokenBoardCalendarPopover';

/**
 * Tactical Date & Schedule Ribbon
 *
 * Provides a unified, ultra-premium date control center for Public Home and Master Token Board:
 * - Forward & backward day-by-day stepping (◀ Prev Day, Next Day ▶)
 * - Dedicated Today and Tomorrow preset pills
 * - Strict preservation of web app's 2:00 PM cutoff automation logic
 * - Full interactive calendar popover (without historical min-date blocks)
 * - Quick "Auto" schedule restoration
 */
export default function TokenBoardDateRibbon({
  controller,
  showCalendarPicker = true,
  onSelectDate = null,
  className = '',
  children = null,
}) {
  const { feedback } = useFeedback();
  const { t } = useLanguage();
  const calendarButtonRef = useRef(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const {
    dateMode,
    targetDateIST,
    todayIST,
    setDateToToday,
    setDateToTomorrow,
    setDateToCustom,
    setDateToAuto,
    stepDateBackward,
    stepDateForward,
    isPostEveningCutoff,
    relativeDateMeta,
  } = controller;

  const tomorrowIST = addDaysToDate(todayIST, 1);
  const yesterdayIST = addDaysToDate(todayIST, -1);

  const isToday = targetDateIST === todayIST;
  const isTomorrow = targetDateIST === tomorrowIST;
  const isYesterday = targetDateIST === yesterdayIST;
  const isPast = targetDateIST < todayIST;
  const isFuture = targetDateIST > tomorrowIST;

  // Wrapped custom setter to support optional onSelectDate callback
  const handleCustomDateSelect = (dateStr) => {
    setDateToCustom(dateStr);
    if (onSelectDate) onSelectDate(dateStr);
  };

  const enhancedController = {
    ...controller,
    setDateToCustom: handleCustomDateSelect,
    setDateToToday: () => {
      setDateToToday();
      if (onSelectDate) onSelectDate(todayIST);
    },
    setDateToTomorrow: () => {
      setDateToTomorrow();
      if (onSelectDate) onSelectDate(tomorrowIST);
    },
    setDateToAuto: () => {
      setDateToAuto();
      if (onSelectDate) onSelectDate(null);
    },
  };

  return (
    <div
      className={`relative flex flex-wrap items-center justify-between gap-2.5 p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/80 border border-gray-200/80 dark:border-white/10 shadow-xs backdrop-blur-xl w-full max-w-full min-w-0 ${className}`}
    >
      {/* ================= LEFT: ACTIVE TARGET DATE TELEMETRY BADGE ================= */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div
          className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 transition-colors ${
            isPast
              ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400'
              : isTomorrow
              ? 'bg-teal-500/15 text-teal-600 dark:text-teal-400'
              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          }`}
        >
          {isPast ? (
            <History className="w-4 h-4" />
          ) : (
            <CalendarDays className="w-4 h-4" />
          )}
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-black text-gray-900 dark:text-white tracking-tight">
              {formatFriendlyDate(targetDateIST)}
            </span>

            {/* Dynamic Status Pill */}
            {isToday ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('todayIST', 'Today (IST)')}
              </span>
            ) : isTomorrow ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-700 dark:text-teal-300 text-[10px] font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                {t('tomorrow', 'Tomorrow')}
              </span>
            ) : isYesterday ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 text-[10px] font-bold shrink-0">
                <History className="w-2.5 h-2.5" />
                {t('yesterday', 'Yesterday')}
              </span>
            ) : isPast ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-700 dark:text-purple-300 text-[10px] font-bold shrink-0">
                <History className="w-2.5 h-2.5" />
                {t('pastRecord', 'Past Record')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/15 text-blue-700 dark:text-blue-300 text-[10px] font-bold shrink-0">
                <Clock className="w-2.5 h-2.5" />
                {t('scheduledDate', 'Scheduled Date')}
              </span>
            )}

            {/* Relative Distance / Auto-shift contextual notes */}
            {isPostEveningCutoff && isTomorrow && dateMode === 'auto' && (
              <span className="text-[10px] text-gray-400 font-medium hidden md:inline">
                {t('autoAdvancedForTomorrow', "(Auto-advanced for tomorrow's prep)")}
              </span>
            )}

            {relativeDateMeta?.relativeLabel && !isToday && !isTomorrow && (
              <span className="text-[10px] text-gray-400 font-semibold hidden sm:inline">
                ({relativeDateMeta.relativeLabel})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ================= RIGHT: DATE STEPPERS, PRESET PILLS & CALENDAR TRIGGER ================= */}
      <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-between sm:justify-end min-w-0">
        
        {/* Step Backward Button (◀ Prev Day) */}
        <button
          type="button"
          onClick={() => {
            feedback('tick');
            stepDateBackward();
            if (onSelectDate) onSelectDate(addDaysToDate(targetDateIST, -1));
          }}
          className="p-1.5 sm:p-2 rounded-xl bg-gray-100 hover:bg-gray-200/80 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200/80 dark:border-white/10 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all cursor-pointer shrink-0"
          title={`${t('prevDay', 'Previous Day')} (${addDaysToDate(targetDateIST, -1)})`}
          aria-label={t('prevDay', 'Previous Day')}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Complete Calendar Popover Trigger Button (Placed Between Arrows) */}
        {showCalendarPicker && (
          <div className="relative inline-flex items-center min-w-0">
            <button
              ref={calendarButtonRef}
              type="button"
              onClick={() => {
                feedback('tick');
                setIsCalendarOpen((prev) => !prev);
              }}
              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                isCalendarOpen
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 hover:text-gray-900 dark:text-gray-200 dark:hover:text-white border-gray-200/80 dark:border-white/10'
              }`}
              title={t('pickAnyDate', 'Pick any calendar date (past or future) to inspect')}
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span className="font-mono text-xs">{targetDateIST}</span>
            </button>

            {/* Calendar Popover */}
            <TokenBoardCalendarPopover
              isOpen={isCalendarOpen}
              onClose={() => setIsCalendarOpen(false)}
              controller={enhancedController}
              anchorRef={calendarButtonRef}
            />
          </div>
        )}

        {/* Step Forward Button (Next Day ▶) */}
        <button
          type="button"
          onClick={() => {
            feedback('tick');
            stepDateForward();
            if (onSelectDate) onSelectDate(addDaysToDate(targetDateIST, 1));
          }}
          className="p-1.5 sm:p-2 rounded-xl bg-gray-100 hover:bg-gray-200/80 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200/80 dark:border-white/10 text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-all cursor-pointer shrink-0"
          title={`${t('nextDay', 'Next Day')} (${addDaysToDate(targetDateIST, 1)})`}
          aria-label={t('nextDay', 'Next Day')}
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Tactical Preset Pills: Today & Tomorrow */}
        <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              setDateToToday();
              if (onSelectDate) onSelectDate(todayIST);
            }}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              isToday
                ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-xs font-black'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('today', 'Today')}
          </button>

          <button
            type="button"
            onClick={() => {
              feedback('tick');
              setDateToTomorrow();
              if (onSelectDate) onSelectDate(tomorrowIST);
            }}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
              isTomorrow
                ? 'bg-white dark:bg-[#1a2521] text-teal-600 dark:text-teal-400 shadow-xs font-black'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('tomorrow', 'Tomorrow')}
          </button>
        </div>

        {/* Restore Automatic Cutoff Schedule (Visible when manual override is active) */}
        {dateMode !== 'auto' && (
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              setDateToAuto();
              if (onSelectDate) onSelectDate(null);
            }}
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200/80 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200/80 dark:border-white/10 text-[10px] font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer shrink-0"
            title={t('resetToAutoHint', 'Restore automatic cutoff schedule (Today/Tomorrow)')}
          >
            <RotateCcw className="w-3 h-3 text-emerald-500" />
            <span className="hidden sm:inline">{t('resetToAuto', 'Auto')}</span>
          </button>
        )}

        {children}
      </div>
    </div>
  );
}
