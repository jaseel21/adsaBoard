import React from 'react';
import { Globe, Clock, Compass, Waves, Check, Moon, Sparkles, Calendar } from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { getCalibratedHijriDate } from '../../../utils/hijriCalendar';

export default function GeneralSection({ preferences, setPreference }) {
  const { language, t } = useLanguage();
  const { feedback } = useFeedback();

  const handleLanguageSelect = (code) => {
    feedback('pop');
    setPreference('language', code);
  };

  const handleClockToggle = (format) => {
    feedback('tick');
    setPreference('clockFormat', format);
  };

  const handleHijriOffsetChange = (offset) => {
    feedback('tick');
    setPreference('hijriDateOffset', offset);
  };

  const currentHijri = getCalibratedHijriDate(new Date(), preferences.hijriDateOffset || 0);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-3 border-b border-gray-200/80 dark:border-white/10">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Globe className="w-5 h-5 text-emerald-500" />
          <span>{language === 'ml' ? 'പൊതുവായവ & ഭാഷ' : 'General & Localization'}</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ml'
            ? 'സിസ്റ്റം ഭാഷ, സമയ ക്രമം, പ്രധാന ലാൻഡിംഗ് പേജ് എന്നിവ തിരഞ്ഞെടുക്കുക'
            : 'Configure interface language, timezone clock conventions, and startup routing'}
        </p>
      </div>

      {/* 1. Language Selection */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            {language === 'ml' ? 'ഇന്റർഫേസ് ഭാഷ' : 'Interface Language'}
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'ആപ്പ് ഉപയോഗിക്കുന്നതിനുള്ള പ്രാഥമിക ഭാഷ മാറ്റുക'
              : 'Choose between English, Malayalam, or auto-detect from browser locale'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            { id: 'system', titleEn: 'System Auto', titleMl: 'സിസ്റ്റം സ്വയം', desc: 'Auto-detect device locale' },
            { id: 'en', titleEn: 'English', titleMl: 'English', desc: 'Standard international Latin' },
            { id: 'ml', titleEn: 'Malayalam (മലയാളം)', titleMl: 'മലയാളം', desc: 'കേരളീയ പ്രാദേശിക ലിപി' },
          ].map((item) => {
            const isSelected = preferences.language === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleLanguageSelect(item.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/30'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{language === 'ml' ? item.titleMl : item.titleEn}</span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-medium">{item.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Clock & Date Displays */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            {language === 'ml' ? 'സമയ ക്രമീകരണങ്ങൾ (IST)' : 'Timezone & Clock Conventions'}
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'ഇന്ത്യൻ സ്റ്റാൻഡേർഡ് സമയം (IST) 12-മണിക്കൂർ / 24-മണിക്കൂർ ശൈലിയിൽ ക്രമീകരിക്കുക'
              : 'Switch Indian Standard Time (IST) between standard 12-hour AM/PM and 24-hour military convention'}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-1">
          {/* Clock 12h / 24h Switch */}
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
              {language === 'ml' ? 'ക്ലോക്ക് ശൈലി' : 'Clock Display'}:
            </span>
            <div className="grid grid-cols-2 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/70 dark:border-white/10">
              <button
                type="button"
                onClick={() => handleClockToggle('12h')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  preferences.clockFormat === '12h'
                    ? 'bg-white dark:bg-[#1c2824] text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/20'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                12h (AM/PM)
              </button>
              <button
                type="button"
                onClick={() => handleClockToggle('24h')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  preferences.clockFormat === '24h'
                    ? 'bg-white dark:bg-[#1c2824] text-emerald-600 dark:text-emerald-400 shadow-xs ring-1 ring-emerald-500/20'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                24h (Military)
              </button>
            </div>
          </div>

          {/* Active Clock Preview Badge */}
          <div className="px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-right">
            <span className="text-[10px] text-gray-400 block font-semibold">Active Preview</span>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              {preferences.clockFormat === '24h' ? '16:45:00' : '04:45:00 PM'}
            </span>
          </div>
        </div>
      </div>

      {/* 2.5 Advanced Hijri Calendar Management */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Moon className="w-4 h-4" />
            </div>
            <div>
              <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block">
                {language === 'ml' ? 'ഹിജ്‌റി കലണ്ടർ മാനേജ്‌മെന്റ്' : 'Advanced Hijri Lunar Calendar'}
              </label>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                {language === 'ml'
                  ? 'ക്ലോക്ക് പോപ്പ്-അപ്പിലും കലണ്ടറിലും ഹിജ്‌റി വിവരങ്ങൾ പ്രദർശിപ്പിക്കുകയും മാസപ്പിറവി ക്രമീകരിക്കുകയും ചെയ്യുക'
                  : 'Display Islamic lunar dates in clock popover and calibrate moon-sighting offset'}
              </p>
            </div>
          </div>

          {/* Master Hijri Toggle */}
          <button
            type="button"
            onClick={() => {
              feedback('pop');
              setPreference('showHijriDate', !preferences.showHijriDate);
            }}
            className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
              preferences.showHijriDate ? 'bg-amber-500' : 'bg-gray-300 dark:bg-white/20'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
                preferences.showHijriDate ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {preferences.showHijriDate && (
          <div className="pt-3 border-t border-gray-100 dark:border-white/5 space-y-3.5">
            {/* Live Hijri Date Preview Card */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border border-amber-500/20 dark:border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3 h-3" />
                  <span>{language === 'ml' ? 'തത്സമയ ഹിജ്‌റി തിയതി (Live Islamic Date)' : 'Live Calibrated Islamic Date'}</span>
                </span>
                <h4 className="text-sm font-black text-gray-900 dark:text-white">
                  {language === 'ml' ? currentHijri.formattedMl : currentHijri.formattedEn}
                </h4>
                <div className="flex items-center gap-2 text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-medium">
                  <span>Arabic: {currentHijri.day} {currentHijri.monthNameAr} {currentHijri.year} هـ</span>
                  {currentHijri.isSacredMonth && (
                    <span className="px-1.5 py-0.2 rounded font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                      {language === 'ml' ? 'ഹറാം മാസം (Sacred)' : 'Sacred Month'}
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  {currentHijri.offsetDays === 0
                    ? 'Umm al-Qura Base (±0d)'
                    : `${currentHijri.offsetDays > 0 ? '+' : ''}${currentHijri.offsetDays} Day Sighting Shift`}
                </span>
              </div>
            </div>

            {/* Moon-Sighting Calibration Stepper */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  {language === 'ml' ? 'മാസപ്പിറവി ക്രമീകരണം (Hilal Sighting Offset)' : 'Moon-Sighting Calibration (Hilal Offset)'}
                </span>
                <span className="text-[11px] font-mono font-bold text-amber-600 dark:text-amber-400">
                  {preferences.hijriDateOffset || 0} Days
                </span>
              </div>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-2">
                {language === 'ml'
                  ? 'കേരളീയ ഖാളിമാരുടെ മാസപ്പിറവി പ്രഖ്യാപനത്തിനനുസരിച്ച് തിയതി ±1 അല്ലെങ്കിൽ ±2 ദിവസം ക്രമീകരിക്കുക'
                  : 'Calibrate Hijri date by ±1 or ±2 days to match regional Kerala / Indian moon-sighting declarations'}
              </p>

              <div className="grid grid-cols-5 gap-1.5">
                {[-2, -1, 0, 1, 2].map((offVal) => {
                  const isSelected = (preferences.hijriDateOffset || 0) === offVal;
                  return (
                    <button
                      key={offVal}
                      type="button"
                      onClick={() => handleHijriOffsetChange(offVal)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        isSelected
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                      }`}
                    >
                      {offVal === 0 ? '0 (Base)' : `${offVal > 0 ? '+' : ''}${offVal}d`}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Cold Start Gateway */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            {language === 'ml' ? 'ആദ്യ ലാൻഡിംഗ് പേജ്' : 'Cold-Start Default Gateway'}
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'ആപ്പ് തുറക്കുമ്പോൾ നേരിട്ട് എവിടെ പോകണം എന്ന് തിരഞ്ഞെടുക്കുക'
              : 'Choose the primary screen opened automatically upon initial app launch'}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { route: '/', labelEn: 'Spotlight Home', labelMl: 'ഹോം സ്പോട്ട്ലൈറ്റ്' },
            { route: '/menu', labelEn: 'Food Menu', labelMl: 'ഭക്ഷണ മെനു' },
            { route: '/student', labelEn: 'Student Portal', labelMl: 'വിദ്യാർത്ഥി പോർട്ടൽ' },
            { route: '/admin', labelEn: 'Master Board', labelMl: 'മാസ്റ്റർ ബോർഡ്' },
          ].map((item) => {
            const isSelected = preferences.defaultLandingRoute === item.route;
            return (
              <button
                key={item.route}
                type="button"
                onClick={() => {
                  feedback('tick');
                  setPreference('defaultLandingRoute', item.route);
                }}
                className={`p-2.5 rounded-xl border text-center transition-all text-xs font-bold ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-xs'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200/60 dark:border-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {language === 'ml' ? item.labelMl : item.labelEn}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Smooth Scroll Physics */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block">
              {language === 'ml' ? 'സ്മൂത്ത് സ്ക്രോളിംഗ് (Lenis Physics)' : 'Smooth Momentum Scrolling'}
            </span>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
              {language === 'ml'
                ? 'സുഗമമായ inertia സ്ക്രോളിംഗ് സജീവമാക്കുക'
                : 'Silky smooth inertial trackpad and mouse-wheel scrolling curves'}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            feedback('pop');
            setPreference('smoothScrollEnabled', !preferences.smoothScrollEnabled);
          }}
          className={`w-11 h-6 rounded-full transition-colors relative flex items-center p-0.5 flex-shrink-0 ${
            preferences.smoothScrollEnabled ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-white/20'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white shadow-md transition-transform ${
              preferences.smoothScrollEnabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
