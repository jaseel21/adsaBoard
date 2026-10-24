import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Home,
  UtensilsCrossed,
  ChefHat,
  Sliders,
  Search,
  UserCheck,
  KeyRound,
  Sparkles,
  Settings,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { useWorldTime } from '../../utils/time';
import { useSidebar } from './SidebarContext';
import LanguageSwitch from '../LanguageSwitch';
import ThemeSwitch from '../ThemeSwitch';
import NotificationBell from '../notifications/NotificationBell';
import FloatingCalendarPopover from './FloatingCalendarPopover';
import FloatingClockPopover from './FloatingClockPopover';
import { useScrollHeader } from '../scroll/useScrollHeader';

/**
 * Stable, ergonomic Nav Tab Button with smooth active pill indicator
 * Does not dynamically resize on hover, preventing cursor-edge juggling.
 */
function NavTabButton({
  onClick,
  active,
  icon: Icon,
  label,
  tooltip,
  pulseDot = false,
  badgeCount = null,
  layoutId = 'activeFloatingPill',
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative rounded-full ${
        label ? 'px-3 py-1.5 gap-1.5' : 'w-7 h-7 p-1.5'
      } transition-all duration-150 select-none flex items-center justify-center cursor-pointer text-xs font-semibold flex-shrink-0 ${
        active
          ? 'text-emerald-700 dark:text-emerald-300 font-extrabold'
          : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-black/5 dark:hover:bg-white/10 active:scale-95'
      }`}
      title={tooltip || label}
      aria-label={tooltip || label}
    >
      {active && (
        <motion.div
          layoutId={layoutId}
          transition={{ type: 'spring', stiffness: 420, damping: 32 }}
          className="absolute inset-0 bg-emerald-500/15 dark:bg-emerald-500/25 border border-emerald-500/35 rounded-full -z-10 shadow-xs"
        />
      )}

      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      {label && <span className="tracking-tight whitespace-nowrap">{label}</span>}

      {pulseDot && (
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
      )}

      {badgeCount !== null && badgeCount > 0 && (
        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black bg-emerald-600 text-white shadow-xs">
          {badgeCount}
        </span>
      )}
    </button>
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
  const { sidebarOpen, isDesktop } = useSidebar();

  // Directional scroll show/hide hook (glides out on scroll down, returns on scroll up)
  const isVisible = useScrollHeader({ threshold: 30, delta: 6 });

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

  // Center over visible content: when desktop sidebar is open, offset by half the 288px sidebar (+9rem / +144px)
  const targetLeft = isDesktop && sidebarOpen ? 'calc(50% + 9rem)' : '50%';

  return (
    <>
      <motion.nav
        style={{
          left: targetLeft,
          x: '-50%',
        }}
        initial={{ y: 0 }}
        animate={{
          y: isVisible ? 0 : -80,
          left: targetLeft,
        }}
        transition={{
          y: { type: 'spring', damping: 28, stiffness: 360 },
          left: { type: 'spring', damping: 30, stiffness: 300 },
        }}
        className="hidden md:flex fixed top-3.5 z-40 items-center gap-1 transition-colors duration-300 rounded-full px-2.5 py-1.5 bg-white/90 dark:bg-[#080d0b]/90 backdrop-blur-2xl border border-gray-200/80 dark:border-white/10 shadow-2xl shadow-black/10 dark:shadow-emerald-950/20 select-none"
      >
        {/* 1. Home Tab */}
        <NavTabButton
          onClick={() => handleNav('/')}
          active={isActive('/')}
          icon={Home}
          label={t('navHome', 'Home')}
          tooltip={t('navHome', 'Home')}
        />

        {/* 2. Food Menu Tab */}
        <NavTabButton
          onClick={() => handleNav('/menu')}
          active={isActive('/menu')}
          icon={UtensilsCrossed}
          label={lang === 'ml' ? 'മെനു' : 'Menu'}
          tooltip={t('navMenu', 'Food Menu')}
        />

        {/* 2.5 Sacred Dining Ethics & Adab Tab */}
        {/* <NavTabButton
          onClick={() => handleNav('/adab')}
          active={isActive('/adab')}
          icon={Sparkles}
          label={lang === 'ml' ? 'അദബ്' : 'Adab'}
          tooltip={lang === 'ml' ? 'ആദാബുൽ മാഇദ (തീൻമേശ മര്യാദകൾ)' : 'Adab al-Ma’idah (Dining Ethics)'}
        /> */}

        {/* 3. Student Dining Portal Tab */}
        {isStudentLoggedIn ? (
          <NavTabButton
            onClick={() => handleNav('/student')}
            active={isActive('/student')}
            icon={UserCheck}
            label={`#${stdata.tokenNo}`}
            tooltip={`Token #${stdata.tokenNo} (${t('studentPortal', 'Student Portal')})`}
            pulseDot={true}
          />
        ) : (
          !user && (
            <NavTabButton
              onClick={() => handleNav('/login')}
              active={isActive('/login')}
              icon={KeyRound}
              label={lang === 'ml' ? 'ലോഗിൻ' : 'Login'}
              tooltip={t('navStudentPortal', 'Student Login')}
            />
          )
        )}

        {/* 4. Kitchen Staff Console Tab (if cook) */}
        {user && isCook && (
          <NavTabButton
            onClick={() => handleNav('/kitchen')}
            active={isActive('/kitchen')}
            icon={ChefHat}
            label={lang === 'ml' ? 'കിച്ചൻ' : 'Kitchen'}
            tooltip={t('kitchen', 'Kitchen KDS')}
          />
        )}

        {/* 5. Master Board / Admin Tab (if committee) */}
        {user && isCanteenCommittee && (
          <NavTabButton
            onClick={() => handleNav('/admin')}
            active={isActive('/admin')}
            icon={Sliders}
            label={lang === 'ml' ? 'അഡ്മിൻ' : 'Admin'}
            tooltip={t('masterBoard', 'Master Token Board')}
          />
        )}

        {/* Vertical Divider */}
        <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0" />

        {/* 6. Instant Search Action Icon */}
        <NavTabButton
          onClick={() => {
            feedback('pop');
            onOpenSearch();
          }}
          active={false}
          icon={Search}
          tooltip="Search pages (⌘K)"
        />

        {/* 7. Notification Bell */}
        <NotificationBell variant="pill" />

        {/* 8. Language Switcher (Icon Only with Indicator Badge) */}
        <LanguageSwitch iconOnly={true} />

        {/* 9. Theme Switcher (Icon Only) */}
        <ThemeSwitch iconOnly={true} />

        {/* 10. Settings & Preferences */}
        <NavTabButton
          onClick={() => {
            feedback('tick');
            navigate('/settings');
          }}
          active={location.pathname.startsWith('/settings') || location.pathname.startsWith('/preferences')}
          icon={Settings}
          tooltip="Settings & Preferences (⌘,)"
        />

        {/* Vertical Divider before Date & Time */}
        <div className="h-4 w-px bg-gray-200 dark:bg-white/10 mx-1 flex-shrink-0" />

        {/* 10. Interactive Date & Clock Dual Capsule */}
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
              {nowDate
                ? `${nowDate.getUTCDate()} ${nowDate.toLocaleDateString('en-US', {
                    month: 'short',
                    timeZone: 'UTC',
                  })}`
                : ''}
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
              {timeParts
                ? `${timeParts.hours}:${timeParts.minutes} ${timeParts.period}`
                : '--:--'}
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
