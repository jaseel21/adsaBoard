import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from 'react';
import { useLocation } from 'react-router-dom';
import { ReactLenis, useLenis } from 'lenis/react';

const SmoothScrollContext = createContext({
  lenis: null,
  scrollY: 0,
  scrollProgress: 0,
  scrollDirection: null,
  isScrolled: false,
  scrollTo: () => {},
  stop: () => {},
  start: () => {},
});

/**
 * Hook to consume smooth scroll state & controls
 */
export function useSmoothScroll() {
  return useContext(SmoothScrollContext);
}

/**
 * Internal scroll event bridge that subscribes to Lenis updates
 * and populates React state for reactive UI elements (headers, progress bar, etc.)
 */
function LenisStateBridge({ children, isBypassed }) {
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [scrollDirection, setScrollDirection] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);

  const lenis = useLenis((lenisInstance) => {
    if (isBypassed) return;
    const currentY = lenisInstance.scroll;
    const progress = lenisInstance.progress;
    const direction = lenisInstance.direction === 1 ? 'down' : lenisInstance.direction === -1 ? 'up' : null;

    setScrollY(currentY);
    setScrollProgress(progress);
    setScrollDirection(direction);
    setIsScrolled(currentY > 20);
  });

  const scrollTo = useCallback(
    (target, options = {}) => {
      if (lenis && !isBypassed) {
        lenis.scrollTo(target, {
          offset: options.offset ?? 0,
          duration: options.duration ?? 1.1,
          immediate: options.immediate ?? false,
          lock: options.lock ?? false,
          ...options,
        });
      } else {
        // Fallback for native scroll
        if (typeof target === 'number') {
          window.scrollTo({ top: target, behavior: options.immediate ? 'instant' : 'smooth' });
        } else if (typeof target === 'string') {
          const el = document.querySelector(target);
          if (el) {
            const top = el.getBoundingClientRect().top + window.scrollY + (options.offset || 0);
            window.scrollTo({ top, behavior: options.immediate ? 'instant' : 'smooth' });
          }
        }
      }
    },
    [lenis, isBypassed]
  );

  const stop = useCallback(() => {
    if (lenis && !isBypassed) {
      lenis.stop();
    }
  }, [lenis, isBypassed]);

  const start = useCallback(() => {
    if (lenis && !isBypassed) {
      lenis.start();
    }
  }, [lenis, isBypassed]);

  const contextValue = useMemo(
    () => ({
      lenis,
      scrollY,
      scrollProgress,
      scrollDirection,
      isScrolled,
      scrollTo,
      stop,
      start,
    }),
    [lenis, scrollY, scrollProgress, scrollDirection, isScrolled, scrollTo, stop, start]
  );

  return (
    <SmoothScrollContext.Provider value={contextValue}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

/**
 * Root Smooth Scroll Provider using Lenis
 */
export default function SmoothScrollProvider({ children }) {
  const location = useLocation();
  const lenisRef = useRef(null);

  // Check user OS reduced motion preference
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Operational exclusion: Kitchen Display (/kitchen) requires zero-latency raw touch responsiveness
  const isKitchenRoute = location.pathname.startsWith('/kitchen');
  const isBypassed = prefersReducedMotion || isKitchenRoute;

  // Curated physics configuration
  const lenisOptions = useMemo(
    () => ({
      lerp: isBypassed ? 1 : 0.095, // Silky smooth deceleration
      duration: isBypassed ? 0 : 1.15,
      // Apple-tier exponential ease-out curve
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smoothWheel: !isBypassed,
      wheelMultiplier: 1.0,
      touchMultiplier: 1.0,
      syncTouch: false, // Ensures native iOS / Android swipe inertia without input lag
      autoResize: true,
      prevent: (node) => {
        // Prevent Lenis from handling elements with data-lenis-prevent or inside modals
        return (
          node.hasAttribute('data-lenis-prevent') ||
          node.closest('[data-lenis-prevent]') !== null
        );
      },
    }),
    [isBypassed]
  );

  return (
    <ReactLenis root options={lenisOptions} ref={lenisRef}>
      <LenisStateBridge isBypassed={isBypassed}>
        {children}
      </LenisStateBridge>
    </ReactLenis>
  );
}
