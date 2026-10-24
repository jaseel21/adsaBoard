import React, { useState, useMemo, useContext, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  Search,
  X,
  Lock,
  Unlock,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  CalendarDays,
  RotateCw,
  RotateCcw,
  FileText,
  FileDown,
  Download,
  Sparkles,
  Clock,
  ArrowRight,
  Sliders,
  User,
  ExternalLink,
  HelpCircle,
  Info,
  LayoutGrid,
  CreditCard,
  Layers,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  ChevronLeft,
  History,
  Filter,
  Check,
  Printer,
  ArrowUpDown,
  Flame,
  ChefHat,
  Users,
  ShieldCheck,
  Calendar as CalendarIcon,
  SlidersHorizontal,
  UtensilsCrossed,
  Ban,
  Receipt,
} from 'lucide-react';

import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { usePortalStatus } from '../utils/usePortalStatus';
import { AuthContext } from '../store/AuthContext';
import { DataOfOne } from '../store/StudentData';
import {
  getActiveStudentException,
  getEffectiveStudentMealStatus,
  formatFriendlyDate,
  addDaysToDate,
} from '../utils/studentExceptionService';
import { getStudentFineAmount } from '../utils/mealScheduleService';
import { useTokenBoardController } from '../utils/useTokenBoardController';
import {
  exportSinglePageCombinedManifestPDF,
  exportDietaryAvoidersPDF,
  generateSinglePageCombinedManifestDoc,
  generateDietaryAvoidersDoc,
} from '../utils/publicDocumentExporter';
import { directPrintPdf, shareDocument, createPdfBlob } from '../utils/documentHubService';

import MealFlipCard from './MealFlipCard';
import TokenButton from './ui/TokenButton';
import TokenCard from './ui/TokenCard';
import TokenBoardCalendarPopover from './ui/TokenBoardCalendarPopover';
import NextMealSpotlight from './NextMealSpotlight';
import AdvancedExportModal from './export/AdvancedExportModal';
import UniversalDocumentModal from './export/UniversalDocumentModal';
import ExportActionMenu from './export/ExportActionMenu';
import TokenBoardGuideModal from './guide/TokenBoardGuideModal';
import { getCategoryIcon } from './avoiders/dietaryIcons';
import useSEO from '../hooks/useSEO';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();
  const portalStatus = usePortalStatus();
  const { user, role } = useContext(AuthContext);
  const { stdata } = useContext(DataOfOne);

  // Synchronize dynamic SEO metadata
  useSEO({
    title: 'Student Dining Overview & Live Token Attendance',
    description:
      'Official dining logistics and token management platform for Alathurpadi Dars, Malappuram. Real-time token attendance, kitchen display manifest, dietary avoiders, and campus care concierge.',
    keywords:
      'canteen alathurpadidars, alathurpadi dars canteen, adsatboard, adsa token board, dars food management, malappuram dars dining, melmuri',
  });

  // Unified Token Board Controller
  const controller = useTokenBoardController({
    autoEveningShift: true,
    initialMeal: 'breakfast',
    initialViewCategory: 'all',
    initialViewDensity: 'matrix',
  });

  const {
    documents,
    filteredDocuments,
    loading,
    isLunch,
    toggleMeal,
    targetDateIST,
    todayIST,
    effectiveDay,
    dayShort,
    dayFull,
    dateMode,
    setDateToToday,
    setDateToTomorrow,
    setDateToCustom,
    setDateToAuto,
    stepDateBackward,
    stepDateForward,
    relativeDateMeta,
    isPostEveningCutoff,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    batchFilter,
    setBatchFilter,
    dietaryFilter,
    setDietaryFilter,
    sortBy,
    setSortBy,
    viewCategory,
    setViewCategory,
    viewDensity,
    setViewDensity,
    allBatches,
    preferencesList,
    groupedByBatch,
    groupedByBatchList,
    groupedBySection,
    groupedByDietary,
    collapsedBatches,
    toggleBatchCollapse,
    collapseAllBatches,
    expandAllBatches,
    collapsedDietary,
    toggleDietaryCollapse,
    collapseAllDietary,
    expandAllDietary,
    resetAllFilters,
    hasActiveFilters,
    activeFilterCount,
    metrics,
    time12,
    timeHms,
    sectionChunkSize,
  } = controller;

  // Resilient batch list resolution: supports both array and object representations
  const batchList = useMemo(() => {
    if (Array.isArray(groupedByBatchList) && groupedByBatchList.length > 0) {
      return groupedByBatchList;
    }
    if (Array.isArray(groupedByBatch)) {
      return groupedByBatch;
    }
    if (Array.isArray(groupedByBatch?.list)) {
      return groupedByBatch.list;
    }
    const mealKey = isLunch ? 'lunch' : 'breakfast';
    return Object.entries(groupedByBatch || {}).map(([name, students]) => {
      const studentArr = Array.isArray(students) ? students : [];
      const activeCount = studentArr.filter(
        (doc) => !doc.block && getEffectiveStudentMealStatus(doc, targetDateIST, effectiveDay, mealKey)
      ).length;
      return {
        name,
        students: studentArr,
        activeCount,
        totalCount: studentArr.length,
      };
    });
  }, [groupedByBatch, groupedByBatchList, isLunch, targetDateIST, effectiveDay]);

  // UI state: Modals, Ribbons & Collapsible Filter Toolbar (collapsed by default)
  const [detailsDoc, setDetailsDoc] = useState(null);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);
  const [lockedPortalAlertOpen, setLockedPortalAlertOpen] = useState(false);
  const [advancedExportModal, setAdvancedExportModal] = useState({ isOpen: false, type: 'supply' });
  const [universalDoc, setUniversalDoc] = useState({ isOpen: false, data: null });
  const [exportingSupply, setExportingSupply] = useState(false);
  const [exportingDietary, setExportingDietary] = useState(false);

  // 3D Flippable Meal Cards Independent States & Token Inspection Modal
  const [isBreakfastFlipped, setIsBreakfastFlipped] = useState(false);
  const [isLunchFlipped, setIsLunchFlipped] = useState(false);
  const [inspectedMeal, setInspectedMeal] = useState(null); // null | 'breakfast' | 'lunch'

  // Global '?' keyboard shortcut for guide modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        feedback('tick');
        setIsGuideOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback]);

  // Handle open student details modal
  const handleOpenDetails = (doc) => {
    feedback('pop');
    setDetailsDoc(doc);
  };

  // Supply Manifest Actions (View, Print, Share, Download)
  const handleViewSupplyManifest = () => {
    feedback('tick');
    const res = generateSinglePageCombinedManifestDoc({
      targetDateIST,
      dayKey: effectiveDay,
      dayFull,
      documents,
      category: 'sections',
      sort: 'ascending',
      chunkSize: sectionChunkSize,
      mealFilter: 'both',
      statusFilter: 'canceled_only',
    });
    setUniversalDoc({ isOpen: true, data: { type: 'pdf', ...res } });
  };

  const handlePrintSupplyManifest = async () => {
    feedback('tick');
    try {
      const { doc } = generateSinglePageCombinedManifestDoc({
        targetDateIST,
        dayKey: effectiveDay,
        dayFull,
        documents,
        category: 'sections',
        sort: 'ascending',
        chunkSize: sectionChunkSize,
        mealFilter: 'both',
        statusFilter: 'canceled_only',
      });
      const { blobUrl } = createPdfBlob(doc);
      await directPrintPdf(blobUrl);
    } catch (err) {
      console.error('Print supply manifest error:', err);
    }
  };

  const handleShareSupplyManifest = async () => {
    feedback('pop');
    try {
      const { doc, filename, title } = generateSinglePageCombinedManifestDoc({
        targetDateIST,
        dayKey: effectiveDay,
        dayFull,
        documents,
        category: 'sections',
        sort: 'ascending',
        chunkSize: sectionChunkSize,
        mealFilter: 'both',
        statusFilter: 'canceled_only',
      });
      const { blob } = createPdfBlob(doc);
      await shareDocument({
        blob,
        filename,
        title,
        text: `${title} (${targetDateIST}) • Alathurpadi Dars Canteen`,
      });
    } catch (err) {
      console.error('Share supply manifest error:', err);
    }
  };

  const handleQuickSupplyExport = () => {
    feedback('tick');
    const { doc, filename } = generateSinglePageCombinedManifestDoc({
      targetDateIST,
      dayKey: effectiveDay,
      dayFull,
      documents,
      category: 'sections',
      sort: 'ascending',
      chunkSize: sectionChunkSize,
      mealFilter: 'both',
      statusFilter: 'canceled_only',
    });
    doc.save(filename);
  };

  // Dietary Avoiders Matrix Actions (View, Print, Share, Download)
  const handleViewDietaryAvoiders = () => {
    feedback('tick');
    const res = generateDietaryAvoidersDoc({
      preferences: preferencesList,
      documents,
      sort: 'ascending',
      targetDateIST,
      dayKey: effectiveDay,
      dayFull,
      attendanceScope: 'active_diners',
      mealFilter: isLunch ? 'lunch' : 'breakfast',
    });
    setUniversalDoc({ isOpen: true, data: { type: 'pdf', ...res } });
  };

  const handleQuickDietaryExport = () => {
    feedback('tick');
    const { doc, filename } = generateDietaryAvoidersDoc({
      preferences: preferencesList,
      documents,
      sort: 'ascending',
      targetDateIST,
      dayKey: effectiveDay,
      dayFull,
      attendanceScope: 'active_diners',
      mealFilter: isLunch ? 'lunch' : 'breakfast',
    });
    doc.save(filename);
  };

  const handlePrintDietaryAvoiders = async () => {
    feedback('tick');
    try {
      const { doc } = generateDietaryAvoidersDoc({
        preferences: preferencesList,
        documents,
        sort: 'ascending',
        targetDateIST,
        dayKey: effectiveDay,
        dayFull,
        attendanceScope: 'active_diners',
        mealFilter: isLunch ? 'lunch' : 'breakfast',
      });
      const { blobUrl } = createPdfBlob(doc);
      await directPrintPdf(blobUrl);
    } catch (err) {
      console.error('Print dietary matrix error:', err);
    }
  };

  const handleShareDietaryAvoiders = async () => {
    feedback('pop');
    try {
      const { doc, filename, title } = generateDietaryAvoidersDoc({
        preferences: preferencesList,
        documents,
        sort: 'ascending',
        targetDateIST,
        dayKey: effectiveDay,
        dayFull,
        attendanceScope: 'active_diners',
        mealFilter: isLunch ? 'lunch' : 'breakfast',
      });
      const { blob } = createPdfBlob(doc);
      await shareDocument({
        blob,
        filename,
        title,
        text: `${title} (${targetDateIST}) • Alathurpadi Dars Canteen`,
      });
    } catch (err) {
      console.error('Share dietary matrix error:', err);
    }
  };

  // Days list for weekly schedule in details modal
  const daysList = [
    { key: 'su', label: t('days')?.su || 'Sun' },
    { key: 'mo', label: t('days')?.mo || 'Mon' },
    { key: 'tu', label: t('days')?.tu || 'Tue' },
    { key: 'we', label: t('days')?.we || 'Wed' },
    { key: 'th', label: t('days')?.th || 'Thu' },
    { key: 'fr', label: t('days')?.fr || 'Fri' },
    { key: 'sa', label: t('days')?.sa || 'Sat' },
  ];

  // Friendly date formatted string
  const friendlyTargetDate = useMemo(() => {
    if (!targetDateIST) return '';
    try {
      const parts = targetDateIST.split('-');
      if (parts.length === 3) {
        const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
        return d.toLocaleDateString(lang === 'ml' ? 'ml-IN' : 'en-US', {
          weekday: 'long',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch (_) {}
    return targetDateIST;
  }, [targetDateIST, lang]);

  const tomorrowIST = useMemo(() => addDaysToDate(todayIST, 1), [todayIST]);
  const isToday = targetDateIST === todayIST;
  const isTomorrow = targetDateIST === tomorrowIST;
  const isPast = targetDateIST < todayIST;
  const isFuture = targetDateIST > tomorrowIST;
  const isShowingTomorrow = isTomorrow;

  const dayLabel = isToday
    ? t('today', 'Today')
    : isTomorrow
    ? t('tomorrow', 'Tomorrow')
    : isPast
    ? t('pastRecord', 'Past Record')
    : t('scheduledDate', 'Scheduled Date');

  // Logged in student's current status for target date
  const studentPersonalMealStatus = useMemo(() => {
    if (!stdata || !stdata.tokenNo || !documents || documents.length === 0) return null;
    const studentDoc = documents.find(
      (d) => String(d.tokenNo) === String(stdata.tokenNo) || String(d.id) === String(stdata.tokenNo)
    );
    if (!studentDoc) return null;

    const isOn = getEffectiveStudentMealStatus(
      studentDoc,
      targetDateIST,
      effectiveDay,
      isLunch ? 'lunch' : 'breakfast'
    );
    const isBlocked = Boolean(studentDoc.block);
    const hasExc = Boolean(
      getActiveStudentException(studentDoc, targetDateIST, isLunch ? 'lunch' : 'breakfast')
    );

    return {
      doc: studentDoc,
      isOn,
      isBlocked,
      hasExc,
    };
  }, [stdata, documents, targetDateIST, effectiveDay, isLunch]);

  // Compute Breakfast & Lunch metrics for Hero 3D Flippable Cards reactive to targetDateIST
  const heroMealMetrics = useMemo(() => {
    if (!documents || documents.length === 0) {
      return {
        totalStudents: 0,
        breakfastActive: 0,
        breakfastRejected: 0,
        breakfastRejectedTokens: [],
        lunchActive: 0,
        lunchRejected: 0,
        lunchRejectedTokens: [],
      };
    }

    let bActive = 0;
    let lActive = 0;
    const bRejected = [];
    const lRejected = [];

    documents.forEach((s) => {
      const tokenNum = s.tokenNo !== undefined ? s.tokenNo : s.id;
      if (getEffectiveStudentMealStatus(s, targetDateIST, effectiveDay, 'breakfast')) {
        bActive++;
      } else {
        bRejected.push(tokenNum);
      }

      if (getEffectiveStudentMealStatus(s, targetDateIST, effectiveDay, 'lunch')) {
        lActive++;
      } else {
        lRejected.push(tokenNum);
      }
    });

    return {
      totalStudents: documents.length,
      breakfastActive: bActive,
      breakfastRejected: bRejected.length,
      breakfastRejectedTokens: bRejected,
      lunchActive: lActive,
      lunchRejected: lRejected.length,
      lunchRejectedTokens: lRejected,
    };
  }, [documents, targetDateIST, effectiveDay]);

  // Toggle flipping both cards simultaneously
  const handleFlipBoth = () => {
    feedback('pop');
    const anyFlipped = isBreakfastFlipped || isLunchFlipped;
    if (anyFlipped) {
      setIsBreakfastFlipped(false);
      setIsLunchFlipped(false);
    } else {
      setIsBreakfastFlipped(true);
      setIsLunchFlipped(true);
    }
  };

  const inspectedTokensList =
    inspectedMeal === 'breakfast'
      ? heroMealMetrics.breakfastRejectedTokens
      : heroMealMetrics.lunchRejectedTokens;

  return (
    <div className="w-full max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6 sm:space-y-7 min-w-0">
      
      {/* ========================================================================= */}
      {/* 1. LOGGED-IN STUDENT PERSONAL MEAL STATUS CHIP (If student is logged in)   */}
      {/* ========================================================================= */}
      {studentPersonalMealStatus && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3.5 sm:p-4 rounded-2xl bg-white/90 dark:bg-[#0f1715]/90 border border-emerald-500/30 dark:border-emerald-500/30 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-mono font-black text-sm text-white shadow-sm flex-shrink-0 ${
                studentPersonalMealStatus.isBlocked
                  ? 'bg-gray-800'
                  : studentPersonalMealStatus.isOn
                  ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                  : 'bg-gradient-to-br from-rose-500 to-red-600'
              }`}
            >
              #{stdata.tokenNo}
            </div>
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5 truncate">
                <span>{stdata.nameEn || stdata.name || `Student #${stdata.tokenNo}`}</span>
                {stdata.nameMl && (
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal font-malayalam">
                    ({stdata.nameMl})
                  </span>
                )}
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                {isLunch ? t('navLunch', 'Lunch') : t('navBreakfast', 'Breakfast')} on {friendlyTargetDate}:{' '}
                <strong
                  className={
                    studentPersonalMealStatus.isBlocked
                      ? 'text-gray-500 dark:text-gray-400'
                      : studentPersonalMealStatus.isOn
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }
                >
                  {studentPersonalMealStatus.isBlocked
                    ? t('locked', 'Locked')
                    : studentPersonalMealStatus.isOn
                    ? t('takingMealOn', 'Taking Meal (ON)')
                    : t('skippedMealOff', 'Skipped (OFF)')}
                </strong>
                {studentPersonalMealStatus.hasExc && (
                  <span className="ml-1.5 text-[10px] text-rose-500 dark:text-rose-400 font-bold">
                    • {t('singleDayLeaveActive', '1-Day Leave Active')}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <Link
              to="/student"
              onClick={() => feedback('tick')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border border-emerald-300 dark:border-emerald-500/30 text-xs font-bold transition-colors inline-flex items-center gap-1"
            >
              <span>{t('editMyRoutine', 'Edit Preferences / Leave')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </motion.div>
      )}

      {/* ========================================================================= */}
      {/* 2. HERO DINING OVERVIEW: LEFT (TITLE & DATE) | RIGHT (3D FLIP CARDS)      */}
      {/* ========================================================================= */}
      <section className="relative overflow-hidden rounded-3xl p-5 sm:p-7 md:p-9 bg-gradient-to-br from-emerald-900 via-emerald-950 to-[#07130e] text-white border border-emerald-500/30 shadow-2xl">
        
        {/* Ambient background glows */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-96 h-96 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-80 h-80 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
          
          {/* LEFT SIDE: Date Switcher, Title, Subtitle, Supporting Meta */}
          <div className="space-y-4 max-w-xl">
            
            {/* Main Tactical Date Stepper Switch: [ ◀ ] [ Date, Day & Calendar ] [ ▶ ] */}
            <div className="space-y-2.5">
              <div className="inline-flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-black/40 border border-white/15 backdrop-blur-md shadow-lg max-w-full">
                {/* Prev Day Button */}
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    stepDateBackward();
                  }}
                  className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-emerald-100 hover:text-white transition-all cursor-pointer shrink-0"
                  title={`${t('prevDay', 'Previous Day')} (${addDaysToDate(targetDateIST, -1)})`}
                  aria-label={t('prevDay', 'Previous Day')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Center Date & Day Interactive Button (Tapping opens Calendar Popover) */}
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setIsCalendarOpen(true);
                  }}
                  className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-98 transition-all cursor-pointer flex items-center gap-2 sm:gap-2.5 border border-white/10 group min-w-0"
                  title={t('clickToOpenCalendar', 'Click to open calendar')}
                >
                  <CalendarIcon className="w-4 h-4 text-emerald-300 group-hover:scale-110 transition-transform shrink-0" />
                  
                  {/* Formatted Weekday & Date */}
                  <div className="flex items-center gap-1.5 sm:gap-2 text-left min-w-0">
                    <span className="text-xs sm:text-sm font-black text-white tracking-tight truncate">
                      {formatFriendlyDate(targetDateIST, true)}
                    </span>

                    {/* Contextual Status Badge */}
                    {isToday ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 text-[10px] font-extrabold uppercase tracking-wide shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        {t('today', 'Today')}
                      </span>
                    ) : isTomorrow ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/30 text-teal-200 border border-teal-400/30 text-[10px] font-extrabold uppercase tracking-wide shrink-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-teal-400" />
                        {t('tomorrow', 'Tomorrow')}
                      </span>
                    ) : isPast ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-200 border border-purple-400/30 text-[10px] font-bold shrink-0">
                        <History className="w-2.5 h-2.5" />
                        <span>{relativeDateMeta?.relativeLabel || t('pastRecord', 'Past Record')}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/30 text-blue-200 border border-blue-400/30 text-[10px] font-bold shrink-0">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{relativeDateMeta?.relativeLabel || t('scheduledDate', 'Scheduled Date')}</span>
                      </span>
                    )}
                  </div>
                </button>

                {/* Next Day Button */}
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    stepDateForward();
                  }}
                  className="p-2 sm:p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-emerald-100 hover:text-white transition-all cursor-pointer shrink-0"
                  title={`${t('nextDay', 'Next Day')} (${addDaysToDate(targetDateIST, 1)})`}
                  aria-label={t('nextDay', 'Next Day')}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Template / Preset Buttons Below Switch */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-semibold text-emerald-200/60 uppercase tracking-wider pl-0.5">
                  {t('presets', 'Templates')}:
                </span>

                {/* Today Preset Button */}
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setDateToToday();
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isToday
                      ? 'bg-emerald-500 text-white border-emerald-400 shadow-sm font-black'
                      : 'bg-white/10 text-emerald-100/80 hover:text-white hover:bg-white/15 border-white/10'
                  }`}
                >
                  {isToday && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                  <span>{t('today', 'Today')}</span>
                </button>

                {/* Tomorrow Preset Button */}
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setDateToTomorrow();
                  }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                    isTomorrow
                      ? 'bg-teal-500 text-white border-teal-400 shadow-sm font-black'
                      : 'bg-white/10 text-emerald-100/80 hover:text-white hover:bg-white/15 border-white/10'
                  }`}
                >
                  {isTomorrow && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  <span>{t('tomorrow', 'Tomorrow')}</span>
                </button>

                {/* Auto Mode Restore Button (if on custom date) */}
                {dateMode !== 'auto' && (
                  <button
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setDateToAuto();
                    }}
                    className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 hover:text-white text-xs font-bold border border-emerald-400/30 transition-all cursor-pointer flex items-center gap-1"
                    title={t('resetToAutoHint', 'Restore automatic cutoff schedule (Today/Tomorrow)')}
                  >
                    <RotateCcw className="w-3 h-3 text-emerald-300" />
                    <span>{t('resetToAuto', 'Auto')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Calendar Popover (Portal to body, zero card clipping) */}
            <TokenBoardCalendarPopover
              isOpen={isCalendarOpen}
              onClose={() => setIsCalendarOpen(false)}
              controller={controller}
            />

            {/* Title & Subtitle */}
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white leading-tight">
                {isToday
                  ? t('todayDiningOverview', "Today's Dining Overview")
                  : isTomorrow
                  ? t('tomorrowDiningOverview', "Tomorrow's Dining Overview")
                  : `${friendlyTargetDate} • ${t('diningOverview', "Dining Overview")}`}
                <span className="sr-only"> - Alathurpadi Dars Canteen Food Management &amp; Token Board (ADSA T-Board)</span>
              </h1>
              <p className="text-xs sm:text-sm md:text-base text-emerald-100/85 mt-2 leading-relaxed">
                {t('studentDashboardSub', 'Transparent meal counts and token status for students and canteen staff of Alathurpadi Dars.')}
              </p>
            </div>

            {/* Cutoff Info Badge */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-emerald-200/90 font-medium">
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 border border-white/15 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>{t('cutoffNotice', 'Daily update window: 02:00 PM - 11:00 PM IST')}</span>
                <span className="text-white/40">•</span>
                <strong className={portalStatus.isUpdationWindowOpen ? 'text-emerald-300 font-bold' : 'text-amber-300 font-bold'}>
                  {portalStatus.isUpdationWindowOpen ? t('orderWindowOpen', 'Open') : t('orderWindowClosed', 'Closed')}
                </strong>
              </span>
            </div>
          </div>

          {/* RIGHT SIDE: Distinct Breakfast & Lunch 3D Flipping Cards */}
          <div className="flex flex-col gap-2.5 w-full lg:max-w-xl flex-shrink-0">
            {/* Top Bar: Total Enrolled & Flip Both Button */}
            <div className="flex items-center justify-between text-xs text-emerald-200 px-1">
              <span className="font-mono text-[11px] font-bold text-emerald-300">
                {documents.length} {t('tokensRegistered', 'Tokens Registered')}
              </span>

              <button
                type="button"
                onClick={handleFlipBoth}
                className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white text-[11px] font-bold border border-white/20 transition-all flex items-center gap-1.5 cursor-pointer"
                title="Flip both cards between active and rejected counts"
              >
                <RotateCw className="w-3 h-3 text-emerald-300" />
                <span>
                  {isBreakfastFlipped || isLunchFlipped ? t('unflipBothCards', 'Reset') : t('flipBothCards', 'Flip Both')}
                </span>
              </button>
            </div>

            {/* The 2 Distinct Flipping Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full min-w-0">
              {/* BREAKFAST FLIP CARD */}
              <MealFlipCard
                mealType="breakfast"
                activeCount={loading ? 0 : heroMealMetrics.breakfastActive}
                rejectedCount={loading ? 0 : heroMealMetrics.breakfastRejected}
                totalStudents={heroMealMetrics.totalStudents}
                isFlipped={isBreakfastFlipped}
                onFlip={() => {
                  feedback('pop');
                  setIsBreakfastFlipped((prev) => !prev);
                }}
                targetDateStr={friendlyTargetDate}
                dayLabel={dayLabel}
                rejectedTokens={heroMealMetrics.breakfastRejectedTokens}
                onOpenTokensModal={(m) => {
                  feedback('tick');
                  setInspectedMeal(m);
                }}
              />

              {/* LUNCH FLIP CARD */}
              <MealFlipCard
                mealType="lunch"
                activeCount={loading ? 0 : heroMealMetrics.lunchActive}
                rejectedCount={loading ? 0 : heroMealMetrics.lunchRejected}
                totalStudents={heroMealMetrics.totalStudents}
                isFlipped={isLunchFlipped}
                onFlip={() => {
                  feedback('pop');
                  setIsLunchFlipped((prev) => !prev);
                }}
                targetDateStr={friendlyTargetDate}
                dayLabel={dayLabel}
                rejectedTokens={heroMealMetrics.lunchRejectedTokens}
                onOpenTokensModal={(m) => {
                  feedback('tick');
                  setInspectedMeal(m);
                }}
              />
            </div>
          </div>
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 3. CANTEEN MEAL RADAR (Embedded without bulky highlight banner)          */}
      {/* ========================================================================= */}
      <NextMealSpotlight
        documents={documents}
        lunchOrdersCount={metrics.lunchCount}
        breakfastOrdersCount={metrics.breakfastCount}
        showSpotlightBanner={false}
      />

      {/* ========================================================================= */}
      {/* 5. LIVE EMBEDDED TOKEN BOARD (Search, Collapsible Filters & Matrix)       */}
      {/* ========================================================================= */}
      <section className="space-y-4">
        
        {/* Controls Toolbar: Meal Switch, Search, Category, Density & Filter Drawer */}
        <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-3">
          
          {/* Top Bar: Meal Switch + Search + Category + Density + Filter Toggle (Parallel) */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
            
            {/* Breakfast ↔ Lunch Active Board Switcher */}
            <div className="inline-flex p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 shrink-0">
              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  toggleMeal('breakfast');
                }}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  !isLunch
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-sm shadow-amber-500/20'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Coffee className="w-3.5 h-3.5" />
                <span>{t('navBreakfast', 'Breakfast')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  toggleMeal('lunch');
                }}
                className={`inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                  isLunch
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-sm shadow-emerald-500/20'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Utensils className="w-3.5 h-3.5" />
                <span>{t('navLunch', 'Lunch')}</span>
              </button>
            </div>

            {/* Instant Search Box */}
            <div className="relative flex-1 min-w-0">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('searchTokensPlaceholder', 'Search token #, name, batch...')}
                className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs sm:text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setSearchQuery('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-0.5 rounded-md"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* View Mode & Filter Drawer Toggle */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 self-stretch lg:self-auto shrink-0">
              
              {/* Category Segmented Control (All / By Batch / By Section) */}
              <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-semibold overflow-x-auto max-w-full scrollbar-none flex-1 sm:flex-none">
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setViewCategory('all');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    viewCategory === 'all'
                      ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('allTokensMode', 'All Tokens')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setViewCategory('batch');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    viewCategory === 'batch'
                      ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('byAcademicBatch', 'By Batch')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setViewCategory('section');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer ${
                    viewCategory === 'section'
                      ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  {t('byDynamicSections', 'By Sections')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setViewCategory('dietary');
                  }}
                  className={`px-3 py-1.5 rounded-lg transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                    viewCategory === 'dietary'
                      ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm font-bold'
                      : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>{t('byDietaryPreferences', 'By Dietary')}</span>
                </button>
              </div>

              {/* Density Toggle (Matrix vs Cards) */}
              <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setViewDensity('matrix');
                  }}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewDensity === 'matrix'
                      ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  title={t('compactMatrix', 'Tactile Matrix View')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setViewDensity('cards');
                  }}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                    viewDensity === 'cards'
                      ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                  title={t('detailedStudentCards', 'Detailed Student Cards')}
                >
                  <CreditCard className="w-4 h-4" />
                </button>
              </div>

              {/* Collapsible Filter Toggle Button */}
              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  setIsFilterExpanded((prev) => !prev);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 border ${
                  isFilterExpanded || hasActiveFilters
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-500/30'
                    : 'bg-gray-100 hover:bg-gray-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border-gray-200/80 dark:border-white/10'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('filterAndSort', 'Filters & Sort')}</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                {isFilterExpanded ? (
                  <ChevronUp className="w-3.5 h-3.5 text-gray-400" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          {/* Collapsible Drawer (Collapsed by Default) */}
          <AnimatePresence>
            {isFilterExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 pt-3 border-t border-gray-100 dark:border-white/5 overflow-hidden"
              >
                {/* Row A: Status Filter Chips */}
                <div className="flex items-center justify-between gap-2 overflow-x-auto scrollbar-none touch-pan-x">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <span className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-wider shrink-0 mr-1">
                      {t('statusFilterLabel', 'Status:')}
                    </span>

                    {[
                      { id: 'all', label: t('allTokens', 'All Tokens'), count: metrics.total },
                      { id: 'active', label: t('statusServing', 'Serving (ON)'), count: metrics.activeCount, isGreen: true },
                      { id: 'off', label: t('statusCanceled', 'Skipped (OFF)'), count: metrics.offCount, isRed: true },
                      { id: 'leave', label: t('statusOnLeave', 'On Leave'), count: metrics.leaveCount, isRed: true },
                      { id: 'blocked', label: t('statusBlockedLocked', 'Locked'), count: metrics.blockedCount, isGray: true },
                    ].map((chip) => {
                      const isSelected = statusFilter === chip.id;
                      return (
                        <button
                          key={chip.id}
                          type="button"
                          onClick={() => {
                            feedback('tick');
                            setStatusFilter(chip.id);
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-sm shadow-emerald-500/20'
                              : chip.isGreen
                              ? 'bg-emerald-50 hover:bg-emerald-100/70 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                              : chip.isRed
                              ? 'bg-rose-50 hover:bg-rose-100/70 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
                              : 'bg-gray-100 hover:bg-gray-200/80 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <span>{chip.label}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                              isSelected ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10'
                            }`}
                          >
                            {chip.count}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Reset Filters */}
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={() => {
                        feedback('pop');
                        resetAllFilters();
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{t('reset', 'Reset')}</span>
                    </button>
                  )}
                </div>

                {/* Row B: Sort By, Academic Batch & Dietary Exclusions Filter */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  
                  {/* Sort Dropdown */}
                  <div className="relative">
                    <ArrowUpDown className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        feedback('tick');
                        setSortBy(e.target.value);
                      }}
                      aria-label="Sort tokens"
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    >
                      <option value="token_asc">{t('sortTokenAsc', 'Token # (1 → 200)')}</option>
                      <option value="token_desc">{t('sortTokenDesc', 'Token # (200 → 1)')}</option>
                      <option value="name_asc">{t('sortNameAsc', 'Name: English (A → Z)')}</option>
                      <option value="name_ml">{t('sortNameMl', 'Name: Malayalam (അ → ഹ)')}</option>
                      <option value="status_active">{t('sortActiveFirst', 'Serving First (ON)')}</option>
                      <option value="status_off">{t('sortOffFirst', 'Skipped First (OFF)')}</option>
                    </select>
                  </div>

                  {/* Batch Filter Dropdown */}
                  <div className="relative">
                    <Layers className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                      value={batchFilter}
                      onChange={(e) => {
                        feedback('tick');
                        setBatchFilter(e.target.value);
                      }}
                      aria-label="Filter by academic batch"
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    >
                      <option value="all">{t('allBatches', 'All Batches')} ({allBatches.reduce((acc, b) => acc + b.count, 0)})</option>
                      {allBatches.map((b) => (
                        <option key={b.name} value={b.name}>
                          {b.name} ({b.count} {t('students', 'students')})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dietary Avoiders Filter Dropdown */}
                  <div className="relative">
                    <UtensilsCrossed className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <select
                      value={dietaryFilter}
                      onChange={(e) => {
                        feedback('tick');
                        setDietaryFilter(e.target.value);
                      }}
                      aria-label="Filter by dietary preference"
                      className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                    >
                      <option value="all">{t('allDietaryInclusions', 'All Diners (Full Board)')}</option>
                      <option value="any_avoiders">
                        {t('allDietaryAvoiders', 'All Dietary Avoiders')} • {metrics?.totalAvoidersRoster || metrics?.totalAvoiders || 0}
                      </option>
                      {preferencesList.map((p) => {
                        const avoidersCount =
                          metrics?.dietaryTallies?.[`${p.id}_avoiders_total`] !== undefined
                            ? metrics.dietaryTallies[`${p.id}_avoiders_total`]
                            : (metrics?.dietaryTallies?.[`${p.id}_avoiders`] || 0);
                        const prefLabel = lang === 'ml' && p.labelMl ? p.labelMl : (p.labelEn || p.name);
                        return (
                          <option key={p.id} value={p.id}>
                            {prefLabel} • {avoidersCount} {t('avoiders', 'avoiders')}
                          </option>
                        );
                      })}
                      <option value="standard_full">
                        {t('standardFullDiet', 'Standard Full Diet')} • {metrics?.standardFullDietCount || (metrics?.total - (metrics?.totalAvoiders || 0))}
                      </option>
                    </select>
                  </div>

                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* The Token Grid Container: Matches Master Board Spacing & Sizing */}
        <div className="rounded-3xl p-4 sm:p-6 bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/70 dark:border-white/10 shadow-sm backdrop-blur-xl min-h-[300px]">
          
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <RotateCw className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-sm font-semibold">{t('loadingTokens', 'Loading student tokens...')}</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400">
                <Search className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-gray-800 dark:text-gray-200">
                {t('noTokensFound', 'No student tokens matched your search')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('tryDifferentQuery', 'Try clearing your search query or resetting filters.')}
              </p>
              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  resetAllFilters();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {t('resetAllFilters', 'Reset All Filters')}
              </button>
            </div>
          ) : viewCategory === 'batch' ? (
            /* By Academic Batch Accordions View */
            <div className="space-y-4">
              {batchList.filter((b) => b.students && b.students.length > 0).length > 0 && (
                <div className="flex items-center justify-between gap-2 mb-2 px-1 text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">
                    {t('batchesSummary', '{count} batches active').replace(
                      '{count}',
                      batchList.filter((b) => b.students && b.students.length > 0).length
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        expandAllBatches();
                      }}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      {t('expandAll', 'Expand All')}
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        collapseAllBatches();
                      }}
                      className="text-gray-500 dark:text-gray-400 font-medium hover:underline cursor-pointer"
                    >
                      {t('collapseAll', 'Collapse All')}
                    </button>
                  </div>
                </div>
              )}

              {batchList.map((batch) => {
                if (!batch.students || batch.students.length === 0) return null;
                const isCollapsed = Boolean(collapsedBatches[batch.name]);
                return (
                  <div
                    key={batch.name}
                    className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        toggleBatchCollapse(batch.name);
                      }}
                      className="w-full p-4 sm:p-5 flex items-center justify-between bg-gray-50/80 dark:bg-white/5 border-b border-gray-200/60 dark:border-white/10 hover:bg-gray-100/80 dark:hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                          {batch.students.length}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                            {batch.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {batch.students.length} {t('studentsInBatch', 'Students in this batch')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                          {batch.activeCount} / {batch.totalCount} {t('statusActive', 'Active')}
                        </span>
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="p-4 sm:p-5">
                        {viewDensity === 'cards' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                            {batch.students.map((doc) => {
                              const isOn = getEffectiveStudentMealStatus(
                                doc,
                                targetDateIST,
                                effectiveDay,
                                isLunch ? 'lunch' : 'breakfast'
                              );
                              const isBlocked = Boolean(doc.block);
                              const hasDateExc = Boolean(
                                getActiveStudentException(doc, targetDateIST, isLunch ? 'lunch' : 'breakfast')
                              );
                              return (
                                <TokenCard
                                  key={doc.id || doc.tokenNo}
                                  doc={doc}
                                  isOn={isOn}
                                  onLeave={hasDateExc}
                                  isBlocked={isBlocked}
                                  isLunch={isLunch}
                                  onClick={handleOpenDetails}
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 min-[380px]:gap-2.5 sm:gap-3">
                            {batch.students.map((doc) => {
                              const isOn = getEffectiveStudentMealStatus(
                                doc,
                                targetDateIST,
                                effectiveDay,
                                isLunch ? 'lunch' : 'breakfast'
                              );
                              const hasDateExc = Boolean(
                                getActiveStudentException(doc, targetDateIST, isLunch ? 'lunch' : 'breakfast')
                              );
                              return (
                                <TokenButton
                                  key={doc.id || doc.tokenNo}
                                  doc={doc}
                                  isOn={isOn}
                                  onLeave={hasDateExc}
                                  onClick={handleOpenDetails}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : viewCategory === 'section' ? (
            /* By Mess Section Chunks View (25 per table) */
            <div className="space-y-4">
              {groupedBySection.map((sec) => (
                <div
                  key={sec.id}
                  className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden"
                >
                  <div className="p-4 sm:p-5 flex items-center justify-between bg-gray-50/80 dark:bg-white/5 border-b border-gray-200/60 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                        #{sec.id}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                          {sec.title} (Tokens {sec.range})
                        </h3>
                        <p className="text-xs text-gray-500">
                          {sec.students.length} {t('studentsInSection', 'Students in this section')}
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                      {sec.activeCount} / {sec.totalCount} {t('statusActive', 'Active')}
                    </span>
                  </div>

                  <div className="p-4 sm:p-5">
                    {viewDensity === 'cards' ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                        {sec.students.map((doc) => {
                          const isOn = getEffectiveStudentMealStatus(
                            doc,
                            targetDateIST,
                            effectiveDay,
                            isLunch ? 'lunch' : 'breakfast'
                          );
                          const isBlocked = Boolean(doc.block);
                          const hasDateExc = Boolean(
                            getActiveStudentException(doc, targetDateIST, isLunch ? 'lunch' : 'breakfast')
                          );
                          return (
                            <TokenCard
                              key={doc.id || doc.tokenNo}
                              doc={doc}
                              isOn={isOn}
                              onLeave={hasDateExc}
                              isBlocked={isBlocked}
                              isLunch={isLunch}
                              onClick={handleOpenDetails}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2 min-[380px]:gap-2.5 sm:gap-3">
                        {sec.students.map((doc) => {
                          const isOn = getEffectiveStudentMealStatus(
                            doc,
                            targetDateIST,
                            effectiveDay,
                            isLunch ? 'lunch' : 'breakfast'
                          );
                          const hasDateExc = Boolean(
                            getActiveStudentException(doc, targetDateIST, isLunch ? 'lunch' : 'breakfast')
                          );
                          return (
                            <TokenButton
                              key={doc.id || doc.tokenNo}
                              doc={doc}
                              isOn={isOn}
                              onLeave={hasDateExc}
                              onClick={handleOpenDetails}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : viewCategory === 'dietary' ? (
            /* By Dietary Preferences / Avoiders View */
            <div className="space-y-4">
              {groupedByDietary.filter((g) => g.students && g.students.length > 0).length > 0 && (
                <div className="flex items-center justify-between gap-2 mb-2 px-1 text-xs">
                  <span className="text-gray-500 dark:text-gray-400 font-semibold">
                    {t('dietaryGroupsSummary', '{count} dietary groups active').replace(
                      '{count}',
                      groupedByDietary.filter((g) => g.students && g.students.length > 0).length
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        expandAllDietary();
                      }}
                      className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                    >
                      {t('expandAll', 'Expand All')}
                    </button>
                    <span className="text-gray-300 dark:text-gray-600">•</span>
                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        collapseAllDietary();
                      }}
                      className="text-gray-500 dark:text-gray-400 font-medium hover:underline cursor-pointer"
                    >
                      {t('collapseAll', 'Collapse All')}
                    </button>
                  </div>
                </div>
              )}

              {groupedByDietary.map((group) => {
                if (!group.students || group.students.length === 0) return null;
                const isCollapsed = Boolean(collapsedDietary[group.id]);

                return (
                  <div
                    key={group.id}
                    className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        toggleDietaryCollapse(group.id);
                      }}
                      className="w-full p-4 sm:p-5 flex items-center justify-between bg-gray-50/80 dark:bg-white/5 border-b border-gray-200/60 dark:border-white/10 hover:bg-gray-100/80 dark:hover:bg-white/10 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            group.type === 'standard'
                              ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                              : group.type === 'multi'
                              ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400'
                              : 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {getCategoryIcon(group.icon, 'w-5 h-5')}
                        </div>
                        <div>
                          <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white flex items-center gap-2">
                            {lang === 'ml' && group.nameMl ? group.nameMl : group.name}
                            {group.type === 'avoidance' && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                {t('avoiders', 'Avoiders')}
                              </span>
                            )}
                            {group.type === 'multi' && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                                {t('multiAvoidersCategory', 'Multi')}
                              </span>
                            )}
                            {group.type === 'standard' && (
                              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                                {t('standardFullDiet', 'Full Diet')}
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {group.students.length} {t('studentsInDietaryGroup', 'Students in this category')}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                          {group.activeCount} / {group.totalCount} {t('statusActive', 'Active')}
                        </span>
                        {isCollapsed ? (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </button>

                    {!isCollapsed && (
                      <div className="p-4 sm:p-5">
                        {viewDensity === 'cards' ? (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                            {group.students.map((doc) => {
                              const isOn = getEffectiveStudentMealStatus(
                                doc,
                                targetDateIST,
                                effectiveDay,
                                isLunch ? 'lunch' : 'breakfast'
                              );
                              const isBlocked = Boolean(doc.block);
                              const hasDateExc = Boolean(
                                getActiveStudentException(doc, targetDateIST, isLunch ? 'lunch' : 'breakfast')
                              );
                              return (
                                <TokenCard
                                  key={doc.id || doc.tokenNo}
                                  doc={doc}
                                  isOn={isOn}
                                  onLeave={hasDateExc}
                                  isBlocked={isBlocked}
                                  isLunch={isLunch}
                                  onClick={handleOpenDetails}
                                />
                              );
                            })}
                          </div>
                        ) : (
                          <div className="flex flex-wrap gap-2 min-[380px]:gap-2.5 sm:gap-3">
                            {group.students.map((doc) => {
                              const isOn = getEffectiveStudentMealStatus(
                                doc,
                                targetDateIST,
                                effectiveDay,
                                isLunch ? 'lunch' : 'breakfast'
                              );
                              const hasDateExc = Boolean(
                                getActiveStudentException(doc, targetDateIST, isLunch ? 'lunch' : 'breakfast')
                              );
                              return (
                                <TokenButton
                                  key={doc.id || doc.tokenNo}
                                  doc={doc}
                                  isOn={isOn}
                                  onLeave={hasDateExc}
                                  onClick={handleOpenDetails}
                                />
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : viewDensity === 'cards' ? (
            /* Detailed Student Cards View (All Tokens Mode) */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
              {filteredDocuments.map((doc) => {
                const isOn = getEffectiveStudentMealStatus(
                  doc,
                  targetDateIST,
                  effectiveDay,
                  isLunch ? 'lunch' : 'breakfast'
                );
                const isBlocked = Boolean(doc.block);
                const hasDateExc = Boolean(
                  getActiveStudentException(doc, targetDateIST, isLunch ? 'lunch' : 'breakfast')
                );

                return (
                  <TokenCard
                    key={doc.id || doc.tokenNo}
                    doc={doc}
                    isOn={isOn}
                    onLeave={hasDateExc}
                    isBlocked={isBlocked}
                    isLunch={isLunch}
                    onClick={handleOpenDetails}
                  />
                );
              })}
            </div>
          ) : (
            /* Default: Tactile Square Matrix View (Consistent with Master Board) */
            <div className="flex flex-wrap justify-center gap-2 min-[380px]:gap-2.5 sm:gap-3 py-2">
              {filteredDocuments.map((doc) => {
                const isOn = getEffectiveStudentMealStatus(
                  doc,
                  targetDateIST,
                  effectiveDay,
                  isLunch ? 'lunch' : 'breakfast'
                );
                const hasDateExc = Boolean(
                  getActiveStudentException(doc, targetDateIST, isLunch ? 'lunch' : 'breakfast')
                );

                return (
                  <TokenButton
                    key={doc.id || doc.tokenNo}
                    doc={doc}
                    isOn={isOn}
                    onLeave={hasDateExc}
                    onClick={handleOpenDetails}
                  />
                );
              })}
            </div>
          )}
        </div>

      </section>

      {/* ========================================================================= */}
      {/* 5. PUBLIC KITCHEN DOCUMENTS & DOWNLOADS SHELF                             */}
      {/* ========================================================================= */}
      <section className="rounded-3xl p-5 sm:p-7 bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-4">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>{t('publicKitchenDocuments', 'Kitchen Manifests & Print Sheets')}</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('kitchenDocsSubtitle', 'Official supply section sheets and dietary matrices for kitchen prep.')}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          {/* DOCUMENT 1: Kitchen Supply Manifest */}
          <div className="p-5 rounded-2xl bg-gray-50/90 dark:bg-[#121c19] border border-gray-200/70 dark:border-white/5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  {isLunch ? t('navLunch', 'Lunch') : t('navBreakfast', 'Breakfast')}
                </span>
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  {t('kitchenSupplyManifestPdf', 'Kitchen Supply Manifest')}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('kitchenManifestDesc', 'Section-by-section breakdown (25 per table) designed for kitchen mess distribution.')}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <ExportActionMenu
                onView={handleViewSupplyManifest}
                onDownload={handleQuickSupplyExport}
                onPrint={handlePrintSupplyManifest}
                onShare={handleShareSupplyManifest}
                onCustomize={() => {
                  feedback('tick');
                  setAdvancedExportModal({ isOpen: true, type: 'supply' });
                }}
                isGenerating={exportingSupply || loading}
                label={t('quickDownloadManifest', 'Open')}
                colorTheme="emerald"
                defaultAction="view"
              />

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setAdvancedExportModal({ isOpen: true, type: 'supply' });
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 font-semibold text-xs transition-all border border-gray-200 dark:border-white/10 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('customizeAndExport', 'Customize & Filter (Sections, Batches, Sort, CSV)...')}</span>
              </button>
            </div>
          </div>

          {/* DOCUMENT 2: Dietary Exclusions Matrix */}
          <div className="p-5 rounded-2xl bg-gray-50/90 dark:bg-[#121c19] border border-gray-200/70 dark:border-white/5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                  <ChefHat className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  {t('dietaryMatrixBadge', 'Dietary Matrix')}
                </span>
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  {t('dietaryExclusionsMatrixPdf', 'Dietary Exclusions Matrix')}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('dietaryAvoidersMatrixDesc', 'Official kitchen reference mapping tokens with specific meat/fish exclusions (Beef, Fish, Chicken, Mutton).')}
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <ExportActionMenu
                onView={handleViewDietaryAvoiders}
                onDownload={handleQuickDietaryExport}
                onPrint={handlePrintDietaryAvoiders}
                onShare={handleShareDietaryAvoiders}
                onCustomize={() => {
                  feedback('tick');
                  setAdvancedExportModal({ isOpen: true, type: 'dietary' });
                }}
                isGenerating={exportingDietary || loading}
                label={t('quickDownloadMatrix', 'Open')}
                colorTheme="amber"
                defaultAction="view"
              />

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setAdvancedExportModal({ isOpen: true, type: 'dietary' });
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 font-semibold text-xs transition-all border border-gray-200 dark:border-white/10 cursor-pointer"
              >
                <Sliders className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{t('customizeAndFilterDietary', 'Customize & Filter Categories (Sort, CSV)...')}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================================= */}
      {/* 6. QUICK LINKS NAVIGATION DOCK (Portal, Menu, Admin, Guide)              */}
      {/* ========================================================================= */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Link 1: Student Portal */}
        <Link
          to={stdata && stdata.tokenNo ? '/student' : '/login'}
          onClick={() => feedback('tick')}
          className="p-4 rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 hover:bg-white dark:hover:bg-[#15201d] border border-gray-200/80 dark:border-white/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-2 group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
              {t('studentPortal', 'Student Portal')}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {t('studentPortalDesc', 'Preferences & leave')}
            </p>
          </div>
        </Link>

        {/* Link 2: Canteen Food Menu */}
        <Link
          to="/menu"
          onClick={() => feedback('tick')}
          className="p-4 rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 hover:bg-white dark:hover:bg-[#15201d] border border-gray-200/80 dark:border-white/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-2 group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Utensils className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
              {t('canteenMenu', 'Weekly Menu')}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {t('canteenMenuDesc', 'Breakfast & lunch menu')}
            </p>
          </div>
        </Link>

        {/* Link 3: Admin Operations */}
        <Link
          to="/alogin"
          onClick={() => feedback('tick')}
          className="p-4 rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 hover:bg-white dark:hover:bg-[#15201d] border border-gray-200/80 dark:border-white/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-2 group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
              {t('committeeOps', 'Admin')}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {t('committeeOpsDesc', 'Admin & Kitchen display')}
            </p>
          </div>
        </Link>

        {/* Link 4: Guide & Rules */}
        <button
          type="button"
          onClick={() => {
            feedback('tick');
            setIsGuideOpen(true);
          }}
          className="p-4 rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 hover:bg-white dark:hover:bg-[#15201d] border border-gray-200/80 dark:border-white/10 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-2 group text-left select-none cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <HelpCircle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
              {t('guideAndRules', 'Guide & Rules')}
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              {t('guideAndRulesDesc', 'Color rules & instructions')}
            </p>
          </div>
        </button>

      </section>


      {/* ========================================================================= */}
      {/* MODAL: STUDENT DETAILS (Full 7-Day Schedule & Info)                       */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {detailsDoc && (
          <div
            key="dashboard-student-detail-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setDetailsDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col"
            >
              {/* Modal Header */}
              <div
                className={`p-4 sm:p-5 text-white flex items-center justify-between gap-3 ${
                  detailsDoc.block
                    ? 'bg-gradient-to-r from-gray-800 to-gray-900'
                    : getEffectiveStudentMealStatus(detailsDoc, targetDateIST, effectiveDay, isLunch ? 'lunch' : 'breakfast')
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600'
                    : 'bg-gradient-to-r from-rose-600 to-red-600'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-mono font-black text-xl text-white shadow-inner flex-shrink-0">
                    {detailsDoc.tokenNo}
                    {Boolean(detailsDoc.block) && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 border border-white/40 flex items-center justify-center shadow-xs">
                        <Lock className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-white truncate">
                      {detailsDoc.nameEn || detailsDoc.name || `Student #${detailsDoc.tokenNo}`}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-white/80 flex-wrap">
                      {detailsDoc.nameMl && (
                        <span className="font-malayalam">{detailsDoc.nameMl}</span>
                      )}
                      <span>•</span>
                      <span>{detailsDoc.batch || t('generalBatch', 'General Batch')}</span>
                      {(detailsDoc.username || detailsDoc.uname) && (
                        <>
                          <span>•</span>
                          <span className="font-mono">@{detailsDoc.username || detailsDoc.uname}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setDetailsDoc(null);
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[calc(90dvh-110px)] pb-safe">
                {detailsDoc.block ? (
                  /* ================= BLOCKED STUDENT VIEW: ONLY PERSONAL DETAILS & NOTICE ================= */
                  <div className="space-y-4">
                    {/* Admin Blocked Alert */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 flex items-start gap-3.5 shadow-sm">
                      <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-rose-300/60 dark:border-rose-500/30">
                        <Ban className="w-6 h-6" />
                      </div>
                      <div className="text-xs text-rose-950 dark:text-rose-100 min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-base sm:text-lg block text-rose-950 dark:text-white">
                            Token #{detailsDoc.tokenNo} Blocked
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-200/80 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 border border-rose-300/60">
                            Dual-Grid Suspension
                          </span>
                        </div>
                        
                        <p className="leading-relaxed text-rose-800 dark:text-rose-300 text-xs">
                          {t(
                            'studentDualGridBlockedDesc',
                            'Both Breakfast and Lunch dining privileges are temporarily suspended due to food waste or attendance infraction.'
                          )}
                        </p>

                        {detailsDoc.blockReason && (
                          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-rose-200 dark:border-rose-500/20 text-xs">
                            <span className="font-bold text-rose-950 dark:text-rose-200">
                              {t('blockReasonLabel', 'Reason')}:
                            </span>{' '}
                            <span className="italic font-medium text-rose-900 dark:text-rose-200">&ldquo;{detailsDoc.blockReason}&rdquo;</span>
                          </div>
                        )}

                        {/* Prominent Fine Payable Notification Card */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 dark:text-amber-200">
                              <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>Fine Payable Amount</span>
                            </div>
                            <span className="font-mono text-lg font-black text-amber-950 dark:text-amber-100 px-2.5 py-0.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                              ₹{getStudentFineAmount(detailsDoc)}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-white/80 dark:bg-black/40 text-[11px] leading-relaxed text-amber-950 dark:text-amber-200">
                            <strong>Notice to Student:</strong> Please pay the required fine of <strong>₹{getStudentFineAmount(detailsDoc)}</strong> at the <strong>ADSA Canteen Office</strong> to clear this block and restore both your Breakfast and Lunch meal tokens.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pending Unblock Status Alert if student already submitted */}
                    {detailsDoc.pendingUnblockRequest?.status === 'pending' && (
                      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2.5 text-amber-900 dark:text-amber-200 min-w-0">
                          <Clock className="w-4 h-4 text-amber-600 animate-pulse flex-shrink-0" />
                          <div className="min-w-0">
                            <span className="font-bold block truncate">
                              {t('unblockRequestPending', 'Unblock Request Pending')} (#{detailsDoc.pendingUnblockRequest.ticketNumber})
                            </span>
                            <span className="text-[10px] text-amber-700/80 dark:text-amber-400 block truncate">
                              {t('unblockRequestUnderReview', 'Under review by Central Committee')}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            feedback('tick');
                            const code = detailsDoc.pendingUnblockRequest.ticketNumber;
                            setDetailsDoc(null);
                            navigate(`/support?tab=tracker&code=${code}`);
                          }}
                          className="py-1 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[11px] transition-colors flex-shrink-0"
                        >
                          {t('trackUnblockRequest', 'Track Status')}
                        </button>
                      </div>
                    )}

                    {/* Action buttons: Login to Portal and Close */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          const tNo = detailsDoc.tokenNo;
                          setDetailsDoc(null);
                          navigate(`/login?token=${tNo}`);
                        }}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5"
                      >
                        <Unlock className="w-3.5 h-3.5" />
                        <span>
                          {detailsDoc.pendingUnblockRequest?.status === 'pending'
                            ? t('loginToViewPortal', 'Login to Student Portal (View Only)')
                            : t('loginToRequestUnblock', 'Login to Portal to Request Unblock')}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          setDetailsDoc(null);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 font-bold text-xs transition-colors cursor-pointer"
                      >
                        {t('closeNotice', 'Close')}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ================= ACTIVE / UNBLOCKED STUDENT VIEW: FULL SCHEDULES & PREFERENCES ================= */
                  <>
                    {/* Single-Day Exception Alert if applicable */}
                    {(() => {
                      const activeExc = getActiveStudentException(detailsDoc, targetDateIST);
                      if (activeExc) {
                        const bfStatus = activeExc.breakfast !== undefined ? (activeExc.breakfast ? t('takingOn', 'Taking (ON)') : t('skippedOff', 'Skipped (OFF)')) : null;
                        const luStatus = activeExc.lunch !== undefined ? (activeExc.lunch ? t('takingOn', 'Taking (ON)') : t('skippedOff', 'Skipped (OFF)')) : null;
                        return (
                          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 flex items-start gap-2.5">
                            <CalendarDays className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-rose-900 dark:text-rose-200">
                              <span className="font-bold block">
                                {t('singleDayExceptionActive', 'Single-Day Exception Active for')} {formatFriendlyDate(targetDateIST)}
                              </span>
                              <span className="block mt-0.5">
                                {bfStatus && <>{t('navBreakfast', 'Breakfast')}: <strong>{bfStatus}</strong> </>}
                                {luStatus && <>• {t('navLunch', 'Lunch')}: <strong>{luStatus}</strong></>}
                              </span>
                              <span className="text-[11px] opacity-75 block mt-1">
                                {t('regularRoutineResumesTomorrow', 'Regular weekly dining routine automatically resumes tomorrow.')}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Breakfast Schedule Grid */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Coffee className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t('navBreakfast') || 'Breakfast Routine'}</span>
                        </span>
                        <span className="text-[11px] text-gray-400 font-semibold">{t('weeklyOptIn', 'Weekly Routine')}</span>
                      </div>

                      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {daysList.map(({ key, label }) => {
                          const active = detailsDoc.obj?.breakfast?.[key] === true;
                          const isCurrentDay = key === effectiveDay;
                          return (
                            <div key={key} className="flex flex-col items-center gap-1.5 min-w-0">
                              {/* Weekday Short Column Header */}
                              <span
                                className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-center select-none ${
                                  isCurrentDay
                                    ? 'text-emerald-600 dark:text-emerald-400 font-black'
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}
                              >
                                {label}
                              </span>

                              {/* Perfect Square Tactile Tile */}
                              <div
                                title={`${label}: Breakfast is ${active ? 'ON' : 'OFF'}`}
                                aria-label={`${label}: Breakfast ${active ? 'Active' : 'Off'}`}
                                className={`
                                  relative group flex items-center justify-center flex-shrink-0
                                  w-full aspect-square rounded-xl sm:rounded-2xl select-none font-extrabold
                                  shadow-sm transition-all duration-150 cursor-default overflow-hidden
                                  ${
                                    isCurrentDay
                                      ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 ring-offset-2 dark:ring-offset-[#0f1715] z-10'
                                      : ''
                                  }
                                  ${
                                    active
                                      ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25 border border-emerald-400/40'
                                      : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25 border border-rose-400/40'
                                  }
                                `}
                              >
                                <span className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                                {active ? (
                                  <Coffee className="w-4 h-4 text-white drop-shadow-xs" />
                                ) : (
                                  <X className="w-3.5 h-3.5 text-white/80" strokeWidth={2.5} />
                                )}
                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white/70" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Lunch Schedule Grid */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{t('navLunch') || 'Lunch Routine'}</span>
                        </span>
                        <span className="text-[11px] text-gray-400 font-semibold">{t('weeklyOptIn', 'Weekly Routine')}</span>
                      </div>

                      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {daysList.map(({ key, label }) => {
                          const active = detailsDoc.obj?.lunch?.[key] !== undefined ? Boolean(detailsDoc.obj?.lunch[key]) : true;
                          const isCurrentDay = key === effectiveDay;
                          return (
                            <div key={key} className="flex flex-col items-center gap-1.5 min-w-0">
                              {/* Weekday Short Column Header */}
                              <span
                                className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-center select-none ${
                                  isCurrentDay
                                    ? 'text-emerald-600 dark:text-emerald-400 font-black'
                                    : 'text-gray-400 dark:text-gray-500'
                                }`}
                              >
                                {label}
                              </span>

                              {/* Perfect Square Tactile Tile */}
                              <div
                                title={`${label}: Lunch is ${active ? 'ON' : 'OFF'}`}
                                aria-label={`${label}: Lunch ${active ? 'Active' : 'Off'}`}
                                className={`
                                  relative group flex items-center justify-center flex-shrink-0
                                  w-full aspect-square rounded-xl sm:rounded-2xl select-none font-extrabold
                                  shadow-sm transition-all duration-150 cursor-default overflow-hidden
                                  ${
                                    isCurrentDay
                                      ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 ring-offset-2 dark:ring-offset-[#0f1715] z-10'
                                      : ''
                                  }
                                  ${
                                    active
                                      ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25 border border-emerald-400/40'
                                      : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25 border border-rose-400/40'
                                  }
                                `}
                              >
                                <span className="absolute inset-0 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
                                {active ? (
                                  <Utensils className="w-4 h-4 text-white drop-shadow-xs" />
                                ) : (
                                  <X className="w-3.5 h-3.5 text-white/80" strokeWidth={2.5} />
                                )}
                                <span className="absolute bottom-1 w-1 h-1 rounded-full bg-white/70" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dietary Inclusions & Exemptions */}
                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/5">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        {t('dietaryPreferencesLabel', 'Dietary Inclusions & Exemptions')}
                      </span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {preferencesList.map((pref) => {
                          const isIncluded =
                            detailsDoc.obj2 && detailsDoc.obj2[pref.id] !== undefined
                              ? Boolean(detailsDoc.obj2[pref.id])
                              : true;
                          return (
                            <span
                              key={pref.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                                isIncluded
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20'
                                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isIncluded ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span>{lang === 'ml' && pref.labelMl ? pref.labelMl : (pref.labelEn || pref.name)}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action CTA: Log into Portal */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          setDetailsDoc(null);
                          if (!portalStatus.isOpen) {
                            setLockedPortalAlertOpen(true);
                          } else {
                            navigate(`/login?token=${detailsDoc.tokenNo}`);
                          }
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <span>{t('areYouStudent', `Are you Student #${detailsDoc.tokenNo}? Update your Preferences in Portal`).replace('{token}', detailsDoc.tokenNo)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: INSPECT REJECTED TOKENS (From 3D Flip Cards Back)                  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {inspectedMeal && (
          <div
            key="dashboard-inspected-rejected-tokens-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setInspectedMeal(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header with Rose Theme */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-600 via-rose-700 to-red-800 text-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
                    <XCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-base sm:text-lg text-white">
                      {inspectedMeal === 'breakfast' ? t('navBreakfast', 'Breakfast') : t('navLunch', 'Lunch')}{' '}
                      {t('rejectedTokensTitle', 'Rejected Tokens')}
                    </h3>
                    <p className="text-xs text-rose-100/80 font-medium">
                      {dayLabel} ({friendlyTargetDate}) • {inspectedTokensList.length} {t('tokensSkipped', 'Tokens Opted Out')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setInspectedMeal(null)}
                  className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Token Grid */}
              <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                {inspectedTokensList.length === 0 ? (
                  <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                    <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-2 opacity-80" />
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                      {t('noRejectedTokens', 'All tokens turned ON for this meal!')}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">100% participation recorded.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      The following students have opted out, set weekly exclusions, or recorded leaves for this meal:
                    </p>

                    <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
                      {inspectedTokensList.map((tokenNum) => (
                        <div
                          key={tokenNum}
                          className="flex items-center justify-center p-2 rounded-xl font-mono font-extrabold text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 shadow-xs"
                        >
                          #{tokenNum}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-3.5 sm:p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-200/80 dark:border-white/10 flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                  {inspectedTokensList.length} of {documents.length} tokens skipping
                </span>

                <button
                  type="button"
                  onClick={() => setInspectedMeal(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 dark:bg-white/20 hover:bg-gray-700 text-white text-xs font-bold transition-all active:scale-95 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: LOCKED PORTAL SCHEDULE NOTICE                                      */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {lockedPortalAlertOpen && (
          <div
            key="dashboard-locked-portal-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
            onClick={() => setLockedPortalAlertOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0f1715] border border-amber-200 dark:border-amber-500/20 shadow-2xl p-6 text-center space-y-4"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('tokenUpdatesSuspended', 'Token Updates are Paused')}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                  {t('tokenUpdatesSuspendedDesc', 'Token updates have been temporarily paused by the ADSA Canteen Committee. Normal operational updates will resume shortly.')}
                </p>
                <div className="mt-3 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-500/20 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  {t('currentStatusColon', 'Current Status:')} {portalStatus.statusBadge}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setLockedPortalAlertOpen(false);
                    navigate('/menu');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {t('viewCanteenMenu', 'View Canteen Menu')}
                </button>
                <button
                  type="button"
                  onClick={() => setLockedPortalAlertOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs cursor-pointer"
                >
                  {t('close', 'Close')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* MODAL: COMPREHENSIVE GUIDE & COLOR RULES (?)                              */}
      {/* ========================================================================= */}
      <TokenBoardGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* ========================================================================= */}
      {/* MODAL: ADVANCED CUSTOMIZE & EXPORT                                        */}
      {/* ========================================================================= */}
      <AdvancedExportModal
        isOpen={advancedExportModal.isOpen}
        onClose={() => setAdvancedExportModal((prev) => ({ ...prev, isOpen: false }))}
        exportType={advancedExportModal.type}
        targetDateIST={targetDateIST}
        dayKey={effectiveDay}
        dayFull={dayFull}
        documents={documents}
        preferences={preferencesList}
        sectionChunkSize={sectionChunkSize}
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
