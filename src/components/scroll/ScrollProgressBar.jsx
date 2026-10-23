import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSmoothScroll } from './SmoothScrollProvider';

/**
 * Ambient Top Scroll Progress Bar
 * Provides immediate spatial feedback on reading depth across long pages
 * with a luminous emerald gradient track.
 */
export default function ScrollProgressBar() {
  const { scrollProgress } = useSmoothScroll();
  const location = useLocation();
  const [hasOverflow, setHasOverflow] = useState(false);

  // Check if current page actually has scrollable content
  useEffect(() => {
    const checkOverflow = () => {
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      setHasOverflow(scrollHeight > clientHeight + 30);
    };

    checkOverflow();
    window.addEventListener('resize', checkOverflow);
    const timer = setTimeout(checkOverflow, 400); // Check again after components render

    return () => {
      window.removeEventListener('resize', checkOverflow);
      clearTimeout(timer);
    };
  }, [location.pathname]);

  // Don't render on kitchen display or pages without overflow
  if (location.pathname.startsWith('/kitchen') || !hasOverflow) {
    return null;
  }

  const clampedProgress = Math.min(Math.max(scrollProgress || 0, 0), 1);

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 pointer-events-none h-[2.5px] bg-transparent"
      aria-hidden="true"
    >
      <div
        className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-transform duration-75 ease-out shadow-[0_0_12px_rgba(16,185,129,0.7)] origin-left"
        style={{
          transform: `scaleX(${clampedProgress})`,
        }}
      />
    </div>
  );
}
