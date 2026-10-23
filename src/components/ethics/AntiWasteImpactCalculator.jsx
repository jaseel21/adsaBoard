import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  AlertTriangle,
  Users,
  Droplet,
  Flame,
  Scale,
  RefreshCw,
  HeartCrack,
} from 'lucide-react';
import { SACRED_ETHICS_DATA } from '../../data/diningEthicsContent';
import { useFeedback } from '../../utils/useFeedback';

export default function AntiWasteImpactCalculator() {
  const { antiWaste } = SACRED_ETHICS_DATA;
  const { feedback } = useFeedback();

  // Number of students wasting a small portion daily
  const [studentCount, setStudentCount] = useState(60);

  // Calculation: 1 tablespoon of leftover rice ≈ 25g.
  // Daily per student across 2 major meals = 50g.
  // Monthly per student = 1.5 kg.
  const monthlyKgWasted = Math.round((studentCount * 0.05 * 30 * 10) / 10);
  // Full meals equivalent: 1 adult meal ≈ 150g raw rice
  const mealsWasted = Math.round((monthlyKgWasted * 1000) / 150);
  // Water footprint: 1 kg rice takes ~2,500 liters of irrigation water
  const waterWastedLiters = monthlyKgWasted * 2500;

  const handleSliderChange = (e) => {
    feedback('tick');
    setStudentCount(parseInt(e.target.value, 10));
  };

  return (
    <section id="anti-waste" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 dark:bg-red-500/20 border border-red-500/30 text-red-800 dark:text-red-300 text-xs font-bold mb-3">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
          <span>{antiWaste.sectionTagMl}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white font-malayalam tracking-tight">
          {antiWaste.titleMl}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 font-malayalam max-w-2xl mx-auto">
          നമ്മുടെ തളികയിൽ ബാക്കിവെച്ച് വാഷ്ബേസിനിലേക്ക് തള്ളുന്ന ഓരോ വറ്റും നാളെ അല്ലാഹുവിന്റെ മുന്നിൽ സാക്ഷിയാകും.
        </p>
      </div>

      {/* Quranic & Prophetic Injunctions Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {/* Quran Injunction */}
        <div className="p-6 rounded-3xl bg-emerald-950/20 dark:bg-emerald-950/40 border border-emerald-500/30 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block mb-2 font-malayalam">
              വിശുദ്ധ ഖുർആൻ മുന്നറിയിപ്പ്
            </span>
            <p className="font-arabic text-xl sm:text-2xl text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed select-none">
              {antiWaste.quranAyah.arabic}
            </p>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mt-2 font-malayalam">
              {antiWaste.quranAyah.surah}
            </p>
          </div>
          <p className="mt-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-malayalam leading-relaxed border-t border-emerald-500/20 pt-3">
            &ldquo;{antiWaste.quranAyah.meaningMl}&rdquo;
          </p>
        </div>

        {/* Hadith of the Fallen Morsel */}
        <div className="p-6 rounded-3xl bg-amber-950/15 dark:bg-amber-950/30 border border-amber-500/30 flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block mb-2 font-malayalam">
              താഴെ വീണ വറ്റിന്റെ പവിത്രത
            </span>
            <p className="font-arabic text-xl sm:text-2xl text-amber-900 dark:text-amber-200 font-medium leading-relaxed select-none">
              {antiWaste.fallenMorselHadith.arabic}
            </p>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 mt-2 font-malayalam">
              {antiWaste.fallenMorselHadith.narratorMl} • {antiWaste.fallenMorselHadith.reference}
            </p>
          </div>
          <p className="mt-4 text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-malayalam leading-relaxed border-t border-amber-500/20 pt-3">
            &ldquo;{antiWaste.fallenMorselHadith.meaningMl}&rdquo;
          </p>
        </div>
      </div>

      {/* Global Starvation Reality Alert */}
      <div className="mb-12 p-6 rounded-3xl bg-gradient-to-r from-red-500/10 via-amber-500/10 to-red-500/10 dark:from-red-950/30 dark:via-amber-950/20 dark:to-red-950/30 border border-red-500/30 flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
        <div className="w-16 h-16 rounded-2xl bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
          <HeartCrack className="w-8 h-8" />
        </div>
        <div className="flex-1">
          <div className="flex flex-wrap items-baseline gap-2 mb-1 justify-center sm:justify-start">
            <span className="text-2xl sm:text-3xl font-extrabold text-red-600 dark:text-red-400">
              {antiWaste.statisticsAlertMl.statNumber}
            </span>
            <span className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 font-malayalam">
              {antiWaste.statisticsAlertMl.statLabel}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-malayalam leading-relaxed">
            {antiWaste.statisticsAlertMl.detail}
          </p>
        </div>
      </div>

      {/* Interactive Anti-Waste Micro-Calculator */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1814] border border-gray-200 dark:border-white/10 shadow-lg">
        <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 font-malayalam">
          ഒരു വറ്റിന്റെ വില: കാമ്പസ് ഇംപാക്ട് കാൽക്കുലേറ്റർ
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-malayalam mb-6">
          ഒരു വിദ്യാർത്ഥി ഓരോ നേരം വെറും ഒരു ടേബിൾസ്പൂൺ ചോറ് ബാക്കിവെച്ചാൽ പോലും ഉണ്ടാകുന്ന ഞെട്ടിക്കുന്ന നഷ്ടം കാണുക:
        </p>

        {/* Slider */}
        <div className="max-w-xl mb-8">
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="student-slider" className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 font-malayalam">
              ചോറ് പാഴാക്കുന്ന വിദ്യാർത്ഥികളുടെ എണ്ണം:
            </label>
            <span className="text-sm font-extrabold text-red-600 dark:text-red-400 bg-red-500/10 px-2.5 py-0.5 rounded-lg border border-red-500/30">
              {studentCount} വിദ്യാർത്ഥികൾ
            </span>
          </div>
          <input
            id="student-slider"
            type="range"
            min="10"
            max="300"
            step="10"
            value={studentCount}
            onChange={handleSliderChange}
            className="w-full h-3 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-red-600"
          />
        </div>

        {/* Real-time Calculation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-red-50/80 dark:bg-red-950/20 border border-red-500/30 text-center">
            <Scale className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto mb-2" />
            <span className="text-2xl sm:text-3xl font-extrabold text-red-700 dark:text-red-300 block">
              {monthlyKgWasted} kg
            </span>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-malayalam mt-1 block">
              പ്രതിമാസം പാഴാകുന്ന അരി
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-500/30 text-center">
            <Users className="w-6 h-6 text-amber-600 dark:text-amber-400 mx-auto mb-2" />
            <span className="text-2xl sm:text-3xl font-extrabold text-amber-700 dark:text-amber-300 block">
              {mealsWasted} വയറുകൾ
            </span>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-malayalam mt-1 block">
              വിശപ്പടക്കാമായിരുന്ന സമ്പൂർണ്ണ ഭക്ഷണങ്ങൾ
            </span>
          </div>

          <div className="p-5 rounded-2xl bg-sky-50/80 dark:bg-sky-950/20 border border-sky-500/30 text-center">
            <Droplet className="w-6 h-6 text-sky-600 dark:text-sky-400 mx-auto mb-2" />
            <span className="text-2xl sm:text-3xl font-extrabold text-sky-700 dark:text-sky-300 block">
              {waterWastedLiters.toLocaleString()} L
            </span>
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 font-malayalam mt-1 block">
              നെൽകൃഷിയിൽ പാഴായ ശുദ്ധജലം
            </span>
          </div>
        </div>

        <div className="mt-6 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
          <p className="text-xs sm:text-sm text-emerald-900 dark:text-emerald-200 font-malayalam font-semibold">
            &ldquo;തീൻമേശയിൽ പാത്രം തുടച്ചു കഴിക്കുന്നതോടെ ഈ മഹാപാപത്തിൽ നിന്ന് നമ്മുടെ കാമ്പസ് മോചിതമാകുന്നു.&rdquo;
          </p>
        </div>
      </div>
    </section>
  );
}
