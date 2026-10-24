import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Monitor, ChevronDown, Check, Sparkles } from 'lucide-react';
import { useTheme } from '../store/ThemeContext';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { motion, AnimatePresence } from 'framer-motion';

const THEME_OPTIONS = [
  { id: 'system', icon: Monitor, labelKey: 'themeSystem', fallback: 'System' },
  { id: 'light', icon: Sun, labelKey: 'themeLight', fallback: 'Light' },
  { id: 'dark', icon: Moon, labelKey: 'themeDark', fallback: 'Dark' },
];

export default function ThemeSwitch({ iconOnly = false, className = '' }) {
  const { theme, setTheme, isDark } = useTheme();
  const { t, language } = useLanguage();
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
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleSelect = (mode) => {
    feedback('pop');
    setTheme(mode);
  };

  const currentIcon = () => {
    if (theme === 'dark') return <Moon className="w-4 h-4 flex-shrink-0 text-emerald-400" />;
    if (theme === 'light') return <Sun className="w-4 h-4 flex-shrink-0 text-amber-500" />;
    return <Monitor className="w-4 h-4 flex-shrink-0" />;
  };

  const getLabel = () => {
    if (theme === 'dark') return t('themeDark', 'Dark');
    if (theme === 'light') return t('themeLight', 'Light');
    return t('themeSystem', 'System');
  };

  const getThemeDescription = (mode) => {
    if (language === 'ml') {
      if (mode === 'system') return 'സിസ്റ്റം ക്രമീകരണങ്ങൾ പിന്തുടരുന്നു';
      if (mode === 'light') return 'പകൽ വെളിച്ചത്തിന് അനുയോജ്യമായ ലൈറ്റ് മോഡ്';
      return 'രാത്രിയിലെ സുഖകരമായ ഡാർക്ക് മോഡ്';
    }
    if (mode === 'system') return 'Follows your device system appearance';
    if (mode === 'light') return 'High-contrast light daytime mode';
    return 'Midnight emerald low-light dark mode';
  };

  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${className}`} ref={dropdownRef}>
      {iconOnly ? (
        <button
          type="button"
          onClick={() => {
            feedback('tick');
            setOpen((prev) => !prev);
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label={`Theme: ${getLabel()}`}
          aria-expanded={open}
          className={`relative rounded-full w-7 h-7 p-1.5 transition-all duration-150 select-none flex items-center justify-center cursor-pointer text-xs font-semibold flex-shrink-0 ${
            open
              ? 'text-emerald-700 dark:text-emerald-300 font-extrabold'
              : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95'
          }`}
        >
          {open && (
            <motion.div
              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
              className="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/35 rounded-full -z-10 shadow-xs"
            />
          )}
          {currentIcon()}

          {/* Micro indicator if set to system */}
          {theme === 'system' && (
            <span
              className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500"
              title="System Default Active"
            />
          )}

          {/* Hover Tooltip (when popover is closed) */}
          <AnimatePresence>
            {hovered && !open && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.12 }}
                className="absolute top-full mt-2 px-2.5 py-1 rounded-xl bg-gray-900/95 dark:bg-[#15221e]/95 text-white border border-white/10 shadow-xl backdrop-blur-xl text-[11px] font-bold whitespace-nowrap pointer-events-none z-50 flex items-center gap-1.5"
              >
                <span>{`Theme: ${getLabel()}`}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            feedback('tick');
            setOpen((prev) => !prev);
          }}
          aria-label="Toggle Theme Menu"
          aria-expanded={open}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-gray-100/80 dark:bg-white/10 hover:bg-gray-200/80 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 border border-gray-200/70 dark:border-white/10 text-xs font-semibold transition-all duration-200 shadow-xs flex-shrink-0"
        >
          {currentIcon()}
          <span>{getLabel()}</span>
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-200 opacity-60 flex-shrink-0 ${
              open ? 'rotate-180' : ''
            }`}
          />
        </button>
      )}

      {/* Popover Card with Animated Sliding Segmented Switch */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.94 }}
            transition={{ type: 'spring', damping: 24, stiffness: 350 }}
            className="absolute top-full mt-2.5 right-0 sm:right-auto sm:left-1/2 sm:-translate-x-1/2 w-64 rounded-2xl bg-white/95 dark:bg-[#0c1412]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-white/15 shadow-2xl p-3 z-50 select-none"
          >
            {/* Popover Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-gray-100 dark:border-white/10">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {language === 'ml' ? 'പ്രതീതി / തീം' : 'Appearance'}
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                {getLabel()}
              </span>
            </div>

            {/* Tactile Sliding Segmented Switch (Option A inside Popover) */}
            <div className="relative grid grid-cols-3 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 gap-1">
              {THEME_OPTIONS.map((opt) => {
                const Icon = opt.icon;
                const isSelected = theme === opt.id;
                const label = t(opt.labelKey, opt.fallback);

                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelect(opt.id)}
                    className={`relative py-1.5 px-2 rounded-lg text-xs font-bold transition-colors flex flex-col items-center justify-center gap-1 z-10 ${
                      isSelected
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    {isSelected && (
                      <motion.div
                        layoutId="activeThemeSegment"
                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                        className="absolute inset-0 bg-white dark:bg-[#1a2622] rounded-lg shadow-sm border border-gray-200/80 dark:border-white/15 -z-10"
                      />
                    )}
                    <Icon className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-500' : ''}`} />
                    <span className="text-[10px] tracking-tight">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Contextual Subtitle */}
            <div className="mt-2.5 px-1 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
              <span className="leading-snug">{getThemeDescription(theme)}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
