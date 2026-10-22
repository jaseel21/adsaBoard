import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Clock } from 'lucide-react';

/**
 * Tactile Date Token Button
 * Styled in the exact design language of Home & Admin Token Grid:
 * - Square aspect-ratio with smooth rounded-2xl corners
 * - Tactile gradient backgrounds with colored drop shadows
 * - Spring physics on hover (scale 1.08) and tap (scale 0.94)
 * - Single-click toggling based on currently active meal (Lunch vs Breakfast)
 * - Archived historical ledger display for past days with dual meal indicator pips
 * - Click-to-inspect historical details modal for past days
 * - Granular Next-Day Cutoff locking indicator and feedback
 */
export default function DateTokenButton({
  dateStr,
  dayNumber,
  dayOfWeek,
  isToday = false,
  isTomorrow = false,
  isPast = false,
  isBeyondMax = false,
  isBookable = true,
  isLocked = false,
  lockReason = '',
  breakfast = true,
  lunch = true,
  activeMeal = 'breakfast', // 'breakfast' | 'lunch' | 'both'
  hasException = false,
  exceptionLabel = '',
  onClick,
  onLockedClick,
  onHistoryClick,
}) {
  const isHardDisabled = isBeyondMax;
  const canToggle = !isHardDisabled && !isLocked && isBookable && !isPast;
  const isHistorical = isPast;

  // Determine active meal state
  const isMealOn = activeMeal === 'lunch' ? lunch : activeMeal === 'breakfast' ? breakfast : (lunch && breakfast);
  const isMealOff = activeMeal === 'lunch' ? !lunch : activeMeal === 'breakfast' ? !breakfast : (!lunch && !breakfast);
  const isMealPartial = activeMeal === 'both' && ((breakfast && !lunch) || (!breakfast && lunch));

  let bgClass = '';
  if (isHardDisabled) {
    bgClass = 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 border border-gray-200/40 dark:border-white/5 opacity-40 cursor-not-allowed';
  } else if (isHistorical) {
    // Archived Past Days: Soft matte tactile colors communicating historical attendance
    if (isMealOff) {
      bgClass = 'bg-rose-50/80 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-300/70 dark:border-rose-500/30 hover:border-rose-500 cursor-pointer shadow-xs';
    } else if (isMealPartial) {
      bgClass = 'bg-amber-50/80 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-300/70 dark:border-amber-500/30 hover:border-amber-500 cursor-pointer shadow-xs';
    } else {
      bgClass = 'bg-emerald-50/80 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-300/70 dark:border-emerald-500/30 hover:border-emerald-500 cursor-pointer shadow-xs';
    }
  } else if (isLocked) {
    // Locked date (e.g. tomorrow post-cutoff or today): retains meal status colors with subtle locked opacity & ring
    if (isMealOff) {
      bgClass = 'bg-gradient-to-br from-rose-500/80 to-red-600/80 text-white/90 border border-rose-400/30 opacity-80 cursor-pointer shadow-sm';
    } else {
      bgClass = 'bg-gradient-to-br from-emerald-500/80 to-green-600/80 text-white/90 border border-emerald-400/30 opacity-80 cursor-pointer shadow-sm';
    }
  } else if (isMealPartial) {
    // Amber for partial status when in dual/both mode
    bgClass = 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25 border border-amber-400/40 hover:shadow-glow-amber cursor-pointer';
  } else if (isMealOff) {
    // Rose Red when meal is turned OFF (both Breakfast & Lunch)
    bgClass = 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25 border border-rose-400/40 hover:shadow-glow-red cursor-pointer';
  } else {
    // Emerald Green when meal is turned ON (both Breakfast & Lunch)
    bgClass = 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25 border border-emerald-400/40 hover:shadow-glow-emerald cursor-pointer';
  }

  // If date has a custom exception / override, give it the signature amber highlight ring
  const exceptionBorderClass = hasException && !isHardDisabled && !isHistorical
    ? 'ring-2 ring-amber-400 border-amber-300 shadow-amber-500/20'
    : '';

  const handleClick = () => {
    if (isHardDisabled) return;
    if (isHistorical) {
      if (onHistoryClick) onHistoryClick(dateStr);
      return;
    }
    if (isLocked) {
      if (onLockedClick) onLockedClick(dateStr, lockReason);
      return;
    }
    if (onClick) onClick(dateStr);
  };

  return (
    <motion.button
      type="button"
      disabled={isHardDisabled}
      whileHover={!isHardDisabled ? { scale: 1.08 } : undefined}
      whileTap={!isHardDisabled ? { scale: 0.94 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      onClick={handleClick}
      title={`${dateStr} (${dayOfWeek.toUpperCase()}): ${
        isHistorical
          ? `Archived Record: Meal was ${activeMeal === 'lunch' ? (lunch ? 'ON' : 'OFF') : (breakfast ? 'ON' : 'OFF')} (Click to view full day history)`
          : isLocked
          ? `LOCKED: ${lockReason || 'Cutoff passed'}. Meal is ${activeMeal === 'lunch' ? (lunch ? 'ON' : 'OFF') : (breakfast ? 'ON' : 'OFF')}`
          : activeMeal === 'lunch'
          ? `Lunch is ${lunch ? 'ON' : 'OFF'} (Click to toggle)`
          : `Breakfast is ${breakfast ? 'ON' : 'OFF'} (Click to toggle)`
      }${hasException ? ` • Override: ${exceptionLabel || 'Custom'}` : ''}`}
      aria-label={`Date ${dateStr} ${isHistorical ? 'History' : isLocked ? 'Locked' : ''}`}
      className={`
        relative group flex flex-col items-center justify-center flex-shrink-0
        w-full aspect-square rounded-xl xs:rounded-2xl select-none font-extrabold font-mono
        shadow-sm transition-all duration-150 focus:outline-none
        ${bgClass}
        ${exceptionBorderClass}
        ${isToday ? 'ring-2 ring-emerald-400 ring-offset-1 xs:ring-offset-2 dark:ring-offset-[#0f1715] z-10' : ''}
        ${isTomorrow && !isToday ? 'ring-2 ring-blue-400/80 ring-offset-1 dark:ring-offset-[#0f1715]' : ''}
      `}
    >
      {/* Subtle glass reflection on hover */}
      {!isHardDisabled && (
        <span className="absolute inset-0 rounded-xl xs:rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}

      {/* History Clock Badge for Past Dates */}
      {isHistorical && (
        <span
          title="Archived Dining Record (Click to view details)"
          className="absolute top-0.5 xs:top-1 left-0.5 xs:left-1 w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-full bg-black/10 dark:bg-white/10 text-gray-500 dark:text-gray-300 flex items-center justify-center text-[8px] z-20 pointer-events-none"
        >
          <Clock className="w-2 h-2 xs:w-2.5 xs:h-2.5" />
        </span>
      )}

      {/* Lock Icon for Cutoff Deadlines on Upcoming Dates */}
      {isLocked && !isPast && (
        <span
          title={lockReason || 'Locked (Cutoff deadline passed)'}
          className="absolute top-0.5 xs:top-1 left-0.5 xs:left-1 w-3.5 h-3.5 xs:w-4 xs:h-4 rounded-full bg-black/40 text-amber-300 backdrop-blur-xs flex items-center justify-center shadow-xs z-20"
        >
          <Lock className="w-2 h-2 xs:w-2.5 xs:h-2.5" />
        </span>
      )}

      {/* Exception override indicator (top right pulsing pip or solid amber badge) */}
      {hasException && !isHardDisabled && (
        <span
          title={`Override: ${exceptionLabel || 'Modified'}`}
          className={`absolute top-0.5 xs:top-1 right-0.5 xs:right-1 w-2 h-2 xs:w-2.5 xs:h-2.5 rounded-full bg-yellow-300 border border-amber-600 shadow-sm z-10 ${
            !isHistorical ? 'animate-pulse' : ''
          }`}
        />
      )}

      {/* Today Mini Badge Tag */}
      {isToday && (
        <span className="absolute -top-1 xs:-top-1.5 px-1 xs:px-1.5 py-0.2 rounded-full bg-emerald-700 text-white text-[7px] xs:text-[8px] font-black uppercase tracking-wider shadow-sm z-20">
          Today
        </span>
      )}

      {/* Tomorrow Mini Badge Tag */}
      {isTomorrow && !isToday && (
        <span className={`absolute -top-1 xs:-top-1.5 px-1 xs:px-1.5 py-0.2 rounded-full text-white text-[7px] xs:text-[8px] font-black uppercase tracking-wider shadow-sm z-20 ${
          isLocked ? 'bg-amber-600' : 'bg-blue-600'
        }`}>
          {isLocked ? 'Tmrw 🔒' : 'Tmrw'}
        </span>
      )}

      {/* Day Number */}
      <span className="relative z-10 text-[11px] xs:text-xs min-[380px]:text-sm sm:text-base leading-none tracking-tight">
        {dayNumber}
      </span>

      {/* Mini Day of Week indicator */}
      <span className="text-[8px] xs:text-[9px] uppercase tracking-wider font-sans font-bold opacity-75 leading-none mt-0.5">
        {dayOfWeek}
      </span>

      {/* Dual Meal Mini Pip Indicators (Bottom: Left = Breakfast, Right = Lunch) */}
      {!isHardDisabled && (
        <div className="absolute bottom-0.5 xs:bottom-1 flex items-center gap-0.5 xs:gap-1 z-10">
          {/* Breakfast Pip */}
          <span
            title={`Breakfast: ${breakfast ? 'ON' : 'OFF'}`}
            className={`w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full transition-colors ${
              breakfast
                ? isHistorical
                  ? 'bg-emerald-600 dark:bg-emerald-400 shadow-xs'
                  : 'bg-white/90 shadow-xs'
                : isHistorical
                ? 'bg-rose-400/50 dark:bg-rose-500/40'
                : 'bg-white/30 dark:bg-black/40'
            }`}
          />
          {/* Lunch Pip */}
          <span
            title={`Lunch: ${lunch ? 'ON' : 'OFF'}`}
            className={`w-1 h-1 xs:w-1.5 xs:h-1.5 rounded-full transition-colors ${
              lunch
                ? isHistorical
                  ? 'bg-emerald-600 dark:bg-emerald-400 shadow-xs'
                  : 'bg-white/90 shadow-xs'
                : isHistorical
                ? 'bg-rose-400/50 dark:bg-rose-500/40'
                : 'bg-white/30 dark:bg-black/40'
            }`}
          />
        </div>
      )}
    </motion.button>
  );
}

