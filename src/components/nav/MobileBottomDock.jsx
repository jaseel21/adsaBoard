import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  UtensilsCrossed,
  UserCheck,
  KeyRound,
  Menu,
  ChefHat,
  Sliders,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { useScrollHeader } from '../scroll/useScrollHeader';

export default function MobileBottomDock({
  stdata,
  user,
  isCook,
  isCanteenCommittee,
  onOpenSidebar,
  sidebarOpen,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  // Directional scroll show/hide hook
  const isVisible = useScrollHeader({ threshold: 25, delta: 6 });

  const handleNav = (path) => {
    feedback('tick');
    navigate(path);
  };

  const isActive = (path) => {
    if (sidebarOpen) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Determine student vs login destination & label
  const isStudentLoggedIn = Boolean(stdata?.tokenNo);
  const studentPath = isStudentLoggedIn ? '/student' : '/login';
  const studentLabel = isStudentLoggedIn ? `#${stdata.tokenNo}` : (t('navStudentPortal') || 'Student');

  return (
    <motion.div
      initial={{ y: 0, opacity: 1 }}
      animate={{
        y: isVisible || sidebarOpen ? 0 : 100,
        opacity: isVisible || sidebarOpen ? 1 : 0,
      }}
      transition={{ type: 'spring', damping: 26, stiffness: 320 }}
      className="fixed bottom-[calc(0.85rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-40 md:hidden pointer-events-none flex justify-center select-none"
    >
      {/* Complete Curved Rectangle Floating Dock */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="pointer-events-auto w-full max-w-sm rounded-[28px] bg-white/95 dark:bg-[#0c1412]/95 backdrop-blur-2xl border border-gray-200/80 dark:border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.18)] dark:shadow-[0_12px_36px_rgba(0,0,0,0.55)] p-1.5 flex items-center justify-around gap-1"
      >
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => handleNav('/')}
          className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-[22px] transition-all cursor-pointer ${
            isActive('/')
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {isActive('/') && (
            <motion.div
              layoutId="activeMobileBottomTab"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-[22px] border border-emerald-500/30 -z-10 shadow-xs"
            />
          )}
          <Home className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{t('navHome') || 'Home'}</span>
        </button>

        {/* 2. Food Menu */}
        <button
          type="button"
          onClick={() => handleNav('/menu')}
          className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-[22px] transition-all cursor-pointer ${
            isActive('/menu')
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {isActive('/menu') && (
            <motion.div
              layoutId="activeMobileBottomTab"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-[22px] border border-emerald-500/30 -z-10 shadow-xs"
            />
          )}
          <UtensilsCrossed className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">{t('navMenu') || 'Menu'}</span>
        </button>

        {/* 3. Student / Portal or Staff Primary Console */}
        <button
          type="button"
          onClick={() => {
            if (user && isCook) {
              handleNav('/kitchen');
            } else if (user && isCanteenCommittee) {
              handleNav('/admin');
            } else {
              handleNav(studentPath);
            }
          }}
          className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-[22px] transition-all cursor-pointer ${
            isActive('/student') || isActive('/login') || (user && (isActive('/kitchen') || isActive('/admin')))
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {(isActive('/student') || isActive('/login') || (user && (isActive('/kitchen') || isActive('/admin')))) && (
            <motion.div
              layoutId="activeMobileBottomTab"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-[22px] border border-emerald-500/30 -z-10 shadow-xs"
            />
          )}

          {user ? (
            isCook ? (
              <ChefHat className="w-5 h-5 mb-0.5" />
            ) : (
              <Sliders className="w-5 h-5 mb-0.5" />
            )
          ) : isStudentLoggedIn ? (
            <UserCheck className="w-5 h-5 mb-0.5" />
          ) : (
            <KeyRound className="w-5 h-5 mb-0.5" />
          )}

          <span className="text-[10px] tracking-tight truncate max-w-[64px]">
            {user ? (isCook ? 'Kitchen' : 'Master') : studentLabel}
          </span>
        </button>

        {/* 4. All Pages / Mega Drawer */}
        <button
          type="button"
          onClick={() => {
            feedback('pop');
            onOpenSidebar();
          }}
          className={`relative flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-[22px] transition-all cursor-pointer ${
            sidebarOpen
              ? 'text-emerald-600 dark:text-emerald-400 font-black'
              : 'text-gray-600 dark:text-gray-400 font-medium hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          {sidebarOpen && (
            <motion.div
              layoutId="activeMobileBottomTab"
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/20 rounded-[22px] border border-emerald-500/30 -z-10 shadow-xs"
            />
          )}
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">More</span>
        </button>
      </nav>
    </motion.div>
  );
}
