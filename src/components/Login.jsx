import React, { useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, KeyRound, Lock, Eye, EyeOff, AlertTriangle, ArrowRight, ShieldCheck, ArrowLeft, Info } from 'lucide-react';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { useTokenLockStatus } from '../utils/useTokenLockStatus';
import { dialog } from '../utils/dialog';
import useSEO from '../hooks/useSEO';

function Login() {
  const [token, setToken] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useSEO({
    title: 'Student Sign-In Portal',
    description: 'Secure student sign-in to view and update meal preferences, request single-day leaves, and manage canteen tokens.',
    keywords: 'student login, dars canteen login, token login, student portal signin',
  });

  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const {
    isPortalAccessible,
    isTomorrowLocked,
    tomorrowLockInfo,
    statusBadge,
    currentTime,
    startTime,
    endTime,
    effectiveMode,
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

  const loginWith = useCallback(async () => {
    try {
      const cleanId = (token || '').trim().replace(/^@/, '');
      if (!cleanId) {
        setErr(t('enterTokenOrUsername') || 'Please enter your token number or username');
        return;
      }

      const studentsRef = firebase.firestore().collection('students');
      let matchedDoc = null;

      // 1. If numeric, first search by tokenNo
      if (/^\d+$/.test(cleanId)) {
        const tokenQuery = await studentsRef
          .where('tokenNo', '==', parseInt(cleanId, 10))
          .limit(1)
          .get();

        if (!tokenQuery.empty) {
          matchedDoc = tokenQuery.docs[0];
        }
      }

      // 2. If not found or if input has letters, search by username & uname
      if (!matchedDoc) {
        const normalizedUname = cleanId.toLowerCase();
        const usernameQuery = await studentsRef
          .where('username', '==', normalizedUname)
          .limit(1)
          .get();

        if (!usernameQuery.empty) {
          matchedDoc = usernameQuery.docs[0];
        } else {
          const unameQuery = await studentsRef
            .where('uname', '==', normalizedUname)
            .limit(1)
            .get();

          if (!unameQuery.empty) {
            matchedDoc = unameQuery.docs[0];
          } else {
            // Case-sensitive exact fallback lookup
            const exactQuery = await studentsRef
              .where('username', '==', cleanId)
              .limit(1)
              .get();
            if (!exactQuery.empty) {
              matchedDoc = exactQuery.docs[0];
            }
          }
        }
      }

      if (!matchedDoc) {
        feedback('warning');
        setErr(t('studentNotFound') || 'Token number or username not found. Please check and try again.');
        return;
      }

      const sData = matchedDoc.data();
      if (sData.password !== pass) {
        feedback('warning');
        setErr(t('invalidPassword') || 'Incorrect password for this student account.');
        return;
      }

      const studentData = {
        id: matchedDoc.id,
        documentId: matchedDoc.id,
        ...sData,
      };

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
      navigate(returnUrl || '/student');
    } catch (error) {
      console.error('Login error:', error);
      feedback('warning');
      setErr('Failed to login. Please try again.');
    }
  }, [token, pass, setStdata, navigate, feedback, location.state?.from, t]);

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
        <div className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xl backdrop-blur-xl p-5 xs:p-6 sm:p-8 space-y-5 sm:space-y-6">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center shadow-md">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('studentPortalLogin', 'Student Portal')}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('enterTokenNumberOrUsername', 'Enter your token number or @username and password to manage meal selections')}
            </p>
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
          {isPortalAccessible && isTomorrowLocked && effectiveMode === 'auto' && (
            <div className="p-3.5 rounded-2xl bg-amber-50/90 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-bold block">{t('nextDayCutoffActive', 'Next-Day Cutoff Active')}</span>
                {tomorrowLockInfo.reason || `Tomorrow's meal updates are closed (cutoff was ${endTime}).`}
                <span className="block mt-0.5 text-[11px] opacity-85">
                  {t('futureDatesUpdateNotice', 'You can sign in now to update any future dates (subsequent days, next week, or schedule leaves).')}
                </span>
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Token or Username Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="token"
                className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                {t('tokenNumberOrUsername', 'Token Number or Username')}
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
                placeholder="Enter your token or username"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                required
              />
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                {t('password') || 'Password'}
              </label>
              <div className="relative">
                <input
                  id="password"
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
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
          </form>

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
    </div>
  );
}

export default Login;