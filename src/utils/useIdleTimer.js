import { useEffect, useRef, useState, useCallback } from 'react';

/**
 * Hook for Public Dars Kiosks and shared computers.
 * Detects inactivity and triggers warning and auto-logout actions.
 *
 * @param {Object} options
 * @param {number} options.timeoutMs - Total inactivity threshold before logout (e.g., 90,000ms = 90s)
 * @param {number} options.warningMs - Warning phase threshold before logout (e.g., 15,000ms = 15s)
 * @param {function} options.onTimeout - Function executed when timeout expires
 * @param {boolean} options.enabled - Whether the timer is currently active
 */
export function useIdleTimer({
  timeoutMs = 90000,
  warningMs = 15000,
  onTimeout,
  enabled = true,
}) {
  const [isWarning, setIsWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(Math.ceil(warningMs / 1000));

  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef(null);

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (isWarning) {
      setIsWarning(false);
      setRemainingSeconds(Math.ceil(warningMs / 1000));
    }
  }, [isWarning, warningMs]);

  useEffect(() => {
    if (!enabled) {
      setIsWarning(false);
      return;
    }

    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    const handleActivity = () => {
      // If we are not in warning mode, throttle resetting activity timestamp
      if (!isWarning) {
        lastActivityRef.current = Date.now();
      }
    };

    events.forEach((evt) => window.addEventListener(evt, handleActivity, { passive: true }));

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActivityRef.current;
      const timeLeft = timeoutMs - elapsed;

      if (timeLeft <= 0) {
        setIsWarning(false);
        if (timerRef.current) clearInterval(timerRef.current);
        if (onTimeout) onTimeout();
      } else if (timeLeft <= warningMs) {
        setIsWarning(true);
        setRemainingSeconds(Math.ceil(timeLeft / 1000));
      } else {
        if (isWarning) {
          setIsWarning(false);
        }
      }
    }, 1000);

    return () => {
      events.forEach((evt) => window.removeEventListener(evt, handleActivity));
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [enabled, timeoutMs, warningMs, isWarning, onTimeout]);

  return {
    isWarning,
    remainingSeconds,
    resetTimer,
  };
}
