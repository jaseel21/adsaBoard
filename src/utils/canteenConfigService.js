import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

export const DEFAULT_CANTEEN_CONFIG = {
  sectionChunkSize: 25,
  defaultViewMode: 'sections',
};

const CANTEEN_CONFIG_DOC_REF = () =>
  firebase.firestore().collection('settings').doc('canteen_config');

let cachedConfig = { ...DEFAULT_CANTEEN_CONFIG };

/**
 * Real-time listener for canteen operational settings (including section chunk size).
 * Automatically seeds defaults if document does not exist yet.
 */
export function subscribeToCanteenConfig(onUpdate, onError) {
  const docRef = CANTEEN_CONFIG_DOC_REF();

  return docRef.onSnapshot(
    async (snapshot) => {
      if (snapshot.exists) {
        const data = snapshot.data() || {};
        const parsedConfig = {
          sectionChunkSize: Number(data.sectionChunkSize) > 0 ? Number(data.sectionChunkSize) : DEFAULT_CANTEEN_CONFIG.sectionChunkSize,
          defaultViewMode: data.defaultViewMode || DEFAULT_CANTEEN_CONFIG.defaultViewMode,
          updatedAt: data.updatedAt || null,
          updatedBy: data.updatedBy || '',
          updatedByName: data.updatedByName || '',
        };
        cachedConfig = parsedConfig;
        if (typeof onUpdate === 'function') {
          onUpdate(parsedConfig);
        }
      } else {
        // Seed default config in Firestore
        try {
          await docRef.set({
            ...DEFAULT_CANTEEN_CONFIG,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedByName: 'System Auto-Seed',
          });
          cachedConfig = { ...DEFAULT_CANTEEN_CONFIG };
          if (typeof onUpdate === 'function') {
            onUpdate(cachedConfig);
          }
        } catch (seedErr) {
          console.warn('Could not seed default canteen config:', seedErr);
          if (typeof onUpdate === 'function') {
            onUpdate(cachedConfig);
          }
        }
      }
    },
    (err) => {
      console.error('Error in canteenConfig listener:', err);
      if (typeof onError === 'function') {
        onError(err);
      } else if (typeof onUpdate === 'function') {
        onUpdate(cachedConfig);
      }
    }
  );
}

/**
 * Returns current cached config synchronously for instant UI initialization.
 */
export function getCachedCanteenConfig() {
  return cachedConfig;
}

/**
 * Updates the mess section chunk size in Firestore and records an audit log.
 * @param {number} newChunkSize
 * @param {object} actor - { uid, displayName, email, role }
 */
export async function updateSectionChunkSize(newChunkSize, actor = {}) {
  const size = Math.max(5, Math.min(100, Math.round(Number(newChunkSize) || 25)));
  const docRef = CANTEEN_CONFIG_DOC_REF();

  const prevSize = cachedConfig.sectionChunkSize;

  await docRef.set(
    {
      sectionChunkSize: size,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      updatedBy: actor.uid || 'admin',
      updatedByName: actor.displayName || actor.email || 'Admin',
    },
    { merge: true }
  );

  cachedConfig.sectionChunkSize = size;

  // Log audit event
  try {
    await logAuditEvent({
      action: 'UPDATE_SECTION_CHUNK_SIZE',
      category: AUDIT_CATEGORIES.SYSTEM,
      severity: AUDIT_SEVERITIES.INFO,
      actor: {
        uid: actor.uid || '',
        displayName: actor.displayName || actor.email || 'Admin',
        role: actor.role || 'admin',
      },
      target: {
        type: 'config',
        id: 'canteen_config',
        label: 'Mess Section Chunk Size',
      },
      changes: {
        before: { sectionChunkSize: prevSize },
        after: { sectionChunkSize: size },
        diffSummary: `Section chunk size changed from ${prevSize} to ${size} tokens per section`,
      },
    });
  } catch (logErr) {
    console.warn('Could not record audit log for section config update:', logErr);
  }

  return size;
}
