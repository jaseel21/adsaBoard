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
 * Format 24h time "HH:mm" or "HH:mm:ss" to friendly 12h time (e.g. "02:00 PM IST")
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
 * Default updation window: 2:00 PM (14:00) open time to 11:00 PM (23:00) cutoff deadline
 */
export const DEFAULT_LOCK_CONFIG = {
  status: false, // legacy boolean
  overrideMode: 'auto', // 'auto' | 'force_unlocked' | 'force_locked'
  window: {
    startTime: '14:00', // 2:00 PM IST board updation window open time
    endTime: '23:00',   // 11:00 PM IST cutoff deadline
    timezone: 'Asia/Kolkata',
  },
  schedule: {
    enabled: false,
    days: {
      su: { startTime: '14:00', endTime: '23:00' },
      mo: { startTime: '14:00', endTime: '23:00' },
      tu: { startTime: '14:00', endTime: '23:00' },
      we: { startTime: '14:00', endTime: '23:00' },
      th: { startTime: '14:00', endTime: '23:00' },
      fr: { startTime: '14:00', endTime: '23:00' },
      sa: { startTime: '14:00', endTime: '23:00' },
    },
  },
  temporaryOverride: {
    active: false,
    mode: 'force_unlocked',
    expiresAt: null,
    reason: '',
  },
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
            setConfig({
              status: Boolean(data.status),
              overrideMode: data.overrideMode || (data.status ? 'force_unlocked' : 'auto'),
              window: {
                startTime: data.window?.startTime || DEFAULT_LOCK_CONFIG.window.startTime,
                endTime: data.window?.endTime || DEFAULT_LOCK_CONFIG.window.endTime,
                timezone: data.window?.timezone || 'Asia/Kolkata',
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
              },
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

  // Determine active cutoff window for today (considering day-specific schedule)
  const activeWindow = useMemo(() => {
    if (config.schedule?.enabled && config.schedule?.days?.[todayDayShort]) {
      const dayConf = config.schedule.days[todayDayShort];
      return {
        startTime: dayConf.startTime || config.window.startTime,
        endTime: dayConf.endTime || config.window.endTime,
      };
    }
    return {
      startTime: config.window?.startTime || DEFAULT_LOCK_CONFIG.window.startTime,
      endTime: config.window?.endTime || DEFAULT_LOCK_CONFIG.window.endTime,
    };
  }, [config.schedule, config.window, todayDayShort]);

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

  // Effective Mode calculation
  const effectiveMode = useMemo(() => {
    if (temporaryOverrideActive) {
      return config.temporaryOverride.mode || 'force_unlocked';
    }
    if (config.overrideMode) {
      return config.overrideMode;
    }
    // Backward compatibility with boolean doc.data().status
    return config.status ? 'force_unlocked' : 'auto';
  }, [temporaryOverrideActive, config.temporaryOverride, config.overrideMode, config.status]);

  const startTimeHms = useMemo(() => normalizeTimeToHms(activeWindow.startTime, '14:00:00'), [activeWindow.startTime]);
  const endTimeHms = useMemo(() => normalizeTimeToHms(activeWindow.endTime, '23:00:00'), [activeWindow.endTime]);

  // Board updation window open time
  const windowOpenHms = useMemo(() => {
    return normalizeTimeToHms(activeWindow.startTime, '14:00:00');
  }, [activeWindow.startTime]);

  // Is current time within/past the board updation window open time?
  // 12:00 AM - window open time: false (default Today)
  // window open time - 12:00 AM: true (default Tomorrow)
  const isPostWindowOpen = useMemo(() => {
    return isPastBoardWindowOpenTime(timeHms, activeWindow.startTime || '14:00');
  }, [timeHms, activeWindow.startTime]);

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
   */
  const getDateLockStatus = useCallback(
    (targetDateStr) => {
      if (!targetDateStr) {
        return { isLocked: true, reason: 'Invalid date', code: 'INVALID' };
      }

      // Emergency lockdown overrides all dates
      if (effectiveMode === 'force_locked') {
        return {
          isLocked: true,
          reason: 'Emergency Lockdown: Token updates are temporarily frozen by administration.',
          code: 'EMERGENCY_LOCK',
          isTomorrow: targetDateStr === tomorrowIST,
          isToday: targetDateStr === todayIST,
          isPast: targetDateStr < todayIST,
        };
      }

      // Force unlocked overrides all cutoff rules
      if (effectiveMode === 'force_unlocked') {
        return {
          isLocked: false,
          reason: 'Admin Override Active: Updates unlocked for all dates.',
          code: 'OVERRIDE_UNLOCKED',
          isTomorrow: targetDateStr === tomorrowIST,
          isToday: targetDateStr === todayIST,
          isPast: targetDateStr < todayIST,
        };
      }

      // 1. Past dates are always closed/read-only
      if (targetDateStr < todayIST) {
        return {
          isLocked: true,
          reason: 'Past Date: Cannot modify previous days.',
          code: 'PAST',
          isTomorrow: false,
          isToday: false,
          isPast: true,
        };
      }

      // 2. Today is always locked (meal orders are finalized / food prep underway) unless admin force unlocked
      if (targetDateStr === todayIST) {
        return {
          isLocked: true,
          reason: "Today's meal orders are finalized. Updates for today are closed.",
          code: 'TODAY_CLOSED',
          isTomorrow: false,
          isToday: true,
          isPast: false,
        };
      }

      // 3. Tomorrow (The cutoff target):
      // Unlocked during the active board updation window (e.g. 2:00 PM to 11:00 PM IST).
      // Locked before window open time (e.g. before 2:00 PM) and locked after cutoff deadline (e.g. past 11:00 PM).
      if (targetDateStr === tomorrowIST) {
        // Anti-tamper check: If clock is unverified and device settings were tampered, lock tomorrow to prevent bypass
        if (!isSynced && isDeviceDesynced) {
          return {
            isLocked: true,
            reason: 'System time verification required: Device clock mismatch detected. Please check network connection.',
            code: 'TIME_DESYNC_BLOCKED',
            isTomorrow: true,
            isToday: false,
            isPast: false,
            isPastCutoff: true,
          };
        }

        const isPastCutoff = Boolean(timeHms && timeHms > endTimeHms);
        if (isPastCutoff) {
          return {
            isLocked: true,
            reason: `Tomorrow's cutoff passed at ${formatTime12(activeWindow.endTime)}. Changes are locked for kitchen prep.`,
            code: 'CUTOFF_PASSED',
            isTomorrow: true,
            isToday: false,
            isPast: false,
            isPastCutoff: true,
          };
        }

        const isBeforeWindow = Boolean(timeHms && timeHms < startTimeHms);
        if (isBeforeWindow) {
          return {
            isLocked: true,
            reason: `Tomorrow's meal updation window opens at ${formatTime12(activeWindow.startTime)}.`,
            code: 'BEFORE_WINDOW',
            isTomorrow: true,
            isToday: false,
            isPast: false,
            isPastCutoff: false,
          };
        }

        return {
          isLocked: false,
          reason: `Open for tomorrow until cutoff at ${formatTime12(activeWindow.endTime)}.`,
          code: 'TOMORROW_OPEN',
          isTomorrow: true,
          isToday: false,
          isPast: false,
          isPastCutoff: false,
        };
      }

      // 4. Future dates (Day after tomorrow onward): ALWAYS UNLOCKED for advance scheduling!
      return {
        isLocked: false,
        reason: 'Advance booking open. You can freely toggle meals or schedule leaves.',
        code: 'FUTURE_OPEN',
        isTomorrow: false,
        isToday: false,
        isPast: false,
      };
    },
    [effectiveMode, todayIST, tomorrowIST, timeHms, startTimeHms, endTimeHms, activeWindow, isSynced, isDeviceDesynced]
  );

  // Quick state for today and tomorrow
  const todayLockInfo = useMemo(() => getDateLockStatus(todayIST), [getDateLockStatus, todayIST]);
  const isTodayLocked = todayLockInfo.isLocked;

  const tomorrowLockInfo = useMemo(() => getDateLockStatus(tomorrowIST), [getDateLockStatus, tomorrowIST]);
  const isTomorrowLocked = tomorrowLockInfo.isLocked;

  const isUpdationWindowOpen = Boolean(isPostWindowOpen && isTimeInWindow);

  // Is student portal accessible for login? (Always accessible unless emergency lockdown!)
  const isPortalAccessible = effectiveMode !== 'force_locked';

  // Informative status badge
  const statusBadge = useMemo(() => {
    if (effectiveMode === 'force_locked') {
      return 'Emergency Lockdown Active';
    }
    if (effectiveMode === 'force_unlocked') {
      return 'Admin Override (All Dates Unlocked)';
    }
    if (isTomorrowLocked) {
      if (timeHms && timeHms < startTimeHms) {
        return `Next Day Opens at ${formatTime12(activeWindow.startTime, false)}`;
      }
      return `Next Day Locked (${formatTime12(activeWindow.endTime, false)} Cutoff)`;
    }
    return `Next Day Open until ${formatTime12(activeWindow.endTime, false)}`;
  }, [effectiveMode, isTomorrowLocked, activeWindow, timeHms, startTimeHms]);

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
    isDateLocked: (d) => getDateLockStatus(d).isLocked,

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
    isOverride: effectiveMode === 'force_unlocked',
    effectiveMode,
    isTimeInWindow,

    // Active Window Details & Board Updation Defaults
    activeWindow,
    startTime: formatTime12(activeWindow.startTime),
    endTime: formatTime12(activeWindow.endTime),
    rawStartTime: activeWindow.startTime,
    rawEndTime: activeWindow.endTime,
    currentTime: timeHms,
    windowOpenHms,
    isPostWindowOpen,
    defaultDayOffset,
    defaultTargetDateIST,

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
