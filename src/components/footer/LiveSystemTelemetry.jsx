import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Calendar,
  Volume2,
  VolumeX,
  Activity,
  Wifi,
  WifiOff,
  Sliders,
  Languages,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { usePreferences } from '../../store/PreferencesContext';
import { useFeedback } from '../../utils/useFeedback';
import { useWorldTime } from '../../utils/time';
import { getCalibratedHijriDate } from '../../utils/hijriCalendar';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export default function LiveSystemTelemetry() {
  const { t, lang, setLangPref, langPref } = useLanguage();
  const { preferences } = usePreferences();
  const { soundEnabled, setSoundEnabled, feedback } = useFeedback();
  const { isOnline } = useNetworkStatus();
  const { timeParts, timeParts24, nowDate, dayFull } = useWorldTime('Asia/Kolkata');

  const is24h = preferences?.clockFormat === '24h';
  const activeTimeParts = is24h && timeParts24 ? timeParts24 : timeParts;

  const hijriData = useMemo(
    () => getCalibratedHijriDate(nowDate, preferences?.hijriDateOffset || 0),
    [nowDate, preferences?.hijriDateOffset]
  );

  const toggleSound = () => {
    feedback('pop');
    setSoundEnabled(!soundEnabled);
  };

  const toggleLang = () => {
    feedback('tick');
    setLangPref(lang === 'en' ? 'ml' : 'en');
  };

  return (
    <div className="flex flex-col space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-gray-100 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-emerald-500" />
          <span>{t('liveTelemetry', 'Live Operations & Telemetry')}</span>
        </h4>
        <div className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
            {isOnline ? t('networkOnline', 'Live IST') : t('networkOffline', 'Offline')}
          </span>
        </div>
      </div>

      {/* Bento Telemetry Card */}
      <div className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.03] backdrop-blur-xl p-3.5 flex flex-col space-y-3">
        {/* Real-time Clock & Hijri Readout */}
        <div className="flex items-center justify-between border-b border-gray-200/50 dark:border-white/5 pb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-sm sm:text-base font-bold text-gray-900 dark:text-white tracking-tight">
                  {activeTimeParts.hours}:{activeTimeParts.minutes}
                </span>
                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  :{activeTimeParts.seconds}
                </span>
                {!is24h && (
                  <span className="text-[10px] font-medium text-gray-400 dark:text-gray-400 ml-0.5 uppercase">
                    {activeTimeParts.period}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
                <span>{dayFull}</span>
                <span>•</span>
                <span>IST (UTC+05:30)</span>
              </p>
            </div>
          </div>

          {/* Hijri Lunar Date */}
          {preferences?.showHijriDate !== false && hijriData && (
            <div className="text-right">
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                <Calendar className="w-2.5 h-2.5" />
                <span>Hijri</span>
              </span>
              <p className="text-[11px] font-medium text-gray-700 dark:text-gray-300 mt-1">
                {lang === 'ml' ? hijriData.formattedMl : hijriData.formattedEn}
              </p>
            </div>
          )}
        </div>

        {/* Operational Status & Latency indicator */}
        <div className="flex items-center justify-between text-[11px] text-gray-600 dark:text-gray-400">
          <span className="flex items-center gap-1.5">
            {isOnline ? (
              <Wifi className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <WifiOff className="w-3.5 h-3.5 text-amber-500" />
            )}
            <span>{t('allSystemsOperational', 'All Systems Operational')}</span>
          </span>
          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded">
            99.98% SLA
          </span>
        </div>

        {/* Controls: Sound & Language Switchers */}
        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200/50 dark:border-white/5">
          {/* Sound Toggle */}
          <motion.button
            type="button"
            onClick={toggleSound}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-medium transition-colors"
            title={soundEnabled ? t('soundOn') : t('soundOff')}
            aria-label={soundEnabled ? t('soundOn') : t('soundOff')}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-[11px] font-semibold">{t('soundOn', 'Audio On')}</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                <span className="text-[11px] text-gray-400">{t('soundOff', 'Audio Off')}</span>
              </>
            )}
          </motion.button>

          {/* Quick Language Toggle */}
          <motion.button
            type="button"
            onClick={toggleLang}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 px-2.5 py-1.5 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-medium transition-colors"
            title="Toggle Language"
            aria-label="Toggle Language (English / Malayalam)"
          >
            <Languages className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-[11px] font-semibold">
              {lang === 'ml' ? 'English' : 'മലയാളം'}
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
