import React, { useState, useEffect } from 'react';
import { usePreferences } from '../../store/PreferencesContext';

/**
 * Cursor-Tracking Cognitive Reading Ruler
 * Fosters line tracking and reading focus for users with dyslexia, ADHD, or visual crowding.
 */
export default function ReadingGuideRuler() {
  const { preferences } = usePreferences();
  const enabled = Boolean(preferences.readingGuide);

  const [mouseY, setMouseY] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e) => {
      setMouseY(e.clientY);
    };

    const handleTouchMove = (e) => {
      if (e.touches && e.touches[0]) {
        setMouseY(e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [enabled]);

  if (!enabled || mouseY === null) return null;

  const rulerHeight = 44; // Comfortable line reading height

  return (
    <div
      className="fixed inset-x-0 pointer-events-none z-[99998] transition-transform duration-75 ease-out"
      style={{
        top: `${mouseY - rulerHeight / 2}px`,
        height: `${rulerHeight}px`,
      }}
      aria-hidden="true"
    >
      <div className="w-full h-full bg-emerald-500/10 dark:bg-emerald-400/15 border-y-2 border-emerald-500/50 dark:border-emerald-400/60 shadow-[0_0_15px_rgba(16,185,129,0.2)] backdrop-contrast-125" />
    </div>
  );
}
