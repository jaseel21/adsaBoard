import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Sparkles,
  Zap,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Layers,
  ArrowRight,
  Eye,
} from 'lucide-react';
import { useTourEngine } from './TourEngineContext';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function TourFloatingHUD() {
  const {
    status,
    activeTrack,
    currentStep,
    currentStepIndex,
    totalSteps,
    tourMode,
    targetRect,
    isTargetFound,
    waitingForAction,
    nextStep,
    prevStep,
    skipTour,
    completeCurrentStep,
    setTourMode,
  } = useTourEngine();

  const { lang, t } = useLanguage();
  const { feedback, soundEnabled, setSoundEnabled } = useFeedback();

  if (status !== 'running' || !currentStep || !activeTrack) return null;

  // Decide positioning on desktop: Place HUD opposite to target element
  const isTargetInUpperHalf = targetRect ? targetRect.top < window.innerHeight / 2 : false;

  const isLastStep = currentStepIndex === totalSteps - 1;
  const progressPercent = Math.round(((currentStepIndex + 1) / totalSteps) * 100);

  const StepIcon = currentStep.icon || Compass;

  return (
    <div className="fixed inset-x-0 bottom-4 sm:bottom-6 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-[130] w-full max-w-lg px-3 sm:px-4 pointer-events-auto">
      <motion.div
        key={`${activeTrack.id}-${currentStep.id}`}
        initial={{ opacity: 0, y: 24, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.95 }}
        transition={{ type: 'spring', damping: 30, stiffness: 400, mass: 0.8 }}
        className="rounded-[28px] sm:rounded-3xl bg-white/95 dark:bg-[#0c1613]/95 border border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl backdrop-blur-2xl p-5 sm:p-6 text-gray-900 dark:text-white flex flex-col gap-4 overflow-hidden relative"
      >
        {/* Top Progress Track */}
        <div className="absolute top-0 inset-x-0 h-1.5 bg-gray-100 dark:bg-white/5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${progressPercent}%` }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Header HUD */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 flex-shrink-0 shadow-inner">
              <StepIcon className="w-4 h-4 animate-spin-slow" />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {lang === 'ml' ? activeTrack.badgeMl : activeTrack.badge} • Step {currentStepIndex + 1}/{totalSteps}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  {tourMode === 'interactive' ? (
                    <>
                      <Zap className="w-2.5 h-2.5 text-amber-500 fill-amber-500 animate-pulse" />
                      <span>Interactive Quest</span>
                    </>
                  ) : (
                    <>
                      <Eye className="w-2.5 h-2.5 text-blue-500" />
                      <span>Showcase</span>
                    </>
                  )}
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold truncate text-gray-500 dark:text-gray-400">
                {lang === 'ml' ? activeTrack.titleMl : activeTrack.titleEn}
              </h4>
            </div>
          </div>

          {/* Quick HUD Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {/* Mode Toggle Button */}
            <button
              onClick={() => {
                feedback('tick');
                setTourMode(tourMode === 'interactive' ? 'cinematic' : 'interactive');
              }}
              className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 text-[10px] font-bold transition-all"
              title={tourMode === 'interactive' ? 'Switch to Cinematic Showcase' : 'Switch to Interactive Quest'}
            >
              {tourMode === 'interactive' ? <Eye className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5 text-amber-500" />}
            </button>

            {/* Mute/Sound Toggle */}
            <button
              onClick={() => {
                feedback('tick');
                setSoundEnabled(!soundEnabled);
              }}
              className="p-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-all"
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-gray-400" />}
            </button>

            {/* Close Button */}
            <button
              onClick={skipTour}
              className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-all"
              title={t('skipTour', 'Exit Tour')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step Title & Storytelling Copy */}
        <div className="space-y-1.5">
          <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-gray-900 dark:text-white leading-snug">
            {lang === 'ml' ? currentStep.titleMl : currentStep.titleEn}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
            {lang === 'ml' ? currentStep.descMl : currentStep.descEn}
          </p>
          {lang !== 'ml' && currentStep.descMl && (
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-malayalam line-clamp-2">
              {currentStep.descMl}
            </p>
          )}
        </div>

        {/* Action Prompt Pill (Interactive Mode) */}
        {tourMode === 'interactive' && (
          <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 flex items-start gap-2.5">
            <span className="p-1 rounded-lg bg-emerald-500 text-white mt-0.5 flex-shrink-0 shadow-sm animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                Required Action
              </span>
              <p className="text-xs font-bold text-emerald-950 dark:text-emerald-100 leading-snug">
                {lang === 'ml' ? currentStep.actionPromptMl : currentStep.actionPromptEn}
              </p>
            </div>
          </div>
        )}

        {/* Navigation & Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/10">
          <button
            onClick={skipTour}
            className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            {t('skipTour', 'Skip Mission')}
          </button>

          <div className="flex items-center gap-2">
            {currentStepIndex > 0 && (
              <button
                onClick={prevStep}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 flex items-center gap-1 transition-all active:scale-95"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Previous</span>
              </button>
            )}

            {/* In interactive mode: provide an optional auto-complete / skip step button if user gets stuck */}
            {tourMode === 'interactive' && (
              <button
                onClick={completeCurrentStep}
                className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 border border-emerald-500/20 transition-all active:scale-95"
                title="Perform step automatically"
              >
                Auto-Advance
              </button>
            )}

            {/* Cinematic mode Next Button */}
            {tourMode === 'cinematic' && (
              <button
                onClick={nextStep}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-md flex items-center gap-1.5 transition-all active:scale-95"
              >
                <span>{isLastStep ? 'Complete Mission' : 'Next Step'}</span>
                {isLastStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

