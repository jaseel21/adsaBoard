/**
 * Menu.jsx
 * Campus Canteen Food Menu & Schedule Component
 * 
 * Displays the live weekly breakfast & lunch schedule, daily special dish highlights,
 * date overrides, dietary matrix, and print/share studio for students, faculty, and visitors.
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
} from 'lucide-react';
import { AuthContext } from '../store/AuthContext';
import { DataOfOne } from '../store/StudentData';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { useWorldTime } from '../utils/time';
import {
  subscribeToWeeklyMenu,
  subscribeToDateOverrides,
  getEffectiveMenuForDate,
  DEFAULT_WEEKLY_MENU,
} from '../utils/menuService';
import {
  getTodayISTDate,
  addDaysToDate,
  formatFriendlyDate,
} from '../utils/studentExceptionService';
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
  const { user, userRole } = useContext(AuthContext);
  const { stdata } = useContext(DataOfOne);
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const { dayShort } = useWorldTime('Asia/Kolkata');

  const canManageMenu = hasRole(userRole, [
    ROLES.CANTEEN_COMMITTEE,
    ROLES.CENTRAL_COMMITTEE,
    ROLES.DEVELOPER,
  ]);

  const [weeklyMenu, setWeeklyMenu] = useState(DEFAULT_WEEKLY_MENU);
  const [overrides, setOverrides] = useState({});
  const [dayFilter, setDayFilter] = useState('all'); // 'all' | 'today' | 'tomorrow'
  const [isCardStudioOpen, setIsCardStudioOpen] = useState(false);

  useSEO({
    title: 'Campus Dining Menu & Specials',
    description:
      'Weekly meal schedules, special campus culinary rosters, and dietary avoiders manifest for Alathurpadi Dars canteen.',
    keywords:
      'canteen menu, alathurpadi dars food menu, dars weekly menu, dining schedule, breakfast menu, lunch menu',
    image: '/og-menu.png',
  });

  useEffect(() => {
    const unsubMenu = subscribeToWeeklyMenu((data) => {
      if (data) setWeeklyMenu(data);
    });
    const unsubOverrides = subscribeToDateOverrides((data) => {
      if (data) setOverrides(data);
    });
    return () => {
      unsubMenu();
      unsubOverrides();
    };
  }, []);

  const todayKey = (dayShort || 'su').toLowerCase();
  const todayIdx = DAY_KEYS.indexOf(todayKey) !== -1 ? DAY_KEYS.indexOf(todayKey) : 0;
  const tomorrowKey = DAY_KEYS[(todayIdx + 1) % 7];

  const todayDateStr = getTodayISTDate();
  const tomorrowDateStr = addDaysToDate(todayDateStr, 1);

  const todayEffective = useMemo(
    () => getEffectiveMenuForDate(todayDateStr, weeklyMenu, overrides),
    [todayDateStr, weeklyMenu, overrides]
  );
  const tomorrowEffective = useMemo(
    () => getEffectiveMenuForDate(tomorrowDateStr, weeklyMenu, overrides),
    [tomorrowDateStr, weeklyMenu, overrides]
  );

  const resolveSlot = useCallback((slotData, fallbackSlot) => {
    if (!slotData) return fallbackSlot;
    const hasContent = Boolean(slotData.title?.trim()) || (Array.isArray(slotData.items) && slotData.items.length > 0);
    if (!hasContent) return fallbackSlot;
    return {
      ...fallbackSlot,
      ...slotData,
      title: slotData.title?.trim() || fallbackSlot?.title || '',
      items: (slotData.items && slotData.items.length > 0) ? slotData.items : (fallbackSlot?.items || []),
    };
  }, []);

  const mergeWithDefault = useCallback((dayData, defDay) => {
    if (!dayData) return defDay;
    if (!defDay) return dayData;
    return {
      ...defDay,
      ...dayData,
      breakfast: resolveSlot(dayData.breakfast, defDay.breakfast),
      lunch: resolveSlot(dayData.lunch, defDay.lunch),
      evening: resolveSlot(dayData.evening, defDay.evening),
      dinner: resolveSlot(dayData.dinner, defDay.dinner),
    };
  }, [resolveSlot]);

  const getDayItem = useCallback(
    (k) => {
      const defDay = DEFAULT_WEEKLY_MENU[k] || {};
      if (dayFilter === 'today' || (k === todayKey && dayFilter === 'all')) {
        if (overrides[todayDateStr]) return { ...mergeWithDefault(todayEffective, defDay), hasFeastOverride: true };
      }
      if (dayFilter === 'tomorrow' || (k === tomorrowKey && dayFilter === 'all')) {
        if (overrides[tomorrowDateStr]) return { ...mergeWithDefault(tomorrowEffective, defDay), hasFeastOverride: true };
      }
      const raw = weeklyMenu[k] || defDay;
      return mergeWithDefault(raw, defDay);
    },
    [dayFilter, todayKey, overrides, todayDateStr, todayEffective, tomorrowKey, tomorrowDateStr, tomorrowEffective, weeklyMenu, mergeWithDefault]
  );

  const upcomingFeasts = useMemo(() => {
    const list = [];
    Object.entries(overrides).forEach(([dStr, ovr]) => {
      if (dStr >= todayDateStr) {
        list.push({ dateStr: dStr, ...ovr });
      }
    });
    list.sort((a, b) => a.dateStr.localeCompare(b.dateStr));
    return list.slice(0, 3);
  }, [overrides, todayDateStr]);

  const displayedKeys = DAY_KEYS.filter((k) => {
    if (dayFilter === 'today') return k === todayKey;
    if (dayFilter === 'tomorrow') return k === tomorrowKey;
    return true;
  });

  // Dynamically determine which meal columns are visible.
  const hasVisibleBreakfast = useMemo(() => {
    return displayedKeys.some((k) => {
      const it = getDayItem(k);
      return !it?.isArchived && !it?.isClosed && !it?.breakfast?.isArchived && it?.breakfast?.isAvailable !== false && it?.breakfast?.title;
    });
  }, [displayedKeys, getDayItem]);

  const hasVisibleLunch = useMemo(() => {
    return displayedKeys.some((k) => {
      const it = getDayItem(k);
      return !it?.isArchived && !it?.isClosed && !it?.lunch?.isArchived && it?.lunch?.isAvailable !== false && it?.lunch?.title;
    });
  }, [displayedKeys, getDayItem]);

  const hasVisibleEvening = useMemo(() => {
    return displayedKeys.some((k) => {
      const it = getDayItem(k);
      return !it?.isArchived && !it?.isClosed && !it?.evening?.isArchived && it?.evening?.isAvailable !== false && it?.evening?.title;
    });
  }, [displayedKeys, getDayItem]);

  const hasVisibleDinner = useMemo(() => {
    return displayedKeys.some((k) => {
      const it = getDayItem(k);
      return !it?.isArchived && !it?.isClosed && !it?.dinner?.isArchived && it?.dinner?.isAvailable !== false && it?.dinner?.title;
    });
  }, [displayedKeys, getDayItem]);

  const totalCols = 1 + (hasVisibleBreakfast ? 1 : 0) + (hasVisibleLunch ? 1 : 0) + (hasVisibleEvening ? 1 : 0) + (hasVisibleDinner ? 1 : 0);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="space-y-1">
          <h1 className="text-lg xs:text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
            <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
            <span>{t('navMenu') || 'Weekly Canteen Menu'}</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-600/30">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>{t('authenticatedMenu', 'Protected Schedule')}</span>
            </span>
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
            {t('weeklyCanteenSubtitle', 'Internal weekly meal schedule served at Alathurpadi Dars dining hall')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 self-stretch sm:self-auto justify-start sm:justify-end">
          {/* Admin shortcut button (strictly for authorized Committee/Staff) */}
          {canManageMenu && (
            <button
              onClick={() => {
                feedback('tick');
                navigate('/admin/menu');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('menuManagement') || 'Manage Menu'}</span>
            </button>
          )}

          {/* Student shortcut to return to their personal portal */}
          {stdata?.tokenNo && (
            <button
              onClick={() => {
                feedback('tick');
                navigate('/student');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-500/30 font-bold text-xs shadow-xs transition-all active:scale-95"
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
            title="Generate & share dynamic visual menu card"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('shareMenuCard', 'Share Menu Card')}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{t('print', 'Print')}</span>
          </button>

          <button
            onClick={() => {
              feedback('tick');
              if (stdata?.tokenNo) {
                navigate('/student');
              } else {
                navigate('/');
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{stdata?.tokenNo ? (t('backToPortal', 'Back to Portal')) : (t('backToHome', 'Back to Home'))}</span>
          </button>
        </div>
      </div>

      {/* Upcoming Special Feasts Alert Banner */}
      {upcomingFeasts.length > 0 && (
        <div className="p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-200/80 dark:border-purple-800/40 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-sm shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                  Upcoming Special Feasts & Custom Dining Days
                </h4>
                <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-black uppercase">
                  {upcomingFeasts.length} Scheduled
                </span>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-purple-700 dark:text-purple-300 font-medium mt-0.5">
                {upcomingFeasts.map((f) => (
                  <span key={f.dateStr} className="inline-flex items-center gap-1">
                    • <strong>{formatFriendlyDate(f.dateStr, true)}:</strong> {f.occasion}
                  </span>
                ))}
              </div>
            </div>
          </div>
          {canManageMenu && (
            <button
              onClick={() => navigate('/admin/menu')}
              className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 font-bold text-xs hover:bg-purple-200 transition-colors self-start sm:self-auto shrink-0"
            >
              View in Calendar
            </button>
          )}
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-3 p-2 rounded-2xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100/80 dark:bg-white/5 text-xs font-semibold">
          <button
            onClick={() => {
              feedback('tick');
              setDayFilter('all');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              dayFilter === 'all'
                ? 'bg-white dark:bg-[#192420] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('allSevenDays') || 'All 7 Days'}
          </button>

          <button
            onClick={() => {
              feedback('tick');
              setDayFilter('today');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              dayFilter === 'today'
                ? 'bg-white dark:bg-[#192420] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('todaysMeals') || 'Today Only'}
          </button>

          <button
            onClick={() => {
              feedback('tick');
              setDayFilter('tomorrow');
            }}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              dayFilter === 'tomorrow'
                ? 'bg-white dark:bg-[#192420] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('tomorrowsMeals') || 'Tomorrow Only'}
          </button>
        </div>

        <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:block pr-2">
          🕒 {t('syncedWithIST', 'Synced with IST Serving Hours')}
        </span>
      </div>

      {/* Mobile Card Grid (sm:hidden) */}
      <div className="block sm:hidden space-y-3">
        {displayedKeys.map((key) => {
          const item = getDayItem(key);
          const isToday = todayKey === key;
          const isTomorrow = tomorrowKey === key;
          const isArchived = Boolean(item.isArchived || item.isClosed);

          return (
            <div
              key={key}
              className={`p-4 rounded-3xl border transition-all ${
                isArchived
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-dashed border-amber-300 dark:border-amber-700/50'
                  : item.hasFeastOverride
                  ? 'bg-gradient-to-br from-purple-50 to-indigo-50/70 dark:from-purple-950/30 dark:to-indigo-950/20 border-purple-300 dark:border-purple-600/40 shadow-sm'
                  : isToday
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/40 shadow-sm'
                  : 'bg-white/90 dark:bg-[#0f1715]/90 border-gray-200/80 dark:border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  {t(`daysFull.${key}`) || item.dayName}
                </span>

                <div className="flex items-center gap-1 flex-wrap justify-end">
                  {item.hasFeastOverride && item.occasion && !isArchived && (
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
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
                          {t('today', 'Today')}
                        </span>
                      )}
                      {isTomorrow && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                          {t('tomorrow', 'Tomorrow')}
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {isArchived ? (
                <div className="p-3 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs">
                  ℹ️ <strong>{t('canteenClosed', 'Canteen Closed')}:</strong> {item.closureReason || item.archiveReason || t('routineOffDay', 'Routine Off Day')}
                </div>
              ) : (
                <>
                  {item.note && (
                    <p className="text-[11px] text-amber-700 dark:text-amber-400 mb-2 italic">
                      ℹ️ {item.note}
                    </p>
                  )}

                  <div className="space-y-2 text-xs">
                    {/* Breakfast: Rendered ONLY if not archived */}
                    {!item.breakfast?.isArchived && item.breakfast?.isAvailable !== false && (
                      <div className="p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-[11px] text-amber-800 dark:text-amber-400 flex items-center gap-1">
                            ☕ {t('breakfast', 'Breakfast')}
                          </span>
                          {item.breakfast?.timing && (
                            <span className="text-[10px] text-gray-400 font-mono">{item.breakfast.timing}</span>
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

                    {/* Lunch: Rendered ONLY if not archived */}
                    {!item.lunch?.isArchived && item.lunch?.isAvailable !== false && (
                      <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-[11px] text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                            🍲 {t('lunch', 'Lunch')}
                          </span>
                          {item.lunch?.timing && (
                            <span className="text-[10px] text-gray-400 font-mono">{item.lunch.timing}</span>
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

                    {/* Evening: Rendered ONLY if not archived */}
                    {!item.evening?.isArchived && item.evening?.isAvailable !== false && (
                      <div className="p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/50 dark:border-blue-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-[11px] text-blue-800 dark:text-blue-400 flex items-center gap-1">
                            🫖 {t('eveningTea', 'Evening Tea')}
                          </span>
                          {item.evening?.timing && (
                            <span className="text-[10px] text-gray-400 font-mono">{item.evening.timing}</span>
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

                    {/* Dinner: Rendered ONLY if not archived and available */}
                    {!item.dinner?.isArchived && item.dinner?.isAvailable !== false && (
                      <div className="p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-500/20">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-extrabold text-[11px] text-purple-800 dark:text-purple-400 flex items-center gap-1">
                            🌙 {t('dinner', 'Dinner')}
                          </span>
                          {item.dinner?.timing && (
                            <span className="text-[10px] text-gray-400 font-mono">{item.dinner.timing}</span>
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
                <th className="py-4 px-5 font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider w-36">
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
              {displayedKeys.map((key) => {
                const item = getDayItem(key);
                const isToday = todayKey === key;
                const isArchived = Boolean(item.isArchived || item.isClosed);

                if (isArchived) {
                  return (
                    <tr key={key} className="bg-amber-50/40 dark:bg-amber-950/10">
                      <td className="py-4 px-5 font-bold text-amber-700 dark:text-amber-400">
                        {t(`daysFull.${key}`) || item.dayName}
                        <span className="block text-[10px] text-amber-600 font-normal">{t('offDay', 'Off-Day')}</span>
                      </td>
                      <td colSpan={totalCols - 1} className="py-4 px-5 text-amber-800 dark:text-amber-300 italic text-xs">
                        🔒 {t('canteenClosed', 'Canteen Closed')} — {item.closureReason || item.archiveReason || t('canteenClosedRoutineNotice', 'Routine Off Day. No dining hall supply.')}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={key}
                    className={`transition-colors ${
                      item.hasFeastOverride
                        ? 'bg-purple-50/40 dark:bg-purple-950/20'
                        : isToday
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 font-semibold'
                        : 'hover:bg-gray-50/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <td className="py-4 px-5 align-top">
                      <div className="flex items-center gap-1.5 flex-wrap font-bold text-emerald-600 dark:text-emerald-400">
                        <span>{t(`daysFull.${key}`) || item.dayName}</span>
                        {item.hasFeastOverride && item.occasion && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-purple-500" />
                            <span>{item.occasion}</span>
                          </span>
                        )}
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-white">
                            {t('today', 'Today')}
                          </span>
                        )}
                      </div>
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
                                  {item.lunch.category === 'Veg' ? (t('catVeg') || 'Veg') : item.lunch.category === 'Non-Veg' ? (t('catNonVeg') || 'Non-Veg') : item.lunch.category === 'Egg' ? (t('catEgg') || 'Egg') : item.lunch.category === 'Special' ? (t('catSpecial') || 'Special') : item.lunch.category}
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

      {/* Dynamic Menu Social Card Studio */}
      <SocialCardStudioModal
        isOpen={isCardStudioOpen}
        onClose={() => setIsCardStudioOpen(false)}
        initialTemplate="menu"
        initialData={{
          breakfastDish: todayEffective?.breakfast?.title || 'Weekly Breakfast Schedule',
          breakfastCategory: todayEffective?.breakfast?.category || 'Veg / Egg',
          lunchDish: todayEffective?.lunch?.title || 'Weekly Lunch Schedule',
          lunchCategory: todayEffective?.lunch?.category || 'Non-Veg / Veg',
          dateStr: formatFriendlyDate(todayDateStr),
          customUrl: 'https://canteen.alathurpadidars.in/menu',
          description: `Today's Menu: ${todayEffective?.breakfast?.title || 'Breakfast'} • ${todayEffective?.lunch?.title || 'Lunch'}`,
        }}
      />
    </div>
  );
};

export default MenuTable;
