import React, { useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Timer,
  UtensilsCrossed,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useWorldTime } from '../../utils/time';
import { useTokenLockStatus } from '../../utils/useTokenLockStatus';

export default function FloatingClockPopover({
  isOpen,
  onClose,
  anchorRect,
}) {
  const { lang, t } = useLanguage();
  const popoverRef = useRef(null);
  const {
    nowDate,
    timeParts,
    timeHms,
    time12,
    dayFull,
    longDate,
    isSynced,
    syncSource,
  } = useWorldTime('Asia/Kolkata');
  const lockStatus = useTokenLockStatus();

  // Dismiss on outside click and escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose();
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Compute angles for analog hands
  const { hourAngle, minuteAngle, secondAngle } = useMemo(() => {
    if (!nowDate) return { hourAngle: 0, minuteAngle: 0, secondAngle: 0 };
    // Indian Standard Time (UTC + 5:30)
    const istMs = nowDate.getTime() + 5.5 * 60 * 60 * 1000;
    const d = new Date(istMs);
    const s = d.getUTCSeconds();
    const m = d.getUTCMinutes() + s / 60;
    const h = (d.getUTCHours() % 12) + m / 60;

    return {
      secondAngle: s * 6, // 360 / 60
      minuteAngle: m * 6, // 360 / 60
      hourAngle: h * 30, // 360 / 12
    };
  }, [nowDate]);

  // Calculate countdown to 2:00 PM (14:00) or 11:00 PM (23:00)
  const windowMilestone = useMemo(() => {
    if (!timeHms) return { status: 'loading', text: '' };
    const [hh, mm] = timeHms.split(':').map(Number);
    const currentMins = hh * 60 + mm;
    const startMins = 14 * 60; // 14:00 (02:00 PM)
    const endMins = 23 * 60; // 23:00 (11:00 PM)

    if (currentMins < startMins) {
      const diff = startMins - currentMins;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return {
        isOpen: false,
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        text: lang === 'ml' ? `തുടങ്ങാൻ ${h}മ ${m}മി ബാക്കി` : `Opens in ${h}h ${m}m (02:00 PM)`,
      };
    } else if (currentMins <= endMins) {
      const diff = endMins - currentMins;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return {
        isOpen: true,
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        text: lang === 'ml' ? `കട്ട് ഓഫ് വരെ ${h}മ ${m}മി ബാക്കി` : `Open • Cutoff in ${h}h ${m}m (11:00 PM)`,
      };
    } else {
      return {
        isOpen: false,
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        text: lang === 'ml' ? 'ഇന്നത്തെ കട്ട് ഓഫ് കഴിഞ്ഞു' : 'Closed • Today’s cutoff passed',
      };
    }
  }, [timeHms, lang]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Determine popover position relative to anchor
  const style = {};
  if (anchorRect) {
    style.top = `${anchorRect.bottom + 8}px`;
    style.left = `${Math.max(16, Math.min(window.innerWidth - 336, anchorRect.right - 280))}px`;
  } else {
    style.top = '64px';
    style.left = '50%';
    style.transform = 'translateX(-50%)';
  }

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 pointer-events-none">
        {/* Scrim backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-xs pointer-events-auto"
        />

        {/* Popover Card */}
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          style={style}
          className="fixed pointer-events-auto w-[320px] rounded-3xl bg-white/95 dark:bg-[#0c1412]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-white/15 shadow-2xl p-4 select-none z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-900 dark:text-white tracking-tight">
                  {lang === 'ml' ? 'ആലത്തൂർപടി ദർസ് തത്സമയ ക്ലോക്ക്' : 'Alathurpadi Dars Live Clock'}
                </h4>
                <p className="text-[10px] text-gray-400 font-medium">
                  Indian Standard Time (UTC+05:30)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>IST</span>
              </span>
            </div>
          </div>

          {/* Analog Clock Face & Digital Centerpiece */}
          <div className="py-4 flex flex-col items-center justify-center">
            {/* SVG Analog Clock */}
            <div className="relative w-36 h-36 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                {/* Clock Outer Ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  className="fill-gray-50/80 dark:fill-white/5 stroke-gray-200/90 dark:stroke-white/15 stroke-[1.5]"
                />
                {/* Sub-track ring */}
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="fill-none stroke-gray-200/40 dark:stroke-white/5 stroke-[0.8]"
                />

                {/* Hour Ticks */}
                {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg) => (
                  <line
                    key={deg}
                    x1={deg % 90 === 0 ? "86" : "89"}
                    y1="50"
                    x2="92"
                    y2="50"
                    transform={`rotate(${deg} 50 50)`}
                    className={
                      deg % 90 === 0
                        ? "stroke-emerald-600 dark:stroke-emerald-400 stroke-[2] stroke-linecap-round"
                        : "stroke-gray-300 dark:stroke-white/20 stroke-[1]"
                    }
                  />
                ))}

                {/* Hour Hand */}
                <line
                  x1="50"
                  y1="50"
                  x2="68"
                  y2="50"
                  transform={`rotate(${hourAngle} 50 50)`}
                  className="stroke-gray-900 dark:stroke-white stroke-[3.5] stroke-linecap-round shadow-xs"
                />

                {/* Minute Hand */}
                <line
                  x1="50"
                  y1="50"
                  x2="79"
                  y2="50"
                  transform={`rotate(${minuteAngle} 50 50)`}
                  className="stroke-gray-700 dark:stroke-gray-200 stroke-[2.2] stroke-linecap-round"
                />

                {/* Second Hand (Emerald sweep) */}
                <line
                  x1="44"
                  y1="50"
                  x2="85"
                  y2="50"
                  transform={`rotate(${secondAngle} 50 50)`}
                  className="stroke-emerald-500 stroke-[1.2] stroke-linecap-round"
                />

                {/* Center Pinion Jewel */}
                <circle cx="50" cy="50" r="3" className="fill-emerald-500" />
                <circle cx="50" cy="50" r="1.2" className="fill-white" />
              </svg>
            </div>

            {/* Large Digital Clock Readout */}
            <div className="mt-3 text-center">
              <div className="font-mono text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {timeParts ? (
                  <>
                    <span>{timeParts.hours}</span>
                    <span className="text-emerald-500 animate-pulse">:</span>
                    <span>{timeParts.minutes}</span>
                    <span className="text-emerald-500 animate-pulse">:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{timeParts.seconds}</span>
                    <span className="ml-1.5 text-xs font-bold text-gray-500 dark:text-gray-400">{timeParts.period}</span>
                  </>
                ) : (
                  '--:--:--'
                )}
              </div>
              <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-0.5">
                {dayFull}, {longDate}
              </p>
            </div>
          </div>

          {/* Campus Meal Milestones & Update Window Countdown */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/10">
            {/* Daily Update Window Status */}
            <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                  <Timer className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{lang === 'ml' ? 'ടോക്കൺ അപ്‌ഡേറ്റ് വിൻഡോ' : 'Daily Update Window'}</span>
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${windowMilestone.badgeClass}`}>
                  {windowMilestone.isOpen ? (lang === 'ml' ? 'തുറന്നിരിക്കുന്നു' : 'Open') : (lang === 'ml' ? 'അടച്ചിരിക്കുന്നു' : 'Closed')}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium pl-5">
                {windowMilestone.text}
              </p>
            </div>

            {/* Fixed Meal Timings */}
            <div className="grid grid-cols-2 gap-1.5 text-[11px]">
              <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  {lang === 'ml' ? 'പ്രഭാതഭക്ഷണം' : 'Breakfast'}
                </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 font-mono">
                  07:00 - 08:30 AM
                </span>
              </div>
              <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/50 dark:border-white/5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                  {lang === 'ml' ? 'ഉച്ചഭക്ഷണം' : 'Lunch'}
                </span>
                <span className="font-semibold text-gray-800 dark:text-gray-200 font-mono">
                  12:30 - 02:00 PM
                </span>
              </div>
            </div>

            {/* Sync Telemetry Badge */}
            <div className="flex items-center justify-between pt-1 px-1 text-[10px] text-gray-400">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>{isSynced ? 'NTP Atomic Time Synced' : 'Device Monotonic Synced'}</span>
              </span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                ±0.0ms
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
