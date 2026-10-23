import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChefHat,
  HeartHandshake,
  CheckCircle2,
  Sparkles,
  Droplets,
  Layers,
  Smile,
  ShieldAlert,
} from 'lucide-react';
import { SACRED_ETHICS_DATA } from '../../data/diningEthicsContent';
import { useFeedback } from '../../utils/useFeedback';

export default function KitchenAngelsSection() {
  const { kitchenSanctity } = SACRED_ETHICS_DATA;
  const { feedback } = useFeedback();

  // Track completed discipline points
  const [checkedRules, setCheckedRules] = useState({});

  const toggleRule = (idx) => {
    feedback('tick');
    setCheckedRules((prev) => ({
      ...prev,
      [idx]: !prev[idx],
    }));
  };

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold mb-3">
          <ChefHat className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>{kitchenSanctity.sectionTagMl}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white font-malayalam tracking-tight">
          {kitchenSanctity.titleMl}
        </h2>
        <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 font-malayalam max-w-2xl mx-auto">
          നൂറുകണക്കിന് സഹോദരങ്ങൾ ഒരേസമയം അന്നം കഴിക്കുന്ന കാമ്പസ് മെസ്സ് അച്ചടക്കത്തിന്റെയും പരസ്പര സ്നേഹത്തിന്റെയും സങ്കേതമായി മാറണം.
        </p>
      </div>

      {/* Tribute Card to Kitchen Staff / Khadimeen */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        className="mb-12 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 dark:from-amber-950/30 dark:via-emerald-950/20 dark:to-amber-950/30 border border-amber-500/30 flex flex-col md:flex-row items-center gap-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
          <Smile className="w-8 h-8" />
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white font-malayalam">
            അടുക്കളയിലെ കാവലാളുകളോട് നന്ദി പറയുക
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-malayalam leading-relaxed">
            സുബഹിക്ക് മുമ്പേ ഉറക്കമൊഴിഞ്ഞ് അടുപ്പിലെ പുകയിലും ചൂടിലും വെന്തുരുകി നമുക്കായി ഭക്ഷണം തയ്യാറാക്കുന്ന ജീവനക്കാരോട് നിറഞ്ഞ പുഞ്ചിരിയോടെയും സലാം ചൊല്ലിയും പെരുമാറുക. അവർ നമ്മെ സേവിക്കുന്നത് കൊണ്ടാണ് നാം ഇത്രയും ശാന്തമായി പഠിക്കുന്നത്.
          </p>
        </div>
      </motion.div>

      {/* 5 Rules of Mess Etiquette Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {kitchenSanctity.rules.map((rule, idx) => {
          const isChecked = Boolean(checkedRules[idx]);

          return (
            <motion.div
              key={rule.number}
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              onClick={() => toggleRule(idx)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between ${
                isChecked
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/20 border-emerald-500/40 shadow-xs'
                  : 'bg-white dark:bg-[#0c1814] border-gray-200 dark:border-white/10 hover:border-emerald-500/30'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    നിയമം {rule.number}
                  </span>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      isChecked
                        ? 'bg-emerald-600 text-white'
                        : 'border border-gray-300 dark:border-white/20 text-transparent'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                </div>

                <h4 className="font-bold text-sm sm:text-base text-gray-900 dark:text-white font-malayalam mb-2">
                  {rule.titleMl}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-malayalam leading-relaxed">
                  {rule.descMl}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 font-malayalam">
                <HeartHandshake className="w-3.5 h-3.5" />
                <span>{isChecked ? 'ഞാൻ ഇത് പാലിക്കുന്നുണ്ട്' : 'ഇത് പാലിക്കാൻ ക്ലിക്ക് ചെയ്യുക'}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
