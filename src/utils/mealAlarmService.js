/**
 * ADSA T-Board Meal Cutoff Alarm Service
 * Monitors campus meal cutoffs against tamper-proof server time
 * and triggers advance notifications, audio chimes, and tactile haptics.
 */

import { getSyncedServerTimeMs, getISTDateParts } from './time';
import { soundEngine } from './soundEffects';
import { hapticEngine } from './haptics';
import { showLocalNotification, isPermissionGranted } from './webNotificationService';

const ALARM_CONFIG_STORAGE_KEY = 'adsa_meal_alarms_config_v1';
const FIRED_HISTORY_STORAGE_KEY = 'adsa_meal_alarms_fired_v1';

export const DEFAULT_ALARM_CONFIG = {
  enabled: true,
  breakfastReminder: true,
  lunchReminder: true,
  advanceMinutes: 30, // 15 | 30 | 60
  soundEnabled: true,
  hapticsEnabled: true,
};

export function getMealAlarmConfig() {
  if (typeof window === 'undefined') return DEFAULT_ALARM_CONFIG;
  try {
    const raw = localStorage.getItem(ALARM_CONFIG_STORAGE_KEY);
    return raw ? { ...DEFAULT_ALARM_CONFIG, ...JSON.parse(raw) } : DEFAULT_ALARM_CONFIG;
  } catch (_) {
    return DEFAULT_ALARM_CONFIG;
  }
}

export function saveMealAlarmConfig(config) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ALARM_CONFIG_STORAGE_KEY, JSON.stringify(config));
  } catch (_) {}
}

/**
 * Returns today's cutoff deadlines in minutes from midnight (IST)
 */
export function getTodayCutoffMinutes(dayOfWeekIndex) {
  // Sunday (0) to Saturday (6). Friday = 5.
  const isFriday = dayOfWeekIndex === 5;

  return {
    breakfast: {
      cutoffHours: 7,
      cutoffMinutes: 0,
      totalMinutes: 7 * 60, // 07:00 AM (420 mins)
      label: '07:00 AM',
      mealName: 'Breakfast',
      mealNameMl: 'പ്രഭാത ഭക്ഷണം (Breakfast)',
    },
    lunch: {
      cutoffHours: isFriday ? 13 : 12,
      cutoffMinutes: isFriday ? 15 : 45,
      totalMinutes: isFriday ? 13 * 60 + 15 : 12 * 60 + 45, // Fri 01:15 PM, other 12:45 PM
      label: isFriday ? '01:15 PM' : '12:45 PM',
      mealName: isFriday ? "Friday Jumu'ah Special Lunch" : 'Lunch',
      mealNameMl: isFriday ? "വെള്ളി ജുമുഅ ഉച്ചഭക്ഷണം" : 'ഉച്ചഭക്ഷണം (Lunch)',
    },
  };
}

/**
 * Check if cutoff alarm should fire now
 */
export async function checkAndTriggerMealAlarms() {
  if (typeof window === 'undefined') return null;

  const config = getMealAlarmConfig();
  if (!config.enabled) return null;

  const nowMs = getSyncedServerTimeMs();
  const istParts = getISTDateParts(nowMs);
  const currentTotalMinutes = istParts.hours24 * 60 + istParts.minutes;
  const todayKey = `${istParts.year}-${String(istParts.month).padStart(2, '0')}-${String(istParts.date).padStart(2, '0')}`;

  const cutoffs = getTodayCutoffMinutes(istParts.dayOfWeekIndex);

  // Load fired alarms map
  let firedMap = {};
  try {
    const raw = localStorage.getItem(FIRED_HISTORY_STORAGE_KEY);
    if (raw) firedMap = JSON.parse(raw);
  } catch (_) {}

  const mealsToCheck = [];
  if (config.breakfastReminder) mealsToCheck.push({ id: 'breakfast', data: cutoffs.breakfast });
  if (config.lunchReminder) mealsToCheck.push({ id: 'lunch', data: cutoffs.lunch });

  for (const { id, data } of mealsToCheck) {
    const diff = data.totalMinutes - currentTotalMinutes;
    const fireKey = `${todayKey}_${id}_${config.advanceMinutes}m`;

    // Fire when current time is within advance window (e.g. diff <= 30 and diff >= 2) and hasn't fired yet
    if (diff > 0 && diff <= config.advanceMinutes && !firedMap[fireKey]) {
      // Mark as fired immediately
      firedMap[fireKey] = true;
      try {
        localStorage.setItem(FIRED_HISTORY_STORAGE_KEY, JSON.stringify(firedMap));
      } catch (_) {}

      // 1. Play synthesized cutoff alarm arpeggio
      if (config.soundEnabled) {
        soundEngine.playCutoffAlarmChime();
      }

      // 2. Trigger physical haptic sequence
      if (config.hapticsEnabled) {
        hapticEngine.urgentAlert();
      }

      // 3. Dispatch native browser notification
      if (isPermissionGranted()) {
        showLocalNotification(`Meal Cutoff in ${diff} Minutes! (${data.label})`, {
          body: `ADSA Canteen ${data.mealName} blocking closes at ${data.label}. Update your token now to prevent penalty fines.`,
          icon: '/android-chrome-192x192.png',
          badge: '/favicon-32x32.png',
          tag: `cutoff-${id}-${todayKey}`,
          url: '/student',
          vibrate: [30, 50, 30, 50, 40],
        });
      }

      return {
        mealId: id,
        mealName: data.mealName,
        diffMinutes: diff,
        cutoffLabel: data.label,
      };
    }
  }

  return null;
}
