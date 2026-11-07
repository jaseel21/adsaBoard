import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Smartphone,
  Copy,
  Check,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Download,
  Lock,
} from 'lucide-react';
import firebase from '../../../firebase/config';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';
import {
  generateTOTPSecret,
  generateTOTPURI,
  verifyTOTP,
  generateBackupCodes,
} from '../../../utils/totpService';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../../../utils/auditLogger';

export default function TwoFactorSetupModal({
  isOpen,
  onClose,
  userType = 'student', // 'student' | 'staff'
  userData,
  onStatusUpdated,
}) {
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();

  const isEnabled = Boolean(userData?.totpEnabled);

  const [step, setStep] = useState(1); // 1: QR & Secret, 2: Verification Challenge, 3: Show Backup Codes, 4: Disable Confirmation
  const [secret, setSecret] = useState('');
  const [otpUri, setOtpUri] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState([]);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Initialize new secret when modal opens in setup mode
  useEffect(() => {
    if (isOpen && !isEnabled) {
      const newSecret = generateTOTPSecret();
      setSecret(newSecret);

      const label =
        userType === 'student'
          ? `Token ${userData?.tokenNo || userData?.uname || 'Student'}`
          : (userData?.email || 'Staff');

      const uri = generateTOTPURI({
        label,
        secret: newSecret,
        issuer: 'adsaBoard',
      });
      setOtpUri(uri);
      setStep(1);
      setErrorMsg('');
      setVerifyCode('');
    }
  }, [isOpen, isEnabled, userType, userData]);

  if (!isOpen || typeof document === 'undefined') return null;

  const handleCopySecret = async () => {
    try {
      await navigator.clipboard.writeText(secret);
      setCopiedSecret(true);
      soundEngine.playMechanicalClick();
      hapticEngine.lightTap();
      setTimeout(() => setCopiedSecret(false), 2000);
    } catch (_) {}
  };

  const handleCopyBackupCodes = async () => {
    try {
      const text = `ADSA BOARD 2FA BACKUP RECOVERY CODES\nAccount: ${
        userType === 'student' ? `Token #${userData?.tokenNo}` : userData?.email
      }\nDate: ${new Date().toLocaleDateString()}\n\n` + backupCodes.join('\n');
      await navigator.clipboard.writeText(text);
      setCopiedCodes(true);
      soundEngine.playMechanicalClick();
      hapticEngine.lightTap();
      setTimeout(() => setCopiedCodes(false), 2000);
    } catch (_) {}
  };

  // Step 2: Verify code and activate 2FA
  const handleVerifyAndActivate = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanCode = verifyCode.trim();
    if (!/^\d{6}$/.test(cleanCode)) {
      setErrorMsg(language === 'ml' ? '6 അക്ക കോഡ് നൽകുക' : 'Please enter a valid 6-digit code');
      return;
    }

    setIsLoading(true);
    feedback('tick');

    try {
      const isValid = await verifyTOTP(cleanCode, secret);
      if (!isValid) {
        feedback('warning');
        setErrorMsg(
          language === 'ml'
            ? 'കോഡ് തെറ്റാണ്. സമയം ശരിയാണെന്ന് ഉറപ്പുവരുത്തുക.'
            : 'Incorrect code. Please make sure your device clock is synchronized.'
        );
        setIsLoading(false);
        return;
      }

      // Generate 8 backup recovery codes
      const { plainCodes, hashedCodes } = await generateBackupCodes(8);
      setBackupCodes(plainCodes);

      // Save to Firestore
      const collectionName = userType === 'student' ? 'students' : 'staff_users';
      const docId = userData?.documentId || userData?.id || userData?.uid;

      await firebase.firestore().collection(collectionName).doc(docId).update({
        totpEnabled: true,
        totpSecret: secret,
        totpBackupCodes: hashedCodes,
        totpConfiguredAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      logAuditEvent({
        action: 'TWO_FACTOR_ENABLED',
        category: AUDIT_CATEGORIES.SECURITY,
        severity: AUDIT_SEVERITIES.NOTICE,
        actor: {
          uid: docId,
          displayName: userType === 'student' ? `Token #${userData?.tokenNo}` : userData?.email,
          role: userType,
        },
      }).catch(() => {});

      if (onStatusUpdated) {
        onStatusUpdated({
          ...userData,
          totpEnabled: true,
          totpSecret: secret,
          totpBackupCodes: hashedCodes,
        });
      }

      soundEngine.playCelebrationFanfare();
      hapticEngine.successPulse();
      setStep(3); // Show backup codes screen
    } catch (err) {
      console.error('2FA activation error:', err);
      setErrorMsg('Failed to activate 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Disable 2FA
  const handleDisable2FA = async () => {
    setIsLoading(true);
    feedback('tick');

    try {
      const collectionName = userType === 'student' ? 'students' : 'staff_users';
      const docId = userData?.documentId || userData?.id || userData?.uid;

      await firebase.firestore().collection(collectionName).doc(docId).update({
        totpEnabled: false,
        totpSecret: firebase.firestore.FieldValue.delete(),
        totpBackupCodes: firebase.firestore.FieldValue.delete(),
        totpDisabledAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      logAuditEvent({
        action: 'TWO_FACTOR_DISABLED',
        category: AUDIT_CATEGORIES.SECURITY,
        severity: AUDIT_SEVERITIES.WARNING,
        actor: {
          uid: docId,
          displayName: userType === 'student' ? `Token #${userData?.tokenNo}` : userData?.email,
          role: userType,
        },
      }).catch(() => {});

      if (onStatusUpdated) {
        onStatusUpdated({
          ...userData,
          totpEnabled: false,
          totpSecret: null,
          totpBackupCodes: null,
        });
      }

      soundEngine.playCautionThud();
      hapticEngine.lightTap();
      onClose();
    } catch (err) {
      console.error('2FA disable error:', err);
      setErrorMsg('Failed to disable 2FA. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
    otpUri
  )}&margin=4&qzone=1`;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 12 }}
          className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 overflow-hidden z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-white/5">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  isEnabled
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                    : 'bg-teal-50 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-500/20'
                }`}
              >
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {language === 'ml' ? 'ടു-ഫാക്ടർ ഓതന്റിക്കേഷൻ (2FA)' : 'Two-Factor Authentication (2FA)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isEnabled
                    ? (language === 'ml' ? 'സജീവം (ഓപ്ഷണൽ സുരക്ഷ)' : 'Active (Optional Security)')
                    : (language === 'ml' ? 'ഓതന്റിക്കേറ്റർ ആപ്പ് വഴി സജ്ജീകരിക്കുക' : 'Setup with Authenticator App')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

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

          {/* VIEW: Already Enabled */}
          {isEnabled && (
            <div className="mt-5 space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
                  <div className="font-bold text-sm">
                    {language === 'ml' ? '2FA ഇപ്പോൾ സജീവമാണ്' : '2FA is Active & Protecting Your Account'}
                  </div>
                  <p className="leading-relaxed text-emerald-700 dark:text-emerald-300">
                    {language === 'ml'
                      ? 'ലോഗിൻ ചെയ്യുമ്പോൾ നിങ്ങളുടെ ഓതന്റിക്കേറ്റർ ആപ്പിലെ 6 അക്ക കോഡ് നൽകേണ്ടതുണ്ട്.'
                      : 'When you sign in, you will be prompted for a 6-digit rolling code from your authenticator app.'}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/5 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  onClick={handleDisable2FA}
                  disabled={isLoading}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>{language === 'ml' ? 'മാറ്റുന്നു...' : 'Disabling...'}</span>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>{language === 'ml' ? '2FA നിർജ്ജീവമാക്കുക' : 'Disable 2FA'}</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white transition-colors"
                >
                  {language === 'ml' ? 'അടയ്ക്കുക' : 'Close'}
                </button>
              </div>
            </div>
          )}

          {/* VIEW: Setup Step 1 & 2 (QR Code & Verification) */}
          {!isEnabled && (step === 1 || step === 2) && (
            <div className="mt-5 space-y-5">
              <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {language === 'ml'
                  ? 'Google Authenticator, Microsoft Authenticator, Aegis അല്ലെങ്കിൽ Apple Passwords ആപ്പ് ഉപയോഗിച്ച് താഴെയുള്ള QR കോഡ് സ്കാൻ ചെയ്യുക:'
                  : 'Scan this QR code using Google Authenticator, Microsoft Authenticator, Aegis, 2FAS, or Apple Keychain:'}
              </div>

              {/* QR Code Canvas */}
              <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10">
                <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-200">
                  <img
                    src={qrImageUrl}
                    alt="2FA QR Code"
                    width={180}
                    height={180}
                    className="block rounded-lg"
                  />
                </div>

                {/* Manual Secret Key */}
                <div className="mt-4 text-center w-full max-w-xs">
                  <div className="text-[11px] text-slate-400 mb-1">
                    {language === 'ml' ? 'മാനുവൽ എന്റർ കീ:' : 'Manual setup key:'}
                  </div>
                  <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 text-xs font-mono font-bold tracking-wider text-slate-800 dark:text-slate-200">
                    <span className="truncate">{secret}</span>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="p-1 rounded text-slate-500 hover:text-emerald-500"
                      title="Copy Secret"
                    >
                      {copiedSecret ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Verification Form */}
              <form onSubmit={handleVerifyAndActivate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {language === 'ml'
                      ? 'സ്ഥിരീകരിക്കാൻ ആപ്പിലെ 6 അക്ക കോഡ് നൽകുക:'
                      : 'Enter the 6-digit code from your app to verify:'}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl text-center text-lg font-mono tracking-widest bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold bg-teal-500 hover:bg-teal-600 disabled:opacity-50 text-white shadow-lg shadow-teal-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <span>{language === 'ml' ? 'പരിശോധിക്കുന്നു...' : 'Verifying...'}</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{language === 'ml' ? 'സ്ഥിരീകരിച്ച് 2FA സജീവമാക്കുക' : 'Verify & Enable 2FA'}</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* VIEW: Setup Step 3 (Backup Recovery Codes) */}
          {!isEnabled && step === 3 && (
            <div className="mt-5 space-y-4">
              <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{language === 'ml' ? 'ബാക്കപ്പ് റിക്കവറി കോഡുകൾ സൂക്ഷിക്കുക' : 'Save Your Backup Recovery Codes'}</span>
                </div>
                <p className="leading-relaxed text-amber-800 dark:text-amber-300">
                  {language === 'ml'
                    ? 'നിങ്ങളുടെ ഫോൺ നഷ്ടപ്പെടുകയോ ബാറ്ററി തീരുകയോ ചെയ്താൽ ഈ കോഡുകൾ ഉപയോഗിച്ച് ലോഗിൻ ചെയ്യാം. ഓരോ കോഡും 1 തവണ മാത്രമേ ഉപയോഗിക്കാൻ സാധിക്കൂ.'
                    : 'If your phone is lost or dead, use these single-use recovery codes to sign in. Keep them safe or take a photo.'}
                </p>
              </div>

              {/* Grid of 8 codes */}
              <div className="grid grid-cols-2 gap-2 p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 font-mono text-xs font-bold text-slate-800 dark:text-slate-200 text-center">
                {backupCodes.map((c, i) => (
                  <div key={i} className="p-2 rounded-lg bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-white/5 tracking-wider">
                    {c}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleCopyBackupCodes}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-800 dark:text-white transition-colors flex items-center justify-center gap-1.5"
                >
                  {copiedCodes ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCodes ? (language === 'ml' ? 'കോപ്പി ചെയ്തു!' : 'Copied!') : (language === 'ml' ? 'എല്ലാം കോപ്പി ചെയ്യുക' : 'Copy All Codes')}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'ml' ? 'സേവ് ചെയ്തു, പൂർത്തിയായി' : 'I Have Saved Them'}</span>
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
