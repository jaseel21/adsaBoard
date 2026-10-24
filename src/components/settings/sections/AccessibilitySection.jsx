import React from 'react';
import {
  Accessibility,
  Eye,
  Type,
  Volume2,
  Sparkles,
  Check,
  Sliders,
  Play,
  RotateCcw,
  MousePointer,
  Contrast,
} from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { useTextToSpeech } from '../../../hooks/useTextToSpeech';

export default function AccessibilitySection({ preferences, setPreference }) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();
  const { speak, isSpeaking, isSupported: isTtsSupported } = useTextToSpeech();

  const handleTestTTS = () => {
    feedback('pop');
    if (language === 'ml') {
      speak('അലാത്തുർപ്പടി ദർസ് കാന്റീൻ ടോക്കൺ ബോർഡിലേക്ക് സ്വാഗതം. നിങ്ങളുടെ ഉച്ചഭക്ഷണം ഇന്ന് ലഭ്യമാണ്.');
    } else {
      speak('Welcome to the ADSA T-Board Dining System. Your lunch attendance is active for today.');
    }
  };

  const colorBlindOptions = [
    { id: 'none', labelEn: 'Normal (Full Spectrum)', labelMl: 'സാധാരണ വർണ്ണങ്ങൾ' },
    { id: 'deuteranopia', labelEn: 'Deuteranopia (Green-Weak)', labelMl: 'ഡ്യൂട്ടറനോപിയ (പച്ച)' },
    { id: 'protanopia', labelEn: 'Protanopia (Red-Weak)', labelMl: 'പ്രോട്ടോനോപിയ (ചുവപ്പ്)' },
    { id: 'tritanopia', labelEn: 'Tritanopia (Blue-Weak)', labelMl: 'ട്രൈറ്റനോപിയ (നീല)' },
    { id: 'achromatopsia', labelEn: 'Achromatopsia (Grayscale)', labelMl: 'ഗ്രേസ്കെയിൽ (ബ്ലാക്ക് & വൈറ്റ്)' },
  ];

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-3 border-b border-gray-200/80 dark:border-white/10">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Accessibility className="w-5 h-5 text-emerald-500" />
          <span>{language === 'ml' ? 'ആക്സസിബിലിറ്റി & യൂണിവേഴ്സൽ ഇൻക്ലൂഷൻ' : 'Accessibility & Universal Inclusion'}</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ml'
            ? 'വർണ്ണാന്ധത പരിഹാരങ്ങൾ, ഹൈ കോൺട്രാസ്റ്റ്, വോയ്സ് വായന, ഡിസ്ലെക്സിയ ഫോണ്ട്, റീഡിംഗ് റൂളർ എന്നിവ ക്രമീകരിക്കുക'
            : 'Tailor Daltonization color filters, high contrast ratios, dyslexic typography, reading rulers, and voice narration'}
        </p>
      </div>

      {/* 1. Color Vision & Daltonization Filters */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            <span className="flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-emerald-500" />
              <span>{language === 'ml' ? 'വർണ്ണാന്ധത പരിഹാര ഫിൽട്ടർ (Daltonization Filters)' : 'Color Vision Deficiency Filters'}</span>
            </span>
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'ചുവപ്പ്, പച്ച, നീല നിറങ്ങൾ തിരിച്ചറിയാൻ ബുദ്ധിമുട്ടുള്ളവർക്ക് വ്യക്തത നൽകുന്ന പ്രത്യേക ഫിൽട്ടറുകൾ'
              : 'Hardware-accelerated color matrices enhancing separation between meal ON (Green) and OFF (Red) statuses'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
          {colorBlindOptions.map((opt) => {
            const isSelected = (preferences.colorBlindFilter || 'none') === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  feedback('tick');
                  setPreference('colorBlindFilter', opt.id);
                }}
                className={`p-3 rounded-2xl border text-left transition-all text-xs font-bold flex items-center justify-between ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/30'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                <span>{language === 'ml' ? opt.labelMl : opt.labelEn}</span>
                {isSelected && <Check className="w-4 h-4 text-emerald-500 shrink-0" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. High Contrast Ratios */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            <span className="flex items-center gap-1.5">
              <Contrast className="w-4 h-4 text-emerald-500" />
              <span>{language === 'ml' ? 'ഹൈ കോൺട്രാസ്റ്റ് അനുപാതം' : 'Contrast Amplification (WCAG AAA)'}</span>
            </span>
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'വെളിച്ചമുള്ള മുറികളിലും കാഴ്ചാ പരിമിതി ഉള്ളവർക്കും വ്യക്തത നൽകാൻ ബോർഡറുകളും എഴുത്തുകളും കടുപ്പിക്കുക'
              : 'Enforces crisp high-contrast stroke boundaries exceeding WCAG AAA 7:1 contrast ratios'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: 'standard', labelEn: 'Balanced Standard', labelMl: 'സാധാരണ ശൈലി' },
            { id: 'high', labelEn: 'High Contrast (Bold Borders)', labelMl: 'ഹൈ കോൺട്രാസ്റ്റ് (ബോൾഡ്)' },
            { id: 'maximum_oled', labelEn: 'Maximum Monochrome OLED', labelMl: 'ഒലെഡ് മാക്സിമം കോൺട്രാസ്റ്റ്' },
          ].map((item) => {
            const isSelected = (preferences.highContrastMode || 'standard') === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  feedback('tick');
                  setPreference('highContrastMode', item.id);
                }}
                className={`p-3 rounded-2xl border text-center transition-all text-xs font-bold ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/30'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                {language === 'ml' ? item.labelMl : item.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Dyslexic Typography & Reading Enhancements */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            <span className="flex items-center gap-1.5">
              <Type className="w-4 h-4 text-emerald-500" />
              <span>{language === 'ml' ? 'ഡിസ്‌ലെക്സിയ സൗഹൃദ അക്ഷരങ്ങളും വായനാ സഹായവും' : 'Dyslexia Typography & Cognitive Focus'}</span>
            </span>
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'ബ്രെയ്‌ലി ഇൻസ്റ്റിറ്റ്യൂട്ട് നിർമ്മിച്ച ആറ്റ്കിൻസൺ ഹൈപ്പർ-ലെജിബിൾ ഫോണ്ടും ലൈൻ സ്പേസിംഗും'
              : 'Atkinson Hyperlegible typeface engineered by the Braille Institute for unmistakable character distinction'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Dyslexic Font Toggle */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                Atkinson Hyperlegible Font
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {language === 'ml' ? 'വായിക്കാൻ എളുപ്പമുള്ള പ്രത്യേക ഫോണ്ട്' : 'Shape-distinguished characters'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                feedback('pop');
                setPreference('dyslexicFont', !preferences.dyslexicFont);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                preferences.dyslexicFont ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  preferences.dyslexicFont ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Text Spacing Toggle */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                Enhanced Text Spacing (WCAG 1.4.12)
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {language === 'ml' ? 'വരികൾക്കിടയിലെ വിടവ് കൂട്ടുക' : '1.85 line-height and generous letter-spacing'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                feedback('pop');
                setPreference('textSpacing', preferences.textSpacing === 'enhanced' ? 'standard' : 'enhanced');
              }}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                preferences.textSpacing === 'enhanced' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  preferences.textSpacing === 'enhanced' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Reading Guide Ruler Toggle */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                Cognitive Reading Guide (Ruler)
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {language === 'ml' ? 'മൗസ് പിന്തുടരുന്ന വായനാ ബാർ' : 'Cursor-tracking horizontal line highlight'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                feedback('pop');
                setPreference('readingGuide', !preferences.readingGuide);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                preferences.readingGuide ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  preferences.readingGuide ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Underline Links Toggle */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                Underline All Links
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {language === 'ml' ? 'ലിങ്കുകൾക്ക് അടിവര നൽകുക' : 'Persistent visual indicators for hyperlinks'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                feedback('pop');
                setPreference('underlineLinks', !preferences.underlineLinks);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                preferences.underlineLinks ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  preferences.underlineLinks ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* 4. Voice Concierge & Web Speech Synthesis */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
              <span className="flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-emerald-500" />
                <span>{language === 'ml' ? 'വോയ്സ് സ്പീച്ച് സിന്തസിസ് (Voice TTS)' : 'Web Speech Synthesizer & Audio Reader'}</span>
              </span>
            </label>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {language === 'ml'
                ? 'ഭക്ഷണ വിവരങ്ങളും ടോക്കൺ സ്റ്റാറ്റസും സ്ക്രീൻ നോക്കാതെ ശബ്ദമായി കേൾക്കുക'
                : 'Audible bilingual narration for hands-free kitchen staff and visually impaired students'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleTestTTS}
            disabled={!isTtsSupported}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <Play className={`w-3.5 h-3.5 ${isSpeaking ? 'animate-pulse text-emerald-500' : ''}`} />
            <span>{isSpeaking ? (language === 'ml' ? 'വായിക്കുന്നു...' : 'Speaking...') : (language === 'ml' ? 'ശബ്ദം പരിശോധിക്കുക' : 'Test Voice')}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                Voice Audio Assistance
              </span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400">
                {language === 'ml' ? 'ടോക്കൺ മാറ്റുമ്പോൾ ഉറക്കെ വായിക്കുക' : 'Read meal changes aloud automatically'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                feedback('pop');
                setPreference('voiceAssistance', !preferences.voiceAssistance);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                preferences.voiceAssistance ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  preferences.voiceAssistance ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Speech Speed Slider */}
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-gray-800 dark:text-gray-200">
                {language === 'ml' ? 'സംസാര വേഗത' : 'Narration Speed'}
              </span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                {(preferences.voiceRate || 1.0).toFixed(1)}x
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="1.5"
              step="0.1"
              value={preferences.voiceRate || 1.0}
              onChange={(e) => setPreference('voiceRate', parseFloat(e.target.value))}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* 5. Motor & Focus Halo */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-3">
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            <span className="flex items-center gap-1.5">
              <MousePointer className="w-4 h-4 text-emerald-500" />
              <span>{language === 'ml' ? 'കീബോർഡ് ഫോക്കസ് ഹാലോ' : 'Keyboard Focus Halo Style'}</span>
            </span>
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'കീബോർഡ് ഉപയോഗിക്കുമ്പോൾ സെലക്ട് ചെയ്ത ബട്ടൺ വ്യക്തമായി കാണാൻ'
              : 'Choose between radiant Emerald focus halo or ultra-visible Amber high-contrast ring'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { id: 'prominent', labelEn: 'Radiant Emerald Focus Ring (Standard)', labelMl: 'എമറാൾഡ് ഫോക്കസ് റിംഗ്' },
            { id: 'high_visibility_halo', labelEn: 'Luminous Amber Halo (High-Vis)', labelMl: 'ആംബർ ഹൈ-വിസിബിലിറ്റി ഹാലോ' },
          ].map((item) => {
            const isSelected = (preferences.focusRingStyle || 'prominent') === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  feedback('tick');
                  setPreference('focusRingStyle', item.id);
                }}
                className={`p-3 rounded-2xl border text-center transition-all text-xs font-bold ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-800 dark:text-emerald-300 shadow-xs ring-1 ring-emerald-500/30'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:border-gray-300'
                }`}
              >
                {language === 'ml' ? item.labelMl : item.labelEn}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
