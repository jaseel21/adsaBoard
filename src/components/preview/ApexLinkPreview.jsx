import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useLinkMetadata } from '../../hooks/useLinkMetadata';
import { useFloatingPosition } from '../../hooks/useFloatingPosition';
import { useLongPress } from '../../hooks/useLongPress';
import { soundEngine } from '../../utils/soundEffects';
import HaloHoverCard from './HaloHoverCard';
import MobilePeekSheet from './MobilePeekSheet';

export default function ApexLinkPreview({
  url,
  href,
  children,
  className = '',
  overrides = {},
  disabled = false,
  onClick = null,
  showIndicator = false,
}) {
  const targetUrl = url || href;
  const triggerRef = useRef(null);
  const hoverTimeoutRef = useRef(null);
  const closeTimeoutRef = useRef(null);

  const [isDesktopOpen, setIsDesktopOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // Detect touch device capabilities
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice(
        'ontouchstart' in window || navigator.maxTouchPoints > 0
      );
    }
  }, []);

  // Fetch / resolve metadata for the target URL
  const { metadata, loading } = useLinkMetadata(targetUrl, overrides);

  // Position calculation for desktop floating card
  const coords = useFloatingPosition({
    targetRef: triggerRef,
    cardWidth: 340,
    cardHeight: 250,
    offsetY: 12,
    isOpen: isDesktopOpen,
  });

  // Open desktop card with intent debounce (150ms)
  const handleMouseEnter = useCallback(() => {
    if (disabled || isTouchDevice || !targetUrl) return;
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);

    hoverTimeoutRef.current = setTimeout(() => {
      soundEngine.playPop();
      setIsDesktopOpen(true);
    }, 150);
  }, [disabled, isTouchDevice, targetUrl]);

  // Graceful close desktop card
  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
      setIsDesktopOpen(false);
    }, 220);
  }, []);

  // Keyboard accessibility
  const handleFocus = useCallback(() => {
    if (disabled || isTouchDevice || !targetUrl) return;
    hoverTimeoutRef.current = setTimeout(() => {
      setIsDesktopOpen(true);
    }, 250);
  }, [disabled, isTouchDevice, targetUrl]);

  const handleBlur = useCallback(() => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    setIsDesktopOpen(false);
  }, []);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape') {
      setIsDesktopOpen(false);
      setIsMobileOpen(false);
    }
  }, []);

  // Long-press handler for touchscreen mobile devices
  const longPressHandlers = useLongPress(
    () => {
      if (disabled || !targetUrl) return;
      setIsMobileOpen(true);
    },
    {
      delay: 400,
      onClick: (e) => {
        if (onClick) onClick(e);
      },
    }
  );

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        {...(isTouchDevice ? longPressHandlers : {})}
        className={`inline-flex items-center gap-0.5 relative cursor-pointer ${className}`}
        aria-haspopup="dialog"
        aria-expanded={isDesktopOpen || isMobileOpen}
      >
        {children}

        {/* Optional subtle sparkle dot indicator */}
        {showIndicator && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5"
            title="Interactive Link Preview Available"
          />
        )}
      </span>

      {/* Desktop Floating Card */}
      {!isTouchDevice && isDesktopOpen && metadata && (
        <HaloHoverCard
          metadata={metadata}
          coords={coords}
          isOpen={isDesktopOpen}
          onClose={() => setIsDesktopOpen(false)}
          onMouseEnter={() => {
            if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
        />
      )}

      {/* Mobile Bottom Sheet */}
      {isMobileOpen && metadata && (
        <MobilePeekSheet
          metadata={metadata}
          isOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}
