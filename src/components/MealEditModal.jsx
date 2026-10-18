import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Utensils,
  Coffee,
  Sparkles,
  Clock,
  Tag,
  Plus,
  Trash2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { DISH_PRESETS } from '../utils/menuService';

const SLOT_CONFIGS = {
  breakfast: {
    label: 'Breakfast',
    icon: Coffee,
    colorClass: 'text-amber-500 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-500/30',
    defaultTiming: '07:00 AM - 08:30 AM',
  },
  lunch: {
    label: 'Lunch',
    icon: Utensils,
    colorClass: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30',
    defaultTiming: '12:30 PM - 02:00 PM',
  },
  evening: {
    label: 'Evening Tea',
    icon: Coffee,
    colorClass: 'text-blue-500 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-500/30',
    defaultTiming: '04:30 PM - 05:30 PM',
  },
  dinner: {
    label: 'Dinner',
    icon: Utensils,
    colorClass: 'text-purple-500 bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-500/30',
    defaultTiming: '08:30 PM - 09:30 PM',
  },
};

const CATEGORIES = [
  { key: 'Veg', label: 'Vegetarian', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700' },
  { key: 'Non-Veg', label: 'Non-Veg', badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700' },
  { key: 'Egg', label: 'Egg', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700' },
  { key: 'Special', label: 'Special Feast', badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-700' },
];

export default function MealEditModal({
  isOpen,
  onClose,
  dayKey,
  dayName,
  slotKey,
  initialData,
  onSave,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const [title, setTitle] = useState('');
  const [items, setItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');
  const [category, setCategory] = useState('Veg');
  const [timing, setTiming] = useState('');
  const [specialTag, setSpecialTag] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [isArchived, setIsArchived] = useState(false);
  const [archiveReason, setArchiveReason] = useState('');

  const slotInfo = SLOT_CONFIGS[slotKey] || SLOT_CONFIGS.lunch;
  const Icon = slotInfo.icon;

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setItems(Array.isArray(initialData.items) ? [...initialData.items] : []);
      setCategory(initialData.category || 'Veg');
      setTiming(initialData.timing || slotInfo.defaultTiming);
      setSpecialTag(initialData.specialTag || '');
      setIsAvailable(initialData.isAvailable !== undefined ? initialData.isAvailable : true);
      setIsArchived(Boolean(initialData.isArchived));
      setArchiveReason(initialData.archiveReason || '');
    } else {
      setTitle('');
      setItems([]);
      setCategory('Veg');
      setTiming(slotInfo.defaultTiming);
      setSpecialTag('');
      setIsAvailable(true);
      setIsArchived(false);
      setArchiveReason('');
    }
    setNewItemText('');
  }, [initialData, slotKey, slotInfo]);

  if (!isOpen) return null;

  const handleClearDish = () => {
    feedback('pop');
    setTitle('');
    setItems([]);
    setSpecialTag('');
  };

  const handleAddItem = (e) => {
    e?.preventDefault();
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    if (!items.includes(trimmed)) {
      feedback('tick');
      setItems([...items, trimmed]);
    }
    setNewItemText('');
  };

  const handleRemoveItem = (index) => {
    feedback('tick');
    setItems(items.filter((_, i) => i !== index));
  };

  const handleApplyPreset = (preset) => {
    feedback('pop');
    setTitle(preset.title);
    if (preset.items) setItems([...preset.items]);
    if (preset.category) setCategory(preset.category);
    setIsArchived(false);
    setIsAvailable(true);
  };

  const handleSave = () => {
    feedback('success');
    onSave(dayKey, slotKey, {
      title: title.trim(),
      items,
      category,
      timing: timing.trim() || slotInfo.defaultTiming,
      specialTag: specialTag.trim(),
      isAvailable: isArchived ? false : isAvailable,
      isArchived,
      archiveReason: archiveReason.trim(),
    });
    onClose();
  };

  const presets = DISH_PRESETS[slotKey] || [];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 xs:p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-2xl bg-white dark:bg-[#0f1715] rounded-2xl sm:rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] pb-safe"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 border-b border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${slotInfo.colorClass}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    {t('editMealTitle') || 'Edit Meal Schedule'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-gray-200/80 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                    {dayName} • {slotInfo.label}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Configure dish description, ingredients, dietary classification and timings
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                feedback('tick');
                onClose();
              }}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-xs sm:text-sm">
            
            {/* Quick Presets Carousel / Chips */}
            {presets.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t('dishPresets') || 'Quick Presets (Alathurpadi Dars Canonical Menu)'}</span>
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                  {presets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 hover:bg-emerald-50 dark:bg-white/5 dark:hover:bg-emerald-950/40 hover:border-emerald-400 text-xs font-semibold text-gray-700 dark:text-gray-200 whitespace-nowrap transition-colors flex-shrink-0"
                    >
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Dish Title & Quick Clear */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  {t('dishTitle') || 'Dish Name / Headline'} *
                </label>
                {(title || items.length > 0) && (
                  <button
                    type="button"
                    onClick={handleClearDish}
                    className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Clear Dish (Empty)</span>
                  </button>
                )}
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Malabar Dum Biriyani & Chicken 65 (or leave empty)"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('dishCategory') || 'Dietary / Preparation Category'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setCategory(cat.key);
                    }}
                    className={`px-3 py-2 rounded-xl border text-xs font-bold transition-all text-center ${
                      category === cat.key
                        ? `${cat.badgeClass} ring-2 ring-emerald-500 shadow-xs`
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-100'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Items & Side Dishes Tag Manager */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                {t('dishItems') || 'Itemized Components & Side Dishes'}
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem();
                    }
                  }}
                  placeholder="e.g. Sambar, Lime Pickle, Fish Fry (press Enter)"
                  className="flex-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-xs"
                />
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>

              {/* Tag Cloud */}
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 rounded-xl bg-gray-50/60 dark:bg-white/[0.02] border border-dashed border-gray-200 dark:border-white/10">
                {items.length === 0 ? (
                  <span className="text-gray-400 text-xs italic">No specific side dishes added yet.</span>
                ) : (
                  items.map((item, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 text-xs font-semibold shadow-2xs"
                    >
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="text-gray-400 hover:text-rose-500 transition-colors ml-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Serving Timings & Special Notice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>{t('servingTiming') || 'Serving Hours'}</span>
                </label>
                <input
                  type="text"
                  value={timing}
                  onChange={(e) => setTiming(e.target.value)}
                  placeholder="e.g. 12:30 PM - 02:00 PM"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-gray-400" />
                  <span>{t('chefNotes') || 'Special Badge / Note'}</span>
                </label>
                <input
                  type="text"
                  value={specialTag}
                  onChange={(e) => setSpecialTag(e.target.value)}
                  placeholder="e.g. Jum'ah Special, Chef Recommendation"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40 text-xs"
                />
              </div>
            </div>

            {/* Availability & Archive Toggles */}
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
                <div>
                  <span className="font-bold text-xs text-gray-900 dark:text-white block">
                    Enable Meal Slot for this Day
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400">
                    When turned off, students and kitchen staff know this meal is not being served.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    feedback('pop');
                    setIsAvailable(!isAvailable);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isAvailable ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isAvailable ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Archive Slot Toggle */}
              <div className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-amber-900 dark:text-amber-300 block">
                      Archive Meal Slot (Take Off Canteen Schedule)
                    </span>
                    <span className="text-[11px] text-amber-700 dark:text-amber-400">
                      Archived slots are skipped in Home Spotlight and marked inactive in the public menu.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      feedback('pop');
                      const next = !isArchived;
                      setIsArchived(next);
                      if (next) setIsAvailable(false);
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isArchived ? 'bg-amber-500' : 'bg-gray-300 dark:bg-gray-700'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isArchived ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {isArchived && (
                  <div>
                    <input
                      type="text"
                      value={archiveReason}
                      onChange={(e) => setArchiveReason(e.target.value)}
                      placeholder="Archive reason (e.g. Canteen closed for dinner, Sunday off)"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-white dark:bg-black/30 border border-amber-300 dark:border-amber-500/30 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Live Preview Card */}
            <div>
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                Preview Appearance:
              </span>
              <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-300/60 dark:border-emerald-500/30 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {title || 'Untitled Meal Dish'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                      {category}
                    </span>
                    {specialTag && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                        {specialTag}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    {items.length > 0 ? items.join(' • ') : 'No items listed'}
                  </p>
                  <span className="text-[11px] text-gray-400 font-medium block">
                    ⏰ {timing || slotInfo.defaultTiming}
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 p-3.5 sm:p-5 border-t border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 pb-safe">
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                onClose();
              }}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{t('saveChanges') || 'Save Meal'}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
