import { useState, useEffect, useCallback } from 'react';
import { operationHistory } from '../utils/operationHistoryStack';

export function useOperationHistory({ enableKeyboardShortcuts = true } = {}) {
  const [historyState, setHistoryState] = useState(operationHistory.getState());

  useEffect(() => {
    const unsub = operationHistory.subscribe(setHistoryState);
    return () => unsub();
  }, []);

  const undo = useCallback(async () => {
    return await operationHistory.undo();
  }, []);

  const redo = useCallback(async () => {
    return await operationHistory.redo();
  }, []);

  // Keyboard shortcut listener: Cmd/Ctrl + Z (Undo), Cmd/Ctrl + Shift + Z or Cmd/Ctrl + Y (Redo)
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    const handleKeyDown = (e) => {
      // Don't intercept if user is actively typing in an input, textarea, or contentEditable element
      const target = e.target;
      const isInput =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      if (isInput) return;

      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          // Redo
          if (historyState.canRedo) {
            redo();
          }
        } else {
          // Undo
          if (historyState.canUndo) {
            undo();
          }
        }
      } else if (modifier && e.key.toLowerCase() === 'y' && !isMac) {
        // Windows Ctrl+Y Redo
        e.preventDefault();
        if (historyState.canRedo) {
          redo();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableKeyboardShortcuts, historyState.canUndo, historyState.canRedo, undo, redo]);

  return {
    ...historyState,
    undo,
    redo,
    clear: () => operationHistory.clear(),
    pushAndExecute: (op) => operationHistory.pushAndExecute(op),
  };
}
