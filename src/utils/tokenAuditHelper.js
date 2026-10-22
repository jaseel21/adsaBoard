import { formatFriendlyDate, getDayOfWeekShort } from './studentExceptionService.js';

export const DAY_FULL_NAMES = {
  su: 'Sunday',
  mo: 'Monday',
  tu: 'Tuesday',
  we: 'Wednesday',
  th: 'Thursday',
  fr: 'Friday',
  sa: 'Saturday',
};

export const DAY_ORDER = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];

/**
 * Determine if an audit log relates to tokens/meals
 */
export function isTokenAudit(log) {
  if (!log) return false;
  return (
    log.category === 'tokens' ||
    String(log.action || '').includes('TOKEN') ||
    String(log.action || '').includes('MEAL') ||
    Boolean(log.target?.tokenNo) ||
    Boolean(log.actor?.tokenNo) ||
    Boolean(log.changes?.tokenDeltas?.length) ||
    Boolean(log.metadata?.meal) ||
    Boolean(log.metadata?.tokenNo)
  );
}

/**
 * Compute detailed differences between baseline and updated student schedules
 * Compares both weekly recurring routines (obj.lunch, obj.breakfast) and date exceptions.
 */
export function computeTokenScheduleDeltas(baseline = {}, updated = {}) {
  const baseLunch = baseline.lunch || baseline.obj?.lunch || {};
  const baseBf = baseline.breakfast || baseline.obj?.breakfast || {};
  const baseExceptions = baseline.dateExceptions || {};

  const nextLunch = updated.lunch || updated.obj?.lunch || {};
  const nextBf = updated.breakfast || updated.obj?.breakfast || {};
  const nextExceptions = updated.dateExceptions || {};

  const deltas = [];
  const fieldsChanged = [];
  const beforeObj = {};
  const afterObj = {};
  const summaries = [];

  // 1. Weekly Routine Lunch changes
  DAY_ORDER.forEach((dayShort) => {
    const dayName = DAY_FULL_NAMES[dayShort];
    const prevVal = baseLunch[dayShort] !== undefined ? Boolean(baseLunch[dayShort]) : true;
    const nextVal = nextLunch[dayShort] !== undefined ? Boolean(nextLunch[dayShort]) : true;

    if (prevVal !== nextVal) {
      const fieldKey = `Weekly ${dayName} Lunch`;
      fieldsChanged.push(fieldKey);
      beforeObj[fieldKey] = prevVal;
      afterObj[fieldKey] = nextVal;
      summaries.push(`${dayName} Lunch: ${prevVal ? 'ON' : 'OFF'} → ${nextVal ? 'ON' : 'OFF'}`);

      deltas.push({
        type: 'weekly_routine',
        scopeLabel: `Every ${dayName}`,
        day: dayName,
        dayShort,
        date: null,
        meal: 'lunch',
        mealLabel: 'Lunch',
        previous: prevVal,
        current: nextVal,
        label: `${dayName} Lunch`,
      });
    }
  });

  // 2. Weekly Routine Breakfast changes
  DAY_ORDER.forEach((dayShort) => {
    const dayName = DAY_FULL_NAMES[dayShort];
    const prevVal = baseBf[dayShort] !== undefined ? Boolean(baseBf[dayShort]) : true;
    const nextVal = nextBf[dayShort] !== undefined ? Boolean(nextBf[dayShort]) : true;

    if (prevVal !== nextVal) {
      const fieldKey = `Weekly ${dayName} Breakfast`;
      fieldsChanged.push(fieldKey);
      beforeObj[fieldKey] = prevVal;
      afterObj[fieldKey] = nextVal;
      summaries.push(`${dayName} Breakfast: ${prevVal ? 'ON' : 'OFF'} → ${nextVal ? 'ON' : 'OFF'}`);

      deltas.push({
        type: 'weekly_routine',
        scopeLabel: `Every ${dayName}`,
        day: dayName,
        dayShort,
        date: null,
        meal: 'breakfast',
        mealLabel: 'Breakfast',
        previous: prevVal,
        current: nextVal,
        label: `${dayName} Breakfast`,
      });
    }
  });

  // 3. Date Exceptions changes
  const allExceptionDates = Array.from(
    new Set([...Object.keys(baseExceptions), ...Object.keys(nextExceptions)])
  ).sort();

  allExceptionDates.forEach((dateStr) => {
    const prevExc = baseExceptions[dateStr];
    const nextExc = nextExceptions[dateStr];

    const friendlyDate = formatFriendlyDate(dateStr, true);
    const dayShort = getDayOfWeekShort(dateStr);
    const dayName = DAY_FULL_NAMES[dayShort] || dayShort;

    // Compare Lunch in exception
    const prevLu = prevExc?.lunch;
    const nextLu = nextExc?.lunch;
    if (prevLu !== nextLu && (prevLu !== undefined || nextLu !== undefined)) {
      const fieldKey = `${friendlyDate} • Lunch`;
      fieldsChanged.push(fieldKey);
      beforeObj[fieldKey] = prevLu !== undefined ? Boolean(prevLu) : 'Standard Routine';
      afterObj[fieldKey] = nextLu !== undefined ? Boolean(nextLu) : 'Standard Routine';

      summaries.push(
        `${friendlyDate} Lunch: ${prevLu === undefined ? 'Routine' : (prevLu ? 'ON' : 'OFF')} → ${nextLu === undefined ? 'Routine' : (nextLu ? 'ON' : 'OFF')}`
      );

      deltas.push({
        type: 'date_exception',
        scopeLabel: friendlyDate,
        date: dateStr,
        day: dayName,
        dayShort,
        meal: 'lunch',
        mealLabel: 'Lunch',
        previous: prevLu !== undefined ? Boolean(prevLu) : null,
        current: nextLu !== undefined ? Boolean(nextLu) : null,
        previousLabel: prevLu !== undefined ? (prevLu ? 'ON' : 'OFF') : 'Standard Routine',
        currentLabel: nextLu !== undefined ? (nextLu ? 'ON' : 'OFF') : 'Standard Routine',
        label: `${friendlyDate} • Lunch`,
        note: nextExc?.label || prevExc?.label || '',
      });
    }

    // Compare Breakfast in exception
    const prevBf = prevExc?.breakfast;
    const nextBf = nextExc?.breakfast;
    if (prevBf !== nextBf && (prevBf !== undefined || nextBf !== undefined)) {
      const fieldKey = `${friendlyDate} • Breakfast`;
      fieldsChanged.push(fieldKey);
      beforeObj[fieldKey] = prevBf !== undefined ? Boolean(prevBf) : 'Standard Routine';
      afterObj[fieldKey] = nextBf !== undefined ? Boolean(nextBf) : 'Standard Routine';

      summaries.push(
        `${friendlyDate} Breakfast: ${prevBf === undefined ? 'Routine' : (prevBf ? 'ON' : 'OFF')} → ${nextBf === undefined ? 'Routine' : (nextBf ? 'ON' : 'OFF')}`
      );

      deltas.push({
        type: 'date_exception',
        scopeLabel: friendlyDate,
        date: dateStr,
        day: dayName,
        dayShort,
        meal: 'breakfast',
        mealLabel: 'Breakfast',
        previous: prevBf !== undefined ? Boolean(prevBf) : null,
        current: nextBf !== undefined ? Boolean(nextBf) : null,
        previousLabel: prevBf !== undefined ? (prevBf ? 'ON' : 'OFF') : 'Standard Routine',
        currentLabel: nextBf !== undefined ? (nextBf ? 'ON' : 'OFF') : 'Standard Routine',
        label: `${friendlyDate} • Breakfast`,
        note: nextExc?.label || prevExc?.label || '',
      });
    }
  });

  return {
    items: deltas,
    fieldsChanged,
    before: beforeObj,
    after: afterObj,
    summary: summaries.length > 0 ? summaries.join(', ') : 'Dining schedule saved with no modifications',
  };
}

/**
 * Extract structured token deltas from any audit log (new or legacy/historical)
 */
export function extractTokenDeltas(log) {
  if (!log) return [];

  // Case 1: Pre-computed tokenDeltas already stored on changes or metadata
  if (Array.isArray(log.changes?.tokenDeltas) && log.changes.tokenDeltas.length > 0) {
    return log.changes.tokenDeltas;
  }
  if (Array.isArray(log.metadata?.tokenDeltas) && log.metadata.tokenDeltas.length > 0) {
    return log.metadata.tokenDeltas;
  }

  const results = [];

  // Case 2: Quick Meal Toggle (QUICK_MEAL_ON / QUICK_MEAL_OFF)
  if (log.action === 'QUICK_MEAL_ON' || log.action === 'QUICK_MEAL_OFF') {
    const isNowOn = log.action === 'QUICK_MEAL_ON';
    const date = log.metadata?.date || '';
    const day = log.metadata?.day || '';
    const meal = (log.metadata?.meal || 'lunch').toLowerCase();
    const tokenNo = log.target?.tokenNo || log.metadata?.tokenNo;
    const studentName = log.target?.label || log.metadata?.studentName || '';

    // Check if date can be parsed from diffSummary e.g. "LUNCH turned ON for Fri, Oct 24, 2026"
    let parsedDate = date;
    const summary = log.changes?.diffSummary || log.summary || '';
    const dateMatch = summary.match(/for\s+([^,]+,\s*[^\d]+\d+,\s*\d{4}|[A-Za-z]{3},\s*[A-Za-z]{3}\s*\d+|\d{4}-\d{2}-\d{2})/i);
    if (!parsedDate && dateMatch) {
      parsedDate = dateMatch[1];
    }

    results.push({
      type: 'quick_toggle',
      scopeLabel: parsedDate || 'Scheduled Day',
      date: parsedDate,
      day: day || (parsedDate ? getDayOfWeekShort(parsedDate) : ''),
      meal,
      mealLabel: meal === 'breakfast' ? 'Breakfast' : 'Lunch',
      previous: !isNowOn,
      current: isNowOn,
      previousLabel: !isNowOn ? 'ON' : 'OFF',
      currentLabel: isNowOn ? 'ON' : 'OFF',
      tokenNo,
      studentName,
      label: `${meal === 'breakfast' ? 'Breakfast' : 'Lunch'} Quick Toggle`,
    });
    return results;
  }

  // Case 3: Token Lock / Unlock
  if (
    log.action === 'TOKEN_LOCKED' ||
    log.action === 'TOKEN_UNLOCKED' ||
    log.action === 'STUDENT_BLOCK' ||
    log.action === 'STUDENT_UNBLOCK'
  ) {
    const isLocked = log.action === 'TOKEN_LOCKED' || log.action === 'STUDENT_BLOCK';
    const tokenNo = log.target?.tokenNo || log.metadata?.tokenNo;

    results.push({
      type: 'lock_status',
      scopeLabel: 'Account & Dining Eligibility',
      meal: 'all',
      mealLabel: 'All Meals',
      previous: !isLocked,
      current: isLocked,
      previousLabel: !isLocked ? 'Active / Unlocked' : 'Frozen / Locked',
      currentLabel: isLocked ? 'Frozen / Locked' : 'Active / Unlocked',
      tokenNo,
      studentName: log.target?.label,
      label: 'Token Lock Status',
    });
    return results;
  }

  // Case 4: Bulk Student Update
  if (log.action === 'BULK_STUDENT_UPDATE') {
    const meal = (log.metadata?.meal || 'lunch').toLowerCase();
    const count = log.metadata?.batchCount || 'Multiple';
    const status = log.metadata?.status !== undefined ? Boolean(log.metadata.status) : null;

    results.push({
      type: 'bulk_update',
      scopeLabel: `${count} Students`,
      meal,
      mealLabel: meal === 'breakfast' ? 'Breakfast' : 'Lunch',
      previous: status !== null ? !status : null,
      current: status,
      previousLabel: status !== null ? (!status ? 'ON' : 'OFF') : 'Mixed',
      currentLabel: status !== null ? (status ? 'ON' : 'OFF') : 'Updated',
      label: `Bulk ${meal === 'breakfast' ? 'Breakfast' : 'Lunch'} Update`,
    });
    return results;
  }

  // Case 5: Parse key-value deltas from fieldsChanged, before, and after
  const fields = log.changes?.fieldsChanged || Object.keys(log.changes?.after || log.changes?.before || {});
  if (fields.length > 0) {
    let hasRecognizedField = false;

    fields.forEach((field) => {
      // Ignore internal or generic container keys if we have no before/after
      if (field === 'obj' || field === 'dateExceptions' || field === 'templates' || field === 'diningHistory') {
        return;
      }

      hasRecognizedField = true;
      const valBefore = log.changes?.before ? log.changes.before[field] : undefined;
      const valAfter = log.changes?.after ? log.changes.after[field] : undefined;

      const isBf = field.toLowerCase().includes('breakfast');
      const isLunch = field.toLowerCase().includes('lunch');
      const meal = isBf ? 'breakfast' : isLunch ? 'lunch' : 'all';

      results.push({
        type: 'field_delta',
        scopeLabel: field,
        meal,
        mealLabel: meal === 'breakfast' ? 'Breakfast' : meal === 'lunch' ? 'Lunch' : 'Dining Status',
        previous: valBefore,
        current: valAfter,
        previousLabel: typeof valBefore === 'boolean' ? (valBefore ? 'ON' : 'OFF') : String(valBefore ?? 'None'),
        currentLabel: typeof valAfter === 'boolean' ? (valAfter ? 'ON' : 'OFF') : String(valAfter ?? 'None'),
        label: field,
      });
    });

    if (hasRecognizedField && results.length > 0) {
      return results;
    }
  }

  // Case 6: Fallback for Legacy TOKEN_TOGGLE where fields were ['obj', 'dateExceptions'] with no before/after
  if (log.action === 'TOKEN_TOGGLE') {
    const tokenNo = log.target?.tokenNo || log.actor?.tokenNo;
    const name = log.target?.label || log.actor?.displayName || 'Student';
    const summary = log.changes?.diffSummary || `Student Token #${tokenNo} updated weekly schedule and exceptions`;

    results.push({
      type: 'legacy_routine_save',
      scopeLabel: 'Weekly Schedule & Date Exceptions',
      meal: 'all',
      mealLabel: 'Lunch & Breakfast',
      previous: 'Baseline Preferences',
      current: 'Updated Schedule',
      previousLabel: 'Baseline Routine',
      currentLabel: 'Saved Schedule',
      tokenNo,
      studentName: name,
      label: 'Student Dining Routine & Leave Exceptions',
      note: summary,
    });
    return results;
  }

  return results;
}
