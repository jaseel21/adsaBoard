import React, { useState, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Zap,
  Edit,
  Lock,
  Unlock,
  CheckCircle2,
  XCircle,
  CalendarDays,
  Home,
  Phone,
  Layers,
  Utensils,
  Coffee,
} from 'lucide-react';
import { dialog } from '../../utils/dialog';
import firebase from '../../firebase/config';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';
import { AuthContext } from '../../store/AuthContext';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../../utils/auditLogger';
import { DAY_FULL_NAMES } from '../../utils/tokenAuditHelper';
import {
  formatFriendlyDate,
  getActiveStudentException,
  getEffectiveStudentMealStatus,
} from '../../utils/studentExceptionService';
import { getManifestPrintRecord } from '../../utils/manifestPrintService';

/**
 * Tactical Admin Quick Popover
 * Provides immediate 1-tap meal toggle, quick lock/unlock, and quick jump
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
}) {
  const { user, role } = useContext(AuthContext);
  const { feedback } = useFeedback();
  const { t } = useLanguage();
  const [toggling, setToggling] = useState(false);

  if (!isOpen || !student) return null;

  const mealKey = isLunch ? 'lunch' : 'breakfast';
  const isBlocked = Boolean(student.block);
  const activeExc = getActiveStudentException(student, targetDateIST, mealKey);
  const isOn = getEffectiveStudentMealStatus(student, targetDateIST, effectiveDay, mealKey);

  const nameEn = student.nameEn || student.name || `Token #${student.tokenNo}`;
  const nameMl = student.nameMl;
  const room = student.roomNo;
  const batch = student.batch || 'General';

  // 1-Tap Toggle Meal for active date
  const handleQuickToggleMeal = async () => {
    feedback('tick');
    setToggling(true);

    const nextState = !isOn;
    const existingExceptions = student.dateExceptions || {};
    const dateRecord = existingExceptions[targetDateIST] || {};

    const updatedDateRecord = {
      ...dateRecord,
      [mealKey]: nextState,
      updatedAt: new Date().toISOString(),
    };

    const updatedExceptions = {
      ...existingExceptions,
      [targetDateIST]: updatedDateRecord,
    };

    try {
      await firebase
        .firestore()
        .collection('students')
        .doc(student.id)
        .set(
          {
            dateExceptions: updatedExceptions,
            lastUpdatedBy: user?.email || 'admin',
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );

      const friendlyDate = formatFriendlyDate(targetDateIST, true);
      const dayName = DAY_FULL_NAMES[effectiveDay] || effectiveDay;
      const mealName = isLunch ? 'Lunch' : 'Breakfast';
      const fieldKey = `${friendlyDate} • ${mealName}`;

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
          id: student.id,
          label: `Token #${student.tokenNo} (${nameEn})`,
          tokenNo: Number(student.tokenNo),
        },
        changes: {
          diffSummary: `Token #${student.tokenNo} (${nameEn}): ${mealName} turned ${nextState ? 'ON' : 'OFF'} for ${friendlyDate}`,
          fieldsChanged: [fieldKey],
          before: { [fieldKey]: isOn },
          after: { [fieldKey]: nextState },
          tokenDeltas: [
            {
              type: 'quick_toggle',
              scopeLabel: friendlyDate,
              date: targetDateIST,
              day: dayName,
              dayShort: effectiveDay,
              meal: mealKey,
              mealLabel: mealName,
              previous: isOn,
              current: nextState,
              previousLabel: isOn ? 'ON' : 'OFF',
              currentLabel: nextState ? 'ON' : 'OFF',
              tokenNo: Number(student.tokenNo),
              studentName: nameEn,
              label: `${mealName} for ${friendlyDate}`,
            },
          ],
        },
        metadata: {
          date: targetDateIST,
          day: dayName,
          dayShort: effectiveDay,
          meal: mealKey,
          tokenNo: Number(student.tokenNo),
          studentName: nameEn,
          previousState: isOn,
          currentState: nextState,
        },
      });

      feedback('success');
      const mealLabel = isLunch ? (t('navLunch') || 'Lunch') : (t('navBreakfast') || 'Breakfast');
      dialog.toast.success(
        nextState
          ? (t('mealTurnedOnToast', '{meal} Turned ON').replace('{meal}', mealLabel))
          : (t('mealTurnedOffToast', '{meal} Turned OFF').replace('{meal}', mealLabel)),
        t('studentUpdatedForDate', 'Token #{token} ({name}) updated for {date}.')
          .replace('{token}', student.tokenNo)
          .replace('{name}', nameEn)
          .replace('{date}', formatFriendlyDate(targetDateIST))
      );

      // Check if physical print was already taken for this meal service
      getManifestPrintRecord(mealKey, targetDateIST).then((printRecord) => {
        if (printRecord && printRecord.printedAt) {
          dialog.toast.warning(
            '⚠️ Kitchen Sheet Stale',
            `A manifest [Rev ${printRecord.revision}] was already printed for this meal. Please reprint from Supply Sections to sync with the kitchen.`
          );
        }
      }).catch(() => {});

      if (onStudentUpdated) {
        onStudentUpdated({
          ...student,
          dateExceptions: updatedExceptions,
        });
      }
      onClose();
    } catch (err) {
      console.error('Error toggling meal in popover:', err);
      dialog.alert({
        type: 'error',
        title: 'Toggle Failed',
        message: err.message || 'Could not update dining status.',
      });
    } finally {
      setToggling(false);
    }
  };

  // Quick Account Block/Unblock
  const handleQuickToggleBlock = async () => {
    feedback('warning');
    const nextBlock = !isBlocked;

    const confirmed = await dialog.confirm({
      title: nextBlock ? `Lock Token #${student.tokenNo}?` : `Unlock Token #${student.tokenNo}?`,
      message: nextBlock
        ? `Locking will freeze Token #${student.tokenNo} (${nameEn}) and suspend dining participation.`
        : `Re-activate Token #${student.tokenNo} (${nameEn}) into active canteen rotation?`,
      confirmText: nextBlock ? 'Lock Token' : 'Unlock Token',
      confirmColor: nextBlock ? 'rose' : 'emerald',
      icon: nextBlock ? 'lock' : 'unlock',
    });

    if (!confirmed) return;

    try {
      await firebase
        .firestore()
        .collection('students')
        .doc(student.id)
        .update({
          block: nextBlock,
          blockReason: nextBlock ? 'Locked by admin from Master Board' : '',
          lastUpdatedBy: user?.email || 'admin',
          updatedAt: new Date().toISOString(),
        });

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
          id: student.id,
          label: `Token #${student.tokenNo} (${nameEn})`,
          tokenNo: Number(student.tokenNo),
        },
        changes: {
          diffSummary: `Token #${student.tokenNo} (${nameEn}) ${nextBlock ? 'locked/frozen' : 'unlocked/re-activated'} from Master Board`,
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
              tokenNo: Number(student.tokenNo),
              studentName: nameEn,
              label: 'Account Status',
            },
          ],
        },
        metadata: {
          tokenNo: Number(student.tokenNo),
          studentName: nameEn,
          previousState: !nextBlock,
          currentState: nextBlock,
        },
      });

      feedback('success');
      dialog.toast.success(
        nextBlock ? 'Account Locked' : 'Account Re-activated',
        `Token #${student.tokenNo} status updated.`
      );

      if (onStudentUpdated) {
        onStudentUpdated({
          ...student,
          block: nextBlock,
        });
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
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-extrabold font-mono text-lg text-white shadow-sm flex-shrink-0 ${
                  isBlocked
                    ? 'bg-gradient-to-b from-gray-700 to-gray-900'
                    : activeExc
                    ? 'bg-gradient-to-br from-amber-500 to-orange-600'
                    : isOn
                    ? 'bg-gradient-to-br from-emerald-500 to-green-600'
                    : 'bg-gradient-to-br from-rose-500 to-red-600'
                }`}
              >
                {isBlocked ? <Lock className="w-5 h-5 text-white" /> : student.tokenNo}
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
                  {room && <span>• Room {room}</span>}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Status Pill Strip */}
          <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 flex items-center justify-between text-xs">
            <span className="font-semibold text-gray-500 dark:text-gray-400">
              {formatFriendlyDate(targetDateIST)} ({isLunch ? (t('navLunch') || 'Lunch') : (t('navBreakfast') || 'Breakfast')}):
            </span>

            {isBlocked ? (
              <span className="inline-flex items-center gap-1 font-bold text-rose-500">
                <Lock className="w-3.5 h-3.5" />
                <span>{t('accountLocked', 'Account Locked')}</span>
              </span>
            ) : activeExc ? (
              <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{t('overrideBadge', 'Override: {status}').replace('{status}', isOn ? 'ON' : 'OFF')}</span>
              </span>
            ) : isOn ? (
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('statusServing', 'Serving Active (ON)')}</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 font-bold text-rose-500">
                <XCircle className="w-3.5 h-3.5" />
                <span>{t('statusCanceled', 'Canceled (OFF)')}</span>
              </span>
            )}
          </div>

          {/* 2 Primary Actions */}
          <div className="space-y-2 pt-1">
            {/* Action 1: Instant Toggle ON/OFF */}
            <button
              type="button"
              disabled={toggling || isBlocked}
              onClick={handleQuickToggleMeal}
              className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all transform active:scale-98 disabled:opacity-50 ${
                isOn
                  ? 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-300/60 dark:border-rose-500/30'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-500/25'
              }`}
            >
              <Zap className="w-4 h-4" />
              <span>
                {toggling
                  ? t('updatingDots', 'Updating...')
                  : isOn
                  ? (t('turnOffForMeal', 'Turn OFF for {meal}').replace('{meal}', isLunch ? (t('navLunch') || 'Lunch') : (t('navBreakfast') || 'Breakfast')))
                  : (t('turnOnForMeal', 'Turn ON for {meal}').replace('{meal}', isLunch ? (t('navLunch') || 'Lunch') : (t('navBreakfast') || 'Breakfast')))}
              </span>
            </button>

            {/* Action 2: Open Full Edit Drawer */}
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                onClose();
                onOpenFullDrawer(student);
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-100 font-bold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Edit className="w-4 h-4 text-emerald-500" />
              <span>{t('editFullProfile', 'Edit Full Profile & Schedules')}</span>
            </button>
          </div>

          {/* Quick Lock/Unlock Footer Link */}
          <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px]">
            <span className="text-gray-400">{t('securityAccess', 'Security Access:')}</span>
            <button
              type="button"
              onClick={handleQuickToggleBlock}
              className={`font-bold flex items-center gap-1 ${
                isBlocked
                  ? 'text-emerald-600 dark:text-emerald-400 hover:underline'
                  : 'text-gray-500 hover:text-rose-500 dark:hover:text-rose-400'
              }`}
            >
              {isBlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              <span>{isBlocked ? t('unlockStudent', 'Unlock Student') : t('lockStudent', 'Lock Student')}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
