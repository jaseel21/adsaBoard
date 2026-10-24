import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, RotateCcw, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function SettingsUnsavedDock({
  isDirty,
  dirtyCount,
  onSave,
  onDiscard,
}) {
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();

  // Listen for Cmd+S or Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (isDirty) {
          onSave();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDirty, onSave]);

  return (
    <AnimatePresence>
      {isDirty && (
        <motion.div
          initial={{ y: 80, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 80, opacity: 0, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="fixed bottom-6 left-4 right-4 md:left-auto md:right-8 z-50 flex justify-center md:justify-end pointer-events-auto"
        >
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-900/95 dark:bg-[#0c1412]/95 backdrop-blur-2xl border border-gray-700/60 dark:border-emerald-500/30 text-white shadow-2xl shadow-emerald-950/40">
            <div className="flex items-center gap-2 pr-2 border-r border-white/10">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span className="text-xs font-bold whitespace-nowrap">
                {dirtyCount}{' '}
                {language === 'ml'
                  ? 'മാറ്റങ്ങൾ സൂക്ഷിച്ചിട്ടില്ല'
                  : dirtyCount === 1
                  ? 'unsaved change'
                  : 'unsaved changes'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onDiscard}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{language === 'ml' ? 'റദ്ദാക്കുക' : 'Discard'}</span>
              </button>

              <button
                type="button"
                onClick={onSave}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-md shadow-emerald-900/40 transition-all flex items-center gap-1.5 active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{language === 'ml' ? 'സേവ് ചെയ്യുക' : 'Save Changes'}</span>
                <kbd className="hidden sm:inline-block ml-1 px-1 py-0.2 rounded text-[10px] font-semibold bg-black/20 text-white/80">
                  ⌘S
                </kbd>
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
