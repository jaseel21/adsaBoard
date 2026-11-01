import React from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Heart,
  UtensilsCrossed,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function DarsHeritageSection({ ethosData }) {
  const { lang } = useLanguage();
  const { feedback } = useFeedback();

  if (!ethosData) return null;

  const heading =
    lang === 'ml' ? ethosData.headingMl || ethosData.headingEn : ethosData.headingEn || ethosData.headingMl;
  const summary =
    lang === 'ml' ? ethosData.summaryMl || ethosData.summaryEn : ethosData.summaryEn || ethosData.summaryMl;

  const ICONS_MAP = {
    BookOpen: BookOpen,
    Heart: Heart,
    UtensilsCrossed: UtensilsCrossed,
  };

  return (
    <section id="dars-ethos" className="scroll-mt-24 space-y-6">
      {/* Header Badge & Title */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <BookOpen className="w-3.5 h-3.5 text-amber-500" />
          <span>{lang === 'ml' ? 'പവിത്ര വൈജ്ഞാനിക പാരമ്പര്യം' : 'Sacred Heritage'}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          {heading}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          {summary}
        </p>
      </div>

      {/* 3 Core Heritage Pillars Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
        {(ethosData.pillars || []).map((pillar, idx) => {
          const IconComp = ICONS_MAP[pillar.icon] || BookOpen;
          const title = lang === 'ml' ? pillar.titleMl : pillar.titleEn;
          const desc = lang === 'ml' ? pillar.descMl : pillar.descEn;

          return (
            <motion.div
              key={pillar.id || idx}
              whileHover={{ y: -4 }}
              transition={{ duration: 0.2 }}
              onClick={() => feedback('tick')}
              className="p-6 rounded-3xl bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm hover:shadow-xl dark:hover:shadow-emerald-950/40 transition-all space-y-4 group relative overflow-hidden"
            >
              {/* Top Accent Gradient Border */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-amber-400 opacity-80" />

              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform shadow-sm">
                <IconComp className="w-6 h-6" />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {title}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

