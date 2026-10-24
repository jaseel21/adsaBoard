import { useState, useEffect, useRef } from 'react';

/**
 * ADSA T-Board Reactive Network Health Hook
 * Tracks browser online/offline status and provides reconnection transitions.
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(() => {
    if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
      return navigator.onLine;
    }
    return true;
  });

  const [wasOffline, setWasOffline] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const reconnectTimerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => {
      setIsOnline(true);
      setReconnecting(true);

      // Flash "Back Online" banner for 3.5 seconds then clear wasOffline
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = setTimeout(() => {
        setReconnecting(false);
        setWasOffline(false);
      }, 3500);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(true);
      setReconnecting(false);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
    };
  }, []);

  return {
    isOnline,
    isOffline: !isOnline,
    wasOffline,
    reconnecting,
  };
}
