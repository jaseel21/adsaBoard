import { useState, useEffect } from 'react';
import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';
import { getTodayISTDate } from './studentExceptionService';

const ACADEMIC_YEAR_DOC_REF = () =>
  firebase.firestore().collection('settings').doc('academic_year');

/**
 * Dynamically computes default academic year bounds based on any given base IST date.
 * Institutional cycle runs June 1 -> May 31.
 * If base date is in Jan-May, cycle started June 1 of previous year.
 * If base date is in Jun-Dec, cycle started June 1 of current year.
 * Zero hardcoded years!
 */
export function computeDynamicDefaultAcademicYear(baseDate = null) {
  const today = baseDate || getTodayISTDate();
  const [yearStr, monthStr] = today.split('-');
  const currYear = parseInt(yearStr, 10) || new Date().getFullYear();
  const currMonth = parseInt(monthStr, 10) || (new Date().getMonth() + 1);

  let startYear;
  let endYear;

  if (currMonth >= 6) {
    startYear = currYear;
    endYear = currYear + 1;
  } else {
    startYear = currYear - 1;
    endYear = currYear;
  }

  const startDate = `${startYear}-06-01`;
  const endDate = `${endYear}-05-31`;
  const id = `${startYear}-${endYear}`;

  return {
    id,
    nameEn: `Academic Year ${startYear} - ${endYear}`,
    nameMl: `അധ്യയന വർഷം ${startYear} - ${endYear}`,
    startDate,
    endDate,
    isLocked: false,
    terms: [
      {
        id: `term_1_${startYear}`,
        nameEn: 'Term 1 (First Semester)',
        nameMl: 'ഒന്നാം ടേം (ആദ്യ സെമസ്റ്റർ)',
        startDate: `${startYear}-06-01`,
        endDate: `${startYear}-10-31`,
      },
      {
        id: `term_2_${endYear}`,
        nameEn: 'Term 2 (Second Semester)',
        nameMl: 'രണ്ടാം ടേം (രണ്ടാം സെമസ്റ്റർ)',
        startDate: `${startYear}-11-01`,
        endDate: `${endYear}-05-31`,
      },
    ],
  };
}

let cachedAcademicYear = computeDynamicDefaultAcademicYear();

/**
 * Synchronous getter for currently cached academic year
 */
export function getCachedAcademicYear() {
  return cachedAcademicYear;
}

/**
 * Subscribe to real-time Academic Year settings in Firestore with dynamic auto-seeding
 */
export function subscribeToAcademicYear(onUpdate, onError) {
  const docRef = ACADEMIC_YEAR_DOC_REF();

  return docRef.onSnapshot(
    async (snapshot) => {
      if (snapshot.exists) {
        const data = snapshot.data() || {};
        const dynamicFallback = computeDynamicDefaultAcademicYear();

        const resolvedConfig = {
          id: data.id || dynamicFallback.id,
          nameEn: data.nameEn || dynamicFallback.nameEn,
          nameMl: data.nameMl || dynamicFallback.nameMl,
          startDate: data.startDate || dynamicFallback.startDate,
          endDate: data.endDate || dynamicFallback.endDate,
          isLocked: Boolean(data.isLocked),
          terms: Array.isArray(data.terms) && data.terms.length > 0 ? data.terms : dynamicFallback.terms,
          updatedAt: data.updatedAt || null,
          updatedBy: data.updatedBy || '',
          updatedByName: data.updatedByName || '',
        };

        cachedAcademicYear = resolvedConfig;
        if (typeof onUpdate === 'function') {
          onUpdate(resolvedConfig);
        }
      } else {
        // Dynamically seed without hardcoding
        const dynamicDefault = computeDynamicDefaultAcademicYear();
        try {
          await docRef.set({
            ...dynamicDefault,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedByName: 'System Dynamic Auto-Seed',
          });
          cachedAcademicYear = dynamicDefault;
          if (typeof onUpdate === 'function') {
            onUpdate(cachedAcademicYear);
          }
        } catch (seedErr) {
          console.warn('Could not dynamically seed academic year config:', seedErr);
          cachedAcademicYear = dynamicDefault;
          if (typeof onUpdate === 'function') {
            onUpdate(cachedAcademicYear);
          }
        }
      }
    },
    (err) => {
      console.error('Error subscribing to academic year config:', err);
      if (typeof onError === 'function') {
        onError(err);
      }
    }
  );
}

/**
 * Persist updated Academic Year settings to Firestore with full audit logging
 */
export async function saveAcademicYearConfig(updates = {}, actor = {}) {
  const docRef = ACADEMIC_YEAR_DOC_REF();
  const current = cachedAcademicYear || computeDynamicDefaultAcademicYear();

  const payload = {
    id: updates.id || `${(updates.startDate || current.startDate).slice(0, 4)}-${(updates.endDate || current.endDate).slice(0, 4)}`,
    nameEn: updates.nameEn || current.nameEn,
    nameMl: updates.nameMl || current.nameMl,
    startDate: updates.startDate || current.startDate,
    endDate: updates.endDate || current.endDate,
    isLocked: updates.isLocked !== undefined ? Boolean(updates.isLocked) : current.isLocked,
    terms: updates.terms || current.terms,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: actor.uid || '',
    updatedByName: actor.displayName || actor.email || 'Admin',
  };

  await docRef.set(payload, { merge: true });
  cachedAcademicYear = { ...current, ...payload };

  try {
    await logAuditEvent({
      action: 'UPDATE_ACADEMIC_YEAR_CONFIG',
      category: AUDIT_CATEGORIES.SYSTEM,
      severity: AUDIT_SEVERITIES.WARNING,
      actor: {
        uid: actor.uid || '',
        displayName: actor.displayName || actor.email || 'Admin',
        role: actor.role || 'canteen_committee',
      },
      target: {
        type: 'config',
        id: 'academic_year',
        label: payload.nameEn,
      },
      changes: {
        diffSummary: `Academic Year set to ${payload.nameEn} (${payload.startDate} to ${payload.endDate})`,
        before: {
          startDate: current.startDate,
          endDate: current.endDate,
          nameEn: current.nameEn,
        },
        after: {
          startDate: payload.startDate,
          endDate: payload.endDate,
          nameEn: payload.nameEn,
        },
      },
    });
  } catch (auditErr) {
    console.warn('Failed to log academic year audit event:', auditErr);
  }

  return payload;
}

/**
 * Checks if a YYYY-MM-DD date string falls strictly within the active Academic Year
 */
export function isDateWithinAcademicYear(dateStr, yearConfig = null) {
  if (!dateStr) return false;
  const config = yearConfig || cachedAcademicYear || computeDynamicDefaultAcademicYear();
  if (config.startDate && dateStr < config.startDate) return false;
  if (config.endDate && dateStr > config.endDate) return false;
  return true;
}

/**
 * Clamps a YYYY-MM-DD date string to stay within [startDate, endDate]
 */
export function clampDateToAcademicYear(dateStr, yearConfig = null) {
  const config = yearConfig || cachedAcademicYear || computeDynamicDefaultAcademicYear();
  if (!dateStr) return config.startDate;
  if (config.startDate && dateStr < config.startDate) return config.startDate;
  if (config.endDate && dateStr > config.endDate) return config.endDate;
  return dateStr;
}

/**
 * Returns an array of months covered by the academic year from startDate to endDate
 * Each entry: { year: number, monthIndex: number (0-11), monthName: string, label: string, key: string }
 */
export function getAcademicYearMonths(yearConfig = null) {
  const config = yearConfig || cachedAcademicYear || computeDynamicDefaultAcademicYear();
  const [startY, startM] = config.startDate.split('-').map(Number);
  const [endY, endM] = config.endDate.split('-').map(Number);

  const months = [];
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  let currY = startY;
  let currM = startM - 1; // 0-indexed

  const endMonthTotal = endY * 12 + (endM - 1);

  while (currY * 12 + currM <= endMonthTotal) {
    months.push({
      year: currY,
      monthIndex: currM,
      monthNumber: currM + 1,
      monthName: monthNames[currM],
      label: `${monthNames[currM]} ${currY}`,
      key: `${currY}-${String(currM + 1).padStart(2, '0')}`,
    });

    currM++;
    if (currM > 11) {
      currM = 0;
      currY++;
    }
  }

  return months;
}

/**
 * React Hook for consuming Academic Year state and actions
 */
export function useAcademicYear() {
  const [academicYear, setAcademicYear] = useState(getCachedAcademicYear);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = subscribeToAcademicYear((cfg) => {
      setAcademicYear(cfg);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return {
    academicYear,
    loading,
    startDate: academicYear.startDate,
    endDate: academicYear.endDate,
    nameEn: academicYear.nameEn,
    nameMl: academicYear.nameMl,
    terms: academicYear.terms,
    isLocked: academicYear.isLocked,
    isDateWithinYear: (d) => isDateWithinAcademicYear(d, academicYear),
    clampDate: (d) => clampDateToAcademicYear(d, academicYear),
    yearMonths: getAcademicYearMonths(academicYear),
    saveConfig: (updates, actor) => saveAcademicYearConfig(updates, actor),
  };
}
