import React, { useState, useEffect } from 'react';

/**
 * Global Screen Reader Live Region Announcer
 * Fulfills WCAG 2.2 4.1.3 Status Messages (Level AA)
 * Provides isolated polite and assertive broadcast channels for VoiceOver, TalkBack, NVDA, and JAWS.
 */
export default function AriaLiveAnnouncer() {
  const [politeMessage, setPoliteMessage] = useState('');
  const [assertiveMessage, setAssertiveMessage] = useState('');

  useEffect(() => {
    const handleAnnounce = (e) => {
      const { message, mode = 'polite' } = e.detail || {};
      if (!message) return;

      if (mode === 'assertive') {
        setAssertiveMessage('');
        // Brief timeout ensures identical consecutive messages re-trigger screen reader vocalization
        setTimeout(() => setAssertiveMessage(message), 40);
        setTimeout(() => setAssertiveMessage(''), 8000);
      } else {
        setPoliteMessage('');
        setTimeout(() => setPoliteMessage(message), 40);
        setTimeout(() => setPoliteMessage(''), 6000);
      }
    };

    window.addEventListener('a11y-announce', handleAnnounce);
    return () => window.removeEventListener('a11y-announce', handleAnnounce);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        width: '1px',
        height: '1px',
        padding: '0',
        margin: '-1px',
        overflow: 'hidden',
        clip: 'rect(0, 0, 0, 0)',
        whiteSpace: 'nowrap',
        border: '0',
      }}
      aria-hidden="false"
    >
      {/* Polite Channel for normal status updates & filter changes */}
      <div
        id="a11y-polite-channel"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {politeMessage}
      </div>

      {/* Assertive Channel for cutoff alarms, warnings & critical errors */}
      <div
        id="a11y-assertive-channel"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        {assertiveMessage}
      </div>
    </div>
  );
}
