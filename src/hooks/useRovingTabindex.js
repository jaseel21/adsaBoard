import { useState, useCallback, useRef } from 'react';

/**
 * 2D & 1D Roving Tabindex Manager Hook
 * WCAG 2.2 2.1.1 Keyboard & WAI-ARIA Grid Design Pattern
 * Enables arrow-key navigation through complex grids (calendar matrices & token boards)
 *
 * @param {Object} options
 * @param {number} options.totalItems - Total count of navigable items
 * @param {number} [options.columns=7] - Number of columns in grid (e.g. 7 for calendar days)
 * @param {Function} [options.onSelect] - Callback when Enter or Space is pressed on focused item
 * @param {boolean} [options.loop=false] - Whether arrow navigation loops at edges
 */
export function useRovingTabindex({
  totalItems,
  columns = 7,
  onSelect,
  loop = false,
} = {}) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef([]);

  const focusItem = useCallback((newIndex) => {
    if (newIndex >= 0 && newIndex < totalItems) {
      setFocusedIndex(newIndex);
      const target = itemRefs.current[newIndex];
      if (target && typeof target.focus === 'function') {
        target.focus();
      }
    }
  }, [totalItems]);

  const handleKeyDown = useCallback(
    (e, currentIndex) => {
      let handled = false;

      switch (e.key) {
        case 'ArrowRight': {
          let next = currentIndex + 1;
          if (next >= totalItems) {
            next = loop ? 0 : totalItems - 1;
          }
          focusItem(next);
          handled = true;
          break;
        }
        case 'ArrowLeft': {
          let prev = currentIndex - 1;
          if (prev < 0) {
            prev = loop ? totalItems - 1 : 0;
          }
          focusItem(prev);
          handled = true;
          break;
        }
        case 'ArrowDown': {
          const down = currentIndex + columns;
          if (down < totalItems) {
            focusItem(down);
          } else if (loop) {
            focusItem(currentIndex % columns);
          }
          handled = true;
          break;
        }
        case 'ArrowUp': {
          const up = currentIndex - columns;
          if (up >= 0) {
            focusItem(up);
          } else if (loop) {
            const lastRowIndex = Math.floor((totalItems - 1) / columns) * columns + (currentIndex % columns);
            focusItem(Math.min(lastRowIndex, totalItems - 1));
          }
          handled = true;
          break;
        }
        case 'Home': {
          focusItem(0);
          handled = true;
          break;
        }
        case 'End': {
          focusItem(totalItems - 1);
          handled = true;
          break;
        }
        case 'Enter':
        case ' ': {
          if (onSelect) {
            e.preventDefault();
            onSelect(currentIndex);
            handled = true;
          }
          break;
        }
        default:
          break;
      }

      if (handled) {
        e.preventDefault();
      }
    },
    [totalItems, columns, loop, onSelect, focusItem]
  );

  const getItemProps = useCallback(
    (index) => ({
      tabIndex: focusedIndex === index ? 0 : -1,
      ref: (el) => {
        itemRefs.current[index] = el;
      },
      onFocus: () => setFocusedIndex(index),
      onKeyDown: (e) => handleKeyDown(e, index),
    }),
    [focusedIndex, handleKeyDown]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    focusItem,
    getItemProps,
  };
}

export default useRovingTabindex;
