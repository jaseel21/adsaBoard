import React, { useMemo } from 'react';
import { Coffee, Utensils } from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import {
  calculateEffectiveDateMeals,
  getDayOfWeekShort,
} from '../../../utils/studentExceptionService';

export default function WeekdayRoutineDeck({
  student,
  mealFilter = 'both', // 'both' | 'breakfast' | 'lunch'
  todayIST,
  tomorrowIST,
  editable = true,
  isAdmin = false,
  getDateLockStatus,
  onToggleWeekdayMeal,
  className = '',
}) {
  const { t } = useLanguage();

  const dayHeaders = useMemo(() => [
    { key: 'su', label: t('days.su', 'Sun') },
    { key: 'mo', label: t('days.mo', 'Mon') },
    { key: 'tu', label: t('days.tu', 'Tue') },
    { key: 'we', label: t('days.we', 'Wed') },
    { key: 'th', label: t('days.th', 'Thu') },
    { key: 'fr', label: t('days.fr', 'Fri') },
    { key: 'sa', label: t('days.sa', 'Sat') },
  ], [t]);

  const renderRoutineCard = (mealType) => {
    const isLunch = mealType === 'lunch';
    const mealTitle = isLunch ? (t('navLunch') || 'Lunch') : (t('navBreakfast') || 'Breakfast');
    // const mealSubtitle = isLunch ? 'Noon meal rotation' : 'Morning meal rotation';
    const mealRoutine = student?.obj?.[mealType] || {};
    const activeCount = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'].filter(
      (k) => mealRoutine[k] !== undefined ? Boolean(mealRoutine[k]) : true
    ).length;

    return (
      <div
        key={mealType}
        className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 p-3.5 sm:p-5 shadow-sm backdrop-blur-xl space-y-3.5"
      >
        {/* Tier 1: Title for the Section */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              {isLunch ? <Utensils className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
                  {mealTitle}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-mono font-bold border bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20">
                  {activeCount} / 7 Days Active
                </span>
              </div>
              {/* <p className="text-[11px] text-gray-400 dark:text-gray-500">
                {mealSubtitle}
              </p> */}
            </div>
          </div>
        </div>

        {/* Tier 2: Weekday Routine 7-Day Keycap Strip */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between px-0.5">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {t('weeklyDiningRoutine', 'Weekday Routine')}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500">
              Tap tile to toggle weekday
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {dayHeaders.map(({ key, label }) => {
              const routineVal = isLunch
                ? (student?.obj?.lunch?.[key] !== undefined ? Boolean(student.obj.lunch[key]) : true)
                : (student?.obj?.breakfast?.[key] !== undefined ? Boolean(student.obj.breakfast[key]) : true);

              let hasUpcomingDivergence = false;
              const exceptions = student?.dateExceptions || {};

              // Scan all upcoming exceptions for this day of week
              for (const dateStr of Object.keys(exceptions)) {
                if (dateStr >= todayIST && getDayOfWeekShort(dateStr) === key) {
                  const exc = exceptions[dateStr];
                  const excVal = isLunch ? exc.lunch : exc.breakfast;
                  if (excVal !== undefined && Boolean(excVal) !== routineVal) {
                    hasUpcomingDivergence = true;
                    break;
                  }
                }
              }

              // Check if today or tomorrow falls on this day and is locked to a diverging state
              if (!hasUpcomingDivergence && !isAdmin) {
                const checkDates = [todayIST, tomorrowIST].filter(Boolean);
                for (const d of checkDates) {
                  if (getDayOfWeekShort(d) === key) {
                    const lockInfo = getDateLockStatus ? getDateLockStatus(d, { isAdmin }) : { isLocked: false };
                    if (lockInfo?.isLocked) {
                      const eff = calculateEffectiveDateMeals(student, d);
                      const effVal = isLunch ? eff.lunch : eff.breakfast;
                      if (effVal !== routineVal) {
                        hasUpcomingDivergence = true;
                        break;
                      }
                    }
                  }
                }
              }

              const isAllOn = !hasUpcomingDivergence && routineVal;
              const isAllOff = !hasUpcomingDivergence && !routineVal;

              const targetState = isAllOn ? false : true;

              const titleText = isAllOn
                ? `${label}: All upcoming ${label}s across calendar are ON (Click to turn all OFF)`
                : isAllOff
                ? `${label}: All upcoming ${label}s across calendar are OFF (Click to turn all ON)`
                : `${label}: Mixed (some upcoming dates ON/OFF) — Click to turn all ON`;

              let bgClass = '';
              if (isAllOn) {
                bgClass = 'bg-gradient-to-br from-emerald-500 to-green-600 text-white border-emerald-400/40 hover:shadow-glow-emerald';
              } else if (isAllOff) {
                bgClass = 'bg-gradient-to-br from-rose-500 to-red-600 text-white border-rose-400/40 hover:shadow-glow-red';
              } else {
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
                    <span className="w-2.5 h-0.5 rounded-full bg-white/90 shadow-xs" title="Mixed upcoming dates" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={className}>
      {mealFilter === 'both' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {renderRoutineCard('breakfast')}
          {renderRoutineCard('lunch')}
        </div>
      ) : mealFilter === 'breakfast' ? (
        <div className="max-w-2xl mx-auto">
          {renderRoutineCard('breakfast')}
        </div>
      ) : (
        <div className="max-w-2xl mx-auto">
          {renderRoutineCard('lunch')}
        </div>
      )}
    </div>
  );
}
