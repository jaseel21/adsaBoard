import { useState, useEffect, useMemo, useCallback } from 'react';
import firebase from '../firebase/config';
import { useWorldTime } from './time';
import {
  getTodayISTDate,
  addDaysToDate,
  getDayOfWeekShort,
  getActiveStudentException,
  getEffectiveStudentMealStatus,
  isPastBoardSwitchTime,
  isPastBoardWindowOpenTime,
  getDefaultBoardDayOffset,
  getRelativeDateMeta,
} from './studentExceptionService';
import { subscribeToPreferences } from './preferenceService';
import { subscribeToCanteenConfig } from './canteenConfigService';
import { useTokenLockStatus } from './useTokenLockStatus';
import { useAcademicYear, clampDateToAcademicYear } from './academicYearService';
import {
  subscribeToBoardNotices,
  getNoticesForDate,
  isCanteenClosedForDate as isCanteenClosedForDateHelper,
} from './boardNoticeService';
import {
  subscribeToBoardServiceSchedule,
  getMealSupplyStatus,
  FOOD_SUPPLY_REASONS,
} from './boardServiceSchedule';

/**
 * Custom hook providing a unified, reactive controller for the Token Board across
 * Public Home and Admin Master Board.
 *
 * Encapsulates:
 * - Real-time Firestore student & dietary preference subscriptions
 * - Multi-field search (Token, English Name, Malayalam Name, Username, Email, Phone, Batch)
 * - 6-algorithm sorting pipeline
 * - Multi-dimensional filtering (Status, Dynamic Batches, Dietary Preferences)
 * - Categorisation engines (Continuous Matrix, Academic Batch Accordions, Mess Sections of 25)
 * - Live real-time order & dietary headcount analytics
 * - Synchronized IST date shifting & custom date previewing
 */
export function useTokenBoardController(options = {}) {
  const {
    autoEveningShift = true,
    initialMeal = 'breakfast',
    initialViewCategory = 'all',
    initialViewDensity = 'matrix',
    boardSwitchTime = null,
    windowOpenTime = null,
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
  const [sortBy, setSortBy] = useState('token_asc'); // 'token_asc' | 'token_desc' | 'name_asc' | 'name_ml' | 'status_active' | 'status_off'

  // Layout & Density States
  const [viewCategory, setViewCategory] = useState(initialViewCategory); // 'all' | 'batch' | 'section' | 'dietary'
  const [viewDensity, setViewDensity] = useState(initialViewDensity); // 'matrix' | 'cards'
  const [collapsedBatches, setCollapsedBatches] = useState({});
  const [collapsedDietary, setCollapsedDietary] = useState({});

  // Board Notice Notes & Operational Events State
  const [boardNotices, setBoardNotices] = useState([]);

  // Board Food Supply Schedule State (settings/board_service)
  const [boardServiceSchedule, setBoardServiceSchedule] = useState({});

  // Multi-Selection States (Tactical Board Operations)
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedTokens, setSelectedTokens] = useState([]);

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
    todayIST: worldTodayIST,
  } = useWorldTime('Asia/Kolkata');

  // Real-time Token Board Cutoff & Window Configuration
  const { activeWindow, rawBoardSwitchTime, boardSwitchTime: statusBoardSwitchTime } = useTokenLockStatus();
  const { academicYear, startDate: acadStartDate, endDate: acadEndDate } = useAcademicYear();

  const todayIST = useMemo(() => worldTodayIST || getTodayISTDate(), [worldTodayIST]);

  // Determine target date based on mode and dynamic board switch time (e.g. 2:00 PM regular / 2:15 PM Friday):
  // 12:00 AM - Board Switch Time: Today
  // Board Switch Time - 11:59 PM: Tomorrow
  const effectiveSwitchTime = boardSwitchTime || windowOpenTime || rawBoardSwitchTime || '14:00';
  const isPostEveningCutoff = Boolean(
    autoEveningShift && isPastBoardSwitchTime(timeHms, effectiveSwitchTime)
  );

  const rawTargetDate = useMemo(() => {
    if (dateMode === 'today') {
      return todayIST;
    }
    if (dateMode === 'tomorrow') {
      return addDaysToDate(todayIST, 1);
    }
    if (dateMode === 'custom' && customDate) {
      return customDate;
    }
    // 'auto' mode:
    // If past window open time (e.g. 2:00 PM), show tomorrow by default
    // Otherwise before open time (12:00 AM - 2:00 PM), show today by default
    if (isPostEveningCutoff) {
      return addDaysToDate(todayIST, 1);
    }
    return todayIST;
  }, [dateMode, customDate, todayIST, isPostEveningCutoff]);

  // Clamped strictly within academic year boundaries
  const targetDateIST = useMemo(() => {
    if (!academicYear) return rawTargetDate;
    if (acadStartDate && rawTargetDate < acadStartDate) {
      return acadStartDate;
    }
    if (acadEndDate && rawTargetDate > acadEndDate) {
      return acadEndDate;
    }
    return rawTargetDate;
  }, [rawTargetDate, academicYear, acadStartDate, acadEndDate]);

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

    const unsubNotices = subscribeToBoardNotices((notices) => {
      setBoardNotices(notices);
    });

    const unsubSupply = subscribeToBoardServiceSchedule((schedule) => {
      setBoardServiceSchedule(schedule || {});
    });

    return () => {
      unsubStudents();
      unsubPrefs();
      unsubCanteen();
      unsubNotices();
      unsubSupply();
    };
  }, []);

  // Dynamically extract all unique batches present in the database with student counts
  const allBatches = useMemo(() => {
    const batchCountMap = {};
    documents.forEach((doc) => {
      const raw = doc.batch ? doc.batch.trim() : '';
      const b = raw || 'Unassigned';
      batchCountMap[b] = (batchCountMap[b] || 0) + 1;
    });

    return Object.keys(batchCountMap)
      .sort((a, b) => {
        if (a === 'Unassigned') return 1;
        if (b === 'Unassigned') return -1;
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
      })
      .map((name) => ({
        name,
        count: batchCountMap[name],
        isUnassigned: name === 'Unassigned',
      }));
  }, [documents]);

  // Extract all existing numeric tokens
  const allTokens = useMemo(() => {
    return documents.map((d) => Number(d.tokenNo)).filter((n) => !isNaN(n));
  }, [documents]);

  // Active Meal Key
  const activeMealKey = isLunch ? 'lunch' : 'breakfast';

  // Board Food Supply Operational Statuses (settings/board_service)
  const currentMealSupplyStatus = useMemo(() => {
    return getMealSupplyStatus(boardServiceSchedule, targetDateIST, activeMealKey);
  }, [boardServiceSchedule, targetDateIST, activeMealKey]);

  const breakfastSupplyStatus = useMemo(() => {
    return getMealSupplyStatus(boardServiceSchedule, targetDateIST, 'breakfast');
  }, [boardServiceSchedule, targetDateIST]);

  const lunchSupplyStatus = useMemo(() => {
    return getMealSupplyStatus(boardServiceSchedule, targetDateIST, 'lunch');
  }, [boardServiceSchedule, targetDateIST]);

  const isBoardSupplyActive = currentMealSupplyStatus.isSupplying !== false;
  const isBreakfastSupplyActive = breakfastSupplyStatus.isSupplying !== false;
  const isLunchSupplyActive = lunchSupplyStatus.isSupplying !== false;
  const isEntireDaySupplyOff = !isBreakfastSupplyActive && !isLunchSupplyActive;

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
      dietaryTallies[`${pref.id}_avoiders_total`] = 0;
    });

    let totalAvoidersRoster = 0;
    let totalAvoidersActiveMeal = 0;
    let standardFullDietActiveCount = 0;

    documents.forEach((doc) => {
      const isBlocked = Boolean(doc.block);
      if (isBlocked) blockedCount++;

      const isMealActive = !isBlocked && getEffectiveStudentMealStatus(doc, targetDateIST, effectiveDay, activeMealKey);
      const isLunchActive = !isBlocked && getEffectiveStudentMealStatus(doc, targetDateIST, effectiveDay, 'lunch');
      const isBfActive = !isBlocked && getEffectiveStudentMealStatus(doc, targetDateIST, effectiveDay, 'breakfast');
      const hasDateExc = Boolean(getActiveStudentException(doc, targetDateIST, activeMealKey));

      const obj2 = doc.obj2 || {};
      const hasAnyAvoidance = Object.values(obj2).some((v) => v === false);
      if (hasAnyAvoidance) {
        totalAvoidersRoster++;
      }

      // Tally roster-wide avoiders per category
      preferencesList.forEach((pref) => {
        if (obj2[pref.id] === false) {
          dietaryTallies[`${pref.id}_avoiders_total`] = (dietaryTallies[`${pref.id}_avoiders_total`] || 0) + 1;
        }
      });

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
        if (hasAnyAvoidance) {
          totalAvoidersActiveMeal++;
        } else {
          standardFullDietActiveCount++;
        }

        preferencesList.forEach((pref) => {
          const eats = obj2[pref.id] !== undefined ? Boolean(obj2[pref.id]) : true;
          if (eats) {
            dietaryTallies[pref.id] = (dietaryTallies[pref.id] || 0) + 1;
          } else {
            dietaryTallies[`${pref.id}_avoiders`] = (dietaryTallies[`${pref.id}_avoiders`] || 0) + 1;
          }
        });
      }
    });

    const total = documents.length;
    // When food supply in canteen is OFF, operational active headcount served is 0
    const effectiveLunchCount = isLunchSupplyActive ? lunchCount : 0;
    const effectiveBreakfastCount = isBreakfastSupplyActive ? breakfastCount : 0;
    const effectiveActiveCurrent = isBoardSupplyActive ? activeCurrent : 0;
    const effectiveMealCount = isLunch ? effectiveLunchCount : effectiveBreakfastCount;
    const activePercentage = total > 0 ? Number(((effectiveActiveCurrent / total) * 100).toFixed(1)) : 0;

    return {
      total,
      rawLunchCount: lunchCount,
      rawBreakfastCount: breakfastCount,
      rawCurrentMealCount: isLunch ? lunchCount : breakfastCount,
      lunchCount: effectiveLunchCount,
      breakfastCount: effectiveBreakfastCount,
      currentMealCount: effectiveMealCount,
      activeCount: effectiveActiveCurrent,
      offCount: isBoardSupplyActive ? offCurrent : total - blockedCount,
      leaveCount: leaveCurrent,
      blockedCount,
      activePercentage,
      totalAvoiders: isBoardSupplyActive ? totalAvoidersActiveMeal : 0,
      totalAvoidersRoster,
      standardFullDietCount: isBoardSupplyActive ? standardFullDietActiveCount : 0,
      dietaryTallies,
      isSupplySuspended: !isBoardSupplyActive,
      supplyNotice: currentMealSupplyStatus,
    };
  }, [
    documents,
    targetDateIST,
    effectiveDay,
    isLunch,
    activeMealKey,
    preferencesList,
    isBoardSupplyActive,
    isBreakfastSupplyActive,
    isLunchSupplyActive,
    currentMealSupplyStatus,
  ]);

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
          const matchPhone = (doc.phone || '').toLowerCase().includes(q);
          const matchEmail = (doc.email || '').toLowerCase().includes(q);
          const matchBatch = (doc.batch || '').toLowerCase().includes(q);

          if (
            !matchToken &&
            !matchEn &&
            !matchMl &&
            !matchUname &&
            !matchPhone &&
            !matchEmail &&
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
        if (dietaryFilter && dietaryFilter !== 'all') {
          const obj2 = doc.obj2 || {};
          const hasAnyAvoidance = Object.values(obj2).some((v) => v === false);

          if (dietaryFilter === 'any_avoiders') {
            if (!hasAnyAvoidance) return false;
          } else if (dietaryFilter === 'standard_full') {
            if (hasAnyAvoidance) return false;
          } else {
            const targetPref = dietaryFilter.startsWith('avoid_')
              ? dietaryFilter.replace('avoid_', '')
              : dietaryFilter;
            if (obj2[targetPref] !== false) {
              return false;
            }
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
      const raw = doc.batch ? doc.batch.trim() : '';
      const b = raw || 'Unassigned';
      if (!groups[b]) groups[b] = [];
      groups[b].push(doc);
    });

    const mealKey = isLunch ? 'lunch' : 'breakfast';
    const list = Object.entries(groups).map(([name, students]) => {
      const activeCount = students.filter(
        (doc) => !doc.block && getEffectiveStudentMealStatus(doc, targetDateIST, effectiveDay, mealKey)
      ).length;
      return {
        name,
        students,
        activeCount,
        totalCount: students.length,
      };
    });

    // Provide non-enumerable array methods so groupedByBatch can be mapped or iterated directly as an array
    // while Object.entries(groupedByBatch) continues to yield [batchName, students] for Admin and Radar
    Object.defineProperty(groups, 'map', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function (callback) {
        return list.map(callback);
      },
    });

    Object.defineProperty(groups, 'forEach', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function (callback) {
        return list.forEach(callback);
      },
    });

    Object.defineProperty(groups, 'filter', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function (callback) {
        return list.filter(callback);
      },
    });

    Object.defineProperty(groups, 'list', {
      enumerable: false,
      configurable: true,
      writable: true,
      value: list,
    });

    Object.defineProperty(groups, Symbol.iterator, {
      enumerable: false,
      configurable: true,
      writable: true,
      value: function* () {
        yield* list;
      },
    });

    return groups;
  }, [allBatches, filteredDocuments, isLunch, targetDateIST, effectiveDay]);

  const groupedByBatchList = useMemo(() => {
    return groupedByBatch.list || [];
  }, [groupedByBatch]);

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

  // Grouping Mode 4: By Dietary Preferences / Avoiders
  const groupedByDietary = useMemo(() => {
    const mealKey = isLunch ? 'lunch' : 'breakfast';
    const groups = [];

    const getActiveCount = (students) => {
      return students.filter(
        (doc) => !doc.block && getEffectiveStudentMealStatus(doc, targetDateIST, effectiveDay, mealKey)
      ).length;
    };

    // 1. Individual Preference Groups (Beef, Fish, Chicken, Mutton, etc.)
    preferencesList.forEach((pref) => {
      const avoiders = filteredDocuments.filter(
        (doc) => doc.obj2 && doc.obj2[pref.id] === false
      );

      if (avoiders.length > 0) {
        groups.push({
          id: `pref_${pref.id}`,
          prefId: pref.id,
          name: `${pref.labelEn || pref.name || pref.id} Avoiders`,
          nameMl: `${pref.labelMl || pref.name || pref.id} ഒഴിവാക്കുന്നവർ`,
          subtitle: pref.labelEn || pref.name || pref.id,
          icon: pref.icon || pref.id,
          students: avoiders,
          activeCount: getActiveCount(avoiders),
          totalCount: avoiders.length,
          type: 'avoidance',
        });
      }
    });

    // 2. Multi-Item Avoiders (students who avoid 2 or more food items)
    const multiAvoiders = filteredDocuments.filter((doc) => {
      const obj2 = doc.obj2 || {};
      const avoidCount = Object.values(obj2).filter((v) => v === false).length;
      return avoidCount >= 2;
    });

    if (multiAvoiders.length > 0) {
      groups.push({
        id: 'multi_avoiders',
        prefId: 'multi',
        name: 'Multi-Item Avoiders',
        nameMl: 'ഒന്നിലധികം ഒഴിവാക്കലുകൾ',
        subtitle: 'Students with 2+ food exclusions',
        icon: 'Layers',
        students: multiAvoiders,
        activeCount: getActiveCount(multiAvoiders),
        totalCount: multiAvoiders.length,
        type: 'multi',
      });
    }

    // 3. Standard Full Diet (students with no dietary exclusions)
    const standardStudents = filteredDocuments.filter((doc) => {
      const obj2 = doc.obj2 || {};
      return Object.values(obj2).every((v) => v !== false);
    });

    if (standardStudents.length > 0) {
      groups.push({
        id: 'standard_full',
        prefId: 'standard',
        name: 'Standard Full Diet',
        nameMl: 'പൂർണ്ണ ഭക്ഷണം',
        subtitle: 'No food restrictions / All items accepted',
        icon: 'CheckCircle2',
        students: standardStudents,
        activeCount: getActiveCount(standardStudents),
        totalCount: standardStudents.length,
        type: 'standard',
      });
    }

    return groups;
  }, [preferencesList, filteredDocuments, isLunch, targetDateIST, effectiveDay]);

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

  const toggleDietaryCollapse = useCallback((groupId) => {
    setCollapsedDietary((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  }, []);

  const collapseAllDietary = useCallback(() => {
    const all = {};
    groupedByDietary.forEach((g) => {
      all[g.id] = true;
    });
    setCollapsedDietary(all);
  }, [groupedByDietary]);

  const expandAllDietary = useCallback(() => {
    setCollapsedDietary({});
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
      const clamped = clampDateToAcademicYear(dateStr, academicYear);
      setDateMode('custom');
      setCustomDate(clamped);
    }
  }, [academicYear]);

  const relativeDateMeta = useMemo(() => {
    return getRelativeDateMeta(targetDateIST, todayIST);
  }, [targetDateIST, todayIST]);

  const canStepBackward = useMemo(() => {
    if (!acadStartDate) return true;
    return targetDateIST > acadStartDate;
  }, [targetDateIST, acadStartDate]);

  const canStepForward = useMemo(() => {
    if (!acadEndDate) return true;
    return targetDateIST < acadEndDate;
  }, [targetDateIST, acadEndDate]);

  const shiftDate = useCallback((days) => {
    if (!days || isNaN(days)) return;
    const nextDate = addDaysToDate(targetDateIST, days);
    const clamped = clampDateToAcademicYear(nextDate, academicYear);
    setDateMode('custom');
    setCustomDate(clamped);
  }, [targetDateIST, academicYear]);

  const stepDateBackward = useCallback(() => {
    if (!canStepBackward) return;
    shiftDate(-1);
  }, [canStepBackward, shiftDate]);

  const stepDateForward = useCallback(() => {
    if (!canStepForward) return;
    shiftDate(1);
  }, [canStepForward, shiftDate]);

  const setDateToAuto = useCallback(() => {
    setDateMode('auto');
    setCustomDate('');
  }, []);

  // Filter active notices matching current target date and meal
  const activeMealType = isLunch ? 'lunch' : 'breakfast';
  const rawNoticesForDate = useMemo(() => {
    return getNoticesForDate(boardNotices, targetDateIST, activeMealType);
  }, [boardNotices, targetDateIST, activeMealType]);

  const activeNoticeForDate = useMemo(() => {
    const rawNotice = rawNoticesForDate[0] || null;
    if (rawNotice) {
      return {
        ...rawNotice,
        isSupplyOff: !isBoardSupplyActive,
        supplyStatus: currentMealSupplyStatus,
      };
    }
    if (!isBoardSupplyActive) {
      const rObj = currentMealSupplyStatus.reasonObj || {};
      return {
        id: `supply_${targetDateIST}_${activeMealType}`,
        category: currentMealSupplyStatus.reasonKey || 'temporary_close',
        title: currentMealSupplyStatus.noteEn || rObj.labelEn || 'Canteen Food Supply Suspended',
        titleMl: currentMealSupplyStatus.noteMl || rObj.labelMl || 'കാന്റീൻ ഭക്ഷണ വിതരണം നിർത്തിവെച്ചിരിക്കുന്നു',
        badgeText: rObj.badgeMl || 'ഭക്ഷണം ലഭ്യമല്ല',
        badgeTextEn: rObj.badgeEn || 'No Food Supply',
        severity: rObj.severity || 'critical',
        mealScope: isEntireDaySupplyOff ? 'both' : activeMealType,
        canteenStatus: 'closed',
        description: currentMealSupplyStatus.descEn || rObj.descEn || 'Canteen food supply is suspended for this meal.',
        descriptionMl: currentMealSupplyStatus.descMl || rObj.descMl || 'ഈ സമയത്ത് കാന്റീൻ പ്രവർത്തനം ഉണ്ടായിരിക്കുന്നതല്ല.',
        isSupplyOff: true,
        supplyStatus: currentMealSupplyStatus,
      };
    }
    return null;
  }, [rawNoticesForDate, isBoardSupplyActive, currentMealSupplyStatus, targetDateIST, activeMealType, isEntireDaySupplyOff]);

  const activeNoticesForDate = useMemo(() => {
    if (activeNoticeForDate) return [activeNoticeForDate];
    return rawNoticesForDate;
  }, [activeNoticeForDate, rawNoticesForDate]);

  const isCanteenClosedForDate = useMemo(() => {
    if (!isBoardSupplyActive) return true;
    return isCanteenClosedForDateHelper(boardNotices, targetDateIST, activeMealType);
  }, [isBoardSupplyActive, boardNotices, targetDateIST, activeMealType]);

  // Multi-Selection Engines
  const selectedTokenIds = useMemo(() => {
    return new Set(selectedTokens.map((t) => t.id || String(t.tokenNo)));
  }, [selectedTokens]);

  const isTokenSelected = useCallback(
    (doc) => {
      if (!doc) return false;
      return selectedTokenIds.has(doc.id || String(doc.tokenNo));
    },
    [selectedTokenIds]
  );

  const toggleSelectMode = useCallback((forcedVal = null) => {
    setIsSelectMode((prev) => {
      const next = typeof forcedVal === 'boolean' ? forcedVal : !prev;
      if (!next) {
        setSelectedTokens([]);
      }
      return next;
    });
  }, []);

  const toggleTokenSelection = useCallback((doc) => {
    if (!doc) return;
    setSelectedTokens((prev) => {
      const docKey = doc.id || String(doc.tokenNo);
      const exists = prev.some((t) => (t.id || String(t.tokenNo)) === docKey);
      if (exists) {
        return prev.filter((t) => (t.id || String(t.tokenNo)) !== docKey);
      }
      return [...prev, doc];
    });
  }, []);

  const selectTokens = useCallback((tokensList) => {
    if (!Array.isArray(tokensList)) return;
    setSelectedTokens(tokensList);
  }, []);

  const selectAll = useCallback((list = null) => {
    const targetList = list || filteredDocuments;
    setSelectedTokens([...targetList]);
  }, [filteredDocuments]);

  const clearSelection = useCallback(() => {
    setSelectedTokens([]);
  }, []);

  const selectBatch = useCallback((batchName) => {
    if (!batchName) return;
    const batchMatches = documents.filter((s) => (s.batch?.trim() || 'Unassigned') === batchName);
    setSelectedTokens((prev) => {
      const existingKeys = new Set(prev.map((t) => t.id || String(t.tokenNo)));
      const newItems = batchMatches.filter((s) => !existingKeys.has(s.id || String(s.tokenNo)));
      return [...prev, ...newItems];
    });
  }, [documents]);

  const selectSection = useCallback((sectionStudents) => {
    if (!Array.isArray(sectionStudents)) return;
    setSelectedTokens((prev) => {
      const existingKeys = new Set(prev.map((t) => t.id || String(t.tokenNo)));
      const newItems = sectionStudents.filter((s) => !existingKeys.has(s.id || String(s.tokenNo)));
      return [...prev, ...newItems];
    });
  }, []);

  const selectByMealStatus = useCallback((statusType = 'on') => {
    const mealKey = isLunch ? 'lunch' : 'breakfast';
    const matches = filteredDocuments.filter((s) => {
      const isOn = getEffectiveStudentMealStatus(s, targetDateIST, effectiveDay, mealKey);
      return statusType === 'on' ? isOn : !isOn;
    });
    setSelectedTokens(matches);
  }, [filteredDocuments, isLunch, targetDateIST, effectiveDay]);

  const selectTokenRange = useCallback((fromDoc, toDoc) => {
    if (!fromDoc || !toDoc) return;
    const fromIdx = filteredDocuments.findIndex(
      (s) => (s.id || String(s.tokenNo)) === (fromDoc.id || String(fromDoc.tokenNo))
    );
    const toIdx = filteredDocuments.findIndex(
      (s) => (s.id || String(s.tokenNo)) === (toDoc.id || String(toDoc.tokenNo))
    );
    if (fromIdx === -1 || toIdx === -1) return;

    const start = Math.min(fromIdx, toIdx);
    const end = Math.max(fromIdx, toIdx);
    const rangeList = filteredDocuments.slice(start, end + 1);

    setSelectedTokens((prev) => {
      const existingKeys = new Set(prev.map((t) => t.id || String(t.tokenNo)));
      const newItems = rangeList.filter((s) => !existingKeys.has(s.id || String(s.tokenNo)));
      return [...prev, ...newItems];
    });
  }, [filteredDocuments]);

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
    setDateToAuto,
    shiftDate,
    stepDateBackward,
    stepDateForward,
    relativeDateMeta,
    isYesterday: relativeDateMeta.isYesterday,
    isPastDate: relativeDateMeta.isPast,
    isFutureDate: relativeDateMeta.isFuture,
    isPostEveningCutoff,
    boardSwitchTime: effectiveSwitchTime,
    isPastBoardSwitch: isPostEveningCutoff,

    // Academic Year Boundaries
    academicYear,
    academicYearStartDate: acadStartDate,
    academicYearEndDate: acadEndDate,
    canStepBackward,
    canStepForward,
    isAtAcademicYearStart: Boolean(acadStartDate && targetDateIST === acadStartDate),
    isAtAcademicYearEnd: Boolean(acadEndDate && targetDateIST === acadEndDate),

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
    groupedByBatchList,
    groupedBySection,
    groupedByDietary,
    sectionChunkSize,
    collapsedBatches,
    toggleBatchCollapse,
    collapseAllBatches,
    expandAllBatches,
    collapsedDietary,
    toggleDietaryCollapse,
    collapseAllDietary,
    expandAllDietary,

    // Real-Time Analytics & Headcounts
    metrics,

    // Board Food Supply Operational Schedule (settings/board_service)
    boardServiceSchedule,
    currentMealSupplyStatus,
    breakfastSupplyStatus,
    lunchSupplyStatus,
    isBoardSupplyActive,
    isBreakfastSupplyActive,
    isLunchSupplyActive,
    isEntireDaySupplyOff,
    activeSupplyNotice: currentMealSupplyStatus,

    // Board Notice Notes & Operational Events
    boardNotices,
    activeNoticesForDate,
    activeNoticeForDate,
    isCanteenClosedForDate,

    // Tactical Multi-Selection State & Actions
    isSelectMode,
    selectedTokens,
    selectedTokenIds,
    selectedCount: selectedTokens.length,
    isTokenSelected,
    toggleSelectMode,
    toggleTokenSelection,
    selectTokens,
    selectAll,
    clearSelection,
    selectBatch,
    selectSection,
    selectByMealStatus,
    selectTokenRange,
  };
}

export default useTokenBoardController;
