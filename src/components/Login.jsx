import React, { useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Clock,
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  ArrowLeft,
  Info,
  Sparkles,
  Hash,
  AtSign,
  Phone,
  Mail,
  Fingerprint,
  QrCode,
  Shield,
  RotateCcw,
} from 'lucide-react';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { useTokenLockStatus } from '../utils/useTokenLockStatus';
import { dialog } from '../utils/dialog';
import { safeLocalStorage } from '../utils/storage';
import useSEO from '../hooks/useSEO';
import { verifyPassword, migrateStudentToSaltedHash } from '../utils/cryptoAuthService';
import { verifyTOTP, verifyAndConsumeBackupCode } from '../utils/totpService';
import { isPasskeySupported, authenticateWithPasskey } from '../utils/passkeyService';
import ForgotPasswordModal from './modals/ForgotPasswordModal';

function Login() {
  const [token, setToken] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Next-Level Security & Auth States
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false);
  const [pending2FA, setPending2FA] = useState(null); // { docId, sData, studentData }
  const [totpCode, setTotpCode] = useState('');
  const [useBackupCode, setUseBackupCode] = useState(false);
  const [backupCodeInput, setBackupCodeInput] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [passkeySupported] = useState(() => isPasskeySupported());

  useSEO({
    title: 'Student Sign-In Portal',
    description: 'Secure student sign-in to view and update meal preferences, schedule date leaves, and manage canteen tokens.',
    keywords: 'student login, dars canteen login, token login, student portal signin',
  });

  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const {
    isPortalAccessible,
    isTomorrowLocked,
    isTomorrowPartiallyLocked,
    tomorrowLockInfo,
    statusBadge,
    currentTime,
    startTime,
    endTime,
    effectiveMode,
    config,
    activeScheduledEvent,
  } = useTokenLockStatus();

  const navigate = useNavigate();
  const location = useLocation();
  const passwordRef = useRef(null);
  const { setStdata } = useContext(DataOfOne);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenFromUrl = params.get('token');
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      setTimeout(() => {
        if (passwordRef.current) {
          passwordRef.current.focus();
        }
      }, 100);
    }
  }, [location.search]);

  const completeStudentLogin = useCallback(
    (studentData) => {
      // Explicitly initialize fresh activity timestamp in storage so all listeners start now
      safeLocalStorage.setItem('adsa_last_activity_timestamp', String(Date.now()));

      setStdata(studentData);
      feedback('success');
      if (studentData.block) {
        dialog.toast.info(
          t('tokenLockedByAdmin') || 'Token Locked by Admin',
          t('tokenLockedPortalNotice') ||
            'Your dining token is currently locked. You are viewing your details in Read-Only mode.',
          4000
        );
      }
      const returnUrl = location.state?.from;
      navigate((returnUrl && returnUrl !== '/login') ? returnUrl : '/student');
    },
    [setStdata, feedback, location.state?.from, navigate, t]
  );

  const loginWith = useCallback(async () => {
    try {
      const rawInput = (token || '').trim();
      if (!rawInput) {
        setErr(t('enterLoginIdentifier', 'Please enter your token number, username, phone, or email'));
        return;
      }

      const studentsRef = firebase.firestore().collection('students');
      let matchedDoc = null;

      // 1. Email Lookup (contains @ and .)
      if (rawInput.includes('@') && rawInput.includes('.')) {
        const normalizedEmail = rawInput.toLowerCase();
        const emailQuery = await studentsRef.where('email', '==', normalizedEmail).limit(1).get();
        if (!emailQuery.empty) {
          matchedDoc = emailQuery.docs[0];
        }
      }

      // 2. Phone Lookup (starts with + or digits >= 10)
      if (!matchedDoc) {
        const digits = rawInput.replace(/\D/g, '');
        if (digits.length >= 10) {
          const last10 = digits.slice(-10);
          const formattedDisplay = `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`;
          const withPlus = `+91${last10}`;

          const [exactQ, normQ, displayQ, plusQ, last10Q] = await Promise.all([
            studentsRef.where('phone', '==', rawInput).limit(1).get(),
            studentsRef.where('phoneNormalized', '==', last10).limit(1).get(),
            studentsRef.where('phone', '==', formattedDisplay).limit(1).get(),
            studentsRef.where('phone', '==', withPlus).limit(1).get(),
            studentsRef.where('phone', '==', last10).limit(1).get(),
          ]);

          matchedDoc =
            exactQ.docs[0] ||
            normQ.docs[0] ||
            displayQ.docs[0] ||
            plusQ.docs[0] ||
            last10Q.docs[0] ||
            null;
        }
      }

      // 3. Numeric Token Number Lookup (if numeric and short)
      if (!matchedDoc && /^\d+$/.test(rawInput) && rawInput.length <= 6) {
        const tokenQuery = await studentsRef
          .where('tokenNo', '==', parseInt(rawInput, 10))
          .limit(1)
          .get();

        if (!tokenQuery.empty) {
          matchedDoc = tokenQuery.docs[0];
        }
      }

      // 4. Username / Handle Lookup (@username or username or uname)
      if (!matchedDoc) {
        const cleanUname = rawInput.replace(/^@/, '').toLowerCase();
        const [usernameQuery, unameQuery] = await Promise.all([
          studentsRef.where('username', '==', cleanUname).limit(1).get(),
          studentsRef.where('uname', '==', cleanUname).limit(1).get(),
        ]);

        if (!usernameQuery.empty) {
          matchedDoc = usernameQuery.docs[0];
        } else if (!unameQuery.empty) {
          matchedDoc = unameQuery.docs[0];
        } else {
          // Exact case-sensitive fallback
          const exactQuery = await studentsRef
            .where('username', '==', rawInput)
            .limit(1)
            .get();
          if (!exactQuery.empty) {
            matchedDoc = exactQuery.docs[0];
          }
        }
      }

      // 5. Ultimate Fallback: Try tokenNo or phone directly if numeric
      if (!matchedDoc && /^\d+$/.test(rawInput)) {
        const num = parseInt(rawInput, 10);
        const tokenQuery = await studentsRef.where('tokenNo', '==', num).limit(1).get();
        if (!tokenQuery.empty) {
          matchedDoc = tokenQuery.docs[0];
        }
      }

      if (!matchedDoc) {
        feedback('warning');
        setErr(t('studentNotFound') || 'Account not found. Please verify your token, username, phone, or email.');
        return;
      }

      const sData = matchedDoc.data();

      // Advanced Cryptographic Password Verification with PBKDF2 & Auto-Migration
      let isPassValid = false;
      if (sData.passwordHash && sData.passwordSalt) {
        isPassValid = await verifyPassword(pass, sData.passwordHash, sData.passwordSalt);
      } else if (sData.password) {
        isPassValid = sData.password === pass;
        if (isPassValid) {
          // Asynchronously auto-migrate legacy password to salted PBKDF2 hash
          migrateStudentToSaltedHash(matchedDoc.id, pass, sData.tokenNo).catch(console.warn);
        }
      }

      if (!isPassValid) {
        feedback('warning');
        setErr(t('invalidPassword') || 'Incorrect password for this student account.');
        return;
      }

      const studentData = {
        id: matchedDoc.id,
        documentId: matchedDoc.id,
        ...sData,
      };

      // Check for Optional 2FA Challenge (if student opted into 2FA in settings)
      if (sData.totpEnabled) {
        setPending2FA({
          docId: matchedDoc.id,
          sData,
          studentData,
        });
        feedback('tick');
        return;
      }

      // Default: Direct, instantaneous sign-in with 0 extra steps
      completeStudentLogin(studentData);
    } catch (error) {
      console.error('Login error:', error);
      feedback('warning');
      setErr('Failed to login. Please try again.');
    }
  }, [token, pass, completeStudentLogin, feedback, t]);

  // Handle Optional 2FA Verification
  const handleVerify2FA = useCallback(
    async (e) => {
      e.preventDefault();
      if (!pending2FA) return;
      setIsVerifying2FA(true);
      setErr('');

      try {
        const { docId, sData, studentData } = pending2FA;

        if (useBackupCode) {
          const cleanBackup = (backupCodeInput || '').trim();
          const { isValid, remainingHashedCodes } = await verifyAndConsumeBackupCode(
            cleanBackup,
            sData.totpBackupCodes || []
          );

          if (!isValid) {
            feedback('warning');
            setErr(t('invalidBackupCode', 'Invalid or already used backup recovery code.'));
            setIsVerifying2FA(false);
            return;
          }

          // Update remaining backup codes in Firestore
          await firebase.firestore().collection('students').doc(docId).update({
            totpBackupCodes: remainingHashedCodes,
          });

          completeStudentLogin({ ...studentData, totpBackupCodes: remainingHashedCodes });
        } else {
          const cleanTotp = (totpCode || '').trim();
          const isValid = await verifyTOTP(cleanTotp, sData.totpSecret);

          if (!isValid) {
            feedback('warning');
            setErr(t('invalidTotpCode', 'Invalid 6-digit authenticator code. Check your clock.'));
            setIsVerifying2FA(false);
            return;
          }

          completeStudentLogin(studentData);
        }
      } catch (err) {
        console.error('2FA verification error:', err);
        setErr('Error verifying 2FA code. Please try again.');
      } finally {
        setIsVerifying2FA(false);
      }
    },
    [pending2FA, useBackupCode, backupCodeInput, totpCode, completeStudentLogin, feedback, t]
  );

  // Handle Passkey Sign-In (Biometric or QR code)
  const handlePasskeyLogin = useCallback(async () => {
    try {
      setIsPasskeyLoading(true);
      setErr('');
      feedback('tick');

      const assertion = await authenticateWithPasskey();
      if (!assertion || !assertion.id) {
        throw new Error('No passkey assertion returned');
      }

      // Lookup student by registered passkey ID
      const studentsRef = firebase.firestore().collection('students');
      const querySnap = await studentsRef
        .where('passkeyIds', 'array-contains', assertion.id)
        .limit(1)
        .get();

      if (querySnap.empty) {
        feedback('warning');
        setErr(
          t(
            'passkeyNotFound',
            'This passkey is not linked to any active student account. Please sign in with your Token and Password, then register this passkey in Settings.'
          )
        );
        return;
      }

      const doc = querySnap.docs[0];
      const sData = doc.data();
      const studentData = {
        id: doc.id,
        documentId: doc.id,
        ...sData,
      };

      completeStudentLogin(studentData);
    } catch (err) {
      console.error('Passkey login error:', err);
      if (err.name !== 'NotAllowedError') {
        setErr(err.message || 'Passkey authentication failed.');
      }
    } finally {
      setIsPasskeyLoading(false);
    }
  }, [completeStudentLogin, feedback, t]);

  const checkTimeAndHandleClick = useCallback(async () => {
    try {
      setIsLoading(true);
      const cleanId = (token || '').trim();
      if (!cleanId) {
        setErr(t('enterTokenOrUsername') || 'Please enter your token number or username.');
        return;
      }

      if (!isPortalAccessible) {
        feedback('warning');
        setErr('Token updates are currently suspended by ADSA Canteen Committee.');
        return;
      }

      await loginWith();
    } catch (error) {
      console.error('Error fetching token status:', error);
      setErr('Error checking account status.');
    } finally {
      setIsLoading(false);
    }
  }, [token, isPortalAccessible, loginWith, t, feedback]);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setErr('');
      feedback('tick');
      await checkTimeAndHandleClick();
    },
    [checkTimeAndHandleClick, feedback]
  );

  return (
    <div className="flex-1 flex items-center justify-center p-3 xs:p-4 sm:p-6 transition-colors duration-300 min-h-[calc(100dvh-8rem)]">
      <div className="w-full max-w-md space-y-4 sm:space-y-6">
        {/* Time Status Pill */}
        <div className="flex justify-center">
          <div
            className={`inline-flex items-center gap-2 sm:gap-2.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-2xl border backdrop-blur-xl text-xs font-semibold shadow-sm transition-all ${
              !isTomorrowLocked
                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-500/20 text-amber-700 dark:text-amber-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                !isTomorrowLocked ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            {!isTomorrowLocked ? <Clock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{statusBadge}</span>
            <span className="font-mono opacity-70">({currentTime || '--:--:--'} IST)</span>
          </div>
        </div>

        {/* Login Card */}
        <div data-tour="portal-auth-dock" className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xl backdrop-blur-xl p-5 xs:p-6 sm:p-8 space-y-5 sm:space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center shadow-md">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('studentPortalLogin', 'Student Portal')}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t(
                'enterAnyIdentifierHint',
                'Sign in with your Token Number, @username, Phone Number, or Email'
              )}
            </p>

            {/* Omnichannel Credential Indicators */}
            <div className="pt-2 flex items-center justify-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <Hash className="w-3 h-3 text-emerald-500" />
                <span>Token</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <AtSign className="w-3 h-3 text-emerald-500" />
                <span>Username</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <Phone className="w-3 h-3 text-emerald-500" />
                <span>Phone</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                <Mail className="w-3 h-3 text-emerald-500" />
                <span>Email</span>
              </span>
            </div>
          </div>

          {/* Emergency Lockdown Notice */}
          {!isPortalAccessible && (
            <div className="p-4 rounded-2xl bg-rose-50/90 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-500/30 flex items-start gap-3 text-xs text-rose-800 dark:text-rose-200 leading-relaxed">
              <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
              <div>
                <span className="font-bold block">{t('portalUnderEmergencyLockdown', 'Portal is Under Emergency Lockdown')}</span>
                {t('portalEmergencyLockdownDesc', 'Token updates have been temporarily paused by administration. Please check back later.')}
              </div>
            </div>
          )}

          {/* Next-Day Cutoff Informational Notice (Non-blocking) */}
          {isPortalAccessible && (isTomorrowLocked || isTomorrowPartiallyLocked) && effectiveMode === 'auto' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-bold block">
                  {isTomorrowPartiallyLocked
                    ? t('partialCutoffActive', 'Partial Cutoff Active')
                    : t('nextDayCutoffActive', 'Next-Day Cutoff Active')}
                </span>
                {tomorrowLockInfo?.reason || `Tomorrow's meal updates are closed (cutoff was ${endTime}).`}
                <span className="block mt-0.5 text-[11px] opacity-85">
                  {t('futureDatesUpdateNotice', 'You can sign in now to update any future dates (subsequent days, next week, or schedule leaves).')}
                </span>
              </div>
            </div>
          )}

          {/* Timed Extension Broadcast Notice */}
          {config?.temporaryOverride?.active && config.temporaryOverride.mode === 'force_unlocked' && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
              <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <div>
                <span className="font-bold block">Special Extension Active</span>
                <span>{config.temporaryOverride.reason || 'Token updates have been temporarily extended.'}</span>
              </div>
            </div>
          )}

          {/* Timed Freeze Broadcast Notice */}
          {config?.temporaryOverride?.active && config.temporaryOverride.mode === 'force_locked' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-300/80 dark:border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-bold block">Temporary Freeze in Progress</span>
                <span>{config.temporaryOverride.reason || 'Token changes are temporarily paused for kitchen inventory.'}</span>
              </div>
            </div>
          )}

          {/* Calendar Scheduled Event Notice */}
          {activeScheduledEvent && (
            <div className="p-3.5 rounded-2xl bg-purple-50/90 dark:bg-purple-950/40 border border-purple-300/80 dark:border-purple-500/30 flex items-start gap-2.5 text-xs text-purple-800 dark:text-purple-200 leading-relaxed">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-purple-600 dark:text-purple-400" />
              <div>
                <span className="font-bold block">{activeScheduledEvent.title}</span>
                <span>{activeScheduledEvent.reason || 'Calendar scheduled override active.'}</span>
              </div>
            </div>
          )}

          {/* Security Guard or Redirect Notice */}
          {location.state?.notice && !err && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/90 dark:bg-emerald-950/40 border border-emerald-300/80 dark:border-emerald-500/30 flex items-start gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 leading-relaxed">
              <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
              <span>{location.state.notice}</span>
            </div>
          )}

          {err && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{err}</span>
            </div>
          )}

          {/* 2FA Verification Flow (If student opted into 2FA) */}
          {pending2FA ? (
            <form onSubmit={handleVerify2FA} className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-teal-50/90 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-500/20 text-xs text-teal-800 dark:text-teal-200 flex items-start gap-2.5">
                <Shield className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400 mt-0.5" />
                <div>
                  <span className="font-bold block">{t('twoFactorRequired', 'Two-Factor Authentication')}</span>
                  <span>{t('enterTwoFactorDesc', 'Please enter the 6-digit rolling code from your authenticator app.')}</span>
                </div>
              </div>

              {!useBackupCode ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('authenticatorCode', '6-Digit Authenticator Code')}
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    autoFocus
                    value={totpCode}
                    onChange={(e) => setTotpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-center font-mono text-xl tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    {t('backupRecoveryCode', 'Backup Recovery Code')}
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={backupCodeInput}
                    onChange={(e) => setBackupCodeInput(e.target.value)}
                    placeholder="e.g. ABCD-EFGH"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-center font-mono text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500"
                    required
                  />
                </div>
              )}

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setUseBackupCode(!useBackupCode);
                    setErr('');
                  }}
                  className="text-teal-600 dark:text-teal-400 hover:underline font-medium"
                >
                  {useBackupCode
                    ? t('useAuthenticatorInstead', 'Use 6-digit authenticator code')
                    : t('useBackupRecoveryCode', 'Use backup recovery code')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPending2FA(null);
                    setTotpCode('');
                    setBackupCodeInput('');
                    setErr('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {t('cancel', 'Cancel')}
                </button>
              </div>

              <button
                type="submit"
                disabled={isVerifying2FA}
                className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-teal-600 hover:bg-teal-700 text-white shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2"
              >
                {isVerifying2FA ? (
                  <span>{t('verifying2FA', 'Verifying...')}</span>
                ) : (
                  <span>{t('confirmAndSignIn', 'Confirm & Sign In')}</span>
                )}
              </button>
            </form>
          ) : (
            /* Primary Login Form (Token ID + Password) */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Multi-Identifier Input (Token, Username, Phone, Email) */}
              <div className="space-y-1.5">
                <label
                  htmlFor="token"
                  className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                >
                  {t('omnichannelLoginLabel', 'Login ID')}
                </label>
                <input
                  id="token"
                  type="text"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck="false"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value);
                    setErr('');
                  }}
                  placeholder="Token #, @username, phone, or email"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="password"
                    className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {t('password') || 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setForgotModalOpen(true)}
                    className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {t('forgotPassword', 'Forgot Password?')}
                  </button>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    ref={passwordRef}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={pass}
                    onChange={(e) => {
                      setPass(e.target.value);
                      setErr('');
                    }}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 pr-11 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !isPortalAccessible}
                className={`w-full mt-2 inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm shadow-md transition-all transform active:scale-95 ${
                  isPortalAccessible
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-emerald-600/20'
                    : 'bg-gray-300 dark:bg-white/10 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-80'
                }`}
              >
                {isLoading ? (
                  <span>{t('verifying', 'Verifying...')}</span>
                ) : !isPortalAccessible ? (
                  <>
                    <Lock className="w-4 h-4 text-rose-500" />
                    <span>{t('tokenPortalFrozen', 'Token Portal Frozen')} ({statusBadge})</span>
                  </>
                ) : (
                  <>
                    <span>{t('signInToPortal', 'Sign In to Portal')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Alternative Passkey / Phone QR Sign-In */}
              {passkeySupported && (
                <div className="pt-1">
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
                    <span className="flex-shrink mx-3 text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-bold">
                      {t('or', 'or')}
                    </span>
                    <div className="flex-grow border-t border-gray-200 dark:border-white/10"></div>
                  </div>

                  <button
                    type="button"
                    onClick={handlePasskeyLogin}
                    disabled={isPasskeyLoading || !isPortalAccessible}
                    className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-50 dark:bg-purple-950/30 hover:bg-purple-100 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-500/20 transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    {isPasskeyLoading ? (
                      <span>{t('waitingForPasskey', 'Waiting for Biometrics / Phone QR...')}</span>
                    ) : (
                      <>
                        <Fingerprint className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                        <span>{t('signInWithPasskey', 'Sign In with Passkey / Phone QR')}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </form>
          )}

          <div className="pt-3 flex flex-col items-center gap-2 border-t border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('backToTokenBoard', 'Back to Token Board')}</span>
            </button>

            <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('officialCanteenSystem', 'Official Alathurpadi Dars Canteen System')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={forgotModalOpen}
        onClose={() => setForgotModalOpen(false)}
      />
    </div>
  );
}

export default Login;