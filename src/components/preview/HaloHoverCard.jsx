import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import LinkSecurityBadge from './LinkSecurityBadge';
import LinkQrModal from './LinkQrModal';
import ApexDeepPeekModal from './ApexDeepPeekModal';

export default function HaloHoverCard({
  metadata,
  coords,
  isOpen,
  onClose,
  onMouseEnter,
  onMouseLeave,
}) {
  const { lang } = useLanguage();
  const cardRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isDeepPeekOpen, setIsDeepPeekOpen] = useState(false);

  // 3D Tilt perspective state
  const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });

  const handleMouseMove = useCallback((e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Constrain tilt to max ±7 deg
    const rotateX = ((centerY - y) / centerY) * 6;
    const rotateY = ((x - centerX) / centerX) * 7;

    const glareX = (x / rect.width) * 100;
    const glareY = (y / rect.height) * 100;

    setTilt({ rotateX, rotateY, glareX, glareY });
  }, []);

  const handleMouseLeaveCard = useCallback(() => {
    setTilt({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
    if (onMouseLeave) onMouseLeave();
  }, [onMouseLeave]);

  if (!isOpen || !metadata) return null;

  const url = metadata.url || metadata.canonicalUrl;
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
      <AnimatePresence>
        <motion.div
          ref={cardRef}
          onMouseEnter={onMouseEnter}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeaveCard}
          initial={{ opacity: 0, scale: 0.92, y: coords.placement === 'top' ? 8 : -8 }}
          animate={{
            opacity: 1,
            scale: 1,
            y: 0,
            rotateX: tilt.rotateX,
            rotateY: tilt.rotateY,
          }}
          exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
          transition={{ type: 'spring', stiffness: 420, damping: 28 }}
          style={{
            position: 'fixed',
            left: `${coords.x}px`,
            top: `${coords.y}px`,
            perspective: 1000,
            transformStyle: 'preserve-3d',
            zIndex: 60,
          }}
          className="w-[340px] rounded-2xl bg-white/95 dark:bg-[#0c1412]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-white/15 p-3.5 shadow-2xl ring-1 ring-black/5 dark:ring-white/10 select-none overflow-hidden"
          role="tooltip"
        >
          {/* Ambient Cursor Glare Overlay */}
          <div
            className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300 opacity-20 dark:opacity-25"
            style={{
              background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(16, 185, 129, 0.4), transparent 60%)`,
            }}
          />

          {/* Hero Banner / Gradient Graphic */}
          <div className="relative w-full h-28 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 flex-shrink-0">
            {metadata.image ? (
              <img
                src={metadata.image}
                alt={metadata.imageAlt || title}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="eager"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div
                className={`w-full h-full bg-gradient-to-br ${
                  metadata.gradient || 'from-emerald-600 via-teal-700 to-emerald-950'
                } flex flex-col justify-end p-3 text-white`}
              >
                <div className="absolute top-2 right-2 opacity-20">
                  <Globe className="w-16 h-16" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/25 w-fit backdrop-blur-sm">
                  {metadata.badgeText || metadata.domain}
                </span>
              </div>
            )}

            {/* Media Type pill on top-right */}
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-black/50 text-white backdrop-blur-md border border-white/20">
              <Sparkles className="w-2.5 h-2.5 text-emerald-400" />
              <span>{metadata.mediaType || 'Web'}</span>
            </div>
          </div>

          {/* Favicon & Trust Status Row */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {metadata.favicon ? (
                <img
                  src={metadata.favicon}
                  alt={metadata.domain}
                  className="w-4 h-4 rounded object-contain flex-shrink-0"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <Globe className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              )}
              <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300 truncate">
                {metadata.siteName || metadata.domain}
              </span>
            </div>

            <LinkSecurityBadge status={metadata.trustStatus} />
          </div>

          {/* Title & Description */}
          <div className="mt-1.5 space-y-1">
            <h4 className="text-xs sm:text-sm font-black text-gray-900 dark:text-white tracking-tight line-clamp-1">
              {title}
            </h4>
            <p className="text-[11px] text-gray-600 dark:text-gray-300 font-medium leading-relaxed line-clamp-2">
              {description}
            </p>
          </div>

          {/* Footer Action Toolbar */}
          <div className="mt-3 pt-2.5 border-t border-gray-200/70 dark:border-white/10 flex items-center justify-between gap-1.5">
            {/* Reading Time */}
            <div className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 dark:text-gray-400">
              <Clock className="w-3 h-3 text-emerald-500" />
              <span>{metadata.readingTimeMinutes || 2} min read</span>
            </div>

            {/* Micro Actions */}
            <div className="flex items-center gap-1">
              {/* QR Code */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine.playPop();
                  setIsQrOpen(true);
                }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                title="Scan QR on Mobile"
              >
                <QrCode className="w-3.5 h-3.5" />
              </button>

              {/* Deep Peek */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  soundEngine.playPop();
                  setIsDeepPeekOpen(true);
                }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                title="Deep Peek Reader"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Copy URL */}
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                title={copied ? 'Copied!' : 'Copy Link'}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              {/* Main Open CTA */}
              <button
                type="button"
                onClick={handleOpen}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold shadow-sm shadow-emerald-600/20 transition-all active:scale-95 ml-1"
              >
                <span>{isInternal ? 'Go' : 'Open'}</span>
                {isInternal ? <ArrowRight className="w-3 h-3" /> : <ExternalLink className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </motion.div>
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
