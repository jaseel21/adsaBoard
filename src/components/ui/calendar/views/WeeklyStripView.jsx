import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Coffee,
  Utensils,
  Check,
  X,
  Lock,
  Sparkles,
  Plane,
  Clock,
  ShieldCheck,
  PowerOff,
} from 'lucide-react';
import { useLanguage } from '../../../../store/LanguageContext';
import { useFeedback } from '../../../../utils/useFeedback';
import {
  addDaysToDate,
  getDayOfWeekShort,
  formatFriendlyDate,
  calculateEffectiveDateMeals,
} from '../../../../utils/studentExceptionService';
import { getMealSupplyStatus } from '../../../../utils/boardServiceSchedule';

export default function WeeklyStripView({
  student,
  todayIST,
  tomorrowIST,
  editable = true,
  isAdmin = false,
  boardServiceSchedule = {},
  getDateLockStatus,
  onSingleClickToggle,
  onSaveDayState, // (dateStr, { breakfast, lunch, label })
  onTurnAllWeek, // (weekDays, mealType, boolVal) => void
  weekAnchorDate: externalWeekAnchorDate,
  setWeekAnchorDate: externalSetWeekAnchorDate,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  // Selected week anchor date (defaults to todayIST or external)
  const [internalWeekAnchorDate, setInternalWeekAnchorDate] = useState(todayIST);
  const weekAnchorDate = externalWeekAnchorDate || internalWeekAnchorDate;
  const setWeekAnchorDate = externalSetWeekAnchorDate || setInternalWeekAnchorDate;

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

  return (
    <div className="space-y-4">
      {/* Week Bulk Actions Card (Date navigation handled by master dynamic switcher) */}
      {editable && onTurnAllWeek && (
        <div className="p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm flex items-center justify-between gap-3 flex-wrap">
          {/* <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
              Week Bulk Actions
            </span>
          </div> */}

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Coffee className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-gray-500 dark:text-gray-400">Breakfast:</span>
              <button
                type="button"
                onClick={() => { feedback('pop'); onTurnAllWeek(weekDays, 'breakfast', true); }}
                className="px-2 py-0.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:underline transition-colors cursor-pointer font-bold"
              >
                All ON
              </button>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <button
                type="button"
                onClick={() => { feedback('pop'); onTurnAllWeek(weekDays, 'breakfast', false); }}
                className="px-2 py-0.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:underline transition-colors cursor-pointer font-bold"
              >
                All OFF
              </button>
            </div>

            <span className="text-gray-200 dark:text-gray-700 hidden sm:inline">|</span>

            <div className="flex items-center gap-1.5 text-xs font-bold">
              <Utensils className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-gray-500 dark:text-gray-400">Lunch:</span>
              <button
                type="button"
                onClick={() => { feedback('pop'); onTurnAllWeek(weekDays, 'lunch', true); }}
                className="px-2 py-0.5 rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:underline transition-colors cursor-pointer font-bold"
              >
                All ON
              </button>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <button
                type="button"
                onClick={() => { feedback('pop'); onTurnAllWeek(weekDays, 'lunch', false); }}
                className="px-2 py-0.5 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:underline transition-colors cursor-pointer font-bold"
              >
                All OFF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7 Days Grid */}
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((dateStr) => {
          const meals = calculateEffectiveDateMeals(student, dateStr);
          const bfSupply = getMealSupplyStatus(boardServiceSchedule, dateStr, 'breakfast');
          const lunchSupply = getMealSupplyStatus(boardServiceSchedule, dateStr, 'lunch');
          const isBfSupplyOff = !bfSupply.isSupplying;
          const isLunchSupplyOff = !lunchSupply.isSupplying;
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
                  ? 'bg-teal-500/10 border-teal-500/30'
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
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-teal-600 text-white">
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
                  if (isBfSupplyOff) return;
                  if (editable && !isDateLocked && !isPast) {
                    onSingleClickToggle(dateStr, 'breakfast');
                  }
                }}
                className={`p-2 rounded-xl border text-left select-none transition-all ${
                  isBfSupplyOff
                    ? 'bg-gray-100 dark:bg-[#1b2622] border-gray-300/80 dark:border-white/10 text-gray-500 dark:text-gray-400 shadow-inner cursor-not-allowed'
                    : isPast || isDateLocked
                    ? 'cursor-default'
                    : 'cursor-pointer hover:shadow-xs'
                } ${
                  isBfSupplyOff
                    ? ''
                    : meals.breakfast
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/30 text-rose-900 dark:text-rose-200 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Coffee className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    <span>Breakfast</span>
                  </div>
                  {isBfSupplyOff ? (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 shadow-inner flex items-center gap-0.5">
                      <PowerOff className="w-2 h-2 text-gray-500" />
                      <span>No Supply</span>
                    </span>
                  ) : (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                        meals.breakfast ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {meals.breakfast ? 'ON' : 'OFF'}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-1 truncate">
                  {isBfSupplyOff ? (bfSupply.reasonObj?.labelEn || 'No Food Supply') : '7:30 – 8:30 AM'}
                </span>
              </div>

              {/* Lunch Slot Card */}
              <div
                onClick={() => {
                  if (isLunchSupplyOff) return;
                  if (editable && !isDateLocked && !isPast) {
                    onSingleClickToggle(dateStr, 'lunch');
                  }
                }}
                className={`p-2 rounded-xl border text-left select-none transition-all ${
                  isLunchSupplyOff
                    ? 'bg-gray-100 dark:bg-[#1b2622] border-gray-300/80 dark:border-white/10 text-gray-500 dark:text-gray-400 shadow-inner cursor-not-allowed'
                    : isPast || isDateLocked
                    ? 'cursor-default'
                    : 'cursor-pointer hover:shadow-xs'
                } ${
                  isLunchSupplyOff
                    ? ''
                    : meals.lunch
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/30 text-rose-900 dark:text-rose-200 opacity-80'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold">
                    <Utensils className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                    <span>Lunch</span>
                  </div>
                  {isLunchSupplyOff ? (
                    <span className="text-[9px] font-black px-1.5 py-0.2 rounded-full bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 shadow-inner flex items-center gap-0.5">
                      <PowerOff className="w-2 h-2 text-gray-500" />
                      <span>No Supply</span>
                    </span>
                  ) : (
                    <span
                      className={`text-[9px] font-black px-1.5 py-0.2 rounded-full ${
                        meals.lunch ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                      }`}
                    >
                      {meals.lunch ? 'ON' : 'OFF'}
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400 block mt-1 truncate">
                  {isLunchSupplyOff ? (lunchSupply.reasonObj?.labelEn || 'No Food Supply') : '12:30 – 1:45 PM'}
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
