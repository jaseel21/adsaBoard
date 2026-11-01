import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Delete,
  RotateCcw,
  Utensils,
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Info,
  Heart,
  Ban,
  ArrowRight,
  UserX,
  UserCheck,
} from 'lucide-react';
import IslamicAvatar from '../ui/IslamicAvatar';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { getEffectiveStudentMealStatus } from '../../utils/studentExceptionService';

export default function TactileNumpadHUD({
  documents = [],
  servedMap = new Map(),
  meal = 'lunch',
  targetDateIST,
  effectiveDay,
  onServe,
  onUnserve,
  onOpenGraceModal,
  onLogInterception,
  onInspectDispute,
  soundEnabled = true,
  hapticEnabled = true,
  highContrast = false,
}) {
  const [inputToken, setInputToken] = useState('');
  const [lastActionStatus, setLastActionStatus] = useState(null); // { type: 'served' | 'unserved' | 'grace', tokenNo, studentName }

  // Audio & Haptic triggers
  const playClick = useCallback(() => {
    if (soundEnabled) soundEngine.playMechanicalClick();
    if (hapticEnabled) hapticEngine.lightTap();
  }, [soundEnabled, hapticEnabled]);

  const playApproved = useCallback(() => {
    if (soundEnabled) soundEngine.playServingApprovedChime();
    if (hapticEnabled) hapticEngine.servingApproved();
  }, [soundEnabled, hapticEnabled]);

  const playWarning = useCallback(() => {
    if (soundEnabled) soundEngine.playAvoiderWarningTone();
    if (hapticEnabled) hapticEngine.avoiderWarning();
  }, [soundEnabled, hapticEnabled]);

  const playDuplicate = useCallback(() => {
    if (soundEnabled) soundEngine.playDuplicateAlert();
    if (hapticEnabled) hapticEngine.duplicateAlert();
  }, [soundEnabled, hapticEnabled]);

  // Lookup target student
  const activeStudent = useMemo(() => {
    if (!inputToken) return null;
    const num = Number(inputToken);
    return documents.find((d) => Number(d.tokenNo) === num) || null;
  }, [documents, inputToken]);

  // Evaluate status of current lookup
  const tokenEvaluation = useMemo(() => {
    if (!inputToken) return null;
    const tokenNo = Number(inputToken);
    if (!activeStudent) {
      return { status: 'NOT_FOUND', tokenNo };
    }

    const servedRecord = servedMap.get(tokenNo);
    if (servedRecord) {
      return {
        status: 'ALREADY_SERVED',
        tokenNo,
        student: activeStudent,
        record: servedRecord,
      };
    }

    const isEligible = getEffectiveStudentMealStatus(
      activeStudent,
      targetDateIST,
      effectiveDay,
      meal
    );

    if (isEligible) {
      return {
        status: 'ELIGIBLE_UNSERVED',
        tokenNo,
        student: activeStudent,
      };
    }

    // Determine reason for avoider status
    let reason = 'Weekly Routine OFF';
    if (activeStudent.block) {
      reason = 'Student Account Blocked / Disciplinary Hold';
    } else if (
      activeStudent.dateExceptions &&
      activeStudent.dateExceptions[targetDateIST]
    ) {
      const exc = activeStudent.dateExceptions[targetDateIST];
      reason = exc.label || 'Scheduled Date Exception / Leave';
    }

    return {
      status: 'AVOIDER_OFF',
      tokenNo,
      student: activeStudent,
      reason,
    };
  }, [inputToken, activeStudent, servedMap, targetDateIST, effectiveDay, meal]);

  // Auto sound feedback when evaluation status changes
  useEffect(() => {
    if (!tokenEvaluation) return;
    if (tokenEvaluation.status === 'AVOIDER_OFF') {
      playWarning();
    } else if (tokenEvaluation.status === 'ALREADY_SERVED') {
      playDuplicate();
    }
  }, [tokenEvaluation, playWarning, playDuplicate]);

  // Handlers for numpad buttons
  const handleDigit = useCallback((digit) => {
    playClick();
    setInputToken((prev) => {
      if (prev.length >= 4) return prev;
      return `${prev}${digit}`;
    });
  }, [playClick]);

  const handleBackspace = useCallback(() => {
    playClick();
    setInputToken((prev) => prev.slice(0, -1));
  }, [playClick]);

  const handleClear = useCallback(() => {
    playClick();
    setInputToken('');
  }, [playClick]);

  // Serve current student
  const handleConfirmServe = useCallback(async () => {
    if (!tokenEvaluation || tokenEvaluation.status !== 'ELIGIBLE_UNSERVED') return;
    const { tokenNo, student } = tokenEvaluation;
    try {
      playApproved();
      await onServe(tokenNo, student, 'numpad');
      setLastActionStatus({
        type: 'served',
        tokenNo,
        studentName: student.uname || student.name || `Token #${tokenNo}`,
      });
      setInputToken('');
    } catch (err) {
      console.error('Serve error:', err);
    }
  }, [tokenEvaluation, playApproved, onServe]);

  // Reversal / Undo
  const handleUndoServe = async (tokenNo, student) => {
    try {
      playClick();
      await onUnserve(tokenNo, student);
      setLastActionStatus({
        type: 'unserved',
        tokenNo,
        studentName: student?.uname || student?.name || `Token #${tokenNo}`,
      });
    } catch (err) {
      console.error('Undo error:', err);
    }
  };

  // Intercept unauthorized attempt
  const handleRecordAttempt = () => {
    if (!tokenEvaluation || tokenEvaluation.status !== 'AVOIDER_OFF') return;
    onLogInterception(tokenEvaluation.tokenNo, tokenEvaluation.student);
    setInputToken('');
  };

  // Physical Keyboard Listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (tokenEvaluation?.status === 'ELIGIBLE_UNSERVED') {
          handleConfirmServe();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tokenEvaluation, handleConfirmServe, handleBackspace, handleClear, handleDigit]);

  return (
    <div className="w-full flex flex-col lg:flex-row items-stretch gap-6">
      {/* LEFT: TACTILE VERIFICATION CARD HUD (45% on desktop, top on mobile) */}
      <div className="w-full lg:w-7/12 flex flex-col justify-between">
        {/* TOP STATUS BAR */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-emerald-900/30">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold tracking-wider uppercase text-gray-500 dark:text-gray-400">
              Tactile Verification Gateway
            </span>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
            {meal.toUpperCase()} • {targetDateIST}
          </div>
        </div>

        {/* DYNAMIC CARD VIEWPORT */}
        <div className="my-4 min-h-[300px] sm:min-h-[340px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            {/* STATE 0: IDLE / WAITING FOR ENTRY */}
            {!inputToken && (
              <motion.div
                key="idle"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.15 }}
                className="w-full p-6 sm:p-8 rounded-3xl bg-white/70 dark:bg-[#0c1411]/80 backdrop-blur-md border border-gray-200 dark:border-emerald-900/30 text-center shadow-lg"
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shadow-inner">
                  <Utensils className="w-8 h-8 sm:w-10 sm:h-10" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-emerald-200">
                  Ready for Food Verification
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto mt-1.5">
                  Type token number on the keypad or press keyboard numbers <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">0-9</kbd> and <kbd className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-xs">Enter</kbd> to serve.
                </p>

                {/* RECENT ACTION PILL */}
                {lastActionStatus && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-emerald-100/80 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-700/40 text-emerald-800 dark:text-emerald-300 text-xs font-medium"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>
                      Token #{lastActionStatus.tokenNo} ({lastActionStatus.studentName}) marked served!
                    </span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* STATE 1: GREEN / ELIGIBLE TO BE SERVED */}
            {tokenEvaluation && tokenEvaluation.status === 'ELIGIBLE_UNSERVED' && (
              <motion.div
                key="eligible"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.18 }}
                className={`w-full p-6 sm:p-7 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden ${
                  highContrast
                    ? 'bg-emerald-950 text-white border-4 border-emerald-400'
                    : 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-teal-500/10 dark:from-emerald-950/60 dark:via-[#0c1a15] dark:to-teal-950/40 border-2 border-emerald-500/50 shadow-emerald-500/10'
                }`}
              >
                {/* Visual Glow Header Badge */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider shadow-sm">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Eligible • Token Active</span>
                  </span>
                  <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    #{tokenEvaluation.tokenNo}
                  </span>
                </div>

                {/* Student Info Row */}
                <div className="flex items-center space-x-4 mb-5">
                  <IslamicAvatar
                    student={tokenEvaluation.student}
                    size="lg"
                    showStatusRing={false}
                    className="shadow-md"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                      {tokenEvaluation.student.uname || tokenEvaluation.student.name || `Token #${tokenEvaluation.tokenNo}`}
                    </h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                        {tokenEvaluation.student.batch || 'Dars Student'}
                      </span>
                      {tokenEvaluation.student.phone && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {tokenEvaluation.student.phone}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dietary Allowances Preview */}
                <div className="p-3 rounded-2xl bg-white/60 dark:bg-black/30 border border-emerald-500/20 mb-6">
                  <div className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">
                    Dietary Allowances
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    {['fish', 'beef', 'chicken', 'mutton'].map((meatKey) => {
                      const isAllowed = tokenEvaluation.student.obj2?.[meatKey] !== false;
                      return (
                        <span
                          key={meatKey}
                          className={`px-2 py-0.5 rounded-md font-medium capitalize flex items-center space-x-1 ${
                            isAllowed
                              ? 'bg-emerald-100/70 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300/40'
                              : 'bg-rose-100/80 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-300/50 line-through'
                          }`}
                        >
                          <span>{meatKey}</span>
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* MASSIVE 1-TAP SERVE BUTTON */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleConfirmServe}
                  className="w-full py-4 sm:py-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-lg sm:text-xl shadow-xl shadow-emerald-600/30 flex items-center justify-center space-x-3 transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-7 h-7" />
                  <span>SERVE MEAL (Press Enter)</span>
                </motion.button>
              </motion.div>
            )}

            {/* STATE 2: RED / AVOIDER / TOKEN OFF */}
            {tokenEvaluation && tokenEvaluation.status === 'AVOIDER_OFF' && (
              <motion.div
                key="avoider"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.18 }}
                className={`w-full p-6 sm:p-7 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden ${
                  highContrast
                    ? 'bg-rose-950 text-white border-4 border-rose-400'
                    : 'bg-gradient-to-br from-rose-500/15 via-rose-500/5 to-red-500/10 dark:from-rose-950/70 dark:via-[#1c0c0e] dark:to-red-950/50 border-2 border-rose-500/60 shadow-rose-500/15'
                }`}
              >
                {/* Header Ruby Warning Banner */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-rose-600 text-white font-black text-xs uppercase tracking-wider animate-pulse shadow-sm">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>TOKEN OFF — DO NOT SERVE</span>
                  </span>
                  <span className="text-2xl font-black font-mono text-rose-600 dark:text-rose-400">
                    #{tokenEvaluation.tokenNo}
                  </span>
                </div>

                {/* Student Info */}
                <div className="flex items-center space-x-4 mb-4">
                  <IslamicAvatar
                    student={tokenEvaluation.student}
                    size="lg"
                    showStatusRing={false}
                    className="ring-4 ring-rose-500/30"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                      {tokenEvaluation.student.uname || tokenEvaluation.student.name || `Token #${tokenEvaluation.tokenNo}`}
                    </h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="px-2 py-0.5 rounded-md text-xs font-semibold bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-700/50">
                        {tokenEvaluation.student.batch || 'Dars Student'}
                      </span>
                      <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">
                        {tokenEvaluation.reason}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanation Card */}
                <div className="p-3.5 rounded-2xl bg-rose-100/70 dark:bg-rose-950/50 border border-rose-300/50 dark:border-rose-800/40 text-xs text-rose-900 dark:text-rose-200 mb-5 leading-relaxed">
                  <strong>Notice:</strong> This student did not turn on their food token for {meal}. Putting food in their plate causes food shortage for valid token holders.
                </div>

                {/* AVOIDER ACTIONS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onOpenGraceModal(tokenEvaluation.tokenNo, tokenEvaluation.student)}
                    className="py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <Heart className="w-4 h-4" />
                    <span>Issue Grace Plate</span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleRecordAttempt}
                    className="py-3 px-4 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-sm flex items-center justify-center space-x-2 cursor-pointer transition-all"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Log Interception</span>
                  </motion.button>
                </div>
              </motion.div>
            )}

            {/* STATE 3: AMBER / ALREADY SERVED (DUPLICATE) */}
            {tokenEvaluation && tokenEvaluation.status === 'ALREADY_SERVED' && (
              <motion.div
                key="already_served"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.18 }}
                className={`w-full p-6 sm:p-7 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden ${
                  highContrast
                    ? 'bg-amber-950 text-white border-4 border-amber-400'
                    : 'bg-gradient-to-br from-amber-500/15 via-amber-500/5 to-orange-500/10 dark:from-amber-950/70 dark:via-[#1c1408] dark:to-orange-950/50 border-2 border-amber-500/60 shadow-amber-500/15'
                }`}
              >
                {/* Header Amber Banner */}
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-600 text-white font-black text-xs uppercase tracking-wider shadow-sm">
                    <Clock className="w-3.5 h-3.5" />
                    <span>ALREADY SERVED</span>
                  </span>
                  <span className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
                    #{tokenEvaluation.tokenNo}
                  </span>
                </div>

                {/* Student Info */}
                <div className="flex items-center space-x-4 mb-4">
                  <IslamicAvatar
                    student={tokenEvaluation.student}
                    size="lg"
                    showStatusRing={false}
                    className="ring-4 ring-amber-500/30"
                  />
                  <div className="min-w-0 flex-1">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white truncate">
                      {tokenEvaluation.student.uname || tokenEvaluation.student.name || `Token #${tokenEvaluation.tokenNo}`}
                    </h2>
                    <div className="flex items-center space-x-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{tokenEvaluation.student.batch || 'Dars Student'}</span>
                    </div>
                  </div>
                </div>

                {/* Serving Timestamp Details */}
                <div className="p-4 rounded-2xl bg-amber-100/70 dark:bg-amber-950/60 border border-amber-300/50 dark:border-amber-700/50 text-xs text-amber-900 dark:text-amber-200 mb-5 leading-relaxed space-y-1">
                  <div>
                    <strong>Served at:</strong>{' '}
                    {new Date(tokenEvaluation.record.servedAtIso || Date.now()).toLocaleTimeString('en-IN', {
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </div>
                  <div>
                    <strong>By Server:</strong> {tokenEvaluation.record.servedByName || 'Staff'}{' '}
                    ({tokenEvaluation.record.counterId || 'Counter 1'})
                  </div>
                  {tokenEvaluation.record.isGracePlate && (
                    <div className="text-amber-700 dark:text-amber-300 font-semibold">
                      (Served as Courtesy Grace Plate)
                    </div>
                  )}
                </div>

                {/* REVERSAL BUTTON */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleUndoServe(tokenEvaluation.tokenNo, tokenEvaluation.student)}
                  className="w-full py-3.5 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-sm flex items-center justify-center space-x-2 cursor-pointer transition-all"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Undo Serving (Server Reversal)</span>
                </motion.button>
              </motion.div>
            )}

            {/* STATE 4: NOT FOUND */}
            {tokenEvaluation && tokenEvaluation.status === 'NOT_FOUND' && (
              <motion.div
                key="not_found"
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                className="w-full p-8 rounded-3xl bg-white/70 dark:bg-[#0c1411]/80 backdrop-blur-md border border-gray-200 dark:border-emerald-900/30 text-center shadow-lg"
              >
                <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400">
                  <UserX className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                  Token #{tokenEvaluation.tokenNo} Not Registered
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  No active student document exists for this number.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* BOTTOM HELPER SHORTCUTS */}
        <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500 pt-2 border-t border-gray-200/60 dark:border-emerald-900/20">
          <span>Shortcuts: 0-9 (Type), Enter (Serve), Esc (Clear)</span>
          {activeStudent && (
            <button
              onClick={() => onInspectDispute(activeStudent)}
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center space-x-1"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Full Dining History</span>
            </button>
          )}
        </div>
      </div>

      {/* RIGHT: ERGONOMIC PHYSICAL NUMPAD (55% on desktop, bottom on mobile) */}
      <div className="w-full lg:w-5/12 flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0a120e] border border-gray-200 dark:border-emerald-900/40 shadow-xl">
        {/* INPUT DISPLAY HUD */}
        <div className="mb-4">
          <div className="flex items-center justify-between px-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-[#050907] border border-gray-200 dark:border-emerald-900/40 shadow-inner">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              Token Input
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-3xl sm:text-4xl font-black font-mono tracking-wider text-emerald-600 dark:text-emerald-400">
                {inputToken || '—'}
              </span>
              {inputToken && (
                <button
                  onClick={handleClear}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  title="Clear input"
                >
                  <Delete className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* NUMPAD BUTTON GRID (3x4) */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 flex-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
            <motion.button
              key={digit}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleDigit(digit)}
              className="h-14 sm:h-16 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-[#121c17] dark:hover:bg-[#182620] active:bg-emerald-600 text-gray-900 dark:text-white font-black text-2xl sm:text-3xl shadow-sm border border-gray-200 dark:border-emerald-800/30 flex items-center justify-center cursor-pointer transition-colors"
            >
              {digit}
            </motion.button>
          ))}

          {/* Row 4: Clear, 0, Backspace */}
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleClear}
            className="h-14 sm:h-16 rounded-2xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-950/70 text-rose-600 dark:text-rose-400 font-bold text-sm sm:text-base border border-rose-200 dark:border-rose-900/40 flex items-center justify-center cursor-pointer transition-colors"
          >
            CLEAR
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => handleDigit(0)}
            className="h-14 sm:h-16 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-[#121c17] dark:hover:bg-[#182620] active:bg-emerald-600 text-gray-900 dark:text-white font-black text-2xl sm:text-3xl shadow-sm border border-gray-200 dark:border-emerald-800/30 flex items-center justify-center cursor-pointer transition-colors"
          >
            0
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={handleBackspace}
            className="h-14 sm:h-16 rounded-2xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-950/70 text-amber-600 dark:text-amber-400 font-bold text-lg border border-amber-200 dark:border-amber-900/40 flex items-center justify-center cursor-pointer transition-colors"
          >
            <Delete className="w-6 h-6" />
          </motion.button>
        </div>

        {/* QUICK NUMPAD FOOTER */}
        <div className="mt-4 pt-3 border-t border-gray-100 dark:border-emerald-900/30 text-center">
          <span className="text-[11px] text-gray-400 dark:text-gray-500">
            Haptic Touch Synthesizer • Single-Thumb Ergonomics
          </span>
        </div>
      </div>
    </div>
  );
}
