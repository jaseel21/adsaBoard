import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  Coffee,
  Utensils,
  ShieldCheck,
  Tag,
  CheckCircle2,
  XCircle,
  Sparkles,
  Info,
} from 'lucide-react';
import { formatFriendlyDate, getDayOfWeekShort } from '../../utils/studentExceptionService';
import { useLanguage } from '../../store/LanguageContext';

export default function DateHistoryDetailModal({
  isOpen,
  onClose,
  dateStr,
  meals,
  student,
  preferencesList = [],
}) {
  const { t } = useLanguage();

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !dateStr) return null;

  const isBfOn = Boolean(meals?.breakfast);
  const isLuOn = Boolean(meals?.lunch);
  const hasException = Boolean(meals?.hasException);
  const label = meals?.label || '';
  const dietary = meals?.dietary || student?.obj2 || {};

  // Compute days ago
  const computeDaysAgo = () => {
    try {
      const target = new Date(dateStr);
      const now = new Date();
      target.setHours(0, 0, 0, 0);
      now.setHours(0, 0, 0, 0);
      const diffTime = now.getTime() - target.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) return 'Yesterday';
      if (diffDays > 1) return `${diffDays} days ago`;
      return 'Past Record';
    } catch {
      return 'Past Record';
    }
  };

  const daysAgoText = computeDaysAgo();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md">
        {/* Backdrop click */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 14 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 14 }}
          transition={{ type: 'spring', damping: 26, stiffness: 380 }}
          className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] z-10"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 pb-4 border-b border-gray-100 dark:border-white/5 flex items-start justify-between gap-3 bg-gradient-to-b from-gray-50/70 to-transparent dark:from-white/[0.02]">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/20">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                    {formatFriendlyDate(dateStr, true)}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 text-[10px] font-bold font-mono">
                    {daysAgoText}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Immutable Dining History Record</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto scrollbar-thin">
            {/* Summary Status Strip */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 ${
              isBfOn && isLuOn
                ? 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-200'
                : !isBfOn && !isLuOn
                ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200/60 dark:border-rose-500/20 text-rose-900 dark:text-rose-200'
                : 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-200/60 dark:border-amber-500/20 text-amber-900 dark:text-amber-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <span className={`w-3 h-3 rounded-full flex-shrink-0 ${
                  isBfOn && isLuOn ? 'bg-emerald-500 animate-pulse' : !isBfOn && !isLuOn ? 'bg-rose-500' : 'bg-amber-500'
                }`} />
                <span className="text-xs sm:text-sm font-extrabold">
                  {isBfOn && isLuOn
                    ? 'Full Day Dining Active (2 Meals)'
                    : !isBfOn && !isLuOn
                    ? 'On Leave / Meals Skipped (0 Meals)'
                    : isLuOn
                    ? 'Lunch Only (1 Meal)'
                    : 'Breakfast Only (1 Meal)'}
                </span>
              </div>

              {hasException && (
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-2.5 h-2.5" />
                  Override
                </span>
              )}
            </div>

            {/* Meal 1: Breakfast */}
            <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Coffee className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
                      Breakfast (കാപ്പി)
                    </h4>
                    <span className="text-[10px] text-gray-400 font-mono">07:00 AM – 08:30 AM</span>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                  isBfOn
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                }`}>
                  {isBfOn ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{isBfOn ? 'Attended / ON' : 'Skipped / OFF'}</span>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 dark:text-gray-400 pl-8">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Origin: </span>
                {hasException ? (
                  <span>Scheduled Date Override {label ? `(${label})` : ''}</span>
                ) : (
                  <span>Standard Weekly Routine Schedule</span>
                )}
              </div>
            </div>

            {/* Meal 2: Lunch */}
            <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <Utensils className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
                      Lunch (ഉച്ചഭക്ഷണം)
                    </h4>
                    <span className="text-[10px] text-gray-400 font-mono">12:30 PM – 02:00 PM</span>
                  </div>
                </div>

                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                  isLuOn
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                }`}>
                  {isLuOn ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  <span>{isLuOn ? 'Attended / ON' : 'Skipped / OFF'}</span>
                </div>
              </div>

              <div className="text-[11px] text-gray-500 dark:text-gray-400 pl-8">
                <span className="font-semibold text-gray-700 dark:text-gray-300">Origin: </span>
                {hasException ? (
                  <span>Scheduled Date Override {label ? `(${label})` : ''}</span>
                ) : (
                  <span>Standard Weekly Routine Schedule</span>
                )}
              </div>
            </div>

            {/* Dietary Allowances Snapshot */}
            {preferencesList.length > 0 && (
              <div className="p-3.5 rounded-2xl bg-gray-50/60 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>Dietary Allowances on Record</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {preferencesList.map((pref) => {
                    const isIncluded = dietary[pref.id] !== false && dietary[pref.id.toLowerCase()] !== false;
                    return (
                      <span
                        key={pref.id}
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${
                          isIncluded
                            ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20'
                            : 'bg-gray-100 text-gray-400 dark:bg-white/5 border-transparent line-through opacity-60'
                        }`}
                      >
                        {pref.labelEn} {isIncluded ? '✓' : '✗'}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Mess Accounting Integrity Note */}
            <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-500/20 flex items-start gap-2.5 text-[11px] text-blue-900 dark:text-blue-200">
              <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
              <span>
                <strong>Archived Record:</strong> Because this date has already passed and mess food preparation was concluded, this record is permanently locked for mess billing integrity and cannot be modified retroactively.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.01] flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-extrabold shadow-sm hover:opacity-90 active:scale-95 transition-all"
            >
              Close Record
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
