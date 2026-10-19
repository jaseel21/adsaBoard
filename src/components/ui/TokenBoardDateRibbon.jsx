import React from 'react';
import { CalendarDays, Clock, ShieldCheck, Calendar, ChevronRight } from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';
import { formatFriendlyDate, addDaysToDate } from '../../utils/studentExceptionService';

/**
 * Tactical Date & Schedule Ribbon
 * Enables mess committees & students to view and toggle between Today, Tomorrow,
 * or inspect custom future dates in the academic calendar.
 */
export default function TokenBoardDateRibbon({
  controller,
  showCalendarPicker = true,
  className = '',
}) {
  const { feedback } = useFeedback();
  const { t } = useLanguage();

  const {
    dateMode,
    targetDateIST,
    todayIST,
    setDateToToday,
    setDateToTomorrow,
    setDateToCustom,
    isPostEveningCutoff,
  } = controller;

  const isToday = targetDateIST === todayIST;
  const isTomorrow = targetDateIST === addDaysToDate(todayIST, 1);

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-2.5 p-3 rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 shadow-xs backdrop-blur-md w-full max-w-full min-w-0 overflow-hidden ${className}`}
    >
      {/* Left: Active Target Date Badge */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
          <CalendarDays className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
              {formatFriendlyDate(targetDateIST)}
            </span>
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold shrink-0">
              {isToday ? t('todayIST', 'Today (IST)') : isTomorrow ? t('tomorrow', 'Tomorrow') : t('scheduledDate', 'Scheduled Date')}
            </span>
            {isPostEveningCutoff && (
              <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
                {t('autoAdvancedForTomorrow', "(Auto-advanced for tomorrow's prep)")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Date Switcher Pills & Optional Native Date Picker */}
      <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto justify-between sm:justify-end min-w-0">
        <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              setDateToToday();
            }}
            className={`px-3 py-1 rounded-lg transition-all ${
              isToday
                ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
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
            }}
            className={`px-3 py-1 rounded-lg transition-all ${
              isTomorrow
                ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('tomorrow', 'Tomorrow')}
          </button>
        </div>

        {/* Calendar Picker for Admin Master Board */}
        {showCalendarPicker && (
          <div className="relative inline-flex items-center min-w-0">
            <input
              type="date"
              value={targetDateIST}
              onChange={(e) => {
                feedback('tick');
                setDateToCustom(e.target.value);
              }}
              min={todayIST}
              className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200/70 dark:hover:bg-white/10 border border-gray-200/80 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 cursor-pointer max-w-[135px] sm:max-w-none"
              title={t('pickUpcomingDate', 'Pick any upcoming calendar date to inspect')}
            />
          </div>
        )}
      </div>
    </div>
  );
}
