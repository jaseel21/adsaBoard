import React, { useState, useRef, useEffect } from 'react';
import { Languages, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { motion, AnimatePresence } from 'framer-motion';

const LanguageSwitch = ({ iconOnly = false }) => {
  const { langPref, setLangPref, lang, t } = useLanguage();
  const { feedback } = useFeedback();
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (mode) => {
    feedback('pop');
    setLangPref(mode);
    setOpen(false);
  };

  const toggleLanguage = () => {
    feedback('pop');
    const nextLang = lang === 'ml' ? 'en' : 'ml';
    setLangPref(nextLang);
  };

  const getLabel = () => {
    if (langPref === 'ml') return 'മലയാളം';
    if (langPref === 'en') return 'EN';
    return `Auto (${lang.toUpperCase()})`;
  };

  if (iconOnly) {
    return (
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={toggleLanguage}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label={lang === 'ml' ? 'Switch to English' : 'മലയാളത്തിലേക്ക് മാറ്റുക'}
          className="relative p-2.5 rounded-full text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 transition-all select-none flex items-center justify-center group"
        >
          <Languages className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="absolute -bottom-0.5 -right-0.5 text-[8px] font-black uppercase tracking-tight px-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            {lang === 'ml' ? 'മല' : 'EN'}
          </span>
        </button>

        <AnimatePresence>
          {hovered && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.95 }}
              transition={{ duration: 0.12 }}
              className="absolute top-full mt-2 px-2.5 py-1 rounded-xl bg-gray-900/95 dark:bg-[#15221e]/95 text-white border border-white/10 shadow-xl backdrop-blur-xl text-[11px] font-bold whitespace-nowrap pointer-events-none z-50 flex items-center gap-1.5"
            >
              <span>{lang === 'ml' ? 'Switch to English' : 'മലയാളത്തിലേക്ക് മാറ്റുക'}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          feedback('tick');
          setOpen(!open);
        }}
        aria-label="Switch Language"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100/80 dark:bg-white/10 hover:bg-gray-200/80 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 border border-gray-200/70 dark:border-white/10 text-xs font-medium transition-all duration-200 shadow-sm"
      >
        <Languages className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
        {/* Full label on desktop, compact code on mobile */}
        <span className="font-semibold text-xs tracking-wide hidden sm:inline">{getLabel()}</span>
        <span className="font-bold text-[11px] tracking-wider sm:hidden font-mono uppercase">{lang}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 opacity-60 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#131b18] border border-gray-200/80 dark:border-white/10 shadow-xl py-1.5 z-50 backdrop-blur-xl"
          >
            {/* System Default */}
            <button
              onClick={() => handleSelect('system')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                langPref === 'system'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex flex-col text-left">
                <span>{t('langSystem')}</span>
                <span className="text-[10px] text-gray-400">Auto detect</span>
              </div>
              {langPref === 'system' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
            </button>

            {/* English */}
            <button
              onClick={() => handleSelect('en')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                langPref === 'en'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex flex-col text-left">
                <span>English</span>
                <span className="text-[10px] text-gray-400 font-mono">EN</span>
              </div>
              {langPref === 'en' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
            </button>

            {/* Malayalam */}
            <button
              onClick={() => handleSelect('ml')}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-medium transition-colors ${
                langPref === 'ml'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <div className="flex flex-col text-left">
                <span className="font-malayalam">മലയാളം</span>
                <span className="text-[10px] text-gray-400">Malayalam</span>
              </div>
              {langPref === 'ml' && <Check className="w-3.5 h-3.5 text-emerald-500" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LanguageSwitch;
