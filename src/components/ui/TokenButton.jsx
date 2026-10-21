import React from 'react';
import { motion } from 'framer-motion';
import { Lock, CalendarDays } from 'lucide-react';

/**
 * Tactile Square Token Button
 * High-performance, tactile matrix button representing a student token.
 * 
 * Rules:
 * - Always shows token number (even when locked).
 * - Emerald Green for Active Serving (ON).
 * - Rose Red for Skipped / Off (including Single-Day Leave overrides).
 * - Charcoal Dark for Administratively Blocked / Locked.
 * - Clicking any token (active, off, or locked) opens details.
 */
export default function TokenButton({
  doc,
  isOn,
  onLeave = false,
  onClick,
  onBlockedClick,
  className = '',
}) {
  const isBlocked = Boolean(doc.block);

  const handleClick = (e) => {
    e.stopPropagation();
    if (onClick) {
      onClick(doc);
    } else if (isBlocked && onBlockedClick) {
      onBlockedClick(doc);
    }
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      onClick={handleClick}
      aria-label={`Token ${doc.tokenNo}${isBlocked ? ' (Locked)' : isOn ? ' (Active)' : ' (Off)'}`}
      className={`
        relative group flex items-center justify-center flex-shrink-0
        w-10 h-10 xs:w-11 xs:h-11 min-[380px]:w-12 min-[380px]:h-12 sm:w-14 sm:h-14 aspect-square rounded-xl xs:rounded-2xl select-none font-extrabold
        text-[11px] xs:text-xs min-[380px]:text-sm sm:text-base tracking-tight font-mono
        shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 cursor-pointer
        ${
          isBlocked
            ? 'bg-gradient-to-b from-gray-700 to-gray-900 text-gray-300 border border-gray-600/40 shadow-inner'
            : isOn
            ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25 hover:shadow-glow-emerald border border-emerald-400/40'
            : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25 hover:shadow-glow-red border border-rose-400/40'
        }
        ${className}
      `}
    >
      {!isBlocked && (
        <span className="absolute inset-0 rounded-xl xs:rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}

      {/* Always show token number, even for blocked tokens */}
      <span className="relative z-10 leading-none">{doc.tokenNo}</span>

      {/* Lock badge overlay for blocked tokens */}
      {isBlocked && (
        <span
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-800 border border-gray-500 flex items-center justify-center shadow-sm z-20"
          title="Account Locked by Admin"
        >
          <Lock className="w-2.5 h-2.5 text-gray-300" />
        </span>
      )}

      {/* Subtle indicator dot at bottom */}
      <span
        className={`absolute bottom-1 w-1 h-1 rounded-full ${
          isBlocked ? 'bg-gray-400' : isOn ? 'bg-white/80' : 'bg-white/60'
        }`}
      />
    </motion.button>
  );
}
