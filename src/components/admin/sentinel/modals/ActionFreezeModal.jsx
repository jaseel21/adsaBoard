import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Unlock, X, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../../../../utils/soundEffects';
import { hapticEngine } from '../../../../utils/haptics';

export default function ActionFreezeModal({
  isOpen,
  onClose,
  session,
  isCurrentlyFrozen = false,
  onConfirm,
  loading = false,
}) {
  const [reason, setReason] = useState(
    isCurrentlyFrozen
      ? 'Administrative verification completed'
      : 'Dining portal temporarily locked for audit review'
  );

  if (!isOpen || !session) return null;

  const handleConfirm = () => {
    if (isCurrentlyFrozen) {
      soundEngine.playSoftChime();
      hapticEngine.successPulse();
    } else {
      soundEngine.playCautionThud();
      hapticEngine.warningVibe();
    }
    onConfirm(reason);
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md rounded-3xl bg-[#0d1412] text-white border border-cyan-500/30 p-6 shadow-2xl overflow-hidden backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${
                  isCurrentlyFrozen
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                }`}
              >
                {isCurrentlyFrozen ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {isCurrentlyFrozen ? 'Restore Portal Access (Unfreeze)' : 'Freeze Dining Portal (Lock)'}
                </h3>
                <p className="text-xs text-gray-400">
                  Target: <strong className="text-gray-200">{session.identifier}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-gray-300 leading-relaxed mb-4">
            {isCurrentlyFrozen
              ? 'Unfreezing will restore immediate full editing and meal cancellation permissions for this student.'
              : 'Freezing will instantly restrict the student dining portal to Read-Only mode. Meal toggle switches will be locked, displaying the specified administrative reason.'}
          </p>

          {/* Reason Input */}
          <div className="space-y-1.5 mb-5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Administrative Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={loading || !reason.trim()}
              className={`px-5 py-2.5 rounded-xl text-xs font-black shadow-lg transition-transform transform active:scale-95 disabled:opacity-50 ${
                isCurrentlyFrozen
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-emerald-500/25'
                  : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-cyan-500/25'
              }`}
            >
              {loading ? 'Processing...' : isCurrentlyFrozen ? 'Restore Portal' : 'Freeze Portal Now'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
