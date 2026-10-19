import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

/**
 * Standard Token Switch Button for Admin Matrix View.
 * Matches 100% with the standard design language across the web (Home page, student portal, etc.),
 * preserving consistent button dimensions, gradients, mini indicators, and spring bounce,
 * enhanced with audio-haptic feedback.
 */
export default function TactileKeycap({
  number,
  isOn,
  onLeave,
  isBlocked,
  onClick,
}) {
  const handleClick = (e) => {
    e.preventDefault();
    soundEngine.playMechanicalClick();
    hapticEngine.lightTap();
    if (onClick) onClick();
  };

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      onClick={handleClick}
      aria-label={`Token ${number}`}
      className={`
        relative group flex items-center justify-center flex-shrink-0
        w-10 h-10 xs:w-11 xs:h-11 min-[380px]:w-12 min-[380px]:h-12 sm:w-14 sm:h-14 aspect-square rounded-xl xs:rounded-2xl select-none font-extrabold
        text-[11px] xs:text-xs min-[380px]:text-sm sm:text-base tracking-tight font-mono
        shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400/50
        ${
          isBlocked
            ? 'bg-gradient-to-b from-gray-700 to-gray-900 text-gray-300 border border-gray-600/40 shadow-inner'
            : onLeave
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25 border-2 border-amber-300'
            : isOn
            ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25 hover:shadow-glow-emerald border border-emerald-400/40'
            : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25 hover:shadow-glow-red border border-rose-400/40'
        }
      `}
    >
      {!isBlocked && (
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}

      {isBlocked ? (
        <Lock className="w-4 h-4 text-gray-300" />
      ) : (
        <span className="relative z-10 leading-none">{number}</span>
      )}

      {/* Mini indicator dot / leave badge */}
      {onLeave ? (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
      ) : (
        <span
          className={`absolute bottom-1 w-1 h-1 rounded-full ${
            isBlocked ? 'bg-gray-400' : isOn ? 'bg-white/80' : 'bg-white/60'
          }`}
        />
      )}
    </motion.button>
  );
}
