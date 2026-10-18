import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Bookmark,
  Plus,
  Trash2,
  Check,
  Sparkles,
  Plane,
  Moon,
  Utensils,
  Coffee,
  Calendar,
  Layers,
  Save,
  RotateCcw,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import {
  getTodayISTDate,
  addDaysToDate,
  getDayOfWeekShort,
} from '../../utils/studentExceptionService';

export default function StudentTemplateModal({
  isOpen,
  onClose,
  student,
  onApplyTemplate,
  onSaveCustomTemplate,
  onDeleteCustomTemplate,
}) {
  const { feedback } = useFeedback();
  const [templateName, setTemplateName] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);

  if (!isOpen) return null;

  const todayIST = getTodayISTDate();
  const customTemplates = student?.templates || [];

  // ================= 1. BUILT-IN TEMPLATES =================

  // Preset A: Weekend Leave (Friday: Breakfast & Lunch OFF, Saturday: Breakfast OFF)
  const handleApplyWeekendLeave = (allWeekends = false) => {
    feedback('pop');
    const [y, m, d] = todayIST.split('-').map(Number);
    const todayObj = new Date(y, m - 1, d);
    const dayOfWeek = todayObj.getDay(); // 0 is Sunday, 5 is Friday, 6 is Saturday

    const newExceptions = { ...(student?.dateExceptions || {}) };

    const iterations = allWeekends ? 5 : 1; // 1 weekend or all weekends in next 30 days

    for (let i = 0; i < iterations; i++) {
      let daysUntilFriday = (5 - dayOfWeek + 7) % 7 + (i * 7);
      if (daysUntilFriday === 0 && todayIST > addDaysToDate(todayIST, 0)) daysUntilFriday = 7;
      
      const friDate = addDaysToDate(todayIST, daysUntilFriday);
      const satDate = addDaysToDate(todayIST, daysUntilFriday + 1);

      // Check boundary (within academic horizon)
      if (friDate <= addDaysToDate(todayIST, 365)) {
        newExceptions[friDate] = {
          breakfast: false,
          lunch: false,
          label: 'Weekend Leave (Fri)',
        };
      }
      if (satDate <= addDaysToDate(todayIST, 365)) {
        // Friday -breakfast and lunch, saturday breakfast
        const currentSatLunch = student?.obj?.lunch?.sa !== undefined ? Boolean(student.obj.lunch.sa) : true;
        newExceptions[satDate] = {
          breakfast: false,
          lunch: currentSatLunch, // Saturday lunch remains active
          label: 'Weekend Leave (Sat Bf)',
        };
      }
    }

    if (onApplyTemplate) {
      onApplyTemplate(newExceptions, allWeekends ? 'All Weekends Leave Applied' : 'Upcoming Weekend Leave Applied');
    }
    onClose();
  };

  // Preset B: Mon & Thu Fasting (Turns OFF lunch on all upcoming Mondays & Thursdays)
  const handleApplyMonThuFasting = () => {
    feedback('pop');
    const newExceptions = { ...(student?.dateExceptions || {}) };

    for (let i = 0; i <= 30; i++) {
      const d = addDaysToDate(todayIST, i);
      const dayKey = getDayOfWeekShort(d);
      if (dayKey === 'mo' || dayKey === 'th') {
        const curBf = student?.obj?.breakfast?.[dayKey] !== undefined ? Boolean(student.obj.breakfast[dayKey]) : true;
        newExceptions[d] = {
          breakfast: curBf,
          lunch: false, // Fasting -> Lunch is OFF
          label: 'Sunnah Fasting (Mon/Thu)',
        };
      }
    }

    if (onApplyTemplate) {
      onApplyTemplate(newExceptions, 'Mon & Thu Fasting Schedule Applied');
    }
    onClose();
  };

  // Preset C: Full Dining (Turn ON all upcoming days)
  const handleApplyAllOn = () => {
    feedback('pop');
    const newExceptions = { ...(student?.dateExceptions || {}) };
    for (let i = 0; i <= 30; i++) {
      const d = addDaysToDate(todayIST, i);
      newExceptions[d] = {
        breakfast: true,
        lunch: true,
        label: 'Full Dining Active',
      };
    }
    if (onApplyTemplate) {
      onApplyTemplate(newExceptions, 'All Meals Turned ON for next 30 days');
    }
    onClose();
  };

  // Preset D: Next 3 Days Full Leave
  const handleApply3DayLeave = () => {
    feedback('pop');
    const newExceptions = { ...(student?.dateExceptions || {}) };
    for (let i = 1; i <= 3; i++) {
      const d = addDaysToDate(todayIST, i);
      newExceptions[d] = {
        breakfast: false,
        lunch: false,
        label: '3-Day Leave / Travel',
      };
    }
    if (onApplyTemplate) {
      onApplyTemplate(newExceptions, 'Next 3 Days Leave Applied');
    }
    onClose();
  };

  // Save current student schedule as a custom template
  const handleSaveCurrentAsTemplate = () => {
    if (!templateName.trim()) return;
    feedback('success');

    const newTemplate = {
      id: `tpl_${Date.now()}`,
      name: templateName.trim(),
      createdAt: new Date().toISOString(),
      dateExceptions: { ...(student?.dateExceptions || {}) },
      routine: {
        breakfast: { ...(student?.obj?.breakfast || {}) },
        lunch: { ...(student?.obj?.lunch || {}) },
      },
    };

    if (onSaveCustomTemplate) {
      onSaveCustomTemplate(newTemplate);
    }
    setTemplateName('');
    setShowCreateForm(false);
  };

  // Apply a custom template created by the student
  const handleApplyCustom = (tpl) => {
    feedback('pop');
    if (onApplyTemplate) {
      onApplyTemplate(tpl.dateExceptions || {}, `Template "${tpl.name}" Applied`);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 12 }}
        transition={{ type: 'spring', stiffness: 450, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/90 dark:border-white/10 shadow-2xl p-5 sm:p-7 space-y-5 relative backdrop-blur-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Bookmark className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                Dining Routine Templates
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                1-click apply routines or save your own custom patterns.
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              feedback('tick');
              onClose();
            }}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ================= 1. STANDARD INSTITUTIONAL PRESETS ================= */}
        <div className="space-y-2.5">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
            Quick Predefined Templates
          </span>

          <div className="space-y-2">
            {/* Weekend Leave: Friday Bf + Lunch, Saturday Breakfast */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-purple-50/80 to-indigo-50/50 dark:from-purple-950/30 dark:to-indigo-950/20 border border-purple-200/80 dark:border-purple-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Plane className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                    Weekend Leave
                  </h4>
                  <span className="px-2 py-0.2 rounded-full text-[9px] font-black uppercase bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300">
                    Official
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Friday: Breakfast & Lunch OFF • Saturday: Breakfast OFF (Lunch ON)
                </p>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-center">
                <button
                  type="button"
                  onClick={() => handleApplyWeekendLeave(false)}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 whitespace-nowrap"
                >
                  This Weekend
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyWeekendLeave(true)}
                  className="px-2.5 py-1.5 rounded-xl bg-purple-100 dark:bg-white/10 hover:bg-purple-200 text-purple-900 dark:text-purple-200 font-bold text-[11px] transition-all active:scale-95 whitespace-nowrap"
                  title="Apply to all upcoming Fridays & Saturdays in the month"
                >
                  All Month
                </button>
              </div>
            </div>

            {/* Mon & Thu Sunnah Fasting */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-500/20 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Moon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                    Mon & Thu Fasting
                  </h4>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Turns Lunch OFF on all upcoming Mondays and Thursdays (Breakfast ON).
                </p>
              </div>

              <button
                type="button"
                onClick={handleApplyMonThuFasting}
                className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 whitespace-nowrap"
              >
                Apply
              </button>
            </div>

            {/* Next 3 Days Full Leave */}
            <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                    Next 3 Days Leave
                  </h4>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Turns OFF both Breakfast and Lunch for the upcoming 3 days.
                </p>
              </div>

              <button
                type="button"
                onClick={handleApply3DayLeave}
                className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-white/10 hover:bg-rose-50 hover:text-rose-600 text-gray-800 dark:text-gray-200 font-bold text-xs transition-all active:scale-95 whitespace-nowrap"
              >
                Apply
              </button>
            </div>

            {/* All Meals Active */}
            <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200/70 dark:border-emerald-500/20 flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <h4 className="text-xs font-bold text-gray-900 dark:text-white">
                    Full Dining Active
                  </h4>
                </div>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Turns ON both Breakfast and Lunch for all upcoming 30 days.
                </p>
              </div>

              <button
                type="button"
                onClick={handleApplyAllOn}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95 whitespace-nowrap"
              >
                Apply
              </button>
            </div>
          </div>
        </div>

        {/* ================= 2. STUDENT'S OWN CUSTOM TEMPLATES ================= */}
        <div className="space-y-2.5 pt-2 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
              My Personal Templates ({customTemplates.length})
            </span>

            {!showCreateForm && (
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setShowCreateForm(true);
                }}
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Current as Template</span>
              </button>
            )}
          </div>

          {/* Create Template Inline Form */}
          {showCreateForm && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-emerald-300 dark:border-emerald-500/30 space-y-2"
            >
              <label className="text-xs font-bold text-gray-800 dark:text-gray-200 block">
                Template Name
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g. My Weekend Routine, Exam Fasting..."
                  className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-[#131b18] border border-gray-300 dark:border-white/20 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  disabled={!templateName.trim()}
                  onClick={handleSaveCurrentAsTemplate}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-2.5 py-2 text-xs text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </button>
              </div>
              <p className="text-[10px] text-gray-400">
                This will save your current dining exceptions and routine as a named template you can reload anytime.
              </p>
            </motion.div>
          )}

          {/* List of Custom Templates */}
          {customTemplates.length === 0 && !showCreateForm ? (
            <div className="p-4 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center text-xs text-gray-400">
              You haven't saved any personal templates yet. Customize your dates and click "Save Current as Template".
            </div>
          ) : (
            <div className="space-y-2">
              {customTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-3"
                >
                  <div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Bookmark className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{tpl.name}</span>
                    </h4>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      {Object.keys(tpl.dateExceptions || {}).length} date override(s) saved
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleApplyCustom(tpl)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                    >
                      Apply
                    </button>
                    {onDeleteCustomTemplate && (
                      <button
                        type="button"
                        onClick={() => {
                          feedback('warning');
                          onDeleteCustomTemplate(tpl.id);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-rose-500 transition-colors"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-gray-100 dark:border-white/5">
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-bold text-gray-700 dark:text-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
