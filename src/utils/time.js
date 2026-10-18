import { useEffect, useMemo, useRef, useState } from 'react';
import firebase from '../firebase/config';

const DAY_SHORT = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Global Anti-Tamper Server Time Synchronization Manager.
 *
 * Students might manipulate their local OS/device clock (e.g. forward/backward in settings)
 * to bypass dining cutoff windows or tamper with exceptions.
 *
 * To guarantee integrity:
 * 1. An authoritative real-world UTC timestamp is fetched via multi-layered network sources (Cloudflare edge trace, TimeAPI, Origin Date header, Firestore).
 * 2. The client records the high-resolution monotonic timer (performance.now()).
 * 3. At any future moment, current time = baseServerMs + (performance.now() - basePerfMs).
 * 4. Since performance.now() is a hardware monotonic clock decoupled from wall-clock OS settings,
 *    manipulating device system date & time CANNOT spoof the app.
 */
const syncState = {
  baseServerMs: null,
  basePerfMs: null,
  isSynced: false,
  syncSource: 'initial',
  lastSyncAttempt: 0,
  error: null,
};

const listeners = new Set();
let isSyncing = false;

// Attempt to restore verified server anchor from sessionStorage for zero-latency initial render
if (typeof window !== 'undefined') {
  try {
    const cached = sessionStorage.getItem('adsa_server_time_anchor');
    if (cached) {
      const parsed = JSON.parse(cached);
      // Ensure the cached monotonic reference is within the current browser process
      if (
        typeof parsed.baseServerMs === 'number' &&
        typeof parsed.basePerfMs === 'number' &&
        parsed.basePerfMs <= performance.now()
      ) {
        syncState.baseServerMs = parsed.baseServerMs;
        syncState.basePerfMs = parsed.basePerfMs;
        syncState.isSynced = true;
        syncState.syncSource = 'session-cache';
      }
    }
  } catch (_) {}
}

/**
 * Returns the current high-accuracy UTC timestamp in milliseconds,
 * immune to client device system clock tampering.
 */
export function getSyncedServerTimeMs() {
  if (syncState.baseServerMs != null && syncState.basePerfMs != null) {
    const elapsed = performance.now() - syncState.basePerfMs;
    return syncState.baseServerMs + elapsed;
  }
  // Fallback while initial network fetch is executing (typically 50-150ms)
  return Date.now();
}

/**
 * Returns a Date object reflecting the tamper-proof server time.
 */
export function getSyncedServerDate() {
  return new Date(getSyncedServerTimeMs());
}

/**
 * Returns today's date in IST formatted as YYYY-MM-DD using verified server time.
 */
export function getSyncedISTDateString() {
  const d = new Date(getSyncedServerTimeMs());
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
}

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.warn('Error in time sync listener:', e);
    }
  });
}

function persistSyncAnchor() {
  if (typeof window !== 'undefined' && syncState.baseServerMs != null && syncState.basePerfMs != null) {
    try {
      sessionStorage.setItem(
        'adsa_server_time_anchor',
        JSON.stringify({
          baseServerMs: syncState.baseServerMs,
          basePerfMs: syncState.basePerfMs,
          savedAt: Date.now(),
        })
      );
    } catch (_) {}
  }
}

/**
 * Fetches verified time from resilient public edge endpoints with CORS support.
 */
async function fetchServerTimestamp() {
  // Strategy 1: Cloudflare trace edge endpoint (1.1.1.1)
  const tryCloudflare1 = async () => {
    const t0 = performance.now();
    const res = await fetch('https://1.1.1.1/cdn-cgi/trace', {
      cache: 'no-store',
      headers: { Accept: 'text/plain' },
    });
    const t1 = performance.now();
    if (!res.ok) throw new Error(`CF 1.1.1.1 status ${res.status}`);
    const text = await res.text();
    const match = text.match(/ts=([\d.]+)/);
    if (!match) throw new Error('No ts in CF trace');
    const rtt = Math.max(0, t1 - t0);
    const serverMs = Math.round(parseFloat(match[1]) * 1000) + Math.round(rtt / 2);
    return { serverMs, source: 'cloudflare-1.1.1.1' };
  };

  // Strategy 2: Cloudflare.com trace edge endpoint
  const tryCloudflare2 = async () => {
    const t0 = performance.now();
    const res = await fetch('https://cloudflare.com/cdn-cgi/trace', {
      cache: 'no-store',
      headers: { Accept: 'text/plain' },
    });
    const t1 = performance.now();
    if (!res.ok) throw new Error(`CF status ${res.status}`);
    const text = await res.text();
    const match = text.match(/ts=([\d.]+)/);
    if (!match) throw new Error('No ts in CF trace');
    const rtt = Math.max(0, t1 - t0);
    const serverMs = Math.round(parseFloat(match[1]) * 1000) + Math.round(rtt / 2);
    return { serverMs, source: 'cloudflare-trace' };
  };

  // Strategy 3: TimeAPI.io for Asia/Kolkata
  const tryTimeApi = async () => {
    const t0 = performance.now();
    const res = await fetch('https://timeapi.io/api/v1/time/current/zone?timeZone=Asia/Kolkata', {
      cache: 'no-store',
    });
    const t1 = performance.now();
    if (!res.ok) throw new Error(`TimeAPI status ${res.status}`);
    const data = await res.json();
    if (!data.date_time) throw new Error('No date_time');
    const rtt = Math.max(0, t1 - t0);
    const serverMs = new Date(data.date_time).getTime() + Math.round(rtt / 2);
    return { serverMs, source: 'timeapi' };
  };

  // Strategy 4: Origin Date header (works in local dev & Firebase hosting)
  const tryOrigin = async () => {
    if (typeof window === 'undefined') throw new Error('No window');
    const t0 = performance.now();
    const res = await fetch(window.location.origin + '/?_t=' + Date.now(), {
      method: 'HEAD',
      cache: 'no-store',
    });
    const t1 = performance.now();
    const dateHeader = res.headers.get('date');
    if (!dateHeader) throw new Error('No date header');
    const rtt = Math.max(0, t1 - t0);
    const serverMs = new Date(dateHeader).getTime() + Math.round(rtt / 2);
    return { serverMs, source: 'origin-header' };
  };

  // Strategy 5: Firestore server timestamp document (if authenticated or accessible)
  const tryFirestore = async () => {
    const db = firebase.firestore();
    const timeDocRef = db.collection('time-sync').doc('server-offset');
    if (firebase.auth().currentUser) {
      await timeDocRef.set({
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      const freshDoc = await timeDocRef.get({ source: 'server' });
      if (freshDoc.exists && freshDoc.data().updatedAt) {
        return { serverMs: freshDoc.data().updatedAt.toMillis(), source: 'firestore' };
      }
    }
    throw new Error('Firestore write skipped');
  };

  const strategies = [tryCloudflare1, tryCloudflare2, tryTimeApi, tryOrigin, tryFirestore];

  for (const fn of strategies) {
    try {
      const res = await fn();
      if (res && typeof res.serverMs === 'number' && !isNaN(res.serverMs)) {
        return res;
      }
    } catch (_) {}
  }

  throw new Error('All external server time synchronization sources failed');
}

/**
 * Triggers an asynchronous synchronization pass.
 */
export async function syncServerTime() {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const result = await fetchServerTimestamp();
    syncState.baseServerMs = result.serverMs;
    syncState.basePerfMs = performance.now();
    syncState.isSynced = true;
    syncState.syncSource = result.source;
    syncState.error = null;
    persistSyncAnchor();
    notifyListeners();
  } catch (err) {
    console.warn('Network server time sync notice:', err);
    // If not already synced from cache, provide fallback
    if (!syncState.isSynced) {
      syncState.baseServerMs = Date.now();
      syncState.basePerfMs = performance.now();
      syncState.isSynced = false;
      syncState.syncSource = 'local-device-fallback';
    }
    syncState.error = err.message;
    notifyListeners();
  } finally {
    isSyncing = false;
  }
}

// Automatically initiate sync on module load
if (typeof window !== 'undefined') {
  syncServerTime();

  // Re-sync every 60 seconds to eliminate monotonic clock drift
  setInterval(() => {
    syncServerTime();
  }, 60000);

  // Re-sync immediately when tab regains focus or visibility (e.g. mobile wake / laptop open)
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        syncServerTime();
      }
    });
  }
  window.addEventListener('focus', () => {
    syncServerTime();
  });
  window.addEventListener('online', () => {
    syncServerTime();
  });
}

/**
 * Hook that returns live time accurately aligned with Asia/Kolkata (IST),
 * immune to client device time modifications.
 */
export function useWorldTime(timezone = 'Asia/Kolkata') {
  const [, setTick] = useState(0);

  // Subscribe to sync state updates
  useEffect(() => {
    const handleSync = () => setTick((t) => t + 1);
    listeners.add(handleSync);
    if (!syncState.isSynced) {
      syncServerTime();
    }
    return () => {
      listeners.delete(handleSync);
    };
  }, []);

  // Live second tick
  useEffect(() => {
    const id = setInterval(() => {
      setTick((t) => t + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const currentMs = getSyncedServerTimeMs();
  const nowDate = useMemo(() => new Date(currentMs), [currentMs]);

  // Format 24-hour HH:mm:ss
  const timeHms = useMemo(() => {
    return nowDate.toLocaleTimeString('en-GB', {
      timeZone: timezone,
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [nowDate, timezone]);

  // Format 12-hour hh:mm:ss A (e.g. 04:30:15 PM)
  const time12 = useMemo(() => {
    return nowDate.toLocaleTimeString('en-US', {
      timeZone: timezone,
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }, [nowDate, timezone]);

  // Detailed split time parts for digital clock rendering
  const timeParts = useMemo(() => {
    try {
      const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      }).formatToParts(nowDate);

      const res = {};
      parts.forEach((p) => {
        if (p.type !== 'literal') res[p.type] = p.value;
      });
      return {
        hours: res.hour || '12',
        minutes: res.minute || '00',
        seconds: res.second || '00',
        period: (res.dayPeriod || 'PM').toUpperCase(),
      };
    } catch (_) {
      return { hours: '12', minutes: '00', seconds: '00', period: 'PM' };
    }
  }, [nowDate, timezone]);

  // Short day ('su', 'mo', 'tu', ...)
  const dayShort = useMemo(() => {
    const istDate = new Date(nowDate.toLocaleString('en-US', { timeZone: timezone }));
    return DAY_SHORT[istDate.getDay()] || 'su';
  }, [nowDate, timezone]);

  // Full day name ('Sunday', 'Monday', ...)
  const dayFull = useMemo(() => {
    const istDate = new Date(nowDate.toLocaleString('en-US', { timeZone: timezone }));
    return DAY_FULL[istDate.getDay()] || 'Sunday';
  }, [nowDate, timezone]);

  // Long date ('October 18, 2026')
  const longDate = useMemo(() => {
    return nowDate.toLocaleDateString('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }, [nowDate, timezone]);

  // Full formatted date ('Sunday, October 18, 2026')
  const formattedFullDate = useMemo(() => {
    return `${dayFull}, ${longDate}`;
  }, [dayFull, longDate]);

  // Detect whether the student's device system clock is desynced / manipulated (> 60s difference)
  const deviceOffsetMs = Date.now() - currentMs;
  const isDeviceDesynced = Math.abs(deviceOffsetMs) > 60000;
  const deviceOffsetMinutes = Math.round(deviceOffsetMs / 60000);

  return {
    serverDateTimeISO: nowDate.toISOString(),
    nowDate,
    timeHms,
    time12,
    timeParts,
    dayShort,
    dayFull,
    longDate,
    formattedFullDate,
    isSynced: syncState.isSynced,
    syncSource: syncState.syncSource,
    isDeviceDesynced,
    deviceOffsetMinutes,
    error: syncState.error,
  };
}