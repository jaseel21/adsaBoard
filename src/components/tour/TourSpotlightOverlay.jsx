import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTourEngine } from './TourEngineContext';
import { useFeedback } from '../../utils/useFeedback';

export default function TourSpotlightOverlay() {
  const { status, targetRect, isTargetFound, tourMode } = useTourEngine();
  const { feedback } = useFeedback();

  if (status !== 'running') return null;

  const padding = 8;
  const rect = targetRect
    ? {
        x: Math.max(0, targetRect.left - padding),
        y: Math.max(0, targetRect.top - padding),
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
        rx: targetRect.borderRadius || 16,
      }
    : null;

  const handleBackdropClick = (e) => {
    // If clicking outside the target in interactive mode, trigger gentle nudge vibration
    if (tourMode === 'interactive') {
      feedback('nudge');
    }
  };

  return (
    <div className="fixed inset-0 z-[120] pointer-events-none overflow-hidden">
      {/* SVG Mask Cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="tour-spotlight-mask">
            {/* White covers entire screen (visible backdrop) */}
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {/* Black cutout creates transparent window over target */}
            {rect && (
              <motion.rect
                key="cutout"
                x={rect.x}
                y={rect.y}
                width={rect.width}
                height={rect.height}
                rx={rect.rx}
                ry={rect.rx}
                fill="black"
                transition={{
                  type: 'spring',
                  damping: 32,
                  stiffness: 380,
                  mass: 0.85,
                }}
              />
            )}
          </mask>
        </defs>

        {/* Darkened backdrop with blur mask */}
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.72)"
          mask="url(#tour-spotlight-mask)"
          className="pointer-events-auto cursor-default backdrop-blur-[2px] transition-all"
          onClick={handleBackdropClick}
        />
      </svg>

      {/* Target Focus Ring & Glowing Aura */}
      {rect && isTargetFound && (
        <motion.div
          key="focus-ring"
          initial={false}
          animate={{
            top: rect.y,
            left: rect.x,
            width: rect.width,
            height: rect.height,
            borderRadius: rect.rx,
          }}
          transition={{
            type: 'spring',
            damping: 32,
            stiffness: 380,
            mass: 0.85,
          }}
          className="absolute z-[121] pointer-events-none border-2 border-emerald-400/90 shadow-[0_0_35px_rgba(16,185,129,0.35)]"
        >
          {/* Pulsating border glow */}
          <span className="absolute -inset-1 rounded-[inherit] border border-emerald-300/60 animate-ping opacity-40 pointer-events-none" />

          {/* Corner highlight beacons */}
          <span className="absolute -top-1 -left-1 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-sm" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-sm" />
          <span className="absolute -bottom-1 -left-1 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-sm" />
          <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full shadow-sm" />
        </motion.div>
      )}
    </div>
  );
}

