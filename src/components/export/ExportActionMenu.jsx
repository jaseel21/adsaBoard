import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Eye,
  Printer,
  Share2,
  ChevronDown,
  Sliders,
  FileDown,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function ExportActionMenu({
  onView,
  onDownload,
  onPrint,
  onShare,
  onCustomize,
  isGenerating = false,
  label,
  defaultAction = 'view', // 'view' | 'download'
  colorTheme = 'emerald', // 'emerald' | 'amber' | 'rose' | 'teal'
  className = '',
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const themeClasses = {
    emerald: {
      gradient: 'from-emerald-600 via-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-emerald-500/20',
      border: 'border-emerald-500/30',
      iconText: 'text-emerald-600 dark:text-emerald-400',
    },
    amber: {
      gradient: 'from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-500/20',
      border: 'border-amber-500/30',
      iconText: 'text-amber-600 dark:text-amber-400',
    },
    rose: {
      gradient: 'from-rose-600 to-pink-600 hover:from-rose-700 hover:to-pink-700 shadow-rose-500/20',
      border: 'border-rose-500/30',
      iconText: 'text-rose-600 dark:text-rose-400',
    },
    teal: {
      gradient: 'from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 shadow-teal-500/20',
      border: 'border-teal-500/30',
      iconText: 'text-teal-600 dark:text-teal-400',
    },
  }[colorTheme] || {
    gradient: 'from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-emerald-500/20',
    border: 'border-emerald-500/30',
    iconText: 'text-emerald-600 dark:text-emerald-400',
  };

  const handlePrimaryClick = () => {
    feedback('tick');
    if (defaultAction === 'view' && onView) {
      onView();
    } else if (onDownload) {
      onDownload();
    }
  };

  return (
    <div ref={menuRef} className={`relative inline-flex w-full ${className}`}>
      <div className="flex w-full rounded-xl shadow-md overflow-hidden">
        {/* Primary Action Button */}
        <button
          type="button"
          onClick={handlePrimaryClick}
          disabled={isGenerating}
          className={`flex-1 inline-flex items-center justify-center gap-2 py-2.5 sm:py-3 px-3.5 sm:px-4 bg-gradient-to-r ${themeClasses.gradient} text-white font-bold text-xs sm:text-sm transition-all active:scale-[0.99] disabled:opacity-50 cursor-pointer`}
        >
          {defaultAction === 'view' ? (
            <Eye className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`} />
          ) : (
            <FileDown className={`w-4 h-4 ${isGenerating ? 'animate-bounce' : ''}`} />
          )}
          <span className="truncate">
            {isGenerating
              ? t('generating', 'Generating...')
              : label || (defaultAction === 'view' ? t('directView', 'Direct View & Actions') : t('download', 'Download'))}
          </span>
        </button>

        {/* Dropdown Toggle Caret */}
        <button
          type="button"
          onClick={() => {
            feedback('pop');
            setIsOpen((prev) => !prev);
          }}
          disabled={isGenerating}
          title={t('moreExportOptions', 'More Export Options')}
          className={`px-3 bg-gradient-to-r ${themeClasses.gradient} border-l border-white/20 text-white hover:brightness-110 transition-all flex items-center justify-center cursor-pointer`}
        >
          <ChevronDown
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Floating Action Menu Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-white dark:bg-[#101b17] border border-gray-200 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 divide-y divide-gray-100 dark:divide-white/5"
          >
            <div className="py-1 space-y-0.5">
              {/* Direct View */}
              {onView && (
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setIsOpen(false);
                    onView();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left cursor-pointer"
                >
                  <Eye className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div className="flex-1">
                    <span className="block font-bold">{t('directView', 'Direct View / Preview')}</span>
                    <span className="block text-[10px] text-gray-400 font-normal">
                      {t('previewWithoutDownload', 'Inspect in-app without downloading')}
                    </span>
                  </div>
                </button>
              )}

              {/* Direct Print */}
              {onPrint && (
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setIsOpen(false);
                    onPrint();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-teal-50 dark:hover:bg-teal-950/40 hover:text-teal-600 dark:hover:text-teal-400 transition-colors text-left cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                  <div className="flex-1">
                    <span className="block font-bold">{t('printDocument', 'Direct Print')}</span>
                    <span className="block text-[10px] text-gray-400 font-normal">
                      {t('printInstant', 'One-click physical print dialog')}
                    </span>
                  </div>
                </button>
              )}

              {/* Share */}
              {onShare && (
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setIsOpen(false);
                    onShare();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left cursor-pointer"
                >
                  <Share2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <div className="flex-1">
                    <span className="block font-bold">{t('shareDocument', 'Share Document')}</span>
                    <span className="block text-[10px] text-gray-400 font-normal">
                      {t('shareViaWhatsAppOrSystem', 'WhatsApp, AirDrop, Telegram, Email')}
                    </span>
                  </div>
                </button>
              )}

              {/* Direct Download */}
              {onDownload && (
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setIsOpen(false);
                    onDownload();
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                >
                  <Download className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <div className="flex-1">
                    <span className="block font-bold">{t('downloadFile', 'Download File')}</span>
                    <span className="block text-[10px] text-gray-400 font-normal">
                      {t('saveLocalFile', 'Save offline copy to disk')}
                    </span>
                  </div>
                </button>
              )}
            </div>

            {/* Optional Customize link */}
            {onCustomize && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setIsOpen(false);
                    onCustomize();
                  }}
                  className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>{t('customizeFilters', 'Advanced Filters & Options...')}</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
