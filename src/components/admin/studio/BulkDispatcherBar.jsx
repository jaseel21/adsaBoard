import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckSquare,
  Utensils,
  Coffee,
  Layers,
  Ban,
  ShieldCheck,
  Download,
  RotateCcw,
  RotateCw,
  X,
  Sparkles,
  ChevronUp,
} from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

export default function BulkDispatcherBar({
  selectedCount = 0,
  onClearSelection,
  onBulkToggleMeal,
  onBulkChangeBatch,
  onBulkChangeStatus,
  onBulkExportCsv,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  lastOperation = null,
  allBatches = [],
}) {
  const [showBatchMenu, setShowBatchMenu] = useState(false);

  if (selectedCount === 0 && !canUndo) {
    return null;
  }

  return (
    <div className="fixed bottom-6 inset-x-0 z-40 flex items-center justify-center px-4 pointer-events-none">
      <motion.div
        initial={{ y: 50, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 50, opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', damping: 25, stiffness: 400 }}
        className="pointer-events-auto max-w-4xl w-full flex flex-wrap items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl sm:rounded-full bg-gray-900/95 dark:bg-[#0d1613]/95 text-white border border-gray-700/80 dark:border-emerald-500/30 shadow-2xl backdrop-blur-2xl ring-1 ring-black/20"
      >
        {/* Left: Selected Counter & Clear */}
        <div className="flex items-center gap-2">
          {selectedCount > 0 && (
            <>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-black">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span>{selectedCount} Selected</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  hapticEngine.lightTap();
                  if (onClearSelection) onClearSelection();
                }}
                className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                title="Clear selection"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          {/* Undo / Redo Controls */}
          {canUndo && (
            <div className="flex items-center gap-1 pl-2 border-l border-gray-700 dark:border-white/10">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playMechanicalClick();
                  if (onUndo) onUndo();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-extrabold transition-all active:scale-95"
                title={lastOperation?.description ? `Undo: ${lastOperation.description} (⌘Z)` : 'Undo recent action (⌘Z)'}
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>Undo</span>
                <kbd className="hidden sm:inline px-1 py-0.2 rounded bg-black/30 text-[9px] font-mono">⌘Z</kbd>
              </button>

              {canRedo && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playMechanicalClick();
                    if (onRedo) onRedo();
                  }}
                  className="p-1.5 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Redo action (⌘⇧Z)"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right: Bulk Action Triggers */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Bulk Toggle Lunch */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                if (onBulkToggleMeal) onBulkToggleMeal('lunch');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-sm transition-all active:scale-95"
            >
              <Utensils className="w-3 h-3" />
              <span>Toggle Lunch</span>
            </button>

            {/* Bulk Toggle Breakfast */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                if (onBulkToggleMeal) onBulkToggleMeal('breakfast');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-extrabold shadow-sm transition-all active:scale-95"
            >
              <Coffee className="w-3 h-3" />
              <span>Toggle Breakfast</span>
            </button>

            {/* Bulk Change Batch Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowBatchMenu(!showBatchMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-bold transition-all"
              >
                <Layers className="w-3 h-3 text-cyan-400" />
                <span>Move Batch</span>
                <ChevronUp className={`w-3 h-3 transition-transform ${showBatchMenu ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {showBatchMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute bottom-full mb-2 right-0 w-44 rounded-2xl bg-gray-900 border border-white/10 shadow-2xl p-1.5 space-y-1 z-50 text-xs"
                  >
                    {allBatches.map((b) => (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          setShowBatchMenu(false);
                          if (onBulkChangeBatch) onBulkChangeBatch(b);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        {b}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bulk Block / Unblock Toggle */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                if (onBulkChangeStatus) onBulkChangeStatus();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all active:scale-95"
            >
              <Ban className="w-3 h-3" />
              <span>Block / Unblock</span>
            </button>

            {/* Export Selected to CSV */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                if (onBulkExportCsv) onBulkExportCsv();
              }}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Export selected to CSV"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
