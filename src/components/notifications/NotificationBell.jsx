import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles } from 'lucide-react';
import { useNotifications } from '../../store/NotificationContext';
import { useLanguage } from '../../store/LanguageContext';

export default function NotificationBell({ className = '', variant = 'default' }) {
  const { unreadCount, toggleDrawer, isDrawerOpen } = useNotifications();
  const { t } = useLanguage();

  const isPill = variant === 'pill';

  return (
    <div className={`relative flex items-center justify-center flex-shrink-0 ${className}`}>
      <motion.button
        type="button"
        onClick={toggleDrawer}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.94 }}
        className={
          isPill
            ? `relative rounded-full w-7 h-7 p-1.5 transition-all duration-150 select-none flex items-center justify-center cursor-pointer text-xs font-semibold flex-shrink-0 ${
                isDrawerOpen
                  ? 'text-emerald-700 dark:text-emerald-300 font-extrabold'
                  : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95'
              }`
            : `relative p-2 xs:p-2.5 rounded-xl border transition-all duration-300 flex items-center justify-center select-none ${
                isDrawerOpen
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : unreadCount > 0
                  ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-300/80 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:border-emerald-400 dark:hover:border-emerald-400/50'
                  : 'bg-transparent border-gray-200/70 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-white/5'
              }`
        }
        aria-label={t('notificationsTitle', 'Notifications')}
        aria-expanded={isDrawerOpen}
        title={`${t('notificationsTitle', 'Notifications')} (${t('notificationKbdHint', "Press 'N'")})`}
      >
        {isPill && isDrawerOpen && (
          <motion.div
            layoutId="activeFloatingPill"
            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
            className="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/35 rounded-full -z-10 shadow-xs"
          />
        )}

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
          <Bell className="w-4 h-4 flex-shrink-0" />
        </motion.div>

        {/* Ambient Ring Wave if unread items exist */}
        {unreadCount > 0 && !isPill && (
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
              className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs border border-white dark:border-[#080d0b]`}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
