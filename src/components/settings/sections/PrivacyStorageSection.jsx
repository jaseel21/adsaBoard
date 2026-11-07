import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  Trash2,
  RotateCcw,
  ShieldCheck,
  Lock,
  Cookie,
  CheckCircle2,
  Sliders,
  Sparkles,
  Database,
  EyeOff,
  Info,
} from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { dialog } from '../../../utils/dialog';
import { safeLocalStorage, safeSessionStorage } from '../../../utils/storage';

export default function PrivacyStorageSection({
  resetToFactoryDefaults,
  stdata,
}) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  // Compute local storage usage
  const [storageUsage, setStorageUsage] = useState({
    localKb: 0,
    sessionKb: 0,
    totalItems: 0,
  });

  const refreshStorageMetrics = () => {
    if (typeof window === 'undefined') return;
    try {
      let localBytes = 0;
      for (let i = 0; i < safeLocalStorage.length; i++) {
        const key = safeLocalStorage.key(i);
        if (key) {
          const val = safeLocalStorage.getItem(key) || '';
          localBytes += (key.length + val.length) * 2;
        }
      }

      let sessionBytes = 0;
      for (let i = 0; i < safeSessionStorage.length; i++) {
        const key = safeSessionStorage.key(i);
        if (key) {
          const val = safeSessionStorage.getItem(key) || '';
          sessionBytes += (key.length + val.length) * 2;
        }
      }

      setStorageUsage({
        localKb: (localBytes / 1024).toFixed(1),
        sessionKb: (sessionBytes / 1024).toFixed(1),
        totalItems: safeLocalStorage.length + safeSessionStorage.length,
      });
    } catch (_) {}
  };

  useEffect(() => {
    refreshStorageMetrics();
  }, []);

  const handleClearSearchHistory = () => {
    feedback('tick');
    safeLocalStorage.removeItem('adsatboard-recent-searches');
    refreshStorageMetrics();
    dialog.toast.success(
      language === 'ml' ? 'തിരച്ചിൽ ഹിസ്റ്ററി ഒഴിവാക്കി' : 'Search History Cleared',
      language === 'ml' ? 'സമീപകാല തിരച്ചിലുകൾ നീക്കം ചെയ്തു.' : 'Recent searches have been reset.'
    );
  };

  const handleClearCachedManifests = () => {
    feedback('tick');
    try {
      safeSessionStorage.removeItem('adsa_cached_manifest');
      refreshStorageMetrics();
      dialog.toast.success(
        language === 'ml' ? 'കാഷെ ഷീറ്റുകൾ നീക്കം ചെയ്തു' : 'Manifest Cache Purged',
        language === 'ml' ? 'താല്ക്കാലിക പ്രിന്റ് രേഖകൾ ക്ലിയർ ചെയ്തു.' : 'Temporary print manifests cleared.'
      );
    } catch (_) {}
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-3 border-b border-gray-200/80 dark:border-white/10">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-emerald-500" />
          <span>{language === 'ml' ? 'സ്വകാര്യത & സ്റ്റോറേജ് നയം' : 'Privacy & Storage Policy'}</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ml'
            ? 'ബ്രൗസർ കാഷെ മാനേജ്‌മെന്റും ഡാറ്റാ വിനിയോഗ സുതാര്യതയും'
            : 'Audit client storage allocation, cookie disclosures, and manage offline data'}
        </p>
      </div>

      {/* 1. Transparent Cookie & Privacy Disclosure Banner */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 backdrop-blur-xl space-y-3.5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {language === 'ml'
                ? '100% ട്രാക്കർ-രഹിതം • പരസ്യ കുക്കികളില്ല'
                : '100% Tracker-Free • No Advertising Cookies'}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 dark:text-gray-400 font-mono">
            DPDP Act 2023 Compliant
          </span>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Cookie className="w-4 h-4 text-emerald-500" />
            <span>
              {language === 'ml'
                ? 'ഞങ്ങളുടെ കുക്കി & ഡാറ്റാ സ്റ്റോറേജ് നയം'
                : 'Our Cookie & Browser Storage Policy'}
            </span>
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1.5 leading-relaxed">
            {language === 'ml'
              ? 'അഡ്സ ടി-ബോർഡ് വാണിജ്യപരമായ പരസ്യ കുക്കികളോ, തേർഡ് പാർട്ടി ട്രാക്കിംഗ് കോഡുകളോ (Google Analytics, Meta Pixel മുതലായവ) ഉപയോഗിക്കുന്നില്ല. സിസ്റ്റത്തിന്റെ സുഗമമായ പ്രവർത്തനത്തിനും (ലോഗിൻ സെഷൻ, ഡാർക്ക് മോഡ്, ഭാഷ, ഓഫ്‌ലൈൻ മെനു ലഭ്യത) വിദ്യാർത്ഥികളുടെ സൗകര്യത്തിനും മാത്രമായി ബ്രൗസറിന്റെ ലോക്കൽ സ്റ്റോറേജ് ഉപയോഗിക്കുന്നു.'
              : 'ADSA T-Board does not use commercial advertising cookies, tracking pixels, or third-party behavioral analytics (such as Google Analytics or Meta Pixel). We only use standard HTML5 Web Storage strictly for functional dining operations (student authentication, dark mode, Malayalam language preference, and offline meal resilience).'}
          </p>
        </div>

        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-white/40 dark:border-white/5 flex items-start gap-2">
            <EyeOff className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-gray-900 dark:text-white block">
                {language === 'ml' ? 'പരസ്യ നിരീക്ഷണമില്ല' : 'Zero Ad Surveillance'}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {language === 'ml'
                  ? 'ഉപയോക്താക്കളെ പിന്തുടരുന്ന പരസ്യ ട്രാക്കറുകൾ ഇല്ല.'
                  : 'No cross-site tracking or commercial data profiling.'}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-white/40 dark:border-white/5 flex items-start gap-2">
            <Lock className="w-4 h-4 text-teal-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-gray-900 dark:text-white block">
                {language === 'ml' ? 'വിവര സുരക്ഷിതത്വം' : 'Quarantined Identity'}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {language === 'ml'
                  ? 'വിദ്യാർത്ഥികളുടെ ഭക്ഷണ വിവരങ്ങൾ പൊതുവായി പങ്കിടില്ല.'
                  : 'Student records and dietary avoidances are protected.'}
              </span>
            </div>
          </div>

          <div className="p-2.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-white/40 dark:border-white/5 flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="text-[11px] font-bold text-gray-900 dark:text-white block">
                {language === 'ml' ? 'അത്യാവശ്യ ഡാറ്റ മാത്രം' : 'Strictly Functional'}
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {language === 'ml'
                  ? 'ഡൈനിംഗ് സേവനത്തിന് ആവശ്യമുള്ള വിവരങ്ങൾ മാത്രം സൂക്ഷിക്കുന്നു.'
                  : 'Storage is limited to essential dining convenience.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Structured Storage Inventory & Classification Matrix */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
              {language === 'ml' ? 'ഡാറ്റാ സ്റ്റോറേജ് വിഭജനം' : 'Client Storage Classification'}
            </span>
          </div>
          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {language === 'ml' ? 'ഓഡിറ്റ് ചെയ്തത്' : 'Verified Secure'}
          </span>
        </div>

        <div className="space-y-2.5 text-xs">
          {/* Tier 1 */}
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="font-bold text-gray-900 dark:text-white">
                  {language === 'ml' ? '1. അത്യാവശ്യ ഘടകങ്ങൾ (Strictly Necessary)' : '1. Strictly Necessary Storage'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 pl-5.5">
                {language === 'ml'
                  ? 'വിദ്യാർത്ഥികളുടെ ലോഗിൻ ടോക്കൺ, സെർവർ സമയ കൃത്യത, ഓഫ്‌ലൈൻ ഫയർസ്റ്റോർ കാഷെ.'
                  : 'Student auth token, tamper-proof server clock calibration, and offline Firestore cache.'}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] whitespace-nowrap">
              {language === 'ml' ? 'എപ്പോഴും സജീവം' : 'Always Active'}
            </span>
          </div>

          {/* Tier 2 */}
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Sliders className="w-3.5 h-3.5 text-teal-500 flex-shrink-0" />
                <span className="font-bold text-gray-900 dark:text-white">
                  {language === 'ml' ? '2. ഉപയോക്തൃ മുൻഗണനകൾ (User Preferences)' : '2. Functional Preferences'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 pl-5.5">
                {language === 'ml'
                  ? 'ഡാർക്ക്/ലൈറ്റ് തീം, മലയാളം/ഇംഗ്ലീഷ് ഭാഷ, ഓഡിയോ ചൈമുകൾ, ഹാപ്റ്റിക് വൈബ്രേഷൻ.'
                  : 'Theme (dark/light), Malayalam/English language selection, sound effects, and haptics.'}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 font-bold text-[10px] whitespace-nowrap">
              {language === 'ml' ? 'മാറ്റാവുന്നവ' : 'Configurable'}
            </span>
          </div>

          {/* Tier 3 */}
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 flex items-start justify-between gap-3">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Info className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                <span className="font-bold text-gray-900 dark:text-white">
                  {language === 'ml' ? '3. കാമ്പസ് കിയോസ്ക് ടെലിമെട്രി (Campus Operations)' : '3. Campus Fleet Telemetry'}
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 pl-5.5">
                {language === 'ml'
                  ? 'ഡൈനിംഗ് ഹാളിലെ പൊതു ടാബ്‌ലെറ്റ് ഓട്ടോ-ലോഗൗട്ട്, സ്ക്രീൻ വേക്ക്-ലോക്ക്, സെന്റിനൽ സ്റ്റാറ്റസ്.'
                  : 'Public dining kiosk auto-logout timeout, KDS screen wake-lock, and administrative fleet safety.'}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold text-[10px] whitespace-nowrap">
              {language === 'ml' ? 'ഇന്റേണൽ മാത്രം' : 'Internal Only'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Client Storage Footprint Gauge */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
              {language === 'ml' ? 'നിലവിലെ ബ്രൗസർ സ്റ്റോറേജ് വിഹിതം' : 'Current Client Storage Footprint'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-400">
            {storageUsage.totalItems} cached entries
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[10px] text-gray-400 font-bold block mb-1">
              {language === 'ml' ? 'ലോക്കൽ പ്രിഫറൻസുകൾ' : 'Local Preferences'}
            </span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {storageUsage.localKb} KB
            </span>
            <span className="text-[10px] text-gray-400 block mt-1">Theme, sound & UI state</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[10px] text-gray-400 font-bold block mb-1">
              {language === 'ml' ? 'സെഷൻ ഡാറ്റ' : 'Session Data'}
            </span>
            <span className="text-base font-extrabold text-teal-600 dark:text-teal-400 font-mono">
              {storageUsage.sessionKb} KB
            </span>
            <span className="text-[10px] text-gray-400 block mt-1">Active student token credentials</span>
          </div>
        </div>

        {/* Storage Maintenance Actions */}
        <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleClearSearchHistory}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-400" />
            <span>{language === 'ml' ? 'തിരച്ചിൽ ഹിസ്റ്ററി ഒഴിവാക്കുക' : 'Clear Search History'}</span>
          </button>

          <button
            type="button"
            onClick={handleClearCachedManifests}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-gray-600 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5 text-gray-400" />
            <span>{language === 'ml' ? 'കാഷെ ചെയ്ത ഷീറ്റുകൾ ഒഴിവാക്കുക' : 'Purge Cached Manifests'}</span>
          </button>

          <button
            type="button"
            onClick={resetToFactoryDefaults}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-rose-500/20 transition-colors flex items-center gap-1.5 ml-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'ml' ? 'ഫാക്ടറി റീസെറ്റ്' : 'Factory Reset Preferences'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
