import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Share2,
  PlusSquare,
  X,
  Sparkles,
  RefreshCw,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';
import {
  isStandaloneMode,
  isIOSSafari,
  onInstallableChange,
  triggerNativeInstallPrompt,
  onUpdateAvailable,
  skipWaitingAndReload,
} from '../../utils/pwaManager';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';

const SNOOZE_STORAGE_KEY = 'adsa_pwa_install_snoozed_v1';
const SNOOZE_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

export default function PwaInstallPrompt() {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();

  const [canInstall, setCanInstall] = useState(false);
  const [updateWaiting, setUpdateWaiting] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  // Check if standalone and snooze state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isStandaloneMode()) {
      setIsDismissed(true);
      return;
    }

    try {
      const snoozedAt = localStorage.getItem(SNOOZE_STORAGE_KEY);
      if (snoozedAt) {
        const elapsed = Date.now() - Number(snoozedAt);
        if (elapsed < SNOOZE_DURATION_MS) {
          setIsDismissed(true);
          return;
        }
      }
    } catch (_) {}

    // Allow displaying prompt
    setIsDismissed(false);
  }, []);

  // Listen to PWA installable and update availability
  useEffect(() => {
    const unsubInstall = onInstallableChange((installable) => {
      setCanInstall(installable);
    });

    const unsubUpdate = onUpdateAvailable(() => {
      setUpdateWaiting(true);
      feedback('pop');
    });

    return () => {
      unsubInstall();
      unsubUpdate();
    };
  }, [feedback]);

  const handleDismiss = () => {
    feedback('tick');
    setIsDismissed(true);
    try {
      localStorage.setItem(SNOOZE_STORAGE_KEY, String(Date.now()));
    } catch (_) {}
  };

  const handleInstallClick = async () => {
    feedback('tick');
    if (isIOSSafari()) {
      setShowIOSModal(true);
    } else {
      const result = await triggerNativeInstallPrompt();
      if (result.outcome === 'accepted') {
        feedback('success');
        setIsDismissed(true);
      }
    }
  };

  const isIOS = isIOSSafari();
  const shouldShowBanner =
    !isDismissed && !isStandaloneMode() && (canInstall || isIOS) && !updateWaiting;

  return (
    <>
      {/* 1. App Update Available Persistent Banner */}
      <AnimatePresence>
        {updateWaiting && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-4 right-4 md:left-auto md:right-6 md:bottom-6 z-50 max-w-md pointer-events-auto"
          >
            <div className="p-3.5 rounded-2xl bg-emerald-950/95 dark:bg-emerald-950/95 border border-emerald-500/40 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-white">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 flex-shrink-0 animate-spin">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black tracking-tight truncate">
                    {lang === 'ml' ? 'പുതിയ വേർഷൻ ലഭ്യമാണ്' : 'New Version Available'}
                  </p>
                  <p className="text-[10.5px] text-emerald-200/80 truncate">
                    {lang === 'ml' ? 'റീലോഡ് ചെയ്തു വേർഷൻ അപ്ഡേറ്റ് ചെയ്യുക' : 'Reload to activate latest updates'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  feedback('success');
                  skipWaitingAndReload();
                }}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 text-xs font-black shadow-md cursor-pointer flex-shrink-0"
              >
                {lang === 'ml' ? 'റീലോഡ്' : 'Reload'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. Floating PWA Install Banner */}
      <AnimatePresence>
        {shouldShowBanner && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed bottom-[calc(5.2rem+env(safe-area-inset-bottom,0px))] left-3 right-3 md:hidden z-40 pointer-events-auto"
          >
            <div className="p-2.5 rounded-2xl bg-white/95 dark:bg-[#0c1412]/95 border border-emerald-500/30 dark:border-emerald-500/25 shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl p-0.5 bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <img
                    src="https://alathurpadiDars.in/wp-content/uploads/2019/08/Dars-Site-Logo1.png"
                    alt="Logo"
                    className="w-5 h-5 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900 dark:text-white tracking-tight truncate">
                    {lang === 'ml' ? 'ഹോം സ്ക്രീനിൽ ചേർക്കുക' : 'Install ADSA T-Board'}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    {lang === 'ml' ? 'വേഗത്തിലുള്ള ഓഫ്‌ലൈൻ ആക്സസിന്' : 'Fast, offline campus dining access'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[11px] font-bold shadow-xs cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3 h-3" />
                  <span>{lang === 'ml' ? 'ഇൻസ്റ്റാൾ' : 'Install'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  aria-label="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. iOS Safari "Add to Home Screen" Visual Guide Sheet */}
      <AnimatePresence>
        {showIOSModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowIOSModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full max-w-md rounded-t-[32px] bg-white dark:bg-[#0c1412] border-t border-gray-200 dark:border-white/10 p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl z-10 space-y-4"
            >
              {/* Drag Handle Pill */}
              <div className="w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20 mx-auto" />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white">
                      Install on iPhone / iPad
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Add to Home Screen for fullscreen & offline access
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowIOSModal(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Steps list */}
              <div className="space-y-3 py-1">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    1
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      Tap the <Share2 className="w-3.5 h-3.5 text-blue-500 inline" /> Share button
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Located in Safari&apos;s bottom toolbar (or top bar on iPad).
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    2
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      Scroll down & tap <PlusSquare className="w-3.5 h-3.5 text-emerald-500 inline" /> &quot;Add to Home Screen&quot;
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      In the action sheet options menu.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    3
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      Tap <span className="font-extrabold text-blue-500">&quot;Add&quot;</span> in top-right
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      ADSA T-Board app icon will appear instantly on your home screen.
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSModal(false)}
                className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-98"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
