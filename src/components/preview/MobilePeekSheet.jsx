import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  QrCode,
  Globe,
  Maximize2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { useLanguage } from '../../store/LanguageContext';
import LinkSecurityBadge from './LinkSecurityBadge';
import LinkQrModal from './LinkQrModal';
import ApexDeepPeekModal from './ApexDeepPeekModal';

export default function MobilePeekSheet({ isOpen, onClose, metadata }) {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isDeepPeekOpen, setIsDeepPeekOpen] = useState(false);

  if (!isOpen || !metadata) return null;

  const url = metadata.url || metadata.canonicalUrl;
  const isInternal = metadata.isInternalRoute || url.startsWith('/');
  const title = lang === 'ml' && metadata.titleMl ? metadata.titleMl : metadata.title;
  const description = lang === 'ml' && metadata.descriptionMl ? metadata.descriptionMl : metadata.description;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      soundEngine.playMechanicalClick();
      hapticEngine.successPulse();
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const handleOpen = () => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    onClose();
    if (isInternal) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <AnimatePresence>
        <div className="fixed inset-0 z-50 flex items-end justify-center">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
          />

          {/* Bottom Sheet Card */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100) {
                onClose();
                soundEngine.playDismissWhoosh();
              }
            }}
            className="relative w-full max-w-lg rounded-t-3xl bg-white/95 dark:bg-[#0c1412]/95 backdrop-blur-2xl border-t border-x border-gray-200/80 dark:border-white/15 p-5 shadow-2xl flex flex-col gap-3.5 z-10 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]"
          >
            {/* Drag Handle Bar */}
            <div className="w-12 h-1.5 rounded-full bg-gray-300 dark:bg-white/20 mx-auto -mt-1 cursor-grab active:cursor-grabbing" />

            {/* Header / Domain Row */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                {metadata.favicon ? (
                  <img
                    src={metadata.favicon}
                    alt={metadata.domain}
                    className="w-5 h-5 rounded object-contain flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Globe className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                )}
                <span className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate">
                  {metadata.siteName || metadata.domain}
                </span>
                <LinkSecurityBadge status={metadata.trustStatus} />
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Hero Image / Banner */}
            <div className="relative w-full h-32 rounded-2xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 flex-shrink-0">
              {metadata.image ? (
                <img
                  src={metadata.image}
                  alt={title}
                  className="w-full h-full object-cover"
                  loading="eager"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div
                  className={`w-full h-full bg-gradient-to-br ${
                    metadata.gradient || 'from-emerald-700 via-teal-800 to-emerald-950'
                  } p-4 flex flex-col justify-end text-white`}
                >
                  <div className="absolute top-2 right-2 opacity-20">
                    <Globe className="w-20 h-20" />
                  </div>
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-black/30 w-fit">
                    {metadata.badgeText || metadata.domain}
                  </span>
                </div>
              )}

              <div className="absolute top-2 right-2 flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-black/60 text-white backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                <span>{metadata.mediaType || 'Link'}</span>
              </div>
            </div>

            {/* Title & Description */}
            <div className="space-y-1">
              <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white tracking-tight line-clamp-1">
                {title}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed line-clamp-2">
                {description}
              </p>
            </div>

            {/* Reading Time */}
            <div className="flex items-center gap-1 text-[11px] font-medium text-gray-400">
              <Clock className="w-3.5 h-3.5 text-emerald-500" />
              <span>{metadata.readingTimeMinutes || 2} min read</span>
              <span>•</span>
              <span className="truncate max-w-[200px] font-mono text-[10px]">{url}</span>
            </div>

            {/* Quick Actions Grid */}
            <div className="pt-2 border-t border-gray-200/70 dark:border-white/10 flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  setIsDeepPeekOpen(true);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all active:scale-95"
              >
                <Maximize2 className="w-4 h-4" />
                <span>Reader</span>
              </button>

              <button
                type="button"
                onClick={handleOpen}
                className="flex-[2] inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              >
                <span>{isInternal ? 'Navigate' : 'Open Link'}</span>
                {isInternal ? <ArrowRight className="w-4 h-4" /> : <ExternalLink className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatePresence>

      {/* Linked Modals */}
      <LinkQrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        url={url}
        title={title}
        domain={metadata.domain}
      />
      <ApexDeepPeekModal
        isOpen={isDeepPeekOpen}
        onClose={() => setIsDeepPeekOpen(false)}
        metadata={metadata}
      />
    </>
  );
}
