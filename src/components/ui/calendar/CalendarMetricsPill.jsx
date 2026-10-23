import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Coffee, Utensils, Calendar, ShieldCheck, Zap, Info } from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';

export default function CalendarMetricsPill({ stats, monthOverridesCount = 0 }) {
  const { t } = useLanguage();
  const [showTooltip, setShowTooltip] = useState(false);

  const isPast = stats.isFullyPastMonth;
  const totalScheduled = (stats.upcomingBreakfastsScheduled || 0) + (stats.upcomingLunchesScheduled || 0);
  const totalTaken = (stats.pastBreakfastsTaken || 0) + (stats.pastLunchesTaken || 0);

  return (
    <div
      className="relative inline-flex items-center"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <button
        type="button"
        onClick={() => setShowTooltip((prev) => !prev)}
        className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 transition-all select-none border cursor-pointer ${
          isPast
            ? 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/25 hover:bg-teal-500/15'
            : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/15'
        }`}
        aria-label="Dining statistics details"
      >
        {isPast ? (
          <>
            <ShieldCheck className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 flex-shrink-0" />
            <span>{totalTaken} Attended</span>
            <span className="opacity-50">•</span>
            <span className="font-mono text-[10px]">{stats.pastBreakfastsTaken} Bf / {stats.pastLunchesTaken} Lu</span>
          </>
        ) : (
          <>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            <span className="font-mono font-bold">
              {stats.upcomingDaysCount > 0 ? (
                `${stats.upcomingBreakfastsScheduled} Bf • ${stats.upcomingLunchesScheduled} Lu`
              ) : (
                `${stats.activeBreakfastDays} Bf • ${stats.activeLunchDays} Lu`
              )}
            </span>
            {monthOverridesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" />
                {monthOverridesCount}
              </span>
            )}
          </>
        )}
      </button>

      {/* Detail Breakdown Popover / Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 mt-2 z-50 w-64 p-3 rounded-2xl bg-white/95 dark:bg-[#121c19]/95 backdrop-blur-xl border border-gray-200/90 dark:border-white/15 shadow-xl text-xs space-y-2 select-none pointer-events-none"
          >
            <div className="flex items-center justify-between pb-1.5 border-b border-gray-100 dark:border-white/10">
              <span className="font-extrabold text-gray-900 dark:text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-500" />
                {isPast ? 'Finalized Month Summary' : 'Active Month Forecast'}
              </span>
              <span className="text-[10px] font-mono text-gray-400">
                {stats.totalDays} Days
              </span>
            </div>

            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Coffee className="w-3 h-3 text-amber-500" />
                  Breakfasts Active:
                </span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">
                  {isPast ? stats.pastBreakfastsTaken : stats.activeBreakfastDays}
                </span>
              </div>

              <div className="flex items-center justify-between text-gray-600 dark:text-gray-300">
                <span className="flex items-center gap-1.5">
                  <Utensils className="w-3 h-3 text-emerald-500" />
                  Lunches Active:
                </span>
                <span className="font-mono font-bold text-gray-900 dark:text-white">
                  {isPast ? stats.pastLunchesTaken : stats.activeLunchDays}
                </span>
              </div>

              {monthOverridesCount > 0 && (
                <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 pt-1 border-t border-gray-100 dark:border-white/5">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    Month Overrides:
                  </span>
                  <span className="font-mono font-bold">{monthOverridesCount} dates</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
