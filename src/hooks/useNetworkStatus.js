import { useState, useEffect, useRef, useCallback } from 'react';
import { liveSyncManager } from '../utils/liveSyncManager';

/**
 * ADSA T-Board Reactive Network Health Hook
 * Powered by LiveSyncManager for multi-tier verification and zero-reload soft reconnection.
 */
export function useNetworkStatus() {
  const [syncState, setSyncState] = useState(() => liveSyncManager.getState());
  const [wasOffline, setWasOffline] = useState(false);
  const [reconnectedBannerActive, setReconnectedBannerActive] = useState(false);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    let prevOnline = liveSyncManager.getState().isOnline;

    const unsub = liveSyncManager.subscribe((state) => {
      setSyncState(state);

      if (!state.isOnline) {
        setWasOffline(true);
        setReconnectedBannerActive(false);
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      } else if (state.isOnline && !prevOnline) {
        // Just transitioned from offline to online!
        setReconnectedBannerActive(true);
        if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = setTimeout(() => {
          setReconnectedBannerActive(false);
          setWasOffline(false);
        }, 3500);
      }
      prevOnline = state.isOnline;
    });

    return () => {
      unsub();
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, []);

  const triggerSoftReconnect = useCallback(() => {
    return liveSyncManager.triggerSoftReconnect();
  }, []);

  return {
    isOnline: syncState.isOnline,
    isOffline: !syncState.isOnline,
    reconnecting: syncState.isReconnecting || reconnectedBannerActive,
    isReconnecting: syncState.isReconnecting,
    wasOffline,
    latencyMs: syncState.latencyMs,
    lastSyncedAt: syncState.lastSyncedAt,
    retryCountdown: syncState.retryCountdown,
    triggerSoftReconnect,
    checkConnection: triggerSoftReconnect,
  };
}

export default useNetworkStatus;
