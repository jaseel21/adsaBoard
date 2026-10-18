import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, ArrowLeft } from 'lucide-react';
import { dialog } from '../utils/dialog';
import firebase from '../firebase/config';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';

function AdminLogin() {
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('adsacanteen@gmail.com');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const redirectTarget = location.state?.from || '/admin';
  const noticeMessage = location.state?.notice;

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    feedback('tick');

    try {
      // Enforce session persistence so public computers don't keep committee logged in indefinitely
      if (firebase.auth.Auth && firebase.auth.Auth.Persistence) {
        await firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION);
      }
      await firebase.auth().signInWithEmailAndPassword(email, password);
      feedback('success');
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      dialog.alert({
        type: 'error',
        title: 'Authentication Failed',
        message: error.message || 'Invalid administrator credentials.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center p-3 xs:p-4 sm:p-6 min-h-[calc(100dvh-8rem)]">
      <div className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-2xl p-5 xs:p-6 sm:p-8 space-y-5 sm:space-y-6 backdrop-blur-xl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white flex items-center justify-center shadow-md">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            ADSA Administration
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Sign in with administrative credentials to manage canteen tokens
          </p>
        </div>

        {noticeMessage && (
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-200">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-500" />
            <span>{noticeMessage}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Admin Email
            </label>
            <div className="relative">
              <input
                onChange={(e) => setEmail(e.target.value)}
                value={email}
                type="email"
                required
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <input
                onChange={(e) => setPassword(e.target.value)}
                value={password}
                type="password"
                required
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all transform active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Enter Admin Console</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-2 flex flex-col items-center gap-2 border-t border-gray-100 dark:border-white/5">
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-emerald-600 dark:text-gray-400 dark:hover:text-emerald-400 transition-colors py-1 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Public Home</span>
          </button>
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            Authorized ADSA Canteen Committee Access Only
          </span>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
