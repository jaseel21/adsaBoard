import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, Copy, Check, ExternalLink, Compass } from 'lucide-react';
import { SiGooglemaps } from 'react-icons/si';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';
import ApexLinkPreview from '../preview/ApexLinkPreview';

const MAPS_URL = 'https://maps.app.goo.gl/7bVjU6Uo2RL8DESb7';
const CAMPUS_ADDRESS = 'Alathurpadi Juma Masjid & Dars, Melmuri, Malappuram, Kerala 676517, India';
const CAMPUS_COORDS = '11.0824° N, 76.0682° E';

export default function CampusLocationCard() {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();
  const [copied, setCopied] = useState(false);

  const handleCopyAddress = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(CAMPUS_ADDRESS);
      } else {
        // Fallback for older browsers
        const textarea = document.createElement('textarea');
        textarea.value = CAMPUS_ADDRESS;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      feedback('pop');
      setCopied(true);
      dialog.toast.success(
        t('addressCopied', 'Campus address copied to clipboard'),
        CAMPUS_ADDRESS,
        3500
      );
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      feedback('warning');
    }
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t('campusLocation', 'Campus Location & Map')}</span>
        </h4>
        <span className="inline-flex items-center gap-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>{CAMPUS_COORDS}</span>
        </span>
      </div>

      {/* Main Interactive Map Bento Card */}
      <div className="group relative rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gradient-to-br from-white/90 via-emerald-50/30 to-teal-50/20 dark:from-[#0f1715]/90 dark:via-[#131e1b]/80 dark:to-[#0b1210]/90 backdrop-blur-xl p-4 shadow-sm hover:shadow-md transition-all duration-300">
        {/* Subtle Top Map Grid Pattern */}
        <div
          className="absolute inset-0 rounded-2xl opacity-[0.03] dark:opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(currentColor 1px, transparent 1px)`,
            backgroundSize: '16px 16px',
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-col space-y-3">
          {/* Institution & Landmark Details */}
          <div className="flex items-start gap-3">
            <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform duration-300">
              <MapPin className="w-5 h-5" />
              {/* Radar pulse ping */}
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border border-white dark:border-[#0b1210]" />
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <h5 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-snug">
                {lang === 'ml' ? 'ആലത്തൂർപടി ജുമാ മസ്ജിദ് & ദർസ്' : 'Alathurpadi Juma Masjid & Dars'}
              </h5>
              <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                Melmuri, Malappuram, Kerala 676517, India
              </p>
              <div className="mt-1 flex items-center gap-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{lang === 'ml' ? 'സന്ദർശകർക്കും വിദ്യാർത്ഥികൾക്കും സ്വാഗതം' : 'Open for Diners, Students & Visitors'}</span>
              </div>
            </div>
          </div>

          {/* Action Button Row */}
          <div className="flex items-center gap-2 pt-1">
            {/* Open Google Maps Button */}
            <ApexLinkPreview url={MAPS_URL}>
              <motion.a
                href={MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => feedback('pop')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm hover:shadow-glow-emerald transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                title="Open in Google Maps"
              >
                <SiGooglemaps className="w-3.5 h-3.5" />
                <span>{t('getDirections', 'Get Directions')}</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </motion.a>
            </ApexLinkPreview>

            {/* Copy Address Button */}
            <motion.button
              type="button"
              onClick={handleCopyAddress}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 ${
                copied
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/50 text-emerald-700 dark:text-emerald-300'
                  : 'bg-white/80 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
              }`}
              title={copied ? t('addressCopied') : t('copyAddress')}
              aria-label={t('copyAddress', 'Copy Address')}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-[11px] font-semibold">{t('done', 'Copied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 opacity-70" />
                  <span className="text-[11px]">{t('copyAddress', 'Copy')}</span>
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  );
}
