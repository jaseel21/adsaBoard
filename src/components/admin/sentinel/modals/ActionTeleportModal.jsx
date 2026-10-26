import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, X, ArrowRight, Utensils, BookOpen, HeartHandshake, Sliders, Shield } from 'lucide-react';
import { soundEngine } from '../../../../utils/soundEffects';
import { hapticEngine } from '../../../../utils/haptics';

export default function ActionTeleportModal({
  isOpen,
  onClose,
  session,
  onConfirm,
  loading = false,
}) {
  const [selectedRoute, setSelectedRoute] = useState('/adab');
  const [reason, setReason] = useState('Guiding user to relevant institutional documentation');

  if (!isOpen || !session) return null;

  const presets = [
    { route: '/adab', label: 'Sacred Dining Ethics (/adab)', icon: BookOpen },
    { route: '/avoiders', label: 'Dietary Avoiders Matrix (/avoiders)', icon: Utensils },
    { route: '/menu', label: 'Canteen Food Menu (/menu)', icon: Utensils },
    { route: '/supply', label: 'Supply Manifest (/supply)', icon: Sliders },
    { route: '/support', label: 'Care & Inquiries Hub (/support)', icon: HeartHandshake },
    { route: '/student', label: 'Student Dining Portal (/student)', icon: Shield },
  ];

  const handleConfirm = () => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    onConfirm(selectedRoute, reason);
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
          className="relative w-full max-w-lg rounded-3xl bg-[#0d1412] text-white border border-teal-500/30 p-6 shadow-2xl overflow-hidden backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-400 flex items-center justify-center shrink-0">
                <Compass className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-white">
                  Remote Route Teleport
                </h3>
                <p className="text-xs text-gray-400">
                  Target: <strong className="text-gray-200">{session.identifier}</strong> (Currently on {session.route})
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
            Select an institutional destination. The user client will be smoothly navigated immediately without requiring a page reload.
          </p>

          {/* Presets List */}
          <div className="space-y-1.5 mb-4 max-h-48 overflow-y-auto pr-1">
            {presets.map((p) => {
              const Icon = p.icon;
              const isChosen = selectedRoute === p.route;
              return (
                <button
                  key={p.route}
                  type="button"
                  onClick={() => {
                    soundEngine.playPop();
                    setSelectedRoute(p.route);
                  }}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all border ${
                    isChosen
                      ? 'bg-teal-500/20 border-teal-500 text-teal-300 shadow-sm'
                      : 'bg-white/5 border-white/10 hover:border-teal-500/30 text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-gray-400" />
                    <span>{p.label}</span>
                  </div>
                  {isChosen && <ArrowRight className="w-3.5 h-3.5 text-teal-400" />}
                </button>
              );
            })}
          </div>

          {/* Reason Input */}
          <div className="space-y-1.5 mb-5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              Reason / Administrative Context
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 border border-white/10 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500/40"
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
              disabled={loading || !selectedRoute}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white text-xs font-black shadow-lg shadow-teal-500/25 transition-transform transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Teleporting...' : 'Dispatch Teleport'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
