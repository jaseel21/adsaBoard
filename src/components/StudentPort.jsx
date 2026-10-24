import React, { useContext, useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  Check,
  Save,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  HeartHandshake,
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
  ShieldAlert,
  Send,
  Unlock,
  Ban,
  Receipt,
} from 'lucide-react';
import { getStudentFineAmount } from '../utils/mealScheduleService';
import { dialog } from '../utils/dialog';
import DateGridMatrix from './ui/DateGridMatrix';
import firebase from '../firebase/config';
import { AuthContext } from '../store/AuthContext';
import { DataOfOne } from '../store/StudentData';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { useIdleTimer } from '../utils/useIdleTimer';
import { subscribeToPreferences } from '../utils/preferenceService';
import { useTokenLockStatus } from '../utils/useTokenLockStatus';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../utils/auditLogger';
import { computeTokenScheduleDeltas } from '../utils/tokenAuditHelper';
import DietaryChangeRequestModal from './dietary/DietaryChangeRequestModal';
import {
  subscribeStudentPendingDietaryRequest,
  cancelDietaryChangeRequest,
} from '../utils/dietaryRequestService';
import UnblockRequestModal from './unblock/UnblockRequestModal';
import {
  subscribeStudentPendingUnblockRequest,
  cancelUnblockRequest,
} from '../utils/unblockRequestService';
import {
  addDaysToDate,
  formatFriendlyDate,
  getQuickDateOptions,
  validateExceptionDate,
  cleanPastDateExceptions,
  syncStudentDiningHistory,
  getDayOfWeekShort,
  calculateEffectiveDateMeals,
  cleanRedundantDateExceptions,
} from '../utils/studentExceptionService';

function StudentPort() {
  const { stdata, setStdata, logoutStudent } = useContext(DataOfOne);
  const authContext = useContext(AuthContext);
  const isAdmin = Boolean(
    authContext?.user &&
    ['canteen_committee', 'central_committee', 'admin', 'super_admin'].includes(authContext?.role)
  );
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  // Live real-time unblock and lock status subscription
  const [unblockDocStatus, setUnblockDocStatus] = useState(null);
  const [isUnblockModalOpen, setIsUnblockModalOpen] = useState(false);

  const isBlocked = unblockDocStatus ? Boolean(unblockDocStatus.block) : Boolean(stdata?.block);
  const pendingUnblock = unblockDocStatus ? unblockDocStatus.pendingUnblockRequest : stdata?.pendingUnblockRequest;

  const activeStudentDoc = useMemo(() => {
    return {
      ...(stdata || {}),
      ...(unblockDocStatus || {}),
    };
  }, [stdata, unblockDocStatus]);

  const fineDue = useMemo(() => {
    return getStudentFineAmount(activeStudentDoc);
  }, [activeStudentDoc]);
  const {
    todayIST,
    todayDayShort,
    isTodayLocked,
    todayLockInfo,
    tomorrowIST,
    tomorrowDayShort,
    isTomorrowLocked,
    tomorrowLockInfo,
    startTime,
    endTime,
    isPostWindowOpen,
    isTimeVerified,
    isDeviceDesynced,
    isDateLocked,
    getDateLockStatus,
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

  // Dynamic Dietary Preferences & Self-Service Change Requests
  const [preferencesList, setPreferencesList] = useState([]);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [pendingDietaryRequest, setPendingDietaryRequest] = useState(() => stdata?.pendingDietaryRequest || null);

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

  // Subscribe to dynamic dietary preferences (for display & request options)
  useEffect(() => {
    const unsub = subscribeToPreferences((list) => {
      setPreferencesList(list.filter((p) => p.isActive));
    });
    return () => unsub();
  }, []);

  // Subscribe to student's live pending dietary request
  useEffect(() => {
    if (!stdata?.tokenNo) return;
    const unsub = subscribeStudentPendingDietaryRequest(stdata.tokenNo, (req) => {
      setPendingDietaryRequest(req);
    });
    return () => unsub();
  }, [stdata?.tokenNo]);

  // Subscribe to student's live block & unblock request status
  useEffect(() => {
    if (!stdata?.tokenNo) return;
    const unsub = subscribeStudentPendingUnblockRequest(stdata.tokenNo, (data) => {
      if (data) {
        setUnblockDocStatus(data);
        if (
          Boolean(data.block) !== Boolean(stdata.block) ||
          data.blockReason !== stdata.blockReason ||
          JSON.stringify(data.pendingUnblockRequest) !== JSON.stringify(stdata.pendingUnblockRequest)
        ) {
          setStdata((prev) => ({
            ...prev,
            block: data.block,
            blockReason: data.blockReason,
            pendingUnblockRequest: data.pendingUnblockRequest,
          }));
        }
      }
    });
    return () => unsub();
  }, [stdata?.tokenNo, stdata?.block, stdata?.blockReason, stdata?.pendingUnblockRequest, setStdata]);

  const handleCancelUnblock = async () => {
    if (!pendingUnblock) return;
    const confirmed = await dialog.confirm({
      title: t('cancelUnblockPrompt', 'Cancel Unblock Request?'),
      message: t(
        'cancelUnblockConfirm',
        `Are you sure you want to withdraw your appeal to unblock token #${stdata.tokenNo}?`
      ),
      confirmText: t('withdrawConfirm', 'Yes, Withdraw'),
      cancelText: t('cancel', 'Keep Request'),
      isDestructive: true,
    });
    if (confirmed) {
      feedback('tick');
      try {
        await cancelUnblockRequest({
          studentId: stdata.documentId || stdata.id,
          tokenNo: stdata.tokenNo,
          ticketId: pendingUnblock.ticketId,
        });
        dialog.toast.info(
          t('requestCancelled', 'Request Withdrawn'),
          t('requestCancelledDesc', 'Your pending request has been cancelled.')
        );
      } catch (err) {
        console.error('Failed to cancel unblock request:', err);
      }
    }
  };

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
      if (stdata.pendingDietaryRequest !== undefined) {
        setPendingDietaryRequest(stdata.pendingDietaryRequest);
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

  // Student data snapshot for matrix and conflict analysis
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

  // Map each weekly dayKey ('su'..'sa') to its immediate upcoming occurrence and lock context
  const upcomingDateMap = useMemo(() => {
    const days = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    const [y, m, d] = todayIST.split('-').map(Number);
    const todayObj = new Date(Date.UTC(y, m - 1, d));
    const todayDayIdx = todayObj.getUTCDay(); // 0=su..6=sa

    const map = {};
    days.forEach((key, targetIdx) => {
      let daysAhead = (targetIdx - todayDayIdx + 7) % 7;
      const immediateDate = addDaysToDate(todayIST, daysAhead);
      const nextWeekDate = addDaysToDate(immediateDate, 7);
      const isTomorrow = immediateDate === tomorrowIST;
      const isToday = immediateDate === todayIST;
      const isLocked = (isTomorrow && isTomorrowLocked) || (isToday && isTodayLocked);

      map[key] = {
        immediateDate,
        nextWeekDate,
        isTomorrow,
        isToday,
        isLocked,
      };
    });
    return map;
  }, [todayIST, tomorrowIST, isTomorrowLocked, isTodayLocked]);

  // Detect active date overrides on the immediate upcoming occurrence for each day of the week
  const dayOverridesMap = useMemo(() => {
    const map = {};
    Object.keys(upcomingDateMap).forEach((dayKey) => {
      const { immediateDate } = upcomingDateMap[dayKey];
      const exc = dateExceptions?.[immediateDate];
      if (exc) {
        map[dayKey] = {
          date: immediateDate,
          exception: exc,
          hasBfOverride: exc.breakfast !== undefined,
          hasLunchOverride: exc.lunch !== undefined,
          isBfOff: exc.breakfast === false,
          isLunchOff: exc.lunch === false,
          isAllOff: exc.breakfast === false && exc.lunch === false,
          isAllOn: exc.breakfast === true && exc.lunch === true,
          label: exc.label || 'Leave / Override',
        };
      }
    });
    return map;
  }, [upcomingDateMap, dateExceptions]);

  // Quick 1-click helper to remove a conflicting date override
  const handleClearOverrideForDate = (targetDate) => {
    feedback('tick');
    setDateExceptions((prev) => {
      const updated = { ...prev };
      delete updated[targetDate];
      return updated;
    });
    dialog.toast.success(
      'Override Cleared',
      `Date override for ${formatFriendlyDate(targetDate, true)} was removed. Your regular weekly routine will apply.`
    );
  };

  // SCENARIO 2 RESOLUTION: Check and prompt user if turning a day ON conflicts with an active override
  const checkAndResolveOverrideConflict = async (dayKey, mealKey, mealName) => {
    const overrideInfo = dayOverridesMap[dayKey];
    if (!overrideInfo) return true;

    const isMealOffInOverride = mealKey === 'lunch' ? overrideInfo.isLunchOff : overrideInfo.isBfOff;
    if (!isMealOffInOverride) return true;

    const dayLabel = daysList.find((d) => d.key === dayKey)?.label || dayKey;
    const dateFormatted = formatFriendlyDate(overrideInfo.date, true);

    const shouldClear = await dialog.confirm({
      title: t('overrideConflictTitle', 'Active Override Conflict Detected'),
      message: `${t('overrideConflictNotice', `You previously scheduled an override for upcoming ${dayLabel}, ${dateFormatted} (${overrideInfo.label}): meals are set to OFF. Turning ON ${dayLabel} in your weekly routine will NOT provide meals on ${dateFormatted} unless this override is cleared.`)
        .replace('{day}', dayLabel)
        .replace('{date}', dateFormatted)
        .replace('{label}', overrideInfo.label || 'Leave')
        .replace('{status}', 'OFF')}\n\nWould you like to clear this override and enable food on ${dateFormatted}?`,
      confirmText: t('removeOverrideAndEnableFood', 'Clear Override & Enable Food (Recommended)'),
      cancelText: t('keepOverride', 'Keep Override (No Food on this date)'),
      confirmColor: 'emerald',
      icon: 'question',
    });

    if (shouldClear) {
      setDateExceptions((prev) => {
        const updated = { ...prev };
        if (updated[overrideInfo.date]) {
          const otherMealKey = mealKey === 'lunch' ? 'breakfast' : 'lunch';
          if (updated[overrideInfo.date][otherMealKey] !== undefined && updated[overrideInfo.date][otherMealKey] === false) {
            updated[overrideInfo.date] = {
              ...updated[overrideInfo.date],
              [mealKey]: true,
            };
          } else {
            delete updated[overrideInfo.date];
          }
        }
        return updated;
      });
      dialog.toast.success(
        'Override Cleared',
        `${mealName} is now enabled for ${dateFormatted}.`
      );
    }

    return true;
  };

  // SCENARIO 1 RESOLUTION: Intercept locked days (Tomorrow past cutoff or Today past window open)
  const checkLockedDayWarning = async (dayKey, mealKey, mealName, willTurnOn) => {
    const dayInfo = upcomingDateMap[dayKey];
    if (!dayInfo?.isLocked) return true;

    const lockTargetDate = dayInfo.immediateDate;
    const lockDateLabel = dayInfo.isTomorrow ? 'Tomorrow' : 'Today';
    const effectiveMeals = calculateEffectiveDateMeals(studentForMatrix, lockTargetDate);
    const currentStatusStr = (mealKey === 'lunch' ? effectiveMeals.lunch : effectiveMeals.breakfast) ? 'ON' : 'OFF';
    const dayLabel = daysList.find((d) => d.key === dayKey)?.label || dayKey;
    const cutoffTime = dayInfo.isTomorrow ? endTime : startTime;
    const nextDateFormatted = formatFriendlyDate(dayInfo.nextWeekDate, true);
    const targetDateFormatted = formatFriendlyDate(lockTargetDate, true);

    const dialogTitle = dayInfo.isTomorrow
      ? (t('tomorrowIsLockedTitle') || 'Tomorrow is Locked')
      : (t('todayIsLockedTitle') || 'Today is Locked');

    const dialogMessage = dayInfo.isTomorrow
      ? (t('tomorrowLockedRoutineNotice', `Tomorrow (${dayLabel}, ${targetDateFormatted}) is locked for kitchen prep past cutoff (${cutoffTime}). Routine updates to ${dayLabel} will take effect starting next week (${nextDateFormatted}). Tomorrow's meals will remain: ${currentStatusStr}.`))
          .replace('{day}', dayLabel)
          .replace('{date}', targetDateFormatted)
          .replace('{cutoff}', cutoffTime)
          .replace('{nextDate}', nextDateFormatted)
          .replace('{status}', currentStatusStr)
      : (t('todayLockedRoutineNotice', `Today (${dayLabel}, ${targetDateFormatted}) is locked for food service. Routine updates to ${dayLabel} will take effect starting next week (${nextDateFormatted}). Today's meals will remain: ${currentStatusStr}.`))
          .replace('{day}', dayLabel)
          .replace('{date}', targetDateFormatted)
          .replace('{nextDate}', nextDateFormatted)
          .replace('{status}', currentStatusStr);

    const proceed = await dialog.confirm({
      title: dialogTitle,
      message: `${dialogMessage}\n\nTurning ${mealName} ${willTurnOn ? 'ON' : 'OFF'} in your weekly routine will apply starting next week (${nextDateFormatted}). Do you want to continue?`,
      confirmText: t('updateRoutineAnyway', 'Apply from Next Week'),
      cancelText: t('cancel', 'Cancel'),
      confirmColor: 'amber',
      icon: 'warning',
    });

    return proceed;
  };

  // Weekly Lunch Toggles
  const toggleLunchDay = async (dayKey) => {
    const isCurrentlyOn = Boolean(lunch[dayKey]);
    const willTurnOn = !isCurrentlyOn;

    // Check Scenario 1: Locked day warning
    const canProceedLock = await checkLockedDayWarning(dayKey, 'lunch', t('navLunch') || 'Lunch', willTurnOn);
    if (!canProceedLock) return;

    // Check Scenario 2: Active override conflict
    if (willTurnOn) {
      await checkAndResolveOverrideConflict(dayKey, 'lunch', t('navLunch') || 'Lunch');
    }

    feedback('pop');
    setLunch((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  const selectAllLunch = async (val) => {
    if (!val && isTomorrowLocked) {
      const confirmed = await dialog.confirm({
        title: t('tomorrowIsLockedTitle') || 'Tomorrow is Locked',
        message: `Tomorrow (${formatFriendlyDate(tomorrowIST, true)}) is locked past cutoff (${endTime}). Deselecting all will turn off future weeks, but tomorrow's meals will remain preserved as already locked.\n\nDo you want to continue?`,
        confirmText: t('updateRoutineAnyway', 'Apply from Next Week'),
        cancelText: t('cancel', 'Cancel'),
        confirmColor: 'amber',
        icon: 'warning',
      });
      if (!confirmed) return;
    }
    feedback('tick');
    const updated = {};
    daysList.forEach(({ key }) => {
      updated[key] = val;
    });
    setLunch(updated);
  };

  // Weekly Breakfast Toggles
  const toggleBreakfastDay = async (dayKey) => {
    const isCurrentlyOn = Boolean(breakfast[dayKey]);
    const willTurnOn = !isCurrentlyOn;

    // Check Scenario 1: Locked day warning
    const canProceedLock = await checkLockedDayWarning(dayKey, 'breakfast', t('navBreakfast') || 'Breakfast', willTurnOn);
    if (!canProceedLock) return;

    // Check Scenario 2: Active override conflict
    if (willTurnOn) {
      await checkAndResolveOverrideConflict(dayKey, 'breakfast', t('navBreakfast') || 'Breakfast');
    }

    feedback('pop');
    setBreakfast((prev) => ({
      ...prev,
      [dayKey]: !prev[dayKey],
    }));
  };

  const selectAllBreakfast = async (val) => {
    if (!val && isTomorrowLocked) {
      const confirmed = await dialog.confirm({
        title: t('tomorrowIsLockedTitle') || 'Tomorrow is Locked',
        message: `Tomorrow (${formatFriendlyDate(tomorrowIST, true)}) is locked past cutoff (${endTime}). Deselecting all will turn off future weeks, but tomorrow's meals will remain preserved as already locked.\n\nDo you want to continue?`,
        confirmText: t('updateRoutineAnyway', 'Apply from Next Week'),
        cancelText: t('cancel', 'Cancel'),
        confirmColor: 'amber',
        icon: 'warning',
      });
      if (!confirmed) return;
    }
    feedback('tick');
    const updated = {};
    daysList.forEach(({ key }) => {
      updated[key] = val;
    });
    setBreakfast(updated);
  };

  const allLunchSelected = daysList.every(({ key }) => Boolean(lunch[key]));
  const allBreakfastSelected = daysList.every(({ key }) => Boolean(breakfast[key]));

  // Custom Template Persistence
  const handleSaveTemplates = async (updatedTemplates) => {
    if (isBlocked) {
      dialog.toast.warning(
        t('tokenLockedByAdmin') || 'Token Locked',
        t('tokenLockedPortalNotice') || 'Your dining token is currently locked. Routine changes cannot be saved.'
      );
      return;
    }
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
    if (isBlocked) {
      dialog.toast.warning(
        t('tokenLockedByAdmin') || 'Token Locked',
        t('tokenLockedPortalNotice') || 'Your dining token is currently locked. Routine changes cannot be saved.'
      );
      return;
    }
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
      
      // Clean redundant entries that match the routine being saved
      let exceptionsToSave = cleanRedundantDateExceptions(dateExceptions || {}, { lunch, breakfast });
      const preservedDatesList = [];

      // Safeguard Scenario 1: If tomorrow is locked past cutoff, preserve tomorrow's baseline status
      if (isTomorrowLocked) {
        const baselineExc = savedBaseline.dateExceptions?.[tomorrowIST];
        const baselineBf = baselineExc?.breakfast !== undefined
          ? baselineExc.breakfast
          : Boolean(savedBaseline.breakfast?.[tomorrowDayShort]);
        const baselineLu = baselineExc?.lunch !== undefined
          ? baselineExc.lunch
          : Boolean(savedBaseline.lunch?.[tomorrowDayShort]);

        const newRoutineBf = breakfast?.[tomorrowDayShort] !== undefined ? Boolean(breakfast[tomorrowDayShort]) : true;
        const newRoutineLu = lunch?.[tomorrowDayShort] !== undefined ? Boolean(lunch[tomorrowDayShort]) : true;

        if (baselineBf !== newRoutineBf || baselineLu !== newRoutineLu) {
          exceptionsToSave[tomorrowIST] = {
            breakfast: baselineBf,
            lunch: baselineLu,
            label: baselineExc?.label || 'Cutoff Locked (Preserved)',
          };
          preservedDatesList.push(`Tomorrow (${formatFriendlyDate(tomorrowIST, false)})`);
        } else {
          delete exceptionsToSave[tomorrowIST];
        }
      }

      // Safeguard Rule 2: Today is always locked for student portal saves; preserve today's baseline status if it diverges
      const baselineTodayExc = savedBaseline.dateExceptions?.[todayIST];
      const baselineTodayBf = baselineTodayExc?.breakfast !== undefined
        ? baselineTodayExc.breakfast
        : Boolean(savedBaseline.breakfast?.[todayDayShort]);
      const baselineTodayLu = baselineTodayExc?.lunch !== undefined
        ? baselineTodayExc.lunch
        : Boolean(savedBaseline.lunch?.[todayDayShort]);

      const newTodayRoutineBf = breakfast?.[todayDayShort] !== undefined ? Boolean(breakfast[todayDayShort]) : true;
      const newTodayRoutineLu = lunch?.[todayDayShort] !== undefined ? Boolean(lunch[todayDayShort]) : true;

      // Only create/preserve an exception for today IF today's locked meal actually differs from the new routine
      if (baselineTodayBf !== newTodayRoutineBf || baselineTodayLu !== newTodayRoutineLu) {
        exceptionsToSave[todayIST] = {
          breakfast: baselineTodayBf,
          lunch: baselineTodayLu,
          label: baselineTodayExc?.label || 'Today Locked (Preserved)',
        };
        preservedDatesList.push(`Today (${formatFriendlyDate(todayIST, false)})`);
      } else {
        delete exceptionsToSave[todayIST];
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

      // Detect any deleted date exception keys compared to baseline & stdata so Firestore does not retain them via merge
      const prevExceptions = {
        ...(stdata?.dateExceptions || {}),
        ...(savedBaseline?.dateExceptions || {}),
      };
      const deletedFieldUpdates = {};
      Object.keys(prevExceptions).forEach((d) => {
        if (!exceptionsToSave[d]) {
          deletedFieldUpdates[`dateExceptions.${d}`] = firebase.firestore.FieldValue.delete();
        }
      });

      const docRef = firebase.firestore().collection('students').doc(targetDocId);
      try {
        await docRef.update({
          ...payload,
          ...deletedFieldUpdates,
        });
      } catch (updateErr) {
        await docRef.set(payload, { merge: true });
        if (Object.keys(deletedFieldUpdates).length > 0) {
          await docRef.update(deletedFieldUpdates);
        }
      }

      // Compute granular token schedule deltas
      const scheduleDeltas = computeTokenScheduleDeltas(savedBaseline, {
        lunch,
        breakfast,
        dateExceptions: exceptionsToSave,
      });

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
          diffSummary: scheduleDeltas.items.length > 0
            ? `Token #${stdata.tokenNo}: ${scheduleDeltas.summary}`
            : `Student Token #${stdata.tokenNo} saved schedule preferences`,
          fieldsChanged: scheduleDeltas.fieldsChanged.length > 0
            ? scheduleDeltas.fieldsChanged
            : ['obj', 'dateExceptions'],
          before: scheduleDeltas.before,
          after: scheduleDeltas.after,
          tokenDeltas: scheduleDeltas.items,
        },
        metadata: {
          portalAction: 'student_save_schedule',
          tokenNo: Number(stdata.tokenNo),
          deltaCount: scheduleDeltas.items.length,
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

      const preservedNote = preservedDatesList.length > 0
        ? ` Note: ${preservedDatesList.join(' and ')} meals were preserved as dining schedule is locked.`
        : '';

      if (shouldLogout) {
        dialog.toast.success(
          t('scheduleSaved') || 'Schedule Saved!',
          `Your dining preferences were updated and you have been safely logged out.${preservedNote ? ' ' + preservedNote : ''}`,
          4000
        );
        if (logoutStudent) logoutStudent();
        navigate('/', { replace: true });
      } else {
        dialog.toast.success(
          t('scheduleSaved') || 'Schedule Saved!',
          `Your weekly dining schedule was updated successfully.${preservedNote ? ' ' + preservedNote : ''}`,
          4000
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
            <div
              className={`w-12 h-12 xs:w-14 xs:h-14 sm:w-16 sm:h-16 rounded-2xl ${
                isBlocked
                  ? 'bg-gradient-to-br from-red-500 to-rose-600 shadow-red-500/25'
                  : 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-500/25'
              } text-white font-mono font-black text-lg xs:text-xl sm:text-2xl flex items-center justify-center shadow-lg flex-shrink-0 relative`}
            >
              #{stdata.tokenNo}
              {isBlocked && (
                <span
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-600 border-2 border-white dark:border-[#0f1715] flex items-center justify-center text-[10px] shadow-sm"
                  title={t('tokenLockedBadge', 'Account Blocked')}
                >
                  <Ban className="w-2.5 h-2.5 text-white" />
                </span>
              )}
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
                {isBlocked && (
                  <>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] xs:text-[11px] font-black uppercase bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                      <Ban className="w-3 h-3 text-rose-500" />
                      <span>{t('tokenLockedBadge', 'Account Blocked')}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] xs:text-[11px] font-black uppercase bg-amber-500/20 text-amber-900 dark:text-amber-200 border border-amber-500/40 shadow-xs animate-pulse">
                      <Receipt className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                      <span>{t('finePayableAmount', 'Fine Due')}: ₹{fineDue}</span>
                    </span>
                  </>
                )}
              </div>
              {stdata.nameMl && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate font-malayalam">
                  {stdata.nameMl}
                </p>
              )}
              {isBlocked ? (
                <div className="flex items-center gap-1.5 xs:gap-2 mt-1 xs:mt-1.5 text-[10px] xs:text-[11px] text-rose-700 dark:text-rose-300 font-semibold flex-wrap">
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                  <span>
                    {t('tokenLockedPortalNotice', 'Your dining account is currently blocked by the Canteen Committee.')}{' '}
                    <strong className="text-amber-800 dark:text-amber-300 font-bold">
                      ({t('finePayableAmount', 'Fine Due')}: ₹{fineDue} • Pay at ADSA Canteen Office to restore)
                    </strong>
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 xs:gap-2 mt-1 xs:mt-1.5 text-[10px] xs:text-[11px] text-gray-500 dark:text-gray-400">
                  <Clock className={`w-3.5 h-3.5 flex-shrink-0 ${!isTomorrowLocked ? 'text-emerald-500' : 'text-amber-500'}`} />
                  <span>
                    {t('dailyCutoffHeader', 'Daily cutoff:')} {endTime} IST •{' '}
                    <strong className={!isTomorrowLocked ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-amber-600 dark:text-amber-400 font-bold'}>
                      {!isTomorrowLocked ? t('tomorrowIsOpen', 'Tomorrow is Open') : t('tomorrowIsLocked', 'Tomorrow is Locked')}
                    </strong>
                  </span>
                </div>
              )}
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

            {/* In-Header Save Preferences button when dirty and not blocked */}
            <AnimatePresence>
              {isDirty && !isBlocked && (
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

      {/* ================= ADMIN BLOCKED NOTICE BANNER ================= */}
      {isBlocked && (
        <div className="space-y-3">
          {pendingUnblock?.status === 'pending' ? (
            /* Pending Unblock Status Alert */
            <div className="rounded-3xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-300 dark:border-amber-500/30 p-4 sm:p-6 shadow-md backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <div className="text-xs sm:text-sm text-amber-950 dark:text-amber-200 space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-black text-sm sm:text-base text-amber-950 dark:text-amber-100">
                      {t('unblockRequestPending', 'Unblock Request Pending')} (#{pendingUnblock.ticketNumber})
                    </h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                      Under Review
                    </span>
                  </div>
                  <p className="text-amber-900/80 dark:text-amber-300/80 text-xs leading-relaxed">
                    {t(
                      'unblockRequestUnderReview',
                      'Your unblock request is currently under review by the Central Committee.'
                    )}
                  </p>
                  {pendingUnblock.reasonNote && (
                    <p className="text-xs italic text-amber-950/90 dark:text-amber-200/90 font-medium line-clamp-1">
                      Note: &ldquo;{pendingUnblock.reasonNote}&rdquo;
                    </p>
                  )}
                  {/* Fine Verification Note */}
                  <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-amber-300/50 dark:border-amber-500/30 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-xs text-amber-950 dark:text-amber-100 font-bold">
                      <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>{t('finePayableAmount', 'Fine Payable Amount')}:</span>
                    </div>
                    <span className="font-mono text-sm font-black text-amber-950 dark:text-amber-100 px-2 py-0.5 rounded-lg bg-amber-500/20">
                      ₹{fineDue}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    navigate(`/support?tab=tracker&code=${pendingUnblock.ticketNumber}`);
                  }}
                  className="flex-1 sm:flex-initial py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t('trackUnblockRequest', 'Track Status')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCancelUnblock}
                  className="py-2.5 px-3 rounded-xl bg-white/80 dark:bg-white/10 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 text-gray-700 dark:text-gray-200 font-bold text-xs border border-amber-200/60 dark:border-white/10 transition-colors cursor-pointer"
                >
                  {t('cancelUnblockRequest', 'Cancel')}
                </button>
              </div>
            </div>
          ) : (
            /* Standard Blocked Banner with Comprehensive Fine Card & Instructions */
            <div className="rounded-3xl bg-gradient-to-br from-rose-50 via-red-50 to-rose-100/60 dark:from-rose-950/50 dark:via-red-950/40 dark:to-rose-900/30 border border-rose-300 dark:border-rose-500/30 p-5 sm:p-6 shadow-lg backdrop-blur-xl space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border border-rose-300/60 dark:border-rose-500/30">
                    <Ban className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-black text-base sm:text-lg text-rose-950 dark:text-white">
                        Token #{stdata.tokenNo} Blocked • {t('dualGridSuspension', 'Dual-Grid Suspension')}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-200/80 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 border border-rose-300/60">
                        Meals Paused
                      </span>
                    </div>
                    <p className="text-rose-900 dark:text-rose-200 text-xs sm:text-sm leading-relaxed">
                      {t('studentDualGridBlockedDesc', 'Both Breakfast and Lunch dining privileges are temporarily suspended due to food waste or attendance infraction.')}
                    </p>
                    {activeStudentDoc.blockReason && (
                      <div className="mt-2 p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-rose-200 dark:border-rose-500/20 text-xs">
                        <span className="font-bold text-rose-950 dark:text-rose-100">{t('blockReasonLabel', 'Reason')}:</span>{' '}
                        <span className="italic font-medium text-rose-900 dark:text-rose-200">&ldquo;{activeStudentDoc.blockReason}&rdquo;</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full sm:w-auto flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setIsUnblockModalOpen(true);
                    }}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-95 transition-all cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                    <span>{t('requestUnblockBtn', 'Submit Unblock Appeal')}</span>
                  </button>
                </div>
              </div>

              {/* Prominent Fine Payable & Instructions Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-amber-500/10 border border-amber-500/35 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-amber-500/20">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs sm:text-sm font-black text-amber-950 dark:text-amber-100 uppercase tracking-wide">
                      {t('finePayableAmount', 'Fine Payable Amount')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-amber-800 dark:text-amber-300 font-medium">Payable at Mess Office:</span>
                    <span className="font-mono text-xl sm:text-2xl font-black text-amber-950 dark:text-amber-100 px-3 py-1 rounded-xl bg-amber-500/25 border border-amber-500/40 shadow-xs">
                      ₹{fineDue}
                    </span>
                  </div>
                </div>

                {/* 2-Step Settlement Roadmap */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-amber-950 dark:text-amber-200">
                  <div className="p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-amber-500/20 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-mono font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      1
                    </span>
                    <div className="space-y-0.5">
                      <strong className="block text-amber-950 dark:text-amber-100 font-bold">Step 1: Pay Fine at Canteen Office</strong>
                      <p className="text-[11px] text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                        Pay <strong>₹{fineDue}</strong> directly at the <strong>ADSA Canteen Office</strong> or to the mess secretary in charge.
                      </p>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-white/70 dark:bg-black/30 border border-amber-500/20 flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-mono font-black text-[11px] flex items-center justify-center flex-shrink-0 mt-0.5">
                      2
                    </span>
                    <div className="space-y-0.5">
                      <strong className="block text-emerald-950 dark:text-emerald-200 font-bold">Step 2: Submit Appeal with Receipt</strong>
                      <p className="text-[11px] text-amber-900/90 dark:text-amber-300/90 leading-relaxed">
                        Click &ldquo;Submit Unblock Appeal&rdquo; to attach your payment receipt or explanation. Central Committee will verify and unblock both meal grids.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* ================= SECTION 1: WEEKLY DINING ROUTINE ================= */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-extrabold text-gray-900 dark:text-white">
                {t('weeklyDiningRoutine', 'Weekly Dining Routine')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {t('weeklyRoutineSubtitle', 'Your standard 7-day schedule for breakfast and lunch. Changes here apply as your recurring weekly pattern.')}
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

                {isBlocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 select-none">
                    <Ban className="w-3 h-3 text-rose-500" />
                    <span>{t('dualGridSuspension', 'Dual-Grid Suspended')}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => selectAllBreakfast(!allBreakfastSelected)}
                    className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    {allBreakfastSelected ? (t('deselectAll') || 'Deselect All') : (t('selectAll') || 'Select All')}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {daysList.map(({ key, label }) => {
                  const active = Boolean(breakfast[key]);
                  const dayInfo = upcomingDateMap[key];
                  const overrideInfo = dayOverridesMap[key];
                  const isLockedDay = Boolean(dayInfo?.isLocked);
                  const hasOverride = Boolean(overrideInfo && overrideInfo.isBfOff);

                  return (
                    <div key={key} className="flex flex-col items-center gap-1 sm:gap-1.5 min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate w-full text-center flex items-center justify-center gap-0.5">
                        {label}
                        {isLockedDay && (
                          <span
                            title={dayInfo?.isTomorrow ? `Tomorrow is locked past ${endTime}. Edits apply starting next week.` : `Today is locked. Edits apply starting next week.`}
                            className="inline-flex items-center text-amber-500"
                          >
                            <Lock className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (isBlocked) {
                            dialog.toast.warning(
                              t('tokenLockedBadge', 'Account Blocked'),
                              `Dual-Grid Suspension: Breakfast is paused. Please settle the ₹${fineDue} fine at ADSA Canteen Office.`
                            );
                            return;
                          }
                          toggleBreakfastDay(key);
                        }}
                        disabled={isBlocked}
                        title={`${label}: Breakfast is ${active ? 'ON' : 'OFF'}${isBlocked ? ' (Suspended)' : isLockedDay ? ' (Locked for upcoming day)' : ' (Click to toggle)'}`}
                        className={`w-full max-w-[42px] h-10 sm:h-12 rounded-xl flex items-center justify-center text-xs font-bold transition-all transform font-mono shadow-sm ${
                          isBlocked
                            ? active
                              ? 'bg-emerald-600/60 text-white/80 cursor-not-allowed border border-emerald-500/20'
                              : 'bg-rose-600/60 text-white/80 cursor-not-allowed border border-rose-500/20'
                            : active
                              ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25 border border-emerald-400/40 hover:shadow-glow-emerald active:scale-90 cursor-pointer'
                              : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25 border border-rose-400/40 hover:shadow-glow-red active:scale-90 cursor-pointer'
                        } ${isLockedDay ? 'ring-1 ring-amber-400/60 ring-offset-1' : ''}`}
                      >
                        {active ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                      </button>

                      {/* Locked status pill */}
                      {isLockedDay && (
                        <span
                          className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 truncate max-w-full text-center"
                          title={dayInfo?.isTomorrow ? `Tomorrow locked past ${endTime}` : 'Today is locked for food service'}
                        >
                          {dayInfo?.isTomorrow ? t('lockedTomorrowBadge', 'Locked') : t('lockedTodayBadge', 'Today Locked')}
                        </span>
                      )}

                      {/* Active override warning badge with 1-click clear */}
                      {!isLockedDay && hasOverride && (
                        <div className="flex items-center gap-0.5 max-w-full">
                          <span
                            className="text-[8.5px] font-bold px-1 py-0.2 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 truncate"
                            title={`Active Override for ${formatFriendlyDate(overrideInfo.date, true)}: Breakfast is OFF (${overrideInfo.label})`}
                          >
                            OFF
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearOverrideForDate(overrideInfo.date);
                            }}
                            className="text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-0.5"
                            title="Clear date override and enable food"
                          >
                            ×
                          </button>
                        </div>
                      )}
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

                {isBlocked ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 select-none">
                    <Ban className="w-3 h-3 text-rose-500" />
                    <span>{t('dualGridSuspension', 'Dual-Grid Suspended')}</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => selectAllLunch(!allLunchSelected)}
                    className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {allLunchSelected ? (t('deselectAll') || 'Deselect All') : (t('selectAll') || 'Select All')}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {daysList.map(({ key, label }) => {
                  const active = Boolean(lunch[key]);
                  const dayInfo = upcomingDateMap[key];
                  const overrideInfo = dayOverridesMap[key];
                  const isLockedDay = Boolean(dayInfo?.isLocked);
                  const hasOverride = Boolean(overrideInfo && overrideInfo.isLunchOff);

                  return (
                    <div key={key} className="flex flex-col items-center gap-1 sm:gap-1.5 min-w-0">
                      <span className="text-[10px] sm:text-[11px] font-bold text-gray-500 dark:text-gray-400 truncate w-full text-center flex items-center justify-center gap-0.5">
                        {label}
                        {isLockedDay && (
                          <span
                            title={dayInfo?.isTomorrow ? `Tomorrow is locked past ${endTime}. Edits apply starting next week.` : `Today is locked. Edits apply starting next week.`}
                            className="inline-flex items-center text-amber-500"
                          >
                            <Lock className="w-2.5 h-2.5" />
                          </span>
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (isBlocked) {
                            dialog.toast.warning(
                              t('tokenLockedBadge', 'Account Blocked'),
                              `Dual-Grid Suspension: Lunch is paused. Please settle the ₹${fineDue} fine at ADSA Canteen Office.`
                            );
                            return;
                          }
                          toggleLunchDay(key);
                        }}
                        disabled={isBlocked}
                        title={`${label}: Lunch is ${active ? 'ON' : 'OFF'}${isBlocked ? ' (Suspended)' : isLockedDay ? ' (Locked for upcoming day)' : ' (Click to toggle)'}`}
                        className={`w-full max-w-[42px] h-10 sm:h-12 rounded-xl flex items-center justify-center text-xs font-bold transition-all transform font-mono shadow-sm ${
                          isBlocked
                            ? active
                              ? 'bg-emerald-600/60 text-white/80 cursor-not-allowed border border-emerald-500/20'
                              : 'bg-rose-600/60 text-white/80 cursor-not-allowed border border-rose-500/20'
                            : active
                              ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25 border border-emerald-400/40 hover:shadow-glow-emerald active:scale-90 cursor-pointer'
                              : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25 border border-rose-400/40 hover:shadow-glow-red active:scale-90 cursor-pointer'
                        } ${isLockedDay ? 'ring-1 ring-amber-400/60 ring-offset-1' : ''}`}
                      >
                        {active ? <Check className="w-4 h-4" /> : <X className="w-3.5 h-3.5" />}
                      </button>

                      {/* Locked status pill */}
                      {isLockedDay && (
                        <span
                          className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 truncate max-w-full text-center"
                          title={dayInfo?.isTomorrow ? `Tomorrow locked past ${endTime}` : 'Today is locked for food service'}
                        >
                          {dayInfo?.isTomorrow ? t('lockedTomorrowBadge', 'Locked') : t('lockedTodayBadge', 'Today Locked')}
                        </span>
                      )}

                      {/* Active override warning badge with 1-click clear */}
                      {!isLockedDay && hasOverride && (
                        <div className="flex items-center gap-0.5 max-w-full">
                          <span
                            className="text-[8.5px] font-bold px-1 py-0.2 rounded bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30 truncate"
                            title={`Active Override for ${formatFriendlyDate(overrideInfo.date, true)}: Lunch is OFF (${overrideInfo.label})`}
                          >
                            OFF
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClearOverrideForDate(overrideInfo.date);
                            }}
                            className="text-[8.5px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline px-0.5"
                            title="Clear date override and enable food"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {isBlocked && (
            <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-500/20 flex items-center justify-between gap-2 text-xs text-rose-800 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{t('routineLockedDesc', 'Weekly dining schedule cannot be changed while account is suspended.')}</span>
              </div>
              <span className="font-mono font-bold text-rose-950 dark:text-white px-2 py-0.5 rounded-lg bg-rose-500/15">
                Fine Due: ₹{fineDue}
              </span>
            </div>
          )}
        </div>

        {/* ================= SECTION 2: MONTHLY DINING CALENDAR & DATE OVERRIDES ================= */}
        <div className="space-y-4">
          {isBlocked && (
            <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-500/20 flex items-center justify-between gap-2 text-xs text-rose-800 dark:text-rose-300">
              <div className="flex items-center gap-2">
                <Ban className="w-4 h-4 flex-shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{t('calendarLockedNotice', 'Calendar date overrides and templates are locked while account is suspended.')}</span>
              </div>
              <span className="font-mono font-bold text-rose-950 dark:text-white px-2 py-0.5 rounded-lg bg-rose-500/15">
                Fine Due: ₹{fineDue}
              </span>
            </div>
          )}

          {isAdmin && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between gap-2 text-xs text-emerald-800 dark:text-emerald-300">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                <span className="font-semibold">Admin Override Active — Cutoff locks for today and tomorrow are bypassed.</span>
              </div>
            </div>
          )}

          <DateGridMatrix
            student={studentForMatrix}
            onSaveExceptions={(updated) => {
              if (isBlocked && !isAdmin) return;
              setDateExceptions(updated);
            }}
            onSaveTemplates={handleSaveTemplates}
            editable={isAdmin || !isBlocked}
            isAdmin={isAdmin}
          />
        </div>


        {/* ================= SECTION 3: DIETARY PREFERENCES (INTERACTIVE CHANGE REQUEST) ================= */}
        <div className="p-6 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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

            <div className="flex items-center gap-2 self-start sm:self-center">
              {pendingDietaryRequest ? (
                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-300 text-[11px] font-bold animate-pulse">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('requestPendingApproval', 'Change Request Pending Approval')}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setRequestModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 hover:bg-amber-200 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-200 text-xs font-bold transition-all border border-amber-300 dark:border-amber-600/30 cursor-pointer"
                  >
                    <span>{t('viewOrCancelRequest', 'View / Cancel')}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-[11px] font-bold text-gray-500 dark:text-gray-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t('adminApproved', 'Admin Controlled')}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setRequestModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-black shadow-sm active:scale-95 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('requestDietaryChange', 'Request Change')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Pending Request Alert Banner */}
          {pendingDietaryRequest && (
            <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-amber-900 dark:text-amber-200">
                      {t('dietaryRequestSubmitted', 'Dietary Change Request Submitted')}
                    </span>
                    <span className="text-[10px] text-amber-700 dark:text-amber-400 font-bold px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                      {t('awaitingCommittee', 'Awaiting Canteen Committee Review')}
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800/90 dark:text-amber-300/80 mt-0.5">
                    {pendingDietaryRequest.reasonText
                      ? `${t('reason', 'Reason')}: ${pendingDietaryRequest.reasonText}`
                      : t('canteenCommitteeWillReview', 'The committee will review and update your dining manifest.')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
                <button
                  type="button"
                  onClick={async () => {
                    const confirmed = await dialog.confirm({
                      title: t('withdrawRequestTitle', 'Withdraw Dietary Request?'),
                      message: t('withdrawRequestConfirm', 'Are you sure you want to cancel this pending request? The Canteen Committee will not process it.'),
                      confirmText: t('withdrawConfirm', 'Yes, Withdraw'),
                      cancelText: t('cancel', 'Keep Request'),
                      isDestructive: true,
                    });
                    if (confirmed) {
                      feedback('tick');
                      await cancelDietaryChangeRequest(
                        pendingDietaryRequest.id || pendingDietaryRequest.requestId,
                        stdata.documentId || stdata.id,
                        stdata.tokenNo
                      );
                      setPendingDietaryRequest(null);
                      dialog.toast.info(t('requestCancelled', 'Request Withdrawn'), t('requestCancelledDesc', 'Your pending request has been cancelled.'));
                    }
                  }}
                  className="px-3 py-1 rounded-xl bg-white dark:bg-white/10 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-300 text-[11px] font-bold border border-gray-200 dark:border-white/10 transition-colors cursor-pointer"
                >
                  {t('withdrawRequest', 'Withdraw Request')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setRequestModalOpen(true);
                  }}
                  className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                >
                  {t('modifyRequest', 'Modify')}
                </button>
              </div>
            </div>
          )}

          {/* Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {preferencesList.map((pref) => {
              // Student obj2: true or undefined = included, false = excluded
              const isIncluded = dietary[pref.id] !== false && dietary[pref.id.toLowerCase()] !== false;
              const pendingChange = pendingDietaryRequest?.changes?.find((c) => c.prefId === pref.id);

              return (
                <div
                  key={pref.id}
                  onClick={() => {
                    feedback('tick');
                    setRequestModalOpen(true);
                  }}
                  className={`p-3.5 rounded-2xl border text-center select-none transition-all cursor-pointer hover:shadow-md ${
                    isIncluded
                      ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300/60 dark:border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                      : 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300/60 dark:border-rose-500/30 text-rose-900 dark:text-rose-200 opacity-80'
                  } ${pendingChange ? 'ring-2 ring-amber-400 dark:ring-amber-500' : ''}`}
                >
                  <span className="text-sm font-bold block">{pref.labelEn}</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 block mt-0.5">
                    {pref.labelMl}
                  </span>
                  
                  <div className="mt-2 flex flex-col items-center gap-1">
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        isIncluded
                          ? 'bg-emerald-500 text-white'
                          : 'bg-rose-500 text-white'
                      }`}
                    >
                      {isIncluded ? t('included', 'Included') : t('excluded', 'Excluded')}
                    </span>

                    {pendingChange && (
                      <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 flex items-center gap-1 animate-pulse">
                        <Clock className="w-2.5 h-2.5" />
                        <span>{t('requestedPending', 'Requested')}: {pendingChange.to ? t('included', 'Include') : t('excluded', 'Avoid')}</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-[11px] text-gray-500 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>
                {t('dietaryCommitteeNoteUpgraded', 'Dietary preferences are managed by the ADSA Canteen Committee to plan accurate grocery supplies. Click "Request Change" to submit adjustments.')}
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setRequestModalOpen(true);
              }}
              className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex-shrink-0 cursor-pointer"
            >
              <span>{t('requestDietaryChange', 'Request Dietary Change')}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* ================= BOTTOM SUBMIT ACTION BAR ================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/80 border border-gray-200/80 dark:border-white/10 shadow-md">
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <Info className="w-4 h-4 text-emerald-500 flex-shrink-0" />
            <span>
              {isBlocked
                ? t('tokenLockedPortalNotice', 'Your dining token is currently locked by the Canteen Committee. You are viewing your details in Read-Only mode.')
                : isDirty
                ? t('pendingModifications', 'You have pending modifications. Click "Save Preferences" to apply.')
                : t('allSavedPrompt', 'All dining preferences are currently saved.')}
            </span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            {isBlocked ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-extrabold text-xs border border-rose-200 dark:border-rose-500/20 select-none">
                  <Ban className="w-4 h-4 text-rose-500" />
                  <span>{t('tokenLockedReadOnlyDock', 'Account Blocked • Meals Suspended')}</span>
                </div>
                {pendingUnblock?.status === 'pending' ? (
                  <button
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      navigate(`/support?tab=tracker&code=${pendingUnblock.ticketNumber}`);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white font-extrabold text-xs shadow-md shadow-amber-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{t('trackUnblockRequest', 'Track Status')} (#{pendingUnblock.ticketNumber})</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      setIsUnblockModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{t('requestUnblockBtn', 'Submit Unblock Appeal')}</span>
                  </button>
                )}
              </div>
            ) : (
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
            )}
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
            {isBlocked ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 flex-shrink-0 animate-pulse" />
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-extrabold text-rose-600 dark:text-rose-400 block truncate">
                    {t('tokenLockedReadOnlyDock', 'Account Blocked • Meals Suspended')} (Fine Due: ₹{fineDue})
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                    {t('fineNoticePayAtOffice', 'Pay fine at ADSA Canteen Office to restore.')}
                  </span>
                </div>
              </>
            ) : isDirty ? (
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
            {isBlocked ? (
              <button
                type="button"
                onClick={handleSafeBack}
                className="inline-flex items-center gap-1.5 px-3.5 xs:px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 font-bold text-xs sm:text-sm transition-colors active:scale-95"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t('backToBoard', 'Back to Board')}</span>
              </button>
            ) : (
              <>
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
              </>
            )}
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

      {/* Modal: Request Dietary Preference Change */}
      <DietaryChangeRequestModal
        isOpen={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        student={stdata}
        currentDietary={dietary}
        preferencesList={preferencesList}
        pendingRequest={pendingDietaryRequest}
        onSuccess={() => {
          // Success callback
        }}
      />

      {/* Modal: Request Dining Token Unblock */}
      <UnblockRequestModal
        isOpen={isUnblockModalOpen}
        onClose={() => setIsUnblockModalOpen(false)}
        student={activeStudentDoc}
        onSuccess={() => {
          // Success callback
        }}
      />

    </div>
  );
}

export default StudentPort;