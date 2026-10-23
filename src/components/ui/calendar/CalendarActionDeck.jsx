import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Plane,
  Bookmark,
  RotateCcw,
  Sparkles,
  ChevronDown,
  MoreHorizontal,
  CheckCircle2,
} from 'lucide-react';
import { useFeedback } from '../../../utils/useFeedback';
import { useLanguage } from '../../../store/LanguageContext';

export default function CalendarActionDeck({
  editable = true,
  isFullyPastMonth = false,
  onOpenRangeLeave,
  onTurnWeekendOff,
  onOpenTemplates,
  onClearExceptions,
  exceptionsCount = 0,
  hasTemplates = false,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close menu on click outside
  useEffect(() => {
    if (!isMenuOpen) return;
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMenuOpen]);

  if (!editable || isFullyPastMonth) {
    return null;
  }

  const handleAction = (callback) => {
    feedback('tick');
    setIsMenuOpen(false);
    callback();
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* Primary Action CTA: Range Leave */}
      <button
        type="button"
        onClick={() => {
          feedback('tick');
          onOpenRangeLeave();
        }}
        className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-xs shadow-emerald-600/30 active:scale-95 transition-all flex items-center gap-1.5 select-none"
        title="Schedule leave or meal overrides across a custom date range"
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>{t('customRangeLeave', 'Range Leave')}</span>
      </button>

      {/* Desktop / Tablet Inline Actions (Hidden on mobile < 640px) */}
      <div className="hidden sm:flex items-center gap-1.5">
        {/* Weekend Leave */}
        <button
          type="button"
          onClick={() => {
            feedback('tick');
            onTurnWeekendOff();
          }}
          className="px-2.5 py-1.5 rounded-xl bg-gray-100/90 dark:bg-white/5 hover:bg-gray-200/80 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200/70 dark:border-white/10 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 select-none"
          title="Turn Weekend OFF (Fri Breakfast & Lunch + Sat Breakfast)"
        >
          <Plane className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
          <span>Weekend Off</span>
        </button>

        {/* Templates Button */}
        <button
          type="button"
          onClick={() => {
            feedback('tick');
            onOpenTemplates();
          }}
          className="relative px-2.5 py-1.5 rounded-xl bg-gray-100/90 dark:bg-white/5 hover:bg-gray-200/80 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200/70 dark:border-white/10 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 select-none"
          title="Manage recurring meal templates"
        >
          <Bookmark className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
          <span>{t('templatesBtn', 'Templates')}</span>
          {hasTemplates && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
          )}
        </button>

        {/* Reset Overrides Pill (visible only when overrides exist) */}
        {exceptionsCount > 0 && (
          <button
            type="button"
            onClick={() => {
              feedback('warning');
              onClearExceptions();
            }}
            className="px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-500/20 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 select-none"
            title="Reset all date overrides back to standard routine"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span>Reset ({exceptionsCount})</span>
          </button>
        )}
      </div>

      {/* Mobile & Drawer Overflow Menu (< 640px) */}
      <div className="relative sm:hidden" ref={menuRef}>
        <button
          type="button"
          onClick={() => {
            feedback('tick');
            setIsMenuOpen((prev) => !prev);
          }}
          className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1 border select-none ${
            isMenuOpen
              ? 'bg-white dark:bg-white/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
              : 'bg-gray-100/90 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-gray-200/70 dark:border-white/10'
          }`}
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
        >
          <MoreHorizontal className="w-3.5 h-3.5" />
          <span>Actions</span>
          {exceptionsCount > 0 && (
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
          )}
        </button>

        {/* Overflow Dropdown */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 mt-1.5 z-50 w-52 p-1.5 rounded-2xl bg-white/95 dark:bg-[#121c19]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-white/15 shadow-2xl text-xs space-y-1 select-none"
              role="menu"
            >
              {/* Weekend Off */}
              <button
                type="button"
                onClick={() => handleAction(onTurnWeekendOff)}
                className="w-full px-2.5 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-left font-bold text-gray-800 dark:text-gray-200 flex items-center gap-2 transition-colors"
                role="menuitem"
              >
                <Plane className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <div>
                  <div>Weekend Off</div>
                  <div className="text-[10px] text-gray-400 font-normal">Fri Bf/Lu + Sat Bf</div>
                </div>
              </button>

              {/* Templates */}
              <button
                type="button"
                onClick={() => handleAction(onOpenTemplates)}
                className="w-full px-2.5 py-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-left font-bold text-gray-800 dark:text-gray-200 flex items-center justify-between transition-colors"
                role="menuitem"
              >
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <div>
                    <div>Templates</div>
                    <div className="text-[10px] text-gray-400 font-normal">Load & save presets</div>
                  </div>
                </div>
                {hasTemplates && (
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                )}
              </button>

              {/* Reset Overrides */}
              {exceptionsCount > 0 && (
                <button
                  type="button"
                  onClick={() => handleAction(onClearExceptions)}
                  className="w-full px-2.5 py-2 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left font-bold text-rose-600 dark:text-rose-300 flex items-center gap-2 transition-colors border-t border-gray-100 dark:border-white/5"
                  role="menuitem"
                >
                  <RotateCcw className="w-4 h-4 text-rose-500" />
                  <div>
                    <div>Reset Overrides</div>
                    <div className="text-[10px] text-rose-400 font-normal">Clear {exceptionsCount} override(s)</div>
                  </div>
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
