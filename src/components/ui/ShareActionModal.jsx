import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Share2,
  Copy,
  Check,
  Send,
  MessageCircle,
  QrCode,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Sliders,
  Download,
  Image as ImageIcon,
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { useLanguage } from '../../store/LanguageContext';
import LinkQrModal from '../preview/LinkQrModal';
import SocialCardStudioModal from '../preview/SocialCardStudioModal';

export default function ShareActionModal({
  isOpen,
  onClose,
  title = 'ADSA T-Board • Alathurpadi Dars Food Management System',
  url = typeof window !== 'undefined' ? window.location.href : 'https://canteen.alathurpadidars.in/',
  text = 'Live dining logistics, 3D token matrix, and meal management for Alathurpadi Dars.',
}) {
  const { lang } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);

  if (!isOpen) return null;

  const targetUrl = url || 'https://canteen.alathurpadidars.in/';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(targetUrl);
      setCopied(true);
      soundEngine.playMechanicalClick();
      hapticEngine.successPulse();
      setTimeout(() => setCopied(false), 2200);
    } catch (_) {}
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          text,
          url: targetUrl,
        });
        soundEngine.playSoftChime();
        hapticEngine.successPulse();
        onClose();
      } catch (_) {}
    } else {
      handleCopy();
    }
  };

  const handleTelegramShare = () => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    const shareText = `${title}\n${text}`;
    const telegramUrl = `https://t.me/share/url?url=${encodeURIComponent(targetUrl)}&text=${encodeURIComponent(shareText)}`;
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  };

  const handleWhatsAppShare = () => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    const shareText = `*${title}*\n${text}\n\n${targetUrl}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
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
          initial={{ scale: 0.93, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.93, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          data-lenis-prevent
          className="relative w-full max-w-md rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/15 p-5 sm:p-6 shadow-2xl flex flex-col z-10 select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3.5 border-b border-gray-200/60 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {lang === 'ml' ? 'ലിങ്ക് ഷെയർ ചെയ്യുക' : 'Share ADSA T-Board'}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {lang === 'ml' ? 'ടെലിഗ്രാം, വാട്സാപ്പ് അല്ലെങ്കിൽ നേരിട്ട്' : 'Telegram, WhatsApp, or Direct Link'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Social Card Preview Mini Mockup with Studio Trigger */}
          <div className="mt-4 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Social Preview Card</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  hapticEngine.lightTap();
                  setIsStudioOpen(true);
                }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-extrabold uppercase transition-all active:scale-95 cursor-pointer"
                title="Open Studio to customize, generate & download HD cards"
              >
                <Sliders className="w-3 h-3 text-emerald-500" />
                <span>Card Studio</span>
              </button>
            </div>

            <div
              onClick={() => {
                soundEngine.playPop();
                setIsStudioOpen(true);
              }}
              className="group relative rounded-xl overflow-hidden aspect-[1.91/1] bg-black/40 border border-white/10 shadow-sm cursor-pointer"
              title="Click to open Card Studio"
            >
              <img
                src="/og-preview.png"
                alt="Social Card Preview"
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-xs">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <span>Customize in Studio</span>
              </div>
            </div>

            <div className="mt-0.5">
              <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {title}
              </h4>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">
                {text}
              </p>
            </div>
          </div>

          {/* 1-Click Messaging Channels */}
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              type="button"
              onClick={handleTelegramShare}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Telegram</span>
            </button>

            <button
              type="button"
              onClick={handleWhatsAppShare}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>

          {/* Copy URL Row */}
          <div className="mt-3 flex items-center gap-2 p-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-xs font-mono text-gray-600 dark:text-gray-300">
            <span className="truncate flex-1 select-all">{targetUrl}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="p-1.5 rounded-lg bg-white dark:bg-white/10 text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors shadow-xs"
              title={copied ? 'Copied!' : 'Copy Link'}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Bottom Secondary Actions */}
          <div className="mt-3 pt-3 border-t border-gray-200/60 dark:border-white/10 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsQrOpen(true)}
                className="inline-flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                <QrCode className="w-3.5 h-3.5 text-emerald-500" />
                <span>Phone QR</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  setIsStudioOpen(true);
                }}
                className="inline-flex items-center gap-1.5 py-1.5 px-2.5 sm:px-3 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-emerald-300/40 dark:border-emerald-500/20 transition-colors"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-500" />
                <span>Card Studio</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleNativeShare}
              className="inline-flex items-center gap-1.5 py-1.5 px-3.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-xs font-bold text-gray-800 dark:text-gray-100 transition-all active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>More...</span>
            </button>
          </div>
        </motion.div>
      </div>

      {/* Linked Phone QR Modal */}
      <LinkQrModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        url={targetUrl}
        title={title}
        domain="canteen.alathurpadidars.in"
      />

      {/* Dynamic Social Card Studio Modal */}
      <SocialCardStudioModal
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        initialTemplate="portal"
        initialData={{
          customUrl: targetUrl,
          title,
          description: text,
        }}
      />
    </AnimatePresence>,
    document.body
  );
}
