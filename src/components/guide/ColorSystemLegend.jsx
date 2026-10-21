import React from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  CalendarDays,
  Lock,
  Utensils,
  Coffee,
  ShieldAlert,
  Sparkles,
  Info,
  Layers,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { guideStaggerVariants, guideItemVariants } from './guideAnimations';

const ColorSystemLegend = () => {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const states = [
    {
      id: 'active',
      title: t('colorGreenTitle') || 'Emerald Green (Active Meal)',
      desc: t('colorGreenDesc') || 'Meal is confirmed for this student. The kitchen prepares this portion.',
      previewClass: 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/30 border border-emerald-400/50',
      badge: 'ACTIVE SERVING',
      badgeClass: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
      tokenNumber: '07',
      icon: CheckCircle2,
      dot: 'bg-white/80',
      sound: 'tick',
    },
    {
      id: 'skipped',
      title: t('colorRedTitle') || 'Rose Red (Skipped Meal)',
      desc: t('colorRedDesc') || 'Student opted out. No food is prepared; excluded from kitchen totals.',
      previewClass: 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/30 border border-rose-400/50',
      badge: 'SKIPPED / OFF',
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      tokenNumber: '42',
      icon: XCircle,
      dot: 'bg-white/60',
      sound: 'pop',
    },
    {
      id: 'leave',
      title: t('colorLeaveTitle') || 'Rose Red (Single-Day Leave / OFF)',
      desc: t('colorLeaveDesc') || 'Student has a temporary single-day override OR opted out for this date. Token displays as red — same as routine OFF. Check the details modal for the specific reason.',
      previewClass: 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/30 border border-rose-400/50',
      badge: '1-DAY EXCEPTION',
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      tokenNumber: '108',
      icon: CalendarDays,
      dot: 'bg-white/60',
      sound: 'success',
    },
    {
      id: 'blocked',
      title: t('colorBlockedTitle') || 'Charcoal Dark (Admin Blocked)',
      desc: t('colorBlockedDesc') || 'Account locked by administration. Please contact the ADSA canteen committee.',
      previewClass: 'bg-gradient-to-b from-gray-700 to-gray-900 text-gray-300 border border-gray-600/50 shadow-inner',
      badge: 'LOCKED / BLOCKED',
      badgeClass: 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30',
      tokenNumber: '189',
      icon: Lock,
      isBlocked: true,
      sound: 'warning',
    },
  ];

  const dietaryTags = [
    {
      name: 'Beef Avoiders (ബീഫ് ഒഴിവാക്കൽ)',
      desc: 'Excluded from beef preparations. Alternative fish/veg provided.',
      badgeClass: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
      dotClass: 'bg-rose-500',
    },
    {
      name: 'Chicken Avoiders (ചിക്കൻ ഒഴിവാക്കൽ)',
      desc: 'Excluded from chicken curries or fries.',
      badgeClass: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
      dotClass: 'bg-amber-500',
    },
    {
      name: 'Fish Avoiders (മീൻ ഒഴിവാക്കൽ)',
      desc: 'Exempted from fish dishes.',
      badgeClass: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',
      dotClass: 'bg-cyan-500',
    },
    {
      name: 'Mutton Avoiders (മട്ടൺ ഒഴിവാക്കൽ)',
      desc: 'Exempted from mutton gravies on feast days.',
      badgeClass: 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30',
      dotClass: 'bg-purple-500',
    },
  ];

  return (
    <motion.div
      variants={guideStaggerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Introduction Banner */}
      <motion.div
        variants={guideItemVariants}
        className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              Simplified Color Taxonomy
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              3-color system: Green for active servings, Red for any OFF state (routine or temporary leave), Dark for admin-blocked tokens.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-xl bg-white/70 dark:bg-white/10 text-emerald-800 dark:text-emerald-200 border border-emerald-500/20 shadow-sm">
          <Info className="w-4 h-4 text-emerald-500" />
          <span>Tap any swatch to hear its sonic profile</span>
        </div>
      </motion.div>

      {/* Anatomy of a Token Spotlight */}
      <motion.div
        variants={guideItemVariants}
        className="p-6 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm"
      >
        <h4 className="text-sm font-extrabold text-gray-900 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
          <span>Token Button Anatomy & Visual Clues</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
          {/* Interactive Visual Token Callout Graphic */}
          <div className="flex justify-center p-8 rounded-2xl bg-gray-50 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 relative overflow-hidden">
            <div className="relative">
              {/* Sample Animated Token */}
              <motion.div
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => feedback('success')}
                className="w-24 h-24 rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 text-white border border-rose-400 shadow-xl shadow-rose-500/30 flex items-center justify-center font-mono font-black text-3xl select-none relative cursor-pointer group"
              >
                {/* CalendarDays icon badge for single-day leaves */}
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-700 border border-rose-400 flex items-center justify-center shadow-md">
                  <CalendarDays className="w-3 h-3 text-white" />
                </span>
                <span>108</span>
                {/* Center attendance dot */}
                <span className="absolute bottom-2 w-2 h-2 rounded-full bg-white/80" />
              </motion.div>

              {/* Callout Arrow: Leave Dot */}
              <div className="hidden sm:block absolute -top-4 -right-28 text-left">
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                  <CalendarDays className="w-3 h-3" />
                  <span>Leave Badge (Single-Day)</span>
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 w-32 leading-tight">
                  CalendarDays icon badge signals a temporary exception. Token is red like any OFF state.
                </div>
              </div>

              {/* Callout Arrow: Token Number */}
              <div className="hidden sm:block absolute top-8 -left-36 text-right">
                <div className="text-[11px] font-bold text-gray-900 dark:text-white">
                  Student Token # (Mono)
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 w-32 leading-tight">
                  High-contrast numerical identification (1 - 197).
                </div>
              </div>
            </div>
          </div>

          {/* Descriptive Breakdown */}
          <div className="space-y-3.5 text-xs">
            <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/20 border border-emerald-500/20">
              <span className="font-extrabold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                1. Simplified 3-Color System
              </span>
              <p className="text-gray-600 dark:text-gray-300">
                All OFF states — whether from the weekly routine or a single-day exception — display as <strong>Red</strong>. Tap any red token to view the details modal and see if it&apos;s a routine OFF or a temporary leave.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-100/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
              <span className="font-extrabold text-gray-900 dark:text-white block mb-0.5">
                2. Tap to Inspect Without Logging In
              </span>
              <p className="text-gray-600 dark:text-gray-300">
                Anyone can tap any token on the board to view the student&apos;s full 7-day schedule, dietary exemptions, batch number, and Malayalam name.
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* The 4 Core State Swatches */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {states.map((st) => {
          const Icon = st.icon;
          return (
            <motion.div
              key={st.id}
              variants={guideItemVariants}
              whileHover={{ y: -3 }}
              onClick={() => feedback(st.sound)}
              className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm hover:shadow-md transition-all cursor-pointer group flex items-start gap-4"
            >
              {/* Token Swatch Sample */}
              <div
                className={`w-14 h-14 rounded-2xl aspect-square flex items-center justify-center font-mono font-extrabold text-lg select-none relative flex-shrink-0 group-hover:scale-105 transition-transform ${st.previewClass}`}
              >
                {st.leaveDot && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-yellow-300 animate-pulse border border-orange-500" />
                )}
                {st.isBlocked ? (
                  <Lock className="w-5 h-5 text-gray-300" />
                ) : (
                  <span>{st.tokenNumber}</span>
                )}
                {st.dot && (
                  <span className={`absolute bottom-1 w-1.5 h-1.5 rounded-full ${st.dot}`} />
                )}
              </div>

              {/* Text Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
                    {st.title}
                  </h4>
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase tracking-wider border flex-shrink-0 ${st.badgeClass}`}>
                    {st.badge}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                  {st.desc}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Meal Category & Dietary Allergen Color Codes */}
      <motion.div
        variants={guideItemVariants}
        className="p-6 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4"
      >
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Utensils className="w-4 h-4 text-emerald-500" />
            <span>Meal Slots & Dietary Allergen Indicators</span>
          </h4>
          <span className="text-xs text-gray-500">Kitchen & Mess Protocol</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Breakfast vs Lunch Slot Distinction */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-500/20 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                  Breakfast Slot (പ്രഭാതഭക്ഷണം)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300">
                  Amber Glow
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                Morning tiffin operations. Governs early morning attendance rosters.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                  Lunch Slot (ഉച്ചഭക്ഷണം)
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  Emerald Green
                </span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                Active midday meal. Monitored for rice, curries, sides, and protein portioning.
              </p>
            </div>
          </div>
        </div>

        {/* Dietary Tag Badges */}
        <div className="pt-2">
          <span className="text-xs font-bold text-gray-500 dark:text-gray-400 block mb-2.5">
            Dietary Avoider Badges (ഭക്ഷണ നിയന്ത്രണങ്ങൾ):
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {dietaryTags.map((tag) => (
              <div
                key={tag.name}
                className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 flex flex-col justify-between gap-1.5"
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${tag.dotClass}`} />
                  <span className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                    {tag.name.split(' (')[0]}
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-snug">
                  {tag.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ColorSystemLegend;
