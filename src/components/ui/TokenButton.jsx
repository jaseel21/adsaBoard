import React, { useRef } from 'react';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useExperienceFX } from '../fx/ExperienceFXProvider';
import { useLongPressPeek } from '../../hooks/useLongPressPeek';

/**
 * Tactile Square Token Button
 * Award-winning tactile matrix button with magnetic cursor docking,
 * left-click particle bursts, right-click glassmorphic context menu,
 * and mobile progressive long-press with two-stage haptic escalation.
 */
export default function TokenButton({
  doc,
  isOn,
  onLeave = false,
  isLunch = false,
  onClick,
  onBlockedClick,
  className = '',
}) {
  const isBlocked = Boolean(doc.block);
  const buttonRef = useRef(null);

  const {
    triggerParticleBurst,
    openContextMenu,
    openPeekSheet,
    setMagneticTarget,
    setCursorVariant,
  } = useExperienceFX();

  // Mobile progressive long press peek hook
  const longPress = useLongPressPeek(
    ({ rect, data }) => {
      openPeekSheet(rect, data);
    },
    { delay: 380 }
  );

  const handleClick = (e) => {
    e.stopPropagation();

    // Spawn localized spark burst based on meal state
    triggerParticleBurst(
      e.clientX,
      e.clientY,
      isBlocked ? 'amber' : isOn ? 'emerald' : 'rose',
      10
    );

    if (onClick) {
      onClick(doc);
    } else if (isBlocked && onBlockedClick) {
      onBlockedClick(doc);
    }
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu(e, 'token', { doc, isOn, onLeave, isLunch });
  };

  const handleMouseEnter = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setMagneticTarget({
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        borderRadius: 16,
      });
      setCursorVariant('pointer');
    }
  };

  const handleMouseLeave = () => {
    setMagneticTarget(null);
    setCursorVariant('default');
  };

  return (
    <motion.button
      ref={buttonRef}
      type="button"
      data-magnetic="true"
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onTouchStart={(e) => longPress.onTouchStart(e, { doc, isOn, onLeave, isLunch })}
      onTouchEnd={longPress.onTouchEnd}
      onTouchMove={longPress.onTouchMove}
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

      {/* Mobile Long-Press Progressive Countdown Ring */}
      {longPress.progress > 0 && longPress.progress < 1 && (
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none z-30"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke="rgba(255, 255, 255, 0.9)"
            strokeWidth="5"
            strokeDasharray={2 * Math.PI * 44}
            strokeDashoffset={2 * Math.PI * 44 * (1 - longPress.progress)}
            strokeLinecap="round"
          />
        </svg>
      )}
    </motion.button>
  );
}
