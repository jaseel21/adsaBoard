/**
 * ADSA T-Board High-Performance Analytics & Telemetry Engine
 * Pure statistical calculation and data normalization module for committee intelligence.
 */

import {
  getEffectiveStudentMealStatus,
  addDaysToDate,
  formatFriendlyDate,
  getDayOfWeekShort,
} from './studentExceptionService';
import {
  calculateKitchenRations,
  calculateWastePreventionEconomics,
} from './kitchenRationBenchmarks';

/**
 * Calculates complete analytical telemetry dataset for a given target date or temporal span.
 */
export function computeDashboardTelemetry({
  students = [],
  preferencesList = [],
  targetDateIST,
  effectiveDay = 'today',
  meal = 'lunch', // 'breakfast' | 'lunch' | 'both'
  batchFilter = 'all',
  timeSpan = 'today', // 'today' | 'tomorrow' | '7d' | '30d' | 'custom'
}) {
  const isBreakfast = meal === 'breakfast';
  const isBoth = meal === 'both';

  // 1. Filter students by batch if applied
  const scopeStudents = batchFilter === 'all'
    ? students
    : students.filter((s) => {
        const b = s.batch ? s.batch.trim() : 'Unassigned';
        return b === batchFilter;
      });

  const totalEnrolled = scopeStudents.length;
  const blockedCount = scopeStudents.filter((s) => Boolean(s.block)).length;
  const eligibleStudents = scopeStudents.filter((s) => !s.block);
  const totalEligible = eligibleStudents.length;

  // 2. Count Active Diners
  let breakfastDiners = 0;
  let lunchDiners = 0;
  let beefConsumers = 0;
  let chickenConsumers = 0;
  let fishConsumers = 0;
  let beefAvoiders = 0;
  let chickenAvoiders = 0;
  let fishAvoiders = 0;
  let fullStandardDiners = 0;
  let onLeaveCount = 0;

  eligibleStudents.forEach((student) => {
    const isDiningBreakfast = getEffectiveStudentMealStatus(
      student,
      targetDateIST,
      effectiveDay,
      'breakfast'
    );
    const isDiningLunch = getEffectiveStudentMealStatus(
      student,
      targetDateIST,
      effectiveDay,
      'lunch'
    );

    if (isDiningBreakfast) breakfastDiners++;
    if (isDiningLunch) lunchDiners++;

    // Check leave on active meal
    const exceptions = student.dateExceptions || {};
    const dateMeta = exceptions[targetDateIST];
    const isOptedOutActive = isBreakfast
      ? dateMeta && dateMeta.breakfast === false
      : dateMeta && dateMeta.lunch === false;

    if (isOptedOutActive) onLeaveCount++;

    // Dietary status of current meal diners
    const isDiningActive = isBreakfast ? isDiningBreakfast : isDiningLunch;
    if (isDiningActive) {
      const obj2 = student.obj2 || {};
      const noBeef = obj2.beef === false;
      const noChicken = obj2.chicken === false;
      const noFish = obj2.fish === false;

      if (noBeef) beefAvoiders++; else beefConsumers++;
      if (noChicken) chickenAvoiders++; else chickenConsumers++;
      if (noFish) fishAvoiders++; else fishConsumers++;

      if (!noBeef && !noChicken && !noFish) {
        fullStandardDiners++;
      }
    }
  });

  const activeDiners = isBreakfast
    ? breakfastDiners
    : (isBoth ? Math.round((breakfastDiners + lunchDiners) / 2) : lunchDiners);

  const optedOutCount = Math.max(0, totalEligible - activeDiners);
  const participationRate = totalEligible > 0
    ? Math.round((activeDiners / totalEligible) * 100)
    : 0;

  // 3. Batch Aggregations & Health Benchmarking
  const batchMap = {};
  scopeStudents.forEach((student) => {
    const raw = student.batch ? student.batch.trim() : '';
    const bName = raw || 'Unassigned';
    if (!batchMap[bName]) {
      batchMap[bName] = {
        name: bName,
        total: 0,
        active: 0,
        optedOut: 0,
        blocked: 0,
        beefAvoid: 0,
        fishAvoid: 0,
        isUnassigned: bName === 'Unassigned',
      };
    }
    const b = batchMap[bName];
    b.total++;
    if (student.block) {
      b.blocked++;
      return;
    }
    const isDining = getEffectiveStudentMealStatus(
      student,
      targetDateIST,
      effectiveDay,
      isBreakfast ? 'breakfast' : 'lunch'
    );
    if (isDining) {
      b.active++;
      const obj2 = student.obj2 || {};
      if (obj2.beef === false) b.beefAvoid++;
      if (obj2.fish === false) b.fishAvoid++;
    } else {
      b.optedOut++;
    }
  });

  const batchBenchmarks = Object.values(batchMap).map((b) => {
    const rate = b.total > 0 ? Math.round((b.active / b.total) * 100) : 0;
    return {
      ...b,
      rate,
      status: rate >= 85 ? 'optimal' : rate >= 70 ? 'moderate' : 'low',
    };
  }).sort((a, b) => {
    if (a.isUnassigned) return 1;
    if (b.isUnassigned) return -1;
    return b.rate - a.rate;
  });

  // 4. Kitchen Ration Planning
  const kitchenRations = calculateKitchenRations({
    activeDiners,
    beefConsumers,
    chickenConsumers,
    fishConsumers,
    meal: isBreakfast ? 'breakfast' : 'lunch',
  });

  // 5. Food Waste & Economic Savings
  const wasteEconomics = calculateWastePreventionEconomics({
    optedOutCount,
    meal: isBreakfast ? 'breakfast' : 'lunch',
  });

  // 6. Generate Multi-Day Temporal Trendlines (7 Days or 30 Days)
  const daysCount = timeSpan === '30d' ? 30 : 7;
  const trendWaves = generateTemporalTrendlines({
    students: scopeStudents,
    startDateIST: targetDateIST,
    daysCount,
    effectiveDay,
  });

  // 7. Calculate Genuine Period Averages & Statistics
  const periodStats = calculatePeriodAverages(trendWaves, totalEligible);

  // 8. Authentic Scheduled Leaves Registry
  const leaveSummary = computeScheduledLeaves({
    students: scopeStudents,
    targetDateIST,
  });

  const cohortInsights = {
    leaveSummary,
    welfareAlerts: [],
    honorRollCount: scopeStudents.filter((s) => !s.block && !s.dateExceptions?.[targetDateIST]).length,
    activeLeaveCount: leaveSummary.count,
  };

  return {
    meta: {
      targetDateIST,
      friendlyDate: formatFriendlyDate(targetDateIST),
      dayOfWeek: getDayOfWeekShort(targetDateIST),
      meal,
      timeSpan,
      batchFilter,
    },
    telemetry: {
      totalEnrolled,
      totalEligible,
      blockedCount,
      activeDiners,
      breakfastDiners,
      lunchDiners,
      optedOutCount,
      onLeaveCount: leaveSummary.count,
      participationRate,
      fullStandardDiners,
    },
    dietary: {
      beefAvoiders,
      chickenAvoiders,
      fishAvoiders,
      beefConsumers,
      chickenConsumers,
      fishConsumers,
      standardRatio: activeDiners > 0 ? Math.round((fullStandardDiners / activeDiners) * 100) : 0,
      customDietCount: Math.max(0, activeDiners - fullStandardDiners),
    },
    batchBenchmarks,
    kitchenRations,
    wasteEconomics,
    trendWaves,
    periodStats,
    leaveSummary,
    cohortInsights,
    decisionTiming: [],
  };
}

/**
 * Computes multi-day attendance trends for spline chart visualizations
 */
function generateTemporalTrendlines({
  students = [],
  startDateIST,
  daysCount = 7,
  effectiveDay = 'today',
}) {
  const points = [];
  const eligible = students.filter((s) => !s.block);
  const total = eligible.length;

  for (let i = -Math.floor(daysCount / 2); i <= Math.floor(daysCount / 2); i++) {
    const curDate = addDaysToDate(startDateIST, i);
    let bkCount = 0;
    let lnCount = 0;

    eligible.forEach((student) => {
      if (getEffectiveStudentMealStatus(student, curDate, effectiveDay, 'breakfast')) {
        bkCount++;
      }
      if (getEffectiveStudentMealStatus(student, curDate, effectiveDay, 'lunch')) {
        lnCount++;
      }
    });

    const bkRate = total > 0 ? Math.round((bkCount / total) * 100) : 0;
    const lnRate = total > 0 ? Math.round((lnCount / total) * 100) : 0;

    points.push({
      date: curDate,
      shortLabel: getDayOfWeekShort(curDate),
      friendlyDate: formatFriendlyDate(curDate),
      breakfastCount: bkCount,
      lunchCount: lnCount,
      breakfastRate: bkRate,
      lunchRate: lnRate,
      totalStudents: total,
      isTarget: curDate === startDateIST,
    });
  }

  return points;
}

/**
 * Calculates genuine mathematical averages and peak statistics across a temporal window
 */
function calculatePeriodAverages(trendPoints = [], totalEligible = 0) {
  if (!trendPoints || trendPoints.length === 0) {
    return {
      totalDays: 0,
      avgDailyBreakfast: 0,
      avgDailyLunch: 0,
      avgDailyActive: 0,
      avgTurnoutRate: 0,
      totalMealsServed: 0,
      peakDay: null,
      lowestDay: null,
    };
  }

  let sumBk = 0;
  let sumLn = 0;
  let peakDay = trendPoints[0];
  let lowestDay = trendPoints[0];

  trendPoints.forEach((pt) => {
    sumBk += pt.breakfastCount || 0;
    sumLn += pt.lunchCount || 0;
    const totalDiners = (pt.breakfastCount || 0) + (pt.lunchCount || 0);
    const peakTotal = (peakDay.breakfastCount || 0) + (peakDay.lunchCount || 0);
    const lowestTotal = (lowestDay.breakfastCount || 0) + (lowestDay.lunchCount || 0);

    if (totalDiners > peakTotal) peakDay = pt;
    if (totalDiners < lowestTotal) lowestDay = pt;
  });

  const totalDays = trendPoints.length;
  const avgDailyBreakfast = Math.round(sumBk / totalDays);
  const avgDailyLunch = Math.round(sumLn / totalDays);
  const avgDailyActive = Math.round((sumBk + sumLn) / (totalDays * 2));
  const avgTurnoutRate = totalEligible > 0 ? Math.round((avgDailyActive / totalEligible) * 100) : 0;
  const totalMealsServed = sumBk + sumLn;

  return {
    totalDays,
    avgDailyBreakfast,
    avgDailyLunch,
    avgDailyActive,
    avgTurnoutRate,
    totalMealsServed,
    peakDay: {
      date: peakDay.date,
      friendlyDate: peakDay.friendlyDate,
      shortLabel: peakDay.shortLabel,
      breakfastCount: peakDay.breakfastCount,
      lunchCount: peakDay.lunchCount,
      turnoutRate: peakDay.lunchRate,
    },
    lowestDay: {
      date: lowestDay.date,
      friendlyDate: lowestDay.friendlyDate,
      shortLabel: lowestDay.shortLabel,
      breakfastCount: lowestDay.breakfastCount,
      lunchCount: lowestDay.lunchCount,
      turnoutRate: lowestDay.lunchRate,
    },
  };
}

/**
 * Extracts authentic scheduled student leaves & meal opt-outs
 */
function computeScheduledLeaves({ students = [], targetDateIST }) {
  const leaves = [];
  students.forEach((student) => {
    if (student.block) return;
    const exceptions = student.dateExceptions || {};
    const dayMeta = exceptions[targetDateIST];
    if (dayMeta) {
      const isBkOff = dayMeta.breakfast === false;
      const isLnOff = dayMeta.lunch === false;
      if (isBkOff || isLnOff) {
        leaves.push({
          id: student.id,
          tokenNo: student.tokenNo,
          name: student.name || 'Student',
          batch: student.batch || 'Unassigned',
          phone: student.phone || '',
          email: student.email || '',
          isBreakfastOff: isBkOff,
          isLunchOff: isLnOff,
          reason: dayMeta.reason || 'Scheduled Leave / Fasting',
        });
      }
    }
  });

  return {
    list: leaves,
    count: leaves.length,
    breakfastLeavesCount: leaves.filter((l) => l.isBreakfastOff).length,
    lunchLeavesCount: leaves.filter((l) => l.isLunchOff).length,
  };
}
