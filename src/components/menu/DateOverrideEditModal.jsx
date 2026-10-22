import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Sparkles,
  Utensils,
  Coffee,
  Moon,
  Clock,
  Plus,
  Trash2,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';
import {
  saveDateOverride,
  deleteDateOverride,
  subscribeToDishPresets,
  DISH_PRESETS,
  DEFAULT_WEEKLY_MENU,
} from '../../utils/menuService';
import { formatFriendlyDate } from '../../utils/studentExceptionService';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../../utils/auditLogger';

const DAY_KEYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

const CATEGORY_OPTIONS = ['Veg', 'Non-Veg', 'Egg', 'Special'];

const SLOT_CONFIGS = [
  { key: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'amber' },
  { key: 'lunch', label: 'Lunch', icon: Utensils, color: 'emerald' },
  { key: 'evening', label: 'Evening Tea', icon: Coffee, color: 'blue' },
  { key: 'dinner', label: 'Dinner', icon: Moon, color: 'purple' },
];

export default function DateOverrideEditModal({
  isOpen,
  onClose,
  targetDate,
  existingOverride = null,
  weeklyMenu = DEFAULT_WEEKLY_MENU,
  userEmail = 'admin',
}) {
  const { feedback } = useFeedback();

  // Presets from Firestore
  const [realtimePresets, setRealtimePresets] = useState({});

  // Active form state
  const [dateStr, setDateStr] = useState(targetDate || '');
  const [occasion, setOccasion] = useState('');
  const [isClosed, setIsClosed] = useState(false);
  const [closureReason, setClosureReason] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Slots state
  const [slotsData, setSlotsData] = useState({
    breakfast: { enabled: false, title: '', category: 'Special', timing: '07:00 - 08:30', items: [] },
    lunch: { enabled: false, title: '', category: 'Special', timing: '12:30 - 14:00', items: [] },
    evening: { enabled: false, title: '', category: 'Special', timing: '16:30 - 17:30', items: [] },
    dinner: { enabled: false, title: '', category: 'Special', timing: '20:00 - 21:30', items: [] },
  });

  // Track expanded accordion slot
  const [expandedSlot, setExpandedSlot] = useState('lunch');

  // Side item temp inputs
  const [sideInputs, setSideInputs] = useState({
    breakfast: '',
    lunch: '',
    evening: '',
    dinner: '',
  });

  // Subscribe to real-time dish presets
  useEffect(() => {
    const unsub = subscribeToDishPresets((data) => {
      if (data) setRealtimePresets(data);
    });
    return () => unsub();
  }, []);

  // Compute routine menu for reference
  const routineDayMenu = useMemo(() => {
    if (!dateStr) return null;
    try {
      const [y, m, d] = dateStr.split('-').map(Number);
      const dayIdx = new Date(y, m - 1, d).getDay();
      const dayKey = DAY_KEYS[dayIdx];
      return weeklyMenu[dayKey] || DEFAULT_WEEKLY_MENU[dayKey];
    } catch {
      return null;
    }
  }, [dateStr, weeklyMenu]);

  // Synchronize state when modal opens or targetDate/existingOverride changes
  useEffect(() => {
    if (!isOpen) return;

    const initialDate = targetDate || '';
    setDateStr(initialDate);

    if (existingOverride) {
      setOccasion(existingOverride.occasion || '');
      setIsClosed(Boolean(existingOverride.isClosed));
      setClosureReason(existingOverride.closureReason || '');
      setNote(existingOverride.note || '');

      const initialSlots = {};
      SLOT_CONFIGS.forEach(({ key }) => {
        const slot = existingOverride[key];
        if (slot && (slot.title || slot.category || Array.isArray(slot.items))) {
          initialSlots[key] = {
            enabled: true,
            title: slot.title || '',
            category: slot.category || 'Special',
            timing: slot.timing || (routineDayMenu?.[key]?.timing || ''),
            items: Array.isArray(slot.items) ? [...slot.items] : [],
          };
        } else {
          initialSlots[key] = {
            enabled: false,
            title: routineDayMenu?.[key]?.title || '',
            category: routineDayMenu?.[key]?.category || 'Veg',
            timing: routineDayMenu?.[key]?.timing || '',
            items: Array.isArray(routineDayMenu?.[key]?.items) ? [...routineDayMenu[key].items] : [],
          };
        }
      });
      setSlotsData(initialSlots);
    } else {
      // New override default setup
      setOccasion('');
      setIsClosed(false);
      setClosureReason('');
      setNote('');

      const defaultSlots = {};
      SLOT_CONFIGS.forEach(({ key }) => {
        defaultSlots[key] = {
          enabled: key === 'lunch', // default enable lunch for a feast
          title: '',
          category: 'Special',
          timing: routineDayMenu?.[key]?.timing || '',
          items: [],
        };
      });
      setSlotsData(defaultSlots);
      setExpandedSlot('lunch');
    }
  }, [isOpen, targetDate, existingOverride, routineDayMenu]);

  if (!isOpen) return null;

  // Toggle slot active state
  const handleToggleSlotEnabled = (slotKey) => {
    feedback('tick');
    setSlotsData((prev) => {
      const current = prev[slotKey] || {};
      const nextEnabled = !current.enabled;
      return {
        ...prev,
        [slotKey]: {
          ...current,
          enabled: nextEnabled,
          // Pre-populate with routine title if empty and turning on
          title: nextEnabled && !current.title ? (routineDayMenu?.[slotKey]?.title || '') : current.title,
          category: nextEnabled && !current.category ? 'Special' : current.category,
        },
      };
    });
    setExpandedSlot(slotKey);
  };

  // Update specific field in a slot
  const handleUpdateSlot = (slotKey, field, value) => {
    setSlotsData((prev) => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        [field]: value,
      },
    }));
  };

  // Add side item
  const handleAddSideItem = (slotKey) => {
    const text = (sideInputs[slotKey] || '').trim();
    if (!text) return;
    feedback('tick');
    setSlotsData((prev) => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        items: [...(prev[slotKey]?.items || []), text],
      },
    }));
    setSideInputs((prev) => ({ ...prev, [slotKey]: '' }));
  };

  // Remove side item
  const handleRemoveSideItem = (slotKey, itemIdx) => {
    feedback('tick');
    setSlotsData((prev) => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        items: (prev[slotKey]?.items || []).filter((_, idx) => idx !== itemIdx),
      },
    }));
  };

  // Apply preset to slot
  const handleApplyPreset = (slotKey, preset) => {
    feedback('pop');
    setSlotsData((prev) => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        enabled: true,
        title: preset.title || '',
        category: preset.category || 'Special',
        items: Array.isArray(preset.items) ? [...preset.items] : [],
      },
    }));
  };

  // Get available presets for slot
  const getPresetsForSlot = (slotKey) => {
    const list = realtimePresets[slotKey] || DISH_PRESETS[slotKey] || [];
    return list;
  };

  // Save handler
  const handleSave = async (e) => {
    e?.preventDefault();
    if (!dateStr) {
      dialog.alert({
        type: 'warning',
        title: 'Date Required',
        message: 'Please choose a target date for the menu override.',
      });
      return;
    }

    if (!occasion.trim() && !isClosed) {
      dialog.alert({
        type: 'warning',
        title: 'Occasion Required',
        message: 'Please specify an occasion name or title (e.g. Special Feast, Annual Festival).',
      });
      return;
    }

    try {
      setSaving(true);
      feedback('tick');

      const payload = {
        date: dateStr,
        occasion: occasion.trim() || (isClosed ? 'Canteen Closed' : 'Special Dining Day'),
        isClosed: Boolean(isClosed),
        closureReason: isClosed ? closureReason.trim() : '',
        note: note.trim(),
        updatedAt: new Date().toISOString(),
        updatedBy: userEmail,
      };

      if (!isClosed) {
        SLOT_CONFIGS.forEach(({ key }) => {
          const slot = slotsData[key];
          if (slot && slot.enabled && slot.title.trim()) {
            payload[key] = {
              title: slot.title.trim(),
              category: slot.category || 'Special',
              timing: slot.timing || '',
              items: Array.isArray(slot.items) ? slot.items.filter((it) => it && it.trim()) : [],
            };
          } else {
            payload[key] = null;
          }
        });
      } else {
        // If closed, clear all slots
        SLOT_CONFIGS.forEach(({ key }) => {
          payload[key] = null;
        });
      }

      await saveDateOverride(dateStr, payload, userEmail);

      await logAuditEvent({
        category: AUDIT_CATEGORIES.MENU,
        action: 'MENU_OVERRIDE_SAVE',
        severity: AUDIT_SEVERITIES.NOTICE,
        target: { type: 'date_override', id: dateStr, label: `Date Override ${dateStr}` },
        changes: {
          diffSummary: `Saved date override for ${dateStr}: ${payload.occasion}`,
          after: payload,
        },
        metadata: {
          occasion: payload.occasion,
          isClosed: payload.isClosed,
        },
      });

      feedback('success');
      dialog.toast.success('Override Saved', `Custom dining schedule for ${formatFriendlyDate(dateStr, true)} registered.`);
      onClose();
    } catch (err) {
      console.error('Error saving date override:', err);
      dialog.alert({
        type: 'error',
        title: 'Save Failed',
        message: 'Could not save date override. Check your network or permissions.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Revert / Delete Override
  const handleDelete = async () => {
    if (!existingOverride && !dateStr) return;
    const confirmed = await dialog.confirm({
      title: `Revert ${formatFriendlyDate(dateStr, true)} to Routine?`,
      message: 'This will remove the special feast override and restore standard weekly scheduled meals for this date.',
      icon: 'trash',
      confirmColor: 'rose',
      confirmText: 'Revert to Routine',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        setSaving(true);
        feedback('tick');
        await deleteDateOverride(dateStr);

        await logAuditEvent({
          category: AUDIT_CATEGORIES.MENU,
          action: 'MENU_OVERRIDE_DELETE',
          severity: AUDIT_SEVERITIES.WARNING,
          target: { type: 'date_override', id: dateStr, label: `Date Override ${dateStr}` },
          changes: {
            diffSummary: `Removed date override for ${dateStr}`,
          },
        });

        feedback('success');
        dialog.toast.success('Reverted', `Schedule for ${dateStr} reverted to standard weekly routine.`);
        onClose();
      } catch (err) {
        console.error('Error deleting override:', err);
        dialog.alert({
          type: 'error',
          title: 'Delete Failed',
          message: 'Could not delete date override.',
        });
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden my-6 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                {existingOverride ? 'Edit Feast & Date Override' : 'Configure Feast / Date Override'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {dateStr ? formatFriendlyDate(dateStr, true) : 'Select date and meal schedules'}
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              feedback('tick');
              onClose();
            }}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
          {/* Top metadata grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Target Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dateStr}
                  onChange={(e) => setDateStr(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Occasion / Feast Name *
              </label>
              <input
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g. Annual Grand Feast, Eid Special Biriyani"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500 placeholder-gray-400"
                required={!isClosed}
              />
            </div>
          </div>

          {/* Canteen Holiday / Closure Toggle */}
          <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-rose-500 text-white">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                  Canteen Closed / Holiday for this Date
                </p>
                <p className="text-[11px] text-rose-600 dark:text-rose-400">
                  Overrides routine schedule and marks canteen as closed
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setIsClosed(!isClosed);
              }}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isClosed ? 'bg-rose-600' : 'bg-gray-300 dark:bg-white/20'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isClosed ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {isClosed ? (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Closure Reason / Notice
              </label>
              <input
                type="text"
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                placeholder="e.g. Ramadan Vacation, Campus Maintenance, National Holiday"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>
          ) : (
            /* Slots Accordion */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Utensils className="w-3.5 h-3.5 text-purple-500" />
                  Meal Slots to Override (Choose which meals to customize)
                </label>
                <span className="text-[11px] text-gray-400">
                  Unselected slots remain standard weekly routine
                </span>
              </div>

              {SLOT_CONFIGS.map(({ key, label, icon: Icon, color }) => {
                const slot = slotsData[key] || {};
                const isExpanded = expandedSlot === key;
                const presets = getPresetsForSlot(key);
                const routineDish = routineDayMenu?.[key]?.title || 'Standard Routine';

                return (
                  <div
                    key={key}
                    className={`rounded-2xl border transition-all ${
                      slot.enabled
                        ? 'border-purple-300 dark:border-purple-500/40 bg-purple-50/20 dark:bg-purple-950/10'
                        : 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 opacity-80'
                    }`}
                  >
                    {/* Slot Header Bar */}
                    <div className="p-3.5 flex items-center justify-between gap-3">
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <input
                          type="checkbox"
                          checked={Boolean(slot.enabled)}
                          onChange={() => handleToggleSlotEnabled(key)}
                          id={`slot-check-${key}`}
                          className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                        />
                        <label
                          htmlFor={`slot-check-${key}`}
                          className="flex items-center space-x-2 cursor-pointer select-none min-w-0"
                        >
                          <Icon className={`w-4 h-4 text-${color}-500 shrink-0`} />
                          <span className="font-bold text-sm text-gray-900 dark:text-white">
                            {label}
                          </span>
                          {!slot.enabled && (
                            <span className="text-xs text-gray-400 truncate hidden sm:inline">
                              (Routine: {routineDish})
                            </span>
                          )}
                          {slot.enabled && slot.title && (
                            <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 truncate">
                              • {slot.title}
                            </span>
                          )}
                        </label>
                      </div>

                      <div className="flex items-center space-x-2">
                        {slot.enabled && (
                          <button
                            type="button"
                            onClick={() => setExpandedSlot(isExpanded ? null : key)}
                            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-medium flex items-center gap-1"
                          >
                            <span>{isExpanded ? 'Hide' : 'Configure'}</span>
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Slot Expanded Fields */}
                    {slot.enabled && isExpanded && (
                      <div className="px-4 pb-4 pt-1 border-t border-purple-100 dark:border-purple-500/20 space-y-3">
                        {/* Quick Presets Picker */}
                        {presets.length > 0 && (
                          <div>
                            <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1.5">
                              Quick Supply Presets:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {presets.slice(0, 6).map((preset, pIdx) => (
                                <button
                                  key={pIdx}
                                  type="button"
                                  onClick={() => handleApplyPreset(key, preset)}
                                  className="px-2 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors"
                                >
                                  {preset.title}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div className="sm:col-span-2">
                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                              Dish Name *
                            </label>
                            <input
                              type="text"
                              value={slot.title || ''}
                              onChange={(e) => handleUpdateSlot(key, 'title', e.target.value)}
                              placeholder={`e.g. Special ${label} Dish`}
                              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-500/30 text-gray-900 dark:text-white text-xs font-semibold"
                            />
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                              Category
                            </label>
                            <select
                              value={slot.category || 'Special'}
                              onChange={(e) => handleUpdateSlot(key, 'category', e.target.value)}
                              className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-500/30 text-gray-900 dark:text-white text-xs font-semibold"
                            >
                              {CATEGORY_OPTIONS.map((cat) => (
                                <option key={cat} value={cat}>
                                  {cat}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Timing */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                            Service Timing Window
                          </label>
                          <input
                            type="text"
                            value={slot.timing || ''}
                            onChange={(e) => handleUpdateSlot(key, 'timing', e.target.value)}
                            placeholder="e.g. 12:30 - 14:00"
                            className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-500/30 text-gray-900 dark:text-white text-xs"
                          />
                        </div>

                        {/* Side Components */}
                        <div>
                          <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                            Side Items & Condiments
                          </label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={sideInputs[key] || ''}
                              onChange={(e) => setSideInputs({ ...sideInputs, [key]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddSideItem(key);
                                }
                              }}
                              placeholder="e.g. Chicken Roast, Onion Salad, Pickle"
                              className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-500/30 text-gray-900 dark:text-white text-xs"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddSideItem(key)}
                              className="px-3 py-1.5 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700"
                            >
                              Add Side
                            </button>
                          </div>

                          {Array.isArray(slot.items) && slot.items.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {slot.items.map((item, itIdx) => (
                                <span
                                  key={itIdx}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300 text-xs font-semibold"
                                >
                                  {item}
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveSideItem(key, itIdx)}
                                    className="hover:text-rose-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Special Day Note */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Dining Hall Notice / Chef Note (Optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Tokens must be booked by 10 AM. Served at Central Dining Hall."
              className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-3">
            {existingOverride ? (
              <button
                type="button"
                onClick={handleDelete}
                disabled={saving}
                className="px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-bold text-xs hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Revert to Routine</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  onClose();
                }}
                disabled={saving}
                className="px-4 py-2.5 rounded-2xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Saving Override...' : 'Save Date Override'}</span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
