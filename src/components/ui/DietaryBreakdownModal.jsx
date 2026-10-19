import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  UtensilsCrossed,
  Printer,
  Users,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';
import { formatFriendlyDate, getEffectiveStudentMealStatus } from '../../utils/studentExceptionService';

/**
 * Kitchen Dietary Distribution Modal
 * Gives canteen mess administrators & cooks an exact breakdown of active diners
 * and students avoiding specific foods for the active date.
 */
export default function DietaryBreakdownModal({
  isOpen,
  onClose,
  documents = [],
  preferencesList = [],
  targetDateIST,
  effectiveDay,
  isLunch,
}) {
  const { feedback } = useFeedback();
  const { t } = useLanguage();

  if (!isOpen) return null;

  const mealKey = isLunch ? 'lunch' : 'breakfast';
  const activeDiners = documents.filter(
    (doc) => !doc.block && getEffectiveStudentMealStatus(doc, targetDateIST, effectiveDay, mealKey)
  );

  // Calculate avoiders list for each preference
  const dietaryData = preferencesList.map((pref) => {
    const avoiders = activeDiners.filter((doc) => {
      return doc.obj2 && doc.obj2[pref.id] === false;
    });

    const consumers = activeDiners.length - avoiders.length;

    return {
      ...pref,
      avoiders,
      avoidersCount: avoiders.length,
      consumersCount: consumers,
    };
  });

  const allInclusiveCount = activeDiners.filter((doc) => {
    if (!doc.obj2) return true;
    return Object.values(doc.obj2).every((v) => v !== false);
  }).length;

  const handlePrint = () => {
    feedback('tick');
    window.print();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-2xl p-4 sm:p-7 space-y-5 max-h-[90dvh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 flex-shrink-0">
                <UtensilsCrossed className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div>
                <h2 className="text-base sm:text-xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>{t('kitchenDietaryDistribution', 'Kitchen Dietary Distribution')}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300">
                    {isLunch ? (t('navLunch') || 'Lunch') : (t('navBreakfast') || 'Breakfast')}
                  </span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {t('liveHeadcountsSubtitle', 'Live headcounts and food avoidance lists for {date}.').replace('{date}', formatFriendlyDate(targetDateIST))}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Metrics KPI Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 text-center">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                {t('totalActiveDiners', 'Total Active Diners')}
              </span>
              <span className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                {activeDiners.length}
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-300/50 dark:border-emerald-500/20 text-center">
              <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider block">
                {t('standardAllFoods', 'Standard / All Foods')}
              </span>
              <span className="text-xl sm:text-2xl font-black text-emerald-800 dark:text-emerald-300">
                {allInclusiveCount}
              </span>
            </div>

            <div className="col-span-2 sm:col-span-1 p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-300/50 dark:border-amber-500/20 text-center">
              <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider block">
                {t('specialDietaryRequests', 'Special Dietary Requests')}
              </span>
              <span className="text-xl sm:text-2xl font-black text-amber-800 dark:text-amber-300">
                {activeDiners.length - allInclusiveCount}
              </span>
            </div>
          </div>

          {/* Detailed Dietary Items Breakdown */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('foodExclusionCohorts', 'Food Exclusion Cohorts:')}</span>
            </h4>

            <div className="space-y-2.5">
              {dietaryData.map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 sm:p-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/10 space-y-2"
                >
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white">
                        {item.labelEn}
                      </span>
                      {item.labelMl && (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-malayalam">
                          ({item.labelMl})
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 font-bold text-xs">
                      <span className="text-emerald-600 dark:text-emerald-400">
                        {t('eatingCount', '{count} eating').replace('{count}', item.consumersCount)}
                      </span>
                      <span className="text-gray-300 dark:text-gray-600">•</span>
                      <span className="text-rose-600 dark:text-rose-400">
                        {t('avoidCount', '{count} avoid').replace('{count}', item.avoidersCount)}
                      </span>
                    </div>
                  </div>

                  {/* List of avoiders tokens */}
                  {item.avoiders.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {item.avoiders.map((doc) => (
                        <span
                          key={doc.id || doc.tokenNo}
                          className="px-2 py-0.5 rounded-lg bg-rose-100/80 dark:bg-rose-950/50 border border-rose-300 dark:border-rose-500/30 text-[11px] font-bold text-rose-800 dark:text-rose-300 font-mono"
                          title={`${doc.nameEn || doc.name || ''} (Room ${doc.roomNo || '-'})`}
                        >
                          #{doc.tokenNo}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-400 italic">
                      {t('zeroAvoidersText', 'Zero avoiders — All {count} active students consume this item.').replace('{count}', activeDiners.length)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('printSlip', 'Print Slip')}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold shadow-md shadow-emerald-500/20"
            >
              {t('done', 'Done')}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
