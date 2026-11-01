import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Layers,
  Clock,
  ShieldCheck,
  Utensils,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function TBoardOriginSection({ tboardData }) {
  const { lang } = useLanguage();
  const { feedback } = useFeedback();
  const [activeTab, setActiveTab] = useState('modern'); // 'legacy' vs 'modern'

  if (!tboardData) return null;

  const heading =
    lang === 'ml' ? tboardData.headingMl || tboardData.headingEn : tboardData.headingEn || tboardData.headingMl;
  const summary =
    lang === 'ml' ? tboardData.summaryMl || tboardData.summaryEn : tboardData.summaryEn || tboardData.summaryMl;

  return (
    <section id="tboard-story" className="scroll-mt-24 space-y-8">
      {/* Header */}
      <div className="flex flex-col items-center text-center max-w-3xl mx-auto space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
          <Activity className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>{lang === 'ml' ? 'ഡിജിറ്റൽ സാങ്കേതിക വിപ്ലവം' : 'Digital Innovation'}</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          {heading}
        </h2>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
          {summary}
        </p>
      </div>

      {/* Before vs After Interactive Comparison */}
      <div className="max-w-4xl mx-auto space-y-4">
        {/* Toggle Switch */}
        <div className="flex items-center justify-center gap-2 p-1.5 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 w-fit mx-auto">
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              setActiveTab('legacy');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'legacy'
                ? 'bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/30 shadow-sm'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {lang === 'ml' ? 'പഴയ രീതി (Legacy Mess Era)' : 'The Legacy Token System'}
          </button>
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              setActiveTab('modern');
            }}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'modern'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
            }`}
          >
            {lang === 'ml' ? 'അഡ്സ ടി-ബോർഡ് (Modern T-Board)' : 'Modern ADSA T-Board Era'}
          </button>
        </div>

        {/* Display Card */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`p-6 sm:p-8 rounded-3xl border shadow-xl relative overflow-hidden ${
            activeTab === 'legacy'
              ? 'bg-gradient-to-br from-red-950/20 via-slate-900 to-black border-red-500/20 text-gray-200'
              : 'bg-gradient-to-br from-emerald-950/60 via-teal-950/60 to-slate-950 border-emerald-500/30 text-white'
          }`}
        >
          {activeTab === 'legacy' ? (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold">
                <XCircle className="w-3.5 h-3.5" />
                <span>{lang === 'ml' ? 'പഴയ വെല്ലുവിളികൾ' : 'Legacy Inefficiencies'}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-red-200">
                {lang === 'ml'
                  ? 'പ്ലാസ്റ്റിക് ടോക്കണുകളും കണക്കിലെ പിഴവുകളും'
                  : 'Lost Plastic Tokens, Guesswork, & Food Waste'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-gray-300">
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {lang === 'ml'
                      ? 'ടോക്കണുകൾ നഷ്ടപ്പെടലും ദുരുപയോഗവും'
                      : 'Physical tokens frequently lost or misplaced'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {lang === 'ml'
                      ? 'പാചകക്കാർക്ക് കൃത്യമായ എണ്ണം മുൻകൂട്ടി അറിയാൻ കഴിയാത്ത അവസ്ഥ'
                      : 'Cooks had to guess portions, leading to severe food surplus'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {lang === 'ml'
                      ? 'അവധിയും മീൽ ക്യാൻസലേഷനും നേരിട്ട് രേഖപ്പെടുത്താൻ ബുദ്ധിമുട്ട്'
                      : 'Tedious manual register entries for leaves and meal overrides'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {lang === 'ml'
                      ? 'ഡയറ്ററി അലർജികൾ ട്രാക്ക് ചെയ്യാൻ പ്രയാസം'
                      : 'No centralized system for medical diets and avoiders'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{lang === 'ml' ? 'ആധുനിക പരിഹാരം' : 'The Next-Gen Solution'}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-emerald-100">
                {lang === 'ml'
                  ? 'തത്സമയ കണക്കെടുപ്പും 100% അന്നസംരക്ഷണവും'
                  : 'Real-Time Sync, Zero Guesswork & Complete Sustainability'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs sm:text-sm text-emerald-100/90">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {lang === 'ml'
                      ? 'ഡിജിറ്റൽ ടാക്ടൈൽ കീക്യാപ്പ് ബോർഡിലൂടെ അതിവേഗ പരിശോധന'
                      : 'Instant token validation via ergonomic keycap matrix'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {lang === 'ml'
                      ? 'അടുക്കളയിലെ KDS സ്ക്രീനിൽ കൃത്യമായ എണ്ണം ലൈവായി ലഭിക്കുന്നു'
                      : 'Real-time kitchen display screens displaying exact portions'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {lang === 'ml'
                      ? 'വിദ്യാർത്ഥികൾക്ക് സ്വന്തമായി ഫോണിലൂടെ അവധി രേഖപ്പെടുത്താം'
                      : 'Self-service mobile portal for meal overrides and exceptions'}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>
                    {lang === 'ml'
                      ? 'ഡയറ്ററി അവോയ്ഡേഴ്സ് മാട്രിക്സ് പ്രിന്റബിൾ ഷീറ്റുകൾ'
                      : 'Automated medical avoiders sheets and kitchen alerts'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Highlights 3-Card Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-5xl mx-auto pt-2">
        {(tboardData.highlights || []).map((h, idx) => (
          <div
            key={idx}
            className="p-5 rounded-3xl bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm space-y-2 text-center sm:text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto sm:mx-0">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <h4 className="text-base font-bold text-gray-900 dark:text-gray-100">
              {lang === 'ml' ? h.titleMl : h.titleEn}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
              {lang === 'ml' ? h.descMl : h.descEn}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

