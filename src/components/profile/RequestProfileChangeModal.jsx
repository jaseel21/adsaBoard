import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  Mail,
  User,
  Clock,
  ShieldCheck,
  AlertCircle,
  Send,
  Lock,
  ArrowRight,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';
import {
  submitProfileChangeRequest,
  REASON_OPTIONS,
  validatePhoneFormat,
  validateEmailFormat,
  validateNameFormat,
  formatPhoneDisplay,
} from '../../utils/studentProfileRequestService';

export default function RequestProfileChangeModal({
  isOpen,
  onClose,
  type = 'phone', // 'phone' | 'email' | 'name'
  student,
  onSuccess,
}) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  const isPhone = type === 'phone';
  const isEmail = type === 'email';
  const isName = type === 'name';

  // Current values
  const currentPhone = student?.phone || '';
  const currentEmail = student?.email || '';
  const currentNameEn = student?.nameEn || student?.name || '';
  const currentNameMl = student?.nameMl || '';

  // Form states
  const [newPhone, setNewPhone] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newNameEn, setNewNameEn] = useState(() => currentNameEn);
  const [newNameMl, setNewNameMl] = useState(() => currentNameMl);

  const reasons = REASON_OPTIONS[type] || [];
  const [selectedReason, setSelectedReason] = useState(() => reasons[0]?.id || 'other');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    let requestedPayload = null;

    if (isPhone) {
      const v = validatePhoneFormat(newPhone);
      if (!v.isValid) {
        setErrorMsg(v.error);
        feedback('warning');
        return;
      }
      if (formatPhoneDisplay(v.normalized) === formatPhoneDisplay(currentPhone)) {
        setErrorMsg('New phone number must be different from current phone.');
        feedback('warning');
        return;
      }
      requestedPayload = v.normalized;
    } else if (isEmail) {
      const v = validateEmailFormat(newEmail);
      if (!v.isValid) {
        setErrorMsg(v.error);
        feedback('warning');
        return;
      }
      if (v.normalized === (currentEmail || '').trim().toLowerCase()) {
        setErrorMsg('New email must be different from current email.');
        feedback('warning');
        return;
      }
      requestedPayload = v.normalized;
    } else if (isName) {
      const v = validateNameFormat(newNameEn, newNameMl);
      if (!v.isValid) {
        setErrorMsg(v.error);
        feedback('warning');
        return;
      }
      if (v.nameEn === currentNameEn && v.nameMl === currentNameMl) {
        setErrorMsg('Requested name must be different from current name.');
        feedback('warning');
        return;
      }
      requestedPayload = { nameEn: v.nameEn, nameMl: v.nameMl };
    }

    setIsSubmitting(true);
    feedback('tick');

    try {
      const res = await submitProfileChangeRequest({
        student,
        type,
        requestedValue: requestedPayload,
        reason: selectedReason,
        notes,
      });

      feedback('success');
      dialog.toast.success(
        language === 'ml' ? 'അപേക്ഷ സമർപ്പിച്ചു' : 'Change Request Submitted',
        language === 'ml'
          ? 'സെൻട്രൽ കമ്മിറ്റി പരിശോധിച്ച ശേഷം മാറ്റം വരുത്തുന്നതാണ്.'
          : 'Your request has been queued for Central Committee review and approval.'
      );

      if (onSuccess) {
        onSuccess(type, requestedPayload, res.requestId);
      }
      onClose();
    } catch (err) {
      console.error('Error submitting change request:', err);
      feedback('warning');
      setErrorMsg(err.message || 'Could not submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain"
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/70 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-[#0c1412] rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                {isPhone ? (
                  <Phone className="w-4 h-4" />
                ) : isEmail ? (
                  <Mail className="w-4 h-4" />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                {isPhone
                  ? language === 'ml'
                    ? 'ഫോൺ മാറ്റാൻ അപേക്ഷിക്കുക'
                    : 'Request Phone Number Change'
                  : isEmail
                  ? language === 'ml'
                    ? 'ഇമെയിൽ മാറ്റാൻ അപേക്ഷിക്കുക'
                    : 'Request Email Address Change'
                  : language === 'ml'
                  ? 'പേര് മാറ്റാൻ അപേക്ഷിക്കുക'
                  : 'Request Student Name Change'}
              </h3>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {/* Informational Guidance Notice */}
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-300">
              <Clock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold block">
                  {language === 'ml' ? 'കമ്മിറ്റി പരിശോധന ആവശ്യമാണ്' : 'Subject to Committee Verification'}
                </span>
                <span className="text-[11px] opacity-90 block mt-0.5">
                  {language === 'ml'
                    ? 'വിദ്യാർത്ഥി വിവരങ്ങൾ സുരക്ഷിതമായി സൂക്ഷിക്കുന്നതിനായി സെൻട്രൽ കമ്മിറ്റിയുടെ അംഗീകാരത്തിന് ശേഷമേ മാറ്റം നിലവിൽ വരൂ.'
                    : 'To protect account integrity, your proposed change will be reviewed and verified by Central Committee staff before taking effect.'}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Current Value Display */}
            <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
                {language === 'ml' ? 'നിലവിലെ വിവരം' : 'Current Registered Value'}
              </span>
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
                <Lock className="w-3.5 h-3.5 text-gray-400" />
                <span>
                  {isPhone
                    ? currentPhone || 'None'
                    : isEmail
                    ? currentEmail || 'None'
                    : `${currentNameEn} ${currentNameMl ? `(${currentNameMl})` : ''}`}
                </span>
              </div>
            </div>

            {/* Proposed New Value Inputs */}
            {isPhone && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  {language === 'ml' ? 'പുതിയ മൊബൈൽ നമ്പർ' : 'New Mobile Number'}
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-mono font-bold text-xs text-gray-500 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={newPhone}
                    onChange={(e) => {
                      setNewPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setErrorMsg('');
                    }}
                    placeholder="98471 23456"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                    required
                  />
                </div>
              </div>
            )}

            {isEmail && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  {language === 'ml' ? 'പുതിയ ഇമെയിൽ വിലാസം' : 'New Email Address'}
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="new.email@dars.edu"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                  required
                />
              </div>
            )}

            {isName && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    {language === 'ml' ? 'പുതിയ ഇംഗ്ലീഷ് പേര്' : 'New Name (English)'}
                  </label>
                  <input
                    type="text"
                    value={newNameEn}
                    onChange={(e) => {
                      setNewNameEn(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="e.g. Muhammed Rashad"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    {language === 'ml' ? 'മലയാളം പേര് (ഓപ്ഷണൽ)' : 'Malayalam Name (Optional)'}
                  </label>
                  <input
                    type="text"
                    value={newNameMl}
                    onChange={(e) => {
                      setNewNameMl(e.target.value);
                      setErrorMsg('');
                    }}
                    placeholder="ഉദാ: മുഹമ്മദ് റഷാദ്"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-semibold font-malayalam focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            )}

            {/* Reason Selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                {language === 'ml' ? 'മാറ്റാനുള്ള കാരണം' : 'Reason for Change'}
              </label>
              <select
                value={selectedReason}
                onChange={(e) => setSelectedReason(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-[#13201d] border border-gray-200 dark:border-white/10 text-gray-800 dark:text-gray-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {reasons.map((r) => (
                  <option key={r.id} value={r.id}>
                    {language === 'ml' ? r.labelMl : r.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Remarks / Notes */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                {language === 'ml' ? 'കൂടുതൽ വിവരങ്ങൾ (ഓപ്ഷണൽ)' : 'Additional Notes (Optional)'}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  language === 'ml'
                    ? 'കമ്മിറ്റിക്ക് സഹായകമായ വിവരങ്ങൾ രേഖപ്പെടുത്തുക...'
                    : 'Provide context for the Central Committee coordinators...'
                }
                className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                {language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel'}
              </button>

              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span>{language === 'ml' ? 'സമർപ്പിക്കുന്നു...' : 'Submitting...'}</span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>{language === 'ml' ? 'അപേക്ഷിക്കുക' : 'Submit Request'}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
