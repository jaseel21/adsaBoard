import { useEffect, useRef, useState, useCallback } from 'react';

const SHARED_STORAGE_KEY = 'adsa_last_activity_timestamp';

/**
 * Hook for Public Dars Kiosks and shared campus terminals.
 * Detects inactivity and triggers warning and auto-logout actions.
 *
 * @param {Object} options
 * @param {number} [options.timeoutMs=90000] - Total inactivity threshold before logout (e.g., 90,000ms = 90s)
 * @param {number} [options.warningMs=15000] - Warning phase threshold before logout (e.g., 15,000ms = 15s)
 * @param {function} options.onTimeout - Function executed when timeout expires
 * @param {function} [options.onWarning] - Optional callback executed when warning phase starts
 * @param {boolean} [options.enabled=true] - Whether the timer is currently active
 * @param {boolean} [options.activityResetsWarning=true] - Whether user interaction dismisses warning
 * @param {string} [options.storageKey] - Optional storage key to sync activity across tabs
 */
export function useIdleTimer({
  timeoutMs = 90000,
  warningMs = 15000,
  onTimeout,
  onWarning,
  enabled = true,
  activityResetsWarning = true,
  storageKey = SHARED_STORAGE_KEY,
}) {
  const [isWarning, setIsWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(Math.ceil(warningMs / 1000));

  const isWarningRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);
  const onWarningRef = useRef(onWarning);
  const timeoutMsRef = useRef(timeoutMs);
  const warningMsRef = useRef(warningMs);

  // Keep callback and threshold refs fresh without triggering effect re-runs
  useEffect(() => {
    onTimeoutRef.current = onTimeout;
    onWarningRef.current = onWarning;
    timeoutMsRef.current = timeoutMs;
    warningMsRef.current = warningMs;
  }, [onTimeout, onWarning, timeoutMs, warningMs]);

  // Keep isWarningRef synchronized with state
  useEffect(() => {
    isWarningRef.current = isWarning;
  }, [isWarning]);

  // Safely write shared timestamp
  const syncStorageActivity = useCallback(
    (ts) => {
      if (!storageKey || typeof window === 'undefined') return;
      try {
        localStorage.setItem(storageKey, String(ts));
      } catch (_) {}
    },
    [storageKey]
  );

  // Safely read shared timestamp
  const getStoredActivity = useCallback(() => {
    if (!storageKey || typeof window === 'undefined') return 0;
    try {
      const val = localStorage.getItem(storageKey);
      return val ? parseInt(val, 10) || 0 : 0;
    } catch (_) {
      return 0;
    }
  }, [storageKey]);

  const resetTimer = useCallback(() => {
    const now = Date.now();
    lastActivityRef.current = now;
    syncStorageActivity(now);
    if (isWarningRef.current) {
      isWarningRef.current = false;
      setIsWarning(false);
      setRemainingSeconds(Math.ceil(warningMsRef.current / 1000));
    }
  }, [syncStorageActivity]);

  useEffect(() => {
    if (!enabled) {
      isWarningRef.current = false;
      setIsWarning(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    // CRITICAL FIX: Reset activity timestamp immediately whenever timer becomes enabled!
    // This prevents stale timestamps from immediately expiring on login after a page has sat open.
    const now = Date.now();
    lastActivityRef.current = now;
    syncStorageActivity(now);
    isWarningRef.current = false;
    setIsWarning(false);
    setRemainingSeconds(Math.ceil(warningMsRef.current / 1000));

    // Throttled activity handler
    let lastHandled = 0;
    const handleActivity = () => {
      const current = Date.now();
      // Throttle event processing to at most once per 500ms
      if (current - lastHandled < 500) return;
      lastHandled = current;

      lastActivityRef.current = current;
      syncStorageActivity(current);

      if (activityResetsWarning && isWarningRef.current) {
        isWarningRef.current = false;
        setIsWarning(false);
        setRemainingSeconds(Math.ceil(warningMsRef.current / 1000));
      }
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'];
    events.forEach((evt) => {
      window.addEventListener(evt, handleActivity, { passive: true });
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab brought to foreground: check if activity occurred elsewhere
        const stored = getStoredActivity();
        if (stored > lastActivityRef.current) {
          lastActivityRef.current = stored;
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Periodic check loop
    timerRef.current = setInterval(() => {
      const current = Date.now();
      const stored = getStoredActivity();
      const effectiveLastActivity = Math.max(lastActivityRef.current, stored);

      const elapsed = current - effectiveLastActivity;
      const tMs = timeoutMsRef.current;
      const wMs = warningMsRef.current;
      const timeLeft = tMs - elapsed;

      if (timeLeft <= 0) {
        isWarningRef.current = false;
        setIsWarning(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (onTimeoutRef.current) {
          onTimeoutRef.current();
        }
      } else if (timeLeft <= wMs) {
        if (!isWarningRef.current) {
          isWarningRef.current = true;
          setIsWarning(true);
          if (onWarningRef.current) {
            onWarningRef.current();
          }
        }
        setRemainingSeconds(Math.max(1, Math.ceil(timeLeft / 1000)));
      } else {
        if (isWarningRef.current) {
          isWarningRef.current = false;
          setIsWarning(false);
          setRemainingSeconds(Math.ceil(wMs / 1000));
        }
      }
    }, 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [enabled, activityResetsWarning, syncStorageActivity, getStoredActivity]);

  return {
    isWarning,
    remainingSeconds,
    resetTimer,
  };
}
