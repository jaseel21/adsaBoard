import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Terminal,
  Activity,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  HeartHandshake,
  BookOpen,
  Monitor,
  Laptop,
  Download,
  HardDrive,
  Bell,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import {
  detectOS,
  detectBrowser,
  getDisplayMode,
  isStandaloneMode,
  openDesktopInstallModal,
  checkPersistentStorage,
  requestPersistentStorage,
  setDesktopBadge,
  clearDesktopBadge,
} from '../../../utils/pwaManager';
import { dialog } from '../../../utils/dialog';

export default function HelpDiagnosticsSection() {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  const isWebAudioSupported = typeof window !== 'undefined' && Boolean(window.AudioContext || window.webkitAudioContext);
  const isVibrationSupported = typeof navigator !== 'undefined' && 'vibrate' in navigator;
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  const [persistedStorage, setPersistedStorage] = useState(false);
  const detectedOS = detectOS();
  const detectedBrowser = detectBrowser();
  const displayMode = getDisplayMode();
  const isInstalled = isStandaloneMode();

  useEffect(() => {
    checkPersistentStorage().then((status) => {
      setPersistedStorage(status);
    });
  }, []);

  const handleRequestStorage = async () => {
    feedback('tick');
    const result = await requestPersistentStorage();
    setPersistedStorage(result.persisted);
    if (result.persisted) {
      dialog.toast.success('Storage Protected', 'Persistent offline storage granted for token data and manifests.');
    } else {
      dialog.toast.info('Storage Status', 'Standard browser quota active.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-3 border-b border-gray-200/80 dark:border-white/10">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-emerald-500" />
          <span>{language === 'ml' ? 'സഹായം & സിസ്റ്റം വിവരങ്ങൾ' : 'Help, Diagnostics & About'}</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ml'
            ? 'കീബോർഡ് ഷോർട്ട്കട്ടുകൾ, സിസ്റ്റം ഹെൽത്ത് ചെക്കപ്പ്, വേർഷൻ വിവരങ്ങൾ'
            : 'Keyboard mastery HUD, desktop PWA suite, runtime client telemetry, and institutional documentation'}
        </p>
      </div>

      {/* 1. Desktop Application & PWA Suite */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent backdrop-blur-xl border border-emerald-500/25 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex-shrink-0">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <span>ADSA T-Board Desktop Edition</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {isInstalled ? 'Installed App' : 'Web Client'}
                </span>
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isInstalled
                  ? `Active in ${displayMode} mode on ${detectedOS} (${detectedBrowser})`
                  : `Optimized for Windows, macOS, & Linux with zero Electron overhead`}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              feedback('tick');
              openDesktopInstallModal();
            }}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer flex-shrink-0"
          >
            {isInstalled ? <Activity className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
            <span>{isInstalled ? 'Desktop Tools Hub' : 'Install Desktop App'}</span>
          </button>
        </div>

        {/* Runtime Diagnostics Mini-Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-gray-200/60 dark:border-white/5">
            <span className="text-[10px] text-gray-400 block mb-0.5">Operating System</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">{detectedOS}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-gray-200/60 dark:border-white/5">
            <span className="text-[10px] text-gray-400 block mb-0.5">Browser Engine</span>
            <span className="font-bold text-gray-800 dark:text-gray-200 capitalize">{detectedBrowser}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-gray-200/60 dark:border-white/5">
            <span className="text-[10px] text-gray-400 block mb-0.5">Display Mode</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 capitalize">{displayMode}</span>
          </div>

          <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-gray-200/60 dark:border-white/5 flex items-center justify-between">
            <div>
              <span className="text-[10px] text-gray-400 block mb-0.5">Storage Lock</span>
              <span className={`font-bold ${persistedStorage ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`}>
                {persistedStorage ? 'Protected' : 'Standard'}
              </span>
            </div>
            {!persistedStorage && (
              <button
                type="button"
                onClick={handleRequestStorage}
                className="text-[10px] font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                Protect
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Keyboard Navigation HUD */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
            {language === 'ml' ? 'കീബോർഡ് ഷോർട്ട്കട്ടുകൾ (Keyboard HUD)' : 'Keyboard Navigation Shortcuts'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {[
            { keys: ['⌘', 'K'], descEn: 'Open Global Quick Command Search', descMl: 'സെർച്ച് കൺസോൾ തുറക്കുക' },
            { keys: ['⌘', 'S'], descEn: 'Instantly Save Pending Preferences', descMl: 'മാറ്റങ്ങൾ ഉടൻ സേവ് ചെയ്യുക' },
            { keys: ['⌘', 'B'], descEn: 'Toggle Desktop Left Navigation Sidebar', descMl: 'സൈഡ്‌ബാർ ടോഗിൾ ചെയ്യുക' },
            { keys: ['Esc'], descEn: 'Dismiss Modals, Menus & Popovers', descMl: 'മോഡലുകൾ ക്ലോസ് ചെയ്യുക' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 flex items-center justify-between"
            >
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                {language === 'ml' ? item.descMl : item.descEn}
              </span>
              <div className="flex items-center gap-1">
                {item.keys.map((k) => (
                  <kbd
                    key={k}
                    className="px-2 py-0.5 rounded-lg bg-white dark:bg-[#1c2824] border border-gray-300 dark:border-white/10 shadow-xs font-mono font-bold text-[11px] text-gray-800 dark:text-emerald-400"
                  >
                    {k}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Client Runtime Health Radar */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
              {language === 'ml' ? 'സിസ്റ്റം ഡയഗ്നോസ്റ്റിക്സ്' : 'Client Runtime Diagnostics'}
            </span>
          </div>
          <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            All Systems Operational
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[10px] text-gray-400 block mb-0.5">Network Connectivity</span>
            <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
              {isOnline ? 'Online (IST Synced)' : 'Offline Cache'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[10px] text-gray-400 block mb-0.5">Web Audio Synthesizer</span>
            <span className="font-extrabold text-teal-600 dark:text-teal-400">
              {isWebAudioSupported ? 'Active (Low Latency)' : 'Unsupported'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[10px] text-gray-400 block mb-0.5">Haptic Touch Motor</span>
            <span className="font-extrabold text-purple-600 dark:text-purple-400">
              {isVibrationSupported ? 'Supported' : 'Standard Mouse'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[10px] text-gray-400 block mb-0.5">Application Build</span>
            <span className="font-mono font-bold text-gray-800 dark:text-gray-200">v2.5.0-prod</span>
          </div>
        </div>
      </div>

      {/* 4. Institutional Links & Accreditation */}
      <div className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 border border-emerald-500/15 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Alathurpadi Dars Students Association
          </span>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 max-w-md">
            ADSA T-Board Dining & Mess Management System. Built for spiritual dignity, sacred dining adab, and community care.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/adab"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#16221e] hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <BookOpen className="w-3.5 h-3.5 text-emerald-500" />
            <span>Dining Ethics</span>
          </Link>
          <Link
            to="/support"
            className="px-3 py-2 rounded-xl text-xs font-bold bg-white dark:bg-[#16221e] hover:bg-gray-100 dark:hover:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 shadow-xs transition-colors flex items-center gap-1.5"
          >
            <HeartHandshake className="w-3.5 h-3.5 text-teal-500" />
            <span>Care Hub</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
