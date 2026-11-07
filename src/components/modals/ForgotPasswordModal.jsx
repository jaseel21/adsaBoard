import React, { useState, useEffect } from 'react';
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
  RotateCcw,
} from 'lucide-react';
import firebase from '../../firebase/config';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { hashPassword, generateSalt } from '../../utils/cryptoAuthService';
import {
  dispatchPasswordResetEmail,
  verifyPasswordResetOtp,
  consumePasswordResetTicket,
} from '../../utils/emailDispatchService';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../../utils/auditLogger';

export default function ForgotPasswordModal({ isOpen, onClose }) {
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();

  // Steps:
  // 1 = Account Lookup
  // 1.5 = No email registered (Desk guidance)
  // 2 = Enter 6-digit Code (Verification ONLY)
  // 3 = Set New Password (Unlocked ONLY after Step 2 succeeds)
  // 4 = Success confirmation
  const [step, setStep] = useState(1);

  const [identifier, setIdentifier] = useState('');
  const [matchedStudent, setMatchedStudent] = useState(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [enteredOtp, setEnteredOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Resend countdown timer
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    let timer = null;
    if (resendCooldown > 0) {
      timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [resendCooldown]);

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
    setResendCooldown(0);
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

  // STEP 1: Look up student account & dispatch verification email
  const handleLookupAndSendCode = async (e) => {
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
        setStep(1.5);
        setIsLoading(false);
        return;
      }

      const masked = maskEmailAddress(sData.email);
      setMaskedEmail(masked);

      // Securely dispatch email with salted hash in Firestore (Plaintext OTP is NEVER stored in client state)
      await dispatchPasswordResetEmail({
        studentDocId: doc.id,
        tokenNo: sData.tokenNo,
        email: sData.email,
        name: sData.name || sData.nameEn,
      });

      setResendCooldown(60); // 60s cooldown before resend
      soundEngine.playSoftChime();
      hapticEngine.lightTap();
      setStep(2); // Advance to code verification step ONLY
    } catch (err) {
      console.error('Password reset lookup error:', err);
      setErrorMsg(err.message || 'Error processing request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (resendCooldown > 0 || !matchedStudent) return;
    setIsLoading(true);
    setErrorMsg('');
    feedback('tick');

    try {
      await dispatchPasswordResetEmail({
        studentDocId: matchedStudent.id || matchedStudent.documentId,
        tokenNo: matchedStudent.tokenNo,
        email: matchedStudent.email,
        name: matchedStudent.name || matchedStudent.nameEn,
      });
      setResendCooldown(60);
      soundEngine.playSoftChime();
      hapticEngine.lightTap();
    } catch (err) {
      setErrorMsg('Failed to resend code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify candidate 6-digit OTP (NO password inputs on this screen!)
  const handleVerifyCodeSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanOtp = enteredOtp.trim().replace(/\D/g, '');
    if (cleanOtp.length !== 6) {
      setErrorMsg(language === 'ml' ? '6 അക്ക കോഡ് നൽകുക' : 'Please enter the 6-digit verification code');
      return;
    }

    setIsLoading(true);
    feedback('tick');

    try {
      const docId = matchedStudent.id || matchedStudent.documentId;
      const result = await verifyPasswordResetOtp(docId, cleanOtp);

      if (!result.isValid) {
        feedback('warning');
        setErrorMsg(result.error || (language === 'ml' ? 'കോഡ് തെറ്റാണ് അല്ലെങ്കിൽ കാലാവധി കഴിഞ്ഞു' : 'Invalid or expired code'));
        setIsLoading(false);
        return;
      }

      // CODE IS VERIFIED! ONLY NOW advance to Step 3 (Set New Password)
      soundEngine.playSuccessBoop();
      hapticEngine.successPulse();
      setStep(3);
    } catch (err) {
      console.error('OTP verification error:', err);
      setErrorMsg('Failed to verify code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Set and save New Password (Unlocked ONLY after Step 2 verification)
  const handleSaveNewPasswordSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

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

      // Cryptographically hash new password with PBKDF2 & unique salt
      const salt = generateSalt();
      const hash = await hashPassword(newPassword, salt);

      // Update student document in Firestore
      await firebase.firestore().collection('students').doc(docId).update({
        passwordHash: hash,
        passwordSalt: salt,
        passwordAlgorithm: 'PBKDF2-SHA256',
        pinUpdatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        password: firebase.firestore.FieldValue.delete(), // Invalidate any legacy plaintext
      });

      // Invalidate and delete reset ticket
      await consumePasswordResetTicket(docId);

      // Permanent audit log
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
      setStep(4); // Advance to Success Screen
    } catch (err) {
      console.error('Password reset save error:', err);
      setErrorMsg('Failed to save new password. Please try again.');
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
                  {step === 1 && (language === 'ml' ? 'ഘട്ടം 1: അക്കൗണ്ട് കണ്ടെത്തുക' : 'Step 1: Account Lookup')}
                  {step === 2 && (language === 'ml' ? 'ഘട്ടം 2: ഇമെയിൽ വെരിഫിക്കേഷൻ' : 'Step 2: Email Verification')}
                  {step === 3 && (language === 'ml' ? 'ഘട്ടം 3: പുതിയ പാസ്‌വേഡ് നൽകുക' : 'Step 3: Set New Password')}
                  {step === 4 && (language === 'ml' ? 'പൂർത്തിയായി' : 'Completed')}
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

          {/* STEP 1: Identification & Send Email */}
          {step === 1 && (
            <form onSubmit={handleLookupAndSendCode} className="mt-5 space-y-4">
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
                    ? 'ഒരു 6 അക്ക വെരിഫിക്കേഷൻ കോഡ് നിങ്ങളുടെ രജിസ്റ്റർ ചെയ്ത ഇമെയിലിലേക്ക് അയക്കും.'
                    : 'A 6-digit verification code will be dispatched to your registered email address.'}
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>{language === 'ml' ? 'ഇമെയിൽ അയക്കുന്നു...' : 'Sending Email...'}</span>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    <span>{language === 'ml' ? 'ഇമെയിലിലേക്ക് കോഡ് അയക്കുക' : 'Send Code to Email'}</span>
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

          {/* STEP 2: Enter & Verify Code (NO PASSWORD FIELDS!) */}
          {step === 2 && (
            <form onSubmit={handleVerifyCodeSubmit} className="mt-5 space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5">
                <Mail className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold block">
                    {language === 'ml' ? 'ഇമെയിൽ പരിശോധിക്കുക' : 'Check Your Email Inbox'}
                  </span>
                  <span>
                    {language === 'ml'
                      ? `6 അക്ക വെരിഫിക്കേഷൻ കോഡ് ${maskedEmail} എന്ന വിലാസത്തിലേക്ക് അയച്ചിട്ടുണ്ട്.`
                      : `A 6-digit code has been sent to ${maskedEmail}. Check spam/junk if not received.`}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 text-center">
                  {language === 'ml' ? 'ഇമെയിലിൽ ലഭിച്ച 6 അക്ക കോഡ് നൽകുക' : 'Enter the 6-Digit Code from Email'}
                </label>
                <input
                  type="text"
                  maxLength={6}
                  value={enteredOtp}
                  onChange={(e) => setEnteredOtp(e.target.value.replace(/\D/g, ''))}
                  placeholder="••••••"
                  autoFocus
                  required
                  className="w-full px-3.5 py-3 rounded-2xl text-center text-2xl font-mono font-bold tracking-[0.5em] bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isLoading}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50 disabled:no-underline font-medium flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : (language === 'ml' ? 'കോഡ് വീണ്ടും അയക്കുക' : 'Resend Code')}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                >
                  {language === 'ml' ? 'ഐഡി മാറ്റുക' : 'Change ID'}
                </button>
              </div>

              <button
                type="submit"
                disabled={isLoading || enteredOtp.length !== 6}
                className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span>{language === 'ml' ? 'പരിശോധിക്കുന്നു...' : 'Verifying Code...'}</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{language === 'ml' ? 'കോഡ് സ്ഥിരീകരിക്കുക' : 'Verify Code'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 3: Set New Password (UNLOCKED ONLY AFTER CODE IS VERIFIED!) */}
          {step === 3 && (
            <form onSubmit={handleSaveNewPasswordSubmit} className="mt-5 space-y-4">
              <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-500/20 text-xs text-teal-800 dark:text-teal-300 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
                <span className="font-semibold">
                  {language === 'ml' ? 'ഇമെയിൽ സ്ഥിരീകരിച്ചു! പുതിയ പാസ്‌വേഡ് നൽകുക:' : 'Identity verified! Choose your new password:'}
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {language === 'ml' ? 'പുതിയ പാസ്‌വേഡ് / പിൻ' : 'New Password / PIN'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 4 characters"
                    autoFocus
                    required
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
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
                  className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
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
                    <span>{language === 'ml' ? 'പാസ്‌വേഡ് സേവ് ചെയ്യുക' : 'Save New Password & Sign In'}</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* STEP 4: Success Screen */}
          {step === 4 && (
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
                    : 'You can now sign in using your new password.'}
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
