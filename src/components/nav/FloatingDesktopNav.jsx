import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  UtensilsCrossed,
  ChefHat,
  Sliders,
  Search,
  UserCheck,
  KeyRound,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { useWorldTime } from '../../utils/time';
import { useSidebar } from './SidebarContext';
import LanguageSwitch from '../LanguageSwitch';
import ThemeSwitch from '../ThemeSwitch';
import NotificationBell from '../notifications/NotificationBell';

/**
 * Tooltip wrapper for icon-only navigation buttons
 */
function NavIconButton({
  onClick,
  active,
  icon: Icon,
  tooltip,
  pulseDot = false,
  badgeCount = null,
  highlight = false,
  layoutId = null,
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative flex items-center justify-center">
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative p-2.5 rounded-full transition-all duration-200 select-none flex items-center justify-center ${
          active
            ? 'text-emerald-600 dark:text-emerald-400 font-black'
            : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10'
        } ${highlight ? 'text-emerald-600 dark:text-emerald-400' : ''}`}
        aria-label={tooltip}
      >
        {active && layoutId && (
          <motion.div
            layoutId={layoutId}
            transition={{ type: 'spring', stiffness: 450, damping: 32 }}
            className="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/20 border border-emerald-500/30 rounded-full -z-10 shadow-xs"
          />
        )}

        <Icon className="w-4 h-4 transition-transform duration-200 hover:scale-110" />

        {pulseDot && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse border-2 border-white dark:border-[#080d0b]" />
        )}

        {badgeCount !== null && badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
            {badgeCount}
          </span>
        )}
      </button>

      {/* Floating Hover Tooltip */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-2 px-2.5 py-1 rounded-xl bg-gray-900/95 dark:bg-[#15221e]/95 text-white border border-white/10 shadow-xl backdrop-blur-xl text-[11px] font-bold whitespace-nowrap pointer-events-none z-50 flex items-center gap-1.5"
          >
            <span>{tooltip}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FloatingDesktopNav({
  user,
  stdata,
  isCook,
  isCanteenCommittee,
  onOpenSearch,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const { sidebarOpen, isDesktop } = useSidebar();
  const { nowDate, timeParts, dayFull, longDate } = useWorldTime('Asia/Kolkata');

  const handleNav = (path) => {
    feedback('tick');
    navigate(path);
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isStudentLoggedIn = Boolean(stdata?.tokenNo);

  return (
    <nav
      style={{
        left: isDesktop && sidebarOpen ? 'calc(50% + 9rem)' : '50%',
      }}
      className="hidden md:flex fixed top-3.5 -translate-x-1/2 z-40 items-center gap-1 px-2.5 py-1.5 rounded-full bg-white/85 dark:bg-[#080d0b]/85 backdrop-blur-2xl border border-gray-200/80 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-emerald-950/20 transition-all duration-300 max-w-fit mx-auto"
    >
      {/* 1. Brand Emblem Logo (Home) */}
      <button
        type="button"
        onClick={() => handleNav('/')}
        className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/60 dark:to-emerald-900/30 border border-emerald-300/60 dark:border-emerald-500/20 shadow-xs hover:scale-105 transition-all flex items-center justify-center flex-shrink-0 mr-1"
        title="ADSA T-Board Home"
        aria-label="ADSA T-Board Home"
      >
        <img
          src="https://alathurpadiDars.in/wp-content/uploads/2019/08/Dars-Site-Logo1.png"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
          alt="Alathurpadi Dars Crest"
          className="w-6 h-6 object-contain"
        />
      </button>

      {/* 2. Home Icon */}
      <NavIconButton
        onClick={() => handleNav('/')}
        active={isActive('/')}
        icon={Home}
        tooltip={t('navHome', 'Home')}
        layoutId="activeFloatingIcon"
      />

      {/* 3. Food Menu Icon */}
      <NavIconButton
        onClick={() => handleNav('/menu')}
        active={isActive('/menu')}
        icon={UtensilsCrossed}
        tooltip={t('navMenu', 'Food Menu')}
        layoutId="activeFloatingIcon"
      />

      {/* 5. Student Dining Portal Icon */}
      {isStudentLoggedIn ? (
        <NavIconButton
          onClick={() => handleNav('/student')}
          active={isActive('/student')}
          icon={UserCheck}
          tooltip={`Token #${stdata.tokenNo} (${t('studentPortal', 'Student Portal')})`}
          pulseDot={true}
          layoutId="activeFloatingIcon"
        />
      ) : (
        !user && (
          <NavIconButton
            onClick={() => handleNav('/login')}
            active={isActive('/login')}
            icon={KeyRound}
            tooltip={t('navStudentPortal', 'Student Login')}
            layoutId="activeFloatingIcon"
          />
        )
      )}

      {/* 6. Staff Primary Console Icon (if logged in as Staff) */}
      {user && isCook && (
        <NavIconButton
          onClick={() => handleNav('/kitchen')}
          active={isActive('/kitchen')}
          icon={ChefHat}
          tooltip={t('kitchen', 'Kitchen KDS')}
          layoutId="activeFloatingIcon"
        />
      )}

      {user && isCanteenCommittee && (
        <NavIconButton
          onClick={() => handleNav('/admin')}
          active={isActive('/admin')}
          icon={Sliders}
          tooltip={t('masterBoard', 'Master Token Board')}
          layoutId="activeFloatingIcon"
        />
      )}

      {/* Vertical Subtle Divider */}
      <div className="h-5 w-px bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0" />

      {/* 7. Instant Search Icon */}
      <NavIconButton
        onClick={() => {
          feedback('pop');
          onOpenSearch();
        }}
        active={false}
        icon={Search}
        tooltip="Search (⌘K)"
      />

      {/* 8. Notification Bell */}
      <div className="flex items-center justify-center p-0.5">
        <NotificationBell />
      </div>

      {/* 9. Language Switcher (Icon-Only) */}
      <div className="flex items-center justify-center p-0.5">
        <LanguageSwitch iconOnly={true} />
      </div>

      {/* 10. Theme Switcher (Icon-Only) */}
      <div className="flex items-center justify-center p-0.5">
        <ThemeSwitch iconOnly={true} />
      </div>

      {/* Vertical Subtle Divider before Date/Time */}
      <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0" />

      {/* 10. Clean Date, Day, Time Pill at Right End */}
      <div
        className="flex items-center gap-1.5 pl-2.5 pr-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/5 text-[11px] select-none flex-shrink-0"
        title={longDate ? `${dayFull}, ${longDate} (${timeParts?.hours || ''}:${timeParts?.minutes || ''} ${timeParts?.period || ''} IST)` : 'Indian Standard Time (IST)'}
      >
        <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
          {dayFull ? dayFull.slice(0, 3) : ''}
        </span>
        <span className="text-gray-300 dark:text-white/20 text-[9px]">•</span>
        <span className="font-semibold text-gray-700 dark:text-gray-300 tracking-tight">
          {nowDate ? `${nowDate.getUTCDate()} ${nowDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}` : ''}
        </span>
        <span className="text-gray-300 dark:text-white/20 text-[9px]">•</span>
        <span className="font-mono font-bold text-gray-900 dark:text-white tracking-tight">
          {timeParts ? `${timeParts.hours}:${timeParts.minutes} ${timeParts.period}` : '--:--'}
        </span>
      </div>
    </nav>
  );
}
