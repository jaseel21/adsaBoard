import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  Utensils,
  Coffee,
  UtensilsCrossed,
  CalendarDays,
  ShieldAlert,
  ArrowUpRight,
  TrendingUp,
  Activity,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';

export default function ApexTelemetryHud({
  documents = [],
  filteredDocuments = [],
  isLunch = true,
  metrics = {},
  preferencesList = [],
  targetDateIST,
  onOpenDietaryModal,
  onFilterCategory,
  activeFilter,
}) {
  const { t } = useLanguage();
  const totalTokens = documents.length;
  const activeCount = isLunch ? metrics.lunchCount : metrics.breakfastCount;
  const activePercent = totalTokens > 0 ? Math.round((activeCount / totalTokens) * 100) : 0;
  const optedOutCount = Math.max(0, totalTokens - activeCount);

  // Compute special dietary counts
  const dietaryStats = useMemo(() => {
    let specialCount = 0;
    let beefAvoid = 0;
    let fishAvoid = 0;
    let chickenAvoid = 0;
    let onLeaveCount = 0;
    let blockedCount = 0;

    documents.forEach((doc) => {
      if (doc.block) {
        blockedCount++;
        return;
      }

      // Check date exception
      const exceptions = doc.dateExceptions || {};
      const mealKey = isLunch ? 'lunch' : 'breakfast';
      if (exceptions[targetDateIST] && exceptions[targetDateIST][mealKey] === false) {
        onLeaveCount++;
      }

      // Check dietary avoidances
      const obj2 = doc.obj2 || {};
      const hasBeefAvoid = obj2.beef === false;
      const hasFishAvoid = obj2.fish === false;
      const hasChickenAvoid = obj2.chicken === false;

      if (hasBeefAvoid) beefAvoid++;
      if (hasFishAvoid) fishAvoid++;
      if (hasChickenAvoid) chickenAvoid++;

      if (hasBeefAvoid || hasFishAvoid || hasChickenAvoid) {
        specialCount++;
      }
    });

    return {
      specialCount,
      beefAvoid,
      fishAvoid,
      chickenAvoid,
      onLeaveCount,
      blockedCount,
    };
  }, [documents, isLunch, targetDateIST]);

  const cards = [
    // Pod 1: Live Dining Attendance
    {
      id: 'attendance',
      title: t('activeAttendanceRate', 'Active Attendance Rate'),
      value: `${activePercent}%`,
      subtitle: `${activeCount} / ${totalTokens} ${t('tokensDining', 'Tokens Dining')}`,
      color: 'emerald',
      icon: Activity,
      progress: activePercent,
      metricLabel: `${optedOutCount} ${t('cancelled', 'Cancelled')}`,
      badge: t('liveAttendance', 'Live Attendance'),
      gradient: 'from-emerald-500/10 to-green-500/5',
      borderColor: 'border-emerald-500/30',
      textColor: 'text-emerald-700 dark:text-emerald-400',
    },

    // Pod 2: Catering & Kitchen Load
    {
      id: 'kitchen',
      title: `${t('cateringPrepLoad', 'Catering Prep Load')} (${isLunch ? t('lunch', 'Lunch') : t('breakfast', 'Breakfast')})`,
      value: String(activeCount),
      subtitle: `${activeCount - dietaryStats.specialCount} ${t('regular', 'Regular')} • ${dietaryStats.specialCount} ${t('custom', 'Custom')}`,
      color: isLunch ? 'emerald' : 'amber',
      icon: isLunch ? Utensils : Coffee,
      progress: activePercent,
      metricLabel: t('kitchenDispatch', 'Kitchen Dispatch'),
      badge: t('shiftTarget', 'Shift Target'),
      gradient: isLunch ? 'from-emerald-500/10 to-teal-500/5' : 'from-amber-500/10 to-orange-500/5',
      borderColor: isLunch ? 'border-emerald-500/30' : 'border-amber-500/30',
      textColor: isLunch ? 'text-emerald-700 dark:text-emerald-400' : 'text-amber-700 dark:text-amber-400',
      action: onOpenDietaryModal,
      actionLabel: t('viewSheet', 'View Sheet →'),
    },

    // Pod 3: Dietary Care & Allergens
    {
      id: 'dietary',
      title: t('dietaryCareMedical', 'Dietary Care & Medical'),
      value: String(dietaryStats.specialCount),
      subtitle: `${dietaryStats.beefAvoid} ${t('noBeef', 'No Beef')} • ${dietaryStats.fishAvoid} ${t('noFish', 'No Fish')}`,
      color: 'amber',
      icon: UtensilsCrossed,
      progress: Math.min(100, Math.round((dietaryStats.specialCount / (totalTokens || 1)) * 100)),
      metricLabel: t('specialOrders', 'Special Orders'),
      badge: t('allergenRadar', 'Allergen Radar'),
      gradient: 'from-amber-500/10 to-yellow-500/5',
      borderColor: 'border-amber-500/30',
      textColor: 'text-amber-700 dark:text-amber-400',
      action: onOpenDietaryModal,
      actionLabel: t('dietaryBreakdown', 'Dietary Breakdown →'),
    },

    // Pod 4: Campus Leave & Exceptions
    {
      id: 'leaves',
      title: t('campusLeavesOutages', 'Campus Leaves & Outages'),
      value: String(dietaryStats.onLeaveCount),
      subtitle: `${dietaryStats.blockedCount} ${t('blockedAccounts', 'Blocked/Locked Accounts')}`,
      color: 'rose',
      icon: CalendarDays,
      progress: Math.min(100, Math.round((dietaryStats.onLeaveCount / (totalTokens || 1)) * 100)),
      metricLabel: t('scheduledLeaves', 'Scheduled Leaves'),
      badge: t('leaveRadar', 'Leave Radar'),
      gradient: 'from-rose-500/10 to-red-500/5',
      borderColor: 'border-rose-500/30',
      textColor: 'text-rose-700 dark:text-rose-400',
    },
  ];

  return (
    <div className="grid grid-cols-1 min-[420px]:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-full min-w-0">
      {cards.map((card, idx) => {
        const IconComp = card.icon;
        return (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: idx * 0.05 }}
            whileHover={{ y: -3, scale: 1.01 }}
            onClick={() => {
              soundEngine.playPop();
              hapticEngine.lightTap();
              if (card.action) card.action();
            }}
            className={`
              relative group p-3.5 sm:p-5 rounded-2xl sm:rounded-3xl
              bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10
              shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur-xl flex flex-col justify-between
              min-w-0 overflow-hidden
              ${card.action ? 'cursor-pointer' : ''}
            `}
          >
            {/* Top Bar with Icon & Badge */}
            <div className="flex items-center justify-between gap-2 min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                {card.title}
              </span>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center shrink-0 ${card.textColor}`}>
                <IconComp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
            </div>

            {/* Central Metric Value */}
            <div className="mt-2.5 space-y-1 min-w-0">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-2xl sm:text-3xl lg:text-4xl font-black font-mono tracking-tight text-gray-900 dark:text-white shrink-0">
                  {card.value}
                </span>
                <span className="text-[10px] sm:text-xs font-bold text-gray-400 truncate">
                  {card.metricLabel}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-medium text-gray-500 dark:text-gray-400 truncate">
                {card.subtitle}
              </p>
            </div>

            {/* Micro Progress Bar & Quick Action */}
            <div className="mt-3 pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2 min-w-0">
              <div className="flex-1 min-w-[24px] h-1.5 rounded-full bg-gray-100 dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    card.color === 'rose'
                      ? 'bg-rose-500'
                      : card.color === 'amber'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, card.progress)}%` }}
                />
              </div>

              {card.actionLabel && (
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 truncate max-w-[120px]">
                  {card.actionLabel}
                </span>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
