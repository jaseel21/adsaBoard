import React from 'react';
import {
  Calendar,
  Plane,
  Bookmark,
  RotateCcw,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useFeedback } from '../../../utils/useFeedback';
import { useLanguage } from '../../../store/LanguageContext';

export default function CalendarActionDeck({
  editable = true,
  isFullyPastMonth = false,
  onOpenSchedulePattern,
  onOpenRangeLeave,
  onTurnWeekendOff,
  onOpenTemplates,
  onClearExceptions,
  exceptionsCount = 0,
  hasTemplates = false,
  isSelectMode = false,
  onToggleSelectMode,
  onClose,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const handleAction = (callback) => {
    feedback('tick');
    if (callback) callback();
  };

  // Nothing to show for past months or when not editable
  if (!editable || isFullyPastMonth) return null;

  return (
    <div className="w-full rounded-2xl bg-gray-50/80 dark:bg-black/30 border border-gray-200/70 dark:border-white/10 p-3 sm:p-4 text-xs shadow-inner">
      <div className="flex flex-col sm:flex-row gap-4">

        {/* ── Group 1: Schedule Tools ── */}
        <div className="flex-1 space-y-2">
          <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Schedule Tools
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {/* Apply 7-Day Pattern (Primary) */}
            {onOpenSchedulePattern && (
              <button
                type="button"
                onClick={() => handleAction(onOpenSchedulePattern)}
                className="px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-xs shadow-emerald-600/25 active:scale-95 transition-all flex items-center gap-1.5 select-none cursor-pointer"
                title="Configure and apply a weekly dining schedule pattern across month or term"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{t('applyPatternBtn', '7-Day Pattern')}</span>
              </button>
            )}

            {/* Weekend Leave */}
            {onTurnWeekendOff && (
              <button
                type="button"
                onClick={() => handleAction(onTurnWeekendOff)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-white/10 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 select-none cursor-pointer"
                title="Turn Weekend OFF (Fri Breakfast & Lunch + Sat Breakfast)"
              >
                <Plane className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{t('turnWeekendOff', 'Weekend Leave')}</span>
              </button>
            )}

            {/* Date Range Leave */}
            {onOpenRangeLeave && (
              <button
                type="button"
                onClick={() => handleAction(onOpenRangeLeave)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-white/10 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 select-none cursor-pointer"
                title="Schedule leave or meal changes across custom start and end dates"
              >
                <Calendar className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                <span>{t('customRangeLeave', 'Date Range Leave')}</span>
              </button>
            )}

            {/* Saved Templates */}
            {onOpenTemplates && (
              <button
                type="button"
                onClick={() => handleAction(onOpenTemplates)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-white/10 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 select-none cursor-pointer"
                title="Manage recurring meal templates"
              >
                <Bookmark className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('templatesBtn', 'Saved Templates')}</span>
                {hasTemplates && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            )}
          </div>
        </div>

        {/* ── Divider ── */}
        <div className="hidden sm:block w-px bg-gray-200 dark:bg-white/10 self-stretch" />
        <div className="sm:hidden h-px bg-gray-200 dark:bg-white/10 w-full" />

        {/* ── Group 2: Manage ── */}
        <div className="space-y-2 sm:w-44 flex-shrink-0">
          <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
            Manage
          </div>

          <div className="space-y-1.5">
            {/* Multi-Date Select Mode */}
            {onToggleSelectMode && (
              <button
                type="button"
                onClick={() => handleAction(onToggleSelectMode)}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 select-none cursor-pointer ${
                  isSelectMode
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-xs'
                    : 'bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-white/10'
                }`}
                title="Toggle multi-date selection mode with checkboxes for batch actions"
              >
                <CheckCircle2 className={`w-3.5 h-3.5 ${isSelectMode ? 'text-white' : 'text-emerald-500'}`} />
                <span>{isSelectMode ? 'Exit Select Mode' : t('selectDatesBtn', 'Select Dates')}</span>
              </button>
            )}

            {/* Reset All Exceptions */}
            {exceptionsCount > 0 && onClearExceptions && (
              <button
                type="button"
                onClick={() => handleAction(onClearExceptions)}
                className="w-full px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-500/20 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 select-none cursor-pointer"
                title="Reset scheduled dates back to all active"
              >
                <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                <span>Reset ({exceptionsCount})</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
