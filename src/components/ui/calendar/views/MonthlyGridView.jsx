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
import { getMealSupplyStatus } from '../../../../utils/boardServiceSchedule';
import {
  calculateEffectiveDateMeals,
  formatFriendlyDate,
  getDayOfWeekShort,
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
  boardServiceSchedule = {},
  getDateLockStatus,
  onToggleMealDate, // (dateStr, mealType) => void
  onToggleWeekdayMeal, // (dayKey, mealType) => void
  onToggleMonthWeekday, // (dayKey, mealType, targetState) => void
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

    return (
      <div
        key={mealType}
        className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 p-3.5 sm:p-5 shadow-sm backdrop-blur-xl space-y-2 sm:space-y-2.5"
      >
        {/* Meal Calendar Title & Bulk Actions */}
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="flex items-center gap-2">
            {isLunch ? (
              <Utensils className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Coffee className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            )}
            <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
              {mealTitle}
            </h4>
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
              {isLunch ? stats?.activeLunchDays : stats?.activeBreakfastDays} Active
            </span>
          </div>

          {editable && !isSelectMode && onTurnAllMeal && (
            <div className="flex items-center gap-1 text-[10px] font-bold">
              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  onTurnAllMeal(mealType, true);
                }}
                className="px-2 py-0.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:underline transition-colors cursor-pointer"
              >
                All ON
              </button>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  onTurnAllMeal(mealType, false);
                }}
                className="px-2 py-0.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:underline transition-colors cursor-pointer"
              >
                All OFF
              </button>
            </div>
          )}
        </div>

        {/* 7-DAY HEADER TOKEN TILES (Sun-Sat) - Column Headers that toggle this month's days */}
        <div
          role="row"
          aria-label={`${MONTH_NAMES[currentMonth]} ${currentYear} ${mealTitle} Day Headers`}
          className="grid grid-cols-7 gap-1 sm:gap-1.5"
        >
          {dayHeaders.map(({ key, label }) => {
            // Month-Specific Status Calculation:
            // Check all valid upcoming dates for this day of week in the current month only
            const applicableDays = calendarDays.filter(
              (d) => !d.isBlank && !d.isPast && !d.isBeyondMax && d.dayOfWeek === key
            );

            let onCount = 0;
            let offCount = 0;

            if (applicableDays.length > 0) {
              applicableDays.forEach((d) => {
                const eff = calculateEffectiveDateMeals(student, d.dateStr);
                const isMealOn = Boolean(isLunch ? eff.lunch : eff.breakfast);
                if (isMealOn) onCount++;
                else offCount++;
              });
            } else {
              // If all days this month are past or none applicable, evaluate non-blank days in this month
              const allMonthDays = calendarDays.filter((d) => !d.isBlank && d.dayOfWeek === key);
              allMonthDays.forEach((d) => {
                const eff = calculateEffectiveDateMeals(student, d.dateStr);
                const isMealOn = Boolean(isLunch ? eff.lunch : eff.breakfast);
                if (isMealOn) onCount++;
                else offCount++;
              });
            }

            const hasApplicable = applicableDays.length > 0;
            const totalChecked = hasApplicable
              ? applicableDays.length
              : calendarDays.filter((d) => !d.isBlank && d.dayOfWeek === key).length;

            const isAllOn = totalChecked > 0 && onCount === totalChecked;
            const isAllOff = totalChecked > 0 && offCount === totalChecked;
            const isMixed = onCount > 0 && offCount > 0;

            // Tri-state transition for this month:
            // If all ON -> targetState is false (turn all upcoming OFF in this month)
            // If all OFF or mixed -> targetState is true (turn all upcoming ON in this month)
            const targetState = isAllOn ? false : true;

            const monthName = MONTH_NAMES[currentMonth];
            const titleText = !hasApplicable
              ? `${label}: Past month records in ${monthName}`
              : isAllOn
              ? `${label}: All upcoming ${label}s in ${monthName} are ON (Click to turn all OFF for ${monthName})`
              : isAllOff
              ? `${label}: All upcoming ${label}s in ${monthName} are OFF (Click to turn all ON for ${monthName})`
              : `${label}: Mixed (${onCount} ON, ${offCount} OFF in ${monthName}) — Click to turn all ON for ${monthName}`;

            let bgClass = '';
            if (!hasApplicable) {
              bgClass = 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 border-gray-200/50 dark:border-white/5 opacity-60 cursor-not-allowed';
            } else if (isAllOn) {
              bgClass = 'bg-gradient-to-br from-emerald-500 to-green-600 text-white border-emerald-400/40 hover:shadow-glow-emerald';
            } else if (isAllOff) {
              bgClass = 'bg-gradient-to-br from-rose-500 to-red-600 text-white border-rose-400/40 hover:shadow-glow-red';
            } else {
              // Mixed state
              bgClass = 'bg-gradient-to-br from-slate-600 to-zinc-700 text-white border-dashed border-slate-400/60 shadow-xs hover:border-slate-300';
            }

            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  if (!editable || !hasApplicable) return;
                  if (onToggleMonthWeekday) {
                    onToggleMonthWeekday(key, mealType, targetState);
                  } else if (onToggleWeekdayMeal) {
                    onToggleWeekdayMeal(key, mealType, targetState);
                  }
                }}
                disabled={!editable || !hasApplicable}
                title={titleText}
                className={`py-2 px-0.5 rounded-xl font-mono text-[10px] sm:text-[11px] font-black flex flex-col items-center justify-center gap-0.5 transition-all shadow-xs border select-none ${
                  hasApplicable && editable ? 'cursor-pointer active:scale-95' : 'cursor-default'
                } ${bgClass}`}
              >
                <span>{label}</span>
                {isAllOn ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/95 shadow-xs" />
                ) : isAllOff ? (
                  <span className="w-1.5 h-1.5 rounded-full border border-white/80" />
                ) : isMixed ? (
                  <span className="w-2.5 h-0.5 rounded-full bg-white/90 shadow-xs" title="Mixed month dates" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-transparent" />
                )}
              </button>
            );
          })}
        </div>

        {/* 7-COLUMN CALENDAR DATE TILES */}
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
                const bfSupply = getMealSupplyStatus(boardServiceSchedule, day.dateStr, 'breakfast');
                const lunchSupply = getMealSupplyStatus(boardServiceSchedule, day.dateStr, 'lunch');
                const isBfSupplyOff = !bfSupply.isSupplying;
                const isLunchSupplyOff = !lunchSupply.isSupplying;
                const lockInfo = getDateLockStatus(day.dateStr, { isAdmin });
                const isLocked = !isAdmin && lockInfo.isLocked;
                const isSelected = selectedDates.includes(day.dateStr);

                return (
                  <div
                    key={day.dateStr}
                    className="relative"
                    {...(day.isTomorrow
                      ? { 'data-tour': 'calendar-single-day-cell' }
                      : (!day.isLocked && !day.isPast ? { 'data-tour': 'calendar-grid-cell' } : {}))}
                  >
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
                      isBfSupplyOff={isBfSupplyOff}
                      isLunchSupplyOff={isLunchSupplyOff}
                      showDualPills={mealType === 'both'}
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
                            ? 'bg-emerald-600 ring-2 ring-white dark:ring-black scale-105'
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
