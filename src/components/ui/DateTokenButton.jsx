import React from 'react';
import { motion } from 'framer-motion';
import { Lock, ShieldCheck, Sparkles, PowerOff } from 'lucide-react';

/**
 * Modern Tactile Date Token Button
 * Styled in the unified design language of Master Board:
 * - Emerald Green for Active / Serving / ON
 * - Rose Red for Cancelled / Leave / OFF
 * - Systematic Bi-Color Split (Emerald / Rose) for Partial Days (1 ON / 1 OFF) — NO amber/gold
 * - Neutral Greyed / Shadowed Out for Suspended Supply / Leave (Neither ON nor OFF)
 * - Spring physics on hover & tap
 * - Admin lock bypass permitting today & tomorrow schedules
 */
export default function DateTokenButton({
  dateStr,
  dayNumber,
  dayOfWeek = '',
  isToday = false,
  isTomorrow = false,
  isPast = false,
  isBeyondMax = false,
  isBookable = true,
  isLocked = false,
  isAdmin = false,
  isReadOnly = false,
  isAdminOverride = false,
  lockReason = '',
  breakfast = true,
  lunch = true,
  activeMeal = 'breakfast', // 'breakfast' | 'lunch' | 'both'
  showDualPills = false,
  hasException = false,
  exceptionLabel = '',
  isSupplyOff = false,
  isBfSupplyOff = false,
  isLunchSupplyOff = false,
  onClick,
  onLockedClick,
  onHistoryClick,
}) {
  const isHardDisabled = isBeyondMax;
  const effectiveLocked = isAdmin ? false : isLocked;
  const isHistorical = isPast;
  const effectiveReadOnly = isReadOnly || !isAdmin;

  // Determine effective supply status for active meal view
  const effectiveSupplyOff =
    isSupplyOff ||
    (activeMeal === 'lunch'
      ? isLunchSupplyOff
      : activeMeal === 'breakfast'
      ? isBfSupplyOff
      : isBfSupplyOff && isLunchSupplyOff);

  const isPartialSupplyOff =
    activeMeal === 'both' &&
    !effectiveSupplyOff &&
    ((isBfSupplyOff && !isLunchSupplyOff) || (!isBfSupplyOff && isLunchSupplyOff));

  // Determine active meal state
  const isMealOn = activeMeal === 'lunch' ? lunch : activeMeal === 'breakfast' ? breakfast : (lunch && breakfast);
  const isMealOff = activeMeal === 'lunch' ? !lunch : activeMeal === 'breakfast' ? !breakfast : (!lunch && !breakfast);
  const isMealPartial = activeMeal === 'both' && ((breakfast && !lunch) || (!breakfast && lunch));

  let bgClass = '';
  if (isHardDisabled) {
    bgClass = 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 border border-gray-200/40 dark:border-white/5 opacity-40 cursor-not-allowed';
  } else if (effectiveSupplyOff) {
    // GREYED / SHADOWED OUT STATE: Food supply suspended for this meal / day (neither ON nor OFF)
    bgClass = 'bg-gradient-to-b from-gray-200 to-gray-300 dark:from-[#1b2622] dark:to-[#121c18] text-gray-500 dark:text-gray-400 border border-gray-300/80 dark:border-white/10 shadow-inner cursor-pointer';
  } else if (isPartialSupplyOff) {
    // One meal has food supply suspended, the other does not
    if (isBfSupplyOff) {
      // Top (Bf) is shadowed grey, Bottom (Lunch) is Emerald (ON) or Rose (OFF)
      bgClass = lunch
        ? 'bg-gradient-to-b from-gray-300 dark:from-[#1b2622] via-gray-300/70 to-emerald-600 text-white shadow-inner border border-gray-300/80 dark:border-white/10 cursor-pointer'
        : 'bg-gradient-to-b from-gray-300 dark:from-[#1b2622] via-gray-300/70 to-rose-600 text-white shadow-inner border border-gray-300/80 dark:border-white/10 cursor-pointer';
    } else {
      // Top (Bf) is Emerald (ON) or Rose (OFF), Bottom (Lunch) is shadowed grey
      bgClass = breakfast
        ? 'bg-gradient-to-b from-emerald-600 via-gray-300/70 to-gray-300 dark:to-[#121c18] text-white shadow-inner border border-gray-300/80 dark:border-white/10 cursor-pointer'
        : 'bg-gradient-to-b from-rose-600 via-gray-300/70 to-gray-300 dark:to-[#121c18] text-white shadow-inner border border-gray-300/80 dark:border-white/10 cursor-pointer';
    }
  } else if (isHistorical) {
    // Archived Past Days: Soft matte tactile colors communicating historical attendance
    if (isMealOff) {
      bgClass = 'bg-rose-50/90 dark:bg-rose-950/25 text-rose-700 dark:text-rose-300 border border-rose-300/60 dark:border-rose-500/30 hover:border-rose-400 cursor-pointer shadow-xs';
    } else if (isMealPartial) {
      bgClass = 'bg-gray-100/90 dark:bg-white/[0.04] text-gray-700 dark:text-gray-300 border border-gray-300/80 dark:border-white/10 hover:border-gray-400 cursor-pointer shadow-xs';
    } else {
      bgClass = 'bg-emerald-50/90 dark:bg-emerald-950/25 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-500/30 hover:border-emerald-400 cursor-pointer shadow-xs';
    }
  } else if (effectiveLocked) {
    // Locked date for regular students
    if (isMealOff) {
      bgClass = 'bg-gradient-to-br from-rose-600/80 to-red-700/80 text-white/90 border border-rose-400/30 opacity-80 cursor-pointer shadow-sm';
    } else {
      bgClass = 'bg-gradient-to-br from-emerald-600/80 to-green-700/80 text-white/90 border border-emerald-400/30 opacity-80 cursor-pointer shadow-sm';
    }
  } else if (isMealPartial) {
    // Systematic Bi-Color Split (Emerald top for ON meal, Rose bottom for OFF meal, or vice versa)
    if (breakfast && !lunch) {
      bgClass = 'bg-gradient-to-b from-emerald-600 via-emerald-600/80 to-rose-600 text-white shadow-emerald-600/20 border border-emerald-400/40 cursor-pointer';
    } else {
      bgClass = 'bg-gradient-to-b from-rose-600 via-rose-600/80 to-emerald-600 text-white shadow-rose-600/20 border border-rose-400/40 cursor-pointer';
    }
  } else if (isMealOff) {
    // Rose Red when meal is turned OFF (both Breakfast & Lunch)
    bgClass = 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25 border border-rose-400/40 hover:shadow-glow-red cursor-pointer';
  } else {
    // Emerald Green when meal is turned ON (both Breakfast & Lunch)
    bgClass = 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25 border border-emerald-400/40 hover:shadow-glow-emerald cursor-pointer';
  }

  const handleClick = () => {
    if (isHardDisabled) return;
    if (isHistorical) {
      if (onHistoryClick) onHistoryClick(dateStr);
      return;
    }
    if (effectiveLocked) {
      if (onLockedClick) onLockedClick(dateStr, lockReason);
      return;
    }
    if (onClick) onClick(dateStr);
  };

  return (
    <motion.button
      type="button"
      disabled={isHardDisabled}
      whileHover={!isHardDisabled ? (effectiveReadOnly ? { scale: 1.02 } : { scale: 1.05 }) : undefined}
      whileTap={!isHardDisabled ? { scale: 0.94 } : undefined}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      onClick={handleClick}
      title={`${dateStr} (${dayOfWeek.toUpperCase()}): ${
        isHardDisabled
          ? 'Out of calendar range.'
          : effectiveSupplyOff
          ? 'No Food Supply • Canteen meal service suspended for this shift'
          : isHistorical
          ? `Archived Record: Bf is ${breakfast ? 'ON' : 'OFF'}, Lunch is ${lunch ? 'ON' : 'OFF'} (Click to view)`
          : effectiveLocked
          ? `LOCKED: ${lockReason || 'Cutoff passed'}. Bf: ${breakfast ? 'ON' : 'OFF'}, Lunch: ${lunch ? 'ON' : 'OFF'}`
          : isAdmin && (isLocked || isAdminOverride)
          ? `ADMIN OVERRIDE: Cutoff bypassed. Bf: ${breakfast ? 'ON' : 'OFF'}, Lunch: ${lunch ? 'ON' : 'OFF'}`
          : isAdmin
          ? `Bf: ${breakfast ? 'ON' : 'OFF'} • Lunch: ${lunch ? 'ON' : 'OFF'} (Admin click to toggle)`
          : `Bf: ${breakfast ? 'ON' : 'OFF'} • Lunch: ${lunch ? 'ON' : 'OFF'} (View Only • Click to login & switch)`
      }`}
      aria-label={`${dateStr}, ${dayOfWeek}. ${
        isHardDisabled
          ? 'Out of calendar range.'
          : effectiveSupplyOff
          ? 'No Food Supply • Canteen meal service suspended.'
          : isHistorical
          ? `Archived: Breakfast ${breakfast ? 'Served' : 'Off'}, Lunch ${lunch ? 'Served' : 'Off'}.`
          : effectiveLocked
          ? `Locked (${lockReason || 'Cutoff passed'}): Breakfast ${breakfast ? 'Active' : 'Off'}, Lunch ${lunch ? 'Active' : 'Off'}.`
          : isAdmin
          ? `Breakfast is ${breakfast ? 'Active' : 'Off'}, Lunch is ${lunch ? 'Active' : 'Off'}. Press Enter to toggle.`
          : `Breakfast is ${breakfast ? 'Active' : 'Off'}, Lunch is ${lunch ? 'Active' : 'Off'}. View only. Log in to switch attendance.`
      }`}
      className={`
        relative group flex flex-col items-center justify-between p-1 sm:p-1.5
        w-full aspect-square rounded-xl sm:rounded-2xl select-none font-black font-mono
        shadow-sm transition-all duration-150 focus-visible:ring-4 focus-visible:ring-emerald-400 focus-visible:outline-none focus-visible:z-20 overflow-hidden
        ${bgClass}
        ${isToday ? 'ring-2 ring-emerald-400 dark:ring-emerald-300 ring-offset-2 dark:ring-offset-[#0f1715] z-10' : ''}
      `}
    >
      {/* Subtle glass reflection on hover */}
      {!isHardDisabled && !effectiveSupplyOff && (
        <span className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}

      {/* Top Header Row inside Date Cell: Lock/Admin/Supply Icons */}
      <div className="w-full flex items-center justify-end text-[8px] sm:text-[9px] leading-none min-h-[9px]">
        {effectiveSupplyOff || isPartialSupplyOff ? (
          <span title="Canteen Food Supply Suspended" className="text-gray-500 dark:text-gray-400">
            <PowerOff className="w-2.5 h-2.5" />
          </span>
        ) : isHistorical ? null : isAdmin && (isLocked || isAdminOverride) ? (
          <span title="Admin Cutoff Bypass Active" className="text-emerald-200">
            <ShieldCheck className="w-2.5 h-2.5" />
          </span>
        ) : effectiveLocked ? (
          <span title={lockReason || 'Locked (Cutoff passed)'} className="text-white/80">
            <Lock className="w-2.5 h-2.5" />
          </span>
        ) : null}
      </div>

      {/* Centered Crisp Day Number */}
      <span className="relative z-10 text-xs sm:text-sm font-black font-mono leading-none tracking-tight my-auto drop-shadow-xs">
        {dayNumber}
      </span>

      {/* Bottom Row: Dual Meal Status Indicators */}
      {showDualPills ? (
        <div className="w-full flex items-center justify-center gap-1 text-[8px] font-bold leading-none py-0.5">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-transform ${
              isBfSupplyOff
                ? 'bg-gray-400/60 dark:bg-gray-600'
                : breakfast
                ? 'bg-white shadow-xs'
                : 'bg-rose-950/80 ring-1 ring-white/20'
            }`}
            title={`Breakfast: ${isBfSupplyOff ? 'No Supply' : breakfast ? 'ON' : 'OFF'}`}
          />
          <span
            className={`w-1.5 h-1.5 rounded-full transition-transform ${
              isLunchSupplyOff
                ? 'bg-gray-400/60 dark:bg-gray-600'
                : lunch
                ? 'bg-white shadow-xs'
                : 'bg-rose-950/80 ring-1 ring-white/20'
            }`}
            title={`Lunch: ${isLunchSupplyOff ? 'No Supply' : lunch ? 'ON' : 'OFF'}`}
          />
        </div>
      ) : (
        <div className="h-1 w-full" />
      )}
    </motion.button>
  );
}
