import React from 'react';
import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

/**
 * Standard Token Switch Button for Admin Matrix View.
 * Matches 100% with the standard design language across the web (Home page, student portal, etc.),
 * preserving consistent button dimensions, gradients, mini indicators, and spring bounce,
 * enhanced with audio-haptic feedback and tactical multi-selection modes.
 */
export default function TactileKeycap({
  number,
  isOn,
  onLeave,
  isBlocked,
  isSupplyOff = false,
  onClick,
  isSelectMode = false,
  isSelected = false,
}) {
  const handleClick = (e) => {
    e.preventDefault();
    soundEngine.playMechanicalClick();
    hapticEngine.lightTap();
    if (onClick) onClick(e);
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      onClick={handleClick}
      aria-label={`Token ${number}${isSelected ? ' (Selected)' : ''}${isSupplyOff ? ' (No Food Supply)' : isBlocked ? ' (Locked)' : isOn ? ' (Active)' : ' (Off)'}`}
      className={`
        relative group flex items-center justify-center flex-shrink-0
        w-10 h-10 xs:w-11 xs:h-11 min-[380px]:w-12 min-[380px]:h-12 sm:w-14 sm:h-14 aspect-square rounded-xl xs:rounded-2xl select-none font-extrabold
        text-[11px] xs:text-xs min-[380px]:text-sm sm:text-base tracking-tight font-mono
        shadow-sm transition-all duration-150 focus:outline-none cursor-pointer
        ${
          isSelected
            ? 'ring-2 sm:ring-4 ring-emerald-400 ring-offset-2 ring-offset-gray-900 z-20 scale-105 shadow-xl'
            : isSelectMode
            ? 'hover:ring-2 hover:ring-white/50'
            : 'focus:ring-2 focus:ring-emerald-400/50'
        }
        ${
          isSupplyOff
            ? 'bg-gradient-to-b from-gray-200 to-gray-300 dark:from-[#1b2622] dark:to-[#121c18] text-gray-500 dark:text-gray-400 border border-gray-300/80 dark:border-white/10 shadow-inner'
            : isBlocked
            ? 'bg-gradient-to-b from-gray-700 to-gray-900 text-gray-300 border border-gray-600/40 shadow-inner'
            : isOn
            ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25 hover:shadow-glow-emerald border border-emerald-400/40'
            : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25 hover:shadow-glow-red border border-rose-400/40'
        }
      `}
    >
      {!isBlocked && !isSupplyOff && (
        <span className="absolute inset-0 rounded-xl xs:rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}

      {/* Multi-Select Corner Indicator Badge */}
      {isSelectMode && (
        <span
          className={`absolute -top-1.5 -left-1.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center transition-all shadow-md z-30 ${
            isSelected
              ? 'bg-emerald-400 text-gray-950 ring-2 ring-white scale-110 font-black'
              : 'bg-black/60 border border-white/40 text-transparent'
          }`}
        >
          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 stroke-[3]" />
        </span>
      )}

      {/* Always show token number, even for blocked tokens */}
      <span className="relative z-10 leading-none">{number}</span>

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
          isSupplyOff ? 'bg-gray-400 dark:bg-gray-500' : isBlocked ? 'bg-gray-400' : isOn ? 'bg-white/80' : 'bg-white/60'
        }`}
      />
    </motion.button>
  );
}
