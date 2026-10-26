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

/**
 * useDateController
 *
 * Lightweight, high-precision date management controller for public and administrative views.
 * Provides complete feature-parity with useTokenBoardController without heavy student document queries.
 *
 * Capabilities:
 * - Anti-tamper IST clock synchronization (Asia/Kolkata)
 * - Dynamic board display auto-shift (today -> tomorrow, default 2:00 PM IST / 2:15 PM Friday)
 * - dateMode: 'auto' | 'today' | 'tomorrow' | 'custom'
 * - Day-by-day steppers (◀ Prev Day, Next Day ▶)
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

  // Authoritative IST today string (YYYY-MM-DD)
  const todayIST = useMemo(() => worldTodayIST || getTodayISTDate(), [worldTodayIST]);

  // Determine if current IST time is past the dynamic board switch time (e.g. 2:00 PM / 14:00)
  const effectiveSwitchTime = boardSwitchTime || windowOpenTime || rawBoardSwitchTime || '14:00';
  const isPostEveningCutoff = Boolean(
    autoEveningShift && isPastBoardSwitchTime(timeHms, effectiveSwitchTime)
  );

  const [dateMode, setDateMode] = useState(initialDateMode); // 'auto' | 'today' | 'tomorrow' | 'custom'
  const [customDate, setCustomDate] = useState(initialCustomDate);

  // Compute reactive targetDateIST
  const targetDateIST = useMemo(() => {
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
    // If past window open time (e.g. 2:00 PM), advance to tomorrow by default
    // Otherwise before open time, show today by default
    if (isPostEveningCutoff) {
      return addDaysToDate(todayIST, 1);
    }
    return todayIST;
  }, [dateMode, customDate, todayIST, isPostEveningCutoff]);

  // Effective 2-letter lowercase day for schedule resolution ('su'..'sa')
  const effectiveDay = useMemo(() => {
    return getDayOfWeekShort(targetDateIST);
  }, [targetDateIST]);

  // Relative metadata (distance, labels: 'Yesterday', 'Today', 'Tomorrow', 'In 3 days', etc.)
  const relativeDateMeta = useMemo(() => {
    return getRelativeDateMeta(targetDateIST, todayIST);
  }, [targetDateIST, todayIST]);

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
      setDateMode('custom');
      setCustomDate(dateStr);
    }
  }, []);

  const setDateToAuto = useCallback(() => {
    setDateMode('auto');
    setCustomDate('');
  }, []);

  const shiftDate = useCallback(
    (days) => {
      if (!days || isNaN(days)) return;
      const nextDate = addDaysToDate(targetDateIST, days);
      setDateMode('custom');
      setCustomDate(nextDate);
    },
    [targetDateIST]
  );

  const stepDateBackward = useCallback(() => {
    shiftDate(-1);
  }, [shiftDate]);

  const stepDateForward = useCallback(() => {
    shiftDate(1);
  }, [shiftDate]);

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
