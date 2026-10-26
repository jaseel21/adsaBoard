import { useRef, useCallback } from 'react';
import { usePreferences } from '../store/PreferencesContext';

/**
 * useSpotlightBorder
 * Attaches reactive --mouse-x and --mouse-y CSS properties to create
 * Raycast/Linear-style interactive perimeter glow effects.
 */
export function useSpotlightBorder() {
  const containerRef = useRef(null);
  const { preferences } = usePreferences();

  const isReducedMotion = preferences?.motionFidelity === 'reduced';

  const handleMouseMove = useCallback((e) => {
    if (isReducedMotion || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    containerRef.current.style.setProperty('--mouse-x', `${x}px`);
    containerRef.current.style.setProperty('--mouse-y', `${y}px`);
  }, [isReducedMotion]);

  return {
    ref: containerRef,
    onMouseMove: handleMouseMove,
  };
}
