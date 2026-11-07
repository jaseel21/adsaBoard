import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { resolveEffectiveIdleConfig, getDeviceProfile } from '../utils/deviceProfileService';
import { safeLocalStorage } from '../utils/storage';

const SHARED_STORAGE_KEY = 'adsa_last_activity_timestamp';
const BROADCAST_CHANNEL_NAME = 'adsa_kiosk_idle_sync';

/**
 * Enterprise-grade Idle Guard Hook (KioskGuard 2.0)
 * Handles multi-sensor activity aggregation, zero-latency cross-tab synchronization,
 * Screen WakeLock, and device-specific timeout resolution.
 *
 * @param {Object} options
 * @param {function} options.onTimeout - Action executed when idle timer expires
 * @param {function} [options.onWarning] - Action executed when entering warning window
 * @param {function} [options.onTick] - Optional tick callback during countdown
 * @param {boolean} [options.enabled=true] - Whether the guard is actively running
 * @param {Object} [options.configOverride] - Optional manual override configuration
 * @param {string} [options.storageKey] - Shared localStorage key for multi-tab activity sync
 */
export function useIdleGuard({
  onTimeout,
  onWarning,
  onTick,
  enabled = true,
  configOverride = null,
  storageKey = SHARED_STORAGE_KEY,
} = {}) {
  // 1. Resolve active device configuration
  const [deviceProfile, setDeviceProfile] = useState(() => getDeviceProfile());

  // Listen for device profile updates in real-time
  useEffect(() => {
    const handleProfileUpdate = () => {
      setDeviceProfile(getDeviceProfile());
    };
    window.addEventListener('adsa:device_profile_updated', handleProfileUpdate);
    return () => window.removeEventListener('adsa:device_profile_updated', handleProfileUpdate);
  }, []);

  const activeConfig = useMemo(() => {
    return resolveEffectiveIdleConfig(configOverride || deviceProfile);
  }, [configOverride, deviceProfile]);

  const timeoutMs = activeConfig.timeoutMs;
  const warningMs = activeConfig.warningMs;
  const isGuardEnabled = enabled && activeConfig.enabled;

  // 2. States
  const [isWarning, setIsWarning] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(Math.ceil(warningMs / 1000));
  const [status, setStatus] = useState('active'); // 'active' | 'warning' | 'expired'

  // 3. Mutable references to avoid closure stales
  const isWarningRef = useRef(false);
  const lastActivityRef = useRef(Date.now());
  const timerRef = useRef(null);
  const wakeLockRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);
  const onWarningRef = useRef(onWarning);
  const onTickRef = useRef(onTick);
  const broadcastChannelRef = useRef(null);
  const lastScanKeyTimeRef = useRef(0);
  const scannerKeyCountRef = useRef(0);

  useEffect(() => {
    onTimeoutRef.current = onTimeout;
    onWarningRef.current = onWarning;
    onTickRef.current = onTick;
  }, [onTimeout, onWarning, onTick]);

  // Synchronize state flag with ref
  useEffect(() => {
    isWarningRef.current = isWarning;
  }, [isWarning]);

  // 4. Safe Cross-Tab Activity Synchronization
  const syncStorageActivity = useCallback(
    (timestamp) => {
      if (!storageKey || typeof window === 'undefined') return;
      safeLocalStorage.setItem(storageKey, String(timestamp));
    },
    [storageKey]
  );

  const getStoredActivity = useCallback(() => {
    if (!storageKey || typeof window === 'undefined') return 0;
    const val = safeLocalStorage.getItem(storageKey);
    return val ? parseInt(val, 10) || 0 : 0;
  }, [storageKey]);

  // 5. Reset timer handler
  const resetTimer = useCallback(
    (broadcast = true) => {
      const now = Date.now();
      lastActivityRef.current = now;
      syncStorageActivity(now);

      if (isWarningRef.current) {
        isWarningRef.current = false;
        setIsWarning(false);
        setStatus('active');
        setRemainingSeconds(Math.ceil(warningMs / 1000));
      }

      // Broadcast activity reset to other tabs
      if (broadcast && broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.postMessage({ type: 'ACTIVITY_RESET', timestamp: now });
        } catch (_) {}
      }
    },
    [syncStorageActivity, warningMs]
  );

  // 6. Explicit immediate timeout trigger
  const triggerTimeout = useCallback(() => {
    isWarningRef.current = false;
    setIsWarning(false);
    setStatus('expired');

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (broadcastChannelRef.current) {
      try {
        broadcastChannelRef.current.postMessage({ type: 'SESSION_EXPIRED', timestamp: Date.now() });
      } catch (_) {}
    }

    if (onTimeoutRef.current) {
      onTimeoutRef.current();
    }
  }, []);

  // 7. Screen WakeLock Management
  const acquireWakeLock = useCallback(async () => {
    if (typeof window === 'undefined' || !('wakeLock' in navigator)) return;
    if (!activeConfig.wakeLock || !isGuardEnabled) return;

    try {
      if (!wakeLockRef.current) {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        wakeLockRef.current.addEventListener('release', () => {
          wakeLockRef.current = null;
        });
      }
    } catch (_) {
      // Browsers may deny wakeLock if tab is backgrounded or battery saver is active
    }
  }, [activeConfig.wakeLock, isGuardEnabled]);

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      try {
        wakeLockRef.current.release();
      } catch (_) {}
      wakeLockRef.current = null;
    }
  }, []);

  // 8. Main Guard Effect
  useEffect(() => {
    if (!isGuardEnabled) {
      isWarningRef.current = false;
      setIsWarning(false);
      setStatus('active');
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      releaseWakeLock();
      return;
    }

    // Initialize fresh timestamp on guard start
    const startNow = Date.now();
    lastActivityRef.current = startNow;
    syncStorageActivity(startNow);
    isWarningRef.current = false;
    setIsWarning(false);
    setStatus('active');
    setRemainingSeconds(Math.ceil(warningMs / 1000));

    acquireWakeLock();

    // Setup BroadcastChannel for zero-latency cross-tab communication
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        bc.onmessage = (event) => {
          if (event.data?.type === 'ACTIVITY_RESET') {
            const peerTime = Number(event.data.timestamp) || Date.now();
            if (peerTime > lastActivityRef.current) {
              lastActivityRef.current = peerTime;
            }
            if (isWarningRef.current) {
              isWarningRef.current = false;
              setIsWarning(false);
              setStatus('active');
              setRemainingSeconds(Math.ceil(warningMs / 1000));
            }
          } else if (event.data?.type === 'SESSION_EXPIRED') {
            triggerTimeout();
          }
        };
        broadcastChannelRef.current = bc;
      } catch (_) {}
    }

    // High-performance throttled multi-sensor input handler
    let lastHandled = 0;
    const handleUserInteraction = (e) => {
      // Barcode / RFID badge scanner rapid keystroke burst detection
      if (e.type === 'keydown') {
        const now = Date.now();
        const delta = now - lastScanKeyTimeRef.current;
        lastScanKeyTimeRef.current = now;

        if (delta < 60) {
          scannerKeyCountRef.current += 1;
        } else {
          scannerKeyCountRef.current = 1;
        }

        // Fast scanner burst detected (>4 chars within <60ms interval)
        if (scannerKeyCountRef.current >= 4) {
          resetTimer(true);
          return;
        }
      }

      // Throttle mouse / touch / pointer events to at most once per 300ms
      const current = Date.now();
      if (current - lastHandled < 300) return;
      lastHandled = current;

      lastActivityRef.current = current;
      syncStorageActivity(current);

      if (isWarningRef.current) {
        isWarningRef.current = false;
        setIsWarning(false);
        setStatus('active');
        setRemainingSeconds(Math.ceil(warningMs / 1000));

        if (broadcastChannelRef.current) {
          try {
            broadcastChannelRef.current.postMessage({ type: 'ACTIVITY_RESET', timestamp: current });
          } catch (_) {}
        }
      }
    };

    const monitoredEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'touchmove',
      'pointerdown',
      'scroll',
      'wheel',
    ];

    monitoredEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserInteraction, { passive: true });
    });

    // Handle tab visibility change & multi-tab storage events
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        acquireWakeLock();
        const stored = getStoredActivity();
        if (stored > lastActivityRef.current) {
          lastActivityRef.current = stored;
        }
      }
    };

    const handleStorageChange = (e) => {
      if (e.key === storageKey && e.newValue) {
        const remoteTime = parseInt(e.newValue, 10);
        if (remoteTime > lastActivityRef.current) {
          lastActivityRef.current = remoteTime;
          if (isWarningRef.current) {
            isWarningRef.current = false;
            setIsWarning(false);
            setStatus('active');
            setRemainingSeconds(Math.ceil(warningMs / 1000));
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);

    // Periodic Check Loop (1-second precision tick)
    timerRef.current = setInterval(() => {
      // Don't expire while TTS / Web Speech API is speaking
      if (typeof window !== 'undefined' && window.speechSynthesis && window.speechSynthesis.speaking) {
        lastActivityRef.current = Date.now();
        return;
      }

      const current = Date.now();
      const stored = getStoredActivity();
      const effectiveLastActivity = Math.max(lastActivityRef.current, stored);
      const elapsed = current - effectiveLastActivity;
      const timeLeft = timeoutMs - elapsed;

      if (timeLeft <= 0) {
        triggerTimeout();
      } else if (timeLeft <= warningMs) {
        const remainingSec = Math.max(1, Math.ceil(timeLeft / 1000));
        setRemainingSeconds(remainingSec);

        if (!isWarningRef.current) {
          isWarningRef.current = true;
          setIsWarning(true);
          setStatus('warning');
          if (onWarningRef.current) {
            onWarningRef.current({ remainingSeconds: remainingSec, activeConfig });
          }
        }

        if (onTickRef.current) {
          onTickRef.current(remainingSec);
        }
      } else {
        if (isWarningRef.current) {
          isWarningRef.current = false;
          setIsWarning(false);
          setStatus('active');
          setRemainingSeconds(Math.ceil(warningMs / 1000));
        }
      }
    }, 1000);

    return () => {
      monitoredEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserInteraction);
      });
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }

      if (broadcastChannelRef.current) {
        try {
          broadcastChannelRef.current.close();
        } catch (_) {}
        broadcastChannelRef.current = null;
      }

      releaseWakeLock();
    };
  }, [
    isGuardEnabled,
    timeoutMs,
    warningMs,
    syncStorageActivity,
    getStoredActivity,
    acquireWakeLock,
    releaseWakeLock,
    triggerTimeout,
    resetTimer,
    activeConfig,
    storageKey,
  ]);

  return {
    isWarning,
    remainingSeconds,
    status,
    activeConfig,
    resetTimer,
    triggerTimeout,
  };
}
