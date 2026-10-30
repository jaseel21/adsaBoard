import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Coffee,
  Utensils,
  Check,
  X,
  Lock,
  Clock,
  Sparkles,
  Plane,
  AlertCircle,
  Calendar,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../../../store/LanguageContext';
import { useFeedback } from '../../../../utils/useFeedback';
import {
  addDaysToDate,
  formatFriendlyDate,
  calculateEffectiveDateMeals,
} from '../../../../utils/studentExceptionService';

export default function DailyFocusView({
  student,
  todayIST,
  tomorrowIST,
  editable = true,
  isAdmin = false,
  getDateLockStatus,
  onSingleClickToggle,
  onSaveDayState,
  endTime = '14:00',
  isTomorrowLocked = false,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  // Selected focused date (defaults to todayIST or tomorrowIST if today is locked)
  const [focusedDate, setFocusedDate] = useState(() => {
    return isTomorrowLocked ? todayIST : tomorrowIST;
  });

  const handlePrevDay = () => {
    feedback('tick');
    setFocusedDate((prev) => addDaysToDate(prev, -1));
  };

  const handleNextDay = () => {
    feedback('tick');
    setFocusedDate((prev) => addDaysToDate(prev, 1));
  };

  const meals = calculateEffectiveDateMeals(student, focusedDate);
  const lockInfo = getDateLockStatus(focusedDate, { isAdmin });
  const isDateLocked = isAdmin ? false : lockInfo.isLocked;

  const isToday = focusedDate === todayIST;
  const isTomorrow = focusedDate === tomorrowIST;
  const isPast = focusedDate < todayIST;

  const formattedDate = formatFriendlyDate(focusedDate, true);

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Day Selector Header Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handlePrevDay}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                {formattedDate}
              </h3>
              {isToday && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white">
                  Today
                </span>
              )}
              {isTomorrow && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-sky-500 text-white">
                  Tomorrow
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>
                {isDateLocked
                  ? lockInfo.reason || 'Cutoff closed for this date'
                  : `Daily Cutoff at ${endTime} IST`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Day Jumps */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              setFocusedDate(todayIST);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isToday
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              setFocusedDate(tomorrowIST);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isTomorrow
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            Tomorrow
          </button>
        </div>
      </div>

      {/* Lock Warning Banner if locked */}
      {isDateLocked && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            {isToday
              ? 'Today is locked for kitchen food prep and live service.'
              : `Tomorrow is locked past the daily ${endTime} cutoff.`}
          </span>
        </div>
      )}

      {/* Big Meal Focus Cards (Breakfast & Lunch) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Breakfast Big Card */}
        <div
          className={`p-5 rounded-3xl border space-y-4 transition-all shadow-sm ${
            meals.breakfast
              ? 'bg-gradient-to-br from-teal-500/15 via-teal-500/5 to-transparent border-teal-500/30'
              : 'bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  meals.breakfast
                    ? 'bg-teal-500 text-white shadow-teal-500/20 shadow-md'
                    : 'bg-rose-500 text-white shadow-rose-500/20 shadow-md'
                }`}
              >
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-gray-900 dark:text-white">
                  Breakfast
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Morning Meal (7:30 – 8:30 AM)
                </span>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                meals.breakfast
                  ? 'bg-teal-500 text-white'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {meals.breakfast ? 'Active' : 'Leave'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 dark:bg-black/20 border border-gray-200/60 dark:border-white/5 text-xs text-gray-600 dark:text-gray-300">
            Status:{' '}
            <strong className={meals.breakfast ? 'text-teal-600 dark:text-teal-400' : 'text-rose-600 dark:text-rose-400'}>
              {meals.breakfast ? 'Eating in Canteen' : 'Opted Out / Leave'}
            </strong>
          </div>

          {editable && !isDateLocked && !isPast && (
            <button
              type="button"
              onClick={() => onSingleClickToggle(focusedDate, 'breakfast')}
              className={`w-full py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-sm ${
                meals.breakfast
                  ? 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300/60'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/20'
              }`}
            >
              {meals.breakfast ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Turn Breakfast OFF (Leave)</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Turn Breakfast ON</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Lunch Big Card */}
        <div
          className={`p-5 rounded-3xl border space-y-4 transition-all shadow-sm ${
            meals.lunch
              ? 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30'
              : 'bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  meals.lunch
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-md'
                    : 'bg-rose-500 text-white shadow-rose-500/20 shadow-md'
                }`}
              >
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-black text-gray-900 dark:text-white">
                  Lunch
                </h4>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Afternoon Meal (12:30 – 1:45 PM)
                </span>
              </div>
            </div>

            <span
              className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                meals.lunch
                  ? 'bg-emerald-500 text-white'
                  : 'bg-rose-500 text-white'
              }`}
            >
              {meals.lunch ? 'Active' : 'Leave'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-white/70 dark:bg-black/20 border border-gray-200/60 dark:border-white/5 text-xs text-gray-600 dark:text-gray-300">
            Status:{' '}
            <strong className={meals.lunch ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {meals.lunch ? 'Eating in Canteen' : 'Opted Out / Leave'}
            </strong>
          </div>

          {editable && !isDateLocked && !isPast && (
            <button
              type="button"
              onClick={() => onSingleClickToggle(focusedDate, 'lunch')}
              className={`w-full py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-sm ${
                meals.lunch
                  ? 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300/60'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
              }`}
            >
              {meals.lunch ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Turn Lunch OFF (Leave)</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Turn Lunch ON</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Whole Day Leave Preset Helper */}
      {editable && !isDateLocked && !isPast && (
        <div className="p-4 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 font-bold">
            <Plane className="w-4 h-4 text-purple-500" />
            <span>Need full day leave on {formattedDate.split(',')[0]}?</span>
          </div>

          <button
            type="button"
            onClick={() => {
              feedback('pop');
              if (onSaveDayState) {
                const willTurnOn = !meals.breakfast && !meals.lunch;
                onSaveDayState(focusedDate, {
                  breakfast: willTurnOn,
                  lunch: willTurnOn,
                  label: willTurnOn ? 'Full Day Active' : 'Full Day Leave',
                });
              }
            }}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-black text-gray-800 dark:text-gray-100 transition-colors cursor-pointer"
          >
            {!meals.breakfast && !meals.lunch ? 'Turn Both ON' : 'Turn Both OFF (Leave)'}
          </button>
        </div>
      )}
    </div>
  );
}
