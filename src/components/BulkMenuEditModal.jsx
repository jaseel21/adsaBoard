import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Layers,
  Utensils,
  Coffee,
  Check,
  Sparkles,
  Save,
  Clock,
} from 'lucide-react';
import { dialog } from '../utils/dialog';
import {
  bulkUpdateMealAcrossDays,
  subscribeToDishPresets,
} from '../utils/menuService';
import { useFeedback } from '../utils/useFeedback';

const ALL_DAYS = [
  { key: 'su', label: 'Sunday' },
  { key: 'mo', label: 'Monday' },
  { key: 'tu', label: 'Tuesday' },
  { key: 'we', label: 'Wednesday' },
  { key: 'th', label: 'Thursday' },
  { key: 'fr', label: 'Friday' },
  { key: 'sa', label: 'Saturday' },
];

export default function BulkMenuEditModal({ isOpen, onClose }) {
  const { feedback } = useFeedback();

  const [selectedDays, setSelectedDays] = useState(['mo', 'tu', 'we', 'th', 'fr']);
  const [selectedSlot, setSelectedSlot] = useState('breakfast');
  const [title, setTitle] = useState('');
  const [itemsStr, setItemsStr] = useState('');
  const [category, setCategory] = useState('Veg');
  const [timing, setTiming] = useState('07:00 AM - 08:30 AM');
  const [presetsMap, setPresetsMap] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToDishPresets((presets) => {
      setPresetsMap(presets || {});
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const currentPresets = Array.isArray(presetsMap[selectedSlot]) ? presetsMap[selectedSlot] : [];

  const toggleDay = (dayKey) => {
    feedback('tick');
    setSelectedDays((prev) =>
      prev.includes(dayKey) ? prev.filter((k) => k !== dayKey) : [...prev, dayKey]
    );
  };

  const selectAllDays = () => {
    feedback('tick');
    setSelectedDays(ALL_DAYS.map((d) => d.key));
  };

  const selectWeekdays = () => {
    feedback('tick');
    setSelectedDays(['mo', 'tu', 'we', 'th', 'fr']);
  };

  const handleApplyPreset = (preset) => {
    feedback('tick');
    setTitle(preset.title);
    setItemsStr(Array.isArray(preset.items) ? preset.items.join(', ') : preset.title);
    setCategory(preset.category || 'Veg');
  };

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (selectedDays.length === 0) {
      dialog.alert({ type: 'warning', title: 'No Days Selected', message: 'Please select at least one day.' });
      return;
    }
    if (!title.trim()) {
      dialog.alert({ type: 'warning', title: 'Missing Dish Name', message: 'Please enter a dish name.' });
      return;
    }

    setSaving(true);
    feedback('tick');

    const items = itemsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const mealData = {
      title: title.trim(),
      items: items.length > 0 ? items : [title.trim()],
      category,
      timing,
      isAvailable: true,
      isArchived: false,
    };

    try {
      await bulkUpdateMealAcrossDays(selectedDays, selectedSlot, mealData);
      dialog.toast.success(
        'Bulk Menu Updated!',
        `Updated ${selectedSlot.toUpperCase()} across ${selectedDays.length} days successfully.`
      );
      onClose();
    } catch (err) {
      console.error('Bulk update error:', err);
      dialog.alert({ type: 'error', title: 'Error', message: 'Could not update menu across days.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[90dvh] flex flex-col rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden pb-safe"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 to-green-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Bulk Edit Multiple Days</h2>
              <p className="text-xs text-emerald-100">
                Apply a uniform meal to multiple days simultaneously (Item #10)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleBulkSubmit} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Step 1: Select Days */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                1. Select Target Days ({selectedDays.length} selected)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectWeekdays}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  Weekdays (Mon-Fri)
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={selectAllDays}
                  className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  All 7 Days
                </button>
              </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {ALL_DAYS.map((d) => {
                const isSelected = selectedDays.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDay(d.key)}
                    className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {d.label.slice(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Select Slot */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider block mb-2">
              2. Select Meal Slot
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'breakfast', label: 'Breakfast', icon: Coffee },
                { id: 'lunch', label: 'Lunch', icon: Utensils },
                { id: 'evening', label: 'Evening', icon: Coffee },
                { id: 'dinner', label: 'Dinner', icon: Utensils },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setSelectedSlot(id);
                  }}
                  className={`flex items-center justify-center gap-1.5 py-2.5 rounded-xl border text-xs font-bold transition-all ${
                    selectedSlot === id
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Preset Selector */}
          {currentPresets.length > 0 && (
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-1.5">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                Load from Quick Preset:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentPresets.map((p, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#121c19] border border-gray-200 dark:border-white/10 hover:border-emerald-500 transition-colors"
                  >
                    {p.title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Dish Details */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Dish Name
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Matta Rice & Chicken Curry"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#15201c] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Sides / Components (Comma separated)
              </label>
              <input
                type="text"
                value={itemsStr}
                onChange={(e) => setItemsStr(e.target.value)}
                placeholder="e.g. Matta Rice, Chicken Curry, Cabbage Thoran, Pickle"
                className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#15201c] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#15201c] text-xs font-medium focus:outline-none"
                >
                  <option value="Veg">Vegetarian</option>
                  <option value="Non-Veg">Non-Veg</option>
                  <option value="Egg">Egg</option>
                  <option value="Special">Special Feast</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Serving Hours
                </label>
                <input
                  type="text"
                  value={timing}
                  onChange={(e) => setTiming(e.target.value)}
                  placeholder="e.g. 12:30 PM - 02:00 PM"
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#15201c] text-xs font-medium focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 pb-safe flex justify-end gap-2 border-t border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Applying...' : `Apply to ${selectedDays.length} Days`}</span>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
