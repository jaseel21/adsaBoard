import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  LayoutGrid,
  List,
  CreditCard,
  RotateCcw,
  UtensilsCrossed,
  Sparkles,
  Utensils,
  Coffee,
  CheckCircle2,
  Grid3X3,
  Users,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function AvoidersControls({
  searchQuery,
  setSearchQuery,
  dietaryFilter,
  setDietaryFilter,
  batchFilter,
  setBatchFilter,
  sortField,
  setSortField,
  sortOrder,
  setSortOrder,
  viewMode,
  setViewMode,
  categorization = 'meal',
  setCategorization,
  attendanceScope,
  setAttendanceScope,
  allBatches = [],
  preferences = [],
  rejectionsByPref = {},
  filteredCount = 0,
  totalCount = 0,
  onResetFilters,
  hasActiveFilters = false,
  className = '',
}) {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();

  const toggleSortOrder = () => {
    feedback('tick');
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  return (
    <div
      className={`p-3 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-3 sm:space-y-4 w-full max-w-full min-w-0 overflow-hidden ${className}`}
    >
      {/* Row 1: Search & Categorization & View Mode Switcher */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3 w-full min-w-0">
        {/* Search Bar - 100% on mobile */}
        <div className="relative flex-1 min-w-0 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t(
              'searchAvoidersPlaceholder',
              'Search token #, name, മലയാളം, batch, phone, or food item...'
            )}
            className="w-full pl-10 pr-12 sm:pr-16 py-2 sm:py-2.5 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs sm:text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all min-w-0"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setSearchQuery('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md transition-colors"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-400 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                /
              </span>
            )}
          </div>
        </div>

        {/* Categorization & Layout View Switchers */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between lg:justify-end gap-2 w-full lg:w-auto min-w-0">
          {/* Categorization Segmented Switch (By Meal | By Section | By Batch) */}
          {setCategorization && (
            <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-semibold overflow-x-auto scrollbar-none touch-pan-x max-w-full min-w-0 flex-1 sm:flex-none">
              {/* By Meal (Default) */}
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setCategorization('meal');
                }}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap min-w-0 ${
                  categorization === 'meal'
                    ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Categorize by Dietary Meal/Food Items (Default)"
              >
                <UtensilsCrossed className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('byMealCategory', 'By Meal')}</span>
                <span className="text-[9px] font-extrabold px-1 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 hidden sm:inline shrink-0">
                  {t('default', 'Default')}
                </span>
              </button>

              {/* By Section */}
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setCategorization('section');
                }}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap min-w-0 ${
                  categorization === 'section'
                    ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Categorize by Dining Mess Sections (1-25, 26-50...)"
              >
                <Grid3X3 className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('bySection', 'Section')}</span>
              </button>

              {/* By Batch */}
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setCategorization('batch');
                }}
                className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg transition-all whitespace-nowrap min-w-0 ${
                  categorization === 'batch'
                    ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
                title="Categorize by Academic Batches"
              >
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{t('byBatch', 'Batch')}</span>
              </button>
            </div>
          )}

          {/* View Mode Switcher */}
          <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-semibold shrink-0 justify-center">
            {/* Matrix Columns */}
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setViewMode('matrix');
              }}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg transition-all inline-flex items-center gap-1 ${
                viewMode === 'matrix'
                  ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Matrix View"
            >
              <LayoutGrid className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">{t('viewMatrix', 'Matrix')}</span>
            </button>

            {/* Detailed Table */}
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setViewMode('table');
              }}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg transition-all inline-flex items-center gap-1 ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Roster Table View"
            >
              <List className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">{t('viewTable', 'Roster')}</span>
            </button>

            {/* Touch Bento Cards */}
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setViewMode('cards');
              }}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg transition-all inline-flex items-center gap-1 ${
                viewMode === 'cards'
                  ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Cards Grid View"
            >
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">{t('viewCards', 'Cards')}</span>
            </button>

            {/* Grouped Accordions */}
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setViewMode('grouped');
              }}
              className={`p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg transition-all inline-flex items-center gap-1 ${
                viewMode === 'grouped'
                  ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
              title="Grouped Accordions View"
            >
              <Layers className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden md:inline">{t('viewGrouped', 'Grouped')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Row 2: Sort, Batch, Dietary & Direction Controls */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5 pt-2 border-t border-gray-100 dark:border-white/5 w-full min-w-0">
        {/* 1. Dietary Scope Filter */}
        <div className="relative w-full min-w-0">
          <UtensilsCrossed className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={dietaryFilter}
            onChange={(e) => {
              feedback('tick');
              setDietaryFilter(e.target.value);
            }}
            aria-label="Filter by dietary preference"
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-w-0 truncate"
          >
            <option value="all_avoiders">
              {t('allDietaryAvoidersFilter', 'All Dietary Avoiders (1+)')}
            </option>
            <option value="all_students">
              {t('allEnrolledTokens', 'All Enrolled Diners')} ({totalCount})
            </option>
            <option value="multi_avoiders">
              {t('multiAvoiders', 'Multi-Food Avoiders (2+)')}
            </option>
            <option value="strict_avoiders">
              {t('strictAvoiders', 'Strict Avoiders (3+)')}
            </option>
            <option value="standard_full">
              {t('standardFullDiet', 'Standard Full Diet (0 Exclusions)')}
            </option>
            <optgroup label={t('byFoodCategory', 'Filter by Specific Food:')}>
              {preferences.map((p) => {
                const count = (rejectionsByPref[p.id] || []).length;
                const prefLabel = lang === 'ml' && p.labelMl ? p.labelMl : (p.labelEn || p.name);
                return (
                  <option key={p.id} value={p.id}>
                    {prefLabel} ({count} {t('avoiders', 'avoiders')})
                  </option>
                );
              })}
            </optgroup>
          </select>
        </div>

        {/* 2. Academic Batch Filter */}
        <div className="relative w-full min-w-0">
          <Layers className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={batchFilter}
            onChange={(e) => {
              feedback('tick');
              setBatchFilter(e.target.value);
            }}
            aria-label="Filter by batch"
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-w-0 truncate"
          >
            <option value="all">
              {t('allBatches', 'All Batches')} ({allBatches.reduce((acc, b) => acc + b.count, 0)})
            </option>
            {allBatches.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name} ({b.count} {t('students', 'students')})
              </option>
            ))}
          </select>
        </div>

        {/* 3. Sort Field Selector */}
        <div className="relative w-full min-w-0">
          <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <select
            value={sortField}
            onChange={(e) => {
              feedback('tick');
              setSortField(e.target.value);
            }}
            aria-label="Sort tokens by field"
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 min-w-0 truncate"
          >
            <option value="tokenNo">{t('sortToken', 'Sort by: Token Number')}</option>
            <option value="nameEn">{t('sortNameEn', 'Sort by: Name (English A → Z)')}</option>
            <option value="nameMl">{t('sortNameMlFull', 'Sort by: Name (Malayalam അ → ഹ)')}</option>
            <option value="batch">{t('sortBatch', 'Sort by: Academic Batch')}</option>
            <option value="avoidCount">{t('sortAvoidCount', 'Sort by: Exclusions Count')}</option>
          </select>
        </div>

        {/* 4. Direction Toggle & Attendance Quick Toggle */}
        <div className="flex items-center gap-2 w-full min-w-0">
          {/* Order Direction Button */}
          <button
            type="button"
            onClick={toggleSortOrder}
            className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-all truncate"
            title={`Current order: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}. Click to toggle.`}
          >
            {sortOrder === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-rose-500 shrink-0" />
            )}
            <span className="truncate">{sortOrder === 'asc' ? t('asc', 'Ascending') : t('desc', 'Descending')}</span>
          </button>

          {/* Attendance Context Scope Toggle */}
          {setAttendanceScope && (
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setAttendanceScope((prev) => (prev === 'all' ? 'active_only' : 'all'));
              }}
              className={`flex-1 sm:flex-none min-w-0 px-3 py-2 rounded-xl border text-xs font-bold transition-all truncate ${
                attendanceScope === 'active_only'
                  ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-gray-50 dark:bg-[#121c19] border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
              }`}
              title="Filter by Today's Active Kitchen Meal Attendance"
            >
              {attendanceScope === 'active_only' ? (
                <span className="flex items-center justify-center gap-1 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span className="truncate">{t('activeToday', 'Active')}</span>
                </span>
              ) : (
                <span className="truncate">{t('allEnrolled', 'All')}</span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Row 3: Active Filters Summary & Reset */}
      <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-white/5 flex-wrap w-full min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap min-w-0 flex-1">
          <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {t('showing', 'Showing')}{' '}
            <strong className="text-gray-900 dark:text-white font-mono">{filteredCount}</strong>{' '}
            {t('of', 'of')}{' '}
            <span className="text-gray-600 dark:text-gray-400 font-mono">{totalCount}</span>
          </span>

          {/* Categorization Tag */}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[10px] font-bold text-emerald-700 dark:text-emerald-300 shrink-0">
            <span>
              {categorization === 'meal'
                ? t('byMealCategory', 'By Meal')
                : categorization === 'section'
                ? t('bySection', 'By Section')
                : t('byBatch', 'By Batch')}
            </span>
          </span>

          {/* Filter Pills */}
          {searchQuery && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 max-w-[160px] truncate">
              <span className="truncate">&quot;{searchQuery}&quot;</span>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="hover:text-emerald-900 dark:hover:text-white p-0.5 shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {dietaryFilter !== 'all_avoiders' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-[11px] font-semibold text-rose-700 dark:text-rose-300 shrink-0">
              <span>
                {dietaryFilter === 'all_students'
                  ? 'All Diners'
                  : dietaryFilter === 'multi_avoiders'
                  ? 'Multi-Avoiders'
                  : dietaryFilter === 'strict_avoiders'
                  ? 'Strict'
                  : dietaryFilter === 'standard_full'
                  ? 'Standard Full'
                  : preferences.find((p) => p.id === dietaryFilter)?.labelEn || dietaryFilter}
              </span>
              <button
                type="button"
                onClick={() => setDietaryFilter('all_avoiders')}
                className="hover:text-rose-900 dark:hover:text-white p-0.5 shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {batchFilter !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] font-semibold text-blue-700 dark:text-blue-300 shrink-0">
              <span>{batchFilter}</span>
              <button
                type="button"
                onClick={() => setBatchFilter('all')}
                className="hover:text-blue-900 dark:hover:text-white p-0.5 shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>

        {/* Reset All Filters Button */}
        {hasActiveFilters && onResetFilters && (
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              onResetFilters();
            }}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{t('resetAll', 'Reset Filters')}</span>
          </button>
        )}
      </div>
    </div>
  );
}
