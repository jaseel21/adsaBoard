import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Sparkles,
  Utensils,
  Coffee,
  Layers,
  Filter,
  Check,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

export default function TimeMachineRibbon({
  timeSpan = 'today',
  setTimeSpan,
  meal = 'lunch',
  setMeal,
  batchFilter = 'all',
  setBatchFilter,
  allBatches = [],
  targetDateIST,
  onResetToToday,
  isLive = true,
  serverTimeHms = '',
}) {
  const { t } = useLanguage();

  const handleSpanChange = (span) => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setTimeSpan(span);
  };

  const handleMealChange = (newMeal) => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setMeal(newMeal);
  };

  const timeSpans = [
    { id: 'today', label: t('today', 'Today') },
    { id: 'tomorrow', label: t('tomorrow', 'Tomorrow') },
    { id: '7d', label: '7 Days' },
    { id: '30d', label: '30 Days' },
  ];

  return (
    <div className="w-full glass-panel rounded-2xl p-3 md:p-4 shadow-glass dark:shadow-glass-dark border border-gray-200/70 dark:border-white/10 mb-6 transition-all">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        
        {/* Left Side: Time Horizon Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{isLive ? 'LIVE IST' : 'ARCHIVE'}</span>
            {serverTimeHms && (
              <span className="font-mono opacity-80 pl-1 border-l border-emerald-500/30">
                {serverTimeHms}
              </span>
            )}
          </div>

          <div className="flex items-center p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5">
            {timeSpans.map((span) => {
              const active = timeSpan === span.id;
              return (
                <button
                  key={span.id}
                  onClick={() => handleSpanChange(span.id)}
                  className={`relative px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                    active
                      ? 'text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="activeTimePill"
                      className="absolute inset-0 bg-emerald-600 dark:bg-emerald-500 rounded-lg shadow-sm"
                      transition={{ type: 'spring', bounce: 0.2, duration: 0.35 }}
                    />
                  )}
                  <span className="relative z-10">{span.label}</span>
                </button>
              );
            })}
          </div>

          {timeSpan !== 'today' && (
            <button
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                if (onResetToToday) onResetToToday();
              }}
              className="p-1.5 text-xs text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center gap-1"
              title="Reset to Today"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>

        {/* Right Side: Meal Selector & Batch Dropdown */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Meal Switcher */}
          <div className="flex items-center p-1 bg-gray-100 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/5">
            <button
              onClick={() => handleMealChange('breakfast')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                meal === 'breakfast'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>{t('breakfast', 'Breakfast')}</span>
            </button>

            <button
              onClick={() => handleMealChange('lunch')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                meal === 'lunch'
                  ? 'bg-emerald-600 dark:bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>{t('lunch', 'Lunch')}</span>
            </button>

            <button
              onClick={() => handleMealChange('both')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                meal === 'both'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Combined</span>
            </button>
          </div>

          {/* Academic Batch Filter */}
          <div className="relative">
            <select
              value={batchFilter}
              onChange={(e) => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                setBatchFilter(e.target.value);
              }}
              className="appearance-none bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl px-3.5 py-1.5 pr-8 text-xs font-semibold text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="all">All Batches</option>
              {allBatches.map((b) => (
                <option key={b.id || b.name} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
        </div>

      </div>
    </div>
  );
}
