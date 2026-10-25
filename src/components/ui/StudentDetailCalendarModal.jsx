import React, { useState, useEffect, useMemo, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Lock,
  Unlock,
  Coffee,
  Utensils,
  Calendar,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Clock,
  Ban,
  Receipt,
  ArrowRight,
  Edit,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  RotateCcw,
  Info,
  Layers,
} from 'lucide-react';
import firebase from '../../firebase/config';
import { AuthContext } from '../../store/AuthContext';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { useTokenLockStatus } from '../../utils/useTokenLockStatus';
import { dialog } from '../../utils/dialog';
import { getStudentFineAmount } from '../../utils/mealScheduleService';
import { subscribeToPreferences } from '../../utils/preferenceService';
import {
  getMonthCalendarDays,
  calculateEffectiveDateMeals,
  calculateMonthStats,
  formatFriendlyDate,
  getEffectiveStudentMealStatus,
  getActiveStudentException,
  addDaysToDate,
  getDayOfWeekShort,
} from '../../utils/studentExceptionService';
import DateTokenButton from './DateTokenButton';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * StudentDetailCalendarModal
 * Replaces the confusing weekly bulk routine popup with a complete, separate monthly calendar
 * for Breakfast and Lunch with meal focus switcher, today-tomorrow logic, and role-aware controls.
 */
export default function StudentDetailCalendarModal({
  isOpen,
  onClose,
  student,
  targetDateIST,
  effectiveDay,
  isLunchTarget = false,
  isAdmin = false,
  preferencesList: propPreferencesList = null,
  onStudentUpdated = null,
  onOpenFullDrawer = null,
}) {
  const navigate = useNavigate();
  const { user, role } = useContext(AuthContext);
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();

  // Token lock and world-time status
  const {
    todayIST,
    tomorrowIST,
    isTomorrowLocked,
    getDateLockStatus,
    isPortalAccessible,
  } = useTokenLockStatus();

  // Local student state to allow instant reactive updates (optimistic toggling for admins)
  const [currentStudent, setCurrentStudent] = useState(student);
  useEffect(() => {
    setCurrentStudent(student);
  }, [student]);

  const activeDoc = currentStudent || student;

  // Preferences list subscription fallback if not passed as prop
  const [availablePreferences, setAvailablePreferences] = useState([]);
  useEffect(() => {
    if (propPreferencesList && propPreferencesList.length > 0) return;
    const unsub = subscribeToPreferences((list) => {
      setAvailablePreferences(list.filter((p) => p.isActive));
    });
    return () => unsub();
  }, [propPreferencesList]);

  const preferencesList = (propPreferencesList && propPreferencesList.length > 0)
    ? propPreferencesList
    : availablePreferences;

  // Month & Year state (anchored initially to targetDateIST or todayIST)
  const [currentYear, setCurrentYear] = useState(() => {
    const base = targetDateIST || todayIST;
    return Number(base.split('-')[0]);
  });
  const [currentMonth, setCurrentMonth] = useState(() => {
    const base = targetDateIST || todayIST;
    return Number(base.split('-')[1]) - 1; // 0-indexed
  });

  // Sync viewed month whenever targetDateIST or modal opens
  useEffect(() => {
    if (isOpen && targetDateIST) {
      const [y, m] = targetDateIST.split('-').map(Number);
      setCurrentYear(y);
      setCurrentMonth(m - 1);
    }
  }, [isOpen, targetDateIST]);

  // Meal focus tab: 'both' | 'breakfast' | 'lunch' (Default to 'both' meals view)
  const [mealFocus, setMealFocus] = useState('both');
  useEffect(() => {
    if (isOpen) {
      setMealFocus('both');
    }
  }, [isOpen]);

  // Global ESC key listener to dismiss modal
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Month navigation handlers
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

  // Month stats (active days count)
  const stats = useMemo(() => {
    if (!activeDoc) {
      return { activeLunchDays: 0, activeBreakfastDays: 0, totalDays: 30, isFullyPastMonth: false };
    }
    return calculateMonthStats(activeDoc, currentYear, currentMonth);
  }, [activeDoc, currentYear, currentMonth]);

  // Day of week column headers
  const dayHeaders = useMemo(
    () => [
      { key: 'su', label: t('days.su', 'Sun') },
      { key: 'mo', label: t('days.mo', 'Mon') },
      { key: 'tu', label: t('days.tu', 'Tue') },
      { key: 'we', label: t('days.we', 'Wed') },
      { key: 'th', label: t('days.th', 'Thu') },
      { key: 'fr', label: t('days.fr', 'Fri') },
      { key: 'sa', label: t('days.sa', 'Sat') },
    ],
    [t]
  );

  // Active single-day exceptions for upcoming dates (diverging from baseline routine)
  const activeExceptionsList = useMemo(() => {
    const exc = activeDoc?.dateExceptions || {};
    return Object.keys(exc)
      .filter((d) => d >= todayIST)
      .sort()
      .map((dateKey) => {
        const val = exc[dateKey];
        const dayKey = getDayOfWeekShort(dateKey);
        const routineBf =
          activeDoc?.obj?.breakfast?.[dayKey] !== undefined
            ? Boolean(activeDoc.obj.breakfast[dayKey])
            : true;
        const routineLu =
          activeDoc?.obj?.lunch?.[dayKey] !== undefined
            ? Boolean(activeDoc.obj.lunch[dayKey])
            : true;
        const isBfOn = val.breakfast !== undefined ? Boolean(val.breakfast) : routineBf;
        const isLuOn = val.lunch !== undefined ? Boolean(val.lunch) : routineLu;
        const isBfOverridden = isBfOn !== routineBf;
        const isLuOverridden = isLuOn !== routineLu;

        let autoLabel = 'Single-Day Override';
        if (isBfOverridden && isLuOverridden) {
          autoLabel = !isBfOn && !isLuOn ? 'Full Leave' : isBfOn && isLuOn ? 'Both Meals ON' : 'Schedule Override';
        } else if (isBfOverridden) {
          autoLabel = isBfOn ? 'Breakfast ON' : 'Breakfast OFF';
        } else if (isLuOverridden) {
          autoLabel = isLuOn ? 'Lunch ON' : 'Lunch OFF';
        }

        return {
          dateKey,
          label: val.label || autoLabel,
          isBfOn,
          isLuOn,
          isBfOverridden,
          isLuOverridden,
        };
      })
      .filter((e) => e.isBfOverridden || e.isLuOverridden);
  }, [activeDoc, todayIST]);

  // Single-Day Exception for the parent board's inspected target date
  const inspectedTargetException = useMemo(() => {
    if (!activeDoc || !targetDateIST) return null;
    return getActiveStudentException(activeDoc, targetDateIST);
  }, [activeDoc, targetDateIST]);

  // Effective status for target date on parent board (for both meals and focused meal)
  const effectiveDayKey = effectiveDay || getDayOfWeekShort(targetDateIST);
  const targetDateMeals = useMemo(() => {
    if (!activeDoc || !targetDateIST) return null;
    return calculateEffectiveDateMeals(activeDoc, targetDateIST);
  }, [activeDoc, targetDateIST]);

  const targetMealStatus = useMemo(() => {
    if (!activeDoc) return false;
    return getEffectiveStudentMealStatus(
      activeDoc,
      targetDateIST,
      effectiveDayKey,
      isLunchTarget ? 'lunch' : 'breakfast'
    );
  }, [activeDoc, targetDateIST, effectiveDayKey, isLunchTarget]);

  // Admin 1-Click Toggle for a specific date in the calendar
  const handleDateClick = async (dateStr, mealType) => {
    if (!activeDoc) return;

    if (!isAdmin) {
      // Public / Student inspection mode: provide friendly informative feedback
      feedback('tick');
      const meals = calculateEffectiveDateMeals(activeDoc, dateStr);
      const isRoutineBf = meals.routineBreakfast;
      const isRoutineLunch = meals.routineLunch;
      const bfText = meals.breakfast ? 'Taking (ON)' : 'Skipped (OFF)';
      const luText = meals.lunch ? 'Taking (ON)' : 'Skipped (OFF)';
      const dateLabel = formatFriendlyDate(dateStr, true);

      let message = `${dateLabel}\n• Breakfast: ${bfText}\n• Lunch: ${luText}`;
      if (meals.hasException) {
        message += `\n\n[Custom Override Active: ${meals.label || 'Leave / Schedule Change'}]`;
      } else {
        message += '\n\n(Following standard weekly routine)';
      }

      dialog.toast.info(`Token #${activeDoc.tokenNo} Attendance`, message);
      return;
    }

    if (activeDoc.block) {
      feedback('warning');
      dialog.toast.warning(
        'Student Blocked',
        'Unblock student dining privileges before updating calendar meal dates.'
      );
      return;
    }

    feedback('pop');

    const targetMeal = mealType || (mealFocus === 'lunch' ? 'lunch' : 'breakfast');
    const meals = calculateEffectiveDateMeals(activeDoc, dateStr);
    const existing = activeDoc.dateExceptions || {};

    let nextBreakfast = meals.breakfast;
    let nextLunch = meals.lunch;

    if (targetMeal === 'lunch') {
      nextLunch = !meals.lunch;
    } else if (targetMeal === 'breakfast') {
      nextBreakfast = !meals.breakfast;
    } else {
      // 'both' toggle
      const nextAll = !meals.isAllOn;
      nextBreakfast = nextAll;
      nextLunch = nextAll;
    }

    const isRoutineBf = meals.routineBreakfast;
    const isRoutineLunch = meals.routineLunch;

    const updatedExceptions = { ...existing };
    let deletedKeyUpdate = {};

    if (nextBreakfast === isRoutineBf && nextLunch === isRoutineLunch) {
      // Reverted to standard routine: clean up exception key
      delete updatedExceptions[dateStr];
      deletedKeyUpdate = {
        [`dateExceptions.${dateStr}`]: firebase.firestore.FieldValue.delete(),
      };
    } else {
      let label =
        targetMeal === 'lunch'
          ? nextLunch ? 'Lunch ON' : 'Lunch OFF'
          : targetMeal === 'breakfast'
          ? nextBreakfast ? 'Breakfast ON' : 'Breakfast OFF'
          : nextBreakfast && nextLunch ? 'Both ON' : 'Full Day OFF';

      updatedExceptions[dateStr] = {
        breakfast: nextBreakfast,
        lunch: nextLunch,
        label,
        updatedAt: new Date().toISOString(),
      };
    }

    // Instant optimistic update
    const updatedStudent = {
      ...activeDoc,
      dateExceptions: updatedExceptions,
    };
    setCurrentStudent(updatedStudent);
    if (onStudentUpdated) {
      onStudentUpdated(updatedStudent);
    }

    // Persist to Firestore
    try {
      const docRef = firebase.firestore().collection('students').doc(activeDoc.id);
      await docRef.update({
        dateExceptions: updatedExceptions,
        ...deletedKeyUpdate,
        lastUpdatedBy: user?.email || 'admin',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Error updating student date exception:', err);
      dialog.toast.warning(
        'Sync Warning',
        'Could not synchronize calendar update with remote server. Check connection.'
      );
    }
  };

  if (!isOpen || !student) return null;

  // Render a single meal calendar card (Breakfast or Lunch)
  const renderMealCalendarCard = (mealType) => {
    const isLunch = mealType === 'lunch';
    const mealTitle = isLunch
      ? t('lunchCalendarTitle') || 'Lunch Calendar'
      : t('breakfastCalendarTitle') || 'Breakfast Calendar';
    const activeDaysCount = isLunch ? stats.activeLunchDays : stats.activeBreakfastDays;

    return (
      <div
        key={mealType}
        className="rounded-2xl sm:rounded-3xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/10 p-3.5 sm:p-4 shadow-xs space-y-3 flex flex-col justify-between"
      >
        <div className="space-y-3">
          {/* Card Sub-Header */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-gray-200/60 dark:border-white/5">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  isLunch
                    ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                    : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                }`}
              >
                {isLunch ? <Utensils className="w-4 h-4" /> : <Coffee className="w-4 h-4" />}
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white truncate">
                  {mealTitle}
                </h4>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border shrink-0 ${
                    isLunch
                      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20'
                  }`}
                >
                  {activeDaysCount} ON
                </span>
              </div>
            </div>

            {isAdmin && (
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Admin 1-Tap Toggle</span>
              </span>
            )}
          </div>

          {/* Weekday Column Headers (7-col) */}
          <div role="row" className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center">
            {dayHeaders.map((dh) => (
              <span
                key={dh.key}
                role="columnheader"
                aria-label={dh.label}
                className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 py-0.5"
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
                    className="w-full aspect-square rounded-xl sm:rounded-2xl bg-gray-100/30 dark:bg-white/[0.01] pointer-events-none"
                  />
                );
              }

              const meals = calculateEffectiveDateMeals(activeDoc, day.dateStr);
              const lockInfo = getDateLockStatus(day.dateStr, { isAdmin });

              // Meal-specific override check:
              // Only mark override if this specific meal differs from its weekly routine baseline!
              const isMealOverridden = mealType === 'lunch'
                ? (meals.lunch !== meals.routineLunch)
                : mealType === 'breakfast'
                ? (meals.breakfast !== meals.routineBreakfast)
                : meals.hasException;

              return (
                <div key={day.key} className="relative group">
                  <DateTokenButton
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
                    hasException={isMealOverridden}
                    exceptionLabel={meals.label || (isMealOverridden ? 'Single-Day Override' : '')}
                    onClick={(d) => handleDateClick(d, mealType)}
                    onLockedClick={(d, reason) => {
                      if (!isAdmin) {
                        feedback('warning');
                        dialog.toast.warning('Date Locked', reason || 'Updates for this date are closed.');
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Footnote */}
        <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Serving</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ml-1" />
            <span>Leave / OFF</span>
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider">
            {MONTH_NAMES[currentMonth].slice(0, 3)} {currentYear}
          </span>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <div
        key="student-detail-calendar-modal-backdrop"
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className={`w-full ${
            mealFocus === 'both' ? 'max-w-5xl' : 'max-w-2xl'
          } transition-[max-width] duration-200 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col`}
        >
          {/* ================= MODAL HEADER ================= */}
          <div
            className={`p-4 sm:p-5 text-white flex items-center justify-between gap-3 ${
              activeDoc.block
                ? 'bg-gradient-to-r from-gray-800 to-gray-900'
                : targetDateMeals
                ? targetDateMeals.isAllOff
                  ? 'bg-gradient-to-r from-rose-600 to-red-600'
                  : 'bg-gradient-to-r from-emerald-600 to-green-600'
                : targetMealStatus
                ? 'bg-gradient-to-r from-emerald-600 to-green-600'
                : 'bg-gradient-to-r from-rose-600 to-red-600'
            }`}
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Tactile Token Number Keycap */}
              <div className="relative w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-mono font-black text-xl text-white shadow-inner flex-shrink-0">
                {activeDoc.tokenNo}
                {Boolean(activeDoc.block) && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 border border-white/40 flex items-center justify-center shadow-xs">
                    <Lock className="w-2.5 h-2.5 text-white" />
                  </span>
                )}
              </div>

              {/* Student Metadata */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">
                    {activeDoc.nameEn || activeDoc.name || `Student #${activeDoc.tokenNo}`}
                  </h3>
                  {targetDateMeals ? (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold border ${
                          targetDateMeals.breakfast
                            ? 'bg-emerald-500/30 text-white border-emerald-300/40'
                            : 'bg-rose-500/30 text-white border-rose-300/40'
                        }`}
                      >
                        Bf: {targetDateMeals.breakfast ? 'ON' : 'OFF'}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold border ${
                          targetDateMeals.lunch
                            ? 'bg-emerald-500/30 text-white border-emerald-300/40'
                            : 'bg-rose-500/30 text-white border-rose-300/40'
                        }`}
                      >
                        Lunch: {targetDateMeals.lunch ? 'ON' : 'OFF'}
                      </span>
                    </div>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold bg-white/20 text-white border border-white/20 shrink-0">
                      {isLunchTarget ? 'Lunch' : 'Breakfast'}: {targetMealStatus ? 'ON' : 'OFF'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs text-white/80 flex-wrap mt-0.5">
                  {activeDoc.nameMl && <span className="font-malayalam">{activeDoc.nameMl}</span>}
                  <span>•</span>
                  <span>{activeDoc.batch || t('generalBatch', 'General Batch')}</span>
                  {(activeDoc.username || activeDoc.uname) && (
                    <>
                      <span>•</span>
                      <span className="font-mono">@{activeDoc.username || activeDoc.uname}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                feedback('tick');
                onClose();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0 cursor-pointer"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* ================= MODAL CONTENT (SCROLLABLE) ================= */}
          <div className="p-4 sm:p-5 space-y-4 sm:space-y-5 overflow-y-auto max-h-[calc(90dvh-110px)] pb-safe">
            {activeDoc.block ? (
              /* ================= BLOCKED STUDENT NOTICE & FINES ================= */
              <div className="space-y-4">
                <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 flex items-start gap-3.5 shadow-sm">
                  <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-rose-300/60 dark:border-rose-500/30">
                    <Ban className="w-6 h-6" />
                  </div>
                  <div className="text-xs text-rose-950 dark:text-rose-100 min-w-0 flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-base sm:text-lg block text-rose-950 dark:text-white">
                        Token #{activeDoc.tokenNo} Blocked
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-200/80 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 border border-rose-300/60">
                        Dual-Grid Suspension
                      </span>
                    </div>

                    <p className="leading-relaxed text-rose-800 dark:text-rose-300 text-xs">
                      {t(
                        'studentDualGridBlockedDesc',
                        'Both Breakfast and Lunch dining privileges are temporarily suspended due to food waste or attendance infraction.'
                      )}
                    </p>

                    {activeDoc.blockReason && (
                      <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-rose-200 dark:border-rose-500/20 text-xs">
                        <span className="font-bold text-rose-950 dark:text-rose-200">
                          {t('blockReasonLabel', 'Reason')}:
                        </span>{' '}
                        <span className="italic font-medium text-rose-900 dark:text-rose-200">
                          &ldquo;{activeDoc.blockReason}&rdquo;
                        </span>
                      </div>
                    )}

                    {/* Fine Payable Notification Card */}
                    <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 dark:text-amber-200">
                          <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                          <span>Fine Payable Amount</span>
                        </div>
                        <span className="font-mono text-lg font-black text-amber-950 dark:text-amber-100 px-2.5 py-0.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                          ₹{getStudentFineAmount(activeDoc)}
                        </span>
                      </div>
                      <div className="p-2 rounded-xl bg-white/80 dark:bg-black/40 text-[11px] leading-relaxed text-amber-950 dark:text-amber-200">
                        <strong>Notice to Student:</strong> Please pay the required fine of{' '}
                        <strong>₹{getStudentFineAmount(activeDoc)}</strong> at the{' '}
                        <strong>ADSA Canteen Office</strong> to clear this block and restore both
                        Breakfast and Lunch meal tokens.
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Unblock Status Alert */}
                {activeDoc.pendingUnblockRequest?.status === 'pending' && (
                  <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200 min-w-0">
                      <Clock className="w-4 h-4 text-amber-600 animate-pulse flex-shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold block truncate">
                          {t('unblockRequestPending', 'Unblock Request Pending')} (#
                          {activeDoc.pendingUnblockRequest.ticketNumber})
                        </span>
                        <span className="text-[10px] text-amber-700/80 dark:text-amber-400 block truncate">
                          {t('unblockRequestUnderReview', 'Under review by Central Committee')}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        const code = activeDoc.pendingUnblockRequest.ticketNumber;
                        onClose();
                        navigate(`/support?tab=tracker&code=${code}`);
                      }}
                      className="py-1 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] transition-colors flex-shrink-0 cursor-pointer"
                    >
                      {t('trackUnblockRequest', 'Track Status')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              /* ================= ACTIVE STUDENT VIEW: PROPER MONTHLY CALENDAR ================= */
              <>
                {/* Single-Day Exception Alert for inspected date if present */}
                {inspectedTargetException && (
                  <div className="p-3 sm:p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-500/30 flex items-start gap-2.5 text-xs text-purple-950 dark:text-purple-200">
                    <CalendarDays className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black block">
                        Single-Day Override Active for {formatFriendlyDate(targetDateIST)}
                      </span>
                      <span className="block mt-0.5 text-purple-800 dark:text-purple-300">
                        {inspectedTargetException.breakfast !== undefined && (
                          <>
                            Breakfast:{' '}
                            <strong>
                              {inspectedTargetException.breakfast ? 'Taking (ON)' : 'Skipped (OFF)'}
                            </strong>{' '}
                          </>
                        )}
                        {inspectedTargetException.lunch !== undefined && (
                          <>
                            • Lunch:{' '}
                            <strong>
                              {inspectedTargetException.lunch ? 'Taking (ON)' : 'Skipped (OFF)'}
                            </strong>
                          </>
                        )}
                      </span>
                      <span className="text-[10px] text-purple-600 dark:text-purple-400 block mt-1">
                        Regular weekly dining routine automatically resumes for other dates.
                      </span>
                    </div>
                  </div>
                )}

                {/* Month Navigation & Action Deck */}
                <div className="p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 space-y-3 shadow-xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* Month Stepper */}
                    <div className="flex items-center gap-2">
                      <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-white dark:bg-[#1a2521] border border-gray-200/80 dark:border-white/10 shadow-xs">
                        <button
                          type="button"
                          onClick={handlePrevMonth}
                          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                          title="Previous Month"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-2.5 text-xs sm:text-sm font-black font-mono text-gray-900 dark:text-white min-w-[120px] text-center">
                          {MONTH_NAMES[currentMonth]} {currentYear}
                        </span>
                        <button
                          type="button"
                          onClick={handleNextMonth}
                          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                          title="Next Month"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Jump to Today Button */}
                      <button
                        type="button"
                        onClick={handleJumpToToday}
                        className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
                      >
                        {t('todayBtn', 'Today')}
                      </button>
                    </div>

                    {/* Meal Focus Switcher (Both Meals | Breakfast | Lunch) */}
                    <div className="inline-flex p-0.5 rounded-xl bg-gray-200/60 dark:bg-white/10 border border-gray-300/40 dark:border-white/5 text-xs font-bold self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          setMealFocus('both');
                        }}
                        className={`relative px-2.5 py-1 rounded-lg transition-colors select-none ${
                          mealFocus === 'both'
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {mealFocus === 'both' && (
                          <motion.div
                            layoutId="modalMealTabPill"
                            className="absolute inset-0 bg-white dark:bg-[#1a2521] rounded-lg shadow-xs -z-10 border border-gray-200/80 dark:border-white/10"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}
                        <span>{t('viewBothParallel', 'Both Meals')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          setMealFocus('breakfast');
                        }}
                        className={`relative px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 select-none ${
                          mealFocus === 'breakfast'
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {mealFocus === 'breakfast' && (
                          <motion.div
                            layoutId="modalMealTabPill"
                            className="absolute inset-0 bg-white dark:bg-[#1a2521] rounded-lg shadow-xs -z-10 border border-gray-200/80 dark:border-white/10"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}
                        <Coffee className="w-3 h-3 text-amber-500" />
                        <span>{t('navBreakfast', 'Breakfast')}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          setMealFocus('lunch');
                        }}
                        className={`relative px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 select-none ${
                          mealFocus === 'lunch'
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        {mealFocus === 'lunch' && (
                          <motion.div
                            layoutId="modalMealTabPill"
                            className="absolute inset-0 bg-white dark:bg-[#1a2521] rounded-lg shadow-xs -z-10 border border-gray-200/80 dark:border-white/10"
                            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                          />
                        )}
                        <Utensils className="w-3 h-3 text-emerald-500" />
                        <span>{t('navLunch', 'Lunch')}</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Overrides Pill Strip */}
                  {activeExceptionsList.length > 0 && (
                    <div className="pt-2 border-t border-gray-200/60 dark:border-white/5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-gray-500 font-bold">
                        <span>Upcoming Single-Day Overrides ({activeExceptionsList.length}):</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {activeExceptionsList.map((exc) => (
                          <span
                            key={exc.dateKey}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                              !exc.isBfOn && !exc.isLuOn
                                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20'
                                : 'bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20'
                            }`}
                          >
                            <span>{formatFriendlyDate(exc.dateKey, false)}</span>
                            <span>:</span>
                            <span>{exc.label}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Calendar Grid View: Either Parallel Both or Single Focused Meal */}
                <div
                  className={`grid gap-4 sm:gap-6 ${
                    mealFocus === 'both' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 max-w-2xl mx-auto'
                  }`}
                >
                  {(mealFocus === 'both' || mealFocus === 'breakfast') &&
                    renderMealCalendarCard('breakfast')}

                  {(mealFocus === 'both' || mealFocus === 'lunch') &&
                    renderMealCalendarCard('lunch')}
                </div>

                {/* System Legend & Help */}
                <div className="p-2.5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 text-[10px] text-gray-500">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>ON (Serving)</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      <span>OFF (Leave)</span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="inline-flex items-center justify-center w-3 h-3 rounded bg-indigo-600 text-white text-[7px] font-black ring-1 ring-white/40">
                        ✦
                      </span>
                      <span>Single-Day Override</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full ring-2 ring-emerald-400" />
                      <span>Today</span>
                    </span>
                  </div>

                  <span className="font-semibold text-gray-400">
                    {isAdmin
                      ? 'Admin: Click any date to toggle meal attendance'
                      : 'Live accurate date-by-date calendar'}
                  </span>
                </div>

                {/* Dietary Inclusions & Exemptions */}
                <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/5">
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('dietaryPreferencesLabel', 'Dietary Inclusions & Exemptions')}
                  </span>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {preferencesList.map((pref) => {
                      const isIncluded =
                        activeDoc.obj2 && activeDoc.obj2[pref.id] !== undefined
                          ? Boolean(activeDoc.obj2[pref.id])
                          : true;
                      return (
                        <span
                          key={pref.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                            isIncluded
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20'
                              : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isIncluded ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                          />
                          <span>
                            {lang === 'ml' && pref.labelMl
                              ? pref.labelMl
                              : pref.labelEn || pref.name}
                          </span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ================= MODAL FOOTER ACTION BAR ================= */}
          <div className="p-3 sm:p-4 bg-gray-50/90 dark:bg-white/[0.02] border-t border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row gap-2 justify-between items-center">
            {isAdmin ? (
              /* Admin Master Board Actions */
              <div className="w-full flex flex-col sm:flex-row gap-2">
                {onOpenFullDrawer && (
                  <button
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      const s = activeDoc;
                      onClose();
                      onOpenFullDrawer(s);
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Edit className="w-4 h-4" />
                    <span>{t('editFullProfile', 'Edit Full Profile in Drawer')}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    const tNo = activeDoc.tokenNo;
                    onClose();
                    navigate(`/student?token=${tNo}`);
                  }}
                  className="py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-800 dark:text-gray-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{t('studentPortal', 'Student Portal')}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    onClose();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-gray-200/70 dark:bg-white/5 hover:bg-gray-300 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  {t('closeNotice', 'Close')}
                </button>
              </div>
            ) : (
              /* Public / Student Dashboard Actions */
              <div className="w-full flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    onClose();
                    navigate(`/login?token=${activeDoc.tokenNo}`);
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <span>
                    {t(
                      'areYouStudent',
                      `Are you Student #${activeDoc.tokenNo}? Update your Preferences in Portal`
                    ).replace('{token}', activeDoc.tokenNo)}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    onClose();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 font-bold text-xs transition-colors cursor-pointer"
                >
                  {t('closeNotice', 'Close')}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
