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
  LayoutGrid,
} from 'lucide-react';
import firebase from '../../firebase/config';
import { AuthContext } from '../../store/AuthContext';
import { DataOfOne } from '../../store/StudentData';
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
  addDaysToDate,
  getDayOfWeekShort,
} from '../../utils/studentExceptionService';
import { subscribeToBoardServiceSchedule, getMealSupplyStatus } from '../../utils/boardServiceSchedule';
import DateTokenButton from './DateTokenButton';
import IslamicAvatar from './IslamicAvatar';

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
  const studentContext = useContext(DataOfOne);
  const stdata = studentContext?.stdata;
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();

  // Local student state to allow instant reactive updates (optimistic toggling for admins)
  const [currentStudent, setCurrentStudent] = useState(student);
  useEffect(() => {
    setCurrentStudent(student);
  }, [student]);

  const activeDoc = currentStudent || student;

  // Token lock and world-time status
  const {
    todayIST,
    tomorrowIST,
    isTomorrowLocked,
    getDateLockStatus,
    isPortalAccessible,
  } = useTokenLockStatus();

  // Role & Session calculation
  const isEffectiveAdmin = isAdmin || Boolean(user);
  const isCurrentLoggedInStudent = Boolean(
    !isEffectiveAdmin &&
    stdata?.tokenNo &&
    activeDoc?.tokenNo &&
    Number(stdata.tokenNo) === Number(activeDoc.tokenNo)
  );
  const isOtherLoggedInStudent = Boolean(
    !isEffectiveAdmin &&
    stdata?.tokenNo &&
    activeDoc?.tokenNo &&
    Number(stdata.tokenNo) !== Number(activeDoc.tokenNo)
  );

  // Board food supply schedule subscription
  const [boardServiceSchedule, setBoardServiceSchedule] = useState({});
  useEffect(() => {
    const unsub = subscribeToBoardServiceSchedule((schedule) => {
      setBoardServiceSchedule(schedule || {});
    });
    return () => unsub();
  }, []);

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

  // Active calendar perspective: 'month' | 'week' | 'day' (Default to 'month')
  const [activeView, setActiveView] = useState('month');
  const [weekAnchorDate, setWeekAnchorDate] = useState(() => targetDateIST || todayIST);
  const [dayAnchorDate, setDayAnchorDate] = useState(() => targetDateIST || todayIST);

  // Meal focus tab: 'both' | 'breakfast' | 'lunch' (Default to 'both' meals view)
  const [mealFocus, setMealFocus] = useState('both');
  useEffect(() => {
    if (isOpen) {
      const base = targetDateIST || todayIST;
      setWeekAnchorDate(base);
      setDayAnchorDate(base);
      setMealFocus('both');
    }
  }, [isOpen, targetDateIST, todayIST]);

  // 7 dates of current week in Week view (Sunday to Saturday)
  const modalWeekDates = useMemo(() => {
    const dow = getDayOfWeekShort(weekAnchorDate);
    const dayIdx = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'].indexOf(dow) !== -1
      ? ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'].indexOf(dow)
      : 0;
    const sundayDate = addDaysToDate(weekAnchorDate, -dayIdx);
    return Array.from({ length: 7 }, (_, i) => addDaysToDate(sundayDate, i));
  }, [weekAnchorDate]);

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

    if (!isEffectiveAdmin) {
      feedback('pop');
      const meals = calculateEffectiveDateMeals(activeDoc, dateStr);
      const isRoutineBf = meals.routineBreakfast;
      const isRoutineLunch = meals.routineLunch;
      const bfText = meals.breakfast ? t('takingOn', 'Taking (ON)') : t('skippedOff', 'Skipped (OFF)');
      const luText = meals.lunch ? t('takingOn', 'Taking (ON)') : t('skippedOff', 'Skipped (OFF)');
      const dateLabel = formatFriendlyDate(dateStr, true);
      const mealName = mealType === 'lunch' ? t('navLunch', 'Lunch') : mealType === 'breakfast' ? t('navBreakfast', 'Breakfast') : t('navBoth', 'Meals');

      if (isCurrentLoggedInStudent) {
        const confirmed = await dialog.confirm({
          title: t('switchTokenInPortalTitle', 'Switch Token #{token} in Portal').replace('{token}', activeDoc.tokenNo),
          message: `${dateLabel} (${mealName}):\n• Breakfast: ${bfText}\n• Lunch: ${luText}\n\n${t(
            'openPortalToSwitchDesc',
            'To turn breakfast or lunch ON or OFF and save your changes, open your Student Portal.'
          )}`,
          confirmText: t('openStudentPortal', 'Open Student Portal'),
          cancelText: t('closeNotice', 'Stay Here'),
          confirmColor: 'emerald',
          icon: 'question',
        });
        if (confirmed) {
          onClose();
          navigate('/student');
        }
        return;
      }

      const confirmed = await dialog.confirm({
        title: t('loginRequiredToToggleTitle', 'Login Required to Switch Token'),
        message: `${dateLabel} (${mealName}):\n• Breakfast: ${bfText}\n• Lunch: ${luText}\n\n${t(
          'loginRequiredToToggleDesc',
          'Tokens cannot be switched directly from the public board. To turn Token #{token} ON or OFF for {date}, please log in with your student password.'
        )
          .replace('{token}', activeDoc.tokenNo)
          .replace('{date}', dateLabel)}`,
        confirmText: t('loginToSwitchToken', 'Log In to Switch Token #{token}').replace(
          '{token}',
          activeDoc.tokenNo
        ),
        cancelText: t('closeNotice', 'Close (Just Viewing)'),
        confirmColor: 'emerald',
        icon: 'lock',
      });

      if (confirmed) {
        onClose();
        navigate(`/login?token=${activeDoc.tokenNo}`);
      }
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

            {!isEffectiveAdmin ? (
              <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold flex items-center gap-1 shrink-0 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/10">
                <Lock className="w-3 h-3 text-gray-400" />
                <span>{t('viewOnlyBadge', 'View Only')}</span>
              </span>
            ) : (
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
              const bfSupply = getMealSupplyStatus(boardServiceSchedule, day.dateStr, 'breakfast');
              const lunchSupply = getMealSupplyStatus(boardServiceSchedule, day.dateStr, 'lunch');
              const isBfSupplyOff = !bfSupply.isSupplying;
              const isLunchSupplyOff = !lunchSupply.isSupplying;
              const lockInfo = getDateLockStatus(day.dateStr, { isAdmin, mealType });

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
                    isAdmin={isEffectiveAdmin}
                    isReadOnly={!isEffectiveAdmin}
                    isAdminOverride={lockInfo.isAdminOverride}
                    lockReason={lockInfo.reason}
                    breakfast={meals.breakfast}
                    lunch={meals.lunch}
                    activeMeal={mealType}
                    showDualPills={false}
                    hasException={isMealOverridden}
                    exceptionLabel={meals.label || (isMealOverridden ? 'Custom Schedule' : '')}
                    isBfSupplyOff={isBfSupplyOff}
                    isLunchSupplyOff={isLunchSupplyOff}
                    onClick={(d) => handleDateClick(d, mealType)}
                    onLockedClick={async (d, reason) => {
                      if (!isEffectiveAdmin) {
                        feedback('warning');
                        const dateLabel = formatFriendlyDate(d, true);
                        if (!isCurrentLoggedInStudent) {
                          const confirmed = await dialog.confirm({
                            title: t('dateLockedTitle', 'Date Locked • Login Required'),
                            message: `${dateLabel}: ${reason || t('cutoffPassed', 'Cutoff deadline has passed.')}\n\n${t(
                              'loginRequiredToToggleDesc',
                              'Tokens cannot be switched directly from the public board. To turn Token #{token} ON or OFF for {date}, please log in with your student password.'
                            )
                              .replace('{token}', activeDoc.tokenNo)
                              .replace('{date}', dateLabel)}`,
                            confirmText: t('loginToSwitchToken', 'Log In to Switch Token #{token}').replace(
                              '{token}',
                              activeDoc.tokenNo
                            ),
                            cancelText: t('closeNotice', 'Close'),
                            confirmColor: 'amber',
                            icon: 'lock',
                          });
                          if (confirmed) {
                            onClose();
                            navigate(`/login?token=${activeDoc.tokenNo}`);
                          }
                        } else {
                          dialog.toast.warning(t('dateLocked', 'Date Locked'), reason || t('cutoffPassed', 'Cutoff deadline has passed.'));
                        }
                      }
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Card Footnote */}
        {/* <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[10px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Serving</span>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 ml-1" />
            <span>Leave / OFF</span>
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider">
            {MONTH_NAMES[currentMonth].slice(0, 3)} {currentYear}
          </span>
        </div> */}
      </div>
    );
  };

  // Render Weekly 7-day strip view
  const renderWeekView = () => {
    return (
      <div className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2.5">
          {modalWeekDates.map((dateStr) => {
            const dow = getDayOfWeekShort(dateStr);
            const isToday = dateStr === todayIST;
            const meals = calculateEffectiveDateMeals(activeDoc, dateStr);

            return (
              <div
                key={dateStr}
                className={`p-3 rounded-2xl border transition-all flex flex-col justify-between space-y-2.5 ${
                  isToday
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30'
                    : 'bg-gray-50/80 dark:bg-white/[0.02] border-gray-200/80 dark:border-white/10'
                }`}
              >
                {/* Header: Day name + Date + Today Badge */}
                <div className="flex items-center justify-between pb-1.5 border-b border-gray-200/60 dark:border-white/5">
                  <div className="min-w-0">
                    <span className="text-xs font-black text-gray-900 dark:text-white block uppercase">
                      {t(`daysShort.${dow}`) || dow.toUpperCase()}
                    </span>
                    <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
                      {formatFriendlyDate(dateStr, false)}
                    </span>
                  </div>
                  {isToday && (
                    <span className="px-1.5 py-0.5 rounded-full text-[9px] font-black bg-emerald-600 text-white uppercase animate-pulse">
                      {t('today', 'Today')}
                    </span>
                  )}
                </div>

                {/* Meals in this day */}
                <div className="space-y-1.5">
                  {/* Breakfast */}
                  {(mealFocus === 'both' || mealFocus === 'breakfast') && (
                    <button
                      type="button"
                      onClick={() => handleDateClick(dateStr, 'breakfast')}
                      className={`w-full p-2 rounded-xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                        meals.breakfast
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600/40 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-600/30 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Coffee className="w-3 h-3 shrink-0 text-amber-500" />
                        <span className="text-[11px] font-bold truncate">Bf</span>
                      </div>
                      <span className="text-[10px] font-black">
                        {meals.breakfast ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  )}

                  {/* Lunch */}
                  {(mealFocus === 'both' || mealFocus === 'lunch') && (
                    <button
                      type="button"
                      onClick={() => handleDateClick(dateStr, 'lunch')}
                      className={`w-full p-2 rounded-xl text-left transition-all border flex items-center justify-between cursor-pointer ${
                        meals.lunch
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-600/40 text-emerald-800 dark:text-emerald-300'
                          : 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-600/30 text-rose-700 dark:text-rose-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Utensils className="w-3 h-3 shrink-0 text-emerald-500" />
                        <span className="text-[11px] font-bold truncate">Lunch</span>
                      </div>
                      <span className="text-[10px] font-black">
                        {meals.lunch ? 'ON' : 'OFF'}
                      </span>
                    </button>
                  )}
                </div>

                {/* Day Summary */}
                <div className="text-[10px] text-center font-bold text-gray-500 dark:text-gray-400 pt-1">
                  {meals.isAllOn ? 'Full Active' : meals.isAllOff ? 'Full Leave' : 'Partial'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Render Daily deep focus card
  const renderDayView = () => {
    const meals = calculateEffectiveDateMeals(activeDoc, dayAnchorDate);
    const isToday = dayAnchorDate === todayIST;
    const isTomorrow = dayAnchorDate === tomorrowIST;

    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {/* Day Header Hero */}
        <div className="p-4 sm:p-5 rounded-3xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <CalendarDays className="w-4 h-4 text-emerald-500" />
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                {formatFriendlyDate(dayAnchorDate, true)}
              </h3>
              {isToday ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white animate-pulse">
                  {t('today', 'Today')}
                </span>
              ) : isTomorrow ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-500 text-white">
                  {t('tomorrow', 'Tomorrow')}
                </span>
              ) : null}
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {meals.isAllOn
                ? 'Standard Routine: Both Breakfast and Lunch active'
                : meals.isAllOff
                ? 'On Leave: Both meals switched off'
                : 'Custom: One meal active, one meal skipped'}
            </p>
          </div>

          {!isEffectiveAdmin && (
            <span className="text-[11px] font-bold text-gray-500 bg-gray-100 dark:bg-white/5 px-2.5 py-1 rounded-xl border border-gray-200/80 dark:border-white/10 flex items-center gap-1.5 self-start sm:self-auto">
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span>{t('viewOnlyBadge', 'View Only')}</span>
            </span>
          )}
        </div>

        {/* Dual Meal Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Breakfast Card */}
          {(mealFocus === 'both' || mealFocus === 'breakfast') && (
            <div
              onClick={() => handleDateClick(dayAnchorDate, 'breakfast')}
              className={`p-4 rounded-3xl border transition-all cursor-pointer space-y-3 ${
                meals.breakfast
                  ? 'bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-transparent border-emerald-300 dark:border-emerald-600/40 shadow-xs'
                  : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-600/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                      {t('navBreakfast', 'Breakfast')}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-mono">07:00 AM – 08:30 AM</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    meals.breakfast
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {meals.breakfast ? 'SERVING (ON)' : 'LEAVE (OFF)'}
                </span>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-300 pt-1 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <span>{meals.routineBreakfast ? 'Routine Default: Active' : 'Routine Default: Off'}</span>
                {meals.breakfast !== meals.routineBreakfast && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Exception</span>
                )}
              </div>
            </div>
          )}

          {/* Lunch Card */}
          {(mealFocus === 'both' || mealFocus === 'lunch') && (
            <div
              onClick={() => handleDateClick(dayAnchorDate, 'lunch')}
              className={`p-4 rounded-3xl border transition-all cursor-pointer space-y-3 ${
                meals.lunch
                  ? 'bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-transparent border-emerald-300 dark:border-emerald-600/40 shadow-xs'
                  : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-600/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                      {t('navLunch', 'Lunch')}
                    </h4>
                    <span className="text-[10px] text-gray-400 font-mono">12:30 PM – 02:00 PM</span>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-black ${
                    meals.lunch
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-rose-600 text-white'
                  }`}
                >
                  {meals.lunch ? 'SERVING (ON)' : 'LEAVE (OFF)'}
                </span>
              </div>

              <div className="text-xs text-gray-600 dark:text-gray-300 pt-1 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <span>{meals.routineLunch ? 'Routine Default: Active' : 'Routine Default: Off'}</span>
                {meals.lunch !== meals.routineLunch && (
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Exception</span>
                )}
              </div>
            </div>
          )}
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
              {/* Tactile Token Number Keycap & Islamic Avatar */}
              <IslamicAvatar
                student={activeDoc}
                size={48}
                showStatusRing
                animate={false}
                className="shrink-0"
              />

              {/* Student Metadata */}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-bold text-white truncate">
                    {activeDoc.nameEn || activeDoc.name || `Student ${activeDoc.tokenNo}`}
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
                        Token {activeDoc.tokenNo} Blocked
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
                {/* Clear Guidance Banner: View-Only Attendance vs Login to Switch */}
                {/* {!isEffectiveAdmin && (
                  <div className="w-full">
                    {isCurrentLoggedInStudent ? (
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                            <CheckCircle2 className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-xs text-emerald-950 dark:text-emerald-200">
                                {t('loggedInAsThisStudent', 'You are logged in as Student #{token}').replace('{token}', activeDoc.tokenNo)}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                                {t('activeSession', 'Active Session')}
                              </span>
                            </div>
                            <p className="text-[11px] text-emerald-800/90 dark:text-emerald-300/80 leading-relaxed mt-0.5">
                              {t('openPortalToSwitchDesc', 'To turn breakfast or lunch ON or OFF and save your changes, open your Student Portal.')}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            feedback('tick');
                            onClose();
                            navigate('/student');
                          }}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer active:scale-95"
                        >
                          <span>{t('goToPortalToSwitch', 'Go to Portal to Switch Token')}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : isOtherLoggedInStudent ? (
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                            <Info className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-xs text-amber-950 dark:text-amber-200">
                                {t('viewOnlyAttendanceTitle', 'View-Only Token Record')}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                                {t('signedInAsOtherToken', 'Logged in as Token #{token}').replace('{token}', stdata.tokenNo)}
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 leading-relaxed mt-0.5">
                              {t('mustLoginAsThisTokenDesc', 'To switch meals for Token #{token}, sign in with this student\'s password.').replace('{token}', activeDoc.tokenNo)}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            feedback('tick');
                            onClose();
                            navigate(`/login?token=${activeDoc.tokenNo}`);
                          }}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer active:scale-95"
                        >
                          <span>{t('loginAsToken', 'Log In as Token #{token}').replace('{token}', activeDoc.tokenNo)}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="p-3.5 sm:p-4 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                        <div className="flex items-start gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0 mt-0.5">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                                {t('viewOnlyAttendanceTitle', 'View-Only Token Record')}
                              </span>
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
                                {t('loginRequiredToEdit', 'Login Required to Switch')}
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed mt-0.5">
                              {t(
                                'viewOnlyAttendanceNotice',
                                'Tokens cannot be switched directly from the public board. Log in to your Student Portal to turn Breakfast or Lunch ON or OFF.'
                              )}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            feedback('tick');
                            onClose();
                            navigate(`/login?token=${activeDoc.tokenNo}`);
                          }}
                          className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all shrink-0 cursor-pointer active:scale-95"
                        >
                          <span>{t('loginToSwitchToken', 'Log In to Switch Token #{token}').replace('{token}', activeDoc.tokenNo)}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div> 
                    )}
                  </div>
                )} */}

                {/* Navigation & View Perspective Control Deck */}
                <div className="p-3 sm:p-3.5 rounded-2xl sm:rounded-3xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 space-y-3 shadow-xs">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    
                    {/* Dynamic Stepper based on activeView */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {activeView === 'month' && (
                        <>
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

                          <button
                            type="button"
                            onClick={handleJumpToToday}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
                          >
                            {t('todayBtn', 'Today')}
                          </button>
                        </>
                      )}

                      {activeView === 'week' && (
                        <>
                          <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-white dark:bg-[#1a2521] border border-gray-200/80 dark:border-white/10 shadow-xs">
                            <button
                              type="button"
                              onClick={() => {
                                feedback('tick');
                                setWeekAnchorDate((prev) => addDaysToDate(prev, -7));
                              }}
                              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                              title="Previous Week"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-2.5 text-xs font-black font-mono text-gray-900 dark:text-white min-w-[140px] text-center">
                              {formatFriendlyDate(modalWeekDates[0], false)} – {formatFriendlyDate(modalWeekDates[6], false)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                feedback('tick');
                                setWeekAnchorDate((prev) => addDaysToDate(prev, 7));
                              }}
                              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                              title="Next Week"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              feedback('tick');
                              setWeekAnchorDate(todayIST);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
                          >
                            {t('thisWeek', 'This Week')}
                          </button>
                        </>
                      )}

                      {activeView === 'day' && (
                        <>
                          <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-white dark:bg-[#1a2521] border border-gray-200/80 dark:border-white/10 shadow-xs">
                            <button
                              type="button"
                              onClick={() => {
                                feedback('tick');
                                setDayAnchorDate((prev) => addDaysToDate(prev, -1));
                              }}
                              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                              title="Previous Day"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="px-2.5 text-xs sm:text-sm font-black font-mono text-gray-900 dark:text-white min-w-[140px] text-center">
                              {formatFriendlyDate(dayAnchorDate, true)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                feedback('tick');
                                setDayAnchorDate((prev) => addDaysToDate(prev, 1));
                              }}
                              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                              title="Next Day"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              feedback('tick');
                              setDayAnchorDate(todayIST);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
                          >
                            {t('todayBtn', 'Today')}
                          </button>
                        </>
                      )}
                    </div>

                    {/* Right Controls: View Perspective Switcher + Meal Focus Switcher */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* View Perspective Switcher (Month | Week | Day) */}
                      <div className="inline-flex p-0.5 rounded-xl bg-gray-200/70 dark:bg-white/10 border border-gray-300/40 dark:border-white/5 text-xs font-bold">
                        {[
                          { key: 'month', label: t('viewMonth', 'Month'), icon: LayoutGrid },
                          { key: 'week', label: t('viewWeek', 'Week'), icon: CalendarDays },
                          { key: 'day', label: t('viewDay', 'Day'), icon: Clock },
                        ].map(({ key, label, icon: Icon }) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => {
                              feedback('tick');
                              setActiveView(key);
                            }}
                            className={`relative px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 select-none cursor-pointer ${
                              activeView === key
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                          >
                            {activeView === key && (
                              <motion.div
                                layoutId="modalViewTabPill"
                                className="absolute inset-0 bg-white dark:bg-[#1a2521] rounded-lg shadow-xs -z-10 border border-gray-200/80 dark:border-white/10"
                                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                              />
                            )}
                            <Icon className="w-3.5 h-3.5" />
                            <span>{label}</span>
                          </button>
                        ))}
                      </div>

                      {/* Meal Focus Switcher (Both Meals | Breakfast | Lunch) */}
                      <div className="inline-flex p-0.5 rounded-xl bg-gray-200/70 dark:bg-white/10 border border-gray-300/40 dark:border-white/5 text-xs font-bold">
                        <button
                          type="button"
                          onClick={() => {
                            feedback('tick');
                            setMealFocus('both');
                          }}
                          className={`relative px-2.5 py-1 rounded-lg transition-colors select-none cursor-pointer ${
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
                          <span>{t('viewBothParallel', 'Both')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            feedback('tick');
                            setMealFocus('breakfast');
                          }}
                          className={`relative px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 select-none cursor-pointer ${
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
                          <span className="hidden sm:inline">{t('navBreakfast', 'Breakfast')}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            feedback('tick');
                            setMealFocus('lunch');
                          }}
                          className={`relative px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 select-none cursor-pointer ${
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
                          <span className="hidden sm:inline">{t('navLunch', 'Lunch')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Perspective View Dispatcher: Month | Week | Day */}
                {activeView === 'month' && (
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
                )}

                {activeView === 'week' && renderWeekView()}

                {activeView === 'day' && renderDayView()}

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
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full ring-2 ring-emerald-400" />
                      <span>Today</span>
                    </span>
                  </div>

                  {/* <span className="font-semibold text-gray-400">
                    {isEffectiveAdmin
                      ? t('adminToggleHelp', 'Admin: Click any date to toggle meal attendance')
                      : t('viewOnlyLegendHelp', 'Live attendance record • Login to Student Portal to turn tokens ON/OFF')}
                  </span> */}
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
            {isEffectiveAdmin ? (
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
                {isCurrentLoggedInStudent ? (
                  <button
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      onClose();
                      navigate('/student');
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {t('openPortalToSwitchToken', 'Open Student Portal to Switch Token (ON / OFF)')}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    data-tour="token-modal-login-btn"
                    onClick={() => {
                      feedback('tick');
                      onClose();
                      navigate(`/login?token=${activeDoc.tokenNo}`);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {t(
                        'loginToSwitchTokenAction',
                        `Log In as Token ${activeDoc.tokenNo}`
                      ).replace('{token}', activeDoc.tokenNo)}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
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
