import React, { useEffect, useState, useMemo, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  ArrowLeft,
  Layers,
  Printer,
  FileDown,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  History,
  RotateCcw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import firebase from '../firebase/config';
import { AuthContext } from '../store/AuthContext';
import { useWorldTime } from '../utils/time';
import { useFeedback } from '../utils/useFeedback';
import { useLanguage } from '../store/LanguageContext';
import {
  exportSinglePageCombinedManifestPDF,
  generateSinglePageCombinedManifestDoc,
} from '../utils/publicDocumentExporter';
import { directPrintPdf, shareDocument, createPdfBlob } from '../utils/documentHubService';
import { subscribeToCanteenConfig } from '../utils/canteenConfigService';
import {
  subscribeToManifestPrint,
  computeManifestFingerprint,
  evaluateManifestFreshness,
  recordManifestPrint,
  MANIFEST_STATUS,
} from '../utils/manifestPrintService';
import { formatAuditTime } from '../utils/auditLogger';
import AdvancedExportModal from './export/AdvancedExportModal';
import UniversalDocumentModal from './export/UniversalDocumentModal';
import ExportActionMenu from './export/ExportActionMenu';
import DuplicatePrintGuardModal from './ui/DuplicatePrintGuardModal';
import CanteenOpsActivityDrawer from './admin/CanteenOpsActivityDrawer';
import {
  addDaysToDate,
  getEffectiveStudentMealStatus,
  isPastBoardWindowOpenTime,
} from '../utils/studentExceptionService';
import { useTokenLockStatus } from '../utils/useTokenLockStatus';

export default function SupplySections({ defaultMeal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, userRole } = useContext(AuthContext);
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  // Determine initial meal from prop or pathname
  const initialMeal = useMemo(() => {
    if (defaultMeal) return defaultMeal;
    if (location.pathname.includes('lunch')) return 'lunch';
    return 'breakfast';
  }, [defaultMeal, location.pathname]);

  const [activeMeal, setActiveMeal] = useState(initialMeal);
  const [documents, setDocuments] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(true);

  // Section Display Options: 'batch' (Academic Batches 1-7) | 'size' (Numeric chunks)
  const [sectionMode, setSectionMode] = useState('batch');
  const [customChunkSize, setCustomChunkSize] = useState(25);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [universalDoc, setUniversalDoc] = useState({ isOpen: false, data: null });

  // Print Tracking & Duplicate Guard State
  const [printRecord, setPrintRecord] = useState(null);
  const [isDuplicateGuardOpen, setIsDuplicateGuardOpen] = useState(false);
  const [isCanteenLogOpen, setIsCanteenLogOpen] = useState(false);

  const { timeHms, dayShort, longDate, todayIST } = useWorldTime('Asia/Kolkata');
  const { activeWindow } = useTokenLockStatus();
  const openTime = activeWindow?.startTime || '14:00';

  // Day selection mode: defaults to Today before open time (eg. 2 PM), Tomorrow after open time
  const [dayMode, setDayMode] = useState('auto'); // 'auto' | 'today' | 'tomorrow'
  const isPostCutoff = isPastBoardWindowOpenTime(timeHms, openTime);
  const isShowingTomorrow = dayMode === 'tomorrow' || (dayMode === 'auto' && isPostCutoff);
  const [day, setDay] = useState('');

  const targetDateIST = useMemo(() => {
    return isShowingTomorrow ? addDaysToDate(todayIST, 1) : todayIST;
  }, [isShowingTomorrow, todayIST]);

  useEffect(() => {
    if (!dayShort) return;
    const days = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    const currentIndex = days.indexOf(dayShort.toLowerCase());
    if (isShowingTomorrow) {
      setDay(days[(currentIndex + 1) % 7]);
    } else {
      setDay(days[currentIndex >= 0 ? currentIndex : 0]);
    }
  }, [dayShort, isShowingTomorrow]);

  // Real-time listener for physical print status of this meal and target date
  useEffect(() => {
    if (!activeMeal || !targetDateIST) return;
    const unsubPrint = subscribeToManifestPrint(activeMeal, targetDateIST, (rec) => {
      setPrintRecord(rec);
    });
    return () => unsubPrint();
  }, [activeMeal, targetDateIST]);

  // Compute live canonical fingerprint of active tokens & dietary avoiders
  const currentComputed = useMemo(() => {
    return computeManifestFingerprint({
      documents,
      targetDateIST,
      effectiveDay: day,
      meal: activeMeal,
    });
  }, [documents, targetDateIST, day, activeMeal]);

  // Real-time freshness status against the physical kitchen print
  const freshness = useMemo(() => {
    return evaluateManifestFreshness(currentComputed, printRecord);
  }, [currentComputed, printRecord]);

  // Reactive real-time student subscription
  useEffect(() => {
    setLoading(true);
    const unsub = firebase
      .firestore()
      .collection('students')
      .onSnapshot(
        (querySnapshot) => {
          const docs = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          docs.sort((a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0));
          setDocuments(docs);
          setLoading(false);
        },
        (err) => {
          console.error('Error in SupplySections real-time listener:', err);
          setLoading(false);
        }
      );

    const unsubCanteen = subscribeToCanteenConfig((cfg) => {
      if (cfg?.sectionChunkSize) {
        setCustomChunkSize(cfg.sectionChunkSize);
      }
    });

    return () => {
      unsub();
      unsubCanteen();
    };
  }, []);

  // Compute dynamic sections based on selected mode
  const dynamicSections = useMemo(() => {
    if (documents.length === 0 || !day) return [];

    if (sectionMode === 'batch') {
      const batches = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4', 'Batch 5', 'Batch 6', 'Batch 7'];
      return batches.map((bName, idx) => {
        const slice = documents.filter((d) => d.batch === bName);
        const canceledTokens = slice
          .filter((doc) => !getEffectiveStudentMealStatus(doc, targetDateIST, day, activeMeal))
          .map((doc) => doc.tokenNo);

        const rangeStr =
          slice.length > 0 ? `${slice[0].tokenNo} - ${slice[slice.length - 1].tokenNo}` : 'None';

        return {
          id: idx + 1,
          name: bName,
          range: rangeStr,
          canceledTokens,
          total: slice.length,
          activeCount: slice.length - canceledTokens.length,
        };
      });
    }

    const size = Number(customChunkSize) || 25;
    const totalSections = Math.ceil(documents.length / size);
    const result = [];

    for (let i = 0; i < totalSections; i++) {
      const start = i * size;
      const end = Math.min((i + 1) * size, documents.length);
      const slice = documents.slice(start, end);

      const canceledTokens = slice
        .filter((doc) => !getEffectiveStudentMealStatus(doc, targetDateIST, day, activeMeal))
        .map((doc) => doc.tokenNo);

      const rangeStr =
        slice.length > 0
          ? `${slice[0].tokenNo} - ${slice[slice.length - 1].tokenNo}`
          : `${start + 1} - ${end}`;

      result.push({
        id: i + 1,
        name: `Section ${i + 1}`,
        range: rangeStr,
        canceledTokens,
        total: slice.length,
        activeCount: slice.length - canceledTokens.length,
      });
    }

    return result;
  }, [documents, day, sectionMode, customChunkSize, activeMeal, targetDateIST]);

  const toggleSection = (id) => {
    feedback('pop');
    setActiveSection((prev) => (prev === id ? null : id));
  };

  const handleMealSwitch = (newMeal) => {
    feedback('pop');
    setActiveMeal(newMeal);
    navigate(newMeal === 'breakfast' ? '/breakfast' : '/lunch', { replace: true });
  };

  const handleViewSupplyPdf = () => {
    feedback('tick');
    const targetRev = freshness.revision || 1;
    const res = generateSinglePageCombinedManifestDoc({
      targetDateIST,
      dayKey: day,
      dayFull: isShowingTomorrow ? 'Tomorrow' : dayShort,
      documents,
      category: sectionMode === 'size' ? 'sections' : 'batches',
      sort: 'ascending',
      chunkSize: Number(customChunkSize) || 25,
      mealFilter: activeMeal,
      statusFilter: 'canceled_only',
      revision: targetRev,
      printedByName: user?.displayName || user?.email || 'Admin',
      printedAt: freshness.printedAt ? formatAuditTime(freshness.printedAt) : null,
      deltaNotes: freshness.status === MANIFEST_STATUS.STALE_OUTDATED ? freshness.delta?.summaryText : null,
    });
    setUniversalDoc({ isOpen: true, data: { type: 'pdf', ...res } });
  };

  const handlePrintSupplyPdf = async (isDuplicateReprint = false) => {
    feedback('tick');

    // Scenario 1 Cost Guard: Intercept identical prints to save money and paper
    if (freshness.status === MANIFEST_STATUS.FRESH_IDENTICAL && !isDuplicateReprint) {
      setIsDuplicateGuardOpen(true);
      return;
    }

    try {
      const targetRevision = isDuplicateReprint
        ? (freshness.revision || 1)
        : freshness.status === MANIFEST_STATUS.STALE_OUTDATED
        ? freshness.nextRevision
        : (freshness.revision || 1);

      const deltaNotes =
        freshness.status === MANIFEST_STATUS.STALE_OUTDATED
          ? freshness.delta?.summaryText
          : null;

      const { doc } = generateSinglePageCombinedManifestDoc({
        targetDateIST,
        dayKey: day,
        dayFull: isShowingTomorrow ? 'Tomorrow' : dayShort,
        documents,
        category: sectionMode === 'size' ? 'sections' : 'batches',
        sort: 'ascending',
        chunkSize: Number(customChunkSize) || 25,
        mealFilter: activeMeal,
        statusFilter: 'canceled_only',
        revision: targetRevision,
        printedByName: user?.displayName || user?.email || 'Admin',
        printedAt: new Date().toLocaleTimeString('en-IN'),
        deltaNotes,
        isReprint: isDuplicateReprint,
      });

      const { blobUrl } = createPdfBlob(doc);
      await directPrintPdf(blobUrl);

      // Record in centralized Firestore print registry
      await recordManifestPrint({
        meal: activeMeal,
        targetDateIST,
        documents,
        effectiveDay: day,
        user,
        role: userRole,
        printType: 'supply_manifest',
        isDuplicateReprint,
      });
    } catch (err) {
      console.error('Print supply sections error:', err);
    }
  };

  const handleShareSupplyPdf = async () => {
    feedback('pop');
    try {
      const { doc, filename, title } = generateSinglePageCombinedManifestDoc({
        targetDateIST,
        dayKey: day,
        dayFull: isShowingTomorrow ? 'Tomorrow' : dayShort,
        documents,
        category: sectionMode === 'size' ? 'sections' : 'batches',
        sort: 'ascending',
        chunkSize: Number(customChunkSize) || 25,
        mealFilter: activeMeal,
        statusFilter: 'canceled_only',
      });
      const { blob } = createPdfBlob(doc);
      await shareDocument({
        blob,
        filename,
        title,
        text: `${title} (${activeMeal.toUpperCase()}) • Service Date: ${targetDateIST}`,
      });
    } catch (err) {
      console.error('Share supply sections error:', err);
    }
  };

  const exportSupplyPdf = () => {
    feedback('tick');
    try {
      exportSinglePageCombinedManifestPDF({
        targetDateIST,
        dayKey: day,
        dayFull: isShowingTomorrow ? 'Tomorrow' : dayShort,
        documents,
        category: sectionMode === 'size' ? 'sections' : 'batches',
        sort: 'ascending',
        chunkSize: Number(customChunkSize) || 25,
      });
      feedback('success');
    } catch (err) {
      console.error('Error generating combined kitchen PDF:', err);
      feedback('warning');
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="flex space-x-2">
          {[0, 1, 2].map((idx) => (
            <motion.div
              key={idx}
              className="w-3.5 h-3.5 rounded-full bg-emerald-500"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: idx * 0.15 }}
            />
          ))}
        </div>
        <p className="mt-3 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
          Loading supply sections...
        </p>
      </div>
    );
  }

  const isLunchMeal = activeMeal === 'lunch';
  const totalActive = dynamicSections.reduce((acc, s) => acc + s.activeCount, 0);
  const totalSkipped = dynamicSections.reduce((acc, s) => acc + s.canceledTokens.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Top Banner & Mode Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isLunchMeal ? (
              <Utensils className="w-5 h-5 text-emerald-500" />
            ) : (
              <Coffee className="w-5 h-5 text-amber-500" />
            )}
            <h1 className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {isLunchMeal ? 'Lunch Supply Distribution' : 'Breakfast Supply Distribution'}
            </h1>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
            Canceled and active token breakdown for kitchen tables and dining hall sections
            {isShowingTomorrow ? " (Showing Tomorrow's Manifest)" : " (Showing Today's Manifest)"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start sm:justify-end">
          {/* Day Toggle Switch */}
          <div className="flex p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-bold">
            <button
              onClick={() => {
                feedback('tick');
                setDayMode('today');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                !isShowingTomorrow
                  ? 'bg-white dark:bg-white/15 text-emerald-600 dark:text-emerald-400 shadow-sm font-black'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => {
                feedback('tick');
                setDayMode('tomorrow');
              }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                isShowingTomorrow
                  ? 'bg-white dark:bg-white/15 text-emerald-600 dark:text-emerald-400 shadow-sm font-black'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              Tomorrow
            </button>
          </div>

          {/* Meal Toggle Switch */}
          <div className="flex p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
            <button
              onClick={() => handleMealSwitch('breakfast')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                !isLunchMeal
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Breakfast</span>
            </button>

            <button
              onClick={() => handleMealSwitch('lunch')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isLunchMeal
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Lunch</span>
            </button>
          </div>

          {/* Grouping Mode Pill */}
          <div className="flex p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
            <button
              onClick={() => {
                feedback('tick');
                setSectionMode('batch');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sectionMode === 'batch'
                  ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              By Batch (1-7)
            </button>

            <button
              onClick={() => {
                feedback('tick');
                setSectionMode('size');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sectionMode === 'size'
                  ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Chunks of {customChunkSize}
            </button>
          </div>

          <div className="flex items-center gap-1.5 min-w-[200px]">
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setIsCanteenLogOpen(true);
              }}
              className="p-2 sm:px-3 sm:py-2 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-white/10 text-xs font-bold transition-all flex items-center gap-1.5 shrink-0"
              title="View Canteen & Supply Ops Log"
            >
              <History className="w-4 h-4 text-emerald-500" />
              <span className="hidden sm:inline">Ops Log</span>
            </button>

            <ExportActionMenu
              onView={handleViewSupplyPdf}
              onDownload={exportSupplyPdf}
              onPrint={() => handlePrintSupplyPdf(false)}
              onShare={handleShareSupplyPdf}
              onCustomize={() => {
                feedback('tick');
                setIsExportModalOpen(true);
              }}
              label="Export Manifest"
              colorTheme={isLunchMeal ? 'emerald' : 'amber'}
              defaultAction="view"
            />
          </div>
        </div>
      </div>

      {/* Manifest Freshness & Synchronization Banner */}
      {freshness.status === MANIFEST_STATUS.FRESH_IDENTICAL && (
        <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs sm:text-sm text-emerald-950 dark:text-emerald-100">
                  Kitchen Manifest Up to Date (Rev {freshness.revision})
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  0 Changes • Synced
                </span>
              </div>
              <p className="text-[11px] text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                Printed {formatAuditTime(freshness.printedAt)} by <strong>{freshness.printedBy?.displayName || freshness.printedBy?.email || 'Admin'}</strong>. Physical sheet in kitchen is accurate.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => {
                feedback('tick');
                setIsCanteenLogOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-emerald-400/50 dark:border-emerald-600/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-500/10 transition-all flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              <span>Ops Log</span>
            </button>
          </div>
        </div>
      )}

      {freshness.status === MANIFEST_STATUS.STALE_OUTDATED && (
        <div className="relative overflow-hidden p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500/15 via-rose-500/15 to-amber-500/15 border-2 border-amber-500/60 shadow-lg shadow-amber-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 backdrop-blur-xl">
          <div className="flex items-start sm:items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/30 mt-0.5 sm:mt-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-xs sm:text-sm text-gray-900 dark:text-white flex items-center gap-1.5">
                  <span>Kitchen Sheet Outdated!</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500 text-white shadow-xs">
                    {freshness.delta?.totalChangesCount} Change(s) After Rev {freshness.revision} Print
                  </span>
                </span>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300">
                <strong className="text-amber-800 dark:text-amber-300">{freshness.delta?.summaryText}</strong>
                <span className="text-gray-500 dark:text-gray-400"> — Kitchen staff holds obsolete sheet printed at {formatAuditTime(freshness.printedAt)}.</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
            <button
              onClick={() => {
                feedback('tick');
                setIsCanteenLogOpen(true);
              }}
              className="px-3 py-2 rounded-xl border border-gray-300 dark:border-white/10 text-gray-700 dark:text-gray-200 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              <span>View Changes</span>
            </button>
            <button
              onClick={() => handlePrintSupplyPdf(false)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/25 flex items-center gap-1.5 transition-all transform active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Rev {freshness.nextRevision} (Resync)</span>
            </button>
          </div>
        </div>
      )}

      {freshness.status === MANIFEST_STATUS.NEVER_PRINTED && (
        <div className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 backdrop-blur-xl">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300 flex items-center justify-center shrink-0">
              <Printer className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white">
                  Not Yet Printed for {isShowingTomorrow ? "Tomorrow's" : "Today's"} {isLunchMeal ? 'Lunch' : 'Breakfast'}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                  Initial Rev 1
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                No physical manifest has been recorded in the kitchen for this service date.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <button
              onClick={() => {
                feedback('tick');
                setIsCanteenLogOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 text-xs font-bold hover:bg-gray-100 dark:hover:bg-white/5 transition-all flex items-center gap-1.5"
            >
              <History className="w-3.5 h-3.5" />
              <span>Ops Log</span>
            </button>
          </div>
        </div>
      )}

      {/* Overview Stat Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Total Students
          </span>
          <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">
            {documents.length}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Meals to Prepare
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {totalActive}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">
            Skipped / Off
          </span>
          <span className="text-2xl font-black text-rose-500 mt-1 block">{totalSkipped}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Active Sections
          </span>
          <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">
            {dynamicSections.length}
          </span>
        </div>
      </div>

      {/* Dynamic Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dynamicSections.map((sec) => {
          const isOpen = activeSection === sec.id;
          return (
            <motion.div
              key={sec.id}
              layout
              className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isLunchMeal
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      #{sec.id}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                        {sec.name}
                      </h3>
                      <p className="text-[11px] font-mono text-gray-400">Tokens {sec.range}</p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isLunchMeal
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                    }`}
                  >
                    {sec.activeCount} Served
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">
                      Canceled / Skipped Tokens:
                    </span>
                    <span className="font-bold text-rose-500">{sec.canceledTokens.length}</span>
                  </div>

                  {sec.canceledTokens.length === 0 ? (
                    <div className="py-2 text-center text-xs text-gray-400 italic">
                      All tokens attending in this section.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {sec.canceledTokens.map((tok) => (
                        <span
                          key={tok}
                          className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold border border-rose-200/50 dark:border-rose-500/20"
                        >
                          #{tok}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Advanced Export Customizer Modal */}
      <AdvancedExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        exportType="supply"
        targetDateIST={targetDateIST}
        dayKey={day}
        dayFull={isShowingTomorrow ? 'Tomorrow' : dayShort}
        documents={documents}
        sectionChunkSize={customChunkSize}
      />
      {/* Duplicate Print Cost Guard Modal */}
      <DuplicatePrintGuardModal
        isOpen={isDuplicateGuardOpen}
        onClose={() => setIsDuplicateGuardOpen(false)}
        onConfirmReprint={() => handlePrintSupplyPdf(true)}
        printRecord={printRecord}
        meal={activeMeal}
        targetDateIST={targetDateIST}
      />

      {/* Canteen & Supply Ops Activity Log Drawer */}
      <CanteenOpsActivityDrawer
        isOpen={isCanteenLogOpen}
        onClose={() => setIsCanteenLogOpen(false)}
        activeMeal={activeMeal}
        targetDateIST={targetDateIST}
      />
    </div>
  );
}
