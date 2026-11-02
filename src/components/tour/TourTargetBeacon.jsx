import React from 'react';
import { motion } from 'framer-motion';
import { useTourEngine } from './TourEngineContext';
import { Sparkles, ArrowDown, ArrowUp } from 'lucide-react';

export default function TourTargetBeacon() {
  const { status, targetRect, isTargetFound, tourMode, currentStep } = useTourEngine();

  if (status !== 'running' || !isTargetFound || !targetRect) return null;

  // Decide whether arrow points down (if element is near top) or points up (if element is lower)
  const isTargetInLowerHalf = targetRect.top > window.innerHeight / 2;

  return (
    <div className="fixed inset-0 z-[125] pointer-events-none">
      {/* Target Radar Halo */}
      <motion.div
        animate={{
          scale: [1, 1.25, 1],
          opacity: [0.6, 1, 0.6],
        }}
        transition={{
          duration: 1.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          top: targetRect.top - 6,
          left: targetRect.left - 6,
          width: targetRect.width + 12,
          height: targetRect.height + 12,
          borderRadius: (targetRect.borderRadius || 16) + 6,
        }}
        className="absolute border-2 border-emerald-400/80 shadow-[0_0_20px_rgba(16,185,129,0.5)]"
      />

      {/* Floating Action Badge / Arrow */}
      {tourMode === 'interactive' && (
        <motion.div
          initial={{ opacity: 0, y: isTargetInLowerHalf ? 10 : -10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            top: isTargetInLowerHalf ? targetRect.top - 46 : targetRect.bottom + 12,
            left: Math.max(16, Math.min(window.innerWidth - 180, targetRect.left + targetRect.width / 2 - 80)),
          }}
          className="absolute flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-700 text-white text-[11px] font-extrabold shadow-lg border border-emerald-300/40 tracking-wider pointer-events-none uppercase"
        >
          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-spin-slow" />
          <span>Tap Here</span>
          {isTargetInLowerHalf ? (
            <ArrowDown className="w-3.5 h-3.5 animate-bounce" />
          ) : (
            <ArrowUp className="w-3.5 h-3.5 animate-bounce" />
          )}
        </motion.div>
      )}
    </div>
  );
}

