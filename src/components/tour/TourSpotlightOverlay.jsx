import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTourEngine } from './TourEngineContext';
import { useFeedback } from '../../utils/useFeedback';

export default function TourSpotlightOverlay() {
  const { status, targetRect, isTargetFound, tourMode } = useTourEngine();
  const { feedback } = useFeedback();

  const [viewport, setViewport] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 1920,
    h: typeof window !== 'undefined' ? window.innerHeight : 1080,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const rect = useMemo(() => {
    if (!targetRect) return null;
    const padding = 8;
    return {
      x: Math.max(0, targetRect.left - padding),
      y: Math.max(0, targetRect.top - padding),
      width: targetRect.width + padding * 2,
      height: targetRect.height + padding * 2,
      rx: Math.min(
        targetRect.borderRadius || 16,
        (targetRect.width + padding * 2) / 2,
        (targetRect.height + padding * 2) / 2
      ),
    };
  }, [targetRect]);

  const handleBackdropClick = useCallback(() => {
    // If clicking outside the target in interactive mode, trigger gentle nudge vibration
    if (tourMode === 'interactive') {
      feedback('nudge');
    }
  }, [tourMode, feedback]);

  // Generate an Even-Odd SVG path that punches a real, clickable hole over the target
  const pathD = useMemo(() => {
    const { w, h } = viewport;
    if (!rect) {
      return `M0,0 H${w} V${h} H0 Z`;
    }
    const { x, y, width, height, rx } = rect;
    const r = Math.max(0, Math.min(rx, width / 2, height / 2));

    // Outer full-viewport rect (Clockwise)
    const outer = `M 0,0 L ${w},0 L ${w},${h} L 0,${h} Z`;

    // Inner target cutout rounded rect (Counter-Clockwise creates a true transparent hole in even-odd)
    const inner =
      `M ${x + r},${y} ` +
      `L ${x + width - r},${y} ` +
      `A ${r},${r} 0 0 1 ${x + width},${y + r} ` +
      `L ${x + width},${y + height - r} ` +
      `A ${r},${r} 0 0 1 ${x + width - r},${y + height} ` +
      `L ${x + r},${y + height} ` +
      `A ${r},${r} 0 0 1 ${x},${y + height - r} ` +
      `L ${x},${y + r} ` +
      `A ${r},${r} 0 0 1 ${x + r},${y} Z`;

    return `${outer} ${inner}`;
  }, [viewport, rect]);

  // All hooks have run; safe to return null if tour is not running
  if (status !== 'running') return null;

  return (
    <div className="fixed inset-0 z-[120] pointer-events-none overflow-hidden">
      {/* SVG Even-Odd Cutout: clicks inside the hole pass right through to the target element! */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <path
          d={pathD}
          fillRule="evenodd"
          fill="rgba(0, 0, 0, 0.72)"
          className="pointer-events-auto cursor-default backdrop-blur-[1.5px] transition-all duration-200"
          onClick={handleBackdropClick}
        />
      </svg>

      {/* Target Focus Ring & Glowing Aura (pointer-events-none so it never blocks clicks) */}
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
