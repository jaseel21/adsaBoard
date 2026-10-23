import React, { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Bell,
  CheckCheck,
  Search,
  Sliders,
  Volume2,
  VolumeX,
  ExternalLink,
  Sparkles,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import { useNotifications } from '../../store/NotificationContext';
import { useLanguage } from '../../store/LanguageContext';
import { AuthContext } from '../../store/AuthContext';
import NotificationCard from './NotificationCard';
import NotificationFilterTabs from './NotificationFilterTabs';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';

export default function NotificationDrawer() {
  const {
    isDrawerOpen,
    closeDrawer,
    filteredNotifications,
    notifications,
    unreadCount,
    markAllAsRead,
    searchQuery,
    setSearchQuery,
    activeCategory,
  } = useNotifications();

  const { t } = useLanguage();
  const { isCanteenCommittee } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const drawerRef = useRef(null);
  const searchInputRef = useRef(null);

  // Focus search input when drawer opens if desired
  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isDrawerOpen]);

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop Blur Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={closeDrawer}
            className="fixed inset-0 bg-black/45 dark:bg-black/65 backdrop-blur-sm"
          />

          {/* Slide-Over Glassmorphic Panel */}
          <motion.div
            ref={drawerRef}
            initial={{ x: '100%', opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 320 }}
            data-lenis-prevent
            className="relative w-full max-w-md sm:max-w-lg h-full bg-white/95 dark:bg-[#0b1310]/95 backdrop-blur-2xl border-l border-gray-200/80 dark:border-white/10 shadow-2xl flex flex-col z-10"
            role="dialog"
            aria-modal="true"
            aria-label={t('notificationsTitle', 'Notifications')}
          >
            {/* Header Island */}
            <div className="p-4 sm:p-5 border-b border-gray-200/70 dark:border-white/10 flex-shrink-0 bg-white/70 dark:bg-black/20 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300/50 dark:border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white">
                        {t('notificationsTitle', 'Notifications')}
                      </h3>
                      {unreadCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-emerald-500 text-white shadow-sm">
                          {unreadCount} {t('unreadNotifsBadge', 'Unread')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {t('notificationsSubtitle', 'Campus updates, dining announcements & alerts')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {/* Mark All As Read */}
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="p-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-gray-200/80 dark:border-white/10 transition-colors flex items-center gap-1.5"
                      title={t('markAllRead', 'Mark all as read')}
                    >
                      <CheckCheck className="w-4 h-4 text-emerald-500" />
                      <span className="hidden sm:inline">{t('markAllRead', 'Mark Read')}</span>
                    </button>
                  )}

                  {/* Close Button */}
                  <button
                    type="button"
                    onClick={closeDrawer}
                    className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200/80 dark:border-white/10 transition-colors"
                    aria-label="Close notifications"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mt-3 relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search announcements..."
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-gray-100/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Filter Pills */}
              <div className="mt-2.5">
                <NotificationFilterTabs />
              </div>
            </div>

            {/* Scrollable Notification List */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3.5 overscroll-contain">
              {filteredNotifications.length > 0 ? (
                filteredNotifications.map((notification, index) => (
                  <NotificationCard
                    key={notification.id}
                    notification={notification}
                    index={index}
                  />
                ))
              ) : (
                <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-6 select-none">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center shadow-inner mb-4">
                    <Sparkles className="w-8 h-8 text-emerald-500 animate-pulse" />
                  </div>
                  <h4 className="text-base font-extrabold text-gray-800 dark:text-gray-200">
                    {searchQuery ? 'No matching announcements' : t('noNotifications', 'All caught up!')}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs leading-relaxed">
                    {searchQuery
                      ? 'Try different keywords or switch the category filter tab.'
                      : t(
                          'noNotificationsSub',
                          'No active announcements for your token or batch.'
                        )}
                  </p>
                </div>
              )}
            </div>

            {/* Footer Island */}
            <div className="p-3 sm:p-4 border-t border-gray-200/70 dark:border-white/10 bg-gray-50/70 dark:bg-black/30 backdrop-blur-xl flex items-center justify-between gap-2 flex-shrink-0 text-[11px] font-bold text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-2">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 font-mono text-[10px]">
                  N
                </kbd>
                <span>Toggle Drawer</span>
                <span className="text-gray-300 dark:text-gray-600">•</span>
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 font-mono text-[10px]">
                  Esc
                </kbd>
                <span>Close</span>
              </div>

              {/* Committee Broadcast Studio Shortcut */}
              {isCanteenCommittee && (
                <button
                  type="button"
                  onClick={() => {
                    closeDrawer();
                    navigate('/admin/notifications');
                  }}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 transition-all ml-auto active:scale-95"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>Apex Studio</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
