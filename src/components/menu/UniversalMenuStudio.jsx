import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  Sparkles,
  Calendar,
  Clock,
  Printer,
  RotateCcw,
  Save,
  Copy,
  ArrowLeft,
  ArrowRightLeft,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ChevronRight,
  ShieldCheck,
  BookmarkPlus,
  Layers,
  Eraser,
  Sliders,
  CalendarDays,
  Search,
  Filter,
  Check,
  X,
  Bookmark,
  ChevronDown,
  ChevronUp,
  Tag,
  Eye,
  Info,
} from 'lucide-react';
import { AuthContext } from '../../store/AuthContext';
import { dialog } from '../../utils/dialog';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { useWorldTime } from '../../utils/time';
import {
  subscribeToWeeklyMenu,
  saveWeeklyMenu,
  saveDayMenu,
  subscribeToDefaultTemplate,
  saveDefaultTemplate,
  resetWeeklyMenuToDefault,
  resetMenuToEmpty,
  clearDayMenu,
  subscribeToDateOverrides,
  saveDateOverride,
  deleteDateOverride,
  deleteDateOverrides,
  saveDateRangeOverride,
  subscribeToDishPresets,
  addDishPreset,
  updateDishPreset,
  deleteDishPreset,
  DEFAULT_WEEKLY_MENU,
} from '../../utils/menuService';
import {
  getTodayISTDate,
  addDaysToDate,
  formatFriendlyDate,
  getDayOfWeekShort,
} from '../../utils/studentExceptionService';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../../utils/auditLogger';

const DAY_KEYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

const DAY_NAMES = {
  su: 'Sunday',
  mo: 'Monday',
  tu: 'Tuesday',
  we: 'Wednesday',
  th: 'Thursday',
  fr: 'Friday',
  sa: 'Saturday',
};

const CATEGORIES = [
  { key: 'Veg', label: 'Veg', badgeClass: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60' },
  { key: 'Non-Veg', label: 'Non-Veg', badgeClass: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700/60' },
  { key: 'Egg', label: 'Egg', badgeClass: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/60' },
  { key: 'Special', label: 'Special Feast', badgeClass: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-700/60' },
];

const SLOT_CONFIGS = [
  { key: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'amber', defaultTiming: '07:00 AM - 08:30 AM' },
  { key: 'lunch', label: 'Lunch', icon: Utensils, color: 'emerald', defaultTiming: '12:30 PM - 02:00 PM' },
  { key: 'evening', label: 'Evening Tea', icon: Coffee, color: 'blue', defaultTiming: '04:30 PM - 05:30 PM' },
  { key: 'dinner', label: 'Dinner', icon: Utensils, color: 'purple', defaultTiming: '08:30 PM - 09:30 PM' },
];

const createEmptySlot = (defaultTiming = '') => ({
  title: '',
  items: [],
  category: 'Veg',
  timing: defaultTiming,
  isAvailable: true,
  isArchived: false,
});

export default function UniversalMenuStudio() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const { dayShort } = useWorldTime('Asia/Kolkata');

  // Primary Workspace Mode: 'live' (Active Weekly Menu) | 'template' (Custom Standard Template) | 'calendar' (Matrix Overview)
  const [studioMode, setStudioMode] = useState('live');

  // Universal Scope: 'single_day' | 'bulk_days' | 'calendar_date' | 'date_range'
  const [scope, setScope] = useState('single_day');

  // Schedules state from Firestore
  const [weeklyMenu, setWeeklyMenu] = useState(DEFAULT_WEEKLY_MENU);
  const [defaultTemplate, setDefaultTemplate] = useState(DEFAULT_WEEKLY_MENU);
  const [overrides, setOverrides] = useState({});
  const [presetsMap, setPresetsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Scope Target Parameters
  const [selectedDayKey, setSelectedDayKey] = useState('fr');
  const [bulkDays, setBulkDays] = useState(['mo', 'tu', 'we', 'th', 'fr']);
  const todayStr = useMemo(() => getTodayISTDate(), []);
  const [targetDate, setTargetDate] = useState(todayStr);
  const [rangeStart, setRangeStart] = useState(todayStr);
  const [rangeEnd, setRangeEnd] = useState(addDaysToDate(todayStr, 6));
  const [rangeDayFilter, setRangeDayFilter] = useState('all'); // 'all' | 'fridays' | 'weekdays' | 'weekends'

  // Metadata for Feast & Closure
  const [occasion, setOccasion] = useState('');
  const [isClosedDay, setIsClosedDay] = useState(false);
  const [closureReason, setClosureReason] = useState('');

  // Active Meal Canvas Form State (4 Slots)
  const [slotData, setSlotData] = useState({
    breakfast: createEmptySlot('07:00 AM - 08:30 AM'),
    lunch: createEmptySlot('12:30 PM - 02:00 PM'),
    evening: createEmptySlot('04:30 PM - 05:30 PM'),
    dinner: createEmptySlot('08:30 PM - 09:30 PM'),
  });

  // Presets Shelf & Management Drawer State
  const [presetsShelfOpen, setPresetsShelfOpen] = useState(false);
  const [presetSearch, setPresetSearch] = useState('');
  const [activePresetSlot, setActivePresetSlot] = useState('breakfast');
  const [editingPreset, setEditingPreset] = useState(null);
  const [newPresetForm, setNewPresetForm] = useState({ title: '', itemsStr: '', category: 'Veg' });
  const [isAddingPreset, setIsAddingPreset] = useState(false);

  // Sync initial day from world clock
  useEffect(() => {
    if (dayShort && DAY_KEYS.includes(dayShort)) {
      setSelectedDayKey(dayShort);
    }
  }, [dayShort]);

  // Firestore Subscriptions
  useEffect(() => {
    setLoading(true);
    const unsubWeekly = subscribeToWeeklyMenu((data) => {
      if (data) setWeeklyMenu(data);
      setLoading(false);
    });
    const unsubTemplate = subscribeToDefaultTemplate((data) => {
      if (data) setDefaultTemplate(data);
    });
    const unsubOverrides = subscribeToDateOverrides((data) => {
      if (data) setOverrides(data || {});
    });
    const unsubPresets = subscribeToDishPresets((data) => {
      if (data) setPresetsMap(data || {});
    });

    return () => {
      unsubWeekly();
      unsubTemplate();
      unsubOverrides();
      unsubPresets();
    };
  }, []);

  // Populate active canvas whenever Scope or Scope Target changes
  useEffect(() => {
    if (scope === 'single_day') {
      const source = studioMode === 'template' ? defaultTemplate : weeklyMenu;
      const dayData = source[selectedDayKey] || {};
      setSlotData({
        breakfast: dayData.breakfast ? { ...dayData.breakfast } : createEmptySlot('07:00 AM - 08:30 AM'),
        lunch: dayData.lunch ? { ...dayData.lunch } : createEmptySlot('12:30 PM - 02:00 PM'),
        evening: dayData.evening ? { ...dayData.evening } : createEmptySlot('04:30 PM - 05:30 PM'),
        dinner: dayData.dinner ? { ...dayData.dinner } : createEmptySlot('08:30 PM - 09:30 PM'),
      });
      setIsClosedDay(Boolean(dayData.isArchived || dayData.isClosed));
      setClosureReason(dayData.closureReason || dayData.archiveReason || '');
      setOccasion(dayData.note || '');
    } else if (scope === 'calendar_date') {
      const ovr = overrides[targetDate];
      if (ovr) {
        setSlotData({
          breakfast: ovr.breakfast ? { ...ovr.breakfast } : createEmptySlot('07:00 AM - 08:30 AM'),
          lunch: ovr.lunch ? { ...ovr.lunch } : createEmptySlot('12:30 PM - 02:00 PM'),
          evening: ovr.evening ? { ...ovr.evening } : createEmptySlot('04:30 PM - 05:30 PM'),
          dinner: ovr.dinner ? { ...ovr.dinner } : createEmptySlot('08:30 PM - 09:30 PM'),
        });
        setIsClosedDay(Boolean(ovr.isHoliday || ovr.isClosed));
        setClosureReason(ovr.holidayReason || ovr.closureReason || '');
        setOccasion(ovr.occasion || '');
      } else {
        const dow = getDayOfWeekShort(targetDate);
        const routine = weeklyMenu[dow] || {};
        setSlotData({
          breakfast: routine.breakfast ? { ...routine.breakfast } : createEmptySlot('07:00 AM - 08:30 AM'),
          lunch: routine.lunch ? { ...routine.lunch } : createEmptySlot('12:30 PM - 02:00 PM'),
          evening: routine.evening ? { ...routine.evening } : createEmptySlot('04:30 PM - 05:30 PM'),
          dinner: routine.dinner ? { ...routine.dinner } : createEmptySlot('08:30 PM - 09:30 PM'),
        });
        setIsClosedDay(false);
        setClosureReason('');
        setOccasion('');
      }
    }
  }, [scope, selectedDayKey, targetDate, weeklyMenu, defaultTemplate, overrides, studioMode]);

  // Auth gate check
  const checkAuth = useCallback(() => {
    if (!user) {
      dialog.alert({
        type: 'warning',
        title: 'Authentication Required',
        message: 'Please authenticate with committee credentials to modify the Canteen Menu.',
      });
      return false;
    }
    return true;
  }, [user]);

  // Handle Slot Field Changes
  const handleSlotChange = (slotKey, field, value) => {
    setSlotData((prev) => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        [field]: value,
      },
    }));
  };

  // Add Item Tag
  const handleAddItem = (slotKey, itemText) => {
    const trimmed = itemText.trim();
    if (!trimmed) return;
    setSlotData((prev) => {
      const currentItems = Array.isArray(prev[slotKey].items) ? prev[slotKey].items : [];
      if (currentItems.includes(trimmed)) return prev;
      return {
        ...prev,
        [slotKey]: {
          ...prev[slotKey],
          items: [...currentItems, trimmed],
        },
      };
    });
  };

  // Remove Item Tag
  const handleRemoveItem = (slotKey, itemIndex) => {
    setSlotData((prev) => {
      const currentItems = Array.isArray(prev[slotKey].items) ? prev[slotKey].items : [];
      return {
        ...prev,
        [slotKey]: {
          ...prev[slotKey],
          items: currentItems.filter((_, idx) => idx !== itemIndex),
        },
      };
    });
  };

  // 1-Click Apply Preset to Slot
  const handleApplyPreset = (slotKey, preset) => {
    feedback('pop');
    setSlotData((prev) => ({
      ...prev,
      [slotKey]: {
        ...prev[slotKey],
        title: preset.title || '',
        category: preset.category || 'Veg',
        items: Array.isArray(preset.items) ? [...preset.items] : [],
      },
    }));
    dialog.toast.success('Preset Applied', `Populated ${preset.title} into ${slotKey}.`);
  };

  // Save current slot content as a new preset directly inline
  const handleSaveSlotAsPreset = async (slotKey) => {
    if (!checkAuth()) return;
    const current = slotData[slotKey];
    if (!current?.title?.trim()) {
      dialog.alert({
        type: 'warning',
        title: 'Empty Dish Title',
        message: 'Please enter a title for the dish before saving as a preset.',
      });
      return;
    }

    try {
      feedback('pop');
      await addDishPreset(slotKey, {
        title: current.title.trim(),
        category: current.category || 'Veg',
        items: current.items || [],
      });
      dialog.toast.success('Preset Saved', `"${current.title}" added to ${slotKey} presets.`);
    } catch (err) {
      console.error('Error saving preset:', err);
      dialog.alert({ type: 'error', title: 'Preset Save Failed', message: err.message });
    }
  };

  // Universal Save Engine: Handles Single Day, Bulk Days, Feast Date, Range, and Default Template
  const handleUniversalSave = async () => {
    if (!checkAuth()) return;
    setSaving(true);
    feedback('tick');

    try {
      const sanitizedSlots = {
        breakfast: { ...slotData.breakfast },
        lunch: { ...slotData.lunch },
        evening: { ...slotData.evening },
        dinner: { ...slotData.dinner },
      };

      if (scope === 'single_day') {
        const payload = {
          dayKey: selectedDayKey,
          dayName: DAY_NAMES[selectedDayKey] || selectedDayKey.toUpperCase(),
          dayShort: selectedDayKey.toUpperCase(),
          note: occasion || '',
          isArchived: isClosedDay,
          isClosed: isClosedDay,
          closureReason: isClosedDay ? closureReason : '',
          ...sanitizedSlots,
        };

        if (studioMode === 'template') {
          const updatedTpl = { ...defaultTemplate, [selectedDayKey]: payload };
          await saveDefaultTemplate(updatedTpl, user?.email || 'admin');
          dialog.toast.success('Template Updated', `Saved default template for ${DAY_NAMES[selectedDayKey]}.`);
        } else {
          await saveDayMenu(selectedDayKey, payload, user?.email || 'admin');
          dialog.toast.success('Schedule Saved', `Live menu updated for ${DAY_NAMES[selectedDayKey]}.`);
        }

        await logAuditEvent({
          action: 'MENU_UPDATE',
          category: AUDIT_CATEGORIES.CANTEEN_OPS,
          severity: AUDIT_SEVERITIES.INFO,
          actor: user?.email || 'admin',
          summary: `Updated menu for ${DAY_NAMES[selectedDayKey]} (Scope: Single Day)`,
          details: { dayKey: selectedDayKey, slots: sanitizedSlots },
        });
      } else if (scope === 'bulk_days') {
        if (bulkDays.length === 0) {
          dialog.alert({ type: 'warning', title: 'No Days Selected', message: 'Select at least one day for bulk update.' });
          setSaving(false);
          return;
        }

        const source = studioMode === 'template' ? defaultTemplate : weeklyMenu;
        const updatedWeek = { ...source };

        bulkDays.forEach((dKey) => {
          updatedWeek[dKey] = {
            ...updatedWeek[dKey],
            dayKey: dKey,
            dayName: DAY_NAMES[dKey],
            isArchived: isClosedDay,
            isClosed: isClosedDay,
            closureReason: isClosedDay ? closureReason : '',
            ...sanitizedSlots,
          };
        });

        if (studioMode === 'template') {
          await saveDefaultTemplate(updatedWeek, user?.email || 'admin');
          dialog.toast.success('Template Updated', `Bulk updated ${bulkDays.length} days in default template.`);
        } else {
          await saveWeeklyMenu(updatedWeek, user?.email || 'admin');
          dialog.toast.success('Schedule Saved', `Bulk updated ${bulkDays.length} days in live schedule.`);
        }

        await logAuditEvent({
          action: 'MENU_BULK_UPDATE',
          category: AUDIT_CATEGORIES.CANTEEN_OPS,
          severity: AUDIT_SEVERITIES.WARNING,
          actor: user?.email || 'admin',
          summary: `Bulk updated ${bulkDays.length} days (${bulkDays.join(', ')})`,
          details: { days: bulkDays },
        });
      } else if (scope === 'calendar_date') {
        if (!targetDate) {
          dialog.alert({ type: 'warning', title: 'Date Required', message: 'Please select a calendar date.' });
          setSaving(false);
          return;
        }

        const overridePayload = {
          dateStr: targetDate,
          occasion: occasion || 'Special Feast Menu',
          note: occasion || '',
          isHoliday: isClosedDay,
          isClosed: isClosedDay,
          holidayReason: isClosedDay ? closureReason : '',
          closureReason: isClosedDay ? closureReason : '',
          ...sanitizedSlots,
        };

        await saveDateOverride(targetDate, overridePayload, user?.email || 'admin');
        dialog.toast.success('Feast Override Saved', `Special menu set for ${formatFriendlyDate(targetDate)}.`);

        await logAuditEvent({
          action: 'MENU_DATE_OVERRIDE',
          category: AUDIT_CATEGORIES.CANTEEN_OPS,
          severity: AUDIT_SEVERITIES.INFO,
          actor: user?.email || 'admin',
          summary: `Set date override for ${targetDate}: ${occasion || 'Special Menu'}`,
          details: { targetDate, occasion },
        });
      } else if (scope === 'date_range') {
        if (!rangeStart || !rangeEnd || rangeStart > rangeEnd) {
          dialog.alert({ type: 'warning', title: 'Invalid Date Range', message: 'Check start and end dates.' });
          setSaving(false);
          return;
        }

        const rangeOverrideData = {
          occasion: occasion || 'Range Period Menu',
          note: occasion || '',
          isHoliday: isClosedDay,
          isClosed: isClosedDay,
          holidayReason: isClosedDay ? closureReason : '',
          closureReason: isClosedDay ? closureReason : '',
          ...sanitizedSlots,
        };

        const result = await saveDateRangeOverride(rangeStart, rangeEnd, rangeOverrideData, rangeDayFilter, user?.email || 'admin');
        dialog.toast.success('Ranged Override Saved', `Applied menu across ${result.count} dates in range.`);

        await logAuditEvent({
          action: 'MENU_RANGED_OVERRIDE',
          category: AUDIT_CATEGORIES.CANTEEN_OPS,
          severity: AUDIT_SEVERITIES.WARNING,
          actor: user?.email || 'admin',
          summary: `Ranged menu applied from ${rangeStart} to ${rangeEnd} (${result.count} days)`,
          details: { rangeStart, rangeEnd, filter: rangeDayFilter, count: result.count },
        });
      }
    } catch (err) {
      console.error('Save error:', err);
      dialog.alert({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Reset or Clear Options
  const handleClearCurrentSelection = async () => {
    if (!checkAuth()) return;
    const confirmed = await dialog.confirm({
      title: 'Clear Selected Dishes?',
      message: 'This will wipe all meal slots for the current selection to clean blanks.',
      icon: 'trash',
      confirmColor: 'rose',
      confirmText: 'Clear to Blank',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      if (scope === 'single_day') {
        await clearDayMenu(selectedDayKey, user?.email || 'admin');
        dialog.toast.success('Day Cleared', `${DAY_NAMES[selectedDayKey]} reset to empty slate.`);
      } else if (scope === 'calendar_date') {
        await deleteDateOverride(targetDate, user?.email || 'admin');
        dialog.toast.success('Override Removed', `Restored ${formatFriendlyDate(targetDate)} to standard routine.`);
      } else {
        setSlotData({
          breakfast: createEmptySlot('07:00 AM - 08:30 AM'),
          lunch: createEmptySlot('12:30 PM - 02:00 PM'),
          evening: createEmptySlot('04:30 PM - 05:30 PM'),
          dinner: createEmptySlot('08:30 PM - 09:30 PM'),
        });
        dialog.toast.info('Canvas Cleared', 'Click "Save Changes" to commit blank dishes.');
      }
    }
  };

  // Restore entire week from Default Template
  const handleRestoreFromDefaults = async () => {
    if (!checkAuth()) return;
    const confirmed = await dialog.confirm({
      title: 'Restore from Default Template?',
      message: 'This will overwrite the active 7-day schedule with your saved standard template.',
      confirmColor: 'amber',
      confirmText: 'Restore Defaults',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        setSaving(true);
        const restored = await resetWeeklyMenuToDefault(user?.email || 'admin');
        setWeeklyMenu(restored);
        dialog.toast.success('Restored Defaults', 'Live menu synchronized with standard template.');
      } catch (err) {
        dialog.alert({ type: 'error', title: 'Restore Failed', message: err.message });
      } finally {
        setSaving(false);
      }
    }
  };

  // Clear Entire Week to clean slate
  const handleClearEntireWeek = async () => {
    if (!checkAuth()) return;
    const confirmed = await dialog.confirm({
      title: 'Clear Entire Weekly Menu?',
      message: 'This will reset all 7 days to clean empty slots. No dishes will be announced until entered.',
      icon: 'trash',
      confirmColor: 'rose',
      confirmText: 'Wipe to Empty',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        setSaving(true);
        const empty = await resetMenuToEmpty(user?.email || 'admin');
        setWeeklyMenu(empty);
        dialog.toast.success('Menu Cleared', 'All 7 days have been reset to empty slots.');
      } catch (err) {
        dialog.alert({ type: 'error', title: 'Clear Failed', message: err.message });
      } finally {
        setSaving(false);
      }
    }
  };

  // Presets inline add/update
  const handleSaveInlinePreset = async () => {
    if (!newPresetForm.title.trim()) return;
    try {
      const items = newPresetForm.itemsStr.split(',').map((s) => s.trim()).filter(Boolean);
      if (editingPreset) {
        await updateDishPreset(activePresetSlot, editingPreset.title, {
          title: newPresetForm.title.trim(),
          category: newPresetForm.category,
          items,
        });
        dialog.toast.success('Preset Updated', `"${newPresetForm.title}" updated.`);
      } else {
        await addDishPreset(activePresetSlot, {
          title: newPresetForm.title.trim(),
          category: newPresetForm.category,
          items,
        });
        dialog.toast.success('Preset Created', `"${newPresetForm.title}" saved.`);
      }
      setNewPresetForm({ title: '', itemsStr: '', category: 'Veg' });
      setEditingPreset(null);
      setIsAddingPreset(false);
    } catch (err) {
      dialog.alert({ type: 'error', title: 'Preset Error', message: err.message });
    }
  };

  const currentPresetsList = useMemo(() => {
    const list = Array.isArray(presetsMap[activePresetSlot]) ? presetsMap[activePresetSlot] : [];
    if (!presetSearch.trim()) return list;
    const q = presetSearch.toLowerCase();
    return list.filter((p) => p.title?.toLowerCase().includes(q) || p.items?.some((it) => it.toLowerCase().includes(q)));
  }, [presetsMap, activePresetSlot, presetSearch]);

  return (
    <div className="min-h-screen w-full bg-[#f8faf8] dark:bg-[#080d0b] text-gray-900 dark:text-gray-100 py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* 1. Header Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="p-2.5 rounded-2xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              title="Return to Admin Console"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm">
                  <Utensils className="w-4 h-4" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                  Universal Menu Studio
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                  Universal Architecture
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Configure weekly routine, multi-day bulk schedules, calendar feasts, and ranged overrides in one unified canvas.
              </p>
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              onClick={() => navigate('/menu')}
              className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
              <span>Public /menu</span>
            </button>

            <button
              onClick={() => setPresetsShelfOpen((prev) => !prev)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                presetsShelfOpen
                  ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
                  : 'border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30'
              }`}
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Presets Shelf</span>
            </button>

            <button
              onClick={handleRestoreFromDefaults}
              className="px-3.5 py-2 rounded-xl border border-amber-200 dark:border-amber-800/40 text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Replace live schedule with default template"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Load Template</span>
            </button>

            <button
              onClick={handleClearEntireWeek}
              className="px-3 py-2 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Wipe entire 7 days to clean empty slate"
            >
              <Eraser className="w-3.5 h-3.5" />
              <span>Wipe All</span>
            </button>
          </div>
        </div>

        {/* 2. Workspace Mode Switcher */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 backdrop-blur-md overflow-x-auto">
          <button
            onClick={() => {
              feedback('tick');
              setStudioMode('live');
              if (scope === 'calendar_date') setScope('single_day');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              studioMode === 'live'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Live Supply Schedule</span>
          </button>

          <button
            onClick={() => {
              feedback('tick');
              setStudioMode('template');
              setScope('single_day');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              studioMode === 'template'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Standard Baseline Template</span>
          </button>

          <button
            onClick={() => {
              feedback('tick');
              setStudioMode('calendar');
              setScope('calendar_date');
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              studioMode === 'calendar'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Interactive Calendar & Feasts ({Object.keys(overrides).length})</span>
          </button>
        </div>

        {/* 3. Universal Scope Engine Selector */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Target Operation Scope
              </span>
              <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                Where should your edits apply?
              </h2>
            </div>

            {/* Scope Selector Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-gray-100/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setScope('single_day');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scope === 'single_day'
                    ? 'bg-white dark:bg-[#192420] text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Single Day (Routine)
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setScope('bulk_days');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scope === 'bulk_days'
                    ? 'bg-white dark:bg-[#192420] text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Multi-Day Bulk
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setScope('calendar_date');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scope === 'calendar_date'
                    ? 'bg-white dark:bg-[#192420] text-purple-600 dark:text-purple-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Specific Calendar Feast
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setScope('date_range');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  scope === 'date_range'
                    ? 'bg-white dark:bg-[#192420] text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Date Range (Period)
              </button>
            </div>
          </div>

          {/* Scope Controls Detail */}
          <div className="pt-3 border-t border-gray-200/60 dark:border-white/5">
            {/* Scope: Single Day */}
            {scope === 'single_day' && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold text-gray-500 mr-2">Select Day:</span>
                {DAY_KEYS.map((k) => (
                  <button
                    key={k}
                    onClick={() => {
                      feedback('tick');
                      setSelectedDayKey(k);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all ${
                      selectedDayKey === k
                        ? 'bg-emerald-600 text-white shadow-sm scale-105'
                        : 'bg-gray-100/80 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {DAY_NAMES[k]}
                  </button>
                ))}
              </div>
            )}

            {/* Scope: Multi-Day Bulk */}
            {scope === 'bulk_days' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-gray-500 mr-2">Apply Changes To:</span>
                    {DAY_KEYS.map((k) => {
                      const isSelected = bulkDays.includes(k);
                      return (
                        <button
                          key={k}
                          onClick={() => {
                            feedback('tick');
                            setBulkDays((prev) =>
                              prev.includes(k) ? prev.filter((item) => item !== k) : [...prev, k]
                            );
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          <Check className={`w-3 h-3 ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                          <span>{DAY_NAMES[k]}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Preset Groups */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setBulkDays(['mo', 'tu', 'we', 'th', 'fr'])}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-gray-700 dark:text-gray-300"
                    >
                      Weekdays (Mo-Fr)
                    </button>
                    <button
                      onClick={() => setBulkDays([...DAY_KEYS])}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-gray-700 dark:text-gray-300"
                    >
                      All 7 Days
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Scope: Calendar Date Override */}
            {scope === 'calendar_date' && (
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-purple-700 dark:text-purple-300">Target Date:</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-700 bg-white dark:bg-[#121c19] text-xs font-bold text-gray-900 dark:text-white"
                  />
                  <span className="text-xs text-gray-500 font-medium">({formatFriendlyDate(targetDate)})</span>
                </div>

                <div className="flex-1 min-w-[220px]">
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="Occasion (e.g. Milad Feast, Special Dinner, Assembly)"
                    className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121c19] text-xs font-bold"
                  />
                </div>
              </div>
            )}

            {/* Scope: Date Range Override */}
            {scope === 'date_range' && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Start Date:</label>
                    <input
                      type="date"
                      value={rangeStart}
                      onChange={(e) => setRangeStart(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-[#121c19] text-xs font-bold"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-indigo-700 dark:text-indigo-300">End Date:</label>
                    <input
                      type="date"
                      value={rangeEnd}
                      onChange={(e) => setRangeEnd(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-indigo-300 dark:border-indigo-700 bg-white dark:bg-[#121c19] text-xs font-bold"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <input
                      type="text"
                      value={occasion}
                      onChange={(e) => setOccasion(e.target.value)}
                      placeholder="Range Title / Occasion (e.g. Exam Period Routine)"
                      className="w-full px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121c19] text-xs font-bold"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-500">Filter Days in Range:</span>
                  {['all', 'fridays', 'weekdays', 'weekends'].map((f) => (
                    <button
                      key={f}
                      onClick={() => setRangeDayFilter(f)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                        rangeDayFilter === f
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. Embedded Presets Palette Shelf (Collapsible Drawer) */}
        <AnimatePresence>
          {presetsShelfOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="p-5 rounded-3xl bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border border-purple-200 dark:border-purple-800/40 shadow-sm overflow-hidden space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                    Dish Presets Library (1-Click Auto-Fill)
                  </h3>
                  <span className="text-xs text-gray-500">
                    Click any card to fill the corresponding meal slot.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 p-1 rounded-xl bg-white/60 dark:bg-black/20 border border-gray-200 dark:border-white/10">
                    {['breakfast', 'lunch', 'evening', 'dinner'].map((s) => (
                      <button
                        key={s}
                        onClick={() => setActivePresetSlot(s)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                          activePresetSlot === s
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-gray-600 dark:text-gray-400'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setIsAddingPreset((prev) => !prev);
                      setEditingPreset(null);
                      setNewPresetForm({ title: '', itemsStr: '', category: 'Veg' });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>New Preset</span>
                  </button>
                </div>
              </div>

              {/* Add / Edit Inline Preset Form */}
              {isAddingPreset && (
                <div className="p-4 rounded-2xl bg-white/90 dark:bg-[#121c19] border border-purple-300 dark:border-purple-700/60 shadow-sm space-y-3">
                  <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                    {editingPreset ? `Edit ${editingPreset.title}` : `Add New ${activePresetSlot} Preset`}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={newPresetForm.title}
                      onChange={(e) => setNewPresetForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Dish Title (e.g. Porotta & Kadala)"
                      className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-xs font-bold"
                    />
                    <input
                      type="text"
                      value={newPresetForm.itemsStr}
                      onChange={(e) => setNewPresetForm((p) => ({ ...p, itemsStr: e.target.value }))}
                      placeholder="Items (comma-separated: Porotta, Curry, Tea)"
                      className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-xs font-bold"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        value={newPresetForm.category}
                        onChange={(e) => setNewPresetForm((p) => ({ ...p, category: e.target.value }))}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-xs font-bold flex-1"
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.key} value={c.key}>{c.label}</option>
                        ))}
                      </select>
                      <button
                        onClick={handleSaveInlinePreset}
                        className="px-3 py-1.5 rounded-xl bg-purple-600 text-white text-xs font-bold"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setIsAddingPreset(false)}
                        className="p-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Preset Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto pr-1">
                {currentPresetsList.map((preset, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-2xl bg-white/80 dark:bg-[#121c19]/90 border border-purple-200/60 dark:border-purple-800/30 hover:border-purple-500 dark:hover:border-purple-400 shadow-xs flex flex-col justify-between gap-2 group transition-all"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div>
                        <span className="font-extrabold text-xs text-gray-900 dark:text-white block group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                          {preset.title}
                        </span>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 block line-clamp-1">
                          {preset.items?.join(' • ') || 'No side items'}
                        </span>
                      </div>
                      <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300">
                        {preset.category}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-white/5">
                      <button
                        onClick={() => handleApplyPreset(activePresetSlot, preset)}
                        className="px-2.5 py-1 rounded-lg bg-purple-100 dark:bg-purple-950/50 hover:bg-purple-200 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center gap-1 transition-colors"
                      >
                        <Check className="w-3 h-3" />
                        <span>Apply to {activePresetSlot}</span>
                      </button>
                      <button
                        onClick={() => {
                          dialog.confirm({
                            title: 'Delete Preset?',
                            message: `Remove "${preset.title}" from ${activePresetSlot} presets?`,
                            confirmColor: 'rose',
                          }).then((ok) => {
                            if (ok) deleteDishPreset(activePresetSlot, preset.title);
                          });
                        }}
                        className="p-1 rounded-lg text-gray-400 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}

                {currentPresetsList.length === 0 && (
                  <div className="col-span-full py-4 text-center text-xs text-gray-400">
                    No presets found for {activePresetSlot}. Click &quot;New Preset&quot; or save from any slot below.
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. Canteen Closed Toggle */}
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setIsClosedDay((prev) => !prev);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                isClosedDay ? 'bg-amber-500' : 'bg-gray-200 dark:bg-white/10'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  isClosedDay ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
            <div>
              <span className="font-bold text-xs text-gray-900 dark:text-white block">
                {isClosedDay ? '🔒 Canteen Closed for this Selection' : '🍲 Supply Active & Normal Service'}
              </span>
              <span className="text-[11px] text-gray-500">
                {isClosedDay ? 'Dining hall will display routine off-day notice to students.' : 'All scheduled meal slots will be prepared.'}
              </span>
            </div>
          </div>

          {isClosedDay && (
            <input
              type="text"
              value={closureReason}
              onChange={(e) => setClosureReason(e.target.value)}
              placeholder="Reason (e.g. Routine Off-Day, Campus Holiday, Kitchen Maintenance)"
              className="px-3 py-1.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/20 text-xs font-bold text-amber-900 dark:text-amber-200 sm:w-80"
            />
          )}
        </div>

        {/* 6. Unified Meal Slot Canvas (Breakfast, Lunch, Evening Tea, Dinner) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SLOT_CONFIGS.map((slot) => {
            const current = slotData[slot.key] || createEmptySlot(slot.defaultTiming);
            const slotPresets = Array.isArray(presetsMap[slot.key]) ? presetsMap[slot.key].slice(0, 4) : [];
            const Icon = slot.icon;

            return (
              <div
                key={slot.key}
                className="p-5 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4 transition-all"
              >
                {/* Slot Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300">
                      <Icon className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-gray-900 dark:text-white">
                        {slot.label}
                      </h4>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {current.timing || slot.defaultTiming}
                      </span>
                    </div>
                  </div>

                  {/* Slot Actions */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSaveSlotAsPreset(slot.key)}
                      className="px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 hover:bg-purple-50 text-[10px] font-bold flex items-center gap-1 transition-colors"
                      title="Save as reusable preset"
                    >
                      <BookmarkPlus className="w-3 h-3" />
                      <span>Save Preset</span>
                    </button>
                  </div>
                </div>

                {/* Title & Timing Inputs */}
                <div className="space-y-2">
                  <input
                    type="text"
                    value={current.title}
                    onChange={(e) => handleSlotChange(slot.key, 'title', e.target.value)}
                    placeholder={`e.g. ${slot.key === 'breakfast' ? 'Porotta & Kadala' : slot.key === 'lunch' ? 'Rice & Chicken Curry' : 'Snacks & Tea'}`}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-black/20 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />

                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <input
                      type="text"
                      value={current.timing}
                      onChange={(e) => handleSlotChange(slot.key, 'timing', e.target.value)}
                      placeholder="Serving window (e.g. 07:00 AM - 08:30 AM)"
                      className="w-full px-2.5 py-1 rounded-lg border border-gray-200/60 dark:border-white/5 bg-transparent text-[11px] font-mono text-gray-600 dark:text-gray-300"
                    />
                  </div>
                </div>

                {/* Dietary Category Badges */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">
                    Dietary Classification
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {CATEGORIES.map((cat) => {
                      const isActive = (current.category || 'Veg') === cat.key;
                      return (
                        <button
                          key={cat.key}
                          type="button"
                          onClick={() => handleSlotChange(slot.key, 'category', cat.key)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                            isActive
                              ? `${cat.badgeClass} ring-2 ring-emerald-500/30 scale-105`
                              : 'border-gray-200/70 dark:border-white/10 text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {cat.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Dish Side Items (Tags) */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold text-gray-400 block uppercase">
                    Dishes & Ingredients
                  </span>
                  <div className="flex flex-wrap items-center gap-1.5 min-h-[32px] p-1.5 rounded-xl bg-gray-50 dark:bg-black/20 border border-gray-200/60 dark:border-white/5">
                    {Array.isArray(current.items) &&
                      current.items.map((it, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white dark:bg-[#192420] text-gray-800 dark:text-gray-200 text-[11px] font-medium border border-gray-200 dark:border-white/10 shadow-xs"
                        >
                          <span>{it}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(slot.key, idx)}
                            className="hover:text-rose-500"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}

                    <input
                      type="text"
                      placeholder="+ add item (hit Enter)"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddItem(slot.key, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="px-2 py-0.5 text-xs bg-transparent focus:outline-none flex-1 min-w-[120px] text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Quick Presets for this slot */}
                {slotPresets.length > 0 && (
                  <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center gap-1.5">
                    <span className="text-[10px] font-bold text-gray-400">Quick Fill:</span>
                    {slotPresets.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleApplyPreset(slot.key, p)}
                        className="px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 text-purple-700 dark:text-purple-300 text-[10px] font-bold border border-purple-200 dark:border-purple-800/40 transition-colors"
                      >
                        {p.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* 7. Sticky Batch Action Bar */}
        <div className="sticky bottom-4 z-40 p-4 rounded-3xl bg-gray-900/95 dark:bg-[#0f1715]/95 text-white border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              ✓
            </div>
            <div>
              <span className="text-xs font-bold block">
                Target: {scope === 'single_day' ? DAY_NAMES[selectedDayKey] : scope === 'bulk_days' ? `${bulkDays.length} Days` : scope === 'calendar_date' ? formatFriendlyDate(targetDate) : `${rangeStart} → ${rangeEnd}`}
              </span>
              <span className="text-[11px] text-gray-400">
                Mode: {studioMode === 'template' ? 'Standard Template' : 'Live Active Schedule'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={handleClearCurrentSelection}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Clear Dishes</span>
            </button>

            <button
              onClick={handleUniversalSave}
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-black text-xs shadow-lg shadow-emerald-500/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save & Publish Menu'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
