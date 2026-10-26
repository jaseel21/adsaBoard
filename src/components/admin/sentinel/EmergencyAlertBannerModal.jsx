import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  ShieldAlert,
  Info,
  BellRing,
  CheckCircle2,
  Clock,
  User,
  Radio,
} from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

/**
 * Emergency Alert Banner Modal
 * Displayed on client screens when an admin broadcasts a targeted or institutional alert.
 */
export default function EmergencyAlertBannerModal({
  isOpen = false,
  alertData = null,
  onAcknowledge,
}) {
  useEffect(() => {
    if (isOpen) {
      soundEngine.playNotificationChime();
      hapticEngine.successPulse();
    }
  }, [isOpen]);

  if (!isOpen || !alertData) return null;

  const {
    title = 'Administrative Notice',
    message = '',
    severity = 'warning',
    issuedBy = null,
    createdAt = null,
    requireAcknowledgement = true,
  } = alertData;

  const handleAcknowledge = () => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    if (onAcknowledge) onAcknowledge();
  };

  const getSeverityStyle = () => {
    switch (severity) {
      case 'emergency':
      case 'critical':
        return {
          icon: ShieldAlert,
          badgeColor: 'bg-red-500/20 text-red-400 border-red-500/40',
          gradientBorder: 'from-red-500 via-rose-500 to-amber-500',
          buttonColor: 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-500/30',
          accentGlow: 'bg-red-500/15',
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          gradientBorder: 'from-amber-500 via-orange-500 to-yellow-500',
          buttonColor: 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shadow-lg shadow-amber-500/30',
          accentGlow: 'bg-amber-500/15',
        };
      case 'info':
      default:
        return {
          icon: Info,
          badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/40',
          gradientBorder: 'from-teal-500 via-emerald-500 to-cyan-500',
          buttonColor: 'bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white shadow-lg shadow-teal-500/30',
          accentGlow: 'bg-teal-500/15',
        };
    }
  };

  const style = getSeverityStyle();
  const IconComponent = style.icon;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-md"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-desc"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg rounded-3xl bg-[#09120f]/95 text-white border border-white/15 p-6 sm:p-7 shadow-2xl overflow-hidden backdrop-blur-2xl"
        >
          {/* Top Gradient Accent Bar */}
          <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${style.gradientBorder}`} />

          {/* Ambient Glow */}
          <div
            className={`absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full blur-3xl pointer-events-none ${style.accentGlow}`}
          />

          {/* Header Row */}
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 shadow-inner">
              <IconComponent className="w-6 h-6 text-white" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${style.badgeColor}`}
                >
                  <Radio className="w-3 h-3 animate-pulse" />
                  <span>{severity} Priority</span>
                </span>
                <span className="text-[11px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>Just now</span>
                </span>
              </div>

              <h3 id="alert-dialog-title" className="text-lg sm:text-xl font-black text-white leading-tight">
                {title}
              </h3>
            </div>
          </div>

          {/* Message Body */}
          <div
            id="alert-dialog-desc"
            className="my-5 p-4 rounded-2xl bg-white/5 border border-white/10 text-sm sm:text-base text-gray-200 leading-relaxed font-medium break-words whitespace-pre-wrap"
          >
            {message}
          </div>

          {/* Footer Metadata */}
          {issuedBy && (
            <div className="mb-6 flex items-center justify-between text-xs text-gray-400 border-t border-white/10 pt-3">
              <div className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>
                  Dispatched by: <strong className="text-gray-200">{issuedBy.displayName || 'ADSA Committee'}</strong>
                </span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
                Official
              </span>
            </div>
          )}

          {/* Action Button */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={handleAcknowledge}
              className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-extrabold text-sm flex items-center justify-center gap-2 transition-transform transform active:scale-95 ${style.buttonColor}`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>I Acknowledge & Understand</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
