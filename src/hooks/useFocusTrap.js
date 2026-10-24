import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Universal Accessible Modal Focus Trap Hook
 * WCAG 2.2 2.4.3 Focus Order & 2.1.2 No Keyboard Trap
 *
 * @param {Object} options
 * @param {boolean} options.active - Whether the trap is currently active
 * @param {Function} options.onClose - Callback triggered on Escape key
 * @param {React.RefObject} [options.initialFocusRef] - Optional element to receive focus first
 * @param {boolean} [options.restoreFocus=true] - Whether to restore focus upon trap deactivation
 */
export function useFocusTrap({
  active = false,
  onClose,
  initialFocusRef = null,
  restoreFocus = true,
} = {}) {
  const containerRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    // Save triggering element for restoration
    if (typeof document !== 'undefined') {
      previouslyFocusedElementRef.current = document.activeElement;
    }

    const container = containerRef.current;
    if (!container) return;

    // Shift initial focus
    const focusTimer = setTimeout(() => {
      if (initialFocusRef && initialFocusRef.current) {
        initialFocusRef.current.focus();
      } else {
        const focusables = container.querySelectorAll(FOCUSABLE_SELECTORS);
        if (focusables.length > 0) {
          focusables[0].focus();
        } else {
          container.setAttribute('tabindex', '-1');
          container.focus();
        }
      }
    }, 50);

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (onClose) {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }
        return;
      }

      if (e.key !== 'Tab') return;

      const focusables = Array.from(container.querySelectorAll(FOCUSABLE_SELECTORS)).filter(
        (el) => el.offsetParent !== null && !el.hasAttribute('disabled')
      );

      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }

      const firstElement = focusables[0];
      const lastElement = focusables[focusables.length - 1];

      if (e.shiftKey) {
        // Shift + Tab: if on first element, cycle to last
        if (document.activeElement === firstElement || document.activeElement === container) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab: if on last element, cycle to first
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      container.removeEventListener('keydown', handleKeyDown);

      // Restore focus to original triggering element
      if (restoreFocus && previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === 'function') {
        previouslyFocusedElementRef.current.focus();
      }
    };
  }, [active, onClose, initialFocusRef, restoreFocus]);

  return containerRef;
}

export default useFocusTrap;
