import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  Utensils,
  Coffee,
  Moon,
  Clock,
  Plus,
  Trash2,
  CalendarDays,
  List,
  LayoutGrid,
  Bookmark,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Layers,
  Edit3,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import {
  getTodayISTDate,
  getMonthCalendarDays,
  formatFriendlyDate,
} from '../../utils/studentExceptionService';
import { DEFAULT_WEEKLY_MENU, getEffectiveMenuForDate } from '../../utils/menuService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function MenuCalendarMatrix({
  weeklyMenu = DEFAULT_WEEKLY_MENU,
  overrides = {},
  onSelectDate,
  onOpenRangedModal,
  onOpenPresetsModal,
  className = '',
}) {
  const { feedback } = useFeedback();
  const todayIST = getTodayISTDate();

  // Active Month & Year
  const [currentYear, setCurrentYear] = useState(() => {
    const [y] = todayIST.split('-').map(Number);
    return y;
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [, m] = todayIST.split('-').map(Number);
    return m - 1; // 0-indexed
  });

  // Active View: 'grid' vs 'list'
  const [activeView, setActiveView] = useState('grid');
  const [searchFilter, setSearchFilter] = useState('');

  // Navigation handlers
  const handlePrevMonth = () => {
    feedback('tick');
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    feedback('tick');
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleJumpToToday = () => {
    feedback('tick');
    const [y, m] = todayIST.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m - 1);
  };

  // Calendar days array for current month (with padding days)
  const calendarDays = useMemo(() => {
    return getMonthCalendarDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Statistics for currently viewed month
  const monthStats = useMemo(() => {
    let totalFeasts = 0;
    let totalClosures = 0;
    let totalDaysInMonth = 0;

    calendarDays.forEach((day) => {
      if (day.isCurrentMonth) {
        totalDaysInMonth += 1;
        const ovr = overrides[day.dateStr];
        if (ovr) {
          if (ovr.isClosed) totalClosures += 1;
          else totalFeasts += 1;
        }
      }
    });

    return {
      totalDaysInMonth,
      totalFeasts,
      totalClosures,
      standardDays: totalDaysInMonth - (totalFeasts + totalClosures),
    };
  }, [calendarDays, overrides]);

  // All overrides in month or filtered for list view
  const monthOverridesList = useMemo(() => {
    const list = [];
    Object.entries(overrides).forEach(([dateStr, ovr]) => {
      const [y, m] = dateStr.split('-').map(Number);
      if (y === currentYear && m - 1 === currentMonth) {
        list.push({ dateStr, ...ovr });
      }
    });
    list.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    if (!searchFilter.trim()) return list;

    const query = searchFilter.toLowerCase();
    return list.filter(
      (item) =>
        item.dateStr.includes(query) ||
        (item.occasion && item.occasion.toLowerCase().includes(query)) ||
        (item.lunch?.title && item.lunch.title.toLowerCase().includes(query)) ||
        (item.breakfast?.title && item.breakfast.title.toLowerCase().includes(query))
    );
  }, [overrides, currentYear, currentMonth, searchFilter]);

  return (
    <div className={`space-y-5 ${className}`}>
      {/* Top Bar: Month Navigation, Jump Today, Stats & Action Buttons */}
      <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Month Selector */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-gray-100 dark:bg-white/5 rounded-2xl p-1 border border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-xs"
                title="Previous Month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="px-4 py-1.5 text-center min-w-[170px]">
                <span className="text-base sm:text-lg font-black text-gray-900 dark:text-white block">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </span>
              </div>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-2 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors shadow-xs"
                title="Next Month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-3.5 py-2.5 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
              <span>Today</span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setActiveView('grid');
                }}
                className={`p-2 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'grid'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Month Grid Matrix"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setActiveView('list');
                }}
                className={`p-2 rounded-xl text-xs font-bold transition-all ${
                  activeView === 'list'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Overrides List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                feedback('tick');
                if (onOpenRangedModal) onOpenRangedModal();
              }}
              className="px-3.5 py-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-bold text-xs hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1.5"
            >
              <CalendarDays className="w-4 h-4 text-purple-600 dark:text-purple-400" />
              <span>Ranged / Bulk Overrides</span>
            </button>

            <button
              type="button"
              onClick={() => {
                feedback('pop');
                if (onSelectDate) onSelectDate(todayIST);
              }}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-lg shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Single Feast</span>
            </button>
          </div>
        </div>

        {/* Dynamic Month Overview Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 dark:border-white/10 text-xs">
          <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/30 flex items-center justify-between">
            <span className="font-semibold text-purple-900 dark:text-purple-200">
              Special Feasts
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-extrabold text-xs">
              {monthStats.totalFeasts}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 flex items-center justify-between">
            <span className="font-semibold text-rose-900 dark:text-rose-200">
              Closures / Holidays
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-xs">
              {monthStats.totalClosures}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 flex items-center justify-between">
            <span className="font-semibold text-emerald-900 dark:text-emerald-200">
              Routine Days
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-xs">
              {monthStats.standardDays}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex items-center justify-between">
            <span className="font-semibold text-gray-700 dark:text-gray-300">
              Days in Month
            </span>
            <span className="px-2 py-0.5 rounded-full bg-gray-700 dark:bg-gray-300 text-white dark:text-zinc-900 font-extrabold text-xs">
              {monthStats.totalDaysInMonth}
            </span>
          </div>
        </div>
      </div>

      {/* Main Content Area: Grid Matrix or List View */}
      {activeView === 'grid' ? (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-3 sm:p-6 shadow-sm border border-gray-200 dark:border-white/10 overflow-hidden">
          {/* Day of week column headers */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
            {DAY_HEADERS.map((dh, idx) => (
              <div
                key={dh}
                className={`py-2 text-[11px] sm:text-xs font-black uppercase tracking-wider rounded-xl ${
                  idx === 5
                    ? 'text-purple-600 dark:text-purple-400 bg-purple-50/60 dark:bg-purple-950/30'
                    : 'text-gray-400 dark:text-gray-500'
                }`}
              >
                {dh}
              </div>
            ))}
          </div>

          {/* Tactile Month Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            {calendarDays.map((day, idx) => {
              const { dateStr, dayNumber, isCurrentMonth, isPast } = day;
              const isToday = dateStr === todayIST;
              const effective = getEffectiveMenuForDate(dateStr, weeklyMenu, overrides);
              const override = overrides[dateStr];
              const hasOverride = Boolean(override);
              const isClosed = Boolean(effective.isClosed);

              // Cell styles
              let borderClass = 'border-gray-200/80 dark:border-white/10';
              let bgClass = 'bg-gray-50/40 dark:bg-white/[0.02] hover:bg-gray-100 dark:hover:bg-white/5';
              let ringClass = '';

              if (!isCurrentMonth) {
                bgClass = 'bg-transparent opacity-25 cursor-default';
                borderClass = 'border-transparent';
              } else if (isClosed) {
                bgClass = 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900/50 hover:bg-rose-100 dark:hover:bg-rose-900/40';
              } else if (hasOverride) {
                bgClass = 'bg-gradient-to-br from-purple-50 to-indigo-50/60 dark:from-purple-950/30 dark:to-indigo-950/20 border-purple-300 dark:border-purple-700/60 shadow-sm shadow-purple-500/10 hover:border-purple-400';
              }

              if (isToday) {
                ringClass = 'ring-2 ring-emerald-500 dark:ring-emerald-400';
              }

              return (
                <motion.div
                  key={idx}
                  whileHover={isCurrentMonth ? { y: -2, scale: 1.015 } : undefined}
                  whileTap={isCurrentMonth ? { scale: 0.98 } : undefined}
                  transition={{ type: 'spring', stiffness: 450, damping: 25 }}
                  onClick={() => {
                    if (!isCurrentMonth) return;
                    feedback('tick');
                    if (onSelectDate) onSelectDate(dateStr);
                  }}
                  className={`relative min-h-[92px] sm:min-h-[110px] p-2 sm:p-2.5 rounded-2xl border transition-all flex flex-col justify-between cursor-pointer group select-none ${bgClass} ${borderClass} ${ringClass}`}
                >
                  {/* Top Bar: Date Number and Badges */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-black ${
                        isToday
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isCurrentMonth
                          ? 'text-gray-900 dark:text-white'
                          : 'text-gray-300 dark:text-gray-700'
                      }`}
                    >
                      {dayNumber}
                    </span>

                    {isToday && (
                      <span className="px-1.5 py-0.5 rounded-md bg-emerald-500 text-white text-[9px] font-black uppercase">
                        Today
                      </span>
                    )}

                    {hasOverride && !isClosed && (
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-600 text-white text-[9px] font-extrabold flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span className="hidden sm:inline">Feast</span>
                      </span>
                    )}

                    {isClosed && (
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-[9px] font-extrabold">
                        Off
                      </span>
                    )}
                  </div>

                  {/* Middle Content Preview */}
                  {isCurrentMonth && (
                    <div className="my-1 flex-1 flex flex-col justify-center">
                      {isClosed ? (
                        <div className="text-[10px] sm:text-[11px] font-bold text-rose-600 dark:text-rose-400 truncate">
                          {effective.closureReason || 'Canteen Closed'}
                        </div>
                      ) : (
                        <div className="space-y-0.5">
                          {hasOverride && override.occasion && (
                            <div className="text-[10px] sm:text-[11px] font-extrabold text-purple-700 dark:text-purple-300 truncate">
                              {override.occasion}
                            </div>
                          )}
                          <div className="text-[10px] sm:text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                            {effective.lunch?.title || effective.breakfast?.title || 'Routine Menu'}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bottom: Meal Slot Dots Indicators & Edit Hint */}
                  {isCurrentMonth && !isClosed && (
                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-white/5">
                      <div className="flex items-center space-x-1">
                        {/* Breakfast dot */}
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            effective.breakfast?.title ? 'bg-amber-500' : 'bg-gray-300 dark:bg-white/20'
                          }`}
                          title={`Breakfast: ${effective.breakfast?.title || 'None'}`}
                        />
                        {/* Lunch dot */}
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            effective.lunch?.title ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'
                          }`}
                          title={`Lunch: ${effective.lunch?.title || 'None'}`}
                        />
                        {/* Evening dot */}
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            effective.evening?.title ? 'bg-blue-500' : 'bg-gray-300 dark:bg-white/20'
                          }`}
                          title={`Evening: ${effective.evening?.title || 'None'}`}
                        />
                        {/* Dinner dot */}
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            effective.dinner?.title ? 'bg-purple-500' : 'bg-gray-300 dark:bg-white/20'
                          }`}
                          title={`Dinner: ${effective.dinner?.title || 'None'}`}
                        />
                      </div>

                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Edit3 className="w-3 h-3 text-purple-500" />
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>
      ) : (
        /* List / Feed View */
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-white/10 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-purple-600" />
              <span>Configured Overrides for {MONTH_NAMES[currentMonth]} {currentYear}</span>
            </h4>
            <div className="w-full sm:w-64">
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search overrides or dishes..."
                className="w-full px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400"
              />
            </div>
          </div>

          {monthOverridesList.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p>No date overrides or special feasts configured in {MONTH_NAMES[currentMonth]} {currentYear}.</p>
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  if (onSelectDate) onSelectDate(todayIST);
                }}
                className="mt-3 px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700"
              >
                + Add Special Feast
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {monthOverridesList.map((ovr) => (
                <div
                  key={ovr.dateStr}
                  onClick={() => {
                    feedback('tick');
                    if (onSelectDate) onSelectDate(ovr.dateStr);
                  }}
                  className="p-3.5 sm:p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-purple-400 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start sm:items-center space-x-3.5">
                    <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-purple-600 dark:text-purple-400">
                          {formatFriendlyDate(ovr.dateStr, true)}
                        </span>
                        {ovr.isClosed && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-black uppercase">
                            Closed
                          </span>
                        )}
                      </div>
                      <h5 className="text-sm font-bold text-gray-900 dark:text-white mt-0.5">
                        {ovr.occasion || 'Special Dining Day'}
                      </h5>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-gray-500 mt-1">
                        {ovr.breakfast?.title && <span>🍳 BF: {ovr.breakfast.title}</span>}
                        {ovr.lunch?.title && <span>🍱 Lunch: {ovr.lunch.title}</span>}
                        {ovr.evening?.title && <span>☕ Evening: {ovr.evening.title}</span>}
                        {ovr.dinner?.title && <span>🌙 Dinner: {ovr.dinner.title}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-end sm:self-center">
                    <span className="text-xs font-bold text-purple-600 dark:text-purple-400 group-hover:underline flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
