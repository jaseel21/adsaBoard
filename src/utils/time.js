import { useEffect, useMemo, useRef, useState } from 'react';
import firebase from '../firebase/config';

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
 * Hook that returns time securely fetched from Firebase server, immune to local device clock tampering.
 * It computes a timezone-correct clock locally using performance.now() and refreshes periodically.
 */
export function useWorldTime(timezone = 'Asia/Kolkata') {
  const [serverIso, setServerIso] = useState(null);
  const [error, setError] = useState(null);
  const [isSynced, setIsSynced] = useState(false);
  
  // Store the base server time and the local performance time at the moment of sync
  const baseServerTimeRef = useRef(0);
  const basePerfTimeRef = useRef(0);
  
  // Tick state to force recompute every second
  const [tick, setTick] = useState(0);

  const fetchTime = async () => {
    try {
      setError(null);
      const db = firebase.firestore();
      
      const timeDocRef = db.collection('time-sync').doc('server-offset');
      
      // Request Firebase to set the server timestamp
      await timeDocRef.set({
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      // FORCE read from the server to bypass local offline persistence (which estimates using device clock)
      const timeDoc = await timeDocRef.get({ source: 'server' });
      
      if (timeDoc.exists) {
        const serverTimestamp = timeDoc.data().updatedAt;
        if (!serverTimestamp) throw new Error('Timestamp not found');
        
        const serverMs = serverTimestamp.toMillis();
        
        // Log REAL Firebase server time
        const firebaseServerDate = new Date(serverMs);
        console.log('📡 FIREBASE SERVER TIME (REAL)');
        console.log('ISO:', firebaseServerDate.toISOString());
        console.log('UTC:', firebaseServerDate.toUTCString());
        console.log('HH:mm:ss (UTC):', formatHms(firebaseServerDate));
        console.log('Milliseconds:', serverMs);
        console.log('---');

        baseServerTimeRef.current = serverMs;
        basePerfTimeRef.current = performance.now();
        setIsSynced(true);
        
        const serverIsoStr = new Date(serverMs).toISOString();
        setServerIso(serverIsoStr);
      } else {
        throw new Error('Time document does not exist on Firebase');
      }
    } catch (e) {
      console.error('Firebase Time sync error:', e);
      setError(e);
      setIsSynced(false); // Disable time completely on error
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

  // Compute server-aligned Date, completely immune to system clock changes
  const nowDate = useMemo(() => {
    if (!isSynced) return null;
    const elapsedMs = performance.now() - basePerfTimeRef.current;
    return new Date(baseServerTimeRef.current + elapsedMs);
  }, [tick, timezone, isSynced]);

  // Format time strings using proper timezone conversion
  const timeHms = useMemo(() => {
    if (!nowDate) return null;
    if (timezone === 'Asia/Kolkata') {
      return nowDate.toLocaleTimeString('en-GB', { 
        timeZone: 'Asia/Kolkata', 
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } else {
      return formatHms(nowDate);
    }
  }, [nowDate, timezone]);
  
  const dayShort = useMemo(() => {
    if (!nowDate) return null;
    if (timezone === 'Asia/Kolkata') {
      const istDate = new Date(nowDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      return DAY_SHORT[istDate.getDay()];
    } else {
      return DAY_SHORT[nowDate.getDay()];
    }
  }, [nowDate, timezone]);
  
  const dayFull = useMemo(() => {
    if (!nowDate) return null;
    if (timezone === 'Asia/Kolkata') {
      const istDate = new Date(nowDate.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      return DAY_FULL[istDate.getDay()];
    } else {
      return DAY_FULL[nowDate.getDay()];
    }
  }, [nowDate, timezone]);
  
  const longDate = useMemo(() => {
    if (!nowDate) return null;
    if (timezone === 'Asia/Kolkata') {
      return nowDate.toLocaleDateString('en-US', {
        timeZone: 'Asia/Kolkata',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
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