import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Command,
  LayoutGrid,
  BarChart3,
  Table2,
  CreditCard,
  Grid3X3,
  Volume2,
  VolumeX,
  ArrowUp,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';

export default function ApexFloatingDock({
  onOpenCommandPalette,
  activeSurface = 'matrix',
  onChangeSurface,
  viewDensity = 'matrix',
  onChangeDensity,
}) {
  const { t } = useLanguage();
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    if (soundEnabled) {
      soundEngine.playCautionThud();
      hapticEngine.mediumTick();
      setSoundEnabled(false);
    } else {
      setSoundEnabled(true);
      soundEngine.playSoftChime();
      hapticEngine.successPulse();
    }
  };

  const scrollToTop = () => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cycleSurface = () => {
    const sequence = {
      matrix: 'studio',
      studio: 'radar',
      radar: 'matrix',
    };
    const nextSurface = sequence[activeSurface] || 'matrix';
    soundEngine.playPop();
    hapticEngine.lightTap();
    if (onChangeSurface) onChangeSurface(nextSurface);
  };

  return (
    <div className="fixed bottom-4 sm:bottom-6 inset-x-0 z-40 flex items-center justify-center pointer-events-none px-4">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="pointer-events-auto flex items-center gap-1.5 sm:gap-2 p-1.5 sm:p-2 rounded-2xl sm:rounded-full bg-white/90 dark:bg-[#0c1412]/90 border border-gray-200/80 dark:border-white/15 shadow-2xl backdrop-blur-2xl ring-1 ring-black/5"
      >
        {/* Command Palette Trigger */}
        <button
          type="button"
          onClick={() => {
            soundEngine.playPop();
            hapticEngine.lightTap();
            if (onOpenCommandPalette) onOpenCommandPalette();
          }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl sm:rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all transform active:scale-95"
          title={t('openApexSpotlight', 'Open Apex Spotlight (⌘K)')}
        >
          <Search className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t('searchKbd', 'Search')}</span>
          <kbd className="px-1.5 py-0.2 rounded bg-black/20 text-[10px] font-mono">⌘K</kbd>
        </button>

        <div className="h-5 w-[1px] bg-gray-200 dark:bg-white/10 mx-0.5" />

        {/* Tri-Surface Quick Switcher */}
        <button
          type="button"
          onClick={cycleSurface}
          className={`p-2 rounded-xl sm:rounded-full transition-all ${
            activeSurface === 'radar'
              ? 'bg-teal-500 text-white shadow-md'
              : activeSurface === 'studio'
              ? 'bg-cyan-500 text-white shadow-md'
              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
          }`}
          title={
            activeSurface === 'matrix'
              ? 'Switch to Data Studio (Spreadsheet CRUD)'
              : activeSurface === 'studio'
              ? 'Switch to Operations Radar'
              : 'Switch to Tactical Matrix'
          }
        >
          {activeSurface === 'studio' ? (
            <Table2 className="w-4 h-4" />
          ) : activeSurface === 'radar' ? (
            <BarChart3 className="w-4 h-4" />
          ) : (
            <LayoutGrid className="w-4 h-4" />
          )}
        </button>

        {/* 2-Tier Density Switcher (Only visible in matrix surface) */}
        {activeSurface === 'matrix' && (
          <div className="flex items-center p-0.5 rounded-xl sm:rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                if (onChangeDensity) onChangeDensity('matrix');
              }}
              className={`p-1.5 rounded-lg sm:rounded-full transition-all ${
                viewDensity === 'matrix'
                  ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title={t('tactileKeycaps', '3D Tactile Keycaps')}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                if (onChangeDensity) onChangeDensity('cards');
              }}
              className={`p-1.5 rounded-lg sm:rounded-full transition-all ${
                viewDensity === 'cards'
                  ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title={t('dossierCards', 'Detailed Cards')}
            >
              <CreditCard className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Audio-Haptics Sound Indicator */}
        <button
          type="button"
          onClick={toggleSound}
          className={`p-2 rounded-xl sm:rounded-full transition-all ${
            soundEnabled
              ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10'
          }`}
          title={soundEnabled ? t('audioActive', 'Synthesized Audio Active') : t('audioMuted', 'Sound Muted')}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        {/* Scroll To Top */}
        <button
          type="button"
          onClick={scrollToTop}
          className="p-2 rounded-xl sm:rounded-full text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-all"
          title={t('backToTop', 'Back to Top')}
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
