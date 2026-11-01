import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Laptop,
  PenTool,
  Library,
  Users,
  Compass,
  CheckCircle2,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function CommitteesGridSection({ subCommittees }) {
  const { lang } = useLanguage();
  const { feedback } = useFeedback();

  if (!subCommittees || subCommittees.length === 0) return null;

  const ICONS_MAP = {
    Laptop: Laptop,
    Sparkles: Sparkles,
    PenTool: PenTool,
    Library: Library,
  };

  return (
    <section id="specialized-wings" className="scroll-mt-24 space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{lang === 'ml' ? 'വിഭാഗീയ സമിതികൾ' : 'Specialized Wings'}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          {lang === 'ml' ? 'അഡ്സ സബ് കമ്മിറ്റികൾ & വിംഗുകൾ' : 'ADSA Sub-Committees & Functional Wings'}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          {lang === 'ml'
            ? 'അക്കാദമിക്, മീഡിയ, സാഹിത്യം, ഗ്രന്ഥശാല പ്രവർത്തനങ്ങൾ ചിട്ടയായി നയിക്കുന്ന പ്രത്യേക സമിതികൾ'
            : 'Specialized wings driving scholastic excellence, software engineering, publications, and manuscript preservation.'}
        </p>
      </div>

      {/* Wings Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-5xl mx-auto">
        {subCommittees.map((wing, idx) => {
          const IconComp = ICONS_MAP[wing.icon] || Sparkles;
          const name = lang === 'ml' ? wing.nameMl || wing.nameEn : wing.nameEn || wing.nameMl;
          const lead = lang === 'ml' ? wing.leadMl || wing.leadEn : wing.leadEn || wing.leadMl;
          const desc =
            lang === 'ml'
              ? wing.descriptionMl || wing.descriptionEn
              : wing.descriptionEn || wing.descriptionMl;

          return (
            <motion.div
              key={wing.id || idx}
              whileHover={{ y: -3 }}
              onClick={() => feedback('tick')}
              className="p-6 rounded-3xl bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm hover:shadow-xl dark:hover:shadow-emerald-950/30 transition-all space-y-3 cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <IconComp className="w-6 h-6" />
                </div>
                {wing.memberCount && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-[11px] font-bold text-gray-600 dark:text-gray-400">
                    <Users className="w-3 h-3 text-emerald-500" />
                    <span>{wing.memberCount} members</span>
                  </span>
                )}
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {name}
                </h3>
                {lead && (
                  <div className="text-xs font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {lang === 'ml' ? 'നേതൃത്വം:' : 'Lead:'} {lead}
                  </div>
                )}
              </div>

              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {desc}
              </p>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

