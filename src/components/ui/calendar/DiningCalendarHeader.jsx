import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Utensils, SlidersHorizontal, ChevronDown } from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
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
  onPrevMonth,
  onNextMonth,
  onJumpToToday,
  onSelectMonthYear,
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

  return (
    <div
      className={`p-3 sm:p-3.5 rounded-3xl bg-white/90 dark:bg-[#0c1412]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-2xl transition-all space-y-3 ${className}`}
    >
      {/* ================= TOP ROW: SINGLE CLEAN UNIFIED ROW ================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 sm:gap-3 flex-nowrap">
        
        {/* Left: Fluid Month Navigation Stepper (Stable Width) */}
        <div className="flex-shrink-0 w-full sm:w-auto flex justify-center sm:justify-start">
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
        </div>

        {/* Center: Meal Segmented Selector (Both Meals | Breakfast | Lunch) */}
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
                ? 'bg-amber-600 text-white shadow-xs'
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
            className={`w-full sm:w-auto px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 select-none cursor-pointer shadow-xs ${
              isExpanded || isSelectMode
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-600/25 ring-2 ring-emerald-500/30'
                : 'bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-white/10'
            }`}
            title="Expand tools, schedule patterns, and views"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('toolsAndActions', 'Tools & Actions')}</span>
            {exceptionsCount > 0 && (
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            )}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isExpanded ? 'rotate-180 text-white' : 'text-gray-400'
              }`}
            />
          </button>
        </div>
      </div>

      {/* ================= INLINE COLLAPSIBLE TOOLS DRAWER ================= */}
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
              activeView={activeView}
              setActiveView={setActiveView}
              onClose={() => setIsExpanded(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
