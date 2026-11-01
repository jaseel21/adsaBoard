/**
 * ADSA T-Board Institutional About & Governance Data Service
 * Real-time Firestore synchronization, zero-latency local fallback cache,
 * fine-grained administrative CRUD, image optimization, and immutable audit logging.
 */

import firebase from '../firebase/config';
import {
  DEFAULT_ABOUT_META,
  DEFAULT_MUDARRISUN,
  DEFAULT_TENURES,
  DEFAULT_FEATURES,
  DEFAULT_MILESTONES,
  DEFAULT_GALLERY,
} from '../data/defaultAboutData';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';
import { optimizeProfilePhoto } from './imageOptimizer';

/**
 * 1. Subscribe to Institutional Metadata & Hero Configuration
 */
export function subscribeAboutMeta(callback) {
  const db = firebase.firestore();
  const docRef = db.collection('about_meta').doc('config');

  return docRef.onSnapshot(
    (doc) => {
      if (doc.exists) {
        const remote = doc.data();
        callback({
          hero: { ...DEFAULT_ABOUT_META.hero, ...(remote.hero || {}) },
          stats: remote.stats && remote.stats.length ? remote.stats : DEFAULT_ABOUT_META.stats,
          darsEthos: { ...DEFAULT_ABOUT_META.darsEthos, ...(remote.darsEthos || {}) },
          adsaStory: { ...DEFAULT_ABOUT_META.adsaStory, ...(remote.adsaStory || {}) },
          tboardStory: { ...DEFAULT_ABOUT_META.tboardStory, ...(remote.tboardStory || {}) },
          sectionVisibility: remote.sectionVisibility || {
            mudarrisun: true,
            centralCommittee: true,
            canteenWing: true,
            subCommittees: true,
            tboardStory: true,
            features: true,
            milestones: true,
            gallery: true,
            guideBridge: true,
          },
          updatedAt: remote.updatedAt || null,
        });
      } else {
        // Return rich default fallbacks
        callback(DEFAULT_ABOUT_META);
      }
    },
    (err) => {
      console.warn('[aboutService] Metadata sync notice (using defaults):', err.message);
      callback(DEFAULT_ABOUT_META);
    }
  );
}

/**
 * 2. Subscribe to Mudarrisun (Faculty) List
 */
export function subscribeMudarrisun(callback) {
  const db = firebase.firestore();
  const colRef = db.collection('about_mudarrisun').orderBy('order', 'asc');

  return colRef.onSnapshot(
    (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
      } else {
        callback(DEFAULT_MUDARRISUN);
      }
    },
    (err) => {
      console.warn('[aboutService] Mudarrisun sync notice (using defaults):', err.message);
      callback(DEFAULT_MUDARRISUN);
    }
  );
}

/**
 * 3. Subscribe to Tenures & Committees List
 */
export function subscribeTenures(callback) {
  const db = firebase.firestore();
  const colRef = db.collection('about_committees');

  return colRef.onSnapshot(
    (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Sort current tenure first, then academic year descending
        list.sort((a, b) => {
          if (a.isCurrentTenure && !b.isCurrentTenure) return -1;
          if (!a.isCurrentTenure && b.isCurrentTenure) return 1;
          return (b.academicYear || '').localeCompare(a.academicYear || '');
        });
        callback(list);
      } else {
        callback(DEFAULT_TENURES);
      }
    },
    (err) => {
      console.warn('[aboutService] Tenures sync notice (using defaults):', err.message);
      callback(DEFAULT_TENURES);
    }
  );
}

/**
 * 4. Subscribe to Features Matrix
 */
export function subscribeFeatures(callback) {
  const db = firebase.firestore();
  const colRef = db.collection('about_features').orderBy('order', 'asc');

  return colRef.onSnapshot(
    (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
      } else {
        callback(DEFAULT_FEATURES);
      }
    },
    (err) => {
      console.warn('[aboutService] Features sync notice (using defaults):', err.message);
      callback(DEFAULT_FEATURES);
    }
  );
}

/**
 * 5. Subscribe to Milestones Timeline
 */
export function subscribeMilestones(callback) {
  const db = firebase.firestore();
  const colRef = db.collection('about_milestones').orderBy('order', 'asc');

  return colRef.onSnapshot(
    (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
      } else {
        callback(DEFAULT_MILESTONES);
      }
    },
    (err) => {
      console.warn('[aboutService] Milestones sync notice (using defaults):', err.message);
      callback(DEFAULT_MILESTONES);
    }
  );
}

/**
 * 6. Subscribe to Campus Gallery
 */
export function subscribeGallery(callback) {
  const db = firebase.firestore();
  const colRef = db.collection('about_gallery');

  return colRef.onSnapshot(
    (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        callback(list);
      } else {
        callback(DEFAULT_GALLERY);
      }
    },
    (err) => {
      console.warn('[aboutService] Gallery sync notice (using defaults):', err.message);
      callback(DEFAULT_GALLERY);
    }
  );
}

// =========================================================================
// ADMINISTRATIVE MUTATIONS & CRUD OPERATIONS
// =========================================================================

/**
 * Save Institutional Metadata & Hero Configuration
 */
export async function saveAboutMeta(metaPayload, actor = {}) {
  const db = firebase.firestore();
  const docRef = db.collection('about_meta').doc('config');

  const updateData = {
    ...metaPayload,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: actor.name || actor.email || 'Admin',
  };

  await docRef.set(updateData, { merge: true });

  await logAuditEvent({
    action: 'ABOUT_META_UPDATED',
    actor: actor.name || actor.email || 'Admin',
    category: AUDIT_CATEGORIES.SYSTEM,
    severity: AUDIT_SEVERITIES.INFO,
    details: 'Updated institutional About metadata, hero settings, and section visibility.',
  });
}

/**
 * Save or Update a Mudarris (Faculty Member)
 */
export async function saveMudarris(facultyData, actor = {}) {
  const db = firebase.firestore();
  const isNew = !facultyData.id;
  const docRef = isNew
    ? db.collection('about_mudarrisun').doc()
    : db.collection('about_mudarrisun').doc(facultyData.id);

  const payload = {
    ...facultyData,
    id: docRef.id,
    order: Number(facultyData.order) || 1,
    active: facultyData.active !== false,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: actor.name || actor.email || 'Admin',
  };

  await docRef.set(payload, { merge: true });

  await logAuditEvent({
    action: isNew ? 'MUDARRIS_CREATED' : 'MUDARRIS_UPDATED',
    actor: actor.name || actor.email || 'Admin',
    category: AUDIT_CATEGORIES.SYSTEM,
    severity: AUDIT_SEVERITIES.INFO,
    details: `${isNew ? 'Added' : 'Updated'} faculty member: ${payload.nameEn || payload.nameMl}`,
  });

  return docRef.id;
}

/**
 * Delete a Mudarris Record
 */
export async function deleteMudarris(facultyId, facultyName, actor = {}) {
  const db = firebase.firestore();
  await db.collection('about_mudarrisun').doc(facultyId).delete();

  await logAuditEvent({
    action: 'MUDARRIS_DELETED',
    actor: actor.name || actor.email || 'Admin',
    category: AUDIT_CATEGORIES.SYSTEM,
    severity: AUDIT_SEVERITIES.WARNING,
    details: `Deleted faculty record: ${facultyName} (${facultyId})`,
  });
}

/**
 * Batch Reorder Mudarrisun
 */
export async function reorderMudarrisun(reorderedList, actor = {}) {
  const db = firebase.firestore();
  const batch = db.batch();

  reorderedList.forEach((item, index) => {
    const ref = db.collection('about_mudarrisun').doc(item.id);
    batch.update(ref, { order: index + 1 });
  });

  await batch.commit();

  await logAuditEvent({
    action: 'MUDARRISUN_REORDERED',
    actor: actor.name || actor.email || 'Admin',
    category: AUDIT_CATEGORIES.SYSTEM,
    severity: AUDIT_SEVERITIES.INFO,
    details: `Reordered ${reorderedList.length} Mudarrisun faculty profiles.`,
  });
}

/**
 * Save or Update an Academic Tenure & Committee Roster
 */
export async function saveTenureCommittees(tenureData, actor = {}) {
  const db = firebase.firestore();
  const tenureId =
    tenureData.id || `tenure_${(tenureData.academicYear || 'term').replace(/[^a-zA-Z0-9]/g, '_')}`;
  const docRef = db.collection('about_committees').doc(tenureId);

  // If set to current tenure, unset any other active current tenures
  if (tenureData.isCurrentTenure) {
    const existingActive = await db
      .collection('about_committees')
      .where('isCurrentTenure', '==', true)
      .get();

    const batch = db.batch();
    existingActive.forEach((doc) => {
      if (doc.id !== tenureId) {
        batch.update(doc.ref, { isCurrentTenure: false });
      }
    });
    await batch.commit();
  }

  const payload = {
    ...tenureData,
    id: tenureId,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: actor.name || actor.email || 'Admin',
  };

  await docRef.set(payload, { merge: true });

  await logAuditEvent({
    action: 'TENURE_COMMITTEE_SAVED',
    actor: actor.name || actor.email || 'Admin',
    category: AUDIT_CATEGORIES.SYSTEM,
    severity: AUDIT_SEVERITIES.INFO,
    details: `Updated committee roster for tenure: ${tenureData.academicYear} (${tenureId})`,
  });

  return tenureId;
}

/**
 * Delete a Tenure Record
 */
export async function deleteTenure(tenureId, tenureLabel, actor = {}) {
  const db = firebase.firestore();
  await db.collection('about_committees').doc(tenureId).delete();

  await logAuditEvent({
    action: 'TENURE_DELETED',
    actor: actor.name || actor.email || 'Admin',
    category: AUDIT_CATEGORIES.SYSTEM,
    severity: AUDIT_SEVERITIES.WARNING,
    details: `Deleted tenure roster: ${tenureLabel} (${tenureId})`,
  });
}

/**
 * Save or Update Feature Card
 */
export async function saveFeature(featureData, actor = {}) {
  const db = firebase.firestore();
  const isNew = !featureData.id;
  const docRef = isNew
    ? db.collection('about_features').doc()
    : db.collection('about_features').doc(featureData.id);

  const payload = {
    ...featureData,
    id: docRef.id,
    order: Number(featureData.order) || 1,
    active: featureData.active !== false,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  await docRef.set(payload, { merge: true });

  await logAuditEvent({
    action: isNew ? 'ABOUT_FEATURE_CREATED' : 'ABOUT_FEATURE_UPDATED',
    actor: actor.name || actor.email || 'Admin',
    category: AUDIT_CATEGORIES.SYSTEM,
    severity: AUDIT_SEVERITIES.INFO,
    details: `${isNew ? 'Added' : 'Updated'} platform feature card: ${payload.titleEn}`,
  });
}

/**
 * Delete Feature Card
 */
export async function deleteFeature(featureId, title, actor = {}) {
  const db = firebase.firestore();
  await db.collection('about_features').doc(featureId).delete();

  await logAuditEvent({
    action: 'ABOUT_FEATURE_DELETED',
    actor: actor.name || actor.email || 'Admin',
    category: AUDIT_CATEGORIES.SYSTEM,
    severity: AUDIT_SEVERITIES.WARNING,
    details: `Deleted platform feature card: ${title} (${featureId})`,
  });
}

/**
 * Save or Update Milestone
 */
export async function saveMilestone(milestoneData, actor = {}) {
  const db = firebase.firestore();
  const isNew = !milestoneData.id;
  const docRef = isNew
    ? db.collection('about_milestones').doc()
    : db.collection('about_milestones').doc(milestoneData.id);

  const payload = {
    ...milestoneData,
    id: docRef.id,
    order: Number(milestoneData.order) || 1,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  await docRef.set(payload, { merge: true });
}

/**
 * Delete Milestone
 */
export async function deleteMilestone(milestoneId) {
  const db = firebase.firestore();
  await db.collection('about_milestones').doc(milestoneId).delete();
}

/**
 * Save or Update Gallery Item
 */
export async function saveGalleryItem(itemData, actor = {}) {
  const db = firebase.firestore();
  const isNew = !itemData.id;
  const docRef = isNew
    ? db.collection('about_gallery').doc()
    : db.collection('about_gallery').doc(itemData.id);

  const payload = {
    ...itemData,
    id: docRef.id,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  await docRef.set(payload, { merge: true });
}

/**
 * Delete Gallery Item
 */
export async function deleteGalleryItem(itemId) {
  const db = firebase.firestore();
  await db.collection('about_gallery').doc(itemId).delete();
}

/**
 * Master One-Click Seeding of Default Institutional Data
 * Populates Firestore with rich default data if admin chooses to bootstrap the database.
 */
export async function seedAboutInitialData(actor = {}) {
  const db = firebase.firestore();
  const batch = db.batch();

  // 1. Meta config
  batch.set(db.collection('about_meta').doc('config'), {
    ...DEFAULT_ABOUT_META,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: actor.name || actor.email || 'Initial Seeder',
  });

  // 2. Mudarrisun
  DEFAULT_MUDARRISUN.forEach((item) => {
    batch.set(db.collection('about_mudarrisun').doc(item.id), item);
  });

  // 3. Tenures
  DEFAULT_TENURES.forEach((item) => {
    batch.set(db.collection('about_committees').doc(item.id), item);
  });

  // 4. Features
  DEFAULT_FEATURES.forEach((item) => {
    batch.set(db.collection('about_features').doc(item.id), item);
  });

  // 5. Milestones
  DEFAULT_MILESTONES.forEach((item) => {
    batch.set(db.collection('about_milestones').doc(item.id), item);
  });

  // 6. Gallery
  DEFAULT_GALLERY.forEach((item) => {
    batch.set(db.collection('about_gallery').doc(item.id), item);
  });

  await batch.commit();

  await logAuditEvent({
    action: 'ABOUT_DATA_SEEDED',
    actor: actor.name || actor.email || 'Admin',
    category: AUDIT_CATEGORIES.SYSTEM,
    severity: AUDIT_SEVERITIES.WARNING,
    details: 'Bootstrapped initial institutional About data into Firestore.',
  });
}

/**
 * Utility to process uploaded image file or URL.
 * If file is provided, compresses to ultra-lightweight WebP/JPEG dataUrl (<45KB).
 * If raw URL is provided, validates and returns it.
 */
export async function processMemberImage(fileOrBlobOrUrl) {
  if (!fileOrBlobOrUrl) return null;
  if (typeof fileOrBlobOrUrl === 'string') {
    return fileOrBlobOrUrl.trim();
  }
  return await optimizeProfilePhoto(fileOrBlobOrUrl, {
    maxWidth: 400,
    maxHeight: 400,
    quality: 0.85,
    cropSquare: true,
  });
}

