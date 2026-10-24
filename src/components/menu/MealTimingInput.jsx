import React, { useState, useEffect, useMemo } from 'react';
import { Clock, RefreshCw, Type } from 'lucide-react';
import {
  getCanonicalMealTiming,
  fetchFreshCanonicalMealTiming,
  subscribeToMealScheduleAndFines,
  formatMealTimeRange,
} from '../../utils/mealScheduleService';
import { useFeedback } from '../../utils/useFeedback';

// Curated traditional Dars relative prayer / routine meal times
const RELATIVE_TIMING_SUGGESTIONS = [
  { label: 'After Asr', ml: 'അസറിന് ശേഷം', hint: 'Evening Routine' },
  { label: 'After Maghrib', ml: 'മഗ്‌രിബിന് ശേഷം', hint: 'Iftar / Dinner' },
  { label: 'After Jumu’ah', ml: 'ജുമുഅക്ക് ശേഷം', hint: 'Friday Special' },
  { label: 'After Isha', ml: 'ഇശാഇന് ശേഷം', hint: 'Night Dars' },
  { label: 'Before Fajr (Sahar)', ml: 'സുബ്ഹിക്ക് മുമ്പ്', hint: 'Fasting Sahar' },
  { label: 'After Subhi Dars', ml: 'സുബ്ഹി ദർസിന് ശേഷം', hint: 'Morning Dars' },
];

/**
 * Parses a "HH:MM AM - HH:MM PM" or "HH:MM - HH:MM" string into { start24: "HH:mm", end24: "HH:mm" }
 */
function parse12hTo24hRange(timingStr) {
  if (!timingStr || typeof timingStr !== 'string') return { start24: '', end24: '' };
  
  const parts = timingStr.split('-').map((s) => s.trim());
  if (parts.length !== 2) return { start24: '', end24: '' };

  const to24 = (timePart) => {
    const match = timePart.match(/^(\d{1,2}):(\d{2})(?:\s*([AaPp][Mm]))?$/);
    if (!match) return '';
    let [, hh, mm, meridian] = match;
    let hours = parseInt(hh, 10);
    const minutes = mm;

    if (meridian) {
      const isPM = meridian.toUpperCase() === 'PM';
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    }
    return `${String(hours).padStart(2, '0')}:${minutes}`;
  };

  const start24 = to24(parts[0]);
  const end24 = to24(parts[1]);
  return { start24, end24 };
}

/**
 * MealTimingInput
 *
 * Props:
 * - value: string (e.g. "07:30 AM - 08:45 AM" or "After Asr")
 * - onChange: (newTiming: string, newMode: 'clock' | 'text') => void
 * - timeMode?: 'clock' | 'text' (optional initial mode)
 * - dayKey?: 'su' | 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa'
 * - slotKey: 'breakfast' | 'lunch' | 'evening' | 'dinner'
 * - compact?: boolean
 */
export default function MealTimingInput({
  value = '',
  onChange,
  timeMode = null,
  dayKey = 'su',
  slotKey = 'breakfast',
  compact = false,
  className = '',
}) {
  const { feedback } = useFeedback();

  // Live canonical timing subscribed to settings/canteen_config
  const [canonicalTiming, setCanonicalTiming] = useState(() => getCanonicalMealTiming(dayKey, slotKey));

  useEffect(() => {
    setCanonicalTiming(getCanonicalMealTiming(dayKey, slotKey));
    const unsub = subscribeToMealScheduleAndFines(() => {
      setCanonicalTiming(getCanonicalMealTiming(dayKey, slotKey));
    });
    return () => unsub();
  }, [dayKey, slotKey]);

  // Determine whether current value is a clock-based range or free text
  const isClockLike = useMemo(() => {
    if (!value) return true;
    const { start24, end24 } = parse12hTo24hRange(value);
    return Boolean(start24 && end24);
  }, [value]);

  // Mode: 'clock' vs 'text'
  const [mode, setMode] = useState(() => {
    if (timeMode) return timeMode;
    return isClockLike ? 'clock' : 'text';
  });

  // Clock inputs state (24h strings e.g. "07:30", "08:45")
  const parsed = useMemo(() => parse12hTo24hRange(value), [value]);
  const [startTime24, setStartTime24] = useState(parsed.start24 || '');
  const [endTime24, setEndTime24] = useState(parsed.end24 || '');

  // Keep local clock pickers synced if external value changes in clock mode
  useEffect(() => {
    if (isClockLike) {
      const p = parse12hTo24hRange(value);
      if (p.start24) setStartTime24(p.start24);
      if (p.end24) setEndTime24(p.end24);
    }
  }, [value, isClockLike]);

  // Handler for Clock input changes
  const handleClockChange = (newStart24, newEnd24) => {
    setStartTime24(newStart24);
    setEndTime24(newEnd24);
    if (newStart24 && newEnd24) {
      const formatted = formatMealTimeRange(newStart24, newEnd24);
      if (onChange) onChange(formatted, 'clock');
    }
  };

  // Toggle Mode Handler
  const handleToggleMode = () => {
    feedback('tick');
    const nextMode = mode === 'clock' ? 'text' : 'clock';
    setMode(nextMode);

    if (nextMode === 'clock') {
      const p = parse12hTo24hRange(value);
      if (p.start24 && p.end24) {
        setStartTime24(p.start24);
        setEndTime24(p.end24);
        if (onChange) onChange(value, 'clock');
      } else {
        const canonicalParsed = parse12hTo24hRange(canonicalTiming);
        setStartTime24(canonicalParsed.start24 || '07:30');
        setEndTime24(canonicalParsed.end24 || '08:45');
        if (onChange) onChange(canonicalTiming, 'clock');
      }
    } else {
      if (onChange) onChange(value || 'After Asr', 'text');
    }
  };

  // Sync with Campus Universal Schedule
  const handleSyncUniversal = async () => {
    feedback('pop');
    let timingToUse = canonicalTiming;
    try {
      const fresh = await fetchFreshCanonicalMealTiming(dayKey, slotKey);
      if (fresh) {
        timingToUse = fresh;
        setCanonicalTiming(fresh);
      }
    } catch (e) {
      // use canonicalTiming
    }
    const p = parse12hTo24hRange(timingToUse);
    setStartTime24(p.start24 || '');
    setEndTime24(p.end24 || '');
    setMode('clock');
    if (onChange) onChange(timingToUse, 'clock');
  };

  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Header bar: Timing Label, Current Value Indicator & Mode Switcher */}
      <div className="flex items-center justify-between gap-1 text-[11px]">
        <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 font-semibold">
          <Clock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>Serving Time</span>
          {canonicalTiming && value === canonicalTiming && (
            <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[9px] font-bold border border-emerald-500/20">
              Campus Standard
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Quick sync with universal campus schedule */}
          <button
            type="button"
            onClick={handleSyncUniversal}
            title={`Reset to universal campus schedule (${canonicalTiming})`}
            className="px-1.5 py-0.5 rounded text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-2.5 h-2.5" />
            <span>Sync Campus</span>
          </button>

          {/* Toggle Button */}
          <button
            type="button"
            onClick={handleToggleMode}
            className="px-2 py-0.5 rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[10px] font-bold text-gray-700 dark:text-gray-300 hover:border-emerald-500/50 flex items-center gap-1 transition-all"
            title={mode === 'clock' ? 'Switch to text / relative time (e.g. After Asr)' : 'Switch to clock time pickers'}
          >
            {mode === 'clock' ? (
              <>
                <Type className="w-3 h-3 text-purple-500" />
                <span>Text / Dars Mode</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 text-emerald-500" />
                <span>Clock Picker</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Mode 1: Clock Time Inputs */}
      {mode === 'clock' ? (
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200/80 dark:border-white/10">
          <div className="flex-1 flex items-center gap-1 min-w-0">
            <span className="text-[10px] text-gray-400 uppercase font-bold shrink-0">From</span>
            <input
              type="time"
              value={startTime24}
              onChange={(e) => handleClockChange(e.target.value, endTime24)}
              className="w-full px-2 py-1 rounded-lg border border-gray-200/70 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <span className="text-gray-400 font-bold text-xs shrink-0">—</span>

          <div className="flex-1 flex items-center gap-1 min-w-0">
            <span className="text-[10px] text-gray-400 uppercase font-bold shrink-0">To</span>
            <input
              type="time"
              value={endTime24}
              onChange={(e) => handleClockChange(startTime24, e.target.value)}
              className="w-full px-2 py-1 rounded-lg border border-gray-200/70 dark:border-white/10 bg-white dark:bg-zinc-900 text-xs font-mono font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>
      ) : (
        /* Mode 2: Relative / Text Input with Malabar Dars Quick Chips */
        <div className="space-y-1.5">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange && onChange(e.target.value, 'text')}
            placeholder="e.g. After Asr, After Maghrib, Immediately after Jumu'ah"
            className="w-full px-3 py-1.5 rounded-xl border border-purple-200/80 dark:border-purple-800/40 bg-purple-50/30 dark:bg-purple-950/20 text-xs font-bold text-purple-950 dark:text-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />

          {/* Quick Relative Suggestions */}
          <div className="flex flex-wrap items-center gap-1 pt-0.5">
            {RELATIVE_TIMING_SUGGESTIONS.map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  feedback('pop');
                  if (onChange) onChange(item.label, 'text');
                }}
                className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                  value === item.label
                    ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                    : 'bg-white/80 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-purple-400'
                }`}
                title={item.ml}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
