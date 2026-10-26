import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

/**
 * System collections included in full database snapshot
 */
export const BACKUP_COLLECTIONS = [
  { id: 'students', label: 'Students Directory & Meal Tokens' },
  { id: 'settings', label: 'System, Governance & Canteen Config' },
  { id: 'dietary_preferences', label: 'Dietary Master Categories' },
  { id: 'menus', label: 'Weekly Food Menus & Recipes' },
  { id: 'staff_users', label: 'Staff Roles & Authorization' },
  { id: 'support_tickets', label: 'Care & Inquiries Tickets' },
];

/**
 * Calculate SHA-256 Checksum using Web Crypto API
 */
export async function calculateSha256(contentString) {
  try {
    if (typeof window !== 'undefined' && window.crypto?.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(contentString);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {
    console.warn('Web Crypto SHA-256 fallback:', e);
  }

  // Pure JS fallback hash
  let hash = 0;
  for (let i = 0; i < contentString.length; i++) {
    const char = contentString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash).toString(16).padStart(16, '0');
}

/**
 * Trigger browser file download from string content
 */
export function triggerFileDownload(content, filename, mimeType = 'application/json') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Record a snapshot entry in the Firestore `/system_backups` catalog
 */
export async function recordBackupInCatalog({
  backupPackage,
  checksum,
  sizeBytes,
  actor = {},
  triggerType = 'MANUAL_DISPATCH',
}) {
  const db = firebase.firestore();
  const backupId = `bup_${Date.now()}`;
  const catalogRef = db.collection('system_backups').doc(backupId);

  const collectionsDumped = Object.keys(backupPackage.collections || {}).map((colId) => ({
    collectionId: colId,
    documentCount: (backupPackage.collections[colId] || []).length,
  }));

  const totalDocuments = collectionsDumped.reduce((acc, c) => acc + c.documentCount, 0);

  const record = {
    id: backupId,
    type: triggerType,
    status: 'COMPLETED',
    checksum: checksum || 'verified',
    sizeBytes: sizeBytes || 0,
    collectionsDumped,
    totalDocuments,
    version: backupPackage.version || '3.0.0',
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    createdAtISO: new Date().toISOString(),
    createdBy: {
      uid: actor.uid || 'admin',
      displayName: actor.displayName || actor.email || 'Admin',
      role: actor.role || 'developer',
    },
  };

  await catalogRef.set(record);
  return record;
}

/**
 * Real-time listener for the `/system_backups` catalog
 */
export function subscribeToBackupCatalog(onUpdate, onError) {
  const db = firebase.firestore();
  return db
    .collection('system_backups')
    .orderBy('createdAt', 'desc')
    .limit(25)
    .onSnapshot(
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (typeof onUpdate === 'function') {
          onUpdate(list);
        }
      },
      (err) => {
        console.error('Error fetching system backups catalog:', err);
        if (typeof onError === 'function') onError(err);
      }
    );
}

/**
 * Delete a backup entry from the catalog
 */
export async function deleteBackupRecord(backupId, actor = {}) {
  const db = firebase.firestore();
  await db.collection('system_backups').doc(backupId).delete();

  try {
    await logAuditEvent({
      action: 'DELETE_BACKUP_RECORD',
      category: AUDIT_CATEGORIES.SYSTEM,
      severity: AUDIT_SEVERITIES.WARNING,
      actor: {
        uid: actor.uid || '',
        displayName: actor.displayName || actor.email || 'Admin',
        role: actor.role || 'admin',
      },
      target: {
        type: 'database',
        id: backupId,
        label: `Backup Catalog Record: ${backupId}`,
      },
    });
  } catch (err) {
    console.warn('Audit error on backup deletion:', err);
  }
}

/**
 * Generate full system JSON backup snapshot from live Firestore
 */
export async function generateFullSystemBackup(actor = {}, options = {}) {
  const db = firebase.firestore();
  const timestamp = new Date().toISOString();
  const collectionsToDump = options.collections || BACKUP_COLLECTIONS.map((c) => c.id);

  const exportPackage = {
    version: '3.0.0',
    exportedAt: timestamp,
    exportedBy: {
      uid: actor.uid || '',
      displayName: actor.displayName || actor.email || 'Admin',
      role: actor.role || 'admin',
    },
    collections: {},
    summary: {},
  };

  for (const colId of collectionsToDump) {
    try {
      const snap = await db.collection(colId).get();
      const docs = [];
      snap.forEach((doc) => {
        docs.push({
          _docId: doc.id,
          ...doc.data(),
        });
      });
      exportPackage.collections[colId] = docs;
      exportPackage.summary[colId] = docs.length;
    } catch (err) {
      console.warn(`Could not export collection ${colId}:`, err);
      exportPackage.collections[colId] = [];
      exportPackage.summary[colId] = 0;
    }
  }

  const jsonString = JSON.stringify(exportPackage, null, 2);
  const checksum = await calculateSha256(jsonString);
  const sizeBytes = new Blob([jsonString]).size;

  // Record catalog entry in Firestore
  try {
    await recordBackupInCatalog({
      backupPackage: exportPackage,
      checksum,
      sizeBytes,
      actor,
      triggerType: options.triggerType || 'MANUAL_DISPATCH',
    });
  } catch (catErr) {
    console.warn('Could not record backup catalog entry:', catErr);
  }

  // Record audit log
  try {
    await logAuditEvent({
      action: 'EXPORT_DATABASE_BACKUP',
      category: AUDIT_CATEGORIES.SYSTEM,
      severity: AUDIT_SEVERITIES.INFO,
      actor: {
        uid: actor.uid || '',
        displayName: actor.displayName || actor.email || 'Admin',
        role: actor.role || 'admin',
      },
      target: {
        type: 'database',
        id: 'full_snapshot',
        label: 'ADSA Master Database Backup',
      },
      details: {
        summary: exportPackage.summary,
        checksum,
        sizeBytes,
      },
    });
  } catch (logErr) {
    console.warn('Audit log error on backup export:', logErr);
  }

  // Trigger file download if requested (default true)
  if (options.download !== false) {
    const dateSlug = timestamp.slice(0, 10);
    const timeSlug = timestamp.slice(11, 16).replace(':', '');
    const filename = `adsa_tboard_backup_${dateSlug}_${timeSlug}.json`;
    triggerFileDownload(jsonString, filename);
  }

  return {
    exportPackage,
    checksum,
    sizeBytes,
    jsonString,
  };
}

/**
 * Generate personal student dining record download
 */
export async function exportStudentPersonalDossier(studentData = {}) {
  const timestamp = new Date().toISOString();
  const dossier = {
    system: 'ADSA T-Board Dining Dossier',
    exportedAt: timestamp,
    student: {
      tokenNo: studentData.tokenNo,
      name: studentData.name,
      malayalamName: studentData.nameMl || studentData.malName,
      batch: studentData.batch,
      roomNo: studentData.roomNo || studentData.room,
      blockStatus: studentData.block ? 'Blocked' : 'Active',
      blockReason: studentData.blockReason || null,
    },
    mealSchedule: {
      breakfast: studentData.obj?.breakfast || {},
      lunch: studentData.obj?.lunch || {},
      dietaryPreferences: studentData.obj2 || {},
    },
    dateSpecificExceptions: studentData.dateExceptions || {},
    pendingDietaryRequest: studentData.pendingDietaryRequest || null,
    pendingUnblockRequest: studentData.pendingUnblockRequest || null,
  };

  const filename = `adsa_student_token_${studentData.tokenNo || 'profile'}_record.json`;
  triggerFileDownload(JSON.stringify(dossier, null, 2), filename);
  return dossier;
}

/**
 * Parse & validate an imported JSON backup file
 */
export function validateBackupFile(fileContent) {
  try {
    const data = JSON.parse(fileContent);
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'File is not a valid JSON object' };
    }

    if (!data.collections || typeof data.collections !== 'object') {
      return { isValid: false, error: 'Missing standard collections root in backup JSON' };
    }

    const availableCollections = Object.keys(data.collections).filter(
      (k) => Array.isArray(data.collections[k]) && data.collections[k].length > 0
    );

    if (availableCollections.length === 0) {
      return { isValid: false, error: 'Backup file contains zero data rows across all collections' };
    }

    return {
      isValid: true,
      version: data.version || 'unknown',
      exportedAt: data.exportedAt || 'unknown',
      exportedBy: data.exportedBy || {},
      collections: availableCollections,
      summary: data.summary || availableCollections.reduce((acc, k) => ({ ...acc, [k]: data.collections[k].length }), {}),
      parsedData: data,
    };
  } catch (err) {
    return { isValid: false, error: `JSON Parse Syntax Error: ${err.message}` };
  }
}

/**
 * Compute Dry-Run Comparison between Backup Data and Current Live Firestore
 */
export async function computeDryRunDiff(backupData) {
  const db = firebase.firestore();
  const diffReport = {
    collections: {},
    totalNewDocs: 0,
    totalUpdatedDocs: 0,
    canProceed: true,
  };

  const collections = backupData.collections || {};

  for (const colName of Object.keys(collections)) {
    const backupDocs = collections[colName] || [];
    const report = {
      collection: colName,
      backupDocCount: backupDocs.length,
      newDocsCount: 0,
      existingDocsCount: 0,
      sampleChanges: [],
    };

    try {
      // Get live doc IDs
      const liveSnap = await db.collection(colName).get();
      const liveDocIds = new Set(liveSnap.docs.map((d) => d.id));

      for (const bDoc of backupDocs) {
        const id = bDoc._docId || bDoc.id || String(bDoc.tokenNo);
        if (id) {
          if (liveDocIds.has(id)) {
            report.existingDocsCount += 1;
            if (report.sampleChanges.length < 5) {
              report.sampleChanges.push({ id, type: 'update', label: bDoc.name || bDoc.tokenNo || id });
            }
          } else {
            report.newDocsCount += 1;
            if (report.sampleChanges.length < 5) {
              report.sampleChanges.push({ id, type: 'create', label: bDoc.name || bDoc.tokenNo || id });
            }
          }
        }
      }
    } catch (err) {
      console.warn(`Dry-run comparison error on ${colName}:`, err);
    }

    diffReport.collections[colName] = report;
    diffReport.totalNewDocs += report.newDocsCount;
    diffReport.totalUpdatedDocs += report.existingDocsCount;
  }

  return diffReport;
}

/**
 * Execute restore of selected collections with batch chunking (400 items max per batch)
 */
export async function executeRestore(backupData, selectedCollections = [], actor = {}) {
  const db = firebase.firestore();
  const results = {
    success: true,
    restoredCounts: {},
    errors: [],
  };

  const collections = backupData.collections || {};

  for (const colName of selectedCollections) {
    const docsToRestore = collections[colName];
    if (!Array.isArray(docsToRestore) || docsToRestore.length === 0) continue;

    let restoredForCol = 0;
    const chunkSize = 400; // safe limit under Firestore 500-op cap
    for (let i = 0; i < docsToRestore.length; i += chunkSize) {
      const chunk = docsToRestore.slice(i, i + chunkSize);
      const batch = db.batch();

      for (const item of chunk) {
        const docId = item._docId || item.id || (item.tokenNo ? String(item.tokenNo) : null);
        if (!docId) continue;

        // Clean out internal export helper keys
        const cleanPayload = { ...item };
        delete cleanPayload._docId;

        const docRef = db.collection(colName).doc(docId);
        batch.set(docRef, cleanPayload, { merge: true });
        restoredForCol += 1;
      }

      try {
        await batch.commit();
      } catch (batchErr) {
        console.error(`Error committing restore batch on ${colName}:`, batchErr);
        results.errors.push(`${colName} batch error: ${batchErr.message}`);
        results.success = false;
      }
    }

    results.restoredCounts[colName] = restoredForCol;
  }

  // Audit log the restore action
  try {
    await logAuditEvent({
      action: 'RESTORE_DATABASE_BACKUP',
      category: AUDIT_CATEGORIES.SYSTEM,
      severity: AUDIT_SEVERITIES.WARNING,
      actor: {
        uid: actor.uid || '',
        displayName: actor.displayName || actor.email || 'Admin',
        role: actor.role || 'admin',
      },
      target: {
        type: 'database',
        id: 'restore_snapshot',
        label: 'ADSA Database Restore Operation',
      },
      details: {
        restoredCounts: results.restoredCounts,
        errors: results.errors,
      },
    });
  } catch (logErr) {
    console.warn('Audit log error on restore execute:', logErr);
  }

  return results;
}
