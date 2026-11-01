import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  Bookmark,
  Check,
  Utensils,
  Coffee,
  Moon,
  Clock,
  Sparkles,
  Filter,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';

const CATEGORIES = [
  { key: 'all', label: 'All Categories' },
  { key: 'Veg', label: 'Veg', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300' },
  { key: 'Non-Veg', label: 'Non-Veg', badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300' },
  { key: 'Egg', label: 'Egg', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300' },
  { key: 'Special', label: 'Special Feast', badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300' },
];

const SLOT_CONFIGS = [
  { key: 'breakfast', label: 'Breakfast', icon: Coffee },
  { key: 'lunch', label: 'Lunch', icon: Utensils },
  { key: 'evening', label: 'Evening Tea', icon: Coffee },
  { key: 'dinner', label: 'Dinner', icon: Moon },
];

export default function PresetSelectorModal({
  isOpen,
  onClose,
  presetsMap = {},
  slotKey = 'breakfast',
  onSelectPreset,
}) {
  const { feedback } = useFeedback();

  // Active slot tab within modal (defaults to the currently edited slotKey)
  const [activeSlotFilter, setActiveSlotFilter] = useState(() => slotKey);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Keep active slot updated when slotKey prop changes
  React.useEffect(() => {
    if (slotKey) setActiveSlotFilter(slotKey);
  }, [slotKey]);

  // Compute filtered presets list
  const filteredPresets = useMemo(() => {
    let list = [];
    if (activeSlotFilter === 'all') {
      // Aggregate from all slots
      Object.keys(presetsMap).forEach((sKey) => {
        const slotItems = Array.isArray(presetsMap[sKey]) ? presetsMap[sKey] : [];
        slotItems.forEach((p) => list.push({ ...p, sourceSlot: sKey }));
      });
    } else {
      const slotItems = Array.isArray(presetsMap[activeSlotFilter]) ? presetsMap[activeSlotFilter] : [];
      list = slotItems.map((p) => ({ ...p, sourceSlot: activeSlotFilter }));
    }

    return list.filter((p) => {
      // Category filter
      if (categoryFilter !== 'all' && p.category !== categoryFilter) {
        return false;
      }
      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchItems = Array.isArray(p.items) && p.items.some((it) => it.toLowerCase().includes(q));
      return matchTitle || matchItems;
    });
  }, [presetsMap, activeSlotFilter, categoryFilter, searchQuery]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
                <Bookmark className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Browse Dish Presets</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {filteredPresets.length} Found
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select any preset to populate dish title, category, timings, and accompaniments.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search & Slot Tabs Toolbar */}
          <div className="p-4 border-b border-gray-100 dark:border-white/5 space-y-3 bg-gray-50/50 dark:bg-white/[0.02]">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search presets by dish name (e.g. Biriyani, Porotta) or ingredient..."
                className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121c19] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Slot Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase pr-1 shrink-0">Slot:</span>
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setActiveSlotFilter('all');
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                  activeSlotFilter === 'all'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 border border-gray-200/60 dark:border-white/5'
                }`}
              >
                All Slots
              </button>
              {SLOT_CONFIGS.map((s) => {
                const Icon = s.icon;
                const count = Array.isArray(presetsMap[s.key]) ? presetsMap[s.key].length : 0;
                const isSelected = activeSlotFilter === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setActiveSlotFilter(s.key);
                    }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 border border-gray-200/60 dark:border-white/5'
                    }`}
                  >
                    <Icon className="w-3 h-3 text-emerald-500" />
                    <span>{s.label}</span>
                    <span className="text-[10px] opacity-75">({count})</span>
                  </button>
                );
              })}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <span className="text-[10px] font-bold text-gray-400 uppercase pr-1 shrink-0">Diet:</span>
              {CATEGORIES.map((cat) => {
                const isSelected = categoryFilter === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setCategoryFilter(cat.key);
                    }}
                    className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold transition-all whitespace-nowrap border ${
                      isSelected
                        ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-transparent shadow-xs'
                        : 'bg-white dark:bg-white/5 text-gray-500 border-gray-200/80 dark:border-white/5 hover:text-gray-800'
                    }`}
                  >
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Presets Grid */}
          <div className="p-4 sm:p-5 overflow-y-auto flex-1 max-h-[50vh]">
            {filteredPresets.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Bookmark className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
                  No presets match your search filters
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setCategoryFilter('all');
                    setActiveSlotFilter('all');
                  }}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPresets.map((preset, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-[#121c19]/70 hover:border-purple-400 dark:hover:border-purple-600 transition-all flex flex-col justify-between space-y-3 group shadow-xs hover:shadow-md"
                  >
                    <div>
                      {/* Top Bar: Title + Category */}
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-black text-sm text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {preset.title}
                        </span>

                        {preset.category && (
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border shrink-0 ${
                              preset.category === 'Veg'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300'
                                : preset.category === 'Non-Veg'
                                ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300'
                                : preset.category === 'Egg'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300'
                                : 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300'
                            }`}
                          >
                            {preset.category}
                          </span>
                        )}
                      </div>

                      {/* Timing if provided */}
                      {preset.timing && (
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono mt-1">
                          <Clock className="w-2.5 h-2.5 text-purple-500" />
                          <span>{preset.timing}</span>
                        </div>
                      )}

                      {/* Dishes / Items Chips */}
                      {Array.isArray(preset.items) && preset.items.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {preset.items.map((it, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-[10px] font-medium"
                            >
                              {it}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom Apply Action */}
                    <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[10px] text-gray-400 uppercase font-mono">
                        {preset.sourceSlot}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          feedback('pop');
                          onSelectPreset(preset);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-xs transition-colors flex items-center gap-1.5"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply Preset</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
