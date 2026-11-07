/**
 * ADSA T-Board PWA Manager
 * Advanced multi-platform PWA management for Mobile & Desktop.
 * Supports Windows, macOS, Linux, ChromeOS, iOS, and Android.
 * Integrates Service Worker, Native Prompts, Window Controls Overlay,
 * App Badging, Persistent Storage, and OS-Tailored Installation Lifecycle.
 */

let deferredInstallPrompt = null;
let swRegistration = null;
const installListeners = new Set();
const updateListeners = new Set();
const desktopModalListeners = new Set();

/**
 * Detect Client Operating System
 * @returns {'windows' | 'macos' | 'linux' | 'chromeos' | 'ios' | 'android' | 'unknown'}
 */
export function detectOS() {
  if (typeof window === 'undefined' || !navigator) return 'unknown';
  const ua = navigator.userAgent || '';
  const platform = navigator.platform || '';
  const platformData = navigator.userAgentData?.platform || '';

  if (/iPhone|iPad|iPod/.test(ua) || (platform === 'MacIntel' && navigator.maxTouchPoints > 1)) {
    return 'ios';
  }
  if (/Android/.test(ua)) {
    return 'android';
  }
  if (/Win/.test(platform) || /Windows/.test(ua) || platformData === 'Windows') {
    return 'windows';
  }
  if (/Mac/.test(platform) || /Macintosh/.test(ua) || platformData === 'macOS') {
    return 'macos';
  }
  if (/CrOS/.test(ua) || platformData === 'Chrome OS') {
    return 'chromeos';
  }
  if (/Linux/.test(platform) || /Linux/.test(ua) || platformData === 'Linux') {
    return 'linux';
  }
  return 'unknown';
}

/**
 * Detect Client Web Browser Engine
 * @returns {'chrome' | 'edge' | 'safari' | 'firefox' | 'brave' | 'opera' | 'unknown'}
 */
export function detectBrowser() {
  if (typeof window === 'undefined' || !navigator) return 'unknown';
  const ua = navigator.userAgent || '';
  if (/Edg\//.test(ua)) return 'edge';
  if (/Brave/.test(ua) || navigator.brave) return 'brave';
  if (/OPR\/|Opera\//.test(ua)) return 'opera';
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'chrome';
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua) && !/CriOS/.test(ua)) return 'safari';
  if (/Firefox\//.test(ua)) return 'firefox';
  return 'unknown';
}

/**
 * Check if client device is Android
 */
export function isAndroidDevice() {
  return detectOS() === 'android';
}

/**
 * Check if the browser is Google Go or Android WebView
 */
export function isGoogleGoBrowser() {
  if (typeof window === 'undefined' || !navigator) return false;
  const ua = navigator.userAgent || '';
  return /GoogleApp|GSA|searchlite/i.test(ua) || (detectOS() === 'android' && /Version\/4\.0/i.test(ua) && !/Chrome\/[0-9.]+\s*Mobile/i.test(ua));
}

/**
 * Check if client is browsing from an in-app browser (WhatsApp, Telegram, Facebook, Instagram)
 */
export function isInAppBrowser() {
  if (typeof window === 'undefined' || !navigator) return false;
  const ua = navigator.userAgent || '';
  return /FBAN|FBAV|Instagram|WhatsApp|Telegram|Line\/|wv/i.test(ua);
}

/**
 * Generate native Android Chrome Intent URI to open URL directly in full Chrome
 */
export function getAndroidChromeIntentUrl(targetUrl) {
  if (typeof window === 'undefined') return targetUrl || 'https://canteen.alathurpadidars.in/';
  const url = targetUrl || window.location.href;
  const urlWithoutScheme = url.replace(/^https?:\/\//i, '');
  return `intent://${urlWithoutScheme}#Intent;scheme=https;package=com.android.chrome;end`;
}

/**
 * Check if client device is a Desktop/Laptop (Windows, Mac, Linux, ChromeOS)
 */
export function isDesktopDevice() {
  if (typeof window === 'undefined') return false;
  const os = detectOS();
  if (os === 'windows' || os === 'macos' || os === 'linux' || os === 'chromeos') {
    return true;
  }
  if (window.matchMedia('(pointer: fine)').matches && window.innerWidth >= 1024) {
    return true;
  }
  return false;
}

/**
 * Get current PWA display mode
 * @returns {'window-controls-overlay' | 'standalone' | 'minimal-ui' | 'browser'}
 */
export function getDisplayMode() {
  if (typeof window === 'undefined') return 'browser';
  if (
    (typeof navigator !== 'undefined' &&
      navigator.windowControlsOverlay &&
      navigator.windowControlsOverlay.visible) ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches
  ) {
    return 'window-controls-overlay';
  }
  if (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    (typeof document !== 'undefined' && document.referrer.includes('android-app://'))
  ) {
    return 'standalone';
  }
  if (window.matchMedia('(display-mode: minimal-ui)').matches) {
    return 'minimal-ui';
  }
  return 'browser';
}

/**
 * Check if app is running in installed standalone or WCO mode
 */
export function isStandaloneMode() {
  const mode = getDisplayMode();
  return mode === 'standalone' || mode === 'window-controls-overlay' || mode === 'minimal-ui';
}

/**
 * Alias for isStandaloneMode
 */
export function isInstalledApp() {
  return isStandaloneMode();
}

/**
 * Check if Window Controls Overlay is actively visible
 */
export function isWindowControlsOverlayActive() {
  if (typeof window === 'undefined') return false;
  return Boolean(
    (navigator.windowControlsOverlay && navigator.windowControlsOverlay.visible) ||
    window.matchMedia('(display-mode: window-controls-overlay)').matches
  );
}

/**
 * Subscribe to Window Controls Overlay geometry changes
 */
export function subscribeWindowControlsOverlay(callback) {
  if (typeof window === 'undefined' || !navigator.windowControlsOverlay) {
    return () => {};
  }
  const handler = (e) => {
    callback(e.visible, e.titlebarAreaRect || navigator.windowControlsOverlay.getTitlebarAreaRect?.());
  };
  navigator.windowControlsOverlay.addEventListener('geometrychange', handler);
  // Initial fire
  try {
    callback(
      navigator.windowControlsOverlay.visible,
      navigator.windowControlsOverlay.getTitlebarAreaRect ? navigator.windowControlsOverlay.getTitlebarAreaRect() : null
    );
  } catch (_) {}

  return () => {
    navigator.windowControlsOverlay.removeEventListener('geometrychange', handler);
  };
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
 * Check if running on macOS Sonoma or later with Safari Web App support
 */
export function isMacOSSafari() {
  if (typeof window === 'undefined') return false;
  return detectOS() === 'macos' && detectBrowser() === 'safari';
}

/**
 * Register Service Worker and configure update listeners
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  const isPwaDebugEnabled =
    typeof window !== 'undefined' &&
    (window.location.search.includes('pwa=1') ||
      window.location.search.includes('pwa=true') ||
      localStorage.getItem('adsa_pwa_debug') === 'true');

  const isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '[::1]' ||
    window.location.hostname.endsWith('.local');

  // In local development (DEV mode), unregister service workers by default to prevent stale HMR caching,
  // UNLESS the developer explicitly passes ?pwa=1 or is running a production preview build!
  const isDevMode = typeof import.meta !== 'undefined' && Boolean(import.meta.env?.DEV);
  if (!isPwaDebugEnabled && isDevMode) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister();
      }
    }).catch(() => {});

    if ('caches' in window) {
      caches.keys().then((keys) => {
        keys.forEach((key) => caches.delete(key));
      }).catch(() => {});
    }
    return;
  }

  // Perform Service Worker registration
  const performRegistration = () => {
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
              notifyUpdateAvailable(reg);
            }
          });
        });

        // If installed on desktop or mobile, automatically request persistent storage
        if (isStandaloneMode()) {
          requestPersistentStorage().catch(() => {});
        }
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
  };

  // If page is already loaded (or cached module script), register immediately; otherwise wait for load
  if (document.readyState === 'complete') {
    performRegistration();
  } else {
    window.addEventListener('load', performRegistration);
  }

  // Capture Chromium native install prompt event (Windows, Mac, Linux, Android)
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredInstallPrompt = e;
    notifyInstallStateChange(true);
  });

  // Listen for successful install completion
  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    notifyInstallStateChange(false);
    requestPersistentStorage().catch(() => {});
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
 * Trigger native browser install prompt (for Android, Windows, Mac, Linux on Chromium)
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

/**
 * Set App Badge count on Windows Taskbar & macOS Dock
 * @param {number} count
 */
export async function setDesktopBadge(count) {
  if (typeof window === 'undefined') return false;
  const numericCount = Number(count) || 0;
  try {
    if ('setAppBadge' in navigator) {
      if (numericCount > 0) {
        await navigator.setAppBadge(numericCount);
      } else {
        await navigator.clearAppBadge();
      }
      return true;
    }
    if (swRegistration?.active) {
      swRegistration.active.postMessage({
        type: numericCount > 0 ? 'SET_BADGE' : 'CLEAR_BADGE',
        count: numericCount,
      });
      return true;
    }
  } catch (err) {
    console.debug('[PWA] Badge update omitted:', err);
  }
  return false;
}

/**
 * Clear App Badge on Windows Taskbar & macOS Dock
 */
export async function clearDesktopBadge() {
  if (typeof window === 'undefined') return false;
  try {
    if ('clearAppBadge' in navigator) {
      await navigator.clearAppBadge();
      return true;
    }
    if (swRegistration?.active) {
      swRegistration.active.postMessage({ type: 'CLEAR_BADGE' });
      return true;
    }
  } catch (_) {}
  return false;
}

/**
 * Request persistent browser storage to protect offline caches and token matrices
 */
export async function requestPersistentStorage() {
  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return { supported: false, persisted: false };
  }
  try {
    const isAlreadyPersisted = await navigator.storage.persisted();
    if (isAlreadyPersisted) {
      return { supported: true, persisted: true };
    }
    const granted = await navigator.storage.persist();
    return { supported: true, persisted: granted };
  } catch (err) {
    console.warn('[PWA] Persistent storage request failed:', err);
    return { supported: true, persisted: false };
  }
}

/**
 * Check whether persistent storage has been granted
 */
export async function checkPersistentStorage() {
  if (typeof window === 'undefined' || !navigator.storage || !navigator.storage.persisted) {
    return false;
  }
  try {
    return await navigator.storage.persisted();
  } catch (_) {
    return false;
  }
}

/**
 * Global trigger to open Desktop Install Hub Modal
 * @param {'windows' | 'macos' | 'linux' | 'all' | null} initialTab
 */
export function openDesktopInstallModal(initialTab = null) {
  desktopModalListeners.forEach((fn) => {
    try {
      fn(true, initialTab);
    } catch (_) {}
  });
}

/**
 * Global trigger to close Desktop Install Hub Modal
 */
export function closeDesktopInstallModal() {
  desktopModalListeners.forEach((fn) => {
    try {
      fn(false, null);
    } catch (_) {}
  });
}

/**
 * Subscribe to Desktop Install Hub Modal state changes
 */
export function onDesktopInstallModalState(callback) {
  desktopModalListeners.add(callback);
  return () => desktopModalListeners.delete(callback);
}
