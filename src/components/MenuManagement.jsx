import React, { useState, useEffect, useContext, useMemo } from 'react';
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
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  BookmarkPlus,
  Archive,
  ArchiveRestore,
  Layers,
  Eraser,
  Sliders,
  Users,
  Home,
  CalendarDays,
  Search,
  Filter,
  Info,
  Lock,
  Sunrise,
  Moon,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { directPrintPdf, shareDocument, createPdfBlob } from '../utils/documentHubService';
import UniversalDocumentModal from './export/UniversalDocumentModal';
import ExportActionMenu from './export/ExportActionMenu';
import { AuthContext } from '../store/AuthContext';
import { dialog } from '../utils/dialog';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { useWorldTime } from '../utils/time';
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
  DEFAULT_WEEKLY_MENU,
  DISH_PRESETS,
} from '../utils/menuService';
import MealEditModal from './MealEditModal';
import BulkMenuEditModal from './BulkMenuEditModal';
import PresetManagerModal from './PresetManagerModal';
import DateGridPickerModal from './ui/DateGridPickerModal';
import DateOverrideEditModal from './menu/DateOverrideEditModal';
import RangedMenuModal from './menu/RangedMenuModal';
import MenuCalendarMatrix from './menu/MenuCalendarMatrix';
import { formatFriendlyDate } from '../utils/studentExceptionService';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../utils/auditLogger';

const DAY_KEYS = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

const CATEGORY_COLORS = {
  Veg: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/60',
  'Non-Veg': 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-300 dark:border-rose-700/60',
  Egg: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-700/60',
  Special: 'bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border-purple-300 dark:border-purple-700/60',
};

export default function MenuManagement() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();
  const { dayShort } = useWorldTime('Asia/Kolkata');

  // Mode: 'live' (active weekly menu) vs 'defaults' (custom editable default template)
  const [editorMode, setEditorMode] = useState('live');

  // Primary Navigation View: 'routine' | 'calendar' | 'overrides'
  const [activeMainTab, setActiveMainTab] = useState('routine');

  // Schedules state
  const [weeklyMenu, setWeeklyMenu] = useState(DEFAULT_WEEKLY_MENU);
  const [defaultTemplate, setDefaultTemplate] = useState(DEFAULT_WEEKLY_MENU);
  const [loading, setLoading] = useState(true);
  const [selectedDayKey, setSelectedDayKey] = useState('fr');
  const [saving, setSaving] = useState(false);

  // Active edit modal state (Routine slot editor)
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSlot, setEditingSlot] = useState('breakfast');

  // Real-time overrides state
  const [overrides, setOverrides] = useState({});
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showPresetManagerModal, setShowPresetManagerModal] = useState(false);
  const [universalDoc, setUniversalDoc] = useState({ isOpen: false, data: null });

  // Full CRUD Date Override & Ranged Overrides State
  const [dateOverrideModal, setDateOverrideModal] = useState({ isOpen: false, date: '', override: null });
  const [rangedModalOpen, setRangedModalOpen] = useState(false);
  const [overridesSearch, setOverridesSearch] = useState('');
  const [selectedOverrideKeys, setSelectedOverrideKeys] = useState([]);

  // Initial day synchronization
  useEffect(() => {
    if (dayShort && DAY_KEYS.includes(dayShort)) {
      setSelectedDayKey(dayShort);
    }
  }, [dayShort]);

  // Subscribe to real-time Firestore menu and default template
  useEffect(() => {
    setLoading(true);

    const unsubscribeMenu = subscribeToWeeklyMenu(
      (daysData) => {
        if (daysData) setWeeklyMenu(daysData);
        setLoading(false);
      },
      () => setLoading(false)
    );

    const unsubscribeDefaults = subscribeToDefaultTemplate((templateDays) => {
      if (templateDays) setDefaultTemplate(templateDays);
    });

    const unsubscribeOverrides = subscribeToDateOverrides((overridesData) => {
      if (overridesData) setOverrides(overridesData);
    });

    return () => {
      unsubscribeMenu();
      unsubscribeDefaults();
      unsubscribeOverrides();
    };
  }, []);

  // Determine active dataset based on editor mode
  const activeDataset = editorMode === 'live' ? weeklyMenu : defaultTemplate;
  const currentDayData = activeDataset[selectedDayKey] || DEFAULT_WEEKLY_MENU[selectedDayKey];

  // Auth gate helper for modifications
  const checkAuth = () => {
    if (!user) {
      dialog
        .confirm({
          title: 'Committee Login Required',
          message: 'Please log in with committee credentials to modify the canteen menu.',
          icon: 'lock',
          confirmText: 'Go to Login',
          cancelText: 'Cancel',
          confirmColor: 'emerald',
        })
        .then((confirmed) => {
          if (confirmed) {
            navigate('/alogin');
          }
        });
      return false;
    }
    return true;
  };

  // Open edit modal for a slot
  const handleOpenEdit = (slot) => {
    feedback('tick');
    setEditingSlot(slot);
    setEditModalOpen(true);
  };

  // Update meal data from modal
  const handleSaveMealSlot = async (dayKey, slotKey, mealData) => {
    if (!checkAuth()) return;

    const updatedDay = {
      ...activeDataset[dayKey],
      dayKey,
      [slotKey]: mealData,
    };

    const updatedDataset = {
      ...activeDataset,
      [dayKey]: updatedDay,
    };

    try {
      if (editorMode === 'live') {
        setWeeklyMenu(updatedDataset);
        await saveDayMenu(dayKey, updatedDay, user?.email || 'admin');
      } else {
        setDefaultTemplate(updatedDataset);
        await saveDefaultTemplate(updatedDataset, user?.email || 'admin');
      }

      await logAuditEvent({
        category: AUDIT_CATEGORIES.MENU,
        action: 'MENU_SCHEDULE_UPDATE',
        severity: AUDIT_SEVERITIES.NOTICE,
        target: { type: 'menu_day', id: `${dayKey}_${slotKey}`, label: `${dayKey.toUpperCase()} ${slotKey.toUpperCase()}` },
        changes: {
          diffSummary: `Updated ${dayKey.toUpperCase()} ${slotKey.toUpperCase()}: ${mealData.title || 'Untitled Dish'}`,
          fieldsChanged: Object.keys(mealData),
          before: null,
          after: mealData,
        },
        metadata: {
          mode: editorMode,
          dishTitle: mealData.title,
          category: mealData.category,
        },
      });

      feedback('success');
    } catch (err) {
      console.error('Error saving meal to Firestore:', err);
    }
  };

  // Save day notice
  const handleUpdateDayNote = async (newNote) => {
    if (!checkAuth()) return;

    const updatedDay = {
      ...currentDayData,
      note: newNote,
    };
    const updatedDataset = {
      ...activeDataset,
      [selectedDayKey]: updatedDay,
    };

    if (editorMode === 'live') {
      setWeeklyMenu(updatedDataset);
      await saveDayMenu(selectedDayKey, updatedDay, user?.email || 'admin');
    } else {
      setDefaultTemplate(updatedDataset);
      await saveDefaultTemplate(updatedDataset, user?.email || 'admin');
    }
  };

  // Toggle Day Archiving (e.g. Sunday Off)
  const handleToggleArchiveDay = async () => {
    if (!checkAuth()) return;

    const isCurrentlyArchived = Boolean(currentDayData?.isArchived);

    if (isCurrentlyArchived) {
      // Unarchive
      await archiveDay(selectedDayKey, false, '', currentDayData, user?.email || 'admin');
      dialog.toast.success(
        'Day Activated',
        `${currentDayData?.dayName} is now active and on the regular canteen schedule.`
      );
    } else {
      // Archive with prompt
      const reason = await dialog.prompt({
        title: `Archive ${currentDayData?.dayName}?`,
        message: `Mark ${currentDayData?.dayName} as closed / no supply for students and kitchen staff.`,
        placeholder: 'Reason (e.g. Sunday Routine Off, Cleaning & Maintenance)',
        defaultValue: 'Sunday Routine Off - Canteen Closed',
        confirmText: 'Archive Day',
        confirmColor: 'amber',
      });

      if (reason !== null) {
        await archiveDay(selectedDayKey, true, reason || 'Routine Off', currentDayData, user?.email || 'admin');
        dialog.toast.success(
          'Day Archived',
          `${currentDayData?.dayName} is marked archived. Home Spotlight will automatically skip this day.`
        );
      }
    }
  };

  // Toggle Slot Archiving
  const handleToggleArchiveSlot = async (slotKey) => {
    if (!checkAuth()) return;

    const slot = currentDayData?.[slotKey] || {};
    const isSlotArchived = Boolean(slot.isArchived);
    const nextArchived = !isSlotArchived;

    feedback(nextArchived ? 'warning' : 'pop');
    await archiveSlot(
      selectedDayKey,
      slotKey,
      nextArchived,
      nextArchived ? 'Slot archived / not served' : '',
      currentDayData,
      user?.email || 'admin'
    );
    feedback('success');
  };

  // Save current live week as the new Default Template
  const handleSaveAsDefaultTemplate = async () => {
    if (!checkAuth()) return;

    const confirmed = await dialog.confirm({
      title: 'Set as Default Template?',
      message: 'This will save the current active week as your permanent standard template for future resets.',
      confirmColor: 'emerald',
      confirmText: 'Set as Defaults',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        setSaving(true);
        await saveDefaultTemplate(weeklyMenu, user?.email || 'admin');
        setDefaultTemplate(weeklyMenu);
        dialog.toast.success(
          'Saved!',
          'Current weekly schedule is now saved as the institutional Default Template.'
        );
      } catch (err) {
        console.error('Error saving default template:', err);
        dialog.alert({
          type: 'error',
          title: 'Save Failed',
          message: 'Could not save default template.',
        });
      } finally {
        setSaving(false);
      }
    }
  };

  // Reset to customizable default template
  const handleRestoreFromDefaults = async () => {
    if (!checkAuth()) return;

    const confirmed = await dialog.confirm({
      title: 'Restore from Default Template?',
      message: 'This will replace the live schedule with your saved Default Menu Template for all 7 days.',
      confirmColor: 'amber',
      confirmText: 'Restore Defaults',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        setSaving(true);
        const restored = await resetWeeklyMenuToDefault(user?.email || 'admin');
        setWeeklyMenu(restored);
        dialog.toast.success(
          'Restored from Defaults',
          'Live menu successfully synced with default template.'
        );
      } catch (err) {
        console.error('Reset error:', err);
        dialog.alert({
          type: 'error',
          title: 'Reset Failed',
          message: 'Could not restore default template.',
        });
      } finally {
        setSaving(false);
      }
    }
  };

  // Clear entire week to blank/empty
  const handleClearEntireWeekToEmpty = async () => {
    if (!checkAuth()) return;

    const confirmed = await dialog.confirm({
      title: 'Clear Entire Supply Menu?',
      message: 'This will wipe all dishes for all 7 days to empty blanks, allowing you to enter a fresh schedule.',
      icon: 'trash',
      confirmColor: 'rose',
      confirmText: 'Clear to Empty',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        setSaving(true);
        const empty = await resetMenuToEmpty(user?.email || 'admin');
        setWeeklyMenu(empty);
        dialog.toast.success('Menu Cleared', 'All 7 days have been reset to empty slots.');
      } catch (err) {
        console.error('Error resetting menu to empty:', err);
        dialog.alert({
          type: 'error',
          title: 'Reset Failed',
          message: 'Could not reset menu.',
        });
      } finally {
        setSaving(false);
      }
    }
  };

  // Clear single day to blank/empty
  const handleClearCurrentDay = async () => {
    if (!checkAuth()) return;

    const confirmed = await dialog.confirm({
      title: `Clear ${currentDayData?.dayName}'s Dishes?`,
      message: `Reset all dishes for ${currentDayData?.dayName} to empty?`,
      icon: 'trash',
      confirmColor: 'rose',
      confirmText: 'Clear Day',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      await clearDayMenu(selectedDayKey, user?.email || 'admin');
      dialog.toast.success('Day Cleared', `Dishes for ${currentDayData?.dayName} reset to empty.`);
    }
  };

  // Clone day menu
  const handleCloneDay = async () => {
    if (!checkAuth()) return;

    feedback('tick');
    const options = {};
    DAY_KEYS.forEach((k) => {
      if (k !== selectedDayKey) {
        options[k] = `${activeDataset[k]?.dayName || k.toUpperCase()}`;
      }
    });

    const targetDayKey = await dialog.prompt({
      title: `Copy ${currentDayData?.dayName}'s Menu`,
      message: 'Select the target day to replace with this day’s meals:',
      options,
      confirmText: 'Copy Menu',
      confirmColor: 'emerald',
    });

    if (targetDayKey) {
      const targetDayName = activeDataset[targetDayKey]?.dayName || targetDayKey;
      const clonedData = {
        ...currentDayData,
        dayKey: targetDayKey,
        dayName: targetDayName,
        dayShort: activeDataset[targetDayKey]?.dayShort || targetDayKey,
      };

      const updated = {
        ...activeDataset,
        [targetDayKey]: clonedData,
      };

      if (editorMode === 'live') {
        setWeeklyMenu(updated);
        await saveDayMenu(targetDayKey, clonedData, user?.email || 'admin');
      } else {
        setDefaultTemplate(updated);
        await saveDefaultTemplate(updated, user?.email || 'admin');
      }

      dialog.toast.success('Copied!', `Menu successfully replicated to ${targetDayName}.`);
    }
  };

  // Swap two days
  const handleSwapDays = async () => {
    if (!checkAuth()) return;

    feedback('tick');
    const options = {};
    DAY_KEYS.forEach((k) => {
      if (k !== selectedDayKey) {
        options[k] = `${activeDataset[k]?.dayName || k.toUpperCase()}`;
      }
    });

    const targetKey = await dialog.prompt({
      title: `Swap ${currentDayData?.dayName} with another day`,
      message: 'Select the day to exchange menus with:',
      options,
      confirmText: 'Swap Schedules',
      confirmColor: 'emerald',
    });

    if (targetKey) {
      const sourceData = { ...currentDayData };
      const targetData = { ...activeDataset[targetKey] };

      const newSource = {
        ...targetData,
        dayKey: selectedDayKey,
        dayName: sourceData.dayName,
        dayShort: sourceData.dayShort,
      };

      const newTarget = {
        ...sourceData,
        dayKey: targetKey,
        dayName: targetData.dayName,
        dayShort: targetData.dayShort,
      };

      const updated = {
        ...activeDataset,
        [selectedDayKey]: newSource,
        [targetKey]: newTarget,
      };

      if (editorMode === 'live') {
        setWeeklyMenu(updated);
        await saveWeeklyMenu(updated, user?.email || 'admin');
      } else {
        setDefaultTemplate(updated);
        await saveDefaultTemplate(updated, user?.email || 'admin');
      }

      dialog.toast.success(
        'Swapped!',
        `Schedules between ${sourceData.dayName} and ${targetData.dayName} exchanged.`
      );
    }
  };

  // Generate Menu PDF Document Object
  const generateMenuPDFDoc = () => {
    const doc = new jsPDF('landscape', 'mm', 'a4');

    // Title & Header Branding
    doc.setFillColor(16, 185, 129); // Emerald 500
    doc.rect(0, 0, 297, 24, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ALATHURPADI DARS CANTEEN - WEEKLY DINING SCHEDULE', 148.5, 12, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Alathurpadi Juma Masjid, Malappuram | ADSA T-Board Official Notice', 148.5, 18, { align: 'center' });

    // Table Rows
    const rows = DAY_KEYS.map((k) => {
      const d = activeDataset[k] || DEFAULT_WEEKLY_MENU[k];
      if (d.isArchived) {
        return [
          d.dayName,
          `ARCHIVED - CANTEEN CLOSED\n(${d.archiveReason || 'Routine Off'})`,
          '-',
          '-',
          '-',
          d.note || 'Canteen Off',
        ];
      }
      return [
        d.dayName,
        d.breakfast?.isArchived ? 'ARCHIVED' : `${d.breakfast?.title || 'Empty'}\n[${d.breakfast?.timing || '07:00-08:30'}]`,
        d.lunch?.isArchived ? 'ARCHIVED' : `${d.lunch?.title || 'Empty'}\n[${d.lunch?.timing || '12:30-14:00'}]`,
        d.evening?.isArchived ? 'ARCHIVED' : `${d.evening?.title || 'Empty'}\n[${d.evening?.timing || '16:30-17:30'}]`,
        d.dinner?.isArchived
          ? 'ARCHIVED'
          : d.dinner?.isAvailable
          ? `${d.dinner?.title || 'Empty'}\n[${d.dinner?.timing || '20:30-21:30'}]`
          : 'Not Served',
        d.note || '-',
      ];
    });

    doc.autoTable({
      head: [['Day', 'Breakfast', 'Lunch', 'Evening Tea', 'Dinner', 'Special Notice']],
      body: rows,
      startY: 30,
      theme: 'striped',
      styles: {
        fontSize: 9,
        cellPadding: 4,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [15, 23, 21],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 26 },
        1: { cellWidth: 55 },
        2: { cellWidth: 62 },
        3: { cellWidth: 46 },
        4: { cellWidth: 46 },
        5: { cellWidth: 42, fontStyle: 'italic' },
      },
    });

    const filename = `Alathurpadi_Dars_Weekly_Menu_${new Date().toISOString().slice(0, 10)}.pdf`;
    return {
      doc,
      filename,
      title: 'Weekly Dining Schedule',
      subtitle: 'Alathurpadi Dars Canteen Food Menu',
    };
  };

  // Direct In-App Preview
  const handleViewMenuPDF = () => {
    feedback('tick');
    const res = generateMenuPDFDoc();
    setUniversalDoc({ isOpen: true, data: { type: 'pdf', ...res } });
  };

  // Direct Silent Print
  const handlePrintMenuPDF = async () => {
    feedback('tick');
    try {
      const { doc } = generateMenuPDFDoc();
      const { blobUrl } = createPdfBlob(doc);
      await directPrintPdf(blobUrl);
    } catch (e) {
      console.error('Direct print menu failed:', e);
    }
  };

  // Direct Share
  const handleShareMenuPDF = async () => {
    feedback('pop');
    try {
      const { doc, filename, title } = generateMenuPDFDoc();
      const { blob } = createPdfBlob(doc);
      await shareDocument({
        blob,
        filename,
        title,
        text: 'Alathurpadi Dars Canteen • Weekly Dining Schedule & Menu',
      });
    } catch (e) {
      console.error('Share menu failed:', e);
    }
  };

  // Export printable canteen menu PDF (Download)
  const handleExportPDF = () => {
    feedback('pop');
    try {
      const { doc, filename } = generateMenuPDFDoc();
      doc.save(filename);
      feedback('success');
    } catch (err) {
      console.error('Error generating menu PDF:', err);
      dialog.alert({
        type: 'error',
        title: 'Error',
        message: 'Failed to generate PDF. Please try again.',
      });
    }
  };

  // Open Single-Date Override / Feast Editor
  const handleOpenNewOverride = (targetDateStr) => {
    feedback('tick');
    const target = targetDateStr || new Date().toISOString().split('T')[0];
    setDateOverrideModal({
      isOpen: true,
      date: target,
      override: overrides[target] || null,
    });
  };

  const handleEditOverride = (dateKey) => {
    feedback('tick');
    setDateOverrideModal({
      isOpen: true,
      date: dateKey,
      override: overrides[dateKey] || null,
    });
  };

  const handleDeleteOverride = async (dateKey) => {
    if (!checkAuth()) return;
    const confirmed = await dialog.confirm({
      title: 'Remove Override?',
      message: `Remove special schedule for ${dateKey} and revert to routine?`,
      confirmColor: 'rose',
      confirmText: 'Remove',
    });
    if (confirmed) {
      await deleteDateOverride(dateKey);
      setSelectedOverrideKeys((prev) => prev.filter((k) => k !== dateKey));
      dialog.toast.success('Removed', `Special schedule for ${dateKey} removed.`);
    }
  };

  const handleBatchDeleteOverrides = async () => {
    if (!checkAuth()) return;
    if (selectedOverrideKeys.length === 0) return;
    const confirmed = await dialog.confirm({
      title: `Delete ${selectedOverrideKeys.length} Overrides?`,
      message: `This will remove special schedules for ${selectedOverrideKeys.length} dates and revert them to standard weekly routine.`,
      icon: 'trash',
      confirmColor: 'rose',
      confirmText: `Delete ${selectedOverrideKeys.length} Overrides`,
    });
    if (confirmed) {
      await deleteDateOverrides(selectedOverrideKeys);
      setSelectedOverrideKeys([]);
      dialog.toast.success('Deleted', `Reverted ${selectedOverrideKeys.length} dates to routine.`);
    }
  };

  // Filtered overrides list for the Hub table
  const sortedOverridesList = useMemo(() => {
    const list = Object.entries(overrides).map(([dateKey, ovr]) => ({
      dateKey,
      ...ovr,
    }));
    list.sort((a, b) => a.dateKey.localeCompare(b.dateKey));

    if (!overridesSearch.trim()) return list;

    const query = overridesSearch.toLowerCase();
    return list.filter(
      (item) =>
        item.dateKey.includes(query) ||
        (item.occasion && item.occasion.toLowerCase().includes(query)) ||
        (item.note && item.note.toLowerCase().includes(query)) ||
        (item.lunch?.title && item.lunch.title.toLowerCase().includes(query)) ||
        (item.breakfast?.title && item.breakfast.title.toLowerCase().includes(query)) ||
        (item.evening?.title && item.evening.title.toLowerCase().includes(query)) ||
        (item.dinner?.title && item.dinner.title.toLowerCase().includes(query))
    );
  }, [overrides, overridesSearch]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex space-x-2">
          {[0, 1, 2].map((idx) => (
            <motion.div
              key={idx}
              className="w-3.5 h-3.5 rounded-full bg-emerald-500"
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: idx * 0.15 }}
            />
          ))}
        </div>
        <p className="mt-4 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
          Loading Canteen Menu Management Console...
        </p>
      </div>
    );
  }

  const mealSlots = [
    { key: 'breakfast', label: 'Breakfast', icon: Coffee, data: currentDayData?.breakfast, color: 'amber' },
    { key: 'lunch', label: 'Lunch', icon: Utensils, data: currentDayData?.lunch, color: 'emerald' },
    { key: 'evening', label: 'Evening Tea', icon: Coffee, data: currentDayData?.evening, color: 'blue' },
    { key: 'dinner', label: 'Dinner / Supper', icon: Utensils, data: currentDayData?.dinner, color: 'purple' },
  ];

  const isDayArchived = Boolean(currentDayData?.isArchived);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      
      {/* Top Banner & Control Deck */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/25 shrink-0">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white">
                  {t('menuManagement') || 'Canteen Menu Console'}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-600/30">
                  Admin Console
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Weekly meal schedules, customizable defaults, day archiving, and dining timings
              </p>
            </div>
          </div>
        </div>

        {/* Navigation & Mode Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto justify-start sm:justify-end">
          
          {/* Mode Switcher Pill */}
          <div className="flex items-center p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
            <button
              onClick={() => {
                feedback('tick');
                setEditorMode('live');
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                editorMode === 'live'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Live Week Menu
            </button>
            <button
              onClick={() => {
                feedback('tick');
                setEditorMode('defaults');
              }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                editorMode === 'defaults'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Sliders className="w-3 h-3" />
              <span>Default Template</span>
            </button>
          </div>

          <button
            onClick={() => {
              feedback('tick');
              navigate('/admin');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Admin Board</span>
          </button>

          <button
            onClick={() => {
              feedback('tick');
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 transition-colors"
            title="Go to Public Home (/)"
          >
            <Home className="w-3.5 h-3.5 text-emerald-500" />
            <span>Home</span>
          </button>

          <button
            onClick={() => {
              feedback('tick');
              navigate('/menu');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            <span>Public Menu</span>
          </button>
        </div>
      </div>

      {/* Defaults Notice Banner when editing template */}
      {editorMode === 'defaults' && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <span>
              <strong>Editing Default Menu Template:</strong> Changes made here establish your permanent institutional baseline defaults. You can restore these anytime in Live mode.
            </span>
          </div>

          <button
            onClick={() => setEditorMode('live')}
            className="px-3 py-1 rounded-xl bg-amber-600 text-white font-bold text-xs hover:bg-amber-700 transition-colors self-end sm:self-auto"
          >
            Return to Live Week
          </button>
        </div>
      )}

      {/* Primary Navigation View Tabs */}
      <div className="flex p-1.5 bg-white/80 dark:bg-[#0f1715]/90 rounded-2xl border border-gray-200/80 dark:border-white/10 shadow-sm gap-1 sm:gap-2">
        <button
          type="button"
          onClick={() => {
            feedback('tick');
            setActiveMainTab('routine');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
            activeMainTab === 'routine'
              ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-md shadow-emerald-500/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Weekly Routine Schedule</span>
        </button>

        <button
          type="button"
          onClick={() => {
            feedback('tick');
            setActiveMainTab('calendar');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
            activeMainTab === 'calendar'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <CalendarDays className="w-4 h-4" />
          <span>Full Dining Calendar</span>
          {Object.keys(overrides).length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black">
              {Object.keys(overrides).length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            feedback('tick');
            setActiveMainTab('overrides');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center justify-center gap-2 ${
            activeMainTab === 'overrides'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Special Feasts & Overrides</span>
          <span className="px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-[10px] font-black">
            {Object.keys(overrides).length}
          </span>
        </button>
      </div>

      {/* VIEW 1: WEEKLY ROUTINE SCHEDULE */}
      {activeMainTab === 'routine' && (
        <div className="space-y-4 sm:space-y-6">
          {/* Action Deck: Defaults, Clear to Empty, Feasts, Print */}
          <div className="p-3 sm:p-4 rounded-2xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Save Live as Default Template */}
          {editorMode === 'live' && (
            <button
              onClick={handleSaveAsDefaultTemplate}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-emerald-500" />
              <span>Set as Default Template</span>
            </button>
          )}

          {/* Restore from Custom Default Template */}
          {editorMode === 'live' && (
            <button
              onClick={handleRestoreFromDefaults}
              disabled={saving}
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 text-xs font-semibold transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-gray-500" />
              <span>Restore from Defaults</span>
            </button>
          )}

          {/* Clear Entire Week to Empty */}
          <button
            onClick={handleClearEntireWeekToEmpty}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold transition-colors"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Clear Full Week (Empty)</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          {/* Bulk Edit Days (Item #10) */}
          <button
            onClick={() => {
              feedback('tick');
              setShowBulkEditModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-emerald-300 dark:border-emerald-600/30 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 text-xs font-bold transition-colors"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-500" />
            <span>Bulk Edit Days</span>
          </button>

          {/* Dish Presets CRUD (Item #10) */}
          <button
            onClick={() => {
              feedback('tick');
              setShowPresetManagerModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-xs font-bold transition-colors"
          >
            <BookmarkPlus className="w-3.5 h-3.5 text-blue-500" />
            <span>Dish Presets</span>
          </button>

          {/* Ranged / Bulk Overrides */}
          <button
            onClick={() => {
              feedback('tick');
              setRangedModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-500/30 bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 text-xs font-bold transition-colors"
          >
            <CalendarDays className="w-3.5 h-3.5 text-purple-500" />
            <span>Ranged Overrides</span>
          </button>

          {/* Add Single Feast / Date Override */}
          <button
            onClick={() => {
              feedback('tick');
              handleOpenNewOverride();
            }}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-purple-300 dark:border-purple-500/40 bg-purple-100/60 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 hover:bg-purple-200/70 text-xs font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
            <span>+ Single Feast</span>
          </button>

          {/* Export / Print PDF */}
          <div className="min-w-[160px]">
            <ExportActionMenu
              onView={handleViewMenuPDF}
              onDownload={handleExportPDF}
              onPrint={handlePrintMenuPDF}
              onShare={handleShareMenuPDF}
              label={t('printPdf', 'Menu PDF')}
              colorTheme="emerald"
              defaultAction="view"
            />
          </div>
        </div>
      </div>

      {/* 7-Day Horizontal Selector */}
      <div className="p-2 sm:p-2.5 rounded-2xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-1.5 sm:pb-0 scrollbar-none touch-pan-x">
          {DAY_KEYS.map((key) => {
            const dayData = activeDataset[key] || DEFAULT_WEEKLY_MENU[key];
            const isSelected = selectedDayKey === key;
            const isToday = dayShort === key;
            const isArchived = Boolean(dayData?.isArchived);

            return (
              <button
                key={key}
                onClick={() => {
                  feedback('tick');
                  setSelectedDayKey(key);
                }}
                className={`relative flex-1 min-w-[80px] xs:min-w-[95px] sm:min-w-[110px] p-2.5 sm:p-3 rounded-xl border transition-all text-left ${
                  isSelected
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                    : isArchived
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-dashed border-amber-300 dark:border-amber-700/50 text-amber-800 dark:text-amber-300'
                    : 'bg-gray-50/70 dark:bg-white/[0.03] border-gray-200/70 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-xs font-extrabold uppercase tracking-wider ${isSelected ? 'text-white' : ''}`}>
                    {dayData?.dayShort || key}
                  </span>
                  {isToday && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black uppercase ${
                      isSelected ? 'bg-white text-emerald-800' : 'bg-emerald-500 text-white animate-pulse'
                    }`}>
                      Today
                    </span>
                  )}
                  {isArchived && !isToday && (
                    <span className="text-[9px] font-bold text-amber-600 dark:text-amber-400">
                      Off
                    </span>
                  )}
                </div>

                <div className="text-[11px] truncate font-medium opacity-90">
                  {isArchived
                    ? 'Archived / Off'
                    : dayData?.lunch?.title
                    ? dayData.lunch.title.split('&')[0]
                    : 'Empty'}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Day Inspector Header & Controls */}
      <div className={`p-4 rounded-2xl border transition-all ${
        isDayArchived
          ? 'bg-amber-50/70 dark:bg-amber-950/20 border-amber-300 dark:border-amber-700/60'
          : 'bg-white/80 dark:bg-[#0f1715]/90 border-gray-200/80 dark:border-white/10 shadow-sm'
      }`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
              {currentDayData?.dayName || 'Selected Day'} Schedule
            </h2>

            {isDayArchived && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500 text-white shadow-xs">
                Archived Day (Canteen Closed)
              </span>
            )}

            {dayShort === selectedDayKey && !isDayArchived && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                Active Today
              </span>
            )}
          </div>

          {/* Day Actions */}
          <div className="flex flex-wrap items-center gap-2 self-stretch sm:self-auto justify-end">
            
            {/* Archive / Unarchive Day Toggle */}
            <button
              onClick={handleToggleArchiveDay}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                isDayArchived
                  ? 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
                  : 'border-amber-300 dark:border-amber-700/60 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30'
              }`}
            >
              {isDayArchived ? <ArchiveRestore className="w-3.5 h-3.5" /> : <Archive className="w-3.5 h-3.5" />}
              <span>{isDayArchived ? 'Unarchive Day' : 'Archive Day'}</span>
            </button>

            {/* Clear Day Dishes */}
            <button
              onClick={handleClearCurrentDay}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 text-xs font-semibold transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Day</span>
            </button>

            {/* Clone Day */}
            <button
              onClick={handleCloneDay}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-emerald-500" />
              <span>Copy</span>
            </button>

            {/* Swap Day */}
            <button
              onClick={handleSwapDays}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
              <span>Swap</span>
            </button>
          </div>
        </div>

        {/* If Day is Archived, show reason banner */}
        {isDayArchived && (
          <div className="mt-3 p-3 rounded-xl bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 text-xs flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
              <span>
                <strong>Day Archived:</strong> {currentDayData.archiveReason || 'Canteen Closed / Routine Off for this day'}
              </span>
            </span>
            <span className="text-[11px] opacity-80">
              Home Spotlight will skip this day automatically.
            </span>
          </div>
        )}
      </div>

      {/* Day Notice / Chef Announcement */}
      {!isDayArchived && (
        <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 w-full">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block mb-0.5">
                Day Notice / Chef Note:
              </span>
              <input
                type="text"
                defaultValue={currentDayData?.note || ''}
                key={`${selectedDayKey}-${editorMode}-note`}
                onBlur={(e) => handleUpdateDayNote(e.target.value)}
                placeholder="e.g. Jum'ah Special timing or feast notes..."
                className="w-full px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-black/30 border border-amber-200 dark:border-amber-500/30 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4 Meal Slot Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mealSlots.map((slot) => {
          const Icon = slot.icon;
          const meal = slot.data || {};
          const isSlotArchived = Boolean(meal.isArchived);
          const isOff = meal.isAvailable === false || isSlotArchived;
          const category = meal.category || 'Veg';
          const isEmpty = !meal.title && (!meal.items || meal.items.length === 0);

          return (
            <motion.div
              key={slot.key}
              whileHover={{ y: -2 }}
              className={`p-5 rounded-3xl border transition-all ${
                isSlotArchived
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-dashed border-amber-300 dark:border-amber-700/50'
                  : isOff
                  ? 'bg-gray-100/60 dark:bg-white/[0.02] border-gray-200/60 dark:border-white/5 opacity-70'
                  : isEmpty
                  ? 'bg-white/70 dark:bg-[#0f1715]/70 border-dashed border-gray-300 dark:border-white/20'
                  : 'bg-white/90 dark:bg-[#0f1715]/90 border-gray-200/80 dark:border-white/10 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      slot.color === 'amber'
                        ? 'bg-amber-100 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400'
                        : slot.color === 'emerald'
                        ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : slot.color === 'blue'
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                        : 'bg-purple-100 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white">
                      {slot.label}
                    </h3>
                    <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{meal.timing || 'Standard Hours'}</span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isSlotArchived ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white">
                      Archived Slot
                    </span>
                  ) : (
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        CATEGORY_COLORS[category] || CATEGORY_COLORS.Veg
                      }`}
                    >
                      {category}
                    </span>
                  )}

                  {meal.specialTag && !isSlotArchived && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                      {meal.specialTag}
                    </span>
                  )}
                </div>
              </div>

              {/* Main Dish Headline / Empty Prompt */}
              <div className="my-2.5">
                {isSlotArchived ? (
                  <div className="p-2.5 rounded-xl bg-amber-100/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 text-xs flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <span>
                      <strong>Archived:</strong> {meal.archiveReason || 'Meal not served on this day schedule.'}
                    </span>
                  </div>
                ) : isEmpty ? (
                  <div
                    onClick={() => handleOpenEdit(slot.key)}
                    className="p-3 rounded-2xl border border-dashed border-gray-300 dark:border-white/10 text-center cursor-pointer hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-colors"
                  >
                    <Plus className="w-4 h-4 mx-auto text-emerald-500 mb-1" />
                    <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                      Empty Slot • Click to Add Dish
                    </span>
                  </div>
                ) : (
                  <h4 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                    {meal.title}
                  </h4>
                )}
              </div>

              {/* Ingredients / Side Dishes */}
              {!isSlotArchived && !isEmpty && (
                <div className="min-h-[44px]">
                  {Array.isArray(meal.items) && meal.items.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {meal.items.map((item, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/5 text-[11px] font-medium text-gray-700 dark:text-gray-300"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 italic">No specific side dishes added</span>
                  )}
                </div>
              )}

              {/* Card Footer / Quick Actions */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => handleToggleArchiveSlot(slot.key)}
                  className={`text-[11px] font-bold transition-colors ${
                    isSlotArchived
                      ? 'text-emerald-600 dark:text-emerald-400 hover:underline'
                      : 'text-amber-600 dark:text-amber-400 hover:underline'
                  }`}
                >
                  {isSlotArchived ? '↺ Unarchive Slot' : 'Archive Slot'}
                </button>

                <button
                  onClick={() => handleOpenEdit(slot.key)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-800 dark:text-gray-200 hover:text-emerald-600 dark:hover:text-emerald-400 text-xs font-bold transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEmpty ? 'Add Dish' : `Edit ${slot.label}`}</span>
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
        </div>
      )}

      {/* VIEW 2: FULL DINING CALENDAR MATRIX */}
      {activeMainTab === 'calendar' && (
        <MenuCalendarMatrix
          weeklyMenu={activeDataset}
          overrides={overrides}
          onSelectDate={(date) => handleOpenNewOverride(date)}
          onOpenRangedModal={() => setRangedModalOpen(true)}
          onOpenPresetsModal={() => setShowPresetManagerModal(true)}
        />
      )}

      {/* VIEW 3: SPECIAL FEASTS & OVERRIDES HUB */}
      {activeMainTab === 'overrides' && (
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-4 sm:p-6 shadow-sm border border-gray-200 dark:border-white/10 space-y-5">
          {/* Top Hub Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                <span>Special Feasts & Date Overrides Hub</span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Manage all one-off feasts, exam week schedules, holidays, and ranged dining modifications.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setRangedModalOpen(true);
                }}
                className="px-3.5 py-2 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 font-bold text-xs hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors flex items-center gap-1.5"
              >
                <CalendarDays className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Ranged / Bulk Overrides</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  handleOpenNewOverride();
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-black text-xs shadow-lg shadow-purple-500/20 hover:from-purple-700 hover:to-indigo-700 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Single Feast</span>
              </button>
            </div>
          </div>

          {/* Search & Bulk Selection Bar */}
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={overridesSearch}
                onChange={(e) => setOverridesSearch(e.target.value)}
                placeholder="Search overrides by date, occasion, dish name, or note..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-white dark:bg-zinc-800 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-hidden focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {selectedOverrideKeys.length > 0 && (
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-purple-600 dark:text-purple-400">
                  {selectedOverrideKeys.length} selected
                </span>
                <button
                  type="button"
                  onClick={handleBatchDeleteOverrides}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 font-bold text-xs hover:bg-rose-100 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Selected</span>
                </button>
              </div>
            )}
          </div>

          {/* Overrides Table / Cards */}
          {sortedOverridesList.length === 0 ? (
            <div className="py-14 text-center text-gray-400 text-xs">
              <Sparkles className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" />
              <p>No date overrides or special feasts currently registered.</p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => handleOpenNewOverride()}
                  className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs hover:bg-purple-700"
                >
                  + Add Single Feast
                </button>
                <button
                  type="button"
                  onClick={() => setRangedModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-200"
                >
                  Apply Ranged Schedule
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedOverridesList.map((ovr) => {
                const isSelected = selectedOverrideKeys.includes(ovr.dateKey);
                return (
                  <div
                    key={ovr.dateKey}
                    className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-purple-400 bg-purple-50/30 dark:bg-purple-950/20'
                        : 'border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5 hover:border-purple-300'
                    }`}
                  >
                    <div className="flex items-start space-x-3.5 min-w-0 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          feedback('tick');
                          setSelectedOverrideKeys((prev) =>
                            prev.includes(ovr.dateKey)
                              ? prev.filter((k) => k !== ovr.dateKey)
                              : [...prev, ovr.dateKey]
                          );
                        }}
                        className="w-4 h-4 mt-1 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-sm text-purple-600 dark:text-purple-400">
                            {formatFriendlyDate(ovr.dateKey, true)}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            ({ovr.dateKey})
                          </span>
                          {ovr.isClosed && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-500 text-white text-[10px] font-black uppercase">
                              Canteen Closed
                            </span>
                          )}
                        </div>

                        <h4 className="text-base font-black text-gray-900 dark:text-white mt-0.5">
                          {ovr.occasion || 'Special Dining Schedule'}
                        </h4>

                        {/* Meal slots breakdown chips */}
                        {ovr.isClosed ? (
                          <p className="text-xs text-rose-600 dark:text-rose-400 font-medium mt-1">
                            Reason: {ovr.closureReason || 'Routine Off'}
                          </p>
                        ) : (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {ovr.breakfast?.title && (
                              <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40 text-xs font-semibold inline-flex items-center gap-1.5">
                                <Sunrise className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                                <span>BF: {ovr.breakfast.title}</span>
                              </span>
                            )}
                            {ovr.lunch?.title && (
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40 text-xs font-semibold inline-flex items-center gap-1.5">
                                <Utensils className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                <span>Lunch: {ovr.lunch.title}</span>
                              </span>
                            )}
                            {ovr.evening?.title && (
                              <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40 text-xs font-semibold inline-flex items-center gap-1.5">
                                <Coffee className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                <span>Evening: {ovr.evening.title}</span>
                              </span>
                            )}
                            {ovr.dinner?.title && (
                              <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800/40 text-xs font-semibold inline-flex items-center gap-1.5">
                                <Moon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                                <span>Dinner: {ovr.dinner.title}</span>
                              </span>
                            )}
                          </div>
                        )}

                        {ovr.note && (
                          <p className="text-[11px] text-gray-500 mt-1 italic">
                            Notice: {ovr.note}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2 self-end md:self-center">
                      <button
                        type="button"
                        onClick={() => handleEditOverride(ovr.dateKey)}
                        className="px-3 py-1.5 rounded-xl bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 font-bold text-xs transition-colors flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteOverride(ovr.dateKey)}
                        className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Delete override and restore routine"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit Meal Drawer/Modal */}
      <MealEditModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        dayKey={selectedDayKey}
        dayName={currentDayData?.dayName || 'Day'}
        slotKey={editingSlot}
        initialData={currentDayData?.[editingSlot]}
        onSave={handleSaveMealSlot}
      />

      {/* Comprehensive Single-Date Override / Feast CRUD Modal */}
      <DateOverrideEditModal
        isOpen={dateOverrideModal.isOpen}
        onClose={() => setDateOverrideModal({ isOpen: false, date: '', override: null })}
        targetDate={dateOverrideModal.date}
        existingOverride={dateOverrideModal.override}
        weeklyMenu={activeDataset}
        userEmail={user?.email || 'admin'}
      />

      {/* Bulk, Multiple & Ranged Dates Override Modal */}
      <RangedMenuModal
        isOpen={rangedModalOpen}
        onClose={() => setRangedModalOpen(false)}
        userEmail={user?.email || 'admin'}
      />

      {/* Bulk Menu Edit Modal (Item #10) */}
      <BulkMenuEditModal
        isOpen={showBulkEditModal}
        onClose={() => setShowBulkEditModal(false)}
      />

      {/* Presets CRUD Modal (Item #10) */}
      <PresetManagerModal
        isOpen={showPresetManagerModal}
        onClose={() => setShowPresetManagerModal(false)}
      />

      {/* Universal In-App Document Viewer & Action Modal */}
      <UniversalDocumentModal
        isOpen={universalDoc.isOpen}
        onClose={() => setUniversalDoc({ isOpen: false, data: null })}
        documentData={universalDoc.data}
      />
    </div>
  );
}
