import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useFloatingPosition
 * Dynamically computes anchor-relative coordinates for the floating preview card
 * with viewport boundary clamping, vertical flipping, and arrow pointer alignment.
 */
export function useFloatingPosition({
  targetRef,
  cardWidth = 340,
  cardHeight = 220,
  offsetY = 12,
  padding = 16,
  isOpen = false,
}) {
  const [coords, setCoords] = useState({
    x: 0,
    y: 0,
    placement: 'top', // 'top' | 'bottom'
    arrowX: cardWidth / 2,
  });

  const updatePosition = useCallback(() => {
    if (!targetRef.current || typeof window === 'undefined') return;

    const targetRect = targetRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Center X over target
    const targetCenterX = targetRect.left + targetRect.width / 2;
    let idealX = targetCenterX - cardWidth / 2;

    // Clamp horizontally to stay within viewport with padding
    const minX = padding;
    const maxX = viewportWidth - cardWidth - padding;
    const clampedX = Math.max(minX, Math.min(idealX, maxX));

    // Calculate Arrow pointer relative to the card container
    const arrowX = Math.max(20, Math.min(targetCenterX - clampedX, cardWidth - 20));

    // Vertical placement logic:
    // Determine whether there's sufficient room above the trigger
    const spaceAbove = targetRect.top;
    const spaceBelow = viewportHeight - targetRect.bottom;
    const requiredHeight = cardHeight + offsetY;

    let placement = 'top';
    let idealY = targetRect.top - cardHeight - offsetY;

    if (spaceAbove < requiredHeight && spaceBelow >= requiredHeight) {
      // Flip to bottom
      placement = 'bottom';
      idealY = targetRect.bottom + offsetY;
    } else if (spaceAbove < requiredHeight && spaceBelow < requiredHeight) {
      // Pick whichever side has more room
      if (spaceBelow > spaceAbove) {
        placement = 'bottom';
        idealY = targetRect.bottom + offsetY;
      } else {
        placement = 'top';
        idealY = Math.max(padding, targetRect.top - cardHeight - offsetY);
      }
    }

    setCoords({
      x: Math.round(clampedX),
      y: Math.round(idealY),
      placement,
      arrowX: Math.round(arrowX),
    });
  }, [targetRef, cardWidth, cardHeight, offsetY, padding]);

  useEffect(() => {
    if (!isOpen) return;

    updatePosition();
    window.addEventListener('resize', updatePosition, { passive: true });
    window.addEventListener('scroll', updatePosition, { passive: true, capture: true });

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, { capture: true });
    };
  }, [isOpen, updatePosition]);

  return coords;
}
