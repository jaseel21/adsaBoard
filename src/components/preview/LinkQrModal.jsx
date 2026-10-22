import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  ShieldCheck,
  Share2,
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { useLanguage } from '../../store/LanguageContext';

export default function LinkQrModal({ isOpen, onClose, url, title, domain }) {
  const { t, lang } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!isOpen || !url) return null;

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(
    url
  )}&margin=8&qzone=1`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      soundEngine.playMechanicalClick();
      hapticEngine.successPulse();
      setTimeout(() => setCopied(false), 2200);
    } catch (_) {}
  };

  const handleOpen = () => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-md"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          className="relative w-full max-w-sm rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/15 p-6 shadow-2xl flex flex-col items-center text-center z-10"
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header Icon */}
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 shadow-inner">
            <Smartphone className="w-6 h-6" />
          </div>

          <h3 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
            {lang === 'ml' ? 'ഫോണിൽ സ്കാൻ ചെയ്യുക' : 'Scan to Open on Mobile'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[260px] line-clamp-1">
            {title || domain}
          </p>

          {/* Crisp QR Code Card with decorative frame */}
          <div className="mt-4 p-3 rounded-2xl bg-white dark:bg-white/95 border-2 border-emerald-500/30 shadow-xl relative group">
            <img
              src={qrImageUrl}
              alt={`QR Code for ${url}`}
              className="w-48 h-48 object-contain rounded-lg"
              loading="eager"
            />
            <div className="absolute inset-0 rounded-2xl ring-1 ring-inset ring-black/5 pointer-events-none" />
          </div>

          <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{domain || 'Verified Destination'}</span>
          </div>

          {/* URL Pill & Action Buttons */}
          <div className="mt-4 w-full flex flex-col gap-2">
            <div className="flex items-center gap-2 p-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-xs font-mono text-gray-600 dark:text-gray-300">
              <span className="truncate flex-1 text-left select-all">{url}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-white dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-xs"
                title={copied ? 'Copied!' : 'Copy Link'}
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={handleCopy}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 transition-all active:scale-95"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (lang === 'ml' ? 'കോപ്പി ചെയ്തു!' : 'Copied!') : (lang === 'ml' ? 'കോപ്പി ചെയ്യുക' : 'Copy Link')}</span>
              </button>

              <button
                type="button"
                onClick={handleOpen}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all active:scale-95"
              >
                <span>{lang === 'ml' ? 'തുറക്കുക' : 'Open Link'}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
