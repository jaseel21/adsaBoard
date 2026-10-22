import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useTheme } from '../store/ThemeContext';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { motion, AnimatePresence } from 'framer-motion';

const ThemeSwitch = ({ iconOnly = false }) => {
  const { theme, setTheme } = useTheme();
  const { t } = useLanguage();
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
    setTheme(mode);
    setOpen(false);
  };

  const toggleTheme = () => {
    feedback('pop');
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const currentIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4 text-emerald-400" />;
    if (theme === 'light') return <Sun className="w-4 h-4 text-amber-500" />;
    return <Monitor className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />;
  };

  const getLabel = () => {
    if (theme === 'dark') return t('themeDark');
    if (theme === 'light') return t('themeLight');
    return t('themeSystem');
  };

  if (iconOnly) {
    return (
      <div className="relative flex items-center justify-center">
        <button
          type="button"
          onClick={toggleTheme}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label="Toggle Theme"
          className="p-2.5 rounded-full text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 transition-all select-none flex items-center justify-center"
        >
          {currentIcon()}
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
              <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
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
        aria-label="Toggle Theme"
        className="flex items-center gap-1 xs:gap-1.5 px-2 xs:px-2.5 py-1.5 rounded-xl bg-gray-100/80 dark:bg-white/10 hover:bg-gray-200/80 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 border border-gray-200/70 dark:border-white/10 text-xs font-medium transition-all duration-200 shadow-sm flex-shrink-0"
      >
        {currentIcon()}
        <span className="hidden lg:inline">{getLabel()}</span>
        <ChevronDown className={`w-3 h-3 transition-transform duration-200 opacity-60 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-44 rounded-2xl bg-white dark:bg-[#131b18] border border-gray-200/80 dark:border-white/10 shadow-xl py-1.5 z-50 backdrop-blur-xl"
          >
            <button
              onClick={() => handleSelect('system')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                theme === 'system'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <Monitor className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>{t('themeSystem')}</span>
              {theme === 'system' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>

            <button
              onClick={() => handleSelect('dark')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                theme === 'dark'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <Moon className="w-4 h-4 text-emerald-400" />
              <span>{t('themeDark')}</span>
              {theme === 'dark' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>

            <button
              onClick={() => handleSelect('light')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                theme === 'light'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'
              }`}
            >
              <Sun className="w-4 h-4 text-amber-500" />
              <span>{t('themeLight')}</span>
              {theme === 'light' && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500" />}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ThemeSwitch;
