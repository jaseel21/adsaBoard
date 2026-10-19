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
  RotateCcw,
  UtensilsCrossed,
} from 'lucide-react';
import { dialog } from '../utils/dialog';
import DateGridMatrix from './ui/DateGridMatrix';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { useIdleTimer } from '../utils/useIdleTimer';
import { subscribeToPreferences } from '../utils/preferenceService';
import { useTokenLockStatus } from '../utils/useTokenLockStatus';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../utils/auditLogger';
import {
  addDaysToDate,
  formatFriendlyDate,
  getQuickDateOptions,
  validateExceptionDate,
  cleanPastDateExceptions,
  syncStudentDiningHistory,
  getDayOfWeekShort,
} from '../utils/studentExceptionService';

function StudentPort() {
  const { stdata, setStdata, logoutStudent } = useContext(DataOfOne);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const {
    todayIST,
    isTomorrowLocked,
    tomorrowIST,
    tomorrowDayShort,
    startTime,
    endTime,
    isTimeVerified,
    isDeviceDesynced,
  } = useTokenLockStatus();

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

  // Custom Student Templates
  const [templates, setTemplates] = useState(() => stdata?.templates || []);

  const [saving, setSaving] = useState(false);

  // Baseline snapshot for dirty checking
  const [savedBaseline, setSavedBaseline] = useState(() => ({
    lunch: stdata?.obj?.lunch || {},
    breakfast: stdata?.obj?.breakfast || {},
    dateExceptions: stdata?.dateExceptions ? cleanPastDateExceptions(stdata.dateExceptions) : {},
  }));

  const maxExceptionDate = useMemo(() => addDaysToDate(todayIST, 365), [todayIST]);

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
      const initLunch = stdata.obj?.lunch || {};
      const initBreakfast = stdata.obj?.breakfast || {};
      const initExceptions = stdata.dateExceptions ? cleanPastDateExceptions(stdata.dateExceptions) : {};

      setLunch(initLunch);
      setBreakfast(initBreakfast);
      if (stdata.obj2) {
        setDietary(stdata.obj2 || {});
      }
      setDateExceptions(initExceptions);
      if (stdata.templates) {
        setTemplates(stdata.templates || []);
      }

      setSavedBaseline({
        lunch: initLunch,
        breakfast: initBreakfast,
        dateExceptions: initExceptions,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stdata?.tokenNo, stdata?.documentId]);

  // Compare meal routine
  const isRoutineEqual = (a = {}, b = {}) => {
    const days = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    return days.every((d) => Boolean(a[d]) === Boolean(b[d]));
  };

  // Compare date exceptions
  const isExceptionsEqual = (a = {}, b = {}) => {
    const cleanA = cleanPastDateExceptions(a || {});
    const cleanB = cleanPastDateExceptions(b || {});
    const keysA = Object.keys(cleanA);
    const keysB = Object.keys(cleanB);
    if (keysA.length !== keysB.length) return false;
    for (const k of keysA) {
      if (!cleanB[k]) return false;
      if (Boolean(cleanA[k].breakfast) !== Boolean(cleanB[k].breakfast)) return false;
      if (Boolean(cleanA[k].lunch) !== Boolean(cleanB[k].lunch)) return false;
    }
    return true;
  };

  // Memoized isDirty flag
  const isDirty = useMemo(() => {
    if (!savedBaseline) return false;
    const lunchChanged = !isRoutineEqual(lunch, savedBaseline.lunch);
    const breakfastChanged = !isRoutineEqual(breakfast, savedBaseline.breakfast);
    const exceptionsChanged = !isExceptionsEqual(dateExceptions, savedBaseline.dateExceptions);
    return lunchChanged || breakfastChanged || exceptionsChanged;
  }, [lunch, breakfast, dateExceptions, savedBaseline]);

  // Count of individual changed preferences
  const changedCount = useMemo(() => {
    if (!savedBaseline) return 0;
    let count = 0;
    const days = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    days.forEach((d) => {
      if (Boolean(lunch[d]) !== Boolean(savedBaseline.lunch?.[d])) count++;
      if (Boolean(breakfast[d]) !== Boolean(savedBaseline.breakfast?.[d])) count++;
    });
    const cleanCur = cleanPastDateExceptions(dateExceptions || {});
    const cleanBase = cleanPastDateExceptions(savedBaseline.dateExceptions || {});
    const allDates = new Set([...Object.keys(cleanCur), ...Object.keys(cleanBase)]);
    allDates.forEach((d) => {
      const cur = cleanCur[d];
      const base = cleanBase[d];
      if (!cur && base) count++;
      else if (cur && !base) count++;
      else if (cur && base) {
        if (Boolean(cur.breakfast) !== Boolean(base.breakfast) || Boolean(cur.lunch) !== Boolean(base.lunch)) {
          count++;
        }
      }
    });
    return count;
  }, [lunch, breakfast, dateExceptions, savedBaseline]);

  // Window beforeunload safety net
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  // Weekly Lunch Toggles
  const toggleLunchDay = (dayKey) => {
    if (dayKey === tomorrowDayShort && isTomorrowLocked) {
      dialog.toast.info(
        'Tomorrow is Locked',
        `Tomorrow's meal orders are locked past cutoff (${endTime}). Your routine update for this day will apply starting next week.`
      );
    }
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
    if (dayKey === tomorrowDayShort && isTomorrowLocked) {
      dialog.toast.info(
        'Tomorrow is Locked',
        `Tomorrow's meal orders are locked past cutoff (${endTime}). Your routine update for this day will apply starting next week.`
      );
    }
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

  // Student data snapshot for the Date Grid Matrix
  const studentForMatrix = useMemo(
    () => ({
      ...stdata,
      obj: {
        lunch,
        breakfast,
      },
      obj2: dietary,
      dateExceptions,
      diningHistory: stdata?.diningHistory || {},
      templates,
    }),
    [stdata, lunch, breakfast, dietary, dateExceptions, templates]
  );

  // Custom Template Persistence
  const handleSaveTemplates = async (updatedTemplates) => {
    setTemplates(updatedTemplates);
    const targetDocId = stdata.documentId || stdata.id;
    if (targetDocId) {
      try {
        await firebase.firestore().collection('students').doc(targetDocId).set(
          { templates: updatedTemplates },
          { merge: true }
        );
        setStdata({ ...stdata, templates: updatedTemplates });
        dialog.toast.success('Template Saved', 'Your custom template is ready to use!');
      } catch (err) {
        console.error('Error saving template:', err);
      }
    }
  };

  // Discard pending changes and revert to baseline
  const handleDiscard = () => {
    feedback('pop');
    if (savedBaseline) {
      setLunch(savedBaseline.lunch || {});
      setBreakfast(savedBaseline.breakfast || {});
      setDateExceptions(savedBaseline.dateExceptions || {});
      dialog.toast.info('Changes Discarded', 'Reverted back to your saved preferences.');
    }
  };

  // Save full routine and exceptions back to Firestore (with optional logout)
  const handleSave = async (shouldLogout = false) => {
    feedback('tick');
    setSaving(true);

    try {
      const targetDocId = stdata.documentId || stdata.id;
      if (!targetDocId) {
        throw new Error('Student document reference not found. Please log in again.');
      }

      // Anti-tamper pre-flight verification: If time sync failed and client clock is manipulated, refuse save
      if (!isTimeVerified && isDeviceDesynced) {
        throw new Error('System time verification required: Device clock mismatch detected. Please verify your internet connection to sync time.');
      }
      
      // Preserve all dateExceptions (both upcoming and past) so history is never erased
      const exceptionsToSave = { ...(dateExceptions || {}) };

      // Safeguard: If tomorrow is locked past cutoff, preserve tomorrow's baseline status
      if (isTomorrowLocked) {
        const baselineExc = savedBaseline.dateExceptions?.[tomorrowIST];
        const baselineBf = baselineExc?.breakfast !== undefined
          ? baselineExc.breakfast
          : Boolean(savedBaseline.breakfast?.[tomorrowDayShort]);
        const baselineLu = baselineExc?.lunch !== undefined
          ? baselineExc.lunch
          : Boolean(savedBaseline.lunch?.[tomorrowDayShort]);

        exceptionsToSave[tomorrowIST] = {
          ...(exceptionsToSave[tomorrowIST] || {}),
          breakfast: baselineBf,
          lunch: baselineLu,
          label: exceptionsToSave[tomorrowIST]?.label || 'Cutoff Locked (Preserved)',
        };
      }

      // Synchronize and lock past dining history into immutable ledger
      const syncedHistory = syncStudentDiningHistory({
        ...stdata,
        obj: { lunch, breakfast },
        obj2: dietary,
        dateExceptions: exceptionsToSave,
        diningHistory: stdata?.diningHistory || {},
      });

      const payload = {
        obj: {
          lunch,
          breakfast,
        },
        dateExceptions: exceptionsToSave,
        diningHistory: syncedHistory,
        templates,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      };

      await firebase.firestore().collection('students').doc(targetDocId).set(payload, { merge: true });

      await logAuditEvent({
        category: AUDIT_CATEGORIES.TOKENS,
        action: 'TOKEN_TOGGLE',
        severity: AUDIT_SEVERITIES.INFO,
        actor: {
          uid: targetDocId,
          email: `token${stdata.tokenNo}@student.adsa`,
          displayName: stdata.nameEn || stdata.name || `Student #${stdata.tokenNo}`,
          role: 'student',
          tokenNo: Number(stdata.tokenNo),
        },
        target: {
          type: 'student',
          id: targetDocId,
          label: `Token #${stdata.tokenNo} (${stdata.nameEn || stdata.name || 'Student'})`,
          tokenNo: Number(stdata.tokenNo),
        },
        changes: {
          diffSummary: `Student Token #${stdata.tokenNo} updated weekly schedule and exceptions`,
          fieldsChanged: ['obj', 'dateExceptions'],
        },
        metadata: {
          portalAction: 'student_save_schedule',
        },
      });

      // Update local context
      const updatedStdata = {
        ...stdata,
        obj: {
          lunch,
          breakfast,
        },
        dateExceptions: exceptionsToSave,
        diningHistory: syncedHistory,
      };
      setStdata(updatedStdata);
      setDateExceptions(exceptionsToSave);
      setSavedBaseline({
        lunch: { ...lunch },
        breakfast: { ...breakfast },
        dateExceptions: { ...exceptionsToSave },
      });

      if (shouldLogout) {
        dialog.toast.success(
          t('scheduleSaved') || 'Schedule Saved!',
          'Your dining preferences were updated and you have been safely logged out.',
          3500
        );
        if (logoutStudent) logoutStudent();
        navigate('/', { replace: true });
      } else {
        dialog.toast.success(
          t('scheduleSaved') || 'Schedule Saved!',
          'Your weekly dining schedule and upcoming date exceptions were updated successfully.',
          3200
        );
      }
    } catch (error) {
      console.error('Error updating student schedule:', error);
      dialog.alert({
        type: 'error',
        title: 'Update Failed',
        message: 'Could not save your preferences. Please check your internet connection.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleSafeBack = async () => {
    feedback('tick');
    if (!isDirty) {
      navigate('/');
      return;
    }
    const shouldDiscard = await dialog.confirm({
      title: t('unsavedChanges') || 'Unsaved Preferences',
      message: t('unsavedBackPrompt') || 'You have unsaved changes to your dining schedule. Do you want to discard them and return to the main board?',
      confirmText: t('discardChanges') || 'Discard & Leave',
      cancelText: t('keepEditing') || 'Keep Editing',
      confirmColor: 'rose',
      icon: 'warning',
    });
    if (shouldDiscard) {
      navigate('/');
    }
  };

  const handleSafeLogout = async () => {
    feedback('warning');
    if (!isDirty) {
      if (logoutStudent) logoutStudent();
      navigate('/', { replace: true });
      return;
    }
    const shouldSaveFirst = await dialog.confirm({
      title: t('unsavedChanges') || 'Unsaved Preferences',
      message: t('unsavedLogoutPrompt') || 'You have unsaved changes to your dining schedule. Would you like to save them before logging out?',
      confirmText: t('saveAndLogout') || 'Save & Log Out',
      cancelText: t('discardAndLogout') || 'Discard & Log Out',
      confirmColor: 'emerald',
      icon: 'question',
    });
    if (shouldSaveFirst) {
      await handleSave(true);
    } else {
      if (logoutStudent) logoutStudent();
      navigate('/', { replace: true });
    }
  };

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    handleSave(false);
  };

  const sortedExceptionDates = Object.keys(dateExceptions).sort();

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

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 pb-32 sm:pb-36 space-y-8">
      
      {/* ================= STUDENT HEADER CARD ================= */}
      <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xl p-4 xs:p-5 sm:p-7 backdrop-blur-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 xs:gap-3.5 sm:gap-4 min-w-0">
            <div className="w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white font-mono font-black text-lg xs:text-xl sm:text-2xl flex items-center justify-center shadow-lg shadow-emerald-500/25 flex-shrink-0">
              #{stdata.tokenNo}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-base xs:text-lg sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight truncate">
                  {stdata.nameEn || stdata.name || `Token #${stdata.tokenNo}`}
                </h1>
                {stdata.batch && (
                  <span className="px-2 xs:px-2.5 py-0.5 rounded-full text-[10px] xs:text-[11px] font-black uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    {stdata.batch}
                  </span>
                )}
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-white/10 select-none"
                  title="Institutional student identity details are managed by ADSA Central Committee and cannot be edited by students"
                >
                  <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('officialRecordReadOnly', 'Official Record • Read-Only')}</span>
                </span>
              </div>
              {stdata.nameMl && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate font-malayalam">
                  {stdata.nameMl}
                </p>
              )}
              <div className="flex items-center gap-1.5 xs:gap-2 mt-1 xs:mt-1.5 text-[10px] xs:text-[11px] text-gray-500 dark:text-gray-400">
                <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${!isTomorrowLocked ? 'text-emerald-500' : 'text-amber-500'}`} />
                <span>
                  {t('dailyCutoffHeader', 'Daily cutoff:')} {endTime} IST •{' '}
                  <strong className={!isTomorrowLocked ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                    {!isTomorrowLocked ? t('tomorrowIsOpen', 'Tomorrow is Open') : t('tomorrowIsLocked', 'Tomorrow is Locked')}
                  </strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-start sm:justify-end flex-wrap pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-white/5">
            <button
              type="button"
              onClick={handleSafeBack}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 font-bold text-xs transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('backToBoard', 'Back to Board')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                feedback('tick');
                navigate('/menu');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-300/50 dark:border-emerald-500/30 transition-colors"
              title="View Weekly Food Menu"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span>{t('viewCanteenMenu', 'View Food Menu')}</span>
            </button>

            {/* In-Header Save Preferences button when dirty */}
            <AnimatePresence>
              {isDirty && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  type="button"
                  onClick={() => handleSave(false)}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold text-xs shadow-md shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50"
                  title="Save dining preferences"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{saving ? t('saving', 'Saving...') : (t('savePreferences') || 'Save Preferences')}</span>
                </motion.button>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={handleSafeLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 font-bold text-xs border border-rose-200/60 dark:border-rose-500/20 transition-all active:scale-95"
              title="Sign out of student account (Important on public computers)"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{t('navLogout') || 'Log Out'}</span>
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
                {t('weeklyDiningRoutine', 'Weekly Dining Routine')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('weeklyRoutineSubtitle', 'Your standard 7-day schedule for breakfast and lunch.')}
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
                      {t('morningMealSchedule', 'Morning meal schedule')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => selectAllBreakfast(!allBreakfastSelected)}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  {allBreakfastSelected ? (t('deselectAll') || 'Deselect All') : (t('selectAll') || 'Select All')}
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {daysList.map(({ key, label }) => {
                  const active = Boolean(breakfast[key]);
                  return (
                    <div key={key} className="flex flex-col items-center gap-1 sm:gap-1.5 min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate w-full text-center flex items-center justify-center gap-0.5">
                        {label}
                        {key === tomorrowDayShort && isTomorrowLocked && (
                          <span title={`Tomorrow is locked past ${endTime}. Edits apply starting next week.`} className="text-amber-500 text-[10px]">🔒</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleBreakfastDay(key)}
                        title={`${label}: Breakfast is ${active ? 'ON' : 'OFF'} (Click to toggle)`}
                        className={`w-full max-w-[42px] h-10 sm:h-12 rounded-xl flex items-center justify-center text-xs font-bold transition-all transform active:scale-90 font-mono shadow-sm ${
                          active
                            ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25 border border-emerald-400/40 hover:shadow-glow-emerald'
                            : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25 border border-rose-400/40 hover:shadow-glow-red'
                        }`}
                      >
                        {active ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
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
                      {t('afternoonMealSchedule', 'Afternoon meal schedule')}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => selectAllLunch(!allLunchSelected)}
                  className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                >
                  {allLunchSelected ? (t('deselectAll') || 'Deselect All') : (t('selectAll') || 'Select All')}
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {daysList.map(({ key, label }) => {
                  const active = Boolean(lunch[key]);
                  return (
                    <div key={key} className="flex flex-col items-center gap-1 sm:gap-1.5 min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate w-full text-center flex items-center justify-center gap-0.5">
                        {label}
                        {key === tomorrowDayShort && isTomorrowLocked && (
                          <span title={`Tomorrow is locked past ${endTime}. Edits apply starting next week.`} className="text-amber-500 text-[10px]">🔒</span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleLunchDay(key)}
                        title={`${label}: Lunch is ${active ? 'ON' : 'OFF'} (Click to toggle)`}
                        className={`w-full max-w-[42px] h-10 sm:h-12 rounded-xl flex items-center justify-center text-xs font-bold transition-all transform active:scale-90 font-mono shadow-sm ${
                          active
                            ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25 border border-emerald-400/40 hover:shadow-glow-emerald'
                            : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25 border border-rose-400/40 hover:shadow-glow-red'
                        }`}
                      >
                        {active ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ================= SECTION 2: TACTILE DATE GRID (DINING OVERRIDES) ================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-emerald-500" />
                <span>{t('upcomingDiningCalendar', 'Upcoming Dining Calendar & Date Overrides')}</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('calendarHelpText', 'Planning to miss meals or attend extra meals on specific dates? Click any date cell in the tactile grid below to turn meals ON (Green) or OFF (Red). Your regular weekly routine automatically resumes once the date passes.')}
              </p>
            </div>
          </div>

          <DateGridMatrix
            student={studentForMatrix}
            onSaveExceptions={(updated) => setDateExceptions(updated)}
            onSaveTemplates={handleSaveTemplates}
            editable={true}
          />
        </div>

        {/* ================= SECTION 3: DIETARY PREFERENCES (ADMIN MANAGED - READ ONLY) ================= */}
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  {t('assignedDietaryPreferences', 'Assigned Dietary Preferences')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('dietaryAllowancesDesc', 'Your registered dietary allowances for non-veg / meat items served in the canteen.')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[11px] font-bold text-gray-500 dark:text-gray-400 self-start sm:self-center">
              <Lock className="w-3.5 h-3.5 text-gray-400" />
              <span>{t('adminManaged', 'Admin Managed')}</span>
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
                    {isIncluded ? t('included', 'Included') : t('excluded', 'Excluded')}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex items-start gap-2.5 text-[11px] text-gray-500 dark:text-gray-400">
            <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <span>
              {t('dietaryCommitteeNote', 'Dietary preferences are managed exclusively by the ADSA Canteen Committee to ensure accurate ingredient purchasing. To request a dietary exemption change, please speak with the mess supervisor.')}
            </span>
          </div>
        </div>

        {/* ================= BOTTOM SUBMIT ACTION BAR ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/80 border border-gray-200/80 dark:border-white/10 shadow-md">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Info className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>
              {isDirty
                ? t('pendingModifications', 'You have pending modifications. Click "Save Preferences" to apply.')
                : t('allSavedPrompt', 'All dining preferences are currently saved.')}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="submit"
              disabled={saving || !isDirty}
              className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-extrabold text-xs sm:text-sm shadow-xl transition-all transform active:scale-95 ${
                isDirty
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-emerald-500/25'
                  : 'bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-600 opacity-60 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>{saving ? t('saving', 'Saving...') : (t('savePreferences') || 'Save Preferences')}</span>
            </button>
          </div>
        </div>
      </form>

      {/* ================= PERSISTENT FLOATING ACTION BAR (STICKY DOCK) ================= */}
      <div className="fixed bottom-2 xs:bottom-4 sm:bottom-6 inset-x-0 z-40 flex justify-center px-2 xs:px-4 pointer-events-none pb-safe">
        <motion.div
          layout
          className="pointer-events-auto w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-[#0c1412]/95 border border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl backdrop-blur-xl p-2 xs:p-2.5 sm:p-3 flex items-center justify-between gap-1.5 xs:gap-2 sm:gap-4 transition-all"
        >
          {/* Status Badge */}
          <div className="flex items-center gap-1.5 xs:gap-2 pl-1 xs:pl-2 sm:pl-3 min-w-0">
            {isDirty ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-extrabold text-amber-700 dark:text-amber-400 block truncate">
                    <span className="hidden xs:inline">{t('unsavedChanges') || 'Unsaved Changes'}</span>
                    <span className="xs:hidden">{t('unsaved', 'Unsaved')}</span>
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                    {changedCount} {changedCount === 1 ? t('changeSingle', 'change') : t('changesCount', 'changes')}
                  </span>
                </div>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-200 block truncate">
                    <span className="hidden xs:inline">{t('allChangesSaved') || 'All Preferences Saved'}</span>
                    <span className="xs:hidden">{t('saved', 'Saved')}</span>
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-500 block truncate">
                    {t('upToDate', 'Up to date')}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Discard button when dirty */}
            {isDirty && (
              <button
                type="button"
                onClick={handleDiscard}
                disabled={saving}
                className="inline-flex items-center gap-1 px-2.5 xs:px-3 py-2 rounded-xl text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 font-bold text-xs transition-colors active:scale-95"
                title="Discard unsaved changes"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{t('discardChanges') || 'Discard'}</span>
              </button>
            )}

            {/* Save Preferences Primary Button */}
            <button
              type="button"
              onClick={() => handleSave(false)}
              disabled={saving || !isDirty}
              className={`inline-flex items-center gap-1.5 sm:gap-2 px-3.5 xs:px-5 sm:px-6 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm text-white shadow-lg transition-all transform active:scale-95 whitespace-nowrap ${
                isDirty
                  ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-emerald-500/30'
                  : 'bg-gray-200 dark:bg-white/10 text-gray-400 dark:text-gray-500 opacity-60 cursor-not-allowed'
              }`}
              title="Save dining preferences"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? t('saving', 'Saving...') : (t('savePreferences') || 'Save Preferences')}</span>
            </button>
          </div>
        </motion.div>
      </div>

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
                  {t('publicComputerSafety', 'Still here? (Public Computer Safety)')}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('publicComputerWarning', 'To protect your token on this public computer, your session will automatically log out in:')}
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
                  {t('stayLoggedIn', 'Stay Logged In')}
                </button>
                <button
                  type="button"
                  onClick={handleKioskTimeout}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-bold text-xs"
                >
                  {t('exitNow', 'Exit Now')}
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