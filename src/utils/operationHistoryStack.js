/**
 * Reversible Operation History Stack (Multi-Level Undo / Redo State Machine)
 * Enables atomic rollback of individual and bulk administrative mutations across ADSA T-Board.
 */

import { soundEngine } from './soundEffects';
import { hapticEngine } from './haptics';

const MAX_HISTORY_DEPTH = 30;

class OperationHistoryStack {
  constructor() {
    this.undoStack = [];
    this.redoStack = [];
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    // Initial emit
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  notify() {
    const state = this.getState();
    this.listeners.forEach((listener) => {
      try {
        listener(state);
      } catch (err) {
        console.error('Error in operation history listener:', err);
      }
    });
  }

  getState() {
    return {
      canUndo: this.undoStack.length > 0,
      canRedo: this.redoStack.length > 0,
      undoCount: this.undoStack.length,
      redoCount: this.redoStack.length,
      lastOperation: this.undoStack[this.undoStack.length - 1] || null,
    };
  }

  /**
   * Push a reversible action into the history stack.
   * @param {Object} op - { id, description, execute, rollback }
   */
  async pushAndExecute(op) {
    if (!op || typeof op.rollback !== 'function') {
      throw new Error('Operation must provide a valid rollback function');
    }

    const operationRecord = {
      id: op.id || `op_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      description: op.description || 'Administrative Action',
      execute: op.execute,
      rollback: op.rollback,
      timestamp: Date.now(),
    };

    // Execute forward action if provided
    if (typeof op.execute === 'function') {
      await op.execute();
    }

    this.undoStack.push(operationRecord);
    if (this.undoStack.length > MAX_HISTORY_DEPTH) {
      this.undoStack.shift();
    }

    // New forward action clears redo history
    this.redoStack = [];
    this.notify();

    return operationRecord;
  }

  /**
   * Execute rollback of the most recent operation.
   */
  async undo() {
    if (this.undoStack.length === 0) return null;

    const op = this.undoStack.pop();
    try {
      soundEngine.playMechanicalClick();
      hapticEngine.mediumTick();

      await op.rollback();

      this.redoStack.push(op);
      this.notify();

      soundEngine.playSoftChime();
      hapticEngine.successPulse();
      return op;
    } catch (err) {
      console.error('Failed to undo operation:', err);
      // Re-insert into stack if failed
      this.undoStack.push(op);
      this.notify();
      soundEngine.playCautionThud();
      throw err;
    }
  }

  /**
   * Re-execute an undone operation.
   */
  async redo() {
    if (this.redoStack.length === 0) return null;

    const op = this.redoStack.pop();
    try {
      soundEngine.playMechanicalClick();
      hapticEngine.mediumTick();

      if (typeof op.execute === 'function') {
        await op.execute();
      }

      this.undoStack.push(op);
      this.notify();

      soundEngine.playSoftChime();
      hapticEngine.successPulse();
      return op;
    } catch (err) {
      console.error('Failed to redo operation:', err);
      this.redoStack.push(op);
      this.notify();
      soundEngine.playCautionThud();
      throw err;
    }
  }

  clear() {
    this.undoStack = [];
    this.redoStack = [];
    this.notify();
  }
}

export const operationHistory = new OperationHistoryStack();
