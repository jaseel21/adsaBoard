import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Coffee,
  Utensils,
  CheckCircle2,
  XCircle,
  RotateCw,
  RotateCcw,
  Sparkles,
  Flame,
  Users,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../store/LanguageContext';

/**
 * MealFlipCard - Pro-Motion 3D Flippable Meal Reservation Counter Card
 * 
 * Follows the Master Token Board Color System:
 * - FRONT (Default): Turned ON count in Vibrant Emerald gradient with active pulse
 * - BACK (Flipped): Rejected / Opted Out count in Vibrant Rose gradient with reject pulse
 * 
 * Hardware-accelerated 3D flip with perspective and spring dynamics.
 */
export default function MealFlipCard({
  mealType = 'breakfast', // 'breakfast' | 'lunch'
  activeCount = 0,
  rejectedCount = 0,
  totalStudents = 0,
  isFlipped = false,
  onFlip = () => {},
  targetDateStr = '',
  dayLabel = '',
  rejectedTokens = [],
  onOpenTokensModal = null,
}) {
  const { t } = useLanguage();

  const isBreakfast = mealType === 'breakfast';
  const Icon = isBreakfast ? Coffee : Utensils;
  const mealName = isBreakfast
    ? t('navBreakfast', 'Breakfast')
    : t('navLunch', 'Lunch');

  const safeTotal = Math.max(totalStudents, 1);
  const participationPct = Math.min(100, Math.round((activeCount / safeTotal) * 100));
  const rejectedPct = Math.min(100, Math.max(0, 100 - participationPct));

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onFlip();
    }
  };

  return (
    <div
      className="relative perspective-1200 w-full min-w-0 group select-none"
      style={{ minHeight: '190px' }}
    >
      <motion.div
        role="button"
        tabIndex={0}
        aria-label={`${mealName} ${dayLabel}: ${
          isFlipped ? `${rejectedCount} rejected tokens` : `${activeCount} turned on tokens`
        }. Click to flip.`}
        aria-pressed={isFlipped}
        onClick={onFlip}
        onKeyDown={handleKeyDown}
        whileHover={{ y: -3, scale: 1.015 }}
        whileTap={{ scale: 0.98 }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{
          type: 'spring',
          stiffness: 320,
          damping: 26,
          mass: 0.85,
        }}
        className="relative w-full h-full transform-style-preserve-3d cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 rounded-2xl sm:rounded-3xl shadow-xl transition-shadow duration-300"
      >
        {/* ================================================================= */}
        {/* FRONT FACE: TURNED ON COUNT (DEFAULT - TOKEN BOARD EMERALD THEME) */}
        {/* ================================================================= */}
        <div
          className={`
            backface-hidden relative w-full h-full p-4 xs:p-5 rounded-2xl sm:rounded-3xl
            flex flex-col justify-between overflow-hidden
            bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-800
            dark:from-emerald-950/95 dark:via-emerald-900/90 dark:to-[#042018]/95
            text-white border border-emerald-400/40 shadow-lg shadow-emerald-950/25
            hover:shadow-glow-emerald transition-shadow duration-300
          `}
        >
          {/* Subtle Ambient Shimmer Circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-teal-400/15 blur-xl pointer-events-none" />

          {/* Card Header */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div
                className={`w-8 h-8 xs:w-9 xs:h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border ${
                  isBreakfast
                    ? 'bg-amber-400/20 border-amber-300/40 text-amber-300'
                    : 'bg-emerald-400/20 border-emerald-300/40 text-emerald-200'
                }`}
              >
                <Icon className="w-4 h-4 xs:w-4.5 xs:h-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs xs:text-sm font-extrabold tracking-tight text-white block truncate">
                  {mealName}
                </span>
                <span className="text-[10px] text-emerald-200/80 font-medium block truncate">
                  {dayLabel} {targetDateStr ? `• ${targetDateStr}` : ''}
                </span>
              </div>
            </div>

            {/* Turned ON Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/25 border border-emerald-300/40 text-emerald-100 text-[10px] xs:text-[11px] font-extrabold tracking-wide uppercase shadow-xs flex-shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
              </span>
              <span>{t('turnedOnCountBadge', 'Turned ON')}</span>
            </div>
          </div>

          {/* Card Center: Dynamic Rolling Counter & Diners Label */}
          <div className="relative z-10 my-3 xs:my-4">
            <div className="flex items-baseline gap-2">
              <motion.span
                key={activeCount}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="font-mono font-black text-3xl xs:text-4xl sm:text-5xl text-white tracking-tight leading-none drop-shadow-sm"
              >
                {activeCount}
              </motion.span>
              <div className="flex flex-col">
                <span className="text-xs xs:text-sm font-bold text-emerald-100 leading-tight">
                  {t('dinersAttending', 'Diners Attending')}
                </span>
                <span className="text-[10px] text-emerald-200/70 font-medium">
                  {t('mealsUnit', 'meals')} ({participationPct}%)
                </span>
              </div>
            </div>

            {/* Participation Progress Track */}
            <div className="mt-2.5 w-full bg-black/25 dark:bg-white/10 rounded-full h-1.5 overflow-hidden p-0.5 border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${participationPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-teal-300 shadow-xs"
              />
            </div>
          </div>

          {/* Card Footer: Tactile Flip Affordance Pill */}
          <div className="relative z-10 pt-1 flex items-center justify-between text-[10px] xs:text-[11px] font-semibold text-emerald-100/90">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md transition-colors">
              <RotateCw className="w-3 h-3 text-emerald-300 group-hover:rotate-180 transition-transform duration-500" />
              <span>
                {t('clickToViewRejected', 'Tap to view {count} rejected').replace(
                  '{count}',
                  rejectedCount
                )}
              </span>
            </span>

            <span className="text-[10px] text-emerald-200/70 font-mono">
              {activeCount}/{safeTotal}
            </span>
          </div>
        </div>

        {/* ================================================================= */}
        {/* BACK FACE: REJECTED TOKENS COUNT (TOKEN BOARD ROSE / RED THEME)   */}
        {/* ================================================================= */}
        <div
          className={`
            backface-hidden rotate-y-180 absolute inset-0 w-full h-full p-4 xs:p-5 rounded-2xl sm:rounded-3xl
            flex flex-col justify-between overflow-hidden
            bg-gradient-to-br from-rose-600 via-rose-700 to-red-800
            dark:from-rose-950/95 dark:via-rose-900/90 dark:to-[#220407]/95
            text-white border border-rose-400/40 shadow-lg shadow-rose-950/25
            hover:shadow-glow-red transition-shadow duration-300
          `}
        >
          {/* Subtle Ambient Shimmer Circles */}
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-rose-400/20 blur-2xl pointer-events-none" />
          <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-red-400/15 blur-xl pointer-events-none" />

          {/* Card Header */}
          <div className="relative z-10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border bg-rose-400/20 border-rose-300/40 text-rose-200">
                <Icon className="w-4 h-4 xs:w-4.5 xs:h-4.5" />
              </div>
              <div className="min-w-0">
                <span className="text-xs xs:text-sm font-extrabold tracking-tight text-white block truncate">
                  {mealName}
                </span>
                <span className="text-[10px] text-rose-200/80 font-medium block truncate">
                  {dayLabel} {targetDateStr ? `• ${targetDateStr}` : ''}
                </span>
              </div>
            </div>

            {/* Rejected / Opted Out Badge */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/25 border border-rose-300/40 text-rose-100 text-[10px] xs:text-[11px] font-extrabold tracking-wide uppercase shadow-xs flex-shrink-0">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-300 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-400" />
              </span>
              <span>{t('rejectedCountBadge', 'Rejected / Off')}</span>
            </div>
          </div>

          {/* Card Center: Dynamic Rolling Counter & Skipped Label */}
          <div className="relative z-10 my-3 xs:my-4">
            <div className="flex items-baseline gap-2">
              <motion.span
                key={rejectedCount}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="font-mono font-black text-3xl xs:text-4xl sm:text-5xl text-white tracking-tight leading-none drop-shadow-sm"
              >
                {rejectedCount}
              </motion.span>
              <div className="flex flex-col">
                <span className="text-xs xs:text-sm font-bold text-rose-100 leading-tight">
                  {t('tokensSkipped', 'Tokens Opted Out')}
                </span>
                <span className="text-[10px] text-rose-200/70 font-medium">
                  {t('tokensUnit', 'tokens')} ({rejectedPct}%)
                </span>
              </div>
            </div>

            {/* Rejection Progress Track */}
            <div className="mt-2.5 w-full bg-black/25 dark:bg-white/10 rounded-full h-1.5 overflow-hidden p-0.5 border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${rejectedPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-rose-300 to-red-400 shadow-xs"
              />
            </div>
          </div>

          {/* Card Footer: Rejected Tokens Preview + Flip Back Affordance */}
          <div className="relative z-10 pt-1 flex items-center justify-between text-[10px] xs:text-[11px] font-semibold text-rose-100/90">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 backdrop-blur-md transition-colors">
              <RotateCcw className="w-3 h-3 text-rose-300 group-hover:-rotate-180 transition-transform duration-500" />
              <span>
                {t('clickToViewTurnedOn', 'Tap to view {count} turned on').replace(
                  '{count}',
                  activeCount
                )}
              </span>
            </span>

            {rejectedTokens.length > 0 && onOpenTokensModal ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenTokensModal(mealType);
                }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-500/30 hover:bg-rose-500/50 border border-rose-300/30 text-[10px] font-bold text-white transition-all active:scale-95"
                title={t('viewAllRejectedTokens', 'View Rejected Tokens')}
              >
                <span>Tokens ({rejectedTokens.length})</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-[10px] text-rose-200/70 font-mono">
                {rejectedCount}/{safeTotal}
              </span>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
