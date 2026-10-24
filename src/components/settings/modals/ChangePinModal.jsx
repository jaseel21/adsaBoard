import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, KeyRound, Eye, EyeOff, ShieldCheck, Check, AlertCircle } from 'lucide-react';
import firebase from '../../../firebase/config';
import { dialog } from '../../../utils/dialog';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../../../utils/auditLogger';

export default function ChangePinModal({ isOpen, onClose, studentData, onPinUpdated }) {
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();

  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Simple PIN strength evaluator
  const getPinStrength = (pin) => {
    if (!pin) return { label: 'Empty', score: 0, color: 'gray' };
    if (pin.length < 4) return { label: 'Too Short (Min 4)', score: 1, color: 'rose' };
    if (/^\d{4,6}$/.test(pin)) return { label: 'Good Numeric PIN', score: 2, color: 'emerald' };
    return { label: 'Strong Passcode', score: 3, color: 'teal' };
  };

  const strength = getPinStrength(newPin);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentPin) {
      setErrorMsg(language === 'ml' ? 'നിലവിലെ പാസ്‌വേഡ് നൽകുക' : 'Please enter your current PIN/password');
      return;
    }

    if (currentPin !== studentData?.password) {
      feedback('warning');
      setErrorMsg(language === 'ml' ? 'നിലവിലെ പാസ്‌വേഡ് തെറ്റാണ്' : 'Incorrect current PIN/password');
      return;
    }

    if (newPin.length < 4) {
      feedback('warning');
      setErrorMsg(language === 'ml' ? 'പുതിയ പാസ്‌വേഡിൽ കുറഞ്ഞത് 4 അക്കങ്ങൾ വേണം' : 'New PIN must be at least 4 characters');
      return;
    }

    if (newPin !== confirmPin) {
      feedback('warning');
      setErrorMsg(language === 'ml' ? 'പാസ്‌വേഡുകൾ പരസ്പരം പൊരുത്തപ്പെടുന്നില്ല' : 'New PINs do not match');
      return;
    }

    setIsSubmitting(true);
    feedback('tick');

    try {
      const docId = studentData.documentId || studentData.id;
      await firebase.firestore().collection('students').doc(docId).update({
        password: newPin,
        pinUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // Audit log
      try {
        await logAuditEvent({
          action: 'STUDENT_CHANGE_PIN',
          category: AUDIT_CATEGORIES.SECURITY,
          severity: AUDIT_SEVERITIES.INFO,
          actor: {
            uid: `student_${studentData.tokenNo}`,
            displayName: studentData.name || `Student #${studentData.tokenNo}`,
            role: 'student',
          },
          target: {
            type: 'student',
            id: docId,
            label: `Token #${studentData.tokenNo}`,
          },
        });
      } catch (logErr) {
        console.warn('Audit log error on PIN change:', logErr);
      }

      feedback('success');
      dialog.toast.success(
        language === 'ml' ? 'പാസ്‌വേഡ് മാറ്റി' : 'PIN Updated',
        language === 'ml' ? 'നിങ്ങളുടെ പുതിയ പാസ്‌വേഡ് വിജയകരമായി സേവ് ചെയ്തു.' : 'Your dining portal passcode has been securely updated.'
      );

      if (onPinUpdated) {
        onPinUpdated(newPin);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update student PIN:', err);
      feedback('warning');
      setErrorMsg(language === 'ml' ? 'പാസ്‌വേഡ് മാറ്റാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക.' : 'Failed to update PIN. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                {language === 'ml' ? 'ടോക്കൺ പാസ്‌വേഡ് മാറ്റുക' : 'Change Dining Portal PIN'}
              </h3>
              <span className="text-[11px] text-gray-400 font-medium">
                {language === 'ml' ? `ടോക്കൺ #${studentData?.tokenNo}` : `Token #${studentData?.tokenNo} • Passcode Security`}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Current PIN */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              {language === 'ml' ? 'നിലവിലെ പാസ്‌വേഡ്' : 'Current PIN / Password'}
            </label>
            <div className="relative">
              <input
                type={showPin ? 'text' : 'password'}
                value={currentPin}
                onChange={(e) => setCurrentPin(e.target.value)}
                placeholder="••••"
                required
                className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New PIN */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              {language === 'ml' ? 'പുതിയ പാസ്‌വേഡ്' : 'New PIN / Password'}
            </label>
            <input
              type={showPin ? 'text' : 'password'}
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="••••"
              required
              className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
            {newPin && (
              <div className="mt-1 flex items-center justify-between text-[10px] font-bold">
                <span className="text-gray-400">Strength:</span>
                <span className={`text-${strength.color}-500`}>{strength.label}</span>
              </div>
            )}
          </div>

          {/* Confirm New PIN */}
          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              {language === 'ml' ? 'പുതിയ പാസ്‌വേഡ് വീണ്ടും നൽകുക' : 'Confirm New PIN'}
            </label>
            <input
              type={showPin ? 'text' : 'password'}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="••••"
              required
              className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
            >
              {language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>{language === 'ml' ? 'സൂക്ഷിക്കുന്നു...' : 'Saving...'}</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{language === 'ml' ? 'സേവ് ചെയ്യുക' : 'Update PIN'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
