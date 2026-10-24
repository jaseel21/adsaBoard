import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  BookmarkPlus,
  Utensils,
  Coffee,
  Check,
  Tag,
  Sparkles,
} from 'lucide-react';
import { dialog } from '../utils/dialog';
import {
  subscribeToDishPresets,
  addDishPreset,
  updateDishPreset,
  deleteDishPreset,
} from '../utils/menuService';
import { useFeedback } from '../utils/useFeedback';
import { Edit3, Clock } from 'lucide-react';
import MealTimingInput from './menu/MealTimingInput';

export default function PresetManagerModal({ isOpen, onClose }) {
  const { feedback } = useFeedback();

  const [activeSlot, setActiveSlot] = useState('breakfast');
  const [presetsMap, setPresetsMap] = useState({});
  const [newTitle, setNewTitle] = useState('');
  const [newItemsStr, setNewItemsStr] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newTiming, setNewTiming] = useState('');
  const [newTimeMode, setNewTimeMode] = useState('clock');
  const [showAddForm, setShowAddForm] = useState(false);
  
  // Edit mode state
  const [editingPresetOriginalTitle, setEditingPresetOriginalTitle] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editItemsStr, setEditItemsStr] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editTiming, setEditTiming] = useState('');
  const [editTimeMode, setEditTimeMode] = useState('clock');

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeToDishPresets((presets) => {
      setPresetsMap(presets || {});
    });
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const currentPresets = Array.isArray(presetsMap[activeSlot]) ? presetsMap[activeSlot] : [];

  const handleStartEdit = (preset) => {
    feedback('tick');
    setEditingPresetOriginalTitle(preset.title);
    setEditTitle(preset.title);
    setEditItemsStr(Array.isArray(preset.items) ? preset.items.join(', ') : preset.title);
    setEditCategory(preset.category || '');
    setEditTiming(preset.timing || '');
    setEditTimeMode(preset.timeMode || 'clock');
    setShowAddForm(false);
  };

  const handleCancelEdit = () => {
    feedback('tick');
    setEditingPresetOriginalTitle(null);
  };

  const handleUpdatePreset = async (e) => {
    e.preventDefault();
    if (!editTitle.trim() || !editingPresetOriginalTitle) return;

    setSaving(true);
    feedback('tick');

    const items = editItemsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await updateDishPreset(activeSlot, editingPresetOriginalTitle, {
        title: editTitle.trim(),
        items: items.length > 0 ? items : [editTitle.trim()],
        category: editCategory,
        timing: editTiming,
        timeMode: editTimeMode,
      });

      setEditingPresetOriginalTitle(null);
      feedback('success');
      dialog.toast.success('Preset Updated', `Updated "${editTitle}" successfully.`);
    } catch (err) {
      console.error('Error updating preset:', err);
      feedback('warning');
      dialog.alert({ type: 'error', title: 'Error', message: 'Could not update preset.' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddPreset = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setSaving(true);
    feedback('tick');

    const items = newItemsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    try {
      await addDishPreset(activeSlot, {
        title: newTitle.trim(),
        items: items.length > 0 ? items : [newTitle.trim()],
        category: newCategory,
        timing: newTiming,
        timeMode: newTimeMode,
      });

      setNewTitle('');
      setNewItemsStr('');
      setNewCategory('');
      setNewTiming('');
      setNewTimeMode('clock');
      setShowAddForm(false);
      feedback('success');
    } catch (err) {
      console.error('Error adding preset:', err);
      feedback('warning');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (presetTitle) => {
    const confirmed = await dialog.confirm({
      title: `Delete Preset "${presetTitle}"?`,
      message: 'This will remove it from the quick presets list.',
      icon: 'trash',
      confirmColor: 'rose',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await deleteDishPreset(activeSlot, presetTitle);
        dialog.toast.success('Preset Deleted', `Removed "${presetTitle}" from presets.`);
      } catch (err) {
        console.error('Error deleting preset:', err);
        dialog.alert({ type: 'error', title: 'Error', message: 'Could not delete preset.' });
      }
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md pb-safe"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl max-h-[90dvh] flex flex-col rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 to-green-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <BookmarkPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Canteen Dish Presets</h2>
              <p className="text-xs text-emerald-100">
                CRUD reusable meal templates for quick 1-click schedule editing
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

        {/* Slot Selector */}
        <div className="p-2 sm:p-3 bg-gray-50 dark:bg-white/5 border-b border-gray-200 dark:border-white/10 flex items-center gap-1.5 overflow-x-auto scrollbar-none touch-pan-x">
          {[
            { id: 'breakfast', label: 'Breakfast', icon: Coffee },
            { id: 'lunch', label: 'Lunch', icon: Utensils },
            { id: 'evening', label: 'Evening Tea', icon: Coffee },
            { id: 'dinner', label: 'Dinner', icon: Utensils },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => {
                feedback('tick');
                setActiveSlot(id);
              }}
              className={`flex-1 min-w-[85px] sm:min-w-0 inline-flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                activeSlot === id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-200/50 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              {activeSlot.toUpperCase()} Presets ({currentPresets.length})
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Preset</span>
            </button>
          </div>

          {/* Add form */}
          <AnimatePresence>
            {showAddForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleAddPreset}
                className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 space-y-3"
              >
                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Preset Dish Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. Kerala Neychor & Beef Curry"
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121c19] text-xs font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Sides & Components (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={newItemsStr}
                    onChange={(e) => setNewItemsStr(e.target.value)}
                    placeholder="e.g. Ghee Rice, Beef Roast, Pickle, Salad, Pappadam"
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121c19] text-xs font-medium focus:outline-none"
                  />
                </div>

                <MealTimingInput
                  value={newTiming}
                  timeMode={newTimeMode}
                  onChange={(timing, mode) => {
                    setNewTiming(timing);
                    setNewTimeMode(mode);
                  }}
                  slotKey={activeSlot}
                />

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121c19] text-xs font-medium"
                    >
                      <option value="">None (No Tag)</option>
                      <option value="Veg">Vegetarian</option>
                      <option value="Non-Veg">Non-Veg</option>
                      <option value="Egg">Egg</option>
                      <option value="Special">Special Feast</option>
                    </select>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-md"
                    >
                      {saving ? 'Saving...' : 'Save Preset'}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Edit form */}
          <AnimatePresence>
            {editingPresetOriginalTitle && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleUpdatePreset}
                className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-500/20 space-y-3"
              >
                <div className="flex items-center justify-between pb-1 border-b border-blue-200/60 dark:border-blue-500/20">
                  <span className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Edit3 className="w-3.5 h-3.5 text-blue-500" />
                    <span>Edit Preset: {editingPresetOriginalTitle}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-700 dark:hover:text-gray-200"
                  >
                    Cancel
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Preset Dish Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121c19] text-xs font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Sides & Components (Comma-separated)
                  </label>
                  <input
                    type="text"
                    value={editItemsStr}
                    onChange={(e) => setEditItemsStr(e.target.value)}
                    placeholder="e.g. Rice, Curry, Salad, Pickle"
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121c19] text-xs font-medium focus:outline-none"
                  />
                </div>

                <MealTimingInput
                  value={editTiming}
                  timeMode={editTimeMode}
                  onChange={(timing, mode) => {
                    setEditTiming(timing);
                    setEditTimeMode(mode);
                  }}
                  slotKey={activeSlot}
                />

                <div className="flex items-center justify-between gap-3 pt-1">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Category
                    </label>
                    <select
                      value={editCategory}
                      onChange={(e) => setEditCategory(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121c19] text-xs font-medium"
                    >
                      <option value="">None (No Tag)</option>
                      <option value="Veg">Vegetarian</option>
                      <option value="Non-Veg">Non-Veg</option>
                      <option value="Egg">Egg</option>
                      <option value="Special">Special Feast</option>
                    </select>
                  </div>

                  <div className="pt-4 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-3 py-2 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-bold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-colors"
                    >
                      {saving ? 'Updating...' : 'Update Preset'}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* List of presets */}
          <div className="space-y-2">
            {currentPresets.map((preset, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-gray-900 dark:text-white">
                      {preset.title}
                    </span>
                    {preset.category && (
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          preset.category === 'Non-Veg'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                            : preset.category === 'Egg'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                            : preset.category === 'Special'
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        }`}
                      >
                        {preset.category}
                      </span>
                    )}
                    {preset.timing && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                        <Clock className="w-3 h-3 text-purple-500" />
                        <span>{preset.timing}</span>
                      </span>
                    )}
                  </div>
                  {Array.isArray(preset.items) && preset.items.length > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {preset.items.join(' • ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(preset)}
                    className="p-1.5 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-950/40 text-blue-500 transition-colors"
                    title="Edit preset"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(preset.title)}
                    className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 transition-colors"
                    title="Delete preset"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-gray-50 dark:bg-[#121c19] border-t border-gray-200 dark:border-white/10 flex justify-end pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
