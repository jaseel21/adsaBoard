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
  Columns,
  Layers,
  RotateCcw,
  CheckCircle2,
  Edit3,
  Search,
  Filter,
  Eye,
  AlertTriangle,
  Lock,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import {
  getTodayISTDate,
  getMonthCalendarDays,
  formatFriendlyDate,
  addDaysToDate,
  getDayOfWeekShort,
} from '../../utils/studentExceptionService';
import {
  DAY_KEYS,
  DAY_NAMES,
  DAY_SHORTS,
  DEFAULT_WEEKLY_MENU,
  getEffectiveMenuForDate,
} from '../../utils/menuService';
import { getCanonicalMealTiming } from '../../utils/mealScheduleService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const SLOT_CONFIGS = [
  { key: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'amber' },
  { key: 'lunch', label: 'Lunch', icon: Utensils, color: 'emerald' },
  { key: 'evening', label: 'Evening Tea', icon: Coffee, color: 'blue' },
  { key: 'dinner', label: 'Dinner', icon: Moon, color: 'purple' },
];

export default function MenuCalendarMatrix({
  weeklyMenu = DEFAULT_WEEKLY_MENU,
  defaultTemplate = null,
  overrides = {},
  selectedDate: propSelectedDate = null,
  onSelectDate,
  onEditSlot,
  onDeleteOverride,
  onAddNewFeast,
  onOpenRangedModal,
  className = '',
}) {
  const { feedback } = useFeedback();
  const todayIST = getTodayISTDate();

  // Active view: 'month' | 'week' | 'day' | 'year' | 'list'
  const [activeView, setActiveView] = useState('month');

  // Currently inspected date
  const [selectedDate, setSelectedDate] = useState(() => propSelectedDate || todayIST);

  // Month & Year state
  const [currentYear, setCurrentYear] = useState(() => {
    const [y] = (propSelectedDate || todayIST).split('-').map(Number);
    return y;
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [, m] = (propSelectedDate || todayIST).split('-').map(Number);
    return m - 1; // 0-indexed
  });

  // Search & Filter
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'feasts' | 'closed' | 'custom'

  // Month navigation
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
    setSelectedDate(todayIST);
  };

  // Calendar days array for current month (with padding days)
  const calendarDays = useMemo(() => {
    return getMonthCalendarDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Statistics for currently viewed month
  const monthStats = useMemo(() => {
    let totalFeasts = 0;
    let totalClosures = 0;
    let totalCustom = 0;
    let totalDaysInMonth = 0;

    calendarDays.forEach((day) => {
      if (!day.isBlank) {
        totalDaysInMonth += 1;
        const ovr = overrides[day.dateStr];
        if (ovr) {
          if (ovr.isClosed || ovr.isHoliday || ovr.dayStatus === 'leave') totalClosures += 1;
          else if (ovr.dayStatus === 'event' || ovr.occasion) totalFeasts += 1;
          else totalCustom += 1;
        }
      }
    });

    return {
      totalDaysInMonth,
      totalFeasts,
      totalClosures,
      totalCustom,
      standardDays: totalDaysInMonth - (totalFeasts + totalClosures + totalCustom),
    };
  }, [calendarDays, overrides]);

  // Week View: compute 7 dates around selectedDate (Sunday to Saturday)
  const weekDates = useMemo(() => {
    const dow = getDayOfWeekShort(selectedDate);
    const dowIdx = DAY_KEYS.indexOf(dow) !== -1 ? DAY_KEYS.indexOf(dow) : 0;
    const sundayStr = addDaysToDate(selectedDate, -dowIdx);
    return DAY_KEYS.map((_, i) => addDaysToDate(sundayStr, i));
  }, [selectedDate]);

  const handlePrevWeek = () => {
    feedback('tick');
    const prev = addDaysToDate(selectedDate, -7);
    setSelectedDate(prev);
    const [y, m] = prev.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m - 1);
  };

  const handleNextWeek = () => {
    feedback('tick');
    const next = addDaysToDate(selectedDate, 7);
    setSelectedDate(next);
    const [y, m] = next.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m - 1);
  };

  // Day View: Prev / Next Day
  const handlePrevDay = () => {
    feedback('tick');
    const prev = addDaysToDate(selectedDate, -1);
    setSelectedDate(prev);
    const [y, m] = prev.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m - 1);
  };

  const handleNextDay = () => {
    feedback('tick');
    const next = addDaysToDate(selectedDate, 1);
    setSelectedDate(next);
    const [y, m] = next.split('-').map(Number);
    setCurrentYear(y);
    setCurrentMonth(m - 1);
  };

  // Single Day deep data for Day View
  const selectedDayData = useMemo(() => {
    return getEffectiveMenuForDate(selectedDate, weeklyMenu, overrides);
  }, [selectedDate, weeklyMenu, overrides]);

  // Overrides list for List View
  const filteredOverridesList = useMemo(() => {
    const list = [];
    Object.entries(overrides).forEach(([dateStr, ovr]) => {
      list.push({ dateStr, ...ovr });
    });
    list.sort((a, b) => a.dateStr.localeCompare(b.dateStr));

    return list.filter((item) => {
      if (statusFilter === 'feasts' && item.dayStatus !== 'event' && !item.occasion) return false;
      if (statusFilter === 'closed' && !item.isClosed && !item.isHoliday && item.dayStatus !== 'leave') return false;
      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      return (
        item.dateStr.includes(q) ||
        (item.occasion && item.occasion.toLowerCase().includes(q)) ||
        (item.lunch?.title && item.lunch.title.toLowerCase().includes(q)) ||
        (item.breakfast?.title && item.breakfast.title.toLowerCase().includes(q))
      );
    });
  }, [overrides, statusFilter, searchFilter]);

  const handleDateClick = (dateStr) => {
    feedback('tick');
    setSelectedDate(dateStr);
    if (onSelectDate) onSelectDate(dateStr);
  };

  return (
    <div className={`space-y-5 ${className}`}>
      {/* 1. Master Control Bar */}
      <div className="bg-white/80 dark:bg-[#0f1715]/90 rounded-3xl p-4 sm:p-5 shadow-sm border border-gray-200/80 dark:border-white/10 backdrop-blur-xl space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Left: View Switcher (Month, Week, Day, Year, List) */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-100/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 overflow-x-auto">
            {[
              { id: 'month', label: 'Month', icon: LayoutGrid },
              { id: 'week', label: 'Week', icon: Columns },
              { id: 'day', label: 'Day', icon: Clock },
              { id: 'year', label: 'Year', icon: Calendar },
              { id: 'list', label: 'List', icon: List },
            ].map((v) => {
              const Icon = v.icon;
              const isActive = activeView === v.id;
              return (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setActiveView(v.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-purple-600 text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{v.label}</span>
                </button>
              );
            })}
          </div>

          {/* Center: Contextual Date Navigator */}
          <div className="flex items-center justify-center gap-2">
            {activeView === 'month' && (
              <div className="flex items-center bg-gray-100/90 dark:bg-white/5 rounded-2xl p-1 border border-gray-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                  title="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-4 py-1 text-center min-w-[150px]">
                  <span className="text-sm font-black text-gray-900 dark:text-white block">
                    {MONTH_NAMES[currentMonth]} {currentYear}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                  title="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeView === 'week' && (
              <div className="flex items-center bg-gray-100/90 dark:bg-white/5 rounded-2xl p-1 border border-gray-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={handlePrevWeek}
                  className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                  title="Previous Week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-4 py-1 text-center min-w-[210px]">
                  <span className="text-xs font-black text-gray-900 dark:text-white block">
                    {formatFriendlyDate(weekDates[0], false)} – {formatFriendlyDate(weekDates[6], false)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNextWeek}
                  className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                  title="Next Week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeView === 'day' && (
              <div className="flex items-center bg-gray-100/90 dark:bg-white/5 rounded-2xl p-1 border border-gray-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={handlePrevDay}
                  className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                  title="Previous Day"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-4 py-1 text-center min-w-[170px]">
                  <span className="text-sm font-black text-gray-900 dark:text-white block">
                    {formatFriendlyDate(selectedDate)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNextDay}
                  className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                  title="Next Day"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {activeView === 'year' && (
              <div className="flex items-center bg-gray-100/90 dark:bg-white/5 rounded-2xl p-1 border border-gray-200/80 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setCurrentYear((y) => y - 1);
                  }}
                  className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-5 py-1 text-center min-w-[110px]">
                  <span className="text-sm font-black text-gray-900 dark:text-white block">
                    {currentYear}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setCurrentYear((y) => y + 1);
                  }}
                  className="p-1.5 rounded-xl text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-zinc-800 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-3 py-2 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-1.5"
              title="Jump to Current Date"
            >
              <RotateCcw className="w-3.5 h-3.5 text-emerald-500" />
              <span>Today</span>
            </button>
          </div>

          {/* Right: Quick Action Buttons */}
          <div className="flex items-center gap-2 self-stretch lg:self-auto justify-end">
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                if (onOpenRangedModal) onOpenRangedModal();
              }}
              className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-bold text-xs hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1.5"
            >
              <CalendarDays className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Ranged Period</span>
            </button>

            <button
              type="button"
              onClick={() => {
                feedback('pop');
                if (onAddNewFeast) onAddNewFeast(selectedDate);
                else if (onSelectDate) onSelectDate(selectedDate);
              }}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Special Feast</span>
            </button>
          </div>
        </div>

        {/* Dynamic Month Stats & Legend Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-100 dark:border-white/5 text-xs">
          <div className="p-2.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-900/30 flex items-center justify-between">
            <span className="font-semibold text-purple-900 dark:text-purple-200 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span>Special Feasts</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white font-black text-[11px]">
              {monthStats.totalFeasts}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/50 dark:border-rose-900/30 flex items-center justify-between">
            <span className="font-semibold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
              <Lock className="w-3 h-3 text-rose-500" />
              <span>Closures / Leaves</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-black text-[11px]">
              {monthStats.totalClosures}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-900/30 flex items-center justify-between">
            <span className="font-semibold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
              <Edit3 className="w-3 h-3 text-blue-500" />
              <span>Custom Overrides</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white font-black text-[11px]">
              {monthStats.totalCustom}
            </span>
          </div>

          <div className="p-2.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-900/30 flex items-center justify-between">
            <span className="font-semibold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" />
              <span>Baseline Routine</span>
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-black text-[11px]">
              {monthStats.standardDays}
            </span>
          </div>
        </div>
      </div>

      {/* 2. VIEW 1: MONTHLY GRID MATRIX */}
      {activeView === 'month' && (
        <div className="bg-white/80 dark:bg-[#0f1715]/90 rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-200/80 dark:border-white/10 backdrop-blur-xl">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2 text-center">
            {DAY_HEADERS.map((h, i) => (
              <div
                key={h}
                className={`py-2 text-xs font-black uppercase tracking-wider rounded-xl ${
                  i === 5
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20'
                    : i === 0
                    ? 'text-amber-600 dark:text-amber-400 bg-amber-50/50 dark:bg-amber-950/20'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {h}
              </div>
            ))}
          </div>

          {/* Calendar Grid Cells */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            {calendarDays.map((cell) => {
              if (cell.isBlank) {
                return (
                  <div
                    key={cell.key}
                    className="min-h-[90px] sm:min-h-[115px] rounded-2xl bg-gray-50/40 dark:bg-white/[0.01] border border-dashed border-gray-200/40 dark:border-white/5 opacity-40"
                  />
                );
              }

              const { dateStr, dayNumber, isToday, isPast } = cell;
              const isSelected = selectedDate === dateStr;
              const effective = getEffectiveMenuForDate(dateStr, weeklyMenu, overrides);
              const ovr = overrides[dateStr];
              const isClosed = Boolean(effective.isClosed || effective.isArchived || effective.dayStatus === 'leave');
              const isFeast = Boolean(ovr?.occasion || effective.occasion || effective.dayStatus === 'event');
              const isFasting = Boolean(effective.dayStatus === 'fasting' || effective.fastingTitle);

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDateClick(dateStr)}
                  className={`min-h-[90px] sm:min-h-[115px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                    isSelected
                      ? 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-50/30 dark:bg-purple-950/20'
                      : isToday
                      ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/10'
                      : isClosed
                      ? 'border-rose-200 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/10 hover:border-rose-400'
                      : isFeast
                      ? 'border-purple-200 dark:border-purple-900/30 bg-purple-50/20 dark:bg-purple-950/10 hover:border-purple-400'
                      : 'border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-[#121c19]/50 hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  {/* Top Bar: Date Number + Indicators */}
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs sm:text-sm font-black w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-emerald-500 text-white'
                          : isSelected
                          ? 'bg-purple-600 text-white'
                          : isPast
                          ? 'text-gray-400 dark:text-gray-500'
                          : 'text-gray-900 dark:text-white'
                      }`}
                    >
                      {dayNumber}
                    </span>

                    <div className="flex items-center gap-1">
                      {isFeast && (
                        <span className="w-2 h-2 rounded-full bg-purple-500 shadow-xs shadow-purple-500/50" title="Special Feast" />
                      )}
                      {isClosed && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shadow-xs shadow-rose-500/50" title="Canteen Closed / Leave" />
                      )}
                      {ovr && !isFeast && !isClosed && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 shadow-xs shadow-blue-500/50" title="Custom Menu Override" />
                      )}
                    </div>
                  </div>

                  {/* Middle: Dish summary or status badge */}
                  <div className="my-1 space-y-1">
                    {isClosed ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-800 text-[10px] font-bold block truncate">
                        {effective.closureReason || 'Closed'}
                      </span>
                    ) : isFeast ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 text-[10px] font-black block truncate">
                        {effective.occasion || 'Feast'}
                      </span>
                    ) : isFasting ? (
                      <span className="px-1.5 py-0.5 rounded-md bg-cyan-100 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-800 text-[10px] font-bold block truncate">
                        {effective.fastingTitle || 'Fasting'}
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 block truncate">
                        {effective.lunch?.title || effective.breakfast?.title || 'Standard Routine'}
                      </span>
                    )}
                  </div>

                  {/* Bottom: 4 Slot Dots (B, L, E, D) */}
                  <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-white/5">
                    {['breakfast', 'lunch', 'evening', 'dinner'].map((slotKey) => {
                      const slot = effective[slotKey] || {};
                      const hasDish = Boolean(slot.title || (Array.isArray(slot.items) && slot.items.length > 0));
                      const isSlotArchived = Boolean(slot.isArchived || slot.slotStatus === 'leave');
                      const isSpecialMeal = Boolean(slot.isSpecialMeal);

                      return (
                        <span
                          key={slotKey}
                          className={`w-2 h-2 rounded-full ${
                            isSlotArchived
                              ? 'bg-rose-400 opacity-40'
                              : isSpecialMeal
                              ? 'bg-purple-500 ring-1 ring-purple-300'
                              : hasDish
                              ? 'bg-emerald-500'
                              : 'bg-gray-200 dark:bg-white/10'
                          }`}
                          title={`${slotKey.toUpperCase()}: ${slot.title || (isSlotArchived ? 'Off' : 'Standard')}`}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. VIEW 2: WEEKLY SCHEDULE TIMELINE */}
      {activeView === 'week' && (
        <div className="bg-white/80 dark:bg-[#0f1715]/90 rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-200/80 dark:border-white/10 backdrop-blur-xl space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weekDates.map((dateStr) => {
              const dow = getDayOfWeekShort(dateStr);
              const effective = getEffectiveMenuForDate(dateStr, weeklyMenu, overrides);
              const ovr = overrides[dateStr];
              const isToday = dateStr === todayIST;
              const isSelected = selectedDate === dateStr;
              const isClosed = Boolean(effective.isClosed || effective.isArchived || effective.dayStatus === 'leave');

              return (
                <div
                  key={dateStr}
                  onClick={() => handleDateClick(dateStr)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                    isSelected
                      ? 'border-purple-500 ring-2 ring-purple-500/30 bg-purple-50/20 dark:bg-purple-950/20'
                      : isToday
                      ? 'border-emerald-500 ring-1 ring-emerald-500/30 bg-emerald-50/10 dark:bg-emerald-950/10'
                      : 'border-gray-200/80 dark:border-white/10 bg-white/50 dark:bg-[#121c19]/50 hover:border-gray-300'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/10">
                    <div>
                      <span className="text-xs font-black uppercase text-gray-500 block">
                        {DAY_SHORTS[dow]}
                      </span>
                      <span className="text-sm font-black text-gray-900 dark:text-white">
                        {formatFriendlyDate(dateStr, false)}
                      </span>
                    </div>
                    {ovr ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                        Custom
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400">
                        Routine
                      </span>
                    )}
                  </div>

                  {/* Day Status Notice */}
                  {isClosed && (
                    <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[10px] font-bold border border-rose-200 dark:border-rose-900/50">
                      Canteen Closed
                    </div>
                  )}

                  {effective.occasion && !isClosed && (
                    <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-[10px] font-black border border-purple-200 dark:border-purple-900/50 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-500 shrink-0" />
                      <span className="truncate">{effective.occasion}</span>
                    </div>
                  )}

                  {/* 4 Slots Overview in Column */}
                  <div className="space-y-2 flex-1">
                    {SLOT_CONFIGS.map((slot) => {
                      const slotData = effective[slot.key] || {};
                      const isArchived = Boolean(slotData.isArchived || slotData.slotStatus === 'leave');
                      const isSpecialMeal = Boolean(slotData.isSpecialMeal);
                      const Icon = slot.icon;

                      return (
                        <div
                          key={slot.key}
                          className={`p-2 rounded-xl border text-xs space-y-1 transition-colors ${
                            isArchived
                              ? 'bg-rose-50/30 dark:bg-rose-950/10 border-rose-200/50 dark:border-rose-900/20 opacity-50'
                              : isSpecialMeal
                              ? 'bg-purple-50/40 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800/40'
                              : 'bg-gray-50/70 dark:bg-white/5 border-gray-100 dark:border-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-[10px] text-gray-500 uppercase flex items-center gap-1">
                              <Icon className="w-2.5 h-2.5 text-emerald-500" />
                              <span>{slot.label}</span>
                            </span>
                            <span className="text-[9px] font-mono text-gray-400">
                              {slotData.timing || getCanonicalMealTiming(dow, slot.key)}
                            </span>
                          </div>

                          <div className="font-extrabold text-[11px] text-gray-900 dark:text-white truncate">
                            {isArchived ? (
                              <span className="text-rose-500 font-semibold italic">Leave / Off</span>
                            ) : (
                              slotData.title || (Array.isArray(slotData.items) ? slotData.items[0] : '—')
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. VIEW 3: SINGLE DAY INSPECTOR */}
      {activeView === 'day' && (
        <div className="bg-white/80 dark:bg-[#0f1715]/90 rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-200/80 dark:border-white/10 backdrop-blur-xl space-y-5">
          {/* Day Inspector Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-gray-200/80 dark:border-white/10">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  {DAY_NAMES[getDayOfWeekShort(selectedDate)]}
                </span>
                <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                  {formatFriendlyDate(selectedDate)}
                </h3>
                {overrides[selectedDate] && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700">
                    Custom Override Active
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {selectedDayData.occasion || 'Standard scheduled dining roster for students & teachers.'}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  if (onSelectDate) onSelectDate(selectedDate);
                }}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Open in Studio Canvas</span>
              </button>

              {overrides[selectedDate] && onDeleteOverride && (
                <button
                  type="button"
                  onClick={() => onDeleteOverride(selectedDate)}
                  className="px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Revert to Baseline</span>
                </button>
              )}
            </div>
          </div>

          {/* 4 Detailed Slots Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SLOT_CONFIGS.map((slot) => {
              const dow = getDayOfWeekShort(selectedDate);
              const current = selectedDayData[slot.key] || {};
              const isArchived = Boolean(current.isArchived || current.slotStatus === 'leave');
              const isSpecial = Boolean(current.isSpecialMeal);
              const Icon = slot.icon;

              return (
                <div
                  key={slot.key}
                  className={`p-4 rounded-2xl border space-y-3 transition-all ${
                    isArchived
                      ? 'border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10'
                      : isSpecial
                      ? 'border-purple-300 dark:border-purple-800/60 bg-purple-50/20 dark:bg-purple-950/10 ring-1 ring-purple-400/30'
                      : 'border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.02]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-black text-gray-900 dark:text-white">
                          {slot.label}
                        </h4>
                        <span className="text-[10px] text-gray-400 font-mono">
                          {current.timing || getCanonicalMealTiming(dow, slot.key)}
                        </span>
                      </div>
                    </div>

                    {isSpecial && (
                      <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 text-[10px] font-black uppercase flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                        <span>Special Meal</span>
                      </span>
                    )}

                    {isArchived && (
                      <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700 text-[10px] font-bold uppercase">
                        Suspended / Leave
                      </span>
                    )}
                  </div>

                  {/* Dish Title */}
                  <div>
                    <h5 className="text-base font-extrabold text-gray-900 dark:text-white">
                      {isArchived ? (
                        <span className="text-rose-500 font-semibold italic">No Meal Served</span>
                      ) : (
                        current.title || 'Standard Dish'
                      )}
                    </h5>
                    {isSpecial && current.specialSponsor && (
                      <p className="text-[11px] text-purple-700 dark:text-purple-300 font-medium mt-0.5">
                        Sponsored by: <span className="font-bold">{current.specialSponsor}</span>
                      </p>
                    )}
                  </div>

                  {/* Items list */}
                  {Array.isArray(current.items) && current.items.length > 0 && !isArchived && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {current.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-[11px] font-medium border border-gray-200/60 dark:border-white/5"
                        >
                          {it}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. VIEW 4: 12-MONTH ACADEMIC HEATMAP */}
      {activeView === 'year' && (
        <div className="bg-white/80 dark:bg-[#0f1715]/90 rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-200/80 dark:border-white/10 backdrop-blur-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/80 dark:border-white/10">
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                Academic Year Overview ({currentYear})
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                12-month bird&apos;s-eye view of all special feasts, holidays, and custom canteen schedules.
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-bold text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Special Feast</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Closure / Leave</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Custom Override</span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {MONTH_NAMES.map((monthName, mIdx) => {
              const daysInM = getMonthCalendarDays(currentYear, mIdx);

              return (
                <div
                  key={monthName}
                  className="p-3.5 rounded-2xl border border-gray-200/70 dark:border-white/10 bg-white/50 dark:bg-white/[0.01] space-y-2 hover:border-purple-300 dark:hover:border-purple-800/40 transition-colors"
                >
                  <div className="flex items-center justify-between pb-1 border-b border-gray-100 dark:border-white/5">
                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        setCurrentMonth(mIdx);
                        setActiveView('month');
                      }}
                      className="font-black text-xs text-gray-900 dark:text-white hover:text-purple-600 transition-colors text-left"
                    >
                      {monthName}
                    </button>
                    <span className="text-[10px] text-gray-400 font-mono">
                      {mIdx + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {DAY_HEADERS.map((h) => (
                      <span key={h} className="text-[8px] font-black text-gray-400 uppercase">
                        {h[0]}
                      </span>
                    ))}

                    {daysInM.map((c) => {
                      if (c.isBlank) {
                        return <span key={c.key} className="w-4 h-4" />;
                      }

                      const ovr = overrides[c.dateStr];
                      const isClosed = Boolean(ovr?.isClosed || ovr?.isHoliday || ovr?.dayStatus === 'leave');
                      const isFeast = Boolean(ovr?.occasion || ovr?.dayStatus === 'event');
                      const isToday = c.dateStr === todayIST;

                      return (
                        <button
                          key={c.dateStr}
                          type="button"
                          onClick={() => {
                            feedback('tick');
                            setSelectedDate(c.dateStr);
                            setCurrentMonth(mIdx);
                            setActiveView('day');
                            if (onSelectDate) onSelectDate(c.dateStr);
                          }}
                          className={`w-4 h-4 sm:w-5 sm:h-5 text-[9px] font-bold rounded-md flex items-center justify-center transition-all ${
                            isToday
                              ? 'bg-emerald-500 text-white font-black'
                              : isFeast
                              ? 'bg-purple-600 text-white font-black'
                              : isClosed
                              ? 'bg-rose-500 text-white font-black'
                              : ovr
                              ? 'bg-blue-500 text-white'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                          }`}
                          title={`${c.dateStr}${ovr ? ` (${ovr.occasion || 'Custom'})` : ''}`}
                        >
                          {c.dayNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 6. VIEW 5: LIST VIEW (FILTERABLE OVERRIDES LOG) */}
      {activeView === 'list' && (
        <div className="bg-white/80 dark:bg-[#0f1715]/90 rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-200/80 dark:border-white/10 backdrop-blur-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-gray-200/80 dark:border-white/10">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search by occasion or dish name..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121c19] text-xs font-bold text-gray-900 dark:text-white"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/50 dark:border-white/5">
              {[
                { id: 'all', label: 'All' },
                { id: 'feasts', label: 'Feasts' },
                { id: 'closed', label: 'Closures' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === f.id
                      ? 'bg-white dark:bg-[#192420] text-purple-600 dark:text-purple-400 shadow-xs'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {filteredOverridesList.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <Calendar className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto" />
              <p className="text-xs font-bold text-gray-500">
                No custom date overrides match the filter.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/5">
              {filteredOverridesList.map((item) => {
                const dow = getDayOfWeekShort(item.dateStr);
                const isClosed = Boolean(item.isClosed || item.isHoliday || item.dayStatus === 'leave');

                return (
                  <div
                    key={item.dateStr}
                    className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.01] px-2 rounded-xl transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-center min-w-[50px] p-2 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/50 dark:border-purple-800/40">
                        <span className="text-[10px] font-black uppercase text-purple-600 block">
                          {DAY_SHORTS[dow]}
                        </span>
                        <span className="text-xs font-black text-gray-900 dark:text-white">
                          {item.dateStr.split('-')[2]}
                        </span>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-gray-900 dark:text-white">
                            {formatFriendlyDate(item.dateStr)}
                          </h4>
                          {isClosed ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                              Closed
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                              {item.occasion || 'Feast'}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Lunch: <span className="font-semibold text-gray-800 dark:text-gray-200">{item.lunch?.title || 'Standard'}</span> • Dinner: <span className="font-semibold text-gray-800 dark:text-gray-200">{item.dinner?.title || 'Standard'}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          feedback('pop');
                          if (onSelectDate) onSelectDate(item.dateStr);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-colors"
                      >
                        Edit
                      </button>
                      {onDeleteOverride && (
                        <button
                          type="button"
                          onClick={() => onDeleteOverride(item.dateStr)}
                          className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Delete Override"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
