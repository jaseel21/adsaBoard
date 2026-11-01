import { useState, useMemo, useCallback } from 'react';
import { useWorldTime } from './time';
import { useTokenLockStatus } from './useTokenLockStatus';
import {
  getTodayISTDate,
  addDaysToDate,
  getDayOfWeekShort,
  getRelativeDateMeta,
  isPastBoardSwitchTime,
  isPastBoardWindowOpenTime,
} from './studentExceptionService';
import { useAcademicYear, clampDateToAcademicYear } from './academicYearService';

/**
 * useDateController
 *
 * Lightweight, high-precision date management controller for public and administrative views.
 * Strictly bounded by the institutional Academic Year [startDate, endDate].
 *
 * Capabilities:
 * - Anti-tamper IST clock synchronization (Asia/Kolkata)
 * - Dynamic board display auto-shift (today -> tomorrow, default 2:00 PM IST / 2:15 PM Friday)
 * - Strict clamping within active Academic Year bounds
 * - Bounded day-by-day steppers (◀ Prev Day disabled at startDate, Next Day ▶ disabled at endDate)
 * - Direct date selection (calendar picker)
 * - Full compliance with TokenBoardDateRibbon & TokenBoardCalendarPopover
 */
export function useDateController({
  initialDateMode = 'auto',
  initialCustomDate = '',
  autoEveningShift = true,
  boardSwitchTime = null,
  windowOpenTime = null,
} = {}) {
  const {
    timeHms,
    time12,
    longDate,
    dayShort,
    dayFull,
    isSynced,
    todayIST: worldTodayIST,
  } = useWorldTime('Asia/Kolkata');

  const { activeWindow, rawBoardSwitchTime, boardSwitchTime: statusBoardSwitchTime } = useTokenLockStatus();
  const { academicYear, startDate: acadStartDate, endDate: acadEndDate, clampDate } = useAcademicYear();

  // Authoritative IST today string (YYYY-MM-DD)
  const todayIST = useMemo(() => worldTodayIST || getTodayISTDate(), [worldTodayIST]);

  // Determine if current IST time is past the dynamic board switch time (e.g. 2:00 PM / 14:00)
  const effectiveSwitchTime = boardSwitchTime || windowOpenTime || rawBoardSwitchTime || '14:00';
  const isPostEveningCutoff = Boolean(
    autoEveningShift && isPastBoardSwitchTime(timeHms, effectiveSwitchTime)
  );

  const [dateMode, setDateMode] = useState(initialDateMode); // 'auto' | 'today' | 'tomorrow' | 'custom'
  const [customDate, setCustomDate] = useState(initialCustomDate);

  // Compute raw target date before bounding
  const rawTargetDate = useMemo(() => {
    if (dateMode === 'today') {
      return todayIST;
    }
    if (dateMode === 'tomorrow') {
      return addDaysToDate(todayIST, 1);
    }
    if (dateMode === 'custom' && customDate) {
      return customDate;
    }
    // 'auto' mode:
    if (isPostEveningCutoff) {
      return addDaysToDate(todayIST, 1);
    }
    return todayIST;
  }, [dateMode, customDate, todayIST, isPostEveningCutoff]);

  // Compute reactive targetDateIST strictly clamped within active Academic Year
  const targetDateIST = useMemo(() => {
    if (!academicYear) return rawTargetDate;
    if (acadStartDate && rawTargetDate < acadStartDate) {
      return acadStartDate;
    }
    if (acadEndDate && rawTargetDate > acadEndDate) {
      return acadEndDate;
    }
    return rawTargetDate;
  }, [rawTargetDate, academicYear, acadStartDate, acadEndDate]);

  // Effective 2-letter lowercase day for schedule resolution ('su'..'sa')
  const effectiveDay = useMemo(() => {
    return getDayOfWeekShort(targetDateIST);
  }, [targetDateIST]);

  // Relative metadata (distance, labels: 'Yesterday', 'Today', 'Tomorrow', 'In 3 days', etc.)
  const relativeDateMeta = useMemo(() => {
    return getRelativeDateMeta(targetDateIST, todayIST);
  }, [targetDateIST, todayIST]);

  // Boundary checks for steppers
  const canStepBackward = useMemo(() => {
    if (!acadStartDate) return true;
    return targetDateIST > acadStartDate;
  }, [targetDateIST, acadStartDate]);

  const canStepForward = useMemo(() => {
    if (!acadEndDate) return true;
    return targetDateIST < acadEndDate;
  }, [targetDateIST, acadEndDate]);

  const setDateToToday = useCallback(() => {
    setDateMode('today');
    setCustomDate('');
  }, []);

  const setDateToTomorrow = useCallback(() => {
    setDateMode('tomorrow');
    setCustomDate('');
  }, []);

  const setDateToCustom = useCallback((dateStr) => {
    if (dateStr) {
      const clamped = clampDateToAcademicYear(dateStr, academicYear);
      setDateMode('custom');
      setCustomDate(clamped);
    }
  }, [academicYear]);

  const setDateToAuto = useCallback(() => {
    setDateMode('auto');
    setCustomDate('');
  }, []);

  const shiftDate = useCallback(
    (days) => {
      if (!days || isNaN(days)) return;
      const nextDate = addDaysToDate(targetDateIST, days);
      const boundedDate = clampDateToAcademicYear(nextDate, academicYear);
      setDateMode('custom');
      setCustomDate(boundedDate);
    },
    [targetDateIST, academicYear]
  );

  const stepDateBackward = useCallback(() => {
    if (!canStepBackward) return;
    shiftDate(-1);
  }, [canStepBackward, shiftDate]);

  const stepDateForward = useCallback(() => {
    if (!canStepForward) return;
    shiftDate(1);
  }, [canStepForward, shiftDate]);

  return {
    // Primary reactive date states
    targetDateIST,
    todayIST,
    dateMode,
    customDate,
    effectiveDay,
    relativeDateMeta,
    isPostEveningCutoff,
    boardSwitchTime: effectiveSwitchTime,
    isPastBoardSwitch: isPostEveningCutoff,

    // Academic Year Boundaries
    academicYear,
    academicYearStartDate: acadStartDate,
    academicYearEndDate: acadEndDate,
    canStepBackward,
    canStepForward,
    isAtAcademicYearStart: Boolean(acadStartDate && targetDateIST === acadStartDate),
    isAtAcademicYearEnd: Boolean(acadEndDate && targetDateIST === acadEndDate),

    // Relative boolean flags
    isToday: targetDateIST === todayIST,
    isTomorrow: targetDateIST === addDaysToDate(todayIST, 1),
    isYesterday: relativeDateMeta?.isYesterday || false,
    isPastDate: relativeDateMeta?.isPast || false,
    isFutureDate: relativeDateMeta?.isFuture || false,

    // Steppers and setter actions
    setDateToToday,
    setDateToTomorrow,
    setDateToCustom,
    setDateToAuto,
    shiftDate,
    stepDateBackward,
    stepDateForward,

    // Anti-tamper IST clock metadata
    timeHms,
    time12,
    longDate,
    dayShort,
    dayFull,
    isSynced,
  };
}

export default useDateController;
