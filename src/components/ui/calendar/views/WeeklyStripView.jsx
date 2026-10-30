import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Coffee,
  Utensils,
  Check,
  X,
  Lock,
  Sparkles,
  Plane,
  Calendar,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../../../store/LanguageContext';
import { useFeedback } from '../../../../utils/useFeedback';
import {
  addDaysToDate,
  getDayOfWeekShort,
  formatFriendlyDate,
  calculateEffectiveDateMeals,
} from '../../../../utils/studentExceptionService';

export default function WeeklyStripView({
  student,
  todayIST,
  tomorrowIST,
  editable = true,
  isAdmin = false,
  getDateLockStatus,
  onSingleClickToggle,
  onSaveDayState, // (dateStr, { breakfast, lunch, label })
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  // Selected week anchor date (defaults to todayIST)
  const [weekAnchorDate, setWeekAnchorDate] = useState(todayIST);

  // Compute the 7 dates of the selected week (Sunday to Saturday)
  const weekDays = useMemo(() => {
    const [y, m, d] = weekAnchorDate.split('-').map(Number);
    const dateObj = new Date(Date.UTC(y, m - 1, d));
    const dayOfWeek = dateObj.getUTCDay(); // 0 = Sun .. 6 = Sat

    const days = [];
    for (let i = 0; i < 7; i++) {
      const diff = i - dayOfWeek;
      const dateStr = addDaysToDate(weekAnchorDate, diff);
      days.push(dateStr);
    }
    return days;
  }, [weekAnchorDate]);

  const handlePrevWeek = () => {
    feedback('tick');
    setWeekAnchorDate((prev) => addDaysToDate(prev, -7));
  };

  const handleNextWeek = () => {
    feedback('tick');
    setWeekAnchorDate((prev) => addDaysToDate(prev, 7));
  };

  const handleJumpToCurrentWeek = () => {
    feedback('tick');
    setWeekAnchorDate(todayIST);
  };

  const startFormatted = formatFriendlyDate(weekDays[0], false);
  const endFormatted = formatFriendlyDate(weekDays[6], false);

  const isCurrentWeek = weekDays.includes(todayIST);

  return (
    <div className="space-y-4">
      {/* Week Stepper Bar */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Weekly Meal Planner
            </span>
            <h4 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
              {startFormatted} — {endFormatted}
            </h4>
          </div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={handlePrevWeek}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            title="Previous Week"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {!isCurrentWeek && (
            <button
              type="button"
              onClick={handleJumpToCurrentWeek}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-xs active:scale-95 transition-all cursor-pointer"
            >
              This Week
            </button>
          )}

          <button
            type="button"
            onClick={handleNextWeek}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            title="Next Week"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7 Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((dateStr) => {
          const meals = calculateEffectiveDateMeals(student, dateStr);
          const lockInfo = getDateLockStatus(dateStr, { isAdmin });
          const isDateLocked = isAdmin ? false : lockInfo.isLocked;
          const isToday = dateStr === todayIST;
          const isTomorrow = dateStr === tomorrowIST;
          const isPast = dateStr < todayIST;
          const dayName = formatFriendlyDate(dateStr, true).split(',')[0];
          const dateLabel = formatFriendlyDate(dateStr, false);

          return (
            <div
              key={dateStr}
              className={`rounded-2xl p-3 sm:p-3.5 border flex flex-col justify-between space-y-3 transition-all ${
                isToday
                  ? 'bg-emerald-500/10 border-emerald-500/40 ring-1 ring-emerald-500/30'
                  : isTomorrow
                  ? 'bg-sky-500/10 border-sky-500/30'
                  : 'bg-white/90 dark:bg-[#0f1715]/90 border-gray-200/80 dark:border-white/10'
              }`}
            >
              {/* Day Card Header */}
              <div className="pb-2 border-b border-gray-100 dark:border-white/5 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-gray-900 dark:text-white">
                    {dayName}
                  </span>
                  {isToday ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500 text-white">
                      Today
                    </span>
                  ) : isTomorrow ? (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-sky-500 text-white">
                      Tomorrow
                    </span>
                  ) : isDateLocked ? (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-amber-500">
                      <Lock className="w-2.5 h-2.5" />
                      <span>Locked</span>
                    </span>
                  ) : null}
                </div>
                <div className="text-[11px] font-mono font-bold text-gray-500 dark:text-gray-400">
                  {dateLabel}
                </div>
              </div>

              {/* Breakfast Slot Card */}
              <div
                onClick={() => {
                  if (editable && !isDateLocked && !isPast) {
                    onSingleClickToggle(dateStr, 'breakfast');
                  }
                }}
                className={`p-2 rounded-xl border text-left select-none transition-all ${
                  isPast || isDateLocked ? 'cursor-default' : 'cursor-pointer hover:shadow-xs'
                } ${
                  meals.breakfast
                    ? 'bg-teal-50 dark:bg-teal-950/30 border-teal-300 dark:border-teal-500/30 text-teal-950 dark:text-teal-100'
                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/30 text-rose-900 dark:text-rose-200 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Coffee className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Breakfast</span>
                  </div>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                      meals.breakfast ? 'bg-teal-500 text-white' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {meals.breakfast ? 'ON' : 'OFF'}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-1">
                  7:30 – 8:30 AM
                </span>
              </div>

              {/* Lunch Slot Card */}
              <div
                onClick={() => {
                  if (editable && !isDateLocked && !isPast) {
                    onSingleClickToggle(dateStr, 'lunch');
                  }
                }}
                className={`p-2 rounded-xl border text-left select-none transition-all ${
                  isPast || isDateLocked ? 'cursor-default' : 'cursor-pointer hover:shadow-xs'
                } ${
                  meals.lunch
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/30 text-rose-900 dark:text-rose-200 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Utensils className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Lunch</span>
                  </div>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                      meals.lunch ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                    }`}
                  >
                    {meals.lunch ? 'ON' : 'OFF'}
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-1">
                  12:30 – 1:45 PM
                </span>
              </div>

              {/* Quick Actions (Whole Day Leave / ON) */}
              {editable && !isDateLocked && !isPast && (
                <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-1 text-[10px]">
                  {meals.breakfast || meals.lunch ? (
                    <button
                      type="button"
                      onClick={() => {
                        feedback('pop');
                        if (onSaveDayState) {
                          onSaveDayState(dateStr, { breakfast: false, lunch: false, label: 'Whole Day Leave' });
                        }
                      }}
                      className="w-full py-1 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-bold text-center transition-colors cursor-pointer"
                    >
                      Day Leave
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        feedback('pop');
                        if (onSaveDayState) {
                          onSaveDayState(dateStr, { breakfast: true, lunch: true, label: 'Full Day Active' });
                        }
                      }}
                      className="w-full py-1 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 font-bold text-center transition-colors cursor-pointer"
                    >
                      Day ON
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
