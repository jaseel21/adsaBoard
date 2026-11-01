/**
 * Menu.jsx
 * Campus Canteen Food Menu & Schedule Component
 * 
 * Displays the live weekly breakfast, lunch, evening tea, and dinner schedule,
 * daily special dish highlights, dynamic date overrides, and print/share studio.
 * Powered by unified date controller with tactical date ribbon, day steppers,
 * interactive calendar popover, and dual Daily / Weekly views.
 * Served canonically at /menu (with /fmenu redirected to /menu).
 */
import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  Sparkles,
  ArrowLeft,
  UtensilsCrossed,
  Calendar,
  CalendarDays,
  Clock,
  Printer,
  Edit3,
  CheckCircle,
  ShieldCheck,
  UserCheck,
  Moon,
  Sun,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Info,
  ExternalLink,
  History,
  Lock,
  AlertTriangle,
  List,
  Search,
  Filter,
} from 'lucide-react';
import { AuthContext } from '../store/AuthContext';
import { DataOfOne } from '../store/StudentData';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import {
  subscribeToWeeklyMenu,
  subscribeToDateOverrides,
  getEffectiveMenuForDate,
  determineActiveMealSlot,
  DEFAULT_WEEKLY_MENU,
  DAY_NAMES,
} from '../utils/menuService';
import {
  addDaysToDate,
  formatFriendlyDate,
  getDayOfWeekShort,
  getMonthCalendarDays,
} from '../utils/studentExceptionService';
import { useDateController } from '../utils/useDateController';
import TokenBoardCalendarPopover from './ui/TokenBoardCalendarPopover';
import { ROLES, hasRole } from '../utils/rbac';
import useSEO from '../hooks/useSEO';
import SocialCardStudioModal from './preview/SocialCardStudioModal';

const DAY_KEYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
const DAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const CATEGORY_STYLES = {
  Veg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
  'Non-Veg': 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700/60',
  Egg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
  Special: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-700/60',
};

const CATEGORY_ICONS = {
  Veg: '🌱',
  'Non-Veg': '🍗',
  Egg: '🥚',
  Special: '✨',
};

const SLOT_CONFIGS = [
  { key: 'breakfast', label: 'Breakfast', icon: Coffee, defaultTiming: '07:30 AM - 08:45 AM', color: 'amber' },
  { key: 'lunch', label: 'Lunch', icon: Utensils, defaultTiming: '12:45 PM - 02:00 PM', fridayTiming: '01:15 PM - 02:15 PM', color: 'emerald' },
  { key: 'evening', label: 'Evening Tea', icon: Sun, defaultTiming: '04:30 PM - 05:30 PM', color: 'blue' },
  { key: 'dinner', label: 'Dinner', icon: Moon, defaultTiming: '08:30 PM - 09:30 PM', color: 'purple' },
];

const MenuTable = () => {
  const navigate = useNavigate();
  const { userRole } = useContext(AuthContext);
  const { stdata } = useContext(DataOfOne);
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const canManageMenu = hasRole(userRole, [
    ROLES.CANTEEN_COMMITTEE,
    ROLES.CENTRAL_COMMITTEE,
    ROLES.DEVELOPER,
  ]);

  // Unified Web App Date Controller
  const dateController = useDateController();
  const {
    targetDateIST,
    todayIST,
    effectiveDay,
    relativeDateMeta,
    isToday,
    isTomorrow,
    isYesterday,
    isPastDate,
    setDateToCustom,
    setDateToToday,
    stepDateBackward,
    stepDateForward,
    timeHms,
  } = dateController;

  const [weeklyMenu, setWeeklyMenu] = useState(DEFAULT_WEEKLY_MENU);
  const [overrides, setOverrides] = useState({});
  // Canonical dining perspective: defaults to Weekly schedule ('week' | 'day' | 'month' | 'year' | 'list')
  const [viewMode, setViewMode] = useState('week');
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);
  const calendarButtonRef = useRef(null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const [listFilter, setListFilter] = useState('all'); // 'all' | 'nonveg' | 'veg' | 'feasts' | 'closures' | 'fasting'
  const [agendaHorizon, setAgendaHorizon] = useState(30); // 14 | 30 days
  const [monthMealSlot, setMonthMealSlot] = useState('all'); // 'all' | 'breakfast' | 'lunch' | 'evening' | 'dinner'
  const [monthPreviewDate, setMonthPreviewDate] = useState(targetDateIST);

  useSEO({
    title: 'Campus Dining Menu & Specials',
    description:
      'Weekly meal schedules, special campus culinary rosters, and dietary avoiders manifest for Alathurpadi Dars canteen.',
    keywords:
      'canteen menu, alathurpadi dars food menu, dars weekly menu, dining schedule, breakfast menu, lunch menu',
    image: '/og-menu.png',
  });

  // Real-time Firestore Menu Subscriptions
  useEffect(() => {
    const unsubMenu = subscribeToWeeklyMenu((data) => {
      if (data) setWeeklyMenu(data);
    });
    const unsubOverrides = subscribeToDateOverrides((data) => {
      if (data) setOverrides(data || {});
    });
    return () => {
      unsubMenu();
      unsubOverrides();
    };
  }, []);

  // Effective menu object for the actively inspected date (any past, present, or future date)
  const activeDayData = useMemo(() => {
    return getEffectiveMenuForDate(targetDateIST, weeklyMenu, overrides);
  }, [targetDateIST, weeklyMenu, overrides]);

  // Real-time active meal slot for the target date (if today)
  const activeSlotMeta = useMemo(() => {
    if (isToday) {
      return determineActiveMealSlot(timeHms, activeDayData);
    }
    return null;
  }, [isToday, timeHms, activeDayData]);

  // Compute all 7 days of the calendar week containing targetDateIST
  const weekDaysData = useMemo(() => {
    const dow = getDayOfWeekShort(targetDateIST);
    const dayIdx = DAY_KEYS.indexOf(dow) !== -1 ? DAY_KEYS.indexOf(dow) : 0;
    const sundayDate = addDaysToDate(targetDateIST, -dayIdx);

    return DAY_KEYS.map((key, idx) => {
      const dayDateStr = addDaysToDate(sundayDate, idx);
      const effective = getEffectiveMenuForDate(dayDateStr, weeklyMenu, overrides);
      const isDayToday = dayDateStr === todayIST;
      const isDayTarget = dayDateStr === targetDateIST;

      return {
        key,
        dateStr: dayDateStr,
        isToday: isDayToday,
        isTarget: isDayTarget,
        ...effective,
      };
    });
  }, [targetDateIST, todayIST, weeklyMenu, overrides]);

  // Upcoming scheduled feasts & date overrides
  const upcomingFeasts = useMemo(() => {
    const list = [];
    Object.entries(overrides).forEach(([dStr, ovr]) => {
      if (dStr >= todayIST) {
        list.push({ dateStr: dStr, ...ovr });
      }
    });
    list.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    return list.slice(0, 4);
  }, [overrides, todayIST]);

  // Current month & year derived from targetDateIST
  const { currentYear, currentMonth, currentMonthName } = useMemo(() => {
    const [y, m] = targetDateIST.split('-').map(Number);
    const mIdx = m ? m - 1 : 0;
    return {
      currentYear: y || new Date().getFullYear(),
      currentMonth: mIdx,
      currentMonthName: MONTH_NAMES[mIdx] || 'Month',
    };
  }, [targetDateIST]);

  const handlePrevMonth = () => {
    feedback('tick');
    const [y, m] = targetDateIST.split('-').map(Number);
    const prev = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
    setDateToCustom(prev);
  };

  const handleNextMonth = () => {
    feedback('tick');
    const [y, m] = targetDateIST.split('-').map(Number);
    const next = new Date(Date.UTC(y, m, 1)).toISOString().slice(0, 10);
    setDateToCustom(next);
  };

  const handlePrevWeek = () => {
    feedback('tick');
    setDateToCustom(addDaysToDate(targetDateIST, -7));
  };

  const handleNextWeek = () => {
    feedback('tick');
    setDateToCustom(addDaysToDate(targetDateIST, 7));
  };

  const handlePrevYear = () => {
    feedback('tick');
    const [y] = targetDateIST.split('-').map(Number);
    setDateToCustom(`${y - 1}-01-01`);
  };

  const handleNextYear = () => {
    feedback('tick');
    const [y] = targetDateIST.split('-').map(Number);
    setDateToCustom(`${y + 1}-01-01`);
  };

  // Real-time Live Dining Status & Countdown
  const liveDiningStatus = useMemo(() => {
    if (!isToday || !timeHms) return null;
    const dow = getDayOfWeekShort(targetDateIST);
    const isFriday = dow === 'fr';
    const lunchStart = isFriday ? '13:15:00' : '12:45:00';
    const lunchEnd = isFriday ? '14:15:00' : '14:00:00';

    if (timeHms >= '07:30:00' && timeHms <= '08:45:00') {
      return {
        state: 'serving',
        slot: 'breakfast',
        label: t('servingNow', 'Serving Now'),
        title: activeDayData.breakfast?.title || 'Breakfast',
        timeWindow: '07:30 AM - 08:45 AM',
        color: 'amber',
        icon: Coffee,
      };
    }
    if (timeHms < '07:30:00') {
      return {
        state: 'upcoming',
        slot: 'breakfast',
        label: t('nextMealWindow', 'Next Meal'),
        title: activeDayData.breakfast?.title || 'Breakfast',
        timeWindow: '07:30 AM - 08:45 AM',
        color: 'amber',
        icon: Coffee,
      };
    }
    if (timeHms > '08:45:00' && timeHms < lunchStart) {
      return {
        state: 'upcoming',
        slot: 'lunch',
        label: t('nextMealWindow', 'Next Meal'),
        title: activeDayData.lunch?.title || 'Lunch',
        timeWindow: isFriday ? '01:15 PM - 02:15 PM (Jumu\'ah Special)' : '12:45 PM - 02:00 PM',
        color: 'emerald',
        icon: Utensils,
      };
    }
    if (timeHms >= lunchStart && timeHms <= lunchEnd) {
      return {
        state: 'serving',
        slot: 'lunch',
        label: t('servingNow', 'Serving Now'),
        title: activeDayData.lunch?.title || 'Lunch',
        timeWindow: isFriday ? '01:15 PM - 02:15 PM (Jumu\'ah Special)' : '12:45 PM - 02:00 PM',
        color: 'emerald',
        icon: Utensils,
      };
    }
    if (timeHms > lunchEnd && timeHms < '16:30:00') {
      return {
        state: 'upcoming',
        slot: 'evening',
        label: t('nextMealWindow', 'Next Meal'),
        title: activeDayData.evening?.title || 'Evening Tea',
        timeWindow: '04:30 PM - 05:30 PM',
        color: 'blue',
        icon: Sun,
      };
    }
    if (timeHms >= '16:30:00' && timeHms <= '17:30:00') {
      return {
        state: 'serving',
        slot: 'evening',
        label: t('servingNow', 'Serving Now'),
        title: activeDayData.evening?.title || 'Evening Tea',
        timeWindow: '04:30 PM - 05:30 PM',
        color: 'blue',
        icon: Sun,
      };
    }
    if (timeHms > '17:30:00' && timeHms < '20:30:00') {
      return {
        state: 'upcoming',
        slot: 'dinner',
        label: t('nextMealWindow', 'Next Meal'),
        title: activeDayData.dinner?.title || 'Dinner',
        timeWindow: '08:30 PM - 09:30 PM',
        color: 'purple',
        icon: Moon,
      };
    }
    if (timeHms >= '20:30:00' && timeHms <= '21:30:00') {
      return {
        state: 'serving',
        slot: 'dinner',
        label: t('servingNow', 'Serving Now'),
        title: activeDayData.dinner?.title || 'Dinner',
        timeWindow: '08:30 PM - 09:30 PM',
        color: 'purple',
        icon: Moon,
      };
    }
    return {
      state: 'completed',
      slot: 'breakfast',
      label: "Today's Service Concluded",
      title: "Tomorrow's Breakfast: " + (activeDayData.breakfast?.title || 'Standard Roster'),
      timeWindow: '07:30 AM Tomorrow',
      color: 'gray',
      icon: Coffee,
    };
  }, [isToday, timeHms, targetDateIST, activeDayData, t]);

  // Synchronize monthPreviewDate when targetDateIST changes
  useEffect(() => {
    setMonthPreviewDate(targetDateIST);
  }, [targetDateIST]);

  const monthPreviewData = useMemo(() => {
    return getEffectiveMenuForDate(monthPreviewDate, weeklyMenu, overrides);
  }, [monthPreviewDate, weeklyMenu, overrides]);

  // 7-column calendar cells for active month
  const calendarDays = useMemo(() => {
    return getMonthCalendarDays(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Comprehensive statistics & culinary distribution for active month
  const monthStats = useMemo(() => {
    if (viewMode !== 'month') {
      return { totalDays: 0, totalFeasts: 0, totalClosures: 0, totalNonVeg: 0, totalVeg: 0 };
    }
    let totalFeasts = 0;
    let totalClosures = 0;
    let totalNonVeg = 0;
    let totalVeg = 0;
    let totalDays = 0;
    calendarDays.forEach((cell) => {
      if (!cell.isBlank) {
        totalDays += 1;
        const ovr = overrides[cell.dateStr];
        const eff = getEffectiveMenuForDate(cell.dateStr, weeklyMenu, overrides);
        if (ovr?.isClosed || ovr?.isHoliday || ovr?.dayStatus === 'leave') totalClosures += 1;
        else if (ovr?.occasion || ovr?.dayStatus === 'event') totalFeasts += 1;

        if (eff.lunch?.category === 'Non-Veg') totalNonVeg += 1;
        else if (eff.lunch?.category === 'Veg') totalVeg += 1;
      }
    });
    return { totalDays, totalFeasts, totalClosures, totalNonVeg, totalVeg };
  }, [viewMode, calendarDays, overrides, weeklyMenu]);

  // Academic year monthly overview data with culinary heatmaps
  const yearMonthsData = useMemo(() => {
    if (viewMode !== 'year') return [];
    return MONTH_NAMES.map((mName, mIdx) => {
      const monthPad = String(mIdx + 1).padStart(2, '0');
      const monthPrefix = `${currentYear}-${monthPad}`;
      let feastsCount = 0;
      let closuresCount = 0;
      let nonVegCount = 0;
      let vegCount = 0;
      let biriyaniCount = 0;
      const days = getMonthCalendarDays(currentYear, mIdx);

      days.forEach((c) => {
        if (!c.isBlank) {
          const ovr = overrides?.[c.dateStr];
          const eff = getEffectiveMenuForDate(c.dateStr, weeklyMenu, overrides);
          if (ovr?.isClosed || ovr?.isHoliday || ovr?.dayStatus === 'leave') closuresCount += 1;
          else if (ovr?.occasion || ovr?.dayStatus === 'event') feastsCount += 1;

          if (eff.lunch?.category === 'Non-Veg') nonVegCount += 1;
          else if (eff.lunch?.category === 'Veg') vegCount += 1;

          if ((eff.lunch?.title || '').toLowerCase().includes('biriyani')) biriyaniCount += 1;
        }
      });

      return {
        monthIndex: mIdx,
        monthName: mName,
        year: currentYear,
        firstDateStr: `${monthPrefix}-01`,
        feastsCount,
        closuresCount,
        nonVegCount,
        vegCount,
        biriyaniCount,
        isCurrentMonth: todayIST.startsWith(monthPrefix),
        days,
      };
    });
  }, [viewMode, currentYear, overrides, weeklyMenu, todayIST]);

  // Continuous Chronological Dining Agenda for next 14-30 days (Not just overrides!)
  const continuousAgendaDays = useMemo(() => {
    if (viewMode !== 'list') return [];
    const list = [];
    const count = agendaHorizon;
    for (let i = 0; i < count; i++) {
      const dStr = addDaysToDate(todayIST, i);
      const effective = getEffectiveMenuForDate(dStr, weeklyMenu, overrides);
      const ovr = overrides?.[dStr];
      const isClosed = Boolean(effective.isClosed || effective.isArchived || effective.dayStatus === 'leave');
      const isFeast = Boolean(effective.occasion || effective.dayStatus === 'event');
      const isFasting = Boolean(
        effective.fastingTitle ||
        effective.breakfast?.slotStatus === 'fasting' ||
        effective.lunch?.slotStatus === 'fasting'
      );

      const allDishes = [
        effective.breakfast?.title,
        effective.lunch?.title,
        effective.evening?.title,
        effective.dinner?.title,
      ].filter(Boolean);

      const hasNonVeg = [effective.breakfast, effective.lunch, effective.evening, effective.dinner]
        .some((s) => s?.category === 'Non-Veg');
      const hasVeg = [effective.breakfast, effective.lunch, effective.evening, effective.dinner]
        .some((s) => s?.category === 'Veg');

      list.push({
        dateStr: dStr,
        dow: getDayOfWeekShort(dStr),
        isToday: i === 0,
        isTomorrow: i === 1,
        effective,
        ovr,
        isClosed,
        isFeast,
        isFasting,
        hasNonVeg,
        hasVeg,
        allDishes,
      });
    }

    // Apply Filter & Search
    return list.filter((item) => {
      if (listFilter === 'nonveg' && !item.hasNonVeg) return false;
      if (listFilter === 'veg' && !item.hasVeg) return false;
      if (listFilter === 'feasts' && !item.isFeast) return false;
      if (listFilter === 'closures' && !item.isClosed) return false;
      if (listFilter === 'fasting' && !item.isFasting) return false;

      if (listSearch.trim()) {
        const q = listSearch.toLowerCase();
        const matchDish = item.allDishes.some((d) => d.toLowerCase().includes(q));
        const matchOccasion = (item.effective.occasion || '').toLowerCase().includes(q);
        const matchNote = (item.effective.note || item.effective.closureReason || '').toLowerCase().includes(q);
        const matchDate = item.dateStr.includes(q);
        return matchDish || matchOccasion || matchNote || matchDate;
      }
      return true;
    });
  }, [viewMode, todayIST, agendaHorizon, weeklyMenu, overrides, listFilter, listSearch]);

  // Determine which standard dining columns are available in weekly view
  const hasVisibleBreakfast = true;
  const hasVisibleLunch = true;

  const hasVisibleEvening = useMemo(() => {
    return weekDaysData.some((it) => {
      return (
        !it?.isArchived &&
        !it?.isClosed &&
        !it?.evening?.isArchived &&
        it?.evening?.isAvailable !== false &&
        Boolean(it?.evening?.title?.trim())
      );
    });
  }, [weekDaysData]);

  const hasVisibleDinner = useMemo(() => {
    return weekDaysData.some((it) => {
      return (
        !it?.isArchived &&
        !it?.isClosed &&
        !it?.dinner?.isArchived &&
        it?.dinner?.isAvailable !== false &&
        Boolean(it?.dinner?.title?.trim())
      );
    });
  }, [weekDaysData]);

  const totalCols =
    1 +
    (hasVisibleBreakfast ? 1 : 0) +
    (hasVisibleLunch ? 1 : 0) +
    (hasVisibleEvening ? 1 : 0) +
    (hasVisibleDinner ? 1 : 0);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      
      {/* ================= 1. TOP HEADER CARD ================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="space-y-1">
          <h1 className="text-lg xs:text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
            <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
            <span>{t('navMenu') || 'Campus Dining Menu'}</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-600/30">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>{t('authenticatedMenu', 'Protected Schedule')}</span>
            </span>
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
            {t(
              'weeklyCanteenSubtitle',
              'Internal weekly meal schedule and special dining rosters served at Alathurpadi Dars dining hall'
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-stretch sm:self-auto justify-start sm:justify-end">
          {/* Admin shortcut button (strictly for authorized Committee/Staff) */}
          {canManageMenu && (
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                navigate('/admin/menu');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('menuManagement') || 'Manage Menu'}</span>
            </button>
          )}

          {/* Student shortcut to return to their personal portal */}
          {stdata?.tokenNo && (
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                navigate('/student');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-500/30 font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
              title="Return to Student Portal"
            >
              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('tokenPortal', 'Portal')} (Token {stdata.tokenNo})</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              feedback('tick');
              setIsCardStudioOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 cursor-pointer"
            title="Generate & share dynamic visual menu card for active date"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('shareMenuCard', 'Share Menu Card')}</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('print', 'Print')}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              feedback('tick');
              if (stdata?.tokenNo) {
                navigate('/student');
              } else {
                navigate('/');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{stdata?.tokenNo ? t('backToPortal', 'Back to Portal') : t('backToHome', 'Back to Home')}</span>
          </button>
        </div>
      </div>

      {/* ================= 1.5 SACRED DINING ETHICS & ADAB CALLOUT ================= */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 dark:from-emerald-950/40 dark:via-amber-950/20 dark:to-emerald-950/40 border border-emerald-500/25 dark:border-emerald-500/35 backdrop-blur-sm shadow-xs">
        <div className="flex items-center gap-3 text-center sm:text-left">
          <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white font-malayalam">
              ആദാബുൽ മാഇദ: അന്നത്തിന്റെ ആത്മീയതയും തീൻമേശ മര്യാദകളും
            </p>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 font-malayalam">
              ദർസിന്റെ പവിത്രമായ അന്നം, തിരുനബി ﷺ യുടെ ചര്യ, 1/3 വയറിന്റെ സമതുലിതാവസ്ഥ വായിക്കാം.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            feedback('tick');
            navigate('/adab');
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs transition-all active:scale-95 flex-shrink-0 cursor-pointer font-malayalam"
        >
          <span>വായിക്കുക</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ================= 2. UPCOMING SPECIAL FEASTS ALERT BANNER ================= */}
      {upcomingFeasts.length > 0 && (
        <div className="p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-200/80 dark:border-purple-800/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center space-x-3 min-w-0">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                  Upcoming Special Feasts & Custom Dining Days
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase">
                  {upcomingFeasts.length} Scheduled
                </span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-medium mt-1">
                {upcomingFeasts.map((f) => {
                  const isCurrentTarget = f.dateStr === targetDateIST;
                  return (
                    <button
                      key={f.dateStr}
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        setDateToCustom(f.dateStr);
                        setViewMode('day');
                      }}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                        isCurrentTarget
                          ? 'bg-purple-600 text-white border-purple-700 shadow-xs'
                          : 'bg-purple-100/70 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 border-purple-200/80 dark:border-purple-700/40 hover:bg-purple-200 dark:hover:bg-purple-900/60'
                      }`}
                      title={`Jump to ${formatFriendlyDate(f.dateStr, true)}`}
                    >
                      <span>• {formatFriendlyDate(f.dateStr, true)}:</span>
                      <strong className="underline decoration-dotted">{f.occasion || 'Special Feast'}</strong>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {canManageMenu && (
            <button
              type="button"
              onClick={() => navigate('/admin/menu')}
              className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 font-bold text-xs hover:bg-purple-200 dark:hover:bg-purple-800/60 transition-colors self-start sm:self-auto shrink-0 cursor-pointer"
            >
              Open Menu Studio
            </button>
          )}
        </div>
      )}

      {/* ================= 3. UNIFIED MASTER DINING CONTROL BAR ================= */}
      <div className="p-3 sm:p-4 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-3.5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          
          {/* Left: 5-View Perspective Switcher (Day, Week, Month, Year, List) */}
          <div className="inline-flex p-0.5 rounded-2xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 shadow-xs backdrop-blur-md overflow-x-auto shrink-0">
            {[
              { id: 'day', label: t('viewDay', 'Day'), icon: Clock },
              { id: 'week', label: t('viewWeek', 'Week'), icon: CalendarDays },
              { id: 'month', label: t('viewMonth', 'Month'), icon: LayoutGrid },
              { id: 'year', label: t('viewYear', 'Year'), icon: Calendar },
              { id: 'list', label: t('viewList', 'List'), icon: List },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => {
                  feedback('tick');
                  setViewMode(id);
                }}
                className={`relative px-3 py-1.5 rounded-xl text-xs font-black transition-colors select-none flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                  viewMode === id
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`}
              >
                {viewMode === id && (
                  <motion.div
                    layoutId="masterMenuViewPill"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                    className="absolute inset-0 bg-white dark:bg-[#1a2521] rounded-xl shadow-xs -z-10 border border-gray-200/60 dark:border-white/10"
                  />
                )}
                <Icon className="w-3.5 h-3.5 text-emerald-500" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Center: Dynamic Contextual Stepper based on viewMode */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            {/* Day Stepper */}
            {viewMode === 'day' && (
              <div className="flex items-center gap-1.5">
                <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      stepDateBackward();
                    }}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                    title="Previous Day"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="px-3 py-0.5 text-center min-w-[150px]">
                    <span className="text-xs font-black text-gray-900 dark:text-white block font-mono">
                      {formatFriendlyDate(targetDateIST, true)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      stepDateForward();
                    }}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                    title="Next Day"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setDateToToday();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
                >
                  {t('todayBtn', 'Today')}
                </button>
              </div>
            )}

            {/* Week Stepper */}
            {viewMode === 'week' && (
              <div className="flex items-center gap-1.5">
                <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={handlePrevWeek}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                    title="Previous Week"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="px-3 py-0.5 text-center min-w-[190px]">
                    <span className="text-xs font-black text-gray-900 dark:text-white block font-mono">
                      {formatFriendlyDate(weekDaysData[0].dateStr, false)} – {formatFriendlyDate(weekDaysData[6].dateStr, false)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextWeek}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                    title="Next Week"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setDateToToday();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
                >
                  {t('thisWeek', 'This Week')}
                </button>
              </div>
            )}

            {/* Month Stepper */}
            {viewMode === 'month' && (
              <div className="flex items-center gap-1.5">
                <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="px-4 py-0.5 text-center min-w-[140px]">
                    <span className="text-xs font-black text-gray-900 dark:text-white block font-mono">
                      {currentMonthName} {currentYear}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setDateToToday();
                  }}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
                >
                  {t('thisMonth', 'This Month')}
                </button>
              </div>
            )}

            {/* Year Stepper */}
            {viewMode === 'year' && (
              <div className="flex items-center gap-1.5">
                <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
                  <button
                    type="button"
                    onClick={handlePrevYear}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                    title="Previous Year"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <div className="px-4 py-0.5 text-center min-w-[110px]">
                    <span className="text-xs font-black text-gray-900 dark:text-white block font-mono">
                      {currentYear}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleNextYear}
                    className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-zinc-800 text-gray-700 dark:text-gray-200 transition-colors cursor-pointer"
                    title="Next Year"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* List Stepper Preset */}
            {viewMode === 'list' && (
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setDateToToday();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-bold transition-all cursor-pointer"
              >
                {t('todayBtn', 'Today')}
              </button>
            )}
          </div>

          {/* Right: Quick Tools & Popover Anchor */}
          <div className="flex items-center gap-2 self-center lg:self-auto shrink-0">
            {/* Direct Calendar Jump Popover Trigger */}
            <button
              ref={calendarButtonRef}
              type="button"
              onClick={() => {
                feedback('tick');
                setIsCalendarOpen((prev) => !prev);
              }}
              className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 border border-gray-200/80 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-200 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Open interactive calendar date picker"
            >
              <Calendar className="w-3.5 h-3.5 text-emerald-500" />
              <span className="hidden sm:inline">{t('jumpToDate', 'Jump to Date')}</span>
            </button>
          </div>
        </div>

        {/* Calendar Popover */}
        <TokenBoardCalendarPopover
          isOpen={isCalendarOpen}
          onClose={() => setIsCalendarOpen(false)}
          controller={dateController}
          anchorRef={calendarButtonRef}
        />
      </div>

      {/* ================= 4. PERSPECTIVE A: FOCUSED DAILY MENU ================= */}
      {viewMode === 'day' && (
        <div className="space-y-4">
          
          {/* Day Hero Header Banner */}
          <div
            className={`p-5 sm:p-6 rounded-3xl border transition-all ${
              activeDayData.isArchived || activeDayData.isClosed
                ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/50'
                : activeDayData.isOverride
                ? 'bg-gradient-to-br from-purple-50 via-indigo-50/70 to-pink-50/40 dark:from-purple-950/30 dark:via-indigo-950/20 dark:to-pink-950/20 border-purple-300 dark:border-purple-600/40 shadow-sm'
                : isToday
                ? 'bg-gradient-to-br from-emerald-50/80 via-teal-50/50 to-white dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-[#0f1715] border-emerald-300 dark:border-emerald-600/40 shadow-sm'
                : 'bg-white/90 dark:bg-[#0f1715]/90 border-gray-200/80 dark:border-white/10 shadow-sm'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <span>{formatFriendlyDate(targetDateIST, true)}</span>
                  </h2>

                  {/* Contextual Status Badges */}
                  {isToday ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500 text-white text-[11px] font-black uppercase tracking-wider animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      {t('today', 'Today')}
                    </span>
                  ) : isTomorrow ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-teal-500 text-white text-[11px] font-black uppercase tracking-wider">
                      {t('tomorrow', 'Tomorrow')}
                    </span>
                  ) : isYesterday ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-400/30 text-[11px] font-bold">
                      <History className="w-3 h-3" />
                      {t('yesterday', 'Yesterday')}
                    </span>
                  ) : isPastDate ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-400/30 text-[11px] font-bold">
                      <History className="w-3 h-3" />
                      {relativeDateMeta?.relativeLabel || t('pastRecord', 'Past Record')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-400/30 text-[11px] font-bold">
                      <Clock className="w-3 h-3" />
                      {relativeDateMeta?.relativeLabel || t('scheduledDate', 'Scheduled Date')}
                    </span>
                  )}

                  {activeDayData.isOverride && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-purple-600 text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
                      <Sparkles className="w-3 h-3" />
                      <span>{activeDayData.occasion || 'Special Feast Override'}</span>
                    </span>
                  )}

                  {activeDayData.fastingTitle && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-600 text-white text-[11px] font-black uppercase tracking-wider shadow-xs">
                      <Moon className="w-3 h-3" />
                      <span>{activeDayData.fastingTitle}</span>
                    </span>
                  )}
                </div>

                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {activeDayData.isArchived || activeDayData.isClosed ? (
                    <span className="inline-flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{t('canteenClosedNotice', 'Canteen dining hall is closed for food service on this date.')}</span>
                    </span>
                  ) : (
                    activeDayData.note || t('standardDiningRoutine', 'Standard campus dining hall menu schedule')
                  )}
                </div>

                {activeDayData.dayStatus === 'event' && (activeDayData.eventVenue || activeDayData.eventSponsor || activeDayData.eventNotes) && (
                  <div className="mt-2.5 p-3 rounded-2xl bg-purple-100/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      <span>{activeDayData.eventTitle || activeDayData.occasion || 'Campus Program & Feast'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-purple-700 dark:text-purple-300">
                      {activeDayData.eventVenue && <span>📍 Venue: {activeDayData.eventVenue}</span>}
                      {activeDayData.eventSponsor && <span>🤝 Sponsor: {activeDayData.eventSponsor}</span>}
                    </div>
                    {activeDayData.eventNotes && (
                      <p className="text-[11px] text-purple-600/90 dark:text-purple-400/90">{activeDayData.eventNotes}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Action shortcuts */}
              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setIsCardStudioOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/25 text-xs font-bold transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Share Day Card</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Dining Real-time Status Alert (When viewing Today) */}
          {isToday && liveDiningStatus && (
            <div className={`p-4 rounded-2xl sm:rounded-3xl border flex items-center justify-between gap-3 shadow-xs ${
              liveDiningStatus.state === 'serving'
                ? 'bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-transparent border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                : 'bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent border-amber-500/30 text-amber-950 dark:text-amber-100'
            }`}>
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  liveDiningStatus.state === 'serving'
                    ? 'bg-emerald-500 text-white shadow-xs animate-pulse'
                    : 'bg-amber-500 text-white shadow-xs'
                }`}>
                  <liveDiningStatus.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      liveDiningStatus.state === 'serving'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-amber-600 text-white'
                    }`}>
                      {liveDiningStatus.label}
                    </span>
                    <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
                      {liveDiningStatus.timeWindow}
                    </span>
                  </div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white truncate mt-0.5">
                    {liveDiningStatus.title}
                  </h4>
                </div>
              </div>
            </div>
          )}

          {/* Canteen Closed Alert Banner */}
          {(activeDayData.isArchived || activeDayData.isClosed) && (
            <div className="p-4 rounded-2xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs sm:text-sm space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>{t('canteenClosed', 'Canteen Closed')}</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {activeDayData.closureReason ||
                  activeDayData.leaveReason ||
                  activeDayData.archiveReason ||
                  activeDayData.holidayReason ||
                  t('canteenClosedRoutineNotice', 'Routine Off Day. No kitchen food service is scheduled.')}
              </p>
            </div>
          )}

          {/* 4 Meal Slots Cards Grid */}
          {!(activeDayData.isArchived || activeDayData.isClosed) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
              
              {/* 1. Breakfast Slot */}
              <div
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all flex flex-col justify-between ${
                  activeDayData.breakfast?.isArchived || activeDayData.breakfast?.isAvailable === false
                    ? 'bg-gray-50/50 dark:bg-white/5 border-dashed border-gray-200 dark:border-white/10 opacity-70'
                    : ((activeSlotMeta?.slot === 'breakfast' || liveDiningStatus?.slot === 'breakfast') && isToday && liveDiningStatus?.state === 'serving')
                    ? 'bg-gradient-to-br from-amber-50 to-orange-50/60 dark:from-amber-950/40 dark:to-orange-950/20 border-amber-400 dark:border-amber-500/50 shadow-md ring-2 ring-amber-400/40'
                    : 'bg-white/90 dark:bg-[#0f1715]/90 border-gray-200/80 dark:border-white/10 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-amber-700 dark:text-amber-400">
                      <Coffee className="w-4 h-4 text-amber-500" />
                      <span>{t('breakfast', 'Breakfast')}</span>
                    </span>

                    {((activeSlotMeta?.slot === 'breakfast' || liveDiningStatus?.slot === 'breakfast') && isToday && liveDiningStatus?.state === 'serving') && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500 text-white animate-pulse">
                        {t('activeNow', 'Serving Now')}
                      </span>
                    )}
                  </div>

                  {activeDayData.breakfast?.timing && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400 dark:text-gray-500 mb-2.5">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span>{activeDayData.breakfast.timing}</span>
                    </div>
                  )}

                  {activeDayData.breakfast?.isArchived || activeDayData.breakfast?.isAvailable === false || activeDayData.breakfast?.slotStatus === 'leave' ? (
                    <div className="py-2 space-y-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 inline-block">
                        Leave / Off
                      </span>
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium italic">
                        {activeDayData.breakfast?.leaveReason || 'No breakfast service scheduled'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {activeDayData.breakfast?.slotStatus === 'event' && (
                        <span className="mb-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 inline-flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{activeDayData.breakfast?.eventTitle || 'Event Feast'}</span>
                        </span>
                      )}
                      {activeDayData.breakfast?.slotStatus === 'fasting' && (
                        <span className="mb-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700/60 inline-flex items-center gap-1">
                          <Moon className="w-2.5 h-2.5" />
                          <span>{activeDayData.breakfast?.fastingTitle || 'Sahar Window'}</span>
                        </span>
                      )}
                      <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-snug">
                        {activeDayData.breakfast?.title || t('noDishSet', 'No dish set')}
                      </h3>

                      {activeDayData.breakfast?.items?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {activeDayData.breakfast.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] font-medium"
                            >
                              {it}
                            </span>
                          ))}
                        </div>
                      )}

                      {activeDayData.breakfast?.specialSponsor && (
                        <div className="mt-2 text-[11px] text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
                          <span>🤝 Sponsor: {activeDayData.breakfast.specialSponsor}</span>
                        </div>
                      )}
                      {activeDayData.breakfast?.specialNotes && (
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 italic">
                          {activeDayData.breakfast.specialNotes}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {activeDayData.breakfast?.category && (
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Category</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        CATEGORY_STYLES[activeDayData.breakfast.category] || CATEGORY_STYLES.Veg
                      }`}
                    >
                      {CATEGORY_ICONS[activeDayData.breakfast.category] || '🌱'} {activeDayData.breakfast.category}
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Lunch Slot */}
              <div
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all flex flex-col justify-between ${
                  activeDayData.lunch?.isArchived || activeDayData.lunch?.isAvailable === false || activeDayData.lunch?.slotStatus === 'leave'
                    ? 'bg-gray-50/50 dark:bg-white/5 border-dashed border-gray-200 dark:border-white/10 opacity-70'
                    : ((activeSlotMeta?.slot === 'lunch' || liveDiningStatus?.slot === 'lunch') && isToday && liveDiningStatus?.state === 'serving')
                    ? 'bg-gradient-to-br from-emerald-50 to-teal-50/60 dark:from-emerald-950/40 dark:to-teal-950/20 border-emerald-400 dark:border-emerald-500/50 shadow-md ring-2 ring-emerald-400/40'
                    : 'bg-white/90 dark:bg-[#0f1715]/90 border-gray-200/80 dark:border-white/10 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      <Utensils className="w-4 h-4 text-emerald-500" />
                      <span>{t('lunch', 'Lunch')}</span>
                    </span>

                    {((activeSlotMeta?.slot === 'lunch' || liveDiningStatus?.slot === 'lunch') && isToday && liveDiningStatus?.state === 'serving') && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-white animate-pulse">
                        {t('activeNow', 'Serving Now')}
                      </span>
                    )}
                  </div>

                  {activeDayData.lunch?.timing && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400 dark:text-gray-500 mb-2">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      <span>{activeDayData.lunch.timing}</span>
                    </div>
                  )}

                  {getDayOfWeekShort(targetDateIST) === 'Fri' && (
                    <div className="mb-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300/40">
                      <span>🕌 Friday Jumu&apos;ah (01:15 PM – 02:15 PM)</span>
                    </div>
                  )}

                  {activeDayData.lunch?.isArchived || activeDayData.lunch?.isAvailable === false || activeDayData.lunch?.slotStatus === 'leave' ? (
                    <div className="py-2 space-y-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 inline-block">
                        Leave / Off
                      </span>
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium italic">
                        {activeDayData.lunch?.leaveReason || 'No lunch service scheduled'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {activeDayData.lunch?.slotStatus === 'event' && (
                        <span className="mb-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 inline-flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{activeDayData.lunch?.eventTitle || 'Event Feast'}</span>
                        </span>
                      )}
                      {activeDayData.lunch?.slotStatus === 'fasting' && (
                        <span className="mb-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700/60 inline-flex items-center gap-1">
                          <Moon className="w-2.5 h-2.5" />
                          <span>Fasting (Lunch Suspended)</span>
                        </span>
                      )}
                      <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-snug">
                        {activeDayData.lunch?.title || t('noDishSet', 'No dish set')}
                      </h3>

                      {activeDayData.lunch?.items?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {activeDayData.lunch.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium"
                            >
                              {it}
                            </span>
                          ))}
                        </div>
                      )}

                      {activeDayData.lunch?.specialSponsor && (
                        <div className="mt-2 text-[11px] text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
                          <span>🤝 Sponsor: {activeDayData.lunch.specialSponsor}</span>
                        </div>
                      )}
                      {activeDayData.lunch?.specialNotes && (
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 italic">
                          {activeDayData.lunch.specialNotes}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {activeDayData.lunch?.category && (
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Category</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        CATEGORY_STYLES[activeDayData.lunch.category] || CATEGORY_STYLES.Veg
                      }`}
                    >
                      {CATEGORY_ICONS[activeDayData.lunch.category] || '🌱'} {activeDayData.lunch.category}
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Evening Refreshment Slot */}
              <div
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all flex flex-col justify-between ${
                  activeDayData.evening?.isArchived || activeDayData.evening?.isAvailable === false || activeDayData.evening?.slotStatus === 'leave'
                    ? 'bg-gray-50/50 dark:bg-white/5 border-dashed border-gray-200 dark:border-white/10 opacity-70'
                    : ((activeSlotMeta?.slot === 'evening' || liveDiningStatus?.slot === 'evening') && isToday && liveDiningStatus?.state === 'serving')
                    ? 'bg-gradient-to-br from-blue-50 to-indigo-50/60 dark:from-blue-950/40 dark:to-indigo-950/20 border-blue-400 dark:border-blue-500/50 shadow-md ring-2 ring-blue-400/40'
                    : 'bg-white/90 dark:bg-[#0f1715]/90 border-gray-200/80 dark:border-white/10 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-blue-700 dark:text-blue-400">
                      <Sun className="w-4 h-4 text-blue-500" />
                      <span>{t('eveningTea', 'Evening Tea')}</span>
                    </span>

                    {((activeSlotMeta?.slot === 'evening' || liveDiningStatus?.slot === 'evening') && isToday && liveDiningStatus?.state === 'serving') && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500 text-white animate-pulse">
                        {t('activeNow', 'Serving Now')}
                      </span>
                    )}
                  </div>

                  {activeDayData.evening?.timing && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400 dark:text-gray-500 mb-2.5">
                      <Clock className="w-3 h-3 text-blue-500" />
                      <span>{activeDayData.evening.timing}</span>
                    </div>
                  )}

                  {activeDayData.evening?.isArchived || activeDayData.evening?.isAvailable === false || activeDayData.evening?.slotStatus === 'leave' ? (
                    <div className="py-2 space-y-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 inline-block">
                        Leave / Off
                      </span>
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium italic">
                        {activeDayData.evening?.leaveReason || 'No evening refreshment scheduled'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {activeDayData.evening?.slotStatus === 'event' && (
                        <span className="mb-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 inline-flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{activeDayData.evening?.eventTitle || 'Event Tea'}</span>
                        </span>
                      )}
                      {activeDayData.evening?.slotStatus === 'fasting' && (
                        <span className="mb-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700/60 inline-flex items-center gap-1">
                          <Moon className="w-2.5 h-2.5" />
                          <span>Fasting Routine</span>
                        </span>
                      )}
                      <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-snug">
                        {activeDayData.evening?.title || t('noDishSet', 'No dish set')}
                      </h3>

                      {activeDayData.evening?.items?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {activeDayData.evening.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 text-blue-800 dark:text-blue-300 text-[11px] font-medium"
                            >
                              {it}
                            </span>
                          ))}
                        </div>
                      )}

                      {activeDayData.evening?.specialSponsor && (
                        <div className="mt-2 text-[11px] text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
                          <span>🤝 Sponsor: {activeDayData.evening.specialSponsor}</span>
                        </div>
                      )}
                      {activeDayData.evening?.specialNotes && (
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 italic">
                          {activeDayData.evening.specialNotes}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {activeDayData.evening?.category && (
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Category</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        CATEGORY_STYLES[activeDayData.evening.category] || CATEGORY_STYLES.Veg
                      }`}
                    >
                      {CATEGORY_ICONS[activeDayData.evening.category] || '🌱'} {activeDayData.evening.category}
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Dinner Slot */}
              <div
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all flex flex-col justify-between ${
                  activeDayData.dinner?.isArchived || activeDayData.dinner?.isAvailable === false || activeDayData.dinner?.slotStatus === 'leave'
                    ? 'bg-gray-50/50 dark:bg-white/5 border-dashed border-gray-200 dark:border-white/10 opacity-70'
                    : ((activeSlotMeta?.slot === 'dinner' || liveDiningStatus?.slot === 'dinner') && isToday && liveDiningStatus?.state === 'serving')
                    ? 'bg-gradient-to-br from-purple-50 to-pink-50/60 dark:from-purple-950/40 dark:to-pink-950/20 border-purple-400 dark:border-purple-500/50 shadow-md ring-2 ring-purple-400/40'
                    : 'bg-white/90 dark:bg-[#0f1715]/90 border-gray-200/80 dark:border-white/10 shadow-sm'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="inline-flex items-center gap-1.5 font-black text-xs uppercase tracking-wider text-purple-700 dark:text-purple-400">
                      <Moon className="w-4 h-4 text-purple-500" />
                      <span>{t('dinner', 'Dinner')}</span>
                    </span>

                    {((activeSlotMeta?.slot === 'dinner' || liveDiningStatus?.slot === 'dinner') && isToday && liveDiningStatus?.state === 'serving') && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-500 text-white animate-pulse">
                        {t('activeNow', 'Serving Now')}
                      </span>
                    )}
                  </div>

                  {activeDayData.dinner?.timing && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400 dark:text-gray-500 mb-2.5">
                      <Clock className="w-3 h-3 text-purple-500" />
                      <span>{activeDayData.dinner.timing}</span>
                    </div>
                  )}

                  {activeDayData.dinner?.isArchived || activeDayData.dinner?.isAvailable === false || activeDayData.dinner?.slotStatus === 'leave' ? (
                    <div className="py-2 space-y-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 inline-block">
                        Leave / Off
                      </span>
                      <p className="text-xs text-rose-600 dark:text-rose-400 font-medium italic">
                        {activeDayData.dinner?.leaveReason || 'No dinner service scheduled'}
                      </p>
                    </div>
                  ) : (
                    <>
                      {activeDayData.dinner?.slotStatus === 'event' && (
                        <span className="mb-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-300 dark:border-purple-700/60 inline-flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>{activeDayData.dinner?.eventTitle || 'Event Dinner Feast'}</span>
                        </span>
                      )}
                      {activeDayData.dinner?.slotStatus === 'fasting' && (
                        <span className="mb-1.5 px-2 py-0.5 rounded-md text-[10px] font-bold bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-300 dark:border-cyan-700/60 inline-flex items-center gap-1">
                          <Moon className="w-2.5 h-2.5" />
                          <span>{activeDayData.dinner?.fastingTitle || 'Iftar Meal & Dinner'}</span>
                        </span>
                      )}
                      <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-snug">
                        {activeDayData.dinner?.title || t('noDishSet', 'No dish set')}
                      </h3>

                      {activeDayData.dinner?.items?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {activeDayData.dinner.items.map((it, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-lg bg-purple-500/10 dark:bg-purple-500/20 text-purple-800 dark:text-purple-300 text-[11px] font-medium"
                            >
                              {it}
                            </span>
                          ))}
                        </div>
                      )}

                      {activeDayData.dinner?.specialSponsor && (
                        <div className="mt-2 text-[11px] text-purple-700 dark:text-purple-300 font-medium flex items-center gap-1">
                          <span>🤝 Sponsor: {activeDayData.dinner.specialSponsor}</span>
                        </div>
                      )}
                      {activeDayData.dinner?.specialNotes && (
                        <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400 italic">
                          {activeDayData.dinner.specialNotes}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {activeDayData.dinner?.category && (
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                    <span className="text-[10px] text-gray-400 font-semibold uppercase">Category</span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                        CATEGORY_STYLES[activeDayData.dinner.category] || CATEGORY_STYLES.Veg
                      }`}
                    >
                      {CATEGORY_ICONS[activeDayData.dinner.category] || '🌱'} {activeDayData.dinner.category}
                    </span>
                  </div>
                )}
              </div>

            </div>
          )}


        </div>
      )}

      {/* ================= 5. PERSPECTIVE B: WEEKLY SCHEDULE MATRIX ================= */}
      {viewMode === 'week' && (
        <div className="space-y-4">

          {/* Mobile Card Grid (sm:hidden) */}
          <div className="block sm:hidden space-y-3">
            {weekDaysData.map((item) => {
              const key = item.key;
              const isItemToday = item.isToday;
              const isItemTarget = item.isTarget;
              const isArchived = Boolean(item.isArchived || item.isClosed);

              return (
                <div
                  key={key}
                  onClick={() => {
                    feedback('tick');
                    setDateToCustom(item.dateStr);
                    setViewMode('day');
                  }}
                  className={`p-4 rounded-3xl border transition-all cursor-pointer ${
                    isItemTarget
                      ? 'ring-2 ring-emerald-500 shadow-md'
                      : ''
                  } ${
                    isArchived
                      ? 'bg-amber-50/50 dark:bg-amber-950/20 border-dashed border-amber-300 dark:border-amber-700/50'
                      : item.isOverride
                      ? 'bg-gradient-to-br from-purple-50 to-indigo-50/70 dark:from-purple-950/30 dark:to-indigo-950/20 border-purple-300 dark:border-purple-600/40 shadow-sm'
                      : isItemToday
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/40 shadow-sm'
                      : 'bg-white/90 dark:bg-[#0f1715]/90 border-gray-200/80 dark:border-white/10 shadow-sm'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="min-w-0">
                      <span className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>{t(`daysFull.${key}`) || item.dayName}</span>
                      </span>
                      <span className="text-[10px] text-gray-400 block font-mono pl-5.5">
                        {formatFriendlyDate(item.dateStr)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {item.isOverride && item.occasion && !isArchived && (
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 flex items-center gap-1">
                          <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                          <span>{item.occasion}</span>
                        </span>
                      )}

                      {isArchived ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                          {t('canteenClosed', 'Canteen Closed')}
                        </span>
                      ) : (
                        <>
                          {isItemToday && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
                              {t('today', 'Today')}
                            </span>
                          )}
                          {isItemTarget && !isItemToday && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500 text-white">
                              Selected
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {isArchived ? (
                    <div className="p-3 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                      <span>
                        <strong>{t('canteenClosed', 'Canteen Closed')}:</strong>{' '}
                        {item.closureReason || item.archiveReason || t('routineOffDay', 'Routine Off Day')}
                      </span>
                    </div>
                  ) : (
                    <>
                      {item.note && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-2 italic flex items-center gap-1">
                          <Info className="w-3 h-3 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                          <span>{item.note}</span>
                        </p>
                      )}

                      <div className="space-y-2 text-xs">
                        {/* Breakfast */}
                        {!item.breakfast?.isArchived && item.breakfast?.isAvailable !== false && (
                          <div className={`p-2.5 rounded-xl border transition-all ${
                            isItemToday && liveDiningStatus?.slot === 'breakfast' && liveDiningStatus?.state === 'serving'
                              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-400 dark:border-amber-500/60 ring-2 ring-amber-400/50 shadow-xs'
                              : 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-500/20'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-[11px] text-amber-800 dark:text-amber-400 flex items-center gap-1.5">
                                <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>{t('breakfast', 'Breakfast')}</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                {isItemToday && liveDiningStatus?.slot === 'breakfast' && liveDiningStatus?.state === 'serving' && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-amber-500 text-white animate-pulse">
                                    Active
                                  </span>
                                )}
                                {item.breakfast?.timing && (
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {item.breakfast.timing}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-gray-900 dark:text-white font-bold block truncate">
                                {item.breakfast?.title || t('noDishSet', 'No dish set')}
                              </span>
                              {item.breakfast?.category && (
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${
                                  CATEGORY_STYLES[item.breakfast.category] || CATEGORY_STYLES.Veg
                                }`}>
                                  {CATEGORY_ICONS[item.breakfast.category] || '🌱'} {item.breakfast.category}
                                </span>
                              )}
                            </div>
                            {item.breakfast?.items?.length > 0 && (
                              <span className="text-[10px] text-gray-600 dark:text-gray-400 block mt-0.5 truncate">
                                {item.breakfast.items.join(' • ')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Lunch */}
                        {!item.lunch?.isArchived && item.lunch?.isAvailable !== false && (
                          <div className={`p-2.5 rounded-xl border transition-all ${
                            isItemToday && liveDiningStatus?.slot === 'lunch' && liveDiningStatus?.state === 'serving'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-500/60 ring-2 ring-emerald-400/50 shadow-xs'
                              : 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-500/20'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-[11px] text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                                <Utensils className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>{t('lunch', 'Lunch')}</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                {isItemToday && liveDiningStatus?.slot === 'lunch' && liveDiningStatus?.state === 'serving' && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-emerald-500 text-white animate-pulse">
                                    Active
                                  </span>
                                )}
                                {item.lunch?.timing && (
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {item.lunch.timing}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-gray-900 dark:text-white font-bold block truncate">
                                {item.lunch?.title || t('noDishSet', 'No dish set')}
                              </span>
                              {item.lunch?.category && (
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${
                                  CATEGORY_STYLES[item.lunch.category] || CATEGORY_STYLES.Veg
                                }`}>
                                  {CATEGORY_ICONS[item.lunch.category] || '🌱'} {item.lunch.category}
                                </span>
                              )}
                            </div>
                            {key === 'fr' && (
                              <span className="inline-block mt-1 text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded">
                                🕌 Jumu&apos;ah (01:15 – 02:15 PM)
                              </span>
                            )}
                            {item.lunch?.items?.length > 0 && (
                              <span className="text-[10px] text-gray-600 dark:text-gray-400 block mt-0.5 truncate">
                                {item.lunch.items.join(' • ')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Evening */}
                        {!item.evening?.isArchived && item.evening?.isAvailable !== false && (
                          <div className={`p-2.5 rounded-xl border transition-all ${
                            isItemToday && liveDiningStatus?.slot === 'evening' && liveDiningStatus?.state === 'serving'
                              ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-500/60 ring-2 ring-blue-400/50 shadow-xs'
                              : 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-500/20'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-[11px] text-blue-800 dark:text-blue-400 flex items-center gap-1.5">
                                <Coffee className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>{t('eveningTea', 'Evening Tea')}</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                {isItemToday && liveDiningStatus?.slot === 'evening' && liveDiningStatus?.state === 'serving' && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-blue-500 text-white animate-pulse">
                                    Active
                                  </span>
                                )}
                                {item.evening?.timing && (
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {item.evening.timing}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-gray-800 dark:text-gray-200 font-bold block truncate">
                                {item.evening?.title || t('noDishSet', 'No dish set')}
                              </span>
                              {item.evening?.category && (
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${
                                  CATEGORY_STYLES[item.evening.category] || CATEGORY_STYLES.Veg
                                }`}>
                                  {CATEGORY_ICONS[item.evening.category] || '🌱'} {item.evening.category}
                                </span>
                              )}
                            </div>
                            {item.evening?.items?.length > 0 && (
                              <span className="text-[10px] text-gray-600 dark:text-gray-400 block mt-0.5 truncate">
                                {item.evening.items.join(' • ')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Dinner */}
                        {!item.dinner?.isArchived && item.dinner?.isAvailable !== false && (
                          <div className={`p-2.5 rounded-xl border transition-all ${
                            isItemToday && liveDiningStatus?.slot === 'dinner' && liveDiningStatus?.state === 'serving'
                              ? 'bg-purple-50 dark:bg-purple-950/40 border-purple-400 dark:border-purple-500/60 ring-2 ring-purple-400/50 shadow-xs'
                              : 'bg-purple-50/50 dark:bg-purple-950/20 border-purple-200/50 dark:border-purple-500/20'
                          }`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-[11px] text-purple-800 dark:text-purple-400 flex items-center gap-1.5">
                                <Moon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                <span>{t('dinner', 'Dinner')}</span>
                              </span>
                              <div className="flex items-center gap-1.5">
                                {isItemToday && liveDiningStatus?.slot === 'dinner' && liveDiningStatus?.state === 'serving' && (
                                  <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-purple-500 text-white animate-pulse">
                                    Active
                                  </span>
                                )}
                                {item.dinner?.timing && (
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {item.dinner.timing}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-gray-800 dark:text-gray-200 font-bold block truncate">
                                {item.dinner?.title || t('noDishSet', 'No dish set')}
                              </span>
                              {item.dinner?.category && (
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border shrink-0 ${
                                  CATEGORY_STYLES[item.dinner.category] || CATEGORY_STYLES.Veg
                                }`}>
                                  {CATEGORY_ICONS[item.dinner.category] || '🌱'} {item.dinner.category}
                                </span>
                              )}
                            </div>
                            {item.dinner?.items?.length > 0 && (
                              <span className="text-[10px] text-gray-600 dark:text-gray-400 block mt-0.5 truncate">
                                {item.dinner.items.join(' • ')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Tap to inspect footer */}
                      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        <span>{t('inspectFullDay', 'Inspect Day')}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table View (hidden sm:block) */}
          <div className="hidden sm:block rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-lg overflow-hidden backdrop-blur-xl">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10 text-left text-xs sm:text-sm">
                <thead className="bg-gray-50/80 dark:bg-[#131d1a]">
                  <tr>
                    <th className="py-4 px-5 font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-40">
                      {t('day', 'Day')}
                    </th>
                    {hasVisibleBreakfast && (
                      <th className="py-4 px-5 font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                        <div>
                          <span className="inline-flex items-center gap-1.5">
                            <Coffee className="w-3.5 h-3.5" />
                            <span>{t('breakfast', 'Breakfast')}</span>
                          </span>
                          <span className="block text-[10px] font-mono text-gray-400 font-normal mt-0.5 normal-case">
                            07:30 AM – 08:45 AM
                          </span>
                        </div>
                      </th>
                    )}
                    {hasVisibleLunch && (
                      <th className="py-4 px-5 font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        <div>
                          <span className="inline-flex items-center gap-1.5">
                            <Utensils className="w-3.5 h-3.5" />
                            <span>{t('lunch', 'Lunch')}</span>
                          </span>
                          <span className="block text-[10px] font-mono text-gray-400 font-normal mt-0.5 normal-case">
                            12:45 PM – 02:00 PM <span className="text-emerald-600 dark:text-emerald-400 font-bold">(Fri: 01:15)</span>
                          </span>
                        </div>
                      </th>
                    )}
                    {hasVisibleEvening && (
                      <th className="py-4 px-5 font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                        <div>
                          <span className="inline-flex items-center gap-1.5">
                            <Sun className="w-3.5 h-3.5" />
                            <span>{t('eveningTea', 'Evening Tea')}</span>
                          </span>
                          <span className="block text-[10px] font-mono text-gray-400 font-normal mt-0.5 normal-case">
                            04:30 PM – 05:30 PM
                          </span>
                        </div>
                      </th>
                    )}
                    {hasVisibleDinner && (
                      <th className="py-4 px-5 font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                        <div>
                          <span className="inline-flex items-center gap-1.5">
                            <Moon className="w-3.5 h-3.5" />
                            <span>{t('dinner', 'Dinner')}</span>
                          </span>
                          <span className="block text-[10px] font-mono text-gray-400 font-normal mt-0.5 normal-case">
                            08:30 PM – 09:30 PM
                          </span>
                        </div>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium text-gray-800 dark:text-gray-200">
                  {weekDaysData.map((item) => {
                    const key = item.key;
                    const isItemToday = item.isToday;
                    const isItemTarget = item.isTarget;
                    const isArchived = Boolean(item.isArchived || item.isClosed);
                    const isFriday = key === 'fr';

                    if (isArchived) {
                      return (
                        <tr
                          key={key}
                          onClick={() => {
                            feedback('tick');
                            setDateToCustom(item.dateStr);
                            setViewMode('day');
                          }}
                          className={`bg-amber-50/40 dark:bg-amber-950/10 cursor-pointer hover:bg-amber-100/40 transition-colors ${
                            isItemTarget ? 'ring-2 ring-inset ring-amber-400' : ''
                          }`}
                        >
                          <td className="py-4 px-5 font-bold text-amber-700 dark:text-amber-400">
                            <div>{t(`daysFull.${key}`) || item.dayName}</div>
                            <span className="block text-[10px] text-amber-600 font-normal">
                              {formatFriendlyDate(item.dateStr)}
                            </span>
                            <span className="block text-[10px] text-amber-600 font-bold mt-0.5">
                              {t('offDay', 'Off-Day')}
                            </span>
                          </td>
                          <td
                            colSpan={totalCols - 1}
                            className="py-4 px-5 text-amber-800 dark:text-amber-300 italic text-xs"
                          >
                            <span className="inline-flex items-center gap-1.5 font-bold mr-1 text-amber-900 dark:text-amber-200">
                              <Lock className="w-3.5 h-3.5 text-amber-600" />
                              <span>{t('canteenClosed', 'Canteen Closed')} —</span>
                            </span>
                            {item.closureReason ||
                              item.archiveReason ||
                              t('canteenClosedRoutineNotice', 'Routine Off Day. No dining hall supply.')}
                          </td>
                        </tr>
                      );
                    }

                    return (
                      <tr
                        key={key}
                        onClick={() => {
                          feedback('tick');
                          setDateToCustom(item.dateStr);
                          setViewMode('day');
                        }}
                        className={`transition-colors cursor-pointer ${
                          isItemTarget
                            ? 'bg-emerald-50/90 dark:bg-emerald-950/40 ring-2 ring-inset ring-emerald-500'
                            : item.isOverride
                            ? 'bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-100/40'
                            : isItemToday
                            ? 'bg-emerald-50/50 dark:bg-emerald-950/20 font-semibold hover:bg-emerald-100/40'
                            : 'hover:bg-gray-50/50 dark:hover:bg-white/5'
                        }`}
                      >
                        <td className="py-4 px-5 align-top">
                          <div className="flex items-center gap-1.5 flex-wrap font-bold text-emerald-600 dark:text-emerald-400">
                            <span>{t(`daysFull.${key}`) || item.dayName}</span>
                            {item.isOverride && item.occasion && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                                <span>{item.occasion}</span>
                              </span>
                            )}
                            {isItemToday && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-white animate-pulse">
                                {t('today', 'Today')}
                              </span>
                            )}
                            {isItemTarget && !isItemToday && (
                              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold uppercase bg-blue-500 text-white">
                                Selected
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono block mt-0.5">
                            {formatFriendlyDate(item.dateStr)}
                          </span>
                          {item.note && (
                            <p className="text-[10px] text-gray-400 mt-1 italic font-normal">
                              {item.note}
                            </p>
                          )}
                        </td>

                        {/* Breakfast cell */}
                        {hasVisibleBreakfast && (
                          <td className={`py-4 px-5 align-top ${
                            isItemToday && liveDiningStatus?.slot === 'breakfast' && liveDiningStatus?.state === 'serving'
                              ? 'bg-amber-500/10 ring-2 ring-inset ring-amber-400/60 rounded-xl'
                              : ''
                          }`}>
                            {item.breakfast?.isArchived || item.breakfast?.isAvailable === false ? (
                              <span className="text-gray-300 dark:text-gray-600 font-mono text-xs">—</span>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-gray-900 dark:text-white block">
                                    {item.breakfast?.title || '—'}
                                  </span>
                                  {item.breakfast?.category && (
                                    <span
                                      className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold border ${
                                        CATEGORY_STYLES[item.breakfast.category] || CATEGORY_STYLES.Veg
                                      }`}
                                    >
                                      {CATEGORY_ICONS[item.breakfast.category] || '🌱'} {item.breakfast.category}
                                    </span>
                                  )}
                                  {isItemToday && liveDiningStatus?.slot === 'breakfast' && liveDiningStatus?.state === 'serving' && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-amber-500 text-white animate-pulse">
                                      Active
                                    </span>
                                  )}
                                </div>
                                {item.breakfast?.items?.length > 0 && (
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    {item.breakfast.items.join(' • ')}
                                  </p>
                                )}
                                {item.breakfast?.timing && (
                                  <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 font-mono">
                                    <Clock className="w-3 h-3 text-amber-500" />
                                    <span>{item.breakfast.timing}</span>
                                  </span>
                                )}
                              </>
                            )}
                          </td>
                        )}

                        {/* Lunch cell */}
                        {hasVisibleLunch && (
                          <td className={`py-4 px-5 align-top ${
                            isItemToday && liveDiningStatus?.slot === 'lunch' && liveDiningStatus?.state === 'serving'
                              ? 'bg-emerald-500/10 ring-2 ring-inset ring-emerald-400/60 rounded-xl'
                              : ''
                          }`}>
                            {item.lunch?.isArchived || item.lunch?.isAvailable === false ? (
                              <span className="text-gray-300 dark:text-gray-600 font-mono text-xs">—</span>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-extrabold text-gray-900 dark:text-white">
                                    {item.lunch?.title || '—'}
                                  </span>
                                  {item.lunch?.category && item.lunch?.title && (
                                    <span
                                      className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold border ${
                                        CATEGORY_STYLES[item.lunch.category] || CATEGORY_STYLES.Veg
                                      }`}
                                    >
                                      {CATEGORY_ICONS[item.lunch.category] || '🌱'} {item.lunch.category}
                                    </span>
                                  )}
                                  {isItemToday && liveDiningStatus?.slot === 'lunch' && liveDiningStatus?.state === 'serving' && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-emerald-500 text-white animate-pulse">
                                      Active
                                    </span>
                                  )}
                                </div>
                                {item.lunch?.items?.length > 0 && (
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    {item.lunch.items.join(' • ')}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  {item.lunch?.timing && (
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1 font-mono">
                                      <Clock className="w-3 h-3 text-emerald-500" />
                                      <span>{item.lunch.timing}</span>
                                    </span>
                                  )}
                                  {isFriday && (
                                    <span className="text-[9px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/50 px-1.5 py-0.2 rounded">
                                      Jumu&apos;ah Schedule
                                    </span>
                                  )}
                                </div>
                              </>
                            )}
                          </td>
                        )}

                        {/* Evening cell */}
                        {hasVisibleEvening && (
                          <td className={`py-4 px-5 align-top ${
                            isItemToday && liveDiningStatus?.slot === 'evening' && liveDiningStatus?.state === 'serving'
                              ? 'bg-blue-500/10 ring-2 ring-inset ring-blue-400/60 rounded-xl'
                              : ''
                          }`}>
                            {item.evening?.isArchived || item.evening?.isAvailable === false ? (
                              <span className="text-gray-300 dark:text-gray-600 font-mono text-xs">—</span>
                            ) : (
                              <>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-gray-800 dark:text-gray-200 block">
                                    {item.evening?.title || '—'}
                                  </span>
                                  {item.evening?.category && (
                                    <span
                                      className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold border ${
                                        CATEGORY_STYLES[item.evening.category] || CATEGORY_STYLES.Veg
                                      }`}
                                    >
                                      {CATEGORY_ICONS[item.evening.category] || '🌱'} {item.evening.category}
                                    </span>
                                  )}
                                  {isItemToday && liveDiningStatus?.slot === 'evening' && liveDiningStatus?.state === 'serving' && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-blue-500 text-white animate-pulse">
                                      Active
                                    </span>
                                  )}
                                </div>
                                {item.evening?.items?.length > 0 && (
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    {item.evening.items.join(' • ')}
                                  </p>
                                )}
                                {item.evening?.timing && (
                                  <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 font-mono">
                                    <Clock className="w-3 h-3 text-blue-500" />
                                    <span>{item.evening.timing}</span>
                                  </span>
                                )}
                              </>
                            )}
                          </td>
                        )}

                        {/* Dinner cell */}
                        {hasVisibleDinner && (
                          <td className={`py-4 px-5 align-top ${
                            isItemToday && liveDiningStatus?.slot === 'dinner' && liveDiningStatus?.state === 'serving'
                              ? 'bg-purple-500/10 ring-2 ring-inset ring-purple-400/60 rounded-xl'
                              : ''
                          }`}>
                            {item.dinner?.isArchived || item.dinner?.isAvailable === false ? (
                              <span className="text-gray-300 dark:text-gray-600 font-mono text-xs">—</span>
                            ) : (
                              <div>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-bold text-gray-800 dark:text-gray-200 block">
                                    {item.dinner?.title || '—'}
                                  </span>
                                  {item.dinner?.category && (
                                    <span
                                      className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold border ${
                                        CATEGORY_STYLES[item.dinner.category] || CATEGORY_STYLES.Veg
                                      }`}
                                    >
                                      {CATEGORY_ICONS[item.dinner.category] || '🌱'} {item.dinner.category}
                                    </span>
                                  )}
                                  {isItemToday && liveDiningStatus?.slot === 'dinner' && liveDiningStatus?.state === 'serving' && (
                                    <span className="px-1.5 py-0.2 rounded-full text-[8px] font-black uppercase bg-purple-500 text-white animate-pulse">
                                      Active
                                    </span>
                                  )}
                                </div>
                                {item.dinner?.items?.length > 0 && (
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    {item.dinner.items.join(' • ')}
                                  </p>
                                )}
                                {item.dinner?.timing && (
                                  <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1 font-mono">
                                    <Clock className="w-3 h-3 text-purple-500" />
                                    <span>{item.dinner.timing}</span>
                                  </span>
                                )}
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= 5b. PERSPECTIVE C: MONTHLY CALENDAR GRID ================= */}
      {viewMode === 'month' && (
        <div className="space-y-4">

          {/* Month Stats & Dietary Balance Summary Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xs text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-200 font-bold">
                <LayoutGrid className="w-4 h-4 text-emerald-500" />
                <span>{currentMonthName} {currentYear}</span>
                <span className="text-gray-400 font-normal">({monthStats.totalDays} days)</span>
              </div>

              {monthStats.totalNonVeg > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-700/60 text-[10px] font-bold flex items-center gap-1">
                  <span>🍗</span>
                  <span>{monthStats.totalNonVeg} {t('nonVegDays', 'Non-Veg')}</span>
                </span>
              )}

              {monthStats.totalVeg > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60 text-[10px] font-bold flex items-center gap-1">
                  <span>🌱</span>
                  <span>{monthStats.totalVeg} {t('vegDays', 'Veg')}</span>
                </span>
              )}

              {monthStats.totalFeasts > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 text-[10px] font-bold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                  <span>{monthStats.totalFeasts} {monthStats.totalFeasts === 1 ? 'Feast' : 'Feasts'}</span>
                </span>
              )}

              {monthStats.totalClosures > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700 text-[10px] font-bold flex items-center gap-1">
                  <Lock className="w-2.5 h-2.5 text-amber-600" />
                  <span>{monthStats.totalClosures} {monthStats.totalClosures === 1 ? 'Closure' : 'Closures'}</span>
                </span>
              )}
            </div>

            {/* Meal Perspective Switcher for Month View */}
            <div className="inline-flex p-0.5 rounded-xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 shrink-0">
              {[
                { id: 'all', label: t('allMeals', 'All Meals') },
                { id: 'breakfast', label: `🍳 ${t('breakfast', 'Breakfast')}` },
                { id: 'lunch', label: `🍛 ${t('lunch', 'Lunch')}` },
                { id: 'evening', label: `☕ ${t('eveningTea', 'Tea')}` },
                { id: 'dinner', label: `🌙 ${t('dinner', 'Dinner')}` },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setMonthMealSlot(id);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    monthMealSlot === id
                      ? 'text-emerald-700 dark:text-emerald-300 bg-white dark:bg-[#1a2521] shadow-xs'
                      : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* 7-Column Calendar Grid */}
          <div className="rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0f1715]/90 shadow-sm overflow-hidden">
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 border-b border-gray-200/80 dark:border-white/10 bg-gray-50/80 dark:bg-[#131d1a]">
              {DAY_HEADERS.map((dh) => (
                <div
                  key={dh}
                  className="py-2.5 text-center text-[10px] sm:text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                >
                  {dh}
                </div>
              ))}
            </div>

            {/* Calendar cells */}
            <div className="grid grid-cols-7">
              {calendarDays.map((cell, idx) => {
                if (cell.isBlank) {
                  return (
                    <div
                      key={`blank-${idx}`}
                      className="min-h-[85px] sm:min-h-[110px] border-b border-r border-gray-100/80 dark:border-white/5 bg-gray-50/30 dark:bg-transparent"
                    />
                  );
                }

                const ovr = overrides[cell.dateStr];
                const isClosed = Boolean(ovr?.isClosed || ovr?.isHoliday || ovr?.dayStatus === 'leave');
                const isFeast = Boolean(ovr?.occasion || ovr?.dayStatus === 'event');
                const isSelected = cell.dateStr === monthPreviewDate;
                const effective = getEffectiveMenuForDate(cell.dateStr, weeklyMenu, overrides);

                // Slot-specific data if filtered
                const focusedSlotData = monthMealSlot !== 'all' ? effective[monthMealSlot] : null;

                return (
                  <button
                    key={cell.dateStr}
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setMonthPreviewDate(cell.dateStr);
                      setDateToCustom(cell.dateStr);
                    }}
                    className={`relative min-h-[85px] sm:min-h-[110px] p-1.5 sm:p-2 border-b border-r border-gray-100/80 dark:border-white/5 text-left transition-all cursor-pointer group flex flex-col justify-between ${
                      isSelected
                        ? 'ring-2 ring-inset ring-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 z-10'
                        : cell.isToday
                        ? 'bg-emerald-50/40 dark:bg-emerald-950/20'
                        : isClosed
                        ? 'bg-amber-50/30 dark:bg-amber-950/10'
                        : isFeast
                        ? 'bg-purple-50/25 dark:bg-purple-950/15'
                        : 'hover:bg-gray-50 dark:hover:bg-white/5'
                    }`}
                  >
                    {/* Top Row: Day Number + Status Badge */}
                    <div className="flex items-center justify-between gap-1">
                      <span
                        className={`text-xs sm:text-sm font-black w-6 h-6 rounded-full flex items-center justify-center ${
                          cell.isToday
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : isSelected
                            ? 'bg-emerald-600 text-white'
                            : cell.isPast
                            ? 'text-gray-400 dark:text-gray-500'
                            : 'text-gray-800 dark:text-white'
                        }`}
                      >
                        {cell.dayNumber}
                      </span>

                      <div className="flex items-center gap-1">
                        {isFeast && (
                          <span className="w-2 h-2 rounded-full bg-purple-500" title={ovr?.occasion || 'Feast'} />
                        )}
                        {isClosed && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" title={ovr?.closureReason || 'Closed'} />
                        )}
                      </div>
                    </div>

                    {/* Middle Content */}
                    <div className="my-1 flex-1 min-w-0">
                      {isClosed ? (
                        <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold block truncate">
                          {ovr?.closureReason || 'Closed'}
                        </span>
                      ) : monthMealSlot !== 'all' ? (
                        // Specific Meal View
                        focusedSlotData?.isArchived || focusedSlotData?.isAvailable === false ? (
                          <span className="text-[10px] text-gray-400 italic">Off</span>
                        ) : (
                          <div className="space-y-0.5">
                            <span className="text-[10px] sm:text-xs font-extrabold text-gray-900 dark:text-white block truncate leading-tight">
                              {focusedSlotData?.title || '—'}
                            </span>
                            {focusedSlotData?.category && (
                              <span className={`inline-block px-1 py-0.2 rounded text-[8px] font-bold border ${
                                CATEGORY_STYLES[focusedSlotData.category] || CATEGORY_STYLES.Veg
                              }`}>
                                {focusedSlotData.category}
                              </span>
                            )}
                          </div>
                        )
                      ) : (
                        // All Meals View: primary dish highlights
                        <div className="space-y-0.5">
                          {effective.lunch?.title && (
                            <p className="text-[10px] text-gray-700 dark:text-gray-200 truncate leading-tight font-bold flex items-center gap-0.5">
                              <span className="text-[9px]">{CATEGORY_ICONS[effective.lunch.category] || '🍛'}</span>
                              <span className="truncate">{effective.lunch.title}</span>
                            </p>
                          )}
                          {effective.breakfast?.title && (
                            <p className="text-[9px] text-gray-500 dark:text-gray-400 truncate leading-tight hidden sm:block">
                              <Coffee className="w-2.5 h-2.5 inline mr-0.5 text-amber-500" />
                              {effective.breakfast.title}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Row: 4 Meal Category Indicator Dots (B, L, E, D) */}
                    {!isClosed && (
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-white/5">
                        {['breakfast', 'lunch', 'evening', 'dinner'].map((slotKey) => {
                          const slot = effective[slotKey] || {};
                          const hasDish = Boolean(slot.title?.trim());
                          const isSlotArchived = Boolean(slot.isArchived || slot.isAvailable === false || slot.slotStatus === 'leave');
                          const cat = slot.category;

                          return (
                            <span
                              key={slotKey}
                              className={`w-1.5 h-1.5 rounded-full ${
                                isSlotArchived
                                  ? 'bg-gray-300 dark:bg-white/10 opacity-30'
                                  : cat === 'Non-Veg'
                                  ? 'bg-rose-500'
                                  : cat === 'Egg'
                                  ? 'bg-amber-500'
                                  : cat === 'Special'
                                  ? 'bg-purple-500'
                                  : hasDish
                                  ? 'bg-emerald-500'
                                  : 'bg-gray-200 dark:bg-white/10'
                              }`}
                              title={`${slotKey.toUpperCase()}: ${slot.title || 'Standard'}`}
                            />
                          );
                        })}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Master-Detail Instant Selected Day Preview Drawer */}
          {monthPreviewData && (
            <div className="p-4 sm:p-5 rounded-3xl bg-white/95 dark:bg-[#0f1715]/95 border border-emerald-500/30 shadow-md backdrop-blur-xl space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-white/10">
                <div className="flex items-center gap-2 flex-wrap">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                    {formatFriendlyDate(monthPreviewDate, true)}
                  </h3>
                  {monthPreviewData.isOverride && monthPreviewData.occasion && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-purple-500" />
                      <span>{monthPreviewData.occasion}</span>
                    </span>
                  )}
                  {monthPreviewDate === todayIST && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white animate-pulse">
                      {t('today', 'Today')}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setDateToCustom(monthPreviewDate);
                    setViewMode('day');
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-xs"
                >
                  <span>{t('inspectFullDay', 'Open Full Day View')}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 4 Slots Preview Strip */}
              {monthPreviewData.isArchived || monthPreviewData.isClosed ? (
                <div className="p-3 rounded-2xl bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-600" />
                  <span>
                    <strong>{t('canteenClosed', 'Canteen Closed')}:</strong>{' '}
                    {monthPreviewData.closureReason || 'Routine Off Day'}
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {SLOT_CONFIGS.map((slot) => {
                    const slotData = monthPreviewData[slot.key] || {};
                    const isSlotArchived = Boolean(slotData.isArchived || slotData.isAvailable === false);
                    const Icon = slot.icon;

                    return (
                      <div
                        key={slot.key}
                        className={`p-3 rounded-2xl border ${
                          isSlotArchived
                            ? 'bg-gray-50/50 dark:bg-white/5 border-dashed border-gray-200 dark:border-white/10 opacity-60'
                            : 'bg-gray-50/70 dark:bg-[#121c19]/70 border-gray-200/70 dark:border-white/10'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="font-black text-xs uppercase flex items-center gap-1 text-gray-700 dark:text-gray-300">
                            <Icon className="w-3.5 h-3.5 text-emerald-500" />
                            <span>{slot.label}</span>
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">
                            {slotData.timing || slot.defaultTiming}
                          </span>
                        </div>

                        {isSlotArchived ? (
                          <span className="text-xs text-gray-400 italic">Off</span>
                        ) : (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-black text-gray-900 dark:text-white">
                                {slotData.title || t('noDishSet', 'No dish set')}
                              </span>
                              {slotData.category && (
                                <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold border ${
                                  CATEGORY_STYLES[slotData.category] || CATEGORY_STYLES.Veg
                                }`}>
                                  {CATEGORY_ICONS[slotData.category] || '🌱'} {slotData.category}
                                </span>
                              )}
                            </div>
                            {slotData.items?.length > 0 && (
                              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                                {slotData.items.join(' • ')}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ================= 5c. PERSPECTIVE D: YEAR-AT-A-GLANCE ================= */}
      {viewMode === 'year' && (
        <div className="space-y-4">
          {/* Year Heading & Culinary Stats Overview */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xs text-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-black text-sm text-gray-900 dark:text-white">
                  {currentYear} {t('annualCulinaryOverview', 'Annual Culinary Overview')}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  12-month bird&apos;s-eye view of campus dining rosters, dietary distribution, and special feast schedules.
                </p>
              </div>
            </div>

            {/* Culinary Legend */}
            <div className="flex items-center gap-3 text-[11px] font-bold text-gray-600 dark:text-gray-400 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Non-Veg</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Veg</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Feast</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Closed</span>
              </span>
            </div>
          </div>

          {/* 12-Month Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {yearMonthsData.map((mData) => (
              <div
                key={mData.monthIndex}
                className={`p-4 rounded-3xl border transition-all space-y-3 ${
                  mData.isCurrentMonth
                    ? 'ring-2 ring-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/25 border-emerald-300 dark:border-emerald-600/40 shadow-sm'
                    : 'bg-white/90 dark:bg-[#0f1715]/90 border-gray-200/80 dark:border-white/10 shadow-xs hover:border-emerald-300/60 dark:hover:border-emerald-600/30'
                }`}
              >
                {/* Header: Month Name + Jump to Month View button */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/5">
                  <button
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setDateToCustom(mData.firstDateStr);
                      setViewMode('month');
                    }}
                    className="font-black text-sm text-gray-900 dark:text-white hover:text-emerald-600 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span>{mData.monthName}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                  </button>

                  {mData.isCurrentMonth && (
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-white animate-pulse">
                      {t('thisMonth', 'This Month')}
                    </span>
                  )}
                </div>

                {/* Dietary & Culinary Metrics */}
                <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
                  {mData.nonVegCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold flex items-center gap-0.5">
                      <span>🍗</span>
                      <span>{mData.nonVegCount}</span>
                    </span>
                  )}
                  {mData.vegCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold flex items-center gap-0.5">
                      <span>🌱</span>
                      <span>{mData.vegCount}</span>
                    </span>
                  )}
                  {mData.feastsCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>{mData.feastsCount}</span>
                    </span>
                  )}
                  {mData.biriyaniCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 font-bold flex items-center gap-0.5">
                      <span>🍛</span>
                      <span>{mData.biriyaniCount} Biriyani</span>
                    </span>
                  )}
                </div>

                {/* Mini Heatmap: Day numbers with category colors */}
                <div className="grid grid-cols-7 gap-1 pt-1 text-center">
                  {DAY_HEADERS.map((h) => (
                    <span key={h} className="text-[8px] font-black text-gray-400 uppercase">
                      {h[0]}
                    </span>
                  ))}

                  {mData.days.map((c) => {
                    if (c.isBlank) {
                      return <span key={c.key} className="w-5 h-5" />;
                    }

                    const ovr = overrides?.[c.dateStr];
                    const eff = getEffectiveMenuForDate(c.dateStr, weeklyMenu, overrides);
                    const isClosed = Boolean(ovr?.isClosed || ovr?.isHoliday || ovr?.dayStatus === 'leave');
                    const isFeast = Boolean(ovr?.occasion || ovr?.dayStatus === 'event');
                    const isToday = c.dateStr === todayIST;
                    const cat = eff.lunch?.category;

                    return (
                      <button
                        key={c.dateStr}
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          setDateToCustom(c.dateStr);
                          setViewMode('day');
                        }}
                        className={`w-5 h-5 text-[9px] font-bold rounded-md flex items-center justify-center transition-all cursor-pointer ${
                          isToday
                            ? 'bg-emerald-500 text-white font-black shadow-xs ring-1 ring-white'
                            : isFeast
                            ? 'bg-purple-600 text-white font-black'
                            : isClosed
                            ? 'bg-amber-500 text-white'
                            : cat === 'Non-Veg'
                            ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-200'
                            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
                        }`}
                        title={`${formatFriendlyDate(c.dateStr)}: ${isClosed ? 'Closed' : isFeast ? ovr?.occasion || 'Feast' : eff.lunch?.title || 'Lunch'}`}
                      >
                        {c.dayNumber}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= 5d. PERSPECTIVE E: CHRONOLOGICAL LIST / AGENDA ================= */}
      {viewMode === 'list' && (
        <div className="space-y-4">

          {/* List Search, Filter & Horizon Deck */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 p-3.5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={listSearch}
                onChange={(e) => setListSearch(e.target.value)}
                placeholder={t('searchByDish', 'Search by dish, occasion, or notes...')}
                className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-gray-100/80 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
            </div>

            {/* Filter Pills */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1 p-0.5 rounded-xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 shrink-0 overflow-x-auto">
                <span className="pl-2 pr-1 text-gray-400 dark:text-gray-500">
                  <Filter className="w-3 h-3" />
                </span>
                {[
                  { id: 'all', label: t('allMeals', 'All') },
                  { id: 'nonveg', label: `🍗 ${t('filterNonVeg', 'Non-Veg')}` },
                  { id: 'veg', label: `🌱 ${t('filterVeg', 'Veg')}` },
                  { id: 'feasts', label: `✨ ${t('filterFeasts', 'Feasts')}` },
                  { id: 'closures', label: `🔒 ${t('filterClosures', 'Closed')}` },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setListFilter(id);
                    }}
                    className={`relative px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      listFilter === id
                        ? 'text-emerald-700 dark:text-emerald-300 bg-white dark:bg-[#1a2521] shadow-xs'
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Horizon Selector (14 vs 30 days) */}
              <div className="inline-flex p-0.5 rounded-xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 shrink-0">
                {[
                  { count: 14, label: t('horizon14Days', '14 Days') },
                  { count: 30, label: t('horizon30Days', '30 Days') },
                ].map(({ count, label }) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setAgendaHorizon(count);
                    }}
                    className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                      agendaHorizon === count
                        ? 'text-emerald-700 dark:text-emerald-300 bg-white dark:bg-[#1a2521] shadow-xs'
                        : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Continuous Events & Daily Schedule Cards */}
          {continuousAgendaDays.length === 0 ? (
            <div className="p-8 text-center rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0f1715]/90 space-y-2">
              <Info className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
              <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                {listSearch
                  ? t('noSearchResults', 'No matching dining dates found')
                  : 'No scheduled meals match the active filter.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setListFilter('all');
                  setListSearch('');
                }}
                className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {continuousAgendaDays.map((item) => {
                const { dateStr, dow, isToday, isTomorrow, effective, isClosed, isFeast } = item;
                const isSelected = dateStr === targetDateIST;
                const isFriday = dow === 'fr';

                return (
                  <div
                    key={dateStr}
                    onClick={() => {
                      feedback('tick');
                      setDateToCustom(dateStr);
                      setViewMode('day');
                    }}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all cursor-pointer group ${
                      isSelected
                        ? 'ring-2 ring-emerald-500 shadow-md bg-emerald-50/40 dark:bg-emerald-950/20'
                        : isToday
                        ? 'bg-gradient-to-br from-emerald-50/60 to-white dark:from-emerald-950/20 dark:to-[#0f1715] border-emerald-400/80 dark:border-emerald-500/40 shadow-xs'
                        : isClosed
                        ? 'bg-amber-50/40 dark:bg-amber-950/15 border-amber-300/70 dark:border-amber-700/40'
                        : isFeast
                        ? 'bg-purple-50/30 dark:bg-purple-950/15 border-purple-300/70 dark:border-purple-700/40'
                        : 'bg-white/90 dark:bg-[#0f1715]/90 border-gray-200/80 dark:border-white/10 hover:border-emerald-300/80 dark:hover:border-emerald-600/40 shadow-xs hover:shadow-md'
                    }`}
                  >
                    {/* Top Row: Date Badge + Occasion/Feast + Jump Shortcut */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-gray-100 dark:border-white/10">
                      <div className="flex items-center gap-3">
                        {/* Date Number Box */}
                        <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center text-center shrink-0 ${
                          isToday
                            ? 'bg-emerald-500 text-white shadow-xs'
                            : isFeast
                            ? 'bg-purple-600 text-white shadow-xs'
                            : isClosed
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200'
                        }`}>
                          <span className="text-[9px] font-bold uppercase leading-tight">
                            {MONTH_NAMES[parseInt(dateStr.split('-')[1], 10) - 1]?.slice(0, 3)}
                          </span>
                          <span className="text-lg font-black leading-tight">
                            {parseInt(dateStr.split('-')[2], 10)}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                              {t(`daysFull.${dow}`) || DAY_NAMES[dow] || dow}
                            </span>
                            <span className="text-xs text-gray-400 font-mono">
                              ({formatFriendlyDate(dateStr)})
                            </span>

                            {isToday && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-white animate-pulse">
                                {t('today', 'Today')}
                              </span>
                            )}
                            {isTomorrow && !isToday && (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-teal-500 text-white">
                                {t('tomorrow', 'Tomorrow')}
                              </span>
                            )}
                            {isFeast && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                                <span>{effective.occasion || 'Special Feast'}</span>
                              </span>
                            )}
                            {isClosed && (
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-500 text-white flex items-center gap-1">
                                <Lock className="w-2.5 h-2.5" />
                                <span>{t('canteenClosed', 'Canteen Closed')}</span>
                              </span>
                            )}
                          </div>

                          {effective.note && !isClosed && (
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 italic mt-0.5">
                              {effective.note}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 opacity-80 group-hover:opacity-100 self-end sm:self-auto">
                        <span>{t('inspectFullDay', 'Inspect Day')}</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>

                    {/* Meal Slots Strip */}
                    {isClosed ? (
                      <p className="text-xs text-amber-800 dark:text-amber-300 italic pt-2">
                        {effective.closureReason || 'Routine Off Day. No dining hall service.'}
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3">
                        {SLOT_CONFIGS.map((slot) => {
                          const slotData = effective[slot.key] || {};
                          const isSlotArchived = Boolean(slotData.isArchived || slotData.isAvailable === false);
                          const Icon = slot.icon;
                          const timingLabel = slot.key === 'lunch' && isFriday
                            ? '01:15 PM - 02:15 PM'
                            : (slotData.timing || slot.defaultTiming);

                          return (
                            <div
                              key={slot.key}
                              className={`p-2.5 rounded-2xl border text-xs ${
                                isSlotArchived
                                  ? 'bg-gray-50/50 dark:bg-white/5 border-dashed border-gray-200 dark:border-white/10 opacity-60'
                                  : 'bg-gray-50/60 dark:bg-white/[0.02] border-gray-100 dark:border-white/5'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="font-extrabold text-[11px] uppercase flex items-center gap-1 text-gray-600 dark:text-gray-300">
                                  <Icon className="w-3 h-3 text-emerald-500" />
                                  <span>{slot.label}</span>
                                </span>
                                <span className="text-[9px] font-mono text-gray-400">
                                  {timingLabel}
                                </span>
                              </div>

                              {isSlotArchived ? (
                                <span className="text-[11px] text-gray-400 italic">Off</span>
                              ) : (
                                <div>
                                  <div className="flex items-center gap-1 flex-wrap">
                                    <span className="font-bold text-gray-900 dark:text-white truncate">
                                      {slotData.title || t('noDishSet', 'No dish set')}
                                    </span>
                                    {slotData.category && (
                                      <span className={`px-1 py-0.2 rounded text-[8px] font-bold border ${
                                        CATEGORY_STYLES[slotData.category] || CATEGORY_STYLES.Veg
                                      }`}>
                                        {CATEGORY_ICONS[slotData.category] || '🌱'} {slotData.category}
                                      </span>
                                    )}
                                  </div>
                                  {slotData.items?.length > 0 && (
                                    <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                      {slotData.items.join(' • ')}
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ================= 6. DYNAMIC MENU SOCIAL CARD STUDIO ================= */}
      <SocialCardStudioModal
        isOpen={isCardStudioOpen}
        onClose={() => setIsCardStudioOpen(false)}
        initialTemplate="menu"
        initialData={{
          breakfastDish: activeDayData?.breakfast?.title || 'Weekly Breakfast Schedule',
          breakfastCategory: activeDayData?.breakfast?.category || 'Standard',
          lunchDish: activeDayData?.lunch?.title || 'Weekly Lunch Schedule',
          lunchCategory: activeDayData?.lunch?.category || 'Standard',
          dateStr: formatFriendlyDate(targetDateIST),
          customUrl: 'https://canteen.alathurpadidars.in/menu',
          description: `${formatFriendlyDate(targetDateIST, true)} Menu: ${
            activeDayData?.breakfast?.title || 'Breakfast'
          } • ${activeDayData?.lunch?.title || 'Lunch'}`,
        }}
      />
    </div>
  );
};

export default MenuTable;
