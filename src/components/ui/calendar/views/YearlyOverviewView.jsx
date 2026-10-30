import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  Plane,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../../../store/LanguageContext';
import { useFeedback } from '../../../../utils/useFeedback';
import {
  calculateMonthStats,
  formatFriendlyDate,
} from '../../../../utils/studentExceptionService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function YearlyOverviewView({
  currentYear,
  student,
  todayIST,
  onSelectMonth, // (monthIndex, year)
  onOpenRangeLeave,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const [activeYear, setActiveYear] = useState(currentYear);

  const [todayY, todayM] = (todayIST || '').split('-').map(Number);

  // Compute month stats for all 12 months in activeYear
  const yearStats = useMemo(() => {
    let totalActiveLunches = 0;
    let totalActiveBreakfasts = 0;
    let totalLeaves = 0;

    const months = MONTH_NAMES.map((name, idx) => {
      const stats = calculateMonthStats(student, activeYear, idx);
      totalActiveLunches += stats.activeLunchDays;
      totalActiveBreakfasts += stats.activeBreakfastDays;
      totalLeaves += (stats.pastLeavesCount || 0) + (stats.monthOverridesCount || 0);

      const isCurrentMonth = todayY === activeYear && todayM === idx + 1;
      const isPastMonth = stats.isFullyPastMonth;

      return {
        monthIndex: idx,
        name,
        stats,
        isCurrentMonth,
        isPastMonth,
      };
    });

    return {
      months,
      totalActiveLunches,
      totalActiveBreakfasts,
      totalLeaves,
    };
  }, [student, activeYear, todayY, todayM]);

  return (
    <div className="space-y-4">
      {/* Year Bar & Summary Header */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20 shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Academic Year Dining Horizon
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                Year {activeYear}
              </h3>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                {yearStats.totalActiveLunches} Lunches • {yearStats.totalActiveBreakfasts} Breakfasts
              </span>
            </div>
          </div>
        </div>

        {/* Year Stepper & Vacation Action */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              onOpenRangeLeave();
            }}
            className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs shadow-xs active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Schedule Vacation / Break</span>
          </button>

          <div className="inline-flex items-center rounded-xl bg-gray-100 dark:bg-white/5 p-1 border border-gray-200/60 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setActiveYear((y) => y - 1);
              }}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
              title="Previous Year"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono font-bold text-xs px-2.5 text-gray-900 dark:text-white">
              {activeYear}
            </span>
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setActiveYear((y) => y + 1);
              }}
              className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors cursor-pointer"
              title="Next Year"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 12-Month Mini Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {yearStats.months.map(({ monthIndex, name, stats, isCurrentMonth, isPastMonth }) => {
          const totalPlannedMeals = stats.activeBreakfastDays + stats.activeLunchDays;
          const maxPossibleMeals = stats.totalDays * 2;
          const attendancePercent = Math.round((totalPlannedMeals / maxPossibleMeals) * 100) || 0;

          return (
            <motion.div
              key={name}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              onClick={() => {
                feedback('tick');
                onSelectMonth(monthIndex, activeYear);
              }}
              className={`p-4 rounded-3xl border transition-all cursor-pointer shadow-xs select-none flex flex-col justify-between space-y-3 ${
                isCurrentMonth
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/30'
                  : 'bg-white/90 dark:bg-[#0f1715]/90 border-gray-200/80 dark:border-white/10 hover:border-emerald-500/40'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-1.5">
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">
                    {name}
                  </h4>
                  {isCurrentMonth && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500 text-white">
                      Current
                    </span>
                  )}
                </div>
                <span className="text-[11px] font-mono text-gray-400">
                  {stats.totalDays} Days
                </span>
              </div>

              {/* Attendance Density Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] font-bold">
                  <span className="text-gray-500 dark:text-gray-400">Meals Active</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    {attendancePercent}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden flex">
                  <div
                    style={{ width: `${attendancePercent}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  />
                </div>
              </div>

              {/* Meal Counts */}
              <div className="grid grid-cols-2 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
                  <span className="text-[10px] text-gray-400 block font-medium">Lunches</span>
                  <strong className="text-emerald-600 dark:text-emerald-400 font-mono text-xs">
                    {stats.activeLunchDays}
                  </strong>
                </div>
                <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
                  <span className="text-[10px] text-gray-400 block font-medium">Breakfasts</span>
                  <strong className="text-teal-600 dark:text-teal-400 font-mono text-xs">
                    {stats.activeBreakfastDays}
                  </strong>
                </div>
              </div>

              {/* View Month CTA */}
              <div className="pt-1 flex items-center justify-between text-[11px] text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 font-bold transition-colors">
                <span>{isPastMonth ? 'View Ledger' : 'Manage Month'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
