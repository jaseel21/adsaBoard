import { useState, useEffect, useRef } from 'react';

/**
 * Universal Directional Scroll Header Hook
 * Tracks scroll direction and position with requestAnimationFrame throttling.
 *
 * @param {Object} options
 * @param {number} options.threshold - Top distance threshold where bar is always visible (default: 30)
 * @param {number} options.delta - Minimum pixel scroll delta required to trigger state change (default: 6)
 * @returns {boolean} isVisible - True when scrolling up or at top; False when scrolling down
 */
export function useScrollHeader({ threshold = 30, delta = 6 } = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const isTicking = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Initialize with current scroll position
    lastScrollY.current = window.scrollY || 0;

    const handleScroll = () => {
      if (!isTicking.current) {
        window.requestAnimationFrame(() => {
          const currentY = window.scrollY || 0;
          const diff = currentY - lastScrollY.current;

          // 1. Always visible near the top of the page
          if (currentY <= threshold) {
            setIsVisible(true);
          }
          // 2. Scrolling down past threshold by more than delta -> Hide
          else if (diff > delta) {
            setIsVisible(false);
          }
          // 3. Scrolling up by more than delta -> Show
          else if (diff < -delta) {
            setIsVisible(true);
          }

          lastScrollY.current = Math.max(0, currentY);
          isTicking.current = false;
        });
        isTicking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold, delta]);

  return isVisible;
}

export default useScrollHeader;
