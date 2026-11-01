import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Coffee,
  Utensils,
  Check,
  X,
  Lock,
  Clock,
  Sparkles,
  Plane,
  AlertCircle,
  ShieldCheck,
  PowerOff,
} from 'lucide-react';
import { useLanguage } from '../../../../store/LanguageContext';
import { useFeedback } from '../../../../utils/useFeedback';
import {
  addDaysToDate,
  formatFriendlyDate,
  calculateEffectiveDateMeals,
} from '../../../../utils/studentExceptionService';
import { getMealSupplyStatus } from '../../../../utils/boardServiceSchedule';

export default function DailyFocusView({
  student,
  todayIST,
  tomorrowIST,
  editable = true,
  isAdmin = false,
  boardServiceSchedule = {},
  getDateLockStatus,
  onSingleClickToggle,
  onSaveDayState,
  endTime = '14:00',
  isTomorrowLocked = false,
  focusedDate: externalFocusedDate,
  setFocusedDate: externalSetFocusedDate,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  // Selected focused date (defaults to todayIST or tomorrowIST if today is locked)
  const [internalFocusedDate, setInternalFocusedDate] = useState(() => {
    return isTomorrowLocked ? todayIST : tomorrowIST;
  });
  const focusedDate = externalFocusedDate || internalFocusedDate;
  const setFocusedDate = externalSetFocusedDate || setInternalFocusedDate;

  const meals = calculateEffectiveDateMeals(student, focusedDate);
  const bfSupply = getMealSupplyStatus(boardServiceSchedule, focusedDate, 'breakfast');
  const lunchSupply = getMealSupplyStatus(boardServiceSchedule, focusedDate, 'lunch');
  const isBfSupplyOff = !bfSupply.isSupplying;
  const isLunchSupplyOff = !lunchSupply.isSupplying;
  const lockInfo = getDateLockStatus ? getDateLockStatus(focusedDate, { isAdmin }) : { isLocked: false };
  const isBreakfastLocked = isAdmin ? false : Boolean(lockInfo.isBreakfastLocked);
  const isLunchLocked = isAdmin ? false : Boolean(lockInfo.isLunchLocked);
  const isBothLocked = isAdmin ? false : Boolean(lockInfo.isBothLocked || (lockInfo.isLocked && !lockInfo.isPartiallyLocked));
  const isPartiallyLocked = isAdmin ? false : Boolean(lockInfo.isPartiallyLocked);
  const isDateLocked = isBothLocked;

  const isToday = focusedDate === todayIST;
  const isTomorrow = focusedDate === tomorrowIST;
  const isPast = focusedDate < todayIST;

  const formattedDate = formatFriendlyDate(focusedDate, true);

  const bfDeadline = lockInfo.breakfastDeadlineTime || endTime;
  const luDeadline = lockInfo.lunchDeadlineTime || endTime;
  const hasSplitDeadlines = bfDeadline !== luDeadline;

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Day Bulk Actions Card (Date navigation handled by master dynamic switcher) */}
      {editable && !isPast && (
        <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          {/* <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <h4 className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                Day Bulk Actions
              </h4>
              {isToday && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-white">
                  Today
                </span>
              )}
              {isTomorrow && (
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-teal-600 text-white">
                  Tomorrow
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
              <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span>
                {isBothLocked
                  ? lockInfo.reason || 'Cutoff closed for this date'
                  : isPartiallyLocked
                  ? (isBreakfastLocked
                      ? `Breakfast locked (${bfDeadline}). Lunch cutoff at ${luDeadline} IST`
                      : `Lunch locked (${luDeadline}). Breakfast cutoff at ${bfDeadline} IST`)
                  : hasSplitDeadlines
                  ? `Cutoffs: Breakfast ${bfDeadline} | Lunch ${luDeadline} IST`
                  : `Daily Cutoff at ${bfDeadline} IST`}
              </span>
            </div>
          </div> */}

          {!isBothLocked && (
            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  if (onSaveDayState) {
                    onSaveDayState(focusedDate, {
                      breakfast: true,
                      lunch: true,
                      label: 'Full Day Active',
                    });
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-500/20 text-xs font-black transition-colors cursor-pointer"
              >
                Both ON
              </button>
              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  if (onSaveDayState) {
                    onSaveDayState(focusedDate, {
                      breakfast: false,
                      lunch: false,
                      label: 'Whole Day Leave',
                    });
                  }
                }}
                className="px-3.5 py-1.5 rounded-xl text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-500/20 text-xs font-black transition-colors cursor-pointer"
              >
                Both OFF
              </button>
            </div>
          )}
        </div>
      )}

      {/* Lock Warning Banner if fully locked */}
      {isBothLocked && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            {isToday
              ? 'Today is locked for kitchen food prep and live service.'
              : lockInfo.reason || `Tomorrow is locked past the daily cutoffs.`}
          </span>
        </div>
      )}

      {/* Partial Lock Notice if one meal is locked and other is open */}
      {isPartiallyLocked && (
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0" />
          <span>
            {isBreakfastLocked
              ? `Breakfast is locked past its ${bfDeadline} deadline. Lunch remains open until ${luDeadline} IST.`
              : `Lunch is locked past its ${luDeadline} deadline. Breakfast remains open until ${bfDeadline} IST.`}
          </span>
        </div>
      )}

      {/* Big Meal Focus Cards (Breakfast & Lunch) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Breakfast Big Card */}
        <div
          className={`p-5 rounded-3xl border space-y-4 transition-all shadow-sm ${
            isBfSupplyOff
              ? 'bg-gradient-to-b from-gray-200 to-gray-300 dark:from-[#1b2622] dark:to-[#121c18] border-gray-300/80 dark:border-white/10 shadow-inner'
              : meals.breakfast
              ? 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30'
              : 'bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isBfSupplyOff
                    ? 'bg-gray-300 dark:bg-white/10 text-gray-500 shadow-inner'
                    : meals.breakfast
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-md'
                    : 'bg-rose-500 text-white shadow-rose-500/20 shadow-md'
                }`}
              >
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-base font-black text-gray-900 dark:text-white">
                    Breakfast
                  </h4>
                  {isBreakfastLocked && !isBfSupplyOff && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                      <Lock className="w-2.5 h-2.5" />
                      Locked
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Morning Meal (7:30 – 8:30 AM)
                </span>
              </div>
            </div>

            {isBfSupplyOff ? (
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-300/80 dark:border-white/10 shadow-inner flex items-center gap-1">
                <PowerOff className="w-2.5 h-2.5 text-gray-500" />
                No Supply
              </span>
            ) : (
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  meals.breakfast
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {meals.breakfast ? 'Active' : 'Leave'}
              </span>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-white/70 dark:bg-black/20 border border-gray-200/60 dark:border-white/5 text-xs text-gray-600 dark:text-gray-300">
            Status:{' '}
            <strong className={isBfSupplyOff ? 'text-gray-600 dark:text-gray-400' : meals.breakfast ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {isBfSupplyOff ? `Food Supply Suspended (${bfSupply.reasonObj?.labelEn || 'Canteen Closed'})` : meals.breakfast ? 'Eating in Canteen' : 'Opted Out / Leave'}
            </strong>
          </div>

          {isBfSupplyOff ? (
            <div className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-gray-200/80 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-300/60 dark:border-white/10 flex items-center justify-center gap-1.5 shadow-inner">
              <PowerOff className="w-3.5 h-3.5 text-gray-500" />
              <span>No Kitchen Cook Scheduled</span>
            </div>
          ) : editable && !isBreakfastLocked && !isPast && (
            <button
              type="button"
              onClick={() => onSingleClickToggle(focusedDate, 'breakfast')}
              className={`w-full py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95 shadow-sm ${
                meals.breakfast
                  ? 'bg-rose-100 hover:bg-rose-200 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300/60'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
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

          {!isBfSupplyOff && editable && isBreakfastLocked && !isPast && (
            <div className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200/80 dark:border-white/10 flex items-center justify-center gap-1.5 cursor-not-allowed">
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span>Breakfast Locked ({bfDeadline} Cutoff Passed)</span>
            </div>
          )}
        </div>

        {/* Lunch Big Card */}
        <div
          className={`p-5 rounded-3xl border space-y-4 transition-all shadow-sm ${
            isLunchSupplyOff
              ? 'bg-gradient-to-b from-gray-200 to-gray-300 dark:from-[#1b2622] dark:to-[#121c18] border-gray-300/80 dark:border-white/10 shadow-inner'
              : meals.lunch
              ? 'bg-gradient-to-br from-emerald-500/15 via-emerald-500/5 to-transparent border-emerald-500/30'
              : 'bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-transparent border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                  isLunchSupplyOff
                    ? 'bg-gray-300 dark:bg-white/10 text-gray-500 shadow-inner'
                    : meals.lunch
                    ? 'bg-emerald-500 text-white shadow-emerald-500/20 shadow-md'
                    : 'bg-rose-500 text-white shadow-rose-500/20 shadow-md'
                }`}
              >
                <Utensils className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h4 className="text-base font-black text-gray-900 dark:text-white">
                    Lunch
                  </h4>
                  {isLunchLocked && !isLunchSupplyOff && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400">
                      <Lock className="w-2.5 h-2.5" />
                      Locked
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Afternoon Meal (12:30 – 1:45 PM)
                </span>
              </div>
            </div>

            {isLunchSupplyOff ? (
              <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-300/80 dark:border-white/10 shadow-inner flex items-center gap-1">
                <PowerOff className="w-2.5 h-2.5 text-gray-500" />
                No Supply
              </span>
            ) : (
              <span
                className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                  meals.lunch
                    ? 'bg-emerald-500 text-white'
                    : 'bg-rose-500 text-white'
                }`}
              >
                {meals.lunch ? 'Active' : 'Leave'}
              </span>
            )}
          </div>

          <div className="p-3 rounded-2xl bg-white/70 dark:bg-black/20 border border-gray-200/60 dark:border-white/5 text-xs text-gray-600 dark:text-gray-300">
            Status:{' '}
            <strong className={isLunchSupplyOff ? 'text-gray-600 dark:text-gray-400' : meals.lunch ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
              {isLunchSupplyOff ? `Food Supply Suspended (${lunchSupply.reasonObj?.labelEn || 'Canteen Closed'})` : meals.lunch ? 'Eating in Canteen' : 'Opted Out / Leave'}
            </strong>
          </div>

          {isLunchSupplyOff ? (
            <div className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-gray-200/80 dark:bg-white/5 text-gray-600 dark:text-gray-400 border border-gray-300/60 dark:border-white/10 flex items-center justify-center gap-1.5 shadow-inner">
              <PowerOff className="w-3.5 h-3.5 text-gray-500" />
              <span>No Kitchen Cook Scheduled</span>
            </div>
          ) : editable && !isLunchLocked && !isPast && (
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

          {!isLunchSupplyOff && editable && isLunchLocked && !isPast && (
            <div className="w-full py-2.5 rounded-2xl text-xs font-semibold bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200/80 dark:border-white/10 flex items-center justify-center gap-1.5 cursor-not-allowed">
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Lunch Locked ({luDeadline} Cutoff Passed)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
