import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Download,
  Copy,
  Check,
  Send,
  MessageCircle,
  Share2,
  RefreshCw,
  Sliders,
  Image,
  UtensilsCrossed,
  ChefHat,
  LayoutGrid,
  CreditCard,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import {
  renderDynamicSocialCard,
  canvasToBlob,
  downloadCanvasAsPng,
  copyCanvasToClipboard,
} from '../../utils/dynamicSocialCardEngine';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { useLanguage } from '../../store/LanguageContext';

const TEMPLATES = [
  { id: 'portal', label: 'Master Portal', icon: Sparkles },
  { id: 'menu', label: 'Today’s Menu', icon: UtensilsCrossed },
  { id: 'kitchen', label: 'Kitchen Manifest', icon: ChefHat },
  { id: 'student_pass', label: 'Student Pass', icon: CreditCard },
  { id: 'announcement', label: 'Campus Notice', icon: Bell },
];

export default function SocialCardStudioModal({
  isOpen,
  onClose,
  initialTemplate = 'portal',
  initialData = {},
}) {
  const { lang, t } = useLanguage();
  const [activeTemplate, setActiveTemplate] = useState(initialTemplate);
  const [aspectRatio, setAspectRatio] = useState('landscape'); // 'landscape' | 'square'
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const canvasRef = useRef(null);

  // Re-generate canvas whenever template, aspect ratio, or data changes
  useEffect(() => {
    if (!isOpen) return;
    let isCurrent = true;

    async function generate() {
      setIsGenerating(true);
      try {
        const canvas = await renderDynamicSocialCard(activeTemplate, {
          aspectRatio,
          ...initialData,
        });

        if (isCurrent && canvas) {
          canvasRef.current = canvas;
          setPreviewDataUrl(canvas.toDataURL('image/png'));
        }
      } catch (err) {
        console.error('Failed to generate social card:', err);
      } finally {
        if (isCurrent) setIsGenerating(false);
      }
    }

    generate();
    return () => {
      isCurrent = false;
    };
  }, [isOpen, activeTemplate, aspectRatio, initialData]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!canvasRef.current) return;
    soundEngine.playMechanicalClick();
    hapticEngine.successPulse();
    downloadCanvasAsPng(canvasRef.current, `adsa-tboard-${activeTemplate}-${aspectRatio}.png`);
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;
    try {
      await copyCanvasToClipboard(canvasRef.current);
      setCopiedImage(true);
      soundEngine.playSoftChime();
      hapticEngine.successPulse();
      setTimeout(() => setCopiedImage(false), 2500);
    } catch (_) {
      // Fallback: copy link
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      const url = initialData.customUrl || 'https://canteen.alathurpadidars.in';
      await navigator.clipboard.writeText(url);
      setCopiedLink(true);
      soundEngine.playMechanicalClick();
      hapticEngine.lightTap();
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (_) {}
  };

  const handleShareTelegram = () => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    const url = initialData.customUrl || 'https://canteen.alathurpadidars.in';
    const text = `🍽️ *ADSA T-Board • Alathurpadi Dars Food Management System*\n${
      initialData.description || 'Check out today’s live meal attendance matrix and dining schedule.'
    }\n\n`;
    const tgUrl = `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(tgUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShareWhatsApp = () => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    const url = initialData.customUrl || 'https://canteen.alathurpadidars.in';
    const text = `*ADSA T-Board • Alathurpadi Dars*\n${
      initialData.description || 'Live dining attendance matrix & campus canteen portal'
    }\n\n${url}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  const handleNativeShare = async () => {
    if (!canvasRef.current || typeof navigator === 'undefined' || !navigator.share) return;
    try {
      const blob = await canvasToBlob(canvasRef.current);
      const file = new File([blob], `adsa-tboard-${activeTemplate}.png`, { type: 'image/png' });
      await navigator.share({
        title: 'ADSA T-Board • Alathurpadi Dars',
        text: initialData.description || 'Alathurpadi Dars Food Management System',
        url: initialData.customUrl || 'https://canteen.alathurpadidars.in',
        files: [file],
      });
      soundEngine.playSoftChime();
      hapticEngine.successPulse();
    } catch (_) {}
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

        {/* Modal Frame */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 15 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          className="relative w-full max-w-4xl max-h-[92vh] rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/15 p-5 sm:p-7 shadow-2xl flex flex-col z-10 overflow-y-auto select-none"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-200/70 dark:border-white/10 flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>Social Card Studio &amp; Dynamic Visuals</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    Auto-Generated HD
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Ultra-HD visual preview cards optimized for Telegram, WhatsApp, Twitter, and iMessage.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Controls Bar: Template Selector & Aspect Ratio */}
          <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-shrink-0">
            {/* Template Selector Pills */}
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 overflow-x-auto scrollbar-none">
              {TEMPLATES.map((tmpl) => {
                const Icon = tmpl.icon;
                const isSelected = activeTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playPop();
                      hapticEngine.lightTap();
                      setActiveTemplate(tmpl.id);
                    }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                      isSelected
                        ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tmpl.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Aspect Ratio Switcher */}
            <div className="flex items-center p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  setAspectRatio('landscape');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  aspectRatio === 'landscape'
                    ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                1.91:1 Landscape (1200x630)
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  setAspectRatio('square');
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  aspectRatio === 'square'
                    ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                1:1 Square (1080x1080)
              </button>
            </div>
          </div>

          {/* Canvas Live Preview Showcase */}
          <div className="mt-5 relative w-full flex items-center justify-center p-4 sm:p-6 rounded-3xl bg-black/40 border border-gray-200/80 dark:border-white/10 shadow-inner overflow-hidden">
            {isGenerating && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-xs gap-2 text-white text-xs font-bold">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
                <span>Synthesizing Card Graphics...</span>
              </div>
            )}

            {previewDataUrl ? (
              <div
                className={`w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/20 transition-all ${
                  aspectRatio === 'square' ? 'max-w-md aspect-square' : 'aspect-[1.91/1]'
                }`}
              >
                <img
                  src={previewDataUrl}
                  alt="Dynamic Social Preview Card"
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-500 text-xs font-bold">
                Rendering Preview...
              </div>
            )}
          </div>

          {/* Action Toolbar */}
          <div className="mt-5 pt-4 border-t border-gray-200/70 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
            {/* Quick 1-Click Channels */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleShareTelegram}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-500/20 active:scale-95 transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Share to Telegram</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Share to WhatsApp</span>
              </button>
            </div>

            {/* Export & Clipboard Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopyImage}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 py-2.5 px-3.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 text-xs font-bold text-gray-800 dark:text-gray-100 transition-all active:scale-95"
                title="Copy high-res image to clipboard"
              >
                {copiedImage ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copiedImage ? 'Image Copied!' : 'Copy Image'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Ultra-HD PNG</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
