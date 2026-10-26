import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { soundEngine } from '../../../../utils/soundEffects';
import { hapticEngine } from '../../../../utils/haptics';

export default function ActionKillSessionModal({
  isOpen,
  onClose,
  session,
  onConfirm,
  loading = false,
}) {
  const [reason, setReason] = useState('Administrative compliance logout');

  if (!isOpen || !session) return null;

  const handleConfirm = () => {
    soundEngine.playCautionThud();
    hapticEngine.errorBuzz();
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
          className="relative w-full max-w-md rounded-3xl bg-[#0d1412] text-white border border-red-500/30 p-6 shadow-2xl overflow-hidden backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-red-500/20 border border-red-500/40 text-red-400 flex items-center justify-center shrink-0">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Terminate User Session
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
            Terminating this session will immediately revoke authentication on the client device, clear local dining credentials, log an official security audit event, and redirect the user to sign-in.
          </p>

          {/* Reason Input */}
          <div className="space-y-1.5 mb-5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Administrative Reason (Logged in Audit Trail)
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Unattended shared kiosk, suspicious token usage..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500/40"
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
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white text-xs font-black shadow-lg shadow-red-500/25 transition-transform transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Terminating...' : 'Confirm Force Logout'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
