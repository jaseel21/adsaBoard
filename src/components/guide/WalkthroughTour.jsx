import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  X,
  CheckCircle2,
  Sparkles,
  Compass,
  ArrowRight,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';

const TOUR_STEPS = [
  {
    target: 'hero-banner',
    title: 'Live Canteen Dining System & Clock',
    titleMl: 'തത്സമയ കാന്റീൻ സംവിധാനവും ക്ലോക്കും',
    description:
      'Real-time meal reservations, live IST server clock immune to device time tampering, and instantaneous rolling counts.',
    descriptionMl:
      'കൃത്യമായ തത്സമയ ഇന്ത്യൻ സമയം (IST), കൃത്രിമ മാറ്റങ്ങൾ തടയുന്ന സംവിധാനം, ഓർഡർ കൗണ്ടറുകൾ എന്നിവ ഇവിടെ കാണാം.',
    badge: '1 of 6',
  },
  {
    target: 'meal-toggle',
    title: 'Breakfast & Lunch Switcher',
    titleMl: 'പ്രഭാതഭക്ഷണവും ഉച്ചഭക്ഷണവും തിരഞ്ഞെടുക്കൽ',
    description:
      'Seamlessly toggle between Breakfast (Amber) and Lunch (Emerald) to inspect real-time prep numbers for each dining slot.',
    descriptionMl:
      'പ്രഭാതഭക്ഷണവും ഉച്ചഭക്ഷണവും തമ്മിൽ എളുപ്പത്തിൽ മാറ്റാനും ഓരോന്നിന്റെയും കൃത്യമായ എണ്ണം കാണാനും സാധിക്കുന്നു.',
    badge: '2 of 6',
  },
  {
    target: 'view-category',
    title: 'Multi-Perspective Board Views',
    titleMl: 'മൂന്ന് വ്യത്യസ്ത ബോർഡ് വ്യൂകൾ',
    description:
      'Inspect all 197 tokens in an expansive grid, grouped by Academic Batches (1-7), or partitioned by Dynamic Dining Sections (#1-5).',
    descriptionMl:
      'എല്ലാ ടോക്കണുകളും ഒന്നിച്ചോ, അക്കാദമിക് ബാച്ചുകൾ തിരിച്ചോ, കിച്ചൻ വിതരണ സെക്ഷനുകളായോ കാണാം.',
    badge: '3 of 6',
  },
  {
    target: 'search-filters',
    title: 'Supercharged Search & Sorting',
    titleMl: 'സെർച്ചും ഫിൽട്ടറുകളും',
    description:
      'Instantaneous search by token #, English name, Malayalam script, or username, plus dietary and batch filters.',
    descriptionMl:
      'ടോക്കൺ നമ്പർ, പേര് (മലയാളത്തിലോ ഇംഗ്ലീഷിലോ), യൂസർനെയിം എന്നിവ വഴി നിമിഷങ്ങൾക്കകം കണ്ടെത്തുക.',
    badge: '4 of 6',
  },
  {
    target: 'token-grid',
    title: 'Tactile Token Buttons & Inspection',
    titleMl: 'ടോക്കൺ ബട്ടണുകളും വിവരങ്ങളും',
    description:
      'Green = Active; Red = Skipped or on Leave; Dark = Blocked. Tap any token to inspect their 7-day schedule!',
    descriptionMl:
      'പച്ച = ഭക്ഷണം ഉണ്ട്, ചുവപ്പ് = ഒഴിവാക്കി / ലീവ്, ഡാർക്ക് = ബ്ലോക്ക്. ടാപ്പ് ചെയ്ത് ഫുൾ ഷെഡ്യൂൾ പരിശോധിക്കാം!',
    badge: '5 of 6',
  },
  {
    target: 'update-token-btn',
    title: 'Student Portal & Daily Cutoff Lock',
    titleMl: 'സ്റ്റുഡന്റ് പോർട്ടലും സമയപരിധിയും',
    description:
      'Students log in here to modify dining preferences. Notice the lock badge: orders close at 11:00 PM IST for kitchen prep.',
    descriptionMl:
      'വിദ്യാർത്ഥികൾക്ക് സ്വന്തം ഭക്ഷണക്രമം മാറ്റാനുള്ള പോർട്ടൽ. രാത്രി 11 മണിക്ക് ഓർഡറുകൾ ലോക്കാകുന്നു.',
    badge: '6 of 6',
  },
];

const WalkthroughTour = ({ isOpen, onClose }) => {
  const { feedback } = useFeedback();
  const { t, lang } = useLanguage();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [highlightRect, setHighlightRect] = useState(null);

  const step = TOUR_STEPS[currentStepIndex];

  // Calculate target element's position on screen
  useEffect(() => {
    if (!isOpen) return;

    const updateRect = () => {
      const el = document.querySelector(`[data-tour="${step.target}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Scroll element smoothly into view if out of viewport
        if (rect.top < 60 || rect.bottom > window.innerHeight - 60) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setHighlightRect({
          top: rect.top - 8,
          left: rect.left - 8,
          width: rect.width + 16,
          height: rect.height + 16,
        });
      } else {
        setHighlightRect(null);
      }
    };

    updateRect();
    window.addEventListener('resize', updateRect);
    window.addEventListener('scroll', updateRect);

    return () => {
      window.removeEventListener('resize', updateRect);
      window.removeEventListener('scroll', updateRect);
    };
  }, [isOpen, step.target, currentStepIndex]);

  if (!isOpen) return null;

  const handleNext = () => {
    feedback('tick');
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    feedback('tick');
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  };

  const handleFinish = () => {
    feedback('success');
    try {
      localStorage.setItem('adsatboard-tour-seen', 'true');
    } catch (_) {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-auto">
      {/* Darkened Mask Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-all"
        onClick={handleFinish}
      />

      {/* Spotlight Frame around element if found */}
      {highlightRect && (
        <motion.div
          layoutId="tourSpotlightRing"
          initial={false}
          animate={{
            top: highlightRect.top,
            left: highlightRect.left,
            width: highlightRect.width,
            height: highlightRect.height,
          }}
          transition={{ type: 'spring', stiffness: 350, damping: 30 }}
          className="fixed z-[101] rounded-3xl border-2 border-emerald-400 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none"
        >
          <span className="absolute -inset-1 rounded-3xl border border-emerald-300/60 animate-ping pointer-events-none" />
        </motion.div>
      )}

      {/* Floating Tour Instruction Card */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[102] w-full max-w-lg px-4">
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          className="p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-[#0f1715]/95 border border-emerald-500/30 shadow-2xl backdrop-blur-xl flex flex-col gap-4 text-gray-900 dark:text-white"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Compass className="w-4 h-4 animate-spin-slow" />
              </span>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                {t('liveTour', 'Live Tour')} • {step.badge}
              </span>
            </div>
            <button
              onClick={handleFinish}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
              title={t('skipTour', 'Skip Tour')}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Title and Descriptions */}
          <div className="space-y-1">
            <h3 className="font-extrabold text-base tracking-tight">
              {lang === 'ml' ? (step.titleMl || step.title) : step.title}
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              {lang === 'ml' ? (step.descriptionMl || step.description) : step.description}
            </p>
            {lang !== 'ml' && step.descriptionMl && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-malayalam mt-1">
                {step.descriptionMl}
              </p>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/10">
            <button
              onClick={handleFinish}
              className="text-xs font-bold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            >
              {t('skipTour', 'Skip Tour')}
            </button>

            <div className="flex items-center gap-2">
              {currentStepIndex > 0 && (
                <button
                  onClick={handlePrev}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 flex items-center gap-1 transition-all"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>{t('previous', 'Previous')}</span>
                </button>
              )}

              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-md flex items-center gap-1.5 transition-all active:scale-95"
              >
                <span>{currentStepIndex === TOUR_STEPS.length - 1 ? t('finishTour', 'Finish Tour') : t('nextStep', 'Next Step')}</span>
                {currentStepIndex === TOUR_STEPS.length - 1 ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WalkthroughTour;
