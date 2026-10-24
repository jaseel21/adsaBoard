import React, { useState, useEffect } from 'react';
import { HardDrive, Trash2, RotateCcw } from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { dialog } from '../../../utils/dialog';

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
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const val = localStorage.getItem(key) || '';
        localBytes += (key.length + val.length) * 2;
      }

      let sessionBytes = 0;
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        const val = sessionStorage.getItem(key) || '';
        sessionBytes += (key.length + val.length) * 2;
      }

      setStorageUsage({
        localKb: (localBytes / 1024).toFixed(1),
        sessionKb: (sessionBytes / 1024).toFixed(1),
        totalItems: localStorage.length + sessionStorage.length,
      });
    } catch (_) {}
  };

  useEffect(() => {
    refreshStorageMetrics();
  }, []);

  const handleClearSearchHistory = () => {
    feedback('tick');
    try {
      localStorage.removeItem('adsatboard-recent-searches');
      refreshStorageMetrics();
      dialog.toast.success('Search History Cleared', 'Recent searches have been reset.');
    } catch (_) {}
  };

  const handleClearCachedManifests = () => {
    feedback('tick');
    try {
      // Purge any cached pdf manifests in session storage
      sessionStorage.removeItem('adsa_cached_manifest');
      refreshStorageMetrics();
      dialog.toast.success('Manifest Cache Purged', 'Temporary print manifests cleared.');
    } catch (_) {}
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-3 border-b border-gray-200/80 dark:border-white/10">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-emerald-500" />
          <span>{language === 'ml' ? 'സ്വകാര്യത & സ്റ്റോറേജ്' : 'Privacy & Storage Footprint'}</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ml'
            ? 'ബ്രൗസർ കാഷെ മാനേജ്‌മെന്റും ഡാറ്റ വിനിയോഗവും'
            : 'Audit offline client storage allocation and manage cached data'}
        </p>
      </div>

      {/* Client Storage Footprint Gauge */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
              {language === 'ml' ? 'ബ്രൗസർ സ്റ്റോറേജ് വിഹിതം' : 'Client Storage Footprint'}
            </span>
          </div>
          <span className="text-[10px] font-mono text-gray-400">
            {storageUsage.totalItems} cached entries
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[10px] text-gray-400 font-bold block mb-1">Local Preferences</span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
              {storageUsage.localKb} KB
            </span>
            <span className="text-[10px] text-gray-400 block mt-1">Theme, sound & UI state</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[10px] text-gray-400 font-bold block mb-1">Session Data</span>
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
