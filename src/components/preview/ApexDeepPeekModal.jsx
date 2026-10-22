import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  QrCode,
  ShieldCheck,
  Globe,
  Maximize2,
  BookOpen,
  ArrowRight,
  Clock,
  Sparkles,
  Lock,
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { useLanguage } from '../../store/LanguageContext';
import LinkQrModal from './LinkQrModal';
import LinkSecurityBadge from './LinkSecurityBadge';

export default function ApexDeepPeekModal({ isOpen, onClose, metadata }) {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [iframeError, setIframeError] = useState(false);
  const [viewMode, setViewMode] = useState('reader'); // 'reader' | 'live'

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

  const handleOpenExternal = () => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 dark:bg-black/85 backdrop-blur-md"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative w-full max-w-4xl max-h-[90vh] h-[680px] rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/15 shadow-2xl flex flex-col overflow-hidden z-10"
        >
          {/* Header Island */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-200/70 dark:border-white/10 bg-gray-50/80 dark:bg-black/30 backdrop-blur-xl flex-shrink-0">
            {/* Left: Domain & Security status */}
            <div className="flex items-center gap-2.5 min-w-0">
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
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white truncate">
                    {metadata.domain || 'ADSA System'}
                  </span>
                  <LinkSecurityBadge status={metadata.trustStatus} />
                </div>
                <p className="text-[11px] font-mono text-gray-400 truncate max-w-xs sm:max-w-md">
                  {url}
                </p>
              </div>
            </div>

            {/* Right: Controls Bar */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* Reader vs Live Toggle */}
              {!isInternal && (
                <div className="hidden sm:flex items-center p-0.5 rounded-xl bg-gray-200/80 dark:bg-white/10 border border-gray-300/40 dark:border-white/5 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playPop();
                      setViewMode('reader');
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      viewMode === 'reader'
                        ? 'bg-white dark:bg-[#131b18] text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    Reader View
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playPop();
                      setViewMode('live');
                    }}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      viewMode === 'live'
                        ? 'bg-white dark:bg-[#131b18] text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    Live Frame
                  </button>
                </div>
              )}

              {/* QR Code trigger */}
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  setIsQrOpen(true);
                }}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                title="Scan QR on Mobile"
              >
                <QrCode className="w-4 h-4" />
              </button>

              {/* Copy URL */}
              <button
                type="button"
                onClick={handleCopy}
                className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                title={copied ? 'Copied' : 'Copy URL'}
              >
                {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>

              {/* Open in external tab */}
              <button
                type="button"
                onClick={handleOpenExternal}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              >
                <span className="hidden sm:inline">Open</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-800 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Content Body */}
          <div className="flex-1 w-full overflow-y-auto relative">
            {viewMode === 'live' && !isInternal ? (
              <div className="w-full h-full relative bg-white">
                {!iframeLoaded && !iframeError && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0c1412] gap-3">
                    <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin" />
                    <span className="text-xs font-bold text-gray-500">Loading secure preview frame...</span>
                  </div>
                )}
                {iframeError ? (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center gap-3 bg-gray-50 dark:bg-[#0c1412]">
                    <Globe className="w-10 h-10 text-gray-400 opacity-60" />
                    <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      Live frame prevented by destination security policy (X-Frame-Options)
                    </h4>
                    <p className="text-xs text-gray-500 max-w-md">
                      This website protects its interface against inline embedding. You can safely browse it using our Reader Mode or open it in a new window.
                    </p>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={() => setViewMode('reader')}
                        className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-white/10 text-xs font-bold text-gray-800 dark:text-gray-200"
                      >
                        Switch to Reader View
                      </button>
                      <button
                        type="button"
                        onClick={handleOpenExternal}
                        className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
                      >
                        Open in New Tab
                      </button>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={url}
                    title={title}
                    onLoad={() => setIframeLoaded(true)}
                    onError={() => setIframeError(true)}
                    sandbox="allow-scripts allow-same-origin allow-popups"
                    className="w-full h-full border-0"
                  />
                )}
              </div>
            ) : (
              /* Reader View Mode */
              <div className="p-6 sm:p-10 max-w-3xl mx-auto space-y-6">
                {/* Hero Banner / Gradient Graphic */}
                {metadata.image ? (
                  <div className="w-full h-56 sm:h-72 rounded-3xl overflow-hidden border border-gray-200/80 dark:border-white/10 shadow-lg relative bg-gray-100 dark:bg-white/5">
                    <img
                      src={metadata.image}
                      alt={metadata.imageAlt || title}
                      className="w-full h-full object-cover"
                      loading="eager"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-black uppercase bg-emerald-500/80 backdrop-blur-md">
                        {metadata.siteName || metadata.domain}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-full h-44 sm:h-52 rounded-3xl bg-gradient-to-br ${
                      metadata.gradient || 'from-emerald-700 to-teal-900'
                    } p-6 sm:p-8 flex flex-col justify-end text-white shadow-xl relative overflow-hidden`}
                  >
                    <div className="absolute top-4 right-4 opacity-15">
                      <Globe className="w-32 h-32" />
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-white/20 backdrop-blur-md w-fit mb-2">
                      {metadata.badgeText || metadata.domain}
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight">{title}</h2>
                  </div>
                )}

                {/* Article / Meta Body */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{metadata.readingTimeMinutes || 2} min read</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{metadata.domain}</span>
                    </div>
                    <span>•</span>
                    <span className="uppercase text-[10px] font-extrabold tracking-wider text-emerald-600 dark:text-emerald-400">
                      {metadata.mediaType || 'Website'}
                    </span>
                  </div>

                  <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {title}
                  </h1>

                  <p className="text-sm sm:text-base text-gray-700 dark:text-gray-300 leading-relaxed font-normal">
                    {description}
                  </p>
                </div>

                {/* Direct Action Hub */}
                <div className="pt-6 border-t border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <span>Instant reader view powered by Apex Preview Engine</span>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setIsQrOpen(true)}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                      <span>Phone QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleOpenExternal}
                      className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/25 transition-all"
                    >
                      <span>Visit Web Page</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Sub-modal: QR Code Phone Transfer */}
      <LinkQrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        url={url}
        title={title}
        domain={metadata.domain}
      />
    </AnimatePresence>
  );
}
