import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Monitor,
  Laptop,
  Download,
  X,
  Sparkles,
  CheckCircle2,
  Share2,
  PlusSquare,
  ShieldCheck,
  HardDrive,
  Bell,
  Activity,
  Terminal,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Layers,
  ArrowUpRight,
} from 'lucide-react';
import {
  detectOS,
  detectBrowser,
  getDisplayMode,
  isStandaloneMode,
  isDesktopDevice,
  triggerNativeInstallPrompt,
  canPromptNativeInstall,
  onInstallableChange,
  setDesktopBadge,
  clearDesktopBadge,
  requestPersistentStorage,
  checkPersistentStorage,
  onDesktopInstallModalState,
  closeDesktopInstallModal,
} from '../../utils/pwaManager';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { showLocalNotification } from '../../utils/webNotificationService';
import { dialog } from '../../utils/dialog';

// Custom SVG Icons for OS Logos
function AppleLogoIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 170 170" fill="currentColor">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.58-7.7-11.64-13.99-5.99-9.35-10.81-20.08-14.46-32.18-3.65-12.1-5.48-23.75-5.48-34.94 0-14.34 3.73-26.23 11.2-35.66 7.46-9.43 16.7-14.24 27.72-14.43 4.9 0 10.36 1.34 16.39 4.02 6.03 2.68 9.93 4.09 11.71 4.23 1.57-.14 5.75-1.68 12.54-4.63 6.79-2.95 12.63-4.18 17.51-3.69 13.43 1.05 24.16 6.53 32.2 16.44-11.89 7.24-17.72 17.2-17.51 29.89.21 10.05 4.09 18.47 11.64 25.26 7.55 6.79 16.44 10.53 26.68 11.22-2.12 6.78-4.68 13.56-7.69 20.34zM119.22 31.84c0-7.24 2.68-14.13 8.04-20.67 5.36-6.54 11.96-10.64 19.8-12.3 1.25 7.46-.73 14.54-5.93 21.24-5.2 6.7-11.89 10.74-20.07 12.11-.28-.13-1.84-.38-1.84-.38z" />
    </svg>
  );
}

function WindowsLogoIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 88 88" fill="currentColor">
      <path d="M0 12.4L35.7 7.5v32.9H0V12.4zm35.7 32H0v28.1l35.7-4.9V44.4zm4.1-37.4L88 0v40.4H39.8V7zm48.2 37.4H39.8v33.4L88 88V44.4z" />
    </svg>
  );
}

function LinuxLogoIcon({ className = 'w-4 h-4' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C9.24 2 7 4.24 7 7c0 1.2.42 2.3 1.13 3.16C6.83 11.26 6 12.98 6 15c0 1.95.84 3.5 2.1 4.5-.06.27-.1.55-.1.83 0 1.48 1.44 2.67 3.2 2.67.75 0 1.43-.22 1.95-.6.28.06.57.1.85.1s.57-.04.85-.1c.52.38 1.2.6 1.95.6 1.76 0 3.2-1.19 3.2-2.67 0-.28-.04-.56-.1-.83 1.26-1 2.1-2.55 2.1-4.5 0-2.02-.83-3.74-2.13-4.84C20.58 9.3 21 8.2 21 7c0-2.76-2.24-5-5-5-1.15 0-2.21.39-3.05 1.05C12.63 2.39 12.32 2 12 2zm-1.5 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2zm5 0a1 1 0 1 1 0-2 1 1 0 0 1 0 2z" />
    </svg>
  );
}

export default function DesktopInstallModal({ isOpen: controlledIsOpen, onClose: controlledOnClose }) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('auto');
  const [canInstall, setCanInstall] = useState(false);
  const [badgeCount, setBadgeCount] = useState(1);
  const [storagePersisted, setStoragePersisted] = useState(false);
  const [installing, setInstalling] = useState(false);

  // Auto-detect OS and Browser
  const detectedOS = detectOS();
  const detectedBrowser = detectBrowser();
  const currentDisplayMode = getDisplayMode();
  const isInstalled = isStandaloneMode();

  // Listen to global open/close broadcasts
  useEffect(() => {
    const unsub = onDesktopInstallModalState((openState, requestedTab) => {
      setIsOpen(openState);
      if (requestedTab) {
        setActiveTab(requestedTab);
      } else {
        // Set default tab based on detected OS
        if (detectedOS === 'macos') setActiveTab('macos');
        else if (detectedOS === 'windows') setActiveTab('windows');
        else if (detectedOS === 'linux') setActiveTab('linux');
        else setActiveTab('tools');
      }
    });
    return unsub;
  }, [detectedOS]);

  // Sync controlled props if provided
  useEffect(() => {
    if (typeof controlledIsOpen === 'boolean') {
      setIsOpen(controlledIsOpen);
      if (controlledIsOpen) {
        if (detectedOS === 'macos') setActiveTab('macos');
        else if (detectedOS === 'windows') setActiveTab('windows');
        else if (detectedOS === 'linux') setActiveTab('linux');
        else setActiveTab('tools');
      }
    }
  }, [controlledIsOpen, detectedOS]);

  // Check installability & storage status
  useEffect(() => {
    const unsub = onInstallableChange((installable) => {
      setCanInstall(installable);
    });

    checkPersistentStorage().then((persisted) => {
      setStoragePersisted(persisted);
    });

    return unsub;
  }, []);

  const handleClose = () => {
    feedback('tick');
    if (controlledOnClose) {
      controlledOnClose();
    } else {
      closeDesktopInstallModal();
      setIsOpen(false);
    }
  };

  const handleNativeInstall = async () => {
    feedback('tick');
    setInstalling(true);
    try {
      const result = await triggerNativeInstallPrompt();
      if (result.outcome === 'accepted') {
        feedback('success');
        dialog.toast.success(
          language === 'ml' ? 'ഇൻസ്റ്റാളേഷൻ പൂർത്തിയായി' : 'App Installed Successfully',
          language === 'ml'
            ? 'ADSA T-Board നിങ്ങളുടെ ഡെസ്ക്ടോപ്പിൽ ഇൻസ്റ്റാൾ ചെയ്തു.'
            : 'ADSA T-Board is now installed on your desktop. Launch it anytime from your Dock / Start Menu.'
        );
        handleClose();
      }
    } finally {
      setInstalling(false);
    }
  };

  const handleRequestStorage = async () => {
    feedback('tick');
    const result = await requestPersistentStorage();
    setStoragePersisted(result.persisted);
    if (result.persisted) {
      feedback('success');
      dialog.toast.success(
        'Storage Persisted',
        'ADSA T-Board cache and offline token state are now protected from OS disk cleanups.'
      );
    } else {
      dialog.toast.info('Storage Status', 'Browser default quota applies. Persisted storage request was not granted.');
    }
  };

  const handleTestBadge = async () => {
    feedback('pop');
    const next = badgeCount + 1;
    setBadgeCount(next);
    await setDesktopBadge(next);
    dialog.toast.info('Dock/Taskbar Badge Updated', `Set desktop app badge counter to ${next}. Look at your Dock/Taskbar icon.`);
  };

  const handleClearBadge = async () => {
    feedback('tick');
    setBadgeCount(0);
    await clearDesktopBadge();
    dialog.toast.info('Badge Cleared', 'Desktop badge count has been cleared.');
  };

  const handleTestNotification = async () => {
    feedback('pop');
    await showLocalNotification('ADSA T-Board • Desktop Test', {
      body: 'Campus lunch tokens are ready. Native desktop notifications are working seamlessly!',
      tag: 'adsa-desktop-test',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
      />

      {/* Modal Dialog Card */}
      <motion.div
        initial={{ scale: 0.94, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.94, opacity: 0, y: 20 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative w-full max-w-3xl rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200 dark:border-white/10 shadow-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header Hero Banner */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-emerald-600 via-teal-700 to-emerald-950 text-white overflow-hidden flex-shrink-0">
          {/* Subtle geometric circles */}
          <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute left-1/2 -top-12 w-60 h-60 rounded-full bg-emerald-400/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 p-2 shadow-inner flex items-center justify-center flex-shrink-0">
                <img
                  src="https://alathurpadiDars.in/wp-content/uploads/2019/08/Dars-Site-Logo1.png"
                  alt="ADSA Logo"
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                    ADSA T-Board for Desktop
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-white/20 text-emerald-100 border border-white/20">
                    v2.5.0
                  </span>
                </div>
                <p className="text-xs text-emerald-100/90 mt-0.5 font-medium">
                  {language === 'ml'
                    ? 'വിൻഡോസ്, മാക്, ലിനക്സ് എന്നിവയ്ക്കായുള്ള ഹൈ-പെർഫോമൻസ് ആപ്ലിക്കേഷൻ'
                    : 'Native-grade desktop experience for Windows, macOS, & Linux with zero Electron bloat.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* OS Environment Badge */}
          <div className="mt-4 pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-emerald-200 font-medium">Your Environment:</span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/25 backdrop-blur-md border border-white/10 text-white font-mono font-bold text-[11px]">
                {detectedOS === 'macos' && <AppleLogoIcon className="w-3.5 h-3.5 text-white" />}
                {detectedOS === 'windows' && <WindowsLogoIcon className="w-3.5 h-3.5 text-cyan-300" />}
                {detectedOS === 'linux' && <LinuxLogoIcon className="w-3.5 h-3.5 text-amber-300" />}
                <span className="capitalize">{detectedOS}</span>
                <span className="text-white/40">•</span>
                <span className="capitalize">{detectedBrowser}</span>
              </span>
            </div>

            {/* Current Display Status */}
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-100">
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
              <span>
                {isInstalled
                  ? `Active in ${currentDisplayMode} mode`
                  : 'Running in Web Browser mode'}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 border-b border-gray-200 dark:border-white/10 flex items-center gap-2 overflow-x-auto bg-gray-50/60 dark:bg-black/20 flex-shrink-0">
          {[
            { id: 'macos', label: 'macOS', icon: AppleLogoIcon },
            { id: 'windows', label: 'Windows', icon: WindowsLogoIcon },
            { id: 'linux', label: 'Linux', icon: LinuxLogoIcon },
            { id: 'tools', label: 'App Tools & Diagnostics', icon: Activity },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => {
                  feedback('tick');
                  setActiveTab(tab.id);
                }}
                className={`relative px-3.5 py-2.5 text-xs font-bold transition-all flex items-center gap-2 border-b-2 cursor-pointer flex-shrink-0 ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 border-emerald-500'
                    : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{tab.label}</span>
                {detectedOS === tab.id && (
                  <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-wider">
                    Auto
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Body Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-gray-800 dark:text-gray-200">
          {/* TAB 1: macOS Guide */}
          {activeTab === 'macos' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                    <AppleLogoIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white">
                      Install on macOS (Sonoma, Sequoia & Ventura)
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Independent window, Spotlight (⌘Space) search, Dock badge & offline access.
                    </p>
                  </div>
                </div>

                {canInstall && (
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    disabled={installing}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer flex-shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>{installing ? 'Installing...' : 'Install 1-Click'}</span>
                  </button>
                )}
              </div>

              {/* Instructions split: Safari vs Chrome/Edge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Method A: Safari on macOS Sonoma 14+ */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Option A: Safari (Sonoma 14+)
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">Native Web App</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Open &quot;File&quot; menu</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          In Safari&apos;s top macOS menu bar (or click the Share button).
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Select &quot;Add to Dock...&quot;</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Confirm the app title &quot;ADSA T-Board&quot; and click Add.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Launch from Dock</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Runs in its own clean window without browser tabs or address bar.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Method B: Chrome / Edge / Brave on macOS */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                      Option B: Chrome / Edge / Brave
                    </span>
                    <span className="text-[10px] font-mono text-gray-400">Desktop PWA</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                        1
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Click Install in Address Bar</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Look for the small <Download className="w-3 h-3 inline text-emerald-500" /> icon on the right side of the URL bar.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                        2
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Confirm &quot;Install App&quot;</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          A native install dialog opens with full screenshot previews.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-[11px] flex-shrink-0 mt-0.5">
                        3
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-white">Pin to macOS Dock</p>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400">
                          Right-click running app in Dock $\to$ Options $\to$ Keep in Dock.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Windows Guide */}
          {activeTab === 'windows' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-cyan-500/10 dark:bg-cyan-950/30 border border-cyan-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400">
                    <WindowsLogoIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white">
                      Install on Windows 11 & Windows 10
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Window Controls Overlay, Start Menu integration, Taskbar pinning & startup on boot.
                    </p>
                  </div>
                </div>

                {canInstall && (
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    disabled={installing}
                    className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer flex-shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>{installing ? 'Installing...' : 'Install on Windows'}</span>
                  </button>
                )}
              </div>

              {/* Windows 3-Step Walkthrough */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">Omnibox Install</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    In Edge or Chrome, click the &quot;App Available&quot; button in the address bar, or click the Install button above.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">Pin to Taskbar & Start</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    When prompted after installation, check &quot;Pin to taskbar&quot; and &quot;Pin to Start&quot; for instant access.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-2">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">Auto-Start on Login</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    In Edge App Settings ($\dots \to$ App settings), toggle &quot;Start app when you sign in&quot; to auto-launch ADSA T-Board.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Linux Guide */}
          {activeTab === 'linux' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-950/30 border border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                    <LinuxLogoIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white">
                      Install on Linux (Ubuntu, Debian, Fedora, Arch)
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Standard XDG `.desktop` launcher, Wayland / X11 multi-window, and zero root permissions required.
                    </p>
                  </div>
                </div>

                {canInstall && (
                  <button
                    type="button"
                    onClick={handleNativeInstall}
                    disabled={installing}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white text-xs font-black shadow-md transition-all flex items-center gap-2 cursor-pointer flex-shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    <span>{installing ? 'Installing...' : 'Install on Linux'}</span>
                  </button>
                )}
              </div>

              {/* Linux Walkthrough */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">Chromium / Chrome Menu</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Click the URL bar install icon or browser menu ($\vdots$) $\to$ &quot;Save and share&quot; $\to$ &quot;Install ADSA T-Board&quot;.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">Desktop Entry Created</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    A `.desktop` file is automatically generated in `~/.local/share/applications/` matching GNOME / KDE / XFCE specs.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-2">
                  <div className="w-6 h-6 rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">Pin to Favorites / Dock</h4>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    Search &quot;ADSA T-Board&quot; in your application launcher and right-click $\to$ &quot;Add to Favorites&quot;.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Tools & Diagnostics */}
          {activeTab === 'tools' && (
            <div className="space-y-5">
              {/* Telemetry Matrix */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-emerald-500" />
                    <span>Desktop Runtime Telemetry</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                    PWA Engine Ready
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-gray-200/50 dark:border-white/5">
                    <span className="text-[10px] text-gray-400 block mb-0.5">Operating System</span>
                    <span className="font-bold text-gray-900 dark:text-white capitalize">{detectedOS}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-gray-200/50 dark:border-white/5">
                    <span className="text-[10px] text-gray-400 block mb-0.5">Browser Engine</span>
                    <span className="font-bold text-gray-900 dark:text-white capitalize">{detectedBrowser}</span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-gray-200/50 dark:border-white/5">
                    <span className="text-[10px] text-gray-400 block mb-0.5">Display Mode</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">
                      {currentDisplayMode}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-gray-200/50 dark:border-white/5">
                    <span className="text-[10px] text-gray-400 block mb-0.5">Storage Persistence</span>
                    <span
                      className={`font-bold ${
                        storagePersisted ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                      }`}
                    >
                      {storagePersisted ? 'Protected' : 'Volatile'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Interactive Test Action Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. Storage Persistence Request */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <HardDrive className="w-4 h-4 text-emerald-500" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">Persistent Storage</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Protects offline tokens and manifest documents from OS storage eviction.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRequestStorage}
                    className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    {storagePersisted ? 'Storage Protected ✓' : 'Request Persistence'}
                  </button>
                </div>

                {/* 2. Desktop Badge Test */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Activity className="w-4 h-4 text-teal-500" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">Taskbar / Dock Badge</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Syncs active unserved dining tokens with your native desktop dock badge.
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handleTestBadge}
                      className="flex-1 py-1.5 px-2 rounded-xl bg-teal-600 hover:bg-teal-500 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                    >
                      Badge (+1)
                    </button>
                    <button
                      type="button"
                      onClick={handleClearBadge}
                      className="py-1.5 px-2.5 rounded-xl bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                {/* 3. Desktop Notification Test */}
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex flex-col justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Bell className="w-4 h-4 text-purple-500" />
                      <span className="text-xs font-bold text-gray-900 dark:text-white">System Notification</span>
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">
                      Dispatches a test notification to Windows Action Center / macOS Notifications.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestNotification}
                    className="w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 active:scale-95 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    Test Notification
                  </button>
                </div>
              </div>

              {/* Keyboard HUD reference */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-2">
                <span className="text-xs font-bold text-gray-900 dark:text-white block">
                  Desktop Keyboard Shortcuts
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-black/30 border border-gray-200/60 dark:border-white/5">
                    <span>Quick Command Search</span>
                    <kbd className="font-mono font-bold text-emerald-600 dark:text-emerald-400">⌘K</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-black/30 border border-gray-200/60 dark:border-white/5">
                    <span>Save Preferences</span>
                    <kbd className="font-mono font-bold text-emerald-600 dark:text-emerald-400">⌘S</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-black/30 border border-gray-200/60 dark:border-white/5">
                    <span>Toggle Left Sidebar</span>
                    <kbd className="font-mono font-bold text-emerald-600 dark:text-emerald-400">⌘B</kbd>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-black/30 border border-gray-200/60 dark:border-white/5">
                    <span>Dismiss Popovers</span>
                    <kbd className="font-mono font-bold text-emerald-600 dark:text-emerald-400">Esc</kbd>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 bg-gray-50 dark:bg-black/30 border-t border-gray-200 dark:border-white/10 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>Encrypted • Zero telemetry data stored</span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/20 text-gray-800 dark:text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
