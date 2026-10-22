import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
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
import { useLinkMetadata } from '../../hooks/useLinkMetadata';
import LinkSecurityBadge from './LinkSecurityBadge';
import LinkQrModal from './LinkQrModal';
import ApexDeepPeekModal from './ApexDeepPeekModal';
import LinkPreviewSkeleton from './LinkPreviewSkeleton';

export default function ApexBookmarkCard({
  url,
  overrides = {},
  className = '',
  compact = false,
}) {
  const { lang } = useLanguage();
  const { metadata, loading } = useLinkMetadata(url, overrides);
  const [copied, setCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isDeepPeekOpen, setIsDeepPeekOpen] = useState(false);

  if (loading && !metadata) {
    return <LinkPreviewSkeleton />;
  }

  if (!metadata) return null;

  const isInternal = metadata.isInternalRoute || url.startsWith('/');
  const title = lang === 'ml' && metadata.titleMl ? metadata.titleMl : metadata.title;
  const description = lang === 'ml' && metadata.descriptionMl ? metadata.descriptionMl : metadata.description;

  const handleCopy = async (e) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      soundEngine.playMechanicalClick();
      hapticEngine.successPulse();
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const handleOpen = (e) => {
    e.stopPropagation();
    soundEngine.playPop();
    hapticEngine.lightTap();
    if (isInternal) {
      window.location.href = url;
    } else {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <div
        onClick={handleOpen}
        className={`group relative rounded-2xl bg-white/90 dark:bg-[#0c1412]/90 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 shadow-md hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 overflow-hidden cursor-pointer select-none ${
          compact ? 'p-3 flex items-center gap-3' : 'p-3.5 flex flex-col sm:flex-row gap-3.5'
        } ${className}`}
      >
        {/* Thumbnail / Hero Image */}
        <div
          className={`relative rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 flex-shrink-0 ${
            compact
              ? 'w-16 h-16 sm:w-20 sm:h-20'
              : 'w-full sm:w-40 h-28 sm:h-auto'
          }`}
        >
          {metadata.image ? (
            <img
              src={metadata.image}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div
              className={`w-full h-full bg-gradient-to-br ${
                metadata.gradient || 'from-emerald-700 via-teal-800 to-emerald-950'
              } p-3 flex flex-col justify-end text-white`}
            >
              <div className="absolute top-2 right-2 opacity-25">
                <Globe className="w-12 h-12" />
              </div>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-black/40 w-fit">
                {metadata.badgeText || metadata.domain}
              </span>
            </div>
          )}

          <div className="absolute top-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-black/60 text-white backdrop-blur-md">
            <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
            <span>{metadata.mediaType || 'Link'}</span>
          </div>
        </div>

        {/* Content Column */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          <div>
            {/* Meta Row: Favicon, Domain, Trust Badge */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                {metadata.favicon ? (
                  <img
                    src={metadata.favicon}
                    alt={metadata.domain}
                    className="w-3.5 h-3.5 rounded object-contain flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <Globe className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                )}
                <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate">
                  {metadata.siteName || metadata.domain}
                </span>
              </div>

              <LinkSecurityBadge status={metadata.trustStatus} />
            </div>

            {/* Title */}
            <h4 className="mt-1 text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white tracking-tight line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
              {title}
            </h4>

            {/* Description */}
            {!compact && (
              <p className="mt-1 text-[11px] text-gray-600 dark:text-gray-300 font-medium leading-relaxed line-clamp-2">
                {description}
              </p>
            )}
          </div>

          {/* Action Footer */}
          <div className="mt-2.5 pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono text-gray-400 truncate max-w-[150px] sm:max-w-[200px]">
              {metadata.domain}
            </span>

            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  setIsQrOpen(true);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                title="Scan QR on Mobile"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  setIsDeepPeekOpen(true);
                }}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                title="Deep Peek Reader"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                title={copied ? 'Copied' : 'Copy Link'}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handleOpen}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold shadow-sm transition-all active:scale-95 ml-1"
              >
                <span>{isInternal ? 'Visit' : 'Open'}</span>
                {isInternal ? <ArrowRight className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </div>
      </div>

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
