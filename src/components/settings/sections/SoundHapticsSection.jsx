import React from 'react';
import { Volume2, VolumeX, Smartphone, Play, Sparkles, Check, BellRing, MousePointer, Layers } from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';

export default function SoundHapticsSection({ preferences, setPreference }) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  const handleAudition = (type) => {
    feedback(type);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-3 border-b border-gray-200/80 dark:border-white/10">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-emerald-500" />
          <span>{language === 'ml' ? 'ശബ്ദം & വൈബ്രേഷൻ' : 'Tactile & Audio Feedback'}</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ml'
            ? 'വെബ് ഓഡിയോ സിന്തസൈസർ ശബ്ദങ്ങളും മൊബൈൽ വൈബ്രേഷനുകളും ക്രമീകരിക്കുക'
            : 'Synthesized zero-latency Web Audio soundscapes and tactile touchscreen haptics'}
        </p>
      </div>

      {/* 1. Master Sound Toggle & Volume */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              {preferences.soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5 text-gray-400" />}
            </div>
            <div>
              <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block">
                {language === 'ml' ? 'സിസ്റ്റം ശബ്ദങ്ങൾ (Web Audio FX)' : 'Synthesized Sound Effects'}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                {language === 'ml'
                  ? 'ടോക്കൺ മാറ്റങ്ങൾക്കും ബട്ടൺ ക്ലിക്കുകൾക്കും തത്സമയ ശബ്ദം നൽകുന്നു'
                  : 'Synthesizes acoustic ticks, pops, and chimes locally without downloading audio files'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              feedback('pop');
              setPreference('soundEnabled', !preferences.soundEnabled);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
              preferences.soundEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                preferences.soundEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Volume Slider */}
        {preferences.soundEnabled && (
          <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300">
              <span>{language === 'ml' ? 'ശബ്ദ തീവ്രത (വോളിയം)' : 'Master FX Volume'}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                {Math.round(preferences.soundVolume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={preferences.soundVolume}
              onChange={(e) => {
                setPreference('soundVolume', parseFloat(e.target.value));
              }}
              onMouseUp={() => feedback('tick')}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        )}
      </div>

      {/* 2. Interactive Synthesizer Audition Soundboard */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>{language === 'ml' ? 'സിന്തസൈസർ സൗണ്ട്ബോർഡ് ഓഡിഷൻ' : 'Acoustic Synthesizer Audition'}</span>
            </span>
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'താഴെയുള്ള പാഡുകളിൽ ക്ലിക്ക് ചെയ്ത് വ്യത്യസ്ത ഫ്രീക്വൻസികൾ പരീക്ഷിക്കുക'
              : 'Click any audition pad to test zero-latency oscillator frequencies in real time'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {[
            { id: 'tick', labelEn: 'Glass Tick', labelMl: 'ടിക്ക്', desc: 'Sine wave 800Hz', color: 'emerald' },
            { id: 'pop', labelEn: 'Bubble Pop', labelMl: 'പോപ്പ്', desc: 'Triangle 320Hz', color: 'teal' },
            { id: 'success', labelEn: 'Harmonic Chime', labelMl: 'വിജയ ചൈം', desc: 'Dual D5 to A5', color: 'cyan' },
            { id: 'warning', labelEn: 'Alert Thud', labelMl: 'മുന്നറിയിപ്പ്', desc: 'Sawtooth 140Hz', color: 'amber' },
          ].map((pad) => (
            <button
              key={pad.id}
              type="button"
              onClick={() => handleAudition(pad.id)}
              className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 hover:bg-emerald-500/10 hover:border-emerald-500/40 text-left transition-all active:scale-95 group flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200 group-hover:text-emerald-600 dark:group-hover:text-emerald-400">
                  {language === 'ml' ? pad.labelMl : pad.labelEn}
                </span>
                <Play className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
              </div>
              <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">{pad.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 3. Mobile Touchscreen Haptics */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block">
                {language === 'ml' ? 'സ്പർശന വൈബ്രേഷൻ (Haptic Feedback)' : 'Touchscreen Haptic Vibration'}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                {language === 'ml'
                  ? 'മൊബൈൽ ഫോണുകളിൽ ബട്ടൺ അമർത്തുമ്പോൾ നേരിയ വൈബ്രേഷൻ നൽകുന്നു'
                  : 'Provides tactile physical confirmation on supported mobile touch displays'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              feedback('pop');
              setPreference('hapticsEnabled', !preferences.hapticsEnabled);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
              preferences.hapticsEnabled ? 'bg-purple-600' : 'bg-gray-300 dark:bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                preferences.hapticsEnabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {preferences.hapticsEnabled && (
          <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-3">
            <span className="text-xs font-bold text-gray-700 dark:text-gray-300 block">
              {language === 'ml' ? 'വൈബ്രേഷൻ ശൈലി' : 'Haptic Vibration Intensity'}
            </span>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'subtle', labelEn: 'Subtle (12ms)', labelMl: 'നേരിയത്' },
                { id: 'crisp', labelEn: 'Crisp (28ms)', labelMl: 'വ്യക്തം' },
                { id: 'pulse', labelEn: 'Double Pulse', labelMl: 'ഇരട്ട പൾസ്' },
              ].map((hOpt) => {
                const isSelected = preferences.hapticProfile === hOpt.id;
                return (
                  <button
                    key={hOpt.id}
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setPreference('hapticProfile', hOpt.id);
                    }}
                    className={`p-2.5 rounded-2xl border text-center transition-all text-xs font-bold ${
                      isSelected
                        ? 'bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    {language === 'ml' ? hOpt.labelMl : hOpt.labelEn}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 4. Left-Click Kinetic Ripple & Particle Bursts */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500" />
              <span>{language === 'ml' ? 'ക്ലിക്ക് പാർട്ടിക്കിളുകളും റിപ്പിളും' : 'Kinetic Click Ripples & Particle Bursts'}</span>
            </span>
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'ടോക്കൺ മാറ്റങ്ങളിലും ബട്ടൺ ക്ലിക്കുകളിലും ഉണ്ടാകുന്ന വാട്ടർ ഡ്രോപ്പ് റിപ്പിളുകളും സ്പാർക്കുകളും'
              : 'Physical water drop shockwaves and Newtonian particle bursts when toggling dining tokens'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: 'burst', labelEn: 'Particles + Ripple (Full)', labelMl: 'പാർട്ടിക്കിൾ + റിപ്പിൾ' },
            { id: 'ripple_only', labelEn: 'Water Ripple Only', labelMl: 'റിപ്പിൾ മാത്രം' },
            { id: 'off', labelEn: 'Minimal (Disabled)', labelMl: 'ഓഫ് ചെയ്യുക' },
          ].map((item) => {
            const isSelected = (preferences.clickRippleStyle || 'burst') === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  feedback('pop');
                  setPreference('clickRippleStyle', item.id);
                }}
                className={`p-2.5 rounded-2xl border text-center transition-all text-xs font-bold ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {language === 'ml' ? item.labelMl : item.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Glassmorphic Right-Click Fast Action Menu */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <MousePointer className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block">
              {language === 'ml' ? 'റൈറ്റ് ക്ലിക്ക് ആക്ഷൻ മെനു' : 'Glassmorphic Right-Click Menu'}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
              {language === 'ml'
                ? 'ടോക്കണുകളിൽ റൈറ്റ് ക്ലിക്ക് ചെയ്യുമ്പോൾ ദ്രുത ആക്ഷൻ മെനു കാണിക്കുക'
                : 'Custom context menu with instant token meal toggle, leave calendar, and pass copy'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            feedback('pop');
            setPreference('contextMenuEnabled', preferences.contextMenuEnabled === false ? true : false);
          }}
          className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
            preferences.contextMenuEnabled !== false ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
              preferences.contextMenuEnabled !== false ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* 6. Mobile 3D Touch Peek & Pop Sheet */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block">
              {language === 'ml' ? 'മൊബൈൽ ലോംഗ് പ്രസ്സ് പീക്ക് & പോപ്പ്' : 'Mobile Long-Press 3D Peek & Pop'}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
              {language === 'ml'
                ? 'ടോക്കണിൽ വിരൽ അമർത്തിപ്പിടിച്ചാൽ വരുന്ന ഫ്ലോട്ടിംഗ് പ്രിവ്യൂവും ഫാസ്റ്റ് ഡോക്കും'
                : '400ms touch hold with progressive radial ring, two-stage haptics, and radial quick actions'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            feedback('pop');
            setPreference('mobileLongPressPeek', preferences.mobileLongPressPeek === false ? true : false);
          }}
          className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
            preferences.mobileLongPressPeek !== false ? 'bg-purple-500' : 'bg-gray-300 dark:bg-white/20'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
              preferences.mobileLongPressPeek !== false ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
