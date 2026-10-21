import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Sparkles,
  Layers,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Coffee,
  Utensils,
  Plus,
  Trash2,
  CalendarDays,
  List,
  LayoutGrid,
  Bookmark,
  Plane,
  Clock,
  History,
  ShieldCheck,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';
import { dialog } from '../../utils/dialog';
import { useTokenLockStatus } from '../../utils/useTokenLockStatus';
import DateTokenButton from './DateTokenButton';
import StudentTemplateModal from './StudentTemplateModal';
import DateTurnModal from './DateTurnModal';
import DateHistoryDetailModal from './DateHistoryDetailModal';
import {
  addDaysToDate,
  getMonthCalendarDays,
  calculateEffectiveDateMeals,
  calculateMonthStats,
  applyDateRangeException,
  removeDateException,
  formatFriendlyDate,
} from '../../utils/studentExceptionService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DateGridMatrix({
  student,
  onSaveExceptions,
  onSaveTemplates,
  editable = true,
  className = '',
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const { getDateLockStatus, isTomorrowLocked, tomorrowIST, todayIST, endTime } = useTokenLockStatus();
  const maxDate = useMemo(() => addDaysToDate(todayIST, 365), [todayIST]); // Full 1-year academic calendar

  // Two Separate Toggles: 'breakfast' vs 'lunch' (just like in the Home page)
  const [activeMeal, setActiveMeal] = useState('breakfast');

  // Initial month view from today's IST date
  const [currentYear, setCurrentYear] = useState(() => {
    const [y] = todayIST.split('-').map(Number);
    return y;
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [, m] = todayIST.split('-').map(Number);
    return m - 1; // 0-indexed
  });

  // Active view: 'grid' or 'list'
  const [activeView, setActiveView] = useState('grid');
  const [activeListTab, setActiveListTab] = useState('upcoming'); // 'upcoming' | 'history'

  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);

  // Range Leave / Date Turn Modal state
  const [showTurnModal, setShowTurnModal] = useState(false);
  const [selectedModalDate, setSelectedModalDate] = useState(null);

  // Historical Record Details Modal state
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryDate, setSelectedHistoryDate] = useState(null);
  const [selectedHistoryMeals, setSelectedHistoryMeals] = useState(null);

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
  };

  // Calendar days array for current month
  const calendarDays = useMemo(() => {
    return getMonthCalendarDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Dynamic counts for the currently viewed month + overall scheduled count
  const stats = useMemo(() => {
    const monthStats = calculateMonthStats(student, currentYear, currentMonth);
    const dateExceptions = student?.dateExceptions || {};
    const scheduledCount = Object.keys(dateExceptions).length;

    return {
      activeLunchDays: monthStats.activeLunchDays,
      activeBreakfastDays: monthStats.activeBreakfastDays,
      monthOverridesCount: monthStats.monthOverridesCount,
      scheduledCount,
      totalDays: monthStats.totalDays,
      pastDaysCount: monthStats.pastDaysCount || 0,
      pastLunchesTaken: monthStats.pastLunchesTaken || 0,
      pastBreakfastsTaken: monthStats.pastBreakfastsTaken || 0,
      pastLeavesCount: monthStats.pastLeavesCount || 0,
      upcomingDaysCount: monthStats.upcomingDaysCount || 0,
      upcomingLunchesScheduled: monthStats.upcomingLunchesScheduled || 0,
      upcomingBreakfastsScheduled: monthStats.upcomingBreakfastsScheduled || 0,
      isFullyPastMonth: Boolean(monthStats.isFullyPastMonth),
    };
  }, [student, currentYear, currentMonth]);

  // Click handler to inspect past day's historical ledger record
  const handleHistoryClick = (dateStr) => {
    feedback('tick');
    const meals = calculateEffectiveDateMeals(student, dateStr);
    setSelectedHistoryDate(dateStr);
    setSelectedHistoryMeals(meals);
    setShowHistoryModal(true);
  };

  // Day of week column headers
  const dayHeaders = useMemo(() => [
    { key: 'su', label: t('days.su', 'Sun') },
    { key: 'mo', label: t('days.mo', 'Mon') },
    { key: 'tu', label: t('days.tu', 'Tue') },
    { key: 'we', label: t('days.we', 'Wed') },
    { key: 'th', label: t('days.th', 'Thu') },
    { key: 'fr', label: t('days.fr', 'Fri') },
    { key: 'sa', label: t('days.sa', 'Sat') },
  ], [t]);

  // ================= 1. SINGLE CLICK TO TURN ON AND OFF =================
  const handleSingleClickToggle = (dateStr) => {
    if (!editable) return;

    const lockInfo = getDateLockStatus(dateStr);
    if (lockInfo.isLocked) {
      feedback('warning');
      dialog.toast.warning(
        dateStr === tomorrowIST ? "Tomorrow's Meals are Locked" : 'Date is Locked',
        lockInfo.reason || 'Updates for this date are closed.'
      );
      return;
    }

    feedback('pop');

    const meals = calculateEffectiveDateMeals(student, dateStr);
    const existing = student?.dateExceptions || {};

    let nextBreakfast = meals.breakfast;
    let nextLunch = meals.lunch;

    if (activeMeal === 'lunch') {
      nextLunch = !meals.lunch;
    } else {
      nextBreakfast = !meals.breakfast;
    }

    // Check if the new state matches normal weekly routine
    const isRoutineBf = meals.routineBreakfast;
    const isRoutineLunch = meals.routineLunch;

    let updated = { ...existing };
    if (nextBreakfast === isRoutineBf && nextLunch === isRoutineLunch) {
      // Reverted to standard routine: clean up exception key
      delete updated[dateStr];
    } else {
      // Store new exception
      updated[dateStr] = {
        breakfast: nextBreakfast,
        lunch: nextLunch,
        label: activeMeal === 'lunch'
          ? (nextLunch ? 'Lunch ON' : 'Lunch OFF')
          : (nextBreakfast ? 'Breakfast ON' : 'Breakfast OFF'),
      };
    }

    if (onSaveExceptions) {
      onSaveExceptions(updated);
    }
  };

  // ================= 2. WEEKEND RULE =================
  // Rule: Friday - breakfast and lunch, Saturday breakfast
  const handleQuickTurnWeekendOff = (allMonth = false) => {
    feedback('pop');
    const [y, m, d] = todayIST.split('-').map(Number);
    const todayObj = new Date(y, m - 1, d);
    const dayOfWeek = todayObj.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday

    const updated = { ...(student?.dateExceptions || {}) };
    const iterations = allMonth ? 5 : 1;

    for (let i = 0; i < iterations; i++) {
      let daysUntilFriday = (5 - dayOfWeek + 7) % 7 + (i * 7);
      if (daysUntilFriday === 0 && todayIST > addDaysToDate(todayIST, 0)) daysUntilFriday = 7;

      const friDate = addDaysToDate(todayIST, daysUntilFriday);
      const satDate = addDaysToDate(todayIST, daysUntilFriday + 1);

      if (friDate <= maxDate && !getDateLockStatus(friDate).isLocked) {
        // Friday: breakfast and lunch OFF
        updated[friDate] = {
          breakfast: false,
          lunch: false,
          label: 'Weekend Leave (Fri)',
        };
      }
      if (satDate <= maxDate && !getDateLockStatus(satDate).isLocked) {
        // Saturday: breakfast OFF (Saturday lunch remains active as per routine)
        const currentSatLunch = student?.obj?.lunch?.sa !== undefined ? Boolean(student.obj.lunch.sa) : true;
        updated[satDate] = {
          breakfast: false,
          lunch: currentSatLunch,
          label: 'Weekend Leave (Sat Bf)',
        };
      }
    }

    if (onSaveExceptions) {
      onSaveExceptions(updated);
    }
  };

  // Turn all upcoming dates ON for the active meal (skips locked dates)
  const handleTurnAllActiveMealOn = () => {
    feedback('pop');
    const updated = { ...(student?.dateExceptions || {}) };
    for (let i = 0; i <= 30; i++) {
      const d = addDaysToDate(todayIST, i);
      if (getDateLockStatus(d).isLocked) continue; // Respect cutoff lock for tomorrow or past
      const meals = calculateEffectiveDateMeals(student, d);
      updated[d] = {
        breakfast: activeMeal === 'breakfast' ? true : meals.breakfast,
        lunch: activeMeal === 'lunch' ? true : meals.lunch,
        label: `${activeMeal === 'lunch' ? 'Lunch' : 'Breakfast'} ON`,
      };
    }
    if (onSaveExceptions) onSaveExceptions(updated);
  };

  // Turn all upcoming dates OFF for the active meal (skips locked dates)
  const handleTurnAllActiveMealOff = () => {
    feedback('pop');
    const updated = { ...(student?.dateExceptions || {}) };
    for (let i = 0; i <= 30; i++) {
      const d = addDaysToDate(todayIST, i);
      if (getDateLockStatus(d).isLocked) continue; // Respect cutoff lock for tomorrow or past
      const meals = calculateEffectiveDateMeals(student, d);
      updated[d] = {
        breakfast: activeMeal === 'breakfast' ? false : meals.breakfast,
        lunch: activeMeal === 'lunch' ? false : meals.lunch,
        label: `${activeMeal === 'lunch' ? 'Lunch' : 'Breakfast'} OFF`,
      };
    }
    if (onSaveExceptions) onSaveExceptions(updated);
  };

  // Reset exceptions while preserving locked dates
  const handleClearAllExceptions = () => {
    feedback('warning');
    const existing = student?.dateExceptions || {};
    const preserved = {};
    Object.keys(existing).forEach((d) => {
      if (getDateLockStatus(d).isLocked) {
        preserved[d] = existing[d];
      }
    });
    if (onSaveExceptions) onSaveExceptions(preserved);
  };

  // Custom Template Handlers
  const handleSaveCustomTemplate = (newTpl) => {
    const existing = student?.templates || [];
    const updated = [...existing, newTpl];
    if (onSaveTemplates) onSaveTemplates(updated);
  };

  const handleDeleteCustomTemplate = (tplId) => {
    const existing = student?.templates || [];
    const updated = existing.filter((t) => t.id !== tplId);
    if (onSaveTemplates) onSaveTemplates(updated);
  };

  const sortedExceptionDates = useMemo(() => {
    const exc = student?.dateExceptions || {};
    return Object.keys(exc).sort();
  }, [student?.dateExceptions]);

  // Multi-day Range Override handler
  const handleApplyDateRange = (startDate, endDate, mealSettings) => {
    feedback('success');
    const existing = student?.dateExceptions || {};
    const updated = applyDateRangeException(existing, startDate, endDate, mealSettings);
    if (onSaveExceptions) {
      onSaveExceptions(updated);
    }
  };

  // Single Exception handler from Modal
  const handleSaveSingleException = (dateStr, mealSettings) => {
    feedback('success');
    const meals = calculateEffectiveDateMeals(student, dateStr);
    const isRoutineBf = meals.routineBreakfast;
    const isRoutineLunch = meals.routineLunch;

    let updated = { ...(student?.dateExceptions || {}) };
    if (mealSettings.breakfast === isRoutineBf && mealSettings.lunch === isRoutineLunch) {
      delete updated[dateStr];
    } else {
      updated[dateStr] = {
        breakfast: mealSettings.breakfast,
        lunch: mealSettings.lunch,
        label: mealSettings.label || (activeMeal === 'lunch' ? 'Lunch Override' : 'Breakfast Override'),
      };
    }
    if (onSaveExceptions) {
      onSaveExceptions(updated);
    }
  };

  const handleRemoveSingleException = (dateStr) => {
    feedback('warning');
    const updated = removeDateException(student?.dateExceptions || {}, dateStr);
    if (onSaveExceptions) {
      onSaveExceptions(updated);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* ================= HEADER CONTROLS ================= */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 xs:gap-4 p-3.5 xs:p-4 sm:p-5 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        
        {/* ROW 1: TWO SEPARATE TOGGLES (BREAKFAST vs LUNCH) */}
        <div className="flex items-center gap-2 xs:gap-3 flex-wrap w-full sm:w-auto">
          <div className="flex p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 relative w-full sm:w-auto">
            {/* Breakfast Toggle */}
            <button
              type="button"
              onClick={() => {
                feedback('pop');
                setActiveMeal('breakfast');
              }}
              className={`relative flex items-center justify-center gap-1.5 xs:gap-2 px-3.5 xs:px-5 py-2 xs:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 flex-1 sm:flex-none ${
                activeMeal === 'breakfast'
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {activeMeal === 'breakfast' && (
                <motion.div
                  layoutId="activeDateGridMealPill"
                  className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Coffee className="w-3.5 h-3.5 xs:w-4 xs:h-4 relative z-10 flex-shrink-0" />
              <span className="relative z-10">{t('navBreakfast') || 'Breakfast'}</span>
              <span className="relative z-10 px-1.5 xs:px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-mono font-bold">
                {stats.activeBreakfastDays} ON
              </span>
            </button>

            {/* Lunch Toggle */}
            <button
              type="button"
              onClick={() => {
                feedback('pop');
                setActiveMeal('lunch');
              }}
              className={`relative flex items-center justify-center gap-1.5 xs:gap-2 px-3.5 xs:px-5 py-2 xs:py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 flex-1 sm:flex-none ${
                activeMeal === 'lunch'
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {activeMeal === 'lunch' && (
                <motion.div
                  layoutId="activeDateGridMealPill"
                  className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Utensils className="w-3.5 h-3.5 xs:w-4 xs:h-4 relative z-10 flex-shrink-0" />
              <span className="relative z-10">{t('navLunch') || 'Lunch'}</span>
              <span className="relative z-10 px-1.5 xs:px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-mono font-bold">
                {stats.activeLunchDays} ON
              </span>
            </button>
          </div>

          <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 hidden sm:inline">
            👉 {t('singleClickToggleHelper', 'Single-click any date below to toggle')} <strong>{activeMeal === 'lunch' ? (t('navLunch') || 'Lunch') : (t('navBreakfast') || 'Breakfast')}</strong>
          </span>
        </div>

        {/* ROW 2: MONTH NAVIGATION & TEMPLATES BUTTON */}
        <div className="flex items-center gap-2 xs:gap-2.5 flex-wrap justify-between lg:justify-end w-full lg:w-auto">
          
          {/* Month Switcher */}
          <div className="flex items-center gap-1 xs:gap-1.5 p-1 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white min-w-[110px] xs:min-w-[125px] text-center px-1">
              {t(`monthsFull.${currentMonth}`, MONTH_NAMES[currentMonth])} {currentYear}
            </span>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleJumpToToday}
              className="px-2 py-1 text-[10px] font-bold rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors"
            >
              {t('todayBtn', 'Today')}
            </button>
          </div>

          {/* Templates Launcher Button */}
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              setShowTemplateModal(true);
            }}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-purple-500/20 active:scale-95 transition-all flex items-center gap-1.5"
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>{t('templatesBtn', 'Templates')}</span>
            {(student?.templates?.length > 0 || stats.scheduledCount > 0) && (
              <span className="w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
            )}
          </button>

          {/* View Mode Toggle: Grid vs List */}
          <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setActiveView('grid');
              }}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'grid'
                  ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
              }`}
              title={t('calendarGridView', 'Calendar Grid View')}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setActiveView('list');
              }}
              className={`p-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeView === 'list'
                  ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
              }`}
              title={t('scheduledOverridesList', 'Scheduled Overrides List')}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ROW 3: BIFURCATED MONTHLY STATS STRIP (HISTORY VS UPCOMING) */}
        <div className="w-full pt-3 mt-1 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2.5 flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {stats.pastDaysCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 font-bold">
                <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <span>
                  {t(`monthsFull.${currentMonth}`, MONTH_NAMES[currentMonth])} {t('historyPrefix', 'History')}: <strong>{stats.pastBreakfastsTaken} Bf</strong> • <strong>{stats.pastLunchesTaken} Lu</strong> {t('takenSuffix', 'Taken')}
                  {stats.pastLeavesCount > 0 && (
                    <span className="text-rose-600 dark:text-rose-400 ml-1">({stats.pastLeavesCount} {t('leaveDaysCount', 'leave days')})</span>
                  )}
                </span>
              </div>
            )}

            {stats.upcomingDaysCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-800 dark:text-blue-300 font-bold">
                <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <span>
                  {t('upcomingPrefix', 'Upcoming')}: <strong>{stats.upcomingBreakfastsScheduled} Bf</strong> • <strong>{stats.upcomingLunchesScheduled} Lu</strong> {t('scheduledSuffix', 'Scheduled')}
                </span>
              </div>
            )}
          </div>

          <span className="text-[11px] text-gray-400 dark:text-gray-500 hidden md:inline">
            {t('pastRecordClickHint', '💡 Click any past date to inspect archived dining record')}
          </span>
        </div>
      </div>

      {/* ================= ARCHIVED MONTH BANNER ================= */}
      {stats.isFullyPastMonth && (
        <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                {t('archivedLedgerTitle', 'Archived Dining Ledger for')} {t(`monthsFull.${currentMonth}`, MONTH_NAMES[currentMonth])} {currentYear}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {t('archivedLedgerDesc', 'All {totalDays} days in this month are finalized and locked for mess billing integrity. Attended: {breakfasts} Breakfasts, {lunches} Lunches.')
                  .replace('{totalDays}', stats.totalDays)
                  .replace('{breakfasts}', stats.pastBreakfastsTaken)
                  .replace('{lunches}', stats.pastLunchesTaken)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all self-start sm:self-center flex-shrink-0"
          >
            {t('backToCurrentMonth', 'Back to Current Month')}
          </button>
        </div>
      )}

      {/* ================= QUICK SHORTCUTS STRIP (WITH WEEKEND RULE & RANGE TOOL) ================= */}
      {editable && !stats.isFullyPastMonth && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider flex-shrink-0">
            {t('fastActions', 'Fast Action:')}
          </span>

          {/* Multi-Day Leave / Date Range Modal Launcher */}
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              setSelectedModalDate(todayIST);
              setShowTurnModal(true);
            }}
            className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/40 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-500/20 transition-all flex-shrink-0 active:scale-95 flex items-center gap-1.5"
            title="Book leave or set overrides across multiple consecutive dates"
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{t('customRangeLeave', 'Schedule Leave / Date Range')}</span>
          </button>

          {/* Weekend: Friday -breakfast and lunch, Saturday breakfast */}
          <button
            type="button"
            onClick={() => handleQuickTurnWeekendOff(false)}
            className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200/60 dark:border-purple-500/20 transition-all flex-shrink-0 active:scale-95 flex items-center gap-1.5"
            title="Turns OFF Friday Breakfast & Lunch, and Saturday Breakfast (Lunch stays ON)"
          >
            <Plane className="w-3.5 h-3.5" />
            <span>{t('turnWeekendOffDesc', 'Turn Weekend OFF (Fri Bf/Lu + Sat Bf)')}</span>
          </button>

          <button
            type="button"
            onClick={handleTurnAllActiveMealOn}
            className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-500/20 transition-all flex-shrink-0 active:scale-95"
          >
            🟢 {t('turnAllMealOn', 'Turn All {meal} ON').replace('{meal}', activeMeal === 'lunch' ? (t('navLunch') || 'Lunch') : (t('navBreakfast') || 'Breakfast'))}
          </button>

          <button
            type="button"
            onClick={handleTurnAllActiveMealOff}
            className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-500/20 transition-all flex-shrink-0 active:scale-95"
          >
            🔴 {t('turnAllMealOff', 'Turn All {meal} OFF').replace('{meal}', activeMeal === 'lunch' ? (t('navLunch') || 'Lunch') : (t('navBreakfast') || 'Breakfast'))}
          </button>

          {sortedExceptionDates.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllExceptions}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-rose-100 text-gray-700 hover:text-rose-600 dark:bg-white/5 dark:hover:bg-rose-950/40 dark:hover:text-rose-300 border border-gray-200/60 dark:border-white/5 transition-all flex-shrink-0 active:scale-95 ml-auto"
            >
              🔄 {t('resetRoutine', 'Reset Routine')} ({sortedExceptionDates.length})
            </button>
          )}
        </div>
      )}

      {/* ================= VIEW 1: TACTILE DATE TOKEN GRID (SINGLE CLICK TURNING) ================= */}
      {activeView === 'grid' ? (
        <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 p-3 sm:p-6 shadow-sm backdrop-blur-xl space-y-3">
          
          {/* Day of Week Column Headers */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5 text-center">
            {dayHeaders.map((dh) => (
              <span
                key={dh.key}
                className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
              >
                {dh.label}
              </span>
            ))}
          </div>

          {/* 7-Column Token Cells Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2.5">
            {calendarDays.map((day) => {
              if (day.isBlank) {
                return (
                  <div
                    key={day.key}
                    className="w-full aspect-square rounded-2xl bg-gray-50/30 dark:bg-white/[0.01] pointer-events-none"
                  />
                );
              }

              const meals = calculateEffectiveDateMeals(student, day.dateStr);
              const lockInfo = getDateLockStatus(day.dateStr);

              return (
                <DateTokenButton
                  key={day.key}
                  dateStr={day.dateStr}
                  dayNumber={day.dayNumber}
                  dayOfWeek={day.dayOfWeek}
                  isToday={day.isToday}
                  isTomorrow={day.dateStr === tomorrowIST}
                  isPast={day.isPast}
                  isBeyondMax={day.isBeyondMax}
                  isBookable={day.isBookable && !lockInfo.isLocked}
                  isLocked={lockInfo.isLocked}
                  lockReason={lockInfo.reason}
                  breakfast={meals.breakfast}
                  lunch={meals.lunch}
                  activeMeal={activeMeal}
                  hasException={meals.hasException}
                  exceptionLabel={meals.label}
                  onClick={handleSingleClickToggle}
                  onHistoryClick={handleHistoryClick}
                  onLockedClick={(d, reason) => {
                    feedback('warning');
                    dialog.toast.warning(
                      d === tomorrowIST ? "Tomorrow's Meals are Locked" : 'Date is Locked',
                      reason || 'Updates for this date are closed.'
                    );
                  }}
                />
              );
            })}
          </div>

          {/* Interactive Hint & Visual Status Indicator */}
          <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px] sm:text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${activeMeal === 'lunch' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                {activeMeal === 'lunch' ? `${t('navLunch') || 'Lunch'} ON` : `${t('navBreakfast') || 'Breakfast'} ON`}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                {activeMeal === 'lunch' ? `${t('navLunch') || 'Lunch'} OFF` : `${t('navBreakfast') || 'Breakfast'} OFF`}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 border border-amber-600" />
                {t('customOverride', 'Custom Override')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-black/40 text-amber-300 border border-amber-500/40 flex items-center justify-center text-[7px] font-mono">🔒</span>
                {t('lockedCutoff', 'Locked (Cutoff)')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-400 flex items-center justify-center text-[7px] font-mono">🕒</span>
                {t('archivedHistory', 'Archived History (Click to view)')}
              </span>
            </div>
            <span className="font-bold text-gray-600 dark:text-gray-300">
              ⚡ {t('singleClickTurnsMeal', '1-Click turns {meal} on/off directly').replace('{meal}', (activeMeal === 'lunch' ? (t('navLunch') || 'Lunch') : (t('navBreakfast') || 'Breakfast')).toUpperCase())}
            </span>
          </div>
        </div>
      ) : (
        /* ================= VIEW 2: SCHEDULED OVERRIDES LIST ================= */
        <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 p-4 sm:p-6 shadow-sm backdrop-blur-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-500" />
              <span>{t('dateOverridesAndLedger', 'Date Overrides & Dining Ledger')}</span>
            </h4>

            {/* List View Tabs: Upcoming vs Past History */}
            <div className="flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 text-xs font-bold self-start sm:self-center">
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setActiveListTab('upcoming');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeListTab === 'upcoming'
                    ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('upcomingOverridesTab', 'Upcoming Overrides')} ({sortedExceptionDates.filter((d) => d >= todayIST).length})
              </button>
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setActiveListTab('history');
                }}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  activeListTab === 'history'
                    ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {t('pastLeavesLedgerTab', 'Past Leaves & Ledger')} ({sortedExceptionDates.filter((d) => d < todayIST).length})
              </button>
            </div>
          </div>

          {activeListTab === 'upcoming' ? (
            /* Tab A: Upcoming Overrides */
            (() => {
              const upcomingDates = sortedExceptionDates.filter((d) => d >= todayIST);
              if (upcomingDates.length === 0) {
                return (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <Calendar className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                      {t('noUpcomingOverrides', 'No upcoming date exceptions scheduled.')}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {t('standardWeeklyRoutineApplies', 'Your standard weekly dining routine will apply every day. Click any day in Grid View to toggle.')}
                    </p>
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {upcomingDates.map((dateKey) => {
                    const exc = student?.dateExceptions?.[dateKey];
                    const isBfOn = Boolean(exc?.breakfast);
                    const isLuOn = Boolean(exc?.lunch);

                    return (
                      <div
                        key={dateKey}
                        className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-gray-900 dark:text-white">
                              {formatFriendlyDate(dateKey, true)}
                            </span>
                            {dateKey === todayIST && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-600">
                                {t('today', 'Today')}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 block font-mono">
                            {dateKey} {exc?.label ? `• ${exc.label}` : ''}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => {
                                feedback('pop');
                                const updated = {
                                  ...(student?.dateExceptions || {}),
                                  [dateKey]: { ...exc, breakfast: !isBfOn },
                                };
                                if (onSaveExceptions) onSaveExceptions(updated);
                              }}
                              className={`px-2 py-0.5 rounded-md transition-colors ${
                                isBfOn
                                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              ☕ Bf: {isBfOn ? 'ON' : 'OFF'}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                feedback('pop');
                                const updated = {
                                  ...(student?.dateExceptions || {}),
                                  [dateKey]: { ...exc, lunch: !isLuOn },
                                };
                                if (onSaveExceptions) onSaveExceptions(updated);
                              }}
                              className={`px-2 py-0.5 rounded-md transition-colors ${
                                isLuOn
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              🍲 Lunch: {isLuOn ? 'ON' : 'OFF'}
                            </button>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              feedback('tick');
                              setSelectedModalDate(dateKey);
                              setShowTurnModal(true);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                            title="Edit override settings & reason"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              feedback('warning');
                              const updated = removeDateException(student?.dateExceptions || {}, dateKey);
                              if (onSaveExceptions) onSaveExceptions(updated);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Remove override"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          ) : (
            /* Tab B: Past Leaves & History Ledger */
            (() => {
              const pastDates = sortedExceptionDates.filter((d) => d < todayIST).reverse();
              if (pastDates.length === 0) {
                return (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <ShieldCheck className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                      {t('noCustomPastOverrides', 'No custom past overrides recorded.')}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      {t('standardWeeklyRoutineFollowed', 'Standard weekly routine was followed for past dates. Click any past day in Grid View to inspect individual records.')}
                    </p>
                  </div>
                );
              }
              return (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {pastDates.map((dateKey) => {
                    const exc = student?.dateExceptions?.[dateKey];
                    const isBfOn = Boolean(exc?.breakfast);
                    const isLuOn = Boolean(exc?.lunch);

                    return (
                      <div
                        key={dateKey}
                        className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200/70 dark:border-white/5 flex items-center justify-between gap-2"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-black text-gray-900 dark:text-white">
                              {formatFriendlyDate(dateKey, true)}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[8px] font-black uppercase bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400 font-mono">
                              {t('archived', 'Archived')}
                            </span>
                          </div>
                          <span className="text-[10px] text-gray-400 block font-mono">
                            {dateKey} {exc?.label ? `• ${exc.label}` : ''}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold">
                            <span className={`px-2 py-0.5 rounded-md ${
                              isBfOn
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                            }`}>
                              ☕ Bf: {isBfOn ? 'ON' : 'OFF'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md ${
                              isLuOn
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                            }`}>
                              🍲 Lunch: {isLuOn ? 'ON' : 'OFF'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleHistoryClick(dateKey)}
                          className="px-2.5 py-1.5 rounded-xl bg-gray-100 hover:bg-emerald-500 hover:text-white dark:bg-white/5 dark:hover:bg-emerald-600 text-gray-600 dark:text-gray-300 text-[10px] font-bold transition-all shadow-xs flex items-center gap-1 flex-shrink-0"
                          title={t('inspectHistoricalBreakdown', 'Inspect historical breakdown')}
                        >
                          <Clock className="w-3 h-3" />
                          <span>{t('view', 'View')}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* ================= MULTI-DAY RANGE & SINGLE DATE TURN MODAL ================= */}
      <AnimatePresence>
        {showTurnModal && (
          <DateTurnModal
            isOpen={showTurnModal}
            onClose={() => setShowTurnModal(false)}
            dateStr={selectedModalDate || todayIST}
            student={student}
            onSaveException={handleSaveSingleException}
            onRemoveException={handleRemoveSingleException}
            onApplyRange={handleApplyDateRange}
          />
        )}
      </AnimatePresence>

      {/* ================= STUDENT TEMPLATES MODAL (REQUIREMENT 3) ================= */}
      <AnimatePresence>
        {showTemplateModal && (
          <StudentTemplateModal
            isOpen={showTemplateModal}
            onClose={() => setShowTemplateModal(false)}
            student={student}
            onApplyTemplate={(newExceptions, message) => {
              if (onSaveExceptions) onSaveExceptions(newExceptions);
            }}
            onSaveCustomTemplate={handleSaveCustomTemplate}
            onDeleteCustomTemplate={handleDeleteCustomTemplate}
          />
        )}
      </AnimatePresence>

      {/* ================= HISTORICAL RECORD DETAILS MODAL ================= */}
      <AnimatePresence>
        {showHistoryModal && (
          <DateHistoryDetailModal
            isOpen={showHistoryModal}
            onClose={() => setShowHistoryModal(false)}
            dateStr={selectedHistoryDate}
            meals={selectedHistoryMeals}
            student={student}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

