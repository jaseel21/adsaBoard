import firebase from '../firebase/config';
import { syncServerTime } from './time';

/**
 * Isolated fetch helper with dedicated timeout and AbortController.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 2000) {
  if (typeof AbortController === 'undefined') {
    return fetch(url, options);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timer);
    return res;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

/**
 * ADSA T-Board Central Real-Time Synchronization & Connection Health Engine.
 *
 * Provides:
 * 1. Multi-tier connectivity watchdog (Browser events + Edge HTTP ping + Firestore channel state).
 * 2. In-memory Zero-Reload Soft Reconnect protocol (cycling Firestore WebChannel without window reload).
 * 3. Proactive recovery when laptop lid opens, mobile phone unlocks, or tab regains visibility.
 * 4. Inter-tab instantaneous synchronization via BroadcastChannel ('adsa_board_realtime_bus').
 * 5. High-precision cloud latency telemetry (RTT tracking).
 */
class LiveSyncManager {
  constructor() {
    // Optimistic initial state; verified within 500ms by active multi-tier probe
    this.isOnline = true;
    this.isFirestoreConnected = true;
    this.latencyMs = 0;
    this.lastSyncedAt = Date.now();
    this.isReconnecting = false;
    this.listeners = new Set();
    this.broadcastChannel = null;
    this.pingTimer = null;
    this.countdownTimer = null;
    this.retryCountdown = 0;

    if (typeof window !== 'undefined') {
      try {
        if ('BroadcastChannel' in window) {
          this.broadcastChannel = new BroadcastChannel('adsa_board_realtime_bus');
          this.broadcastChannel.onmessage = (event) => this.handleBroadcastMessage(event);
        }
      } catch (e) {
        console.warn('BroadcastChannel initialization skipped:', e);
      }

      this.initWatchdog();
    }
  }

  initWatchdog() {
    // 1. Browser online/offline event handlers
    window.addEventListener('online', () => {
      this.handleNetworkStatusChange(true);
    });

    window.addEventListener('offline', () => {
      this.handleNetworkStatusChange(false);
    });

    // 2. Tab visibility change & focus recovery (e.g. laptop wake / mobile screen unlock)
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.verifyAndSoftSync();
        }
      });
    }

    window.addEventListener('focus', () => {
      this.verifyAndSoftSync();
    });

    // 3. Periodic lightweight keepalive probe (every 20s when offline, every 60s when online)
    this.pingTimer = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        if (!this.isOnline || !this.isFirestoreConnected) {
          this.verifyAndSoftSync();
        } else {
          this.measureLatency();
        }
      }
    }, 20000);

    // Initial passive edge ping right away (500ms after startup)
    setTimeout(() => {
      this.measureLatency();
    }, 500);
  }

  async handleNetworkStatusChange(onlineStatus) {
    if (onlineStatus) {
      // Browser reports online: mark online immediately for responsive UI
      this.isOnline = true;
      this.notify();

      // Proactively verify edge reachability and cycle live sync
      const verified = await this.pingEdge(2000);
      if (verified) {
        await this.triggerSoftReconnect();
      } else {
        this.startRetryCountdown(3);
      }
    } else {
      // Browser fired 'offline' event.
      // On tethered or virtual adapter networks (e.g. mobile hotspot / ICS), OS can report false offline.
      // Verify via actual HTTP probe before switching to offline mode:
      const verified = await this.pingEdge(1500);
      if (!verified) {
        this.isOnline = false;
        this.isFirestoreConnected = false;
        this.startRetryCountdown(5);
        this.notify();
      }
    }
  }

  startRetryCountdown(seconds = 5) {
    if (this.countdownTimer) clearInterval(this.countdownTimer);
    this.retryCountdown = seconds;
    this.notify();

    this.countdownTimer = setInterval(() => {
      this.retryCountdown -= 1;
      this.notify();

      if (this.retryCountdown <= 0) {
        clearInterval(this.countdownTimer);
        this.countdownTimer = null;
        if (!this.isOnline || !this.isFirestoreConnected) {
          this.verifyAndSoftSync();
        }
      }
    }, 1000);
  }

  async verifyAndSoftSync() {
    // Probe network reachability directly; do not veto prematurely based on navigator.onLine
    const isEdgeReachable = await this.pingEdge(2000);
    if (isEdgeReachable) {
      if (!this.isOnline || !this.isFirestoreConnected) {
        await this.triggerSoftReconnect();
      }
    }
  }

  /**
   * Resilient, multi-tier reachability check with isolated probe timeouts.
   * Tier 1: Dedicated same-origin JSON probe (/ping.json) - completely CORS-free and instant.
   * Tier 2: Public zero-body Google Connectivity check (connectivitycheck.gstatic.com/generate_204).
   * Tier 3: Secondary external 204 probe.
   *
   * Note: We test actual HTTP reachability first because tethered/hotspot connections
   * often report navigator.onLine === false erroneously.
   */
  async pingEdge(timeoutMs = 2000) {

    // Probe 1: Same-Origin lightweight probe (tests app host reachability)
    try {
      const t0 = performance.now();
      const originProbeUrl =
        typeof window !== 'undefined' && window.location?.origin
          ? `${window.location.origin}/ping.json?_ping=${Date.now()}`
          : `/ping.json?_ping=${Date.now()}`;

      const res = await fetchWithTimeout(originProbeUrl, { method: 'GET', cache: 'no-store' }, timeoutMs);
      if (res && res.ok) {
        this.latencyMs = Math.max(1, Math.round(performance.now() - t0));
        this.lastSyncedAt = Date.now();
        this.isOnline = true;
        this.notify();
        return true;
      }
    } catch (_) {
      // Primary origin probe failed or timed out, fallback to public CDN probe
    }

    // Probe 2: Google Public 204 connectivity check (global anycast CDN, cross-origin resource policy)
    try {
      const t0 = performance.now();
      await fetchWithTimeout(
        `https://connectivitycheck.gstatic.com/generate_204?_ping=${Date.now()}`,
        { method: 'GET', mode: 'no-cors', cache: 'no-store' },
        timeoutMs
      );
      this.latencyMs = Math.max(1, Math.round(performance.now() - t0));
      this.lastSyncedAt = Date.now();
      this.isOnline = true;
      this.notify();
      return true;
    } catch (_) {}

    // Probe 3: Secondary external fallback
    try {
      const t0 = performance.now();
      await fetchWithTimeout(
        `https://www.google.com/generate_204?_ping=${Date.now()}`,
        { method: 'GET', mode: 'no-cors', cache: 'no-store' },
        timeoutMs
      );
      this.latencyMs = Math.max(1, Math.round(performance.now() - t0));
      this.lastSyncedAt = Date.now();
      this.isOnline = true;
      this.notify();
      return true;
    } catch (_) {}

    // If browser adapter reports online, maintain online state (prevent false offline flashes)
    if (typeof navigator !== 'undefined' && navigator.onLine) {
      this.isOnline = true;
      this.notify();
      return true;
    }

    // Genuinely offline:
    this.isOnline = false;
    this.notify();
    return false;
  }

  async measureLatency() {
    await this.pingEdge(2000);
  }

  /**
   * In-memory Zero-Reload Soft Reconnect protocol.
   * Cycles Firestore's internal WebChannel/WebSocket connection without refreshing the window!
   */
  async triggerSoftReconnect() {
    if (this.isReconnecting) return false;
    this.isReconnecting = true;
    if (this.countdownTimer) {
      clearInterval(this.countdownTimer);
      this.countdownTimer = null;
      this.retryCountdown = 0;
    }
    this.notify();

    try {
      // 1. Cycle Firestore's underlying network transport
      if (firebase && firebase.firestore) {
        const db = firebase.firestore();
        try {
          await db.disableNetwork();
        } catch (_) {}
        await new Promise((resolve) => setTimeout(resolve, 150));
        try {
          await db.enableNetwork();
        } catch (_) {}
      }

      // 2. Re-synchronize verified anti-tamper server clock
      await syncServerTime().catch(() => {});

      // 3. Verify reachability & latency
      await this.pingEdge(2500);

      this.isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
      this.isFirestoreConnected = true;
      this.lastSyncedAt = Date.now();

      // 4. Notify all reactive subscribers, open tabs & window listeners
      this.broadcast('SOFT_RECONNECT_SUCCESS', { timestamp: this.lastSyncedAt });
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('adsa:soft_reconnected', {
            detail: { timestamp: this.lastSyncedAt },
          })
        );
      }
      return true;
    } catch (err) {
      console.warn('Soft reconnect attempt failed:', err);
      return false;
    } finally {
      this.isReconnecting = false;
      this.notify();
    }
  }

  /**
   * Broadcast real-time events to all other open tabs in the browser.
   */
  broadcast(type, payload = {}) {
    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
      } catch (_) {}
    }
  }

  handleBroadcastMessage(event) {
    const { type, payload } = event.data || {};
    if (type === 'SESSION_PURGE') {
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
        window.dispatchEvent(new CustomEvent('adsa:session_purged'));
      }
    } else if (type === 'STUDENT_MUTATION_OCCURRED') {
      window.dispatchEvent(new CustomEvent('adsa:student_mutation', { detail: payload }));
    } else if (type === 'SOFT_RECONNECT_SUCCESS') {
      this.lastSyncedAt = payload?.timestamp || Date.now();
      this.notify();
    }
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Immediately emit current state
    try {
      listener(this.getState());
    } catch (_) {}
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (_) {}
    });
  }

  getState() {
    return {
      isOnline: this.isOnline,
      isFirestoreConnected: this.isFirestoreConnected,
      isReconnecting: this.isReconnecting,
      latencyMs: this.latencyMs,
      lastSyncedAt: this.lastSyncedAt,
      retryCountdown: this.retryCountdown,
    };
  }
}

export const liveSyncManager = new LiveSyncManager();
export default liveSyncManager;
