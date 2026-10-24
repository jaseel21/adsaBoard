import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import ApexLinkPreview from '../preview/ApexLinkPreview';

export default function DarsCalligraphyBanner() {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();

  return (
    <div className="relative w-full pt-8 pb-6 px-4 flex flex-col items-center justify-center text-center overflow-hidden select-none">
      {/* Ambient Radial Backlights */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 max-w-2xl h-36 bg-gradient-to-r from-emerald-500/10 via-teal-500/15 dark:via-emerald-400/20 to-emerald-500/10 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -top-6 left-1/2 -translate-x-1/2 w-48 h-20 bg-amber-400/10 dark:bg-amber-300/15 rounded-full blur-2xl pointer-events-none"
        aria-hidden="true"
      />

      {/* Interactive Calligraphy Artwork Link */}
      <ApexLinkPreview url="https://alathurpadidars.in/">
        <motion.a
          href="https://alathurpadidars.in/"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => feedback('pop')}
          whileHover={{ scale: 1.025, y: -2 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          className="group relative inline-flex flex-col items-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-3xl p-3 sm:p-4"
          title="Alathurpadi Dars - Official Portal"
          aria-label="Alathurpadi Dars Calligraphic Crest and Official Website"
        >
          {/* Top Classical Monogram Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold tracking-wider uppercase mb-3 shadow-sm backdrop-blur-md">
            <Sparkles className="w-3 h-3 text-amber-500 dark:text-amber-400 animate-pulse" />
            <span>{lang === 'ml' ? 'ആലത്തൂർപടി ദർസ്' : 'Alathurpadi Dars'}</span>
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            <span className="font-mono text-[10px] opacity-80">Est. Heritage</span>
          </div>

          {/* Calligraphy Vector Artwork with Dual-Theme Mask & Luminous Sheen */}
          <div className="relative w-full flex items-center justify-center">
            {/* Ambient drop shadow layer behind calligraphy */}
            <div
              className="w-[280px] sm:w-[420px] md:w-[560px] max-w-[90vw] h-16 sm:h-24 md:h-28 transition-all duration-300"
              style={{
                maskImage: "url('/dars-typo.svg')",
                WebkitMaskImage: "url('/dars-typo.svg')",
                maskRepeat: 'no-repeat',
                WebkitMaskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskPosition: 'center',
                maskSize: 'contain',
                WebkitMaskSize: 'contain',
              }}
            >
              <div className="w-full h-full bg-gradient-to-r from-emerald-950 via-teal-900 to-emerald-950 dark:from-emerald-200 dark:via-teal-100 dark:to-amber-200 group-hover:from-emerald-800 group-hover:via-emerald-600 group-hover:to-teal-800 dark:group-hover:from-emerald-300 dark:group-hover:via-white dark:group-hover:to-amber-300 transition-colors duration-500" />
            </div>

            {/* Subtle glow border that flares on hover */}
            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none flex items-center justify-center">
              <div className="w-3/4 h-8 bg-emerald-400/25 blur-xl rounded-full" />
            </div>
          </div>

          {/* Classical Inscription & Subtitles */}
          <div className="mt-3 flex flex-col items-center gap-1">
            <p className="text-xs sm:text-sm font-medium text-gray-700 dark:text-emerald-100/90 tracking-wide font-sans">
              {t('footerDarsMotto', 'Seat of Classical Scholarship & Community Distinction')}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 font-normal">
              {t('historicalNote', 'Historical Alathurpadi Juma Masjid, Melmuri, Malappuram, Kerala')}
            </p>
          </div>
        </motion.a>
      </ApexLinkPreview>

      {/* Decorative Ornate Horizontal Rule */}
      <div className="w-full max-w-4xl mx-auto mt-4 flex items-center justify-center gap-3 px-6" aria-hidden="true">
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gray-300 dark:via-white/10 to-transparent" />
        <div className="flex items-center gap-1.5 text-emerald-500 dark:text-emerald-400 opacity-60">
          <div className="w-1.5 h-1.5 rotate-45 border border-current" />
          <ShieldCheck className="w-3.5 h-3.5" />
          <div className="w-1.5 h-1.5 rotate-45 border border-current" />
        </div>
        <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-gray-300 dark:via-white/10 to-transparent" />
      </div>
    </div>
  );
}
