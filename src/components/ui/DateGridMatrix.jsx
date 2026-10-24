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
  Lock,
  Zap,
  X,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';
import { dialog } from '../../utils/dialog';
import { useTokenLockStatus } from '../../utils/useTokenLockStatus';
import DateTokenButton from './DateTokenButton';
import DiningCalendarHeader from './calendar/DiningCalendarHeader';
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
  isAdmin = false,
  className = '',
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const { getDateLockStatus, isTomorrowLocked, tomorrowIST, todayIST, endTime } = useTokenLockStatus();
  const maxDate = useMemo(() => addDaysToDate(todayIST, 365), [todayIST]); // Full 1-year academic calendar

  // Mobile meal segmented filter: 'both' | 'breakfast' | 'lunch' (responsive for < lg viewports)
  const [mobileMealTab, setMobileMealTab] = useState('both');
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

  const handleSelectMonthYear = (monthIndex, year) => {
    feedback('tick');
    setCurrentMonth(monthIndex);
    setCurrentYear(year);
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

  // Student standard weekly routine baseline summary
  const routineSummary = useMemo(() => {
    if (!student?.obj) return 'Standard Daily Dining Rotation';
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
    if (activeDays.length === 7) return 'Standard Routine: All 7 Days Active (Breakfast & Lunch)';
    if (activeDays.length === 0) return 'Standard Routine: All Days Inactive';
    return `Standard Routine: ${activeDays.join(' • ')}`;
  }, [student?.obj]);

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
          label: val.label || (isBfOn === false && isLuOn === false ? 'Full Day Leave' : !isBfOn ? 'Bf OFF' : !isLuOn ? 'Lunch OFF' : 'Override'),
          isBfOn,
          isLuOn,
        };
      });
  }, [student?.dateExceptions, todayIST]);

  // ================= 1. SINGLE CLICK TO TURN ON AND OFF =================
  const handleSingleClickToggle = (dateStr, mealType) => {
    if (!editable) {
      feedback('warning');
      dialog.toast.info(
        t('tokenLockedBadge', 'Token Locked'),
        t('calendarLockedNotice', 'Calendar date overrides and templates are locked while account is suspended.')
      );
      return;
    }

    if (student?.block) {
      feedback('warning');
      dialog.toast.info(
        t('tokenLockedBadge', 'Token Locked'),
        t('calendarLockedNotice', 'Calendar date overrides and templates are locked while account is suspended.')
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

    const targetMeal = mealType || activeMeal || 'breakfast';
    const meals = calculateEffectiveDateMeals(student, dateStr);
    const existing = student?.dateExceptions || {};

    let nextBreakfast = meals.breakfast;
    let nextLunch = meals.lunch;

    if (targetMeal === 'lunch') {
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
        label: targetMeal === 'lunch'
          ? (nextLunch ? 'Lunch ON' : 'Lunch OFF')
          : (nextBreakfast ? 'Breakfast ON' : 'Breakfast OFF'),
      };
    }

    if (onSaveExceptions) {
      onSaveExceptions(updated);
    }
  };

  // Turn all upcoming dates ON / OFF for breakfast
  const handleTurnAllBf = (turnOn) => {
    feedback('pop');
    const updated = { ...(student?.dateExceptions || {}) };
    for (let i = 0; i <= 30; i++) {
      const d = addDaysToDate(todayIST, i);
      if (!isAdmin && getDateLockStatus(d, { isAdmin }).isLocked) continue;
      const meals = calculateEffectiveDateMeals(student, d);
      updated[d] = {
        breakfast: turnOn,
        lunch: meals.lunch,
        label: turnOn ? 'Breakfast ON' : 'Breakfast OFF',
      };
    }
    if (onSaveExceptions) onSaveExceptions(updated);
  };

  // Turn all upcoming dates ON / OFF for lunch
  const handleTurnAllLunch = (turnOn) => {
    feedback('pop');
    const updated = { ...(student?.dateExceptions || {}) };
    for (let i = 0; i <= 30; i++) {
      const d = addDaysToDate(todayIST, i);
      if (!isAdmin && getDateLockStatus(d, { isAdmin }).isLocked) continue;
      const meals = calculateEffectiveDateMeals(student, d);
      updated[d] = {
        breakfast: meals.breakfast,
        lunch: turnOn,
        label: turnOn ? 'Lunch ON' : 'Lunch OFF',
      };
    }
    if (onSaveExceptions) onSaveExceptions(updated);
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

      if (friDate <= maxDate && (isAdmin || !getDateLockStatus(friDate, { isAdmin }).isLocked)) {
        // Friday: breakfast and lunch OFF
        updated[friDate] = {
          breakfast: false,
          lunch: false,
          label: 'Weekend Leave (Fri)',
        };
      }
      if (satDate <= maxDate && (isAdmin || !getDateLockStatus(satDate, { isAdmin }).isLocked)) {
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

  // Turn all upcoming dates ON for the active meal (skips locked dates for non-admins)
  const handleTurnAllActiveMealOn = () => {
    feedback('pop');
    const updated = { ...(student?.dateExceptions || {}) };
    for (let i = 0; i <= 30; i++) {
      const d = addDaysToDate(todayIST, i);
      if (!isAdmin && getDateLockStatus(d, { isAdmin }).isLocked) continue;
      const meals = calculateEffectiveDateMeals(student, d);
      updated[d] = {
        breakfast: activeMeal === 'breakfast' ? true : meals.breakfast,
        lunch: activeMeal === 'lunch' ? true : meals.lunch,
        label: `${activeMeal === 'lunch' ? 'Lunch' : 'Breakfast'} ON`,
      };
    }
    if (onSaveExceptions) onSaveExceptions(updated);
  };

  // Turn all upcoming dates OFF for the active meal (skips locked dates for non-admins)
  const handleTurnAllActiveMealOff = () => {
    feedback('pop');
    const updated = { ...(student?.dateExceptions || {}) };
    for (let i = 0; i <= 30; i++) {
      const d = addDaysToDate(todayIST, i);
      if (!isAdmin && getDateLockStatus(d, { isAdmin }).isLocked) continue;
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
    if (isAdmin) {
      if (onSaveExceptions) onSaveExceptions({});
      return;
    }
    const existing = student?.dateExceptions || {};
    const preserved = {};
    Object.keys(existing).forEach((d) => {
      if (getDateLockStatus(d).isLocked) {
        const meals = calculateEffectiveDateMeals(student, d);
        if (meals.breakfast !== meals.routineBreakfast || meals.lunch !== meals.routineLunch) {
          preserved[d] = existing[d];
        }
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

  const renderMealCard = (mealType) => {
    const isLunch = mealType === 'lunch';
    const mealTitle = isLunch
      ? t('lunchCalendarTitle') || 'Lunch Calendar'
      : t('breakfastCalendarTitle') || 'Breakfast Calendar';
    const activeDaysCount = isLunch ? stats.activeLunchDays : stats.activeBreakfastDays;

    return (
      <div
        key={mealType}
        className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 p-3.5 sm:p-5 shadow-sm backdrop-blur-xl space-y-3.5 flex flex-col justify-between"
      >
        <div className="space-y-3.5">
          {/* Card Header: Meal Icon, Title, Live Attendance Badge, Fast Actions */}
          <div className="flex items-center justify-between gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-2">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isLunch
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-teal-100 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400'
                }`}
              >
                {isLunch ? <Utensils className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
              </div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  {mealTitle}
                </h3>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
                    isLunch
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                      : 'bg-teal-500/10 text-teal-700 dark:text-teal-300 border-teal-500/20'
                  }`}
                >
                  {activeDaysCount} ON
                </span>
              </div>
            </div>

            {editable && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => (isLunch ? handleTurnAllLunch(true) : handleTurnAllBf(true))}
                  className={`text-[11px] font-bold hover:underline px-1.5 py-0.5 rounded-md transition-colors cursor-pointer ${
                    isLunch
                      ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
                      : 'text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/40'
                  }`}
                  title={`Turn ${isLunch ? 'Lunch' : 'Breakfast'} ON for all upcoming dates in month`}
                >
                  {t('selectAll') || 'Select All'}
                </button>
                <span className="text-gray-300 dark:text-gray-600 text-xs">•</span>
                <button
                  type="button"
                  onClick={() => (isLunch ? handleTurnAllLunch(false) : handleTurnAllBf(false))}
                  className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline px-1.5 py-0.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                  title={`Turn ${isLunch ? 'Lunch' : 'Breakfast'} OFF for all upcoming dates in month`}
                >
                  {t('deselectAll') || 'Deselect All'}
                </button>
              </div>
            )}
          </div>

          {/* Day of Week Column Headers */}
          <div role="row" className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
            {dayHeaders.map((dh) => (
              <span
                key={dh.key}
                role="columnheader"
                aria-label={dh.label}
                className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500"
              >
                {dh.label}
              </span>
            ))}
          </div>

          {/* 7-Column Token Cells Grid */}
          <div
            role="grid"
            aria-label={`${MONTH_NAMES[currentMonth]} ${currentYear} Dining Calendar Grid`}
            className="grid grid-cols-7 gap-1 sm:gap-1.5"
          >
            {calendarDays.map((day) => {
              if (day.isBlank) {
                return (
                  <div
                    key={day.key}
                    role="gridcell"
                    aria-hidden="true"
                    className="w-full aspect-square rounded-xl sm:rounded-2xl bg-gray-50/30 dark:bg-white/[0.01] pointer-events-none"
                  />
                );
              }

              const meals = calculateEffectiveDateMeals(student, day.dateStr);
              const lockInfo = getDateLockStatus(day.dateStr, { isAdmin });

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
                  isBookable={day.isBookable}
                  isLocked={lockInfo.isLocked}
                  isAdmin={isAdmin}
                  isAdminOverride={lockInfo.isAdminOverride}
                  lockReason={lockInfo.reason}
                  breakfast={meals.breakfast}
                  lunch={meals.lunch}
                  activeMeal={mealType}
                  showDualPills={false}
                  hasException={meals.hasException}
                  exceptionLabel={meals.label}
                  onClick={(d) => handleSingleClickToggle(d, mealType)}
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
                />
              );
            })}
          </div>
        </div>

        {/* Interactive Legend */}
        <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px] font-medium text-gray-400 dark:text-gray-500">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>ON</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>OFF</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full ring-2 ring-indigo-400 bg-indigo-500/20" />
              <span>{t('customOverride', 'Override')}</span>
            </span>
            {isAdmin ? (
              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>Admin Override Active</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Lock className="w-2.5 h-2.5 text-gray-400" />
                <span>{t('lockedCutoff', 'Locked')}</span>
              </span>
            )}
          </div>
          <span
            className={`font-semibold text-[10px] inline-flex items-center gap-1 ${
              isLunch
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-teal-600 dark:text-teal-400'
            }`}
          >
            <span>{isLunch ? '🍽️' : '☕'} 1-Click toggle</span>
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`space-y-4 ${className}`}>
      
      {/* ================= NEXT-LEVEL ADAPTIVE HEADER & COMMAND BAR ================= */}
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
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all self-start sm:self-center flex-shrink-0"
          >
            {t('backToCurrentMonth', 'Back to Current Month')}
          </button>
        </div>
      )}

      {/* ================= ADMIN OVERRIDE STATUS BANNER ================= */}
      {isAdmin && (
        <div className="p-2.5 sm:p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <span className="font-bold">
              {t('adminOverrideActiveBadge', 'Admin Override Active')}: {t('adminCutoffNotice', 'Cutoff passed for students • Admin override active')}
            </span>
          </div>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/15 font-bold uppercase tracking-wider shrink-0">
            Unrestricted Authority
          </span>
        </div>
      )}

      {/* ================= ACTIVE OVERRIDES STRIP ================= */}
      <div className="p-3 sm:p-3.5 rounded-2xl bg-white/90 dark:bg-[#0c1412]/90 border border-gray-200/80 dark:border-white/10 shadow-xs space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-purple-500" />
            <span>{t('activeDateOverrides', 'Active Date Overrides')} ({activeExceptionsList.length})</span>
          </span>
          {activeExceptionsList.length > 0 && (
            <button
              type="button"
              onClick={handleClearAllExceptions}
              className="text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{t('resetRoutinePreset', 'Reset All')}</span>
            </button>
          )}
        </div>

        {activeExceptionsList.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {activeExceptionsList.map((item) => (
              <div
                key={item.dateKey}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200/80 dark:border-white/10 text-xs shadow-xs"
              >
                <span className="font-bold text-gray-800 dark:text-gray-100 font-mono">
                  {formatFriendlyDate(item.dateKey)}
                </span>
                <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  !item.isBfOn && !item.isLuOn
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/20'
                }`}>
                  {item.label}
                </span>
                {editable && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSingleException(item.dateKey)}
                    className="p-0.5 rounded-md hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 hover:text-rose-500 transition-colors cursor-pointer"
                    title={t('clearOverride', 'Clear Override')}
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
            {t('noActiveOverrides', 'Following standard weekly routine (No date overrides)')}
          </p>
        )}
      </div>

      {/* ================= STUDENT BASELINE ROUTINE BENCHMARK ================= */}
      <div className="p-2.5 sm:p-3 rounded-2xl bg-gray-50/90 dark:bg-white/[0.03] border border-gray-200/70 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
            <Layers className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-gray-800 dark:text-gray-200 block truncate">
              {routineSummary}
            </span>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 block truncate">
              Student baseline weekly rotation • Calendar displays effective attendance
            </span>
          </div>
        </div>

        {/* Quick Tomorrow Toggle shortcut */}
        {editable && !stats.isFullyPastMonth && (
          <button
            type="button"
            onClick={handleToggleTomorrowPreset}
            className="px-2.5 py-1 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 text-[11px] font-bold transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer shadow-xs self-start sm:self-auto shrink-0"
          >
            <Zap className="w-3 h-3 text-purple-600 dark:text-purple-400" />
            <span>{t('tomorrowLeavePreset', 'Tomorrow OFF (Leave)')}</span>
          </button>
        )}
      </div>

      {/* ================= VIEW 1: DUAL PARALLEL OR FOCUSED MEAL GRIDS ================= */}
      {activeView === 'grid' ? (
        <div
          className={`grid gap-4 sm:gap-6 ${
            mobileMealTab === 'both'
              ? 'grid-cols-1 lg:grid-cols-2'
              : 'grid-cols-1 max-w-2xl mx-auto'
          }`}
        >
          {/* 1. Breakfast Calendar Grid */}
          {(mobileMealTab === 'both' || mobileMealTab === 'breakfast') &&
            renderMealCard('breakfast')}

          {/* 2. Lunch Calendar Grid */}
          {(mobileMealTab === 'both' || mobileMealTab === 'lunch') &&
            renderMealCard('lunch')}
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
                              className={`px-2 py-0.5 rounded-md transition-colors inline-flex items-center gap-1 ${
                                isBfOn
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              <Coffee className="w-3 h-3" />
                              <span>Bf: {isBfOn ? 'ON' : 'OFF'}</span>
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
                              className={`px-2 py-0.5 rounded-md transition-colors inline-flex items-center gap-1 ${
                                isLuOn
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              <Utensils className="w-3 h-3" />
                              <span>Lunch: {isLuOn ? 'ON' : 'OFF'}</span>
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
                            <span className={`px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                              isBfOn
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                            }`}>
                              <Coffee className="w-3 h-3" />
                              <span>Bf: {isBfOn ? 'ON' : 'OFF'}</span>
                            </span>
                            <span className={`px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                              isLuOn
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                            }`}>
                              <Utensils className="w-3 h-3" />
                              <span>Lunch: {isLuOn ? 'ON' : 'OFF'}</span>
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
            isAdmin={isAdmin}
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
            isAdmin={isAdmin}
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

