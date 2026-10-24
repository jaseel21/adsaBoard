import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { useWorldTime } from '../../utils/time';
import { usePreferences } from '../../store/PreferencesContext';
import NotificationBell from '../notifications/NotificationBell';
import { useScrollHeader } from '../scroll/useScrollHeader';
import FloatingCalendarPopover from './FloatingCalendarPopover';
import FloatingClockPopover from './FloatingClockPopover';

export default function MobileTopBar({
  user,
  roleBadge,
  stdata,
  onOpenSearch,
}) {
  const navigate = useNavigate();
  const { feedback } = useFeedback();
  const { preferences } = usePreferences();
  const { nowDate, timeParts, formatTime, dayFull } = useWorldTime('Asia/Kolkata');

  // Synchronized directional scroll hook (auto-hides on scroll down, reveals on scroll up)
  const isVisible = useScrollHeader({ threshold: 25, delta: 6 });

  // Popover states for Calendar & Clock
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [clockOpen, setClockOpen] = useState(false);
  const [calendarAnchor, setCalendarAnchor] = useState(null);
  const [clockAnchor, setClockAnchor] = useState(null);

  const dateBtnRef = useRef(null);
  const clockBtnRef = useRef(null);

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
      <motion.header
        initial={{ y: 0 }}
        animate={{
          y: isVisible ? 0 : -80,
        }}
        transition={{ type: 'spring', damping: 26, stiffness: 320 }}
        className="md:hidden sticky top-0 z-40 w-full bg-white/92 dark:bg-[#080d0b]/92 backdrop-blur-2xl border-b border-gray-200/80 dark:border-white/10 transition-colors pt-[max(0.25rem,env(safe-area-inset-top,0px))]"
      >
        <div className="max-w-7xl mx-auto px-2.5 py-1.5 flex items-center justify-between gap-1.5">
          {/* Brand Crest & Title */}
          <div
            onClick={() => {
              feedback('tick');
              navigate('/');
            }}
            className="flex items-center gap-1.5 cursor-pointer select-none min-w-0 flex-shrink-0"
          >
            <div className="w-7 h-7 rounded-lg p-0.5 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/60 dark:to-emerald-900/30 border border-emerald-300/60 dark:border-emerald-500/20 shadow-xs flex items-center justify-center flex-shrink-0">
              <img
                src="https://alathurpadiDars.in/wp-content/uploads/2019/08/Dars-Site-Logo1.png"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
                alt="Alathurpadi Dars Crest"
                className="w-5 h-5 object-contain"
              />
            </div>

            <div className="flex items-center gap-1 min-w-0">
              <span className="font-black text-sm tracking-tight text-emerald-600 dark:text-emerald-400">
                ADSA
              </span>
              <span className="font-extrabold text-sm tracking-tight text-gray-800 dark:text-white hidden sm:inline">
                T-Board
              </span>

              {user && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 truncate max-w-[60px]">
                  {roleBadge?.label || 'Staff'}
                </span>
              )}
              {stdata?.tokenNo && !user && (
                <span className="ml-0.5 px-1.5 py-0.2 rounded-full text-[8.5px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  #{stdata.tokenNo}
                </span>
              )}
            </div>
          </div>

          {/* Center: Interactive Date & Clock Dual Capsule (Matched from Desktop) */}
          <div className="flex items-center rounded-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-[10.5px] select-none flex-shrink p-0.5 gap-0.5 min-w-0">
            {/* Clickable Date Trigger */}
            <button
              ref={dateBtnRef}
              type="button"
              onClick={handleOpenCalendar}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full transition-all duration-150 cursor-pointer ${
                calendarOpen
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold shadow-xs'
                  : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
              }`}
              title="Open complete calendar"
              aria-label="Open Calendar"
            >
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {dayFull ? dayFull.slice(0, 3) : ''}
              </span>
              <span className="text-gray-300 dark:text-white/20 text-[8px]">•</span>
              <span className="font-semibold tracking-tight whitespace-nowrap">
                {nowDate
                  ? `${nowDate.getUTCDate()} ${nowDate.toLocaleDateString('en-US', {
                      month: 'short',
                      timeZone: 'UTC',
                    })}`
                  : ''}
              </span>
            </button>

            {/* Micro divider */}
            <span className="text-gray-300 dark:text-white/20 text-[8px]">•</span>

            {/* Clickable Clock Trigger */}
            <button
              ref={clockBtnRef}
              type="button"
              onClick={handleOpenClock}
              className={`flex items-center gap-0.5 px-2 py-0.5 rounded-full transition-all duration-150 cursor-pointer ${
                clockOpen
                  ? 'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-extrabold shadow-xs'
                  : 'hover:bg-black/5 dark:hover:bg-white/10 text-gray-900 dark:text-white'
              }`}
              title="Open live clock & meal cutoff countdown"
              aria-label="Open Clock"
            >
              <span className="font-mono font-bold tracking-tight whitespace-nowrap">
                {formatTime
                  ? formatTime(preferences?.clockFormat || '12h', false).formattedString
                  : timeParts
                  ? `${timeParts.hours}:${timeParts.minutes} ${timeParts.period}`
                  : '--:--'}
              </span>
            </button>
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
              <Search className="w-3.5 h-3.5 text-emerald-500" />
            </button>

            {/* Notification Bell */}
            <NotificationBell />
          </div>
        </div>
      </motion.header>

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
