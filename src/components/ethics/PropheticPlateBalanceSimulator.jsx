import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Scale,
  Sparkles,
  AlertTriangle,
  HeartPulse,
  Brain,
  CheckCircle2,
  Info,
} from 'lucide-react';
import { SACRED_ETHICS_DATA } from '../../data/diningEthicsContent';
import { useFeedback } from '../../utils/useFeedback';

export default function PropheticPlateBalanceSimulator() {
  const { moderationAndHealth } = SACRED_ETHICS_DATA;
  const { feedback } = useFeedback();

  // Slider controls Food percentage (from 15% to 85%)
  const [foodPercent, setFoodPercent] = useState(33);

  // Derive water and air dynamically
  const remaining = 100 - foodPercent;
  const waterPercent = Math.round(remaining * 0.5);
  const airPercent = 100 - foodPercent - waterPercent;

  const handleSliderChange = (e) => {
    const val = parseInt(e.target.value, 10);
    setFoodPercent(val);
    if (val === 33) {
      feedback('success');
    } else {
      feedback('tick');
    }
  };

  // Determine health & spiritual status
  const isOptimal = foodPercent >= 30 && foodPercent <= 36;
  const isOvereating = foodPercent > 50;
  const isExtremeOvereating = foodPercent >= 70;
  const isStarvation = foodPercent < 25;

  return (
    <section id="plate-balance" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3">
          <Scale className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{moderationAndHealth.sectionTagMl}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white font-malayalam tracking-tight">
          {moderationAndHealth.titleMl}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 font-malayalam max-w-2xl mx-auto">
          തിരുനബി ﷺ ഉപദേശിച്ച പവിത്രമായ സമതുലിതാവസ്ഥ: വയറിനെ മൂന്നായി ഭാഗിച്ച് ആരോഗ്യവും ആത്മീയ വെളിച്ചവും നിലനിർത്തുക.
        </p>
      </div>

      {/* Central Prophetic Hadith Banner */}
      <div className="mb-10 p-5 sm:p-6 rounded-3xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 text-center">
        <p className="font-arabic text-lg sm:text-2xl text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed select-none">
          {moderationAndHealth.hadith.arabic}
        </p>
        <p className="text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 font-medium mt-2 font-malayalam">
          {moderationAndHealth.hadith.narratorMl} • {moderationAndHealth.hadith.reference}
        </p>
        <p className="mt-3 text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-malayalam max-w-3xl mx-auto">
          &ldquo;{moderationAndHealth.hadith.meaningMl}&rdquo;
        </p>
      </div>

      {/* The Interactive Simulator Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1814] border border-gray-200 dark:border-white/10 shadow-lg">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Visual Belly Balance Plate Display */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full border-4 border-gray-200 dark:border-white/10 p-3 shadow-inner flex items-center justify-center bg-gray-50 dark:bg-black/20">
              {/* Dynamic 3-Part Belly Stack Visualization */}
              <div className="w-full h-full rounded-full overflow-hidden flex flex-col shadow-sm">
                {/* Air Segment (Top) */}
                <motion.div
                  animate={{ height: `${airPercent}%` }}
                  transition={{ duration: 0.3 }}
                  className="w-full bg-slate-200 dark:bg-slate-700/60 flex items-center justify-center text-[11px] font-bold text-slate-700 dark:text-slate-200 transition-colors"
                >
                  ശ്വാസം: {airPercent}%
                </motion.div>

                {/* Water Segment (Middle) */}
                <motion.div
                  animate={{ height: `${waterPercent}%` }}
                  transition={{ duration: 0.3 }}
                  className="w-full bg-sky-400/80 dark:bg-sky-600/70 flex items-center justify-center text-[11px] font-bold text-white transition-colors"
                >
                  വെള്ളം: {waterPercent}%
                </motion.div>

                {/* Food Segment (Bottom) */}
                <motion.div
                  animate={{ height: `${foodPercent}%` }}
                  transition={{ duration: 0.3 }}
                  className={`w-full flex items-center justify-center text-[11px] font-bold text-white transition-colors ${
                    isOptimal
                      ? 'bg-emerald-600'
                      : isExtremeOvereating
                      ? 'bg-red-600'
                      : isOvereating
                      ? 'bg-amber-600'
                      : 'bg-teal-500'
                  }`}
                >
                  ഭക്ഷണം: {foodPercent}%
                </motion.div>
              </div>

              {/* Center Status Glow Dot */}
              <div
                className={`absolute w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white dark:border-[#0c1814] ${
                  isOptimal ? 'bg-emerald-500 ring-4 ring-emerald-500/20' : isExtremeOvereating ? 'bg-red-500' : 'bg-amber-500'
                }`}
              >
                <Scale className="w-4 h-4" />
              </div>
            </div>

            {/* Reset to 1/3 Prophetic Balance Button */}
            <button
              type="button"
              onClick={() => {
                feedback('success');
                setFoodPercent(33);
              }}
              className="mt-4 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>തിരുസുന്നത്ത് 33% സമതുലിതാവസ്ഥയിലേക്ക് റീസെറ്റ് ചെയ്യുക</span>
            </button>
          </div>

          {/* Interactive Controls & Real-time Impact Assessment */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="belly-slider" className="text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 font-malayalam">
                  വയറ്റിലെ ഭക്ഷണത്തിന്റെ അളവ് തിരഞ്ഞെടുക്കുക:
                </label>
                <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/30">
                  {foodPercent}%
                </span>
              </div>

              <input
                id="belly-slider"
                type="range"
                min="15"
                max="85"
                value={foodPercent}
                onChange={handleSliderChange}
                className="w-full h-3 bg-gray-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-600"
              />

              <div className="flex justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400 mt-1 font-malayalam">
                <span>15% (പട്ടിണി)</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">33% (സുന്നത്ത്)</span>
                <span>85% (അമിതഭക്ഷണം)</span>
              </div>
            </div>

            {/* Dynamic Real-time Status Card */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isOptimal
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-500/40'
                  : isExtremeOvereating
                  ? 'bg-red-50/80 dark:bg-red-950/30 border-red-500/40'
                  : isOvereating
                  ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-500/40'
                  : 'bg-teal-50/80 dark:bg-teal-950/30 border-teal-500/40'
              }`}
            >
              {isOptimal && (
                <div>
                  <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-sm mb-1 font-malayalam">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                    <h4>തിരുസുന്നത്ത് അനുസരിച്ചുള്ള സ്വർണ്ണ അനുപാതം! (Optimal Sunnah Balance)</h4>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-malayalam leading-relaxed">
                    നട്ടെല്ല് നിവർന്നു നിൽക്കാനും, ക്ലാസിലും കിതാബ് വായനയിലും അതീവ ഏകാഗ്രത ലഭിക്കാനും, ഇബാദത്തുകൾ ഉന്മേഷത്തോടെ നിർവ്വഹിക്കാനും തിരുദൂതർ ﷺ നിർദ്ദേശിച്ച സുവർണ്ണ മാർഗ്ഗമാണിത്.
                  </p>
                </div>
              )}

              {isOvereating && (
                <div>
                  <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-bold text-sm mb-1 font-malayalam">
                    <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <h4>അമിതഭക്ഷണത്തിന്റെ മുന്നറിയിപ്പ് (Overeating Alert)</h4>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-malayalam leading-relaxed">
                    വയർ നിറയെ കഴിക്കുന്നത് ഖസ്‌വത്തുൽ ഖൽബിന് (ഹൃദയകാഠിന്യം) കാരണമാകും. കിതാബ് വായനയിലും തഹജ്ജുദിലും ഉറക്കം തൂങ്ങാനും ആലസ്യത്തിനും ഇടയാക്കും.
                  </p>
                </div>
              )}

              {isStarvation && (
                <div>
                  <div className="flex items-center gap-2 text-teal-800 dark:text-teal-300 font-bold text-sm mb-1 font-malayalam">
                    <Info className="w-4 h-4 text-teal-600 dark:text-teal-400 flex-shrink-0" />
                    <h4>അകാരണമായി ഭക്ഷണം ഉപേക്ഷിക്കരുത് (Avoid Skipping Meals)</h4>
                  </div>
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-malayalam leading-relaxed">
                    &lsquo;രുചിയില്ല&rsquo;, അല്ലെങ്കിൽ &lsquo;കഴിക്കാൻ മൂഡില്ല&rsquo; എന്ന് പറഞ്ഞ് ഭക്ഷണം ഒഴിവാക്കുന്നത് തെറ്റാണ്. പഠനത്തിനും ശരീരത്തിനും ഊർജ്ജം ആവശ്യമാണ്; ശരീരം അല്ലാഹുവിന്റെ അമാനത്താണ്.
                  </p>
                </div>
              )}
            </div>

            {/* Quick 2-Column Insight Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-malayalam">
              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-gray-100 mb-1">
                  <Brain className="w-3.5 h-3.5 text-indigo-500" />
                  <span>മനസ്സിന്റെ ഏകാഗ്രത</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-normal">
                  മിതമായ അളവിൽ കഴിക്കുമ്പോൾ തലച്ചോറിലേക്ക് കൃത്യമായി രക്തയോട്ടമുണ്ടാകുകയും ഹിഫ്ള് വർദ്ധിക്കുകയും ചെയ്യുന്നു.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                <div className="flex items-center gap-1.5 font-bold text-gray-900 dark:text-gray-100 mb-1">
                  <HeartPulse className="w-3.5 h-3.5 text-rose-500" />
                  <span>ശരീരത്തിന്റെ അവകാശം</span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 leading-normal">
                  ശരീരത്തിന് നൽകേണ്ട അവകാശം നൽകാതിരിക്കുന്നത് പാപമാണ്. കൃത്യസമയത്ത് അന്നം സ്വീകരിക്കുക.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
