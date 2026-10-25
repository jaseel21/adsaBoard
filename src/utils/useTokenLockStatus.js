import { useState, useEffect, useMemo, useCallback } from 'react';
import firebase from '../firebase/config';
import { useWorldTime } from './time';
import {
  getTodayISTDate,
  addDaysToDate,
  getDayOfWeekShort,
  formatFriendlyDate,
  normalizeTimeToHms,
  isPastBoardWindowOpenTime,
  getDefaultBoardDayOffset,
  getDefaultBoardTargetDate,
} from './studentExceptionService';

export {
  isPastBoardWindowOpenTime,
  getDefaultBoardDayOffset,
  getDefaultBoardTargetDate,
};

const TOKENBOARD_DOC_ID = 'g8iJVNn2RQkysjMAvX1h';

/**
 * Format 24h time "HH:mm" or "HH:mm:ss" to friendly 12h time (e.g. "11:00 PM IST")
 */
export function formatTime12(timeStr, includeTz = true) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  const h = parseInt(parts[0], 10);
  const m = parts[1] || '00';
  if (isNaN(h)) return timeStr;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const formattedH = String(h12).padStart(2, '0');
  return `${formattedH}:${m} ${period}${includeTz ? ' IST' : ''}`;
}

/**
 * Default Token Board Configuration
 * 
 * Business Rules:
 * - Web is open to login ANY TIME (24/7)
 * - TODAY: Finalized for kitchen prep (locked for regular students, admin override available)
 * - TOMORROW: Open all day until the cutoff deadline (default: 11:00 PM / 23:00 IST)
 * - FUTURE DATES: Always open for advance scheduling and leaves
 * - Optional: Restrict opening window (disabled by default)
 */
export const DEFAULT_LOCK_CONFIG = {
  status: false, // legacy boolean
  overrideMode: 'auto', // 'auto' | 'force_unlocked' | 'force_locked'
  cutoff: {
    deadlineTime: '23:00', // 11:00 PM IST cutoff deadline
    timezone: 'Asia/Kolkata',
    restrictOpenTime: false, // By default FALSE: Open all day until cutoff deadline
    openTime: '00:00',
  },
  window: {
    startTime: '00:00', // Backwards compatibility: 12:00 AM
    endTime: '23:00',   // 11:00 PM IST cutoff deadline
    timezone: 'Asia/Kolkata',
  },
  schedule: {
    enabled: false,
    days: {
      su: { startTime: '00:00', endTime: '23:00', deadlineTime: '23:00' },
      mo: { startTime: '00:00', endTime: '23:00', deadlineTime: '23:00' },
      tu: { startTime: '00:00', endTime: '23:00', deadlineTime: '23:00' },
      we: { startTime: '00:00', endTime: '23:00', deadlineTime: '23:00' },
      th: { startTime: '00:00', endTime: '23:00', deadlineTime: '23:00' },
      fr: { startTime: '00:00', endTime: '23:00', deadlineTime: '23:00' },
      sa: { startTime: '00:00', endTime: '23:00', deadlineTime: '23:00' },
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
 * Upgraded Unified Hook for Token Board Updation Locking & Cutoff Schedules
 */
export function useTokenLockStatus() {
  const { timeHms, todayIST: worldTodayIST, isSynced, isDeviceDesynced, syncSource } = useWorldTime('Asia/Kolkata');
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

            // Ensure cutoff deadline has a robust fallback to 23:00
            const deadline = cutoffData.deadlineTime || windowData.endTime || '23:00';
            const restrictOpen = Boolean(cutoffData.restrictOpenTime);
            const openTime = cutoffData.openTime || (restrictOpen ? (windowData.startTime || '00:00') : '00:00');

            setConfig({
              status: Boolean(data.status),
              overrideMode: data.overrideMode || 'auto',
              cutoff: {
                deadlineTime: deadline,
                timezone: cutoffData.timezone || windowData.timezone || 'Asia/Kolkata',
                restrictOpenTime: restrictOpen,
                openTime,
              },
              window: {
                startTime: openTime,
                endTime: deadline,
                timezone: windowData.timezone || 'Asia/Kolkata',
              },
              schedule: {
                enabled: Boolean(data.schedule?.enabled),
                days: {
                  ...DEFAULT_LOCK_CONFIG.schedule.days,
                  ...(data.schedule?.days || {}),
                },
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
    let openTime = config.cutoff?.openTime || config.window?.startTime || '00:00';
    let restrictOpen = Boolean(config.cutoff?.restrictOpenTime);

    // Day-specific schedule override
    if (config.schedule?.enabled && config.schedule?.days?.[todayDayShort]) {
      const dayConf = config.schedule.days[todayDayShort];
      if (dayConf.deadlineTime || dayConf.endTime) {
        deadline = dayConf.deadlineTime || dayConf.endTime;
      }
      if (dayConf.startTime) {
        openTime = dayConf.startTime;
      }
      if (dayConf.restrictOpenTime !== undefined) {
        restrictOpen = Boolean(dayConf.restrictOpenTime);
      }
    }

    // Scheduled event custom cutoff
    if (activeScheduledEvent && activeScheduledEvent.type === 'custom_cutoff' && activeScheduledEvent.customCutoffTime) {
      deadline = activeScheduledEvent.customCutoffTime;
    }

    return {
      startTime: openTime,
      endTime: deadline,
      deadlineTime: deadline,
      openTime,
      restrictOpenTime: restrictOpen,
    };
  }, [config.cutoff, config.window, config.schedule, todayDayShort, activeScheduledEvent]);

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
  }, [temporaryOverrideActive, config.temporaryOverride, activeScheduledEvent, config.overrideMode]);

  const startTimeHms = useMemo(() => normalizeTimeToHms(activeWindow.startTime, '00:00:00'), [activeWindow.startTime]);
  const endTimeHms = useMemo(() => normalizeTimeToHms(activeWindow.endTime, '23:00:00'), [activeWindow.endTime]);

  // Board display flip time: 2:00 PM IST is when today's lunch is done and public boards flip to showing tomorrow's counts
  const boardFlipTimeHms = useMemo(() => normalizeTimeToHms('14:00', '14:00:00'), []);
  const isPostWindowOpen = useMemo(() => {
    return isPastBoardWindowOpenTime(timeHms, '14:00');
  }, [timeHms]);

  const defaultDayOffset = isPostWindowOpen ? 1 : 0;
  const defaultTargetDateIST = defaultDayOffset === 1 ? tomorrowIST : todayIST;

  // Is current time before today's cutoff deadline for tomorrow's meals?
  const isTimeInWindow = useMemo(() => {
    if (!timeHms) return true;
    return timeHms <= endTimeHms;
  }, [timeHms, endTimeHms]);

  /**
   * Granular Date Lock Evaluator:
   * Returns exact lock status, code, and user-facing explanation for ANY given calendar date.
   * Supports administrative bypass via options.isAdmin = true
   */
  const getDateLockStatus = useCallback(
    (targetDateStr, options = false) => {
      if (!targetDateStr) {
        return { isLocked: true, reason: 'Invalid date', code: 'INVALID' };
      }

      const isAdmin = typeof options === 'boolean'
        ? options
        : Boolean(options && (options.isAdmin || options.role === 'admin' || options.role === 'canteen_committee' || options.role === 'central_committee'));

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
              : 'Admin Override Active: Updates unlocked for all dates.');

        return {
          isLocked: false,
          isAdminOverride: true,
          reason: unlockReason,
          code: 'OVERRIDE_UNLOCKED',
          isTomorrow: targetDateStr === tomorrowIST,
          isToday: targetDateStr === todayIST,
          isPast: targetDateStr < todayIST,
        };
      }

      // 3. Past dates are always closed/read-only
      if (targetDateStr < todayIST) {
        return {
          isLocked: true,
          isAdminOverride: false,
          reason: 'Past Date: Cannot modify previous days.',
          code: 'PAST',
          isTomorrow: false,
          isToday: false,
          isPast: true,
        };
      }

      // 4. Today is closed for regular students, but editable by admin!
      if (targetDateStr === todayIST) {
        if (isAdmin) {
          return {
            isLocked: false,
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
            isAdminOverride: false,
            reason: 'System time verification required: Device clock mismatch detected. Please check network connection.',
            code: 'TIME_DESYNC_BLOCKED',
            isTomorrow: true,
            isToday: false,
            isPast: false,
            isPastCutoff: true,
          };
        }

        // Cutoff Deadline Check: Has the cutoff deadline passed for tomorrow's meals?
        const isPastCutoff = Boolean(timeHms && timeHms > endTimeHms);
        if (isPastCutoff) {
          if (isAdmin) {
            return {
              isLocked: false,
              isAdminOverride: true,
              reason: `Tomorrow's cutoff passed at ${formatTime12(activeWindow.endTime)} • Admin override authority enabled.`,
              code: 'ADMIN_CUTOFF_OVERRIDE',
              isTomorrow: true,
              isToday: false,
              isPast: false,
              isPastCutoff: true,
            };
          }
          return {
            isLocked: true,
            isAdminOverride: false,
            reason: `Tomorrow's cutoff passed at ${formatTime12(activeWindow.endTime)}. Changes are locked for kitchen prep.`,
            code: 'CUTOFF_PASSED',
            isTomorrow: true,
            isToday: false,
            isPast: false,
            isPastCutoff: true,
          };
        }

        // Optional Restricted Opening Window (Only if explicitly enabled by admin)
        if (activeWindow.restrictOpenTime) {
          const isBeforeWindow = Boolean(timeHms && timeHms < startTimeHms);
          if (isBeforeWindow) {
            if (isAdmin) {
              return {
                isLocked: false,
                isAdminOverride: true,
                reason: `Tomorrow's meal updation window opens at ${formatTime12(activeWindow.startTime)} • Admin override authority enabled.`,
                code: 'ADMIN_WINDOW_OVERRIDE',
                isTomorrow: true,
                isToday: false,
                isPast: false,
                isPastCutoff: false,
              };
            }
            return {
              isLocked: true,
              isAdminOverride: false,
              reason: `Tomorrow's meal updation window opens at ${formatTime12(activeWindow.startTime)}.`,
              code: 'BEFORE_WINDOW',
              isTomorrow: true,
              isToday: false,
              isPast: false,
              isPastCutoff: false,
            };
          }
        }

        // Tomorrow is OPEN all day until cutoff!
        return {
          isLocked: false,
          isAdminOverride: isAdmin,
          reason: `Open for tomorrow until cutoff at ${formatTime12(activeWindow.endTime)}.`,
          code: 'TOMORROW_OPEN',
          isTomorrow: true,
          isToday: false,
          isPast: false,
          isPastCutoff: false,
        };
      }

      // 6. Future dates (Day after tomorrow onward): ALWAYS UNLOCKED for advance scheduling!
      return {
        isLocked: false,
        isAdminOverride: false,
        reason: 'Advance booking open. You can freely toggle meals or schedule leaves.',
        code: 'FUTURE_OPEN',
        isTomorrow: false,
        isToday: false,
        isPast: false,
      };
    },
    [effectiveMode, todayIST, tomorrowIST, timeHms, startTimeHms, endTimeHms, activeWindow, isSynced, isDeviceDesynced, activeScheduledEvent, config.temporaryOverride]
  );

  // Quick state for today and tomorrow
  const todayLockInfo = useMemo(() => getDateLockStatus(todayIST), [getDateLockStatus, todayIST]);
  const isTodayLocked = todayLockInfo.isLocked;

  const tomorrowLockInfo = useMemo(() => getDateLockStatus(tomorrowIST), [getDateLockStatus, tomorrowIST]);
  const isTomorrowLocked = tomorrowLockInfo.isLocked;

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
      return 'Admin Override (All Dates Unlocked)';
    }
    if (effectiveMode === 'scheduled_unlocked') {
      return `Scheduled Open: ${activeScheduledEvent?.title || 'Advance Window'}`;
    }
    if (isTomorrowLocked) {
      if (activeWindow.restrictOpenTime && timeHms && timeHms < startTimeHms) {
        return `Next Day Opens at ${formatTime12(activeWindow.startTime, false)}`;
      }
      return `Next Day Locked (${formatTime12(activeWindow.endTime, false)} Cutoff)`;
    }
    return `Next Day Open until ${formatTime12(activeWindow.endTime, false)}`;
  }, [effectiveMode, isTomorrowLocked, activeWindow, timeHms, startTimeHms, activeScheduledEvent, config.temporaryOverride]);

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

    // Today, Tomorrow & Target Context
    todayIST,
    tomorrowIST,
    todayDayShort,
    tomorrowDayShort,
    isTodayLocked,
    todayLockInfo,
    isTomorrowLocked,
    tomorrowLockInfo,
    isUpdationWindowOpen,

    // Portal Accessibility
    isPortalAccessible,
    isOpen: isPortalAccessible, // Backward-compatibility alias: students can enter portal
    isOverride: effectiveMode === 'force_unlocked' || effectiveMode === 'scheduled_unlocked',
    effectiveMode,
    isTimeInWindow,

    // Active Window Details & Board Updation Defaults
    activeWindow,
    startTime: formatTime12(activeWindow.startTime),
    endTime: formatTime12(activeWindow.endTime),
    rawStartTime: activeWindow.startTime,
    rawEndTime: activeWindow.endTime,
    cutoffDeadline: formatTime12(activeWindow.endTime),
    currentTime: timeHms,
    boardFlipTimeHms,
    isPostWindowOpen,
    defaultDayOffset,
    defaultTargetDateIST,

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
