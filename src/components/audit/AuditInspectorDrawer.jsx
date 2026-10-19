import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  Clock,
  Laptop,
  Smartphone,
  Tablet,
  Copy,
  Check,
  RotateCcw,
  Code,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import AuditDiffViewer from './AuditDiffViewer';
import { formatAuditTime, logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../../utils/auditLogger';
import { dialog } from '../../utils/dialog';
import firebase from '../../firebase/config';

export default function AuditInspectorDrawer({
  log,
  isOpen,
  onClose,
  onHapticFeedback,
}) {
  const [copiedJson, setCopiedJson] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);
  const [reverting, setReverting] = useState(false);

  if (!isOpen || !log) return null;

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(log, null, 2));
      setCopiedJson(true);
      if (onHapticFeedback) onHapticFeedback('success');
      setTimeout(() => setCopiedJson(false), 2000);
    } catch (_) {}
  };

  /**
   * Determine if this action can be rolled back safely
   */
  const canRollback =
    log.changes &&
    log.changes.before &&
    log.target &&
    (log.action === 'STUDENT_BLOCK' ||
      log.action === 'STUDENT_UNBLOCK' ||
      log.action === 'TOKEN_TOGGLE' ||
      log.action === 'AVOIDER_ADD' ||
      log.action === 'AVOIDER_REMOVE');

  /**
   * Safe Rollback Handler
   */
  const handleRollback = async () => {
    if (!canRollback) return;
    if (onHapticFeedback) onHapticFeedback('warning');

    const confirmed = await dialog.confirm({
      title: 'Rollback Action Confirmation',
      message: `Are you sure you want to revert "${log.action.replace(/_/g, ' ')}" back to its previous state? This will execute a compensating update and record a new audit log.`,
      confirmText: 'Yes, Rollback State',
      cancelText: 'Cancel',
      confirmColor: 'amber',
      icon: 'warning',
    });

    if (!confirmed) return;

    setReverting(true);
    try {
      const db = firebase.firestore();

      // Case 1: Student Block / Unblock Rollback
      if (log.action === 'STUDENT_BLOCK' || log.action === 'STUDENT_UNBLOCK') {
        const studentId = log.target.id;
        const previousBlockState = log.changes.before.block;
        await db.collection('students').doc(studentId).update({
          block: previousBlockState,
        });

        await logAuditEvent({
          category: AUDIT_CATEGORIES.STUDENTS,
          action: previousBlockState ? 'STUDENT_BLOCK' : 'STUDENT_UNBLOCK',
          severity: AUDIT_SEVERITIES.WARNING,
          target: log.target,
          changes: {
            diffSummary: `Rollback: Block status restored to ${previousBlockState}`,
            fieldsChanged: ['block'],
            before: { block: !previousBlockState },
            after: { block: previousBlockState },
          },
          metadata: {
            reason: `Compensating rollback of Audit Event #${log.id}`,
            rollbackOfEventId: log.id,
          },
        });

        dialog.toast.success('Rollback Executed', 'Student block state restored successfully.');
        onClose();
      }

      // Case 2: Individual Token Toggle Rollback
      else if (log.action === 'TOKEN_TOGGLE') {
        const studentId = log.target.id;
        const previousMealStatus = log.changes.before;
        await db.collection('students').doc(studentId).update(previousMealStatus);

        await logAuditEvent({
          category: AUDIT_CATEGORIES.TOKENS,
          action: 'TOKEN_TOGGLE',
          severity: AUDIT_SEVERITIES.NOTICE,
          target: log.target,
          changes: {
            diffSummary: `Rollback: Token restored to previous state`,
            fieldsChanged: Object.keys(previousMealStatus),
            before: log.changes.after,
            after: previousMealStatus,
          },
          metadata: {
            reason: `Compensating rollback of Audit Event #${log.id}`,
            rollbackOfEventId: log.id,
          },
        });

        dialog.toast.success('Rollback Executed', 'Student token status rolled back.');
        onClose();
      } else {
        dialog.toast.info('Notice', 'Automated rollback is only available for supported atomic properties.');
      }
    } catch (err) {
      console.error('Rollback error:', err);
      dialog.alert({
        type: 'error',
        title: 'Rollback Failed',
        message: err.message || 'Could not revert state.',
      });
    } finally {
      setReverting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            if (onHapticFeedback) onHapticFeedback('tick');
            onClose();
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Slide-over Drawer / Bottom Sheet */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="relative z-10 w-full max-w-xl h-full bg-[#f8faf8] dark:bg-[#0c1412] text-gray-900 dark:text-gray-100 shadow-2xl border-l border-gray-200 dark:border-white/10 flex flex-col overflow-hidden pb-safe"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-3 bg-white/70 dark:bg-[#0f1715]/70 backdrop-blur-xl">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg tracking-tight text-gray-900 dark:text-white">
                  Audit Event Inspector
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold uppercase">
                  {log.category}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                ID: {log.id}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (onHapticFeedback) onHapticFeedback('tick');
                onClose();
              }}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
            {/* Action Banner */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#14201c] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
                  {log.action.replace(/_/g, ' ')}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {log.severity}
                </span>
              </div>

              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5 text-gray-400" />
                <span>{formatAuditTime(log.timestamp)}</span>
                <span>•</span>
                <span className="font-mono text-[11px]">{new Date(log.timestamp).toLocaleString()}</span>
              </div>

              {log.metadata?.reason && (
                <div className="mt-2 p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                  <span className="font-bold">Admin Reason / Audit Note: </span>
                  {log.metadata.reason}
                </div>
              )}
            </div>

            {/* Target & Actor Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Actor Card */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#14201c] border border-gray-200/80 dark:border-white/10 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>Actor (Initiator)</span>
                  <Shield className="w-3.5 h-3.5 text-emerald-500" />
                </div>
                <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {log.actor?.displayName || log.actor?.email || 'System'}
                </div>
                <div className="text-xs text-gray-500 font-mono truncate">
                  {log.actor?.email || log.actor?.uid}
                </div>
                <div className="pt-1 flex items-center gap-2 text-[11px] text-gray-400">
                  <span className="capitalize font-semibold">{log.actor?.role}</span>
                  {log.metadata?.deviceType && (
                    <span>• {log.metadata.deviceType}</span>
                  )}
                </div>
              </div>

              {/* Target Card */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#14201c] border border-gray-200/80 dark:border-white/10 space-y-1.5 shadow-sm">
                <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase tracking-wider">
                  <span>Target Entity</span>
                  <FileText className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className="font-bold text-sm text-gray-900 dark:text-white truncate">
                  {log.target?.label || log.target?.id || 'System Entity'}
                </div>
                <div className="text-xs text-gray-500 font-mono truncate">
                  Type: {log.target?.type || 'Record'}
                </div>
                {log.target?.tokenNo && (
                  <div className="pt-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    Token #{log.target.tokenNo}
                  </div>
                )}
              </div>
            </div>

            {/* Visual Diff Delta Section */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                State Changes & Value Deltas
              </h4>
              <div className="p-4 rounded-2xl bg-white dark:bg-[#14201c] border border-gray-200/80 dark:border-white/10 shadow-sm">
                <AuditDiffViewer changes={log.changes} compact={false} />
              </div>
            </div>

            {/* Environmental & Request Metadata */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Environment & Route Context
              </h4>
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#14201c] border border-gray-200/80 dark:border-white/10 text-xs space-y-2 font-mono text-gray-600 dark:text-gray-400 shadow-sm">
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-400">Route:</span>
                  <span className="text-gray-800 dark:text-gray-200">{log.metadata?.route || '/'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-gray-400">Device Form:</span>
                  <span className="text-gray-800 dark:text-gray-200 capitalize">{log.metadata?.deviceType || 'Desktop'}</span>
                </div>
                {log.metadata?.batchCount > 1 && (
                  <div className="flex justify-between">
                    <span className="font-semibold text-gray-400">Batch Rows:</span>
                    <span className="text-emerald-500 font-bold">{log.metadata.batchCount} entities</span>
                  </div>
                )}
              </div>
            </div>

            {/* Raw JSON Inspection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Raw JSON Payload
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                  >
                    {copiedJson ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedJson ? 'Copied' : 'Copy JSON'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowRawJson(!showRawJson)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 underline"
                  >
                    {showRawJson ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>

              {showRawJson && (
                <pre className="p-3 rounded-2xl bg-gray-900 text-emerald-400 text-[11px] font-mono overflow-x-auto max-h-56 shadow-inner border border-emerald-500/20">
                  {JSON.stringify(log, null, 2)}
                </pre>
              )}
            </div>
          </div>

          {/* Footer Actions: Rollback / Close */}
          <div className="p-4 border-t border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-[#0f1715]/80 backdrop-blur-xl flex items-center justify-between gap-3">
            {canRollback ? (
              <button
                type="button"
                disabled={reverting}
                onClick={handleRollback}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${reverting ? 'animate-spin' : ''}`} />
                <span>{reverting ? 'Reverting...' : 'Revert State (Rollback)'}</span>
              </button>
            ) : (
              <span className="text-xs text-gray-400 italic">Immutable Audit Record</span>
            )}

            <button
              type="button"
              onClick={() => {
                if (onHapticFeedback) onHapticFeedback('tick');
                onClose();
              }}
              className="px-5 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
