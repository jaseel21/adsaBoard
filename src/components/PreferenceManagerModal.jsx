import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UtensilsCrossed,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  ShieldAlert,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Egg,
  Fish,
  Drumstick,
  Apple,
  Coffee,
  Leaf,
  Utensils,
} from 'lucide-react';
import { dialog } from '../utils/dialog';
import {
  savePreferences,
  addPreference,
  updatePreference,
  deletePreference,
} from '../utils/preferenceService';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';

const ICON_MAP = {
  Utensils: Utensils,
  UtensilsCrossed: UtensilsCrossed,
  Drumstick: Drumstick,
  Fish: Fish,
  Egg: Egg,
  Apple: Apple,
  Coffee: Coffee,
  Leaf: Leaf,
};

export default function PreferenceManagerModal({
  isOpen,
  onClose,
  preferences = [],
}) {
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();

  const [editingId, setEditingId] = useState(null);
  const [editLabelEn, setEditLabelEn] = useState('');
  const [editLabelMl, setEditLabelMl] = useState('');
  const [editIcon, setEditIcon] = useState('Utensils');

  // New preference form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabelEn, setNewLabelEn] = useState('');
  const [newLabelMl, setNewLabelMl] = useState('');
  const [newIcon, setNewIcon] = useState('Utensils');
  const [newDefaultVal, setNewDefaultVal] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleStartEdit = (pref) => {
    feedback('tick');
    setEditingId(pref.id);
    setEditLabelEn(pref.labelEn);
    setEditLabelMl(pref.labelMl || pref.labelEn);
    setEditIcon(pref.icon || 'Utensils');
  };

  const handleSaveEdit = async (id) => {
    if (!editLabelEn.trim()) return;
    feedback('tick');
    try {
      await updatePreference(id, {
        labelEn: editLabelEn.trim(),
        labelMl: editLabelMl.trim() || editLabelEn.trim(),
        icon: editIcon,
      });
      setEditingId(null);
      feedback('success');
    } catch (err) {
      console.error(err);
      feedback('warning');
    }
  };

  const handleToggleActive = async (pref) => {
    feedback('pop');
    try {
      await updatePreference(pref.id, {
        isActive: !pref.isActive,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreatePreference = async (e) => {
    e.preventDefault();
    if (!newLabelEn.trim()) return;
    setIsSubmitting(true);
    feedback('tick');

    try {
      await addPreference({
        labelEn: newLabelEn.trim(),
        labelMl: newLabelMl.trim() || newLabelEn.trim(),
        icon: newIcon,
        defaultVal: newDefaultVal,
      });

      setNewLabelEn('');
      setNewLabelMl('');
      setNewIcon('Utensils');
      setShowAddForm(false);
      dialog.toast.success(
        'Preference Created',
        `"${newLabelEn.trim()}" was successfully added to dietary preferences.`
      );
    } catch (err) {
      console.error(err);
      dialog.alert({
        type: 'error',
        title: 'Error',
        message: err.message || 'Failed to create preference.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (pref) => {
    const confirmed = await dialog.confirm({
      title: `Delete "${pref.labelEn}"?`,
      message: 'Existing student choices in the database will be preserved safely, but this option will no longer appear on selection menus.',
      icon: 'trash',
      confirmColor: 'rose',
      confirmText: 'Yes, Delete',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await deletePreference(pref.id);
        dialog.toast.success('Deleted', `Removed "${pref.labelEn}".`);
      } catch (err) {
        console.error(err);
        dialog.alert({ type: 'error', title: 'Error', message: 'Failed to delete preference.' });
      }
    }
  };

  const handleMove = async (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= preferences.length) return;
    feedback('tick');

    const copy = [...preferences];
    const temp = copy[index];
    copy[index] = copy[targetIndex];
    copy[targetIndex] = temp;

    const reordered = copy.map((p, idx) => ({ ...p, order: idx + 1 }));
    await savePreferences(reordered);
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
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Dietary & Meal Preferences</h2>
              <p className="text-xs text-emerald-100">
                CRUD canteen dietary options (Beef, Chicken, Fish, Egg, etc.) safely
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
        <div className="p-3.5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {/* Top action */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Active Preferences ({preferences.length})
            </span>
            <button
              onClick={() => {
                feedback('tick');
                setShowAddForm(!showAddForm);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Preference</span>
            </button>
          </div>

          {/* Add Form Drawer */}
          <AnimatePresence>
            {showAddForm && (
              <motion.form
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                onSubmit={handleCreatePreference}
                className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-500/20 space-y-3 overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    New Dietary Preference
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      English Name (e.g. Egg)
                    </label>
                    <input
                      type="text"
                      required
                      value={newLabelEn}
                      onChange={(e) => setNewLabelEn(e.target.value)}
                      placeholder="e.g. Egg / Vegetarian"
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#15201c] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Malayalam Name (മലയാളം)
                    </label>
                    <input
                      type="text"
                      value={newLabelMl}
                      onChange={(e) => setNewLabelMl(e.target.value)}
                      placeholder="ഉദാഹരണം: മുട്ട"
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#15201c] text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="flex-1">
                    <label className="block text-[11px] font-semibold text-gray-700 dark:text-gray-300 mb-1">
                      Icon
                    </label>
                    <select
                      value={newIcon}
                      onChange={(e) => setNewIcon(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#15201c] text-xs font-medium focus:outline-none"
                    >
                      <option value="Utensils">Utensils (Generic)</option>
                      <option value="Drumstick">Drumstick (Poultry/Chicken)</option>
                      <option value="Fish">Fish (Seafood)</option>
                      <option value="Egg">Egg</option>
                      <option value="Leaf">Leaf (Vegetarian)</option>
                      <option value="Apple">Apple / Fruit</option>
                    </select>
                  </div>

                  <div className="pt-5">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
                    >
                      {isSubmitting ? 'Saving...' : 'Create Preference'}
                    </button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Preferences List */}
          <div className="space-y-2">
            {preferences.map((pref, idx) => {
              const isEditing = editingId === pref.id;
              const IconComp = ICON_MAP[pref.icon] || UtensilsCrossed;

              return (
                <div
                  key={pref.id}
                  className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    pref.isActive
                      ? 'bg-gray-50/80 dark:bg-white/5 border-gray-200/80 dark:border-white/10'
                      : 'bg-gray-100/50 dark:bg-white/2 border-dashed border-gray-300 dark:border-white/10 opacity-60'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={editLabelEn}
                        onChange={(e) => setEditLabelEn(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-emerald-400 bg-white dark:bg-[#121c19] text-xs font-semibold"
                        placeholder="English"
                      />
                      <input
                        type="text"
                        value={editLabelMl}
                        onChange={(e) => setEditLabelMl(e.target.value)}
                        className="px-2.5 py-1.5 rounded-xl border border-emerald-400 bg-white dark:bg-[#121c19] text-xs font-semibold"
                        placeholder="Malayalam"
                      />
                      <div className="flex items-center gap-1">
                        <select
                          value={editIcon}
                          onChange={(e) => setEditIcon(e.target.value)}
                          className="px-2 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121c19] text-xs flex-1"
                        >
                          <option value="Utensils">Utensils</option>
                          <option value="Drumstick">Drumstick</option>
                          <option value="Fish">Fish</option>
                          <option value="Egg">Egg</option>
                          <option value="Leaf">Leaf</option>
                          <option value="Apple">Apple</option>
                        </select>
                        <button
                          onClick={() => handleSaveEdit(pref.id)}
                          className="p-1.5 rounded-xl bg-emerald-600 text-white"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="p-1.5 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-gray-900 dark:text-white">
                              {pref.labelEn}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                              ({pref.labelMl || pref.labelEn})
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                              id: {pref.id}
                            </span>
                          </div>
                          <span className="text-[11px] text-gray-400">
                            Default: {pref.defaultVal !== false ? 'Accept (True)' : 'Reject (False)'}
                          </span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5">
                        {/* Move Up/Down */}
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMove(idx, -1)}
                          className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 disabled:opacity-20"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          disabled={idx === preferences.length - 1}
                          onClick={() => handleMove(idx, 1)}
                          className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 text-gray-400 disabled:opacity-20"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit */}
                        <button
                          onClick={() => handleStartEdit(pref)}
                          className="p-1.5 rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 text-gray-600 dark:text-gray-300 transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {/* Toggle Active */}
                        <button
                          onClick={() => handleToggleActive(pref)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                            pref.isActive
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                              : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                          }`}
                        >
                          {pref.isActive ? 'Active' : 'Disabled'}
                        </button>

                        {/* Delete */}
                        <button
                          onClick={() => handleDelete(pref)}
                          className="p-1.5 rounded-xl hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Note */}
        <div className="p-3.5 sm:p-4 bg-gray-50 dark:bg-[#121c19] border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>Changes reflect immediately in Student Portal and Kitchen Reports without data loss.</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs"
          >
            Done
          </button>
        </div>
      </motion.div>
    </div>
  );
}
