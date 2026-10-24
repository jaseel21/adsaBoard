import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, AtSign, Check, AlertCircle, Sparkles, User, ShieldCheck } from 'lucide-react';
import firebase from '../../../firebase/config';
import { dialog } from '../../../utils/dialog';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../../../utils/auditLogger';

export default function EditUsernameModal({
  isOpen,
  onClose,
  studentData,
  onUsernameUpdated,
}) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  const currentUsername =
    studentData?.username ||
    (studentData?.uname && !/^[0-9]+$/.test(studentData.uname) ? studentData.uname : '');

  const [usernameInput, setUsernameInput] = useState(() => currentUsername || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const validateUsername = (raw) => {
    const clean = raw.trim().toLowerCase().replace(/^@/, '');
    if (!clean) {
      return {
        isValid: false,
        clean: '',
        error: language === 'ml' ? 'യൂസർനെയിം നൽകുക' : 'Please enter a username',
      };
    }
    if (clean.length < 3) {
      return {
        isValid: false,
        clean,
        error: language === 'ml' ? 'കുറഞ്ഞത് 3 അക്ഷരങ്ങൾ വേണം' : 'Username must be at least 3 characters',
      };
    }
    if (clean.length > 20) {
      return {
        isValid: false,
        clean,
        error: language === 'ml' ? 'പരമാവധി 20 അക്ഷരങ്ങൾ മാത്രമേ പാടുള്ളൂ' : 'Username cannot exceed 20 characters',
      };
    }
    if (/^\d+$/.test(clean)) {
      return {
        isValid: false,
        clean,
        error:
          language === 'ml'
            ? 'യൂസർനെയിം പൂർണ്ണമായും അക്കങ്ങൾ മാത്രമാകരുത് (ടോക്കൺ നമ്പറുമായി തെറ്റിദ്ധരിക്കാതിരിക്കാൻ)'
            : 'Username cannot be purely numeric (must contain letters to prevent token collision)',
      };
    }
    if (!/^[a-z0-9][a-z0-9_.-]*$/.test(clean)) {
      return {
        isValid: false,
        clean,
        error:
          language === 'ml'
            ? 'ചെറിയക്ഷരങ്ങളും അക്കങ്ങളും _ . - എന്നിവയും മാത്രമേ അനുവദിക്കൂ'
            : 'Only lowercase letters, numbers, dots, dashes, and underscores allowed',
      };
    }
    return { isValid: true, clean, error: '' };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const validation = validateUsername(usernameInput);
    if (!validation.isValid) {
      feedback('warning');
      setErrorMsg(validation.error);
      return;
    }

    const candidate = validation.clean;
    const currentDocId = studentData?.documentId || studentData?.id;

    // Check if unchanged
    if (candidate === currentUsername) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    feedback('tick');

    try {
      // 1. Uniqueness check against Firestore 'students' collection (username and uname fields)
      const studentsRef = firebase.firestore().collection('students');

      const [usernameQuery, unameQuery] = await Promise.all([
        studentsRef.where('username', '==', candidate).limit(2).get(),
        studentsRef.where('uname', '==', candidate).limit(2).get(),
      ]);

      const isTakenByOther =
        usernameQuery.docs.some((doc) => doc.id !== currentDocId) ||
        unameQuery.docs.some((doc) => doc.id !== currentDocId);

      if (isTakenByOther) {
        feedback('warning');
        setErrorMsg(
          language === 'ml'
            ? `@${candidate} എന്ന യൂസർനെയിം മറ്റൊരു വിദ്യാർത്ഥി ഉപയോഗിക്കുന്നുണ്ട്. മറ്റൊന്ന് തിരഞ്ഞെടുക്കുക.`
            : `Username '@${candidate}' is already taken by another student. Please pick a different handle.`
        );
        setIsSubmitting(false);
        return;
      }

      // 2. Persist update to student document
      await studentsRef.doc(currentDocId).update({
        username: candidate,
        uname: candidate,
        usernameUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      // 3. Audit log
      try {
        await logAuditEvent({
          action: 'STUDENT_CHANGE_USERNAME',
          category: AUDIT_CATEGORIES.SECURITY,
          severity: AUDIT_SEVERITIES.INFO,
          actor: {
            uid: `student_${studentData.tokenNo}`,
            displayName: studentData.name || `Student #${studentData.tokenNo}`,
            role: 'student',
          },
          target: {
            type: 'student',
            id: currentDocId,
            label: `@${candidate} (Token #${studentData.tokenNo})`,
          },
          metadata: {
            previousUsername: currentUsername || null,
            newUsername: candidate,
          },
        });
      } catch (logErr) {
        console.warn('Audit logging error on username update:', logErr);
      }

      feedback('success');
      dialog.toast.success(
        language === 'ml' ? 'യൂസർനെയിം സേവ് ചെയ്തു' : 'Username Claimed',
        language === 'ml'
          ? `ഇനി മുതൽ @${candidate} അല്ലെങ്കിൽ ടോക്കൺ #${studentData.tokenNo} ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യാം.`
          : `You can now sign in using @${candidate} or your token number #${studentData.tokenNo}.`
      );

      if (onUsernameUpdated) {
        onUsernameUpdated(candidate);
      }
      onClose();
    } catch (err) {
      console.error('Failed to update username:', err);
      feedback('warning');
      setErrorMsg(
        language === 'ml'
          ? 'യൂസർനെയിം സേവ് ചെയ്യാൻ കഴിഞ്ഞില്ല. വീണ്ടും ശ്രമിക്കുക.'
          : 'Could not update username. Please try again later.'
      );
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
              <AtSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white">
                {language === 'ml' ? 'വിദ്യാർത്ഥി യൂസർനെയിം ക്രമീകരിക്കുക' : 'Set Student Portal Username'}
              </h3>
              <span className="text-[11px] text-gray-400 font-medium">
                {language === 'ml'
                  ? `ടോക്കൺ #${studentData?.tokenNo} • ലോഗിൻ യൂസർനെയിം`
                  : `Token #${studentData?.tokenNo} • Quick Login Handle`}
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

          <div>
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
              {language === 'ml' ? 'പുതിയ യൂസർനെയിം (Username Handle)' : 'Unique Username Handle'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 font-mono text-sm font-bold">
                @
              </span>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => {
                  setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_.-]/g, ''));
                  setErrorMsg('');
                }}
                placeholder="e.g. jaseel, ahmed.dars"
                autoCapitalize="none"
                autoCorrect="off"
                required
                className="w-full pl-8 pr-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-mono text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              />
            </div>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1.5">
              {language === 'ml'
                ? 'ടോക്കൺ നമ്പറിന് പകരമായി ഈ യൂസർനെയിമും പാസ്‌വേഡും ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യാം.'
                : 'You can use this username interchangeably with your token number when signing in.'}
            </p>
          </div>

          {/* Info pill */}
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{language === 'ml' ? 'നിബന്ധനകൾ' : 'Handle Guidelines'}</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-gray-600 dark:text-gray-400 text-[10px]">
              <li>3 to 20 characters (lowercase letters, digits, dots, dashes, underscores)</li>
              <li>Must contain at least one letter (cannot be purely numeric)</li>
              <li>Case-insensitive login resolution</li>
            </ul>
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
                <span>{language === 'ml' ? 'പരിശോധിക്കുന്നു...' : 'Saving...'}</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>{language === 'ml' ? 'സേവ് ചെയ്യുക' : 'Save Username'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
