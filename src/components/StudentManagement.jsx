import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  UserPlus,
  Search,
  CheckSquare,
  Square,
  Utensils,
  Coffee,
  Sliders,
  Edit,
  FileSpreadsheet,
  LayoutGrid,
  List,
  ArrowUpDown,
  Lock,
  Unlock,
  RefreshCw,
  X,
  UtensilsCrossed,
  Home,
} from 'lucide-react';
import firebase from '../firebase/config';
import { useWorldTime } from '../utils/time';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import StudentDrawer from './StudentDrawer';
import BulkActionModal from './BulkActionModal';
import CsvManagerModal from './CsvManagerModal';
import { subscribeToPreferences } from '../utils/preferenceService';

export default function StudentManagement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();
  const { dayShort } = useWorldTime('Asia/Kolkata');

  const todayKey = (dayShort || 'su').toLowerCase().slice(0, 2);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'BLOCKED'
  const [selectedMealFilter, setSelectedMealFilter] = useState('ALL'); // 'ALL' | 'LUNCH_OFF' | 'BF_OFF' | 'DIETARY_EXEMPT'
  const [sortField, setSortField] = useState('tokenNo'); // 'tokenNo' | 'nameEn' | 'batch'
  const [sortAsc, setSortAsc] = useState(true);

  // View Mode: 'table' | 'grid' (defaults to grid on mobile devices for seamless responsiveness)
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      return 'grid';
    }
    return 'table';
  });

  // Selected students for bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modals & Drawer State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [csvModalOpen, setCsvModalOpen] = useState(false);
  const [preferences, setPreferences] = useState([]);

  useEffect(() => {
    const unsub = subscribeToPreferences((list) => {
      setPreferences(list.filter((p) => p.isActive));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setLoading(true);
    const unsubStudents = firebase
      .firestore()
      .collection('students')
      .onSnapshot(
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          docs.sort((a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0));
          setStudents(docs);
          setLoading(false);
          setRefreshing(false);
        },
        (err) => {
          console.error('Error in students real-time listener:', err);
          setLoading(false);
          setRefreshing(false);
        }
      );

    return () => unsubStudents();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get('add') === 'true') {
      setEditingStudent(null);
      setDrawerOpen(true);
    }
    const tokenParam = params.get('token');
    if (tokenParam && students.length > 0) {
      const match = students.find((s) => String(s.tokenNo) === String(tokenParam));
      if (match) {
        setEditingStudent(match);
        setDrawerOpen(true);
      }
    }
  }, [location.search, students]);

  const handleManualRefresh = () => {
    feedback('tick');
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      feedback('success');
    }, 400);
  };

  // Derive unique batches
  const allBatches = useMemo(() => {
    const set = new Set();
    students.forEach(s => {
      if (s.batch && s.batch.trim()) set.add(s.batch.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  // Derive all existing token numbers
  const existingTokens = useMemo(() => {
    return students.map(s => Number(s.tokenNo)).filter(n => !isNaN(n));
  }, [students]);

  // Filter and sort students
  const filteredStudents = useMemo(() => {
    return students
      .filter(s => {
        // 1. Search Query (Token No, English Name, Malayalam Name, Username)
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const tokenStr = String(s.tokenNo || '');
          const nameEn = (s.nameEn || s.name || '').toLowerCase();
          const nameMl = (s.nameMl || '').toLowerCase();
          const uname = (s.uname || s.username || '').toLowerCase();
          const batch = (s.batch || '').toLowerCase();

          const matches =
            tokenStr.includes(q) ||
            nameEn.includes(q) ||
            nameMl.includes(q) ||
            uname.includes(q) ||
            batch.includes(q);

          if (!matches) return false;
        }

        // 2. Batch Filter
        if (selectedBatch !== 'ALL') {
          if ((s.batch || 'General') !== selectedBatch) return false;
        }

        // 3. Status Filter
        if (selectedStatus === 'ACTIVE' && s.block) return false;
        if (selectedStatus === 'BLOCKED' && !s.block) return false;

        // 4. Meal & Dietary Filter
        if (selectedMealFilter === 'LUNCH_OFF') {
          const lunchToday = s.obj?.lunch?.[todayKey];
          if (lunchToday !== false) return false;
        } else if (selectedMealFilter === 'BF_OFF') {
          const bfToday = s.obj?.breakfast?.[todayKey];
          if (bfToday !== false) return false;
        } else if (selectedMealFilter === 'DIETARY_EXEMPT') {
          const diet = s.obj2;
          const hasExempt = diet && (!diet.beef || !diet.chicken || !diet.fish || !diet.mutton);
          if (!hasExempt) return false;
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
        } else if (sortField === 'batch') {
          valA = (a.batch || '').toLowerCase();
          valB = (b.batch || '').toLowerCase();
        }
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [students, searchQuery, selectedBatch, selectedStatus, selectedMealFilter, sortField, sortAsc, todayKey]);

  // Statistics KPIs
  const stats = useMemo(() => {
    const total = students.length;
    let active = 0;
    let blocked = 0;
    let lunchActiveToday = 0;
    let breakfastActiveToday = 0;

    students.forEach(s => {
      if (s.block) {
        blocked++;
      } else {
        active++;
        if (s.obj?.lunch?.[todayKey] !== false) lunchActiveToday++;
        if (s.obj?.breakfast?.[todayKey] !== false) breakfastActiveToday++;
      }
    });

    return { total, active, blocked, lunchActiveToday, breakfastActiveToday };
  }, [students, todayKey]);

  // Selection handlers
  const handleToggleSelect = (id) => {
    feedback('tick');
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllFiltered = () => {
    feedback('pop');
    if (selectedIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleClearSelection = () => {
    feedback('tick');
    setSelectedIds(new Set());
  };

  // Quick Inline Block / Unblock Toggle
  const handleQuickStatusToggle = async (student) => {
    feedback('tick');
    const nextStatus = !student.block;

    try {
      await firebase.firestore().collection('students').doc(student.id).update({
        block: nextStatus,
        updatedAt: new Date().toISOString()
      });

      setStudents(prev =>
        prev.map(s => (s.id === student.id ? { ...s, block: nextStatus } : s))
      );

      feedback('success');
    } catch (err) {
      console.error('Error toggling block state:', err);
      feedback('warning');
    }
  };

  // Drawer Open Handlers
  const handleOpenAddStudent = () => {
    feedback('tick');
    setEditingStudent(null);
    setDrawerOpen(true);
  };

  const handleOpenEditStudent = (student) => {
    feedback('tick');
    setEditingStudent(student);
    setDrawerOpen(true);
  };

  // Drawer callback when student saved
  const handleStudentSaved = (savedStudent) => {
    setStudents(prev => {
      const idx = prev.findIndex(s => s.id === savedStudent.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedStudent;
        return next.sort((a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0));
      } else {
        return [...prev, savedStudent].sort((a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0));
      }
    });
  };

  // Drawer callback when student deleted
  const handleStudentDeleted = (deletedId) => {
    setStudents(prev => prev.filter(s => s.id !== deletedId));
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.delete(deletedId);
      return next;
    });
  };

  // Selected students objects
  const selectedStudentsList = useMemo(() => {
    return students.filter(s => selectedIds.has(s.id));
  }, [students, selectedIds]);

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
        <p className="mt-4 text-xs font-semibold text-gray-400">Loading student directory...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      
      {/* Top Banner & Title Strip */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3.5 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center font-extrabold shadow-md shadow-emerald-500/20 flex-shrink-0">
              <Users className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h1 className="text-lg xs:text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {t('studentMgmtTitle') || 'Student Management Console'}
              </h1>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                {t('studentMgmtSubtitle') || 'Directory, bilingual records, individual & bulk CRUD actions'}
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 justify-start md:justify-end">
          <button
            onClick={handleManualRefresh}
            title="Refresh Data"
            className="p-2 sm:p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => { feedback('tick'); setCsvModalOpen(true); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('importCsvBtn') || 'Import / Export'}</span>
          </button>

          <button
            onClick={() => {
              feedback('tick');
              navigate('/admin/dietary');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('navDietary') || 'Dietary Hub'}</span>
          </button>

          <button
            onClick={() => { feedback('tick'); navigate('/admin'); }}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-500" />
            <span>Master Board</span>
          </button>

          <button
            onClick={() => {
              feedback('tick');
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
            title="Go to Public Home (/)"
          >
            <Home className="w-3.5 h-3.5 text-emerald-500" />
            <span>Home</span>
          </button>

          <button
            onClick={handleOpenAddStudent}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all transform active:scale-95"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('addStudentBtn') || '+ Add Student'}</span>
          </button>
        </div>
      </div>

      {/* KPI Bento Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-4">
        {/* Total Students */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500 block truncate">Total Students</span>
          <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-mono">{stats.total}</span>
            <span className="text-[10px] sm:text-xs text-gray-400 font-medium truncate">registered</span>
          </div>
        </div>

        {/* Active vs Blocked */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500 block truncate">Active vs Blocked</span>
          <div className="mt-1 flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <span className="px-1.5 sm:px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400">
              {stats.active} Active
            </span>
            <span className="px-1.5 sm:px-2 py-0.5 rounded-lg text-[10px] sm:text-xs font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400">
              {stats.blocked} Locked
            </span>
          </div>
        </div>

        {/* Today's Lunch */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 truncate">
            <Utensils className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Today&apos;s Lunch</span>
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-mono">{stats.lunchActiveToday}</span>
            <span className="text-[10px] sm:text-xs text-gray-400 truncate">opted-in</span>
          </div>
        </div>

        {/* Today's Breakfast */}
        <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1 truncate">
            <Coffee className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            <span>Today&apos;s Breakfast</span>
          </span>
          <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-mono">{stats.breakfastActiveToday}</span>
            <span className="text-[10px] sm:text-xs text-gray-400 truncate">opted-in</span>
          </div>
        </div>

        {/* Active Batches */}
        <div className="col-span-2 lg:col-span-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500 block truncate">Batches / Classes</span>
          <div className="mt-1 flex items-baseline gap-1.5 sm:gap-2">
            <span className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white font-mono">{allBatches.length}</span>
            <span className="text-[10px] sm:text-xs text-gray-400 truncate">academic groups</span>
          </div>
        </div>
      </div>

      {/* Control & Multi-Filter Bar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Multilingual Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchStudentPlaceholder') || 'Search token number, English or Malayalam name...'}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-xs sm:text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* View mode & Sorting */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            {/* Sort Toggle */}
            <button
              onClick={() => {
                feedback('tick');
                if (sortField === 'tokenNo') {
                  setSortField('nameEn');
                } else if (sortField === 'nameEn') {
                  setSortField('batch');
                } else {
                  setSortField('tokenNo');
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-emerald-500" />
              <span>Sort: {sortField === 'tokenNo' ? 'Token' : sortField === 'nameEn' ? 'Name' : 'Batch'}</span>
            </button>

            {/* Asc / Desc */}
            <button
              onClick={() => { feedback('tick'); setSortAsc(!sortAsc); }}
              className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-xs font-bold hover:bg-gray-200 dark:hover:bg-white/10"
            >
              {sortAsc ? '▲' : '▼'}
            </button>

            {/* View Mode Switcher */}
            <div className="flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
              <button
                onClick={() => { feedback('pop'); setViewMode('table'); }}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'table' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                title="Data Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => { feedback('pop'); setViewMode('grid'); }}
                className={`p-1.5 rounded-lg transition-all ${
                  viewMode === 'grid' ? 'bg-emerald-500 text-white shadow-sm' : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
                title="Tactile Card Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Filter Pills (horizontally scrollable without wrapping clumsily on mobile) */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100 dark:border-white/5 overflow-x-auto whitespace-nowrap scrollbar-none py-1 max-w-full">
          {/* Status Pills */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {['ALL', 'ACTIVE', 'BLOCKED'].map(status => (
              <button
                key={status}
                onClick={() => { feedback('tick'); setSelectedStatus(status); }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                  selectedStatus === status
                    ? 'bg-emerald-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                {status === 'ALL' ? 'All Status' : status === 'ACTIVE' ? 'Active' : 'Locked'}
              </button>
            ))}
          </div>

          <div className="h-4 w-px bg-gray-300 dark:bg-white/10 flex-shrink-0" />

          {/* Meal Filters */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {[
              { id: 'ALL', label: 'All Meals' },
              { id: 'LUNCH_OFF', label: 'Lunch Off Today' },
              { id: 'BF_OFF', label: 'Breakfast Off Today' },
              { id: 'DIETARY_EXEMPT', label: 'Dietary Exemptions' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { feedback('tick'); setSelectedMealFilter(item.id); }}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                  selectedMealFilter === item.id
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Batches Pill Selector */}
          {allBatches.length > 0 && (
            <>
              <div className="h-4 w-px bg-gray-300 dark:bg-white/10 flex-shrink-0" />
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => { feedback('tick'); setSelectedBatch('ALL'); }}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${
                    selectedBatch === 'ALL'
                      ? 'bg-emerald-500 text-white shadow-sm'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  All Batches
                </button>
                {allBatches.map(b => (
                  <button
                    key={b}
                    onClick={() => { feedback('tick'); setSelectedBatch(b); }}
                    className={`px-3 py-1 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex-shrink-0 ${
                      selectedBatch === b
                        ? 'bg-emerald-500 text-white shadow-sm'
                        : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main View: Table Mode */}
      {viewMode === 'table' ? (
        <div className="rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden backdrop-blur-xl">
          <div className="overflow-x-auto scrollbar-none touch-pan-x">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 w-12 text-center">
                    <button
                      onClick={handleSelectAllFiltered}
                      className="p-1 text-gray-400 hover:text-emerald-500 transition-colors"
                    >
                      {selectedIds.size === filteredStudents.length && filteredStudents.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-4 w-20">{t('tokenCol') || 'Token'}</th>
                  <th className="py-3.5 px-4">{t('studentCol') || 'Student Name (EN / ML)'}</th>
                  <th className="py-3.5 px-4">{t('batchCol') || 'Batch / Year'}</th>
                  <th className="py-3.5 px-4">{t('mealsCol') || 'Today\'s Meal'}</th>
                  <th className="py-3.5 px-4">{t('dietaryCol') || 'Dietary Exempt'}</th>
                  <th className="py-3.5 px-4 text-center">{t('statusCol') || 'Status'}</th>
                  <th className="py-3.5 px-4 text-right">{t('actionsCol') || 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-gray-400">
                      No students found matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => {
                    const isSelected = selectedIds.has(st.id);
                    const lunchToday = st.obj?.lunch?.[todayKey] !== false;
                    const bfToday = st.obj?.breakfast?.[todayKey] !== false;
                    const isBlocked = Boolean(st.block);

                    // Dietary rejections
                    const diet = st.obj2 || {};
                    const rejectedDiet = [];
                    if (diet.beef === false) rejectedDiet.push('No Beef');
                    if (diet.chicken === false) rejectedDiet.push('No Chicken');
                    if (diet.fish === false) rejectedDiet.push('No Fish');
                    if (diet.mutton === false) rejectedDiet.push('No Mutton');

                    return (
                      <tr
                        key={st.id}
                        className={`transition-colors hover:bg-gray-50/60 dark:hover:bg-white/[0.02] ${
                          isSelected ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleToggleSelect(st.id)}
                            className="p-1 text-gray-400 hover:text-emerald-500 transition-colors"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <Square className="w-4 h-4" />
                            )}
                          </button>
                        </td>

                        {/* Token Badge */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-extrabold text-xs shadow-sm shadow-emerald-500/20 font-mono">
                            {st.tokenNo}
                          </span>
                        </td>

                        {/* Student Name (EN & ML) */}
                        <td className="py-3 px-4">
                          <div className="space-y-0.5">
                            <span className="font-bold text-gray-900 dark:text-white block">
                              {st.nameEn || st.name || `Student #${st.tokenNo}`}
                            </span>
                            <div className="flex items-center gap-2">
                              {st.nameMl && (
                                <span className="text-emerald-600 dark:text-emerald-400 font-medium text-[11px]">
                                  {st.nameMl}
                                </span>
                              )}
                              <span className="text-gray-400 text-[10px] font-mono">
                                @{st.username || st.uname || st.tokenNo}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Batch */}
                        <td className="py-3 px-4">
                          <span className="inline-block px-2.5 py-1 rounded-lg text-[11px] font-bold bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300">
                            {st.batch || 'General'}
                          </span>
                        </td>

                        {/* Today's Meals */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                lunchToday
                                  ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              <Utensils className="w-3 h-3" />
                              <span>{lunchToday ? 'Lunch ON' : 'Lunch OFF'}</span>
                            </span>

                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 ${
                                bfToday
                                  ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300'
                                  : 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300'
                              }`}
                            >
                              <Coffee className="w-3 h-3" />
                              <span>{bfToday ? 'BF ON' : 'BF OFF'}</span>
                            </span>
                          </div>
                        </td>

                        {/* Dietary Rejections */}
                        <td className="py-3 px-4">
                          {rejectedDiet.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {rejectedDiet.map(item => (
                                <span key={item} className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
                                  {item}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-[11px]">Normal</span>
                          )}
                        </td>

                        {/* Status Toggle Switch */}
                        <td className="py-3 px-4 text-center">
                          <button
                            onClick={() => handleQuickStatusToggle(st)}
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1 transition-all ${
                              isBlocked
                                ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                                : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {isBlocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                            <span>{isBlocked ? 'Locked' : 'Active'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleOpenEditStudent(st)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-bold text-xs transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>Edit</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Bento Card Grid Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStudents.length === 0 ? (
            <div className="col-span-full py-12 text-center text-gray-400">
              No students found matching current filters.
            </div>
          ) : (
            filteredStudents.map(st => {
              const isSelected = selectedIds.has(st.id);
              const lunchToday = st.obj?.lunch?.[todayKey] !== false;
              const bfToday = st.obj?.breakfast?.[todayKey] !== false;
              const isBlocked = Boolean(st.block);

              return (
                <motion.div
                  key={st.id}
                  whileHover={{ y: -2 }}
                  className={`p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border transition-all duration-200 shadow-sm backdrop-blur-xl space-y-3 relative overflow-hidden ${
                    isSelected
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : 'border-gray-200/80 dark:border-white/10'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center font-extrabold text-base shadow-md font-mono">
                        {st.tokenNo}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white line-clamp-1">
                          {st.nameEn || st.name || `Token #${st.tokenNo}`}
                        </h3>
                        {st.nameMl && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                            {st.nameMl}
                          </p>
                        )}
                        <span className="text-[10px] text-gray-400 font-mono">
                          @{st.username || st.uname || st.tokenNo}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleToggleSelect(st.id)}
                      className="p-1 text-gray-400 hover:text-emerald-500"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-100 dark:border-white/5">
                    <span className="px-2 py-0.5 rounded-md font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-[11px]">
                      {st.batch || 'General'}
                    </span>

                    <button
                      onClick={() => handleQuickStatusToggle(st)}
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1 ${
                        isBlocked
                          ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400'
                          : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400'
                      }`}
                    >
                      {isBlocked ? 'Locked' : 'Active'}
                    </button>
                  </div>

                  {/* Meals row */}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    <div className={`p-2 rounded-xl flex items-center justify-between ${
                      lunchToday ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
                    }`}>
                      <span>Lunch</span>
                      <span>{lunchToday ? 'ON' : 'OFF'}</span>
                    </div>

                    <div className={`p-2 rounded-xl flex items-center justify-between ${
                      bfToday ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
                    }`}>
                      <span>Breakfast</span>
                      <span>{bfToday ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>

                  {/* Edit button */}
                  <button
                    onClick={() => handleOpenEditStudent(st)}
                    className="w-full py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-emerald-500 hover:text-white text-gray-700 dark:text-gray-200 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Profile & Schedules</span>
                  </button>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Floating Bulk Action Ribbon (Shows when 1 or more rows selected) */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom,0px))] sm:bottom-6 inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 z-40 max-w-2xl px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-[#0f1715]/95 text-white border border-white/20 shadow-2xl backdrop-blur-2xl flex flex-wrap items-center justify-between gap-2.5 sm:gap-3"
          >
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center">
                {selectedIds.size}
              </span>
              <span className="text-xs font-bold">
                {selectedIds.size} {t('selectedCount') || 'students selected'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleClearSelection}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                {t('deselectAll') || 'Deselect'}
              </button>

              <button
                onClick={() => { feedback('tick'); setBulkModalOpen(true); }}
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{t('bulkActionsBtn') || 'Apply Bulk Actions'}</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slide-Over Drawer for Individual CRUD */}
      <StudentDrawer
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        student={editingStudent}
        existingTokens={existingTokens}
        existingBatches={allBatches}
        onSaved={handleStudentSaved}
        onDeleted={handleStudentDeleted}
      />

      {/* Bulk Operations Modal */}
      <BulkActionModal
        isOpen={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        selectedStudents={selectedStudentsList}
        allBatches={allBatches}
        onCompleted={() => {
          setSelectedIds(new Set());
        }}
      />

      {/* CSV Manager & Bilingual Exporter Modal */}
      <CsvManagerModal
        isOpen={csvModalOpen}
        onClose={() => setCsvModalOpen(false)}
        allStudents={students}
        onImportComplete={() => {
          setSelectedIds(new Set());
        }}
      />
    </div>
  );
}
