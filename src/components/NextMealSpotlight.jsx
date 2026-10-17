import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  Sparkles,
  Clock,
  ArrowRight,
  Calendar,
  ChefHat,
  CheckCircle,
  AlertCircle,
  UtensilsCrossed,
} from 'lucide-react';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { useWorldTime } from '../utils/time';
import {
  subscribeToWeeklyMenu,
  determineActiveMealSlot,
  DEFAULT_WEEKLY_MENU,
} from '../utils/menuService';

const DAYS_ORDER = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

const CATEGORY_TAGS = {
  Veg: { label: 'Veg', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60' },
  'Non-Veg': { label: 'Non-Veg', badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700/60' },
  Egg: { label: 'Egg', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/60' },
  Special: { label: 'Special Feast', badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-700/60' },
};

/**
 * Returns true only if the slot is active and actually has a dish defined (not empty)
 */
const hasDishContent = (slotData) => {
  if (!slotData) return false;
  if (slotData.isArchived) return false;
  if (slotData.isAvailable === false) return false;
  const hasTitle = Boolean(slotData.title && slotData.title.trim() !== '');
  const hasItems = Array.isArray(slotData.items) && slotData.items.some((it) => it && it.trim() !== '');
  return hasTitle || hasItems;
};

export default function NextMealSpotlight({ documents = [], lunchOrdersCount = 0, breakfastOrdersCount = 0 }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const { timeHms, dayShort } = useWorldTime('Asia/Kolkata');

  const [weeklyMenu, setWeeklyMenu] = useState(DEFAULT_WEEKLY_MENU);
  const [activeTab, setActiveTab] = useState('auto'); // 'today' | 'tomorrow' | 'auto'

  useEffect(() => {
    const unsubscribe = subscribeToWeeklyMenu((data) => {
      if (data) setWeeklyMenu(data);
    });
    return () => unsubscribe();
  }, []);

  // Determine current day and tomorrow's day
  const { todayKey, tomorrowKey, isPostCutoff } = useMemo(() => {
    const current = (dayShort || 'fr').toLowerCase();
    const currIdx = DAYS_ORDER.indexOf(current) !== -1 ? DAYS_ORDER.indexOf(current) : 5;
    const nextIdx = (currIdx + 1) % 7;
    const postCutoff = timeHms && timeHms > '18:00:00';
    return {
      todayKey: current,
      tomorrowKey: DAYS_ORDER[nextIdx],
      isPostCutoff: postCutoff,
    };
  }, [dayShort, timeHms]);

  const todayDayData = weeklyMenu[todayKey];
  const tomorrowDayData = weeklyMenu[tomorrowKey];
  const activeSlotMeta = useMemo(() => determineActiveMealSlot(timeHms, todayDayData), [timeHms, todayDayData]);

  // Which day to show based on tab
  const displayedDayKey = useMemo(() => {
    if (activeTab === 'today') return todayKey;
    if (activeTab === 'tomorrow') return tomorrowKey;
    // If today is closed/archived or after 18:00 cutoff -> default to tomorrow
    if (todayDayData?.isArchived || isPostCutoff) return tomorrowKey;
    return todayKey;
  }, [activeTab, isPostCutoff, todayKey, tomorrowKey, todayDayData]);

  const displayedDayData = weeklyMenu[displayedDayKey] || DEFAULT_WEEKLY_MENU[displayedDayKey];
  const isDayArchived = Boolean(displayedDayData?.isArchived);

  // Compute accurate day-specific token counts for displayed day (Today vs Tomorrow)
  const { displayedBreakfastCount, displayedLunchCount } = useMemo(() => {
    let b = 0;
    let l = 0;
    if (Array.isArray(documents) && documents.length > 0 && displayedDayKey) {
      documents.forEach((doc) => {
        if (!doc.block) {
          if (doc.obj?.breakfast?.[displayedDayKey]) b++;
          if (doc.obj?.lunch?.[displayedDayKey]) l++;
        }
      });
      return { displayedBreakfastCount: b, displayedLunchCount: l };
    }
    // Fallback if documents array isn't populated yet
    return {
      displayedBreakfastCount: breakfastOrdersCount || 0,
      displayedLunchCount: lunchOrdersCount || 0,
    };
  }, [documents, displayedDayKey, breakfastOrdersCount, lunchOrdersCount]);

  // Identify the spotlighted meal for the displayed day. Returns NULL if all slots are empty or archived.
  const spotlightMeal = useMemo(() => {
    if (!displayedDayData || isDayArchived) return null;

    const baseOrder = ['breakfast', 'lunch', 'evening', 'dinner'];

    if (displayedDayKey === todayKey) {
      const candidate = activeSlotMeta.slot || 'breakfast';

      // 1. Check if candidate slot has real dish content
      if (hasDishContent(displayedDayData[candidate])) {
        const slotData = displayedDayData[candidate];
        return {
          slotKey: candidate,
          title: slotData.title || (slotData.items?.[0] || ''),
          items: slotData.items || [],
          category: slotData.category || '',
          timing: slotData.timing || '',
          specialTag: slotData.specialTag || '',
          statusLabel: activeSlotMeta.statusLabel,
        };
      }

      // 2. Search forward for upcoming slots today with content
      const startIdx = baseOrder.indexOf(candidate);
      for (let i = startIdx; i < baseOrder.length; i++) {
        const s = baseOrder[i];
        if (hasDishContent(displayedDayData[s])) {
          const slotData = displayedDayData[s];
          let label = activeSlotMeta.statusLabel;
          if (s === 'lunch') label = 'Lunch Time';
          if (s === 'evening') label = 'Evening Refreshment';
          if (s === 'dinner') label = 'Dinner / Supper';
          return {
            slotKey: s,
            title: slotData.title || (slotData.items?.[0] || ''),
            items: slotData.items || [],
            category: slotData.category || '',
            timing: slotData.timing || '',
            specialTag: slotData.specialTag || '',
            statusLabel: label,
          };
        }
      }

      // 3. Fallback to any earlier slot today with content
      for (let i = 0; i < startIdx; i++) {
        const s = baseOrder[i];
        if (hasDishContent(displayedDayData[s])) {
          const slotData = displayedDayData[s];
          return {
            slotKey: s,
            title: slotData.title || (slotData.items?.[0] || ''),
            items: slotData.items || [],
            category: slotData.category || '',
            timing: slotData.timing || '',
            specialTag: slotData.specialTag || '',
            statusLabel: 'Today’s Meal',
          };
        }
      }

      // If absolutely no slots today have dish content, spotlight is null
      return null;
    } else {
      // Tomorrow highlight: search in priority order for any slot with content
      const preferenceOrder = ['lunch', 'breakfast', 'evening', 'dinner'];
      for (const s of preferenceOrder) {
        if (hasDishContent(displayedDayData[s])) {
          const slotData = displayedDayData[s];
          return {
            slotKey: s,
            title: slotData.title || (slotData.items?.[0] || ''),
            items: slotData.items || [],
            category: slotData.category || '',
            timing: slotData.timing || '',
            specialTag: slotData.specialTag || '',
            statusLabel: "Tomorrow's Highlight",
          };
        }
      }

      // Tomorrow is empty or has no dish content
      return null;
    }
  }, [displayedDayData, displayedDayKey, todayKey, activeSlotMeta, isDayArchived]);

  // Filter out any slots that are ARCHIVED or UNAVAILABLE - completely hide them from radar!
  const activeSlots = useMemo(() => {
    if (!displayedDayData || isDayArchived) return [];
    const allSlots = [
      {
        key: 'breakfast',
        label: t('mealBreakfast') || 'Breakfast',
        icon: Coffee,
        iconColor: 'text-amber-600 dark:text-amber-400',
        badgeBg: 'bg-amber-100/80 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/40',
        data: displayedDayData.breakfast,
        count: displayedBreakfastCount,
        hasToken: true,
      },
      {
        key: 'lunch',
        label: t('mealLunch') || 'Lunch',
        icon: Utensils,
        iconColor: 'text-emerald-600 dark:text-emerald-400',
        badgeBg: 'bg-emerald-100/80 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/40',
        data: displayedDayData.lunch,
        count: displayedLunchCount,
        hasToken: true,
      },
      {
        key: 'evening',
        label: t('mealEvening') || 'Evening Tea',
        icon: Coffee,
        iconColor: 'text-blue-600 dark:text-blue-400',
        badgeBg: '',
        data: displayedDayData.evening,
        count: 0,
        hasToken: false,
      },
      {
        key: 'dinner',
        label: t('mealDinner') || 'Dinner',
        icon: Utensils,
        iconColor: 'text-purple-600 dark:text-purple-400',
        badgeBg: '',
        data: displayedDayData.dinner,
        count: 0,
        hasToken: false,
      },
    ];

    // Strictly remove any slot that is archived or unavailable!
    return allSlots.filter(
      (slot) => slot.data && !slot.data.isArchived && slot.data.isAvailable !== false
    );
  }, [displayedDayData, isDayArchived, displayedBreakfastCount, displayedLunchCount, t]);

  const isShowingTomorrow = displayedDayKey === tomorrowKey;

  return (
    <div className="relative overflow-hidden p-5 sm:p-6 rounded-3xl bg-white/85 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl transition-all duration-300">
      
      {/* Decorative ambient gradient */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-gradient-to-br from-emerald-500/10 via-amber-500/10 to-transparent rounded-full blur-2xl pointer-events-none" />

      {/* Header Bar */}
      <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/30">
            <ChefHat className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white tracking-tight">
                {t('nextMealSpotlight') || 'Canteen Meal Radar'}
              </h2>
              {isPostCutoff && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
                  {t('nextDaySupply') || 'Next Day Active'}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {isShowingTomorrow
                ? `Previewing tomorrow's dining schedule (${displayedDayData?.dayName || 'Tomorrow'})`
                : `Live meal schedule for today (${displayedDayData?.dayName || 'Today'})`}
            </p>
          </div>
        </div>

        {/* Today vs Tomorrow Switcher Pill */}
        <div className="flex items-center p-1 rounded-2xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 self-stretch sm:self-auto">
          <button
            onClick={() => {
              feedback('tick');
              setActiveTab('today');
            }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              !isShowingTomorrow
                ? 'bg-white dark:bg-[#192420] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('todaysMeals') || "Today's Menu"}
            {todayDayData?.isArchived && ' (Closed)'}
          </button>

          <button
            onClick={() => {
              feedback('tick');
              setActiveTab('tomorrow');
            }}
            className={`flex-1 sm:flex-none px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isShowingTomorrow
                ? 'bg-white dark:bg-[#192420] text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {t('tomorrowsMeals') || "Tomorrow's Menu"}
            {tomorrowDayData?.isArchived && ' (Closed)'}
          </button>
        </div>
      </div>

      {/* If Displayed Day is Closed / Routine Off: Render Clean Notice Banner */}
      {isDayArchived ? (
        <div className="relative z-10 p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-700/50 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <UtensilsCrossed className="w-5 h-5 text-amber-500" />
              <h3 className="font-extrabold text-base text-amber-900 dark:text-amber-200">
                {displayedDayData.dayName} — Canteen Closed
              </h3>
            </div>
            <p className="text-xs text-amber-800 dark:text-amber-300">
              {displayedDayData.archiveReason || 'Canteen routine off. No meals scheduled for this day.'}
            </p>
          </div>

          {!isShowingTomorrow && (
            <button
              onClick={() => {
                feedback('tick');
                setActiveTab('tomorrow');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors"
            >
              View Tomorrow's Meals →
            </button>
          )}
        </div>
      ) : spotlightMeal ? (
        /* Main Spotlight Banner (Rendered ONLY when there is actual dish content) */
        <div className="relative z-10 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-green-50/60 dark:from-emerald-950/30 dark:via-[#121f1c]/40 dark:to-emerald-950/20 border border-emerald-300/60 dark:border-emerald-500/20 shadow-xs mb-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500 text-white shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  <span>{spotlightMeal.statusLabel}</span>
                </span>

                {/* Only render category badge if category actually exists */}
                {spotlightMeal.category && (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      CATEGORY_TAGS[spotlightMeal.category]?.badgeClass || CATEGORY_TAGS.Veg.badgeClass
                    }`}
                  >
                    {spotlightMeal.category}
                  </span>
                )}

                {spotlightMeal.specialTag && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    {spotlightMeal.specialTag}
                  </span>
                )}
              </div>

              {/* Real title only - never fallback to 'todaysSpecial' */}
              <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
                {spotlightMeal.title}
              </h3>

              {spotlightMeal.items.length > 0 && (
                <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                  {spotlightMeal.items.join(' • ')}
                </p>
              )}
            </div>

            {/* Timing & Headcount Meta */}
            <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-1.5 pt-2 md:pt-0 border-t md:border-t-0 border-emerald-200/50 dark:border-white/5">
              {spotlightMeal.timing && (
                <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-gray-300">
                  <Clock className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{spotlightMeal.timing}</span>
                </div>
              )}

              {/* Exact Meal-Specific Headcount */}
              {spotlightMeal.slotKey === 'lunch' && (
                <span className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-black/30 border border-emerald-200 dark:border-emerald-500/20 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                  🍲 {displayedLunchCount} booked orders for Lunch
                </span>
              )}

              {spotlightMeal.slotKey === 'breakfast' && (
                <span className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-black/30 border border-amber-200 dark:border-amber-500/20 text-[11px] font-bold text-amber-700 dark:text-amber-400">
                  ☕ {displayedBreakfastCount} booked orders for Breakfast
                </span>
              )}

              {(spotlightMeal.slotKey === 'evening' || spotlightMeal.slotKey === 'dinner') && (
                <span className="px-2.5 py-1 rounded-xl bg-white/80 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-[11px] font-medium text-gray-600 dark:text-gray-400">
                  ✨ Open Dining (No Token Required)
                </span>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Banner: Rendered cleanly when menu has no active dishes set */
        <div className="relative z-10 p-5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-dashed border-gray-300 dark:border-white/10 mb-4 text-center">
          <div className="w-10 h-10 mx-auto mb-2 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500">
            <UtensilsCrossed className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
            {isShowingTomorrow
              ? `No meals scheduled yet for tomorrow (${displayedDayData?.dayName || 'Tomorrow'})`
              : `No meals scheduled yet for today (${displayedDayData?.dayName || 'Today'})`}
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            Menu is currently empty. Dishes will appear once updated by Canteen Management.
          </p>
        </div>
      )}

      {/* Day Overview Strip: Render ONLY ACTIVE slots (Archived slots are completely removed!) */}
      {!isDayArchived && activeSlots.length > 0 && (
        <div
          className={`relative z-10 grid gap-2.5 ${
            activeSlots.length === 1
              ? 'grid-cols-1'
              : activeSlots.length === 2
              ? 'grid-cols-1 sm:grid-cols-2'
              : activeSlots.length === 3
              ? 'grid-cols-1 sm:grid-cols-3'
              : 'grid-cols-2 sm:grid-cols-4'
          }`}
        >
          {activeSlots.map((slot) => {
            const Icon = slot.icon;
            const slotData = slot.data;
            const hasContent = hasDishContent(slotData);

            return (
              <div
                key={slot.key}
                className="p-3 rounded-2xl border bg-gray-50/80 dark:bg-white/[0.03] border-gray-200/70 dark:border-white/5 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider flex items-center gap-1 ${slot.iconColor}`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{slot.label}</span>
                  </span>
                  {slotData.timing && (
                    <span className="text-[10px] text-gray-400 font-mono">
                      {slotData.timing}
                    </span>
                  )}
                </div>

                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {slotData.title || (hasContent ? slotData.items?.[0] : 'No dish set')}
                </p>

                {slotData.items?.length > 0 && (
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate block">
                    {slotData.items.join(' • ')}
                  </span>
                )}

                <div className="pt-1">
                  {slot.hasToken ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${slot.badgeBg}`}
                    >
                      {slot.key === 'breakfast' ? '☕' : '🍲'} {slot.count} Booked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-medium bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200/60 dark:border-white/5">
                      Open (No token)
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer link to Weekly Schedule */}
      <div className="relative z-10 mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-xs">
        <span className="text-[11px] text-gray-500 dark:text-gray-400">
          📍 Alathurpadi Dars Dining Hall
        </span>

        <button
          onClick={() => {
            feedback('tick');
            navigate('/menu');
          }}
          className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          <span>{t('viewFullWeeklyMenu') || 'View Full 7-Day Menu'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
