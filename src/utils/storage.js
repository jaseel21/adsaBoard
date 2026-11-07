/**
 * Safe Storage Abstraction with Universal In-Memory Fallback
 * 
 * Protects against fatal DOMException / SecurityError:
 * "Failed to read the 'localStorage' property from 'Window': Access is denied for this document."
 * which occurs in:
 * - Google Go / Android Go WebViews
 * - Browsers with cookies or site data blocked
 * - Incognito / Private browsing modes in older Android & WebKit engines
 * - Sandboxed iframes without 'allow-same-origin'
 */

class MemoryStorage {
  constructor() {
    this._store = new Map();
  }

  getItem(key) {
    const k = String(key);
    return this._store.has(k) ? this._store.get(k) : null;
  }

  setItem(key, value) {
    const k = String(key);
    const v = String(value);
    this._store.set(k, v);
  }

  removeItem(key) {
    const k = String(key);
    this._store.delete(k);
  }

  clear() {
    this._store.clear();
  }

  key(index) {
    const keys = Array.from(this._store.keys());
    return keys[index] !== undefined ? keys[index] : null;
  }

  get length() {
    return this._store.size;
  }
}

/**
 * Safely verify if a storage mechanism is functional and writable
 */
function testStorage(type) {
  if (typeof window === 'undefined') return false;
  try {
    const storage = window[type];
    if (!storage) return false;
    const testKey = '__adsa_storage_test__';
    storage.setItem(testKey, '1');
    const read = storage.getItem(testKey);
    storage.removeItem(testKey);
    return read === '1';
  } catch (_) {
    return false;
  }
}

function createSafeStorageWrapper(storageType) {
  const memoryFallback = new MemoryStorage();
  let isAvailable = testStorage(storageType);

  const getNative = () => {
    if (!isAvailable) return null;
    try {
      return typeof window !== 'undefined' ? window[storageType] : null;
    } catch (_) {
      isAvailable = false;
      return null;
    }
  };

  return {
    isSupported() {
      return isAvailable;
    },

    getItem(key, fallback = null) {
      const nativeStorage = getNative();
      if (nativeStorage) {
        try {
          const val = nativeStorage.getItem(key);
          return val !== null ? val : fallback;
        } catch (_) {
          // Native threw error (e.g. storage disabled mid-session)
          isAvailable = false;
        }
      }
      const memVal = memoryFallback.getItem(key);
      return memVal !== null ? memVal : fallback;
    },

    setItem(key, value) {
      const valStr = String(value);
      // Always keep memory fallback in sync
      memoryFallback.setItem(key, valStr);

      const nativeStorage = getNative();
      if (nativeStorage) {
        try {
          nativeStorage.setItem(key, valStr);
        } catch (_) {
          // Could fail on QuotaExceeded or Access Denied
          isAvailable = false;
        }
      }
    },

    removeItem(key) {
      memoryFallback.removeItem(key);
      const nativeStorage = getNative();
      if (nativeStorage) {
        try {
          nativeStorage.removeItem(key);
        } catch (_) {
          isAvailable = false;
        }
      }
    },

    clear() {
      memoryFallback.clear();
      const nativeStorage = getNative();
      if (nativeStorage) {
        try {
          nativeStorage.clear();
        } catch (_) {
          isAvailable = false;
        }
      }
    },

    key(index) {
      const nativeStorage = getNative();
      if (nativeStorage) {
        try {
          return nativeStorage.key(index);
        } catch (_) {
          isAvailable = false;
        }
      }
      return memoryFallback.key(index);
    },

    get length() {
      const nativeStorage = getNative();
      if (nativeStorage) {
        try {
          return nativeStorage.length;
        } catch (_) {
          isAvailable = false;
        }
      }
      return memoryFallback.length;
    },

    /**
     * Parse JSON from storage with automatic fallback
     */
    getJSON(key, fallback = null) {
      const raw = this.getItem(key);
      if (!raw) return fallback;
      try {
        return JSON.parse(raw);
      } catch (err) {
        return fallback;
      }
    },

    /**
     * Stringify and save JSON to storage safely
     */
    setJSON(key, value) {
      try {
        this.setItem(key, JSON.stringify(value));
        return true;
      } catch (_) {
        return false;
      }
    },
  };
}

export const safeLocalStorage = createSafeStorageWrapper('localStorage');
export const safeSessionStorage = createSafeStorageWrapper('sessionStorage');

/**
 * Attempts to polyfill window.localStorage & window.sessionStorage globally
 * if native access throws. Safe to call anywhere.
 */
export function installGlobalStoragePolyfill() {
  if (typeof window === 'undefined') return;

  ['localStorage', 'sessionStorage'].forEach((type) => {
    let needsPolyfill = false;
    try {
      const test = window[type];
      if (!test) {
        needsPolyfill = true;
      } else {
        const k = '__adsa_test__';
        test.setItem(k, '1');
        test.removeItem(k);
      }
    } catch (_) {
      needsPolyfill = true;
    }

    if (needsPolyfill) {
      try {
        const mem = type === 'localStorage' ? safeLocalStorage : safeSessionStorage;
        Object.defineProperty(window, type, {
          value: mem,
          configurable: true,
          writable: true,
          enumerable: true,
        });
      } catch (_) {
        // In some browsers window.localStorage is non-configurable
      }
    }
  });
}

// Auto-run polyfill installer immediately upon import
installGlobalStoragePolyfill();
