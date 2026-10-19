import { useState, useEffect, useMemo, useCallback } from 'react';
import firebase from '../firebase/config';
import { useWorldTime } from './time';
import {
  getTodayISTDate,
  addDaysToDate,
  getDayOfWeekShort,
  getActiveStudentException,
  getEffectiveStudentMealStatus,
} from './studentExceptionService';
import { subscribeToPreferences } from './preferenceService';
import { subscribeToCanteenConfig } from './canteenConfigService';

/**
 * Custom hook providing a unified, reactive controller for the Token Board across
 * Public Home and Admin Master Board.
 *
 * Encapsulates:
 * - Real-time Firestore student & dietary preference subscriptions
 * - Multi-field search (Token #, English Name, Malayalam Name, Username, Room, Phone, Batch)
 * - 7-algorithm sorting pipeline
 * - Multi-dimensional filtering (Status, Dynamic Batches, Dietary Preferences)
 * - Categorisation engines (Continuous Matrix, Academic Batch Accordions, Mess Sections of 25)
 * - Live real-time order & dietary headcount analytics
 * - Synchronized IST date shifting & custom date previewing
 */
export function useTokenBoardController(options = {}) {
  const {
    autoEveningShift = false,
    initialMeal = 'lunch',
    initialViewCategory = 'all',
    initialViewDensity = 'matrix',
  } = options;

  // Real-time Data States
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preferencesList, setPreferencesList] = useState([]);
  const [sectionChunkSize, setSectionChunkSize] = useState(25);

  // Meal & Date States
  const [isLunch, setIsLunch] = useState(initialMeal === 'lunch');
  const [dateMode, setDateMode] = useState('auto'); // 'auto' | 'today' | 'tomorrow' | 'custom'
  const [customDate, setCustomDate] = useState('');

  // Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'off' | 'leave' | 'blocked'
  const [batchFilter, setBatchFilter] = useState('all');
  const [dietaryFilter, setDietaryFilter] = useState('all');
  const [sortBy, setSortBy] = useState('token_asc'); // 'token_asc' | 'token_desc' | 'name_asc' | 'name_ml' | 'status_active' | 'status_off' | 'room_asc'

  // Layout & Density States
  const [viewCategory, setViewCategory] = useState(initialViewCategory); // 'all' | 'batch' | 'section'
  const [viewDensity, setViewDensity] = useState(initialViewDensity); // 'matrix' | 'cards'
  const [collapsedBatches, setCollapsedBatches] = useState({});

  // Verified IST Server Clock
  const {
    timeHms,
    time12,
    longDate,
    dayShort,
    dayFull,
    isSynced,
    isDeviceDesynced,
    deviceOffsetMinutes,
  } = useWorldTime('Asia/Kolkata');

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const todayIST = useMemo(() => getTodayISTDate(), [longDate]);

  // Determine target date based on mode and optional autoEveningShift (after 2:00 PM IST)
  const isPostEveningCutoff = Boolean(autoEveningShift && timeHms && timeHms >= '14:00:00');

  const targetDateIST = useMemo(() => {
    if (dateMode === 'today') {
      return todayIST;
    }
    if (dateMode === 'tomorrow') {
      return addDaysToDate(todayIST, 1);
    }
    if (dateMode === 'custom' && customDate) {
      return customDate;
    }
    // 'auto' mode: If autoEveningShift is enabled and past 2:00 PM, show tomorrow by default
    if (isPostEveningCutoff) {
      return addDaysToDate(todayIST, 1);
    }
    return todayIST;
  }, [dateMode, customDate, todayIST, isPostEveningCutoff]);

  // Effective 2-letter lowercase day for schedule resolution ('su'..'sa')
  const effectiveDay = useMemo(() => {
    return getDayOfWeekShort(targetDateIST);
  }, [targetDateIST]);

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
          console.error('Error in useTokenBoardController students subscription:', error);
          setLoading(false);
        }
      );

    const unsubPrefs = subscribeToPreferences((list) => {
      setPreferencesList(list.filter((p) => p.isActive));
    });

    const unsubCanteen = subscribeToCanteenConfig((cfg) => {
      if (cfg?.sectionChunkSize) {
        setSectionChunkSize(cfg.sectionChunkSize);
      }
    });

    return () => {
      unsubStudents();
      unsubPrefs();
      unsubCanteen();
    };
  }, []);

  // Dynamically extract all unique batches present in the database with student counts
  const allBatches = useMemo(() => {
    const batchCountMap = {};
    documents.forEach((doc) => {
      const b = (doc.batch && doc.batch.trim()) || 'General';
      batchCountMap[b] = (batchCountMap[b] || 0) + 1;
    });

    return Object.keys(batchCountMap)
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
      .map((name) => ({
        name,
        count: batchCountMap[name],
      }));
  }, [documents]);

  // Extract all existing numeric tokens
  const allTokens = useMemo(() => {
    return documents.map((d) => Number(d.tokenNo)).filter((n) => !isNaN(n));
  }, [documents]);

  // Global Headcount Calculations across the full database for target date
  const metrics = useMemo(() => {
    let lunchCount = 0;
    let breakfastCount = 0;
    let activeCurrent = 0;
    let offCurrent = 0;
    let leaveCurrent = 0;
    let blockedCount = 0;

    const dietaryTallies = {};
    preferencesList.forEach((pref) => {
      dietaryTallies[pref.id] = 0;
      dietaryTallies[`${pref.id}_avoiders`] = 0;
    });

    const activeMealKey = isLunch ? 'lunch' : 'breakfast';

    documents.forEach((doc) => {
      const isBlocked = Boolean(doc.block);
      if (isBlocked) blockedCount++;

      const isMealActive = !isBlocked && getEffectiveStudentMealStatus(doc, targetDateIST, effectiveDay, activeMealKey);
      const isLunchActive = !isBlocked && getEffectiveStudentMealStatus(doc, targetDateIST, effectiveDay, 'lunch');
      const isBfActive = !isBlocked && getEffectiveStudentMealStatus(doc, targetDateIST, effectiveDay, 'breakfast');
      const hasDateExc = Boolean(getActiveStudentException(doc, targetDateIST, activeMealKey));

      if (isLunchActive) lunchCount++;
      if (isBfActive) breakfastCount++;

      if (hasDateExc) {
        leaveCurrent++;
      }

      if (!isBlocked) {
        if (isMealActive) {
          activeCurrent++;
        } else {
          offCurrent++;
        }
      }

      // Compute dietary tallies for currently active diners
      if (isMealActive) {
        preferencesList.forEach((pref) => {
          const eats = doc.obj2 && doc.obj2[pref.id] !== undefined ? Boolean(doc.obj2[pref.id]) : true;
          if (eats) {
            dietaryTallies[pref.id] = (dietaryTallies[pref.id] || 0) + 1;
          } else {
            dietaryTallies[`${pref.id}_avoiders`] = (dietaryTallies[`${pref.id}_avoiders`] || 0) + 1;
          }
        });
      }
    });

    const total = documents.length;
    const activePercentage = total > 0 ? Number(((activeCurrent / total) * 100).toFixed(1)) : 0;

    return {
      total,
      lunchCount,
      breakfastCount,
      currentMealCount: isLunch ? lunchCount : breakfastCount,
      activeCount: activeCurrent,
      offCount: offCurrent,
      leaveCount: leaveCurrent,
      blockedCount,
      activePercentage,
      dietaryTallies,
    };
  }, [documents, targetDateIST, effectiveDay, isLunch, preferencesList]);

  // Reactive Multi-Dimensional Filtering & Sorting Pipeline
  const filteredDocuments = useMemo(() => {
    const mealKey = isLunch ? 'lunch' : 'breakfast';
    const q = searchQuery.toLowerCase().trim();

    return documents
      .filter((doc) => {
        // 1. Multi-Field Search Matching
        if (q) {
          const tokenStr = String(doc.tokenNo || '');
          const matchToken = tokenStr === q || tokenStr.includes(q);
          const matchEn = (doc.nameEn || doc.name || '').toLowerCase().includes(q);
          const matchMl = (doc.nameMl || '').toLowerCase().includes(q);
          const matchUname = (doc.username || doc.uname || '').toLowerCase().includes(q);
          const matchRoom = (doc.roomNo || '').toLowerCase().includes(q);
          const matchPhone = (doc.phone || '').toLowerCase().includes(q);
          const matchBatch = (doc.batch || '').toLowerCase().includes(q);

          if (
            !matchToken &&
            !matchEn &&
            !matchMl &&
            !matchUname &&
            !matchRoom &&
            !matchPhone &&
            !matchBatch
          ) {
            return false;
          }
        }

        // 2. Batch Filter Matching
        if (batchFilter !== 'all') {
          const docBatch = (doc.batch && doc.batch.trim()) || 'General';
          if (docBatch !== batchFilter) return false;
        }

        // 3. Dietary Preferences Filter Matching
        if (dietaryFilter !== 'all') {
          if (doc.obj2 && doc.obj2[dietaryFilter] === false) {
            return false;
          }
        }

        // 4. Status Filter Matching
        const isBlocked = Boolean(doc.block);
        const hasDateExc = Boolean(getActiveStudentException(doc, targetDateIST, mealKey));
        const isOn = getEffectiveStudentMealStatus(doc, targetDateIST, effectiveDay, mealKey);

        if (statusFilter === 'active') return isOn && !isBlocked;
        if (statusFilter === 'off') return !isOn && !isBlocked;
        if (statusFilter === 'blocked') return isBlocked;
        if (statusFilter === 'leave') return hasDateExc;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'token_asc') return (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0);
        if (sortBy === 'token_desc') return (Number(b.tokenNo) || 0) - (Number(a.tokenNo) || 0);

        if (sortBy === 'name_asc') {
          const nameA = a.nameEn || a.name || '';
          const nameB = b.nameEn || b.name || '';
          return nameA.localeCompare(nameB);
        }

        if (sortBy === 'name_ml') {
          const nameA = a.nameMl || a.nameEn || '';
          const nameB = b.nameMl || b.nameEn || '';
          return nameA.localeCompare(nameB, 'ml');
        }

        if (sortBy === 'room_asc') {
          const roomA = a.roomNo || '';
          const roomB = b.roomNo || '';
          return roomA.localeCompare(roomB, undefined, { numeric: true, sensitivity: 'base' });
        }

        if (sortBy === 'status_active') {
          const onA = !a.block && getEffectiveStudentMealStatus(a, targetDateIST, effectiveDay, mealKey);
          const onB = !b.block && getEffectiveStudentMealStatus(b, targetDateIST, effectiveDay, mealKey);
          return (onB ? 1 : 0) - (onA ? 1 : 0);
        }

        if (sortBy === 'status_off') {
          const onA = !a.block && getEffectiveStudentMealStatus(a, targetDateIST, effectiveDay, mealKey);
          const onB = !b.block && getEffectiveStudentMealStatus(b, targetDateIST, effectiveDay, mealKey);
          return (onA ? 1 : 0) - (onB ? 1 : 0);
        }

        return 0;
      });
  }, [
    documents,
    searchQuery,
    batchFilter,
    dietaryFilter,
    statusFilter,
    sortBy,
    isLunch,
    targetDateIST,
    effectiveDay,
  ]);

  // Grouping Mode 2: By Academic Batch (Dynamic)
  const groupedByBatch = useMemo(() => {
    const groups = {};
    allBatches.forEach((b) => {
      groups[b.name] = [];
    });

    filteredDocuments.forEach((doc) => {
      const b = (doc.batch && doc.batch.trim()) || 'General';
      if (!groups[b]) groups[b] = [];
      groups[b].push(doc);
    });

    return groups;
  }, [allBatches, filteredDocuments]);

  // Grouping Mode 3: By Mess Distribution Sections (Chunks dynamically configured in DB)
  const groupedBySection = useMemo(() => {
    const sectionSize = sectionChunkSize || 25;
    const sections = [];
    const totalSections = Math.ceil(filteredDocuments.length / sectionSize);
    const mealKey = isLunch ? 'lunch' : 'breakfast';

    for (let i = 0; i < totalSections; i++) {
      const start = i * sectionSize;
      const end = Math.min((i + 1) * sectionSize, filteredDocuments.length);
      const slice = filteredDocuments.slice(start, end);

      const sectionActiveCount = slice.filter(
        (doc) => !doc.block && getEffectiveStudentMealStatus(doc, targetDateIST, effectiveDay, mealKey)
      ).length;

      sections.push({
        id: i + 1,
        title: `Mess Section ${i + 1}`,
        range: `${slice[0]?.tokenNo || ''} – ${slice[slice.length - 1]?.tokenNo || ''}`,
        students: slice,
        activeCount: sectionActiveCount,
        totalCount: slice.length,
      });
    }

    return sections;
  }, [filteredDocuments, isLunch, targetDateIST, effectiveDay, sectionChunkSize]);

  // Track active non-default filter counts
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim()) count++;
    if (statusFilter !== 'all') count++;
    if (batchFilter !== 'all') count++;
    if (dietaryFilter !== 'all') count++;
    if (sortBy !== 'token_asc') count++;
    return count;
  }, [searchQuery, statusFilter, batchFilter, dietaryFilter, sortBy]);

  // User Actions
  const toggleMeal = useCallback((mealType) => {
    setIsLunch(mealType === 'lunch');
  }, []);

  const resetAllFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setBatchFilter('all');
    setDietaryFilter('all');
    setSortBy('token_asc');
  }, []);

  const toggleBatchCollapse = useCallback((batchName) => {
    setCollapsedBatches((prev) => ({
      ...prev,
      [batchName]: !prev[batchName],
    }));
  }, []);

  const collapseAllBatches = useCallback(() => {
    const all = {};
    allBatches.forEach((b) => {
      all[b.name] = true;
    });
    setCollapsedBatches(all);
  }, [allBatches]);

  const expandAllBatches = useCallback(() => {
    setCollapsedBatches({});
  }, []);

  const setDateToToday = useCallback(() => {
    setDateMode('today');
    setCustomDate('');
  }, []);

  const setDateToTomorrow = useCallback(() => {
    setDateMode('tomorrow');
    setCustomDate('');
  }, []);

  const setDateToCustom = useCallback((dateStr) => {
    if (dateStr) {
      setDateMode('custom');
      setCustomDate(dateStr);
    }
  }, []);

  return {
    // Data & Loading
    documents,
    filteredDocuments,
    loading,
    preferencesList,
    allBatches,
    allTokens,

    // Meal & Date States
    isLunch,
    toggleMeal,
    dateMode,
    targetDateIST,
    todayIST,
    effectiveDay,
    setDateToToday,
    setDateToTomorrow,
    setDateToCustom,
    isPostEveningCutoff,

    // Clock & Anti-Tamper IST
    timeHms,
    time12,
    longDate,
    dayShort,
    dayFull,
    isSynced,
    isDeviceDesynced,
    deviceOffsetMinutes,

    // Search, Filter & Sort States
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
    resetAllFilters,
    activeFilterCount,
    hasActiveFilters: activeFilterCount > 0,

    // Layout, Density & Grouping States
    viewCategory,
    setViewCategory,
    viewDensity,
    setViewDensity,
    groupedByBatch,
    groupedBySection,
    sectionChunkSize,
    collapsedBatches,
    toggleBatchCollapse,
    collapseAllBatches,
    expandAllBatches,

    // Real-Time Analytics & Headcounts
    metrics,
  };
}

export default useTokenBoardController;
