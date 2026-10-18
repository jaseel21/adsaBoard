/**
 * Utility functions for Student Date Exceptions (up to 30 days)
 * Allows setting one-off date exceptions (e.g., Tomorrow, October 24th, Next Friday)
 * that automatically expire once the date passes, preventing student starvation.
 */

/**
 * Get current date in IST formatted as YYYY-MM-DD
 */
export function getTodayISTDate() {
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
  const maxDate = addDaysToDate(today, 30);

  if (!dateStr) {
    return { valid: false, error: 'Please select a date.' };
  }
  if (dateStr < today) {
    return { valid: false, error: 'Cannot set an exception for a past date.' };
  }
  if (dateStr > maxDate) {
    return { valid: false, error: 'Exceptions can only be scheduled up to 30 days ahead.' };
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
