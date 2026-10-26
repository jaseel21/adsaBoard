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
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { usePreferences } from '../../store/PreferencesContext';

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

  // Synchronize with both OS reduced motion and in-app preferences
  const prefersReducedMotion = useReducedMotion();
  const { preferences } = usePreferences();

  // Operational exclusion: Kitchen Display (/kitchen) requires zero-latency raw touch responsiveness
  const isKitchenRoute = location.pathname.startsWith('/kitchen');
  const isBypassed =
    prefersReducedMotion ||
    isKitchenRoute ||
    preferences?.smoothScrollEnabled === false ||
    preferences?.motionFidelity === 'reduced';

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
      allowNestedScroll: true, // Automatically delegates native wheel/touch events for nested scrollable containers
      prevent: (node) => {
        if (!node || !(node instanceof Element)) return false;

        // 1. Explicit Lenis prevent attribute (direct or inherited from ancestor)
        if (
          node.hasAttribute('data-lenis-prevent') ||
          node.closest('[data-lenis-prevent]') !== null
        ) {
          return true;
        }

        // 2. Modals, Dialogs, Drawers, Sheets, Popovers, and Menus
        if (
          node.closest(
            '[role="dialog"], [role="alertdialog"], [role="menu"], [role="listbox"], [role="combobox"], [aria-modal="true"], dialog, [data-modal], [data-dialog], .modal, .dialog'
          ) !== null
        ) {
          return true;
        }

        // 3. Any fixed or absolute overlay container / modal backdrop
        // (excluding pointer-events-none background ambient effects)
        const fixedContainer = node.closest(
          '[class*="fixed inset-0"], .fixed.inset-0, [class*="fixed top-0"], [class*="fixed bottom-0"]'
        );
        if (fixedContainer && !fixedContainer.classList.contains('pointer-events-none')) {
          return true;
        }

        // 4. Any vertically scrollable container (Tailwind or native overflow classes)
        const scrollableContainer = node.closest(
          '[class*="overflow-y-auto"], [class*="overflow-y-scroll"], [class*="overflow-auto"], [class*="overflow-scroll"]'
        );
        if (scrollableContainer) {
          return true;
        }

        return false;
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
