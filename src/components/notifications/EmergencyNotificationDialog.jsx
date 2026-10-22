import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  X,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  Pin,
  Clock,
} from 'lucide-react';
import { useNotifications } from '../../store/NotificationContext';
import { useLanguage } from '../../store/LanguageContext';
import { AUTHORITY_METADATA } from '../../utils/notificationService';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import ApexLinkPreview from '../preview/ApexLinkPreview';

export default function EmergencyNotificationDialog() {
  const { activeDialogNotification, acknowledgeDialog } = useNotifications();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  if (!activeDialogNotification) return null;

  const notification = activeDialogNotification;
  const severity = notification.severity || 'warning';
  const category = notification.category || 'general';
  const sender = notification.senderAttribution;

  const isCritical = severity === 'critical';
  const isFestive = severity === 'festive';

  // Authority config lookup
  const authorityKey = sender?.authorityType || 'central_committee';
  const authorityMeta = AUTHORITY_METADATA[authorityKey] || AUTHORITY_METADATA.central_committee;

  const authorityLabel =
    authorityKey === 'custom' && sender?.customTitle
      ? sender.customTitle
      : lang === 'ml'
      ? authorityMeta.labelMl
      : authorityMeta.labelEn;

  const handleAcknowledge = () => {
    acknowledgeDialog(notification.id);
  };

  const handleCta = () => {
    acknowledgeDialog(notification.id);
    if (!notification.cta?.target) return;

    soundEngine.playMechanicalClick();
    hapticEngine.lightTap();

    if (notification.cta.actionType === 'url') {
      window.open(notification.cta.target, '_blank', 'noopener,noreferrer');
    } else {
      navigate(notification.cta.target);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 select-none">
        {/* Backdrop Blur Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 bg-black/75 backdrop-blur-xl"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          className={`relative w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden backdrop-blur-2xl z-10 flex flex-col ${
            isCritical
              ? 'bg-[#12080a]/95 border-rose-500/40 shadow-rose-900/30'
              : isFestive
              ? 'bg-[#131008]/95 border-amber-400/40 shadow-amber-900/30'
              : 'bg-white/95 dark:bg-[#09110d]/95 border-emerald-500/30 shadow-emerald-900/20'
          }`}
          role="alertdialog"
          aria-modal="true"
        >
          {/* Top Decorative Ambient Glow Bar */}
          <div
            className={`h-2 w-full ${
              isCritical
                ? 'bg-gradient-to-r from-rose-600 via-red-500 to-rose-600 animate-pulse'
                : isFestive
                ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500'
                : 'bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600'
            }`}
          />

          <div className="p-5 sm:p-6 space-y-4">
            {/* Header: Icon, Tags, and Optional Dismiss X */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`p-3 rounded-2xl flex-shrink-0 ${
                    isCritical
                      ? 'bg-rose-500/20 text-rose-500 animate-pulse border border-rose-500/30'
                      : isFestive
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  }`}
                >
                  {isCritical ? (
                    <AlertCircle className="w-6 h-6" />
                  ) : isFestive ? (
                    <Sparkles className="w-6 h-6" />
                  ) : (
                    <AlertTriangle className="w-6 h-6" />
                  )}
                </div>

                <div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        isCritical
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : isFestive
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {isCritical ? 'URGENT FLASH ALERT' : isFestive ? 'FEAST CELEBRATION' : 'CAMPUS NOTICE'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-gray-300 border border-white/10 uppercase">
                      {category}
                    </span>
                  </div>

                  <span className="text-[11px] text-gray-400 font-medium block mt-1">
                    High Priority • Immediate Attention Required
                  </span>
                </div>
              </div>

              {/* Close Button if allowDismiss is true */}
              {notification.allowDismiss !== false && !notification.requireExplicitAck && (
                <button
                  type="button"
                  onClick={handleAcknowledge}
                  className="p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Title */}
            <h2 className="text-lg sm:text-xl font-black tracking-tight text-gray-900 dark:text-white leading-snug">
              {notification.title}
            </h2>

            {/* Body Markdown Content */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-black/20 dark:bg-black/40 border border-white/5 text-xs sm:text-sm text-gray-700 dark:text-gray-200 leading-relaxed font-medium max-h-60 overflow-y-auto">
              {notification.body}
            </div>

            {/* Sender Identity Governance Card */}
            <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                    {sender?.showSender ? 'Official Dispatch Authority' : 'Verified Notice'}
                  </span>
                  <span className="text-xs font-black text-gray-900 dark:text-white">
                    {sender?.showSender ? authorityLabel : t('officialCampusNotice', 'Official Campus Bulletin')}
                  </span>
                </div>
              </div>

              {/* Optional Signatory Name */}
              {sender?.showSender && sender?.signOffName && (
                <div className="text-right">
                  <span className="text-[10px] text-gray-400 block">Signatory</span>
                  <span className="text-xs font-bold text-emerald-400">{sender.signOffName}</span>
                </div>
              )}
            </div>

            {/* Action Buttons: Explicit Acknowledge & CTA */}
            <div className="pt-2 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
              {/* Primary "I Have Read & Understood" Button */}
              <button
                type="button"
                onClick={handleAcknowledge}
                className="w-full sm:w-auto px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/15 transition-all flex items-center justify-center gap-2 active:scale-95"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>{t('iUnderstandAck', 'I Have Read & Understood')}</span>
              </button>

              {/* Action CTA Button if attached */}
              {notification.cta?.label && notification.cta?.target && (
                <ApexLinkPreview url={notification.cta.target}>
                  <button
                    type="button"
                    onClick={handleCta}
                    className={`w-full sm:w-auto px-6 py-2.5 rounded-2xl font-black text-xs text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all ${
                      isCritical
                        ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-600/30'
                        : isFestive
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-amber-600/30'
                        : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/30'
                    }`}
                  >
                    <span>{notification.cta.label}</span>
                    {notification.cta.actionType === 'url' ? (
                      <ExternalLink className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                </ApexLinkPreview>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
