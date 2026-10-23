import React, { useState, useRef, useEffect } from 'react';
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
import LanguageSwitch from '../LanguageSwitch';
import ThemeSwitch from '../ThemeSwitch';
import NotificationBell from '../notifications/NotificationBell';
import FloatingCalendarPopover from './FloatingCalendarPopover';
import FloatingClockPopover from './FloatingClockPopover';
import { useScrollHeader } from '../scroll/useScrollHeader';

/**
 * Dynamic Nav Button with smooth spring shrink/expand typography
 */
function DynamicNavButton({
  onClick,
  active,
  icon: Icon,
  label,
  tooltip,
  isExpanded = true,
  pulseDot = false,
  badgeCount = null,
  layoutId = 'activeFloatingPill',
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div className="relative flex items-center justify-center">
      <motion.button
        type="button"
        layout
        onClick={onClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`relative rounded-full transition-all duration-200 select-none flex items-center justify-center gap-1.5 cursor-pointer ${
          isExpanded ? 'px-3 py-1.5' : 'p-2'
        } ${
          active
            ? 'text-emerald-700 dark:text-emerald-300 font-extrabold'
            : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 font-semibold'
        }`}
        aria-label={tooltip || label}
      >
        {active && (
          <motion.div
            layoutId={layoutId}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/35 rounded-full -z-10 shadow-xs"
          />
        )}

        <Icon className="w-4 h-4 flex-shrink-0 transition-transform duration-200" />

        {/* Dynamic Title with Spring Width Animation */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="inline-block text-xs tracking-tight whitespace-nowrap overflow-hidden"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>

        {pulseDot && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse border-2 border-white dark:border-[#080d0b]" />
        )}

        {badgeCount !== null && badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
            {badgeCount}
          </span>
        )}
      </motion.button>

      {/* Floating Hover Tooltip (when compact or hovered) */}
      <AnimatePresence>
        {hovered && !isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full mt-2 px-2.5 py-1 rounded-xl bg-gray-900/95 dark:bg-[#15221e]/95 text-white border border-white/10 shadow-xl backdrop-blur-xl text-[11px] font-bold whitespace-nowrap pointer-events-none z-50 flex items-center gap-1.5"
          >
            <span>{tooltip || label}</span>
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
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();
  const { nowDate, timeParts, dayFull } = useWorldTime('Asia/Kolkata');

  // Directional scroll show/hide hook (glides out on scroll down, returns on scroll up)
  const isVisible = useScrollHeader({ threshold: 30, delta: 6 });

  // Track window scroll position to expand titles when near top of page
  const [scrollY, setScrollY] = useState(0);
  const [isNavHovered, setIsNavHovered] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY || 0);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Titles expand when: hovering over the navbar OR when near top of page (scrollY <= 50)
  const isExpanded = isNavHovered || scrollY <= 50;

  // Popover states for Calendar & Clock
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [clockOpen, setClockOpen] = useState(false);
  const [calendarAnchor, setCalendarAnchor] = useState(null);
  const [clockAnchor, setClockAnchor] = useState(null);

  const dateBtnRef = useRef(null);
  const clockBtnRef = useRef(null);

  const handleNav = (path) => {
    feedback('tick');
    navigate(path);
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isStudentLoggedIn = Boolean(stdata?.tokenNo);

  const handleOpenCalendar = () => {
    feedback('tick');
    if (dateBtnRef.current) {
      setCalendarAnchor(dateBtnRef.current.getBoundingClientRect());
    }
    setClockOpen(false);
    setCalendarOpen((prev) => !prev);
  };

  const handleOpenClock = () => {
    feedback('tick');
    if (clockBtnRef.current) {
      setClockAnchor(clockBtnRef.current.getBoundingClientRect());
    }
    setCalendarOpen(false);
    setClockOpen((prev) => !prev);
  };

  return (
    <>
      <motion.nav
        layout
        onMouseEnter={() => setIsNavHovered(true)}
        onMouseLeave={() => setIsNavHovered(false)}
        style={{
          left: '50%',
          x: '-50%',
        }}
        initial={{ y: 0 }}
        animate={{
          y: isVisible || isNavHovered ? 0 : -80,
          scale: !isExpanded && !isNavHovered ? 0.98 : 1,
        }}
        transition={{ type: 'spring', damping: 28, stiffness: 360 }}
        className={`hidden md:flex fixed top-3.5 z-40 items-center gap-1 transition-colors duration-300 max-w-fit mx-auto rounded-full ${
          !isExpanded && !isNavHovered
            ? 'px-2 py-1 bg-white/90 dark:bg-[#080d0b]/90 backdrop-blur-2xl border border-gray-200/90 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-emerald-950/20'
            : 'px-2.5 py-1.5 bg-white/85 dark:bg-[#080d0b]/85 backdrop-blur-2xl border border-gray-200/80 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-emerald-950/20'
        }`}
      >
        {/* 1. Brand Emblem Logo (Home) */}
        {/* <button
          type="button"
          onClick={() => handleNav('/')}
          className="w-8 h-8 rounded-full p-0.5 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/60 dark:to-emerald-900/30 border border-emerald-300/60 dark:border-emerald-500/20 shadow-xs hover:scale-105 transition-all flex items-center justify-center flex-shrink-0 mr-0.5 cursor-pointer"
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
        </button> */}

        {/* 2. Home Tab (Dynamic expansion) */}
        <DynamicNavButton
          onClick={() => handleNav('/')}
          active={isActive('/')}
          icon={Home}
          label={t('navHome', 'Home')}
          tooltip={t('navHome', 'Home')}
          isExpanded={isExpanded}
        />

        {/* 3. Food Menu Tab (Dynamic expansion) */}
        <DynamicNavButton
          onClick={() => handleNav('/menu')}
          active={isActive('/menu')}
          icon={UtensilsCrossed}
          label={lang === 'ml' ? 'മെനു' : 'Menu'}
          tooltip={t('navMenu', 'Food Menu')}
          isExpanded={isExpanded}
        />

        {/* 4. Student Dining Portal Tab (Dynamic expansion) */}
        {isStudentLoggedIn ? (
          <DynamicNavButton
            onClick={() => handleNav('/student')}
            active={isActive('/student')}
            icon={UserCheck}
            label={`#${stdata.tokenNo}`}
            tooltip={`Token #${stdata.tokenNo} (${t('studentPortal', 'Student Portal')})`}
            pulseDot={true}
            isExpanded={isExpanded}
          />
        ) : (
          !user && (
            <DynamicNavButton
              onClick={() => handleNav('/login')}
              active={isActive('/login')}
              icon={KeyRound}
              label={lang === 'ml' ? 'ലോഗിൻ' : 'Login'}
              tooltip={t('navStudentPortal', 'Student Login')}
              isExpanded={isExpanded}
            />
          )
        )}

        {/* 5. Kitchen Staff Console Tab (if cook) */}
        {user && isCook && (
          <DynamicNavButton
            onClick={() => handleNav('/kitchen')}
            active={isActive('/kitchen')}
            icon={ChefHat}
            label={lang === 'ml' ? 'കിച്ചൻ' : 'Kitchen'}
            tooltip={t('kitchen', 'Kitchen KDS')}
            isExpanded={isExpanded}
          />
        )}

        {/* 6. Master Board / Admin Tab (if committee) */}
        {user && isCanteenCommittee && (
          <DynamicNavButton
            onClick={() => handleNav('/admin')}
            active={isActive('/admin')}
            icon={Sliders}
            label={lang === 'ml' ? 'അഡ്മിൻ' : 'Admin'}
            tooltip={t('masterBoard', 'Master Token Board')}
            isExpanded={isExpanded}
          />
        )}

        {/* Vertical Divider */}
        <div className="h-5 w-px bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0" />

        {/* 7. Instant Search Icon */}
        <DynamicNavButton
          onClick={() => {
            feedback('pop');
            onOpenSearch();
          }}
          active={false}
          icon={Search}
          label={lang === 'ml' ? 'തിരയുക' : 'Search'}
          tooltip="Search (⌘K)"
          isExpanded={isExpanded}
        />

        {/* 8. Notification Bell */}
        <div className="flex items-center justify-center p-0.5">
          <NotificationBell />
        </div>

        {/* 9. Language Switcher (Icon Only with Indicator Badge) */}
        <div className="flex items-center justify-center p-0.5">
          <LanguageSwitch iconOnly={true} />
        </div>

        {/* 10. Theme Switcher (Icon Only) */}
        <div className="flex items-center justify-center p-0.5">
          <ThemeSwitch iconOnly={true} />
        </div>

        {/* Vertical Divider before Date & Time */}
        <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0" />

        {/* 11. Interactive Date & Clock Dual Capsule */}
        <div className="flex items-center rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[11px] select-none flex-shrink-0 p-0.5 gap-0.5">
          {/* Clickable Date Trigger (Opens complete calendar) */}
          <button
            ref={dateBtnRef}
            type="button"
            onClick={handleOpenCalendar}
            className={`flex items-center gap-1.5 pl-2.5 pr-2 py-0.5 rounded-full transition-all duration-200 cursor-pointer ${
              calendarOpen
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold shadow-xs'
                : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
            }`}
            title="Click on date to open complete calendar"
            aria-label="Open Complete Calendar"
          >
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {dayFull ? dayFull.slice(0, 3) : ''}
            </span>
            <span className="text-gray-300 dark:text-white/20 text-[9px]">•</span>
            <span className="font-semibold tracking-tight">
              {nowDate ? `${nowDate.getUTCDate()} ${nowDate.toLocaleDateString('en-US', { month: 'short', timeZone: 'UTC' })}` : ''}
            </span>
          </button>

          {/* Micro divider */}
          <span className="text-gray-300 dark:text-white/20 text-[9px]">•</span>

          {/* Clickable Clock Trigger (Opens live clock & meal timeline) */}
          <button
            ref={clockBtnRef}
            type="button"
            onClick={handleOpenClock}
            className={`flex items-center gap-1 pl-1.5 pr-2.5 py-0.5 rounded-full transition-all duration-200 cursor-pointer ${
              clockOpen
                ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold shadow-xs'
                : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-900 dark:text-white'
            }`}
            title="Click on clock to open live analog clock & campus meal timeline"
            aria-label="Open Proper Clock"
          >
            <span className="font-mono font-bold tracking-tight">
              {timeParts ? `${timeParts.hours}:${timeParts.minutes} ${timeParts.period}` : '--:--'}
            </span>
          </button>
        </div>
      </motion.nav>

      {/* Complete Calendar Dropdown Popover */}
      <FloatingCalendarPopover
        isOpen={calendarOpen}
        onClose={() => setCalendarOpen(false)}
        anchorRect={calendarAnchor}
      />

      {/* Proper Clock & Meal Timeline Popover */}
      <FloatingClockPopover
        isOpen={clockOpen}
        onClose={() => setClockOpen(false)}
        anchorRect={clockAnchor}
      />
    </>
  );
}
