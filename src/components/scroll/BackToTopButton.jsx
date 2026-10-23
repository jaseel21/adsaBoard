import React from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp } from 'lucide-react';
import { useSmoothScroll } from './SmoothScrollProvider';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';

/**
 * Tactile Back to Top Button
 * Floats in when scrolled past 400px and executes smooth Lenis return
 * with mechanical switch audio and haptic touch feedback.
 */
export default function BackToTopButton() {
  const { scrollY, scrollTo } = useSmoothScroll();
  const location = useLocation();

  // Don't render on Kitchen Display
  if (location.pathname.startsWith('/kitchen')) {
    return null;
  }

  const isVisible = scrollY > 400;

  const handleScrollToTop = () => {
    soundEngine.playMechanicalClick();
    hapticEngine.lightTap();
    scrollTo(0, { duration: 1.15 });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 16 }}
          transition={{ type: 'spring', stiffness: 400, damping: 28 }}
          className="fixed bottom-20 sm:bottom-22 right-4 sm:right-6 z-40"
        >
          <button
            type="button"
            onClick={handleScrollToTop}
            title="Scroll back to top"
            aria-label="Scroll back to top"
            className="group relative p-2.5 sm:p-3 rounded-full bg-white/90 dark:bg-[#0c1412]/90 border border-gray-200/90 dark:border-white/10 shadow-xl shadow-black/10 dark:shadow-emerald-950/40 backdrop-blur-2xl text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/50 hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center"
          >
            {/* Ambient subtle glow ring on hover */}
            <span className="absolute -inset-0.5 rounded-full bg-emerald-500/20 opacity-0 group-hover:opacity-100 blur-sm transition-opacity pointer-events-none" />

            <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5 transition-transform group-hover:-translate-y-0.5 duration-200" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
