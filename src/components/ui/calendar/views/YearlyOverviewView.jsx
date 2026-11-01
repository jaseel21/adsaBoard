import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '../../../../store/LanguageContext';
import { useFeedback } from '../../../../utils/useFeedback';
import {
  calculateMonthStats,
  formatFriendlyDate,
} from '../../../../utils/studentExceptionService';
import { useAcademicYear, getAcademicYearMonths } from '../../../../utils/academicYearService';

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
  const { academicYear } = useAcademicYear();

  const [todayY, todayM] = (todayIST || '').split('-').map(Number);

  // Compute month stats for all months in the active academic year cycle
  const yearStats = useMemo(() => {
    let totalActiveLunches = 0;
    let totalActiveBreakfasts = 0;
    let totalLeaves = 0;

    const acadMonths = academicYear ? getAcademicYearMonths(academicYear) : [];

    const months = acadMonths.length > 0
      ? acadMonths.map((mObj) => {
          const stats = calculateMonthStats(student, mObj.year, mObj.monthIndex);
          totalActiveLunches += stats.activeLunchDays;
          totalActiveBreakfasts += stats.activeBreakfastDays;
          totalLeaves += (stats.pastLeavesCount || 0) + (stats.monthOverridesCount || 0);

          const isCurrentMonth = todayY === mObj.year && todayM === mObj.monthIndex + 1;
          const isPastMonth = stats.isFullyPastMonth;

          return {
            year: mObj.year,
            monthIndex: mObj.monthIndex,
            name: mObj.monthName,
            label: mObj.label,
            stats,
            isCurrentMonth,
            isPastMonth,
          };
        })
      : MONTH_NAMES.map((name, idx) => {
          const stats = calculateMonthStats(student, activeYear, idx);
          totalActiveLunches += stats.activeLunchDays;
          totalActiveBreakfasts += stats.activeBreakfastDays;
          totalLeaves += (stats.pastLeavesCount || 0) + (stats.monthOverridesCount || 0);

          const isCurrentMonth = todayY === activeYear && todayM === idx + 1;
          const isPastMonth = stats.isFullyPastMonth;

          return {
            year: activeYear,
            monthIndex: idx,
            name,
            label: `${name} ${activeYear}`,
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
  }, [student, activeYear, todayY, todayM, academicYear]);

  return (
    <div className="space-y-4">
      {/* 12-Month Mini Cards Grid (Year navigation handled by master dynamic switcher) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {yearStats.months.map((m) => {
          const { monthIndex, name, label, stats, isCurrentMonth, isPastMonth, year: mYear } = m;
          const totalPlannedMeals = stats.activeBreakfastDays + stats.activeLunchDays;
          const maxPossibleMeals = stats.totalDays * 2;
          const attendancePercent = Math.round((totalPlannedMeals / maxPossibleMeals) * 100) || 0;

          return (
            <motion.div
              key={`${mYear || activeYear}-${monthIndex}`}
              whileHover={{ y: -3 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              onClick={() => {
                feedback('tick');
                onSelectMonth(monthIndex, mYear || activeYear);
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
                    {label || name}
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
