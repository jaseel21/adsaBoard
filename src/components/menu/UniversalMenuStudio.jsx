import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  Sparkles,
  Calendar,
  Clock,
  RotateCcw,
  Save,
  ArrowLeft,
  Edit3,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  ChevronRight,
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
  Eye,
  Lock,
  Moon,
  Archive,
  ArchiveRestore,
  RefreshCw,
  Send,
  Zap,
  Copy,
  Sun,
  Flame,
} from 'lucide-react';
import { AuthContext } from '../../store/AuthContext';
import { dialog } from '../../utils/dialog';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { useWorldTime } from '../../utils/time';
import {
  DAY_KEYS,
  DAY_NAMES,
  DAY_SHORTS,
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
  subscribeToDishPresets,
  addDishPreset,
  updateDishPreset,
  deleteDishPreset,
  createEmptyWeeklyMenu,
  DEFAULT_WEEKLY_MENU,
  determineActiveMealSlot,
  fillEmptyDaysFromBaseline,
  syncWeeklyMenuFromBaseline,
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
import PresetSelectorModal from './PresetSelectorModal';
import MealItemsListEditor from './MealItemsListEditor';
import DirectApplyPresetModal from './DirectApplyPresetModal';

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
  isSpecialMeal: false,
  specialTitle: '',
  specialSponsor: '',
  specialNotes: '',
  specialTiming: '',
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
  const { dayShort, timeHms, todayIST: worldTodayIST } = useWorldTime('Asia/Kolkata');

  // Authoritative Today and Tomorrow in IST
  const todayStr = useMemo(() => worldTodayIST || getTodayISTDate(), [worldTodayIST]);
  const tomorrowStr = useMemo(() => addDaysToDate(todayStr, 1), [todayStr]);
  const todayDow = useMemo(() => getDayOfWeekShort(todayStr), [todayStr]);
  const tomorrowDow = useMemo(() => getDayOfWeekShort(tomorrowStr), [tomorrowStr]);

  // Primary Workspace Tabs: 'calendar' | 'template' | 'live' | 'presets'
  const [studioMode, setStudioMode] = useState('calendar');

  // Operational Scope: 'single_day' | 'bulk_days' | 'calendar_date'
  const [scope, setScope] = useState('single_day');

  // Schedules state from Firestore (initialized with clean neutral skeletons, zero hardcoded food items)
  const [weeklyMenu, setWeeklyMenu] = useState(() => createEmptyWeeklyMenu());
  const [defaultTemplate, setDefaultTemplate] = useState(() => createEmptyWeeklyMenu());
  const [overrides, setOverrides] = useState({});
  const [presetsMap, setPresetsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Scope Target Parameters
  const [selectedDayKey, setSelectedDayKey] = useState('fr');
  const [bulkDays, setBulkDays] = useState(['mo', 'tu', 'we', 'th', 'fr']);
  const [targetDate, setTargetDate] = useState(todayStr);

  // Metadata for Feast & Closure
  const [dayStatus, setDayStatus] = useState('standard'); // 'standard' | 'closed' | 'event' | 'fasting' | 'archived'
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
    breakfast: createEmptySlot(getCanonicalMealTiming('fr', 'breakfast')),
    lunch: createEmptySlot(getCanonicalMealTiming('fr', 'lunch')),
    evening: createEmptySlot(getCanonicalMealTiming('fr', 'evening')),
    dinner: createEmptySlot(getCanonicalMealTiming('fr', 'dinner')),
  });

  // Preset Selector Modal when editing a meal in canvas
  const [isPresetSelectorOpen, setIsPresetSelectorOpen] = useState(false);
  const [presetSelectorSlot, setPresetSelectorSlot] = useState('breakfast');

  // Direct Apply to Meal / Day Modal
  const [isDirectApplyOpen, setIsDirectApplyOpen] = useState(false);
  const [presetForDirectApply, setPresetForDirectApply] = useState(null);

  // Presets Catalog Workspace State
  const [presetSearch, setPresetSearch] = useState('');
  const [activePresetSlot, setActivePresetSlot] = useState('breakfast');
  const [presetCategoryFilter, setPresetCategoryFilter] = useState('all');

  // Preset CRUD Modal (Create & Edit)
  const [presetCrudModalOpen, setPresetCrudModalOpen] = useState(false);
  const [presetCrudForm, setPresetCrudForm] = useState({
    title: '',
    items: [],
    category: 'Veg',
    timing: '',
    timeMode: 'clock',
    slotKey: 'breakfast',
    isEditing: false,
    originalTitle: '',
  });

  // Real-time Today/Tomorrow active meal determination
  const activeSlotMeta = useMemo(() => {
    const todayData = weeklyMenu[todayDow] || defaultTemplate[todayDow];
    return determineActiveMealSlot(timeHms, todayData);
  }, [timeHms, weeklyMenu, defaultTemplate, todayDow]);

  // Compute how many unconfigured days exist in Live Schedule
  const unconfiguredLiveDaysCount = useMemo(() => {
    let count = 0;
    DAY_KEYS.forEach((k) => {
      const d = weeklyMenu[k];
      const hasFood =
        Boolean(d?.breakfast?.title?.trim()) ||
        Boolean(d?.lunch?.title?.trim()) ||
        Boolean(d?.evening?.title?.trim()) ||
        Boolean(d?.dinner?.title?.trim());
      if (!hasFood) count += 1;
    });
    return count;
  }, [weeklyMenu]);

  // Sync initial day from world clock
  useEffect(() => {
    if (dayShort && DAY_KEYS.includes(dayShort)) {
      setSelectedDayKey(dayShort);
    }
  }, [dayShort]);

  // Live campus timing version tracker from settings/canteen_config
  const [scheduleVersion, setScheduleVersion] = useState(0);
  useEffect(() => {
    const unsub = subscribeToMealScheduleAndFines(() => {
      setScheduleVersion((v) => v + 1);
    });
    return () => unsub();
  }, []);

  // Effective Day of Week key
  const effectiveDayKey = useMemo(() => {
    if (editingCalendarDate) {
      return getDayOfWeekShort(editingCalendarDate);
    }
    if (scope === 'calendar_date' && targetDate) {
      return getDayOfWeekShort(targetDate);
    }
    return selectedDayKey;
  }, [editingCalendarDate, scope, targetDate, selectedDayKey]);

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

  // Populate active canvas whenever target day or mode changes
  useEffect(() => {
    const buildSlot = (slotObj, fallbackTiming) => {
      if (!slotObj) return createEmptySlot(fallbackTiming);
      return {
        ...createEmptySlot(fallbackTiming),
        ...slotObj,
        timing: slotObj.timing || fallbackTiming,
        timeMode: slotObj.timeMode || 'clock',
        slotStatus: slotObj.slotStatus || (slotObj.isArchived ? 'leave' : slotObj.isSpecialMeal ? 'event' : 'serving'),
        isSpecialMeal: Boolean(slotObj.isSpecialMeal),
        specialTitle: slotObj.specialTitle || '',
        specialSponsor: slotObj.specialSponsor || '',
        specialNotes: slotObj.specialNotes || '',
        specialTiming: slotObj.specialTiming || '',
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

    const bfTiming = getCanonicalMealTiming(effectiveDayKey, 'breakfast');
    const lunchTiming = getCanonicalMealTiming(effectiveDayKey, 'lunch');
    const eveningTiming = getCanonicalMealTiming(effectiveDayKey, 'evening');
    const dinnerTiming = getCanonicalMealTiming(effectiveDayKey, 'dinner');

    if (editingCalendarDate) {
      // Editing specific calendar date override
      const ovr = overrides[editingCalendarDate];
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
        // Inherit from weekly routine as baseline canvas for this date
        const routine = weeklyMenu[effectiveDayKey] || {};
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
    } else {
      // Normal Routine editing: Template vs Live Schedule
      const source = studioMode === 'template' ? defaultTemplate : weeklyMenu;
      const dayData = source[selectedDayKey] || {};

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
    }
  }, [editingCalendarDate, studioMode, selectedDayKey, weeklyMenu, defaultTemplate, overrides, effectiveDayKey, scheduleVersion]);

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

  // 1-Click Sync Slot Timing to Campus Default
  const handleSyncSlotTiming = (slotKey) => {
    feedback('tick');
    const canonical = getCanonicalMealTiming(effectiveDayKey, slotKey);
    handleSlotChange(slotKey, 'timing', canonical);
    dialog.toast.info('Campus Timing Synced', `Set ${slotKey} timing to "${canonical}".`);
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
        category: current.category || 'Veg',
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

  // Universal Save Engine: Handles Baseline Template, Live Week, and Calendar Overrides
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
          timing: slotData.breakfast?.timing || getCanonicalMealTiming(effectiveDayKey, 'breakfast'),
          timeMode: slotData.breakfast?.timeMode || 'clock',
          slotStatus: slotData.breakfast?.slotStatus || 'serving',
          isSpecialMeal: Boolean(slotData.breakfast?.isSpecialMeal),
          isAvailable: !isDayClosed && (slotData.breakfast?.slotStatus || 'serving') === 'serving' && !slotData.breakfast?.isArchived,
          isArchived: isDayClosed || (slotData.breakfast?.slotStatus || 'serving') === 'leave' || Boolean(slotData.breakfast?.isArchived),
        },
        lunch: {
          ...slotData.lunch,
          timing: slotData.lunch?.timing || getCanonicalMealTiming(effectiveDayKey, 'lunch'),
          timeMode: slotData.lunch?.timeMode || 'clock',
          slotStatus: slotData.lunch?.slotStatus || 'serving',
          isSpecialMeal: Boolean(slotData.lunch?.isSpecialMeal),
          isAvailable: !isDayClosed && (slotData.lunch?.slotStatus || 'serving') === 'serving' && !slotData.lunch?.isArchived,
          isArchived: isDayClosed || (slotData.lunch?.slotStatus || 'serving') === 'leave' || Boolean(slotData.lunch?.isArchived),
        },
        evening: {
          ...slotData.evening,
          timing: slotData.evening?.timing || getCanonicalMealTiming(effectiveDayKey, 'evening'),
          timeMode: slotData.evening?.timeMode || 'clock',
          slotStatus: slotData.evening?.slotStatus || 'serving',
          isSpecialMeal: Boolean(slotData.evening?.isSpecialMeal),
          isAvailable: !isDayClosed && (slotData.evening?.slotStatus || 'serving') === 'serving' && !slotData.evening?.isArchived,
          isArchived: isDayClosed || (slotData.evening?.slotStatus || 'serving') === 'leave' || Boolean(slotData.evening?.isArchived),
        },
        dinner: {
          ...slotData.dinner,
          timing: slotData.dinner?.timing || getCanonicalMealTiming(effectiveDayKey, 'dinner'),
          timeMode: slotData.dinner?.timeMode || 'clock',
          slotStatus: slotData.dinner?.slotStatus || 'serving',
          isSpecialMeal: Boolean(slotData.dinner?.isSpecialMeal),
          isAvailable: !isDayClosed && (slotData.dinner?.slotStatus || 'serving') === 'serving' && !slotData.dinner?.isArchived,
          isArchived: isDayClosed || (slotData.dinner?.slotStatus || 'serving') === 'leave' || Boolean(slotData.dinner?.isArchived),
        },
      };

      const dayMetadata = {
        dayStatus: dayStatus || 'standard',
        isArchived: isDayClosed || isDayArchived,
        isClosed: isDayClosed,
        archiveReason: isDayArchived ? (closureReason || 'Archived Day (Suspended)') : '',
        closureReason: isDayClosed ? (closureReason || 'Canteen Closed / Routine Off') : '',
        leaveReason: isDayClosed ? (closureReason || 'Canteen Closed / Routine Off') : '',
        eventTitle: dayStatus === 'event' ? occasion : '',
        eventVenue: dayStatus === 'event' ? eventVenue : '',
        eventSponsor: dayStatus === 'event' ? eventSponsor : '',
        eventNotes: dayStatus === 'event' ? eventNotes : '',
        fastingTitle: dayStatus === 'fasting' ? fastingTitle : '',
      };

      if (editingCalendarDate) {
        // Saving a Calendar Date Override
        const overridePayload = {
          dateStr: editingCalendarDate,
          occasion: occasion || (dayStatus === 'event' ? 'Campus Event / Feast' : dayStatus === 'fasting' ? 'Fasting Routine' : isDayClosed ? 'Canteen Closed' : 'Custom Daily Menu'),
          note: occasion || '',
          isHoliday: isDayClosed,
          holidayReason: isDayClosed ? (closureReason || 'Canteen Closed') : '',
          ...dayMetadata,
          ...sanitizedSlots,
        };

        await saveDateOverride(editingCalendarDate, overridePayload, user?.email || 'admin');
        dialog.toast.success('Override Saved', `Custom menu saved for ${formatFriendlyDate(editingCalendarDate)}.`);

        await logAuditEvent({
          action: 'MENU_DATE_OVERRIDE',
          category: AUDIT_CATEGORIES.CANTEEN_OPS,
          severity: AUDIT_SEVERITIES.INFO,
          actor: user?.email || 'admin',
          summary: `Updated date override for ${editingCalendarDate}: ${occasion || dayStatus}`,
          details: { targetDate: editingCalendarDate, occasion, status: dayStatus },
        });
      } else if (studioMode === 'template') {
        // Saving Baseline Routine Template
        const payload = {
          dayKey: selectedDayKey,
          dayName: DAY_NAMES[selectedDayKey] || selectedDayKey.toUpperCase(),
          dayShort: selectedDayKey.toUpperCase(),
          note: occasion || '',
          ...dayMetadata,
          ...sanitizedSlots,
        };

        const updatedTpl = { ...defaultTemplate, [selectedDayKey]: payload };
        await saveDefaultTemplate(updatedTpl, user?.email || 'admin');
        dialog.toast.success('Baseline Saved', `Saved standard baseline template for ${DAY_NAMES[selectedDayKey]}.`);

        await logAuditEvent({
          action: 'MENU_BASELINE_UPDATE',
          category: AUDIT_CATEGORIES.CANTEEN_OPS,
          severity: AUDIT_SEVERITIES.INFO,
          actor: user?.email || 'admin',
          summary: `Updated baseline template for ${DAY_NAMES[selectedDayKey]}`,
          details: { dayKey: selectedDayKey, status: dayStatus },
        });
      } else {
        // Saving Live Working Schedule
        const payload = {
          dayKey: selectedDayKey,
          dayName: DAY_NAMES[selectedDayKey] || selectedDayKey.toUpperCase(),
          dayShort: selectedDayKey.toUpperCase(),
          note: occasion || '',
          ...dayMetadata,
          ...sanitizedSlots,
        };

        await saveDayMenu(selectedDayKey, payload, user?.email || 'admin');
        dialog.toast.success('Live Schedule Saved', `Published live working menu for ${DAY_NAMES[selectedDayKey]}.`);

        await logAuditEvent({
          action: 'MENU_UPDATE',
          category: AUDIT_CATEGORIES.CANTEEN_OPS,
          severity: AUDIT_SEVERITIES.INFO,
          actor: user?.email || 'admin',
          summary: `Updated live supply menu for ${DAY_NAMES[selectedDayKey]}`,
          details: { dayKey: selectedDayKey, status: dayStatus },
        });
      }
    } catch (err) {
      console.error('Save error:', err);
      dialog.alert({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSaving(false);
    }
  };

  // Publish Baseline Template to Live Working Schedule
  const handlePublishBaselineToLive = async () => {
    if (!checkAuth()) return;
    const confirmed = await dialog.confirm({
      title: 'Publish Baseline to Live Working Schedule?',
      message: 'This will synchronize the live 7-day working schedule with your saved standard baseline template.',
      confirmColor: 'emerald',
      confirmText: 'Publish to Live',
      cancelText: 'Cancel',
      icon: 'send',
    });

    if (confirmed) {
      try {
        setSaving(true);
        feedback('pop');
        await saveWeeklyMenu(defaultTemplate, user?.email || 'admin');
        setWeeklyMenu(defaultTemplate);
        dialog.toast.success('Baseline Published', 'Active weekly supply is now synchronized with standard baseline.');
      } catch (err) {
        dialog.alert({ type: 'error', title: 'Publish Failed', message: err.message });
      } finally {
        setSaving(false);
      }
    }
  };

  // Reset Live Working Schedule from Baseline Template
  const handleResetLiveFromBaseline = async () => {
    if (!checkAuth()) return;
    const confirmed = await dialog.confirm({
      title: 'Reset Live Schedule from Baseline?',
      message: 'This will reset the active supply schedule back to the standard baseline template.',
      confirmColor: 'amber',
      confirmText: 'Reset from Baseline',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        setSaving(true);
        feedback('tick');
        const restored = await resetWeeklyMenuToDefault(user?.email || 'admin');
        setWeeklyMenu(restored);
        dialog.toast.success('Reset Complete', 'Live menu synchronized with baseline template.');
      } catch (err) {
        dialog.alert({ type: 'error', title: 'Reset Failed', message: err.message });
      } finally {
        setSaving(false);
      }
    }
  };

  // Clear Current Selection
  const handleClearCurrentSelection = async () => {
    if (!checkAuth()) return;
    const confirmed = await dialog.confirm({
      title: 'Clear Selected Day?',
      message: 'This will reset all 4 meal slots for the currently inspected day to clean blank dishes and campus timings.',
      icon: 'trash',
      confirmColor: 'rose',
      confirmText: 'Clear Day',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      const canonicalBf = getCanonicalMealTiming(effectiveDayKey, 'breakfast');
      const canonicalLunch = getCanonicalMealTiming(effectiveDayKey, 'lunch');
      const canonicalEvening = getCanonicalMealTiming(effectiveDayKey, 'evening');
      const canonicalDinner = getCanonicalMealTiming(effectiveDayKey, 'dinner');

      setSlotData({
        breakfast: createEmptySlot(canonicalBf),
        lunch: createEmptySlot(canonicalLunch),
        evening: createEmptySlot(canonicalEvening),
        dinner: createEmptySlot(canonicalDinner),
      });
      dialog.toast.info('Canvas Cleared', 'Click "Save & Publish Changes" to commit blank dishes.');
    }
  };

  // Presets CRUD & Direct Apply Handlers
  const handleOpenCreatePreset = (slotKey = activePresetSlot) => {
    feedback('tick');
    const targetSlot = slotKey === 'all' ? 'breakfast' : slotKey;
    setPresetCrudForm({
      title: '',
      items: [],
      category: 'Veg',
      timing: '',
      timeMode: 'clock',
      slotKey: targetSlot,
      isEditing: false,
      originalTitle: '',
    });
    setPresetCrudModalOpen(true);
  };

  const handleOpenEditPreset = (preset, slotKey = activePresetSlot) => {
    feedback('tick');
    const targetSlot = preset.sourceSlot || (slotKey === 'all' ? 'breakfast' : slotKey);
    setPresetCrudForm({
      title: preset.title || '',
      items: Array.isArray(preset.items) ? [...preset.items] : [],
      category: preset.category || 'Veg',
      timing: preset.timing || '',
      timeMode: preset.timeMode || 'clock',
      slotKey: targetSlot,
      isEditing: true,
      originalTitle: preset.title || '',
    });
    setPresetCrudModalOpen(true);
  };

  const handleDuplicatePreset = async (preset, slotKey = activePresetSlot) => {
    feedback('pop');
    const targetSlot = preset.sourceSlot || (slotKey === 'all' ? 'breakfast' : slotKey);
    try {
      const clonedTitle = `${preset.title} (Copy)`;
      await addDishPreset(targetSlot, {
        title: clonedTitle,
        category: preset.category || 'Veg',
        items: Array.isArray(preset.items) ? [...preset.items] : [],
        timing: preset.timing || '',
        timeMode: preset.timeMode || 'clock',
      });
      dialog.toast.success('Preset Cloned', `Created duplicate: "${clonedTitle}" in ${targetSlot}.`);
    } catch (err) {
      dialog.alert({ type: 'error', title: 'Clone Failed', message: err.message });
    }
  };

  const handleSavePresetModal = async () => {
    const trimmedTitle = presetCrudForm.title.trim();
    if (!trimmedTitle) {
      dialog.alert({ type: 'warning', title: 'Title Required', message: 'Please enter a title for the dish preset.' });
      return;
    }

    try {
      feedback('pop');
      const payload = {
        title: trimmedTitle,
        category: presetCrudForm.category || 'Veg',
        items: presetCrudForm.items.length > 0 ? presetCrudForm.items : [trimmedTitle],
        timing: presetCrudForm.timing || '',
        timeMode: presetCrudForm.timeMode || 'clock',
      };

      if (presetCrudForm.isEditing) {
        await updateDishPreset(presetCrudForm.slotKey, presetCrudForm.originalTitle, payload);
        dialog.toast.success('Preset Updated', `"${trimmedTitle}" saved.`);
      } else {
        await addDishPreset(presetCrudForm.slotKey, payload);
        dialog.toast.success('Preset Created', `"${trimmedTitle}" added to ${presetCrudForm.slotKey} presets.`);
      }

      setPresetCrudModalOpen(false);
    } catch (err) {
      console.error('Save preset error:', err);
      dialog.alert({ type: 'error', title: 'Save Failed', message: err.message });
    }
  };

  // Filtered presets catalog list for the Presets Workspace tab
  const currentPresetsList = useMemo(() => {
    let list = [];
    if (activePresetSlot === 'all') {
      Object.keys(presetsMap).forEach((sKey) => {
        const slotItems = Array.isArray(presetsMap[sKey]) ? presetsMap[sKey] : [];
        slotItems.forEach((p) => list.push({ ...p, sourceSlot: sKey }));
      });
    } else {
      const slotItems = Array.isArray(presetsMap[activePresetSlot]) ? presetsMap[activePresetSlot] : [];
      list = slotItems.map((p) => ({ ...p, sourceSlot: activePresetSlot }));
    }

    return list.filter((p) => {
      if (presetCategoryFilter !== 'all' && p.category !== presetCategoryFilter) {
        return false;
      }
      if (!presetSearch.trim()) return true;
      const q = presetSearch.toLowerCase();
      const matchTitle = p.title?.toLowerCase().includes(q);
      const matchItems = Array.isArray(p.items) && p.items.some((it) => it.toLowerCase().includes(q));
      return matchTitle || matchItems;
    });
  }, [presetsMap, activePresetSlot, presetCategoryFilter, presetSearch]);

  const totalCatalogPresetsCount = useMemo(() => {
    let total = 0;
    Object.values(presetsMap).forEach((arr) => {
      if (Array.isArray(arr)) total += arr.length;
    });
    return total;
  }, [presetsMap]);

  return (
    <div className="min-h-screen w-full bg-[#f8faf8] dark:bg-[#080d0b] text-gray-900 dark:text-gray-100 py-6 px-3 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-5">

        {/* 1. Header Navigation Bar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <button
              type="button"
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
                  Menu Studio
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/60">
                  Dynamic Engine
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Multi-view academic calendar, systematic baseline templates, live working supply, and meal-specific feasts.
              </p>
            </div>
          </div>

          {/* Quick Actions & Navigation */}
          <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-end">
            <button
              type="button"
              onClick={() => navigate('/menu')}
              className="px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-500" />
              <span>Public /menu</span>
            </button>

            <button
              type="button"
              onClick={() => setIsRangedModalOpen(true)}
              className="px-3.5 py-2 rounded-xl border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <CalendarDays className="w-3.5 h-3.5" />
              <span>Ranged Period</span>
            </button>
          </div>
        </div>

        {/* 1.5 Today-Tomorrow Active Serving Ribbon */}
        <div className="p-3.5 sm:p-4 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-purple-500/10 dark:from-emerald-950/30 dark:via-teal-950/20 dark:to-purple-950/30 border border-emerald-500/20 dark:border-emerald-500/30 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 ${
                activeSlotMeta?.isTomorrow
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-emerald-600 text-white shadow-xs'
              }`}
            >
              {activeSlotMeta?.isTomorrow ? <Moon className="w-4 h-4" /> : <Utensils className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-gray-900 dark:text-white">
                  {activeSlotMeta?.isTomorrow ? "Tomorrow's Schedule Active" : "Serving Today"}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                    activeSlotMeta?.isTomorrow
                      ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  }`}
                >
                  {activeSlotMeta?.statusLabel}
                </span>
                <span className="text-[10px] font-mono text-gray-400">
                  IST {timeHms || '12:00:00'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-0.5">
                {activeSlotMeta?.isTomorrow
                  ? "Evening cutoff passed (18:00 IST). Canteen is preparing tomorrow's meal roster."
                  : `Currently active serving window: ${activeSlotMeta?.slot?.toUpperCase()} on ${DAY_NAMES[todayDow]}.`}
              </p>
            </div>
          </div>

          {/* Quick Focus Steppers */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end shrink-0">
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setSelectedDayKey(todayDow);
                setTargetDate(todayStr);
                setEditingCalendarDate(null);
                setStudioMode('live');
                dialog.toast.info('Focus: Today', `Switched to ${DAY_NAMES[todayDow]}'s live supply.`);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 border ${
                selectedDayKey === todayDow && studioMode === 'live'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-white/80 dark:bg-white/5 border-emerald-200 dark:border-emerald-800/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-50'
              }`}
            >
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>Focus Today ({DAY_SHORTS[todayDow]})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setSelectedDayKey(tomorrowDow);
                setTargetDate(tomorrowStr);
                setEditingCalendarDate(null);
                setStudioMode('live');
                dialog.toast.info('Focus: Tomorrow', `Switched to ${DAY_NAMES[tomorrowDow]}'s live supply.`);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 border ${
                selectedDayKey === tomorrowDow && studioMode === 'live'
                  ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                  : 'bg-white/80 dark:bg-white/5 border-purple-200 dark:border-purple-800/40 text-purple-800 dark:text-purple-300 hover:bg-purple-50'
              }`}
            >
              <Moon className="w-3 h-3 text-purple-400" />
              <span>Focus Tomorrow ({DAY_SHORTS[tomorrowDow]})</span>
            </button>
          </div>
        </div>

        {/* 2. Workspace Navigation Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 backdrop-blur-md overflow-x-auto">
          {[
            { id: 'calendar', label: 'Dynamic Calendar', icon: Calendar, badge: `${Object.keys(overrides).length} Feasts` },
            { id: 'template', label: 'Baseline Routine Template', icon: Sliders, badge: 'Standard' },
            { id: 'live', label: 'Live Supply Schedule', icon: Clock, badge: 'Active Week' },
            { id: 'presets', label: 'Dish Presets Library', icon: Bookmark, badge: `${totalCatalogPresetsCount} Catalog` },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = studioMode === tab.id && !editingCalendarDate;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  feedback('tick');
                  setStudioMode(tab.id);
                  setEditingCalendarDate(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase ${
                      isActive ? 'bg-white/20 text-white' : 'bg-gray-200/70 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* 3. CALENDAR WORKSPACE */}
        {studioMode === 'calendar' && !editingCalendarDate && (
          <MenuCalendarMatrix
            weeklyMenu={weeklyMenu}
            defaultTemplate={defaultTemplate}
            overrides={overrides}
            selectedDate={targetDate}
            onSelectDate={(dateStr) => {
              feedback('tick');
              setTargetDate(dateStr);
              setEditingCalendarDate(dateStr);
            }}
            onAddNewFeast={(dateStr) => {
              feedback('tick');
              const d = dateStr || todayStr;
              setTargetDate(d);
              setEditingCalendarDate(d);
              setDayStatus('event');
              if (!occasion) setOccasion('Campus Feast & Gathering');
            }}
            onDeleteOverride={handleDeleteOverride}
            onOpenRangedModal={() => setIsRangedModalOpen(true)}
          />
        )}

        {/* 4. PRESETS WORKSPACE (COMPLETE CRUD & DIRECT APPLY) */}
        {studioMode === 'presets' && !editingCalendarDate && (
          <div className="p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-5">
            {/* Presets Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-white/5">
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-purple-600" />
                  <span>Dish Presets Catalog & Library</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    {currentPresetsList.length} Items
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Curated traditional Malabar Dars recipes and campus staples. Create, edit, clone, or apply directly across days.
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenCreatePreset(activePresetSlot)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Create New Preset</span>
              </button>
            </div>

            {/* Filter Deck: Search Input + Slot Tabs + Category Pills */}
            <div className="space-y-3 p-4 rounded-2xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={presetSearch}
                  onChange={(e) => setPresetSearch(e.target.value)}
                  placeholder="Search preset by title (e.g. Porotta, Dum Biriyani) or dish ingredients..."
                  className="w-full pl-10 pr-4 py-2 text-xs font-medium rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#121c19] text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                {presetSearch && (
                  <button
                    type="button"
                    onClick={() => setPresetSearch('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Meal Slot Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase pr-1 shrink-0">Slot:</span>
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setActivePresetSlot('all');
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                    activePresetSlot === 'all'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 border border-gray-200/60 dark:border-white/5'
                  }`}
                >
                  All Slots ({totalCatalogPresetsCount})
                </button>
                {SLOT_CONFIGS.map((s) => {
                  const Icon = s.icon;
                  const count = Array.isArray(presetsMap[s.key]) ? presetsMap[s.key].length : 0;
                  const isSelected = activePresetSlot === s.key;
                  return (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        setActivePresetSlot(s.key);
                      }}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        isSelected
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 border border-gray-200/60 dark:border-white/5'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{s.label}</span>
                      <span className="text-[10px] opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto">
                <span className="text-[10px] font-bold text-gray-400 uppercase pr-1 shrink-0">Dietary:</span>
                {[{ key: 'all', label: 'All Diets' }, ...CATEGORIES].map((cat) => {
                  const isSelected = presetCategoryFilter === cat.key;
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        setPresetCategoryFilter(cat.key);
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

            {/* Presets Cards Grid */}
            {currentPresetsList.length === 0 ? (
              <div className="py-12 text-center space-y-2">
                <Bookmark className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-bold text-gray-600 dark:text-gray-400">
                  No presets found in this filter
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setPresetSearch('');
                    setPresetCategoryFilter('all');
                    setActivePresetSlot('all');
                  }}
                  className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {currentPresetsList.map((preset, idx) => {
                  const slotForPreset = preset.sourceSlot || activePresetSlot;
                  return (
                    <div
                      key={idx}
                      className="p-4 rounded-3xl border border-gray-200/80 dark:border-white/10 bg-white/70 dark:bg-[#121c19]/70 hover:border-purple-300 dark:hover:border-purple-700 transition-all flex flex-col justify-between space-y-3 group shadow-xs hover:shadow-md"
                    >
                      <div className="space-y-2">
                        {/* Card Header: Title + Category */}
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-black text-sm text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                            {preset.title}
                          </span>

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
                            {preset.category || 'Veg'}
                          </span>
                        </div>

                        {/* Timing */}
                        {preset.timing && (
                          <div className="flex items-center gap-1 text-[10px] text-gray-400 font-mono">
                            <Clock className="w-2.5 h-2.5 text-purple-500" />
                            <span>{preset.timing}</span>
                          </div>
                        )}

                        {/* Full Items Chips */}
                        {Array.isArray(preset.items) && preset.items.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {preset.items.map((it, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-[11px] font-medium"
                              >
                                {it}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card Action Deck: Direct Apply + Edit + Duplicate + Delete */}
                      <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-1.5 flex-wrap">
                        {/* Direct Apply Button */}
                        <button
                          type="button"
                          onClick={() => {
                            feedback('tick');
                            setPresetForDirectApply({ ...preset, sourceSlot: slotForPreset });
                            setIsDirectApplyOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-xs flex items-center gap-1.5 transition-colors"
                          title="Apply this preset directly to any day, meal, or calendar date"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Direct Apply</span>
                        </button>

                        <div className="flex items-center gap-1">
                          {/* Edit Preset */}
                          <button
                            type="button"
                            onClick={() => handleOpenEditPreset(preset, slotForPreset)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-purple-300 text-gray-500 hover:text-purple-600 transition-colors"
                            title="Edit Preset"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          {/* Clone Preset */}
                          <button
                            type="button"
                            onClick={() => handleDuplicatePreset(preset, slotForPreset)}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-blue-300 text-gray-500 hover:text-blue-600 transition-colors"
                            title="Clone / Duplicate Preset"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Preset */}
                          <button
                            type="button"
                            onClick={async () => {
                              const confirmed = await dialog.confirm({
                                title: `Delete Preset?`,
                                message: `Remove "${preset.title}" from ${slotForPreset} presets?`,
                                confirmColor: 'rose',
                              });
                              if (confirmed) {
                                await deleteDishPreset(slotForPreset, preset.title);
                                dialog.toast.info('Deleted', 'Preset removed.');
                              }
                            }}
                            className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 hover:border-rose-300 text-gray-400 hover:text-rose-500 transition-colors"
                            title="Delete Preset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 5. CANVAS EDITOR (ACTIVE IN TEMPLATE, LIVE, OR WHEN EDITING CALENDAR OVERRIDE) */}
        {(studioMode === 'template' || studioMode === 'live' || editingCalendarDate) && (
          <div className="space-y-5">
            {/* Contextual Notice Banner */}
            {editingCalendarDate ? (
              <div className="p-4 rounded-3xl bg-purple-500/10 border border-purple-200 dark:border-purple-800/40 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setEditingCalendarDate(null)}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Back to Calendar</span>
                  </button>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-purple-900 dark:text-purple-200 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>Editing Custom Date Override: {formatFriendlyDate(editingCalendarDate)}</span>
                    </h3>
                    <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80">
                      Dishes set here will only apply to {formatFriendlyDate(editingCalendarDate)}. Regular routine remains intact.
                    </p>
                  </div>
                </div>

                {overrides[editingCalendarDate] && (
                  <button
                    type="button"
                    onClick={() => handleDeleteOverride(editingCalendarDate)}
                    className="px-3 py-1.5 rounded-xl border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-bold transition-all"
                  >
                    Delete Override
                  </button>
                )}
              </div>
            ) : studioMode === 'template' ? (
              <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-200 dark:border-amber-800/40 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-amber-900 dark:text-amber-200 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-amber-600" />
                    <span>Standard Baseline Routine Template</span>
                  </h3>
                  <p className="text-[11px] text-amber-700/80 dark:text-amber-300/80">
                    Recurring weekly menu (Sunday–Saturday). Live schedules inherit dishes from this baseline.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handlePublishBaselineToLive}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Publish Baseline to Live Working Week</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-200 dark:border-emerald-800/40 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-600" />
                    <span>Live Supply Schedule (Active Week)</span>
                  </h3>
                  <p className="text-[11px] text-emerald-700/80 dark:text-emerald-300/80">
                    Real-time dishes served this week in the canteen. You can edit dishes here without altering the standard baseline.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetLiveFromBaseline}
                  className="px-3.5 py-2 rounded-xl border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset from Baseline Template</span>
                </button>
              </div>
            )}

            {/* Unconfigured Days Warning Banner in Live Schedule */}
            {unconfiguredLiveDaysCount > 0 && studioMode === 'live' && !editingCalendarDate && (
              <div className="p-4 rounded-3xl bg-amber-500/10 border border-amber-300 dark:border-amber-700/60 backdrop-blur-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-200">
                      {unconfiguredLiveDaysCount} Day(s) in Live Schedule are currently blank
                    </h4>
                    <p className="text-[11px] text-amber-700 dark:text-amber-300">
                      Auto-fill empty days from your Baseline Template so students and staff always see scheduled meals.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      feedback('pop');
                      setSaving(true);
                      const { filledCount } = await fillEmptyDaysFromBaseline(user?.email || 'admin');
                      dialog.toast.success('Baseline Synced', `Populated ${filledCount} blank meal slots from baseline template.`);
                    } catch (err) {
                      dialog.alert({ type: 'error', title: 'Fill Failed', message: err.message });
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs shadow-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Auto-Fill from Baseline</span>
                </button>
              </div>
            )}

            {/* Day Selector (Sunday to Saturday) when not in date override */}
            {!editingCalendarDate && (
              <div className="p-4 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider pr-2">
                    Select Day:
                  </span>
                  {DAY_KEYS.map((k) => {
                    const isSelected = selectedDayKey === k;
                    return (
                      <button
                        key={k}
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          setSelectedDayKey(k);
                        }}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm font-black'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <span>{DAY_NAMES[k]}</span>
                        <span className="text-[10px] opacity-75">({DAY_SHORTS[k]})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Contextual Status Selector (Standard, Closed/Leave, Event/Feast, Fasting) */}
            <div className="p-4 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-3">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <span className="text-xs font-extrabold text-gray-700 dark:text-gray-300">
                  Day Dining Status:
                </span>

                <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/50 dark:border-white/5">
                  {[
                    { id: 'standard', label: 'Serving Standard Routine', icon: Utensils },
                    { id: 'closed', label: 'Closed / Holiday', icon: Lock },
                    { id: 'event', label: 'Campus Event / Feast', icon: Sparkles },
                    { id: 'fasting', label: 'Fasting Routine', icon: Moon },
                  ].map((s) => {
                    const Icon = s.icon;
                    const isActive = dayStatus === s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          setDayStatus(s.id);
                          if (s.id === 'closed') setIsClosedDay(true);
                          else setIsClosedDay(false);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isActive
                            ? s.id === 'closed'
                              ? 'bg-rose-600 text-white'
                              : s.id === 'event'
                              ? 'bg-purple-600 text-white'
                              : s.id === 'fasting'
                              ? 'bg-cyan-600 text-white'
                              : 'bg-emerald-600 text-white'
                            : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{s.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sub-inputs if Event or Closed */}
              {dayStatus === 'event' && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={occasion}
                    onChange={(e) => setOccasion(e.target.value)}
                    placeholder="Occasion Name (e.g. Milad Feast, Annual Gathering, Special Assembly)"
                    className="w-full px-3.5 py-2 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-[#121c19] text-xs font-bold text-gray-900 dark:text-white"
                  />
                </div>
              )}

              {dayStatus === 'closed' && (
                <div className="pt-2">
                  <input
                    type="text"
                    value={closureReason}
                    onChange={(e) => setClosureReason(e.target.value)}
                    placeholder="Closure Reason (e.g. Campus Holiday, Vacation Period, Maintenance Off)"
                    className="w-full px-3.5 py-2 rounded-xl border border-rose-300 dark:border-rose-800 bg-white dark:bg-[#121c19] text-xs font-bold text-rose-950 dark:text-rose-200"
                  />
                </div>
              )}
            </div>

            {/* 4 MEAL SLOTS CANVAS (Breakfast, Lunch, Evening Tea, Dinner) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {SLOT_CONFIGS.map((slot) => {
                const current = slotData[slot.key] || createEmptySlot(slot.defaultTiming);
                const isSpecial = Boolean(current.isSpecialMeal);
                const isArchived = Boolean(current.isArchived || current.slotStatus === 'leave');
                const Icon = slot.icon;
                const slotPresets = Array.isArray(presetsMap[slot.key]) ? presetsMap[slot.key] : [];

                return (
                  <div
                    key={slot.key}
                    className={`p-5 rounded-3xl border shadow-sm space-y-4 transition-all ${
                      isArchived
                        ? 'border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10'
                        : isSpecial
                        ? 'border-purple-300 dark:border-purple-800/80 bg-purple-50/20 dark:bg-purple-950/10 ring-2 ring-purple-400/30'
                        : 'border-gray-200/80 dark:border-white/10 bg-white/90 dark:bg-[#0f1715]/90'
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
                            {current.timing || getCanonicalMealTiming(effectiveDayKey, slot.key)}
                          </span>
                        </div>
                      </div>

                      {/* Slot Header Actions */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Meal-Specific Special Meal Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            feedback('pop');
                            handleSlotChange(slot.key, 'isSpecialMeal', !isSpecial);
                          }}
                          className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-1 border ${
                            isSpecial
                              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                              : 'border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 hover:bg-purple-50'
                          }`}
                          title="Flag this individual slot as a special feast"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{isSpecial ? 'Special Meal' : '+ Special'}</span>
                        </button>

                        {/* Leave / Off Toggle */}
                        <button
                          type="button"
                          onClick={() => {
                            feedback('tick');
                            const next = !isArchived;
                            handleSlotChange(slot.key, 'isArchived', next);
                            handleSlotChange(slot.key, 'slotStatus', next ? 'leave' : 'serving');
                          }}
                          className={`px-2 py-1 rounded-xl text-[10px] font-bold transition-all border ${
                            isArchived
                              ? 'bg-rose-600 text-white border-rose-600'
                              : 'border-gray-200 dark:border-white/10 text-gray-500 hover:text-gray-900'
                          }`}
                        >
                          {isArchived ? 'Off' : 'Active'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleSaveSlotAsPreset(slot.key)}
                          className="p-1 rounded-lg border border-purple-200 dark:border-purple-800/40 text-purple-700 dark:text-purple-300 hover:bg-purple-50"
                          title="Save as reusable preset"
                        >
                          <BookmarkPlus className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleClearSlot(slot.key)}
                          className="p-1 rounded-lg border border-gray-200 dark:border-white/10 text-gray-400 hover:text-rose-600"
                          title="Clear Slot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Meal-Specific Special Meal Sub-Panel */}
                    {isSpecial && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent border border-purple-300 dark:border-purple-800/60 space-y-2.5"
                      >
                        <div className="flex items-center gap-1.5 text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wide">
                          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                          <span>Special Meal / Feast Details</span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={current.specialTitle || current.title || ''}
                            onChange={(e) => {
                              handleSlotChange(slot.key, 'specialTitle', e.target.value);
                              handleSlotChange(slot.key, 'title', e.target.value);
                            }}
                            placeholder="Special Meal Title (e.g. Milad Special Biryani)"
                            className="px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-[#121c19] text-xs font-bold text-gray-900 dark:text-white"
                          />

                          <input
                            type="text"
                            value={current.specialSponsor || ''}
                            onChange={(e) => handleSlotChange(slot.key, 'specialSponsor', e.target.value)}
                            placeholder="Sponsor / Host (e.g. Batch 2024)"
                            className="px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-[#121c19] text-xs font-bold text-gray-900 dark:text-white"
                          />
                        </div>

                        <input
                          type="text"
                          value={current.specialNotes || ''}
                          onChange={(e) => handleSlotChange(slot.key, 'specialNotes', e.target.value)}
                          placeholder="Special Instructions (e.g. Tokens must be punched before 1:00 PM)"
                          className="w-full px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-800 bg-white dark:bg-[#121c19] text-xs font-medium text-gray-900 dark:text-white"
                        />
                      </motion.div>
                    )}

                    {/* Standard Dish Form Fields */}
                    {!isArchived && (
                      <div className="space-y-3">
                        {/* Dish Title */}
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                            Dish Title
                          </label>
                          <input
                            type="text"
                            value={current.title}
                            onChange={(e) => handleSlotChange(slot.key, 'title', e.target.value)}
                            placeholder={`e.g. ${slot.key === 'breakfast' ? 'Porotta & Kadala' : slot.key === 'lunch' ? 'Rice & Chicken Curry' : slot.key === 'evening' ? 'Tea & Parippuvada' : 'Rice & Veg Thoran'}`}
                            className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-black/20 text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>

                        {/* Timing Input with Campus Sync Button */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">
                              Serving Timing
                            </label>
                            <button
                              type="button"
                              onClick={() => handleSyncSlotTiming(slot.key)}
                              className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                              title="Reset to official campus schedule timing"
                            >
                              <RefreshCw className="w-2.5 h-2.5" />
                              <span>Sync to Campus Time ({getCanonicalMealTiming(effectiveDayKey, slot.key)})</span>
                            </button>
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

                        {/* Dietary Classification */}
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
                                  ? 'bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-gray-100 border-gray-400'
                                  : 'border-gray-200/70 dark:border-white/10 text-gray-400 hover:text-gray-700'
                              }`}
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
                                      ? `${cat.badgeClass} ring-2 ring-purple-500/30 scale-105`
                                      : 'border-gray-200/70 dark:border-white/10 text-gray-500 hover:text-gray-800'
                                  }`}
                                >
                                  {cat.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Dishes & Accompaniments List Editor */}
                        <MealItemsListEditor
                          items={current.items || []}
                          onChange={(newItems) => handleSlotChange(slot.key, 'items', newItems)}
                          slotKey={slot.key}
                        />

                        {/* Quick Presets & Full Preset Catalog Browser for this slot */}
                        <div className="pt-2.5 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[10px] font-bold text-gray-400">Quick Fill:</span>
                            {slotPresets.slice(0, 3).map((p, idx) => (
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

                          <button
                            type="button"
                            onClick={() => {
                              feedback('tick');
                              setPresetSelectorSlot(slot.key);
                              setIsPresetSelectorOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-[10px] shadow-xs flex items-center gap-1 transition-colors"
                          >
                            <Bookmark className="w-3 h-3" />
                            <span>Browse All ({slotPresets.length})</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 6. Sticky Bottom Action Bar */}
            <div className="sticky bottom-4 z-40 p-4 rounded-3xl bg-gray-900/95 dark:bg-[#0f1715]/95 text-white border border-white/10 shadow-2xl backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-xs font-bold block">
                    Target: {editingCalendarDate ? formatFriendlyDate(editingCalendarDate) : `${DAY_NAMES[selectedDayKey]} (${studioMode === 'template' ? 'Baseline Template' : 'Live Working Schedule'})`}
                  </span>
                  <span className="text-[11px] text-gray-400">
                    {editingCalendarDate ? 'Date-specific override' : studioMode === 'template' ? 'Standard routine' : 'Current week live supply'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                <button
                  type="button"
                  onClick={handleClearCurrentSelection}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  <span>Clear Canvas</span>
                </button>

                <button
                  type="button"
                  onClick={handleUniversalSave}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black text-xs shadow-lg shadow-purple-500/20 flex items-center gap-2 active:scale-95 transition-all disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save & Publish Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ranged Menu Multi-Date Override Modal */}
        <RangedMenuModal
          isOpen={isRangedModalOpen}
          onClose={() => setIsRangedModalOpen(false)}
          weeklyMenu={weeklyMenu}
          userEmail={user?.email || 'admin'}
        />

        {/* Preset Selector Popover / Modal (When Editing a Meal Slot in Canvas) */}
        <PresetSelectorModal
          isOpen={isPresetSelectorOpen}
          onClose={() => setIsPresetSelectorOpen(false)}
          presetsMap={presetsMap}
          slotKey={presetSelectorSlot}
          onSelectPreset={(preset) => handleApplyPreset(presetSelectorSlot, preset)}
        />

        {/* Direct Apply to Any Meal / Day Modal (From Presets Library) */}
        <DirectApplyPresetModal
          isOpen={isDirectApplyOpen}
          onClose={() => {
            setIsDirectApplyOpen(false);
            setPresetForDirectApply(null);
          }}
          preset={presetForDirectApply}
          userEmail={user?.email || 'admin'}
        />

        {/* Preset CRUD Modal (Create / Edit Preset in Catalog) */}
        <AnimatePresence>
          {presetCrudModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="relative w-full max-w-xl max-h-[90vh] flex flex-col rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden p-5 sm:p-6 space-y-4"
              >
                {/* Modal Header */}
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center">
                      <Bookmark className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-black text-gray-900 dark:text-white">
                        {presetCrudForm.isEditing ? 'Edit Dish Preset' : 'Create New Dish Preset'}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {presetCrudForm.isEditing ? `Modifying "${presetCrudForm.originalTitle}"` : 'Add a reusable delicacy to your catalog'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPresetCrudModalOpen(false)}
                    className="p-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-400 hover:text-gray-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Body */}
                <div className="space-y-3.5 overflow-y-auto max-h-[60vh] pr-1">
                  {/* Title */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Preset Dish Title
                    </label>
                    <input
                      type="text"
                      value={presetCrudForm.title}
                      onChange={(e) => setPresetCrudForm((prev) => ({ ...prev, title: e.target.value }))}
                      placeholder="e.g. Porotta & Beef Roast / Special Dum Biriyani"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#121c19] text-xs font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  {/* Target Slot Selector */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Meal Slot Assignment
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {SLOT_CONFIGS.map((slot) => {
                        const Icon = slot.icon;
                        const isSelected = presetCrudForm.slotKey === slot.key;
                        return (
                          <button
                            key={slot.key}
                            type="button"
                            onClick={() => setPresetCrudForm((prev) => ({ ...prev, slotKey: slot.key }))}
                            className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                              isSelected
                                ? 'border-purple-600 bg-purple-600 text-white shadow-xs'
                                : 'border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:text-gray-900'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                            <span>{slot.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Dietary Classification */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Dietary Classification
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {CATEGORIES.map((cat) => {
                        const isSelected = presetCrudForm.category === cat.key;
                        return (
                          <button
                            key={cat.key}
                            type="button"
                            onClick={() => setPresetCrudForm((prev) => ({ ...prev, category: cat.key }))}
                            className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                              isSelected
                                ? `${cat.badgeClass} ring-2 ring-purple-500/30 scale-105`
                                : 'border-gray-200/80 dark:border-white/10 text-gray-500 hover:text-gray-800'
                            }`}
                          >
                            {cat.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Serving Timing (Optional) */}
                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">
                      Serving Timing (Optional)
                    </label>
                    <input
                      type="text"
                      value={presetCrudForm.timing}
                      onChange={(e) => setPresetCrudForm((prev) => ({ ...prev, timing: e.target.value }))}
                      placeholder="e.g. 07:30 AM - 08:45 AM or After Asr"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-[#121c19] text-xs font-bold text-gray-900 dark:text-white"
                    />
                  </div>

                  {/* Items List Editor */}
                  <div>
                    <MealItemsListEditor
                      items={presetCrudForm.items}
                      onChange={(newItems) => setPresetCrudForm((prev) => ({ ...prev, items: newItems }))}
                      slotKey={presetCrudForm.slotKey}
                    />
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setPresetCrudModalOpen(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSavePresetModal}
                    className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs shadow-md shadow-purple-500/20 flex items-center gap-1.5 transition-all"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{presetCrudForm.isEditing ? 'Update Preset' : 'Save Preset'}</span>
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </div>
  );
}
