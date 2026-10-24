import React from 'react';
import { motion } from 'framer-motion';
import {
  Frown,
  Meh,
  Smile,
  SmilePlus,
  Laugh,
  Star,
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { useLanguage } from '../../store/LanguageContext';

const RATINGS = [
  {
    score: 1,
    icon: Frown,
    key: 'rateTerrible',
    defaultLabel: 'Needs Attention',
    color: 'from-rose-500 to-red-600',
    ringColor: 'ring-rose-500/40',
    textColor: 'text-rose-500 dark:text-rose-400',
    bgLight: 'bg-rose-50 dark:bg-rose-950/30',
  },
  {
    score: 2,
    icon: Meh,
    key: 'ratePoor',
    defaultLabel: 'Below Expectations',
    color: 'from-orange-500 to-amber-600',
    ringColor: 'ring-orange-500/40',
    textColor: 'text-orange-500 dark:text-orange-400',
    bgLight: 'bg-orange-50 dark:bg-orange-950/30',
  },
  {
    score: 3,
    icon: Smile,
    key: 'rateFair',
    defaultLabel: 'Acceptable',
    color: 'from-amber-500 to-yellow-600',
    ringColor: 'ring-amber-500/40',
    textColor: 'text-amber-500 dark:text-amber-400',
    bgLight: 'bg-amber-50 dark:bg-amber-950/30',
  },
  {
    score: 4,
    icon: SmilePlus,
    key: 'rateGood',
    defaultLabel: 'Great Taste',
    color: 'from-teal-500 to-emerald-600',
    ringColor: 'ring-teal-500/40',
    textColor: 'text-teal-500 dark:text-teal-400',
    bgLight: 'bg-teal-50 dark:bg-teal-950/30',
  },
  {
    score: 5,
    icon: Laugh,
    key: 'rateExcellent',
    defaultLabel: 'Outstanding!',
    color: 'from-emerald-500 via-green-500 to-teal-500',
    ringColor: 'ring-emerald-500/50 shadow-glow-emerald',
    textColor: 'text-emerald-500 dark:text-emerald-400',
    bgLight: 'bg-emerald-50 dark:bg-emerald-950/40',
  },
];

export default function CareSatisfactionSlider({ value = 4, onChange }) {
  const { t } = useLanguage();
  const currentRating = RATINGS.find((r) => r.score === value) || RATINGS[3];

  const handleSelect = (score) => {
    soundEngine.playMechanicalClick();
    hapticEngine.selectionTick();
    if (onChange) onChange(score);
  };

  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          {t('ratingLabel', 'Meal & Service Satisfaction')}
        </label>
        <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full ${currentRating.bgLight} ${currentRating.textColor} border border-current/20 transition-all`}>
          {t(currentRating.key, currentRating.defaultLabel)}
        </span>
      </div>

      {/* 5-Step Expressive Pill Switcher */}
      <div className="grid grid-cols-5 gap-1.5 sm:gap-2.5 p-1.5 rounded-2xl bg-gray-100/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 backdrop-blur-md">
        {RATINGS.map((item) => {
          const isSelected = item.score === value;
          const Icon = item.icon;
          return (
            <motion.button
              key={item.score}
              type="button"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSelect(item.score)}
              className={`relative flex flex-col items-center justify-center py-2.5 sm:py-3.5 px-1 rounded-xl transition-all cursor-pointer ${
                isSelected
                  ? `bg-white dark:bg-[#16231f] shadow-lg ring-2 ${item.ringColor} text-gray-900 dark:text-white`
                  : 'text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/40 dark:hover:bg-white/5'
              }`}
            >
              <span className={`transition-transform duration-200 ${isSelected ? 'scale-110' : 'opacity-70'}`}>
                <Icon className={`w-6 h-6 sm:w-7 sm:h-7 ${isSelected ? item.textColor : 'text-gray-400 dark:text-gray-500'}`} />
              </span>
              <span className="text-[10px] sm:text-xs font-mono font-bold mt-1 inline-flex items-center gap-0.5">
                {item.score}
                <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400 inline -mt-0.5" />
              </span>

              {isSelected && (
                <motion.div
                  layoutId="activeSatisfactionIndicator"
                  className={`absolute -bottom-1 w-6 h-1 rounded-full bg-gradient-to-r ${item.color}`}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
