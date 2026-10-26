import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Sparkles,
  RotateCw,
  RotateCcw,
  SlidersHorizontal,
  X,
  Users,
  Utensils,
  Coffee,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Layers,
} from 'lucide-react';
import MealFlipCard from './MealFlipCard';
import {
  getEffectiveStudentMealStatus,
  addDaysToDate,
  getDefaultBoardDayOffset,
} from '../utils/studentExceptionService';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';

const DAYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

/**
 * HeroMealCountersDock
 * 
 * Interactive, pro-motion dock housing Breakfast & Lunch 3D flip counter cards.
 * Defaults:
 * - 12:00 AM to board updation window open time (eg. 2:00 PM): Today (offset 0)
 * - 12:00 AM to board switch time (default 2:00 PM IST): Today (offset 0)
 * - Board switch time to 12:00 AM (midnight): Tomorrow (offset 1)
 */
export default function HeroMealCountersDock({
  studentsList = [],
  todayIST = '',
  dayShort = '',
  dayFull = '',
  loadingData = false,
  boardSwitchTime = null,
  windowOpenTime = '14:00',
  defaultOffset = null,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const effectiveSwitchTime = boardSwitchTime || windowOpenTime || '14:00';

  // Day Offset: 0 = Today (12 AM to board switch time), 1 = Tomorrow (board switch time to 12 AM)
  const [dayOffset, setDayOffset] = React.useState(() => {
    if (typeof defaultOffset === 'number') return defaultOffset;
    return getDefaultBoardDayOffset(null, effectiveSwitchTime);
  });
  const [userToggled, setUserToggled] = React.useState(false);

  // Sync if defaultOffset prop changes and user hasn't manually clicked
  React.useEffect(() => {
    if (!userToggled && typeof defaultOffset === 'number') {
      setDayOffset(defaultOffset);
    }
  }, [defaultOffset, userToggled]);

  // Independent Flip States for Breakfast and Lunch
  const [isBreakfastFlipped, setIsBreakfastFlipped] = useState(false);
  const [isLunchFlipped, setIsLunchFlipped] = useState(false);

  // Rejected Token Inspector Modal State
  const [inspectedMeal, setInspectedMeal] = useState(null); // null | 'breakfast' | 'lunch'

  // Current Target Date calculation
  const targetDateIST = useMemo(() => {
    if (!todayIST) return '';
    return dayOffset === 0 ? todayIST : addDaysToDate(todayIST, dayOffset);
  }, [todayIST, dayOffset]);

  // Current Target Day Key ('mo', 'tu', etc.)
  const targetDayKey = useMemo(() => {
    if (!dayShort) return 'mo';
    const currIdx = DAYS.indexOf(dayShort.toLowerCase());
    return DAYS[(currIdx + dayOffset + 7) % 7];
  }, [dayShort, dayOffset]);

  // Formatted date label for display
  const targetDateFormatted = useMemo(() => {
    if (!targetDateIST) return '';
    try {
      const parts = targetDateIST.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
    } catch (_) {}
    return targetDateIST;
  }, [targetDateIST]);

  // Compute Active & Rejected meal counts and token lists
  const metrics = useMemo(() => {
    if (!studentsList || studentsList.length === 0) {
      return {
        totalStudents: 0,
        breakfastActive: 0,
        breakfastRejected: 0,
        breakfastRejectedTokens: [],
        lunchActive: 0,
        lunchRejected: 0,
        lunchRejectedTokens: [],
      };
    }

    let bActive = 0;
    let lActive = 0;
    const bRejected = [];
    const lRejected = [];

    studentsList.forEach((s) => {
      const tokenNum = s.tokenNo !== undefined ? s.tokenNo : s.id;
      // Breakfast status
      if (getEffectiveStudentMealStatus(s, targetDateIST, targetDayKey, 'breakfast')) {
        bActive += 1;
      } else {
        bRejected.push(tokenNum);
      }

      // Lunch status
      if (getEffectiveStudentMealStatus(s, targetDateIST, targetDayKey, 'lunch')) {
        lActive += 1;
      } else {
        lRejected.push(tokenNum);
      }
    });

    // Sort rejected token numbers numerically
    bRejected.sort((a, b) => Number(a) - Number(b));
    lRejected.sort((a, b) => Number(a) - Number(b));

    return {
      totalStudents: studentsList.length,
      breakfastActive: bActive,
      breakfastRejected: bRejected.length,
      breakfastRejectedTokens: bRejected,
      lunchActive: lActive,
      lunchRejected: lRejected.length,
      lunchRejectedTokens: lRejected,
    };
  }, [studentsList, targetDateIST, targetDayKey]);

  // Handler for Day Switcher with haptic feedback
  const handleSelectDay = (offset) => {
    if (offset === dayOffset) return;
    feedback('tick');
    setUserToggled(true);
    setDayOffset(offset);
  };

  // Flip Toggle Handlers with haptic feedback
  const handleToggleBreakfastFlip = () => {
    feedback('pop');
    setIsBreakfastFlipped((prev) => !prev);
  };

  const handleToggleLunchFlip = () => {
    feedback('pop');
    setIsLunchFlipped((prev) => !prev);
  };

  const handleFlipBoth = () => {
    feedback('pop');
    const anyFlipped = isBreakfastFlipped || isLunchFlipped;
    if (anyFlipped) {
      setIsBreakfastFlipped(false);
      setIsLunchFlipped(false);
    } else {
      setIsBreakfastFlipped(true);
      setIsLunchFlipped(true);
    }
  };

  const dayLabel = dayOffset === 1
    ? t('tomorrow', 'Tomorrow')
    : t('today', 'Today');

  const inspectedTokensList =
    inspectedMeal === 'breakfast'
      ? metrics.breakfastRejectedTokens
      : metrics.lunchRejectedTokens;

  return (
    <div className="flex flex-col gap-3 w-full lg:max-w-xl flex-shrink-0">
      {/* ========================================================= */}
      {/* DOCK CONTROLS BAR: DAY SELECTOR & QUICK FLIP TOGGLE       */}
      {/* ========================================================= */}
      <div className="p-1.5 sm:p-2 rounded-2xl bg-white/10 dark:bg-white/5 border border-white/15 backdrop-blur-xl flex flex-wrap items-center justify-between gap-2 shadow-inner">
        {/* Segmented Day Switcher: Today | Tomorrow */}
        <div className="flex items-center p-0.5 rounded-xl bg-black/20 dark:bg-black/30 border border-white/10 relative">
          {/* Today Button */}
          <button
            type="button"
            onClick={() => handleSelectDay(0)}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer z-10 ${
              dayOffset === 0 ? 'text-white' : 'text-emerald-200/70 hover:text-white'
            }`}
          >
            {dayOffset === 0 && (
              <motion.div
                layoutId="activeMealDayGlider"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 shadow-md shadow-emerald-500/30 border border-emerald-400/30"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>{t('today', 'Today')}</span>
            </span>
          </button>

          {/* Tomorrow Button */}
          <button
            type="button"
            onClick={() => handleSelectDay(1)}
            className={`relative px-3 py-1.5 rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer z-10 ${
              dayOffset === 1 ? 'text-white' : 'text-emerald-200/70 hover:text-white'
            }`}
          >
            {dayOffset === 1 && (
              <motion.div
                layoutId="activeMealDayGlider"
                className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-600 to-green-600 shadow-md shadow-emerald-500/30 border border-emerald-400/30"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1">
              <span>{t('tomorrow', 'Tomorrow')}</span>
            </span>
          </button>
        </div>

        {/* Action Right: Target Date formatted chip + Flip Both affordance */}
        <div className="flex items-center gap-1.5 text-xs text-emerald-200">
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-white/10 text-[11px] font-mono font-bold border border-white/10">
            {targetDateFormatted || targetDateIST}
          </span>

          <button
            type="button"
            onClick={handleFlipBoth}
            className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-[11px] font-bold border border-white/20 transition-all flex items-center gap-1 cursor-pointer"
            title={t('flipCardsHint', 'Click to flip cards between active and rejected counts')}
          >
            <RotateCw className="w-3 h-3 text-emerald-300" />
            <span>
              {isBreakfastFlipped || isLunchFlipped
                ? t('unflipBothCards', 'Reset')
                : t('flipBothCards', 'Flip Both')}
            </span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* DUAL 3D FLIPPABLE CARDS GRID (BREAKFAST & LUNCH)          */}
      {/* ========================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
        {/* BREAKFAST CARD */}
        <MealFlipCard
          mealType="breakfast"
          activeCount={loadingData ? 0 : metrics.breakfastActive}
          rejectedCount={loadingData ? 0 : metrics.breakfastRejected}
          totalStudents={metrics.totalStudents}
          isFlipped={isBreakfastFlipped}
          onFlip={handleToggleBreakfastFlip}
          targetDateStr={targetDateFormatted}
          dayLabel={dayLabel}
          rejectedTokens={metrics.breakfastRejectedTokens}
          onOpenTokensModal={(m) => {
            feedback('tick');
            setInspectedMeal(m);
          }}
        />

        {/* LUNCH CARD */}
        <MealFlipCard
          mealType="lunch"
          activeCount={loadingData ? 0 : metrics.lunchActive}
          rejectedCount={loadingData ? 0 : metrics.lunchRejected}
          totalStudents={metrics.totalStudents}
          isFlipped={isLunchFlipped}
          onFlip={handleToggleLunchFlip}
          targetDateStr={targetDateFormatted}
          dayLabel={dayLabel}
          rejectedTokens={metrics.lunchRejectedTokens}
          onOpenTokensModal={(m) => {
            feedback('tick');
            setInspectedMeal(m);
          }}
        />
      </div>

      {/* Micro-Affordance Hint Bar */}
      <div className="flex items-center justify-between text-[11px] text-emerald-200/80 px-1 font-medium">
        {/* <span className="flex items-center gap-1.5 truncate">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span>{t('flipCardsHint', 'Click cards to flip between Turned ON & Rejected tokens')}</span>
        </span> */}
        <span className="font-mono text-[10px] text-emerald-300/80 flex-shrink-0">
          {metrics.totalStudents} {t('tokensUnit', 'tokens')}
        </span>
      </div>

      {/* ========================================================= */}
      {/* REJECTED TOKENS MODAL / DRILL-DOWN DRAWER                */}
      {/* ========================================================= */}
      <AnimatePresence>
        {inspectedMeal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header with Rose Theme matching Rejections */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-white">
                      {inspectedMeal === 'breakfast' ? t('navBreakfast', 'Breakfast') : t('navLunch', 'Lunch')}{' '}
                      {t('rejectedTokensTitle', 'Rejected Tokens')}
                    </h3>
                    <p className="text-xs text-rose-100/80 font-medium">
                      {dayLabel} ({targetDateFormatted || targetDateIST}) • {inspectedTokensList.length} {t('tokensSkipped', 'Tokens Opted Out')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectedMeal(null)}
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content: Token Grid */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                {inspectedTokensList.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {t('noRejectedTokens', 'All tokens turned ON for this meal!')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">100% participation recorded.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      The following students have opted out, set weekly exclusions, or recorded leaves for this meal:
                    </p>

                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {inspectedTokensList.map((tokenNum) => (
                        <div
                          key={tokenNum}
                          className="flex items-center justify-center p-2 rounded-xl font-mono font-extrabold text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 shadow-xs"
                        >
                          #{tokenNum}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-200/80 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {inspectedTokensList.length} of {metrics.totalStudents} tokens skipping
                </span>

                <button
                  type="button"
                  onClick={() => setInspectedMeal(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 dark:bg-white/20 hover:bg-gray-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
