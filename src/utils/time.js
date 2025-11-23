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
        const serverMs = serverTimestamp.toMillis();
        const localNowMs = Date.now();
        offsetMsRef.current = serverMs - localNowMs;
        
        // Log REAL Firebase server time
        const firebaseServerDate = new Date(serverMs);
        console.log('📡 FIREBASE SERVER TIME (REAL)');
        console.log('ISO:', serverIsoStr);
        console.log('UTC:', firebaseServerDate.toUTCString());
        console.log('HH:mm:ss (UTC):', formatHms(firebaseServerDate));
        console.log('Milliseconds:', serverMs);
        console.log('---');
        
        setServerIso(serverIsoStr);
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

  // Compute server-aligned Date (use Firebase UTC, format for IST timezone)
  const nowDate = useMemo(() => {
    // Firebase gives us UTC time, calculate current UTC based on stored offset
    const utcServerNow = new Date(Date.now() + offsetMsRef.current);
    
    // For IST (Asia/Kolkata), we use toLocaleTimeString with the correct timezone
    // This is more reliable than manually adding offsets
    return utcServerNow;
  }, [tick, timezone]); // Depend on tick for second-by-second updates

  // Format time strings using proper timezone conversion
  const timeHms = useMemo(() => {
    if (timezone === 'Asia/Kolkata') {
      // Use toLocaleTimeString to convert UTC to IST (Asia/Kolkata)
      const istTime = nowDate.toLocaleTimeString('en-GB', { 
        timeZone: 'Asia/Kolkata', 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
      console.log('🕐 IST TIME:', istTime);
      return istTime;
    } else {
      return formatHms(nowDate);
    }
  }, [nowDate, timezone]);
  
  const dayShort = useMemo(() => {
    if (timezone === 'Asia/Kolkata') {
      // Get day of week in IST
      const istDate = new Date(nowDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      return DAY_SHORT[istDate.getDay()];
    } else {
      return DAY_SHORT[nowDate.getDay()];
    }
  }, [nowDate, timezone]);
  
  const dayFull = useMemo(() => {
    if (timezone === 'Asia/Kolkata') {
      const istDate = new Date(nowDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      return DAY_FULL[istDate.getDay()];
    } else {
      return DAY_FULL[nowDate.getDay()];
    }
  }, [nowDate, timezone]);
  
  const longDate = useMemo(() => {
    if (timezone === 'Asia/Kolkata') {
      const istDateStr = nowDate.toLocaleDateString('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      return istDateStr;
    } else {
      return formatLongDate(nowDate);
    }
  }, [nowDate, timezone]);

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