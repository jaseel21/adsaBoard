import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee,
  Utensils,
  SlidersHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CalendarDays,
  Clock,
  LayoutGrid,
} from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { addDaysToDate, formatFriendlyDate } from '../../../utils/studentExceptionService';
import MonthNavigationDeck from './MonthNavigationDeck';
import CalendarActionDeck from './CalendarActionDeck';

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
  mealFilter = 'both',
  setMealFilter,
  // Month navigation
  onPrevMonth,
  onNextMonth,
  onJumpToToday,
  onSelectMonthYear,
  // Week navigation
  weekAnchorDate,
  onPrevWeek,
  onNextWeek,
  onJumpToCurrentWeek,
  // Day navigation
  dayAnchorDate,
  onPrevDay,
  onNextDay,
  onJumpToTodayDay,
  // Year navigation
  onPrevYear,
  onNextYear,
  onJumpToCurrentYear,
  // Actions
  onOpenSchedulePattern,
  onOpenRangeLeave,
  onTurnWeekendOff,
  onOpenTemplates,
  onClearExceptions,
  isSelectMode = false,
  onToggleSelectMode,
  onOpenHistory,
  className = '',
}) {
  const { t } = useLanguage();
  const [isExpanded, setIsExpanded] = useState(false);

  const exceptionsCount = sortedExceptionDates.length;
  const hasTemplates = (student?.templates?.length > 0) || (stats?.scheduledCount > 0);

  // Week range label calculation
  const weekRangeLabel = useMemo(() => {
    if (!weekAnchorDate) return '';
    const [y, m, d] = weekAnchorDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    const dayOfWeek = dateObj.getUTCDay();
    const startStr = addDaysToDate(weekAnchorDate, -dayOfWeek);
    const endStr = addDaysToDate(weekAnchorDate, 6 - dayOfWeek);
    return `${formatFriendlyDate(startStr, false)} – ${formatFriendlyDate(endStr, false)}`;
  }, [weekAnchorDate]);

  // Is current week viewed?
  const isViewingCurrentWeek = useMemo(() => {
    if (!weekAnchorDate || !todayIST) return false;
    const [y, m, d] = weekAnchorDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    const dayOfWeek = dateObj.getUTCDay();
    const startStr = addDaysToDate(weekAnchorDate, -dayOfWeek);
    const endStr = addDaysToDate(weekAnchorDate, 6 - dayOfWeek);
    return todayIST >= startStr && todayIST <= endStr;
  }, [weekAnchorDate, todayIST]);

  // Day formatted label
  const dayFormattedLabel = useMemo(() => {
    if (!dayAnchorDate) return '';
    return formatFriendlyDate(dayAnchorDate, true);
  }, [dayAnchorDate]);

  const isViewingTodayDay = dayAnchorDate === todayIST;

  const [todayY] = (todayIST || '').split('-').map(Number);
  const isViewingCurrentYear = currentYear === todayY;

  // Render the appropriate stepper based on activeView
  const renderDynamicStepper = () => {
    // 1. MONTH VIEW (or legacy 'grid')
    if (activeView === 'month' || activeView === 'grid') {
      return (
        <MonthNavigationDeck
          currentYear={currentYear}
          currentMonth={currentMonth}
          todayIST={todayIST}
          onPrevMonth={onPrevMonth}
          onNextMonth={onNextMonth}
          onJumpToToday={onJumpToToday}
          onSelectMonthYear={onSelectMonthYear}
          isFullyPastMonth={stats?.isFullyPastMonth}
        />
      );
    }

    // 2. WEEK VIEW
    if (activeView === 'week') {
      return (
        <div className="relative inline-flex items-center gap-1 p-1 rounded-2xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 shadow-xs backdrop-blur-md">
          <button
            type="button"
            onClick={onPrevWeek}
            className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Previous Week"
            aria-label="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="min-w-[140px] sm:min-w-[170px] px-2.5 py-1 font-black text-xs sm:text-sm tracking-tight text-gray-900 dark:text-white text-center font-mono truncate">
            {weekRangeLabel}
          </span>

          <button
            type="button"
            onClick={onNextWeek}
            className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Next Week"
            aria-label="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

          <button
            type="button"
            onClick={onJumpToCurrentWeek}
            className={`px-2.5 py-1 text-xs font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 min-w-[62px] select-none cursor-pointer ${
              !isViewingCurrentWeek
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shadow-emerald-600/30'
                : 'bg-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/10'
            }`}
            title={isViewingCurrentWeek ? 'Currently viewing this week' : 'Return to Current Week'}
          >
            <span>{t('thisWeek', 'This Week')}</span>
          </button>
        </div>
      );
    }

    // 3. DAY VIEW
    if (activeView === 'day') {
      return (
        <div className="relative inline-flex items-center gap-1 p-1 rounded-2xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 shadow-xs backdrop-blur-md">
          <button
            type="button"
            onClick={onPrevDay}
            className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Previous Day"
            aria-label="Previous Day"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="min-w-[140px] sm:min-w-[170px] px-2.5 py-1 font-black text-xs sm:text-sm tracking-tight text-gray-900 dark:text-white text-center font-mono truncate">
            {dayFormattedLabel}
          </span>

          <button
            type="button"
            onClick={onNextDay}
            className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Next Day"
            aria-label="Next Day"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

          <button
            type="button"
            onClick={onJumpToTodayDay}
            className={`px-2.5 py-1 text-xs font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 min-w-[62px] select-none cursor-pointer ${
              !isViewingTodayDay
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shadow-emerald-600/30'
                : 'bg-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/10'
            }`}
            title={isViewingTodayDay ? 'Currently viewing today' : 'Return to Today'}
          >
            <span>{t('todayBtn', 'Today')}</span>
          </button>
        </div>
      );
    }

    // 4. YEAR VIEW
    if (activeView === 'year') {
      return (
        <div className="relative inline-flex items-center gap-1 p-1 rounded-2xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 shadow-xs backdrop-blur-md">
          <button
            type="button"
            onClick={onPrevYear}
            className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Previous Year"
            aria-label="Previous Year"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="min-w-[90px] sm:min-w-[120px] px-2.5 py-1 font-black text-xs sm:text-sm tracking-tight text-gray-900 dark:text-white text-center font-mono">
            {currentYear}
          </span>

          <button
            type="button"
            onClick={onNextYear}
            className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95 cursor-pointer"
            title="Next Year"
            aria-label="Next Year"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

          <button
            type="button"
            onClick={onJumpToCurrentYear}
            className={`px-2.5 py-1 text-xs font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 min-w-[62px] select-none cursor-pointer ${
              !isViewingCurrentYear
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shadow-emerald-600/30'
                : 'bg-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/10'
            }`}
            title={isViewingCurrentYear ? 'Currently viewing current year' : 'Return to Current Year'}
          >
            <span>{t('thisYear', 'This Year')}</span>
          </button>
        </div>
      );
    }

    return null;
  };

  return (
    <div
      className={`p-3 sm:p-3.5 rounded-3xl bg-white/90 dark:bg-[#0c1412]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-2xl transition-all space-y-3 ${className}`}
    >
      {/* ── ROW 1: DYNAMIC STEPPER (Left) & VIEW PERSPECTIVE SWITCHER (Right) ── */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left: Dynamic Navigation Stepper (adapts to month, week, day, year) */}
        <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:justify-start">
          {renderDynamicStepper()}
        </div>

        {/* Right: View Perspective Switcher (Day • Week • Month • Year) */}
        {setActiveView && (
          <div className="flex-shrink-0 w-full md:w-auto flex justify-center md:justify-end">
            <div className="inline-flex p-0.5 rounded-xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 shadow-xs backdrop-blur-md">
              {[
                { key: 'day', label: 'Day', icon: Clock },
                { key: 'week', label: 'Week', icon: CalendarDays },
                { key: 'month', label: 'Month', icon: LayoutGrid },
                { key: 'year', label: 'Year', icon: CalendarIcon },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveView(key)}
                  className={`relative px-3 py-1.5 text-xs font-bold rounded-lg transition-colors select-none cursor-pointer flex items-center gap-1.5 ${
                    activeView === key
                      ? 'text-white'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  {activeView === key && (
                    <motion.div
                      layoutId="diningActiveViewPill"
                      className="absolute inset-0 rounded-lg bg-emerald-600 shadow-xs"
                      transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-1.5">
                    <Icon className="w-3.5 h-3.5" />
                    <span>{label}</span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── ROW 2: MEAL FILTER (Left) & TOOLS TRIGGER (Right) ── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-1 border-t border-gray-100/80 dark:border-white/5">
        {/* Left: Meal Segmented Selector */}
        <div className="inline-flex p-0.5 rounded-xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 shadow-xs backdrop-blur-md flex-shrink-0">
          <button
            type="button"
            onClick={() => setMealFilter && setMealFilter('both')}
            className={`px-3 py-1 text-xs font-black rounded-lg transition-colors select-none cursor-pointer ${
              mealFilter === 'both'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            Both Meals
          </button>

          <button
            type="button"
            onClick={() => setMealFilter && setMealFilter('breakfast')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors select-none flex items-center gap-1 cursor-pointer ${
              mealFilter === 'breakfast'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Coffee className="w-3 h-3" />
            <span>Breakfast</span>
          </button>

          <button
            type="button"
            onClick={() => setMealFilter && setMealFilter('lunch')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors select-none flex items-center gap-1 cursor-pointer ${
              mealFilter === 'lunch'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <Utensils className="w-3 h-3" />
            <span>Lunch</span>
          </button>
        </div>

        {/* Right: Tools & Actions Expand/Collapse Trigger */}
        <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-end">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            aria-expanded={isExpanded}
            className={`w-full sm:w-auto px-3.5 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 select-none cursor-pointer shadow-xs ${
              isExpanded || isSelectMode
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/25 ring-2 ring-emerald-500/30'
                : 'bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-white/10'
            }`}
            title="Expand tools, schedule patterns, and batch actions"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('toolsAndActions', 'Tools & Actions')}</span>
            {exceptionsCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isExpanded ? 'rotate-180 text-white' : 'text-gray-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── ROW 3: INLINE COLLAPSIBLE TOOLS DRAWER ── */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden pt-2 border-t border-gray-100 dark:border-white/5"
          >
            <CalendarActionDeck
              editable={editable}
              isFullyPastMonth={stats?.isFullyPastMonth}
              onOpenSchedulePattern={onOpenSchedulePattern}
              onOpenRangeLeave={onOpenRangeLeave}
              onTurnWeekendOff={onTurnWeekendOff}
              onOpenTemplates={onOpenTemplates}
              onClearExceptions={onClearExceptions}
              exceptionsCount={exceptionsCount}
              hasTemplates={hasTemplates}
              isSelectMode={isSelectMode}
              onToggleSelectMode={onToggleSelectMode}
              onClose={() => setIsExpanded(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
