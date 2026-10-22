import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileCheck2,
  AlertCircle,
  X,
  Printer,
  Sparkles,
  ShieldCheck,
  Leaf,
  Clock,
  User,
  RotateCcw,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { formatAuditTime } from '../../utils/auditLogger';

/**
 * Duplicate Print Guard Modal
 * Protects institution funds, printer toner, and paper from unnecessary
 * reprints when a supply manifest is 100% identical to the previously printed copy.
 */
export default function DuplicatePrintGuardModal({
  isOpen,
  onClose,
  onConfirmReprint,
  printRecord,
  meal = 'lunch',
  targetDateIST,
}) {
  const { feedback } = useFeedback();

  if (!isOpen || !printRecord) return null;

  const mealName = meal === 'lunch' ? 'Lunch' : 'Breakfast';
  const printedBy = printRecord.printedBy?.displayName || printRecord.printedBy?.email || 'Admin';
  const printedTime = printRecord.printedAt ? formatAuditTime(printRecord.printedAt) : 'Earlier';
  const revision = printRecord.revision || 1;
  const activeCount = printRecord.summary?.activeCount || 0;
  const canceledCount = printRecord.summary?.canceledCount || 0;

  const handleCancel = () => {
    feedback('pop');
    onClose();
  };

  const handleReprint = () => {
    feedback('tick');
    if (onConfirmReprint) {
      onConfirmReprint();
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto"
        onClick={handleCancel}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/10 shadow-2xl p-5 sm:p-7 space-y-5"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <Leaf className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black text-gray-900 dark:text-white">
                    Identical Supply List
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-300/60 dark:border-emerald-700/40">
                    Eco Guard
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Cost & paper waste prevention active
                </p>
              </div>
            </div>

            <button
              onClick={handleCancel}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Core Alert Card */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-900 dark:text-emerald-200">
              <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                {mealName} Manifest (Rev {revision}) was already printed for {targetDateIST}
              </span>
            </div>

            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
              No students have turned their tokens ON or OFF, and zero dietary preferences have changed
              since this sheet was physically printed. Taking another print will produce an{' '}
              <strong className="font-semibold text-emerald-900 dark:text-emerald-100">identical piece of paper</strong>.
            </p>

            {/* Print Meta Grid */}
            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-emerald-200/50 dark:border-emerald-800/30 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300">
                <Clock className="w-3.5 h-3.5 opacity-70" />
                <span>Printed: <strong>{printedTime}</strong></span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-800 dark:text-emerald-300 truncate">
                <User className="w-3.5 h-3.5 opacity-70" />
                <span className="truncate">By: <strong>{printedBy}</strong></span>
              </div>
              <div className="col-span-2 text-emerald-700/80 dark:text-emerald-400/80 text-[10px]">
                Active Preps: {activeCount} Meals • Skipped: {canceledCount} Tokens
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={handleCancel}
              className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all transform active:scale-95"
            >
              <Leaf className="w-4 h-4" />
              <span>Keep Existing Printed Sheet (Recommended)</span>
            </button>

            <button
              type="button"
              onClick={handleReprint}
              className="w-full py-2.5 px-4 rounded-2xl border border-gray-200 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
            >
              <Printer className="w-3.5 h-3.5 text-gray-500" />
              <span>Reprint Duplicate Copy Anyway (Damaged or Lost Paper)</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
