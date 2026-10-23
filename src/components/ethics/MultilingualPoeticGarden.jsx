import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Feather,
  Sparkles,
  Volume2,
  Globe,
  Quote,
  Heart,
} from 'lucide-react';
import { SACRED_ETHICS_DATA } from '../../data/diningEthicsContent';
import { useFeedback } from '../../utils/useFeedback';

export default function MultilingualPoeticGarden() {
  const { poeticGarden } = SACRED_ETHICS_DATA;
  const { feedback } = useFeedback();

  const [activeLang, setActiveLang] = useState('all');

  const LANG_FILTERS = [
    { id: 'all', label: 'എല്ലാ കാവ്യങ്ങളും (All Poems)' },
    { id: 'arabic', label: 'അറബിക് (Arabic)' },
    { id: 'malayalam', label: 'മലയാളം (Malayalam)' },
    { id: 'urdu', label: 'ഉർദു (Urdu)' },
    { id: 'english', label: 'ലോക ജ്ഞാനം (Universal)' },
  ];

  const filteredPoems =
    activeLang === 'all'
      ? poeticGarden
      : poeticGarden.filter((p) => p.language === activeLang);

  return (
    <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-bold mb-3">
          <Feather className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>ബഹുഭാഷാ കാവ്യ വസന്തം</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white font-malayalam tracking-tight">
          കവിതകളിലും ദർശനങ്ങളിലും അന്നത്തിന്റെ മഹിമ
        </h2>
        <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 font-malayalam max-w-2xl mx-auto">
          അറബിയും മലയാളവും ഉർദുവും ഇംഗ്ലീഷും ഒത്തുചേരുന്ന ഹൃദയഹാരിയായ കാവ്യ മൊഴികൾ.
        </p>

        {/* Language Filter Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {LANG_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                feedback('tick');
                setActiveLang(f.id);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeLang === f.id
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-amber-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Poems Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredPoems.map((poem, idx) => (
            <motion.div
              key={poem.id}
              layout
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-amber-50/50 via-white to-amber-50/20 dark:from-[#13201a] dark:via-[#0e1713] dark:to-[#121c17] border border-amber-500/20 dark:border-amber-500/25 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-malayalam">
                    {poem.languageLabelMl}
                  </span>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 font-malayalam">
                    {poem.poetMl}
                  </span>
                </div>

                {/* Original Verses */}
                <div className="my-5 p-5 rounded-2xl bg-white/70 dark:bg-black/20 border border-amber-500/15">
                  <p
                    className={`whitespace-pre-line text-base sm:text-lg leading-relaxed select-none ${
                      poem.language === 'arabic'
                        ? 'font-arabic text-emerald-900 dark:text-emerald-200 text-right'
                        : poem.language === 'urdu'
                        ? 'font-arabic text-amber-900 dark:text-amber-200 text-right text-lg'
                        : 'font-malayalam text-gray-900 dark:text-gray-100 font-semibold'
                    }`}
                  >
                    {poem.linesOriginal}
                  </p>
                </div>

                {/* Malayalam Explanation */}
                <div className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-malayalam leading-relaxed">
                  <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                    ആത്മീയ സാരാംശം:
                  </span>
                  <p>{poem.translationMl}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-amber-500/15 flex items-center justify-end">
                <span className="text-[11px] text-gray-400 font-medium">
                  ADSA T-Board • Literary Sanctuary
                </span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </section>
  );
}
