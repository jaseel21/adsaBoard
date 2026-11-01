import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Sparkles,
  AlertTriangle,
  ChefHat,
  BookOpen,
  Info,
  Clock,
  Users,
  Utensils,
  Coffee,
  Edit2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { formatFriendlyDate } from '../../utils/studentExceptionService';

const CATEGORY_STYLES = {
  dars_leave: {
    gradient: 'from-indigo-900/90 via-slate-900/90 to-teal-950/90 border-teal-500/30 text-teal-100',
    badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-400/40',
    iconColor: 'text-teal-400',
    Icon: Calendar,
  },
  nikah: {
    gradient: 'from-emerald-950/90 via-slate-900/90 to-amber-950/90 border-amber-500/30 text-amber-100',
    badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    iconColor: 'text-amber-400',
    Icon: Sparkles,
  },
  temporary_close: {
    gradient: 'from-rose-950/90 via-slate-900/90 to-red-950/90 border-rose-500/30 text-rose-100',
    badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    iconColor: 'text-rose-400',
    Icon: AlertTriangle,
  },
  special_feast: {
    gradient: 'from-amber-950/90 via-slate-900/90 to-orange-950/90 border-orange-500/30 text-orange-100',
    badgeBg: 'bg-orange-500/20 text-orange-300 border-orange-400/40',
    iconColor: 'text-orange-400',
    Icon: ChefHat,
  },
  exam_leave: {
    gradient: 'from-purple-950/90 via-slate-900/90 to-blue-950/90 border-purple-500/30 text-purple-100',
    badgeBg: 'bg-purple-500/20 text-purple-300 border-purple-400/40',
    iconColor: 'text-purple-400',
    Icon: BookOpen,
  },
  general: {
    gradient: 'from-slate-900/90 via-teal-950/90 to-slate-900/90 border-cyan-500/30 text-cyan-100',
    badgeBg: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40',
    iconColor: 'text-cyan-400',
    Icon: Info,
  },
};

export default function BoardNoticeBanner({
  notice,
  targetDateIST,
  isAdmin = false,
  onOpenNoticeManager = null,
  onOpenSupplySwitch = null,
  className = '',
}) {
  const { lang, t } = useLanguage();
  const { feedback } = useFeedback();

  if (!notice) return null;

  const style = CATEGORY_STYLES[notice.category] || CATEGORY_STYLES.general;
  const CategoryIcon = style.Icon;

  const displayTitle = lang === 'ml' && notice.titleMl ? notice.titleMl : notice.title;
  const displayBadge = lang === 'ml' && notice.badgeText ? notice.badgeText : (notice.badgeTextEn || notice.badgeText || 'Notice');
  const displayDesc = lang === 'ml' && notice.descriptionMl ? notice.descriptionMl : notice.description;

  const mealLabel =
    notice.mealScope === 'breakfast'
      ? t('navBreakfast', 'Breakfast')
      : notice.mealScope === 'lunch'
      ? t('navLunch', 'Lunch')
      : t('bothMeals', 'Both Breakfast & Lunch');

  const isClosed = notice.canteenStatus === 'closed';
  const isSpecial = notice.canteenStatus === 'open_special';

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={notice.id}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className={`relative w-full rounded-2xl sm:rounded-3xl p-4 sm:p-5 bg-gradient-to-r ${style.gradient} border backdrop-blur-xl shadow-lg overflow-hidden ${className}`}
      >
        {/* Subtle decorative glow */}
        <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
          {/* Left: Icon & Notice Details */}
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="p-2.5 sm:p-3 rounded-2xl bg-white/10 border border-white/10 shrink-0 backdrop-blur-md">
              <CategoryIcon className={`w-5 h-5 sm:w-6 sm:h-6 ${style.iconColor}`} />
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider border ${style.badgeBg}`}
                >
                  {displayBadge}
                </span>

                {isClosed && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    <ShieldAlert className="w-3 h-3" />
                    {t('canteenClosedNotice', 'Canteen Closed')}
                  </span>
                )}

                {isSpecial && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40">
                    <ChefHat className="w-3 h-3" />
                    {t('specialFeastNotice', 'Special Dining Menu')}
                  </span>
                )}

                <span className="inline-flex items-center gap-1 text-[11px] text-white/70">
                  <Clock className="w-3 h-3 text-white/50" />
                  {mealLabel}
                </span>
              </div>

              <h2 className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-xs">
                {displayTitle}
              </h2>

              {displayDesc && (
                <p className="text-xs sm:text-sm text-white/80 line-clamp-2 leading-relaxed">
                  {displayDesc}
                </p>
              )}

              {/* Batches Affected note if not all */}
              {Array.isArray(notice.targetBatches) && notice.targetBatches.length > 0 && (
                <div className="flex items-center gap-1.5 text-[11px] text-white/60 pt-0.5">
                  <Users className="w-3 h-3 text-white/40" />
                  <span>
                    {t('applicableBatches', 'Batches:')} {notice.targetBatches.join(', ')}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: Operational Tags & Admin Trigger */}
          <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
            {notice.autoBulkLeaveApplied && (
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-xl bg-black/25 text-[11px] font-bold text-white/70 border border-white/10">
                {t('tokensMarkedOnLeave', 'Tokens Scheduled Off')}
              </span>
            )}

            {isAdmin && (onOpenSupplySwitch || onOpenNoticeManager) && (
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  if (notice.isSupplyOff && onOpenSupplySwitch) {
                    onOpenSupplySwitch(notice);
                  } else if (onOpenNoticeManager) {
                    onOpenNoticeManager(notice);
                  } else if (onOpenSupplySwitch) {
                    onOpenSupplySwitch(notice);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs transition-colors border border-white/20 shadow-xs cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>{notice.isSupplyOff ? (lang === 'ml' ? 'മാറ്റുക' : 'Modify Supply') : t('manageNotice', 'Manage')}</span>
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
