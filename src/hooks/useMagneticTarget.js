import { useRef, useCallback } from 'react';
import { useExperienceFX } from '../components/fx/ExperienceFXProvider';

/**
 * useMagneticTarget
 * Hook that connects any interactive button, icon, or card to the fluid cursor,
 * causing the outer halo to magnetically dock around the element.
 */
export function useMagneticTarget({ variant = 'pointer', borderRadius = 16 } = {}) {
  const { setMagneticTarget, setCursorVariant } = useExperienceFX();
  const elementRef = useRef(null);

  const handleMouseEnter = useCallback(() => {
    if (!elementRef.current) return;
    const rect = elementRef.current.getBoundingClientRect();
    setMagneticTarget({
      left: rect.left,
      top: rect.top,
      width: rect.width,
      height: rect.height,
      borderRadius,
    });
    setCursorVariant(variant);
  }, [setMagneticTarget, setCursorVariant, variant, borderRadius]);

  const handleMouseLeave = useCallback(() => {
    setMagneticTarget(null);
    setCursorVariant('default');
  }, [setMagneticTarget, setCursorVariant]);

  return {
    ref: elementRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
}
