import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Compass,
  Sparkles,
  Layers,
  Clock,
  Filter,
  UserCheck,
  Printer,
  Command,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Vibrate,
  VibrateOff,
  BookOpen,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import ColorSystemLegend from './ColorSystemLegend';
import TokenSimulator from './TokenSimulator';
import {
  TimingsAndCutoff,
  ViewsAndFilters,
  StudentPortalTips,
  KitchenAndSheets,
  ShortcutsAndGestures,
} from './GuideModules';
import { guideSprings } from './guideAnimations';

const TABS = [
  { id: 'color-system', label: 'Color System', labelMl: 'കളർ സിസ്റ്റം', icon: Layers },
  { id: 'simulator', label: 'Sandbox Simulator', labelMl: 'ലൈവ് സിമുലേറ്റർ', icon: Sparkles },
  { id: 'views-filters', label: 'Views & Search', labelMl: 'വ്യൂകളും സെർച്ചും', icon: Filter },
  { id: 'timings-cutoff', label: 'Cutoff & IST Time', labelMl: 'സമയവും കട്ട്-ഓഫും', icon: Clock },
  { id: 'student-portal', label: 'Student Portal', labelMl: 'പോർട്ടൽ സഹായം', icon: UserCheck },
  { id: 'kitchen-sheets', label: 'Kitchen Sheets', labelMl: 'കിച്ചൻ ഷീറ്റ്', icon: Printer },
  { id: 'shortcuts', label: 'Shortcuts', labelMl: 'ഷോർട്ട്കട്ടുകൾ', icon: Command },
];

const TokenBoardGuideModal = ({ isOpen, onClose, onStartTour }) => {
  const { t, lang } = useLanguage();
  const { feedback, soundEnabled, setSoundEnabled, hapticsEnabled, setHapticsEnabled } = useFeedback();
  const [activeTab, setActiveTab] = useState('color-system');
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-xl">
        {/* Backdrop click to dismiss */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0"
        />

        {/* Modal / Mobile Bottom Sheet Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={guideSprings.modalEntrance}
          onClick={(e) => e.stopPropagation()}
          className={`
            relative z-10 w-full bg-white dark:bg-[#0a120f] border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden transition-all duration-300
            ${
              isFullscreen
                ? 'fixed inset-0 rounded-none max-h-screen'
                : 'rounded-t-[32px] sm:rounded-3xl max-w-4xl max-h-[92dvh] sm:max-h-[88vh]'
            }
          `}
        >
          {/* Mobile Gestural Grab Bar */}
          <div className="sm:hidden flex justify-center pt-3 pb-1">
            <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-white/20" />
          </div>

          {/* Modal Header */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 text-white flex-shrink-0 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner flex-shrink-0">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-xl font-extrabold tracking-tight truncate">
                    {t('tokenBoardGuide') || 'Token Board Master Guide'}
                  </h2>
                  <span className="hidden xs:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-emerald-100 border border-white/20">
                    v2.0 Pro
                  </span>
                </div>
                <p className="text-xs text-emerald-100/80 truncate">
                  {t('guideSubtitle') || 'Color system, live sandbox & operating manual'}
                </p>
              </div>
            </div>

            {/* Header Right Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Guided Tour Trigger Button */}
              {onStartTour && (
                <button
                  onClick={() => {
                    feedback('tick');
                    onStartTour();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-bold text-xs border border-white/20 transition-all active:scale-95 shadow-sm"
                  title={t('liveTour', 'Live Tour')}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{t('liveTour', 'Live Tour')}</span>
                </button>
              )}

              {/* Fullscreen Toggle (Desktop) */}
              <button
                onClick={() => {
                  feedback('tick');
                  setIsFullscreen((prev) => !prev);
                }}
                className="hidden sm:flex p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>

              {/* Close Button */}
              <button
                onClick={() => {
                  feedback('tick');
                  onClose();
                }}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                title={t('close', 'Close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tab Bar */}
          <div className="px-4 sm:px-6 py-2.5 bg-gray-50/90 dark:bg-white/[0.03] border-b border-gray-200/70 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none flex-shrink-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    feedback('tick');
                    setActiveTab(tab.id);
                  }}
                  className={`relative px-3.5 py-2 rounded-xl text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-2 flex-shrink-0 ${
                    isActive
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="guideActiveTab"
                      transition={guideSprings.tabIndicator}
                      className="absolute inset-0 bg-white dark:bg-[#15221d] rounded-xl shadow-sm border border-emerald-500/20"
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10 flex-shrink-0" />
                  <span className="relative z-10">{lang === 'ml' ? tab.labelMl : tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-6 pb-safe">
            {activeTab === 'color-system' && <ColorSystemLegend />}
            {activeTab === 'simulator' && <TokenSimulator />}
            {activeTab === 'views-filters' && <ViewsAndFilters />}
            {activeTab === 'timings-cutoff' && <TimingsAndCutoff />}
            {activeTab === 'student-portal' && <StudentPortalTips />}
            {activeTab === 'kitchen-sheets' && <KitchenAndSheets />}
            {activeTab === 'shortcuts' && <ShortcutsAndGestures />}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-3.5 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-200/60 dark:border-white/10 flex items-center justify-between text-xs text-gray-500 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('pressQuestionKeyNotice', 'Press ? anytime to open')}</span>
            </div>

            <button
              onClick={() => {
                feedback('tick');
                onClose();
              }}
              className="px-4 py-1.5 rounded-xl bg-gray-200 dark:bg-white/10 hover:bg-gray-300 font-bold text-gray-800 dark:text-white transition-all text-xs"
            >
              {t('done', 'Done')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default TokenBoardGuideModal;
