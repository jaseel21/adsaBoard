import { useEffect, useMemo, useRef, useState } from 'react';
import firebase from '../firebase/config'; // Adjust path if necessary to match your project structure

// Simple helper to format Date to HH:mm:ss in 24h
function formatHms(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}
// Map for day names
const DAY_SHORT = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
const DAY_FULL = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
// Formats Month day, Year from a Date
function formatLongDate(date) {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}
/**
 * Hook that returns time derived from Firebase Firestore server timestamp for a given IANA timezone.
 * It computes a timezone-correct clock locally using the server offset and refreshes periodically.
 * Assumes 'Asia/Kolkata' (IST, UTC+5:30 fixed offset, no DST). For other timezones, falls back to UTC.
 */
export function useWorldTime(timezone = 'Asia/Kolkata') {
  const [serverIso, setServerIso] = useState(null);
  const [error, setError] = useState(null);
  // Store the delta between server epoch and local epoch to avoid spamming Firestore
  const offsetMsRef = useRef(0);
  // Tick state to force recompute every second
  const [tick, setTick] = useState(0);

  const fetchTime = async () => {
    try {
      setError(null);
      const db = firebase.firestore();
      // Use a dedicated doc for time sync (merge to avoid overwriting other fields if any)
      const timeDocRef = db.collection('time-sync').doc('server-offset');
      await timeDocRef.set({
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      const timeDoc = await timeDocRef.get();
      if (timeDoc.exists) {
        const serverTimestamp = timeDoc.data().updatedAt;
        const serverIsoStr = serverTimestamp.toDate().toISOString();
        setServerIso(serverIsoStr);
        // Compute offset using server millis and local now
        const serverMs = serverTimestamp.toMillis();
        const localNowMs = Date.now();
        offsetMsRef.current = serverMs - localNowMs;
      }
    } catch (e) {
      // Keep previous offset if any; expose the error for UI if needed
      setError(e);
    }
  };

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (cancelled) return;
      await fetchTime();
    };
    run();
    const id = setInterval(run, 60000); // refresh every 60s
    return () => { cancelled = true; clearInterval(id); };
  }, [timezone]);

  // Tick every second to update time derivations
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Compute server-aligned Date (UTC first, then adjust for timezone)
  const nowDate = useMemo(() => {
    const utcServerNow = new Date(Date.now() + offsetMsRef.current);
    let timezoneAdjusted;
    if (timezone === 'Asia/Kolkata') {
      // IST is UTC + 5:30 (19800000 ms)
      const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // 19800000
      timezoneAdjusted = new Date(utcServerNow.getTime() + IST_OFFSET_MS);
    } else {
      // Fallback to UTC for unsupported timezones
      timezoneAdjusted = utcServerNow;
    }
    return timezoneAdjusted;
  }, [tick, timezone]); // Depend on tick for second-by-second updates

  // Derivations (now update every second via tick dep)
  const timeHms = useMemo(() => formatHms(nowDate), [nowDate]);
  const dayShort = useMemo(() => DAY_SHORT[nowDate.getDay()], [nowDate]);
  const dayFull = useMemo(() => DAY_FULL[nowDate.getDay()], [nowDate]);
  const longDate = useMemo(() => formatLongDate(nowDate), [nowDate]);

  return {
    serverDateTimeISO: serverIso,
    nowDate,
    timeHms,
    dayShort,
    dayFull,
    longDate,
    error,
  };
}