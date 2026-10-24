import { useCallback } from 'react';

/**
 * Static announcer for non-React contexts (e.g. background alarms, service workers, dialog utils)
 */
export function announceA11y(message, mode = 'polite') {
  if (typeof window !== 'undefined' && message) {
    window.dispatchEvent(
      new CustomEvent('a11y-announce', {
        detail: { message, mode },
      })
    );
  }
}

/**
 * Reactive React Hook for broadcasting screen reader status announcements
 */
export function useA11yAnnounce() {
  const announce = useCallback((message, mode = 'polite') => {
    announceA11y(message, mode);
  }, []);

  const announcePolite = useCallback((message) => {
    announceA11y(message, 'polite');
  }, []);

  const announceAssertive = useCallback((message) => {
    announceA11y(message, 'assertive');
  }, []);

  return {
    announce,
    announcePolite,
    announceAssertive,
  };
}

export default useA11yAnnounce;
