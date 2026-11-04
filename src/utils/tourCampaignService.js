import firebase from '../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from './auditLogger';

export const DEFAULT_TOUR_CAMPAIGN = {
  enabled: true,
  targetAudience: 'first_time', // 'first_time' | 'all' | 'students_only' | 'disabled'
  targetDevice: 'all', // 'all' | 'desktop_only' | 'mobile_only'
  dateRange: {
    enforceDateRange: false,
    startDate: '', // 'YYYY-MM-DD'
    endDate: '', // 'YYYY-MM-DD'
  },
  timeWindow: {
    enforceTimeWindow: false,
    startTime: '08:00', // IST
    endTime: '22:00', // IST
  },
  triggerRule: {
    delaySeconds: 3,
    autoCloseSeconds: 12, // 0 = disabled, >0 = auto-close prompt after N seconds
    repromptCooldownDays: 7,
    enforceUntilCompleted: false,
  },
  bannerContent: {
    titleEn: 'Master ADSA T-Board with Live Guided Quests',
    titleMl: 'ഇന്ററാക്ടീവ് ലൈവ് ടൂറിലൂടെ ബോർഡ് ഉപയോഗിക്കാൻ പഠിക്കാം',
    subtitleEn: 'Interactive step-by-step walkthrough for tokens, Sunday presets, dietary preferences, and canteen tools.',
    subtitleMl: 'സിംഗിൾ ഡേ ടോക്കൺ, സൺഡേ പ്രീസെറ്റ്, ഡയറ്ററി മാറ്റങ്ങൾ എന്നിവ തത്സമയം പരീക്ഷിച്ച് മനസിലാക്കൂ.',
  },
  defaultTrack: 'dashboard-basics',
  defaultMode: 'interactive', // 'interactive' | 'cinematic'
  version: 1,
};

const CAMPAIGN_DOC_REF = () =>
  firebase.firestore().collection('settings').doc('tour_campaign');

let cachedCampaign = { ...DEFAULT_TOUR_CAMPAIGN };

/**
 * Returns current IST time string (HH:mm) and date string (YYYY-MM-DD).
 */
export function getISTDateTime() {
  const now = new Date();
  const utcOffsetMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istOffsetMs = 5.5 * 60 * 60000;
  const istDate = new Date(utcOffsetMs + istOffsetMs);

  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, '0');
  const day = String(istDate.getDate()).padStart(2, '0');
  const hours = String(istDate.getHours()).padStart(2, '0');
  const minutes = String(istDate.getMinutes()).padStart(2, '0');

  return {
    dateStr: `${year}-${month}-${day}`,
    timeStr: `${hours}:${minutes}`,
  };
}

/**
 * Real-time listener for tour campaign governance configuration.
 */
export function subscribeToTourCampaign(onUpdate, onError) {
  const docRef = CAMPAIGN_DOC_REF();

  return docRef.onSnapshot(
    async (snapshot) => {
      if (snapshot.exists) {
        const data = snapshot.data() || {};
        const parsedCampaign = {
          ...DEFAULT_TOUR_CAMPAIGN,
          ...data,
          targetDevice: data.targetDevice || DEFAULT_TOUR_CAMPAIGN.targetDevice,
          dateRange: {
            ...DEFAULT_TOUR_CAMPAIGN.dateRange,
            ...(data.dateRange || {}),
          },
          timeWindow: {
            ...DEFAULT_TOUR_CAMPAIGN.timeWindow,
            ...(data.timeWindow || {}),
          },
          triggerRule: {
            ...DEFAULT_TOUR_CAMPAIGN.triggerRule,
            ...(data.triggerRule || {}),
            autoCloseSeconds:
              data.triggerRule?.autoCloseSeconds !== undefined
                ? Number(data.triggerRule.autoCloseSeconds)
                : DEFAULT_TOUR_CAMPAIGN.triggerRule.autoCloseSeconds,
          },
          bannerContent: {
            ...DEFAULT_TOUR_CAMPAIGN.bannerContent,
            ...(data.bannerContent || {}),
          },
          updatedAt: data.updatedAt || null,
          updatedBy: data.updatedBy || null,
        };
        cachedCampaign = parsedCampaign;
        if (typeof onUpdate === 'function') {
          onUpdate(parsedCampaign);
        }
      } else {
        try {
          await docRef.set({
            ...DEFAULT_TOUR_CAMPAIGN,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedBy: {
              uid: 'system',
              displayName: 'System Auto-Seed',
              role: 'system',
            },
          });
          cachedCampaign = { ...DEFAULT_TOUR_CAMPAIGN };
          if (typeof onUpdate === 'function') {
            onUpdate(cachedCampaign);
          }
        } catch (seedErr) {
          console.warn('Failed to seed tour_campaign settings, using memory fallback:', seedErr);
          if (typeof onUpdate === 'function') {
            onUpdate(cachedCampaign);
          }
        }
      }
    },
    (err) => {
      console.error('Tour Campaign subscription error:', err);
      if (typeof onError === 'function') onError(err);
    }
  );
}

/**
 * Update Tour Campaign settings (Admin only).
 */
export async function updateTourCampaign(newConfig, actor = {}) {
  const docRef = CAMPAIGN_DOC_REF();

  const payload = {
    ...newConfig,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    updatedBy: {
      uid: actor.uid || 'admin',
      displayName: actor.displayName || 'Admin',
      role: actor.role || 'admin',
    },
    version: (cachedCampaign.version || 1) + 1,
  };

  await docRef.set(payload, { merge: true });

  try {
    await logAuditEvent({
      category: AUDIT_CATEGORIES.GOVERNANCE,
      severity: AUDIT_SEVERITIES.MEDIUM,
      action: 'UPDATE_TOUR_CAMPAIGN',
      actor: {
        uid: actor.uid || 'admin',
        displayName: actor.displayName || 'Admin',
        role: actor.role || 'admin',
      },
      details: {
        enabled: payload.enabled,
        targetAudience: payload.targetAudience,
        targetDevice: payload.targetDevice,
        autoCloseSeconds: payload.triggerRule?.autoCloseSeconds,
        dateRange: payload.dateRange,
        timeWindow: payload.timeWindow,
      },
      metadata: {
        version: payload.version,
      },
    });
  } catch (auditErr) {
    console.warn('Failed to audit tour campaign change:', auditErr);
  }

  return payload;
}

/**
 * Pure evaluation logic: determines if the tour prompt should appear for the current client.
 */
export function evaluateTourAutoPrompt({
  campaign = cachedCampaign,
  isStudent = false,
  isFirstTime = true,
  completedCount = 0,
  lastDismissedAt = null,
  isMobile = typeof window !== 'undefined' ? window.innerWidth < 768 : false,
}) {
  if (!campaign || !campaign.enabled || campaign.targetAudience === 'disabled') {
    return false;
  }

  // 0. Device Targeting Check (All / Desktop Only / Mobile Only)
  if (campaign.targetDevice === 'desktop_only' && isMobile) {
    return false;
  }
  if (campaign.targetDevice === 'mobile_only' && !isMobile) {
    return false;
  }

  const { dateStr, timeStr } = getISTDateTime();

  // 1. Date Range Check
  if (campaign.dateRange?.enforceDateRange) {
    const { startDate, endDate } = campaign.dateRange;
    if (startDate && dateStr < startDate) return false;
    if (endDate && dateStr > endDate) return false;
  }

  // 2. Time Window Check (IST)
  if (campaign.timeWindow?.enforceTimeWindow) {
    const { startTime, endTime } = campaign.timeWindow;
    if (startTime && timeStr < startTime) return false;
    if (endTime && timeStr > endTime) return false;
  }

  // 3. Completion Override Check
  if (campaign.triggerRule?.enforceUntilCompleted && completedCount === 0) {
    return true;
  }

  // 4. Reprompt Cooldown Check
  if (lastDismissedAt && campaign.triggerRule?.repromptCooldownDays > 0) {
    const cooldownMs = campaign.triggerRule.repromptCooldownDays * 24 * 60 * 60 * 1000;
    const timeSinceDismissal = Date.now() - lastDismissedAt;
    if (timeSinceDismissal < cooldownMs) {
      return false;
    }
  }

  // 5. Audience Targeting
  switch (campaign.targetAudience) {
    case 'first_time':
      return isFirstTime && completedCount === 0;
    case 'students_only':
      return isStudent;
    case 'all':
      return true;
    default:
      return false;
  }
}

