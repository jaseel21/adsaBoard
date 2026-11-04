import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, X, ArrowRight, Zap } from 'lucide-react';
import { useTourEngine } from './TourEngineContext';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function TourAutoPromptBanner() {
  const { showAutoPromptBanner, dismissAutoPrompt, startTour, campaignConfig } = useTourEngine();
  const { lang } = useLanguage();
  const { feedback } = useFeedback();

  // Auto-close duration in seconds (0 = disabled / manual dismissal only)
  const autoCloseSeconds =
    campaignConfig?.triggerRule?.autoCloseSeconds !== undefined
      ? Number(campaignConfig.triggerRule.autoCloseSeconds)
      : 12;

  const [timeLeftMs, setTimeLeftMs] = useState(autoCloseSeconds * 1000);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(false);
  isPausedRef.current = isPaused;

  // Reset timer whenever banner becomes visible or duration changes
  useEffect(() => {
    if (!showAutoPromptBanner || autoCloseSeconds <= 0) {
      return;
    }

    const totalMs = autoCloseSeconds * 1000;
    setTimeLeftMs(totalMs);
    setIsPaused(false);

    const stepMs = 50;
    const interval = setInterval(() => {
      if (isPausedRef.current) return;

      setTimeLeftMs((prev) => {
        const next = prev - stepMs;
        if (next <= 0) {
          clearInterval(interval);
          dismissAutoPrompt();
          return 0;
        }
        return next;
      });
    }, stepMs);

    return () => clearInterval(interval);
  }, [showAutoPromptBanner, autoCloseSeconds, dismissAutoPrompt]);

  if (!showAutoPromptBanner) return null;

  const title =
    lang === 'ml'
      ? campaignConfig?.bannerContent?.titleMl || 'ഇന്ററാക്ടീവ് ലൈവ് ടൂർ പരീക്ഷിക്കൂ'
      : campaignConfig?.bannerContent?.titleEn || 'Master ADSA T-Board with Live Guided Quests';

  const subtitle =
    lang === 'ml'
      ? campaignConfig?.bannerContent?.subtitleMl ||
        'ടോക്കൺ മാറ്റങ്ങൾ, സൺഡേ പ്രീസെറ്റുകൾ, ഡയറ്ററി മാറ്റങ്ങൾ എന്നിവ തത്സമയം പരീക്ഷിച്ച് മനസിലാക്കൂ.'
      : campaignConfig?.bannerContent?.subtitleEn ||
        'Interactive step-by-step walkthrough for tokens, Sunday presets, dietary preferences, and canteen tools.';

  const handleStart = () => {
    feedback('pop');
    startTour(
      campaignConfig?.defaultTrack || 'dashboard-basics',
      campaignConfig?.defaultMode || 'interactive'
    );
  };

  const totalDurationMs = autoCloseSeconds > 0 ? autoCloseSeconds * 1000 : 1;
  const progressPercent =
    autoCloseSeconds > 0 ? Math.max(0, Math.min(100, (timeLeftMs / totalDurationMs) * 100)) : 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.96 }}
        transition={{ type: 'spring', stiffness: 360, damping: 28 }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
        className="fixed bottom-[calc(4.85rem+env(safe-area-inset-bottom,0px))] left-3 right-3 sm:bottom-6 sm:right-6 sm:left-auto z-[90] max-w-sm sm:max-w-md w-auto sm:w-full mx-auto sm:mx-0 pointer-events-auto select-none"
      >
        <div className="relative rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-900/95 via-teal-950/95 to-[#08120e]/95 border border-emerald-400/35 p-3 sm:p-5 shadow-2xl backdrop-blur-xl text-white overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

          {/* ==================== MOBILE COMPACT ROW (< sm) ==================== */}
          <div className="flex sm:hidden items-center justify-between gap-2.5">
            {/* Left Icon */}
            <span className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 flex-shrink-0 shadow-inner">
              <Compass className="w-4 h-4 animate-spin-slow" />
            </span>

            {/* Middle Title & Badge */}
            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-400">
                  {lang === 'ml' ? 'ലൈവ് ടൂർ' : 'Interactive Tour'}
                </span>
                <span className="px-1 py-0.2 rounded text-[8px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  v2.0
                </span>
              </div>
              <h4 className="text-xs font-black truncate text-white leading-tight">
                {title}
              </h4>
            </div>

            {/* Right Quick Actions */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={handleStart}
                className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs shadow-md flex items-center gap-1 transition-all active:scale-95"
              >
                <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                <span>{lang === 'ml' ? 'ടൂർ' : 'Tour'}</span>
              </button>
              <button
                onClick={dismissAutoPrompt}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ==================== DESKTOP EXPANDED CARD (>= sm) ==================== */}
          <div className="hidden sm:block">
            {/* Dismiss button */}
            <button
              onClick={dismissAutoPrompt}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-xl text-gray-400 hover:text-white transition-colors"
              title="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-start gap-3.5 pr-6">
              <span className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 flex-shrink-0 shadow-inner">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400">
                    New Interactive Guide
                  </span>
                  <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                    v2.0
                  </span>
                </div>
                <h4 className="text-sm font-black leading-snug">{title}</h4>
                <p className="text-xs text-gray-300 leading-relaxed font-medium">{subtitle}</p>
              </div>
            </div>

            {/* Action CTAs */}
            <div className="flex items-center gap-2.5 mt-4 pt-3 border-t border-white/10">
              <button
                onClick={handleStart}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
              >
                <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                <span>Start Interactive Tour</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={dismissAutoPrompt}
                className="py-2.5 px-3 rounded-xl text-xs font-bold text-gray-400 hover:text-white transition-colors"
              >
                Later
              </button>
            </div>
          </div>

          {/* ==================== AUTO-CLOSE PROGRESS BAR ==================== */}
          {autoCloseSeconds > 0 && (
            <div
              className="absolute inset-x-0 bottom-0 h-1 bg-white/10 overflow-hidden"
              title={
                isPaused
                  ? 'Auto-close paused'
                  : `Auto-closing in ${Math.ceil(timeLeftMs / 1000)}s`
              }
            >
              <div
                className={`h-full transition-all duration-75 ${
                  isPaused
                    ? 'bg-amber-400'
                    : 'bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-400'
                }`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
