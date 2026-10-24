import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  Edit,
  Lock,
  Unlock,
  Ban,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Home,
  Phone,
  Layers,
  Utensils,
  Coffee,
  Info,
  ExternalLink,
  History,
  Receipt,
  Edit2,
  Save,
  Loader2,
} from 'lucide-react';
import { dialog } from '../../utils/dialog';
import firebase from '../../firebase/config';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';
import { AuthContext } from '../../store/AuthContext';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../../utils/auditLogger';
import { approveUnblockRequest } from '../../utils/unblockRequestService';
import { DAY_FULL_NAMES } from '../../utils/tokenAuditHelper';
import {
  formatFriendlyDate,
  getActiveStudentException,
  getEffectiveStudentMealStatus,
  getTodayISTDate,
} from '../../utils/studentExceptionService';
import { getManifestPrintRecord } from '../../utils/manifestPrintService';
import {
  getStudentFineAmount,
  updateStudentFineAmount,
} from '../../utils/mealScheduleService';
import { useTokenLockStatus } from '../../utils/useTokenLockStatus';

/**
 * Tactical Admin Quick Popover
 * Provides immediate 1-tap meal toggle, quick lock/unlock, full details view, and quick jump
 * to full student editing drawer without leaving the Master Board.
 */
export default function AdminTokenPopover({
  isOpen,
  onClose,
  student,
  isLunch,
  targetDateIST,
  effectiveDay,
  onOpenFullDrawer,
  onStudentUpdated,
  onOpenDetails,
}) {
  const { user, role } = useContext(AuthContext);
  const { feedback } = useFeedback();
  const { t } = useLanguage();
  const [togglingMeal, setTogglingMeal] = useState(null); // 'breakfast' | 'lunch' | 'both' | null
  const isToggling = Boolean(togglingMeal);
  const [editingFine, setEditingFine] = useState(false);
  const [fineInput, setFineInput] = useState('');
  const [fineReason, setFineReason] = useState('');
  const [savingFine, setSavingFine] = useState(false);
  const { getDateLockStatus, todayIST, tomorrowIST, endTime: lockEndTime } = useTokenLockStatus();

  // Local student state to enable instant reactive UI updates without needing to close/reopen
  const [currentStudent, setCurrentStudent] = useState(student);
  useEffect(() => {
    setCurrentStudent(student);
  }, [student]);

  if (!isOpen || !student) return null;

  const activeDoc = currentStudent || student;
  const lockInfo = getDateLockStatus(targetDateIST, { isAdmin: true });

  const isBlocked = Boolean(activeDoc.block);
  const isBfOn = getEffectiveStudentMealStatus(activeDoc, targetDateIST, effectiveDay, 'breakfast');
  const isLuOn = getEffectiveStudentMealStatus(activeDoc, targetDateIST, effectiveDay, 'lunch');
  const isBothOn = isBfOn && isLuOn;
  const isBothOff = !isBfOn && !isLuOn;
  const bfExc = getActiveStudentException(activeDoc, targetDateIST, 'breakfast');
  const luExc = getActiveStudentException(activeDoc, targetDateIST, 'lunch');

  const nameEn = activeDoc.nameEn || activeDoc.name || `Token #${activeDoc.tokenNo}`;
  const nameMl = activeDoc.nameMl;
  const batch = activeDoc.batch || 'General';
  const studentFineAmt = getStudentFineAmount(activeDoc);

  // Save Custom Fine from Popover
  const handleSaveFine = async () => {
    feedback('tick');
    setSavingFine(true);
    try {
      await updateStudentFineAmount({
        studentId: activeDoc.id,
        tokenNo: activeDoc.tokenNo,
        studentName: nameEn,
        newFineAmount: Number(fineInput),
        reason: fineReason,
        actor: {
          uid: user?.uid,
          displayName: user?.displayName || user?.email || 'Admin',
          email: user?.email,
          role,
        },
      });

      dialog.toast.success(
        'Fine Updated',
        `Token #${activeDoc.tokenNo} fine set to ₹${fineInput}`
      );
      setEditingFine(false);
      const updatedStudent = {
        ...activeDoc,
        fineAmount: Number(fineInput),
        fineReason,
      };
      setCurrentStudent(updatedStudent);
      if (onStudentUpdated) {
        onStudentUpdated(updatedStudent);
      }
    } catch (err) {
      console.error('Error saving fine in popover:', err);
      dialog.alert({ type: 'error', title: 'Update Failed', message: err.message });
    } finally {
      setSavingFine(false);
    }
  };

  // 1-Tap Toggle Specific Meal (Breakfast or Lunch) for active date
  const handleToggleSpecificMeal = async (targetMeal) => {
    feedback('tick');
    setTogglingMeal(targetMeal);

    const routineBf = activeDoc.obj?.breakfast?.[effectiveDay] !== undefined ? Boolean(activeDoc.obj.breakfast[effectiveDay]) : true;
    const routineLunch = activeDoc.obj?.lunch?.[effectiveDay] !== undefined ? Boolean(activeDoc.obj.lunch[effectiveDay]) : true;

    const currentMealState = targetMeal === 'lunch' ? isLuOn : isBfOn;
    const nextMealState = !currentMealState;

    const existingExceptions = activeDoc.dateExceptions || {};

    // Explicitly compute BOTH meals: toggled meal gets inverted, the other meal retains its EXACT current status
    const finalBf = targetMeal === 'breakfast' ? nextMealState : isBfOn;
    const finalLu = targetMeal === 'lunch' ? nextMealState : isLuOn;

    const isRevertedToRoutine = finalBf === routineBf && finalLu === routineLunch;
    const updatedExceptions = { ...existingExceptions };

    let deletedKeyUpdate = {};
    if (isRevertedToRoutine) {
      delete updatedExceptions[targetDateIST];
      deletedKeyUpdate = {
        [`dateExceptions.${targetDateIST}`]: firebase.firestore.FieldValue.delete(),
      };
    } else {
      let label = targetMeal === 'lunch'
        ? (finalLu ? 'Lunch ON' : 'Lunch OFF')
        : (finalBf ? 'Breakfast ON' : 'Breakfast OFF');

      if (!finalBf && !finalLu) {
        label = 'Skip Day (Both OFF)';
      } else if (finalBf && finalLu) {
        label = 'Active Day (Both ON)';
      }

      updatedExceptions[targetDateIST] = {
        breakfast: finalBf,
        lunch: finalLu,
        label,
        updatedAt: new Date().toISOString(),
      };
    }

    // Instant optimistic update to popover state and parent Master Board
    const updatedStudent = {
      ...activeDoc,
      dateExceptions: updatedExceptions,
    };
    setCurrentStudent(updatedStudent);
    if (onStudentUpdated) {
      onStudentUpdated(updatedStudent);
    }

    try {
      const docRef = firebase.firestore().collection('students').doc(activeDoc.id);
      try {
        await docRef.update({
          dateExceptions: updatedExceptions,
          ...deletedKeyUpdate,
          lastUpdatedBy: user?.email || 'admin',
          updatedAt: new Date().toISOString(),
        });
      } catch (_) {
        await docRef.set(
          {
            dateExceptions: updatedExceptions,
            lastUpdatedBy: user?.email || 'admin',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        if (Object.keys(deletedKeyUpdate).length > 0) {
          await docRef.update(deletedKeyUpdate);
        }
      }

      const friendlyDate = formatFriendlyDate(targetDateIST, true);
      const dayName = DAY_FULL_NAMES[effectiveDay] || effectiveDay;
      const mealName = targetMeal === 'lunch' ? 'Lunch' : 'Breakfast';
      const fieldKey = `${friendlyDate} • ${mealName}`;

      await logAuditEvent({
        category: AUDIT_CATEGORIES.TOKENS,
        action: nextMealState ? 'QUICK_MEAL_ON' : 'QUICK_MEAL_OFF',
        severity: AUDIT_SEVERITIES.INFO,
        actor: {
          uid: user?.uid || 'admin',
          email: user?.email || 'admin@adsa',
          displayName: user?.displayName || user?.email?.split('@')[0] || 'Admin',
          role: role || 'canteen_committee',
        },
        target: {
          type: 'student',
          id: activeDoc.id,
          label: `Token #${activeDoc.tokenNo} (${nameEn})`,
          tokenNo: Number(activeDoc.tokenNo),
        },
        changes: {
          diffSummary: `Token #${activeDoc.tokenNo} (${nameEn}): ${mealName} turned ${nextMealState ? 'ON' : 'OFF'} for ${friendlyDate}`,
          fieldsChanged: [fieldKey],
          before: { [fieldKey]: currentMealState },
          after: { [fieldKey]: nextMealState },
          tokenDeltas: [
            {
              type: 'quick_toggle',
              scopeLabel: friendlyDate,
              date: targetDateIST,
              day: dayName,
              dayShort: effectiveDay,
              meal: targetMeal,
              mealLabel: mealName,
              previous: currentMealState,
              current: nextMealState,
              previousLabel: currentMealState ? 'ON' : 'OFF',
              currentLabel: nextMealState ? 'ON' : 'OFF',
              tokenNo: Number(activeDoc.tokenNo),
              studentName: nameEn,
              label: `${mealName} for ${friendlyDate}`,
            },
          ],
        },
        metadata: {
          date: targetDateIST,
          day: dayName,
          dayShort: effectiveDay,
          meal: targetMeal,
          tokenNo: Number(activeDoc.tokenNo),
          studentName: nameEn,
          previousState: currentMealState,
          currentState: nextMealState,
        },
      });

      feedback('success');
      const mealLabel = targetMeal === 'lunch' ? (t('navLunch') || 'Lunch') : (t('navBreakfast') || 'Breakfast');
      dialog.toast.success(
        nextMealState
          ? (t('mealTurnedOnToast', '{meal} Turned ON').replace('{meal}', mealLabel))
          : (t('mealTurnedOffToast', '{meal} Turned OFF').replace('{meal}', mealLabel)),
        t('studentUpdatedForDate', 'Token #{token} ({name}) updated for {date}.')
          .replace('{token}', activeDoc.tokenNo)
          .replace('{name}', nameEn)
          .replace('{date}', formatFriendlyDate(targetDateIST))
      );

      // Check if physical print was already taken for this meal service
      getManifestPrintRecord(targetMeal, targetDateIST).then((printRecord) => {
        if (printRecord && printRecord.printedAt) {
          dialog.toast.warning(
            'Kitchen Sheet Stale',
            `A manifest [Rev ${printRecord.revision}] was already printed for this meal. Please reprint from Supply Sections to sync with the kitchen.`
          );
        }
      });
    } catch (err) {
      console.error('Error toggling meal in popover:', err);
      // Revert optimistic update on error
      setCurrentStudent(activeDoc);
      if (onStudentUpdated) onStudentUpdated(activeDoc);
      dialog.alert({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update student meal status.',
      });
    } finally {
      setTogglingMeal(null);
    }
  };

  // Toggle Both Meals (Turn Both ON or Both OFF)
  const handleToggleBoth = async (nextState) => {
    feedback('tick');
    setTogglingMeal('both');

    const routineBf = activeDoc.obj?.breakfast?.[effectiveDay] !== undefined ? Boolean(activeDoc.obj.breakfast[effectiveDay]) : true;
    const routineLunch = activeDoc.obj?.lunch?.[effectiveDay] !== undefined ? Boolean(activeDoc.obj.lunch[effectiveDay]) : true;

    const existingExceptions = activeDoc.dateExceptions || {};
    const isRevertedToRoutine = nextState === routineBf && nextState === routineLunch;

    const updatedExceptions = { ...existingExceptions };
    let deletedKeyUpdate = {};
    if (isRevertedToRoutine) {
      delete updatedExceptions[targetDateIST];
      deletedKeyUpdate = {
        [`dateExceptions.${targetDateIST}`]: firebase.firestore.FieldValue.delete(),
      };
    } else {
      updatedExceptions[targetDateIST] = {
        breakfast: nextState,
        lunch: nextState,
        label: nextState ? 'Active Day (Both ON)' : 'Skip Day (Both OFF)',
        updatedAt: new Date().toISOString(),
      };
    }

    // Instant optimistic update to popover state and parent Master Board
    const updatedStudent = {
      ...activeDoc,
      dateExceptions: updatedExceptions,
    };
    setCurrentStudent(updatedStudent);
    if (onStudentUpdated) {
      onStudentUpdated(updatedStudent);
    }

    try {
      const docRef = firebase.firestore().collection('students').doc(activeDoc.id);
      try {
        await docRef.update({
          dateExceptions: updatedExceptions,
          ...deletedKeyUpdate,
          lastUpdatedBy: user?.email || 'admin',
          updatedAt: new Date().toISOString(),
        });
      } catch (_) {
        await docRef.set(
          {
            dateExceptions: updatedExceptions,
            lastUpdatedBy: user?.email || 'admin',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
        if (Object.keys(deletedKeyUpdate).length > 0) {
          await docRef.update(deletedKeyUpdate);
        }
      }

      const friendlyDate = formatFriendlyDate(targetDateIST, true);
      const dayName = DAY_FULL_NAMES[effectiveDay] || effectiveDay;

      await logAuditEvent({
        category: AUDIT_CATEGORIES.TOKENS,
        action: nextState ? 'QUICK_MEAL_ON' : 'QUICK_MEAL_OFF',
        severity: AUDIT_SEVERITIES.INFO,
        actor: {
          uid: user?.uid || 'admin',
          email: user?.email || 'admin@adsa',
          displayName: user?.displayName || user?.email?.split('@')[0] || 'Admin',
          role: role || 'canteen_committee',
        },
        target: {
          type: 'student',
          id: activeDoc.id,
          label: `Token #${activeDoc.tokenNo} (${nameEn})`,
          tokenNo: Number(activeDoc.tokenNo),
        },
        changes: {
          diffSummary: `Token #${activeDoc.tokenNo} (${nameEn}): Breakfast & Lunch turned ${nextState ? 'ON' : 'OFF'} for ${friendlyDate}`,
          fieldsChanged: [`${friendlyDate} • Both Meals`],
          before: { breakfast: isBfOn, lunch: isLuOn },
          after: { breakfast: nextState, lunch: nextState },
        },
      });

      feedback('success');
      dialog.toast.success(
        nextState ? (t('turnBothOn') || 'Both Meals Turned ON') : (t('turnBothOff') || 'Both Meals Turned OFF'),
        t('studentUpdatedForDate', 'Token #{token} ({name}) updated for {date}.')
          .replace('{token}', activeDoc.tokenNo)
          .replace('{name}', nameEn)
          .replace('{date}', formatFriendlyDate(targetDateIST))
      );
    } catch (err) {
      console.error('Error toggling both meals in popover:', err);
      // Revert state on error
      setCurrentStudent(activeDoc);
      if (onStudentUpdated) onStudentUpdated(activeDoc);
      dialog.alert({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update student meal status.',
      });
    } finally {
      setTogglingMeal(null);
    }
  };

  // Quick Account Block/Unblock
  const handleQuickToggleBlock = async () => {
    feedback('warning');
    const nextBlock = !isBlocked;

    const confirmed = await dialog.confirm({
      title: nextBlock ? `Block Token #${activeDoc.tokenNo}?` : `Unblock Token #${activeDoc.tokenNo}?`,
      message: nextBlock
        ? `Blocking will suspend Token #${activeDoc.tokenNo} (${nameEn}) from both Breakfast and Lunch grids.`
        : `Re-activate Token #${activeDoc.tokenNo} (${nameEn}) into active canteen rotation?`,
      confirmText: nextBlock ? 'Block Student' : 'Unblock Student',
      confirmColor: nextBlock ? 'rose' : 'emerald',
      icon: nextBlock ? 'shield-alert' : 'shield-check',
    });

    if (!confirmed) return;

    try {
      if (!nextBlock && activeDoc.pendingUnblockRequest?.ticketId) {
        await approveUnblockRequest({
          studentId: activeDoc.id,
          tokenNo: activeDoc.tokenNo,
          ticketId: activeDoc.pendingUnblockRequest.ticketId,
          reviewerInfo: { uid: user?.uid, name: user?.displayName || user?.email, email: user?.email, role },
          resolutionNote: 'Unblocked from Master Board Popover',
        });
      } else {
        await firebase
          .firestore()
          .collection('students')
          .doc(activeDoc.id)
          .update({
            block: nextBlock,
            blockReason: nextBlock ? 'Blocked by admin from Master Board' : '',
            pendingUnblockRequest: nextBlock ? (activeDoc.pendingUnblockRequest || null) : null,
            lastUpdatedBy: user?.email || 'admin',
            updatedAt: new Date().toISOString(),
          });
      }

      await logAuditEvent({
        category: AUDIT_CATEGORIES.TOKENS,
        action: nextBlock ? 'TOKEN_LOCKED' : 'TOKEN_UNLOCKED',
        severity: nextBlock ? AUDIT_SEVERITIES.WARNING : AUDIT_SEVERITIES.INFO,
        actor: {
          uid: user?.uid || 'admin',
          email: user?.email || 'admin@adsa',
          displayName: user?.displayName || user?.email?.split('@')[0] || 'Admin',
          role: role || 'canteen_committee',
        },
        target: {
          type: 'student',
          id: activeDoc.id,
          label: `Token #${activeDoc.tokenNo} (${nameEn})`,
          tokenNo: Number(activeDoc.tokenNo),
        },
        changes: {
          diffSummary: `Token #${activeDoc.tokenNo} (${nameEn}) ${nextBlock ? 'locked/frozen' : 'unlocked/re-activated'} from Master Board`,
          fieldsChanged: ['block'],
          before: { block: !nextBlock },
          after: { block: nextBlock },
          tokenDeltas: [
            {
              type: 'lock_status',
              scopeLabel: 'Master Board Access',
              meal: 'all',
              mealLabel: 'All Meals',
              previous: !nextBlock,
              current: nextBlock,
              previousLabel: !nextBlock ? 'Active / Unlocked' : 'Frozen / Locked',
              currentLabel: nextBlock ? 'Frozen / Locked' : 'Active / Unlocked',
              tokenNo: Number(activeDoc.tokenNo),
              studentName: nameEn,
              label: 'Account Status',
            },
          ],
        },
        metadata: {
          tokenNo: Number(activeDoc.tokenNo),
          studentName: nameEn,
          previousState: !nextBlock,
          currentState: nextBlock,
        },
      });

      feedback('success');
      dialog.toast.success(
        nextBlock ? 'Account Locked' : 'Account Re-activated',
        `Token #${activeDoc.tokenNo} status updated.`
      );

      const updatedStudent = {
        ...activeDoc,
        block: nextBlock,
      };
      setCurrentStudent(updatedStudent);
      if (onStudentUpdated) {
        onStudentUpdated(updatedStudent);
      }
      onClose();
    } catch (err) {
      console.error('Error toggling block in popover:', err);
      dialog.alert({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Could not change student lock status.',
      });
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/90 dark:border-white/10 shadow-2xl p-5 space-y-4 overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-gray-100 dark:border-white/5 pb-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`relative w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold font-mono text-lg text-white shadow-sm flex-shrink-0 ${
                  isBlocked
                    ? 'bg-gradient-to-b from-gray-700 to-gray-900 border border-gray-600'
                    : isBothOn
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600 border border-emerald-400'
                    : isBothOff
                    ? 'bg-gradient-to-br from-rose-500 to-red-600 border border-rose-400'
                    : 'bg-gradient-to-r from-emerald-500 to-rose-500 border border-emerald-300/40 shadow-sm'
                }`}
              >
                <span className="leading-none">{activeDoc.tokenNo}</span>
                {isBlocked && (
                  <span
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gray-800 border border-gray-500 flex items-center justify-center shadow-sm z-10"
                    title="Account Locked by Admin"
                  >
                    <Lock className="w-2.5 h-2.5 text-gray-300" />
                  </span>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white truncate">
                  {nameEn}
                </h3>
                {nameMl && (
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium truncate font-malayalam">
                    {nameMl}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <span>{batch}</span>
                  {(activeDoc.username || activeDoc.uname) && (
                    <span className="font-mono opacity-80">@{activeDoc.username || activeDoc.uname}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Historical Date Notice if inspecting past days */}
          {targetDateIST < getTodayISTDate() && (
            <div className="p-2.5 rounded-2xl bg-purple-500/10 border border-purple-500/25 flex items-start gap-2 text-xs text-purple-700 dark:text-purple-300">
              <History className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-tight">
                <span className="font-bold block">{t('historicalNotice', 'Viewing Historical Record')}</span>
                <span className="opacity-80 block mt-0.5">{t('historicalRecordNotice', 'Viewing historical dining record. Past days reflect archived ledger entries.')}</span>
              </div>
            </div>
          )}

          {/* Pending Unblock Appeal Notice if active */}
          {isBlocked && activeDoc.pendingUnblockRequest?.status === 'pending' && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-500/30 flex items-start gap-2.5 text-xs text-amber-950 dark:text-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse mt-1.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-bold block">
                  {t('unblockRequestedBadge', 'Unblock Requested')} (#{activeDoc.pendingUnblockRequest.ticketNumber})
                </span>
                <span className="text-[11px] opacity-80 block mt-0.5 italic">
                  &ldquo;{activeDoc.pendingUnblockRequest.reasonNote || activeDoc.pendingUnblockRequest.reasonLabel}&rdquo;
                </span>
              </div>
            </div>
          )}

          {/* Blocked Student Fine Alert & Office Payment Notice */}
          {isBlocked && (
            <div className="p-3.5 rounded-2xl bg-rose-50/90 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-500/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-xs text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                  <Ban className="w-3.5 h-3.5 text-rose-500" />
                  <span>Dual-Grid Suspension</span>
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  activeDoc.fineStatus === 'paid'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : activeDoc.fineStatus === 'waived'
                    ? 'bg-gray-200 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                    : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                }`}>
                  {activeDoc.fineStatus || 'Unpaid'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-white dark:bg-black/30 border border-rose-200/60 dark:border-rose-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-400 block uppercase tracking-wider">Fine Due</span>
                  <span className="font-mono text-base font-black text-rose-950 dark:text-rose-100">₹{studentFineAmt}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setFineInput(String(studentFineAmt));
                    setFineReason(activeDoc.fineReason || '');
                    setEditingFine(!editingFine);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Edit2 className="w-3 h-3 text-emerald-500" />
                  <span>{editingFine ? 'Close' : 'Edit Fine'}</span>
                </button>
              </div>

              {editingFine && (
                <div className="p-2.5 rounded-xl bg-white dark:bg-black/40 border border-emerald-500/40 space-y-2 text-xs">
                  <div className="flex items-center gap-1 flex-wrap">
                    <span className="text-[10px] text-gray-400">Presets:</span>
                    {[0, 50, 100, 150, 200].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFineInput(String(preset))}
                        className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                          Number(fineInput) === preset
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {preset === 0 ? '₹0 (Waive)' : `₹${preset}`}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      min="0"
                      value={fineInput}
                      onChange={(e) => setFineInput(e.target.value)}
                      className="w-full py-1 px-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 font-mono font-bold text-xs"
                      placeholder="Amount (₹)"
                    />
                    <input
                      type="text"
                      value={fineReason}
                      onChange={(e) => setFineReason(e.target.value)}
                      className="w-full py-1 px-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs"
                      placeholder="Reason"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1">
                    <button
                      type="button"
                      onClick={() => setEditingFine(false)}
                      className="py-1 px-2 rounded-lg text-[11px] font-bold text-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveFine}
                      disabled={savingFine || !fineInput}
                      className="py-1 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer disabled:opacity-50"
                    >
                      <Save className="w-3 h-3" />
                      <span>{savingFine ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                </div>
              )}

              <p className="text-[11px] text-rose-800 dark:text-rose-300 leading-tight">
                Student must pay <strong>₹{studentFineAmt}</strong> at the ADSA Canteen Office to restore both Breakfast & Lunch tokens.
              </p>
            </div>
          )}
          {/* Target Date Context & Admin Cutoff Bypass Badge */}
          <div className="flex items-center justify-between text-xs px-1">
            <div className="flex items-center gap-1.5 font-bold text-gray-800 dark:text-gray-200">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-500" />
              <span>{formatFriendlyDate(targetDateIST, true)}</span>
            </div>
            {lockInfo.isAdminOverride ? (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" title={lockInfo.reason}>
                <ShieldCheck className="w-3 h-3" />
                <span>{t('adminOverrideActiveBadge', 'Admin Override Active')}</span>
              </span>
            ) : (
              <span className="text-[10px] text-gray-400 font-medium font-mono">
                {targetDateIST}
              </span>
            )}
          </div>

          {/* Dual Meal Status Cards (Breakfast & Lunch) */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Breakfast Status Card */}
            <div className="p-2.5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 flex flex-col justify-between gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Coffee className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
                  <span>{t('navBreakfast') || 'Breakfast'}</span>
                </span>
                {isBlocked ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">Blocked</span>
                ) : isBfOn ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> ON
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                    <XCircle className="w-2.5 h-2.5" /> OFF
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                {bfExc ? (bfExc.label || 'Override') : (activeDoc.obj?.breakfast?.[effectiveDay] ? 'Routine: ON' : 'Routine: OFF')}
              </p>
            </div>

            {/* Lunch Status Card */}
            <div className="p-2.5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 flex flex-col justify-between gap-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  <Utensils className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('navLunch') || 'Lunch'}</span>
                </span>
                {isBlocked ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400">Blocked</span>
                ) : isLuOn ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                    <CheckCircle2 className="w-2.5 h-2.5" /> ON
                  </span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center gap-0.5">
                    <XCircle className="w-2.5 h-2.5" /> OFF
                  </span>
                )}
              </div>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 truncate">
                {luExc ? (luExc.label || 'Override') : (activeDoc.obj?.lunch?.[effectiveDay] ? 'Routine: ON' : 'Routine: OFF')}
              </p>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="space-y-2 pt-1">
            {/* Action 1: View Student Routine & Details Modal */}
            {onOpenDetails && (
              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  onClose();
                  onOpenDetails(activeDoc);
                }}
                className="w-full py-2 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 border border-emerald-300/80 dark:border-emerald-500/30 transition-all cursor-pointer shadow-xs"
              >
                <Info className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{t('viewStudentDetails', 'View Student Routine & Dietary Details')}</span>
              </button>
            )}

            {/* Context-Aware Action Buttons (Render ONLY relevant, non-redundant options) */}
            {!isBlocked && (
              <div className="space-y-2">
                {/* 1. Meal Toggle Buttons Grid */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Breakfast Toggle Button: Shows Turn OFF if ON, Turn ON if OFF */}
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleToggleSpecificMeal('breakfast')}
                    className={`w-full py-2.5 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all transform active:scale-95 disabled:opacity-60 cursor-pointer ${
                      isBfOn
                        ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-300/70 dark:border-rose-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
                    }`}
                    title={isBfOn ? 'Turn OFF Breakfast' : 'Turn ON Breakfast'}
                  >
                    {togglingMeal === 'breakfast' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                    ) : (
                      <Coffee className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {togglingMeal === 'breakfast'
                        ? t('updatingDots', 'Updating...')
                        : isBfOn
                        ? (t('turnOffBreakfast') || 'Turn OFF Breakfast')
                        : (t('turnOnBreakfast') || 'Turn ON Breakfast')}
                    </span>
                  </button>

                  {/* Lunch Toggle Button: Shows Turn OFF if ON, Turn ON if OFF */}
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleToggleSpecificMeal('lunch')}
                    className={`w-full py-2.5 px-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all transform active:scale-95 disabled:opacity-60 cursor-pointer ${
                      isLuOn
                        ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-300/70 dark:border-rose-500/30'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
                    }`}
                    title={isLuOn ? 'Turn OFF Lunch' : 'Turn ON Lunch'}
                  >
                    {togglingMeal === 'lunch' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin flex-shrink-0" />
                    ) : (
                      <Utensils className="w-3.5 h-3.5 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {togglingMeal === 'lunch'
                        ? t('updatingDots', 'Updating...')
                        : isLuOn
                        ? (t('turnOffLunch') || 'Turn OFF Lunch')
                        : (t('turnOnLunch') || 'Turn ON Lunch')}
                    </span>
                  </button>
                </div>

                {/* 2. Full Day Shortcut: Render ONLY when BOTH are ON (to skip day) or BOTH are OFF (to resume day) */}
                {/* When partial (1 ON / 1 OFF), the individual buttons above ALREADY represent making both active or both off, so no redundant full-day button is rendered! */}
                {isBothOn && (
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleToggleBoth(false)}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-60"
                  >
                    {togglingMeal === 'both' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {togglingMeal === 'both'
                        ? t('updatingDots', 'Updating...')
                        : (t('turnBothOff') || 'Turn BOTH OFF (Skip Day)')}
                    </span>
                  </button>
                )}

                {isBothOff && (
                  <button
                    type="button"
                    disabled={isToggling}
                    onClick={() => handleToggleBoth(true)}
                    className="w-full py-2 px-3 rounded-xl text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95 disabled:opacity-60"
                  >
                    {togglingMeal === 'both' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {togglingMeal === 'both'
                        ? t('updatingDots', 'Updating...')
                        : (t('turnBothOn') || 'Turn BOTH ON (Active Day)')}
                    </span>
                  </button>
                )}
              </div>
            )}

            {/* Action 3: Open Full Edit Drawer */}
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                onClose();
                onOpenFullDrawer(activeDoc);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-100 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Edit className="w-4 h-4 text-emerald-500" />
              <span>{t('editFullProfile', 'Edit Full Profile & Schedules')}</span>
            </button>
          </div>

          {/* Quick Lock/Unlock & Student Portal Link */}
          <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px]">
            <Link
              to={`/student?token=${activeDoc.tokenNo}`}
              onClick={() => feedback('tick')}
              className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              title="Open Student Portal for this student"
            >
              <ExternalLink className="w-3 h-3" />
              <span>{t('studentPortal', 'Student Portal')}</span>
            </Link>

            <button
              type="button"
              onClick={handleQuickToggleBlock}
              className={`font-bold flex items-center gap-1 cursor-pointer ${
                isBlocked
                  ? 'text-emerald-600 dark:text-emerald-400 hover:underline'
                  : 'text-gray-500 hover:text-rose-500 dark:hover:text-rose-400'
              }`}
            >
              {isBlocked ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> : <Ban className="w-3.5 h-3.5 text-rose-500" />}
              <span>{isBlocked ? (t('unblockStudent') || 'Unblock Student') : (t('blockStudent') || 'Block Student')}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
