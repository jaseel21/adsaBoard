/**
 * Utility functions for Student Date Exceptions (up to 30 days)
 * Allows setting one-off date exceptions (e.g., Tomorrow, October 24th, Next Friday)
 * that automatically expire once the date passes, preventing student starvation.
 */

import { getSyncedISTDateString } from './time';

/**
 * Get current date in IST formatted as YYYY-MM-DD
 * Anchored to verified network server time to prevent tampering via device settings.
 */
export function getTodayISTDate() {
  if (typeof getSyncedISTDateString === 'function') {
    return getSyncedISTDateString();
  }
  const now = new Date();
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istDate = new Date(now.getTime() + (now.getTimezoneOffset() * 60000) + istOffset);
  return istDate.toISOString().split('T')[0];
}

/**
 * Normalizes HH:mm or HH:mm:ss string to HH:mm:ss format
 */
export function normalizeTimeToHms(timeStr, defaultTime = '14:00:00') {
  if (!timeStr) return defaultTime;
  const parts = String(timeStr).trim().split(':');
  const h = String(parts[0] || '00').padStart(2, '0');
  const m = String(parts[1] || '00').padStart(2, '0');
  const s = String(parts[2] || '00').padStart(2, '0');
  return `${h}:${m}:${s}`;
}

/**
 * Checks if current time is within or past the board updation window open time.
 * Standard rule across complete web:
 * - 12:00 AM (00:00:00) to Board Updation Window Open Time (default '14:00:00' / 2:00 PM): Returns false (Today)
 * - Board Updation Window Open Time to 12:00 AM (midnight): Returns true (Tomorrow)
 */
export function isPastBoardWindowOpenTime(timeHms, openTime = '14:00') {
  let currentHms = timeHms;
  if (!currentHms) {
    try {
      currentHms = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      }).format(new Date());
    } catch (_) {
      const now = new Date();
      currentHms = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    }
  }

  const normalizedOpen = normalizeTimeToHms(openTime, '14:00:00');
  // If openTime was explicitly configured as '00:00', treat 2:00 PM (14:00:00) as the switch boundary
  const effectiveOpen = normalizedOpen === '00:00:00' ? '14:00:00' : normalizedOpen;

  return currentHms >= effectiveOpen;
}

/**
 * Returns the default day offset (0 for Today, 1 for Tomorrow) based on time of day:
 * 12:00 AM - Board Updation Window Open Time (e.g. 2:00 PM): 0 (Today)
 * Board Updation Window Open Time - 12:00 AM: 1 (Tomorrow)
 */
export function getDefaultBoardDayOffset(timeHms, openTime = '14:00') {
  return isPastBoardWindowOpenTime(timeHms, openTime) ? 1 : 0;
}

/**
 * Returns the default target date string ('YYYY-MM-DD') based on time of day:
 * 12:00 AM - Board Updation Window Open Time (e.g. 2:00 PM): Today (IST)
 * Board Updation Window Open Time - 12:00 AM: Tomorrow (IST)
 */
export function getDefaultBoardTargetDate(timeHms, openTime = '14:00', todayIST = null) {
  const baseToday = todayIST || getTodayISTDate();
  const offset = getDefaultBoardDayOffset(timeHms, openTime);
  return offset === 1 ? addDaysToDate(baseToday, 1) : baseToday;
}

/**
 * Add days to a YYYY-MM-DD date string
 */
export function addDaysToDate(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d + days));
  return dateObj.toISOString().split('T')[0];
}

/**
 * Get 2-letter lowercase day of week for a date string ('su' | 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa')
 */
export function getDayOfWeekShort(dateStr) {
  if (!dateStr) return 'su';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  const dayMap = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
  return dayMap[dateObj.getUTCDay()] || 'su';
}

/**
 * Format YYYY-MM-DD to friendly string (e.g., "Fri, Oct 24, 2026")
 */
export function formatFriendlyDate(dateStr, includeWeekday = true) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(Date.UTC(y, m - 1, d));
  return dateObj.toLocaleDateString('en-US', {
    timeZone: 'UTC',
    weekday: includeWeekday ? 'short' : undefined,
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Generate quick shortcut options for upcoming days (Tomorrow, Day After, Next Friday, etc.)
 */
export function getQuickDateOptions() {
  const today = getTodayISTDate();
  const tomorrow = addDaysToDate(today, 1);
  const dayAfter = addDaysToDate(today, 2);

  // Find upcoming Friday
  const [y, m, d] = today.split('-').map(Number);
  const todayObj = new Date(Date.UTC(y, m - 1, d));
  const todayDay = todayObj.getUTCDay(); // 0 is Sunday, 5 is Friday
  let daysUntilFriday = (5 - todayDay + 7) % 7;
  if (daysUntilFriday === 0) daysUntilFriday = 7; // If today is Friday, pick next Friday
  const nextFriday = addDaysToDate(today, daysUntilFriday);

  return [
    {
      date: tomorrow,
      label: 'Tomorrow',
      sublabel: formatFriendlyDate(tomorrow, true),
    },
    {
      date: dayAfter,
      label: 'Day After Tomorrow',
      sublabel: formatFriendlyDate(dayAfter, true),
    },
    {
      date: nextFriday,
      label: 'Next Friday',
      sublabel: formatFriendlyDate(nextFriday, true),
    },
  ];
}

/**
 * Validate that a target exception date is between today and today + 30 days
 */
export function validateExceptionDate(dateStr) {
  const today = getTodayISTDate();
  const maxDate = addDaysToDate(today, 365); // Full 1-year academic calendar horizon

  if (!dateStr) {
    return { valid: false, error: 'Please select a date.' };
  }
  if (dateStr < today) {
    return { valid: false, error: 'Cannot set an exception for a past date.' };
  }
  if (dateStr > maxDate) {
    return { valid: false, error: 'Exceptions can be scheduled up to 1 year ahead.' };
  }

  return { valid: true };
}

/**
 * Clean up past date exceptions
 * Note: Preserves past exceptions by default so that historical records and leave audit logs
 * are never erased. Can be passed preserveHistory=false if explicitly pruning legacy records.
 */
export function cleanPastDateExceptions(dateExceptionsMap, preserveHistory = true) {
  if (!dateExceptionsMap || typeof dateExceptionsMap !== 'object') return {};
  if (preserveHistory) {
    // Preserve all date exceptions to serve as permanent dining history
    return { ...dateExceptionsMap };
  }
  const today = getTodayISTDate();
  const cleaned = {};
  Object.keys(dateExceptionsMap).forEach((dateKey) => {
    if (dateKey >= today) {
      cleaned[dateKey] = dateExceptionsMap[dateKey];
    }
  });
  return cleaned;
}

/**
 * Synchronize and freeze past dining records into an immutable historical ledger (diningHistory).
 * Automatically resolves unarchived past days using recorded exceptions or routine at that time.
 *
 * @param {Object} student - Student record with obj (routine), dateExceptions, obj2 (dietary), diningHistory
 * @param {number} daysBack - Maximum days to inspect back in history (default 90 days / 1 semester)
 * @returns {Object} The complete, updated diningHistory map: { [YYYY-MM-DD]: DiningHistoryRecord }
 */
export function syncStudentDiningHistory(student, daysBack = 90) {
  if (!student) return {};

  const todayIST = getTodayISTDate();
  const existingHistory = student.diningHistory && typeof student.diningHistory === 'object'
    ? { ...student.diningHistory }
    : {};

  const exceptions = student.dateExceptions || {};
  const routine = student.obj || {};
  const dietarySnapshot = student.obj2 || {};

  let modified = false;

  for (let i = 1; i <= daysBack; i++) {
    const pastDate = addDaysToDate(todayIST, -i);

    // If already locked in historical ledger, maintain immutable record
    if (existingHistory[pastDate]) {
      continue;
    }

    const dayKey = getDayOfWeekShort(pastDate);
    const routineBf = routine.breakfast?.[dayKey] !== undefined ? Boolean(routine.breakfast[dayKey]) : true;
    const routineLunch = routine.lunch?.[dayKey] !== undefined ? Boolean(routine.lunch[dayKey]) : true;

    if (exceptions[pastDate]) {
      const exc = exceptions[pastDate];
      existingHistory[pastDate] = {
        date: pastDate,
        breakfast: exc.breakfast !== undefined ? Boolean(exc.breakfast) : routineBf,
        lunch: exc.lunch !== undefined ? Boolean(exc.lunch) : routineLunch,
        source: 'exception',
        label: exc.label || 'Scheduled Override / Leave',
        dietary: dietarySnapshot,
        archivedAt: new Date().toISOString(),
      };
      modified = true;
    } else {
      existingHistory[pastDate] = {
        date: pastDate,
        breakfast: routineBf,
        lunch: routineLunch,
        source: 'routine',
        label: 'Standard Weekly Schedule',
        dietary: dietarySnapshot,
        archivedAt: new Date().toISOString(),
      };
      modified = true;
    }
  }

  return existingHistory;
}

/**
 * Check if a student has an active date exception for a specific target date
 * @param {Object} student - Student document
 * @param {string} targetDate - 'YYYY-MM-DD'
 * @param {string} mealType - 'lunch' | 'breakfast'
 * @returns {Object|null}
 */
export function getActiveStudentException(student, targetDate, mealType) {
  if (!student) return null;
  const checkDate = targetDate || getTodayISTDate();

  // Check dateExceptions map
  if (student.dateExceptions && student.dateExceptions[checkDate]) {
    const exc = student.dateExceptions[checkDate];
    if (!mealType) return exc;
    if (exc[mealType] !== undefined) return exc;
  }

  // Backwards compatibility with legacy exceptions array if any
  if (Array.isArray(student.exceptions) && student.exceptions.length > 0) {
    for (const exc of student.exceptions) {
      if (exc.date === checkDate) {
        if (!mealType || exc[mealType] !== undefined) return exc;
      }
      if (exc.startDate && exc.endDate && checkDate >= exc.startDate && checkDate <= exc.endDate) {
        if (!mealType || (exc.meals && exc.meals[mealType] === true)) return exc;
      }
    }
  }

  return null;
}

/**
 * Determine the effective meal status of a student for a specific date and meal
 * Evaluates:
 * 1. student.block -> false
 * 2. student.dateExceptions[targetDate] -> override if specified
 * 3. Fallback to weekly schedule: student.obj[mealType][dayShort]
 *
 * @param {Object} student - Student document
 * @param {string} targetDate - 'YYYY-MM-DD'
 * @param {string} dayShort - 'su' | 'mo' | 'tu' | 'we' | 'th' | 'fr' | 'sa'
 * @param {string} mealType - 'lunch' | 'breakfast'
 * @returns {boolean} true if meal is active/on, false if skipped/off
 */
export function getEffectiveStudentMealStatus(student, targetDate, dayShort, mealType) {
  if (!student || student.block) return false;

  const effectiveDay = dayShort || getDayOfWeekShort(targetDate);
  const checkDate = targetDate || getTodayISTDate();
  const todayIST = getTodayISTDate();

  // 1. If it's a past date, check immutable historical ledger (diningHistory) first
  if (checkDate < todayIST && student.diningHistory && student.diningHistory[checkDate]) {
    const hist = student.diningHistory[checkDate];
    if (hist[mealType] !== undefined) {
      return Boolean(hist[mealType]);
    }
  }

  // 2. Check Date Exception override
  if (student.dateExceptions && student.dateExceptions[checkDate]) {
    const exc = student.dateExceptions[checkDate];
    if (exc[mealType] !== undefined) {
      return Boolean(exc[mealType]);
    }
  }

  // Legacy range exceptions if present
  if (Array.isArray(student.exceptions) && student.exceptions.length > 0) {
    for (const exc of student.exceptions) {
      if (exc.date === checkDate && exc[mealType] !== undefined) {
        return Boolean(exc[mealType]);
      }
      if (exc.startDate && exc.endDate && checkDate >= exc.startDate && checkDate <= exc.endDate) {
        if (exc.meals && exc.meals[mealType] === true) {
          return false; // on leave -> meal is skipped
        }
      }
    }
  }

  // 3. Fallback to weekly standard schedule
  if (student.obj && student.obj[mealType]) {
    return Boolean(student.obj[mealType][effectiveDay]);
  }

  return true; // default true if not specified
}

/**
 * Calculate metadata and relative day distance for a target date
 * @param {string} targetDate - 'YYYY-MM-DD'
 * @param {string} baseToday - Optional 'YYYY-MM-DD', defaults to getTodayISTDate()
 * @returns {Object} { isToday, isTomorrow, isYesterday, isPast, isFuture, diffDays, badgeType, relativeLabel }
 */
export function getRelativeDateMeta(targetDate, baseToday = null) {
  const today = baseToday || getTodayISTDate();
  if (!targetDate) {
    return {
      isToday: true,
      isTomorrow: false,
      isYesterday: false,
      isPast: false,
      isFuture: false,
      diffDays: 0,
      badgeType: 'today',
      relativeLabel: '',
    };
  }

  const tomorrow = addDaysToDate(today, 1);
  const yesterday = addDaysToDate(today, -1);

  const isToday = targetDate === today;
  const isTomorrow = targetDate === tomorrow;
  const isYesterday = targetDate === yesterday;
  const isPast = targetDate < today;
  const isFuture = targetDate > today;

  // Calculate day difference (UTC)
  const [ty, tm, td] = today.split('-').map(Number);
  const [dy, dm, dd] = targetDate.split('-').map(Number);
  const msDiff = Date.UTC(dy, dm - 1, dd) - Date.UTC(ty, tm - 1, td);
  const diffDays = Math.round(msDiff / (1000 * 60 * 60 * 24));

  let badgeType = 'scheduled';
  let relativeLabel = '';

  if (isToday) {
    badgeType = 'today';
    relativeLabel = '';
  } else if (isTomorrow) {
    badgeType = 'tomorrow';
    relativeLabel = '';
  } else if (isYesterday) {
    badgeType = 'yesterday';
    relativeLabel = '1 day ago';
  } else if (isPast) {
    badgeType = 'past';
    relativeLabel = `${Math.abs(diffDays)} days ago`;
  } else if (isFuture) {
    badgeType = 'future';
    relativeLabel = `In ${diffDays} days`;
  }

  return {
    isToday,
    isTomorrow,
    isYesterday,
    isPast,
    isFuture,
    diffDays,
    badgeType,
    relativeLabel,
  };
}

/**
 * Generate full calendar grid days for a given year & month (month is 0-indexed: 0=Jan, 11=Dec)
 * Returns array of objects with leading blank padding for 7-column layout (Sunday-Saturday)
 */
export function getMonthCalendarDays(year, month) {
  const todayIST = getTodayISTDate();
  const maxDate = addDaysToDate(todayIST, 365); // 1-year academic horizon

  const firstDayObj = new Date(Date.UTC(year, month, 1));
  const startDayOfWeek = firstDayObj.getUTCDay(); // 0 is Sunday, 6 is Saturday
  const totalDaysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();

  const days = [];

  // Leading blanks for proper alignment
  for (let i = 0; i < startDayOfWeek; i++) {
    days.push({
      isBlank: true,
      key: `blank-${year}-${month}-${i}`,
    });
  }

  const dayMap = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

  // Actual days in the month
  for (let d = 1; d <= totalDaysInMonth; d++) {
    const monthStr = String(month + 1).padStart(2, '0');
    const dayStr = String(d).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;

    const dateObj = new Date(Date.UTC(year, month, d));
    const dayOfWeek = dayMap[dateObj.getUTCDay()] || 'su';
    const isToday = dateStr === todayIST;
    const isPast = dateStr < todayIST;
    const isBeyondMax = dateStr > maxDate;

    days.push({
      isBlank: false,
      key: dateStr,
      dateStr,
      dayNumber: d,
      dayOfWeek,
      isToday,
      isPast,
      isBeyondMax,
      isBookable: !isPast && !isBeyondMax,
    });
  }

  return days;
}

/**
 * Calculate effective meal status and exception info for a specific date.
 * If dateStr is in the past (< todayIST), it seamlessly queries the immutable diningHistory
 * ledger, falling back to preserved dateExceptions or the baseline weekly routine.
 */
export function calculateEffectiveDateMeals(student, dateStr) {
  const todayIST = getTodayISTDate();
  const isPast = dateStr < todayIST;
  const isToday = dateStr === todayIST;

  const dayKey = getDayOfWeekShort(dateStr);
  const routineBf = student?.obj?.breakfast?.[dayKey] !== undefined ? Boolean(student.obj.breakfast[dayKey]) : true;
  const routineLunch = student?.obj?.lunch?.[dayKey] !== undefined ? Boolean(student.obj.lunch[dayKey]) : true;

  // 1. If it's a past date, check diningHistory ledger first
  if (isPast && student?.diningHistory && student.diningHistory[dateStr]) {
    const hist = student.diningHistory[dateStr];
    const bf = Boolean(hist.breakfast);
    const lu = Boolean(hist.lunch);
    return {
      breakfast: bf,
      lunch: lu,
      routineBreakfast: routineBf,
      routineLunch: routineLunch,
      hasException: hist.source === 'exception',
      isAllOn: bf && lu,
      isAllOff: !bf && !lu,
      isPartial: (bf && !lu) || (!bf && lu),
      label: hist.label || '',
      source: hist.source || 'routine',
      isHistory: true,
      archivedAt: hist.archivedAt || '',
      dietary: hist.dietary || student?.obj2 || {},
    };
  }

  // 2. Check active or preserved dateExceptions
  const exception = student?.dateExceptions?.[dateStr];
  const hasException = Boolean(exception);

  const effectiveBf = hasException && exception.breakfast !== undefined ? Boolean(exception.breakfast) : routineBf;
  const effectiveLunch = hasException && exception.lunch !== undefined ? Boolean(exception.lunch) : routineLunch;

  const isAllOn = effectiveBf && effectiveLunch;
  const isAllOff = !effectiveBf && !effectiveLunch;
  const isPartial = (effectiveBf && !effectiveLunch) || (!effectiveBf && effectiveLunch);

  return {
    breakfast: effectiveBf,
    lunch: effectiveLunch,
    routineBreakfast: routineBf,
    routineLunch: routineLunch,
    hasException,
    isAllOn,
    isAllOff,
    isPartial,
    label: exception?.label || '',
    source: hasException ? 'exception' : 'routine',
    isHistory: isPast,
    dietary: student?.obj2 || {},
  };
}

/**
 * Calculate meal stats for a specific month with bifurcated historical attendance vs upcoming schedule.
 */
export function calculateMonthStats(student, year, month) {
  const totalDays = new Date(year, month + 1, 0).getDate();
  const monthStr = String(month + 1).padStart(2, '0');
  const todayIST = getTodayISTDate();

  let activeLunchDays = 0;
  let activeBreakfastDays = 0;
  let monthOverridesCount = 0;

  let pastDaysCount = 0;
  let pastLunchesTaken = 0;
  let pastBreakfastsTaken = 0;
  let pastLeavesCount = 0; // days where both lunch and breakfast were OFF

  let upcomingDaysCount = 0;
  let upcomingLunchesScheduled = 0;
  let upcomingBreakfastsScheduled = 0;

  for (let d = 1; d <= totalDays; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    const meals = calculateEffectiveDateMeals(student, dateStr);

    if (meals.lunch) activeLunchDays++;
    if (meals.breakfast) activeBreakfastDays++;
    if (meals.hasException) monthOverridesCount++;

    if (dateStr < todayIST) {
      pastDaysCount++;
      if (meals.lunch) pastLunchesTaken++;
      if (meals.breakfast) pastBreakfastsTaken++;
      if (!meals.lunch && !meals.breakfast) pastLeavesCount++;
    } else {
      upcomingDaysCount++;
      if (meals.lunch) upcomingLunchesScheduled++;
      if (meals.breakfast) upcomingBreakfastsScheduled++;
    }
  }

  return {
    totalDays,
    activeLunchDays,
    activeBreakfastDays,
    monthOverridesCount,
    // Granular Historical Ledger Stats
    pastDaysCount,
    pastLunchesTaken,
    pastBreakfastsTaken,
    pastLeavesCount,
    // Upcoming Planned Schedule Stats
    upcomingDaysCount,
    upcomingLunchesScheduled,
    upcomingBreakfastsScheduled,
    isFullyPastMonth: pastDaysCount === totalDays,
  };
}

/**
 * Apply a meal override across an inclusive date range [startDate, endDate]
 */
export function applyDateRangeException(existingExceptions = {}, startDate, endDate, mealSettings) {
  const todayIST = getTodayISTDate();
  const maxDate = addDaysToDate(todayIST, 365); // Full 1-year academic horizon

  const [startY, startM, startD] = startDate.split('-').map(Number);
  const [endY, endM, endD] = endDate.split('-').map(Number);

  const startObj = new Date(startY, startM - 1, startD);
  const endObj = new Date(endY, endM - 1, endD);

  const result = { ...existingExceptions };

  const currentObj = new Date(startObj);
  while (currentObj <= endObj) {
    const y = currentObj.getFullYear();
    const m = String(currentObj.getMonth() + 1).padStart(2, '0');
    const d = String(currentObj.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${d}`;

    // Only apply if date is today or upcoming within the horizon
    if (dateStr >= todayIST && dateStr <= maxDate) {
      result[dateStr] = {
        breakfast: Boolean(mealSettings.breakfast),
        lunch: Boolean(mealSettings.lunch),
        label: mealSettings.label || 'Leave / Range Override',
      };
    }

    currentObj.setDate(currentObj.getDate() + 1);
  }

  return result;
}

/**
 * Remove an exception for a specific date
 */
export function removeDateException(existingExceptions = {}, dateStr) {
  const updated = { ...existingExceptions };
  delete updated[dateStr];
  return updated;
}
