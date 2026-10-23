import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileDown,
  FileText,
  Sliders,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpDown,
  Coffee,
  Utensils,
  RotateCcw,
  Sparkles,
  Download,
  FileSpreadsheet,
  Check,
  AlertCircle,
  Eye,
} from 'lucide-react';
import {
  exportSinglePageCombinedManifestPDF,
  exportManifestCSV,
  exportDietaryAvoidersPDF,
  exportDietaryCSV,
  generateSinglePageCombinedManifestDoc,
  generateDietaryAvoidersDoc,
  generateManifestCSVData,
  generateDietaryCSVData,
} from '../../utils/publicDocumentExporter';
import UniversalDocumentModal from './UniversalDocumentModal';
import { getCachedCanteenConfig } from '../../utils/canteenConfigService';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

const BATCH_OPTIONS = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4', 'Batch 5', 'Batch 6', 'Batch 7'];

export default function AdvancedExportModal({
  isOpen,
  onClose,
  exportType = 'supply', // 'supply' | 'dietary'
  targetDateIST,
  dayKey,
  dayFull,
  documents = [],
  preferences = [],
  rejectionsByPref = {},
  sectionChunkSize = null,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  // Dynamic chunk size configured in database by admin
  const activeChunkSize = sectionChunkSize || getCachedCanteenConfig().sectionChunkSize || 25;

  // Strict requested defaults:
  // category: 'sections'
  // sort: 'ascending'
  const [category, setCategory] = useState('sections');
  const [sort, setSort] = useState('ascending');
  const [mealFilter, setMealFilter] = useState('both'); // 'both' | 'breakfast' | 'lunch'
  const [statusFilter, setStatusFilter] = useState('canceled_only'); // 'canceled_only' | 'active_only' | 'all'
  const [format, setFormat] = useState('pdf'); // 'pdf' | 'csv'
  const [selectedBatches, setSelectedBatches] = useState(BATCH_OPTIONS);
  const [selectedDietaryCategories, setSelectedDietaryCategories] = useState([]);
  const [isExporting, setIsExporting] = useState(false);
  const [universalDoc, setUniversalDoc] = useState({ isOpen: false, data: null });

  // Initialize selected dietary preferences
  useEffect(() => {
    if (preferences && preferences.length > 0) {
      setSelectedDietaryCategories(preferences.filter((p) => p.isActive !== false).map((p) => p.id));
    }
  }, [preferences]);

  // Load saved preferences if available (while preserving defaults if none)
  useEffect(() => {
    try {
      const saved = localStorage.getItem('adsa_export_prefs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.category) setCategory(parsed.category);
        if (parsed.sort) setSort(parsed.sort);
        if (parsed.mealFilter) setMealFilter(parsed.mealFilter);
        if (parsed.statusFilter) setStatusFilter(parsed.statusFilter);
        if (parsed.format) setFormat(parsed.format);
      }
    } catch (e) {
      // Ignore storage errors
    }
  }, []);

  const handleResetDefaults = () => {
    feedback('pop');
    setCategory('sections');
    setSort('ascending');
    setMealFilter('both');
    setStatusFilter('canceled_only');
    setFormat('pdf');
    setSelectedBatches(BATCH_OPTIONS);
    if (preferences && preferences.length > 0) {
      setSelectedDietaryCategories(preferences.filter((p) => p.isActive !== false).map((p) => p.id));
    }
    try {
      localStorage.removeItem('adsa_export_prefs');
    } catch (e) {}
  };

  // Compute live preview metrics
  const previewMetrics = useMemo(() => {
    const totalDiners = documents.length;
    let colCount = 8;
    if (category === 'sections') {
      const size = Math.max(Number(activeChunkSize) || 25, 5);
      colCount = Math.ceil(totalDiners / size) || 8;
    } else {
      colCount = selectedBatches.length || 7;
    }

    return {
      totalDiners,
      columnsCount: colCount,
      estimatedPages: format === 'csv' ? '1 (.csv)' : mealFilter === 'both' ? '1 Page (Single-Page Guaranteed)' : '1 Page',
      sortDisplay: sort === 'descending' ? '#200 → #1 (Desc)' : '#1 → #200 (Asc)',
    };
  }, [documents.length, category, activeChunkSize, selectedBatches.length, format, mealFilter, sort]);

  const toggleBatch = (bName) => {
    feedback('tick');
    setSelectedBatches((prev) => {
      if (prev.includes(bName)) {
        return prev.length > 1 ? prev.filter((b) => b !== bName) : prev;
      }
      return [...prev, bName];
    });
  };

  const toggleDietaryCategory = (pId) => {
    feedback('tick');
    setSelectedDietaryCategories((prev) => {
      if (prev.includes(pId)) {
        return prev.length > 1 ? prev.filter((id) => id !== pId) : prev;
      }
      return [...prev, pId];
    });
  };

  const handlePreviewAndActions = () => {
    feedback('tick');
    try {
      let docPayload = null;
      if (exportType === 'supply') {
        if (format === 'csv') {
          const res = generateManifestCSVData({
            targetDateIST,
            dayKey,
            dayFull,
            documents,
            sortOrder: sort,
            chunkSize: activeChunkSize,
            category,
          });
          docPayload = { type: 'csv', ...res };
        } else {
          const res = generateSinglePageCombinedManifestDoc({
            targetDateIST,
            dayKey,
            dayFull,
            documents,
            category,
            sort,
            chunkSize: activeChunkSize,
            mealFilter,
            statusFilter,
            selectedBatches: category === 'batches' ? selectedBatches : null,
          });
          docPayload = { type: 'pdf', ...res };
        }
      } else {
        if (format === 'csv') {
          const res = generateDietaryCSVData({
            preferences,
            documents,
            rejectionsByPref,
            sortOrder: sort,
            selectedCategories: selectedDietaryCategories,
          });
          docPayload = { type: 'csv', ...res };
        } else {
          const res = generateDietaryAvoidersDoc({
            preferences,
            documents,
            rejectionsByPref,
            sort,
            selectedCategories: selectedDietaryCategories,
          });
          docPayload = { type: 'pdf', ...res };
        }
      }
      setUniversalDoc({ isOpen: true, data: docPayload });
    } catch (e) {
      console.error('Error generating document preview:', e);
    }
  };

  const handleExecuteExport = async () => {
    feedback('pop');
    setIsExporting(true);

    // Save preferences
    try {
      localStorage.setItem(
        'adsa_export_prefs',
        JSON.stringify({
          category,
          sort,
          mealFilter,
          statusFilter,
          format,
        })
      );
    } catch (e) {}

    try {
      if (exportType === 'supply') {
        if (format === 'csv') {
          exportManifestCSV({
            targetDateIST,
            dayKey,
            dayFull,
            documents,
            sortOrder: sort,
            chunkSize: activeChunkSize,
            category,
          });
        } else {
          exportSinglePageCombinedManifestPDF({
            targetDateIST,
            dayKey,
            dayFull,
            documents,
            category,
            sort,
            chunkSize: activeChunkSize,
            mealFilter,
            statusFilter,
            selectedBatches: category === 'batches' ? selectedBatches : null,
          });
        }
      } else {
        // Dietary avoiders export
        if (format === 'csv') {
          exportDietaryCSV({
            preferences,
            documents,
            rejectionsByPref,
            sortOrder: sort,
            selectedCategories: selectedDietaryCategories,
          });
        } else {
          exportDietaryAvoidersPDF({
            preferences,
            documents,
            rejectionsByPref,
            sort,
            selectedCategories: selectedDietaryCategories,
          });
        }
      }
      feedback('success');
      setTimeout(() => {
        setIsExporting(false);
        onClose();
      }, 500);
    } catch (err) {
      console.error('Advanced export error:', err);
      feedback('warning');
      setIsExporting(false);
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          data-lenis-prevent
          className="relative w-full max-w-2xl bg-white dark:bg-[#0e1715] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
        >
          {/* Header Banner */}
          <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center shadow-inner">
                <Sliders className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight">
                  {exportType === 'supply' ? 'Advanced Kitchen Manifest Exporter' : 'Advanced Dietary Matrix Exporter'}
                </h3>
                <p className="text-[11px] text-emerald-100 flex items-center gap-2 mt-0.5">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Target Date: {targetDateIST} ({(dayFull || dayKey || '').toUpperCase()})</span>
                  <span>•</span>
                  <span>{documents.length} Diners</span>
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                feedback('tick');
                onClose();
              }}
              className="p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/15 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form Content (Scrollable) */}
          <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-gray-800 dark:text-gray-100 text-xs sm:text-sm">
            
            {/* OPTION 1: CATEGORY / COLUMN GROUPING (For Kitchen Manifest) */}
            {exportType === 'supply' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold flex items-center gap-1.5 text-gray-700 dark:text-gray-200">
                    <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Category / Column Partitioning:</span>
                  </label>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                    Default: Sections
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setCategory('sections');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      category === 'sections'
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/20'
                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">★ Sections (Token Ranges)</span>
                      {category === 'sections' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Admin-configured: {activeChunkSize} tokens/section ({previewMetrics.columnsCount} columns).
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setCategory('batches');
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      category === 'batches'
                        ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/20'
                        : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold">Academic Batches</span>
                      {category === 'batches' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                    </div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                      Batches 1 to 7 cohorts (7 columns).
                    </p>
                  </button>
                </div>
              </div>
            )}

            {/* OPTION 2: SORT ORDER */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold flex items-center gap-1.5 text-gray-700 dark:text-gray-200">
                  <ArrowUpDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Sort Order (Token Numbers):</span>
                </label>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Default: Ascending
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setSort('ascending');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    sort === 'ascending'
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/20'
                      : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">★ Ascending (1 → 200)</span>
                    {sort === 'ascending' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Lowest token number first. Standard dining hall flow.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setSort('descending');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    sort === 'descending'
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/20'
                      : 'border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">Descending (200 → 1)</span>
                    {sort === 'descending' && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                    Highest token number first. Reverse dispatch order.
                  </p>
                </button>
              </div>
            </div>

            {/* OPTION 3: MEAL & STATUS FILTERS (Supply manifest only) */}
            {exportType === 'supply' && (
              <div className="space-y-4 pt-1 border-t border-gray-100 dark:border-white/5">
                {/* Meal Filter */}
                <div className="space-y-2">
                  <label className="font-bold text-gray-700 dark:text-gray-200 block">
                    Meal Scope:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        setMealFilter('both');
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        mealFilter === 'both'
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold'
                          : 'border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <span className="text-xs font-bold block">★ Both Meals</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Strictly 1 Page</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        setMealFilter('breakfast');
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        mealFilter === 'breakfast'
                          ? 'border-amber-500 bg-amber-50/80 dark:bg-amber-950/40 text-amber-900 dark:text-amber-100 font-bold'
                          : 'border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <span className="text-xs font-bold block">Breakfast Only</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Morning Shift</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        setMealFilter('lunch');
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        mealFilter === 'lunch'
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold'
                          : 'border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <span className="text-xs font-bold block">Lunch Only</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Noon Shift</span>
                    </button>
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="font-bold text-gray-700 dark:text-gray-200 block">
                    Column Token Listing Mode:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        setStatusFilter('canceled_only');
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        statusFilter === 'canceled_only'
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold'
                          : 'border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <span className="text-xs font-bold block">★ Canceled Tokens</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Kitchen Standard</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        setStatusFilter('active_only');
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        statusFilter === 'active_only'
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold'
                          : 'border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <span className="text-xs font-bold block">Active Diners</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Serving Tokens</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        setStatusFilter('all');
                      }}
                      className={`p-2.5 rounded-2xl border text-center transition-all ${
                        statusFilter === 'all'
                          ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold'
                          : 'border-gray-200 dark:border-white/10'
                      }`}
                    >
                      <span className="text-xs font-bold block">Full Roster</span>
                      <span className="text-[10px] text-gray-500 dark:text-gray-400">Audit Status (✓ / ✗)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* OPTION 4: DIETARY PREFERENCE FILTERS (Dietary export only) */}
            {exportType === 'dietary' && (
              <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-white/5">
                <label className="font-bold text-gray-700 dark:text-gray-200 block">
                  Dietary Categories Included:
                </label>
                <div className="flex flex-wrap gap-2">
                  {preferences
                    .filter((p) => p.isActive !== false)
                    .map((p) => {
                      const isSelected = selectedDietaryCategories.includes(p.id);
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => toggleDietaryCategory(p.id)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                            isSelected
                              ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200'
                              : 'border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 opacity-60'
                          }`}
                        >
                          {isSelected && <Check className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />}
                          <span>{p.labelEn}</span>
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* OPTION 5: OUTPUT FORMAT */}
            <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-white/5">
              <label className="font-bold text-gray-700 dark:text-gray-200 block">
                Export File Format:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setFormat('pdf');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    format === 'pdf'
                      ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-100 font-bold ring-2 ring-emerald-500/20'
                      : 'border-gray-200 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="font-bold">PDF Document (.pdf)</span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    Print-ready A4 master sheet. Clipboard and kitchen display optimized.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setFormat('csv');
                  }}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    format === 'csv'
                      ? 'border-teal-500 bg-teal-50/80 dark:bg-teal-950/40 text-teal-900 dark:text-teal-100 font-bold ring-2 ring-teal-500/20'
                      : 'border-gray-200 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="font-bold">CSV Spreadsheet (.csv)</span>
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
                    Raw tabular data with UTF-8 BOM. Instant opening in Excel &amp; Google Sheets.
                  </p>
                </button>
              </div>
            </div>

            {/* LIVE PREVIEW TELEMETRY BADGE */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-semibold">
                <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>Live Pre-Export Preview:</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-black/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                  {previewMetrics.columnsCount} Columns
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-black/40 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10">
                  Sort: {previewMetrics.sortDisplay}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-white dark:bg-black/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-bold">
                  {previewMetrics.estimatedPages}
                </span>
              </div>
            </div>

          </div>

          {/* Action Footer */}
          <div className="p-4 sm:p-5 bg-gray-50 dark:bg-white/5 border-t border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-white/10 transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handlePreviewAndActions}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/40 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-300 font-bold text-xs transition-all active:scale-95 cursor-pointer border border-teal-200/60 dark:border-teal-500/20"
              >
                <Eye className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{t('previewAndActions', 'Preview & Actions')}</span>
              </button>

              <button
                type="button"
                onClick={handleExecuteExport}
                disabled={isExporting}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>{isExporting ? 'Generating...' : `Export ${format.toUpperCase()}`}</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Universal In-App Document Viewer & Action Modal */}
      <UniversalDocumentModal
        isOpen={universalDoc.isOpen}
        onClose={() => setUniversalDoc({ isOpen: false, data: null })}
        documentData={universalDoc.data}
      />
    </AnimatePresence>,
    document.body
  );
}
