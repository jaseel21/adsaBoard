/**
 * ADSA T-Board Web Notification Service
 * Manages native browser notification permissions and dispatches
 * local notifications via the active Service Worker registration.
 */

import { getRegistration } from './pwaManager';

export function isNotificationSupported() {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return 'unsupported';
  return Notification.permission;
}

export function isPermissionGranted() {
  return isNotificationSupported() && Notification.permission === 'granted';
}

/**
 * Request notification permissions from user
 */
export async function requestNotificationPermission() {
  if (!isNotificationSupported()) {
    return 'unsupported';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[NotificationService] Permission request failed:', err);
    return 'denied';
  }
}

/**
 * Dispatch a local notification via Service Worker (or fallback to window Notification)
 */
export async function showLocalNotification(title, options = {}) {
  if (!isPermissionGranted()) {
    return false;
  }

  const notificationOptions = {
    body: options.body || '',
    icon: options.icon || '/android-chrome-192x192.png',
    badge: options.badge || '/favicon-32x32.png',
    vibrate: options.vibrate || [25, 40, 25],
    tag: options.tag || 'adsa-notification',
    renotify: options.renotify !== false,
    data: {
      url: options.url || '/',
      timestamp: Date.now(),
      ...options.data,
    },
  };

  try {
    const swReg = getRegistration();
    if (swReg && 'showNotification' in swReg) {
      await swReg.showNotification(title, notificationOptions);
      return true;
    }

    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, notificationOptions);
        return true;
      }
    }

    // Direct Window Notification Fallback
    const n = new Notification(title, notificationOptions);
    n.onclick = () => {
      n.close();
      if (options.url && typeof window !== 'undefined') {
        window.focus();
        window.location.href = options.url;
      }
    };
    return true;
  } catch (err) {
    console.warn('[NotificationService] Show notification failed:', err);
    return false;
  }
}
