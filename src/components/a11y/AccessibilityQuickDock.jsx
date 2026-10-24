import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Accessibility,
  X,
  Contrast,
  Type,
  AlignLeft,
  Volume2,
  Play,
  Sliders,
  Settings,
  Sparkles,
  Gauge,
  Eye,
  Check,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { usePreferences } from '../../store/PreferencesContext';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useTextToSpeech } from '../../hooks/useTextToSpeech';

/**
 * Floating Quick Accessibility Menu & Hotkey Hub (Alt + A)
 * Allows students, cooks, and staff to instantly adjust contrast, dyslexic font, text size,
 * reading guide, and motion without navigating away from their task.
 */
export default function AccessibilityQuickDock() {
  const [isOpen, setIsOpen] = useState(false);
  const { language } = useLanguage();
  const { feedback } = useFeedback();
  const { preferences, setPreference } = usePreferences();
  const { speak, isSpeaking } = useTextToSpeech();

  const containerRef = useFocusTrap({
    active: isOpen,
    onClose: () => {
      setIsOpen(false);
      feedback('tick');
    },
    restoreFocus: true,
  });

  // Global Alt+A / Option+A shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.altKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        setIsOpen((prev) => {
          feedback(prev ? 'tick' : 'pop');
          return !prev;
        });
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback]);

  const toggleHighContrast = () => {
    feedback('tick');
    const modes = ['standard', 'high', 'maximum_oled'];
    const current = preferences.highContrastMode || 'standard';
    const next = modes[(modes.indexOf(current) + 1) % modes.length];
    setPreference('highContrastMode', next);
  };

  const handleTestVoice = () => {
    feedback('pop');
    if (language === 'ml') {
      speak('അലാത്തുർപ്പടി കാന്റീൻ വോയ്സ് റീഡർ പ്രവർത്തിക്കുന്നു.');
    } else {
      speak('ADSA T-Board voice reader is operational.');
    }
  };

  return (
    <>

      {/* Expanded Quick Modal / Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center sm:justify-start sm:items-end p-4 sm:p-6 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              ref={containerRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="a11y-quick-dock-title"
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              data-lenis-prevent
              className="
                w-full max-w-sm rounded-3xl
                bg-white/95 dark:bg-[#0c1412]/95 backdrop-blur-2xl
                border border-emerald-500/30 dark:border-emerald-500/30
                shadow-2xl shadow-emerald-950/20 p-5 space-y-4 text-gray-900 dark:text-white
                max-h-[85dvh] overflow-y-auto pb-safe
              "
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Accessibility className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 id="a11y-quick-dock-title" className="text-xs font-black tracking-tight uppercase">
                      {language === 'ml' ? 'ആക്സസിബിലിറ്റി ടൂൾസ്' : 'Quick A11y Tools'}
                    </h3>
                    <span className="text-[10px] text-gray-400 font-mono block">Shortcut: Alt + A</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  aria-label="Close accessibility tools"
                  className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:ring-2 focus:ring-emerald-400 outline-none"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Quick 1-Click Toggles Grid */}
              <div className="space-y-2.5">
                {/* 1. High Contrast Switcher */}
                <button
                  type="button"
                  onClick={toggleHighContrast}
                  className="w-full p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200/70 dark:border-white/5 flex items-center justify-between text-xs font-bold transition-colors text-left"
                >
                  <span className="flex items-center gap-2">
                    <Contrast className="w-4 h-4 text-emerald-500" />
                    <span>Contrast: {preferences.highContrastMode || 'standard'}</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    Cycle (3)
                  </span>
                </button>

                {/* 2. Dyslexic Font Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    feedback('pop');
                    setPreference('dyslexicFont', !preferences.dyslexicFont);
                  }}
                  className={`w-full p-2.5 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all text-left ${
                    preferences.dyslexicFont
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-emerald-500" />
                    <span>Dyslexic Font (Atkinson)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {preferences.dyslexicFont ? 'Active' : 'Off'}
                  </span>
                </button>

                {/* 3. Text Spacing Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setPreference('textSpacing', preferences.textSpacing === 'enhanced' ? 'standard' : 'enhanced');
                  }}
                  className={`w-full p-2.5 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all text-left ${
                    preferences.textSpacing === 'enhanced'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <AlignLeft className="w-4 h-4 text-emerald-500" />
                    <span>Wide Text Spacing</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {preferences.textSpacing === 'enhanced' ? 'Wide' : 'Normal'}
                  </span>
                </button>

                {/* 4. Reading Guide Ruler Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    feedback('pop');
                    setPreference('readingGuide', !preferences.readingGuide);
                  }}
                  className={`w-full p-2.5 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all text-left ${
                    preferences.readingGuide
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-500" />
                    <span>Reading Guide Ruler</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {preferences.readingGuide ? 'Visible' : 'Off'}
                  </span>
                </button>

                {/* 5. Reduced Motion Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setPreference(
                      'motionFidelity',
                      preferences.motionFidelity === 'reduced' ? 'cinematic' : 'reduced'
                    );
                  }}
                  className={`w-full p-2.5 rounded-2xl border flex items-center justify-between text-xs font-bold transition-all text-left ${
                    preferences.motionFidelity === 'reduced'
                      ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-emerald-500" />
                    <span>Pause Animations</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold">
                    {preferences.motionFidelity === 'reduced' ? 'Paused' : '120 FPS'}
                  </span>
                </button>

                {/* 6. Test Voice TTS */}
                <button
                  type="button"
                  onClick={handleTestVoice}
                  className="w-full p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200/70 dark:border-white/5 flex items-center justify-between text-xs font-bold transition-colors text-left"
                >
                  <span className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-500" />
                    <span>Read Aloud (TTS Voice)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <Play className="w-2.5 h-2.5" />
                    <span>{isSpeaking ? 'Speaking' : 'Test'}</span>
                  </span>
                </button>
              </div>

              {/* Font Size Pills */}
              <div className="pt-2 border-t border-gray-100 dark:border-white/10 space-y-1.5">
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block">
                  Font Scale
                </span>
                <div className="grid grid-cols-4 gap-1 text-[11px] font-bold">
                  {['compact', 'balanced', 'roomy', 'kiosk'].map((scale) => {
                    const isSelected = (preferences.fontSizeScale || 'balanced') === scale;
                    return (
                      <button
                        key={scale}
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          setPreference('fontSizeScale', scale);
                        }}
                        className={`p-1.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-emerald-500 text-white border-emerald-500'
                            : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        {scale.charAt(0).toUpperCase() + scale.slice(1, 4)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Footer link to full accessibility settings */}
              <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                <Link
                  to="/settings#accessibility"
                  onClick={() => setIsOpen(false)}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1.5"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Full Accessibility Suite</span>
                </Link>
                <span className="text-[10px] text-gray-400">WCAG 2.2 AAA</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
