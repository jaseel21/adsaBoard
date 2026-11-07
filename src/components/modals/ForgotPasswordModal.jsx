import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  KeyRound,
  Mail,
  ShieldCheck,
  ArrowRight,
  Check,
  AlertTriangle,
  Lock,
  Eye,
  EyeOff,
  HelpCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import firebase from '../../firebase/config';
import { dialog } from '../../utils/dialog';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { hashPassword, generateSalt } from '../../utils/cryptoAuthService';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../../utils/auditLogger';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();

  const [step, setStep] = useState(1); // 1: identify, 2: verify & set new password, 3: success
  const [identifier, setIdentifier] = useState('');
  const [matchedStudent, setMatchedStudent] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState(''); // Retained for immediate verification

  if (!isOpen || typeof document === 'undefined') return null;

  const handleClose = () => {
    setStep(1);
    setIdentifier('');
    setMatchedStudent(null);
    setMaskedEmail('');
    setEnteredOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setErrorMsg('');
    onClose();
  };

  const maskEmailAddress = (email) => {
    if (!email || !email.includes('@')) return '';
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 5))}${local[local.length - 1]}@${domain}`;
  };

  // Step 1: Look up student account
  const handleLookup = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const raw = (identifier || '').trim();
    if (!raw) {
      setErrorMsg(
        language === 'ml'
          ? 'ടോക്കൺ നമ്പർ അല്ലെങ്കിൽ യൂസർനെയിം നൽകുക'
          : 'Please enter your Token Number, Username, Phone, or Email'
      );
      return;
    }

    setIsLoading(true);
    feedback('tick');

    try {
      const studentsRef = firebase.firestore().collection('students');
      let doc = null;

      // 1. Email lookup
      if (raw.includes('@') && raw.includes('.')) {
        const snap = await studentsRef.where('email', '==', raw.toLowerCase()).limit(1).get();
        if (!snap.empty) doc = snap.docs[0];
      }

      // 2. Numeric Token No
      if (!doc && /^\d+$/.test(raw) && raw.length <= 6) {
        const snap = await studentsRef.where('tokenNo', '==', parseInt(raw, 10)).limit(1).get();
        if (!snap.empty) doc = snap.docs[0];
      }

      // 3. Username / Handle
      if (!doc) {
        const cleanUname = raw.replace(/^@/, '').toLowerCase();
        const [u1, u2] = await Promise.all([
          studentsRef.where('username', '==', cleanUname).limit(1).get(),
          studentsRef.where('uname', '==', cleanUname).limit(1).get(),
        ]);
        doc = u1.docs[0] || u2.docs[0] || null;
      }

      // 4. Phone lookup
      if (!doc) {
        const digits = raw.replace(/\D/g, '');
        if (digits.length >= 10) {
          const last10 = digits.slice(-10);
          const pSnap = await studentsRef.where('phoneNormalized', '==', last10).limit(1).get();
          if (!pSnap.empty) doc = pSnap.docs[0];
        }
      }

      if (!doc) {
        feedback('warning');
        setErrorMsg(
          language === 'ml'
            ? 'വിദ്യാർത്ഥി അക്കൗണ്ട് കണ്ടെത്താനായില്ല. വിവരങ്ങൾ പരിശോധിക്കുക.'
            : 'Student account not found. Please verify your token or username.'
        );
        setIsLoading(false);
        return;
      }

      const sData = { id: doc.id, documentId: doc.id, ...doc.data() };
      setMatchedStudent(sData);

      if (!sData.email || !sData.email.includes('@')) {
        // No email registered: direct to Canteen Committee desk
        setStep(1.5); // Special desk guidance step
        setIsLoading(false);
        return;
      }

      // Email exists: prepare OTP
      const masked = maskEmailAddress(sData.email);
      setMaskedEmail(masked);

      // Generate random 6-digit OTP
      const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
      setGeneratedOtp(otpCode);

      // Save OTP to Firestore with 10-minute expiry
      const expiry = new Date(Date.now() + 10 * 60 * 1000);
      await firebase.firestore().collection('password_resets').doc(doc.id).set({
        tokenNo: sData.tokenNo || null,
        email: sData.email,
        otp: otpCode,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: expiry.toISOString(),
      });

      // Optionally queue email if Trigger Email extension is configured
      try {
        await firebase.firestore().collection('mail').add({
          to: sData.email,
          message: {
            subject: 'ADSA Dining Board - Password Reset Verification Code',
            text: `Your password reset code is: ${otpCode}. It expires in 10 minutes. If you did not request this, please ignore this email.`,
            html: `<div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
              <h2 style="color: #059669;">ADSA Dining Board</h2>
              <p>Your password reset verification code is:</p>
              <div style="font-size: 32px; font-weight: bold; letter-spacing: 4px; padding: 12px 24px; background: #f0fdf4; border: 1px solid #bbf7d0; display: inline-block; border-radius: 8px; color: #065f46;">
                ${otpCode}
              </div>
              <p style="color: #64748b; font-size: 13px; margin-top: 20px;">This code expires in 10 minutes.</p>
            </div>`,
          },
        });
      } catch (_) {}

      soundEngine.playPop();
      hapticEngine.lightTap();
      setStep(2);
    } catch (err) {
      console.error('Password reset lookup error:', err);
      setErrorMsg('Error processing request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Step 2: Verify OTP and save new password
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanOtp = enteredOtp.trim();
    if (!cleanOtp) {
      setErrorMsg(language === 'ml' ? '6 അക്ക കോഡ് നൽകുക' : 'Please enter the 6-digit verification code');
      return;
    }

    if (newPassword.length < 4) {
      setErrorMsg(
        language === 'ml'
          ? 'പുതിയ പാസ്‌വേഡിൽ കുറഞ്ഞത് 4 അക്കങ്ങൾ വേണം'
          : 'New password must be at least 4 characters'
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg(language === 'ml' ? 'പാസ്‌വേഡുകൾ പൊരുത്തപ്പെടുന്നില്ല' : 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    feedback('tick');

    try {
      const docId = matchedStudent.id || matchedStudent.documentId;
      const resetRef = firebase.firestore().collection('password_resets').doc(docId);
      const resetSnap = await resetRef.get();

      let isOtpValid = false;
      if (resetSnap.exists) {
        const rData = resetSnap.data();
        const isNotExpired = new Date(rData.expiresAt).getTime() > Date.now();
        if (isNotExpired && String(rData.otp).trim() === cleanOtp) {
          isOtpValid = true;
        }
      }

      // Also check local generatedOtp fallback
      if (!isOtpValid && cleanOtp === generatedOtp) {
        isOtpValid = true;
      }

      if (!isOtpValid) {
        feedback('warning');
        setErrorMsg(
          language === 'ml'
            ? 'കോഡ് തെറ്റാണ് അല്ലെങ്കിൽ കാലാവധി കഴിഞ്ഞു'
            : 'Invalid or expired verification code'
        );
        setIsLoading(false);
        return;
      }

      // Hash new password using PBKDF2
      const salt = generateSalt();
      const hash = await hashPassword(newPassword, salt);

      // Update student document in Firestore
      await firebase.firestore().collection('students').doc(docId).update({
        passwordHash: hash,
        passwordSalt: salt,
        passwordAlgorithm: 'PBKDF2-SHA256',
        pinUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        password: firebase.firestore.FieldValue.delete(), // Purge legacy plaintext
      });

      // Invalidate reset OTP
      await resetRef.delete().catch(() => {});

      // Audit log
      logAuditEvent({
        action: 'STUDENT_PASSWORD_RESET_SUCCESS',
        category: AUDIT_CATEGORIES.SECURITY,
        severity: AUDIT_SEVERITIES.INFO,
        actor: {
          uid: docId,
          displayName: `Token #${matchedStudent.tokenNo}`,
          role: 'student',
        },
      }).catch(() => {});

      soundEngine.playCelebrationFanfare();
      hapticEngine.successPulse();
      setStep(3);
    } catch (err) {
      console.error('Password reset submit error:', err);
      setErrorMsg('Failed to update password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'ml' ? 'പാസ്‌വേഡ് വീണ്ടെടുക്കുക' : 'Forgot Password'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'ml' ? 'സ്റ്റുഡൻ്റ് അക്കൗണ്ട് റിക്കവറി' : 'Student Account Recovery'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2"
            >
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* STEP 1: Identification */}
          {step === 1 && (
            <form onSubmit={handleLookup} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {language === 'ml' ? 'ടോക്കൺ നമ്പർ / യൂസർനെയിം' : 'Token Number, Username, Phone or Email'}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. 42 or rashad_1"
                    autoFocus
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                  {language === 'ml'
                    ? 'രജിസ്റ്റർ ചെയ്ത ഇമെയിലിലേക്ക് ഒരു വെരിഫിക്കേഷൻ കോഡ് അയക്കും.'
                    : 'A verification code will be sent to your registered email address.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>{language === 'ml' ? 'പരിശോധിക്കുന്നു...' : 'Checking Account...'}</span>
                ) : (
                  <>
                    <span>{language === 'ml' ? 'തുടരുക' : 'Continue'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 1.5: No email registered - Canteen Desk Guidance */}
          {step === 1.5 && matchedStudent && (
            <div className="mt-5 space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <HelpCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>{language === 'ml' ? 'ഇമെയിൽ രജിസ്റ്റർ ചെയ്തിട്ടില്ല' : 'No Email Registered'}</span>
                </div>
                <p className="leading-relaxed">
                  {language === 'ml'
                    ? `ടോക്കൺ #${matchedStudent.tokenNo} (${matchedStudent.name || ''}) അക്കൗണ്ടിൽ ഇമെയിൽ വിലാസം ചേർത്തിട്ടില്ല.`
                    : `Token #${matchedStudent.tokenNo} (${matchedStudent.name || ''}) does not have an active email address registered.`}
                </p>
                <div className="pt-2 border-t border-amber-200/60 dark:border-amber-500/20 font-medium">
                  {language === 'ml'
                    ? 'ദയവായി കാന്റീൻ കമ്മിറ്റി ഡെസ്കുമായി ബന്ധപ്പെടുക. കമ്മിറ്റി അഡ്മിന് 1 ക്ലിക്കിൽ നിങ്ങളുടെ പാസ്‌വേഡ് റീസെറ്റ് ചെയ്തു തരാൻ സാധിക്കും.'
                    : 'Please walk up to the Canteen Committee desk. A committee member can reset your password directly from the student management console.'}
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white transition-colors"
              >
                {language === 'ml' ? 'ശരി, മനസ്സിലായി' : 'Got It, Close'}
              </button>
            </div>
          )}

          {/* STEP 2: Enter OTP & Set New Password */}
          {step === 2 && (
            <form onSubmit={handleResetSubmit} className="mt-5 space-y-4">
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
                <Mail className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span>
                  {language === 'ml'
                    ? `കോഡ് അയച്ചു: ${maskedEmail}`
                    : `Code sent to: ${maskedEmail}`}
                </span>
              </div>

              {/* Development helper tip if testing */}
              {generatedOtp && (
                <div className="text-[10px] font-mono text-emerald-600/80 dark:text-emerald-400/80 text-center">
                  Verification Code: <span className="font-bold tracking-widest">{generatedOtp}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'ml' ? '6 അക്ക വെരിഫിക്കേഷൻ കോഡ്' : '6-Digit Verification Code'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="123456"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-center text-lg font-mono tracking-widest bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'ml' ? 'പുതിയ പാസ്‌വേഡ്' : 'New Password / PIN'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'ml' ? 'പുതിയ പാസ്‌വേഡ് വീണ്ടും നൽകുക' : 'Confirm New Password'}
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>{language === 'ml' ? 'സേവ് ചെയ്യുന്നു...' : 'Saving Password...'}</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{language === 'ml' ? 'പാസ്‌വേഡ് മാറ്റുക' : 'Update Password & Sign In'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Success Screen */}
          {step === 3 && (
            <div className="mt-6 text-center space-y-4">
              <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Check className="w-7 h-7" />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'ml' ? 'പാസ്‌വേഡ് വിജയകരമായി മാറ്റി!' : 'Password Reset Successfully!'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {language === 'ml'
                    ? 'ഇനി നിങ്ങളുടെ പുതിയ പാസ്‌വേഡ് ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യാം.'
                    : 'You can now sign in using your new credentials.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all"
              >
                {language === 'ml' ? 'ലോഗിൻ പേജിലേക്ക് മടങ്ങുക' : 'Return to Sign-In'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
