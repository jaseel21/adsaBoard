/**
 * Menu.jsx
 * Campus Canteen Food Menu & Schedule Component
 * 
 * Displays the live weekly breakfast, lunch, evening tea, and dinner schedule,
 * daily special dish highlights, dynamic date overrides, and print/share studio.
 * Powered by unified date controller with tactical date ribbon, day steppers,
 * interactive calendar popover, and dual Day Inspector / All 7 Days views.
 * Served canonically at /menu (with /fmenu redirected to /menu).
 */
import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  Sparkles,
  ArrowLeft,
  UtensilsCrossed,
  Calendar,
  Clock,
  Printer,
  Edit3,
  CheckCircle,
  ShieldCheck,
  UserCheck,
  Moon,
  Sun,
  LayoutGrid,
  ChevronRight,
  Info,
  ExternalLink,
  History,
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
} from '../utils/menuService';
import {
  addDaysToDate,
  formatFriendlyDate,
  getDayOfWeekShort,
} from '../utils/studentExceptionService';
import { useDateController } from '../utils/useDateController';
import TokenBoardDateRibbon from './ui/TokenBoardDateRibbon';
import { ROLES, hasRole } from '../utils/rbac';
import useSEO from '../hooks/useSEO';
import SocialCardStudioModal from './preview/SocialCardStudioModal';

const DAY_KEYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

const CATEGORY_STYLES = {
  Veg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
  'Non-Veg': 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700/60',
  Egg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
  Special: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-700/60',
};

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
    timeHms,
  } = dateController;

  const [weeklyMenu, setWeeklyMenu] = useState(DEFAULT_WEEKLY_MENU);
  const [overrides, setOverrides] = useState({});
  const [viewMode, setViewMode] = useState('day'); // 'day' (Day Inspector) | 'week' (All 7 Days)
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);

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
              <span>{t('tokenPortal', 'Portal')} (#{stdata.tokenNo})</span>
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

      {/* ================= 3. COMPLETE TACTICAL DATE SWITCHING RIBBON ================= */}
      <TokenBoardDateRibbon
        controller={dateController}
        showCalendarPicker={true}
        className="shadow-sm"
      >
        {/* Segmented Perspective Switcher: Focused Day vs All 7 Days */}
        <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              setViewMode('day');
            }}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'day'
                ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-xs font-black'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="Inspect full dining schedule for active target date"
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>{t('viewDayMode') || 'Day Inspector'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              feedback('tick');
              setViewMode('week');
            }}
            className={`px-3 py-1 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              viewMode === 'week'
                ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-xs font-black'
                : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
            }`}
            title="View complete 7-day schedule with date overrides"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t('allSevenDays') || 'All 7 Days'}</span>
          </button>
        </div>
      </TokenBoardDateRibbon>

      {/* ================= 4. PERSPECTIVE A: FOCUSED DAY INSPECTOR ================= */}
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
                </div>

                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1">
                  {activeDayData.isArchived || activeDayData.isClosed
                    ? `⚠️ ${t('canteenClosedNotice', 'Canteen dining hall is closed for food service on this date.')}`
                    : activeDayData.note || t('standardDiningRoutine', 'Standard campus dining hall menu schedule')}
                </p>
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

          {/* Canteen Closed Alert Banner */}
          {(activeDayData.isArchived || activeDayData.isClosed) && (
            <div className="p-4 rounded-2xl bg-amber-100/70 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 text-amber-900 dark:text-amber-200 text-xs sm:text-sm space-y-1">
              <div className="font-bold flex items-center gap-2">
                <span>🔒 {t('canteenClosed', 'Canteen Closed')}</span>
              </div>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                {activeDayData.closureReason ||
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
                    : activeSlotMeta?.slot === 'breakfast' && isToday
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

                    {activeSlotMeta?.slot === 'breakfast' && isToday && (
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

                  {activeDayData.breakfast?.isArchived || activeDayData.breakfast?.isAvailable === false ? (
                    <p className="text-xs text-gray-400 italic">No breakfast service scheduled</p>
                  ) : (
                    <>
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
                      {activeDayData.breakfast.category}
                    </span>
                  </div>
                )}
              </div>

              {/* 2. Lunch Slot */}
              <div
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all flex flex-col justify-between ${
                  activeDayData.lunch?.isArchived || activeDayData.lunch?.isAvailable === false
                    ? 'bg-gray-50/50 dark:bg-white/5 border-dashed border-gray-200 dark:border-white/10 opacity-70'
                    : activeSlotMeta?.slot === 'lunch' && isToday
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

                    {activeSlotMeta?.slot === 'lunch' && isToday && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-white animate-pulse">
                        {t('activeNow', 'Serving Now')}
                      </span>
                    )}
                  </div>

                  {activeDayData.lunch?.timing && (
                    <div className="flex items-center gap-1 text-[11px] font-mono text-gray-400 dark:text-gray-500 mb-2.5">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      <span>{activeDayData.lunch.timing}</span>
                    </div>
                  )}

                  {activeDayData.lunch?.isArchived || activeDayData.lunch?.isAvailable === false ? (
                    <p className="text-xs text-gray-400 italic">No lunch service scheduled</p>
                  ) : (
                    <>
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
                      {activeDayData.lunch.category}
                    </span>
                  </div>
                )}
              </div>

              {/* 3. Evening Refreshment Slot */}
              <div
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all flex flex-col justify-between ${
                  activeDayData.evening?.isArchived || activeDayData.evening?.isAvailable === false
                    ? 'bg-gray-50/50 dark:bg-white/5 border-dashed border-gray-200 dark:border-white/10 opacity-70'
                    : activeSlotMeta?.slot === 'evening' && isToday
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

                    {activeSlotMeta?.slot === 'evening' && isToday && (
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

                  {activeDayData.evening?.isArchived || activeDayData.evening?.isAvailable === false ? (
                    <p className="text-xs text-gray-400 italic">No evening refreshment scheduled</p>
                  ) : (
                    <>
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
                      {activeDayData.evening.category}
                    </span>
                  </div>
                )}
              </div>

              {/* 4. Dinner Slot */}
              <div
                className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl border transition-all flex flex-col justify-between ${
                  activeDayData.dinner?.isArchived || activeDayData.dinner?.isAvailable === false
                    ? 'bg-gray-50/50 dark:bg-white/5 border-dashed border-gray-200 dark:border-white/10 opacity-70'
                    : activeSlotMeta?.slot === 'dinner' && isToday
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

                    {activeSlotMeta?.slot === 'dinner' && isToday && (
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

                  {activeDayData.dinner?.isArchived || activeDayData.dinner?.isAvailable === false ? (
                    <p className="text-xs text-gray-400 italic">No dinner service scheduled</p>
                  ) : (
                    <>
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
                      {activeDayData.dinner.category}
                    </span>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* Quick jump to full 7 days view */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs">
            <span className="text-gray-500 dark:text-gray-400">
              Want to see the entire recurring routine for all 7 days of the week?
            </span>
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setViewMode('week');
              }}
              className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>{t('viewTableMode', 'Week Overview')}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ================= 5. PERSPECTIVE B: ALL 7 DAYS (WEEK MATRIX) ================= */}
      {viewMode === 'week' && (
        <div className="space-y-4">
          
          {/* Week Overview Header Info */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 text-xs text-gray-600 dark:text-gray-300">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-emerald-500" />
              <span>
                <strong>{t('allSevenDays', 'All 7 Days')}</strong> — Showing the week of{' '}
                <strong className="text-gray-900 dark:text-white">
                  {formatFriendlyDate(weekDaysData[0].dateStr)} – {formatFriendlyDate(weekDaysData[6].dateStr)}
                </strong>
              </span>
            </div>
            <span className="text-[11px] text-gray-400 hidden sm:inline">
              Click any day row to inspect its full dining cards
            </span>
          </div>

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
                    <div className="p-3 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs">
                      ℹ️ <strong>{t('canteenClosed', 'Canteen Closed')}:</strong>{' '}
                      {item.closureReason || item.archiveReason || t('routineOffDay', 'Routine Off Day')}
                    </div>
                  ) : (
                    <>
                      {item.note && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-2 italic">
                          ℹ️ {item.note}
                        </p>
                      )}

                      <div className="space-y-2 text-xs">
                        {/* Breakfast */}
                        {!item.breakfast?.isArchived && item.breakfast?.isAvailable !== false && (
                          <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-500/20">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-[11px] text-amber-800 dark:text-amber-400 flex items-center gap-1">
                                ☕ {t('breakfast', 'Breakfast')}
                              </span>
                              {item.breakfast?.timing && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {item.breakfast.timing}
                                </span>
                              )}
                            </div>
                            <span className="text-gray-900 dark:text-white font-bold block">
                              {item.breakfast?.title || t('noDishSet', 'No dish set')}
                            </span>
                            {item.breakfast?.items?.length > 0 && (
                              <span className="text-[10px] text-gray-600 dark:text-gray-400">
                                {item.breakfast.items.join(' • ')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Lunch */}
                        {!item.lunch?.isArchived && item.lunch?.isAvailable !== false && (
                          <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-500/20">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-[11px] text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                                🍲 {t('lunch', 'Lunch')}
                              </span>
                              {item.lunch?.timing && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {item.lunch.timing}
                                </span>
                              )}
                            </div>
                            <span className="text-gray-900 dark:text-white font-bold block">
                              {item.lunch?.title || t('noDishSet', 'No dish set')}
                            </span>
                            {item.lunch?.items?.length > 0 && (
                              <span className="text-[10px] text-gray-600 dark:text-gray-400">
                                {item.lunch.items.join(' • ')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Evening */}
                        {!item.evening?.isArchived && item.evening?.isAvailable !== false && (
                          <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-500/20">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-[11px] text-blue-800 dark:text-blue-400 flex items-center gap-1">
                                🫖 {t('eveningTea', 'Evening Tea')}
                              </span>
                              {item.evening?.timing && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {item.evening.timing}
                                </span>
                              )}
                            </div>
                            <span className="text-gray-800 dark:text-gray-200 font-bold block">
                              {item.evening?.title || t('noDishSet', 'No dish set')}
                            </span>
                            {item.evening?.items?.length > 0 && (
                              <span className="text-[10px] text-gray-600 dark:text-gray-400">
                                {item.evening.items.join(' • ')}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Dinner */}
                        {!item.dinner?.isArchived && item.dinner?.isAvailable !== false && (
                          <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-500/20">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-extrabold text-[11px] text-purple-800 dark:text-purple-400 flex items-center gap-1">
                                🌙 {t('dinner', 'Dinner')}
                              </span>
                              {item.dinner?.timing && (
                                <span className="text-[10px] text-gray-400 font-mono">
                                  {item.dinner.timing}
                                </span>
                              )}
                            </div>
                            <span className="text-gray-800 dark:text-gray-200 font-bold block">
                              {item.dinner?.title || t('noDishSet', 'No dish set')}
                            </span>
                            {item.dinner?.items?.length > 0 && (
                              <span className="text-[10px] text-gray-600 dark:text-gray-400">
                                {item.dinner.items.join(' • ')}
                              </span>
                            )}
                          </div>
                        )}
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
                        ☕ {t('breakfast', 'Breakfast')}
                      </th>
                    )}
                    {hasVisibleLunch && (
                      <th className="py-4 px-5 font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                        🍲 {t('lunch', 'Lunch')}
                      </th>
                    )}
                    {hasVisibleEvening && (
                      <th className="py-4 px-5 font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                        🫖 {t('eveningTea', 'Evening Tea')}
                      </th>
                    )}
                    {hasVisibleDinner && (
                      <th className="py-4 px-5 font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                        🌙 {t('dinner', 'Dinner')}
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
                            🔒 {t('canteenClosed', 'Canteen Closed')} —{' '}
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
                          <td className="py-4 px-5 align-top">
                            {item.breakfast?.isArchived || item.breakfast?.isAvailable === false ? (
                              <span className="text-gray-300 dark:text-gray-600 font-mono text-xs">—</span>
                            ) : (
                              <>
                                <span className="font-bold text-gray-900 dark:text-white block">
                                  {item.breakfast?.title || '—'}
                                </span>
                                {item.breakfast?.items?.length > 0 && (
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    {item.breakfast.items.join(' • ')}
                                  </p>
                                )}
                                {item.breakfast?.timing && (
                                  <span className="text-[10px] text-gray-400 block mt-1">
                                    ⏰ {item.breakfast.timing}
                                  </span>
                                )}
                              </>
                            )}
                          </td>
                        )}

                        {/* Lunch cell */}
                        {hasVisibleLunch && (
                          <td className="py-4 px-5 align-top">
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
                                      {item.lunch.category === 'Veg'
                                        ? t('catVeg') || 'Veg'
                                        : item.lunch.category === 'Non-Veg'
                                        ? t('catNonVeg') || 'Non-Veg'
                                        : item.lunch.category === 'Egg'
                                        ? t('catEgg') || 'Egg'
                                        : item.lunch.category === 'Special'
                                        ? t('catSpecial') || 'Special'
                                        : item.lunch.category}
                                    </span>
                                  )}
                                </div>
                                {item.lunch?.items?.length > 0 && (
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    {item.lunch.items.join(' • ')}
                                  </p>
                                )}
                                {item.lunch?.timing && (
                                  <span className="text-[10px] text-gray-400 block mt-1">
                                    ⏰ {item.lunch.timing}
                                  </span>
                                )}
                              </>
                            )}
                          </td>
                        )}

                        {/* Evening cell */}
                        {hasVisibleEvening && (
                          <td className="py-4 px-5 align-top">
                            {item.evening?.isArchived || item.evening?.isAvailable === false ? (
                              <span className="text-gray-300 dark:text-gray-600 font-mono text-xs">—</span>
                            ) : (
                              <>
                                <span className="font-bold text-gray-800 dark:text-gray-200 block">
                                  {item.evening?.title || '—'}
                                </span>
                                {item.evening?.items?.length > 0 && (
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    {item.evening.items.join(' • ')}
                                  </p>
                                )}
                                {item.evening?.timing && (
                                  <span className="text-[10px] text-gray-400 block mt-1">
                                    ⏰ {item.evening.timing}
                                  </span>
                                )}
                              </>
                            )}
                          </td>
                        )}

                        {/* Dinner cell */}
                        {hasVisibleDinner && (
                          <td className="py-4 px-5 align-top">
                            {item.dinner?.isArchived || item.dinner?.isAvailable === false ? (
                              <span className="text-gray-300 dark:text-gray-600 font-mono text-xs">—</span>
                            ) : (
                              <div>
                                <span className="font-bold text-gray-800 dark:text-gray-200 block">
                                  {item.dinner?.title || '—'}
                                </span>
                                {item.dinner?.items?.length > 0 && (
                                  <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                    {item.dinner.items.join(' • ')}
                                  </p>
                                )}
                                {item.dinner?.timing && (
                                  <span className="text-[10px] text-gray-400 block mt-1">
                                    ⏰ {item.dinner.timing}
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

      {/* ================= 6. DYNAMIC MENU SOCIAL CARD STUDIO ================= */}
      <SocialCardStudioModal
        isOpen={isCardStudioOpen}
        onClose={() => setIsCardStudioOpen(false)}
        initialTemplate="menu"
        initialData={{
          breakfastDish: activeDayData?.breakfast?.title || 'Weekly Breakfast Schedule',
          breakfastCategory: activeDayData?.breakfast?.category || 'Veg / Egg',
          lunchDish: activeDayData?.lunch?.title || 'Weekly Lunch Schedule',
          lunchCategory: activeDayData?.lunch?.category || 'Non-Veg / Veg',
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
