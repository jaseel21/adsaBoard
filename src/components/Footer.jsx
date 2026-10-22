import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, ShieldCheck, Heart, Volume2, VolumeX, Sparkles, HeartHandshake } from 'lucide-react';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { motion } from 'framer-motion';
import ApexLinkPreview from './preview/ApexLinkPreview';

const Footer = () => {
  const { t, lang } = useLanguage();
  const { soundEnabled, setSoundEnabled, feedback } = useFeedback();
  const currentYear = new Date().getFullYear();

  const toggleSound = () => {
    feedback('pop');
    setSoundEnabled(!soundEnabled);
  };

  return (
    <footer className="relative mt-auto border-t border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-[#0b1210]/80 backdrop-blur-xl transition-colors duration-300">
      {/* Decorative top accent glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 max-w-3xl h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 dark:via-emerald-400/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 pb-[calc(2rem+env(safe-area-inset-bottom,0px))]">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-center">
          
          {/* Brand & Crest Column */}
          <div className="md:col-span-5 flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4">
            <ApexLinkPreview url="https://alathurpadidars.in/">
              <a
                href="https://alathurpadidars.in/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => feedback('pop')}
                className="group relative flex-shrink-0"
                title="Alathurpadi Dars Official Website"
              >
                <div className="w-16 h-16 rounded-2xl p-2 bg-gradient-to-br from-emerald-50 to-emerald-100/80 dark:from-emerald-950/60 dark:to-emerald-900/30 border border-emerald-200/60 dark:border-emerald-500/20 shadow-md group-hover:scale-105 group-hover:shadow-glow-emerald transition-all duration-300 flex items-center justify-center">
                  <img
                    src="https://alathurpadidars.in/wp-content/uploads/2019/08/Dars-Site-Logo1.png"
                    alt="Alathurpadi Dars Logo"
                    className="w-12 h-12 object-contain"
                    loading="lazy"
                  />
                </div>
                <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0b1210] flex items-center justify-center text-white">
                  <ShieldCheck className="w-3 h-3" />
                </span>
              </a>
            </ApexLinkPreview>

            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white tracking-tight">
                  {t('orgName')}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">
                {t('footerTagline')}
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center justify-center sm:justify-start gap-1">
                <Sparkles className="w-3 h-3" />
                {t('historicalNote')}
              </p>
            </div>
          </div>

          {/* Official Website Link Box */}
          <div className="md:col-span-4 flex flex-col items-center justify-center">
            <ApexLinkPreview url="https://alathurpadidars.in/">
              <a
                href="https://alathurpadidars.in/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => feedback('pop')}
                className="group inline-flex items-center gap-2.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-glow-emerald transform hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
              >
                <span>{t('officialWebsite')}</span>
                <span className="text-emerald-100 font-mono text-xs">alathurpadidars.in</span>
                <ExternalLink className="w-4 h-4 opacity-80 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
            </ApexLinkPreview>

            <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{t('systemStatus')}</span>
              </div>
              <span>•</span>
              <ApexLinkPreview url="/support">
                <Link
                  to="/support"
                  onClick={() => feedback('tick')}
                  className="hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold underline decoration-dotted transition-colors flex items-center gap-1"
                >
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('navSupport', 'Care & Support')}</span>
                </Link>
              </ApexLinkPreview>
            </div>
          </div>

          {/* Sound & Controls Column */}
          <div className="md:col-span-3 flex flex-col items-center md:items-end gap-2 text-center md:text-right">
            <button
              onClick={toggleSound}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 transition-colors"
              title={soundEnabled ? t('soundOn') : t('soundOff')}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('soundOn')}</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                  <span>{t('soundOff')}</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              {t('hapticsSound')}
            </span>
          </div>
        </div>

        {/* Bottom Legal Line */}
        <div className="mt-8 pt-6 border-t border-gray-200/60 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
          <p className="text-center sm:text-left">
            &copy; {currentYear}{' '}
            <ApexLinkPreview url="https://alathurpadidars.in/">
              <a
                href="https://alathurpadidars.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 underline decoration-dotted transition-colors"
              >
                Alathurpadi Dars Students Association
              </a>
            </ApexLinkPreview>
            . {t('allRightsReserved')}.
          </p>

          <p className="flex items-center gap-1 text-[11px] text-gray-400">
            <span>Built with precision &amp; care for Dars Food Management</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
