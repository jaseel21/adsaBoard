import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Filter,
  ArrowUpDown,
  Layers,
  LayoutGrid,
  CreditCard,
  Grid3X3,
  RotateCcw,
  UtensilsCrossed,
  Sparkles,
  Utensils,
  Coffee,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';

/**
 * Reusable, responsive Filter Toolbar for the Token Board.
 * Shared seamlessly across Public Home and Admin Master Board.
 */
export default function TokenBoardControls({
  controller,
  showDensityToggle = true,
  showMealToggle = true,
  className = '',
}) {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();

  const {
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    batchFilter,
    setBatchFilter,
    dietaryFilter,
    setDietaryFilter,
    sortBy,
    setSortBy,
    viewCategory,
    setViewCategory,
    viewDensity,
    setViewDensity,
    allBatches,
    preferencesList,
    filteredDocuments,
    resetAllFilters,
    hasActiveFilters,
    metrics,
    isLunch,
    toggleMeal,
  } = controller;

  return (
    <div
      className={`p-3.5 xs:p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-3 sm:space-y-4 w-full max-w-full min-w-0 overflow-hidden ${className}`}
    >
      {/* Row 0: Breakfast / Lunch Meal Toggle */}
      {showMealToggle && toggleMeal && (
        <div className="flex items-center justify-between gap-3">
          <span className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-wider shrink-0">
            {t('mealLabel', 'Meal:')}
          </span>
          <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex-1 sm:flex-none">
            <button
              type="button"
              onClick={() => {
                feedback('pop');
                toggleMeal('lunch');
              }}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                isLunch
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-sm shadow-emerald-500/20'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>{t('navLunch', 'Lunch')}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                feedback('pop');
                toggleMeal('breakfast');
              }}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                !isLunch
                  ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm shadow-amber-500/20'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>{t('navBreakfast', 'Breakfast')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Row 1: Search Bar & Primary View Category / Density Controls */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 sm:gap-4 min-w-0">
        
        {/* Search Box */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchTokensPlaceholder', 'Search token #, English name, മലയാളം, room, phone, batch...')}
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs sm:text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setSearchQuery('');
              }}
              title={t('clearSearch', 'Clear search')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* View Category Segmented Control & Optional Density Switch */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-stretch lg:self-auto min-w-0 max-w-full">
          
          {/* View Category Segmented Switch */}
          <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-semibold overflow-x-auto max-w-full scrollbar-none touch-pan-x flex-1 sm:flex-none min-w-0">
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setViewCategory('all');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                viewCategory === 'all'
                  ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('allTokensMode', 'All Tokens')}
            </button>

            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setViewCategory('batch');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                viewCategory === 'batch'
                  ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('byAcademicBatch', 'By Batch')}
            </button>

            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setViewCategory('section');
              }}
              className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                viewCategory === 'section'
                  ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('byDynamicSections', 'By Sections')}
            </button>
          </div>

          {/* Density Toggle (Matrix buttons vs Rich Cards) */}
          {showDensityToggle && (
            <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-semibold shrink-0">
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setViewDensity('matrix');
                }}
                className={`p-1.5 rounded-lg transition-all ${
                  viewDensity === 'matrix'
                    ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                title={t('compactMatrix', 'Compact Matrix')}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setViewDensity('cards');
                }}
                className={`p-1.5 rounded-lg transition-all ${
                  viewDensity === 'cards'
                    ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
                title={t('detailedStudentCards', 'Detailed Student Cards')}
              >
                <CreditCard className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Sort, Dynamic Batch Filter, Dietary Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-gray-100 dark:border-white/5">
        
        {/* Sort Dropdown */}
        <div className="relative">
          <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={sortBy}
            onChange={(e) => {
              feedback('tick');
              setSortBy(e.target.value);
            }}
            aria-label="Sort tokens"
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="token_asc">{t('sortTokenAsc', 'Token # (1 → 200)')}</option>
            <option value="token_desc">{t('sortTokenDesc', 'Token # (200 → 1)')}</option>
            <option value="name_asc">{t('sortNameAsc', 'Name: English (A → Z)')}</option>
            <option value="name_ml">{t('sortNameMl', 'Name: Malayalam (അ → ഹ)')}</option>
            <option value="status_active">{t('sortActiveFirst', 'Active Meals First (ON)')}</option>
            <option value="status_off">{t('sortOffFirst', 'Canceled Meals First (OFF)')}</option>
            <option value="room_asc">{t('sortRoomAsc', 'Room No (Ascending)')}</option>
          </select>
        </div>

        {/* Dynamic Batch Filter Dropdown */}
        <div className="relative">
          <Layers className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={batchFilter}
            onChange={(e) => {
              feedback('tick');
              setBatchFilter(e.target.value);
            }}
            aria-label="Filter by batch"
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="all">{t('allBatches', 'All Batches')} ({allBatches.reduce((acc, b) => acc + b.count, 0)})</option>
            {allBatches.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name} ({b.count} {t('students', 'students')})
              </option>
            ))}
          </select>
        </div>

        {/* Dietary Preferences Filter Dropdown */}
        <div className="relative">
          <UtensilsCrossed className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={dietaryFilter}
            onChange={(e) => {
              feedback('tick');
              setDietaryFilter(e.target.value);
            }}
            aria-label="Filter by dietary preference"
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="all">{t('allDietaryInclusions', 'All Dietary Inclusions')}</option>
            {preferencesList.map((p) => {
              const avoidersCount = metrics?.dietaryTallies?.[`${p.id}_avoiders`] || 0;
              const prefLabel = lang === 'ml' && p.labelMl ? p.labelMl : p.labelEn;
              return (
                <option key={p.id} value={p.id}>
                  {prefLabel} • {avoidersCount} {t('avoiders', 'avoiders')}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Row 3: Status Filter Chips with Real-Time Count Badges */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none touch-pan-x flex-1 min-w-0">
          <span className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-wider shrink-0 mr-1">
            {t('statusFilterLabel', 'Status:')}
          </span>

          {[
            { id: 'all', label: t('allTokens', 'All Tokens'), count: metrics.total, color: 'text-gray-700 dark:text-gray-300' },
            { id: 'active', label: t('statusServing', 'Active Serving'), count: metrics.activeCount, color: 'text-emerald-700 dark:text-emerald-300' },
            { id: 'off', label: t('statusCanceled', 'Canceled / Off'), count: metrics.offCount, color: 'text-rose-700 dark:text-rose-300' },
            { id: 'leave', label: t('statusOnLeave', 'On Leave'), count: metrics.leaveCount, color: 'text-rose-700 dark:text-rose-300' },
            { id: 'blocked', label: t('statusBlockedLocked', 'Blocked / Locked'), count: metrics.blockedCount, color: 'text-gray-500 dark:text-gray-400' },
          ].map((chip) => {
            const isSelected = statusFilter === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  feedback('tick');
                  setStatusFilter(chip.id);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
                  isSelected
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-sm shadow-emerald-500/20'
                    : 'bg-gray-100 hover:bg-gray-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Reset All Filters Button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => {
              feedback('pop');
              resetAllFilters();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0"
            title="Reset all search queries, sorts, and filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t('reset', 'Reset')}</span>
          </button>
        )}
      </div>

      {/* Row 4: Active Filter Chips Bar (Shown when any non-default filter is active) */}
      <AnimatePresence>
        {hasActiveFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-wrap items-center gap-1.5 pt-2 text-[11px] font-medium text-gray-500 dark:text-gray-400"
          >
            <span className="font-bold text-gray-400">
              {t('showingMatching', 'Showing {count} matching:').replace('{count}', filteredDocuments.length)}
            </span>

            {searchQuery && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-semibold">
                <span>&ldquo;{searchQuery}&rdquo;</span>
                <button type="button" onClick={() => setSearchQuery('')} className="hover:text-rose-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {batchFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-300 dark:border-blue-500/30 text-blue-800 dark:text-blue-300 font-semibold">
                <span>{t('batch', 'Batch')}: {batchFilter}</span>
                <button type="button" onClick={() => setBatchFilter('all')} className="hover:text-rose-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {statusFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-300 dark:border-purple-500/30 text-purple-800 dark:text-purple-300 font-semibold">
                <span>{t('statusFilterLabel', 'Status:')} {statusFilter.toUpperCase()}</span>
                <button type="button" onClick={() => setStatusFilter('all')} className="hover:text-rose-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {dietaryFilter !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 font-semibold">
                <span>{t('diet', 'Diet')}: {dietaryFilter}</span>
                <button type="button" onClick={() => setDietaryFilter('all')} className="hover:text-rose-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {sortBy !== 'token_asc' && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-semibold">
                <span>{t('sorted', 'Sorted')}</span>
                <button type="button" onClick={() => setSortBy('token_asc')} className="hover:text-rose-500">
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
