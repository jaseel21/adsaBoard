import React, { useState, useEffect, useMemo, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Power,
  RotateCcw,
  Calendar,
  Clock,
  Coffee,
  Utensils,
  AlertTriangle,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  CalendarDays,
  FileText,
  Info,
  Check,
  ChevronRight,
  Flame,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { AuthContext } from '../../store/AuthContext';
import { dialog } from '../../utils/dialog';
import {
  FOOD_SUPPLY_REASONS,
  getMealSupplyStatus,
  subscribeToBoardServiceSchedule,
  setBoardMealSupply,
  setBoardDaySupply,
  setBoardRangeSupply,
  clearBoardServiceOverride,
} from '../../utils/boardServiceSchedule';
import {
  formatFriendlyDate,
  addDaysToDate,
  getDayOfWeekShort,
  getTodayISTDate,
} from '../../utils/studentExceptionService';

export default function BoardSupplySwitchModal({
  isOpen,
  onClose,
  targetDateIST,
  isLunch = false,
  boardServiceSchedule = {},
  onCompleted = null,
}) {
  const { lang, t } = useLanguage();
  const { feedback } = useFeedback();
  const { user } = useContext(AuthContext);

  const effectiveDate = targetDateIST || getTodayISTDate();

  const [internalSchedule, setInternalSchedule] = useState({});

  useEffect(() => {
    if (boardServiceSchedule && Object.keys(boardServiceSchedule).length > 0) return;
    const unsub = subscribeToBoardServiceSchedule((s) => {
      setInternalSchedule(s || {});
    });
    return () => unsub();
  }, [boardServiceSchedule]);

  const effectiveSchedule =
    boardServiceSchedule && Object.keys(boardServiceSchedule).length > 0
      ? boardServiceSchedule
      : internalSchedule;

  const activeMealKey = isLunch ? 'lunch' : 'breakfast';

  // Evaluate current supply status for target date
  const currentMealSupply = useMemo(() => {
    return getMealSupplyStatus(effectiveSchedule, effectiveDate, activeMealKey);
  }, [effectiveSchedule, effectiveDate, activeMealKey]);

  const breakfastSupply = useMemo(() => {
    return getMealSupplyStatus(effectiveSchedule, effectiveDate, 'breakfast');
  }, [effectiveSchedule, effectiveDate]);

  const lunchSupply = useMemo(() => {
    return getMealSupplyStatus(effectiveSchedule, effectiveDate, 'lunch');
  }, [effectiveSchedule, effectiveDate]);

  const isBothOff = breakfastSupply.isSupplying === false && lunchSupply.isSupplying === false;
  const isCurrentOff = currentMealSupply.isSupplying === false;

  // Form State
  const [scope, setScope] = useState(isBothOff ? 'both' : activeMealKey); // 'breakfast' | 'lunch' | 'both' | 'range'
  const [selectedReasonKey, setSelectedReasonKey] = useState('dars_leave');
  const [customNoteEn, setCustomNoteEn] = useState('');
  const [customNoteMl, setCustomNoteMl] = useState('');
  const [customDescEn, setCustomDescEn] = useState('');
  const [customDescMl, setCustomDescMl] = useState('');
  const [rangeStartDate, setRangeStartDate] = useState(effectiveDate || '');
  const [rangeEndDate, setRangeEndDate] = useState(addDaysToDate(effectiveDate || '', 2));
  const [submitting, setSubmitting] = useState(false);

  // Synchronize initial state when modal opens or target date changes
  useEffect(() => {
    if (isOpen) {
      const initialScope = isBothOff ? 'both' : activeMealKey;
      setScope(initialScope);
      setRangeStartDate(effectiveDate || '');
      setRangeEndDate(addDaysToDate(effectiveDate || '', 2));

      const activeRecord = isBothOff
        ? breakfastSupply
        : isCurrentOff
        ? currentMealSupply
        : null;

      if (activeRecord && activeRecord.reasonKey) {
        setSelectedReasonKey(activeRecord.reasonKey);
        setCustomNoteEn(activeRecord.noteEn || '');
        setCustomNoteMl(activeRecord.noteMl || '');
        setCustomDescEn(activeRecord.descEn || '');
        setCustomDescMl(activeRecord.descMl || '');
      } else {
        const defaultPreset = FOOD_SUPPLY_REASONS[0];
        setSelectedReasonKey(defaultPreset.key);
        setCustomNoteEn(defaultPreset.labelEn);
        setCustomNoteMl(defaultPreset.labelMl);
        setCustomDescEn(defaultPreset.descEn);
        setCustomDescMl(defaultPreset.descMl);
      }
    }
  }, [isOpen, effectiveDate, activeMealKey, isBothOff, isCurrentOff, currentMealSupply, breakfastSupply]);

  // When reason preset changes, populate pure strings
  const handleSelectReason = (preset) => {
    setSelectedReasonKey(preset.key);
    setCustomNoteEn(preset.labelEn);
    setCustomNoteMl(preset.labelMl);
    setCustomDescEn(preset.descEn);
    setCustomDescMl(preset.descMl);
  };

  if (!isOpen) return null;

  const actor = {
    uid: user?.uid || 'admin',
    displayName: user?.displayName || user?.email || 'Admin',
    email: user?.email || '',
    role: 'canteen_committee',
  };

  // Turn Food Supply Back ON (Restore Regular Operation)
  const handleRestoreSupply = async () => {
    feedback('medium');
    const confirmed = await dialog.confirm({
      title: lang === 'ml' ? 'ഭക്ഷണ വിതരണം പുനരാരംഭിക്കണോ?' : 'Turn Food Supply Back ON?',
      message:
        lang === 'ml'
          ? `${formatFriendlyDate(effectiveDate)} തീയതിയിലെ കാന്റീൻ ഭക്ഷണ വിതരണം പൂർവ്വസ്ഥിതിയിലാക്കണോ? സാധാരണ ഡൈനിംഗ് ഓർഡറുകൾ സജീവമാകും.`
          : `Restore normal canteen food supply for ${formatFriendlyDate(effectiveDate)}? Routine dining orders will be active.`,
      confirmText: lang === 'ml' ? 'വിതരണം ഓൺ ചെയ്യുക' : 'Turn Supply ON',
      variant: 'default',
    });

    if (!confirmed) return;

    try {
      setSubmitting(true);
      await clearBoardServiceOverride(effectiveDate, actor);
      feedback('success');
      dialog.toast.success(
        lang === 'ml' ? 'ഭക്ഷണ വിതരണം ഓൺ ചെയ്തു' : 'Food Supply Active',
        lang === 'ml'
          ? 'കാന്റീൻ ഭക്ഷണ വിതരണം പുനരാരംഭിച്ചിരിക്കുന്നു.'
          : 'Canteen food supply has been restored to normal operation.'
      );
      if (onCompleted) onCompleted();
      onClose();
    } catch (err) {
      console.error('Failed to restore supply:', err);
      dialog.toast.error(
        lang === 'ml' ? 'പരാജയപ്പെട്ടു' : 'Failed',
        err.message || 'Could not update food supply status.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Turn Food Supply OFF (No Food in Canteen)
  const handleTurnSupplyOff = async () => {
    feedback('medium');
    const selectedPreset =
      FOOD_SUPPLY_REASONS.find((r) => r.key === selectedReasonKey) || FOOD_SUPPLY_REASONS[0];

    const noteEn = customNoteEn.trim() || selectedPreset.labelEn;
    const noteMl = customNoteMl.trim() || selectedPreset.labelMl;
    const descEn = customDescEn.trim() || selectedPreset.descEn;
    const descMl = customDescMl.trim() || selectedPreset.descMl;

    const confirmed = await dialog.confirm({
      title:
        lang === 'ml'
          ? 'കാന്റീൻ ഭക്ഷണ വിതരണം നിർത്തണോ?'
          : 'Turn Canteen Food Supply OFF?',
      message:
        lang === 'ml'
          ? `ഈ സമയത്ത് കാന്റീനിൽ ഭക്ഷണം ഉണ്ടായിരിക്കുന്നതല്ല (${selectedPreset.labelMl}). ടോക്കൺ ബോർഡിൽ ഭക്ഷണം വിതരണം നിർത്തിവെച്ചതായി രേഖപ്പെടുത്തും.`
          : `Canteen will NOT serve food for this period (${selectedPreset.labelEn}). The token board headcount will reflect zero service.`,
      confirmText: lang === 'ml' ? 'വിതരണം നിർത്തുക (OFF)' : 'Turn Food Supply OFF',
      variant: 'danger',
    });

    if (!confirmed) return;

    try {
      setSubmitting(true);

      if (scope === 'range') {
        await setBoardRangeSupply({
          startDate: rangeStartDate,
          endDate: rangeEndDate,
          mealScope: 'both',
          isSupplying: false,
          reasonKey: selectedReasonKey,
          noteEn,
          noteMl,
          descEn,
          descMl,
          actor,
        });
      } else if (scope === 'both') {
        await setBoardDaySupply({
          dateStr: effectiveDate,
          isSupplying: false,
          reasonKey: selectedReasonKey,
          noteEn,
          noteMl,
          descEn,
          descMl,
          actor,
        });
      } else {
        await setBoardMealSupply({
          dateStr: effectiveDate,
          mealType: scope,
          isSupplying: false,
          reasonKey: selectedReasonKey,
          noteEn,
          noteMl,
          descEn,
          descMl,
          actor,
        });
      }

      feedback('success');
      dialog.toast.success(
        lang === 'ml' ? 'ബോർഡ് മാറ്റം രേഖപ്പെടുത്തി' : 'Board Food Supply Updated',
        lang === 'ml'
          ? `ഭക്ഷണ വിതരണം നിർത്തിവെച്ച വിവരം രേഖപ്പെടുത്തി (${noteMl}).`
          : `Food supply turned OFF (${noteEn}). Zero student records were modified.`
      );
      if (onCompleted) onCompleted();
      onClose();
    } catch (err) {
      console.error('Failed to set board supply:', err);
      dialog.toast.error(
        lang === 'ml' ? 'പരാജയപ്പെട്ടു' : 'Failed',
        err.message || 'Could not update food supply status.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/75 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 12 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="relative w-full max-w-xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="relative p-5 sm:p-6 pb-4 border-b border-gray-100 dark:border-white/10 bg-gradient-to-r from-gray-50 via-white to-gray-50 dark:from-white/5 dark:via-transparent dark:to-white/5">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Power className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                      {lang === 'ml' ? 'കാന്റീൻ ഭക്ഷണ വിതരണ നിയന്ത്രണം' : 'Board Food Supply Control'}
                    </h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {lang === 'ml'
                        ? 'കാന്റീനിൽ ഭക്ഷണമില്ലാത്തപ്പോൾ ആ ദിവസത്തേക്കോ ആ നേരത്തേക്കോ ബോർഡ് മാറ്റുക'
                        : 'Turn food supply ON/OFF for this day or meal when canteen is not serving food'}
                    </p>
                  </div>
                </div>

                {/* Target Date & Current State Badge */}
                <div className="flex items-center gap-2 pt-2 flex-wrap">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10">
                    <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{formatFriendlyDate(effectiveDate)}</span>
                  </span>

                  {isCurrentOff ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 text-xs font-black animate-pulse">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'ml' ? 'ഭക്ഷണ വിതരണം ഇല്ല (OFF)' : 'Food Supply: OFF'}
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-black">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'ml' ? 'ഭക്ഷണ വിതരണം സജീവം (ON)' : 'Food Supply: ON (Serving)'}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                title={t('close', 'Close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
            {/* 1. Active Closure Callout (If currently OFF) */}
            {isCurrentOff && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                    <div className="space-y-0.5">
                      <div className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
                        {lang === 'ml' ? 'നിലവിലെ അവസ്ഥ' : 'Current Override'}
                      </div>
                      <div className="text-sm font-black text-rose-900 dark:text-rose-100">
                        {lang === 'ml'
                          ? currentMealSupply.noteMl || 'കാന്റീൻ പ്രവർത്തനം നിർത്തിവെച്ചിരിക്കുന്നു'
                          : currentMealSupply.noteEn || 'Canteen Food Supply Suspended'}
                      </div>
                      {currentMealSupply.descEn && (
                        <p className="text-xs text-rose-800/80 dark:text-rose-200/80 leading-relaxed">
                          {lang === 'ml' ? currentMealSupply.descMl : currentMealSupply.descEn}
                        </p>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRestoreSupply}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{lang === 'ml' ? 'വിതരണം ഓൺ ചെയ്യുക' : 'Restore Supply'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* 2. Target Meal / Scope Selector */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {lang === 'ml' ? 'ബാധകമാകുന്ന സമയം' : 'Target Scope'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setScope('breakfast');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    scope === 'breakfast'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <Coffee className="w-4 h-4 mb-1 text-amber-500" />
                  <span className="text-xs">{t('navBreakfast', 'Breakfast')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setScope('lunch');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    scope === 'lunch'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <Utensils className="w-4 h-4 mb-1 text-emerald-500" />
                  <span className="text-xs">{t('navLunch', 'Lunch')}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setScope('both');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    scope === 'both'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <Clock className="w-4 h-4 mb-1 text-indigo-500" />
                  <span className="text-xs">{lang === 'ml' ? 'മുഴുവൻ ദിവസം' : 'Full Day'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setScope('range');
                  }}
                  className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    scope === 'range'
                      ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30 font-bold'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200/80 dark:border-white/10 text-gray-600 dark:text-gray-300 hover:bg-gray-100'
                  }`}
                >
                  <CalendarDays className="w-4 h-4 mb-1 text-teal-500" />
                  <span className="text-xs">{lang === 'ml' ? 'ദിവസങ്ങൾ' : 'Date Range'}</span>
                </button>
              </div>
            </div>

            {/* Range Pickers (If range mode) */}
            {scope === 'range' && (
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10">
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                    {lang === 'ml' ? 'തുടങ്ങുന്ന തീയതി' : 'Start Date'}
                  </label>
                  <input
                    type="date"
                    value={rangeStartDate}
                    onChange={(e) => setRangeStartDate(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121c19] border border-gray-200 dark:border-white/10 text-xs font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-500 dark:text-gray-400">
                    {lang === 'ml' ? 'അവസാന തീയതി' : 'End Date'}
                  </label>
                  <input
                    type="date"
                    value={rangeEndDate}
                    onChange={(e) => setRangeEndDate(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 rounded-xl bg-white dark:bg-[#121c19] border border-gray-200 dark:border-white/10 text-xs font-semibold"
                  />
                </div>
              </div>
            )}

            {/* 3. Reason Presets (Pure Bilingual, Zero Brackets) */}
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {lang === 'ml' ? 'അവധിയുടെ കാരണം' : 'Select Reason Preset'}
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {FOOD_SUPPLY_REASONS.map((preset) => {
                  const isSelected = selectedReasonKey === preset.key;
                  const label = lang === 'ml' ? preset.labelMl : preset.labelEn;
                  return (
                    <button
                      key={preset.key}
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        handleSelectReason(preset);
                      }}
                      className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-200 font-bold ring-2 ring-emerald-500/20'
                          : 'bg-gray-50 dark:bg-white/5 border-gray-200/80 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs leading-tight">{label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-1" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Pure Localized Note Inputs (Clean, separate fields) */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                  English Notice Title
                </label>
                <input
                  type="text"
                  value={customNoteEn}
                  onChange={(e) => setCustomNoteEn(e.target.value)}
                  placeholder="e.g. Monthly Dars Leave"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                  മലയാളം അറിയിപ്പ് (Notice Title)
                </label>
                <input
                  type="text"
                  value={customNoteMl}
                  onChange={(e) => setCustomNoteMl(e.target.value)}
                  placeholder="ഉദാ: മാസാന്ത ദർസ് അവധി"
                  className="w-full mt-1 px-3 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
              </div>
            </div>

            {/* 5. Non-Blocking Architectural Assurance Note */}
            <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-2.5 text-teal-800 dark:text-teal-200">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-teal-500" />
              <p className="text-[11px] leading-relaxed">
                {lang === 'ml'
                  ? 'ശ്രദ്ധിക്കുക: കാന്റീൻ ഭക്ഷണ വിതരണം നിർത്തിയാലും വിദ്യാർത്ഥികളുടെ അക്കൗണ്ട് തടസ്സപ്പെടില്ല. അവർക്ക് ലോഗിൻ ചെയ്യാനും, പ്രൊഫൈൽ മാറ്റങ്ങൾ വരുത്താനും, മറ്റ് ദിവസങ്ങളിലെ ടോക്കണുകൾ നിയന്ത്രിക്കാനും സാധിക്കും.'
                  : 'Note: Turning food supply OFF does not modify student documents and will never block student account access. Students can continue to log in, edit profile details, and manage other dining days freely.'}
              </p>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/5 flex flex-wrap items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
            >
              {t('cancel', 'Cancel')}
            </button>

            <div className="flex items-center gap-2">
              {isCurrentOff && (
                <button
                  type="button"
                  onClick={handleRestoreSupply}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{lang === 'ml' ? 'വിതരണം പുനരാരംഭിക്കുക' : 'Turn Supply Back ON'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleTurnSupplyOff}
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
              >
                <Power className="w-3.5 h-3.5" />
                <span>
                  {isCurrentOff
                    ? lang === 'ml'
                      ? 'അവധി തിരുത്തുക'
                      : 'Update Closure Notice'
                    : lang === 'ml'
                    ? 'വിതരണം നിർത്തുക (OFF)'
                    : 'Turn Food Supply OFF'}
                </span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
