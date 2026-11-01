import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Lock } from 'lucide-react';
import { getBatchTheme } from '../../utils/batchTheme';

/**
 * Size mapping to CSS dimensions
 */
const SIZE_MAP = {
  xs: { box: 32, font: 12, subfont: 9 },
  sm: { box: 40, font: 15, subfont: 10 },
  md: { box: 52, font: 20, subfont: 11 },
  lg: { box: 68, font: 26, subfont: 13 },
  xl: { box: 88, font: 34, subfont: 15 },
  '2xl': { box: 112, font: 44, subfont: 18 },
};

/**
 * Student Avatar / Token Keycap Component
 * 
 * - If the student has an approved profile photo (DP), displays the photo.
 * - If no photo, displays purely the clean numeric Token Number (NO "#" hashtag).
 * - Styled with a single consistent color scheme derived from the student's academic batch.
 */
export default function IslamicAvatar({
  student = {},
  size = 'md',
  showStatusRing = true,
  interactive = false,
  onClick = null,
  className = '',
  overridePhotoURL = null,
  animate = true,
}) {
  const [imgError, setImgError] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);

  const tokenNo = student.tokenNo !== undefined && student.tokenNo !== null ? String(student.tokenNo) : '';
  const batch = student.batch || 'General';

  // Derive dedicated color theme for this batch
  const batchTheme = useMemo(() => {
    return getBatchTheme(batch);
  }, [batch]);

  // Size dimensions
  const dims = typeof size === 'number'
    ? { box: size, font: Math.round(size * 0.4), subfont: Math.round(size * 0.22) }
    : (SIZE_MAP[size] || SIZE_MAP.md);

  // Status flags
  const isBlocked = Boolean(student.block);
  const hasPendingPhoto = Boolean(student.pendingPhotoRequest && student.pendingPhotoRequest.status === 'pending');
  const activePhoto = overridePhotoURL || student.photoURL;

  // Status border class
  const statusBorderClass = isBlocked
    ? 'ring-2 ring-rose-500 shadow-rose-500/25'
    : hasPendingPhoto
    ? 'ring-2 ring-amber-400 shadow-amber-400/25'
    : showStatusRing
    ? `ring-1.5 ${batchTheme.ring}`
    : '';

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
      return;
    }
    if (interactive && (activePhoto || tokenNo)) {
      setZoomOpen(true);
    }
  };

  return (
    <>
      <motion.div
        whileHover={interactive ? { scale: 1.04, y: -1 } : undefined}
        whileTap={interactive ? { scale: 0.96 } : undefined}
        onClick={handleClick}
        className={`relative inline-flex items-center justify-center rounded-2xl select-none flex-shrink-0 ${
          interactive ? 'cursor-pointer' : ''
        } ${statusBorderClass} ${className}`}
        style={{
          width: dims.box,
          height: dims.box,
          boxShadow: `0 8px 24px -4px ${batchTheme.glow}`,
        }}
        title={`Token ${tokenNo || ''} • ${student.nameEn || student.name || 'Student'} (${batch})`}
      >
        {/* Ambient Subtle Breathing Pulse Aura (when animate = true) */}
        {animate && !isBlocked && (
          <motion.div
            animate={{
              scale: [1, 1.05, 1],
              opacity: [0.3, 0.55, 0.3],
            }}
            transition={{
              duration: 3.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="absolute inset-0 rounded-2xl -z-10 blur-sm pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${batchTheme.hex} 0%, transparent 100%)`,
              opacity: 0.35,
            }}
          />
        )}

        {/* ================= OPTION A: APPROVED PROFILE PHOTO ================= */}
        {activePhoto && !imgError ? (
          <div className="w-full h-full rounded-2xl overflow-hidden relative bg-[#090d16]">
            <img
              src={activePhoto}
              alt={student.nameEn || student.name || `Token ${tokenNo}`}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
            {/* Soft inner vignette gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/10 pointer-events-none" />

            {/* Pure Token Number Badge Overlay on Photo (NO "#" hashtag) */}
            {tokenNo && dims.box >= 48 && (
              <div
                className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded-md text-[10px] font-mono font-black text-white shadow-xs leading-none"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
              >
                {tokenNo}
              </div>
            )}
          </div>
        ) : (
          /* ================= OPTION B: PURE TOKEN NUMBER KEYCAP (BATCH COLORED, NO "#") ================= */
          <div
            className={`w-full h-full rounded-2xl overflow-hidden relative flex flex-col items-center justify-center p-1 bg-gradient-to-br ${batchTheme.gradient} text-white shadow-inner`}
          >
            {/* Subtle gloss highlight on top edge */}
            <div className="absolute inset-x-0 top-0 h-1/3 bg-white/15 pointer-events-none rounded-t-2xl" />

            {/* Pure Token Number (NO "#" hashtag) */}
            <span
              className="relative z-10 font-mono font-black tracking-tight leading-none text-white"
              style={{
                fontSize: dims.font,
                textShadow: '0 2px 6px rgba(0,0,0,0.4)',
              }}
            >
              {tokenNo || '—'}
            </span>
          </div>
        )}

        {/* Pending Photo Moderation Pill / Icon Badge */}
        {hasPendingPhoto && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-white dark:border-[#0f1715] flex items-center justify-center shadow-md animate-pulse"
            title="Photo submitted and awaiting admin approval"
          >
            <Clock className="w-2.5 h-2.5 text-white" />
          </span>
        )}

        {/* Blocked Status Badge */}
        {isBlocked && (
          <span
            className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-rose-600 border-2 border-white dark:border-[#0f1715] flex items-center justify-center shadow-md"
            title="Dining account suspended"
          >
            <Lock className="w-2.5 h-2.5 text-white" />
          </span>
        )}
      </motion.div>

      {/* ================= FULLSCREEN ZOOM / DETAIL LIGHTBOX ================= */}
      <AnimatePresence>
        {zoomOpen && (
          <div
            data-lenis-prevent
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setZoomOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-sm w-full rounded-3xl bg-white dark:bg-[#111a17] border border-gray-200 dark:border-white/10 p-6 shadow-2xl space-y-4 text-center"
            >
              <button
                type="button"
                onClick={() => setZoomOpen(false)}
                className="absolute right-4 top-4 p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Large Keycap / Photo */}
              <div className="flex justify-center pt-2">
                <IslamicAvatar student={student} size={130} showStatusRing overridePhotoURL={activePhoto} animate={false} />
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-white">
                  {student.nameEn || student.name || `Token ${tokenNo}`}
                </h3>
                {student.nameMl && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-malayalam mt-0.5">
                    {student.nameMl}
                  </p>
                )}
                <div className="flex items-center justify-center gap-2 mt-2 flex-wrap">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${batchTheme.bg} ${batchTheme.text} border ${batchTheme.border}`}>
                    Token {tokenNo}
                  </span>
                  {batch && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                      {batch}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
