import React from 'react';
import { Palette, Layers, Type, Gauge, Check, MousePointer, Box, SunMoon, Sparkles } from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { THEME_PRESETS } from '../../../utils/preferencesConfig';
import SettingsPreviewCanvas from './SettingsPreviewCanvas';

export default function AppearanceSection({ preferences, setPreference }) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  const handleSelectTheme = (themeId) => {
    feedback('pop');
    setPreference('theme', themeId);
  };

  const handleSelectFontScale = (scale) => {
    feedback('tick');
    setPreference('fontSizeScale', scale);
  };

  const handleSelectMotion = (mode) => {
    feedback('tick');
    setPreference('motionFidelity', mode);
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-3 border-b border-gray-200/80 dark:border-white/10">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Palette className="w-5 h-5 text-emerald-500" />
          <span>{language === 'ml' ? 'പ്രതീതി & തീമുകൾ' : 'Appearance & Visual Themes'}</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ml'
            ? 'ആപ്പിന്റെ നിറങ്ങൾ, അക്ഷര വലിപ്പം, ഗ്ലാസ്മോർഫിസം എന്നിവ ക്രമീകരിക്കുക'
            : 'Personalize surface color palettes, typography scale, blur fidelity, and animations'}
        </p>
      </div>

      {/* 1. Theme Presets Grid */}
      <div className="space-y-3">
        <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block">
          {language === 'ml' ? 'വർണ്ണ ശൈലി (തീം)' : 'Color Theme Presets'}
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {THEME_PRESETS.map((tPreset) => {
            const isSelected = preferences.theme === tPreset.id;
            return (
              <button
                key={tPreset.id}
                type="button"
                onClick={() => handleSelectTheme(tPreset.id)}
                className={`p-4 rounded-3xl border text-left transition-all relative flex flex-col justify-between overflow-hidden group ${
                  isSelected
                    ? 'border-emerald-500 shadow-md shadow-emerald-500/10 ring-2 ring-emerald-500/30'
                    : 'border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                } ${tPreset.surfaceClass}`}
              >
                {/* Visual Swatch Pill */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full border border-white/20 shadow-xs flex-shrink-0"
                      style={{ backgroundColor: tPreset.accentColor }}
                    />
                    <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                      {language === 'ml' ? tPreset.nameMl : tPreset.nameEn}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                      {tPreset.badge}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                  {language === 'ml' ? tPreset.descriptionMl : tPreset.descriptionEn}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Live Interactive Preview Canvas */}
      <SettingsPreviewCanvas preferences={preferences} />

      {/* 3. Typography Scaling */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            <span className="flex items-center gap-1.5">
              <Type className="w-4 h-4 text-emerald-500" />
              <span>{language === 'ml' ? 'അക്ഷര വലിപ്പം' : 'Typography Scaling'}</span>
            </span>
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'ആപ്പിലെ മുഴുവൻ എഴുത്തുകളുടെയും വലിപ്പം ക്രമീകരിക്കുക'
              : 'Adjust universal font sizing for personal comfort or wall-mounted displays'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { id: 'compact', labelEn: 'Compact (90%)', labelMl: 'ചെറുത്' },
            { id: 'balanced', labelEn: 'Balanced (100%)', labelMl: 'സാധാരണ' },
            { id: 'roomy', labelEn: 'Roomy (110%)', labelMl: 'വലുത്' },
            { id: 'kiosk', labelEn: 'Kitchen Kiosk (125%)', labelMl: 'കിയോസ്ക്' },
          ].map((item) => {
            const isSelected = preferences.fontSizeScale === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectFontScale(item.id)}
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

      {/* 4. Glassmorphism & GPU Acceleration */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block">
              {language === 'ml' ? 'ഗ്ലാസ്മോർഫിസം ഫ്രോസ്റ്റഡ് എഫക്റ്റ്' : 'Frosted Glass Backdrops'}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
              {language === 'ml'
                ? 'GPU ലോഡ് കുറയ്ക്കാനും പഴയ ഫോണുകൾക്ക് വേഗത കൂട്ടാനും ഇത് ഓഫ് ചെയ്യാം'
                : 'Disable backdrop blurs for increased battery efficiency on low-power devices'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            feedback('pop');
            setPreference('glassmorphismLevel', preferences.glassmorphismLevel === 'off' ? 'high' : 'off');
          }}
          className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
            preferences.glassmorphismLevel !== 'off' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
              preferences.glassmorphismLevel !== 'off' ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* 5. Motion & Animation Fidelity */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            <span className="flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-emerald-500" />
              <span>{language === 'ml' ? 'ആനിമേഷൻ വേഗത' : 'Motion & Transition Fidelity'}</span>
            </span>
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'സ്ക്രീൻ മാറ്റങ്ങളുടെ ആനിമേഷൻ തീവ്രത ക്രമീകരിക്കുക'
              : 'Choose full 120 FPS Framer Motion transitions, rapid ergonomic fades, or reduced motion'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: 'cinematic', labelEn: 'Cinematic Springs (120 FPS)', labelMl: 'സിനിമാറ്റിക് സ്പ്രിംഗ്സ്' },
            { id: 'ergonomic', labelEn: 'Ergonomic Fast (150ms)', labelMl: 'വേഗതയുള്ള ഫേഡ്' },
            { id: 'reduced', labelEn: 'Reduced Motion (Instant)', labelMl: 'ആനിമേഷൻ ഒഴിവാക്കുക' },
          ].map((item) => {
            const isSelected = preferences.motionFidelity === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectMotion(item.id)}
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

      {/* 6. Fluid Magnetic Desktop Cursor */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            <span className="flex items-center gap-1.5">
              <MousePointer className="w-4 h-4 text-emerald-500" />
              <span>{language === 'ml' ? 'ഫ്ലൂയിഡ് മാഗ്നറ്റിക് കർസർ' : 'Fluid Magnetic Desktop Cursor'}</span>
            </span>
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'ബട്ടണുകളിലേക്കും കാർഡുകളിലേക്കും ആകർഷിക്കപ്പെടുന്ന അവാർഡ് വിന്നിംഗ് കർസർ'
              : 'Award-winning dual-layer pointer with magnetic snap-docking and morphological shape shifting'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: 'magnetic_fluid', labelEn: 'Magnetic Fluid (Luxury)', labelMl: 'മാഗ്നറ്റിക് ഫ്ലൂയിഡ്' },
            { id: 'minimal_dot', labelEn: 'Minimal Laser Dot', labelMl: 'ലേസർ ഡോട്ട്' },
            { id: 'system', labelEn: 'Standard System Pointer', labelMl: 'സിസ്റ്റം പോയിന്റർ' },
          ].map((item) => {
            const isSelected = (preferences.cursorStyle || 'magnetic_fluid') === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  feedback('pop');
                  setPreference('cursorStyle', item.id);
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

        {preferences.cursorStyle !== 'system' && (
          <div className="pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <span>{language === 'ml' ? 'സ്റ്റാർഡസ്റ്റ് പാർട്ടിക്കിൾ ട്രയൽ' : 'Stardust Pointer Motion Trail'}</span>
            </span>
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setPreference('cursorTrail', !preferences.cursorTrail);
              }}
              className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
                preferences.cursorTrail !== false ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                  preferences.cursorTrail !== false ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* 7. 3D Parallax Tilt & Specular Reflection */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            <span className="flex items-center gap-1.5">
              <Box className="w-4 h-4 text-emerald-500" />
              <span>{language === 'ml' ? '3D ടിൽറ്റും ലൈറ്റ് ഗ്ലെയറും' : '3D Parallax Tilt & Specular Glare'}</span>
            </span>
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'കാർഡുകളിൽ മൗസ് കൊണ്ടുവരുമ്പോൾ ഉണ്ടാകുന്ന 3D ചലനവും പ്രകാശ പ്രതിഫലനവും'
              : 'Hardware-accelerated physical perspective tilt with dynamic glass specular reflection'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {[
            { id: 'cinematic', labelEn: 'Cinematic 3D (10° Tilt)', labelMl: 'സിനിമാറ്റിക് 3D' },
            { id: 'subtle', labelEn: 'Subtle Tilt (4° Tilt)', labelMl: 'നേർത്ത ടിൽറ്റ്' },
            { id: 'off', labelEn: 'Flat (Disabled)', labelMl: 'ഓഫ് ചെയ്യുക' },
          ].map((item) => {
            const isSelected = (preferences.tiltEffect || 'cinematic') === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  feedback('pop');
                  setPreference('tiltEffect', item.id);
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

      {/* 8. Circadian Living Canvas Atmosphere */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <SunMoon className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block">
              {language === 'ml' ? 'സമയത്തിനനുസരിച്ചുള്ള ആംബിയന്റ് ലൈറ്റിംഗ്' : 'Circadian Living Atmosphere'}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
              {language === 'ml'
                ? 'പ്രാർത്ഥനാ-ഭക്ഷണ സമയത്തിനനുസരിച്ച് പശ്ചാത്തല വെളിച്ചം മാറുന്നു'
                : 'Ambient background glow morphs gracefully between Fajr Dawn, Dhuhr Solar, and Night Obsidian'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            feedback('pop');
            setPreference('ambientAtmosphere', preferences.ambientAtmosphere === 'off' ? 'circadian' : 'off');
          }}
          className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
            preferences.ambientAtmosphere !== 'off' ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
              preferences.ambientAtmosphere !== 'off' ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
