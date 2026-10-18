import React, { useState, useEffect, useContext, useMemo } from 'react';
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
} from 'lucide-react';
import { AuthContext } from '../store/AuthContext';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { useWorldTime } from '../utils/time';
import { subscribeToWeeklyMenu, DEFAULT_WEEKLY_MENU } from '../utils/menuService';

const DAY_KEYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

const CATEGORY_STYLES = {
  Veg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
  'Non-Veg': 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700/60',
  Egg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
  Special: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-700/60',
};

const MenuTable = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const { dayShort } = useWorldTime('Asia/Kolkata');

  const [weeklyMenu, setWeeklyMenu] = useState(DEFAULT_WEEKLY_MENU);
  const [dayFilter, setDayFilter] = useState('all'); // 'all' | 'today' | 'tomorrow'

  useEffect(() => {
    const unsubscribe = subscribeToWeeklyMenu((data) => {
      if (data) setWeeklyMenu(data);
    });
    return () => unsubscribe();
  }, []);

  const todayKey = (dayShort || 'su').toLowerCase();
  const todayIdx = DAY_KEYS.indexOf(todayKey) !== -1 ? DAY_KEYS.indexOf(todayKey) : 0;
  const tomorrowKey = DAY_KEYS[(todayIdx + 1) % 7];

  const displayedKeys = DAY_KEYS.filter((k) => {
    if (dayFilter === 'today') return k === todayKey;
    if (dayFilter === 'tomorrow') return k === tomorrowKey;
    return true;
  });

  // Dynamically determine which meal columns are visible.
  // If a meal slot is archived/hidden across all displayed days, hide that column completely!
  const hasVisibleBreakfast = useMemo(() => {
    return displayedKeys.some(
      (k) => !weeklyMenu[k]?.isArchived && !weeklyMenu[k]?.breakfast?.isArchived && weeklyMenu[k]?.breakfast?.isAvailable !== false
    );
  }, [displayedKeys, weeklyMenu]);

  const hasVisibleLunch = useMemo(() => {
    return displayedKeys.some(
      (k) => !weeklyMenu[k]?.isArchived && !weeklyMenu[k]?.lunch?.isArchived && weeklyMenu[k]?.lunch?.isAvailable !== false
    );
  }, [displayedKeys, weeklyMenu]);

  const hasVisibleEvening = useMemo(() => {
    return displayedKeys.some(
      (k) => !weeklyMenu[k]?.isArchived && !weeklyMenu[k]?.evening?.isArchived && weeklyMenu[k]?.evening?.isAvailable !== false
    );
  }, [displayedKeys, weeklyMenu]);

  const hasVisibleDinner = useMemo(() => {
    return displayedKeys.some(
      (k) => !weeklyMenu[k]?.isArchived && !weeklyMenu[k]?.dinner?.isArchived && weeklyMenu[k]?.dinner?.isAvailable !== false
    );
  }, [displayedKeys, weeklyMenu]);

  const totalCols = 1 + (hasVisibleBreakfast ? 1 : 0) + (hasVisibleLunch ? 1 : 0) + (hasVisibleEvening ? 1 : 0) + (hasVisibleDinner ? 1 : 0);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* Top Header Card */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-500" />
            <span>{t('navMenu') || 'Weekly Canteen Menu'}</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-600/30">
              Live Schedule
            </span>
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Weekly meal schedule served at Alathurpadi Dars dining hall
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
          {/* Admin shortcut button (visible to Committee, or routes to Login if public) */}
          <button
            onClick={() => {
              feedback('tick');
              navigate(user ? '/admin/menu' : '/alogin', {
                state: { from: '/admin/menu', notice: 'Please sign in with committee credentials to modify the weekly menu.' },
              });
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{user ? (t('menuManagement') || 'Manage Menu') : 'Committee Edit'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          <button
            onClick={() => {
              feedback('tick');
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Board</span>
          </button>
        </div>
      </div>

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
          🕒 Synced with IST Serving Hours
        </span>
      </div>

      {/* Mobile Card Grid (sm:hidden) */}
      <div className="block sm:hidden space-y-3">
        {displayedKeys.map((key) => {
          const item = weeklyMenu[key] || DEFAULT_WEEKLY_MENU[key];
          const isToday = todayKey === key;
          const isTomorrow = tomorrowKey === key;
          const isArchived = Boolean(item.isArchived);

          return (
            <div
              key={key}
              className={`p-4 rounded-3xl border transition-all ${
                isArchived
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-dashed border-amber-300 dark:border-amber-700/50'
                  : isToday
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-400 dark:border-emerald-500/40 shadow-sm'
                  : 'bg-white/90 dark:bg-[#0f1715]/90 border-gray-200/80 dark:border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="font-extrabold text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-emerald-500" />
                  {item.dayName}
                </span>

                <div className="flex items-center gap-1">
                  {isArchived ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                      Canteen Closed
                    </span>
                  ) : (
                    <>
                      {isToday && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white animate-pulse">
                          Today
                        </span>
                      )}
                      {isTomorrow && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                          Tomorrow
                        </span>
                      )}
                    </>
                  )}
                </div>
              </div>

              {isArchived ? (
                <div className="p-3 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs">
                  ℹ️ <strong>Canteen Closed:</strong> {item.archiveReason || 'Routine Off Day'}
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
                            ☕ Breakfast
                          </span>
                          {item.breakfast?.timing && (
                            <span className="text-[10px] text-gray-400 font-mono">{item.breakfast.timing}</span>
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-white font-bold block">
                          {item.breakfast?.title || 'No dish set'}
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
                            🍲 Lunch
                          </span>
                          {item.lunch?.timing && (
                            <span className="text-[10px] text-gray-400 font-mono">{item.lunch.timing}</span>
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-white font-bold block">
                          {item.lunch?.title || 'No dish set'}
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
                            🫖 Evening Tea
                          </span>
                          {item.evening?.timing && (
                            <span className="text-[10px] text-gray-400 font-mono">{item.evening.timing}</span>
                          )}
                        </div>
                        <span className="text-gray-800 dark:text-gray-200 font-bold block">
                          {item.evening?.title || 'No dish set'}
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
                            🌙 Dinner
                          </span>
                          {item.dinner?.timing && (
                            <span className="text-[10px] text-gray-400 font-mono">{item.dinner.timing}</span>
                          )}
                        </div>
                        <span className="text-gray-800 dark:text-gray-200 font-bold block">
                          {item.dinner?.title || 'No dish set'}
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
                  Day
                </th>
                {hasVisibleBreakfast && (
                  <th className="py-4 px-5 font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                    ☕ Breakfast
                  </th>
                )}
                {hasVisibleLunch && (
                  <th className="py-4 px-5 font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                    🍲 Lunch
                  </th>
                )}
                {hasVisibleEvening && (
                  <th className="py-4 px-5 font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                    🫖 Evening Tea
                  </th>
                )}
                {hasVisibleDinner && (
                  <th className="py-4 px-5 font-bold text-purple-700 dark:text-purple-400 uppercase tracking-wider">
                    🌙 Dinner
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-medium text-gray-800 dark:text-gray-200">
              {displayedKeys.map((key) => {
                const item = weeklyMenu[key] || DEFAULT_WEEKLY_MENU[key];
                const isToday = todayKey === key;
                const isArchived = Boolean(item.isArchived);

                if (isArchived) {
                  return (
                    <tr key={key} className="bg-amber-50/40 dark:bg-amber-950/10">
                      <td className="py-4 px-5 font-bold text-amber-700 dark:text-amber-400">
                        {item.dayName}
                        <span className="block text-[10px] text-amber-600 font-normal">Off-Day</span>
                      </td>
                      <td colSpan={totalCols - 1} className="py-4 px-5 text-amber-800 dark:text-amber-300 italic text-xs">
                        🔒 Canteen Closed — {item.archiveReason || 'Routine Off Day. No dining hall supply.'}
                      </td>
                    </tr>
                  );
                }

                return (
                  <tr
                    key={key}
                    className={`transition-colors ${
                      isToday
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20 font-semibold'
                        : 'hover:bg-gray-50/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <td className="py-4 px-5 align-top">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                        <span>{item.dayName}</span>
                        {isToday && (
                          <span className="px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase bg-emerald-500 text-white">
                            Today
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
                                  {item.lunch.category}
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
  );
};

export default MenuTable;
