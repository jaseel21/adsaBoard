import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  Clock,
  ChefHat,
  AlertCircle,
  Smartphone,
  Radio,
  Sparkles,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function PlatformFeaturesSection({ featuresList }) {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const { feedback } = useFeedback();

  if (!featuresList || featuresList.length === 0) return null;

  const ICONS_MAP = {
    LayoutGrid: LayoutGrid,
    Clock: Clock,
    ChefHat: ChefHat,
    AlertCircle: AlertCircle,
    Smartphone: Smartphone,
    Radio: Radio,
  };

  return (
    <section id="features-grid" className="scroll-mt-24 space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>{lang === 'ml' ? 'പ്രധാന സവിശേഷതകൾ' : 'Platform Capabilities'}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          {lang === 'ml' ? 'അഡ്സ ടി-ബോർഡ് ഫീച്ചറുകൾ' : 'ADSA T-Board Features'}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          {lang === 'ml'
            ? 'വിദ്യാർത്ഥികൾക്കും പാചകക്കാർക്കും അഡ്മിൻമാർക്കും ഒരുപോലെ ഉപകാരപ്രദമായ അത്യാധുനിക സംവിധാനങ്ങൾ'
            : 'Cutting-edge engineering empowering campus diners, kitchen chefs, and administrators seamlessly.'}
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
        {featuresList.map((feature, idx) => {
          const IconComp = ICONS_MAP[feature.iconName] || Sparkles;
          const title =
            lang === 'ml'
              ? feature.titleMl || feature.titleEn
              : feature.titleEn || feature.titleMl;
          const desc =
            lang === 'ml'
              ? feature.descriptionMl || feature.descriptionEn
              : feature.descriptionEn || feature.descriptionMl;

          return (
            <motion.div
              key={feature.id || idx}
              whileHover={{ y: -4 }}
              onClick={() => {
                feedback('pop');
                if (feature.routePath) {
                  navigate(feature.routePath);
                }
              }}
              className="p-6 rounded-3xl bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm hover:shadow-xl dark:hover:shadow-emerald-950/40 transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden"
            >
              {/* Top Accent line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 to-teal-400 opacity-60 group-hover:opacity-100 transition-opacity" />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <IconComp className="w-6 h-6" />
                  </div>
                  {feature.badgeText && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-500/20">
                      {feature.badgeText}
                    </span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {desc}
                  </p>
                </div>
              </div>

              {feature.routePath && (
                <div className="pt-4 flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 transition-transform">
                  <span>{lang === 'ml' ? 'തുറക്കുക' : 'Launch Feature'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

