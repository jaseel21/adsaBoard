import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Menu } from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import ThemeSwitch from '../ThemeSwitch';
import LanguageSwitch from '../LanguageSwitch';
import NotificationBell from '../notifications/NotificationBell';
import { useScrollHeader } from '../scroll/useScrollHeader';

export default function MobileTopBar({
  user,
  roleBadge,
  stdata,
  onOpenSidebar,
  onOpenSearch,
}) {
  const navigate = useNavigate();
  const { feedback } = useFeedback();

  // Synchronized directional scroll hook (auto-hides on scroll down, reveals on scroll up)
  const isVisible = useScrollHeader({ threshold: 25, delta: 6 });

  return (
    <motion.header
      initial={{ y: 0 }}
      animate={{
        y: isVisible ? 0 : -80,
      }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className="md:hidden sticky top-0 z-40 w-full bg-white/90 dark:bg-[#080d0b]/90 backdrop-blur-2xl border-b border-gray-200/80 dark:border-white/10 transition-colors"
    >
      <div className="max-w-7xl mx-auto px-3 py-2 flex items-center justify-between">
        {/* Brand Crest & Title */}
        <div
          onClick={() => {
            feedback('tick');
            navigate('/');
          }}
          className="flex items-center gap-2 cursor-pointer select-none min-w-0"
        >
          <div className="w-8 h-8 rounded-xl p-0.5 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/60 dark:to-emerald-900/30 border border-emerald-300/60 dark:border-emerald-500/20 shadow-sm flex items-center justify-center flex-shrink-0">
            <img
              src="https://alathurpadiDars.in/wp-content/uploads/2019/08/Dars-Site-Logo1.png"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              alt="Alathurpadi Dars Crest"
              className="w-6 h-6 object-contain"
            />
          </div>

          <div className="flex items-center gap-1 min-w-0">
            <span className="font-black text-base tracking-tight text-emerald-600 dark:text-emerald-400">
              ADSA
            </span>
            <span className="font-extrabold text-base tracking-tight text-gray-800 dark:text-white">
              T-Board
            </span>

            {user && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 truncate max-w-[80px]">
                {roleBadge?.label || 'Staff'}
              </span>
            )}
            {stdata?.tokenNo && !user && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                #{stdata.tokenNo}
              </span>
            )}
          </div>
        </div>

        {/* Right Action Island */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Quick Search */}
          <button
            type="button"
            onClick={() => {
              feedback('pop');
              onOpenSearch();
            }}
            className="p-1.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200/60 dark:border-white/10 active:scale-95 cursor-pointer"
            title="Search pages (⌘K)"
            aria-label="Search pages"
          >
            <Search className="w-4 h-4 text-emerald-500" />
          </button>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Language Switch */}
          <LanguageSwitch iconOnly={true} />

          {/* Theme Switch */}
          <ThemeSwitch iconOnly={true} />

          {/* All Pages Drawer Trigger */}
          <button
            type="button"
            onClick={() => {
              feedback('pop');
              onOpenSidebar();
            }}
            className="p-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/50 dark:border-emerald-500/30 active:scale-95 flex items-center justify-center ml-0.5 cursor-pointer"
            title="Open Menu Drawer"
            aria-label="Open Menu Drawer"
          >
            <Menu className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.header>
  );
}
