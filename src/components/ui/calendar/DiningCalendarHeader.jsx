import React from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Sparkles } from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import MonthNavigationDeck from './MonthNavigationDeck';
import CalendarMetricsPill from './CalendarMetricsPill';
import CalendarActionDeck from './CalendarActionDeck';
import CalendarViewFilterHub from './CalendarViewFilterHub';

export default function DiningCalendarHeader({
  currentYear,
  currentMonth,
  todayIST,
  stats,
  student,
  editable = true,
  sortedExceptionDates = [],
  activeView,
  setActiveView,
  mealFilter,
  setMealFilter,
  onPrevMonth,
  onNextMonth,
  onJumpToToday,
  onSelectMonthYear,
  onOpenRangeLeave,
  onTurnWeekendOff,
  onOpenTemplates,
  onClearExceptions,
  className = '',
}) {
  const { t } = useLanguage();

  const exceptionsCount = sortedExceptionDates.length;
  const hasTemplates = (student?.templates?.length > 0) || (stats.scheduledCount > 0);

  return (
    <div
      className={`relative p-3.5 sm:p-4 rounded-3xl bg-white/90 dark:bg-[#0c1412]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-2xl space-y-3 transition-all ${className}`}
    >
      {/* ================= ROW 1: BRAND IDENTITY + MONTH NAV DECK ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        
        {/* Left: Brand Icon + Title + Live Metrics Pill */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-xs border border-emerald-500/20">
            <CalendarDays className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-black text-gray-900 dark:text-white tracking-tight leading-none">
                {t('monthlyDiningManifest', 'Monthly Dining Calendar')}
              </h2>
              
              {/* Dynamic Interactive Metrics Chip */}
              <CalendarMetricsPill
                stats={stats}
                monthOverridesCount={stats.monthOverridesCount}
              />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium hidden xs:block mt-0.5">
              Live student dining schedule & token management
            </p>
          </div>
        </div>

        {/* Right: Fluid Month Stepper & Fast Selector Deck */}
        <div className="self-start sm:self-auto flex-shrink-0">
          <MonthNavigationDeck
            currentYear={currentYear}
            currentMonth={currentMonth}
            todayIST={todayIST}
            onPrevMonth={onPrevMonth}
            onNextMonth={onNextMonth}
            onJumpToToday={onJumpToToday}
            onSelectMonthYear={onSelectMonthYear}
            isFullyPastMonth={stats.isFullyPastMonth}
          />
        </div>
      </div>

      {/* Subtle Divider */}
      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-gray-200/60 dark:via-white/5 to-transparent" />

      {/* ================= ROW 2: ACTION CONTROLS & VIEW/FILTER HUB ================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        {/* Left / Bottom-Left: Quick Scheduling Actions */}
        <CalendarActionDeck
          editable={editable}
          isFullyPastMonth={stats.isFullyPastMonth}
          onOpenRangeLeave={onOpenRangeLeave}
          onTurnWeekendOff={onTurnWeekendOff}
          onOpenTemplates={onOpenTemplates}
          onClearExceptions={onClearExceptions}
          exceptionsCount={exceptionsCount}
          hasTemplates={hasTemplates}
        />

        {/* Right / Bottom-Right: Unified View Switch & Meal Focus Hub */}
        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
          <CalendarViewFilterHub
            activeView={activeView}
            setActiveView={setActiveView}
            mealFilter={mealFilter}
            setMealFilter={setMealFilter}
            showMealFilter={true}
          />
        </div>
      </div>
    </div>
  );
}
