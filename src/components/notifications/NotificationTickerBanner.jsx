import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  AlertCircle,
  Sparkles,
  X,
  ChevronRight,
  Pin,
  Volume2,
} from 'lucide-react';
import { useNotifications } from '../../store/NotificationContext';
import { useLanguage } from '../../store/LanguageContext';
import { soundEngine } from '../../utils/soundEffects';

export default function NotificationTickerBanner() {
  const { pinnedNotifications, dismissBanner, openDrawer, setSelectedNotification } =
    useNotifications();
  const { t } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!pinnedNotifications || pinnedNotifications.length === 0) {
    return null;
  }

  const activeNotice = pinnedNotifications[currentIndex] || pinnedNotifications[0];
  const severity = activeNotice.severity || 'warning';

  const isCritical = severity === 'critical';
  const isFestive = severity === 'festive';

  const handleOpenNotice = () => {
    soundEngine.playNotificationChime();
    openDrawer();
  };

  const handleDismiss = (e) => {
    e.stopPropagation();
    dismissBanner(activeNotice.id);
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={activeNotice.id}
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className={`w-full border-b select-none overflow-hidden ${
          isCritical
            ? 'bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white border-rose-700/60 shadow-md shadow-rose-900/10'
            : isFestive
            ? 'bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white border-amber-600 shadow-md shadow-amber-900/10'
            : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white border-emerald-700/60 shadow-md shadow-emerald-900/10'
        }`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5">
          <div className="flex items-center justify-between gap-3 text-xs sm:text-sm font-semibold">
            {/* Left Notice Pulse Tag & Content */}
            <div
              onClick={handleOpenNotice}
              className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer group"
            >
              <div className="p-1 rounded-lg bg-white/20 backdrop-blur-md flex-shrink-0 animate-pulse">
                {isCritical ? (
                  <AlertCircle className="w-4 h-4 text-white" />
                ) : isFestive ? (
                  <Sparkles className="w-4 h-4 text-yellow-200" />
                ) : (
                  <Pin className="w-4 h-4 text-white rotate-45" />
                )}
              </div>

              <div className="flex items-center gap-2 min-w-0 truncate">
                <span className="px-2 py-0.5 rounded-full bg-black/20 text-[10px] font-black uppercase tracking-wider text-white/90">
                  {activeNotice.category || t('pinnedBannerNotice', 'Important')}
                </span>
                <span className="font-extrabold tracking-tight truncate">
                  {activeNotice.title}
                </span>
                <span className="hidden md:inline text-white/80 font-normal truncate">
                  — {activeNotice.body}
                </span>
              </div>
            </div>

            {/* Right Action Controls: Multiple indicators + View button + Dismiss */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Pagination Dots if multiple pinned */}
              {pinnedNotifications.length > 1 && (
                <div className="hidden sm:flex items-center gap-1 mr-1">
                  {pinnedNotifications.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentIndex(i)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        currentIndex === i ? 'bg-white w-3' : 'bg-white/40'
                      }`}
                      aria-label={`Slide ${i + 1}`}
                    />
                  ))}
                </div>
              )}

              {/* View Announcement Button */}
              <button
                type="button"
                onClick={handleOpenNotice}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-all active:scale-95"
              >
                <span>View Details</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              {/* Dismiss Button */}
              {activeNotice.allowDismiss !== false && (
                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/20 transition-colors"
                  title={t('dismissBanner', 'Dismiss Banner')}
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
