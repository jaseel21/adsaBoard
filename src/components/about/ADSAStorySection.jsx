import React from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Compass,
  Sparkles,
  ShieldCheck,
  Coffee,
  Laptop,
  PenTool,
  Library,
  Target,
  HeartHandshake,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function ADSAStorySection({ adsaData }) {
  const { lang } = useLanguage();
  const { feedback } = useFeedback();

  if (!adsaData) return null;

  const heading =
    lang === 'ml' ? adsaData.headingMl || adsaData.headingEn : adsaData.headingEn || adsaData.headingMl;
  const tagline =
    lang === 'ml' ? adsaData.taglineMl || adsaData.taglineEn : adsaData.taglineEn || adsaData.taglineMl;
  const story =
    lang === 'ml' ? adsaData.storyMl || adsaData.storyEn : adsaData.storyEn || adsaData.storyMl;
  const mission =
    lang === 'ml' ? adsaData.missionMl || adsaData.missionEn : adsaData.missionEn || adsaData.missionMl;

  const WING_ICONS = {
    ShieldCheck: ShieldCheck,
    Coffee: Coffee,
    Sparkles: Sparkles,
    Laptop: Laptop,
    PenTool: PenTool,
    Library: Library,
  };

  return (
    <section id="adsa-story" className="scroll-mt-24 space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-950/50 border border-teal-300 dark:border-teal-500/30 text-teal-800 dark:text-teal-300 text-xs font-bold uppercase tracking-wider">
          <Users className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
          <span>{lang === 'ml' ? 'വിദ്യാർത്ഥി പ്രസ്ഥാനം' : 'Student Association'}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          {heading}
        </h2>
        <p className="text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400">
          {tagline}
        </p>
      </div>

      {/* Main Story & Mission Split Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-5xl mx-auto">
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-300 flex items-center justify-center font-black">
              ADSA
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100">
                {lang === 'ml' ? 'അഡ്സയുടെ കർമ്മപഥം' : 'The Legacy of ADSA'}
              </h3>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Alathurpadi Dars Students Association
              </div>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
            {story}
          </p>
        </div>

        <div className="lg:col-span-5 p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-teal-900 via-emerald-950 to-slate-900 text-white border border-teal-500/30 shadow-lg space-y-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-teal-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider">
            <Target className="w-4 h-4" />
            <span>{lang === 'ml' ? 'ലക്ഷ്യവും ദൗത്യവും (Mission)' : 'Institutional Mission'}</span>
          </div>
          <p className="text-xs sm:text-sm text-teal-100/90 leading-relaxed italic">
            &quot;{mission}&quot;
          </p>
          <div className="pt-2 flex items-center gap-2 text-[11px] font-semibold text-teal-300/80">
            <HeartHandshake className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ml' ? 'വിദ്യാർത്ഥി സ്വയംഭരണവും സേവനവും' : 'Student Self-Governance & Service'}</span>
          </div>
        </div>
      </div>

      {/* Functional Wings Bento Grid */}
      <div className="max-w-5xl mx-auto space-y-3 pt-2">
        <div className="text-center sm:text-left text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {lang === 'ml' ? 'അഡ്സയുടെ പ്രധാന വിഭാഗങ്ങൾ (Wings of ADSA):' : 'Key Organizational Wings of ADSA:'}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(adsaData.wings || []).map((wing) => {
            const IconComp = WING_ICONS[wing.icon] || Compass;
            const name = lang === 'ml' ? wing.nameMl : wing.nameEn;
            return (
              <motion.div
                key={wing.id}
                whileHover={{ y: -3 }}
                onClick={() => feedback('tick')}
                className="p-3.5 rounded-2xl bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm hover:border-emerald-500/40 text-center space-y-2 cursor-pointer transition-all"
              >
                <div className="w-9 h-9 mx-auto rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <IconComp className="w-4 h-4" />
                </div>
                <div className="text-[11px] sm:text-xs font-bold text-gray-800 dark:text-gray-200 line-clamp-2">
                  {name}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

