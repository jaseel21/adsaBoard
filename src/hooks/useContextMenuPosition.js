import { useMemo } from 'react';

/**
 * useContextMenuPosition
 * Golden Clamping Algorithm: flips menu horizontally/vertically if it nears screen edges
 * to guarantee 100% boundary visibility without clipping or overflowing.
 */
export function useContextMenuPosition(x, y, menuWidth = 240, menuHeight = 280) {
  return useMemo(() => {
    if (typeof window === 'undefined') return { left: x, top: y };

    const padding = 16;
    const screenW = window.innerWidth;
    const screenH = window.innerHeight;

    let posX = x;
    let posY = y;

    // Flip horizontal if overflowing right
    if (posX + menuWidth > screenW - padding) {
      posX = Math.max(padding, posX - menuWidth);
    }

    // Flip vertical if overflowing bottom
    if (posY + menuHeight > screenH - padding) {
      posY = Math.max(padding, posY - menuHeight);
    }

    return {
      left: Math.max(padding, Math.min(posX, screenW - menuWidth - padding)),
      top: Math.max(padding, Math.min(posY, screenH - menuHeight - padding)),
    };
  }, [x, y, menuWidth, menuHeight]);
}
