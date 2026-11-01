import React from 'react';
import { motion } from 'framer-motion';
import { Coffee, Utensils, PowerOff } from 'lucide-react';

/**
 * MealSupplyNoticeCard
 * 
 * Replaces the interactive Meal Flip Card when Canteen Food Supply
 * is suspended for that meal (e.g. Monthly Dars Leave, Nikah, Temporary Close).
 * 
 * Design Language:
 * - GREYED / SHADOWED OUT aesthetic: neither turned ON (emerald) nor turned OFF (rose).
 * - Slate / charcoal / muted graphite with inner shadow (`shadow-inner`).
 * - Neutral PowerOff badge indicating "No Food Supply" / "വിതരണം ഇല്ല".
 * - Clearly displays reason, date, and "0 Portions • No Kitchen Cook".
 */
export default function MealSupplyNoticeCard({
  mealType = 'lunch',
  supplyStatus = {},
  targetDateStr = '',
  dayLabel = '',
  lang = 'en',
  t,
}) {
  const isBreakfast = mealType === 'breakfast';
  const Icon = isBreakfast ? Coffee : Utensils;
  const mealName = isBreakfast
    ? (lang === 'ml' ? 'പ്രഭാതഭക്ഷണം' : 'Breakfast')
    : (lang === 'ml' ? 'ഉച്ചഭക്ഷണം' : 'Lunch');

  const reasonObj = supplyStatus?.reasonObj || {};
  const title =
    lang === 'ml'
      ? (supplyStatus?.noteMl || reasonObj?.labelMl || 'കാന്റീൻ അവധി')
      : (supplyStatus?.noteEn || reasonObj?.labelEn || 'Canteen Closed');

  const desc =
    lang === 'ml'
      ? (supplyStatus?.descMl || reasonObj?.descMl || (isBreakfast ? 'ഈ സമയത്ത് പ്രഭാതഭക്ഷണം ഉണ്ടായിരിക്കുന്നതല്ല.' : 'ഈ സമയത്ത് ഉച്ചഭക്ഷണം ഉണ്ടായിരിക്കുന്നതല്ല.'))
      : (supplyStatus?.descEn || reasonObj?.descEn || (isBreakfast ? 'No breakfast preparation scheduled for this shift.' : 'No lunch preparation scheduled for this shift.'));

  return (
    <motion.div
      initial={{ opacity: 0.85, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.25 }}
      className="relative w-full min-w-0 p-4 xs:p-5 rounded-2xl sm:rounded-3xl flex flex-col justify-between overflow-hidden bg-gradient-to-br from-gray-100 via-gray-150 to-gray-200 dark:from-[#1b2622]/90 dark:via-[#141d1a]/95 dark:to-[#0d1412]/98 text-gray-800 dark:text-gray-300 border-2 border-gray-300/80 dark:border-white/10 shadow-inner select-none"
      style={{ minHeight: '190px' }}
    >
      {/* Subtle Neutral Ambient Shadow / Glow */}
      <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-black/5 dark:bg-white/5 blur-2xl pointer-events-none" />
      <div className="absolute -left-8 -bottom-8 w-28 h-28 rounded-full bg-black/5 dark:bg-white/5 blur-xl pointer-events-none" />

      {/* Header Row */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 xs:w-9 xs:h-9 rounded-xl flex items-center justify-center flex-shrink-0 shadow-inner bg-gray-200 dark:bg-white/10 border border-gray-300 dark:border-white/15 text-gray-600 dark:text-gray-400">
            <Icon className="w-4 h-4 xs:w-4.5 xs:h-4.5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs xs:text-sm font-extrabold tracking-tight text-gray-900 dark:text-white block truncate">
              {mealName}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium block truncate">
              {dayLabel} {targetDateStr ? `• ${targetDateStr}` : ''}
            </span>
          </div>
        </div>

        {/* Status Badge: Greyed / Shadowed Out */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-200/90 dark:bg-white/10 border border-gray-300/80 dark:border-white/15 text-gray-700 dark:text-gray-300 text-[10px] xs:text-[11px] font-extrabold tracking-wide uppercase shadow-inner flex-shrink-0">
          <PowerOff className="w-3 h-3 text-gray-500 dark:text-gray-400" />
          <span>{lang === 'ml' ? 'വിതരണം ഇല്ല' : 'No Food Supply'}</span>
        </div>
      </div>

      {/* Body Notice */}
      <div className="relative z-10 my-3 xs:my-4">
        <h4 className="text-sm xs:text-base font-black text-gray-900 dark:text-gray-100 tracking-tight leading-snug line-clamp-1">
          {title}
        </h4>
        <p className="text-[11px] xs:text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2 leading-relaxed font-medium">
          {desc}
        </p>
      </div>

      {/* Footer Row */}
      <div className="relative z-10 pt-2 border-t border-gray-300/60 dark:border-white/10 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <span className="font-mono font-black text-xs text-gray-700 dark:text-gray-300">
          0 {lang === 'ml' ? 'വിഹിതം' : 'Portions'}
        </span>
        <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {lang === 'ml' ? 'പാചകം ഇല്ല' : 'No Kitchen Cook'}
        </span>
      </div>
    </motion.div>
  );
}

