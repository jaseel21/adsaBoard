import React from 'react';
import { Calendar, Users, TrendingUp, CalendarCheck, Clock, FileText, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';

export default function DiningAttendanceLeaveSummary({
  periodStats = {},
  leaveSummary = {},
  meta = {},
}) {
  const { t } = useLanguage();
  const leavesList = leaveSummary.list || [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Pod 1: Date Range Statistics & Period Averages */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-emerald-500/20 shadow-glass dark:shadow-glass-dark">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>Period Attendance Averages & Totals</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {meta.timeSpan === '30d' ? '30 Days Window' : '7 Days Window'}
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Mathematical turnout averages calculated across the active temporal window
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Avg Daily Diners</span>
            <div className="text-xl font-black text-gray-900 dark:text-white font-mono mt-0.5">
              {periodStats.avgDailyActive || 0}
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              {periodStats.avgTurnoutRate || 0}% avg turnout
            </span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Breakfast Avg</span>
            <div className="text-xl font-black text-gray-900 dark:text-white font-mono mt-0.5">
              {periodStats.avgDailyBreakfast || 0}
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">per morning</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20">
            <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Lunch Avg</span>
            <div className="text-xl font-black text-gray-900 dark:text-white font-mono mt-0.5">
              {periodStats.avgDailyLunch || 0}
            </div>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">per midday</span>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-500/20 col-span-2 sm:col-span-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-gray-600 dark:text-gray-300">Total Period Portions Served:</span>
              <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                {(periodStats.totalMealsServed || 0).toLocaleString()} Meals
              </span>
            </div>
            {periodStats.peakDay && (
              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 mt-1 pt-1 border-t border-emerald-500/15">
                <span>Peak Turnout Day:</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {periodStats.peakDay.friendlyDate} ({periodStats.peakDay.lunchCount} lunch diners)
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Pod 2: Authentic Scheduled Student Leaves & Absences */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-gray-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <CalendarCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>Scheduled Student Leaves & Opt-Outs</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  {leavesList.length} Opted Out
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Registered calendar exceptions and leave declarations for {meta.friendlyDate}
              </p>
            </div>
          </div>
        </div>

        {leavesList.length === 0 ? (
          <div className="p-6 rounded-xl bg-gray-50 dark:bg-white/5 text-center text-xs text-gray-500 dark:text-gray-400">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            No active student leave declarations recorded for this date.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {leavesList.slice(0, 8).map((st) => (
              <div
                key={st.id}
                className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-mono font-bold flex items-center justify-center text-[10px]">
                    #{st.tokenNo}
                  </span>
                  <div>
                    <span className="font-bold text-gray-900 dark:text-white">{st.name}</span>
                    <span className="text-[10px] text-gray-400 ml-1.5">({st.batch})</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {st.isBreakfastOff && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400">
                      No Bk
                    </span>
                  )}
                  {st.isLunchOff && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-700 dark:text-rose-400">
                      No Lunch
                    </span>
                  )}
                </div>
              </div>
            ))}
            {leavesList.length > 8 && (
              <div className="text-[10px] text-center text-gray-400 pt-1">
                + {leavesList.length - 8} more students with scheduled leaves
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
