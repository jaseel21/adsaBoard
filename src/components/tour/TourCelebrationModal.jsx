import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Sparkles, CheckCircle2, ArrowRight, X, Compass } from 'lucide-react';
import { useTourEngine } from './TourEngineContext';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { TOUR_TRACKS } from './tourTracks';

export default function TourCelebrationModal() {
  const { isCelebrationOpen, celebratedTrack, closeCelebration, startTour, openMissionHub } = useTourEngine();
  const { lang, t } = useLanguage();
  const { feedback } = useFeedback();

  useEffect(() => {
    if (isCelebrationOpen) {
      feedback('success');
    }
  }, [isCelebrationOpen, feedback]);

  if (!isCelebrationOpen || !celebratedTrack) return null;

  // Find next mission
  const currentIdx = TOUR_TRACKS.findIndex((t) => t.id === celebratedTrack.id);
  const nextTrack = currentIdx >= 0 && currentIdx < TOUR_TRACKS.length - 1 ? TOUR_TRACKS[currentIdx + 1] : null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0c1613] border border-emerald-500/30 shadow-2xl p-6 sm:p-8 text-center overflow-hidden text-gray-900 dark:text-white"
        >
          {/* Confetti Particle Sparkles Background */}
          <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-emerald-500/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-12 -right-12 w-32 h-32 rounded-full bg-amber-500/20 blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={closeCelebration}
            className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Trophy & Badge Icon */}
          <div className="relative mx-auto w-20 h-20 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-xl flex items-center justify-center mb-5">
            <div className="w-full h-full rounded-[22px] bg-white dark:bg-[#09120f] flex items-center justify-center">
              <Trophy className="w-10 h-10 text-emerald-500 animate-bounce" />
            </div>
            <span className="absolute -top-2 -right-2 p-1.5 rounded-full bg-amber-400 text-amber-950 shadow-md">
              <Sparkles className="w-4 h-4 animate-spin-slow" />
            </span>
          </div>

          {/* Congratulations Copy */}
          <div className="space-y-2 mb-6">
            <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Mission Accomplished • 100 XP
            </span>
            <h3 className="text-xl sm:text-2xl font-black tracking-tight">
              {lang === 'ml' ? celebratedTrack.titleMl : celebratedTrack.titleEn}
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              {lang === 'ml'
                ? 'നിങ്ങൾ ഈ ദൗത്യം വിജയകരമായി പൂർത്തിയാക്കി! അടുത്ത ദൗത്യത്തിലേക്ക് കടക്കാം.'
                : 'You have mastered this workflow! Continue your onboarding journey to unlock all dining badges.'}
            </p>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col gap-2.5">
            {nextTrack ? (
              <button
                onClick={() => {
                  closeCelebration();
                  startTour(nextTrack.id, 'interactive');
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
              >
                <span>Start {nextTrack.badge}: {lang === 'ml' ? nextTrack.titleMl : nextTrack.titleEn}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  closeCelebration();
                  openMissionHub();
                }}
                className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>View All Missions Hub</span>
              </button>
            )}

            <button
              onClick={closeCelebration}
              className="w-full py-2.5 px-4 rounded-2xl text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Back to Board
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

