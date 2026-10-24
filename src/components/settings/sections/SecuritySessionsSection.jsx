import React from 'react';
import { Shield, Clock, Laptop, AlertTriangle, KeyRound, LogOut, Check } from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { dialog } from '../../../utils/dialog';

export default function SecuritySessionsSection({
  preferences,
  setPreference,
  user,
  stdata,
}) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  const handleTimeoutSelect = (mode) => {
    feedback('tick');
    setPreference('kioskTimeoutMode', mode);
  };

  const handlePurgeAllSessions = async () => {
    const confirmed = await dialog.confirm({
      title: language === 'ml' ? 'സെഷൻ ക്ലിയർ ചെയ്യണോ?' : 'Purge Active Client Sessions?',
      message: language === 'ml'
        ? 'ഇത് ഈ ബ്രൗസറിലെ എല്ലാ താൽക്കാലിക ലോഗിൻ വിവരങ്ങളും ക്ലിയർ ചെയ്യും.'
        : 'This will terminate current session tokens and clear all cached credentials on this device.',
      confirmText: language === 'ml' ? 'ക്ലിയർ ചെയ്യുക' : 'Purge Sessions',
      cancelText: language === 'ml' ? 'റദ്ദാക്കുക' : 'Cancel',
      confirmColor: 'rose',
      icon: 'warning',
    });

    if (confirmed) {
      sessionStorage.clear();
      feedback('pop');
      dialog.toast.info('Sessions Cleared', 'Active tokens cleared from this terminal.');
      window.location.reload();
    }
  };

  // Device telemetry inspection
  const browserAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  const screenResolution = typeof window !== 'undefined' ? `${window.innerWidth} x ${window.innerHeight}` : 'Standard';

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="pb-3 border-b border-gray-200/80 dark:border-white/10">
        <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-emerald-500" />
          <span>{language === 'ml' ? 'സുരക്ഷ & കിയോസ്ക്' : 'Security, Sessions & Kiosk Guards'}</span>
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {language === 'ml'
            ? 'പൊതു കിയോസ്ക് ഓട്ടോ-ലോഗൗട്ട്, സെഷൻ സമയം എന്നിവ നിയന്ത്രിക്കുക'
            : 'Configure shared public terminal timeouts and inspect active client telemetry'}
        </p>
      </div>

      {/* 1. Kiosk Guard Timeout Policy */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div>
          <label className="text-xs font-extrabold text-gray-800 dark:text-gray-200 block mb-1">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-500" />
              <span>{language === 'ml' ? 'കിയോസ്ക് ഓട്ടോ-ലോഗൗട്ട് സമയം' : 'Campus Kiosk Idle Guard Timeout'}</span>
            </span>
          </label>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml'
              ? 'പൊതു ടാബ്‌ലെറ്റുകളിൽ വിദ്യാർത്ഥികളുടെ വിവരങ്ങൾ സുരക്ഷിതമാക്കാൻ നിശ്ചിത സമയത്തിന് ശേഷം തനിയെ ലോഗൗട്ടാകും'
              : 'Select how quickly inactive sessions sign out to protect credentials on shared dining hall terminals'}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {[
            {
              id: 'strict',
              labelEn: 'Strict (90s)',
              labelMl: 'കർശനമായത് (90 സെക്കന്റ്)',
              descEn: 'Public shared tablets • 15s warning chime',
              descMl: 'പൊതു ടാബ്‌ലെറ്റുകൾക്ക് ഏറ്റവും സുരക്ഷിതം',
            },
            {
              id: 'extended',
              labelEn: 'Extended (15m)',
              labelMl: 'നീട്ടിയത് (15 മിനിറ്റ്)',
              descEn: 'Personal smartphones & private laptops',
              descMl: 'സ്വന്തം ഫോണുകൾക്കും ലാപ്ടോപ്പുകൾക്കും',
            },
            {
              id: 'persistent',
              labelEn: 'Persistent Kiosk (24h)',
              labelMl: 'സ്ഥിരം കിയോസ്ക് (24 മണിക്കൂർ)',
              descEn: 'Wall-mounted kitchen KDS screens',
              descMl: 'അടുക്കളയിലെ സ്ഥിരം ഡിസ്‌പ്ലേകൾക്ക്',
            },
          ].map((item) => {
            const isSelected = preferences.kioskTimeoutMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTimeoutSelect(item.id)}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/50 shadow-xs text-emerald-900 dark:text-emerald-100 ring-1 ring-emerald-500/30'
                    : 'bg-gray-50 dark:bg-white/5 border-gray-200/70 dark:border-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold">{language === 'ml' ? item.labelMl : item.labelEn}</span>
                  {isSelected && <Check className="w-4 h-4 text-emerald-500" />}
                </div>
                <span className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 font-medium">
                  {language === 'ml' ? item.descMl : item.descEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Active Session Telemetry */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white/80 dark:bg-[#0c1412]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Laptop className="w-4 h-4 text-emerald-500" />
            <span className="text-xs font-extrabold text-gray-800 dark:text-gray-200">
              {language === 'ml' ? 'ഈ ഡിവൈസിലെ സെഷൻ വിവരങ്ങൾ' : 'Current Client Terminal Telemetry'}
            </span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            Secure Session
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[10px] text-gray-400 font-bold block mb-1">Active Authentication</span>
            <span className="font-extrabold text-gray-800 dark:text-gray-200">
              {stdata ? `Student Token #${stdata.tokenNo}` : user ? user.email : 'Unauthenticated Guest'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[10px] text-gray-400 font-bold block mb-1">Screen Viewport</span>
            <span className="font-mono text-gray-800 dark:text-gray-200">{screenResolution}</span>
          </div>
        </div>

        {/* Emergency Session Purge */}
        <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            {language === 'ml' ? 'പൊതു കമ്പ്യൂട്ടറുകളിൽ നിന്ന് ഇറങ്ങുമ്പോൾ സെഷൻ ക്ലിയർ ചെയ്യുക' : 'Safely invalidate cached session tokens on shared devices'}
          </span>
          <button
            type="button"
            onClick={handlePurgeAllSessions}
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-colors flex items-center gap-1.5 flex-shrink-0"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>{language === 'ml' ? 'സെഷൻ മായ്‌ക്കുക' : 'Purge Session'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
