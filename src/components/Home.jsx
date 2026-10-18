import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  Printer,
  Edit3,
  Calendar,
  Clock,
  Search,
  Check,
  X,
  Lock,
  Sparkles,
  Users,
  Filter,
  ArrowRight,
  ShieldAlert,
  ArrowUpDown,
  Layers,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  ShieldCheck,
  HelpCircle,
} from 'lucide-react';
import firebase from '../firebase/config';
import { useWorldTime } from '../utils/time';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { usePortalStatus } from '../utils/usePortalStatus';
import {
  getTodayISTDate,
  addDaysToDate,
  getActiveStudentException,
  getEffectiveStudentMealStatus,
  formatFriendlyDate,
} from '../utils/studentExceptionService';
import { subscribeToPreferences } from '../utils/preferenceService';
import NextMealSpotlight from './NextMealSpotlight';
import './Home.css';

// Animated Rolling Counter Component
const RollingCounter = ({ value, label, colorClass, glowClass, icon: Icon }) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-[#121c19]/90 border border-gray-200/80 dark:border-white/10 shadow-sm transition-all duration-300 ${glowClass}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white"
        >
          {value}
        </motion.span>
        <span className="text-xs text-gray-400 font-medium">orders</span>
      </div>
    </motion.div>
  );
};

// Next-Gen Tactile Token Button
const TokenButton = ({ doc, isOn, onLeave, onClick, onBlockedClick }) => {
  const isBlocked = Boolean(doc.block);

  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      onClick={() => {
        if (isBlocked) {
          onBlockedClick(doc);
        } else {
          onClick(doc);
        }
      }}
      aria-label={`Token ${doc.tokenNo}`}
      className={`
        relative group flex items-center justify-center flex-shrink-0
        w-11 h-11 min-[380px]:w-12 min-[380px]:h-12 sm:w-14 sm:h-14 aspect-square rounded-2xl select-none font-extrabold
        text-xs min-[380px]:text-sm sm:text-base tracking-tight font-mono
        shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400/50
        ${
          isBlocked
            ? 'bg-gradient-to-b from-gray-700 to-gray-900 text-gray-300 border border-gray-600/40 shadow-inner'
            : onLeave
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25 border-2 border-amber-300'
            : isOn
            ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25 hover:shadow-glow-emerald border border-emerald-400/40'
            : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25 hover:shadow-glow-red border border-rose-400/40'
        }
      `}
    >
      {!isBlocked && (
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}

      {isBlocked ? (
        <Lock className="w-4 h-4 text-gray-300" />
      ) : onLeave ? (
        <span className="relative z-10 leading-none">{doc.tokenNo}</span>
      ) : (
        <span className="relative z-10 leading-none">{doc.tokenNo}</span>
      )}

      {/* Mini indicator dot / leave badge */}
      {onLeave ? (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
      ) : (
        <span
          className={`absolute bottom-1 w-1 h-1 rounded-full ${
            isBlocked ? 'bg-gray-400' : isOn ? 'bg-white/80' : 'bg-white/60'
          }`}
        />
      )}
    </motion.button>
  );
};

const SwitchPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const portalStatus = usePortalStatus();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLunch, setIsLunch] = useState(true);
  const [detailsDoc, setDetailsDoc] = useState(null);
  const [blockedAlertDoc, setBlockedAlertDoc] = useState(null);
  const [lockedPortalAlertOpen, setLockedPortalAlertOpen] = useState(false);

  // Advanced View & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, off, blocked, leave
  const [viewCategory, setViewCategory] = useState('all'); // 'all' | 'batch' | 'section'
  const [sortBy, setSortBy] = useState('token_asc'); // 'token_asc' | 'token_desc' | 'name_asc' | 'status_active'
  const [batchFilter, setBatchFilter] = useState('all');
  const [dietaryFilter, setDietaryFilter] = useState('all');
  const [collapsedBatches, setCollapsedBatches] = useState({});

  // Dynamic Preferences
  const [preferencesList, setPreferencesList] = useState([]);

  const { timeHms, longDate, dayShort } = useWorldTime('Asia/Kolkata');
  const [day, setDay] = useState('');
  const todayIST = useMemo(() => getTodayISTDate(), []);

  // Determine current or next day for meal allocation (after 6:00 PM IST, view next day)
  const isPostEveningCutoff = Boolean(timeHms && timeHms > '18:00:00');
  const targetDateIST = useMemo(() => {
    return isPostEveningCutoff ? addDaysToDate(todayIST, 1) : todayIST;
  }, [isPostEveningCutoff, todayIST]);

  useEffect(() => {
    if (!dayShort || !timeHms) return;
    const days = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    if (isPostEveningCutoff) {
      const currentIndex = days.indexOf(dayShort);
      const nextDay = days[(currentIndex + 1) % 7];
      setDay(nextDay);
    } else {
      setDay(dayShort);
    }
  }, [timeHms, dayShort, isPostEveningCutoff]);

  // Real-time Firestore Subscriptions
  useEffect(() => {
    setLoading(true);
    const unsubStudents = firebase
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
        (error) => {
          console.error('Error with real-time students listener:', error);
          setLoading(false);
        }
      );

    const unsubPrefs = subscribeToPreferences((list) => {
      setPreferencesList(list.filter((p) => p.isActive));
    });

    return () => {
      unsubStudents();
      unsubPrefs();
    };
  }, []);

  // Compute live lunch and breakfast counts taking exceptions into account
  const { lunchCount, breakfastCount } = useMemo(() => {
    let l = 0;
    let b = 0;
    if (!day) return { lunchCount: 0, breakfastCount: 0 };

    documents.forEach((doc) => {
      if (!doc.block) {
        if (getEffectiveStudentMealStatus(doc, targetDateIST, day, 'lunch')) l++;
        if (getEffectiveStudentMealStatus(doc, targetDateIST, day, 'breakfast')) b++;
      }
    });

    return { lunchCount: l, breakfastCount: b };
  }, [documents, day, targetDateIST]);

  // Filtering and Sorting Pipeline
  const filteredDocuments = useMemo(() => {
    const mealKey = isLunch ? 'lunch' : 'breakfast';
    const q = searchQuery.toLowerCase().trim();

    return documents
      .filter((doc) => {
        // 1. Search Query (Token, English Name, Malayalam Name, Username)
        if (q) {
          const matchToken = String(doc.tokenNo).includes(q);
          const matchEn = (doc.nameEn || doc.name || '').toLowerCase().includes(q);
          const matchMl = (doc.nameMl || doc.uname || '').toLowerCase().includes(q);
          const matchUser = (doc.username || '').toLowerCase().includes(q);
          if (!matchToken && !matchEn && !matchMl && !matchUser) return false;
        }

        // 2. Batch Filter
        if (batchFilter !== 'all' && doc.batch !== batchFilter) {
          return false;
        }

        // 3. Dietary Filter
        if (dietaryFilter !== 'all') {
          if (doc.obj2 && doc.obj2[dietaryFilter] === false) {
            return false;
          }
        }

        // 4. Status Filter
        const hasDateExc = Boolean(getActiveStudentException(doc, targetDateIST, mealKey));
        const isOn = getEffectiveStudentMealStatus(doc, targetDateIST, day, mealKey);

        if (statusFilter === 'active') return isOn && !doc.block;
        if (statusFilter === 'off') return !isOn && !doc.block;
        if (statusFilter === 'blocked') return Boolean(doc.block);
        if (statusFilter === 'leave') return hasDateExc;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'token_asc') return (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0);
        if (sortBy === 'token_desc') return (Number(b.tokenNo) || 0) - (Number(a.tokenNo) || 0);
        if (sortBy === 'name_asc') {
          const nameA = a.nameEn || a.name || a.uname || '';
          const nameB = b.nameEn || b.name || b.uname || '';
          return nameA.localeCompare(nameB);
        }
        if (sortBy === 'status_active') {
          const mealKey = isLunch ? 'lunch' : 'breakfast';
          const onA = !a.block && Boolean(a.obj?.[mealKey]?.[day]);
          const onB = !b.block && Boolean(b.obj?.[mealKey]?.[day]);
          return (onB ? 1 : 0) - (onA ? 1 : 0);
        }
        return 0;
      });
  }, [documents, searchQuery, batchFilter, dietaryFilter, statusFilter, sortBy, isLunch, day, targetDateIST]);

  // Grouping by Batch
  const groupedByBatch = useMemo(() => {
    const batches = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4', 'Batch 5', 'Batch 6', 'Batch 7'];
    const groups = {};
    batches.forEach((b) => {
      groups[b] = [];
    });
    groups['Other'] = [];

    filteredDocuments.forEach((doc) => {
      const b = doc.batch || 'Other';
      if (groups[b]) {
        groups[b].push(doc);
      } else {
        groups['Other'].push(doc);
      }
    });

    return groups;
  }, [filteredDocuments]);

  // Grouping by Section (Dynamic chunks of 25)
  const groupedBySection = useMemo(() => {
    const sectionSize = 25;
    const sections = [];
    const totalSections = Math.ceil(filteredDocuments.length / sectionSize);

    for (let i = 0; i < totalSections; i++) {
      const start = i * sectionSize;
      const end = Math.min((i + 1) * sectionSize, filteredDocuments.length);
      const slice = filteredDocuments.slice(start, end);
      sections.push({
        id: i + 1,
        title: `Section ${i + 1}`,
        range: `${slice[0]?.tokenNo || ''} - ${slice[slice.length - 1]?.tokenNo || ''}`,
        students: slice,
      });
    }
    return sections;
  }, [filteredDocuments]);

  const toggleMeal = (type) => {
    feedback('pop');
    setIsLunch(type === 'lunch');
  };

  const handleOpenDetails = (doc) => {
    feedback('pop');
    setDetailsDoc(doc);
  };

  const handleOpenBlocked = (doc) => {
    feedback('warning');
    setBlockedAlertDoc(doc);
  };

  const handleUpdateTokenClick = () => {
    feedback('tick');
    if (!portalStatus.isOpen) {
      setLockedPortalAlertOpen(true);
    } else {
      navigate('/login');
    }
  };

  const toggleBatchCollapse = (batchName) => {
    feedback('tick');
    setCollapsedBatches((prev) => ({
      ...prev,
      [batchName]: !prev[batchName],
    }));
  };

  const daysList = [
    { key: 'su', label: t('days')?.su || 'Sun' },
    { key: 'mo', label: t('days')?.mo || 'Mon' },
    { key: 'tu', label: t('days')?.tu || 'Tue' },
    { key: 'we', label: t('days')?.we || 'Wed' },
    { key: 'th', label: t('days')?.th || 'Thu' },
    { key: 'fr', label: t('days')?.fr || 'Fri' },
    { key: 'sa', label: t('days')?.sa || 'Sat' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* ================= HERO BANNER & STATS DOCK ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 p-6 sm:p-8 text-white shadow-xl border border-emerald-500/20 backdrop-blur-xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Alathurpadi Dars Live Dining System</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
              Canteen Token Board
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed">
              Real-time meal reservations, dietary tracking, and kitchen distribution counters for students and mess administration.
            </p>
          </div>

          {/* Quick Counter Cards */}
          <div className="grid grid-cols-2 gap-3 w-full md:w-auto min-w-[280px] sm:min-w-[320px]">
            <RollingCounter
              value={lunchCount}
              label={t('navLunch') || 'Lunch'}
              colorClass="bg-gradient-to-br from-emerald-500 to-green-600"
              glowClass="border-emerald-500/30 dark:border-emerald-500/20"
              icon={Utensils}
            />
            <RollingCounter
              value={breakfastCount}
              label={t('navBreakfast') || 'Breakfast'}
              colorClass="bg-gradient-to-br from-amber-500 to-orange-600"
              glowClass="border-amber-500/30 dark:border-amber-500/20"
              icon={Coffee}
            />
          </div>
        </div>

        {/* Action Dock inside Banner */}
        <div className="relative z-10 mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs text-emerald-200">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Today: <b>{longDate || 'Loading IST...'}</b></span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                feedback('tick');
                navigate('/pdfg');
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-xs border border-white/20 transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('supplyListBtn') || 'Kitchen Sheet'}</span>
            </button>

            {/* Smart Locked/Open Token Update Button (Item #3) */}
            <button
              onClick={handleUpdateTokenClick}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 ${
                portalStatus.isOpen
                  ? 'bg-white text-emerald-800 hover:bg-emerald-50'
                  : 'bg-amber-400/90 hover:bg-amber-400 text-gray-900 border border-amber-300'
              }`}
            >
              {portalStatus.isOpen ? (
                <>
                  <Edit3 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Update Token</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-gray-900" />
                  <span>Token Portal Locked ({portalStatus.statusBadge})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ================= CANTEEN MEAL SPOTLIGHT ================= */}
      <NextMealSpotlight
        documents={documents}
        lunchOrdersCount={lunchCount}
        breakfastOrdersCount={breakfastCount}
      />

      {/* ================= CONTROLS DOCK: MEAL TOGGLE, CATEGORY & ADVANCED FILTERS ================= */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl space-y-4">
        {/* Row 1: Meal Selector & Primary View Mode */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Meal Toggle */}
          <div className="flex p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 w-full sm:w-auto">
            <button
              onClick={() => toggleMeal('lunch')}
              className={`relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex-1 sm:flex-none ${
                isLunch
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {isLunch && (
                <motion.div
                  layoutId="activeMealPill"
                  className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Utensils className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{t('navLunch') || 'Lunch'}</span>
              <span className="relative z-10 px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-bold">
                {lunchCount}
              </span>
            </button>

            <button
              onClick={() => toggleMeal('breakfast')}
              className={`relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex-1 sm:flex-none ${
                !isLunch
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {!isLunch && (
                <motion.div
                  layoutId="activeMealPill"
                  className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Coffee className="w-4 h-4 relative z-10" />
              <span className="relative z-10">{t('navBreakfast') || 'Breakfast'}</span>
              <span className="relative z-10 px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-bold">
                {breakfastCount}
              </span>
            </button>
          </div>

          {/* View Category Segmented Control (Item #7) */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">View By:</span>
            <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-xs font-semibold">
              <button
                onClick={() => {
                  feedback('tick');
                  setViewCategory('all');
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  viewCategory === 'all'
                    ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                All Tokens
              </button>
              <button
                onClick={() => {
                  feedback('tick');
                  setViewCategory('batch');
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  viewCategory === 'batch'
                    ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                By Academic Batch
              </button>
              <button
                onClick={() => {
                  feedback('tick');
                  setViewCategory('section');
                }}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  viewCategory === 'section'
                    ? 'bg-white dark:bg-[#1a2521] text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                By Dynamic Sections
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Search, Sort, Batch Filter, Dietary Filter & Status Chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search token #, English name, Malayalam, or username..."
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none"
            >
              <option value="token_asc">Token (1 → 197)</option>
              <option value="token_desc">Token (197 → 1)</option>
              <option value="name_asc">Name (A → Z)</option>
              <option value="status_active">Active Meals First</option>
            </select>
          </div>

          {/* Batch Filter Dropdown */}
          <div>
            <select
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none"
            >
              <option value="all">All Batches (1-7)</option>
              <option value="Batch 1">Batch 1 (Tokens 177-197)</option>
              <option value="Batch 2">Batch 2 (Tokens 159-176)</option>
              <option value="Batch 3">Batch 3 (Tokens 128-158)</option>
              <option value="Batch 4">Batch 4 (Tokens 95-127)</option>
              <option value="Batch 5">Batch 5 (Tokens 70-94)</option>
              <option value="Batch 6">Batch 6 (Tokens 36-69)</option>
              <option value="Batch 7">Batch 7 (Tokens 1-35)</option>
            </select>
          </div>

          {/* Dietary Filter Dropdown */}
          <div>
            <select
              value={dietaryFilter}
              onChange={(e) => setDietaryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-200 focus:outline-none"
            >
              <option value="all">All Dietary Preferences</option>
              {preferencesList.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.labelEn} ({p.labelMl})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mr-1">
            Status:
          </span>
          {[
            { id: 'all', label: 'All Tokens' },
            { id: 'active', label: 'Active Serving' },
            { id: 'off', label: 'Canceled / Off' },
            { id: 'leave', label: 'On Leave (Exception)' },
            { id: 'blocked', label: 'Blocked / Locked' },
          ].map((chip) => (
            <button
              key={chip.id}
              onClick={() => {
                feedback('tick');
                setStatusFilter(chip.id);
              }}
              className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === chip.id
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================= TOKEN DISPLAY MATRIX ================= */}
      <div className="min-h-[300px]">
        {filteredDocuments.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/50 dark:bg-[#0f1715]/50 border border-gray-200/60 dark:border-white/5">
            <Filter className="w-8 h-8 mx-auto text-gray-400" />
            <p className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
              No tokens match your search or filter.
            </p>
          </div>
        ) : viewCategory === 'batch' ? (
          /* View Mode 2: Grouped by Academic Batch */
          <div className="space-y-6">
            {Object.entries(groupedByBatch).map(([bName, students]) => {
              if (students.length === 0) return null;
              const isCollapsed = Boolean(collapsedBatches[bName]);
              const activeCount = students.filter((s) => {
                return !s.block && getEffectiveStudentMealStatus(s, todayIST, day, isLunch ? 'lunch' : 'breakfast');
              }).length;

              return (
                <div
                  key={bName}
                  className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden"
                >
                  <button
                    onClick={() => toggleBatchCollapse(bName)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between bg-gray-50/80 dark:bg-white/5 border-b border-gray-200/60 dark:border-white/10 text-left hover:bg-gray-100/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                          {bName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {students.length} Students Total
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                        {activeCount} / {students.length} Active
                      </span>
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="p-4 sm:p-5 flex flex-wrap gap-2 sm:gap-2.5">
                      {students.map((doc) => {
                        const hasDateExc = Boolean(
                          getActiveStudentException(doc, todayIST, isLunch ? 'lunch' : 'breakfast')
                        );
                        const isOn = getEffectiveStudentMealStatus(
                          doc,
                          todayIST,
                          day,
                          isLunch ? 'lunch' : 'breakfast'
                        );

                        return (
                          <TokenButton
                            key={doc.id || doc.tokenNo}
                            doc={doc}
                            isOn={isOn}
                            onLeave={hasDateExc}
                            onClick={handleOpenDetails}
                            onBlockedClick={handleOpenBlocked}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : viewCategory === 'section' ? (
          /* View Mode 3: Dynamic Sections */
          <div className="space-y-6">
            {groupedBySection.map((sec) => {
              const activeCount = sec.students.filter((s) => {
                return !s.block && getEffectiveStudentMealStatus(s, todayIST, day, isLunch ? 'lunch' : 'breakfast');
              }).length;

              return (
                <div
                  key={sec.id}
                  className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden"
                >
                  <div className="p-4 sm:p-5 flex items-center justify-between bg-gray-50/80 dark:bg-white/5 border-b border-gray-200/60 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                        #{sec.id}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                          {sec.title} (Tokens {sec.range})
                        </h3>
                        <p className="text-xs text-gray-500">
                          {sec.students.length} Students in this Section
                        </p>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                      {activeCount} Active
                    </span>
                  </div>

                  <div className="p-4 sm:p-5 flex flex-wrap gap-2 sm:gap-2.5">
                    {sec.students.map((doc) => {
                      const hasDateExc = Boolean(
                        getActiveStudentException(doc, todayIST, isLunch ? 'lunch' : 'breakfast')
                      );
                      const isOn = getEffectiveStudentMealStatus(
                        doc,
                        todayIST,
                        day,
                        isLunch ? 'lunch' : 'breakfast'
                      );

                      return (
                        <TokenButton
                          key={doc.id || doc.tokenNo}
                          doc={doc}
                          isOn={isOn}
                          onLeave={hasDateExc}
                          onClick={handleOpenDetails}
                          onBlockedClick={handleOpenBlocked}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* View Mode 1: All Tokens Grid Matrix */
          <div className="flex flex-wrap justify-center gap-2 min-[380px]:gap-2.5 sm:gap-3 py-2">
            {filteredDocuments.map((doc) => {
              const hasDateExc = Boolean(
                getActiveStudentException(doc, targetDateIST, isLunch ? 'lunch' : 'breakfast')
              );
              const isOn = getEffectiveStudentMealStatus(
                doc,
                targetDateIST,
                day,
                isLunch ? 'lunch' : 'breakfast'
              );

              return (
                <TokenButton
                  key={doc.id || doc.tokenNo}
                  doc={doc}
                  isOn={isOn}
                  onLeave={hasDateExc}
                  onClick={handleOpenDetails}
                  onBlockedClick={handleOpenBlocked}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* ================= MODAL: UPGRADED STUDENT TOKEN DETAILS (Item #9) ================= */}
      <AnimatePresence>
        {detailsDoc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
            onClick={() => setDetailsDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Header Banner */}
              <div className="relative bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-extrabold text-2xl shadow-inner border border-white/30">
                      {detailsDoc.tokenNo}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight">
                          {detailsDoc.nameEn || detailsDoc.name || detailsDoc.uname || `Student #${detailsDoc.tokenNo}`}
                        </h2>
                      </div>
                      {detailsDoc.nameMl && (
                        <p className="text-xs text-emerald-100 font-medium mt-0.5">
                          {detailsDoc.nameMl}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 border border-white/20">
                          {detailsDoc.batch || 'General Batch'}
                        </span>
                        <span className="text-[11px] text-emerald-100 flex items-center gap-1 font-mono">
                          @{detailsDoc.username || `token${detailsDoc.tokenNo}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      feedback('tick');
                      setDetailsDoc(null);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
                {/* Active Date Exception Notice if any for today */}
                {(() => {
                  const activeExc = getActiveStudentException(detailsDoc, todayIST);
                  if (activeExc) {
                    const bfStatus = activeExc.breakfast !== undefined ? (activeExc.breakfast ? 'Taking (ON)' : 'Skipped (OFF)') : null;
                    const luStatus = activeExc.lunch !== undefined ? (activeExc.lunch ? 'Taking (ON)' : 'Skipped (OFF)') : null;
                    return (
                      <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 flex items-start gap-3">
                        <CalendarDays className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                        <div className="text-xs text-amber-900 dark:text-amber-200">
                          <span className="font-bold block">
                            Single-Day Exception Active for Today ({formatFriendlyDate(todayIST)})
                          </span>
                          <span className="block mt-0.5">
                            {bfStatus && <>Breakfast: <strong>{bfStatus}</strong> </>}
                            {luStatus && <>• Lunch: <strong>{luStatus}</strong></>}
                          </span>
                          <span className="text-[11px] opacity-75 block mt-1">
                            Regular weekly dining routine automatically resumes tomorrow.
                          </span>
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Breakfast Schedule Grid */}
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      {t('navBreakfast') || 'Breakfast'} Schedule
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {daysList.map(({ key, label }) => {
                      const active = detailsDoc.obj?.breakfast?.[key] === true;
                      return (
                        <div key={key} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                            {label}
                          </span>
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                              active
                                ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                            }`}
                          >
                            {active ? <Check className="w-4 h-4" /> : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lunch Schedule Grid */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Utensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                      {t('navLunch') || 'Lunch'} Schedule
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {daysList.map(({ key, label }) => {
                      const active = detailsDoc.obj?.lunch?.[key] === true;
                      return (
                        <div key={key} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                            {label}
                          </span>
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                              active
                                ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                            }`}
                          >
                            {active ? <Check className="w-4 h-4" /> : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Dietary Preferences Chip Tags */}
                <div>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-2">
                    Dietary Preferences:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {preferencesList.map((pref) => {
                      const isAccept =
                        detailsDoc.obj2 && detailsDoc.obj2[pref.id] !== undefined
                          ? Boolean(detailsDoc.obj2[pref.id])
                          : true;

                      return (
                        <span
                          key={pref.id}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold ${
                            isAccept
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/40'
                              : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-300/40 line-through opacity-70'
                          }`}
                        >
                          {pref.labelEn}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-white/5">
                  <button
                    onClick={() => {
                      feedback('tick');
                      setDetailsDoc(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    Close
                  </button>

                  <button
                    onClick={() => {
                      feedback('tick');
                      if (!portalStatus.isOpen) {
                        setLockedPortalAlertOpen(true);
                      } else {
                        navigate(`/login?token=${detailsDoc.tokenNo}`);
                      }
                    }}
                    className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 ${
                      portalStatus.isOpen
                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white'
                        : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/50'
                    }`}
                  >
                    {portalStatus.isOpen ? (
                      <>
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Update This Token</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>Locked ({portalStatus.statusBadge})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: LOCKED PORTAL SCHEDULE NOTICE (Item #3) ================= */}
      <AnimatePresence>
        {lockedPortalAlertOpen && (
          <div
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
                  Token Updates are Locked
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                  To ensure kitchen staff can purchase supplies and prepare accurate meal quantities, token updates are accepted daily strictly between <b>2:00 PM</b> and <b>11:00 PM IST</b>.
                </p>
                <div className="mt-3 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-500/20 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  Current Status: {portalStatus.statusBadge}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    feedback('tick');
                    setLockedPortalAlertOpen(false);
                    navigate('/menu');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  View Canteen Menu
                </button>
                <button
                  onClick={() => setLockedPortalAlertOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs"
                >
                  Understood
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: BLOCKED NOTICE (Item #9) ================= */}
      <AnimatePresence>
        {blockedAlertDoc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setBlockedAlertDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0f1715] border border-red-200 dark:border-red-500/20 shadow-2xl p-6 text-center space-y-4"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Token #{blockedAlertDoc.tokenNo} Locked by Admin
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                  This student token has been temporarily suspended by the ADSA Canteen Committee. Meal dining privileges are paused.
                </p>
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                  Please consult the ADSA Office or Canteen Secretary to resolve status.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setBlockedAlertDoc(null)}
                  className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs transition-colors"
                >
                  Close Notice
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SwitchPage;