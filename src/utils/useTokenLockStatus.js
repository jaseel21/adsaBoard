import { useState, useEffect, useMemo, useCallback } from 'react';
import firebase from '../firebase/config';
import { useWorldTime } from './time';
import {
  getTodayISTDate,
  addDaysToDate,
  getDayOfWeekShort,
  formatFriendlyDate,
} from './studentExceptionService';

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
 * Normalizes HH:mm to HH:mm:ss
 */
function normalizeTimeToHms(timeStr, defaultTime = '00:00:00') {
  if (!timeStr) return defaultTime;
  const parts = timeStr.trim().split(':');
  const h = String(parts[0] || '00').padStart(2, '0');
  const m = String(parts[1] || '00').padStart(2, '0');
  const s = String(parts[2] || '00').padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * Default Token Board Configuration
 */
export const DEFAULT_LOCK_CONFIG = {
  status: false, // legacy boolean
  overrideMode: 'auto', // 'auto' | 'force_unlocked' | 'force_locked'
  window: {
    startTime: '14:00', // 2:00 PM IST
    endTime: '23:00',   // 11:00 PM IST
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
  const { timeHms } = useWorldTime('Asia/Kolkata');
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

  const todayIST = useMemo(() => getTodayISTDate(), []);
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

  // Is current time inside today's update window for tomorrow's meals?
  const isTimeInWindow = useMemo(() => {
    if (!timeHms) return false;
    return timeHms >= startTimeHms && timeHms <= endTimeHms;
  }, [timeHms, startTimeHms, endTimeHms]);

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

      // 2. Today is closed (food preparation already completed / meal service underway)
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

      // 3. Tomorrow (The cutoff target): Locked outside the time window, unlocked inside it
      if (targetDateStr === tomorrowIST) {
        if (isTimeInWindow) {
          return {
            isLocked: false,
            reason: `Open for tomorrow until ${formatTime12(activeWindow.endTime)}.`,
            code: 'TOMORROW_OPEN',
            isTomorrow: true,
            isToday: false,
            isPast: false,
          };
        }

        const isPastCutoff = Boolean(timeHms && timeHms > endTimeHms);
        return {
          isLocked: true,
          reason: isPastCutoff
            ? `Tomorrow's cutoff passed at ${formatTime12(activeWindow.endTime)}. Changes are locked for kitchen prep.`
            : `Next-day meal updates open at ${formatTime12(activeWindow.startTime)}.`,
          code: isPastCutoff ? 'CUTOFF_PASSED' : 'BEFORE_WINDOW',
          isTomorrow: true,
          isToday: false,
          isPast: false,
          isPastCutoff,
        };
      }

      // 4. Future dates (Day after tomorrow onward): ALWAYS UNLOCKED!
      return {
        isLocked: false,
        reason: 'Advance booking open. You can freely toggle meals or schedule leaves.',
        code: 'FUTURE_OPEN',
        isTomorrow: false,
        isToday: false,
        isPast: false,
      };
    },
    [effectiveMode, todayIST, tomorrowIST, isTimeInWindow, timeHms, endTimeHms, activeWindow]
  );

  // Quick state for tomorrow's cutoff
  const tomorrowLockInfo = useMemo(() => getDateLockStatus(tomorrowIST), [getDateLockStatus, tomorrowIST]);
  const isTomorrowLocked = tomorrowLockInfo.isLocked;

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
    if (!isTomorrowLocked) {
      return `Next Day Open until ${formatTime12(activeWindow.endTime, false)}`;
    }
    const isPastCutoff = Boolean(timeHms && timeHms > endTimeHms);
    if (isPastCutoff) {
      return `Next Day Locked (${formatTime12(activeWindow.endTime, false)} Cutoff)`;
    }
    return `Next Day Opens ${formatTime12(activeWindow.startTime, false)}`;
  }, [effectiveMode, isTomorrowLocked, activeWindow, timeHms, endTimeHms]);

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

    // Tomorrow & Target Context
    todayIST,
    tomorrowIST,
    todayDayShort,
    tomorrowDayShort,
    isTomorrowLocked,
    tomorrowLockInfo,

    // Portal Accessibility
    isPortalAccessible,
    isOpen: isPortalAccessible, // Backward-compatibility alias: students can enter portal
    isOverride: effectiveMode === 'force_unlocked',
    effectiveMode,
    isTimeInWindow,

    // Active Window Details
    activeWindow,
    startTime: formatTime12(activeWindow.startTime),
    endTime: formatTime12(activeWindow.endTime),
    rawStartTime: activeWindow.startTime,
    rawEndTime: activeWindow.endTime,
    currentTime: timeHms,

    // Status & Config
    statusBadge,
    config,
    loadingConfig,
    saveLockConfig,
  };
}
