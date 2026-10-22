import { useRef, useCallback } from 'react';
import { hapticEngine } from '../utils/haptics';
import { soundEngine } from '../utils/soundEffects';

/**
 * useLongPress
 * Ergonomic 400ms touch hold detector with tactile vibration and audio click.
 * Suppresses default browser context menu when triggered.
 */
export function useLongPress(onLongPress, { delay = 400, onClick = null } = {}) {
  const timerRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isLongPressRef = useRef(false);

  const start = useCallback(
    (e) => {
      isLongPressRef.current = false;
      const point = e.touches ? e.touches[0] : e;
      startPosRef.current = { x: point.clientX, y: point.clientY };

      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        hapticEngine.mediumTick();
        soundEngine.playPop();
        if (onLongPress) {
          onLongPress(e);
        }
      }, delay);
    },
    [onLongPress, delay]
  );

  const clear = useCallback(
    (e, shouldTriggerClick = false) => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
      if (shouldTriggerClick && !isLongPressRef.current && onClick) {
        onClick(e);
      }
    },
    [onClick]
  );

  const handleMove = useCallback((e) => {
    if (!timerRef.current) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = Math.abs(point.clientX - startPosRef.current.x);
    const dy = Math.abs(point.clientY - startPosRef.current.y);

    // Cancel if movement exceeds finger jitter threshold (10px)
    if (dx > 10 || dy > 10) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return {
    onTouchStart: start,
    onTouchEnd: (e) => clear(e, false),
    onTouchMove: handleMove,
    onContextMenu: (e) => {
      if (isLongPressRef.current) {
        e.preventDefault();
      }
    },
  };
}
