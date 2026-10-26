import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Edit2, Loader2 } from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

export default function InlineEditableCell({
  value,
  type = 'text', // 'text' | 'select' | 'toggle'
  options = [],  // for select: [{ value, label }]
  onCommit,
  disabled = false,
  placeholder = '--',
  className = '',
  toggleLabelOn = 'Active',
  toggleLabelOff = 'Inactive',
  toggleColor = 'emerald',
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCommitFlash, setShowCommitFlash] = useState(false);

  const inputRef = useRef(null);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      if (type === 'text' && typeof inputRef.current.select === 'function') {
        inputRef.current.select();
      }
    }
  }, [isEditing, type]);

  const handleStartEdit = () => {
    if (disabled || isSyncing) return;
    soundEngine.playPop();
    hapticEngine.lightTap();
    setIsEditing(true);
  };

  const handleCommit = async () => {
    if (localVal === value) {
      setIsEditing(false);
      return;
    }

    setIsSyncing(true);
    setIsEditing(false);
    soundEngine.playMechanicalClick();

    try {
      if (typeof onCommit === 'function') {
        await onCommit(localVal);
      }
      setShowCommitFlash(true);
      soundEngine.playSoftChime();
      hapticEngine.successPulse();
      setTimeout(() => setShowCommitFlash(false), 900);
    } catch (err) {
      console.error('Cell commit error:', err);
      soundEngine.playCautionThud();
      setLocalVal(value); // Rollback to original value on error
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCancel = () => {
    setLocalVal(value);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  };

  // Dedicated Render for Boolean Toggle Cell
  if (type === 'toggle') {
    const isChecked = Boolean(value);
    return (
      <button
        type="button"
        disabled={disabled || isSyncing}
        onClick={async () => {
          if (disabled || isSyncing) return;
          const nextVal = !isChecked;
          setIsSyncing(true);
          soundEngine.playPop();
          hapticEngine.lightTap();
          try {
            if (typeof onCommit === 'function') {
              await onCommit(nextVal);
            }
            setShowCommitFlash(true);
            setTimeout(() => setShowCommitFlash(false), 800);
          } catch (err) {
            soundEngine.playCautionThud();
          } finally {
            setIsSyncing(false);
          }
        }}
        className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
          isChecked
            ? toggleColor === 'amber'
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
            : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-white/5 hover:border-gray-300'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : 'active:scale-95 cursor-pointer'} ${className}`}
      >
        {isSyncing ? (
          <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
        ) : (
          <span
            className={`w-2 h-2 rounded-full transition-transform ${
              isChecked
                ? toggleColor === 'amber'
                  ? 'bg-amber-500 group-hover:scale-125'
                  : 'bg-emerald-500 group-hover:scale-125'
                : 'bg-gray-400 dark:bg-gray-500'
            }`}
          />
        )}
        <span>{isChecked ? toggleLabelOn : toggleLabelOff}</span>

        {/* Optimistic Flash Feedback */}
        {showCommitFlash && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.8 }}
            animate={{ scale: 1.5, opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 rounded-xl bg-emerald-400/40 pointer-events-none"
          />
        )}
      </button>
    );
  }

  // Active Editing Mode
  if (isEditing) {
    if (type === 'select') {
      return (
        <div className="relative inline-flex items-center gap-1 z-20">
          <select
            ref={inputRef}
            value={localVal || ''}
            onChange={(e) => setLocalVal(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            className="text-xs px-2 py-1 rounded-lg bg-white dark:bg-[#1a2420] border-2 border-emerald-500 text-gray-900 dark:text-white font-medium focus:outline-none shadow-md"
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      );
    }

    return (
      <div className="relative inline-flex items-center gap-1 z-20">
        <input
          ref={inputRef}
          type="text"
          value={localVal || ''}
          onChange={(e) => setLocalVal(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          className="text-xs px-2 py-1 rounded-lg bg-white dark:bg-[#1a2420] border-2 border-emerald-500 text-gray-900 dark:text-white font-medium focus:outline-none shadow-md w-full min-w-[120px]"
        />
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCommit();
          }}
          className="p-1 rounded-md bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
        >
          <Check className="w-3 h-3" />
        </button>
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            handleCancel();
          }}
          className="p-1 rounded-md bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-300 transition-colors"
        >
          <X className="w-3 h-3" />
        </button>
      </div>
    );
  }

  // Display Mode (Click to edit)
  return (
    <div
      tabIndex={disabled ? -1 : 0}
      onDoubleClick={handleStartEdit}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          handleStartEdit();
        }
      }}
      className={`group relative inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium text-gray-900 dark:text-gray-100 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 transition-all select-none ${
        disabled ? 'cursor-default' : 'cursor-pointer hover:ring-1 hover:ring-emerald-500/40'
      } ${className}`}
      title={disabled ? undefined : 'Double-click to inline edit (or press Enter)'}
    >
      {isSyncing ? (
        <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />
      ) : (
        <span className="truncate">{value || placeholder}</span>
      )}

      {!disabled && !isSyncing && (
        <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
      )}

      {/* Commit Flash Pulse */}
      {showCommitFlash && (
        <motion.div
          initial={{ scale: 0.9, opacity: 0.8 }}
          animate={{ scale: 1.2, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 rounded-lg bg-emerald-400/30 pointer-events-none"
        />
      )}
    </div>
  );
}
