import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useSmoothScroll } from './SmoothScrollProvider';

/**
 * ScrollRestorationWatcher
 * Synchronizes route changes with Lenis smooth scrolling:
 * 1. Resets scroll position to (0, 0) immediately upon route navigation.
 * 2. If a hash fragment exists (#section-id), smoothly scrolls to the target with navbar clearance.
 */
export default function ScrollRestorationWatcher() {
  const location = useLocation();
  const { scrollTo } = useSmoothScroll();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (location.hash) {
      // Smoothly navigate to hash target with floating nav offset
      const timeoutId = setTimeout(() => {
        try {
          const targetEl = document.querySelector(location.hash);
          if (targetEl) {
            scrollTo(targetEl, { offset: -90, duration: 0.8 });
          }
        } catch (_) {}
      }, 100);

      return () => clearTimeout(timeoutId);
    } else {
      // Immediate clean restoration to top
      scrollTo(0, { immediate: true });
    }
  }, [location.pathname, location.hash, scrollTo]);

  return null;
}
