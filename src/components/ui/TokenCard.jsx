import React from 'react';
import { motion } from 'framer-motion';
import {
  Lock,
  Utensils,
  Coffee,
  Home,
  CheckCircle2,
  XCircle,
  CalendarDays,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';

/**
 * Detailed Student Token Card View
 * High-density information card showing student identity, dining status, room, and dietary tags.
 */
export default function TokenCard({
  doc,
  isOn,
  onLeave,
  isBlocked,
  isLunch,
  onClick,
  className = '',
}) {
  const { t } = useLanguage();
  const tokenNumber = doc.tokenNo;
  const nameEn = doc.nameEn || doc.name || `Token #${tokenNumber}`;
  const nameMl = doc.nameMl;
  const batch = doc.batch || 'General';

  // Determine dietary exclusion tags
  const dietaryAvoided = [];
  if (doc.obj2) {
    if (doc.obj2.beef === false) dietaryAvoided.push({ id: 'beef', label: t('noBeef', 'No Beef') });
    if (doc.obj2.fish === false) dietaryAvoided.push({ id: 'fish', label: t('noFish', 'No Fish') });
    if (doc.obj2.chicken === false) dietaryAvoided.push({ id: 'chicken', label: t('noChicken', 'No Chicken') });
    if (doc.obj2.mutton === false) dietaryAvoided.push({ id: 'mutton', label: t('noMutton', 'No Mutton') });

    Object.entries(doc.obj2).forEach(([k, v]) => {
      if (v === false && !['beef', 'fish', 'chicken', 'mutton'].includes(k)) {
        dietaryAvoided.push({ id: k, label: `No ${k.charAt(0).toUpperCase() + k.slice(1)}` });
      }
    });
  }

  return (
    <motion.div
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      onClick={() => onClick(doc)}
      className={`relative group rounded-2xl p-3.5 sm:p-4 bg-white/90 dark:bg-[#0f1715]/90 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between gap-2.5 select-none ${
        isBlocked
          ? 'border-gray-300 dark:border-white/10 opacity-75'
          : isOn
          ? 'border-emerald-300/80 dark:border-emerald-500/25 bg-emerald-500/[0.02]'
          : 'border-rose-300/80 dark:border-rose-500/25 bg-rose-500/[0.02]'
      } ${className}`}
    >
      {/* Top Header: Token Number & Meal Status Badge */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {/* Tactile Token Number Square */}
          <div
            className={`relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center font-extrabold font-mono text-sm sm:text-base text-white shadow-sm flex-shrink-0 ${
              isBlocked
                ? 'bg-gradient-to-b from-gray-700 to-gray-900 border border-gray-600'
                : isOn
                ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/25 border border-emerald-400'
                : 'bg-gradient-to-br from-rose-500 to-red-600 shadow-rose-500/25 border border-rose-400'
            }`}
          >
            {tokenNumber}
            {isBlocked && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-800 border border-gray-500 flex items-center justify-center shadow-sm z-10">
                <Lock className="w-2.5 h-2.5 text-gray-300" />
              </span>
            )}
          </div>

          {/* Student Names */}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
              {nameEn}
            </h4>
            {nameMl && (
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium truncate font-malayalam">
                {nameMl}
              </p>
            )}
          </div>
        </div>

        {/* Meal Pill Badge */}
        <div className="flex-shrink-0">
          {isBlocked ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300">
              <Lock className="w-2.5 h-2.5" />
              <span>{t('locked', 'Locked')}</span>
            </span>
          ) : onLeave ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              <CalendarDays className="w-2.5 h-2.5" />
              <span>{t('leave', 'Leave')}</span>
            </span>
          ) : isOn ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-2.5 h-2.5" />
              <span>{isLunch ? t('lunchOn', 'Lunch ON') : t('breakfastOn', 'Breakfast ON')}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
              <XCircle className="w-2.5 h-2.5" />
              <span>{isLunch ? t('lunchOff', 'Lunch OFF') : t('breakfastOff', 'Breakfast OFF')}</span>
            </span>
          )}
        </div>
      </div>

      {/* Middle & Footer: Batch & Dietary Badges */}
      <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-1.5 text-[10px] text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-md truncate max-w-[140px]">{batch}</span>
        </div>

        {/* Dietary avoidance tags if any */}
        {dietaryAvoided.length > 0 && (
          <div className="flex items-center gap-1 flex-wrap">
            {dietaryAvoided.map((item) => (
              <span
                key={item.id}
                className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/20"
              >
                {item.label}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
