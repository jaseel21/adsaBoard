import { useState, useEffect } from 'react';
import { usePreferences } from '../store/PreferencesContext';

/**
 * Universal Reduced Motion Hook
 * Synchronizes user OS preference with in-app `motionFidelity` setting.
 * Returns true if animations and smooth scrolling should be bypassed.
 */
export function useReducedMotion() {
  const { preferences } = usePreferences();
  const [osReduced, setOsReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setOsReduced(mediaQuery.matches);

    const handleChange = (e) => setOsReduced(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const appReduced = preferences.motionFidelity === 'reduced';
  return osReduced || appReduced;
}

export default useReducedMotion;
