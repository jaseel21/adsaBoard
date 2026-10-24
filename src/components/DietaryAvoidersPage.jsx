import React, { useEffect, useState, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileDown,
  Sparkles,
  ArrowLeft,
  UtensilsCrossed,
  Layers,
  FileSpreadsheet,
  Printer,
  Share2,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import firebase from '../firebase/config';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { directPrintPdf, shareDocument, createPdfBlob } from '../utils/documentHubService';
import { generateDietaryCSVData, exportDietaryCSV } from '../utils/publicDocumentExporter';
import { subscribeToCanteenConfig, getCachedCanteenConfig } from '../utils/canteenConfigService';
import UniversalDocumentModal from './export/UniversalDocumentModal';
import ExportActionMenu from './export/ExportActionMenu';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { AuthContext } from '../store/AuthContext';
import { subscribeToPreferences } from '../utils/preferenceService';
import { getTodayISTDate, getDayOfWeekShort, getEffectiveStudentMealStatus } from '../utils/studentExceptionService';
import useSEO from '../hooks/useSEO';

// Modular Avoiders Components
import AvoidersControls from './avoiders/AvoidersControls';
import AvoidersKpiBar from './avoiders/AvoidersKpiBar';
import AvoidersMatrixView from './avoiders/AvoidersMatrixView';
import AvoidersTableView from './avoiders/AvoidersTableView';
import AvoidersCardsView from './avoiders/AvoidersCardsView';
import AvoidersGroupedView from './avoiders/AvoidersGroupedView';
import AvoiderDetailModal from './avoiders/AvoiderDetailModal';

const DietaryAvoidersPage = () => {
  const navigate = useNavigate();
  const { user, isAdmin } = useContext(AuthContext);
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();

  // SEO Metadata
  useSEO({
    title: 'Dietary Avoiders Matrix & Kitchen Exclusion Roster',
    description:
      'Official real-time dietary rejections matrix, meat/fish exclusions, and special diet rosters for kitchen distribution at Alathurpadi Dars canteen.',
    keywords:
      'dietary avoiders, mess matrix, canteen dietary exclusions, dars food allergies, alathurpadi dars rejections list',
  });

  // Primary Data State
  const [documents, setDocuments] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionChunkSize, setSectionChunkSize] = useState(
    () => getCachedCanteenConfig()?.sectionChunkSize || 25
  );

  // Search, Filters, Sorters & Categorization State
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState('all_avoiders'); // 'all_avoiders' | 'all_students' | 'multi_avoiders' | 'strict_avoiders' | 'standard_full' | [prefId]
  const [batchFilter, setBatchFilter] = useState('all');
  const [sortField, setSortField] = useState('tokenNo'); // 'tokenNo' | 'nameEn' | 'nameMl' | 'batch' | 'avoidCount'
  const [sortOrder, setSortOrder] = useState('asc'); // 'asc' | 'desc'
  const [viewMode, setViewMode] = useState('matrix'); // 'matrix' | 'table' | 'cards' | 'grouped'
  const [categorization, setCategorization] = useState('meal'); // 'meal' (default) | 'section' | 'batch'
  const [attendanceScope, setAttendanceScope] = useState('all'); // 'all' | 'active_only'

  // Modals & Popover State
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [universalDoc, setUniversalDoc] = useState({ isOpen: false, data: null });

  // Today's Date info for attendance scoping
  const todayIST = useMemo(() => getTodayISTDate(), []);
  const todayDayKey = useMemo(() => getDayOfWeekShort(todayIST), [todayIST]);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    setLoading(true);

    const unsubPrefs = subscribeToPreferences((list) => {
      setPreferences((list || []).filter((p) => p.isActive));
    });

    const unsubStudents = firebase
      .firestore()
      .collection('students')
      .onSnapshot(
        (querySnapshot) => {
          const tokenDocs = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          tokenDocs.sort((a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0));
          setDocuments(tokenDocs);
          setLoading(false);
        },
        (error) => {
          console.error('Error in DietaryAvoidersPage.jsx real-time tokens listener:', error);
          setLoading(false);
        }
      );

    const unsubCanteen = subscribeToCanteenConfig((cfg) => {
      if (cfg?.sectionChunkSize) {
        setSectionChunkSize(cfg.sectionChunkSize);
      }
    });

    return () => {
      unsubPrefs();
      unsubStudents();
      unsubCanteen();
    };
  }, []);

  // Keyboard shortcut: Pressing "/" focuses search input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (
        e.key === '/' &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)
      ) {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="text"]');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Extract all unique dynamic batches from the dataset
  const allBatches = useMemo(() => {
    const map = {};
    documents.forEach((d) => {
      const b = (d.batch && d.batch.trim()) || 'General';
      map[b] = (map[b] || 0) + 1;
    });

    return Object.keys(map)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map((name) => ({
        name,
        count: map[name],
      }));
  }, [documents]);

  // Derive Mess Sections based on configured chunk size (default 25)
  const sectionsList = useMemo(() => {
    const size = sectionChunkSize || 25;
    const maxToken = Math.max(
      ...documents.map((d) => Number(d.tokenNo) || 0),
      documents.length,
      size
    );
    const totalSections = Math.ceil(maxToken / size);
    const sections = [];

    for (let i = 0; i < totalSections; i++) {
      const startToken = i * size + 1;
      const endToken = (i + 1) * size;
      const sectionStudents = documents.filter((d) => {
        const num = Number(d.tokenNo) || 0;
        return num >= startToken && num <= endToken;
      });

      sections.push({
        id: `sec_${i + 1}`,
        sectionIndex: i + 1,
        name: `Section ${i + 1}`,
        shortName: `Sec ${i + 1}`,
        range: `#${startToken} – #${endToken}`,
        students: sectionStudents,
      });
    }

    return sections;
  }, [documents, sectionChunkSize]);

  // Global Rejections Map: prefId -> array of token numbers
  const rejectionsByPref = useMemo(() => {
    if (documents.length === 0 || preferences.length === 0) return {};

    const map = {};
    preferences.forEach((pref) => {
      map[pref.id] = documents
        .filter((doc) => doc.obj2 && doc.obj2[pref.id] === false)
        .map((doc) => doc.tokenNo);
    });
    return map;
  }, [documents, preferences]);

  // Overall Statistics KPIs
  const stats = useMemo(() => {
    const totalStudents = documents.length;
    let totalAvoiders = 0;
    let standardFullDiet = 0;
    let multiAvoiders = 0;

    documents.forEach((doc) => {
      const avoidedCount = preferences.filter(
        (p) => doc.obj2 && doc.obj2[p.id] === false
      ).length;

      if (avoidedCount > 0) {
        totalAvoiders++;
        if (avoidedCount >= 2) multiAvoiders++;
      } else {
        standardFullDiet++;
      }
    });

    return {
      totalStudents,
      totalAvoiders,
      standardFullDiet,
      multiAvoiders,
    };
  }, [documents, preferences]);

  // Comprehensive Reactive Filtering & Sorting Pipeline
  const filteredStudents = useMemo(() => {
    return documents
      .filter((student) => {
        // Calculate avoided preferences for this student
        const avoided = preferences.filter(
          (p) => student.obj2 && student.obj2[p.id] === false
        );
        const avoidCount = avoided.length;

        // 1. Dietary Scope Filter
        if (dietaryFilter === 'all_avoiders' && avoidCount === 0) return false;
        if (dietaryFilter === 'multi_avoiders' && avoidCount < 2) return false;
        if (dietaryFilter === 'strict_avoiders' && avoidCount < 3) return false;
        if (dietaryFilter === 'standard_full' && avoidCount > 0) return false;
        if (
          dietaryFilter !== 'all_avoiders' &&
          dietaryFilter !== 'all_students' &&
          dietaryFilter !== 'multi_avoiders' &&
          dietaryFilter !== 'strict_avoiders' &&
          dietaryFilter !== 'standard_full'
        ) {
          // Specific preference ID selected
          const avoidsSelected = student.obj2 && student.obj2[dietaryFilter] === false;
          if (!avoidsSelected) return false;
        }

        // 2. Academic Batch Filter
        if (batchFilter !== 'all') {
          const b = (student.batch && student.batch.trim()) || 'General';
          if (b !== batchFilter) return false;
        }

        // 3. Attendance Scope Filter (Active today on campus)
        if (attendanceScope === 'active_only') {
          if (student.block) return false;
          const isBreakfastActive = getEffectiveStudentMealStatus(
            student,
            todayIST,
            todayDayKey,
            'breakfast'
          );
          const isLunchActive = getEffectiveStudentMealStatus(
            student,
            todayIST,
            todayDayKey,
            'lunch'
          );
          if (!isBreakfastActive && !isLunchActive) return false;
        }

        // 4. Search Query (Token #, English Name, Malayalam Name, Username, Phone, Batch, or Food item keyword)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const tokenStr = String(student.tokenNo || '');
          const nameEn = (student.nameEn || student.name || '').toLowerCase();
          const nameMl = (student.nameMl || '').toLowerCase();
          const uname = (student.uname || student.username || '').toLowerCase();
          const batch = (student.batch || '').toLowerCase();
          const phone = (student.phone || student.mobile || '').toLowerCase();
          const room = (student.room || student.roomNo || '').toLowerCase();

          // Check if search matches any food item that this student avoids
          const matchesAvoidedFood = avoided.some(
            (p) =>
              (p.labelEn || '').toLowerCase().includes(q) ||
              (p.labelMl || '').toLowerCase().includes(q) ||
              p.id.toLowerCase().includes(q)
          );

          const matches =
            tokenStr.includes(q) ||
            nameEn.includes(q) ||
            nameMl.includes(q) ||
            uname.includes(q) ||
            batch.includes(q) ||
            phone.includes(q) ||
            room.includes(q) ||
            matchesAvoidedFood;

          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA, valB;
        if (sortField === 'tokenNo') {
          valA = Number(a.tokenNo) || 0;
          valB = Number(b.tokenNo) || 0;
        } else if (sortField === 'nameEn') {
          valA = (a.nameEn || a.name || '').toLowerCase();
          valB = (b.nameEn || b.name || '').toLowerCase();
        } else if (sortField === 'nameMl') {
          valA = (a.nameMl || '').toLowerCase();
          valB = (b.nameMl || '').toLowerCase();
        } else if (sortField === 'batch') {
          valA = (a.batch || '').toLowerCase();
          valB = (b.batch || '').toLowerCase();
        } else if (sortField === 'avoidCount') {
          valA = preferences.filter((p) => a.obj2 && a.obj2[p.id] === false).length;
          valB = preferences.filter((p) => b.obj2 && b.obj2[p.id] === false).length;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    documents,
    preferences,
    searchQuery,
    dietaryFilter,
    batchFilter,
    attendanceScope,
    sortField,
    sortOrder,
    todayIST,
    todayDayKey,
  ]);

  // Filtered Rejections Map corresponding to current filters
  const filteredRejectionsByPref = useMemo(() => {
    const map = {};
    preferences.forEach((pref) => {
      map[pref.id] = filteredStudents
        .filter((doc) => doc.obj2 && doc.obj2[pref.id] === false)
        .map((doc) => doc.tokenNo);
    });
    return map;
  }, [filteredStudents, preferences]);

  // Determine if active filters exist to show reset button
  const hasActiveFilters = Boolean(
    searchQuery.trim() ||
      dietaryFilter !== 'all_avoiders' ||
      batchFilter !== 'all' ||
      attendanceScope !== 'all' ||
      sortField !== 'tokenNo' ||
      sortOrder !== 'asc'
  );

  const handleResetFilters = () => {
    feedback('pop');
    setSearchQuery('');
    setDietaryFilter('all_avoiders');
    setBatchFilter('all');
    setAttendanceScope('all');
    setSortField('tokenNo');
    setSortOrder('asc');
  };

  // 1-Click Copy All Filtered Avoiders Tokens to Clipboard
  const handleCopyAllFilteredTokens = () => {
    const tokens = filteredStudents.map((s) => `#${s.tokenNo}`);
    const summary = `ADSA Mess • Avoiders List (${tokens.length} students):\n${tokens.join(', ')}`;
    navigator.clipboard.writeText(summary);
  };

  // ================= DOCUMENT HUB GENERATION =================
  const generateKitchenMatrixDoc = () => {
    const doc = new jsPDF('p', 'mm', 'a4');

    const columns = preferences.map((p) => ({
      header: `${p.labelEn} (${p.labelMl || p.labelEn})`,
      dataKey: p.id,
    }));

    const maxLen = Math.max(
      ...preferences.map((p) => (filteredRejectionsByPref[p.id] || []).length),
      1
    );

    const tableData = Array.from({ length: maxLen }).map((_, index) => {
      const row = {};
      preferences.forEach((p) => {
        const list = filteredRejectionsByPref[p.id] || [];
        row[p.id] = index < list.length ? `#${list[index]}` : '-';
      });
      return row;
    });

    doc.setFontSize(16);
    doc.setTextColor(5, 150, 105);
    doc.text('Alathurpadi Dars - Dietary Avoiders Matrix', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString('en-GB')} • Total Avoiders: ${filteredStudents.length} • Mode: ${categorization.toUpperCase()}`,
      14,
      25
    );

    doc.autoTable({
      columns,
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { fontSize: 10, halign: 'center' },
    });

    const filename = `ADSA_Dietary_Matrix_${new Date().toISOString().slice(0, 10)}.pdf`;
    return {
      doc,
      filename,
      title: 'Dietary Avoiders Matrix',
      subtitle: `Kitchen Matrix (${categorization.toUpperCase()}) • Generated ${new Date().toLocaleDateString('en-GB')}`,
    };
  };

  const handleViewMatrixDoc = () => {
    feedback('tick');
    const res = generateKitchenMatrixDoc();
    setUniversalDoc({ isOpen: true, data: { type: 'pdf', ...res } });
  };

  const handlePrintMatrixDoc = async () => {
    feedback('tick');
    try {
      const { doc } = generateKitchenMatrixDoc();
      const { blobUrl } = createPdfBlob(doc);
      await directPrintPdf(blobUrl);
    } catch (e) {
      console.error('Print matrix failed:', e);
    }
  };

  const handleShareMatrixDoc = async () => {
    feedback('pop');
    try {
      const { doc, filename, title } = generateKitchenMatrixDoc();
      const { blob } = createPdfBlob(doc);
      await shareDocument({
        blob,
        filename,
        title,
        text: 'Alathurpadi Dars Canteen • Dietary Avoiders Matrix',
      });
    } catch (e) {
      console.error('Share matrix failed:', e);
    }
  };

  const handleDownloadPDF = () => {
    feedback('tick');
    const { doc, filename } = generateKitchenMatrixDoc();
    doc.save(filename);
    feedback('success');
  };

  const handleExportCSV = () => {
    feedback('tick');
    exportDietaryCSV({
      preferences,
      documents: filteredStudents,
      rejectionsByPref: filteredRejectionsByPref,
      sortOrder,
      targetDateIST: todayIST,
      attendanceScope: attendanceScope === 'active_only' ? 'active_diners' : 'all',
    });
    feedback('success');
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
          Loading dietary avoidance records...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-2.5 sm:px-6 lg:px-8 py-3.5 sm:py-8 space-y-3.5 sm:space-y-6 min-w-0 overflow-x-hidden">
      {/* 1. Header Hero Card */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl w-full max-w-full min-w-0 overflow-hidden">
        <div className="min-w-0">
          <h1 className="text-base sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 truncate">
            <Sparkles className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-500 shrink-0" />
            <span className="truncate">{t('dietaryAvoidersMatrix', 'Dietary Avoiders Matrix')}</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2 sm:line-clamp-none">
            {t(
              'dietaryAvoidersSubtitle',
              'Real-time kitchen dietary matrix, allergen exclusions & food rejections roster'
            )}
          </p>
        </div>

        {/* Header Right Action Buttons - Grid on mobile (<640px) to prevent horizontal overflow */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end min-w-0">
          {/* Manage Avoiders (Admin or Login) */}
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              if (user) {
                navigate('/admin/dietary');
              } else {
                navigate('/alogin?redirect=/admin/dietary');
              }
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all cursor-pointer min-w-0 truncate"
            title={user ? t('manageAvoiders', 'Manage Avoiders') : 'Staff Login to Manage Avoiders'}
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate">{t('manageAvoiders', 'Manage')}</span>
          </button>

          {/* Navigation to Main Token Board */}
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              navigate('/');
            }}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all min-w-0 truncate"
          >
            <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">{t('navHome', 'Board')}</span>
          </button>

          {/* Export Action Menu */}
          <div className="col-span-1 sm:col-auto sm:min-w-[155px] min-w-0 w-full">
            <ExportActionMenu
              onView={handleViewMatrixDoc}
              onDownload={handleDownloadPDF}
              onPrint={handlePrintMatrixDoc}
              onShare={handleShareMatrixDoc}
              label={t('exportKitchenPdf', 'Export Kitchen PDF')}
              colorTheme="emerald"
              defaultAction="view"
            />
          </div>

          {/* Quick CSV Export Button */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-all text-xs font-bold sm:text-base col-span-1 sm:col-auto min-w-0"
            title="Download CSV Spreadsheet"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="sm:hidden text-xs truncate">CSV</span>
          </button>
        </div>
      </div>

      {/* 2. Top Analytics & Category KPI Bento Bar */}
      <AvoidersKpiBar
        stats={stats}
        preferences={preferences}
        rejectionsByPref={rejectionsByPref}
        selectedDietaryFilter={dietaryFilter}
        onSelectCategory={(catId) => setDietaryFilter(catId)}
        onCopyAllTokens={handleCopyAllFilteredTokens}
      />

      {/* 3. Filter, Search, Categorization & Sort Control Toolbar */}
      <AvoidersControls
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        dietaryFilter={dietaryFilter}
        setDietaryFilter={setDietaryFilter}
        batchFilter={batchFilter}
        setBatchFilter={setBatchFilter}
        sortField={sortField}
        setSortField={setSortField}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        viewMode={viewMode}
        setViewMode={setViewMode}
        categorization={categorization}
        setCategorization={setCategorization}
        attendanceScope={attendanceScope}
        setAttendanceScope={setAttendanceScope}
        allBatches={allBatches}
        preferences={preferences}
        rejectionsByPref={rejectionsByPref}
        filteredCount={filteredStudents.length}
        totalCount={documents.length}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 4. Active View Presentation Mode */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}_${categorization}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.15 }}
        >
          {/* Mode 1: Kitchen Matrix View (Upgraded Column Cards with Categorization) */}
          {viewMode === 'matrix' && (
            <AvoidersMatrixView
              preferences={preferences}
              rejectionsByPref={filteredRejectionsByPref}
              students={filteredStudents}
              onSelectStudent={(student) => setSelectedStudent(student)}
              searchQuery={searchQuery}
              sortOrder={sortOrder}
              categorization={categorization}
              sectionsList={sectionsList}
              batchesList={allBatches}
            />
          )}

          {/* Mode 2: Detailed Student Roster Table */}
          {viewMode === 'table' && (
            <AvoidersTableView
              students={filteredStudents}
              preferences={preferences}
              sortField={sortField}
              sortOrder={sortOrder}
              onSortChange={(field, order) => {
                setSortField(field);
                setSortOrder(order);
              }}
              onSelectStudent={(student) => setSelectedStudent(student)}
              searchQuery={searchQuery}
              sectionChunkSize={sectionChunkSize}
            />
          )}

          {/* Mode 3: Touch Bento Cards Grid */}
          {viewMode === 'cards' && (
            <AvoidersCardsView
              students={filteredStudents}
              preferences={preferences}
              onSelectStudent={(student) => setSelectedStudent(student)}
              searchQuery={searchQuery}
              sectionChunkSize={sectionChunkSize}
            />
          )}

          {/* Mode 4: Category Grouped Accordion */}
          {viewMode === 'grouped' && (
            <AvoidersGroupedView
              preferences={preferences}
              rejectionsByPref={filteredRejectionsByPref}
              students={filteredStudents}
              onSelectStudent={(student) => setSelectedStudent(student)}
              sortOrder={sortOrder}
              categorization={categorization}
              sectionsList={sectionsList}
              batchesList={allBatches}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* 5. Avoider Detail Quick-Peek Inspection Modal */}
      <AvoiderDetailModal
        isOpen={Boolean(selectedStudent)}
        onClose={() => setSelectedStudent(null)}
        student={selectedStudent}
        preferences={preferences}
        isAdmin={Boolean(isAdmin || user)}
        onNavigateToManage={(student) => {
          setSelectedStudent(null);
          navigate(`/admin/dietary`);
        }}
      />

      {/* 6. Universal Document Modal (Preview PDF before downloading or printing) */}
      <UniversalDocumentModal
        isOpen={universalDoc.isOpen}
        onClose={() => setUniversalDoc({ isOpen: false, data: null })}
        documentData={universalDoc.data}
      />
    </div>
  );
};

export default DietaryAvoidersPage;
