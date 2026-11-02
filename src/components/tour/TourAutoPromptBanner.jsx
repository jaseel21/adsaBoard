import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Sparkles, X, ArrowRight, Zap } from 'lucide-react';
import { useTourEngine } from './TourEngineContext';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function TourAutoPromptBanner() {
  const { showAutoPromptBanner, dismissAutoPrompt, startTour, campaignConfig } = useTourEngine();
  const { lang } = useLanguage();
  const { feedback } = useFeedback();

  if (!showAutoPromptBanner) return null;

  const title = lang === 'ml'
    ? campaignConfig?.bannerContent?.titleMl || 'ഇന്ററാക്ടീവ് ലൈവ് ടൂർ പരീക്ഷിക്കൂ'
    : campaignConfig?.bannerContent?.titleEn || 'Master ADSA T-Board with Live Guided Quests';

  const subtitle = lang === 'ml'
    ? campaignConfig?.bannerContent?.subtitleMl || 'ടോക്കൺ മാറ്റങ്ങൾ, സൺഡേ പ്രീസെറ്റുകൾ, ഡയറ്ററി മാറ്റങ്ങൾ എന്നിവ തത്സമയം പരീക്ഷിച്ച് മനസിലാക്കൂ.'
    : campaignConfig?.bannerContent?.subtitleEn || 'Interactive step-by-step walkthrough for tokens, Sunday presets, dietary preferences, and canteen tools.';

  const handleStart = () => {
    feedback('pop');
    startTour(campaignConfig?.defaultTrack || 'dashboard-basics', campaignConfig?.defaultMode || 'interactive');
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 50, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 350, damping: 28 }}
        className="fixed bottom-6 right-4 sm:right-6 z-[90] max-w-md w-full px-2 pointer-events-auto"
      >
        <div className="relative rounded-3xl bg-gradient-to-br from-emerald-900/95 via-teal-950/95 to-[#08120e]/95 border border-emerald-400/30 p-5 shadow-2xl backdrop-blur-xl text-white overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-2xl pointer-events-none" />

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
      </motion.div>
    </AnimatePresence>
  );
}

