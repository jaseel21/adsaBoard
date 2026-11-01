import React, { useContext, useEffect, useCallback, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, ShieldAlert, LogOut, RefreshCw, Tablet, Laptop, Smartphone, Tv } from 'lucide-react';
import { DataOfOne } from '../../store/StudentData';
import { AuthContext } from '../../store/AuthContext';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { dialog } from '../../utils/dialog';
import { liveSyncManager } from '../../utils/liveSyncManager';
import { useIdleGuard } from '../../hooks/useIdleGuard';

/**
 * Campus Kiosk Idle Guard Global HUD (KioskGuard 2.0)
 * Mounted at application root to enforce device-aware timeout protection across all routes.
 */
export default function CampusKioskGuardHUD() {
  const { stdata, logoutStudent } = useContext(DataOfOne);
  const { user } = useContext(AuthContext);
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();
  const location = useLocation();
  const navigate = useNavigate();

  const handleTimeout = useCallback(() => {
    if (stdata) {
      if (logoutStudent) logoutStudent();
      soundEngine.playCautionThud();
      hapticEngine.warningBuzz();
      liveSyncManager.broadcast('SESSION_PURGE');
      window.dispatchEvent(new CustomEvent('adsa:session_purged'));

      dialog.toast.info(
        t('sessionExpired', 'Session Expired'),
        t('sessionExpiredStudent', 'Student session concluded automatically to protect shared campus terminals.')
      );

      if (location.pathname === '/student' || location.pathname === '/student-portal') {
        navigate('/', { replace: true });
      }
    }
  }, [stdata, logoutStudent, t, location.pathname, navigate]);

  const handleWarningStart = useCallback(({ remainingSeconds, activeConfig }) => {
    if (activeConfig?.soundAlerts) {
      soundEngine.playSoftChime();
    }
    hapticEngine.warningBuzz();
  }, []);

  const handleCountdownTick = useCallback((sec) => {
    if (sec <= 5) {
      soundEngine.playMechanicalClick();
      hapticEngine.lightTap();
    }
  }, []);

  const isGuardActive = Boolean(stdata?.tokenNo && !user);

  const {
    isWarning,
    remainingSeconds,
    resetTimer,
    triggerTimeout,
    activeConfig,
  } = useIdleGuard({
    onTimeout: handleTimeout,
    onWarning: handleWarningStart,
    onTick: handleCountdownTick,
    enabled: isGuardActive,
  });

  // Hotkey listener (Space / Enter to stay logged in, Esc to exit)
  useEffect(() => {
    if (!isWarning) return;

    const handleKeyDown = (e) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        feedback('success');
        resetTimer(true);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        triggerTimeout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWarning, resetTimer, triggerTimeout, feedback]);

  // Compute SVG radial progress
  const warningWindowTotalSec = Math.max(1, Math.ceil(activeConfig.warningMs / 1000));
  const progressRatio = Math.max(0, Math.min(1, remainingSeconds / warningWindowTotalSec));
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);
  const isUrgent = remainingSeconds <= 5;

  const PersonaIcon = useMemo(() => {
    switch (activeConfig?.persona) {
      case 'kitchen_wallboard':
        return Tv;
      case 'personal_mobile':
        return Smartphone;
      case 'admin_workstation':
        return Laptop;
      default:
        return Tablet;
    }
  }, [activeConfig?.persona]);

  return (
    <AnimatePresence>
      {isWarning && isGuardActive && (
        <div
          onClick={() => {
            feedback('tick');
            resetTimer(true);
          }}
          className="fixed inset-0 z-[140] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md cursor-pointer select-none"
        >
          <motion.div
            onClick={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`w-full max-w-sm rounded-3xl bg-white dark:bg-[#0c1412] border p-6 shadow-2xl text-center space-y-5 relative overflow-hidden transition-colors ${
              isUrgent
                ? 'border-rose-400 dark:border-rose-500/50 shadow-rose-500/10'
                : 'border-amber-300 dark:border-amber-500/40 shadow-amber-500/10'
            }`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="kiosk-guard-title"
            aria-describedby="kiosk-guard-desc"
          >
            {/* Ambient Background Glow */}
            <div
              className={`absolute -top-16 -right-16 w-32 h-32 rounded-full blur-3xl pointer-events-none transition-colors ${
                isUrgent ? 'bg-rose-500/20' : 'bg-amber-500/20'
              }`}
            />

            {/* Device Identity Header Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[10px] font-bold text-gray-600 dark:text-gray-300">
              <PersonaIcon className="w-3.5 h-3.5 text-emerald-500" />
              <span>{activeConfig.deviceName || 'Campus Kiosk Terminal'}</span>
              {activeConfig.isRemoteOverride && (
                <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 font-extrabold text-[9px]">
                  POLICY OVERRIDE
                </span>
              )}
            </div>

            {/* Radial Countdown Ring */}
            <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  className="text-gray-200 dark:text-white/10"
                  fill="transparent"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  stroke="currentColor"
                  strokeWidth="6"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className={`transition-all duration-1000 ease-linear ${
                    isUrgent ? 'text-rose-500' : 'text-amber-500'
                  }`}
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className={`text-3xl font-mono font-black tracking-tight ${
                    isUrgent ? 'text-rose-600 dark:text-rose-400 animate-pulse' : 'text-amber-500'
                  }`}
                >
                  {remainingSeconds}
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">
                  {language === 'ml' ? 'സെക്കന്റ്' : 'seconds'}
                </span>
              </div>
            </div>

            {/* Warning Message */}
            <div className="space-y-1.5">
              <h3 id="kiosk-guard-title" className="text-base font-extrabold text-gray-900 dark:text-white flex items-center justify-center gap-1.5">
                <ShieldAlert className={`w-4 h-4 ${isUrgent ? 'text-rose-500' : 'text-amber-500'}`} />
                <span>
                  {language === 'ml'
                    ? 'സെഷൻ സംരക്ഷണം'
                    : t('publicComputerSafety', 'Still here? (Public Computer Safety)')}
                </span>
              </h3>
              <p id="kiosk-guard-desc" className="text-xs text-gray-600 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">
                {language === 'ml'
                  ? 'മറ്റുള്ളവർ ടോക്കൺ വിവരങ്ങൾ കാണാതിരിക്കാൻ ഈ പൊതു കമ്പ്യൂട്ടറിലെ സെഷൻ ഓട്ടോമാറ്റിക്കായി ക്ലോസ് ചെയ്യപ്പെടും.'
                  : t('publicComputerWarning', 'To protect your token on this public computer, your session will automatically log out.')}
              </p>
            </div>

            {/* Interactive Control Buttons */}
            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  feedback('success');
                  resetTimer(true);
                }}
                className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/20 hover:from-emerald-500 hover:to-green-500 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{language === 'ml' ? 'തുടരുക' : t('stayLoggedIn', 'Stay Logged In')}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  triggerTimeout();
                }}
                className="py-3 px-4 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 font-bold text-xs active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>{language === 'ml' ? 'ഇറങ്ങുക' : t('exitNow', 'Exit Now')}</span>
              </button>
            </div>

            {/* Quick hotkey prompt */}
            <div className="text-[10px] text-gray-400 font-medium">
              {language === 'ml' ? 'തുടരാൻ Spacebar ക്ലിക്ക് ചെയ്യാം' : 'Press Spacebar or tap anywhere to continue'}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
