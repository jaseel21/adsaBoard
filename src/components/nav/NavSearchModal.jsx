import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight, CornerDownLeft, Sparkles } from 'lucide-react';
import { searchNavItems, NAV_CATEGORIES } from './navigationConfig';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function NavSearchModal({
  isOpen,
  onClose,
  onNavigate,
  userRole,
  isStudent,
}) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  const results = searchNavItems(query, userRole, isStudent);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Handle keyboard navigation inside search modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev + 1) % results.length : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (results.length > 0 ? (prev - 1 + results.length) % results.length : 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (results.length > 0 && results[selectedIndex]) {
          const item = results[selectedIndex];
          feedback('tick');
          onNavigate(item);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, results, selectedIndex, onNavigate, onClose, feedback]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-3 sm:px-4">
        {/* Backdrop Scrim */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          data-lenis-prevent
          className="relative w-full max-w-xl rounded-3xl bg-white/95 dark:bg-[#0f1715]/95 border border-gray-200/90 dark:border-white/10 shadow-2xl backdrop-blur-2xl overflow-hidden z-10 flex flex-col max-h-[80vh]"
        >
          {/* Search Header Bar */}
          <div className="flex items-center gap-3 px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-white/10">
            <Search className="w-5 h-5 text-emerald-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder={
                language === 'ml'
                  ? 'പേജുകൾ, മെനു, ടോക്കൺ ബോർഡ് എന്നിവ തിരയുക...'
                  : 'Search pages, tokens, menus, manifests, tools...'
              }
              className="flex-1 bg-transparent text-sm sm:text-base font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedIndex(0);
                  inputRef.current?.focus();
                }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400 border border-gray-200/60 dark:border-white/10">
                ESC
              </span>
            )}
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-2 sm:p-3 space-y-1">
            {query.trim() === '' ? (
              <div className="py-8 px-4 text-center space-y-2">
                <div className="w-10 h-10 mx-auto rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/40 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600">
                  <Sparkles className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {language === 'ml' ? 'പെട്ടെന്ന് കണ്ടെത്താൻ ടൈപ്പ് ചെയ്യുക' : 'Instant Campus Navigation'}
                </p>
                <p className="text-[11px] text-gray-400 max-w-xs mx-auto">
                  {language === 'ml'
                    ? 'ഹോം, മെനു, ടോക്കൺ ബോർഡ്, വിദ്യാർത്ഥി പോർട്ടൽ, അടുക്കള കൺസോൾ...'
                    : 'Search across dining schedules, tokens, kitchen sheets, administrative consoles, and student settings.'}
                </p>
              </div>
            ) : results.length === 0 ? (
              <div className="py-8 px-4 text-center">
                <p className="text-xs font-bold text-gray-600 dark:text-gray-400">
                  {language === 'ml' ? 'ഫലങ്ങളൊന്നും കണ്ടെത്തിയില്ല' : 'No matching pages or tools found'}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">
                  {language === 'ml' ? 'മറ്റൊരു വാക്ക് ഉപയോഗിച്ച് ശ്രമിക്കുക' : 'Try searching for "menu", "token", "student", or "admin"'}
                </p>
              </div>
            ) : (
              results.map((item, idx) => {
                const IconComponent = item.icon || Sparkles;
                const isSelected = idx === selectedIndex;
                const categoryObj = NAV_CATEGORIES[item.category?.toUpperCase()] || {};
                const label = language === 'ml' ? item.labelMl || item.labelEn : item.labelEn;
                const desc = language === 'ml' ? item.descriptionMl || item.descriptionEn : item.descriptionEn;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      feedback('tick');
                      onNavigate(item);
                      onClose();
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
                      isSelected
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 border border-emerald-300/60 dark:border-emerald-500/30 shadow-sm'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                          : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                          {label}
                        </span>
                        {item.path && (
                          <span className="text-[10px] font-mono text-gray-400 truncate">
                            {item.path}
                          </span>
                        )}
                        {categoryObj.labelEn && (
                          <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                            {language === 'ml' ? categoryObj.labelMl : categoryObj.labelEn}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                        {desc}
                      </p>
                    </div>

                    <ArrowRight
                      className={`w-4 h-4 transition-transform flex-shrink-0 ${
                        isSelected ? 'translate-x-0.5 text-emerald-600 dark:text-emerald-400' : 'text-gray-300 dark:text-gray-600'
                      }`}
                    />
                  </button>
                );
              })
            )}
          </div>

          {/* Footer Bar with Keyboard shortcuts */}
          <div className="px-4 py-2.5 bg-gray-50/70 dark:bg-black/30 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px] text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 rounded bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 font-mono text-[9px] font-bold">
                  ↑↓
                </span>
                <span className="hidden sm:inline">Navigate</span>
              </span>
              <span className="flex items-center gap-1">
                <CornerDownLeft className="w-3 h-3" />
                <span className="hidden sm:inline">Select</span>
              </span>
            </div>
            <span>{results.length} available</span>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
