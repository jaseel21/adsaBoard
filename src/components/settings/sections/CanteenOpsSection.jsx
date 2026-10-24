import React, { useState, useEffect } from 'react';
import { Utensils, Sliders, RefreshCw, Smartphone, Eye, Volume2, ShieldCheck, Check } from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { dialog } from '../../../utils/dialog';
import {
  subscribeToCanteenConfig,
  updateSectionChunkSize,
  getCachedCanteenConfig,
} from '../../../utils/canteenConfigService';

export default function CanteenOpsSection({
  preferences,
  setPreference,
  user,
  role,
}) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  const [canteenConfig, setCanteenConfig] = useState(getCachedCanteenConfig);
  const [chunkSizeInput, setChunkSizeInput] = useState(canteenConfig.sectionChunkSize || 25);
  const [isUpdatingChunk, setIsUpdatingChunk] = useState(false);

  useEffect(() => {
    const unsub = subscribeToCanteenConfig((cfg) => {
      setCanteenConfig(cfg);
      setChunkSizeInput(cfg.sectionChunkSize || 25);
    });
    return () => unsub();
  }, []);

  const handleSaveChunkSize = async (newVal) => {
    feedback('tick');
    setIsUpdatingChunk(true);
    try {
      await updateSectionChunkSize(newVal, {
        uid: user?.uid,
        displayName: user?.displayName || user?.email,
        role,
      });
      feedback('success');
      dialog.toast.success(
        language === 'ml' ? 'സെക്ഷൻ വലുപ്പം മാറ്റി' : 'Chunk Size Updated',
        language === 'ml'
          ? `ഒരു സെക്ഷനിൽ ${newVal} ടോക്കണുകൾ വീതം ക്രമീകരിച്ചു.`
          : `Token board sections calibrated to ${newVal} tokens per card.`
      );
    } catch (err) {
      console.error('Failed to update chunk size:', err);
      feedback('warning');
    } finally {
      setIsUpdatingChunk(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-3 border-b border-gray-200/80 dark:border-white/10">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Utensils className="w-5 h-5 text-emerald-500" />
          <span>{language === 'ml' ? 'കാന്റീൻ & കിച്ചൻ കൺട്രോൾ' : 'Canteen & Kitchen Operations'}</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ml'
            ? 'ഭക്ഷണശാല സെക്ഷനുകളുടെ വലുപ്പവും കുക്ക് ഡിസ്‌പ്ലേ ക്രമീകരണങ്ങളും'
            : 'Configure token section chunk allocation and kitchen KDS display parameters'}
        </p>
      </div>

      {/* 1. Mess Section Chunk Size (Synced to Firestore) */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
                {language === 'ml' ? 'ടോക്കൺ സെക്ഷൻ ചങ്ക് വലുപ്പം' : 'Mess Section Chunk Size'}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                Firestore Synced
              </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 max-w-lg">
              {language === 'ml'
                ? 'മാസ്റ്റർ ബോർഡിലും കാന്റീൻ ടോക്കൺ ഷീറ്റിലും ഒരു കാർഡിൽ എത്ര കുട്ടികൾ വേണം എന്ന് തീരുമാനിക്കുക'
                : 'Defines how many students are grouped per section card (e.g., 25 tokens: 1-25, 26-50, 51-75)'}
            </p>
          </div>

          <div className="text-right">
            <span className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {chunkSizeInput}
            </span>
            <span className="text-[10px] text-gray-400 block">tokens / card</span>
          </div>
        </div>

        {/* Quick Presets & Slider */}
        <div className="space-y-3 pt-2">
          <input
            type="range"
            min="10"
            max="100"
            step="5"
            value={chunkSizeInput}
            onChange={(e) => setChunkSizeInput(Number(e.target.value))}
            onMouseUp={(e) => handleSaveChunkSize(Number(e.target.value))}
            className="w-full accent-emerald-500 cursor-pointer"
          />

          <div className="flex items-center gap-2">
            {[15, 20, 25, 50, 100].map((presetVal) => (
              <button
                key={presetVal}
                type="button"
                onClick={() => {
                  setChunkSizeInput(presetVal);
                  handleSaveChunkSize(presetVal);
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                  chunkSizeInput === presetVal
                    ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200/60 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {presetVal}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Cook Station KDS Controls */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            {language === 'ml' ? 'അടുക്കള സ്ക്രീൻ ക്രമീകരണങ്ങൾ (Cook KDS)' : 'Kitchen Station Display Controls'}
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'പാചക സമയത്ത് സ്ക്രീൻ ഓഫ് ആവാതിരിക്കാനും പുതിയ ഓർഡറുകൾ അറിയാനും'
              : 'Keep-awake display inhibitors, audible avoidance alerts, and live refresh cadence'}
          </p>
        </div>

        {/* Screen WakeLock API Toggle */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Eye className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                {language === 'ml' ? 'സ്ക്രീൻ എപ്പോഴും തെളിഞ്ഞു നിൽക്കുക (Wake Lock)' : 'Keep Screen Awake (Wake Lock API)'}
              </span>
              <span className="text-[10px] text-gray-400 block">
                Prevents display sleep during active kitchen food preparation shifts
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              feedback('pop');
              setPreference('screenWakeLockEnabled', !preferences.screenWakeLockEnabled);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
              preferences.screenWakeLockEnabled ? 'bg-amber-500' : 'bg-gray-300 dark:bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                preferences.screenWakeLockEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Avoidance Order Audio Chime */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
              <Volume2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                {language === 'ml' ? 'പുതിയ ഡയറ്ററി മാറ്റങ്ങൾക്ക് അലാറം നൽകുക' : 'Dietary Avoidance Audio Chime'}
              </span>
              <span className="text-[10px] text-gray-400 block">
                Emits an alert chime when a student&apos;s dietary change request is approved for today
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              feedback('pop');
              setPreference('audibleAvoidanceAlert', !preferences.audibleAvoidanceAlert);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
              preferences.audibleAvoidanceAlert ? 'bg-teal-600' : 'bg-gray-300 dark:bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                preferences.audibleAvoidanceAlert ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
