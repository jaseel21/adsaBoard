import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  ShieldAlert,
  X,
  Receipt,
  CalendarCheck,
  AlertCircle,
  Utensils,
  HelpCircle,
  UploadCloud,
  Send,
  CheckCircle2,
  Copy,
  Check,
  Phone,
  FileText,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import {
  UNBLOCK_REASONS,
  submitUnblockRequest,
} from '../../utils/unblockRequestService';
import { useNavigate } from 'react-router-dom';

const REASON_ICONS = {
  fee_cleared: Receipt,
  leave_rectified: CalendarCheck,
  mistake_dispute: AlertCircle,
  emergency_meal: Utensils,
  other: HelpCircle,
};

export default function UnblockRequestModal({
  isOpen,
  onClose,
  student,
  onSuccess,
}) {
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [reasonCategory, setReasonCategory] = useState('fee_cleared');
  const [reasonNote, setReasonNote] = useState('');
  const [phone, setPhone] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedResult, setSubmittedResult] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Initialize/reset form state when modal opens
  useEffect(() => {
    if (isOpen && student) {
      setReasonCategory('fee_cleared');
      setReasonNote('');
      setPhone(student.phone || '');
      setAttachment(null);
      setErrorMsg('');
      setSubmittedResult(null);
      setCopiedCode(false);
    }
  }, [isOpen, student]);

  if (!isOpen || !student) return null;

  const tokenNo = student.tokenNo;
  const studentName = student.name || `Student #${tokenNo}`;
  const blockReason = student.blockReason || '';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      soundEngine.playCautionThud();
      hapticEngine.heavyThud();
      setErrorMsg(t('fileTooLarge', 'File size cannot exceed 5MB.'));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      soundEngine.playPop();
      hapticEngine.lightTap();
      setAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        url: reader.result,
      });
      setErrorMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveAttachment = () => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setAttachment(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!reasonNote.trim() && reasonCategory === 'other') {
      soundEngine.playCautionThud();
      hapticEngine.mediumTick();
      setErrorMsg(t('provideNoteRequired', 'Please provide a brief note explaining your appeal.'));
      return;
    }

    try {
      setSubmitting(true);
      soundEngine.playMechanicalClick();
      hapticEngine.mediumTick();

      const res = await submitUnblockRequest({
        student,
        reasonCategory,
        reasonNote,
        phone,
        attachment,
      });

      soundEngine.playSoftChime();
      hapticEngine.successPulse();
      setSubmittedResult(res);

      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      console.error('Failed to submit unblock request:', err);
      soundEngine.playCautionThud();
      hapticEngine.heavyThud();
      setErrorMsg(err.message || t('unblockSubmitFailed', 'Failed to submit unblock request. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCode = () => {
    if (!submittedResult?.ticketNumber) return;
    soundEngine.playPop();
    hapticEngine.lightTap();
    navigator.clipboard.writeText(submittedResult.ticketNumber);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const handleTrackRequest = () => {
    if (!submittedResult?.ticketNumber) return;
    soundEngine.playMechanicalClick();
    onClose();
    navigate(`/support?tab=tracker&code=${submittedResult.ticketNumber}`);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto">
        {/* Backdrop click */}
        <div
          className="fixed inset-0"
          onClick={() => {
            if (!submitting) {
              soundEngine.playPop();
              onClose();
            }
          }}
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden z-10 my-auto"
        >
          {/* Header Bar */}
          <div className="p-4 sm:p-5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-700 text-white flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center flex-shrink-0 shadow-inner">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-black tracking-tight truncate">
                    {t('unblockModalTitle', 'Emergency Dining Unblock Appeal')}
                  </h2>
                </div>
                <p className="text-xs text-rose-100 font-medium truncate">
                  Token #{tokenNo} • {studentName}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                onClose();
              }}
              disabled={submitting}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer flex-shrink-0 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-4 sm:p-6 space-y-4 max-h-[calc(90dvh-120px)] overflow-y-auto">
            {submittedResult ? (
              /* Success / Ticket Confirmation View */
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-4 space-y-5"
              >
                <div className="w-16 h-16 mx-auto rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1.5">
                  <h3 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white">
                    {t('unblockSuccessNotice', 'Unblock request submitted. Central Committee has been notified.')}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                    {t(
                      'unblockSuccessDesc',
                      'Your appeal has been prioritized for immediate verification. You can track committee updates using this reference code.'
                    )}
                  </p>
                </div>

                {/* Ticket Reference Code Card */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-emerald-500/30 flex items-center justify-between gap-3 max-w-sm mx-auto">
                  <div className="text-left">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                      Tracking Reference
                    </span>
                    <span className="font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                      {submittedResult.ticketNumber}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    {copiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-emerald-600 font-extrabold">{t('copied', 'Copied')}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>{t('copy', 'Copy')}</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Next Steps Buttons */}
                <div className="pt-3 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="button"
                    onClick={handleTrackRequest}
                    className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Clock className="w-4 h-4" />
                    <span>{t('trackUnblockRequest', 'Track Status in Care Hub')}</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playPop();
                      onClose();
                    }}
                    className="py-3 px-5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer"
                  >
                    {t('close', 'Close')}
                  </button>
                </div>
              </motion.div>
            ) : (
              /* Request Input Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Current Lock Reason Context Alert */}
                <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-xs">
                  <div className="flex items-center gap-2 text-red-900 dark:text-red-200 font-bold">
                    <Lock className="w-3.5 h-3.5 text-red-500" />
                    <span>{t('currentLockReason', 'Reason recorded by Canteen Administration')}:</span>
                  </div>
                  <p className="mt-1 text-red-800 dark:text-red-300 italic font-medium">
                    &ldquo;{blockReason || t('adminSuspendedGeneral', 'Administrative suspension / fee review')}&rdquo;
                  </p>
                </div>

                {/* Error Banner if any */}
                {errorMsg && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 font-semibold"
                  >
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </motion.div>
                )}

                {/* Reason Category Selection Grid */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                    {t('unblockReasonPrompt', 'Select Reason for Unblocking')}
                  </label>
                  <div className="grid grid-cols-1 xs:grid-cols-2 gap-2">
                    {Object.values(UNBLOCK_REASONS).map((reason) => {
                      const Icon = REASON_ICONS[reason.id] || HelpCircle;
                      const isSelected = reasonCategory === reason.id;
                      const label = language === 'ml' ? reason.labelMl : reason.labelEn;
                      const desc = language === 'ml' ? reason.descriptionMl : reason.descriptionEn;

                      return (
                        <button
                          key={reason.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playPop();
                            hapticEngine.lightTap();
                            setReasonCategory(reason.id);
                          }}
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-950 dark:text-emerald-200 shadow-xs'
                              : 'bg-gray-50/70 dark:bg-white/5 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 ${
                                isSelected
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-xs font-black truncate">{label}</span>
                          </div>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-1">
                            {desc}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Explanation Notes Textarea */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('unblockNotesLabel', 'Explanation / Details')}
                  </label>
                  <textarea
                    rows={3}
                    value={reasonNote}
                    onChange={(e) => setReasonNote(e.target.value)}
                    placeholder={t(
                      'unblockNotesPlaceholder',
                      'Provide details (e.g. GPay / UPI Transaction ID, date paid, reason for return)...'
                    )}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all resize-none"
                  />
                </div>

                {/* Contact Phone & WhatsApp */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('unblockPhoneLabel', 'Contact Phone / WhatsApp')}</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all font-mono"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">
                    {t('phoneFollowUpHint', 'The canteen secretary may contact or WhatsApp you to verify clearance.')}
                  </span>
                </div>

                {/* Payment Receipt / Evidence Attachment */}
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    {t('attachReceiptProof', 'Attach Payment Slip / Proof (Optional, Max 5MB)')}
                  </label>

                  {attachment ? (
                    <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {attachment.type?.startsWith('image/') ? (
                          <img
                            src={attachment.url}
                            alt="Receipt Preview"
                            className="w-10 h-10 rounded-xl object-cover border border-emerald-500/30 flex-shrink-0"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-gray-900 dark:text-white truncate block">
                            {attachment.name}
                          </span>
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold block">
                            {(attachment.size / 1024).toFixed(1)} KB • Attached
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={handleRemoveAttachment}
                        className="p-1.5 rounded-xl bg-white dark:bg-white/10 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/40 text-gray-500 transition-colors cursor-pointer"
                        title="Remove file"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <label className="border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-emerald-500/50 rounded-2xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer bg-gray-50/50 dark:bg-white/[0.02] hover:bg-emerald-50/20 transition-all text-center">
                      <UploadCloud className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                        {t('uploadReceiptTitle', 'Click or drag receipt screenshot')}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        JPG, PNG, WebP or PDF (Max 5MB)
                      </span>
                      <input
                        type="file"
                        accept="image/*,application/pdf"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                  >
                    <Send className="w-4 h-4" />
                    <span>
                      {submitting
                        ? t('submittingUnblock', 'Submitting Appeal...')
                        : t('submitUnblockBtn', 'Submit Unblock Appeal')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playPop();
                      onClose();
                    }}
                    disabled={submitting}
                    className="py-3 px-5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 font-bold text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {t('cancel', 'Cancel')}
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
