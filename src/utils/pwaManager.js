/**
 * ADSA T-Board PWA Manager
 * Manages Service Worker registration, app update notifications,
 * and native install prompts ('beforeinstallprompt' & iOS Safari detection).
 */

let deferredInstallPrompt = null;
let swRegistration = null;
const installListeners = new Set();
const updateListeners = new Set();

/**
 * Check if the app is currently running in standalone (PWA installed) display mode.
 */
export function isStandaloneMode() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Check if the browser is iOS Safari (where 'beforeinstallprompt' is unsupported)
 */
export function isIOSSafari() {
  if (typeof window === 'undefined' || !navigator) return false;
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isWebKit = /WebKit/.test(ua);
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
  return isIOS && isWebKit && isSafari;
}

/**
 * Register Service Worker and configure update listeners
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Delay registration slightly until after initial page load for fast TTI
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        swRegistration = reg;

        // Check if there is an update waiting
        if (reg.waiting) {
          notifyUpdateAvailable(reg);
        }

        reg.addEventListener('updatefound', () => {
          const installingWorker = reg.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New update has installed and is waiting
              notifyUpdateAvailable(reg);
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[PWA] Service Worker registration failed:', err);
      });

    // Reload smoothly when new controller takes over
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });

  // Capture Chromium native install prompt event
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    notifyInstallStateChange(true);
  });

  // Listen for successful install completion
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    notifyInstallStateChange(false);
  });
}

function notifyUpdateAvailable(reg) {
  updateListeners.forEach((listener) => {
    try {
      listener(reg);
    } catch (_) {}
  });
}

function notifyInstallStateChange(canInstall) {
  installListeners.forEach((listener) => {
    try {
      listener(canInstall);
    } catch (_) {}
  });
}

/**
 * Subscribe to update availability events
 */
export function onUpdateAvailable(callback) {
  updateListeners.add(callback);
  return () => updateListeners.delete(callback);
}

/**
 * Subscribe to installability changes
 */
export function onInstallableChange(callback) {
  installListeners.add(callback);
  // Immediately callback with current state
  callback(Boolean(deferredInstallPrompt));
  return () => installListeners.delete(callback);
}

/**
 * Trigger immediate activation of waiting Service Worker
 */
export function skipWaitingAndReload() {
  if (swRegistration && swRegistration.waiting) {
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  } else {
    window.location.reload();
  }
}

/**
 * Trigger native browser install prompt (for Android/Chromium)
 */
export async function triggerNativeInstallPrompt() {
  if (!deferredInstallPrompt) {
    return { outcome: 'unavailable' };
  }
  try {
    await deferredInstallPrompt.prompt();
    const choiceResult = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    notifyInstallStateChange(false);
    return choiceResult;
  } catch (err) {
    console.warn('[PWA] Install prompt failed:', err);
    return { outcome: 'dismissed' };
  }
}

/**
 * Check if native install prompt is currently ready
 */
export function canPromptNativeInstall() {
  return Boolean(deferredInstallPrompt);
}

export function getRegistration() {
  return swRegistration;
}
