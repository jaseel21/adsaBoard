import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Phone, Mail, Lock, ShieldCheck, AlertCircle, Sparkles, Check } from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';
import {
  addStudentContact,
  validatePhoneFormat,
  validateEmailFormat,
  formatPhoneDisplay,
} from '../../utils/studentProfileRequestService';

export default function AddContactModal({
  isOpen,
  onClose,
  type = 'phone', // 'phone' | 'email'
  student,
  onSuccess,
}) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  const isPhone = type === 'phone';
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const clean = inputValue.trim();
    if (!clean) {
      setErrorMsg(
        isPhone
          ? language === 'ml'
            ? 'മൊബൈൽ നമ്പർ നൽകുക'
            : 'Please enter your mobile phone number'
          : language === 'ml'
          ? 'ഇമെയിൽ വിലാസം നൽകുക'
          : 'Please enter your email address'
      );
      feedback('warning');
      return;
    }

    if (isPhone) {
      const v = validatePhoneFormat(clean);
      if (!v.isValid) {
        setErrorMsg(v.error);
        feedback('warning');
        return;
      }
    } else {
      const v = validateEmailFormat(clean);
      if (!v.isValid) {
        setErrorMsg(v.error);
        feedback('warning');
        return;
      }
    }

    setIsSubmitting(true);
    feedback('tick');

    try {
      const studentId = student.documentId || student.id;
      const res = await addStudentContact({
        studentId,
        tokenNo: student.tokenNo,
        studentName: student.nameEn || student.name,
        type,
        value: clean,
      });

      feedback('success');
      dialog.toast.success(
        isPhone
          ? language === 'ml'
            ? 'ഫോൺ നമ്പർ ചേർത്തു'
            : 'Phone Number Linked'
          : language === 'ml'
          ? 'ഇമെയിൽ ചേർത്തു'
          : 'Email Address Linked',
        language === 'ml'
          ? 'ഇനി മുതൽ ഈ വിവരങ്ങൾ ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യാവുന്നതാണ്.'
          : 'You can now sign in to your dining portal using this credential.'
      );

      if (onSuccess) {
        onSuccess(type, res.value);
      }
      onClose();
    } catch (err) {
      console.error(`Error adding ${type}:`, err);
      feedback('warning');
      setErrorMsg(err.message || 'Failed to save contact. Please try again.');
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
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                {isPhone ? <Phone className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
              </div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                {isPhone
                  ? language === 'ml'
                    ? 'ഫോൺ നമ്പർ ചേർക്കുക'
                    : 'Link Mobile Phone'
                  : language === 'ml'
                  ? 'ഇമെയിൽ വിലാസം ചേർക്കുക'
                  : 'Link Email Address'}
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {/* Informational Guidance Box */}
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  {language === 'ml' ? 'ശ്രദ്ധിക്കുക: ഒരിക്കൽ ചേർത്താൽ മാറ്റാൻ അനുവാദമില്ല' : 'Immutable Identifier'}
                </span>
                <span className="text-[11px] leading-relaxed opacity-90 block mt-0.5">
                  {language === 'ml'
                    ? 'ഒരിക്കൽ ചേർത്ത ഫോൺ/ഇമെയിൽ നീക്കം ചെയ്യാനാകില്ല. ലോഗിൻ ചെയ്യാനും അറിയിപ്പുകൾക്കും ഇത് ഉപയോഗിക്കുന്നതിനാൽ ശരിയായ വിവരങ്ങൾ നൽകുക.'
                    : 'Once linked, this credential cannot be deleted. It will be used for portal sign-in and official canteen communications.'}
                </span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Input field */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                {isPhone
                  ? language === 'ml'
                    ? '10-അക്ക മൊബൈൽ നമ്പർ'
                    : '10-Digit Mobile Number'
                  : language === 'ml'
                  ? 'ഇമെയിൽ വിലാസം'
                  : 'Email Address'}
              </label>

              {isPhone ? (
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 font-mono font-bold text-xs text-gray-500 select-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value.replace(/\D/g, '').slice(0, 10));
                      setErrorMsg('');
                    }}
                    placeholder="98471 23456"
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-mono text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    autoFocus
                    required
                  />
                </div>
              ) : (
                <input
                  type="email"
                  value={inputValue}
                  onChange={(e) => {
                    setInputValue(e.target.value);
                    setErrorMsg('');
                  }}
                  placeholder="student@dars.edu"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  autoFocus
                  required
                />
              )}
            </div>

            {/* Actions */}
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
                  <span>{language === 'ml' ? 'സേവ് ചെയ്യുന്നു...' : 'Saving...'}</span>
                ) : (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>{language === 'ml' ? 'സ്ഥിരീകരിക്കുക' : 'Save & Link'}</span>
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
