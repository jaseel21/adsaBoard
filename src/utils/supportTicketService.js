import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

/**
 * ADSA T-Board Centralized Support, Feedback & Care Concierge Service
 * Powers ticket creation, live real-time triage, communication threads,
 * and SLA monitoring for students, diners, and canteen administrators.
 */

export const SUPPORT_CATEGORIES = {
  food_quality: {
    id: 'food_quality',
    key: 'catFoodQuality',
    label: 'Food Quality & Taste',
    icon: 'Utensils',
    badgeColor: 'emerald',
    description: 'Meal temperature, seasoning, portion size, freshness, or mess menu feedback.',
  },
  token_lock: {
    id: 'token_lock',
    key: 'catTokenLock',
    label: 'Token Lock & Attendance',
    icon: 'Lock',
    badgeColor: 'rose',
    description: 'Blocked tokens, lockout dispute, or emergency unblock requests.',
  },
  dietary: {
    id: 'dietary',
    key: 'catDietary',
    label: 'Dietary & Allergens',
    icon: 'Leaf',
    badgeColor: 'teal',
    description: 'Vegetarian, fish/beef/meat avoiders, medical dietary setup.',
  },
  cutoff_timing: {
    id: 'cutoff_timing',
    key: 'catCutoffTiming',
    label: 'Cutoff & Timings',
    icon: 'Clock',
    badgeColor: 'amber',
    description: 'Daily 14:00 IST cutoff inquiry, evening dining window, or meal shift.',
  },
  billing: {
    id: 'billing',
    key: 'catBilling',
    label: 'Billing & Mess Dues',
    icon: 'Receipt',
    badgeColor: 'indigo',
    description: 'Monthly mess dues, receipt clarification, payment clearance verification.',
  },
  technical: {
    id: 'technical',
    key: 'catTechnical',
    label: 'App Bug / Glitch',
    icon: 'Cpu',
    badgeColor: 'purple',
    description: 'Login problems, kiosk sync glitches, display rendering issues.',
  },
  general_suggestion: {
    id: 'general_suggestion',
    key: 'catGeneralSuggestion',
    label: 'Idea & Appreciation',
    icon: 'Sparkles',
    badgeColor: 'blue',
    description: 'Ideas for dining improvements, chef appreciation, general compliments.',
  },
};

export const SUPPORT_URGENCIES = {
  normal: {
    id: 'normal',
    key: 'urgencyNormal',
    label: 'Normal',
    level: 1,
    color: 'emerald',
  },
  high: {
    id: 'high',
    key: 'urgencyHigh',
    label: 'High Priority',
    level: 2,
    color: 'amber',
  },
  critical: {
    id: 'critical',
    key: 'urgencyCritical',
    label: 'Critical / Lockout',
    level: 3,
    color: 'rose',
  },
};

export const SUPPORT_STATUSES = {
  new: {
    id: 'new',
    key: 'statusNew',
    label: 'New / Inbound',
    color: 'rose',
  },
  triaged: {
    id: 'triaged',
    key: 'statusTriaged',
    label: 'Triaged',
    color: 'amber',
  },
  in_progress: {
    id: 'in_progress',
    key: 'statusInProgress',
    label: 'In Action',
    color: 'blue',
  },
  resolved: {
    id: 'resolved',
    key: 'statusResolved',
    label: 'Resolved',
    color: 'emerald',
  },
  closed: {
    id: 'closed',
    key: 'statusClosed',
    label: 'Closed',
    color: 'gray',
  },
};

export const CANNED_RESPONSES = [
  {
    id: 'token_unblocked',
    title: 'Token Lock Lifted',
    text: 'Your token lock has been reviewed and successfully lifted. You may now manage your meal routine and date exceptions normally.',
  },
  {
    id: 'kitchen_informed',
    title: 'Kitchen Staff Notified',
    text: 'Thank you for your valuable feedback regarding meal temperature and seasoning. The mess convenor and kitchen head have been notified to address this immediately.',
  },
  {
    id: 'dietary_updated',
    title: 'Dietary Preference Approved',
    text: 'Your dietary request has been verified and registered in the daily Kitchen Avoiders Matrix. Special care will be taken during meal distribution.',
  },
  {
    id: 'cutoff_reminder',
    title: 'Cutoff Timing Reminder',
    text: 'Reminder: As per ADSA canteen policy, all token cancellations and switchings for the next day must be completed before 14:00 IST (2:00 PM).',
  },
  {
    id: 'accounts_verified',
    title: 'Dues Cleared & Verified',
    text: 'Your mess fee clearance has been confirmed with the accounts desk. Your dining profile is fully active.',
  },
];

/**
 * Generate a sequential-like tracking code: CARE-YYYY-XXXX
 */
export function generateTicketNumber() {
  const year = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `CARE-${year}-${randomSuffix}`;
}

const LOCAL_STORAGE_KEY = 'adsa_care_recent_tickets';

/**
 * Retrieve recently submitted ticket references stored locally in this browser
 */
export function getLocalRecentTickets() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

/**
 * Save a newly submitted ticket to local storage for quick student reference
 */
export function saveLocalRecentTicket(ticket) {
  if (typeof window === 'undefined' || !ticket?.ticketNumber) return;
  try {
    const list = getLocalRecentTickets().filter((t) => t.ticketNumber !== ticket.ticketNumber);
    const updated = [
      {
        id: ticket.id,
        ticketNumber: ticket.ticketNumber,
        subject: ticket.subject || 'Support Ticket',
        category: ticket.category,
        createdAt: new Date().toISOString(),
      },
      ...list,
    ].slice(0, 10);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
  } catch (_) {}
}

/**
 * Create a new support / feedback ticket in Firestore
 */
export async function createSupportTicket(ticketData) {
  const db = firebase.firestore();
  const ticketNumber = ticketData.ticketNumber || generateTicketNumber();

  const payload = {
    ticketNumber,
    category: ticketData.category || 'general_suggestion',
    urgency: ticketData.urgency || 'normal',
    status: 'new',
    subject: ticketData.subject || 'Diner Inquiry',
    description: ticketData.description || '',
    rating: typeof ticketData.rating === 'number' ? ticketData.rating : null,
    tags: Array.isArray(ticketData.tags) ? ticketData.tags : [],
    student: {
      isAnonymous: Boolean(ticketData.isAnonymous),
      tokenNumber: ticketData.tokenNumber ? Number(ticketData.tokenNumber) : null,
      name: ticketData.isAnonymous ? 'Anonymous Diner' : (ticketData.name || 'Campus Student'),
      batch: ticketData.batch || '',
      room: ticketData.room || '',
      phone: ticketData.phone || '',
      email: ticketData.email || '',
    },
    attachments: Array.isArray(ticketData.attachments) ? ticketData.attachments : [],
    assignment: null,
    thread: [
      {
        id: `msg_${Date.now()}`,
        senderType: 'student',
        senderName: ticketData.isAnonymous ? 'Anonymous Diner' : (ticketData.name || 'Diner'),
        message: ticketData.description || 'Ticket opened.',
        timestamp: new Date().toISOString(),
        isInternal: false,
      },
    ],
    resolution: null,
    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  const docRef = await db.collection('support_tickets').add(payload);

  // Save reference to local client browser
  saveLocalRecentTicket({
    id: docRef.id,
    ticketNumber,
    subject: payload.subject,
    category: payload.category,
  });

  // Log in central audit trail
  logAuditEvent({
    category: AUDIT_CATEGORIES.SUPPORT,
    action: 'CREATE_SUPPORT_TICKET',
    severity: payload.urgency === 'critical' ? AUDIT_SEVERITIES.WARNING : AUDIT_SEVERITIES.INFO,
    actor: {
      uid: payload.student.tokenNumber ? `token-${payload.student.tokenNumber}` : 'guest-diner',
      name: payload.student.name,
      role: 'student',
    },
    target: {
      type: 'support_ticket',
      id: docRef.id,
      name: ticketNumber,
    },
    metadata: {
      category: payload.category,
      urgency: payload.urgency,
      rating: payload.rating,
      tokenNumber: payload.student.tokenNumber,
    },
  }).catch(() => {});

  return { id: docRef.id, ticketNumber, ...payload };
}

/**
 * Subscribe to all support tickets in real-time (for Admin Command Center)
 */
export function subscribeSupportTickets(onUpdate, onError) {
  const db = firebase.firestore();

  return db
    .collection('support_tickets')
    .orderBy('createdAt', 'desc')
    .limit(150)
    .onSnapshot(
      (snapshot) => {
        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        if (onUpdate) onUpdate(list);
      },
      (err) => {
        console.error('Support tickets subscription error:', err);
        if (onError) onError(err);
      }
    );
}

/**
 * Subscribe to a single ticket by its Document ID (for real-time student or admin inspector)
 */
export function subscribeTicketById(ticketId, onUpdate, onError) {
  if (!ticketId) return () => {};
  const db = firebase.firestore();

  return db
    .collection('support_tickets')
    .doc(ticketId)
    .onSnapshot(
      (doc) => {
        if (!doc.exists) {
          if (onUpdate) onUpdate(null);
          return;
        }
        if (onUpdate) onUpdate({ id: doc.id, ...doc.data() });
      },
      (err) => {
        console.error(`Error subscribing to ticket ${ticketId}:`, err);
        if (onError) onError(err);
      }
    );
}

/**
 * Search tickets by Ticket Number (e.g. CARE-2026-1042) or Student Token Number
 */
export async function lookupTicket(query) {
  if (!query || typeof query !== 'string') return [];
  const clean = query.trim().toUpperCase();
  const db = firebase.firestore();

  // 1. Try exact ticket number match
  const byNumber = await db
    .collection('support_tickets')
    .where('ticketNumber', '==', clean)
    .limit(5)
    .get();

  if (!byNumber.empty) {
    return byNumber.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  // 2. Try numeric token lookup if query is a number
  const tokenNum = parseInt(clean, 10);
  if (!isNaN(tokenNum)) {
    const byToken = await db
      .collection('support_tickets')
      .where('student.tokenNumber', '==', tokenNum)
      .orderBy('createdAt', 'desc')
      .limit(10)
      .get();

    return byToken.docs.map((d) => ({ id: d.id, ...d.data() }));
  }

  return [];
}

/**
 * Update ticket workflow status (new -> triaged -> in_progress -> resolved -> closed)
 */
export async function updateTicketStatus(ticketId, newStatus, staffInfo = {}, note = '') {
  if (!ticketId || !newStatus) return;
  const db = firebase.firestore();

  const updates = {
    status: newStatus,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  };

  if (note && note.trim()) {
    const newMsg = {
      id: `msg_${Date.now()}`,
      senderType: 'staff',
      senderName: staffInfo.name || 'Support Staff',
      message: note.trim(),
      timestamp: new Date().toISOString(),
      isInternal: true,
    };
    updates.thread = firebase.firestore.FieldValue.arrayUnion(newMsg);
  }

  await db.collection('support_tickets').doc(ticketId).update(updates);

  logAuditEvent({
    category: AUDIT_CATEGORIES.SUPPORT,
    action: 'UPDATE_TICKET_STATUS',
    severity: AUDIT_SEVERITIES.INFO,
    actor: {
      uid: staffInfo.uid || 'admin',
      name: staffInfo.name || 'Staff Administrator',
      role: staffInfo.role || 'committee',
    },
    target: {
      type: 'support_ticket',
      id: ticketId,
    },
    metadata: {
      newStatus,
      note,
    },
  }).catch(() => {});
}

/**
 * Assign a ticket to a staff member or committee convenor
 */
export async function assignTicket(ticketId, assignedStaff, staffInfo = {}) {
  if (!ticketId || !assignedStaff) return;
  const db = firebase.firestore();

  const assignment = {
    assignedToUid: assignedStaff.uid || null,
    assignedToName: assignedStaff.name || assignedStaff.email || 'Committee Member',
    assignedAt: new Date().toISOString(),
  };

  await db.collection('support_tickets').doc(ticketId).update({
    assignment,
    status: 'triaged',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  logAuditEvent({
    category: AUDIT_CATEGORIES.SUPPORT,
    action: 'ASSIGN_TICKET',
    severity: AUDIT_SEVERITIES.INFO,
    actor: {
      uid: staffInfo.uid || 'admin',
      name: staffInfo.name || 'Staff Administrator',
      role: staffInfo.role || 'committee',
    },
    target: {
      type: 'support_ticket',
      id: ticketId,
    },
    metadata: {
      assignedTo: assignment.assignedToName,
    },
  }).catch(() => {});
}

/**
 * Append a communication message (public reply to student OR private internal note)
 */
export async function appendTicketMessage(ticketId, { senderType, senderName, message, isInternal = false }) {
  if (!ticketId || !message?.trim()) return;
  const db = firebase.firestore();

  const newMsg = {
    id: `msg_${Date.now()}`,
    senderType: senderType || 'staff',
    senderName: senderName || 'Staff Administrator',
    message: message.trim(),
    timestamp: new Date().toISOString(),
    isInternal: Boolean(isInternal),
  };

  await db.collection('support_tickets').doc(ticketId).update({
    thread: firebase.firestore.FieldValue.arrayUnion(newMsg),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });
}

/**
 * Mark a ticket resolved with official resolution notes
 */
export async function resolveTicket(ticketId, resolutionNotes = '', staffInfo = {}) {
  if (!ticketId) return;
  const db = firebase.firestore();

  const resolution = {
    resolvedByUid: staffInfo.uid || 'admin',
    resolvedByName: staffInfo.name || 'Staff Administrator',
    resolutionNotes: resolutionNotes.trim() || 'Issue resolved by committee.',
    resolvedAt: new Date().toISOString(),
  };

  const finalMsg = {
    id: `msg_${Date.now()}`,
    senderType: 'staff',
    senderName: staffInfo.name || 'Staff Administrator',
    message: `[Resolution]: ${resolution.resolutionNotes}`,
    timestamp: new Date().toISOString(),
    isInternal: false,
  };

  await db.collection('support_tickets').doc(ticketId).update({
    status: 'resolved',
    resolution,
    thread: firebase.firestore.FieldValue.arrayUnion(finalMsg),
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
  });

  logAuditEvent({
    category: AUDIT_CATEGORIES.SUPPORT,
    action: 'RESOLVE_TICKET',
    severity: AUDIT_SEVERITIES.INFO,
    actor: {
      uid: staffInfo.uid || 'admin',
      name: staffInfo.name || 'Staff Administrator',
      role: staffInfo.role || 'committee',
    },
    target: {
      type: 'support_ticket',
      id: ticketId,
    },
    metadata: {
      resolutionNotes,
    },
  }).catch(() => {});
}

/**
 * Delete a ticket (Central Committee & Developer privilege only)
 */
export async function deleteSupportTicket(ticketId, staffInfo = {}) {
  if (!ticketId) return;
  const db = firebase.firestore();

  await db.collection('support_tickets').doc(ticketId).delete();

  logAuditEvent({
    category: AUDIT_CATEGORIES.SUPPORT,
    action: 'DELETE_TICKET',
    severity: AUDIT_SEVERITIES.WARNING,
    actor: {
      uid: staffInfo.uid || 'admin',
      name: staffInfo.name || 'Staff Administrator',
      role: staffInfo.role || 'committee',
    },
    target: {
      type: 'support_ticket',
      id: ticketId,
    },
  }).catch(() => {});
}
