import React, { useMemo } from 'react';
import {
  Utensils,
  Coffee,
  Check,
  X,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../../../store/LanguageContext';
import { useFeedback } from '../../../../utils/useFeedback';
import DateTokenButton from '../../DateTokenButton';
import {
  calculateEffectiveDateMeals,
  formatFriendlyDate,
} from '../../../../utils/studentExceptionService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthlyGridView({
  currentYear,
  currentMonth,
  calendarDays,
  student,
  stats,
  editable = true,
  isAdmin = false,
  mealFilter = 'both', // 'both' | 'breakfast' | 'lunch'
  todayIST,
  tomorrowIST,
  getDateLockStatus,
  onToggleMealDate, // (dateStr, mealType) => void
  onToggleWeekdayMeal, // (dayKey, mealType) => void
  onTurnAllMeal, // (mealType, bool) => void
  onHistoryClick,
  onLockedClick,
  // Multi-Select Mode props
  isSelectMode = false,
  selectedDates = [],
  onToggleDateSelect,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  // Day of week column headers
  const dayHeaders = useMemo(() => [
    { key: 'su', label: t('days.su', 'Sun') },
    { key: 'mo', label: t('days.mo', 'Mon') },
    { key: 'tu', label: t('days.tu', 'Tue') },
    { key: 'we', label: t('days.we', 'Wed') },
    { key: 'th', label: t('days.th', 'Thu') },
    { key: 'fr', label: t('days.fr', 'Fri') },
    { key: 'sa', label: t('days.sa', 'Sat') },
  ], [t]);

  /**
   * Render a dedicated, full-featured calendar for a single meal (breakfast or lunch)
   */
  const renderMealCalendar = (mealType) => {
    const isLunch = mealType === 'lunch';
    const mealTitle = isLunch
      ? (t('lunchCalendarTitle') || 'Lunch Calendar')
      : (t('breakfastCalendarTitle') || 'Breakfast Calendar');
    const activeCount = isLunch ? stats.activeLunchDays : stats.activeBreakfastDays;

    return (
      <div
        key={mealType}
        className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 p-3.5 sm:p-5 shadow-sm backdrop-blur-xl space-y-4 flex flex-col justify-between"
      >
        <div className="space-y-4">
          {/* Card Header: Meal Icon, Title, Live Active Count, Select All / Deselect All */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isLunch
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                }`}
              >
                {isLunch ? <Utensils className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
                    {mealTitle}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold border ${
                      isLunch
                        ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                    }`}
                  >
                    {activeCount} Active
                  </span>
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  {editable ? '1-tap date to toggle • Click day tile for weekday routine' : 'Locked view'}
                </p>
              </div>
            </div>

            {editable && !isSelectMode && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onTurnAllMeal && onTurnAllMeal(mealType, true)}
                  className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer"
                  title={`Turn ${isLunch ? 'Lunch' : 'Breakfast'} ON for all upcoming dates in month`}
                >
                  All ON
                </button>
                <span className="text-gray-300 dark:text-gray-600 text-xs">•</span>
                <button
                  type="button"
                  onClick={() => onTurnAllMeal && onTurnAllMeal(mealType, false)}
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline px-2 py-1 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                  title={`Turn ${isLunch ? 'Lunch' : 'Breakfast'} OFF for all upcoming dates in month`}
                >
                  All OFF
                </button>
              </div>
            )}
          </div>

          {/* 7-DAY HEADER TOKEN TILES (Sun-Sat) */}
          <div className="space-y-1">
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Weekday Routine
              </span>
              <span className="text-[10px] text-gray-400 dark:text-gray-500">
                Tap tile to toggle weekday
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {dayHeaders.map(({ key, label }) => {
                // Find all active/actionable dates in this month for this weekday
                const matchingDays = calendarDays.filter(
                  (d) => !d.isBlank && d.dayOfWeek === key && !d.isPast && !d.isBeyondMax
                );

                const onCount = matchingDays.filter((d) => {
                  const eff = calculateEffectiveDateMeals(student, d.dateStr);
                  return isLunch ? eff.lunch : eff.breakfast;
                }).length;
                const totalCount = matchingDays.length;

                const isAllOn = totalCount > 0 && onCount === totalCount;
                const isAllOff = totalCount > 0 && onCount === 0;

                // Tri-state transition:
                // If all ON -> targetState is false (turn all OFF)
                // If all OFF or mixed -> targetState is true (turn all ON)
                const targetState = isAllOn ? false : true;

                // Tooltip text
                const titleText = isAllOn
                  ? `${label}: All ${totalCount} dates in month are ON (Click to turn all OFF)`
                  : isAllOff
                  ? `${label}: All ${totalCount} dates in month are OFF (Click to turn all ON)`
                  : `${label}: Mixed (${onCount}/${totalCount} ON) — Click to turn all ON`;

                let bgClass = '';
                if (isAllOn) {
                  bgClass = 'bg-gradient-to-br from-emerald-500 to-green-600 text-white border-emerald-400/40 hover:shadow-glow-emerald';
                } else if (isAllOff) {
                  bgClass = 'bg-gradient-to-br from-rose-500 to-red-600 text-white border-rose-400/40 hover:shadow-glow-red';
                } else {
                  // Mixed / Neutral State: Sleek neutral slate gradient with dashed border
                  bgClass = 'bg-gradient-to-br from-slate-600 to-zinc-700 text-white border-dashed border-slate-400/60 shadow-xs hover:border-slate-300';
                }

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      if (!editable) return;
                      onToggleWeekdayMeal && onToggleWeekdayMeal(key, mealType, targetState);
                    }}
                    disabled={!editable}
                    title={titleText}
                    className={`py-2 px-0.5 rounded-xl font-mono text-[10px] sm:text-[11px] font-black flex flex-col items-center justify-center gap-0.5 transition-all shadow-xs border cursor-pointer select-none active:scale-95 ${bgClass}`}
                  >
                    <span>{label}</span>
                    {isAllOn ? (
                      <span className="w-1.5 h-1.5 rounded-full bg-white/95 shadow-xs" />
                    ) : isAllOff ? (
                      <span className="w-1.5 h-1.5 rounded-full border border-white/80" />
                    ) : (
                      <span className="w-2.5 h-0.5 rounded-full bg-white/90 shadow-xs" title={`${onCount}/${totalCount} ON`} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7-COLUMN CALENDAR DATE TILES */}
          <div className="space-y-1">
            <div className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500 px-0.5 pt-1">
              {MONTH_NAMES[currentMonth]} Dates
            </div>

            <div
              role="grid"
              aria-label={`${MONTH_NAMES[currentMonth]} ${currentYear} ${mealTitle}`}
              className="grid grid-cols-7 gap-1 sm:gap-1.5"
            >
              {calendarDays.map((day) => {
                if (day.isBlank) {
                  return (
                    <div
                      key={day.key}
                      role="gridcell"
                      aria-hidden="true"
                      className="w-full aspect-square rounded-xl bg-gray-50/20 dark:bg-white/[0.01] pointer-events-none"
                    />
                  );
                }

                const effective = calculateEffectiveDateMeals(student, day.dateStr);
                const lockInfo = getDateLockStatus(day.dateStr, { isAdmin });
                const isLocked = !isAdmin && lockInfo.isLocked;
                const isSelected = selectedDates.includes(day.dateStr);

                return (
                  <div key={day.dateStr} className="relative">
                    <DateTokenButton
                      dateStr={day.dateStr}
                      dayNumber={day.dayNumber}
                      dayOfWeek={day.dayOfWeek}
                      isToday={day.isToday}
                      isTomorrow={day.isTomorrow}
                      isPast={day.isPast}
                      isBeyondMax={day.isBeyondMax}
                      isLocked={isLocked}
                      isAdmin={isAdmin}
                      breakfast={effective.breakfast}
                      lunch={effective.lunch}
                      activeMeal={mealType}
                      hasException={effective.hasException}
                      onClick={() => {
                        if (isSelectMode) {
                          onToggleDateSelect && onToggleDateSelect(day.dateStr);
                        } else {
                          onToggleMealDate && onToggleMealDate(day.dateStr, mealType);
                        }
                      }}
                      onLockedClick={onLockedClick}
                      onHistoryClick={onHistoryClick}
                    />

                    {/* Multi-Select Checkbox Overlay */}
                    {isSelectMode && !day.isPast && !day.isBeyondMax && (
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleDateSelect && onToggleDateSelect(day.dateStr);
                        }}
                        className={`absolute -top-1 -right-1 w-5 h-5 rounded-md flex items-center justify-center text-white text-[10px] font-bold shadow-md cursor-pointer transition-all z-10 ${
                          isSelected
                            ? 'bg-indigo-600 ring-2 ring-white dark:ring-black scale-105'
                            : 'bg-black/40 border border-white/60 hover:bg-black/60'
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div>
      {mealFilter === 'both' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {renderMealCalendar('breakfast')}
          {renderMealCalendar('lunch')}
        </div>
      ) : mealFilter === 'breakfast' ? (
        <div className="max-w-2xl mx-auto">
          {renderMealCalendar('breakfast')}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {renderMealCalendar('lunch')}
        </div>
      )}
    </div>
  );
}
