import { useEffect, useMemo, useRef, useState } from 'react';

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
 * Hook that returns time derived from worldtimeapi.org for a given IANA timezone.
 * It computes a timezone-correct clock locally using the server offset and refreshes periodically.
 */
export function useWorldTime(timezone = 'Asia/Kolkata') {
  const [serverIso, setServerIso] = useState(null);
  const [error, setError] = useState(null);

  // Store the delta between server epoch and local epoch to avoid spamming the API
  const offsetMsRef = useRef(0);

  const fetchTime = async () => {
    try {
      setError(null);
      const resp = await fetch(`https://worldtimeapi.org/api/timezone/${timezone}`);
      if (!resp.ok) throw new Error('Time API not ok');
      const data = await resp.json();
      // data.datetime is ISO string with offset, data.unixtime is seconds, data.raw_offset and dst_offset exist too
      setServerIso(data.datetime);
      // Use unixtime for robust offset computation when available
      if (typeof data.unixtime === 'number') {
        const serverNowMs = data.unixtime * 1000;
        const localNowMs = Date.now();
        offsetMsRef.current = serverNowMs - localNowMs;
      } else {
        // Fallback: derive from ISO string
        const serverMs = Date.parse(data.datetime);
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

  // Tick every second based on stored offset
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => forceTick(v => (v + 1) % 1_000_000), 1000);
    return () => clearInterval(id);
  }, []);

  const nowDate = useMemo(() => {
    // Compute a Date that reflects server timezone time by adding the offset
    const adjusted = new Date(Date.now() + offsetMsRef.current);
    return adjusted;
  }, [serverIso]);

  // Derivations
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


