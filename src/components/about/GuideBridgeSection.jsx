import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Compass,
  Printer,
  Sparkles,
  ArrowRight,
  Layers,
  Clock,
  Command,
  HelpCircle,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function GuideBridgeSection() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { feedback } = useFeedback();

  const QUICK_TOPICS = [
    {
      icon: Layers,
      titleEn: 'Color System Legend',
      titleMl: 'വർണ്ണ കോഡുകൾ (Color System)',
      descEn: 'Green for confirmed meal, red for leave, yellow for cutoff warning.',
      descMl: 'ഭക്ഷണ ഹാജർ പച്ച, അവധി ചുവപ്പ്, വാർണിംഗ് മഞ്ഞ നിറങ്ങളിൽ.',
    },
    {
      icon: Clock,
      titleEn: 'Cutoff Timings & Alarms',
      titleMl: 'കട്ട് ഓഫ് സമയങ്ങളും അലാറവും',
      descEn: 'Strict IST meal deadlines to calculate accurate dining rations.',
      descMl: 'ഓരോ നേരത്തെയും ഭക്ഷണ ക്രമീകരണത്തിനുള്ള അവസാന സമയം.',
    },
    {
      icon: Command,
      titleEn: 'Power Gestures & Shortcuts',
      titleMl: 'ഷോർട്ട്കട്ടുകളും ജെസ്ചറുകളും',
      descEn: 'Long press keycaps to inspect profiles, double tap to toggle.',
      descMl: 'കീക്യാപ്പിൽ ലോങ്ങ് പ്രസ്സ് ചെയ്ത് വിവരങ്ങൾ പരിശോധിക്കാം.',
    },
  ];

  return (
    <section id="guide-bridge" className="scroll-mt-24 space-y-6">
      {/* High-Impact Hero Bridge Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-900 via-teal-950 to-slate-950 text-white p-6 sm:p-10 shadow-2xl border border-emerald-500/30">
        <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-emerald-300">
            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
            <span>{lang === 'ml' ? 'സമഗ്ര യൂസർ ഗൈഡ് & visual മാനുവൽ' : 'Comprehensive Visual User Manual'}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-teal-100 to-amber-200">
            {lang === 'ml'
              ? 'അഡ്സ ടി-ബോർഡ് എങ്ങനെ ഉപയോഗിക്കാം? (How to Use)'
              : 'How to Master the ADSA T-Board System?'}
          </h2>

          <p className="text-xs sm:text-base text-emerald-100/90 leading-relaxed">
            {lang === 'ml'
              ? 'ടോക്കൺ മാറ്റങ്ങൾ, അവധി അപേക്ഷകൾ, ഡയറ്ററി മാറ്റങ്ങൾ, അടുക്കള നിർദ്ദേശങ്ങൾ, കീബോർഡ് ഷോർട്ട്കട്ടുകൾ എന്നിവ വിശദമായി പഠിക്കാൻ ഞങ്ങളുടെ ഇന്ററാക്ടീവ് ഗൈഡ് സന്ദർശിക്കുക.'
              : 'Detailed step-by-step documentation, tactile token simulators, cutoff countdown schedules, color codes, and printable PDFs for students and staff.'}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => {
                feedback('pop');
                navigate('/guide');
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/40 transition-all active:scale-95 group"
            >
              <Compass className="w-4 h-4 text-amber-300" />
              <span>{lang === 'ml' ? 'യൂസർ ഗൈഡ് തുറക്കുക' : 'Open System Guide & Tour'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              type="button"
              onClick={() => {
                feedback('tick');
                navigate('/adab');
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs sm:text-sm font-bold transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{lang === 'ml' ? 'ഭക്ഷണ മര്യാദകൾ (Dining Ethics)' : 'Dining Ethics Sanctuary'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Topic Preview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {QUICK_TOPICS.map((topic, idx) => {
          const IconComp = topic.icon;
          return (
            <div
              key={idx}
              onClick={() => {
                feedback('tick');
                navigate('/guide');
              }}
              className="p-4 rounded-2xl bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm hover:border-emerald-500/40 transition-all cursor-pointer flex items-start gap-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                <IconComp className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {lang === 'ml' ? topic.titleMl : topic.titleEn}
                </h4>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed">
                  {lang === 'ml' ? topic.descMl : topic.descEn}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

