import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UtensilsCrossed,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { getCategoryIcon } from './dietaryIcons';

export default function AvoidersKpiBar({
  stats,
  preferences = [],
  rejectionsByPref = {},
  selectedDietaryFilter,
  onSelectCategory,
  onCopyAllTokens,
}) {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();
  const [copiedBatch, setCopiedBatch] = useState(false);

  const {
    totalStudents = 0,
    totalAvoiders = 0,
    standardFullDiet = 0,
    multiAvoiders = 0,
  } = stats || {};

  const avoiderPct = totalStudents > 0 ? Math.round((totalAvoiders / totalStudents) * 100) : 0;
  const standardPct = totalStudents > 0 ? 100 - avoiderPct : 0;

  const handleCopyQuick = () => {
    feedback('tick');
    if (onCopyAllTokens) {
      onCopyAllTokens();
      setCopiedBatch(true);
      setTimeout(() => setCopiedBatch(false), 2000);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full min-w-0 overflow-hidden">
      {/* Primary KPI Metrics Bento Row - Responsive Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3.5 w-full min-w-0">
        {/* Card 1: Total Registered */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xs backdrop-blur-xl min-w-0 overflow-hidden"
        >
          <div className="flex items-center justify-between gap-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 truncate min-w-0">
              {t('totalRegistered', 'Total Enrolled')}
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 min-w-0">
            <span className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white font-mono truncate">
              {totalStudents}
            </span>
            <span className="text-[9px] sm:text-[10px] text-gray-400 font-semibold uppercase tracking-wider truncate">
              {t('tokens', 'Tokens')}
            </span>
          </div>
        </motion.div>

        {/* Card 2: Total Dietary Avoiders */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-rose-200/70 dark:border-rose-900/30 shadow-xs backdrop-blur-xl min-w-0 overflow-hidden"
        >
          <div className="flex items-center justify-between gap-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 truncate min-w-0">
              {t('dietaryAvoiders', 'Dietary Avoiders')}
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 shrink-0">
              <UtensilsCrossed className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 min-w-0">
            <span className="text-lg sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono truncate">
              {totalAvoiders}
            </span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-rose-500/15 text-rose-700 dark:text-rose-300 shrink-0">
              {avoiderPct}%
            </span>
          </div>
        </motion.div>

        {/* Card 3: Standard Full Diet */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-emerald-200/70 dark:border-emerald-900/30 shadow-xs backdrop-blur-xl min-w-0 overflow-hidden"
        >
          <div className="flex items-center justify-between gap-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 truncate min-w-0">
              {t('standardFullDiet', 'Full Diet')}
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 min-w-0">
            <span className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono truncate">
              {standardFullDiet}
            </span>
            <span className="px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 shrink-0">
              {standardPct}%
            </span>
          </div>
        </motion.div>

        {/* Card 4: Multi-Item Avoiders (2+ restrictions) */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-amber-200/70 dark:border-amber-900/30 shadow-xs backdrop-blur-xl min-w-0 overflow-hidden"
        >
          <div className="flex items-center justify-between gap-1 min-w-0">
            <span className="text-[11px] sm:text-xs font-bold text-gray-500 dark:text-gray-400 truncate min-w-0">
              {t('multiAvoiders', 'Multi-Avoiders')}
            </span>
            <div className="p-1.5 sm:p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5 min-w-0">
            <span className="text-lg sm:text-2xl font-black text-amber-600 dark:text-amber-400 font-mono truncate">
              {multiAvoiders}
            </span>
            <span className="text-[9px] sm:text-[10px] text-gray-400 font-semibold truncate">
              (2+)
            </span>
          </div>
        </motion.div>
      </div>

      {/* Category Breakdown Chips Strip - Mobile Isolated Track */}
      <div className="p-3 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xs backdrop-blur-xl w-full max-w-full min-w-0 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-2.5 w-full min-w-0">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-400 flex items-center gap-1.5 truncate min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">{t('categoryBreakdown', 'Exclusions by Food Item (Click to Filter)')}</span>
          </span>

          {onCopyAllTokens && (
            <button
              type="button"
              onClick={handleCopyQuick}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 text-[11px] font-bold transition-all shrink-0 self-end sm:self-auto"
              title="Copy token numbers matching current view"
            >
              {copiedBatch ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3 text-gray-400" />}
              <span>{copiedBatch ? t('copied', 'Copied') : t('copyTokens', 'Copy Tokens')}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none touch-pan-x py-1 w-full max-w-full min-w-0">
          {preferences.map((p) => {
            const count = (rejectionsByPref[p.id] || []).length;
            const prefLabel = lang === 'ml' && p.labelMl ? p.labelMl : (p.labelEn || p.name);
            const isSelected = selectedDietaryFilter === p.id;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  feedback('tick');
                  if (onSelectCategory) {
                    onSelectCategory(isSelected ? 'all_avoiders' : p.id);
                  }
                }}
                className={`inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 border ${
                  isSelected
                    ? 'bg-rose-500 text-white border-rose-600 shadow-sm shadow-rose-500/25 ring-2 ring-rose-500/30'
                    : 'bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-white/10'
                }`}
              >
                <div
                  className={`p-1 rounded-lg shrink-0 ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-rose-500/10 text-rose-500'
                  }`}
                >
                  {getCategoryIcon(p.icon, 'w-3 h-3')}
                </div>
                <span>{prefLabel}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] font-extrabold ${
                    isSelected
                      ? 'bg-white/25 text-white'
                      : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
