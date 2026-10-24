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
  Lock,
  Moon,
  UtensilsCrossed,
  Archive,
  ArchiveRestore,
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
  archiveDay,
  archiveSlot,
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
import {
  getCanonicalMealTiming,
  subscribeToMealScheduleAndFines,
} from '../../utils/mealScheduleService';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../../utils/auditLogger';
import MenuCalendarMatrix from './MenuCalendarMatrix';
import MealTimingInput from './MealTimingInput';
import RangedMenuModal from './RangedMenuModal';

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
  { key: 'breakfast', label: 'Breakfast', icon: Coffee, color: 'amber', defaultTiming: '07:30 AM - 08:45 AM' },
  { key: 'lunch', label: 'Lunch', icon: Utensils, color: 'emerald', defaultTiming: '12:45 PM - 02:00 PM' },
  { key: 'evening', label: 'Evening Tea', icon: Coffee, color: 'blue', defaultTiming: '04:30 PM - 05:30 PM' },
  { key: 'dinner', label: 'Dinner', icon: Utensils, color: 'purple', defaultTiming: '08:30 PM - 09:30 PM' },
];

const createEmptySlot = (defaultTiming = '') => ({
  title: '',
  items: [],
  category: '',
  timing: defaultTiming,
  timeMode: 'clock',
  slotStatus: 'serving', // 'serving' | 'leave' | 'event' | 'fasting'
  leaveReason: '',
  eventTitle: '',
  eventVenue: '',
  eventSponsor: '',
  eventNotes: '',
  fastingTitle: '',
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
  const [dayStatus, setDayStatus] = useState('standard'); // 'standard' | 'leave' | 'event' | 'fasting'
  const [occasion, setOccasion] = useState('');
  const [isClosedDay, setIsClosedDay] = useState(false);
  const [closureReason, setClosureReason] = useState('');
  const [eventVenue, setEventVenue] = useState('');
  const [eventSponsor, setEventSponsor] = useState('');
  const [eventNotes, setEventNotes] = useState('');
  const [fastingTitle, setFastingTitle] = useState('');

  // Calendar Studio State
  const [editingCalendarDate, setEditingCalendarDate] = useState(null);
  const [isRangedModalOpen, setIsRangedModalOpen] = useState(false);

  // Active Meal Canvas Form State (4 Slots)
  const [slotData, setSlotData] = useState({
    breakfast: createEmptySlot('07:30 AM - 08:45 AM'),
    lunch: createEmptySlot('12:45 PM - 02:00 PM'),
    evening: createEmptySlot('04:30 PM - 05:30 PM'),
    dinner: createEmptySlot('08:30 PM - 09:30 PM'),
  });

  // Presets Shelf & Management Drawer State
  const [presetsShelfOpen, setPresetsShelfOpen] = useState(false);
  const [presetSearch, setPresetSearch] = useState('');
  const [activePresetSlot, setActivePresetSlot] = useState('breakfast');
  const [editingPreset, setEditingPreset] = useState(null);
  const [newPresetForm, setNewPresetForm] = useState({
    title: '',
    itemsStr: '',
    category: '',
    timing: '',
    timeMode: 'clock',
  });
  const [isAddingPreset, setIsAddingPreset] = useState(false);

  // Sync initial day from world clock
  useEffect(() => {
    if (dayShort && DAY_KEYS.includes(dayShort)) {
      setSelectedDayKey(dayShort);
    }
  }, [dayShort]);

  // Live campus timing version tracker from Firestore settings/canteen_config
  const [scheduleVersion, setScheduleVersion] = useState(0);

  useEffect(() => {
    const unsub = subscribeToMealScheduleAndFines(() => {
      setScheduleVersion((v) => v + 1);
    });
    return () => unsub();
  }, []);

  // Effective Day of Week key depending on whether user is editing a single day or a specific calendar date
  const effectiveDayKey = useMemo(() => {
    if (scope === 'calendar_date' && targetDate) {
      return getDayOfWeekShort(targetDate);
    }
    return selectedDayKey;
  }, [scope, targetDate, selectedDayKey]);

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
    const buildSlot = (slotObj, defaultTiming) => {
      if (!slotObj) return createEmptySlot(defaultTiming);
      return {
        ...createEmptySlot(defaultTiming),
        ...slotObj,
        timing: slotObj.timing || defaultTiming,
        timeMode: slotObj.timeMode || 'clock',
        slotStatus: slotObj.slotStatus || (slotObj.isArchived ? 'leave' : 'serving'),
        isAvailable: slotObj.slotStatus === 'leave' ? false : (slotObj.isAvailable !== undefined ? slotObj.isAvailable : true),
        isArchived: Boolean(slotObj.slotStatus === 'leave' || slotObj.isArchived),
        leaveReason: slotObj.leaveReason || '',
        eventTitle: slotObj.eventTitle || '',
        eventVenue: slotObj.eventVenue || '',
        eventSponsor: slotObj.eventSponsor || '',
        eventNotes: slotObj.eventNotes || '',
        fastingTitle: slotObj.fastingTitle || '',
      };
    };

    if (scope === 'single_day') {
      const source = studioMode === 'template' ? defaultTemplate : weeklyMenu;
      const dayData = source[selectedDayKey] || {};
      const bfTiming = getCanonicalMealTiming(selectedDayKey, 'breakfast');
      const lunchTiming = getCanonicalMealTiming(selectedDayKey, 'lunch');
      const eveningTiming = getCanonicalMealTiming(selectedDayKey, 'evening');
      const dinnerTiming = getCanonicalMealTiming(selectedDayKey, 'dinner');

      setSlotData({
        breakfast: buildSlot(dayData.breakfast, bfTiming),
        lunch: buildSlot(dayData.lunch, lunchTiming),
        evening: buildSlot(dayData.evening, eveningTiming),
        dinner: buildSlot(dayData.dinner, dinnerTiming),
      });

      const isArchived = Boolean(dayData.isArchived);
      const isClosed = Boolean(isArchived || dayData.isClosed);
      setIsClosedDay(isClosed);
      setClosureReason(dayData.closureReason || dayData.archiveReason || '');
      setOccasion(dayData.note || dayData.eventTitle || '');
      setEventVenue(dayData.eventVenue || '');
      setEventSponsor(dayData.eventSponsor || '');
      setEventNotes(dayData.eventNotes || '');
      setFastingTitle(dayData.fastingTitle || '');
      setDayStatus(
        dayData.dayStatus === 'archived' || isArchived
          ? 'archived'
          : dayData.dayStatus === 'leave' || dayData.dayStatus === 'closed' || isClosed
          ? 'closed'
          : dayData.dayStatus || (dayData.fastingTitle ? 'fasting' : dayData.note ? 'event' : 'standard')
      );
    } else if (scope === 'calendar_date') {
      const ovr = overrides[targetDate];
      const dow = getDayOfWeekShort(targetDate);
      const bfTiming = getCanonicalMealTiming(dow, 'breakfast');
      const lunchTiming = getCanonicalMealTiming(dow, 'lunch');
      const eveningTiming = getCanonicalMealTiming(dow, 'evening');
      const dinnerTiming = getCanonicalMealTiming(dow, 'dinner');

      if (ovr) {
        setSlotData({
          breakfast: buildSlot(ovr.breakfast, bfTiming),
          lunch: buildSlot(ovr.lunch, lunchTiming),
          evening: buildSlot(ovr.evening, eveningTiming),
          dinner: buildSlot(ovr.dinner, dinnerTiming),
        });
        const isArchived = Boolean(ovr.isArchived);
        const isClosed = Boolean(ovr.isHoliday || ovr.isClosed || isArchived);
        setIsClosedDay(isClosed);
        setClosureReason(ovr.holidayReason || ovr.closureReason || ovr.leaveReason || ovr.archiveReason || '');
        setOccasion(ovr.occasion || ovr.eventTitle || '');
        setEventVenue(ovr.eventVenue || '');
        setEventSponsor(ovr.eventSponsor || '');
        setEventNotes(ovr.eventNotes || '');
        setFastingTitle(ovr.fastingTitle || '');
        setDayStatus(
          ovr.dayStatus === 'archived' || isArchived
            ? 'archived'
            : ovr.dayStatus === 'leave' || ovr.dayStatus === 'closed' || isClosed
            ? 'closed'
            : ovr.dayStatus || (ovr.fastingTitle ? 'fasting' : ovr.occasion ? 'event' : 'standard')
        );
      } else {
        const routine = weeklyMenu[dow] || {};
        setSlotData({
          breakfast: buildSlot(routine.breakfast, bfTiming),
          lunch: buildSlot(routine.lunch, lunchTiming),
          evening: buildSlot(routine.evening, eveningTiming),
          dinner: buildSlot(routine.dinner, dinnerTiming),
        });
        setIsClosedDay(false);
        setClosureReason('');
        setOccasion('');
        setEventVenue('');
        setEventSponsor('');
        setEventNotes('');
        setFastingTitle('');
        setDayStatus('standard');
      }
    }
  }, [scope, selectedDayKey, targetDate, weeklyMenu, defaultTemplate, overrides, studioMode, scheduleVersion]);

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
        category: preset.category || '',
        items: Array.isArray(preset.items) ? [...preset.items] : [],
        ...(preset.timing ? { timing: preset.timing } : {}),
        ...(preset.timeMode ? { timeMode: preset.timeMode } : {}),
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
        category: current.category || '',
        items: current.items || [],
        timing: current.timing || '',
        timeMode: current.timeMode || 'clock',
      });
      dialog.toast.success('Preset Saved', `"${current.title}" added to ${slotKey} presets.`);
    } catch (err) {
      console.error('Error saving preset:', err);
      dialog.alert({ type: 'error', title: 'Preset Save Failed', message: err.message });
    }
  };

  // Single meal slot delete / clear to blank
  const handleClearSlot = async (slotKey) => {
    feedback('trash');
    const slotCfg = SLOT_CONFIGS.find((s) => s.key === slotKey);
    const label = slotCfg ? slotCfg.label : slotKey;
    const confirmed = await dialog.confirm({
      title: `Clear ${label}?`,
      message: `Reset ${label} to clean blank dishes and campus standard timing?`,
      icon: 'trash',
      confirmColor: 'rose',
      confirmText: 'Clear Slot',
      cancelText: 'Cancel',
    });
    if (confirmed) {
      const canonical = getCanonicalMealTiming(effectiveDayKey, slotKey);
      setSlotData((prev) => ({
        ...prev,
        [slotKey]: createEmptySlot(canonical),
      }));
      dialog.toast.info('Slot Cleared', `${label} reset to blank.`);
    }
  };

  // Single meal slot archive / restore toggle
  const handleToggleArchiveSlot = (slotKey) => {
    feedback('tick');
    const isCurrentlyArchived = Boolean(slotData[slotKey]?.isArchived);
    if (!isCurrentlyArchived) {
      setSlotData((prev) => ({
        ...prev,
        [slotKey]: {
          ...prev[slotKey],
          isArchived: true,
          isAvailable: false,
          slotStatus: 'leave',
          leaveReason: prev[slotKey]?.leaveReason || 'Archived / Suspended',
        },
      }));
      dialog.toast.warning('Meal Slot Archived', `${slotKey} slot marked as archived.`);
    } else {
      setSlotData((prev) => ({
        ...prev,
        [slotKey]: {
          ...prev[slotKey],
          isArchived: false,
          isAvailable: true,
          slotStatus: 'serving',
          leaveReason: '',
        },
      }));
      dialog.toast.success('Meal Slot Restored', `${slotKey} slot unarchived and active.`);
    }
  };

  // Full day archive / unarchive toggle
  const handleToggleArchiveDay = async () => {
    feedback('tick');
    const isCurrentlyArchived = dayStatus === 'archived' || isClosedDay;
    if (!isCurrentlyArchived) {
      setDayStatus('archived');
      setIsClosedDay(true);
      if (!closureReason) setClosureReason('Archived Schedule (Inactive Day)');
      dialog.toast.warning('Day Marked Archived', 'Day set to archived. Click "Save & Publish Menu" to commit.');
    } else {
      setDayStatus('standard');
      setIsClosedDay(false);
      setClosureReason('');
      dialog.toast.success('Day Unarchived', 'Day set to standard serving. Click "Save & Publish Menu" to commit.');
    }
  };

  // Delete Date Override and restore standard routine
  const handleDeleteOverride = async (dateKey) => {
    if (!checkAuth()) return;
    const confirmed = await dialog.confirm({
      title: 'Delete Date Override?',
      message: `Revert ${formatFriendlyDate(dateKey)} back to the standard weekly dining routine? All custom dishes, events, or closure notices for this date will be removed.`,
      confirmColor: 'rose',
      confirmText: 'Delete Override',
      cancelText: 'Cancel',
      icon: 'trash',
    });

    if (confirmed) {
      try {
        setSaving(true);
        feedback('pop');
        await deleteDateOverride(dateKey);
        dialog.toast.success('Override Deleted', `Restored ${formatFriendlyDate(dateKey)} to routine.`);
        if (editingCalendarDate === dateKey) {
          setEditingCalendarDate(null);
        }
      } catch (err) {
        dialog.alert({ type: 'error', title: 'Delete Failed', message: err.message });
      } finally {
        setSaving(false);
      }
    }
  };

  // Universal Save Engine: Handles Single Day, Bulk Days, Feast Date, Range, and Default Template
  const handleUniversalSave = async () => {
    if (!checkAuth()) return;
    setSaving(true);
    feedback('tick');

    try {
      const isDayArchived = dayStatus === 'archived';
      const isDayClosed = dayStatus === 'closed' || isDayArchived || isClosedDay;

      const sanitizedSlots = {
        breakfast: {
          ...slotData.breakfast,
          timing: slotData.breakfast?.timing || '',
          timeMode: slotData.breakfast?.timeMode || 'clock',
          slotStatus: slotData.breakfast?.slotStatus || 'serving',
          isAvailable: !isDayClosed && (slotData.breakfast?.slotStatus || 'serving') === 'serving' && !slotData.breakfast?.isArchived,
          isArchived: isDayClosed || (slotData.breakfast?.slotStatus || 'serving') === 'leave' || Boolean(slotData.breakfast?.isArchived),
        },
        lunch: {
          ...slotData.lunch,
          timing: slotData.lunch?.timing || '',
          timeMode: slotData.lunch?.timeMode || 'clock',
          slotStatus: slotData.lunch?.slotStatus || 'serving',
          isAvailable: !isDayClosed && (slotData.lunch?.slotStatus || 'serving') === 'serving' && !slotData.lunch?.isArchived,
          isArchived: isDayClosed || (slotData.lunch?.slotStatus || 'serving') === 'leave' || Boolean(slotData.lunch?.isArchived),
        },
        evening: {
          ...slotData.evening,
          timing: slotData.evening?.timing || '',
          timeMode: slotData.evening?.timeMode || 'clock',
          slotStatus: slotData.evening?.slotStatus || 'serving',
          isAvailable: !isDayClosed && (slotData.evening?.slotStatus || 'serving') === 'serving' && !slotData.evening?.isArchived,
          isArchived: isDayClosed || (slotData.evening?.slotStatus || 'serving') === 'leave' || Boolean(slotData.evening?.isArchived),
        },
        dinner: {
          ...slotData.dinner,
          timing: slotData.dinner?.timing || '',
          timeMode: slotData.dinner?.timeMode || 'clock',
          slotStatus: slotData.dinner?.slotStatus || 'serving',
          isAvailable: !isDayClosed && (slotData.dinner?.slotStatus || 'serving') === 'serving' && !slotData.dinner?.isArchived,
          isArchived: isDayClosed || (slotData.dinner?.slotStatus || 'serving') === 'leave' || Boolean(slotData.dinner?.isArchived),
        },
      };

      const dayMetadata = {
        dayStatus: dayStatus || 'standard',
        isArchived: isDayClosed || isDayArchived,
        isClosed: isDayClosed,
        archiveReason: isDayArchived ? (closureReason || 'Archived Day (Suspended)') : '',
        closureReason: isDayClosed ? (closureReason || (isDayArchived ? 'Archived Day (Suspended)' : 'Canteen Closed / Routine Off')) : '',
        leaveReason: isDayClosed ? (closureReason || (isDayArchived ? 'Archived Day (Suspended)' : 'Canteen Closed / Routine Off')) : '',
        eventTitle: dayStatus === 'event' ? occasion : '',
        eventVenue: dayStatus === 'event' ? eventVenue : '',
        eventSponsor: dayStatus === 'event' ? eventSponsor : '',
        eventNotes: dayStatus === 'event' ? eventNotes : '',
        fastingTitle: dayStatus === 'fasting' ? fastingTitle : '',
      };

      if (scope === 'single_day') {
        const payload = {
          dayKey: selectedDayKey,
          dayName: DAY_NAMES[selectedDayKey] || selectedDayKey.toUpperCase(),
          dayShort: selectedDayKey.toUpperCase(),
          note: occasion || '',
          ...dayMetadata,
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
          summary: `Updated menu for ${DAY_NAMES[selectedDayKey]} (Scope: Single Day, Status: ${dayStatus})`,
          details: { dayKey: selectedDayKey, status: dayStatus, slots: sanitizedSlots },
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
            ...dayMetadata,
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
          details: { days: bulkDays, status: dayStatus },
        });
      } else if (scope === 'calendar_date') {
        if (!targetDate) {
          dialog.alert({ type: 'warning', title: 'Date Required', message: 'Please select a calendar date.' });
          setSaving(false);
          return;
        }

        const overridePayload = {
          dateStr: targetDate,
          occasion: occasion || (dayStatus === 'event' ? 'Campus Event / Feast' : dayStatus === 'fasting' ? 'Fasting Routine' : isDayClosed ? 'Canteen Closed' : 'Special Menu'),
          note: occasion || '',
          isHoliday: isDayClosed,
          holidayReason: isDayClosed ? (closureReason || 'Canteen Closed') : '',
          ...dayMetadata,
          ...sanitizedSlots,
        };

        await saveDateOverride(targetDate, overridePayload, user?.email || 'admin');
        dialog.toast.success('Feast Override Saved', `Special menu set for ${formatFriendlyDate(targetDate)}.`);

        await logAuditEvent({
          action: 'MENU_DATE_OVERRIDE',
          category: AUDIT_CATEGORIES.CANTEEN_OPS,
          severity: AUDIT_SEVERITIES.INFO,
          actor: user?.email || 'admin',
          summary: `Set date override for ${targetDate}: ${occasion || dayStatus}`,
          details: { targetDate, occasion, status: dayStatus },
        });
      } else if (scope === 'date_range') {
        if (!rangeStart || !rangeEnd || rangeStart > rangeEnd) {
          dialog.alert({ type: 'warning', title: 'Invalid Date Range', message: 'Check start and end dates.' });
          setSaving(false);
          return;
        }

        const rangeOverrideData = {
          occasion: occasion || (dayStatus === 'event' ? 'Campus Event Period' : dayStatus === 'fasting' ? 'Fasting Period' : isDayClosed ? 'Canteen Holiday Period' : 'Range Period Menu'),
          note: occasion || '',
          isHoliday: isDayClosed,
          holidayReason: isDayClosed ? (closureReason || 'Canteen Closed') : '',
          ...dayMetadata,
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
          details: { rangeStart, rangeEnd, filter: rangeDayFilter, count: result.count, status: dayStatus },
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
          breakfast: createEmptySlot(getCanonicalMealTiming(effectiveDayKey, 'breakfast')),
          lunch: createEmptySlot(getCanonicalMealTiming(effectiveDayKey, 'lunch')),
          evening: createEmptySlot(getCanonicalMealTiming(effectiveDayKey, 'evening')),
          dinner: createEmptySlot(getCanonicalMealTiming(effectiveDayKey, 'dinner')),
        });
        dialog.toast.info('Canvas Cleared', 'Click "Save & Publish Menu" to commit blank dishes.');
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
          timing: newPresetForm.timing || '',
          timeMode: newPresetForm.timeMode || 'clock',
        });
        dialog.toast.success('Preset Updated', `"${newPresetForm.title}" updated.`);
      } else {
        await addDishPreset(activePresetSlot, {
          title: newPresetForm.title.trim(),
          category: newPresetForm.category,
          items,
          timing: newPresetForm.timing || '',
          timeMode: newPresetForm.timeMode || 'clock',
        });
        dialog.toast.success('Preset Created', `"${newPresetForm.title}" saved.`);
      }
      setNewPresetForm({ title: '', itemsStr: '', category: 'Veg', timing: '', timeMode: 'clock' });
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
              setEditingCalendarDate(null);
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
              setEditingCalendarDate(null);
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
              setEditingCalendarDate(null);
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

        {/* If Calendar Studio Mode and not editing a specific date, show Full Interactive Calendar Matrix */}
        {studioMode === 'calendar' && !editingCalendarDate ? (
          <MenuCalendarMatrix
            weeklyMenu={weeklyMenu}
            overrides={overrides}
            onSelectDate={(dateStr) => {
              feedback('tick');
              setTargetDate(dateStr);
              setEditingCalendarDate(dateStr);
              setScope('calendar_date');
            }}
            onAddNewFeast={(dateStr) => {
              feedback('tick');
              const d = dateStr || todayStr;
              setTargetDate(d);
              setEditingCalendarDate(d);
              setScope('calendar_date');
              setDayStatus('event');
              if (!occasion) setOccasion('Campus Feast');
            }}
            onDeleteOverride={handleDeleteOverride}
            onOpenRangedModal={() => setIsRangedModalOpen(true)}
          />
        ) : (
          <>
            {/* Calendar override active edit breadcrumb & delete override button */}
            {studioMode === 'calendar' && editingCalendarDate && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-3xl bg-purple-500/10 border border-purple-200 dark:border-purple-800/40 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      feedback('tick');
                      setEditingCalendarDate(null);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Calendar Matrix</span>
                  </button>
                  <div>
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <h3 className="text-sm sm:text-base font-black text-purple-900 dark:text-purple-200">
                        Feast & Date Override: {formatFriendlyDate(targetDate)}
                      </h3>
                    </div>
                    <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80">
                      Configuring custom dishes, event replacement, or leave routine for this specific date.
                    </p>
                  </div>
                </div>

                {overrides[targetDate] && (
                  <button
                    type="button"
                    onClick={() => handleDeleteOverride(targetDate)}
                    className="px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-bold flex items-center gap-1.5 transition-all self-end sm:self-auto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Override</span>
                  </button>
                )}
              </div>
            )}

            {/* 3. Universal Scope Engine Selector (Active in Live / Template Mode) */}
            {studioMode !== 'calendar' && (
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
      )}

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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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
                  </div>

                  <MealTimingInput
                    value={newPresetForm.timing}
                    timeMode={newPresetForm.timeMode}
                    onChange={(timing, mode) => setNewPresetForm((p) => ({ ...p, timing, timeMode: mode }))}
                    slotKey={activePresetSlot}
                  />

                  <div className="flex items-center gap-2 pt-1">
                    <select
                      value={newPresetForm.category}
                      onChange={(e) => setNewPresetForm((p) => ({ ...p, category: e.target.value }))}
                      className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 text-xs font-bold flex-1"
                    >
                      <option value="">None (No Tag)</option>
                      {CATEGORIES.map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleSaveInlinePreset}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-sm"
                    >
                      Save Preset
                    </button>
                    <button
                      onClick={() => setIsAddingPreset(false)}
                      className="p-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
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
                        {preset.timing && (
                          <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.2 rounded-md text-[9px] font-mono font-bold bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/20">
                            <Clock className="w-2.5 h-2.5 text-purple-500" />
                            <span>{preset.timing}</span>
                          </span>
                        )}
                      </div>
                      {preset.category && (
                        <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300">
                          {preset.category}
                        </span>
                      )}
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

        {/* 5. Systematic Day Operational Mode Selector */}
        <div className="p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                Day Operational Status
              </span>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                How should the dining hall operate for this selection?
              </h3>
            </div>

            {/* 4-way Segmented Selector */}
            <div className="grid grid-cols-2 sm:flex sm:items-center gap-1.5 p-1 rounded-2xl bg-gray-100/80 dark:bg-white/5 border border-gray-200/50 dark:border-white/5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setDayStatus('standard');
                  setIsClosedDay(false);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  dayStatus === 'standard'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>Standard</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setDayStatus('closed');
                  setIsClosedDay(true);
                  if (!closureReason) setClosureReason('Routine Off-Day');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  dayStatus === 'closed'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Closed / Leave</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setDayStatus('event');
                  setIsClosedDay(false);
                  if (!occasion) setOccasion('Campus Feast & Gathering');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  dayStatus === 'event'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Event / Feast</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setDayStatus('fasting');
                  setIsClosedDay(false);
                  if (!fastingTitle) setFastingTitle('Sunnah Fast Routine');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  dayStatus === 'fasting'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Fasting Routine</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setDayStatus('archived');
                  setIsClosedDay(true);
                  if (!closureReason) setClosureReason('Archived Schedule (Inactive Day)');
                }}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  dayStatus === 'archived'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Archived</span>
              </button>
            </div>
          </div>

          {/* Contextual Panel for Archived Day */}
          {dayStatus === 'archived' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Archive className="w-3.5 h-3.5 text-amber-500" />
                  <span>Day Schedule Archived (Meals Suspended / Off-Board)</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setDayStatus('standard');
                    setIsClosedDay(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-colors"
                >
                  Unarchive Day
                </button>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  placeholder="Specify Archive Reason (e.g. Vacation Break, Semester End, Routine Suspended)"
                  className="w-full px-3.5 py-2 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-[#121c19] text-xs font-bold text-amber-950 dark:text-amber-100 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">Quick Reasons:</span>
                  {[
                    'Vacation Break',
                    'Term Break Off',
                    'Semester Transition',
                    'Canteen Inactive',
                    'Special Off-Routine',
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setClosureReason(r)}
                      className="px-2.5 py-1 rounded-lg bg-amber-100/80 dark:bg-amber-900/40 hover:bg-amber-200 text-amber-800 dark:text-amber-200 text-[11px] font-bold transition-colors"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Contextual Panel for Closed / Leave */}
          {dayStatus === 'closed' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-rose-500" />
                  <span>Canteen Dining Hall Closed & Supply Suspended</span>
                </span>
                <span className="text-[11px] text-rose-700/80 dark:text-rose-400/80">
                  Notice banner will appear on student screens and public board.
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={closureReason}
                  onChange={(e) => setClosureReason(e.target.value)}
                  placeholder="Specify Leave / Closure Reason (e.g. Routine Off-Day, Campus Holiday, Kitchen Maintenance)"
                  className="w-full px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-[#121c19] text-xs font-bold text-rose-950 dark:text-rose-100 placeholder-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase">Quick Reasons:</span>
                  {[
                    'Routine Off-Day',
                    'Campus Holiday',
                    'Kitchen Maintenance',
                    'Study Leave Break',
                    'Vacation Period',
                    'Special Cleaning Day',
                  ].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setClosureReason(r)}
                      className="px-2.5 py-1 rounded-lg bg-rose-100/80 dark:bg-rose-900/40 hover:bg-rose-200 text-rose-800 dark:text-rose-200 text-[11px] font-bold transition-colors"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Contextual Panel for Campus Event / Feast */}
          {dayStatus === 'event' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-purple-800 dark:text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                  <span>Replaced by Campus Event / Special Feast</span>
                </span>
                <span className="text-[11px] text-purple-700/80 dark:text-purple-400/80">
                  Event metadata and special feast dishes will be highlighted across digital displays.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase block mb-1">
                    Event Title / Occasion
                  </label>
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="e.g. Milad Sharif Feast, Union Assembly"
                    className="w-full px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-[#121c19] text-xs font-bold text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase block mb-1">
                    Venue / Dining Location
                  </label>
                  <input
                    type="text"
                    value={eventVenue}
                    onChange={(e) => setEventVenue(e.target.value)}
                    placeholder="e.g. Campus Central Grounds, Auditorium"
                    className="w-full px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-[#121c19] text-xs font-bold text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase block mb-1">
                    Sponsor / Host (Optional)
                  </label>
                  <input
                    type="text"
                    value={eventSponsor}
                    onChange={(e) => setEventSponsor(e.target.value)}
                    placeholder="e.g. Batch 2024, Alumni Association"
                    className="w-full px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-[#121c19] text-xs font-bold text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase block mb-1">
                  Event Notes / Special Instructions
                </label>
                <input
                  type="text"
                  value={eventNotes}
                  onChange={(e) => setEventNotes(e.target.value)}
                  placeholder="e.g. Food packets will be distributed after Maghrib prayer."
                  className="w-full px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-[#121c19] text-xs font-bold text-gray-900 dark:text-white"
                />
              </div>
            </motion.div>
          )}

          {/* Contextual Panel for Fasting Routine */}
          {dayStatus === 'fasting' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/40 space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-cyan-800 dark:text-cyan-300 flex items-center gap-1.5">
                  <Moon className="w-3.5 h-3.5 text-cyan-500" />
                  <span>Fasting Routine (Sahar & Iftar Schedule)</span>
                </span>
                <span className="text-[11px] text-cyan-700/80 dark:text-cyan-400/80">
                  Lunch will be suspended; Sahar and Iftar meal timings will be prioritized.
                </span>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={fastingTitle}
                  onChange={(e) => setFastingTitle(e.target.value)}
                  placeholder="Fasting Occasion (e.g. Monday Sunnah Fast, Ashura Fast)"
                  className="w-full px-3.5 py-2 rounded-xl border border-cyan-300 dark:border-cyan-800 bg-white dark:bg-[#121c19] text-xs font-bold text-cyan-950 dark:text-cyan-100 placeholder-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />

                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-bold text-cyan-600 dark:text-cyan-400 uppercase">Presets:</span>
                  {[
                    'Monday Sunnah Fast',
                    'Thursday Sunnah Fast',
                    'Ayyam al-Beed Fast',
                    'Ashura Fast',
                    'Arafah Fast',
                    'Ramadan Routine',
                  ].map((f) => (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setFastingTitle(f)}
                      className="px-2.5 py-1 rounded-lg bg-cyan-100/80 dark:bg-cyan-900/40 hover:bg-cyan-200 text-cyan-800 dark:text-cyan-200 text-[11px] font-bold transition-colors"
                    >
                      {f}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* 6. Unified Meal Slot Canvas (Breakfast, Lunch, Evening Tea, Dinner) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SLOT_CONFIGS.map((slot) => {
            const current = slotData[slot.key] || createEmptySlot(slot.defaultTiming);
            const slotStatus = current.slotStatus || 'serving';
            const slotPresets = Array.isArray(presetsMap[slot.key]) ? presetsMap[slot.key].slice(0, 4) : [];
            const Icon = slot.icon;

            return (
              <div
                key={slot.key}
                className={`p-5 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border shadow-sm space-y-4 transition-all ${
                  slotStatus === 'leave'
                    ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10'
                    : slotStatus === 'event'
                    ? 'border-purple-200 dark:border-purple-900/50 bg-purple-50/20 dark:bg-purple-950/10'
                    : slotStatus === 'fasting'
                    ? 'border-cyan-200 dark:border-cyan-900/50 bg-cyan-50/20 dark:bg-cyan-950/10'
                    : 'border-gray-200/80 dark:border-white/10'
                }`}
              >
                {/* Slot Header */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
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

                  {/* Slot Status Switcher & Save Preset Button */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1 p-0.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/50 dark:border-white/5">
                      <button
                        type="button"
                        onClick={() => handleSlotChange(slot.key, 'slotStatus', 'serving')}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                          slotStatus === 'serving'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Serving
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSlotChange(slot.key, 'slotStatus', 'leave');
                          if (!current.leaveReason) handleSlotChange(slot.key, 'leaveReason', 'No Meal Served');
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                          slotStatus === 'leave'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Leave
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSlotChange(slot.key, 'slotStatus', 'event');
                          if (!current.eventTitle) handleSlotChange(slot.key, 'eventTitle', 'Special Event Feast');
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                          slotStatus === 'event'
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Event
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSlotChange(slot.key, 'slotStatus', 'fasting');
                          if (!current.fastingTitle) handleSlotChange(slot.key, 'fastingTitle', slot.key === 'dinner' ? 'Iftar Meal' : 'Sahar Meal');
                        }}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                          slotStatus === 'fasting'
                            ? 'bg-cyan-600 text-white shadow-xs'
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        Fast
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSaveSlotAsPreset(slot.key)}
                      className="px-2 py-1 rounded-lg border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-[10px] font-bold flex items-center gap-1 transition-colors"
                      title="Save as reusable preset"
                    >
                      <BookmarkPlus className="w-3 h-3" />
                      <span className="hidden sm:inline">Preset</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleArchiveSlot(slot.key)}
                      className={`px-2 py-1 rounded-lg border text-[10px] font-bold flex items-center gap-1 transition-colors ${
                        current.isArchived
                          ? 'border-amber-400 bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500/20'
                          : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-amber-600 hover:border-amber-300'
                      }`}
                      title={current.isArchived ? 'Unarchive meal slot' : 'Archive meal slot'}
                    >
                      {current.isArchived ? <ArchiveRestore className="w-3 h-3 text-amber-500" /> : <Archive className="w-3 h-3" />}
                      <span className="hidden sm:inline">{current.isArchived ? 'Archived' : 'Archive'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleClearSlot(slot.key)}
                      className="p-1 rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-800 transition-colors"
                      title={`Clear ${slot.label} slot`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Archived Slot Notice Banner */}
                {current.isArchived && (
                  <div className="p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/40 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                      <Archive className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>This meal slot is archived (suspended).</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleArchiveSlot(slot.key)}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-bold shrink-0 transition-colors"
                    >
                      Restore Slot
                    </button>
                  </div>
                )}

                {/* Context: Leave / Suspended */}
                {slotStatus === 'leave' && (
                  <div className="p-3.5 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 space-y-2.5">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-300 font-bold text-xs">
                      <Lock className="w-3.5 h-3.5" />
                      <span>{slot.label} Suspended (Leave / Kitchen Off)</span>
                    </div>
                    <input
                      type="text"
                      value={current.leaveReason || ''}
                      onChange={(e) => handleSlotChange(slot.key, 'leaveReason', e.target.value)}
                      placeholder="Reason for suspension (e.g. No breakfast - Dars extended, Self cooked)"
                      className="w-full px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-[#121c19] text-xs font-bold text-rose-950 dark:text-rose-200 placeholder-rose-400"
                    />
                    <div className="flex flex-wrap items-center gap-1">
                      {['No Meal Served', 'Class / Dars Extended', 'Combined with Next Meal', 'Maintenance Break'].map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleSlotChange(slot.key, 'leaveReason', r)}
                          className="px-2 py-0.5 rounded-md bg-rose-100/80 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200 text-[10px] font-bold transition-colors"
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Context: Event / Replaced */}
                {slotStatus === 'event' && (
                  <div className="p-3.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/40 space-y-2.5">
                    <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                      <span>{slot.label} Replaced by Event / Program Feast</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        value={current.eventTitle || ''}
                        onChange={(e) => handleSlotChange(slot.key, 'eventTitle', e.target.value)}
                        placeholder="Feast Title (e.g. Assembly Biryani)"
                        className="px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-[#121c19] text-xs font-bold text-gray-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={current.eventVenue || ''}
                        onChange={(e) => handleSlotChange(slot.key, 'eventVenue', e.target.value)}
                        placeholder="Venue (e.g. Auditorium Hall)"
                        className="px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-[#121c19] text-xs font-bold text-gray-900 dark:text-white"
                      />
                    </div>
                    <MealTimingInput
                      value={current.timing}
                      timeMode={current.timeMode}
                      onChange={(timing, mode) => {
                        handleSlotChange(slot.key, 'timing', timing);
                        handleSlotChange(slot.key, 'timeMode', mode);
                      }}
                      dayKey={effectiveDayKey}
                      slotKey={slot.key}
                    />
                  </div>
                )}

                {/* Context: Fasting Routine */}
                {slotStatus === 'fasting' && (
                  <div className="p-3.5 rounded-2xl bg-cyan-50/70 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/40 space-y-2.5">
                    <div className="flex items-center gap-2 text-cyan-700 dark:text-cyan-300 font-bold text-xs">
                      <Moon className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Fasting Routine Slot ({slot.key === 'dinner' ? 'Iftar Meal' : slot.key === 'breakfast' ? 'Sahar Meal' : 'Fasting Window'})</span>
                    </div>
                    <input
                      type="text"
                      value={current.fastingTitle || current.title || ''}
                      onChange={(e) => {
                        handleSlotChange(slot.key, 'fastingTitle', e.target.value);
                        handleSlotChange(slot.key, 'title', e.target.value);
                      }}
                      placeholder="Meal Title (e.g. Fresh Juice, Dates & Porridge / Sahar Kanji)"
                      className="w-full px-3 py-1.5 rounded-xl border border-cyan-300 dark:border-cyan-800 bg-white dark:bg-[#121c19] text-xs font-bold text-gray-900 dark:text-white"
                    />
                    <MealTimingInput
                      value={current.timing}
                      timeMode={current.timeMode}
                      onChange={(timing, mode) => {
                        handleSlotChange(slot.key, 'timing', timing);
                        handleSlotChange(slot.key, 'timeMode', mode);
                      }}
                      dayKey={effectiveDayKey}
                      slotKey={slot.key}
                    />
                  </div>
                )}

                {/* Standard Serving Form */}
                {slotStatus === 'serving' && (
                  <div className="space-y-3">
                    {/* Dish Title */}
                    <input
                      type="text"
                      value={current.title}
                      onChange={(e) => handleSlotChange(slot.key, 'title', e.target.value)}
                      placeholder={`e.g. ${slot.key === 'breakfast' ? 'Porotta & Kadala' : slot.key === 'lunch' ? 'Rice & Chicken Curry' : slot.key === 'evening' ? 'Tea & Parippuvada' : 'Neychor & Beef'}`}
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-black/20 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />

                    {/* Meal Timing Input (Clock or Text / Dars with Malabar presets) */}
                    <MealTimingInput
                      value={current.timing}
                      timeMode={current.timeMode}
                      onChange={(timing, mode) => {
                        handleSlotChange(slot.key, 'timing', timing);
                        handleSlotChange(slot.key, 'timeMode', mode);
                      }}
                      dayKey={effectiveDayKey}
                      slotKey={slot.key}
                    />

                    {/* Dietary Category Badges */}
                    <div className="space-y-1.5">
                      <span className="text-[10px] font-bold text-gray-400 block uppercase">
                        Dietary Classification
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleSlotChange(slot.key, 'category', '')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                            !current.category
                              ? 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-400 dark:border-gray-600 ring-2 ring-gray-400/40 scale-105'
                              : 'border-gray-200/70 dark:border-white/10 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                          }`}
                          title="No dietary tag (neutral/untagged)"
                        >
                          ✕ None
                        </button>
                        {CATEGORIES.map((cat) => {
                          const isActive = current.category === cat.key;
                          return (
                            <button
                              key={cat.key}
                              type="button"
                              onClick={() => handleSlotChange(slot.key, 'category', isActive ? '' : cat.key)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                                isActive
                                  ? `${cat.badgeClass} ring-2 ring-emerald-500/30 scale-105`
                                  : 'border-gray-200/70 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                              }`}
                              title={isActive ? 'Click to deselect tag' : `Set as ${cat.label}`}
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
                )}
              </div>
            );
          })}
        </div>

        {/* 7. Sticky Batch Action Bar */}
        <div className="sticky bottom-4 z-40 p-4 rounded-3xl bg-gray-900/95 dark:bg-[#0f1715]/95 text-white border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Check className="w-5 h-5" />
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
              onClick={handleToggleArchiveDay}
              className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors ${
                dayStatus === 'archived'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white'
              }`}
              title={dayStatus === 'archived' ? 'Restore day schedule' : 'Archive day schedule'}
            >
              {dayStatus === 'archived' ? (
                <>
                  <ArchiveRestore className="w-3.5 h-3.5 text-amber-400" />
                  <span>Unarchive Day</span>
                </>
              ) : (
                <>
                  <Archive className="w-3.5 h-3.5 text-amber-400" />
                  <span>Archive Day</span>
                </>
              )}
            </button>

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
      </>
    )}

    {/* Ranged Menu Multi-Date Override Modal */}
    <RangedMenuModal
      isOpen={isRangedModalOpen}
      onClose={() => setIsRangedModalOpen(false)}
      weeklyMenu={weeklyMenu}
      userEmail={user?.email || 'admin'}
    />

      </div>
    </div>
  );
}
