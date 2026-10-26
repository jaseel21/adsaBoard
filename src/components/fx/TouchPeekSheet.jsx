import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  Calendar,
  Info,
  Share2,
  X,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { hapticEngine } from '../../utils/haptics';

/**
 * TouchPeekSheet
 * 3D Mobile Peek & Pop Floating Modal Sheet.
 * Suspends the student token in mid-air with an ergonomic radial/dock quick-action bar.
 */
export default function TouchPeekSheet({
  isOpen,
  tokenData,
  onClose,
  onAction,
  onPopToFullModal,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  if (!isOpen || !tokenData) return null;

  const doc = tokenData.doc || tokenData;
  const tokenNo = doc.tokenNo;
  const nameEn = doc.nameEn || doc.name || `Token #${tokenNo}`;
  const isBlocked = Boolean(doc.block);
  const isOn = Boolean(tokenData.isOn);
  const isLunch = Boolean(tokenData.isLunch);
  const onLeave = Boolean(tokenData.onLeave);

  const handleToggle = () => {
    feedback(isOn ? 'warning' : 'success');
    hapticEngine.tokenToggle();
    if (onAction) onAction('toggleStatus', tokenData);
    onClose();
  };

  const handleCalendar = () => {
    feedback('tick');
    if (onAction) onAction('openCalendar', tokenData);
    onClose();
  };

  const handleDietary = () => {
    feedback('tick');
    if (onAction) onAction('dietaryInfo', tokenData);
    onClose();
  };

  const handlePop = () => {
    feedback('pop');
    hapticEngine.mediumTick();
    if (onPopToFullModal) {
      onPopToFullModal(doc);
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center p-4">
        {/* Frosted Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-xl"
        />

        {/* 3D Floating Peek Card Container */}
        <motion.div
          initial={{ scale: 0.82, y: 30, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.85, y: 20, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          className="relative w-full max-w-xs rounded-3xl p-6 bg-white/95 dark:bg-[#0f1715]/95 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-2xl flex flex-col items-center text-center gap-4 z-10"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-500 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            aria-label="Dismiss Peek"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Glowing Token Badge */}
          <div
            className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center font-mono font-black text-2xl text-white shadow-xl ${
              isBlocked
                ? 'bg-gradient-to-b from-gray-700 to-gray-900 border border-gray-600'
                : isOn
                ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/30 border border-emerald-400'
                : 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/30 border border-rose-400'
            }`}
          >
            <span className="text-xs uppercase tracking-wider font-sans font-bold opacity-80">
              Token
            </span>
            <span>{tokenNo}</span>
          </div>

          {/* Student Info */}
          <div className="space-y-1">
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              {nameEn}
            </h3>
            <div className="flex items-center justify-center gap-2">
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  isBlocked
                    ? 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                    : onLeave
                    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    : isOn
                    ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300'
                    : 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300'
                }`}
              >
                {isOn ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <XCircle className="w-3.5 h-3.5" />
                )}
                {isBlocked
                  ? t('locked', 'Locked')
                  : onLeave
                  ? t('leave', 'On Leave')
                  : isOn
                  ? isLunch
                    ? t('lunchOn', 'Lunch Active')
                    : t('breakfastOn', 'Breakfast Active')
                  : isLunch
                  ? t('lunchOff', 'Lunch Cancelled')
                  : t('breakfastOff', 'Breakfast Cancelled')}
              </span>
            </div>
          </div>

          {/* Quick-Action Touch Dock */}
          <div className="grid grid-cols-3 gap-2 w-full pt-2 border-t border-gray-100 dark:border-white/10">
            <button
              onClick={handleToggle}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {isLunch ? <Utensils className="w-5 h-5" /> : <Coffee className="w-5 h-5" />}
              <span className="text-[10px] font-bold">
                {isOn ? t('cancel', 'Cancel') : t('serve', 'Serve')}
              </span>
            </button>

            <button
              onClick={handleCalendar}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-sky-50 dark:hover:bg-sky-500/10 text-gray-700 dark:text-gray-300 hover:text-sky-600 dark:hover:text-sky-400 transition-colors"
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px] font-bold">{t('schedule', 'Schedule')}</span>
            </button>

            <button
              onClick={handleDietary}
              className="flex flex-col items-center justify-center gap-1.5 p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-amber-500/10 text-gray-700 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
            >
              <Info className="w-5 h-5" />
              <span className="text-[10px] font-bold">{t('diet', 'Diet')}</span>
            </button>
          </div>

          {/* Pop to Full Details Action Button */}
          <button
            onClick={handlePop}
            className="w-full py-2.5 px-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition-all"
          >
            <span>{t('viewFullHistory', 'View Full History & Calendar')}</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
