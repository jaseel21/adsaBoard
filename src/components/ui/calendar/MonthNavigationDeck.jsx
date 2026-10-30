import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar, Sparkles } from 'lucide-react';
import { useFeedback } from '../../../utils/useFeedback';
import { useLanguage } from '../../../store/LanguageContext';
import MonthJumpPopover from './MonthJumpPopover';

const MONTH_NAMES_FALLBACK = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function MonthNavigationDeck({
  currentYear,
  currentMonth,
  todayIST,
  onPrevMonth,
  onNextMonth,
  onJumpToToday,
  onSelectMonthYear,
  isFullyPastMonth = false,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const [isJumpOpen, setIsJumpOpen] = useState(false);
  const triggerRef = useRef(null);

  // Determine if viewing today's actual month and year
  const [todayY, todayM] = (todayIST || '').split('-').map(Number);
  const isViewingCurrentMonth = todayY === currentYear && todayM === currentMonth + 1;

  const monthLabel = t(`monthsFull.${currentMonth}`, MONTH_NAMES_FALLBACK[currentMonth]);

  const toggleJump = () => {
    feedback('tick');
    setIsJumpOpen((prev) => !prev);
  };

  const handleSelectMonthYear = (mIdx, y) => {
    onSelectMonthYear(mIdx, y);
    setIsJumpOpen(false);
  };

  return (
    <div className="relative inline-flex items-center gap-1 p-1 rounded-2xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 shadow-xs backdrop-blur-md">
      
      {/* Stepper Chevrons & Interactive Month Dropdown Trigger */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={onPrevMonth}
          className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95"
          title={t('prevMonth', 'Previous Month')}
          aria-label={t('prevMonth', 'Previous Month')}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Center Month-Year Trigger Button */}
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleJump}
          className={`flex items-center justify-center gap-1 min-w-[130px] sm:min-w-[155px] px-2.5 py-1 rounded-xl font-black text-xs sm:text-sm tracking-tight transition-all active:scale-98 select-none ${
            isJumpOpen
              ? 'bg-white dark:bg-white/15 text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/30'
              : 'hover:bg-white/80 dark:hover:bg-white/10 text-gray-900 dark:text-white'
          }`}
          title="Click to jump to any month"
          aria-haspopup="dialog"
          aria-expanded={isJumpOpen}
        >
          <span className="truncate">{monthLabel} {currentYear}</span>
          <ChevronDown
            className={`w-3.5 h-3.5 text-gray-400 dark:text-gray-500 transition-transform duration-200 flex-shrink-0 ${
              isJumpOpen ? 'rotate-180 text-emerald-500' : ''
            }`}
          />
        </button>

        <button
          type="button"
          onClick={onNextMonth}
          className="p-1.5 rounded-xl hover:bg-white dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-all active:scale-95"
          title={t('nextMonth', 'Next Month')}
          aria-label={t('nextMonth', 'Next Month')}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      <div className="w-[1px] h-4 bg-gray-200 dark:bg-white/10 mx-0.5" />

      {/* Smart Contextual "Today" Button with stable dimensions */}
      <button
        type="button"
        onClick={onJumpToToday}
        className={`px-2.5 py-1 text-xs font-black rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1 min-w-[62px] select-none ${
          !isViewingCurrentMonth
            ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs shadow-emerald-600/30'
            : 'bg-transparent text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/10'
        }`}
        title={isViewingCurrentMonth ? 'Currently viewing today' : 'Return to Current Month'}
      >
        <span>{t('todayBtn', 'Today')}</span>
      </button>

      {/* Popover Grid */}
      <MonthJumpPopover
        isOpen={isJumpOpen}
        onClose={() => setIsJumpOpen(false)}
        currentYear={currentYear}
        currentMonth={currentMonth}
        onSelectMonth={handleSelectMonthYear}
        todayIST={todayIST}
        anchorRef={triggerRef}
      />
    </div>
  );
}
