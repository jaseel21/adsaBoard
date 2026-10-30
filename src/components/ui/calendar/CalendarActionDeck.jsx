import React from 'react';
import {
  Calendar,
  Plane,
  Bookmark,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  Clock,
  Layers,
  LayoutGrid,
  CalendarDays,
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
  activeView = 'month',
  setActiveView,
  onClose,
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const handleAction = (callback) => {
    feedback('tick');
    if (callback) callback();
  };

  return (
    <div className="w-full rounded-2xl bg-gray-50/80 dark:bg-black/30 border border-gray-200/70 dark:border-white/10 p-3 sm:p-4 text-xs space-y-3.5 shadow-inner">
      <div className="flex flex-col md:flex-row gap-4 items-start justify-between">
        
        {/* Left Column: Bulk Tools */}
        {editable && !isFullyPastMonth && (
          <div className="flex-1 space-y-2 w-full">
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Bulk Schedule Tools
            </div>
            
            <div className="flex flex-wrap gap-2">
              {/* Apply Schedule Pattern */}
              {onOpenSchedulePattern && (
                <button
                  type="button"
                  onClick={() => handleAction(onOpenSchedulePattern)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-xs shadow-emerald-600/25 active:scale-95 transition-all flex items-center gap-1.5 select-none cursor-pointer"
                  title="Configure and apply a weekly dining schedule pattern across month or term"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{t('applyPatternBtn', 'Apply 7-Day Pattern')}</span>
                </button>
              )}

              {/* Multi-Date Select Mode */}
              {onToggleSelectMode && (
                <button
                  type="button"
                  onClick={() => handleAction(onToggleSelectMode)}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 select-none cursor-pointer ${
                    isSelectMode
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-xs'
                      : 'bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border-gray-200/80 dark:border-white/10'
                  }`}
                  title="Toggle multi-date selection mode with checkboxes for batch actions"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{isSelectMode ? 'Exit Select Mode' : t('selectDatesBtn', 'Select Multiple Dates')}</span>
                </button>
              )}

              {/* Weekend Leave */}
              {onTurnWeekendOff && (
                <button
                  type="button"
                  onClick={() => handleAction(onTurnWeekendOff)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-white/10 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 select-none cursor-pointer"
                  title="Turn Weekend OFF (Fri Breakfast & Lunch + Sat Breakfast)"
                >
                  <Plane className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>{t('turnWeekendOff', 'Weekend Leave (Fri/Sat)')}</span>
                </button>
              )}

              {/* Range Leave */}
              {onOpenRangeLeave && (
                <button
                  type="button"
                  onClick={() => handleAction(onOpenRangeLeave)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-white/10 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 select-none cursor-pointer"
                  title="Schedule leave or meal changes across custom start and end dates"
                >
                  <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>{t('customRangeLeave', 'Date Range Leave')}</span>
                </button>
              )}

              {/* Saved Templates */}
              {onOpenTemplates && (
                <button
                  type="button"
                  onClick={() => handleAction(onOpenTemplates)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-white/10 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 select-none cursor-pointer"
                  title="Manage recurring meal templates"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>{t('templatesBtn', 'Saved Templates')}</span>
                  {hasTemplates && (
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>
              )}

              {/* Reset All Changes */}
              {exceptionsCount > 0 && onClearExceptions && (
                <button
                  type="button"
                  onClick={() => handleAction(onClearExceptions)}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-500/20 text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5 select-none cursor-pointer"
                  title="Reset scheduled dates back to all active"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
                  <span>Reset ({exceptionsCount})</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right Column: Switch View */}
        {setActiveView && (
          <div className="space-y-2 w-full md:w-auto md:min-w-[220px]">
            <div className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
              Switch View
            </div>

            <div className="grid grid-cols-4 md:grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => handleAction(() => setActiveView('month'))}
                className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer ${
                  activeView === 'month'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-white/10'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Month</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => setActiveView('week'))}
                className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer ${
                  activeView === 'week'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-white/10'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>Week</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => setActiveView('day'))}
                className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer ${
                  activeView === 'day'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-white/10'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Day</span>
              </button>

              <button
                type="button"
                onClick={() => handleAction(() => setActiveView('year'))}
                className={`px-2.5 py-1.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-all text-xs cursor-pointer ${
                  activeView === 'year'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-white dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 border border-gray-200/80 dark:border-white/10'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Year</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
