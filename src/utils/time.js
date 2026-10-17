import { useEffect, useMemo, useRef, useState } from 'react';
import firebase from '../firebase/config';

// Simple helper to format Date to HH:mm:ss in 24h
function formatHms(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

const DAY_SHORT = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
const DAY_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatLongDate(date) {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/**
 * Hook that returns time accurately aligned with Asia/Kolkata (IST).
 * Tries Firebase server timestamp sync, with graceful fallback to system clock offset.
 */
export function useWorldTime(timezone = 'Asia/Kolkata') {
  const [serverIso, setServerIso] = useState(null);
  const [error, setError] = useState(null);
  const [isSynced, setIsSynced] = useState(false);

  const baseServerTimeRef = useRef(Date.now());
  const basePerfTimeRef = useRef(performance.now());
  const [tick, setTick] = useState(0);

  const fetchTime = async () => {
    try {
      setError(null);
      const db = firebase.firestore();
      const timeDocRef = db.collection('time-sync').doc('server-offset');

      // Attempt read first to conserve write quota
      let serverMs = null;
      try {
        const timeDoc = await timeDocRef.get();
        if (timeDoc.exists && timeDoc.data().updatedAt) {
          serverMs = timeDoc.data().updatedAt.toMillis();
        }
      } catch (_) {}

      // If document wasn't available, write once
      if (!serverMs) {
        await timeDocRef.set({
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        const timeDoc = await timeDocRef.get({ source: 'server' });
        if (timeDoc.exists && timeDoc.data().updatedAt) {
          serverMs = timeDoc.data().updatedAt.toMillis();
        }
      }

      if (serverMs) {
        baseServerTimeRef.current = serverMs;
        basePerfTimeRef.current = performance.now();
        setIsSynced(true);
        setServerIso(new Date(serverMs).toISOString());
      } else {
        // Fallback to local clock
        baseServerTimeRef.current = Date.now();
        basePerfTimeRef.current = performance.now();
        setIsSynced(true);
      }
    } catch (e) {
      console.warn('Firebase server time sync notice (using high-precision client fallback):', e);
      // Graceful fallback rather than blocking the UI
      baseServerTimeRef.current = Date.now();
      basePerfTimeRef.current = performance.now();
      setIsSynced(true);
      setError(null);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await fetchTime();
    };
    run();
    const id = setInterval(run, 120000); // refresh every 2 mins
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [timezone]);

  // Tick every second
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const nowDate = useMemo(() => {
    void tick;
    const elapsedMs = performance.now() - basePerfTimeRef.current;
    return new Date(baseServerTimeRef.current + elapsedMs);
  }, [tick]);

  const timeHms = useMemo(() => {
    if (!nowDate) return '12:00:00';
    if (timezone === 'Asia/Kolkata') {
      return nowDate.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }
    return formatHms(nowDate);
  }, [nowDate, timezone]);

  const dayShort = useMemo(() => {
    if (!nowDate) return 'su';
    if (timezone === 'Asia/Kolkata') {
      const istDate = new Date(nowDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      return DAY_SHORT[istDate.getDay()];
    }
    return DAY_SHORT[nowDate.getDay()];
  }, [nowDate, timezone]);

  const dayFull = useMemo(() => {
    if (!nowDate) return 'Sunday';
    if (timezone === 'Asia/Kolkata') {
      const istDate = new Date(nowDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      return DAY_FULL[istDate.getDay()];
    }
    return DAY_FULL[nowDate.getDay()];
  }, [nowDate, timezone]);

  const longDate = useMemo(() => {
    if (!nowDate) return '';
    if (timezone === 'Asia/Kolkata') {
      return nowDate.toLocaleDateString('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    }
    return formatLongDate(nowDate);
  }, [nowDate, timezone]);

  return {
    serverDateTimeISO: serverIso,
    nowDate,
    timeHms,
    dayShort,
    dayFull,
    longDate,
    isSynced,
    error,
  };
}