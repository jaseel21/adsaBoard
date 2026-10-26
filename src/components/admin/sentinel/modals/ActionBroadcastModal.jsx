import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Radio, X, Bell, AlertTriangle, ShieldAlert, Info, Check } from 'lucide-react';
import { soundEngine } from '../../../../utils/soundEffects';
import { hapticEngine } from '../../../../utils/haptics';

export default function ActionBroadcastModal({
  isOpen,
  onClose,
  session = null,
  isFleet = false,
  onConfirm,
  loading = false,
}) {
  const [title, setTitle] = useState('Official Notice from Canteen Committee');
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('warning');
  const [requireAck, setRequireAck] = useState(true);

  if (!isOpen) return null;

  const handleConfirm = () => {
    soundEngine.playNotificationChime();
    hapticEngine.successPulse();
    onConfirm({
      title,
      message,
      severity,
      requireAcknowledgement: requireAck,
    });
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
          className="relative w-full max-w-lg rounded-3xl bg-[#0d1412] text-white border border-amber-500/30 p-6 shadow-2xl overflow-hidden backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  {isFleet ? 'Campus Fleet Broadcast Alert' : 'Targeted User Alert Modal'}
                </h3>
                <p className="text-xs text-gray-400">
                  {isFleet
                    ? 'Transmitting to all active devices connected to ADSA Board'
                    : `Directing to ${session?.identifier}`}
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

          <div className="space-y-4 mb-5">
            {/* Title */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Alert Headline
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Alert headline..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            {/* Severity Picker */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Severity Level
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'info', label: 'Info Notice', color: 'border-teal-500 text-teal-300' },
                  { id: 'warning', label: 'Important', color: 'border-amber-500 text-amber-300' },
                  { id: 'critical', label: 'Critical Urgent', color: 'border-red-500 text-red-300' },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSeverity(s.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                      severity === s.id
                        ? `${s.color} bg-white/10 shadow-sm`
                        : 'border-white/10 text-gray-400 hover:bg-white/5'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Input */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                Detailed Message
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter important alert message or instructions..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            {/* Require Acknowledgement Switch */}
            <label className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 cursor-pointer">
              <input
                type="checkbox"
                checked={requireAck}
                onChange={(e) => setRequireAck(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500/40 bg-black/40 border-white/20"
              />
              <div className="text-xs">
                <span className="font-bold text-white block">Require User Acknowledgment</span>
                <span className="text-gray-400 text-[11px]">
                  User must tap &quot;I Acknowledge&quot; before dismissing the notice.
                </span>
              </div>
            </label>
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
              disabled={loading || !title.trim() || !message.trim()}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-black shadow-lg shadow-amber-500/25 transition-transform transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Transmitting...' : isFleet ? 'Broadcast to Fleet' : 'Transmit Alert'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
