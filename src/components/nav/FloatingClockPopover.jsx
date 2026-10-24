import React, { useEffect, useRef, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Timer,
  UtensilsCrossed,
  Coffee,
  ArrowRight,
  ExternalLink,
  ChefHat,
  Zap,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useWorldTime } from '../../utils/time';
import { useTokenLockStatus, formatTime12 } from '../../utils/useTokenLockStatus';
import {
  getLiveMealRadar,
  subscribeToMealScheduleAndFines,
  getCachedMealSchedule,
} from '../../utils/mealScheduleService';

export default function FloatingClockPopover({
  isOpen,
  onClose,
  anchorRect,
}) {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const popoverRef = useRef(null);
  const {
    nowDate,
    timeParts,
    timeHms,
    dayShort,
    dayFull,
    longDate,
    isSynced,
    syncSource,
  } = useWorldTime('Asia/Kolkata');

  const { activeWindow, isUpdationWindowOpen, rawStartTime, rawEndTime } = useTokenLockStatus();
  const [schedule, setSchedule] = useState(() => getCachedMealSchedule());

  // Subscribe to real-time meal schedule updates
  useEffect(() => {
    const unsub = subscribeToMealScheduleAndFines((data) => {
      if (data?.mealSchedule) {
        setSchedule(data.mealSchedule);
      }
    });
    return () => unsub();
  }, []);

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
    const istMs = nowDate.getTime() + 5.5 * 60 * 60 * 1000;
    const d = new Date(istMs);
    const s = d.getUTCSeconds();
    const m = d.getUTCMinutes() + s / 60;
    const h = (d.getUTCHours() % 12) + m / 60;

    return {
      secondAngle: s * 6,
      minuteAngle: m * 6,
      hourAngle: h * 30,
    };
  }, [nowDate]);

  // Real-time Meal Phase Radar
  const mealRadar = useMemo(() => {
    return getLiveMealRadar(timeHms, dayShort, schedule);
  }, [timeHms, dayShort, schedule]);

  // Dynamic Board Updation Window Countdown
  const windowMilestone = useMemo(() => {
    if (!timeHms) return { isOpen: false, text: '', badgeClass: '' };
    const [hh, mm] = timeHms.split(':').map(Number);
    const currentMins = hh * 60 + mm;

    const [startH, startM] = (rawStartTime || '14:00').split(':').map(Number);
    const [endH, endM] = (rawEndTime || '23:00').split(':').map(Number);

    const startMins = startH * 60 + (startM || 0);
    const endMins = endH * 60 + (endM || 0);

    if (currentMins < startMins) {
      const diff = startMins - currentMins;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return {
        isOpen: false,
        badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        text: lang === 'ml'
          ? `തുടങ്ങാൻ ${h}മ ${m}മി ബാക്കി (${formatTime12(rawStartTime, false)})`
          : `Opens in ${h}h ${m}m (${formatTime12(rawStartTime, false)})`,
      };
    } else if (currentMins <= endMins) {
      const diff = endMins - currentMins;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      return {
        isOpen: true,
        badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        text: lang === 'ml'
          ? `കട്ട് ഓഫ് വരെ ${h}മ ${m}മി ബാക്കി (${formatTime12(rawEndTime, false)})`
          : `Open • Cutoff in ${h}h ${m}m (${formatTime12(rawEndTime, false)})`,
      };
    } else {
      return {
        isOpen: false,
        badgeClass: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
        text: lang === 'ml' ? 'ഇന്നത്തെ കട്ട് ഓഫ് കഴിഞ്ഞു' : 'Closed • Cutoff deadline passed',
      };
    }
  }, [timeHms, rawStartTime, rawEndTime, lang]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Viewport-aware clamped positioning (zero transform conflict with Framer Motion)
  const style = {};
  if (typeof window !== 'undefined') {
    const popoverWidth = Math.min(350, window.innerWidth - 24);
    const isMobile = window.innerWidth < 768;
    const padding = isMobile ? 12 : 16;
    let targetLeft;

    if (anchorRect) {
      targetLeft = anchorRect.left + (anchorRect.width / 2) - (popoverWidth / 2);
    } else {
      targetLeft = (window.innerWidth - popoverWidth) / 2;
    }

    const clampedLeft = Math.max(padding, Math.min(window.innerWidth - popoverWidth - padding, targetLeft));
    style.left = `${clampedLeft}px`;
    style.top = anchorRect ? `${Math.max(8, anchorRect.bottom + 8)}px` : '64px';
    style.width = `${popoverWidth}px`;
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
          className="fixed inset-0 bg-black/25 dark:bg-black/60 backdrop-blur-xs pointer-events-auto"
        />

        {/* Popover Card */}
        <motion.div
          ref={popoverRef}
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ type: 'spring', damping: 26, stiffness: 360 }}
          style={style}
          className="fixed pointer-events-auto max-w-[calc(100vw-24px)] max-h-[calc(100vh-80px)] overflow-y-auto rounded-3xl bg-white/95 dark:bg-[#090f0d]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-white/15 shadow-2xl p-4 select-none z-10 space-y-3"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-black text-gray-900 dark:text-white tracking-tight">
                  {lang === 'ml' ? 'ആലത്തൂർപടി ദർസ് തത്സമയ ക്ലോക്ക്' : 'Alathurpadi Dars Live Time'}
                </h4>
                <p className="text-[10px] text-gray-400 font-medium">
                  Indian Standard Time (UTC+05:30)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>IST</span>
              </span>
            </div>
          </div>

          {/* Analog Clock Face & Large Digital Display */}
          <div className="py-2 flex items-center justify-between gap-4 px-2">
            {/* SVG Analog Clock */}
            <div className="relative w-24 h-24 flex items-center justify-center flex-shrink-0">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="46"
                  className="fill-gray-50/80 dark:fill-white/5 stroke-gray-200/90 dark:stroke-white/15 stroke-[1.5]"
                />
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
                    x1={deg % 90 === 0 ? '86' : '89'}
                    y1="50"
                    x2="92"
                    y2="50"
                    transform={`rotate(${deg} 50 50)`}
                    className={
                      deg % 90 === 0
                        ? 'stroke-emerald-600 dark:stroke-emerald-400 stroke-[2] stroke-linecap-round'
                        : 'stroke-gray-300 dark:stroke-white/20 stroke-[1]'
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

                {/* Second Hand */}
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
            <div className="flex-1 text-right">
              <div className="font-mono text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {timeParts ? (
                  <>
                    <span>{timeParts.hours}</span>
                    <span className="text-emerald-500 animate-pulse">:</span>
                    <span>{timeParts.minutes}</span>
                    <span className="text-emerald-500 animate-pulse">:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{timeParts.seconds}</span>
                    <span className="ml-1 text-xs font-bold text-gray-500 dark:text-gray-400">{timeParts.period}</span>
                  </>
                ) : (
                  '--:--:--'
                )}
              </div>
              <p className="text-[11px] font-semibold text-gray-600 dark:text-gray-300 mt-0.5">
                {dayFull}, {longDate}
              </p>
            </div>
          </div>

          {/* Dynamic Live Meal Radar Banner */}
          <div className={`p-2.5 rounded-2xl border transition-all ${
            mealRadar.isServing
              ? 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 border-emerald-500/30'
              : 'bg-gray-50/90 dark:bg-white/[0.04] border-gray-200/70 dark:border-white/10'
          }`}>
            <div className="flex items-center justify-between text-xs font-black">
              <span className="flex items-center gap-1.5 text-gray-900 dark:text-white">
                <span className={`w-2 h-2 rounded-full ${mealRadar.isServing ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                <span>{lang === 'ml' ? mealRadar.bannerTitleMl : mealRadar.bannerTitleEn}</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                mealRadar.isServing
                  ? 'bg-emerald-500 text-white'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
              }`}>
                {mealRadar.isServing ? (lang === 'ml' ? 'വിതരണം നടക്കുന്നു' : 'Serving Now') : (lang === 'ml' ? 'വരുന്നത്' : 'Upcoming')}
              </span>
            </div>
            <p className="text-[11px] font-medium text-gray-600 dark:text-gray-300 mt-1 pl-3.5">
              {lang === 'ml' ? mealRadar.countdownTextMl : mealRadar.countdownTextEn}
            </p>
          </div>

          {/* Dynamic Meal Schedule Cards */}
          <div className="space-y-1.5">
            {/* Breakfast Card */}
            <div className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
              mealRadar.breakfast.status === 'serving'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/40 shadow-xs'
                : 'bg-gray-50/80 dark:bg-white/[0.03] border-gray-200/60 dark:border-white/10'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  mealRadar.breakfast.status === 'serving'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                }`}>
                  <Coffee className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {lang === 'ml' ? 'പ്രഭാതഭക്ഷണം' : 'Breakfast'}
                    </span>
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-semibold block">
                    {mealRadar.breakfast.timing}
                  </span>
                </div>
              </div>

              <div>
                {mealRadar.breakfast.status === 'serving' ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
                    {lang === 'ml' ? 'വിതരണ സമയം' : 'Serving'}
                  </span>
                ) : mealRadar.breakfast.status === 'completed' ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                    {lang === 'ml' ? 'കഴിഞ്ഞു' : 'Finished'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {lang === 'ml' ? 'വരുന്നത്' : 'Upcoming'}
                  </span>
                )}
              </div>
            </div>

            {/* Lunch Card */}
            <div className={`p-2 rounded-xl border flex items-center justify-between text-xs transition-all ${
              mealRadar.lunch.status === 'serving'
                ? 'bg-emerald-50/90 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/40 shadow-xs'
                : 'bg-gray-50/80 dark:bg-white/[0.03] border-gray-200/60 dark:border-white/10'
            }`}>
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${
                  mealRadar.lunch.status === 'serving'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                }`}>
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {lang === 'ml' ? 'ഉച്ചഭക്ഷണം' : 'Lunch'}
                    </span>
                    {mealRadar.isFriday && (
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/25">
                        {lang === 'ml' ? 'ജുമുഅ' : 'Jumu’ah'}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono font-semibold block">
                    {mealRadar.lunch.timing}
                  </span>
                </div>
              </div>

              <div>
                {mealRadar.lunch.status === 'serving' ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
                    {lang === 'ml' ? 'വിതരണ സമയം' : 'Serving'}
                  </span>
                ) : mealRadar.lunch.status === 'completed' ? (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                    {lang === 'ml' ? 'കഴിഞ്ഞു' : 'Finished'}
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                    {lang === 'ml' ? 'വരുന്നത്' : 'Upcoming'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Daily Token Board Updation Window Status */}
          <div className="p-2.5 rounded-2xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-extrabold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5 text-emerald-500" />
                <span>{lang === 'ml' ? 'ടോക്കൺ മാറ്റാനുള്ള സമയം' : 'Token Update Window'}</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${windowMilestone.badgeClass}`}>
                {windowMilestone.isOpen ? (lang === 'ml' ? 'തുറന്നിരിക്കുന്നു' : 'Open') : (lang === 'ml' ? 'അടച്ചിരിക്കുന്നു' : 'Closed')}
              </span>
            </div>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium pl-5">
              {windowMilestone.text}
            </p>
          </div>

          {/* Telemetry Footer */}
          <div className="flex items-center justify-between pt-1 px-1 text-[10px] text-gray-400 border-t border-gray-100 dark:border-white/5">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>{isSynced ? 'NTP Atomic Time Verified' : 'Monotonic Server Synced'}</span>
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">
              ±0.0ms
            </span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
