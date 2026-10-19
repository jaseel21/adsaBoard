import React from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

/**
 * MicroPillKeycap: High-density compact view mode for viewing hundreds of tokens at once.
 */
export default function MicroPillKeycap({
  number,
  isOn,
  onLeave,
  isBlocked,
  onClick,
  dimmed = false,
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
      whileHover={{ scale: 1.12 }}
      whileTap={{ scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 500, damping: 25 }}
      onClick={handleClick}
      aria-label={`Token ${number}`}
      className={`
        relative flex items-center justify-center flex-shrink-0
        w-8 h-8 xs:w-9 xs:h-9 rounded-lg select-none font-bold text-[11px] xs:text-xs font-mono
        cursor-pointer shadow-xs focus:outline-none transition-opacity duration-150
        ${dimmed ? 'opacity-20' : 'opacity-100'}
        ${
          isBlocked
            ? 'bg-gray-800 text-gray-400 border border-gray-700'
            : onLeave
            ? 'bg-amber-500 text-white border border-amber-400'
            : isOn
            ? 'bg-emerald-600 text-white border border-emerald-500'
            : 'bg-rose-600 text-white border border-rose-500'
        }
      `}
    >
      {isBlocked ? <Lock className="w-3 h-3 text-gray-300" /> : number}
    </motion.button>
  );
}
