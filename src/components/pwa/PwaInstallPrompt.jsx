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
  Monitor,
  Laptop,
  CheckCircle2,
  MoreVertical,
  ExternalLink,
  Copy,
  Compass,
} from 'lucide-react';
import {
  isStandaloneMode,
  isIOSSafari,
  detectOS,
  detectBrowser,
  isDesktopDevice,
  isGoogleGoBrowser,
  isInAppBrowser,
  getAndroidChromeIntentUrl,
  onInstallableChange,
  triggerNativeInstallPrompt,
  onUpdateAvailable,
  skipWaitingAndReload,
  openDesktopInstallModal,
} from '../../utils/pwaManager';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';
import { safeLocalStorage } from '../../utils/storage';
import { dialog } from '../../utils/dialog';
import DesktopInstallModal from './DesktopInstallModal';

const SNOOZE_STORAGE_KEY = 'adsa_pwa_install_snoozed_v2';
const SNOOZE_DURATION_MS = 5 * 24 * 60 * 60 * 1000; // 5 days

// Custom SVG Icons for OS Logos
function AppleMiniLogo({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 170 170" fill="currentColor">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.7-11.64-13.99-5.99-9.35-10.81-20.08-14.46-32.18-3.65-12.1-5.48-23.75-5.48-34.94 0-14.34 3.73-26.23 11.2-35.66 7.46-9.43 16.7-14.24 27.72-14.43 4.9 0 10.36 1.34 16.39 4.02 6.03 2.68 9.93 4.09 11.71 4.23 1.57-.14 5.75-1.68 12.54-4.63 6.79-2.95 12.63-4.18 17.51-3.69 13.43 1.05 24.16 6.53 32.2 16.44-11.89 7.24-17.72 17.2-17.51 29.89.21 10.05 4.09 18.47 11.64 25.26 7.55 6.79 16.44 10.53 26.68 11.22-2.12 6.78-4.68 13.56-7.69 20.34zM119.22 31.84c0-7.24 2.68-14.13 8.04-20.67 5.36-6.54 11.96-10.64 19.8-12.3 1.25 7.46-.73 14.54-5.93 21.24-5.2 6.7-11.89 10.74-20.07 12.11-.28-.13-1.84-.38-1.84-.38z" />
    </svg>
  );
}

function WindowsMiniLogo({ className = 'w-3.5 h-3.5' }) {
  return (
    <svg className={className} viewBox="0 0 88 88" fill="currentColor">
      <path d="M0 12.4L35.7 7.5v32.9H0V12.4zm35.7 32H0v28.1l35.7-4.9V44.4zm4.1-37.4L88 0v40.4H39.8V7zm48.2 37.4H39.8v33.4L88 88V44.4z" />
    </svg>
  );
}

export default function PwaInstallPrompt() {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();

  const [canInstall, setCanInstall] = useState(false);
  const [updateWaiting, setUpdateWaiting] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [showAndroidModal, setShowAndroidModal] = useState(false);
  const [isDismissed, setIsDismissed] = useState(true);

  const clientOS = detectOS();
  const isDesktop = isDesktopDevice();
  const isAndroid = clientOS === 'android';
  const isGoogleGo = isGoogleGoBrowser();
  const inApp = isInAppBrowser();

  // Check if standalone and snooze state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (isStandaloneMode()) {
      setIsDismissed(true);
      return;
    }

    const snoozedAt = safeLocalStorage.getItem(SNOOZE_STORAGE_KEY);
    if (snoozedAt) {
      const elapsed = Date.now() - Number(snoozedAt);
      if (elapsed < SNOOZE_DURATION_MS) {
        setIsDismissed(true);
        return;
      }
    }

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
    safeLocalStorage.setItem(SNOOZE_STORAGE_KEY, String(Date.now()));
  };

  const handleInstallClick = async () => {
    feedback('tick');
    if (isIOSSafari()) {
      setShowIOSModal(true);
      return;
    }

    if (canInstall) {
      const result = await triggerNativeInstallPrompt();
      if (result.outcome === 'accepted') {
        feedback('success');
        setIsDismissed(true);
        return;
      }
    }

    // If on Android and native prompt was unavailable (e.g. Google Go, In-App browser, low-RAM device)
    if (isAndroid) {
      setShowAndroidModal(true);
      return;
    }

    // If native prompt wasn't available or on desktop Safari / Firefox, open Desktop Hub Modal
    if (isDesktop) {
      openDesktopInstallModal(clientOS === 'macos' ? 'macos' : clientOS === 'windows' ? 'windows' : 'linux');
    }
  };

  const isIOS = isIOSSafari();
  const shouldShowBanner =
    !isDismissed && !isStandaloneMode() && (canInstall || isIOS || isAndroid || isDesktop) && !updateWaiting;

  // OS-specific label
  const getInstallLabel = () => {
    if (clientOS === 'macos') return lang === 'ml' ? 'മാക്കിൽ ഇൻസ്റ്റാൾ ചെയ്യുക' : 'Install for macOS';
    if (clientOS === 'windows') return lang === 'ml' ? 'വിൻഡോസിൽ ഇൻസ്റ്റാൾ ചെയ്യുക' : 'Install for Windows';
    if (clientOS === 'linux') return lang === 'ml' ? 'ലിനക്സിൽ ഇൻസ്റ്റാൾ ചെയ്യുക' : 'Install for Linux';
    if (isIOS || isAndroid) return lang === 'ml' ? 'ഹോം സ്ക്രീനിൽ ചേർക്കുക' : 'Add to Home Screen';
    return lang === 'ml' ? 'ഇൻസ്റ്റാൾ ചെയ്യുക' : 'Install App';
  };

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

      {/* 2. Floating PWA Install Banner (Adaptive Mobile & Desktop Bottom-Right Dock) */}
      <AnimatePresence>
        {shouldShowBanner && (
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed bottom-[calc(5.2rem+env(safe-area-inset-bottom,0px))] left-3 right-3 md:left-auto md:right-6 md:bottom-6 z-40 md:max-w-sm pointer-events-auto"
          >
            <div className="p-3 rounded-2xl bg-white/95 dark:bg-[#0c1412]/95 border border-emerald-500/30 dark:border-emerald-500/25 shadow-2xl backdrop-blur-2xl flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl p-1 bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                  <img
                    src="https://alathurpadiDars.in/wp-content/uploads/2019/08/Dars-Site-Logo1.png"
                    alt="Logo"
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs font-black text-gray-900 dark:text-white tracking-tight truncate">
                      {getInstallLabel()}
                    </p>
                    {isDesktop && (
                      <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[9px] font-mono font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                        PWA
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                    {isDesktop
                      ? 'Offline tokens, Dock badge & instant startup'
                      : lang === 'ml'
                      ? 'വേഗത്തിലുള്ള ഓഫ്‌ലൈൻ ആക്സസിന്'
                      : 'Fast, offline campus dining access'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-[11px] font-bold shadow-xs cursor-pointer flex items-center gap-1"
                >
                  {clientOS === 'macos' ? (
                    <AppleMiniLogo className="w-3 h-3" />
                  ) : clientOS === 'windows' ? (
                    <WindowsMiniLogo className="w-3 h-3" />
                  ) : (
                    <Download className="w-3 h-3" />
                  )}
                  <span>{lang === 'ml' ? 'ഇൻസ്റ്റാൾ' : 'Install'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleDismiss}
                  className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
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
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
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
                className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
              >
                Got It
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 4. Android "Add to Home Screen / Google Go" Visual Guide Sheet */}
      <AnimatePresence>
        {showAndroidModal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center p-0 pointer-events-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAndroidModal(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="relative w-full max-w-md rounded-t-[32px] bg-white dark:bg-[#0c1412] border-t border-gray-200 dark:border-white/10 p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] shadow-2xl z-10 space-y-4 max-h-[85vh] overflow-y-auto"
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
                      {lang === 'ml' ? 'ആൻഡ്രോയിഡിൽ ഇൻസ്റ്റാൾ ചെയ്യുക' : 'Install on Android'}
                    </h3>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {lang === 'ml'
                        ? 'ഹോം സ്ക്രീനിൽ ചേർത്ത് വേഗത്തിൽ ഉപയോഗിക്കുക'
                        : 'Add to Home Screen for fast, 1-tap dining access'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAndroidModal(false)}
                  className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Special Prompt for Google Go / In-App Browser users */}
              {(isGoogleGo || inApp) && (
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/25 space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Compass className="w-4 h-4 flex-shrink-0" />
                    <p className="text-xs font-bold">
                      {lang === 'ml'
                        ? 'ഗൂഗിൾ ഗോ / ഇൻ-ആപ്പ് ബ്രൗസർ കണ്ടെത്തി'
                        : 'Google Go / In-App Browser Detected'}
                    </p>
                  </div>
                  <p className="text-[11px] text-amber-800 dark:text-amber-200/90 leading-relaxed">
                    {lang === 'ml'
                      ? 'പൂർണ്ണമായ ഓഫ്‌ലൈൻ ആപ്പ് ഫീച്ചറുകൾക്കായി ഗൂഗിൾ ക്രോമിൽ തുറന്ന് ഇൻസ്റ്റാൾ ചെയ്യുക:'
                      : 'For full standalone PWA install & offline access, open this page in Google Chrome:'}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <a
                      href={getAndroidChromeIntentUrl()}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 shadow-sm active:scale-95"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>{lang === 'ml' ? 'ക്രോമിൽ തുറക്കുക' : 'Open in Chrome'}</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        if (typeof navigator !== 'undefined' && navigator.clipboard) {
                          navigator.clipboard.writeText(window.location.href);
                          dialog.toast.success('Link Copied', 'Paste into Google Chrome browser');
                        }
                      }}
                      className="py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 text-xs font-bold flex items-center gap-1 active:scale-95"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{lang === 'ml' ? 'കോപ്പി' : 'Copy'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Standard Android 3-dot Menu Steps */}
              <div className="space-y-3 py-1">
                <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    1
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      {lang === 'ml' ? (
                        <>മുകളിലെ <MoreVertical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline" /> മെനുവിൽ ക്ലിക്ക് ചെയ്യുക</>
                      ) : (
                        <>Tap the <MoreVertical className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 inline" /> menu (3 dots)</>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {lang === 'ml'
                        ? 'ബ്രൗസറിന്റെ മുകളിൽ വലതുഭാഗത്ത് കാണുന്ന മൂന്ന് ഡോട്ടുകളിൽ ടാപ്പ് ചെയ്യുക.'
                        : 'Located in the top-right corner of Chrome or your browser bar.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    2
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      {lang === 'ml' ? (
                        <>&quot;Install app&quot; അല്ലെങ്കിൽ &quot;Add to Home screen&quot; ടാപ്പ് ചെയ്യുക</>
                      ) : (
                        <>Tap &quot;Install app&quot; or &quot;Add to Home screen&quot;</>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {lang === 'ml'
                        ? 'മെനു ലിസ്റ്റിൽ താഴേക്ക് സ്ക്രോൾ ചെയ്ത് തിരഞ്ഞെടുക്കുക.'
                        : 'In the browser options dropdown list.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                  <div className="w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs flex-shrink-0">
                    3
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      {lang === 'ml' ? (
                        <>സ്ഥിരീകരിക്കാൻ <span className="font-extrabold text-emerald-600 dark:text-emerald-400">&quot;Install / Add&quot;</span> ക്ലിക്ക് ചെയ്യുക</>
                      ) : (
                        <>Confirm by tapping <span className="font-extrabold text-emerald-600 dark:text-emerald-400">&quot;Install&quot;</span> or <span className="font-extrabold text-emerald-600 dark:text-emerald-400">&quot;Add&quot;</span></>
                      )}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      {lang === 'ml'
                        ? 'നിമിഷങ്ങൾക്കകം ഫോണിന്റെ ഹോം സ്ക്രീനിൽ ADSA T-Board ആപ്പ് ലഭ്യമാകും.'
                        : 'The ADSA T-Board icon will appear instantly on your Android home screen.'}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAndroidModal(false)}
                className="w-full py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-98 cursor-pointer"
              >
                {lang === 'ml' ? 'മനസ്സിലായി' : 'Got It'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. Master Desktop App Hub Modal (Global Mounted) */}
      <DesktopInstallModal />
    </>
  );
}
