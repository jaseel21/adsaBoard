import React from 'react';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  CalendarDays,
  Clock,
  Layers,
  List,
  Coffee,
  Utensils,
} from 'lucide-react';
import { useFeedback } from '../../../utils/useFeedback';
import { useLanguage } from '../../../store/LanguageContext';

export default function CalendarViewFilterHub({
  activeView, // 'month' | 'grid' | 'week' | 'day' | 'year' | 'list'
  setActiveView,
  mealFilter,
  setMealFilter,
  showMealFilter = true,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const handleViewChange = (view) => {
    feedback('tick');
    setActiveView(view);
  };

  const handleMealChange = (filter) => {
    feedback('tick');
    setMealFilter(filter);
  };

  const isMonthlyOrGrid = activeView === 'month' || activeView === 'grid';

  const viewOptions = [
    { key: 'month', label: t('viewMonth', 'Month'), icon: LayoutGrid, title: 'Monthly Grid View (Default)' },
    { key: 'week', label: t('viewWeek', 'Week'), icon: CalendarDays, title: 'Weekly 7-Day View' },
    { key: 'day', label: t('viewDay', 'Day'), icon: Clock, title: 'Daily Deep Focus View' },
    { key: 'year', label: t('viewYear', 'Year'), icon: Layers, title: '12-Month Academic Year Horizon' },
    { key: 'list', label: t('viewList', 'List'), icon: List, title: 'Scheduled List View' },
  ];

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {/* 1. Meal Filter Tabs (Both | Breakfast | Lunch) - Available when in Month view */}
      {showMealFilter && isMonthlyOrGrid && (
        <div className="inline-flex p-0.5 rounded-xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 shadow-xs backdrop-blur-md">
          {/* Both Meals */}
          <button
            type="button"
            onClick={() => handleMealChange('both')}
            className={`relative px-2.5 py-1 text-xs font-black rounded-lg transition-colors select-none ${
              mealFilter === 'both'
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {mealFilter === 'both' && (
              <motion.div
                layoutId="activeMealPill"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className="absolute inset-0 bg-white dark:bg-[#1a2521] rounded-lg shadow-xs -z-10 border border-gray-200/60 dark:border-white/10"
              />
            )}
            <span className="hidden sm:inline">{t('viewBothParallel', 'Both Meals')}</span>
            <span className="sm:hidden">Both</span>
          </button>

          {/* Breakfast */}
          <button
            type="button"
            onClick={() => handleMealChange('breakfast')}
            className={`relative px-2.5 py-1 text-xs font-black rounded-lg transition-colors flex items-center gap-1 select-none ${
              mealFilter === 'breakfast'
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {mealFilter === 'breakfast' && (
              <motion.div
                layoutId="activeMealPill"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className="absolute inset-0 bg-white dark:bg-[#1a2521] rounded-lg shadow-xs -z-10 border border-emerald-500/30"
              />
            )}
            <Coffee className="w-3 h-3 text-teal-500" />
            <span className="hidden sm:inline">{t('navBreakfast', 'Breakfast')}</span>
            <span className="sm:hidden">Bf</span>
          </button>

          {/* Lunch */}
          <button
            type="button"
            onClick={() => handleMealChange('lunch')}
            className={`relative px-2.5 py-1 text-xs font-black rounded-lg transition-colors flex items-center gap-1 select-none ${
              mealFilter === 'lunch'
                ? 'text-emerald-700 dark:text-emerald-300'
                : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            {mealFilter === 'lunch' && (
              <motion.div
                layoutId="activeMealPill"
                transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                className="absolute inset-0 bg-white dark:bg-[#1a2521] rounded-lg shadow-xs -z-10 border border-emerald-500/30"
              />
            )}
            <Utensils className="w-3 h-3 text-emerald-500" />
            <span className="hidden sm:inline">{t('navLunch', 'Lunch')}</span>
            <span className="sm:hidden">Lu</span>
          </button>
        </div>
      )}

      {/* 2. Multi-View Switcher (Month, Week, Day, Year, List) */}
      <div className="inline-flex p-0.5 rounded-xl bg-gray-100/90 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 shadow-xs backdrop-blur-md">
        {viewOptions.map(({ key, label, icon: Icon, title }) => {
          const isActive = (key === 'month' && isMonthlyOrGrid) || activeView === key;

          return (
            <button
              key={key}
              type="button"
              onClick={() => handleViewChange(key)}
              className={`relative px-2 py-1 rounded-lg text-xs font-black transition-colors select-none flex items-center gap-1 ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-white'
              }`}
              title={title}
              aria-label={title}
            >
              {isActive && (
                <motion.div
                  layoutId="activeViewPill"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-white dark:bg-[#1a2521] rounded-lg shadow-xs -z-10 border border-gray-200/60 dark:border-white/10"
                />
              )}
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
