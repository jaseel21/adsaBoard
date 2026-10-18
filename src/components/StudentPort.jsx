import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  Check,
  Save,
  ArrowLeft,
  Sparkles,
  Calendar,
  Clock,
  AlertTriangle,
  Info,
  Trash2,
  Plus,
  ShieldCheck,
  Lock,
  CalendarDays,
  X,
  LogOut,
} from 'lucide-react';
import Swal from 'sweetalert2';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { useIdleTimer } from '../utils/useIdleTimer';
import { subscribeToPreferences } from '../utils/preferenceService';
import {
  getTodayISTDate,
  addDaysToDate,
  formatFriendlyDate,
  getQuickDateOptions,
  validateExceptionDate,
  cleanPastDateExceptions,
  getDayOfWeekShort,
} from '../utils/studentExceptionService';

function StudentPort() {
  const { stdata, setStdata, logoutStudent } = useContext(DataOfOne);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  // Public Kiosk Inactivity Protection: Auto-logout after 90 seconds of inactivity
  const handleKioskTimeout = () => {
    feedback('warning');
    if (logoutStudent) logoutStudent();
    navigate('/', { replace: true });
  };

  const { isWarning, remainingSeconds, resetTimer } = useIdleTimer({
    timeoutMs: 90000,
    warningMs: 15000,
    onTimeout: handleKioskTimeout,
    enabled: Boolean(stdata?.tokenNo),
  });

  // Dynamic Dietary Preferences (Read-Only for Students)
  const [preferencesList, setPreferencesList] = useState([]);

  // Meal Routine Selections
  const [lunch, setLunch] = useState(() => stdata?.obj?.lunch || {});
  const [breakfast, setBreakfast] = useState(() => stdata?.obj?.breakfast || {});
  const [dietary, setDietary] = useState(() => stdata?.obj2 || {});

  // Date-Specific Exceptions Map: { [YYYY-MM-DD]: { breakfast: boolean, lunch: boolean, label?: string } }
  const [dateExceptions, setDateExceptions] = useState(() => {
    if (stdata?.dateExceptions) {
      return cleanPastDateExceptions(stdata.dateExceptions);
    }
    return {};
  });

  const [saving, setSaving] = useState(false);
  const [customDateInput, setCustomDateInput] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const todayIST = useMemo(() => getTodayISTDate(), []);
  const maxExceptionDate = useMemo(() => addDaysToDate(todayIST, 30), [todayIST]);
  const quickDateOptions = useMemo(() => getQuickDateOptions(), []);

  // Days list for weekly standard schedule
  const daysList = useMemo(
    () => [
      { key: 'su', label: t('days')?.su || 'Sun' },
      { key: 'mo', label: t('days')?.mo || 'Mon' },
      { key: 'tu', label: t('days')?.tu || 'Tue' },
      { key: 'we', label: t('days')?.we || 'Wed' },
      { key: 'th', label: t('days')?.th || 'Thu' },
      { key: 'fr', label: t('days')?.fr || 'Fri' },
      { key: 'sa', label: t('days')?.sa || 'Sat' },
    ],
    [t]
  );

  // Subscribe to dynamic dietary preferences (for display only)
  useEffect(() => {
    const unsub = subscribeToPreferences((list) => {
      setPreferencesList(list.filter((p) => p.isActive));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (stdata) {
      if (stdata.obj) {
        setLunch(stdata.obj.lunch || {});
        setBreakfast(stdata.obj.breakfast || {});
      }
      if (stdata.obj2) {
        setDietary(stdata.obj2 || {});
      }
      if (stdata.dateExceptions) {
        setDateExceptions(cleanPastDateExceptions(stdata.dateExceptions));
      }
    }
  }, [stdata]);

  if (!stdata || !stdata.tokenNo) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
          <Clock className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">No Active Session</h2>
        <p className="text-gray-500 dark:text-gray-400 text-xs mt-1 mb-4">
          Please log in with your student token to update your dining preferences.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-xs shadow-md"
        >
          Return to Student Login
        </button>
      </div>
    );
  }

  // Weekly Lunch Toggles
  const toggleLunchDay = (dayKey) => {
    feedback('pop');
    setLunch((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  const selectAllLunch = (val) => {
    feedback('tick');
    const updated = {};
    daysList.forEach(({ key }) => {
      updated[key] = val;
    });
    setLunch(updated);
  };

  // Weekly Breakfast Toggles
  const toggleBreakfastDay = (dayKey) => {
    feedback('pop');
    setBreakfast((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  const selectAllBreakfast = (val) => {
    feedback('tick');
    const updated = {};
    daysList.forEach(({ key }) => {
      updated[key] = val;
    });
    setBreakfast(updated);
  };

  const allLunchSelected = daysList.every(({ key }) => Boolean(lunch[key]));
  const allBreakfastSelected = daysList.every(({ key }) => Boolean(breakfast[key]));

  // Date Exceptions Handlers
  const handleAddDateException = (dateStr, defaultLabel) => {
    feedback('tick');
    const validation = validateExceptionDate(dateStr);
    if (!validation.valid) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Date',
        text: validation.error,
        confirmButtonColor: '#10b981',
      });
      return;
    }

    if (dateExceptions[dateStr]) {
      Swal.fire({
        icon: 'info',
        title: 'Already Scheduled',
        text: `You already have an exception set for ${formatFriendlyDate(dateStr)}. You can edit its meal options below.`,
        confirmButtonColor: '#10b981',
      });
      return;
    }

    // Default to the student's normal weekly setting for that day of the week, with one toggled off for convenience
    const dayOfWeek = getDayOfWeekShort(dateStr);
    const normalBf = breakfast[dayOfWeek] !== undefined ? Boolean(breakfast[dayOfWeek]) : true;
    const normalLu = lunch[dayOfWeek] !== undefined ? Boolean(lunch[dayOfWeek]) : true;

    setDateExceptions((prev) => ({
      ...prev,
      [dateStr]: {
        breakfast: false, // Default to skipping breakfast on exception day
        lunch: false,     // Default to skipping lunch on exception day
        label: defaultLabel || formatFriendlyDate(dateStr),
      },
    }));

    setShowDatePicker(false);
    setCustomDateInput('');
  };

  const handleToggleExceptionMeal = (dateStr, mealType) => {
    feedback('pop');
    setDateExceptions((prev) => {
      const current = prev[dateStr];
      if (!current) return prev;
      return {
        ...prev,
        [dateStr]: {
          ...current,
          [mealType]: !current[mealType],
        },
      };
    });
  };

  const handleRemoveDateException = (dateStr) => {
    feedback('warning');
    setDateExceptions((prev) => {
      const updated = { ...prev };
      delete updated[dateStr];
      return updated;
    });
  };

  // Save full routine and exceptions back to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    feedback('tick');
    setSaving(true);

    try {
      const targetDocId = stdata.documentId || stdata.id;
      if (!targetDocId) {
        throw new Error('Student document reference not found. Please log in again.');
      }
      const cleanedExceptions = cleanPastDateExceptions(dateExceptions);

      const payload = {
        obj: {
          lunch,
          breakfast,
        },
        dateExceptions: cleanedExceptions,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await firebase.firestore().collection('students').doc(targetDocId).set(payload, { merge: true });

      // Update local context
      const updatedStdata = {
        ...stdata,
        obj: {
          lunch,
          breakfast,
        },
        dateExceptions: cleanedExceptions,
      };
      setStdata(updatedStdata);
      setDateExceptions(cleanedExceptions);

      feedback('pop');
      Swal.fire({
        icon: 'success',
        title: t('scheduleSaved') || 'Schedule Saved!',
        text: 'Your weekly dining schedule and upcoming date exceptions were updated successfully.',
        timer: 2200,
        showConfirmButton: false,
        background: document.documentElement.classList.contains('dark') ? '#0f1715' : '#ffffff',
        color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827',
      });
    } catch (error) {
      console.error('Error updating student schedule:', error);
      feedback('warning');
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: 'Could not save your preferences. Please check your internet connection.',
        confirmButtonColor: '#ef4444',
      });
    } finally {
      setSaving(false);
    }
  };

  const sortedExceptionDates = Object.keys(dateExceptions).sort();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      
      {/* ================= STUDENT HEADER CARD ================= */}
      <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xl p-5 sm:p-7 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-mono font-black text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
              #{stdata.tokenNo}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {stdata.nameEn || stdata.name || stdata.uname}
                </h1>
                {stdata.batch && (
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    {stdata.batch}
                  </span>
                )}
              </div>
              {stdata.nameMl && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {stdata.nameMl}
                </p>
              )}
              <div className="flex items-center gap-2 mt-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Daily update cutoff window: 02:00 PM – 11:00 PM IST</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 font-bold text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Board</span>
            </button>

            <button
              type="button"
              onClick={() => {
                feedback('warning');
                if (logoutStudent) logoutStudent();
                navigate('/', { replace: true });
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200/60 dark:border-rose-500/20 transition-all active:scale-95"
              title="Sign out of student account (Important on public computers)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Finish & Log Out</span>
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* ================= SECTION 1: WEEKLY ROUTINE ================= */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                Weekly Dining Routine
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Your standard 7-day schedule for breakfast and lunch.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Breakfast Card */}
            <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-md p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center flex-shrink-0">
                    <Coffee className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {t('navBreakfast') || 'Breakfast'}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                      Morning meal schedule
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => selectAllBreakfast(!allBreakfastSelected)}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  {allBreakfastSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {daysList.map(({ key, label }) => {
                  const active = Boolean(breakfast[key]);
                  return (
                    <div key={key} className="flex flex-col items-center gap-1 sm:gap-1.5 min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate w-full text-center">
                        {label}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleBreakfastDay(key)}
                        className={`w-full max-w-[42px] h-10 sm:h-12 rounded-xl flex items-center justify-center text-xs font-bold transition-all transform active:scale-90 ${
                          active
                            ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-400'
                        }`}
                      >
                        {active ? <Check className="w-4 h-4" /> : '-'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lunch Card */}
            <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-md p-4 sm:p-6 space-y-4 sm:space-y-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-gray-900 dark:text-white">
                      {t('navLunch') || 'Lunch'}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
                      Afternoon meal schedule
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => selectAllLunch(!allLunchSelected)}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {allLunchSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {daysList.map(({ key, label }) => {
                  const active = Boolean(lunch[key]);
                  return (
                    <div key={key} className="flex flex-col items-center gap-1 sm:gap-1.5 min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate w-full text-center">
                        {label}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleLunchDay(key)}
                        className={`w-full max-w-[42px] h-10 sm:h-12 rounded-xl flex items-center justify-center text-xs font-bold transition-all transform active:scale-90 ${
                          active
                            ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md'
                            : 'bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-400'
                        }`}
                      >
                        {active ? <Check className="w-4 h-4" /> : '-'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: ADVANCED DATE EXCEPTIONS ================= */}
        <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-lg p-5 sm:p-7 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Advanced Date Exceptions (Up to 30 Days Ahead)
                </h3>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-2xl">
                Planning to miss meals or attend extra meals on a specific date? Add an exception here. Your regular weekly routine will <strong className="text-emerald-600 dark:text-emerald-400">automatically resume</strong> the next day so you will never forget to turn tokens back on!
              </p>
            </div>
          </div>

          {/* Quick Date Shortcut Chips */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Quick Shortcuts
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {quickDateOptions.map((opt) => (
                <button
                  key={opt.date}
                  type="button"
                  onClick={() => handleAddDateException(opt.date, opt.label)}
                  disabled={Boolean(dateExceptions[opt.date])}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    dateExceptions[opt.date]
                      ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed opacity-60'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-500/30 hover:bg-emerald-100 hover:scale-105 active:scale-95'
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{opt.label}</span>
                  <span className="text-[10px] opacity-70">({opt.sublabel})</span>
                </button>
              ))}

              {/* Custom Date Picker Trigger */}
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-300/60 dark:border-blue-500/30 hover:bg-blue-100 active:scale-95 transition-all"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>+ Pick Any Date</span>
              </button>
            </div>

            {/* Custom Date Picker Dropdown/Input */}
            {showDatePicker && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 flex flex-wrap items-center gap-2.5 mt-2"
              >
                <input
                  type="date"
                  min={todayIST}
                  max={maxExceptionDate}
                  value={customDateInput}
                  onChange={(e) => setCustomDateInput(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-white dark:bg-[#131b18] border border-gray-300 dark:border-white/20 text-xs font-bold text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="button"
                  disabled={!customDateInput}
                  onClick={() => handleAddDateException(customDateInput)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition-all"
                >
                  Add Exception
                </button>
                <button
                  type="button"
                  onClick={() => setShowDatePicker(false)}
                  className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
              </motion.div>
            )}
          </div>

          {/* List of Active Scheduled Date Exceptions */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Scheduled Date Overrides ({sortedExceptionDates.length})
              </span>
              {sortedExceptionDates.length > 0 && (
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                  Toggles override your routine only for that single date
                </span>
              )}
            </div>

            {sortedExceptionDates.length === 0 ? (
              <div className="p-6 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 text-center">
                <CalendarDays className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-600 dark:text-gray-300">
                  No upcoming date exceptions scheduled.
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Your standard weekly routine will automatically apply everyday.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {sortedExceptionDates.map((dateKey) => {
                  const exc = dateExceptions[dateKey];
                  const isBfOn = Boolean(exc?.breakfast);
                  const isLuOn = Boolean(exc?.lunch);

                  return (
                    <motion.div
                      key={dateKey}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-4 rounded-2xl bg-white dark:bg-[#131b18] border border-gray-200/90 dark:border-white/10 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-extrabold text-gray-900 dark:text-white">
                              {formatFriendlyDate(dateKey, true)}
                            </span>
                            {dateKey === todayIST && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/15 text-emerald-600">
                                Today
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-400 block font-mono">
                            {dateKey}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveDateException(dateKey)}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Remove this exception"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Breakfast & Lunch Toggles for this specific date */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100 dark:border-white/5">
                        <button
                          type="button"
                          onClick={() => handleToggleExceptionMeal(dateKey, 'breakfast')}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all ${
                            isBfOn
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300/60 dark:border-amber-500/30'
                              : 'bg-gray-100 dark:bg-white/5 text-gray-400 border border-transparent'
                          }`}
                        >
                          <span className="text-[11px]">Breakfast</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              isBfOn ? 'bg-amber-500 text-white' : 'bg-gray-300 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {isBfOn ? 'ON' : 'OFF'}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleToggleExceptionMeal(dateKey, 'lunch')}
                          className={`flex items-center justify-between p-2 rounded-xl text-xs font-bold transition-all ${
                            isLuOn
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-500/30'
                              : 'bg-gray-100 dark:bg-white/5 text-gray-400 border border-transparent'
                          }`}
                        >
                          <span className="text-[11px]">Lunch</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                              isLuOn ? 'bg-emerald-500 text-white' : 'bg-gray-300 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                            }`}
                          >
                            {isLuOn ? 'ON' : 'OFF'}
                          </span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ================= SECTION 3: DIETARY PREFERENCES (ADMIN MANAGED - READ ONLY) ================= */}
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Assigned Dietary Preferences
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Your registered dietary allowances for non-veg / meat items served in the canteen.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[11px] font-bold text-gray-500 dark:text-gray-400 self-start sm:self-center">
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span>Admin Managed</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {preferencesList.map((pref) => {
              // Student obj2: true or undefined = included, false = excluded
              const isIncluded = dietary[pref.id] !== false && dietary[pref.id.toLowerCase()] !== false;
              return (
                <div
                  key={pref.id}
                  className={`p-3.5 rounded-2xl border text-center select-none transition-all ${
                    isIncluded
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300/60 dark:border-rose-500/30 text-rose-900 dark:text-rose-200 opacity-80'
                  }`}
                >
                  <span className="text-sm font-bold block">{pref.labelEn}</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                    {pref.labelMl}
                  </span>
                  <span
                    className={`text-[10px] font-black mt-2 inline-block px-2.5 py-0.5 rounded-full ${
                      isIncluded
                        ? 'bg-emerald-500 text-white'
                        : 'bg-rose-500 text-white'
                    }`}
                  >
                    {isIncluded ? 'Included' : 'Excluded'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex items-start gap-2.5 text-[11px] text-gray-500 dark:text-gray-400">
            <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>
              Dietary preferences are managed exclusively by the ADSA Canteen Committee to ensure accurate ingredient purchasing. To request a dietary exemption change, please speak with the mess supervisor.
            </span>
          </div>
        </div>

        {/* ================= SUBMIT ACTION BAR ================= */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-9 py-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold text-sm shadow-xl shadow-emerald-500/25 transition-all transform active:scale-95 disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Dining Preferences'}</span>
          </button>
        </div>
      </form>

      {/* Public Kiosk Auto-Logout Modal Warning */}
      <AnimatePresence>
        {isWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0f1715] border border-amber-300 dark:border-amber-500/30 p-6 shadow-2xl text-center space-y-4"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  Still here? (Public Computer Safety)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  To protect your token on this public computer, your session will automatically log out in:
                </p>
                <div className="text-3xl font-mono font-black text-amber-500 mt-2">
                  {remainingSeconds}s
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetTimer}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-xs shadow-md"
                >
                  Stay Logged In
                </button>
                <button
                  type="button"
                  onClick={handleKioskTimeout}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-bold text-xs"
                >
                  Exit Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default StudentPort;