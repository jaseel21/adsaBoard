import firebase from '../firebase/config';

/**
 * ADSA T-Board Centralized Audit Logging Service
 * Provides robust, resilient, structured audit recording and real-time streaming
 * for committee administration, student self-service, and system actions.
 */

export const AUDIT_CATEGORIES = {
  TOKENS: 'tokens',
  STUDENTS: 'students',
  MENU: 'menu',
  DIETARY: 'dietary',
  SECURITY: 'security',
  SYSTEM: 'system',
  NOTIFICATIONS: 'notifications',
  SUPPORT: 'support',
};

export const AUDIT_SEVERITIES = {
  INFO: 'info',
  NOTICE: 'notice',
  WARNING: 'warning',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency',
};

/**
 * Determine device type based on user agent and screen
 */
function getDeviceType() {
  if (typeof window === 'undefined') return 'desktop';
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Sanitize deep objects to prevent Firestore errors (no undefined, no circular refs, size limits)
 */
function sanitizePayload(obj, depth = 0) {
  if (obj === null || obj === undefined) return null;
  if (depth > 4) return '[Nested]';

  if (typeof obj === 'string') {
    return obj.length > 500 ? obj.slice(0, 500) + '…' : obj;
  }
  if (typeof obj === 'number' || typeof obj === 'boolean') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.slice(0, 25).map((item) => sanitizePayload(item, depth + 1));
  }
  if (typeof obj === 'object') {
    const clean = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val !== undefined && typeof val !== 'function') {
        clean[key] = sanitizePayload(val, depth + 1);
      }
    }
    return clean;
  }
  return String(obj);
}

/**
 * Generate keywords for rapid client and server searching
 */
function generateSearchTerms(tokens) {
  const terms = new Set();
  tokens.forEach((token) => {
    if (!token) return;
    const str = String(token).toLowerCase().trim();
    if (str.length >= 2) {
      terms.add(str);
      // Also split words
      str.split(/[\s,._-]+/).forEach((sub) => {
        if (sub.length >= 2) terms.add(sub);
      });
    }
  });
  return Array.from(terms).slice(0, 30);
}

/**
 * Calculates human-readable diff summary and field lists between two states
 */
export function calculateObjectDiff(before = {}, after = {}) {
  const beforeObj = before || {};
  const afterObj = after || {};
  const allKeys = Array.from(new Set([...Object.keys(beforeObj), ...Object.keys(afterObj)]));

  const fieldsChanged = [];
  const deltaBefore = {};
  const deltaAfter = {};

  allKeys.forEach((key) => {
    // Ignore internal timestamp or transient keys
    if (key.startsWith('_') || key === 'updatedAt' || key === 'serverTimestamp') return;

    const valB = beforeObj[key];
    const valA = afterObj[key];

    const isDifferent = JSON.stringify(valB) !== JSON.stringify(valA);
    if (isDifferent) {
      fieldsChanged.push(key);
      if (valB !== undefined) deltaBefore[key] = valB;
      if (valA !== undefined) deltaAfter[key] = valA;
    }
  });

  return {
    fieldsChanged,
    before: deltaBefore,
    after: deltaAfter,
  };
}

/**
 * Main logger function
 * Safe: Never throws or interrupts normal application execution.
 */
export async function logAuditEvent({
  category = AUDIT_CATEGORIES.SYSTEM,
  action,
  severity = AUDIT_SEVERITIES.INFO,
  actor,
  target,
  changes,
  metadata = {},
}) {
  try {
    const authUser = firebase.auth().currentUser;
    
    // Resolve actor identity
    let resolvedActor = actor;
    if (!resolvedActor) {
      if (authUser) {
        resolvedActor = {
          uid: authUser.uid,
          email: authUser.email || 'staff@system',
          displayName: authUser.displayName || authUser.email?.split('@')[0] || 'Staff User',
          role: 'admin',
        };
      } else {
        // Check student session in localStorage if present
        let studentToken = null;
        try {
          const stSession = localStorage.getItem('adsa_student_session');
          if (stSession) {
            const parsed = JSON.parse(stSession);
            studentToken = parsed.tokenNo || parsed.token;
          }
        } catch (_) {}

        if (studentToken) {
          resolvedActor = {
            uid: `student-${studentToken}`,
            email: `token${studentToken}@student`,
            displayName: `Student Token #${studentToken}`,
            role: 'student',
            tokenNo: Number(studentToken),
          };
        } else {
          resolvedActor = {
            uid: 'system',
            email: 'system@automated',
            displayName: 'System Automated',
            role: 'system',
          };
        }
      }
    }

    const nowIso = new Date().toISOString();
    const currentRoute = typeof window !== 'undefined' ? window.location.pathname : '/';
    const device = getDeviceType();

    // Prepare diff summary
    let diffSummary = changes?.diffSummary || '';
    if (!diffSummary && changes?.fieldsChanged?.length) {
      diffSummary = `Modified: ${changes.fieldsChanged.join(', ')}`;
    } else if (!diffSummary) {
      diffSummary = action.replace(/_/g, ' ').toLowerCase();
    }

    // Build search keywords
    const searchKeywords = generateSearchTerms([
      action,
      category,
      severity,
      resolvedActor.email,
      resolvedActor.displayName,
      resolvedActor.tokenNo,
      target?.label,
      target?.id,
      target?.tokenNo,
      diffSummary,
      metadata?.reason,
    ]);

    const auditPayload = {
      timestamp: nowIso,
      serverTimestamp: firebase.firestore.FieldValue.serverTimestamp(),
      category,
      action,
      severity,
      actor: sanitizePayload(resolvedActor),
      target: sanitizePayload(target || { type: 'system', id: 'system', label: 'System Action' }),
      changes: {
        diffSummary,
        fieldsChanged: changes?.fieldsChanged || [],
        before: sanitizePayload(changes?.before || null),
        after: sanitizePayload(changes?.after || null),
      },
      metadata: {
        deviceType: device,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
        route: currentRoute,
        reason: metadata?.reason || '',
        batchCount: metadata?.batchCount || 1,
        batchId: metadata?.batchId || null,
        ...sanitizePayload(metadata),
      },
      searchTerms: searchKeywords,
    };

    const docRef = await firebase.firestore().collection('audit_logs').add(auditPayload);

    // Dispatch in-memory custom window event for instant micro-ticker & feedback
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('adsa:audit_event', {
          detail: { id: docRef.id, ...auditPayload },
        })
      );
    }

    return docRef.id;
  } catch (err) {
    console.warn('[AuditLogger] Could not persist audit log event:', err);
    return null;
  }
}

/**
 * Real-time subscription to audit logs with filtering and limit
 */
export function subscribeAuditLogs(
  onData,
  onError,
  { category = null, severity = null, limitCount = 50 } = {}
) {
  let query = firebase.firestore().collection('audit_logs');

  if (category && category !== 'all') {
    query = query.where('category', '==', category);
  }

  if (severity && severity !== 'all') {
    query = query.where('severity', '==', severity);
  }

  // Order by serverTimestamp or fallback timestamp
  query = query.orderBy('timestamp', 'desc').limit(limitCount);

  return query.onSnapshot(
    (snapshot) => {
      const logs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      onData(logs);
    },
    (error) => {
      console.error('[AuditLogger] Error in real-time snapshot:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Helper to format timestamp relative or exact
 */
export function formatAuditTime(isoStr, includeDate = true) {
  if (!isoStr) return '';
  const date = new Date(isoStr);
  if (isNaN(date.getTime())) return isoStr;

  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 45) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;

  const timeOptions = { hour: '2-digit', minute: '2-digit', hour12: true };
  const timeFormatted = date.toLocaleTimeString('en-US', timeOptions);

  if (!includeDate) return timeFormatted;

  const dateOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const dateFormatted = date.toLocaleDateString('en-US', dateOptions);

  return `${dateFormatted} at ${timeFormatted}`;
}
