import { useRef, useCallback, useState } from 'react';
import { hapticEngine } from '../utils/haptics';
import { useFeedback } from '../utils/useFeedback';
import { usePreferences } from '../store/PreferencesContext';

/**
 * useLongPressPeek
 * Mobile ergonomic 400ms touch-hold detector with two-stage haptic escalation.
 * Displays a progressive countdown progress under the thumb and triggers a 3D peek preview.
 */
export function useLongPressPeek(onPeek, { delay = 400, jitterLimit = 12 } = {}) {
  const timerRef = useRef(null);
  const stageOneRef = useRef(null);
  const startPosRef = useRef({ x: 0, y: 0 });
  const isTriggeredRef = useRef(false);
  const [progress, setProgress] = useState(0); // 0 to 1
  const [touchPos, setTouchPos] = useState(null);
  const progressAnimRef = useRef(null);
  const startTimeRef = useRef(0);

  const { feedback } = useFeedback();
  const { preferences } = usePreferences();
  const enabled = preferences?.mobileLongPressPeek !== false;

  const start = useCallback(
    (e, data) => {
      if (!enabled) return;
      isTriggeredRef.current = false;
      const point = e.touches ? e.touches[0] : e;
      startPosRef.current = { x: point.clientX, y: point.clientY };
      setTouchPos({ x: point.clientX, y: point.clientY });
      startTimeRef.current = performance.now();
      setProgress(0);

      // Animation loop for smooth progress ring
      const updateProgress = () => {
        const elapsed = performance.now() - startTimeRef.current;
        const p = Math.min(1, elapsed / delay);
        setProgress(p);
        if (p < 1 && !isTriggeredRef.current) {
          progressAnimRef.current = requestAnimationFrame(updateProgress);
        }
      };
      progressAnimRef.current = requestAnimationFrame(updateProgress);

      // Stage 1: 180ms feather vibration alert
      stageOneRef.current = setTimeout(() => {
        if (preferences?.hapticEscalation !== false) {
          hapticEngine.lightTap();
        }
      }, 180);

      // Stage 2: 400ms confirmation tick & peek trigger
      timerRef.current = setTimeout(() => {
        isTriggeredRef.current = true;
        setProgress(1);
        if (progressAnimRef.current) cancelAnimationFrame(progressAnimRef.current);
        hapticEngine.mediumTick();
        feedback('pop');

        const targetRect = e.currentTarget
          ? e.currentTarget.getBoundingClientRect()
          : null;

        if (onPeek) {
          onPeek({
            data,
            rect: targetRect,
            x: startPosRef.current.x,
            y: startPosRef.current.y,
          });
        }
      }, delay);
    },
    [enabled, delay, onPeek, feedback, preferences?.hapticEscalation]
  );

  const cancel = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (stageOneRef.current) {
      clearTimeout(stageOneRef.current);
      stageOneRef.current = null;
    }
    if (progressAnimRef.current) {
      cancelAnimationFrame(progressAnimRef.current);
      progressAnimRef.current = null;
    }
    setProgress(0);
    setTouchPos(null);
  }, []);

  const handleMove = useCallback((e) => {
    if (!timerRef.current) return;
    const point = e.touches ? e.touches[0] : e;
    const dx = Math.abs(point.clientX - startPosRef.current.x);
    const dy = Math.abs(point.clientY - startPosRef.current.y);

    // Cancel if movement exceeds jitter threshold
    if (dx > jitterLimit || dy > jitterLimit) {
      cancel();
    }
  }, [jitterLimit, cancel]);

  return {
    onTouchStart: start,
    onTouchEnd: cancel,
    onTouchMove: handleMove,
    progress,
    touchPos,
    isTriggered: isTriggeredRef.current,
  };
}
