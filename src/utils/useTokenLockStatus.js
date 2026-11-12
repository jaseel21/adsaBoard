import { useState, useEffect, useMemo, useCallback } from 'react';
import firebase from '../firebase/config';
import { getPreferredClockFormat, resolveClockFormat, useWorldTime } from './time';
import { usePreferences } from '../store/PreferencesContext';
import { useMasterGovernance } from '../store/MasterGovernanceContext';
import {
  getTodayISTDate,
  addDaysToDate,
  getDayOfWeekShort,
  formatFriendlyDate,
  normalizeTimeToHms,
  isPastBoardSwitchTime,
  isPastBoardWindowOpenTime,
  getDefaultBoardDayOffset,
  getDefaultBoardTargetDate,
} from './studentExceptionService';

export {
  isPastBoardSwitchTime,
  isPastBoardWindowOpenTime,
  getDefaultBoardDayOffset,
  getDefaultBoardTargetDate,
};

const TOKENBOARD_DOC_ID = 'g8iJVNn2RQkysjMAvX1h';

/**
 * Format canonical 24h time "HH:mm" / "HH:mm:ss" using the user's selected clock style.
 */
export function formatTime12(timeStr, includeTz = true, format = getPreferredClockFormat()) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  if (isNaN(h)) return timeStr;
  if (resolveClockFormat(format) === '24h') {
    return `${String(h).padStart(2, '0')}:${m}${includeTz ? ' IST' : ''}`;
  }
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const formattedH = String(h12).padStart(2, '0');
  return `${formattedH}:${m} ${period}${includeTz ? ' IST' : ''}`;
}

/**
 * Default Token Board Configuration
 * 
 * Business Rules & Separation of Concerns:
 * 1. Cutoff Deadline Engine (Student Token Updates):
 *    - Web is open to login ANY TIME (24/7)
 *    - TODAY: Closed by default; an active unlock override can open today for students.
 *    - PAST SERVICE DATES: Always immutable, including during unlock overrides.
 *    - TOMORROW: Open all day until the cutoff deadline (default: 11:00 PM / 23:00 IST)
 *    - FUTURE DATES: Always open for advance scheduling and leaves
 *
 * 2. Board Today-Tomorrow Display Transition Engine (Board Auto-Shift):
 *    - Controls when public boards, kitchen displays, and hero counters auto-advance
 *      their default target date from Today to Tomorrow.
 *    - 12:00 AM to Switch Time: Displays Today (serving Breakfast & Lunch).
 *    - Switch Time to 11:59 PM: Displays Tomorrow (kitchen preparation & advance planning).
 *    - Default: 2:00 PM (14:00 IST) on weekdays, 2:15 PM (14:15 IST) on Fridays (Jumu'ah).
 */
export const DEFAULT_LOCK_CONFIG = {
  status: false, // legacy boolean
  overrideMode: 'auto', // 'auto' | 'force_unlocked' | 'force_locked'
  cutoff: {
    deadlineTime: '23:00', // 11:00 PM IST unified cutoff deadline fallback
    breakfastDeadlineTime: '23:00', // Breakfast cutoff deadline
    lunchDeadlineTime: '23:00',     // Lunch cutoff deadline
    hasBreakfastDeadline: false,
    hasLunchDeadline: false,
    timezone: 'Asia/Kolkata',
    restrictOpenTime: false, // By default FALSE: Open all day until cutoff deadline
    openTime: '00:00',
  },
  // Dedicated Board Today-Tomorrow Display Transition Engine
  boardSwitch: {
    enabled: true,
    autoShiftTime: '14:00', // 2:00 PM IST default
    timezone: 'Asia/Kolkata',
    days: {
      su: { autoShiftTime: '14:00' },
      mo: { autoShiftTime: '14:00' },
      tu: { autoShiftTime: '14:00' },
      we: { autoShiftTime: '14:00' },
      th: { autoShiftTime: '14:00' },
      sa: { autoShiftTime: '14:00' },
    },
  },
  window: {
    startTime: '00:00', // Backwards compatibility: 12:00 AM
    endTime: '23:00',   // 11:00 PM IST cutoff deadline
    breakfastEndTime: '23:00',
    lunchEndTime: '23:00',
    timezone: 'Asia/Kolkata',
  },
  schedule: {
    enabled: false,
    days: {
      su: { startTime: '', endTime: '', deadlineTime: '', breakfastDeadlineTime: '', lunchDeadlineTime: '' },
      mo: { startTime: '', endTime: '', deadlineTime: '', breakfastDeadlineTime: '', lunchDeadlineTime: '' },
      tu: { startTime: '', endTime: '', deadlineTime: '', breakfastDeadlineTime: '', lunchDeadlineTime: '' },
      we: { startTime: '', endTime: '', deadlineTime: '', breakfastDeadlineTime: '', lunchDeadlineTime: '' },
      th: { startTime: '', endTime: '', deadlineTime: '', breakfastDeadlineTime: '', lunchDeadlineTime: '' },
      fr: { startTime: '', endTime: '', deadlineTime: '', breakfastDeadlineTime: '', lunchDeadlineTime: '' },
      sa: { startTime: '', endTime: '', deadlineTime: '', breakfastDeadlineTime: '', lunchDeadlineTime: '' },
    },
  },
  temporaryOverride: {
    active: false,
    mode: 'force_unlocked', // 'force_unlocked' | 'force_locked'
    expiresAt: null,
    reason: '',
    startedAt: null,
  },
  // Scheduled Calendar Events / Overrides (e.g., Vacation Freeze, Eid Holidays, Exam Period)
  scheduledEvents: [],
};

/**
 * Upgraded Unified Hook for Token Board Cutoffs & Board Display Auto-Shift Schedules
 */
export function useTokenLockStatus() {
  const { timeHms, todayIST: worldTodayIST, isSynced, isDeviceDesynced, syncSource } = useWorldTime('Asia/Kolkata');
  const { preferences } = usePreferences();
  const governance = useMasterGovernance();
  const clockFormat = preferences?.clockFormat || getPreferredClockFormat();
  const formatConfiguredTime = useCallback(
    (timeStr, includeTz = true) => formatTime12(timeStr, includeTz, clockFormat),
    [clockFormat]
  );
  const [config, setConfig] = useState(DEFAULT_LOCK_CONFIG);
  const [loadingConfig, setLoadingConfig] = useState(true);

  // Real-time Firestore subscription to tokenboard document
  useEffect(() => {
    const unsub = firebase
      .firestore()
      .collection('tokenboard')
      .doc(TOKENBOARD_DOC_ID)
      .onSnapshot(
        (doc) => {
          if (doc.exists) {
            const data = doc.data() || {};
            const cutoffData = data.cutoff || {};
            const windowData = data.window || {};
            const boardSwitchData = data.boardSwitch || {};

            // Ensure cutoff deadline has a robust fallback to 23:00
            const deadline = cutoffData.deadlineTime || windowData.endTime || '23:00';
            const breakfastDeadline = cutoffData.breakfastDeadlineTime || windowData.breakfastEndTime || deadline;
            const lunchDeadline = cutoffData.lunchDeadlineTime || windowData.lunchEndTime || deadline;
            const restrictOpen = Boolean(cutoffData.restrictOpenTime);
            const openTime = cutoffData.openTime || (restrictOpen ? (windowData.startTime || '00:00') : '00:00');

            // Dynamic Board Switch Setting
            const autoShiftTime = boardSwitchData.autoShiftTime || '14:00';

            // Normalize day-of-week custom schedules
            const rawDays = data.schedule?.days || {};
            const normalizedDays = {};
            ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'].forEach((dKey) => {
              const dConf = rawDays[dKey] || {};
              normalizedDays[dKey] = {
                ...DEFAULT_LOCK_CONFIG.schedule.days[dKey],
                ...dConf,
                // Keep empty overrides empty so the global meal-specific
                // deadlines remain effective when a day has no custom cutoff.
                deadlineTime: dConf.deadlineTime || dConf.endTime || '',
                endTime: dConf.endTime || dConf.deadlineTime || '',
                breakfastDeadlineTime: dConf.breakfastDeadlineTime || '',
                lunchDeadlineTime: dConf.lunchDeadlineTime || '',
              };
            });

            setConfig({
              status: Boolean(data.status),
              overrideMode: data.overrideMode || 'auto',
              cutoff: {
                deadlineTime: deadline,
                breakfastDeadlineTime: breakfastDeadline,
                lunchDeadlineTime: lunchDeadline,
                hasBreakfastDeadline: Boolean(cutoffData.breakfastDeadlineTime),
                hasLunchDeadline: Boolean(cutoffData.lunchDeadlineTime),
                timezone: cutoffData.timezone || windowData.timezone || 'Asia/Kolkata',
                restrictOpenTime: restrictOpen,
                openTime,
              },
              boardSwitch: {
                enabled: boardSwitchData.enabled !== false,
                autoShiftTime,
                timezone: boardSwitchData.timezone || 'Asia/Kolkata',
                days: {
                  ...DEFAULT_LOCK_CONFIG.boardSwitch.days,
                  ...(boardSwitchData.days || {}),
                },
              },
              window: {
                startTime: openTime,
                endTime: lunchDeadline > breakfastDeadline ? lunchDeadline : breakfastDeadline,
                breakfastEndTime: breakfastDeadline,
                lunchEndTime: lunchDeadline,
                timezone: windowData.timezone || 'Asia/Kolkata',
              },
              schedule: {
                enabled: Boolean(data.schedule?.enabled),
                days: normalizedDays,
              },
              temporaryOverride: {
                active: Boolean(data.temporaryOverride?.active),
                mode: data.temporaryOverride?.mode || 'force_unlocked',
                expiresAt: data.temporaryOverride?.expiresAt || null,
                reason: data.temporaryOverride?.reason || '',
                startedAt: data.temporaryOverride?.startedAt || null,
              },
              scheduledEvents: Array.isArray(data.scheduledEvents) ? data.scheduledEvents : [],
              lastModified: data.lastModified || null,
              modifiedBy: data.modifiedBy || '',
              note: data.note || '',
            });
          }
          setLoadingConfig(false);
        },
        (err) => {
          console.error('Error listening to tokenboard config:', err);
          setLoadingConfig(false);
        }
      );

    return () => unsub();
  }, []);

  // Reactively track today's date in IST from the anti-tamper time engine
  const todayIST = worldTodayIST || getTodayISTDate();
  const tomorrowIST = useMemo(() => addDaysToDate(todayIST, 1), [todayIST]);
  const todayDayShort = useMemo(() => getDayOfWeekShort(todayIST), [todayIST]);
  const tomorrowDayShort = useMemo(() => getDayOfWeekShort(tomorrowIST), [tomorrowIST]);

  // Check if an active calendar scheduled event matches today's date
  const activeScheduledEvent = useMemo(() => {
    if (!config.scheduledEvents || !config.scheduledEvents.length) return null;
    return config.scheduledEvents.find((evt) => {
      if (!evt || evt.active === false) return false;
      if (!evt.startDate || !evt.endDate) return false;
      return todayIST >= evt.startDate && todayIST <= evt.endDate;
    }) || null;
  }, [config.scheduledEvents, todayIST]);

  // Determine active cutoff window for today (considering day-specific schedule and scheduled events)
  const activeWindow = useMemo(() => {
    let deadline = config.cutoff?.deadlineTime || config.window?.endTime || DEFAULT_LOCK_CONFIG.cutoff.deadlineTime;
    let breakfastDeadline = config.cutoff?.hasBreakfastDeadline
      ? config.cutoff.breakfastDeadlineTime
      : (governance.mealWindows?.breakfast?.cutoffTime || config.window?.breakfastEndTime || deadline);
    let lunchDeadline = config.cutoff?.hasLunchDeadline
      ? config.cutoff.lunchDeadlineTime
      : (governance.mealWindows?.lunch?.cutoffTime || config.window?.lunchEndTime || deadline);
    let openTime = config.cutoff?.openTime || config.window?.startTime || '00:00';
    let restrictOpen = Boolean(config.cutoff?.restrictOpenTime);

    // Day-specific schedule override
    if (config.schedule?.enabled && config.schedule?.days?.[todayDayShort]) {
      const dayConf = config.schedule.days[todayDayShort];
      const dayDl = dayConf.deadlineTime || dayConf.endTime;
      if (dayDl) deadline = dayDl;
      breakfastDeadline = dayConf.breakfastDeadlineTime || dayDl || breakfastDeadline;
      lunchDeadline = dayConf.lunchDeadlineTime || dayDl || lunchDeadline;

      if (dayConf.startTime) {
        openTime = dayConf.startTime;
      }
      if (dayConf.restrictOpenTime !== undefined) {
        restrictOpen = Boolean(dayConf.restrictOpenTime);
      }
    }

    // Scheduled event custom cutoff
    if (activeScheduledEvent && activeScheduledEvent.type === 'custom_cutoff') {
      if (activeScheduledEvent.customCutoffTime) {
        deadline = activeScheduledEvent.customCutoffTime;
        breakfastDeadline = activeScheduledEvent.customCutoffTimeBreakfast || deadline;
        lunchDeadline = activeScheduledEvent.customCutoffTimeLunch || deadline;
      } else {
        if (activeScheduledEvent.customCutoffTimeBreakfast) breakfastDeadline = activeScheduledEvent.customCutoffTimeBreakfast;
        if (activeScheduledEvent.customCutoffTimeLunch) lunchDeadline = activeScheduledEvent.customCutoffTimeLunch;
      }
    }

    const maxEndTime = lunchDeadline > breakfastDeadline ? lunchDeadline : breakfastDeadline;

    return {
      startTime: openTime,
      endTime: maxEndTime,
      deadlineTime: deadline,
      breakfastDeadlineTime: breakfastDeadline,
      lunchDeadlineTime: lunchDeadline,
      openTime,
      restrictOpenTime: restrictOpen,
    };
  }, [config.cutoff, config.window, config.schedule, todayDayShort, activeScheduledEvent, governance.mealWindows]);

  // Determine active Board Today-Tomorrow Switch Time for today
  const activeBoardSwitchTime = useMemo(() => {
    if (config.boardSwitch?.enabled === false) {
      // If auto-shift is disabled, remain on Today all day (switch at 23:59:59)
      return '23:59';
    }
    if (config.boardSwitch?.days?.[todayDayShort]?.autoShiftTime) {
      return config.boardSwitch.days[todayDayShort].autoShiftTime;
    }
    return config.boardSwitch?.autoShiftTime || '14:00';
  }, [config.boardSwitch, todayDayShort]);

  // Evaluate whether current IST time is past the dynamic board switch time
  const isPastBoardSwitch = useMemo(() => {
    return isPastBoardSwitchTime(timeHms, activeBoardSwitchTime);
  }, [timeHms, activeBoardSwitchTime]);

  const defaultDayOffset = isPastBoardSwitch ? 1 : 0;
  const defaultTargetDateIST = defaultDayOffset === 1 ? tomorrowIST : todayIST;
  const boardSwitchTimeHms = useMemo(() => normalizeTimeToHms(activeBoardSwitchTime, '14:00:00'), [activeBoardSwitchTime]);

  // Check if temporary override is active and non-expired
  const temporaryOverrideActive = useMemo(() => {
    const temp = config.temporaryOverride;
    if (!temp?.active || !temp?.expiresAt) return false;
    let expMs = null;
    if (typeof temp.expiresAt.toDate === 'function') {
      expMs = temp.expiresAt.toDate().getTime();
    } else if (typeof temp.expiresAt === 'number') {
      expMs = temp.expiresAt;
    } else {
      expMs = new Date(temp.expiresAt).getTime();
    }
    return expMs > Date.now();
  }, [config.temporaryOverride]);

  // Remaining milliseconds on temporary override if active
  const temporaryOverrideRemainingMs = useMemo(() => {
    if (!temporaryOverrideActive) return 0;
    const temp = config.temporaryOverride;
    let expMs = null;
    if (typeof temp.expiresAt.toDate === 'function') {
      expMs = temp.expiresAt.toDate().getTime();
    } else if (typeof temp.expiresAt === 'number') {
      expMs = temp.expiresAt;
    } else {
      expMs = new Date(temp.expiresAt).getTime();
    }
    return Math.max(0, expMs - Date.now());
  }, [temporaryOverrideActive, config.temporaryOverride]);

  // Effective Operating Mode calculation
  const effectiveMode = useMemo(() => {
    // Institutional universal unlock feeds the same evaluator as the token
    // cutoff controls. The immutable-history guard still runs before this mode.
    if (governance.isEmergencyMealOverrideActive) return 'force_unlocked';
    // 1. Timed Override takes precedence if currently active
    if (temporaryOverrideActive) {
      return config.temporaryOverride.mode || 'force_unlocked';
    }
    // 2. Calendar Scheduled Event
    if (activeScheduledEvent) {
      if (activeScheduledEvent.type === 'lock') return 'scheduled_locked';
      if (activeScheduledEvent.type === 'unlock') return 'scheduled_unlocked';
    }
    // 3. Master Operating Mode
    if (config.overrideMode === 'force_unlocked' || config.overrideMode === 'force_locked') {
      return config.overrideMode;
    }
    return 'auto';
  }, [governance.isEmergencyMealOverrideActive, temporaryOverrideActive, config.temporaryOverride, activeScheduledEvent, config.overrideMode]);

  const startTimeHms = useMemo(() => normalizeTimeToHms(activeWindow.startTime, '00:00:00'), [activeWindow.startTime]);
  const endTimeHms = useMemo(() => normalizeTimeToHms(activeWindow.endTime, '23:00:00'), [activeWindow.endTime]);
  const breakfastEndTimeHms = useMemo(() => normalizeTimeToHms(activeWindow.breakfastDeadlineTime, '23:00:00'), [activeWindow.breakfastDeadlineTime]);
  const lunchEndTimeHms = useMemo(() => normalizeTimeToHms(activeWindow.lunchDeadlineTime, '23:00:00'), [activeWindow.lunchDeadlineTime]);

  // Is current time before today's cutoff deadline for tomorrow's meals?
  const isTimeInWindow = useMemo(() => {
    if (!timeHms) return true;
    return timeHms <= endTimeHms;
  }, [timeHms, endTimeHms]);

  /**
   * Granular Date Lock Evaluator:
   * Returns exact lock status, code, and user-facing explanation for ANY given calendar date.
   * Supports administrative bypass via options.isAdmin = true
   * Supports meal-specific inspection via options.mealType = 'breakfast' | 'lunch' | 'both'
   */
  const getDateLockStatus = useCallback(
    (targetDateStr, options = false) => {
      if (!targetDateStr) {
        return { isLocked: true, reason: 'Invalid date', code: 'INVALID' };
      }

      const isAdmin = typeof options === 'boolean'
        ? options
        : Boolean(options && (options.isAdmin || options.role === 'admin' || options.role === 'canteen_committee' || options.role === 'central_committee'));

      const queriedMeal = (typeof options === 'object' && options?.mealType) ? options.mealType : null;

      // Student edits to past service dates stay immutable, including during
      // force-unlock and scheduled-unlock periods. Admins retain their audited
      // correction path for historical records.
      if (targetDateStr < todayIST && !isAdmin) {
        return {
          isLocked: true,
          isBreakfastLocked: true,
          isLunchLocked: true,
          isBothLocked: true,
          isPartiallyLocked: false,
          isAdminOverride: false,
          reason: 'Past Date: Cannot modify previous days.',
          code: 'PAST',
          isTomorrow: false,
          isToday: false,
          isPast: true,
        };
      }

      // Institutional read-only mode and the self-toggle switch block student
      // writes even when a cutoff or unlock override would otherwise open them.
      if (!isAdmin && (governance.isReadOnlyLockdown || !governance.allowStudentSelfToggles)) {
        return {
          isLocked: true,
          isBreakfastLocked: true,
          isLunchLocked: true,
          isBothLocked: true,
          isPartiallyLocked: false,
          isAdminOverride: false,
          reason: governance.isReadOnlyLockdown
            ? 'Institutional read-only lockdown is active.'
            : 'Student self-service updates are disabled by administration.',
          code: governance.isReadOnlyLockdown ? 'READ_ONLY_LOCKDOWN' : 'STUDENT_TOGGLES_DISABLED',
          isTomorrow: targetDateStr === tomorrowIST,
          isToday: targetDateStr === todayIST,
          isPast: false,
        };
      }

      // 1. Emergency Lockdown or Scheduled Lock
      if (effectiveMode === 'force_locked' || effectiveMode === 'scheduled_locked') {
        const lockReason = effectiveMode === 'scheduled_locked'
          ? (activeScheduledEvent?.reason || activeScheduledEvent?.title || 'Scheduled Calendar Freeze in effect.')
          : (config.temporaryOverride?.active && config.temporaryOverride.mode === 'force_locked'
              ? (config.temporaryOverride.reason || 'Temporary Administrative Freeze in progress.')
              : 'Emergency Lockdown: Token updates are temporarily frozen by administration.');

        if (isAdmin) {
          return {
            isLocked: false,
            isBreakfastLocked: false,
            isLunchLocked: false,
            isBothLocked: false,
            isPartiallyLocked: false,
            isAdminOverride: true,
            reason: `${lockReason} • Admin override authority enabled.`,
            code: 'ADMIN_EMERGENCY_OVERRIDE',
            isTomorrow: targetDateStr === tomorrowIST,
            isToday: targetDateStr === todayIST,
            isPast: targetDateStr < todayIST,
          };
        }
        return {
          isLocked: true,
          isBreakfastLocked: true,
          isLunchLocked: true,
          isBothLocked: true,
          isPartiallyLocked: false,
          reason: lockReason,
          code: effectiveMode === 'scheduled_locked' ? 'SCHEDULED_LOCK' : 'EMERGENCY_LOCK',
          isTomorrow: targetDateStr === tomorrowIST,
          isToday: targetDateStr === todayIST,
          isPast: targetDateStr < todayIST,
        };
      }

      // 2. Force Unlocked or Scheduled Unlock (Bypasses all cutoffs)
      if (effectiveMode === 'force_unlocked' || effectiveMode === 'scheduled_unlocked') {
        const unlockReason = effectiveMode === 'scheduled_unlocked'
          ? (activeScheduledEvent?.reason || activeScheduledEvent?.title || 'Scheduled Unlock active.')
          : (config.temporaryOverride?.active && config.temporaryOverride.mode === 'force_unlocked'
              ? (config.temporaryOverride.reason || 'Temporary Extension active.')
              : 'Admin Override Active: Updates unlocked for today and future dates.');

        return {
          isLocked: false,
          isBreakfastLocked: false,
          isLunchLocked: false,
          isBothLocked: false,
          isPartiallyLocked: false,
          isAdminOverride: true,
          reason: unlockReason,
          code: 'OVERRIDE_UNLOCKED',
          isTomorrow: targetDateStr === tomorrowIST,
          isToday: targetDateStr === todayIST,
          isPast: targetDateStr < todayIST,
        };
      }

      // 4. Today is closed for regular students, but editable by admin!
      if (targetDateStr === todayIST) {
        if (isAdmin) {
          return {
            isLocked: false,
            isBreakfastLocked: false,
            isLunchLocked: false,
            isBothLocked: false,
            isPartiallyLocked: false,
            isAdminOverride: true,
            reason: "Today's meal orders are finalized for kitchen prep • Admin override authority enabled.",
            code: 'ADMIN_TODAY_OVERRIDE',
            isTomorrow: false,
            isToday: true,
            isPast: false,
          };
        }
        return {
          isLocked: true,
          isBreakfastLocked: true,
          isLunchLocked: true,
          isBothLocked: true,
          isPartiallyLocked: false,
          isAdminOverride: false,
          reason: "Today's meal orders are finalized. Updates for today are closed.",
          code: 'TODAY_CLOSED',
          isTomorrow: false,
          isToday: true,
          isPast: false,
        };
      }

      // 5. Tomorrow (The cutoff target):
      if (targetDateStr === tomorrowIST) {
        // Anti-tamper check: If clock is unverified and device settings were tampered, lock tomorrow for non-admins
        if (!isAdmin && !isSynced && isDeviceDesynced) {
          return {
            isLocked: true,
            isBreakfastLocked: true,
            isLunchLocked: true,
            isBothLocked: true,
            isPartiallyLocked: false,
            isAdminOverride: false,
            reason: 'System time verification required: Device clock mismatch detected. Please check network connection.',
            code: 'TIME_DESYNC_BLOCKED',
            isTomorrow: true,
            isToday: false,
            isPast: false,
            isPastCutoff: true,
            isPastBreakfastCutoff: true,
            isPastLunchCutoff: true,
          };
        }

        // Granular Cutoff Deadline Checks: Has the cutoff deadline passed for breakfast / lunch?
        const isPastBfCutoff = Boolean(timeHms && timeHms > breakfastEndTimeHms);
        const isPastLuCutoff = Boolean(timeHms && timeHms > lunchEndTimeHms);

        const isBfLocked = !isAdmin && isPastBfCutoff;
        const isLuLocked = !isAdmin && isPastLuCutoff;
        const isBothLocked = isBfLocked && isLuLocked;
        const isPartiallyLocked = (isBfLocked && !isLuLocked) || (!isBfLocked && isLuLocked);

        // Optional Restricted Opening Window (Only if explicitly enabled by admin)
        if (activeWindow.restrictOpenTime) {
          const isBeforeWindow = Boolean(timeHms && timeHms < startTimeHms);
          if (isBeforeWindow) {
            if (isAdmin) {
              return {
                isLocked: false,
                isBreakfastLocked: false,
                isLunchLocked: false,
                isBothLocked: false,
                isPartiallyLocked: false,
                isAdminOverride: true,
                reason: `Tomorrow's meal updation window opens at ${formatConfiguredTime(activeWindow.startTime)} • Admin override authority enabled.`,
                code: 'ADMIN_WINDOW_OVERRIDE',
                isTomorrow: true,
                isToday: false,
                isPast: false,
                isPastCutoff: false,
                isPastBreakfastCutoff: false,
                isPastLunchCutoff: false,
              };
            }
            return {
              isLocked: true,
              isBreakfastLocked: true,
              isLunchLocked: true,
              isBothLocked: true,
              isPartiallyLocked: false,
              isAdminOverride: false,
              reason: `Tomorrow's meal updation window opens at ${formatConfiguredTime(activeWindow.startTime)}.`,
              code: 'BEFORE_WINDOW',
              isTomorrow: true,
              isToday: false,
              isPast: false,
              isPastCutoff: false,
              isPastBreakfastCutoff: false,
              isPastLunchCutoff: false,
            };
          }
        }

        let isLockedForQuery = isBothLocked;
        let reasonForQuery = '';
        let codeForQuery = '';

        if (queriedMeal === 'breakfast') {
          isLockedForQuery = isBfLocked;
          reasonForQuery = isBfLocked
            ? (isAdmin
                ? `Tomorrow's breakfast cutoff passed at ${formatConfiguredTime(activeWindow.breakfastDeadlineTime)} • Admin override authority enabled.`
                : `Tomorrow's breakfast cutoff passed at ${formatConfiguredTime(activeWindow.breakfastDeadlineTime)}. Changes are locked for kitchen prep.`)
            : `Open for tomorrow's breakfast until cutoff at ${formatConfiguredTime(activeWindow.breakfastDeadlineTime)}.`;
          codeForQuery = isBfLocked ? (isAdmin ? 'ADMIN_CUTOFF_OVERRIDE' : 'BREAKFAST_CUTOFF_PASSED') : 'BREAKFAST_OPEN';
        } else if (queriedMeal === 'lunch') {
          isLockedForQuery = isLuLocked;
          reasonForQuery = isLuLocked
            ? (isAdmin
                ? `Tomorrow's lunch cutoff passed at ${formatConfiguredTime(activeWindow.lunchDeadlineTime)} • Admin override authority enabled.`
                : `Tomorrow's lunch cutoff passed at ${formatConfiguredTime(activeWindow.lunchDeadlineTime)}. Changes are locked for kitchen prep.`)
            : `Open for tomorrow's lunch until cutoff at ${formatConfiguredTime(activeWindow.lunchDeadlineTime)}.`;
          codeForQuery = isLuLocked ? (isAdmin ? 'ADMIN_CUTOFF_OVERRIDE' : 'LUNCH_CUTOFF_PASSED') : 'LUNCH_OPEN';
        } else {
          // General date query: Locked if both are locked!
          isLockedForQuery = isBothLocked;
          if (isBothLocked) {
            reasonForQuery = isAdmin
              ? `Tomorrow's cutoffs passed (Breakfast: ${formatConfiguredTime(activeWindow.breakfastDeadlineTime)}, Lunch: ${formatConfiguredTime(activeWindow.lunchDeadlineTime)}) • Admin override authority enabled.`
              : (activeWindow.breakfastDeadlineTime === activeWindow.lunchDeadlineTime
                  ? `Tomorrow's cutoff passed at ${formatConfiguredTime(activeWindow.lunchDeadlineTime)}. Changes are locked for kitchen prep.`
                  : `Tomorrow's cutoffs passed (Breakfast: ${formatConfiguredTime(activeWindow.breakfastDeadlineTime)}, Lunch: ${formatConfiguredTime(activeWindow.lunchDeadlineTime)}). Changes are locked for kitchen prep.`);
            codeForQuery = isAdmin ? 'ADMIN_CUTOFF_OVERRIDE' : 'CUTOFF_PASSED';
          } else if (isPartiallyLocked) {
            if (isBfLocked) {
              reasonForQuery = isAdmin
                ? `Tomorrow's breakfast passed cutoff at ${formatConfiguredTime(activeWindow.breakfastDeadlineTime)}; Lunch open until ${formatConfiguredTime(activeWindow.lunchDeadlineTime)} • Admin override authority enabled.`
                : `Tomorrow's breakfast cutoff passed at ${formatConfiguredTime(activeWindow.breakfastDeadlineTime)}. Lunch updates remain open until ${formatConfiguredTime(activeWindow.lunchDeadlineTime)}.`;
              codeForQuery = 'BREAKFAST_CUTOFF_PASSED_LUNCH_OPEN';
            } else {
              reasonForQuery = isAdmin
                ? `Tomorrow's lunch passed cutoff at ${formatConfiguredTime(activeWindow.lunchDeadlineTime)}; Breakfast open until ${formatConfiguredTime(activeWindow.breakfastDeadlineTime)} • Admin override authority enabled.`
                : `Tomorrow's lunch cutoff passed at ${formatConfiguredTime(activeWindow.lunchDeadlineTime)}. Breakfast updates remain open until ${formatConfiguredTime(activeWindow.breakfastDeadlineTime)}.`;
              codeForQuery = 'LUNCH_CUTOFF_PASSED_BREAKFAST_OPEN';
            }
          } else {
            reasonForQuery = (activeWindow.breakfastDeadlineTime === activeWindow.lunchDeadlineTime)
              ? `Open for tomorrow until cutoff at ${formatConfiguredTime(activeWindow.lunchDeadlineTime)}.`
              : `Open for tomorrow until cutoffs (Breakfast: ${formatConfiguredTime(activeWindow.breakfastDeadlineTime)}, Lunch: ${formatConfiguredTime(activeWindow.lunchDeadlineTime)}).`;
            codeForQuery = 'TOMORROW_OPEN';
          }
        }

        return {
          isLocked: isLockedForQuery,
          isBreakfastLocked: isBfLocked,
          isLunchLocked: isLuLocked,
          isBothLocked,
          isPartiallyLocked,
          breakfastCutoffDeadline: formatConfiguredTime(activeWindow.breakfastDeadlineTime),
          lunchCutoffDeadline: formatConfiguredTime(activeWindow.lunchDeadlineTime),
          rawBreakfastDeadline: activeWindow.breakfastDeadlineTime,
          rawLunchDeadline: activeWindow.lunchDeadlineTime,
          isAdminOverride: isAdmin,
          reason: reasonForQuery,
          code: codeForQuery,
          isTomorrow: true,
          isToday: false,
          isPast: false,
          isPastCutoff: isBothLocked,
          isPastBreakfastCutoff: isPastBfCutoff,
          isPastLunchCutoff: isPastLuCutoff,
        };
      }

      // 6. Future dates (Day after tomorrow onward): ALWAYS UNLOCKED for advance scheduling!
      return {
        isLocked: false,
        isBreakfastLocked: false,
        isLunchLocked: false,
        isBothLocked: false,
        isPartiallyLocked: false,
        isAdminOverride: false,
        reason: 'Advance booking open. You can freely toggle meals or schedule leaves.',
        code: 'FUTURE_OPEN',
        isTomorrow: false,
        isToday: false,
        isPast: false,
      };
    },
    [effectiveMode, todayIST, tomorrowIST, timeHms, startTimeHms, breakfastEndTimeHms, lunchEndTimeHms, activeWindow, isSynced, isDeviceDesynced, activeScheduledEvent, config.temporaryOverride, formatConfiguredTime, governance.isReadOnlyLockdown, governance.allowStudentSelfToggles]
  );

  // Quick state for today and tomorrow
  const todayLockInfo = useMemo(() => getDateLockStatus(todayIST), [getDateLockStatus, todayIST]);
  const isTodayLocked = todayLockInfo.isLocked;

  const tomorrowLockInfo = useMemo(() => getDateLockStatus(tomorrowIST), [getDateLockStatus, tomorrowIST]);
  const isTomorrowLocked = tomorrowLockInfo.isLocked;
  const isTomorrowBreakfastLocked = tomorrowLockInfo.isBreakfastLocked;
  const isTomorrowLunchLocked = tomorrowLockInfo.isLunchLocked;
  const isTomorrowPartiallyLocked = tomorrowLockInfo.isPartiallyLocked;

  // Updation window for tomorrow: Open whenever tomorrow is not locked
  const isUpdationWindowOpen = useMemo(() => {
    if (effectiveMode === 'force_unlocked' || effectiveMode === 'scheduled_unlocked') return true;
    if (effectiveMode === 'force_locked' || effectiveMode === 'scheduled_locked') return false;
    return !isTomorrowLocked;
  }, [effectiveMode, isTomorrowLocked]);

  // Is student portal accessible for login? (Always accessible unless emergency lockdown!)
  const isPortalAccessible = effectiveMode !== 'force_locked' && effectiveMode !== 'scheduled_locked';

  // Informative status badge
  const statusBadge = useMemo(() => {
    if (effectiveMode === 'force_locked') {
      if (config.temporaryOverride?.active && config.temporaryOverride.mode === 'force_locked') {
        return `Timed Freeze Active (${config.temporaryOverride.reason || 'Admin Freeze'})`;
      }
      return 'Emergency Lockdown Active';
    }
    if (effectiveMode === 'scheduled_locked') {
      return `Scheduled Freeze: ${activeScheduledEvent?.title || 'Calendar Override'}`;
    }
    if (effectiveMode === 'force_unlocked') {
      if (config.temporaryOverride?.active && config.temporaryOverride.mode === 'force_unlocked') {
        return `Timed Extension Active (${config.temporaryOverride.reason || 'Admin Extension'})`;
      }
      return 'Admin Override (Today & Future Unlocked)';
    }
    if (effectiveMode === 'scheduled_unlocked') {
      return `Scheduled Open: ${activeScheduledEvent?.title || 'Advance Window'}`;
    }
    if (isTomorrowLocked) {
      if (activeWindow.restrictOpenTime && timeHms && timeHms < startTimeHms) {
        return `Next Day Opens at ${formatConfiguredTime(activeWindow.startTime, false)}`;
      }
      return (activeWindow.breakfastDeadlineTime === activeWindow.lunchDeadlineTime)
        ? `Next Day Locked (${formatConfiguredTime(activeWindow.lunchDeadlineTime, false)} Cutoff)`
        : `Next Day Locked (Bf: ${formatConfiguredTime(activeWindow.breakfastDeadlineTime, false)}, Lunch: ${formatConfiguredTime(activeWindow.lunchDeadlineTime, false)})`;
    }
    if (isTomorrowBreakfastLocked && !isTomorrowLunchLocked) {
      return `Next Day: Lunch Open until ${formatConfiguredTime(activeWindow.lunchDeadlineTime, false)} (Bf Locked at ${formatConfiguredTime(activeWindow.breakfastDeadlineTime, false)})`;
    }
    if (!isTomorrowBreakfastLocked && isTomorrowLunchLocked) {
      return `Next Day: Breakfast Open until ${formatConfiguredTime(activeWindow.breakfastDeadlineTime, false)} (Lunch Locked at ${formatConfiguredTime(activeWindow.lunchDeadlineTime, false)})`;
    }
    if (activeWindow.breakfastDeadlineTime === activeWindow.lunchDeadlineTime) {
      return `Next Day Open until ${formatConfiguredTime(activeWindow.lunchDeadlineTime, false)}`;
    }
    return `Next Day Open (Bf: ${formatConfiguredTime(activeWindow.breakfastDeadlineTime, false)}, Lu: ${formatConfiguredTime(activeWindow.lunchDeadlineTime, false)})`;
  }, [effectiveMode, isTomorrowLocked, isTomorrowBreakfastLocked, isTomorrowLunchLocked, activeWindow, timeHms, startTimeHms, activeScheduledEvent, config.temporaryOverride, formatConfiguredTime]);

  // Persistence helper to update configuration in Firestore
  const saveLockConfig = useCallback(async (updates) => {
    try {
      const payload = {
        ...updates,
        status: updates.overrideMode === 'force_unlocked',
        lastModified: firebase.firestore.FieldValue.serverTimestamp(),
      };
      await firebase
        .firestore()
        .collection('tokenboard')
        .doc(TOKENBOARD_DOC_ID)
        .set(payload, { merge: true });
      return { success: true };
    } catch (err) {
      console.error('Error saving tokenboard lock config:', err);
      return { success: false, error: err };
    }
  }, []);

  return {
    // Core Granular Evaluators
    getDateLockStatus,
    isDateLocked: (d, options = false) => getDateLockStatus(d, options).isLocked,
    isMealLocked: (d, mealType, options = false) => {
      const opts = typeof options === 'boolean' ? { isAdmin: options, mealType } : { ...options, mealType };
      return getDateLockStatus(d, opts).isLocked;
    },

    // Today, Tomorrow & Target Context
    todayIST,
    tomorrowIST,
    todayDayShort,
    tomorrowDayShort,
    isTodayLocked,
    todayLockInfo,
    isTomorrowLocked,
    isTomorrowBreakfastLocked,
    isTomorrowLunchLocked,
    isTomorrowPartiallyLocked,
    tomorrowLockInfo,
    isUpdationWindowOpen,

    // Portal Accessibility
    isPortalAccessible,
    isOpen: isPortalAccessible, // Backward-compatibility alias: students can enter portal
    isOverride: effectiveMode === 'force_unlocked' || effectiveMode === 'scheduled_unlocked',
    effectiveMode,
    isTimeInWindow,

    // Cutoff Deadline Window Details
    activeWindow,
    startTime: formatConfiguredTime(activeWindow.startTime),
    endTime: formatConfiguredTime(activeWindow.endTime),
    rawStartTime: activeWindow.startTime,
    rawEndTime: activeWindow.endTime,
    cutoffDeadline: formatConfiguredTime(activeWindow.endTime),
    breakfastCutoffDeadline: formatConfiguredTime(activeWindow.breakfastDeadlineTime),
    lunchCutoffDeadline: formatConfiguredTime(activeWindow.lunchDeadlineTime),
    rawBreakfastDeadlineTime: activeWindow.breakfastDeadlineTime,
    rawLunchDeadlineTime: activeWindow.lunchDeadlineTime,
    currentTime: timeHms,

    // Dedicated Board Today-Tomorrow Display Transition Details
    boardSwitch: config.boardSwitch,
    boardSwitchTime: formatConfiguredTime(activeBoardSwitchTime),
    rawBoardSwitchTime: activeBoardSwitchTime,
    isPastBoardSwitch,
    isPastBoardSwitchTime: isPastBoardSwitch,
    boardSwitchTimeHms,
    defaultDayOffset,
    defaultTargetDateIST,

    // Backward-Compatibility Aliases
    boardFlipTimeHms: boardSwitchTimeHms,
    isPostWindowOpen: isPastBoardSwitch,

    // Timed & Scheduled Overrides Telemetry
    temporaryOverrideActive,
    temporaryOverrideRemainingMs,
    activeScheduledEvent,

    // Anti-Tamper & Sync Status
    isSynced,
    isDeviceDesynced,
    isTimeVerified: Boolean(isSynced || !isDeviceDesynced),
    syncSource,

    // Status & Config
    statusBadge,
    config,
    loadingConfig,
    saveLockConfig,
  };
}
