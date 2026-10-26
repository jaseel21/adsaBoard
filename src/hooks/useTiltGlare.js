import { useRef, useCallback, useState, useEffect } from 'react';
import { usePreferences } from '../store/PreferencesContext';

/**
 * useTiltGlare
 * Hardware-accelerated 3D parallax tilt with dynamic specular light sweep.
 * Respects user preferences (cinematic, subtle, off) and prefers-reduced-motion.
 */
export function useTiltGlare({ maxTilt = 10, scale = 1.02, glare = true } = {}) {
  const elementRef = useRef(null);
  const [style, setStyle] = useState({});
  const [glareStyle, setGlareStyle] = useState({ opacity: 0 });
  const { preferences } = usePreferences();

  const tiltSetting = preferences?.tiltEffect || 'cinematic';
  const isReducedMotion = preferences?.motionFidelity === 'reduced';
  const effectiveMaxTilt = tiltSetting === 'cinematic' ? maxTilt : tiltSetting === 'subtle' ? maxTilt * 0.45 : 0;
  const isEnabled = effectiveMaxTilt > 0 && !isReducedMotion;

  const handleMouseMove = useCallback((e) => {
    if (!isEnabled || !elementRef.current) return;

    const rect = elementRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const normX = (x / rect.width) * 2 - 1; // -1 to 1
    const normY = (y / rect.height) * 2 - 1; // -1 to 1

    const rotX = -normY * effectiveMaxTilt;
    const rotY = normX * effectiveMaxTilt;

    setStyle({
      transform: `perspective(1000px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg) scale3d(${scale}, ${scale}, ${scale})`,
      transition: 'transform 80ms ease-out',
      willChange: 'transform',
    });

    if (glare) {
      const glareX = (x / rect.width) * 100;
      const glareY = (y / rect.height) * 100;
      setGlareStyle({
        opacity: 0.25,
        background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.05) 50%, transparent 80%)`,
        transition: 'opacity 150ms ease-out',
      });
    }
  }, [isEnabled, effectiveMaxTilt, scale, glare]);

  const handleMouseLeave = useCallback(() => {
    if (!isEnabled) return;
    setStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
      transition: 'transform 400ms cubic-bezier(0.16, 1, 0.3, 1)',
    });
    if (glare) {
      setGlareStyle({
        opacity: 0,
        transition: 'opacity 300ms ease-out',
      });
    }
  }, [isEnabled, glare]);

  return {
    ref: elementRef,
    style,
    glareStyle,
    onMouseMove: handleMouseMove,
    onMouseLeave: handleMouseLeave,
  };
}
