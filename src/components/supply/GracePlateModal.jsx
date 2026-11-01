import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Heart,
  X,
  AlertCircle,
  CheckCircle2,
  Send,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import IslamicAvatar from '../ui/IslamicAvatar';
import { issueGracePlate } from '../../utils/mealSupplyService';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';

const GRACE_REASONS = [
  'Forgot to turn on token after returning from leave / അവധി കഴിഞ്ഞ് തിരിച്ചെത്തിയപ്പോൾ ടോക്കൺ ഇടാൻ മറന്നു',
  'Emergency dining requirement / അടിയന്തര ഭക്ഷണം',
  'System miscommunication / ടോക്കൺ സംശയം',
  'First meal back on campus / കാമ്പസിലെത്തിയ ആദ്യ ദിനം',
];

export default function GracePlateModal({
  isOpen,
  onClose,
  tokenNo,
  student,
  meal = 'lunch',
  targetDateIST,
  serverUser,
  serverRole,
  counterId = 'Counter 1',
  onSuccess,
}) {
  const [selectedReason, setSelectedReason] = useState(GRACE_REASONS[0]);
  const [customNote, setCustomNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !tokenNo) return null;

  const effectiveReason =
    selectedReason === 'Other'
      ? customNote || 'Courtesy meal issued'
      : selectedReason;

  const handleConfirmGrace = async () => {
    setIsSubmitting(true);
    try {
      soundEngine.playGracePlateChime();
      hapticEngine.gracePlate();

      await issueGracePlate({
        meal,
        targetDateIST,
        tokenNo,
        student,
        serverUser,
        serverRole,
        counterId,
        reasonNote: effectiveReason,
      });

      if (onSuccess) {
        onSuccess(tokenNo, student);
      }
      onClose();
    } catch (err) {
      console.error('Error issuing grace plate:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="w-full max-w-lg p-6 sm:p-7 rounded-3xl bg-white dark:bg-[#0c1411] border border-gray-200 dark:border-emerald-900/40 shadow-2xl space-y-5"
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-emerald-900/30">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Issue Grace Plate (കരുണ പ്ലേറ്റ്)
              </h3>
              <p className="text-xs text-gray-500">
                Ethical dining exception • Zero fine • Friendly notice
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* STUDENT INFO BADGE */}
        <div className="flex items-center space-x-3.5 p-3.5 rounded-2xl bg-gray-50 dark:bg-[#060a08] border border-gray-200 dark:border-emerald-900/40">
          <IslamicAvatar student={student} size="md" showStatusRing={false} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-base font-bold text-gray-900 dark:text-white truncate">
                {student?.uname || student?.name || `Token #${tokenNo}`}
              </span>
              <span className="font-mono text-xs font-black text-amber-600 dark:text-amber-400">
                #{tokenNo}
              </span>
            </div>
            <div className="text-xs text-gray-500">{student?.batch || 'Dars Resident'}</div>
          </div>
        </div>

        {/* REASON SELECTOR */}
        <div className="space-y-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Select Reason for Courtesy Serving:
          </label>
          <div className="space-y-2">
            {GRACE_REASONS.map((reason) => {
              const isSelected = selectedReason === reason;
              return (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setSelectedReason(reason)}
                  className={`w-full p-3 rounded-xl border text-left text-xs font-medium transition-all flex items-start space-x-2 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-400 text-amber-900 dark:text-amber-200 font-bold'
                      : 'bg-white dark:bg-[#080d0b] border-gray-200 dark:border-emerald-900/30 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span
                    className={`w-3.5 h-3.5 rounded-full mt-0.5 border flex-shrink-0 flex items-center justify-center ${
                      isSelected ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                    }`}
                  >
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                  </span>
                  <span>{reason}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ADVISORY NOTIFICATION PREVIEW */}
        <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/40 text-xs text-emerald-900 dark:text-emerald-200 space-y-1">
          <div className="flex items-center space-x-1.5 font-bold text-emerald-800 dark:text-emerald-300">
            <MessageSquare className="w-4 h-4" />
            <span>Automated Friendly Advisory Dispatched to Student:</span>
          </div>
          <p className="opacity-90 italic text-[11px] leading-relaxed">
            &ldquo;Token #{tokenNo}: A courtesy meal was provided for {meal.toUpperCase()} while token was inactive. Please review your dining schedule on T-Board so the kitchen can plan food portions accurately.&rdquo;
          </p>
        </div>

        {/* CONFIRM BUTTON */}
        <div className="flex items-center space-x-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 font-bold text-sm text-gray-700 dark:text-gray-200"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleConfirmGrace}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>{isSubmitting ? 'Issuing...' : 'Confirm Grace Plate'}</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
}
