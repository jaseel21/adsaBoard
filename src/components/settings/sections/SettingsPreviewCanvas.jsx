import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Utensils, Coffee, Sparkles, Check, Flame } from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';

export default function SettingsPreviewCanvas({ preferences }) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();
  const [activeBreakfast, setActiveBreakfast] = useState(true);
  const [activeLunch, setActiveLunch] = useState(true);

  const toggleBreakfast = () => {
    feedback('tick');
    setActiveBreakfast((prev) => !prev);
  };

  const toggleLunch = () => {
    feedback('pop');
    setActiveLunch((prev) => !prev);
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 border border-emerald-500/20 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-emerald-500 animate-pulse" />
          <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
            {language === 'ml' ? 'തത്സമയ പ്രിവ്യൂ കാൻവാസ്' : 'Live Interactive Keycap Preview'}
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          Interactive
        </span>
      </div>

      <p className="text-[11px] text-gray-500 dark:text-gray-400">
        {language === 'ml'
          ? 'നിങ്ങൾ മാറ്റുന്ന തീമുകളും അക്ഷര വലിപ്പങ്ങളും ഇവിടെ തത്സമയം കാണാം. ടോക്കൺ ബട്ടണുകൾ ക്ലിക്ക് ചെയ്ത് ശബ്ദം പരീക്ഷിക്കുക.'
          : 'Preview how tokens, badges, and font scales will appear in real time across the application.'}
      </p>

      {/* Embedded Live Interactive Keycap Sample */}
      <div className="p-4 rounded-2xl bg-white/70 dark:bg-[#080d0b]/70 border border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Token Card */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex flex-col items-center justify-center font-black shadow-md shadow-emerald-500/20 flex-shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-tight opacity-90 leading-none">NO</span>
            <span className="text-lg leading-none mt-0.5">42</span>
          </div>

          <div>
            <div className="text-sm font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
              <span>{language === 'ml' ? 'മുഹമ്മദ് റാഷിദ്' : 'Muhammed Rashid'}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-600/30">
                Thooba 2
              </span>
            </div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400">
              {language === 'ml' ? 'റൂം 104 • ബാച്ച് 2024' : 'Room 104 • Batch 2024'}
            </span>
          </div>
        </div>

        {/* Tactile Keycap Buttons */}
        <div className="flex items-center gap-2">
          {/* Breakfast Toggle */}
          <button
            type="button"
            onClick={toggleBreakfast}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs ${
              activeBreakfast
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-gray-100 dark:bg-white/10 text-gray-400 line-through opacity-70'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>{language === 'ml' ? 'പ്രാതൽ' : 'Breakfast'}</span>
          </button>

          {/* Lunch Toggle */}
          <button
            type="button"
            onClick={toggleLunch}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95 shadow-xs ${
              activeLunch
                ? 'bg-teal-600 text-white shadow-teal-600/20'
                : 'bg-gray-100 dark:bg-white/10 text-gray-400 line-through opacity-70'
            }`}
          >
            <Utensils className="w-3.5 h-3.5" />
            <span>{language === 'ml' ? 'ഉച്ചഭക്ഷണം' : 'Lunch'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
