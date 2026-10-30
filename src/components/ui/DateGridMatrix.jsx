import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  Lock,
  Zap,
  X,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';
import { dialog } from '../../utils/dialog';
import { useTokenLockStatus } from '../../utils/useTokenLockStatus';
import DiningCalendarHeader from './calendar/DiningCalendarHeader';
import SchedulePatternModal from './calendar/SchedulePatternModal';
import MultiDateActionBar from './calendar/MultiDateActionBar';
import MonthlyGridView from './calendar/views/MonthlyGridView';
import WeeklyStripView from './calendar/views/WeeklyStripView';
import DailyFocusView from './calendar/views/DailyFocusView';
import YearlyOverviewView from './calendar/views/YearlyOverviewView';
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
  getDayOfWeekShort,
} from '../../utils/studentExceptionService';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function DateGridMatrix({
  student,
  onSaveExceptions,
  onUpdateRoutine,
  onSaveTemplates,
  editable = true,
  isAdmin = false,
  className = '',
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const { getDateLockStatus, isTomorrowLocked, tomorrowIST, todayIST, endTime } = useTokenLockStatus();
  const maxDate = useMemo(() => addDaysToDate(todayIST, 365), [todayIST]); // Full 1-year academic calendar

  // Meal segmented filter in month view: 'both' | 'breakfast' | 'lunch'
  const [mobileMealTab, setMobileMealTab] = useState('both');

  // Initial month view from today's IST date
  const [currentYear, setCurrentYear] = useState(() => {
    const [y] = todayIST.split('-').map(Number);
    return y;
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const [, m] = todayIST.split('-').map(Number);
    return m - 1; // 0-indexed
  });

  // Active view: 'month' (default) | 'week' | 'day' | 'year' | 'list' (supports legacy 'grid' alias)
  const [activeView, setActiveView] = useState('month');
  const [activeListTab, setActiveListTab] = useState('upcoming'); // 'upcoming' | 'history'

  // Schedule Pattern Modal state (new core routine replacement)
  const [showPatternModal, setShowPatternModal] = useState(false);

  // Multi-Date Selection Mode state
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedDates, setSelectedDates] = useState([]);

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

  const handleSelectMonthYear = (monthIndex, year) => {
    feedback('tick');
    setCurrentMonth(monthIndex);
    setCurrentYear(year);
  };

  // Calendar days array for current month
  const calendarDays = useMemo(() => {
    return getMonthCalendarDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Dynamic counts for currently viewed month
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

  // Student baseline summary
  const routineSummary = useMemo(() => {
    if (!student?.obj) return '7-Day Dining Schedule Active';
    const dayLabels = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const activeDays = [];
    dayLabels.forEach((dl, idx) => {
      const bf = student.obj.breakfast?.[dl] !== undefined ? Boolean(student.obj.breakfast[dl]) : true;
      const lu = student.obj.lunch?.[dl] !== undefined ? Boolean(student.obj.lunch[dl]) : true;
      if (bf && lu) activeDays.push(`${dayNames[idx]} (Bf+Lu)`);
      else if (lu) activeDays.push(`${dayNames[idx]} (Lunch)`);
      else if (bf) activeDays.push(`${dayNames[idx]} (Bf)`);
    });
    if (activeDays.length === 7) return 'Standard Schedule: All 7 Days Active (Breakfast & Lunch)';
    if (activeDays.length === 0) return 'Schedule: All Days Inactive';
    return `Schedule: ${activeDays.join(' • ')}`;
  }, [student?.obj]);

  // Click handler to inspect past day's historical ledger record
  const handleHistoryClick = (dateStr) => {
    feedback('tick');
    const meals = calculateEffectiveDateMeals(student, dateStr);
    setSelectedHistoryDate(dateStr);
    setSelectedHistoryMeals(meals);
    setShowHistoryModal(true);
  };

  // Active date overrides list for upcoming dates
  const activeExceptionsList = useMemo(() => {
    const exc = student?.dateExceptions || {};
    return Object.keys(exc)
      .filter((d) => d >= todayIST)
      .sort()
      .map((dateKey) => {
        const val = exc[dateKey];
        const isBfOn = val.breakfast !== undefined ? Boolean(val.breakfast) : true;
        const isLuOn = val.lunch !== undefined ? Boolean(val.lunch) : true;
        return {
          dateKey,
          label: val.label || (isBfOn === false && isLuOn === false ? 'Full Day Leave' : !isBfOn ? 'Bf OFF' : !isLuOn ? 'Lunch OFF' : 'Scheduled'),
          isBfOn,
          isLuOn,
        };
      });
  }, [student?.dateExceptions, todayIST]);

  // ================= 1. SINGLE CLICK TO TOGGLE MEAL =================
  const handleSingleClickToggle = (dateStr, mealType) => {
    if (!editable) {
      feedback('warning');
      dialog.toast.info(
        t('tokenLockedBadge', 'Token Locked'),
        'Calendar changes are locked while account is suspended.'
      );
      return;
    }

    if (student?.block) {
      feedback('warning');
      dialog.toast.info(
        t('tokenLockedBadge', 'Token Locked'),
        'Calendar changes are locked while account is suspended.'
      );
      return;
    }

    const lockInfo = getDateLockStatus(dateStr, { isAdmin });
    if (!isAdmin && lockInfo.isLocked) {
      feedback('warning');
      const title =
        dateStr === todayIST
          ? "Today's Meals are Locked"
          : dateStr === tomorrowIST
          ? "Tomorrow's Meals are Locked"
          : 'Date is Locked';
      dialog.toast.warning(title, lockInfo.reason || 'Updates for this date are closed.');
      return;
    }

    feedback('pop');

    const targetMeal = mealType === 'both' ? 'both' : (mealType || 'breakfast');
    const meals = calculateEffectiveDateMeals(student, dateStr);
    const existing = student?.dateExceptions || {};

    let nextBreakfast = meals.breakfast;
    let nextLunch = meals.lunch;

    if (targetMeal === 'lunch') {
      nextLunch = !meals.lunch;
    } else if (targetMeal === 'breakfast') {
      nextBreakfast = !meals.breakfast;
    } else {
      // both: if either is on, turn both off (leave); if both off, turn both on
      const willTurnOff = meals.breakfast || meals.lunch;
      nextBreakfast = !willTurnOff;
      nextLunch = !willTurnOff;
    }

    const updated = {
      ...existing,
      [dateStr]: {
        breakfast: nextBreakfast,
        lunch: nextLunch,
        label: !nextBreakfast && !nextLunch
          ? 'Leave (Both OFF)'
          : nextBreakfast && nextLunch
          ? 'Active (Both ON)'
          : nextBreakfast
          ? 'Breakfast ON'
          : 'Lunch ON',
        updatedAt: new Date().toISOString(),
      },
    };

    if (onSaveExceptions) {
      onSaveExceptions(updated);
    }
  };

  // ================= 2. 1-CLICK MEAL TOGGLE IN PARALLEL CALENDAR =================
  const handleToggleMealDate = (dateStr, mealType) => {
    handleSingleClickToggle(dateStr, mealType);
  };

  // ================= 3. UNIVERSAL WEEKDAY MASTER TOGGLE =================
  const handleToggleWeekdayMeal = (dayKey, mealType, targetState) => {
    feedback('tick');
    const isLunch = mealType === 'lunch';
    const targetVal = typeof targetState === 'boolean' ? targetState : true;

    // 1. Universal recurring baseline update
    const currentRoutine = student?.obj || { lunch: {}, breakfast: {} };
    const currentMealRoutine = currentRoutine[mealType] || {};
    const nextMealRoutine = {
      ...currentMealRoutine,
      [dayKey]: targetVal ? 1 : 0,
    };
    const nextRoutine = {
      ...currentRoutine,
      [mealType]: nextMealRoutine,
    };

    // 2. Synchronize all upcoming date exceptions for this weekday across the entire calendar
    const updated = { ...(student?.dateExceptions || {}) };
    let lockedSkipped = 0;

    Object.keys(updated).forEach((dateStr) => {
      // Past days are immutable and never modified
      if (dateStr < todayIST) return;

      if (getDayOfWeekShort(dateStr) === dayKey) {
        const lockInfo = getDateLockStatus(dateStr, { isAdmin });
        if (!isAdmin && lockInfo.isLocked) {
          lockedSkipped++;
          return;
        }

        // Apply universal state to this meal
        const curExc = updated[dateStr];
        const newBf = isLunch
          ? (curExc.breakfast !== undefined ? curExc.breakfast : Boolean(nextRoutine.breakfast?.[dayKey]))
          : targetVal;
        const newLu = isLunch
          ? targetVal
          : (curExc.lunch !== undefined ? curExc.lunch : Boolean(nextRoutine.lunch?.[dayKey]));

        const routineBf = nextRoutine.breakfast?.[dayKey] !== undefined ? Boolean(nextRoutine.breakfast[dayKey]) : true;
        const routineLu = nextRoutine.lunch?.[dayKey] !== undefined ? Boolean(nextRoutine.lunch[dayKey]) : true;

        // If the date exception now matches the updated baseline routine for both meals, delete it
        if (newBf === routineBf && newLu === routineLu) {
          delete updated[dateStr];
        } else {
          updated[dateStr] = {
            ...curExc,
            breakfast: newBf,
            lunch: newLu,
            updatedAt: new Date().toISOString(),
          };
        }
      }
    });

    if (onUpdateRoutine) {
      onUpdateRoutine(nextRoutine);
    }

    if (onSaveExceptions) {
      onSaveExceptions(updated);
    }

    const dayName = dayKey.toUpperCase();
    dialog.toast.success(
      `Universal ${isLunch ? 'Lunch' : 'Breakfast'} Updated`,
      `Turned ${targetVal ? 'ON' : 'OFF'} for all upcoming ${dayName}s across the calendar.${lockedSkipped > 0 ? ` (${lockedSkipped} locked dates preserved safely)` : ''}`
    );
  };

  // ================= 4. TURN ALL DATES IN MONTH FOR SINGLE MEAL =================
  const handleTurnAllMeal = (mealType, boolVal) => {
    feedback('success');
    const isLunch = mealType === 'lunch';
    const updated = { ...(student?.dateExceptions || {}) };
    let affected = 0;
    let lockedSkipped = 0;

    calendarDays.forEach((day) => {
      if (day.isBlank || day.isPast || day.isBeyondMax) return;

      const lockInfo = getDateLockStatus(day.dateStr, { isAdmin });
      if (!isAdmin && lockInfo.isLocked) {
        lockedSkipped++;
        return;
      }

      const curMeals = calculateEffectiveDateMeals(student, day.dateStr);
      const newBf = isLunch ? curMeals.breakfast : boolVal;
      const newLu = isLunch ? boolVal : curMeals.lunch;

      updated[day.dateStr] = {
        breakfast: newBf,
        lunch: newLu,
        label: `All ${isLunch ? 'Lunch' : 'Breakfast'} ${boolVal ? 'ON' : 'OFF'}`,
        updatedAt: new Date().toISOString(),
      };
      affected++;
    });

    if (onSaveExceptions) {
      onSaveExceptions(updated);
    }

    dialog.toast.success(
      `${isLunch ? 'Lunch' : 'Breakfast'} Updated`,
      `Turned ${boolVal ? 'ON' : 'OFF'} for all ${affected} upcoming dates in month.${lockedSkipped > 0 ? ` (${lockedSkipped} locked dates preserved)` : ''}`
    );
  };

  // ================= 5. DAY-OF-WEEK COLUMN BULK ACTION =================
  const handleApplyColumnAction = (dayKey, settings) => {
    feedback('success');
    const updated = { ...(student?.dateExceptions || {}) };
    let affected = 0;
    let lockedSkipped = 0;

    calendarDays.forEach((day) => {
      if (day.isBlank || day.isPast || day.isBeyondMax) return;
      if (day.dayOfWeek !== dayKey) return;

      const lockInfo = getDateLockStatus(day.dateStr, { isAdmin });
      if (!isAdmin && lockInfo.isLocked) {
        lockedSkipped++;
        return;
      }

      const curMeals = calculateEffectiveDateMeals(student, day.dateStr);
      const newBf = settings.breakfast !== undefined ? settings.breakfast : curMeals.breakfast;
      const newLu = settings.lunch !== undefined ? settings.lunch : curMeals.lunch;

      updated[day.dateStr] = {
        breakfast: newBf,
        lunch: newLu,
        label: settings.label || 'Column Schedule',
        updatedAt: new Date().toISOString(),
      };
      affected++;
    });

    if (onSaveExceptions) {
      onSaveExceptions(updated);
    }

    dialog.toast.success(
      'Column Updated',
      `Updated ${affected} date(s) in this month.${lockedSkipped > 0 ? ` (${lockedSkipped} locked dates preserved safely)` : ''}`
    );
  };

  // ================= 3. MULTI-DATE SELECTION ACTIONS =================
  const handleToggleDateSelect = (dateStr) => {
    feedback('tick');
    setSelectedDates((prev) => {
      if (prev.includes(dateStr)) {
        return prev.filter((d) => d !== dateStr);
      }
      return [...prev, dateStr];
    });
  };

  const handleClearSelection = () => {
    feedback('pop');
    setSelectedDates([]);
    setIsSelectMode(false);
  };

  const handleSelectAllMonth = () => {
    feedback('tick');
    const bookable = calendarDays
      .filter((d) => !d.isBlank && !d.isPast && !d.isBeyondMax)
      .map((d) => d.dateStr);
    setSelectedDates(bookable);
  };

  const handleSelectWeekdays = () => {
    feedback('tick');
    const weekdays = calendarDays
      .filter((d) => !d.isBlank && !d.isPast && !d.isBeyondMax && d.dayOfWeek !== 'fr' && d.dayOfWeek !== 'sa')
      .map((d) => d.dateStr);
    setSelectedDates(weekdays);
  };

  const handleSelectWeekends = () => {
    feedback('tick');
    const weekends = calendarDays
      .filter((d) => !d.isBlank && !d.isPast && !d.isBeyondMax && (d.dayOfWeek === 'fr' || d.dayOfWeek === 'sa'))
      .map((d) => d.dateStr);
    setSelectedDates(weekends);
  };

  const handleApplyBatchMealState = (settings) => {
    if (selectedDates.length === 0) return;
    feedback('success');

    const updated = { ...(student?.dateExceptions || {}) };
    let affected = 0;
    let lockedSkipped = 0;

    selectedDates.forEach((dateStr) => {
      const lockInfo = getDateLockStatus(dateStr, { isAdmin });
      if (!isAdmin && lockInfo.isLocked) {
        lockedSkipped++;
        return;
      }

      const curMeals = calculateEffectiveDateMeals(student, dateStr);
      const newBf = settings.breakfast !== undefined ? settings.breakfast : curMeals.breakfast;
      const newLu = settings.lunch !== undefined ? settings.lunch : curMeals.lunch;

      updated[dateStr] = {
        breakfast: newBf,
        lunch: newLu,
        label: settings.label || 'Batch Selection',
        updatedAt: new Date().toISOString(),
      };
      affected++;
    });

    if (onSaveExceptions) {
      onSaveExceptions(updated);
    }

    dialog.toast.success(
      'Batch Update Applied',
      `Applied to ${affected} selected dates.${lockedSkipped > 0 ? ` (${lockedSkipped} locked dates preserved safely)` : ''}`
    );
    setSelectedDates([]);
    setIsSelectMode(false);
  };

  // ================= 4. SCHEDULE PATTERN HANDLER =================
  const handleApplySchedulePattern = (updatedExceptions, meta) => {
    if (onSaveExceptions) {
      onSaveExceptions(updatedExceptions);
    }
    dialog.toast.success(
      'Schedule Pattern Applied',
      `Applied to ${meta.appliedDatesCount} dates.${meta.lockedCount > 0 ? ` (${meta.lockedCount} locked dates kept safe)` : ''}`
    );
  };

  // 1-Tap Toggle Tomorrow Leave Preset
  const handleToggleTomorrowPreset = () => {
    feedback('pop');
    const tomorrowMeals = calculateEffectiveDateMeals(student, tomorrowIST);
    const willTurnOff = tomorrowMeals.breakfast || tomorrowMeals.lunch;
    const existing = student?.dateExceptions || {};
    const updated = {
      ...existing,
      [tomorrowIST]: {
        breakfast: !willTurnOff,
        lunch: !willTurnOff,
        label: willTurnOff ? 'Leave / Tomorrow OFF' : 'Tomorrow Active ON',
      },
    };
    if (onSaveExceptions) onSaveExceptions(updated);
  };

  // Quick Weekend Leave
  const handleQuickTurnWeekendOff = (allMonth = false) => {
    feedback('pop');
    const [y, m, d] = todayIST.split('-').map(Number);
    const todayObj = new Date(y, m - 1, d);
    const dayOfWeek = todayObj.getDay();

    const updated = { ...(student?.dateExceptions || {}) };
    const iterations = allMonth ? 5 : 1;

    for (let i = 0; i < iterations; i++) {
      let daysUntilFriday = (5 - dayOfWeek + 7) % 7 + (i * 7);
      if (daysUntilFriday === 0 && todayIST > addDaysToDate(todayIST, 0)) daysUntilFriday = 7;

      const friDate = addDaysToDate(todayIST, daysUntilFriday);
      const satDate = addDaysToDate(todayIST, daysUntilFriday + 1);

      if (friDate <= maxDate && (isAdmin || !getDateLockStatus(friDate, { isAdmin }).isLocked)) {
        updated[friDate] = {
          breakfast: false,
          lunch: false,
          label: 'Weekend Leave (Fri)',
        };
      }
      if (satDate <= maxDate && (isAdmin || !getDateLockStatus(satDate, { isAdmin }).isLocked)) {
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

  // Reset all scheduled dates while preserving locked dates
  const handleClearAllExceptions = () => {
    feedback('warning');
    if (isAdmin) {
      if (onSaveExceptions) onSaveExceptions({});
      return;
    }
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

  // Multi-day Range Leave handler
  const handleApplyDateRange = (startDate, endDate, mealSettings) => {
    feedback('success');
    const existing = student?.dateExceptions || {};
    const updated = applyDateRangeException(existing, startDate, endDate, mealSettings);
    if (onSaveExceptions) {
      onSaveExceptions(updated);
    }
  };

  // Single Day handler from Modal
  const handleSaveSingleDay = (dateStr, mealSettings) => {
    feedback('success');
    let updated = { ...(student?.dateExceptions || {}) };
    updated[dateStr] = {
      breakfast: mealSettings.breakfast,
      lunch: mealSettings.lunch,
      label: mealSettings.label || 'Scheduled Day',
    };
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

  const isMonthlyView = activeView === 'month' || activeView === 'grid';

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* ================= COMPREHENSIVE CALENDAR COMMAND HEADER ================= */}
      <DiningCalendarHeader
        currentYear={currentYear}
        currentMonth={currentMonth}
        todayIST={todayIST}
        stats={stats}
        student={student}
        editable={editable}
        sortedExceptionDates={sortedExceptionDates}
        activeView={activeView}
        setActiveView={setActiveView}
        mealFilter={mobileMealTab}
        setMealFilter={setMobileMealTab}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onJumpToToday={handleJumpToToday}
        onSelectMonthYear={handleSelectMonthYear}
        onOpenSchedulePattern={() => {
          feedback('tick');
          setShowPatternModal(true);
        }}
        onOpenRangeLeave={() => {
          feedback('tick');
          setSelectedModalDate(todayIST);
          setShowTurnModal(true);
        }}
        onTurnWeekendOff={() => handleQuickTurnWeekendOff(false)}
        onOpenTemplates={() => {
          feedback('tick');
          setShowTemplateModal(true);
        }}
        onClearExceptions={handleClearAllExceptions}
        isSelectMode={isSelectMode}
        onToggleSelectMode={() => {
          feedback('tick');
          setIsSelectMode((prev) => !prev);
          if (isSelectMode) setSelectedDates([]);
        }}
      />

      {/* ================= ARCHIVED MONTH BANNER ================= */}
      {stats.isFullyPastMonth && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-blue-500/10 border border-emerald-500/20 text-emerald-950 dark:text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
                Archived Dining Ledger for {MONTH_NAMES[currentMonth]} {currentYear}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                All {stats.totalDays} days in this month are finalized and locked for mess billing integrity. Attended: {stats.pastBreakfastsTaken} Breakfasts, {stats.pastLunchesTaken} Lunches.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleJumpToToday}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all self-start sm:self-center flex-shrink-0"
          >
            Back to Current Month
          </button>
        </div>
      )}

      {/* ================= ADMIN OVERRIDE STATUS BANNER ================= */}
      {isAdmin && (
        <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="font-bold">
              Admin Override Active: Cutoffs bypassed for today and tomorrow.
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/15 font-bold uppercase tracking-wider shrink-0">
            Unrestricted Authority
          </span>
        </div>
      )}

      {/* ================= VIEW DISPATCHER ================= */}
      {isMonthlyView && (
        <MonthlyGridView
          currentYear={currentYear}
          currentMonth={currentMonth}
          calendarDays={calendarDays}
          student={student}
          stats={stats}
          editable={editable}
          isAdmin={isAdmin}
          mealFilter={mobileMealTab}
          todayIST={todayIST}
          tomorrowIST={tomorrowIST}
          getDateLockStatus={getDateLockStatus}
          onToggleMealDate={handleToggleMealDate}
          onToggleWeekdayMeal={handleToggleWeekdayMeal}
          onTurnAllMeal={handleTurnAllMeal}
          onHistoryClick={handleHistoryClick}
          onLockedClick={(d, reason) => {
            if (!isAdmin) {
              feedback('warning');
              const title =
                d === todayIST
                  ? "Today's Meals are Locked"
                  : d === tomorrowIST
                  ? "Tomorrow's Meals are Locked"
                  : 'Date is Locked';
              dialog.toast.warning(title, reason || 'Updates for this date are closed.');
            }
          }}
          isSelectMode={isSelectMode}
          selectedDates={selectedDates}
          onToggleDateSelect={handleToggleDateSelect}
        />
      )}

      {activeView === 'week' && (
        <WeeklyStripView
          student={student}
          todayIST={todayIST}
          tomorrowIST={tomorrowIST}
          editable={editable}
          isAdmin={isAdmin}
          getDateLockStatus={getDateLockStatus}
          onSingleClickToggle={handleSingleClickToggle}
          onSaveDayState={handleSaveSingleDay}
        />
      )}

      {activeView === 'day' && (
        <DailyFocusView
          student={student}
          todayIST={todayIST}
          tomorrowIST={tomorrowIST}
          editable={editable}
          isAdmin={isAdmin}
          getDateLockStatus={getDateLockStatus}
          onSingleClickToggle={handleSingleClickToggle}
          onSaveDayState={handleSaveSingleDay}
          endTime={endTime}
          isTomorrowLocked={isTomorrowLocked}
        />
      )}

      {activeView === 'year' && (
        <YearlyOverviewView
          currentYear={currentYear}
          student={student}
          todayIST={todayIST}
          onSelectMonth={(mIdx, y) => {
            setCurrentMonth(mIdx);
            setCurrentYear(y);
            setActiveView('month');
          }}
          onOpenRangeLeave={() => {
            feedback('tick');
            setSelectedModalDate(todayIST);
            setShowTurnModal(true);
          }}
        />
      )}

      {activeView === 'list' && (
        /* List View (Scheduled Overrides & Past History) */
        <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 p-4 sm:p-6 shadow-sm backdrop-blur-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h4 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-emerald-500" />
              <span>Scheduled Custom Days & Dining Ledger</span>
            </h4>

            {/* List View Tabs */}
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
                Upcoming Days ({sortedExceptionDates.filter((d) => d >= todayIST).length})
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
                Past Leaves & Ledger ({sortedExceptionDates.filter((d) => d < todayIST).length})
              </button>
            </div>
          </div>

          {activeListTab === 'upcoming' ? (
            (() => {
              const upcomingDates = sortedExceptionDates.filter((d) => d >= todayIST);
              if (upcomingDates.length === 0) {
                return (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <Calendar className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                      No custom upcoming leaves or meal changes scheduled.
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Your standard dining rotation will apply every day. Click any day in Month View to toggle.
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
                                Today
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 block font-mono">
                            {dateKey} {exc?.label ? `• ${exc.label}` : ''}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                                isBfOn
                                  ? 'bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              <Coffee className="w-3 h-3" />
                              <span>Bf: {isBfOn ? 'ON' : 'OFF'}</span>
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                                isLuOn
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              <Utensils className="w-3 h-3" />
                              <span>Lunch: {isLuOn ? 'ON' : 'OFF'}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              feedback('warning');
                              const updated = removeDateException(student?.dateExceptions || {}, dateKey);
                              if (onSaveExceptions) onSaveExceptions(updated);
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                            title="Remove custom day setting"
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
            (() => {
              const pastDates = sortedExceptionDates.filter((d) => d < todayIST).reverse();
              if (pastDates.length === 0) {
                return (
                  <div className="p-8 text-center rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
                    <ShieldCheck className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600 mb-2" />
                    <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                      No custom past leaves recorded.
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Standard dining schedule was recorded for past dates.
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
                          </div>
                          <span className="text-[10px] text-gray-400 block font-mono">
                            {dateKey} {exc?.label ? `• ${exc.label}` : ''}
                          </span>
                          <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-md ${
                                isBfOn
                                  ? 'bg-teal-100 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300'
                                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              Bf: {isBfOn ? 'Taken' : 'Leave'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md ${
                                isLuOn
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              Lunch: {isLuOn ? 'Taken' : 'Leave'}
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleHistoryClick(dateKey)}
                          className="px-2 py-1 rounded-lg text-xs font-bold text-gray-500 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                        >
                          Details
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

      {/* ================= FLOATING MULTI-DATE BATCH ACTION BAR ================= */}
      <MultiDateActionBar
        selectedDates={selectedDates}
        onClearSelection={handleClearSelection}
        onSelectAllMonth={handleSelectAllMonth}
        onSelectWeekdays={handleSelectWeekdays}
        onSelectWeekends={handleSelectWeekends}
        onApplyMealState={handleApplyBatchMealState}
        totalMonthDaysCount={calendarDays.filter((d) => !d.isBlank && !d.isPast && !d.isBeyondMax).length}
      />

      {/* ================= MODAL 1: SCHEDULE PATTERN APPLICATOR ================= */}
      <SchedulePatternModal
        isOpen={showPatternModal}
        onClose={() => setShowPatternModal(false)}
        student={student}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onApplySchedulePattern={handleApplySchedulePattern}
        isAdmin={isAdmin}
      />

      {/* ================= MODAL 2: RANGE LEAVE / DATE TURN MODAL ================= */}
      <DateTurnModal
        isOpen={showTurnModal}
        onClose={() => {
          setShowTurnModal(false);
          setSelectedModalDate(null);
        }}
        dateStr={selectedModalDate || todayIST}
        student={student}
        onSaveException={handleSaveSingleDay}
        onRemoveException={handleRemoveSingleException}
        onApplyRange={handleApplyDateRange}
        isAdmin={isAdmin}
      />

      {/* ================= MODAL 3: STUDENT TEMPLATES MODAL ================= */}
      <StudentTemplateModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        student={student}
        onApplyTemplate={(updatedExceptions, templateName) => {
          if (onSaveExceptions) onSaveExceptions(updatedExceptions);
          dialog.toast.success('Template Applied', templateName || 'Schedule template applied.');
        }}
        onSaveCustomTemplate={handleSaveCustomTemplate}
        onDeleteCustomTemplate={handleDeleteCustomTemplate}
        isAdmin={isAdmin}
      />

      {/* ================= MODAL 4: HISTORICAL RECORD DETAIL MODAL ================= */}
      <DateHistoryDetailModal
        isOpen={showHistoryModal}
        onClose={() => {
          setShowHistoryModal(false);
          setSelectedHistoryDate(null);
          setSelectedHistoryMeals(null);
        }}
        dateStr={selectedHistoryDate}
        meals={selectedHistoryMeals}
      />
    </div>
  );
}
