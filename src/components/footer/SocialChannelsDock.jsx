import React from 'react';
import { motion } from 'framer-motion';
import {
  FaFacebook,
  FaInstagram,
  FaYoutube,
  FaXTwitter,
} from 'react-icons/fa6';
import { CheckCircle2, Share2 } from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import ApexLinkPreview from '../preview/ApexLinkPreview';

const SOCIAL_CHANNELS = [
  {
    id: 'facebook',
    name: 'Facebook',
    handle: '@alathoorpadidars',
    url: 'https://www.facebook.com/alathoorpadidars/',
    icon: FaFacebook,
    colorClass: 'hover:text-[#1877F2] hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10',
    badgeGlow: 'group-hover:shadow-[0_0_20px_rgba(24,119,242,0.35)]',
    gradientHover: 'hover:border-[#1877F2]/50 hover:bg-gradient-to-br hover:from-[#1877F2]/10 hover:to-transparent',
    bgBrand: 'bg-[#1877F2]',
    subtext: 'Community Broadcasts',
    subtextMl: 'ഔദ്യോഗിക അറിയിപ്പുകൾ',
  },
  {
    id: 'instagram',
    name: 'Instagram',
    handle: '@alathurpadi_dars',
    url: 'https://www.instagram.com/alathurpadi_dars',
    icon: FaInstagram,
    colorClass: 'hover:text-[#E1306C] hover:border-[#E1306C]/40 hover:bg-[#E1306C]/10',
    badgeGlow: 'group-hover:shadow-[0_0_20px_rgba(225,48,108,0.35)]',
    gradientHover: 'hover:border-[#E1306C]/50 hover:bg-gradient-to-br hover:from-purple-500/10 hover:via-pink-500/10 hover:to-amber-500/10',
    bgBrand: 'bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045]',
    subtext: 'Visual Stories & Campus Life',
    subtextMl: 'കാമ്പസ് ഫോട്ടോകൾ',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    handle: '@alathurpadidars',
    url: 'https://www.youtube.com/alathurpadidars',
    icon: FaYoutube,
    colorClass: 'hover:text-[#FF0000] hover:border-[#FF0000]/40 hover:bg-[#FF0000]/10',
    badgeGlow: 'group-hover:shadow-[0_0_20px_rgba(255,0,0,0.35)]',
    gradientHover: 'hover:border-[#FF0000]/50 hover:bg-gradient-to-br hover:from-[#FF0000]/10 hover:to-transparent',
    bgBrand: 'bg-[#FF0000]',
    subtext: 'Lectures & Dars Convocations',
    subtextMl: 'പ്രഭാഷണങ്ങൾ & പരിപാടികൾ',
  },
  {
    id: 'x',
    name: 'X (Twitter)',
    handle: '@ALATHURPADARS',
    url: 'https://x.com/ALATHURPADARS',
    icon: FaXTwitter,
    colorClass: 'hover:text-black dark:hover:text-white hover:border-black/30 dark:hover:border-white/30 hover:bg-black/5 dark:hover:bg-white/10',
    badgeGlow: 'group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]',
    gradientHover: 'hover:border-zinc-500/40 hover:bg-zinc-500/10',
    bgBrand: 'bg-black dark:bg-white text-white dark:text-black',
    subtext: 'Official Press Bulletins',
    subtextMl: 'തത്സമയ വാർത്തകൾ',
  },
];

export default function SocialChannelsDock() {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();

  return (
    <div className="flex flex-col space-y-3">
      {/* Header with Title and Verified Badge */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Share2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t('officialSocialChannels', 'Official Social Media')}</span>
        </h4>
        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
          <CheckCircle2 className="w-2.5 h-2.5" />
          <span>Verified Channels</span>
        </span>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        {t('socialConnectDesc', 'Stay connected with verified broadcasts, lectures, and event updates.')}
      </p>

      {/* Grid of Interactive Social Cards */}
      <div className="grid grid-cols-2 gap-2 sm:gap-2.5 pt-1">
        {SOCIAL_CHANNELS.map((channel) => {
          const Icon = channel.icon;
          return (
            <ApexLinkPreview key={channel.id} url={channel.url}>
              <motion.a
                href={channel.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => feedback('pop')}
                whileHover={{ y: -3, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                className={`group relative flex items-center gap-2.5 p-2.5 rounded-xl border border-gray-200/70 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.03] backdrop-blur-md transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 ${channel.gradientHover} ${channel.badgeGlow}`}
                aria-label={`Official ${channel.name} page for Alathurpadi Dars`}
              >
                {/* Brand Icon Pill */}
                <div className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-white dark:bg-black/40 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 shadow-sm transition-colors duration-300 group-hover:scale-110">
                  <Icon className="w-4 h-4 transition-transform duration-300" />
                </div>

                {/* Text & Handle */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    <span className="text-xs font-semibold text-gray-900 dark:text-white truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {channel.name}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-gray-400 truncate font-mono">
                    {channel.handle}
                  </p>
                </div>
              </motion.a>
            </ApexLinkPreview>
          );
        })}
      </div>
    </div>
  );
}
