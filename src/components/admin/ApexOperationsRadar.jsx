import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  PieChart,
  Scale,
  Users,
  UtensilsCrossed,
  Leaf,
  DollarSign,
  AlertTriangle,
  Layers,
  ChevronRight,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  HeartPulse,
} from 'lucide-react';
import { getEffectiveStudentMealStatus } from '../../utils/studentExceptionService';
import { useLanguage } from '../../store/LanguageContext';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';

export default function ApexOperationsRadar({
  documents = [],
  isLunch = true,
  targetDateIST,
  effectiveDay,
  groupedByBatch = {},
  groupedBySection = [],
  metrics = {},
  onOpenDietaryModal,
}) {
  const { t } = useLanguage();
  const totalStudents = documents.length;
  const activeCount = isLunch ? metrics.lunchCount : metrics.breakfastCount;
  const optedOutCount = Math.max(0, totalStudents - activeCount);
  const participationRate = totalStudents > 0 ? Math.round((activeCount / totalStudents) * 100) : 0;

  // Batch-wise participation analysis
  const batchAnalytics = useMemo(() => {
    return Object.entries(groupedByBatch).map(([batchName, students]) => {
      if (students.length === 0) return null;
      const active = students.filter(
        (s) =>
          !s.block &&
          getEffectiveStudentMealStatus(s, targetDateIST, effectiveDay, isLunch ? 'lunch' : 'breakfast')
      ).length;
      const percent = students.length > 0 ? Math.round((active / students.length) * 100) : 0;

      return {
        batchName,
        total: students.length,
        active,
        percent,
      };
    }).filter(Boolean);
  }, [groupedByBatch, targetDateIST, effectiveDay, isLunch]);

  // Dietary avoidance breakdown
  const dietaryAnalytics = useMemo(() => {
    let beefAvoid = 0;
    let fishAvoid = 0;
    let chickenAvoid = 0;
    let standardFullDiet = 0;
    let multiAllergen = 0;

    documents.forEach((doc) => {
      if (doc.block) return;
      const isDining = getEffectiveStudentMealStatus(
        doc,
        targetDateIST,
        effectiveDay,
        isLunch ? 'lunch' : 'breakfast'
      );
      if (!isDining) return;

      const obj2 = doc.obj2 || {};
      const noBeef = obj2.beef === false;
      const noFish = obj2.fish === false;
      const noChicken = obj2.chicken === false;

      const avoidances = [noBeef, noFish, noChicken].filter(Boolean).length;

      if (avoidances === 0) {
        standardFullDiet++;
      } else {
        if (noBeef) beefAvoid++;
        if (noFish) fishAvoid++;
        if (noChicken) chickenAvoid++;
        if (avoidances > 1) multiAllergen++;
      }
    });

    return {
      standardFullDiet,
      beefAvoid,
      fishAvoid,
      chickenAvoid,
      multiAllergen,
      totalDining: activeCount,
    };
  }, [documents, targetDateIST, effectiveDay, isLunch, activeCount]);

  // Waste Mitigation & Financial Optimization
  const wasteAnalytics = useMemo(() => {
    // 350 grams of rice/grains saved per cancelled portion
    const grainSavedKg = (optedOutCount * 0.35).toFixed(1);
    // 250 ml of gravies/curries saved per portion
    const liquidSavedLiters = (optedOutCount * 0.25).toFixed(1);
    // Average meal cost savings index (~Rs 45 per meal)
    const costSavedInr = optedOutCount * 45;

    return {
      grainSavedKg,
      liquidSavedLiters,
      costSavedInr,
      efficiencyScore: Math.min(100, Math.max(0, participationRate)),
    };
  }, [optedOutCount, participationRate]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-fadeIn">
      {/* Top Banner: Real-Time Operational Intelligence Overview */}
      <div className="relative overflow-hidden p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-900/40 via-teal-900/30 to-gray-900/60 border border-emerald-500/20 shadow-xl backdrop-blur-xl">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {t('operationsRadarTitle', 'Institutional Dining Operations Radar')}
              </h2>
            </div>
            <p className="text-xs text-emerald-200/70 max-w-2xl">
              {t('operationsRadarSubtitle', 'Live predictive headcount analytics, batch participation distributions, kitchen portion conservation metrics, and allergen vigilance for')}{' '}
              <span className="font-bold text-white">{isLunch ? (t('lunchService') || 'Lunch Service') : (t('breakfastService') || 'Breakfast Service')}</span>.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 text-right">
              <div className="text-[10px] uppercase font-bold text-emerald-300/80">{t('activeServiceYield', 'Active Service Yield')}</div>
              <div className="text-lg font-black text-white font-mono">{participationRate}%</div>
            </div>
            <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/10 text-right">
              <div className="text-[10px] uppercase font-bold text-emerald-300/80">{t('diningCapacity', 'Dining Capacity')}</div>
              <div className="text-lg font-black text-white font-mono">
                {activeCount} <span className="text-xs font-normal text-emerald-300">/ {totalStudents}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: 2 Large Analytical Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        
        {/* ================= PANEL 1: BATCH-WISE PARTICIPATION SPECTRUM (7 Cols) ================= */}
        <div className="lg:col-span-7 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
                {t('batchAttendanceSpectrum', 'Academic Batch Attendance Spectrum')}
              </h3>
            </div>
            <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
              {batchAnalytics.length} {t('batchesTracked', 'Batches Tracked')}
            </span>
          </div>

          <div className="space-y-3.5">
            {batchAnalytics.map((batch, idx) => {
              const colorClass =
                batch.percent >= 80
                  ? 'from-emerald-500 to-green-600 text-emerald-600 dark:text-emerald-400'
                  : batch.percent >= 60
                  ? 'from-teal-500 to-emerald-600 text-teal-600 dark:text-teal-400'
                  : batch.percent >= 40
                  ? 'from-amber-500 to-orange-600 text-amber-600 dark:text-amber-400'
                  : 'from-rose-500 to-red-600 text-rose-600 dark:text-rose-400';

              return (
                <div key={batch.batchName} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {batch.batchName}
                    </span>
                    <span className="font-mono text-gray-600 dark:text-gray-300">
                      <b className={colorClass.split(' ')[2]}>{batch.active}</b> / {batch.total} ({batch.percent}%)
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-gray-100 dark:bg-white/5 overflow-hidden p-0.5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${batch.percent}%` }}
                      transition={{ duration: 0.8, delay: idx * 0.08, ease: 'easeOut' }}
                      className={`h-full rounded-full bg-gradient-to-r ${colorClass.split(' ')[0]} ${colorClass.split(' ')[1]}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>{t('colorIndexLegend', 'Color Index: 🟢 >80% High • 🟡 60-79% Normal • 🔴 <60% Low')}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">{t('realtimeFeed', 'Real-time Feed')}</span>
          </div>
        </div>

        {/* ================= PANEL 2: DIETARY CARE & ALLERGEN RADAR (5 Cols) ================= */}
        <div className="lg:col-span-5 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-4 h-4 text-rose-500" />
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
                  {t('dietaryAllergenRadar', 'Dietary Care & Allergen Radar')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSoftChime();
                  hapticEngine.lightTap();
                  if (onOpenDietaryModal) onOpenDietaryModal();
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
              >
                <span>{t('fullList', 'Full List')}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 mt-3">
              {/* Standard Diet */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/20">
                <span className="text-[10px] font-bold uppercase text-emerald-600 dark:text-emerald-400">
                  {t('standardFullDiet', 'Standard Full Diet')}
                </span>
                <div className="text-xl font-black text-gray-900 dark:text-white font-mono mt-0.5">
                  {dietaryAnalytics.standardFullDiet}
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{t('noAvoidances', 'No avoidances')}</span>
              </div>

              {/* Beef Avoidance */}
              <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-500/20">
                <span className="text-[10px] font-bold uppercase text-amber-600 dark:text-amber-400">
                  {t('beefAvoidance', 'Beef Avoidance')}
                </span>
                <div className="text-xl font-black text-gray-900 dark:text-white font-mono mt-0.5">
                  {dietaryAnalytics.beefAvoid}
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{t('separateServing', 'Separate serving')}</span>
              </div>

              {/* Fish Avoidance */}
              <div className="p-3 rounded-2xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-500/20">
                <span className="text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400">
                  {t('fishAvoidance', 'Fish Avoidance')}
                </span>
                <div className="text-xl font-black text-gray-900 dark:text-white font-mono mt-0.5">
                  {dietaryAnalytics.fishAvoid}
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{t('nonSeafoodMenu', 'Non-seafood menu')}</span>
              </div>

              {/* Chicken Avoidance */}
              <div className="p-3 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-500/20">
                <span className="text-[10px] font-bold uppercase text-purple-600 dark:text-purple-400">
                  {t('chickenAvoidance', 'Chicken Avoidance')}
                </span>
                <div className="text-xl font-black text-gray-900 dark:text-white font-mono mt-0.5">
                  {dietaryAnalytics.chickenAvoid}
                </div>
                <span className="text-[10px] text-gray-500 dark:text-gray-400">{t('poultryFree', 'Poultry-free')}</span>
              </div>
            </div>
          </div>

          {/* Quick Trigger Button */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playSoftChime();
              hapticEngine.lightTap();
              if (onOpenDietaryModal) onOpenDietaryModal();
            }}
            className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all transform active:scale-98"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>{t('generateDietaryManifest', 'Generate Kitchen Dietary Manifest')}</span>
          </button>
        </div>
      </div>

      {/* ================= PANEL 3: WASTE MITIGATION & RESOURCE CONSERVATION ================= */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3 mb-4">
          <div className="flex items-center gap-2">
            <Leaf className="w-4 h-4 text-emerald-500" />
            <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
              {t('cateringOptimizationIndex', 'Catering Optimization & Food Conservation Index')}
            </h3>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
            {t('zeroWasteGoal', 'Zero-Waste Goal')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Metric 1: Cancelled Portions Saved */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5">
            <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase">
              {t('cancelledPortions', 'Cancelled Portions')}
            </div>
            <div className="text-2xl font-black text-gray-900 dark:text-white font-mono mt-1">
              {optedOutCount} <span className="text-xs font-medium text-emerald-500">{t('meals', 'Meals')}</span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {t('cancelledPortionsDesc', 'Saved from over-cooking via proactive cutoff updates')}
            </p>
          </div>

          {/* Metric 2: Estimated Rice/Grains Preserved */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5">
            <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase">
              {t('grainsConserved', 'Grains Conserved')}
            </div>
            <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              ~{wasteAnalytics.grainSavedKg} <span className="text-xs font-medium">kg</span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {t('grainsConservedDesc', 'Exact raw ingredient deduction for kitchen stores')}
            </p>
          </div>

          {/* Metric 3: Estimated Curries/Liquids Preserved */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5">
            <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase">
              {t('liquidsConserved', 'Liquids Conserved')}
            </div>
            <div className="text-2xl font-black text-teal-600 dark:text-teal-400 font-mono mt-1">
              ~{wasteAnalytics.liquidSavedLiters} <span className="text-xs font-medium">L</span>
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {t('liquidsConservedDesc', 'Curries, side gravies, and hot beverages preserved')}
            </p>
          </div>

          {/* Metric 4: Financial Savings Index */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/5">
            <div className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase">
              {t('resourceValuePreserved', 'Resource Value Preserved')}
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
              ₹{wasteAnalytics.costSavedInr.toLocaleString()}
            </div>
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {t('resourceValuePreservedDesc', 'Preserved mess fund capital reinvestable into quality')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
