import React, { useContext, useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Clock, KeyRound, Lock, Eye, EyeOff, AlertTriangle, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { useWorldTime } from '../utils/time';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';

function Login() {
  const [token, setToken] = useState('');
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [currentTime, setCurrentTime] = useState(null);
  const [canClick, setCanClick] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formFocused, setFormFocused] = useState(false);

  const { timeHms } = useWorldTime('Asia/Kolkata');
  const { t } = useLanguage();
  const { feedback } = useFeedback();

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

  const startTime = "14:00:00";
  const endTime = "23:00:00";

  const getISTTime = useCallback(() => {
    if (!timeHms) return null;
    return timeHms.padStart(8, '0');
  }, [timeHms]);

  useEffect(() => {
    let isMounted = true;
    const updateTime = () => {
      const time = getISTTime();
      if (!isMounted) return;
      setCurrentTime(time);
      if (time) {
        setCanClick(time >= startTime && time <= endTime);
      } else {
        setCanClick(false);
      }
    };
    updateTime();
    const intervalId = setInterval(updateTime, 1000);
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [getISTTime, startTime, endTime]);

  const isCurrentTimeInRange = useCallback(() => {
    if (!currentTime) return false;
    return currentTime >= startTime && currentTime <= endTime;
  }, [currentTime, startTime, endTime]);

  const loginWith = useCallback(async () => {
    try {
      const StInfo = await firebase
        .firestore()
        .collection('students')
        .where('tokenNo', '==', parseInt(token))
        .where('password', '==', pass)
        .get();

      if (!StInfo.empty) {
        const studentData = StInfo.docs[0].data();
        studentData.documentId = StInfo.docs[0].id;
        setStdata(studentData);
        feedback('success');
        navigate('/student-portal');
      } else {
        feedback('warning');
        setErr('Invalid token number or password');
      }
    } catch (error) {
      console.error('Login error:', error);
      feedback('warning');
      setErr('Failed to login. Please try again.');
    }
  }, [token, pass, setStdata, navigate, feedback]);

  const submitForm = useCallback(async () => {
    try {
      setIsLoading(true);
      const time = getISTTime();
      if (!time) {
        setErr('Unable to verify time. Please try again.');
        return;
      }

      const doc = await firebase
        .firestore()
        .collection('tokenboard')
        .doc('g8iJVNn2RQkysjMAvX1h')
        .get();

      if (doc.exists) {
        const tbStatus = doc.data().status;
        if (isCurrentTimeInRange() || tbStatus === true) {
          await loginWith();
        } else {
          feedback('warning');
          setErr('Login is restricted outside allowed hours (2:00 PM - 11:00 PM IST).');
        }
      } else {
        setErr('System error: Configuration not found.');
      }
    } catch (error) {
      console.error('Error checking tokenboard status:', error);
      setErr('Error checking system status. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [isCurrentTimeInRange, loginWith, getISTTime, feedback]);

  const checkTimeAndHandleClick = useCallback(async () => {
    try {
      setIsLoading(true);
      if (!token || isNaN(parseInt(token))) {
        setErr('Please enter a valid numeric token number.');
        return;
      }

      const blockStatus = await firebase
        .firestore()
        .collection('students')
        .where('tokenNo', '==', parseInt(token))
        .get();

      if (!blockStatus.empty) {
        const statusData = blockStatus.docs[0].data().block;
        if (statusData === false) {
          await submitForm();
        } else {
          feedback('warning');
          setErr('Your token has been locked by ADSA Canteen Committee.');
        }
      } else {
        feedback('warning');
        setErr('Token not found. Please check and try again.');
      }
    } catch (error) {
      console.error('Error fetching block status:', error);
      setErr('Error checking token status.');
    } finally {
      setIsLoading(false);
    }
  }, [token, submitForm, feedback]);

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
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 transition-colors duration-300">
      <div className="w-full max-w-md space-y-6">
        
        {/* Time Status Pill */}
        <div className="flex justify-center">
          <div
            className={`inline-flex items-center gap-2.5 px-4 py-2 rounded-2xl border backdrop-blur-xl text-xs font-semibold shadow-sm transition-all ${
              canClick
                ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400'
                : 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-500/20 text-amber-700 dark:text-amber-400'
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                canClick ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
              }`}
            />
            <Clock className="w-3.5 h-3.5" />
            <span>{canClick ? 'Token Updates Open' : 'Outside Update Window'}</span>
            <span className="font-mono opacity-70">({currentTime || '12:00:00'} IST)</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xl backdrop-blur-xl p-6 sm:p-8 space-y-6">
          
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center shadow-md">
              <KeyRound className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
              {t('navStudentPortal')}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Enter your token number and password to manage meal selections
            </p>
          </div>

          {err && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-500/30 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500" />
              <span>{err}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Token Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="token"
                className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                {t('tokenNumber')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="e.g. 104"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label
                htmlFor="password"
                className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
              >
                Password
              </label>
              <div className="relative">
                <input
                  ref={passwordRef}
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full px-4 pr-11 py-3 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
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
              disabled={isLoading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all transform active:scale-95 disabled:opacity-50"
            >
              {isLoading ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Sign In to Portal</span>
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
              <span>Back to Token Board</span>
            </button>

            <span className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Official Alathurpadi Dars Canteen System</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;