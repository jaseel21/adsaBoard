import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  BookOpen,
  GraduationCap,
  Users,
  Utensils,
  Activity,
  Clock,
  ChevronDown,
  Compass,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function AboutHero({ meta, stats, onNavigateSection }) {
  const { lang, t } = useLanguage();
  const { feedback } = useFeedback();

  const hero = meta?.hero || {};

  const title = lang === 'ml' ? hero.titleMl || hero.titleEn : hero.titleEn || hero.titleMl;
  const subtitle =
    lang === 'ml' ? hero.subtitleMl || hero.subtitleEn : hero.subtitleEn || hero.subtitleMl;
  const badge =
    lang === 'ml' ? hero.badgeMl || hero.badgeEn : hero.badgeEn || hero.badgeMl;

  const NAV_ANCHORS = [
    { id: 'dars-ethos', labelEn: 'Dars Ethos', labelMl: 'ദർസ് പാരമ്പര്യം', icon: BookOpen },
    { id: 'mudarrisun', labelEn: 'Mudarrisun', labelMl: 'മുദരിസുമാർ', icon: GraduationCap },
    { id: 'adsa-story', labelEn: 'ADSA Association', labelMl: 'അഡ്സ (ADSA)', icon: Users },
    { id: 'central-committee', labelEn: 'Central Committee', labelMl: 'സെൻട്രൽ കമ്മിറ്റി', icon: Compass },
    { id: 'canteen-wing', labelEn: 'Canteen Wing', labelMl: 'കാന്റീൻ വിംഗ്', icon: Utensils },
    { id: 'specialized-wings', labelEn: 'Committees', labelMl: 'സബ് കമ്മിറ്റികൾ', icon: Sparkles },
    { id: 'tboard-story', labelEn: 'T-Board Origin', labelMl: 'ടി-ബോർഡ്', icon: Activity },
    { id: 'features-grid', labelEn: 'Features', labelMl: 'ഫീച്ചറുകൾ', icon: Sparkles },
    { id: 'guide-bridge', labelEn: 'How to Use', labelMl: 'യൂസർ ഗൈഡ്', icon: BookOpen },
  ];

  return (
    <div className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-emerald-950 via-[#072418] to-slate-950 text-white shadow-2xl border border-emerald-500/20 backdrop-blur-2xl p-6 sm:p-10 lg:p-14">
      {/* Ambient background glowing orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-teal-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Decorative Islamic geometric background subtle watermark */}
      <div
        className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none bg-repeat"
        style={{
          backgroundImage: `radial-gradient(circle at 25px 25px, white 2%, transparent 0%), radial-gradient(circle at 75px 75px, white 2%, transparent 0%)`,
          backgroundSize: '100px 100px',
        }}
      />

      <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
        {/* Sacred Badge Pill */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm font-semibold shadow-inner backdrop-blur-md"
        >
          <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
          <span>{badge}</span>
        </motion.div>

        {/* Hero Title */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-3"
        >
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-emerald-100 via-teal-100 to-amber-200">
            {title}
          </h1>
          <p className="text-sm sm:text-lg lg:text-xl text-emerald-100/80 font-normal leading-relaxed max-w-2xl mx-auto">
            {subtitle}
          </p>
        </motion.div>

        {/* Location & Website Pill links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 text-xs font-medium text-emerald-200/70"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/5 border border-white/10">
            <span>📍 {lang === 'ml' ? hero.locationMl : hero.locationEn}</span>
          </span>
          {hero.officialWebsite && (
            <a
              href={hero.officialWebsite}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => feedback('pop')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-400/30 text-emerald-200 transition-all active:scale-95"
            >
              <ExternalLink className="w-3.5 h-3.5 text-amber-300" />
              <span>{t('officialWebsite', 'alathurpadidars.in')}</span>
            </a>
          )}
        </motion.div>

        {/* Dynamic Key Metric Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2"
        >
          {(stats || []).map((stat) => (
            <div
              key={stat.id}
              className="p-3 sm:p-4 rounded-2xl bg-white/5 border border-emerald-500/20 backdrop-blur-md hover:bg-white/10 transition-all text-center group"
            >
              <div className="text-xl sm:text-3xl font-black text-amber-300 group-hover:scale-105 transition-transform">
                {stat.value}
              </div>
              <div className="text-[11px] sm:text-xs font-semibold text-emerald-100/90 mt-1 line-clamp-2">
                {lang === 'ml' ? stat.labelMl || stat.labelEn : stat.labelEn || stat.labelMl}
              </div>
            </div>
          ))}
        </motion.div>

        {/* Quick-Jump Section Anchor Pills */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="pt-4 border-t border-emerald-500/15"
        >
          <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-400/80 mb-2.5">
            {lang === 'ml' ? 'ദ്രുത നാവിഗേഷൻ (Quick Jumps)' : 'Direct Section Navigation'}
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {NAV_ANCHORS.map((item) => {
              const IconComp = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    onNavigateSection(item.id);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 border border-white/10 hover:border-emerald-500/40 text-xs font-semibold text-emerald-100 hover:text-white transition-all active:scale-95 shadow-sm"
                >
                  <IconComp className="w-3.5 h-3.5 text-amber-400" />
                  <span>{lang === 'ml' ? item.labelMl : item.labelEn}</span>
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

