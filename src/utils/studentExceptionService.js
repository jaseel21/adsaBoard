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
  const dateObj = new Date(y, m - 1, d);
  const dayMap = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
  return dayMap[dateObj.getDay()] || 'su';
}

/**
 * Format YYYY-MM-DD to friendly string (e.g., "Fri, Oct 24, 2026")
 */
export function formatFriendlyDate(dateStr, includeWeekday = true) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  return dateObj.toLocaleDateString('en-US', {
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
  const todayObj = new Date(y, m - 1, d);
  const todayDay = todayObj.getDay(); // 0 is Sunday, 5 is Friday
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
 * Clean up past date exceptions (removes keys older than today)
 */
export function cleanPastDateExceptions(dateExceptionsMap) {
  if (!dateExceptionsMap || typeof dateExceptionsMap !== 'object') return {};
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

  // 1. Check Date Exception override
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

  // 2. Fallback to weekly standard schedule
  if (student.obj && student.obj[mealType]) {
    return Boolean(student.obj[mealType][effectiveDay]);
  }

  return true; // default true if not specified
}

/**
 * Generate full calendar grid days for a given year & month (month is 0-indexed: 0=Jan, 11=Dec)
 * Returns array of objects with leading blank padding for 7-column layout (Sunday-Saturday)
 */
export function getMonthCalendarDays(year, month) {
  const todayIST = getTodayISTDate();
  const maxDate = addDaysToDate(todayIST, 365); // 1-year academic horizon

  const firstDayObj = new Date(year, month, 1);
  const startDayOfWeek = firstDayObj.getDay(); // 0 is Sunday, 6 is Saturday
  const totalDaysInMonth = new Date(year, month + 1, 0).getDate();

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

    const dateObj = new Date(year, month, d);
    const dayOfWeek = dayMap[dateObj.getDay()] || 'su';
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
 * Calculate effective meal status and exception info for a specific date
 */
export function calculateEffectiveDateMeals(student, dateStr) {
  const dayKey = getDayOfWeekShort(dateStr);
  const routineBf = student?.obj?.breakfast?.[dayKey] !== undefined ? Boolean(student.obj.breakfast[dayKey]) : true;
  const routineLunch = student?.obj?.lunch?.[dayKey] !== undefined ? Boolean(student.obj.lunch[dayKey]) : true;

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
  };
}

/**
 * Calculate meal stats for a specific month
 */
export function calculateMonthStats(student, year, month) {
  const totalDays = new Date(year, month + 1, 0).getDate();
  const monthStr = String(month + 1).padStart(2, '0');

  let activeLunchDays = 0;
  let activeBreakfastDays = 0;
  let monthOverridesCount = 0;

  for (let d = 1; d <= totalDays; d++) {
    const dayStr = String(d).padStart(2, '0');
    const dateStr = `${year}-${monthStr}-${dayStr}`;
    const meals = calculateEffectiveDateMeals(student, dateStr);
    if (meals.lunch) activeLunchDays++;
    if (meals.breakfast) activeBreakfastDays++;
    if (meals.hasException) monthOverridesCount++;
  }

  return {
    totalDays,
    activeLunchDays,
    activeBreakfastDays,
    monthOverridesCount,
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
