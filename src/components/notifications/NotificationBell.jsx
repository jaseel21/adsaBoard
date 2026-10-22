import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles } from 'lucide-react';
import { useNotifications } from '../../store/NotificationContext';
import { useLanguage } from '../../store/LanguageContext';

export default function NotificationBell({ className = '' }) {
  const { unreadCount, toggleDrawer, isDrawerOpen } = useNotifications();
  const { t } = useLanguage();

  return (
    <div className="relative">
      <motion.button
        type="button"
        onClick={toggleDrawer}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        className={`relative p-2 xs:p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center select-none ${
          isDrawerOpen
            ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm'
            : unreadCount > 0
            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300/80 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:border-emerald-400 dark:hover:border-emerald-400/50'
            : 'bg-transparent border-gray-200/70 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-white/5'
        } ${className}`}
        aria-label={t('notificationsTitle', 'Notifications')}
        title={`${t('notificationsTitle', 'Notifications')} (${t('notificationKbdHint', "Press 'N'")})`}
      >
        {/* Animated Bell Icon */}
        <motion.div
          animate={
            unreadCount > 0
              ? {
                  rotate: [0, -14, 14, -10, 10, 0],
                  transition: {
                    duration: 1.8,
                    repeat: Infinity,
                    repeatDelay: 3.5,
                    ease: 'easeInOut',
                  },
                }
              : {}
          }
        >
          <Bell className="w-4 h-4 xs:w-4.5 xs:h-4.5" />
        </motion.div>

        {/* Ambient Ring Wave if unread items exist */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 dark:bg-emerald-500 opacity-75" />
          </span>
        )}

        {/* Bouncy Unread Counter Pill Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-gradient-to-r from-emerald-600 to-teal-500 text-white text-[10px] font-black flex items-center justify-center shadow-md shadow-emerald-600/30 border border-white dark:border-[#080d0b]"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
