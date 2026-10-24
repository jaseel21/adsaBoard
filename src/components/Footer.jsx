import React from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  ShieldCheck,
  Sparkles,
  HeartHandshake,
  UtensilsCrossed,
  BookOpen,
  ChefHat,
  UserCheck,
  FileText,
  ArrowUp,
  Heart,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import ApexLinkPreview from './preview/ApexLinkPreview';
import DarsCalligraphyBanner from './footer/DarsCalligraphyBanner';
import CampusLocationCard from './footer/CampusLocationCard';
import SocialChannelsDock from './footer/SocialChannelsDock';
import LiveSystemTelemetry from './footer/LiveSystemTelemetry';

export default function Footer() {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    feedback('tick');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      role="contentinfo"
      className="relative mt-auto border-t border-gray-200/80 dark:border-white/10 bg-white/85 dark:bg-[#080d0b]/90 backdrop-blur-2xl transition-colors duration-300 overflow-hidden"
    >
      {/* Decorative Top Multi-Color Aurora Accent Line */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-4/5 max-w-5xl h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/60 via-teal-400/40 via-amber-400/30 to-transparent"
        aria-hidden="true"
      />

      {/* Ambient Top Glow Orbs */}
      <div
        className="absolute -top-24 left-1/4 w-96 h-48 bg-emerald-500/10 dark:bg-emerald-400/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />
      <div
        className="absolute -top-24 right-1/4 w-96 h-48 bg-teal-500/10 dark:bg-teal-400/15 rounded-full blur-3xl pointer-events-none"
        aria-hidden="true"
      />

      {/* ========================================================================= */}
      {/* TIER 1: ILLUMINATED DARS CALLIGRAPHY HERITAGE SHOWCASE                     */}
      {/* ========================================================================= */}
      <DarsCalligraphyBanner />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-8">
        {/* ========================================================================= */}
        {/* TIER 2: FOUR-PILLAR BENTO NAVIGATION & OPERATIONS MATRIX                 */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-6 items-start">
          
          {/* ----------------------------------------------------------------------- */}
          {/* COLUMN 1: ACADEMY, CREST & INSTITUTIONAL HERITAGE (Cols 1-3)           */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-3 flex flex-col space-y-4">
            <div className="flex items-start gap-3">
              <ApexLinkPreview url="https://alathurpadidars.in/">
                <a
                  href="https://alathurpadidars.in/"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => feedback('pop')}
                  className="group relative flex-shrink-0"
                  title="Alathurpadi Dars Official Website"
                >
                  <div className="w-14 h-14 rounded-2xl p-2 bg-gradient-to-br from-emerald-50 to-emerald-100/80 dark:from-emerald-950/60 dark:to-emerald-900/30 border border-emerald-200/60 dark:border-emerald-500/20 shadow-md group-hover:scale-105 group-hover:shadow-glow-emerald transition-all duration-300 flex items-center justify-center">
                    <img
                      src="https://alathurpadidars.in/wp-content/uploads/2019/08/Dars-Site-Logo1.png"
                      alt="Alathurpadi Dars Crest"
                      className="w-10 h-10 object-contain"
                      loading="lazy"
                    />
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#080d0b] flex items-center justify-center text-white shadow-sm">
                    <ShieldCheck className="w-2.5 h-2.5" />
                  </span>
                </a>
              </ApexLinkPreview>

              <div>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white tracking-tight leading-snug">
                  {t('orgName', 'Alathurpadi Dars Students Association')}
                </h3>
                <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold tracking-wide uppercase mt-0.5">
                  ADSA Canteen Operations
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {t('footerTagline', 'Crafted with dedication for Alathurpadi Dars dining management.')}
            </p>

            {/* Official Portal Button */}
            <ApexLinkPreview url="https://alathurpadidars.in/">
              <a
                href="https://alathurpadidars.in/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => feedback('pop')}
                className="group inline-flex items-center justify-between w-full px-3.5 py-2 rounded-xl border border-emerald-200/80 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-100/60 dark:hover:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-sm hover:shadow-glow-emerald transition-all duration-200"
              >
                <span className="flex items-center gap-1.5 truncate">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span className="truncate">{t('officialWebsite', 'Official Website')}</span>
                </span>
                <span className="flex items-center gap-1 font-mono text-[11px] opacity-80 group-hover:opacity-100 flex-shrink-0">
                  <span>alathurpadidars.in</span>
                  <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </span>
              </a>
            </ApexLinkPreview>

            {/* Institutional Sub-links */}
            <nav className="flex flex-col space-y-1.5 pt-1 text-xs text-gray-600 dark:text-gray-400">
              <ApexLinkPreview url="/support">
                <Link
                  to="/support"
                  onClick={() => feedback('tick')}
                  className="inline-flex items-center gap-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-0.5"
                >
                  <HeartHandshake className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('navSupport', 'Care & Support Desk')}</span>
                </Link>
              </ApexLinkPreview>

              <Link
                to="/adab"
                onClick={() => feedback('tick')}
                className="inline-flex items-center gap-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-0.5"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{lang === 'ml' ? 'ആദാബുൽ മാഇദ (ഭക്ഷണ മര്യാദകൾ)' : 'Dining Ethics & Sunnah Adab'}</span>
              </Link>

              <ApexLinkPreview url="/guide">
                <Link
                  to="/guide"
                  onClick={() => feedback('tick')}
                  className="inline-flex items-center gap-2 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors py-0.5"
                >
                  <BookOpen className="w-3.5 h-3.5 text-teal-500" />
                  <span>{t('userGuide', 'System Guide & Manual')}</span>
                </Link>
              </ApexLinkPreview>
            </nav>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* COLUMN 2: CANTEEN SERVICES & QUICK NAVIGATION (Cols 4-6)                */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-3 flex flex-col space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('canteenServices', 'Canteen Operations')}</span>
            </h4>

            <nav className="grid grid-cols-1 gap-1 text-xs text-gray-600 dark:text-gray-400">
              <Link
                to="/"
                onClick={() => feedback('tick')}
                className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-100/70 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  <span>{t('navBoard', 'Token Board / Public View')}</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400 dark:text-gray-400 group-hover:text-emerald-500 transition-colors">/</span>
              </Link>

              <ApexLinkPreview url="/menu">
                <Link
                  to="/menu"
                  onClick={() => feedback('tick')}
                  className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-100/70 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                    <span>{t('navMenu', 'Weekly Food Menu')}</span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 dark:text-gray-400 group-hover:text-emerald-500 transition-colors">/menu</span>
                </Link>
              </ApexLinkPreview>

              <Link
                to="/avoiders"
                onClick={() => feedback('tick')}
                className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-100/70 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
              >
                <span className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/60" />
                  <span>{t('navAvoidersList', 'Dietary Avoiders Matrix')}</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400 dark:text-gray-400 group-hover:text-emerald-500 transition-colors">/avoiders</span>
              </Link>

              <ApexLinkPreview url="/kitchen">
                <Link
                  to="/kitchen"
                  onClick={() => feedback('tick')}
                  className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-100/70 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <ChefHat className="w-3 h-3 text-amber-500" />
                    <span>{t('navKitchenDisplay', 'Kitchen Console (KDS)')}</span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 dark:text-gray-400 group-hover:text-emerald-500 transition-colors">/kitchen</span>
                </Link>
              </ApexLinkPreview>

              <ApexLinkPreview url="/student">
                <Link
                  to="/student"
                  onClick={() => feedback('tick')}
                  className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-100/70 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-3 h-3 text-teal-500" />
                    <span>{t('navStudentPortal', 'Student Dining Portal')}</span>
                  </span>
                  <span className="text-[10px] font-mono text-gray-400 dark:text-gray-400 group-hover:text-emerald-500 transition-colors">/student</span>
                </Link>
              </ApexLinkPreview>

              <Link
                to="/login"
                onClick={() => feedback('tick')}
                className="group flex items-center justify-between p-1.5 rounded-lg hover:bg-gray-100/70 dark:hover:bg-white/5 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3 h-3 text-emerald-500" />
                  <span>{t('publicDocuments', 'Public Sheets & Reports')}</span>
                </span>
                <span className="text-[10px] font-mono text-gray-400 dark:text-gray-400 group-hover:text-emerald-500 transition-colors">/login</span>
              </Link>
            </nav>
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* COLUMN 3: CAMPUS LOCATION & SOCIAL MEDIA MATRIX (Cols 7-9)             */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-3 flex flex-col space-y-5">
            <CampusLocationCard />
            <SocialChannelsDock />
          </div>

          {/* ----------------------------------------------------------------------- */}
          {/* COLUMN 4: LIVE TELEMETRY & SYSTEM ERGONOMICS (Cols 10-12)               */}
          {/* ----------------------------------------------------------------------- */}
          <div className="lg:col-span-3 flex flex-col space-y-4">
            <LiveSystemTelemetry />
          </div>

        </div>

        {/* ========================================================================= */}
        {/* TIER 4: BOTTOM LEGAL ACCREDITATION, COPYRIGHT & DOCK SAFE AREA           */}
        {/* ========================================================================= */}
        <div className="mt-8 pt-6 border-t border-gray-200/60 dark:border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500 dark:text-gray-400">
          {/* Legal Rights */}
          <p className="text-center sm:text-left">
            &copy; {currentYear}{' '}
            <ApexLinkPreview url="https://alathurpadidars.in/">
              <a
                href="https://alathurpadidars.in/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => feedback('pop')}
                className="font-semibold text-gray-800 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 underline decoration-dotted transition-colors"
              >
                Alathurpadi Dars Students Association
              </a>
            </ApexLinkPreview>
            . {t('allRightsReserved', 'All rights reserved.')}
          </p>

          {/* Precision Tagline */}
          <p className="text-center sm:text-right text-[11px] text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
            <span>{t('builtWithPrecision', 'Crafted with precision & spiritual devotion for Alathurpadi Dars')}</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500 inline" />
          </p>

          {/* Quick Back to Top Action */}
          <motion.button
            type="button"
            onClick={scrollToTop}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-gray-200/80 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[11px] font-medium text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            title={t('backToTop', 'Back to Top')}
            aria-label={t('backToTop', 'Back to Top')}
          >
            <ArrowUp className="w-3 h-3 text-emerald-500" />
            <span>{t('backToTop', 'Top')}</span>
          </motion.button>
        </div>
      </div>
    </footer>
  );
}
