import React from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Utensils,
  Coffee,
  CheckCircle2,
  XCircle,
  CalendarDays,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useExperienceFX } from '../fx/ExperienceFXProvider';
import { useTiltGlare } from '../../hooks/useTiltGlare';
import { useSpotlightBorder } from '../../hooks/useSpotlightBorder';
import { useLongPressPeek } from '../../hooks/useLongPressPeek';

/**
 * Detailed Student Token Card View
 * Award-winning tactile card with hardware-accelerated 3D parallax tilt,
 * specular reflection, perimeter spotlight border glow, right-click fast actions,
 * and mobile 3D Peek & Pop touch triggers.
 */
export default function TokenCard({
  doc,
  isOn,
  onLeave,
  isBlocked,
  isLunch,
  onClick,
  className = '',
}) {
  const { t } = useLanguage();
  const tokenNumber = doc.tokenNo;
  const nameEn = doc.nameEn || doc.name || `Token #${tokenNumber}`;
  const nameMl = doc.nameMl;
  const batch = doc.batch || 'General';

  const {
    triggerParticleBurst,
    openContextMenu,
    openPeekSheet,
  } = useExperienceFX();

  // 3D Parallax Tilt & Spotlight Hooks
  const tilt = useTiltGlare({ maxTilt: 6, scale: 1.015, glare: true });
  const spotlight = useSpotlightBorder();

  // Mobile progressive long press peek hook
  const longPress = useLongPressPeek(
    ({ rect, data }) => {
      openPeekSheet(rect, data);
    },
    { delay: 380 }
  );

  const setRefs = (el) => {
    tilt.ref.current = el;
    spotlight.ref.current = el;
  };

  // Determine dietary exclusion tags
  const dietaryAvoided = [];
  if (doc.obj2) {
    if (doc.obj2.beef === false) dietaryAvoided.push({ id: 'beef', label: t('noBeef', 'No Beef') });
    if (doc.obj2.fish === false) dietaryAvoided.push({ id: 'fish', label: t('noFish', 'No Fish') });
    if (doc.obj2.chicken === false) dietaryAvoided.push({ id: 'chicken', label: t('noChicken', 'No Chicken') });
    if (doc.obj2.mutton === false) dietaryAvoided.push({ id: 'mutton', label: t('noMutton', 'No Mutton') });

    Object.entries(doc.obj2).forEach(([k, v]) => {
      if (v === false && !['beef', 'fish', 'chicken', 'mutton'].includes(k)) {
        dietaryAvoided.push({ id: k, label: `No ${k.charAt(0).toUpperCase() + k.slice(1)}` });
      }
    });
  }

  const statusDescription = isBlocked
    ? t('locked', 'Locked')
    : onLeave
    ? t('leave', 'On Leave')
    : isOn
    ? isLunch
      ? t('lunchOn', 'Lunch Active')
      : t('breakfastOn', 'Breakfast Active')
    : isLunch
    ? t('lunchOff', 'Lunch Cancelled')
    : t('breakfastOff', 'Breakfast Cancelled');

  const fullAccessibleLabel = `Token ${tokenNumber}, ${nameEn}${nameMl ? `, ${nameMl}` : ''}, Batch ${batch}. Status: ${statusDescription}. ${dietaryAvoided.length > 0 ? `Diet: Excludes ${dietaryAvoided.map(d => d.label).join(', ')}` : ''}. Press Enter to view details.`;

  const handleClick = (e) => {
    triggerParticleBurst(
      e.clientX,
      e.clientY,
      isBlocked ? 'amber' : isOn ? 'emerald' : 'rose',
      12
    );
    if (onClick) onClick(doc);
  };

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu(e, 'token', { doc, isOn, onLeave, isLunch });
  };

  const handleMouseMove = (e) => {
    tilt.onMouseMove(e);
    spotlight.onMouseMove(e);
  };

  const handleMouseLeave = () => {
    tilt.onMouseLeave();
  };

  return (
    <motion.div
      ref={setRefs}
      role="button"
      tabIndex={0}
      data-magnetic="true"
      aria-label={fullAccessibleLabel}
      aria-pressed={Boolean(isOn)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onTouchStart={(e) => longPress.onTouchStart(e, { doc, isOn, onLeave, isLunch })}
      onTouchEnd={longPress.onTouchEnd}
      onTouchMove={longPress.onTouchMove}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick(e);
        }
      }}
      style={tilt.style}
      className={`spotlight-card relative group rounded-2xl p-3.5 sm:p-4 bg-white/90 dark:bg-[#0f1715]/90 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between gap-2.5 select-none focus-visible:ring-4 focus-visible:ring-emerald-500/60 focus-visible:outline-none transform-style-preserve-3d ${
        isBlocked
          ? 'border-gray-300 dark:border-white/10 opacity-75'
          : isOn
          ? 'border-emerald-300/80 dark:border-emerald-500/25 bg-emerald-500/[0.02]'
          : 'border-rose-300/80 dark:border-rose-500/25 bg-rose-500/[0.02]'
      } ${className}`}
    >
      {/* Dynamic Specular Glare */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none rounded-[inherit] z-20"
        style={tilt.glareStyle}
      />

      {/* Tier 1: Token Number & Meal Status Badge Row */}
      <div className="flex items-center justify-between gap-2 relative z-10">
        {/* Tactile Token Number Square */}
        <div
          className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-extrabold font-mono text-sm sm:text-base text-white shadow-sm flex-shrink-0 ${
            isBlocked
              ? 'bg-gradient-to-b from-gray-700 to-gray-900 border border-gray-600'
              : isOn
              ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/25 border border-emerald-400'
              : 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/25 border border-rose-400'
          }`}
        >
          {tokenNumber}
          {isBlocked && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-800 border border-gray-500 flex items-center justify-center shadow-sm z-10">
              <Lock className="w-2.5 h-2.5 text-gray-300" />
            </span>
          )}
        </div>

        {/* Meal Pill Badge */}
        <div className="flex-shrink-0">
          {isBlocked ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300">
              <Lock className="w-2.5 h-2.5" />
              <span>{t('locked', 'Locked')}</span>
            </span>
          ) : onLeave ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              <CalendarDays className="w-2.5 h-2.5" />
              <span>{t('leave', 'Leave')}</span>
            </span>
          ) : isOn ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>{isLunch ? t('lunchOn', 'Lunch ON') : t('breakfastOn', 'Breakfast ON')}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              <XCircle className="w-2.5 h-2.5" />
              <span>{isLunch ? t('lunchOff', 'Lunch OFF') : t('breakfastOff', 'Breakfast OFF')}</span>
            </span>
          )}
        </div>
      </div>

      {/* Tier 2: Dedicated Full-Width Student Identity Row */}
      <div className="min-w-0 pt-0.5 relative z-10">
        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white leading-snug line-clamp-2" title={nameEn}>
          {nameEn}
        </h4>
        {nameMl && (
          <p lang="ml" className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate font-malayalam mt-0.5" title={nameMl}>
            {nameMl}
          </p>
        )}
      </div>

      {/* Middle & Footer: Batch & Dietary Badges */}
      <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-gray-500 dark:text-gray-400 relative z-10">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md truncate max-w-[140px]">{batch}</span>
        </div>

        {/* Dietary avoidance tags if any */}
        {dietaryAvoided.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {dietaryAvoided.map((item) => (
              <span
                key={item.id}
                className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/20"
              >
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Mobile Long-Press Progressive Countdown Ring */}
      {longPress.progress > 0 && longPress.progress < 1 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
          <svg className="w-16 h-16" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="rgba(0, 0, 0, 0.4)"
              stroke="rgba(16, 185, 129, 0.9)"
              strokeWidth="6"
              strokeDasharray={2 * Math.PI * 44}
              strokeDashoffset={2 * Math.PI * 44 * (1 - longPress.progress)}
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </motion.div>
  );
}
