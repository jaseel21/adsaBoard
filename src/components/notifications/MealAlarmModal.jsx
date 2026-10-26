import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellRing,
  Clock,
  Volume2,
  Vibrate,
  ShieldCheck,
  X,
  Sparkles,
  Check,
  AlertTriangle,
} from 'lucide-react';
import {
  getMealAlarmConfig,
  saveMealAlarmConfig,
} from '../../utils/mealAlarmService';
import {
  isPermissionGranted,
  requestNotificationPermission,
} from '../../utils/webNotificationService';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';

export default function MealAlarmModal({ isOpen, onClose }) {
  const { lang } = useLanguage();
  const { feedback } = useFeedback();

  const [config, setConfig] = useState(getMealAlarmConfig);
  const [hasNotifPermission, setHasNotifPermission] = useState(isPermissionGranted);

  useEffect(() => {
    if (isOpen) {
      setConfig(getMealAlarmConfig());
      setHasNotifPermission(isPermissionGranted());
    }
  }, [isOpen]);

  const updateSetting = (key, value) => {
    feedback('tick');
    const updated = { ...config, [key]: value };
    setConfig(updated);
    saveMealAlarmConfig(updated);
  };

  const handleRequestPermission = async () => {
    feedback('pop');
    const result = await requestNotificationPermission();
    if (result === 'granted') {
      setHasNotifPermission(true);
      feedback('success');
    } else {
      setHasNotifPermission(false);
      feedback('warning');
    }
  };

  const handleTestChime = () => {
    feedback('tick');
    soundEngine.playCutoffAlarmChime();
    hapticEngine.urgentAlert();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div data-lenis-prevent className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-auto overscroll-contain">
        {/* Scrim backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        />

        {/* Modal Card / Bottom Sheet on mobile */}
        <motion.div
          role="dialog"
          aria-modal="true"
          data-lenis-prevent
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
          className="relative w-full max-w-lg rounded-t-[32px] sm:rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200 dark:border-white/10 p-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] sm:pb-5 shadow-2xl z-10 space-y-4 max-h-[90vh] overflow-y-auto overscroll-contain"
        >
          {/* Top handle on mobile */}
          <div className="sm:hidden w-10 h-1 rounded-full bg-gray-300 dark:bg-white/20 mx-auto" />

          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <BellRing className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white tracking-tight">
                  {lang === 'ml' ? 'മീൽ കട്ട് ഓഫ് അലാറം & ഓർമ്മപ്പെടുത്തലുകൾ' : 'Meal Cutoff Alarms & Reminders'}
                </h3>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {lang === 'ml' ? 'പിഴകൾ ഒഴിവാക്കാൻ സമയബന്ധിതമായ മുന്നറിയിപ്പുകൾ' : 'Prevent missed cutoff fine penalties (₹50 - ₹200)'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Notification Permission Card (if not granted) */}
          {!hasNotifPermission && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-500" />
                <span>
                  {lang === 'ml'
                    ? 'ബ്രൗസർ നോട്ടിഫിക്കേഷനുകൾ അനുവദിക്കുക'
                    : 'Enable browser notifications for background reminders'}
                </span>
              </div>
              <button
                type="button"
                onClick={handleRequestPermission}
                className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-[11px] flex-shrink-0 cursor-pointer"
              >
                {lang === 'ml' ? 'അനുവദിക്കുക' : 'Allow'}
              </button>
            </div>
          )}

          {/* Master Enable Toggle */}
          <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white">
                {lang === 'ml' ? 'കട്ട് ഓഫ് അലാറം പ്രവർത്തനക്ഷമമാക്കുക' : 'Enable Meal Cutoff Reminders'}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {lang === 'ml' ? 'ഓരോ ഭക്ഷണ സമയത്തിനു മുൻപും ഓർമ്മിപ്പിക്കും' : 'Audible & haptic notification before deadline'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => updateSetting('enabled', !config.enabled)}
              className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer ${
                config.enabled ? 'bg-emerald-600' : 'bg-gray-300 dark:bg-white/20'
              }`}
            >
              <span
                className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                  config.enabled ? 'translate-x-6' : 'translate-x-1'
                } mt-1`}
              />
            </button>
          </div>

          {/* Meal Toggles */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {lang === 'ml' ? 'ഓർമ്മപ്പെടുത്തേണ്ട സമയങ്ങൾ' : 'Meals to Monitor'}
            </label>

            {/* Breakfast */}
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    {lang === 'ml' ? 'പ്രഭാത ഭക്ഷണം (Breakfast Cutoff)' : 'Breakfast Cutoff (07:00 AM)'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {lang === 'ml' ? 'കട്ട് ഓഫ് സമയം: രാവിലെ 07:00' : 'Daily deadline before kitchen dispatch'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.breakfastReminder}
                onChange={(e) => updateSetting('breakfastReminder', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
              />
            </div>

            {/* Lunch */}
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-500" />
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    {lang === 'ml' ? 'ഉച്ചഭക്ഷണം (Lunch Cutoff)' : 'Lunch Cutoff (12:45 PM / Fri 01:15 PM)'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {lang === 'ml' ? 'വെള്ളി ജുമുഅക്ക് 01:15 PM' : 'Tailored for daily and Friday Jumu’ah'}
                  </p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.lunchReminder}
                onChange={(e) => updateSetting('lunchReminder', e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 accent-emerald-600 cursor-pointer"
              />
            </div>
          </div>

          {/* Advance Reminder Pills */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              {lang === 'ml' ? 'എത്ര സമയം മുൻപ് അറിയിക്കണം?' : 'Advance Warning Window'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => updateSetting('advanceMinutes', mins)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    config.advanceMinutes === mins
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border-transparent hover:bg-gray-200 dark:hover:bg-white/10'
                  }`}
                >
                  {mins} {lang === 'ml' ? 'മിനിറ്റ് മുൻപ്' : 'mins before'}
                </button>
              ))}
            </div>
          </div>

          {/* Sound & Haptic Test Row */}
          <div className="pt-2 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={handleTestChime}
              className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-800 dark:text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
            >
              <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
              <span>{lang === 'ml' ? 'അലാറം കേൾക്കുക' : 'Test Sound & Haptic'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer active:scale-98"
            >
              {lang === 'ml' ? 'സേവ് ചെയ്തു പൂർത്തിയാക്കുക' : 'Done'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
