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
  AlertTriangle,
  CheckCircle2,
  Layers,
  ChevronDown,
  ChevronUp,
  Filter,
  CalendarDays,
  ListFilter,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';
import {
  saveDateRangeOverride,
  saveMultipleDatesOverride,
  subscribeToDishPresets,
  DISH_PRESETS,
} from '../../utils/menuService';
import { getTodayISTDate, addDaysToDate, formatFriendlyDate } from '../../utils/studentExceptionService';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../../utils/auditLogger';

const DAY_OPTIONS = [
  { key: 'all', label: 'All Days' },
  { key: 'fridays', label: 'Fridays Only' },
  { key: 'weekdays', label: 'Weekdays (Mo-Th)' },
  { key: 'weekends', label: 'Weekends (Fr-Sa)' },
  { key: 'custom', label: 'Custom Days' },
];

const WEEKDAY_KEYS = [
  { key: 'su', label: 'Sun', dayIdx: 0 },
  { key: 'mo', label: 'Mon', dayIdx: 1 },
  { key: 'tu', label: 'Tue', dayIdx: 2 },
  { key: 'we', label: 'Wed', dayIdx: 3 },
  { key: 'th', label: 'Thu', dayIdx: 4 },
  { key: 'fr', label: 'Fri', dayIdx: 5 },
  { key: 'sa', label: 'Sat', dayIdx: 6 },
];

const CATEGORY_OPTIONS = ['Veg', 'Non-Veg', 'Egg', 'Special'];

const SLOT_CONFIGS = [
  { key: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'amber', defaultTiming: '07:00 - 08:30' },
  { key: 'lunch', label: 'Lunch', icon: Utensils, color: 'emerald', defaultTiming: '12:30 - 14:00' },
  { key: 'evening', label: 'Evening Tea', icon: Coffee, color: 'blue', defaultTiming: '16:30 - 17:30' },
  { key: 'dinner', label: 'Dinner', icon: Moon, color: 'purple', defaultTiming: '20:00 - 21:30' },
];

export default function RangedMenuModal({
  isOpen,
  onClose,
  userEmail = 'admin',
}) {
  const { feedback } = useFeedback();
  const todayIST = getTodayISTDate();

  // Mode: 'range' (Start -> End date with day filter) or 'multi' (Arbitrary date picker)
  const [selectionMode, setSelectionMode] = useState('range');

  // Range inputs
  const [startDate, setStartDate] = useState(todayIST);
  const [endDate, setEndDate] = useState(addDaysToDate(todayIST, 7));
  const [dayFilter, setDayFilter] = useState('all');
  const [customDays, setCustomDays] = useState(['fr']); // For custom days filter

  // Multi-date arbitrary inputs
  const [multiDates, setMultiDates] = useState([]);
  const [pickerDateInput, setPickerDateInput] = useState('');

  // Occasion & closure
  const [occasion, setOccasion] = useState('');
  const [isClosed, setIsClosed] = useState(false);
  const [closureReason, setClosureReason] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  // Slots to apply
  const [slotsData, setSlotsData] = useState({
    breakfast: { enabled: false, title: '', category: 'Special', timing: '07:00 - 08:30', items: [] },
    lunch: { enabled: true, title: '', category: 'Special', timing: '12:30 - 14:00', items: [] },
    evening: { enabled: false, title: '', category: 'Special', timing: '16:30 - 17:30', items: [] },
    dinner: { enabled: false, title: '', category: 'Special', timing: '20:00 - 21:30', items: [] },
  });
  const [expandedSlot, setExpandedSlot] = useState('lunch');
  const [sideInputs, setSideInputs] = useState({ breakfast: '', lunch: '', evening: '', dinner: '' });

  // Real-time presets
  const [realtimePresets, setRealtimePresets] = useState({});

  useEffect(() => {
    const unsub = subscribeToDishPresets((data) => {
      if (data) setRealtimePresets(data);
    });
    return () => unsub();
  }, []);

  // Compute targeted dates list
  const targetedDates = useMemo(() => {
    if (selectionMode === 'multi') {
      return [...multiDates].sort();
    }

    if (!startDate || !endDate || startDate > endDate) return [];

    const dates = [];
    const [sy, sm, sd] = startDate.split('-').map(Number);
    const [ey, em, ed] = endDate.split('-').map(Number);
    const curr = new Date(sy, sm - 1, sd);
    const end = new Date(ey, em - 1, ed);

    while (curr <= end) {
      const y = curr.getFullYear();
      const m = String(curr.getMonth() + 1).padStart(2, '0');
      const d = String(curr.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${d}`;
      const dayOfWeek = curr.getDay(); // 0 is Sun, 5 is Fri, 6 is Sat

      let matches = false;
      if (dayFilter === 'all') matches = true;
      else if (dayFilter === 'fridays') matches = dayOfWeek === 5;
      else if (dayFilter === 'weekdays') matches = dayOfWeek >= 1 && dayOfWeek <= 4;
      else if (dayFilter === 'weekends') matches = dayOfWeek === 5 || dayOfWeek === 6;
      else if (dayFilter === 'custom') {
        const dayKey = WEEKDAY_KEYS.find((k) => k.dayIdx === dayOfWeek)?.key;
        matches = customDays.includes(dayKey);
      }

      if (matches) dates.push(dateStr);
      curr.setDate(curr.getDate() + 1);
    }
    return dates;
  }, [selectionMode, multiDates, startDate, endDate, dayFilter, customDays]);

  if (!isOpen) return null;

  // Toggle custom day checkbox
  const handleToggleCustomDay = (key) => {
    feedback('tick');
    setCustomDays((prev) =>
      prev.includes(key) ? prev.filter((d) => d !== key) : [...prev, key]
    );
  };

  // Add date to multi-date list
  const handleAddMultiDate = () => {
    if (!pickerDateInput) return;
    if (multiDates.includes(pickerDateInput)) {
      dialog.toast.info('Already Added', 'This date is already in the target list.');
      return;
    }
    feedback('tick');
    setMultiDates((prev) => [...prev, pickerDateInput]);
    setPickerDateInput('');
  };

  // Remove date from multi-date list
  const handleRemoveMultiDate = (target) => {
    feedback('tick');
    setMultiDates((prev) => prev.filter((d) => d !== target));
  };

  // Toggle slot enabled
  const handleToggleSlotEnabled = (slotKey) => {
    feedback('tick');
    setSlotsData((prev) => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        enabled: !prev[slotKey].enabled,
      },
    }));
    setExpandedSlot(slotKey);
  };

  // Update slot field
  const handleUpdateSlot = (slotKey, field, val) => {
    setSlotsData((prev) => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        [field]: val,
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
  const handleRemoveSideItem = (slotKey, idx) => {
    feedback('tick');
    setSlotsData((prev) => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        items: (prev[slotKey]?.items || []).filter((_, i) => i !== idx),
      },
    }));
  };

  // Apply preset
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

  const getPresetsForSlot = (slotKey) => {
    return realtimePresets[slotKey] || DISH_PRESETS[slotKey] || [];
  };

  // Save Bulk Override Handler
  const handleSaveBulk = async (e) => {
    e?.preventDefault();

    if (targetedDates.length === 0) {
      dialog.alert({
        type: 'warning',
        title: 'No Dates Selected',
        message: 'Your current range or selection criteria resulted in 0 target dates. Please adjust dates or filters.',
      });
      return;
    }

    if (!occasion.trim() && !isClosed) {
      dialog.alert({
        type: 'warning',
        title: 'Occasion Required',
        message: 'Please specify an occasion name or batch title for this schedule override.',
      });
      return;
    }

    const enabledSlots = SLOT_CONFIGS.filter(({ key }) => slotsData[key]?.enabled);
    if (!isClosed && enabledSlots.length === 0) {
      dialog.alert({
        type: 'warning',
        title: 'Select at least one meal slot',
        message: 'Please check and configure at least one meal slot to apply (or mark canteen as closed).',
      });
      return;
    }

    const confirmed = await dialog.confirm({
      title: `Apply Override to ${targetedDates.length} Days?`,
      message: `This will overwrite menus for ${targetedDates.length} scheduled dates (${targetedDates[0]} to ${targetedDates[targetedDates.length - 1]}). Proceed?`,
      icon: 'sparkles',
      confirmColor: 'purple',
      confirmText: `Apply to ${targetedDates.length} Dates`,
    });

    if (!confirmed) return;

    try {
      setSaving(true);
      feedback('tick');

      const overridePayload = {
        occasion: occasion.trim() || (isClosed ? 'Canteen Closed' : 'Special Dining Schedule'),
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
            overridePayload[key] = {
              title: slot.title.trim(),
              category: slot.category || 'Special',
              timing: slot.timing || '',
              items: Array.isArray(slot.items) ? slot.items.filter((it) => it && it.trim()) : [],
            };
          } else {
            overridePayload[key] = null;
          }
        });
      } else {
        SLOT_CONFIGS.forEach(({ key }) => {
          overridePayload[key] = null;
        });
      }

      const res = await saveMultipleDatesOverride(targetedDates, overridePayload, userEmail);

      await logAuditEvent({
        category: AUDIT_CATEGORIES.MENU,
        action: 'MENU_BULK_OVERRIDE_SAVE',
        severity: AUDIT_SEVERITIES.NOTICE,
        target: { type: 'bulk_date_override', id: `${targetedDates.length}_dates`, label: `${targetedDates.length} Dates Override` },
        changes: {
          diffSummary: `Applied bulk override "${overridePayload.occasion}" across ${res.count} dates`,
          datesAffected: targetedDates,
          payload: overridePayload,
        },
      });

      feedback('success');
      dialog.toast.success(
        'Bulk Schedule Saved!',
        `Successfully applied override across ${res.count} days in the canteen schedule.`
      );
      onClose();
    } catch (err) {
      console.error('Error applying bulk menu override:', err);
      dialog.alert({
        type: 'error',
        title: 'Batch Save Failed',
        message: 'Could not apply bulk date overrides. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ type: 'spring', duration: 0.3 }}
        className="relative w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden my-6 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-purple-600 text-white shadow-lg shadow-purple-500/20">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                Ranged & Multiple Dates Menu Manager
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Bulk overwrite menus across date ranges, specific weekdays, or custom date lists
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

        {/* Scrollable Form Body */}
        <form onSubmit={handleSaveBulk} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Mode Switcher */}
          <div className="flex p-1 bg-gray-100 dark:bg-white/5 rounded-2xl max-w-md mx-auto">
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setSelectionMode('range');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                selectionMode === 'range'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>Date Range + Day Filter</span>
            </button>
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setSelectionMode('multi');
              }}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                selectionMode === 'multi'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <ListFilter className="w-4 h-4" />
              <span>Multi-Select Arbitrary Dates</span>
            </button>
          </div>

          {/* Range Mode Controls */}
          {selectionMode === 'range' ? (
            <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-500/30 text-gray-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    End Date *
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    min={startDate}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-500/30 text-gray-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>
              </div>

              {/* Day of Week Filter */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-purple-500" />
                  Day of Week Applicability
                </label>
                <div className="flex flex-wrap gap-2">
                  {DAY_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        setDayFilter(opt.key);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        dayFilter === opt.key
                          ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                          : 'bg-white dark:bg-zinc-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-purple-300'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Custom days checkboxes */}
                {dayFilter === 'custom' && (
                  <div className="mt-3 flex flex-wrap gap-2 pt-2 border-t border-purple-200/40 dark:border-purple-800/40">
                    {WEEKDAY_KEYS.map(({ key, label }) => {
                      const isSelected = customDays.includes(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleToggleCustomDay(key)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors border ${
                            isSelected
                              ? 'bg-purple-700 text-white border-purple-700'
                              : 'bg-white dark:bg-zinc-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Multi-Date Mode Controls */
            <div className="p-4 rounded-2xl bg-purple-50/40 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40 space-y-3">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                Pick Individual Dates to Include
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={pickerDateInput}
                  onChange={(e) => setPickerDateInput(e.target.value)}
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-500/30 text-gray-900 dark:text-white text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddMultiDate}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Date</span>
                </button>
              </div>

              {/* Multi-dates list tags */}
              {multiDates.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {multiDates.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-zinc-800 border border-purple-200 dark:border-purple-500/40 text-purple-700 dark:text-purple-300 text-xs font-bold"
                    >
                      {formatFriendlyDate(d, true)}
                      <button
                        type="button"
                        onClick={() => handleRemoveMultiDate(d)}
                        className="p-0.5 rounded text-gray-400 hover:text-rose-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic">No individual dates added yet. Pick dates above.</p>
              )}
            </div>
          )}

          {/* Dynamic Target Dates Count Badge */}
          <div className="flex items-center justify-between px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold">
            <span className="text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-500" />
              Targeted Dates in this Operation:
            </span>
            <span className="px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 font-extrabold text-xs">
              {targetedDates.length} Days Selected
            </span>
          </div>

          {/* Occasion & Closure Details */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Batch Occasion / Title *
              </label>
              <input
                type="text"
                value={occasion}
                onChange={(e) => setOccasion(e.target.value)}
                placeholder="e.g. Ramadan Special Iftar & Dinner, Friday Grand Feast Series"
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-500"
                required={!isClosed}
              />
            </div>

            {/* Holiday / Canteen Closure Toggle */}
            <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-xl bg-rose-500 text-white">
                  <AlertTriangle className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-rose-900 dark:text-rose-200">
                    Mark Canteen as Closed / Holiday for All Selected Dates
                  </p>
                  <p className="text-[11px] text-rose-600 dark:text-rose-400">
                    Wipes meal slots and flags dates as Canteen Closed across the range
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
                  Closure Reason / Public Notice
                </label>
                <input
                  type="text"
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  placeholder="e.g. End of Semester Break, Campus Maintenance"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm"
                />
              </div>
            ) : (
              /* Meal Slots Configuration */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Utensils className="w-3.5 h-3.5 text-purple-500" />
                    Meal Slots to Overwrite
                  </label>
                  <span className="text-[11px] text-gray-400">
                    Check the slots to apply across all {targetedDates.length} selected days
                  </span>
                </div>

                {SLOT_CONFIGS.map(({ key, label, icon: Icon, color, defaultTiming }) => {
                  const slot = slotsData[key] || {};
                  const isExpanded = expandedSlot === key;
                  const presets = getPresetsForSlot(key);

                  return (
                    <div
                      key={key}
                      className={`rounded-2xl border transition-all ${
                        slot.enabled
                          ? 'border-purple-300 dark:border-purple-500/40 bg-purple-50/20 dark:bg-purple-950/10'
                          : 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 opacity-80'
                      }`}
                    >
                      <div className="p-3.5 flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <input
                            type="checkbox"
                            checked={Boolean(slot.enabled)}
                            onChange={() => handleToggleSlotEnabled(key)}
                            id={`ranged-slot-${key}`}
                            className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                          />
                          <label
                            htmlFor={`ranged-slot-${key}`}
                            className="flex items-center space-x-2 cursor-pointer select-none min-w-0"
                          >
                            <Icon className={`w-4 h-4 text-${color}-500 shrink-0`} />
                            <span className="font-bold text-sm text-gray-900 dark:text-white">
                              {label}
                            </span>
                            {slot.enabled && slot.title && (
                              <span className="text-xs font-semibold text-purple-600 dark:text-purple-400 truncate">
                                • {slot.title}
                              </span>
                            )}
                          </label>
                        </div>

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

                      {slot.enabled && isExpanded && (
                        <div className="px-4 pb-4 pt-1 border-t border-purple-100 dark:border-purple-500/20 space-y-3">
                          {presets.length > 0 && (
                            <div>
                              <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block mb-1.5">
                                Quick Presets:
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
                                required={slot.enabled}
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

                          <div>
                            <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-300 mb-1">
                              Service Timing Window
                            </label>
                            <input
                              type="text"
                              value={slot.timing || defaultTiming}
                              onChange={(e) => handleUpdateSlot(key, 'timing', e.target.value)}
                              placeholder="e.g. 12:30 - 14:00"
                              className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 border border-purple-200 dark:border-purple-500/30 text-gray-900 dark:text-white text-xs"
                            />
                          </div>

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
                                placeholder="e.g. Chicken Roast, Pickle, Tea"
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

            {/* Public Note */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Notice / Chef Note (Optional)
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Special menu applied across all designated examination days."
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">
              Affects {targetedDates.length} calendar dates atomically
            </span>
            <div className="flex items-center space-x-2 ml-auto">
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
                disabled={saving || targetedDates.length === 0}
                className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-purple-500/20 flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>
                  {saving
                    ? 'Applying Batch Override...'
                    : `Apply Override to ${targetedDates.length} Days`}
                </span>
              </button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
