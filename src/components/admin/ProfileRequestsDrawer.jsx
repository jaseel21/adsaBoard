import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  Mail,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
  ArrowRight,
  Filter,
} from 'lucide-react';
import {
  subscribePendingProfileRequests,
  approveProfileChangeRequest,
  rejectProfileChangeRequest,
  formatPhoneDisplay,
} from '../../utils/studentProfileRequestService';
import { AuthContext } from '../../store/AuthContext';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';
import { getBatchTheme } from '../../utils/batchTheme';

export default function ProfileRequestsDrawer({ isOpen, onClose }) {
  const { user } = useContext(AuthContext);
  const { feedback } = useFeedback();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // 'all' | 'phone' | 'email' | 'name'
  const [processingId, setProcessingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('Does not meet institutional verification guidelines');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const unsub = subscribePendingProfileRequests((list) => {
      setRequests(list);
      setLoading(false);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredRequests = requests.filter((r) => {
    if (filterType === 'all') return true;
    return r.type === filterType;
  });

  const handleApprove = async (req) => {
    feedback('pop');
    setProcessingId(req.id);
    try {
      await approveProfileChangeRequest({
        requestId: req.id,
        studentId: req.studentId,
        type: req.type,
        requestedValue: req.requestedValue,
        tokenNo: req.tokenNo,
        studentName: req.studentName,
        adminEmail: user?.email || 'admin',
      });
      dialog.toast.success(
        'Request Approved',
        `Token #${req.tokenNo} ${req.type} update has been applied.`
      );
    } catch (err) {
      console.error('Approve profile request error:', err);
      dialog.alert({ type: 'error', title: 'Approval Failed', message: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req) => {
    feedback('tick');
    setProcessingId(req.id);
    try {
      await rejectProfileChangeRequest({
        requestId: req.id,
        studentId: req.studentId,
        type: req.type,
        reason: rejectReason,
        tokenNo: req.tokenNo,
        studentName: req.studentName,
        adminEmail: user?.email || 'admin',
      });
      dialog.toast.info(
        'Request Rejected',
        `Token #${req.tokenNo} ${req.type} change was rejected.`
      );
      setRejectingId(null);
    } catch (err) {
      console.error('Reject profile request error:', err);
      dialog.alert({ type: 'error', title: 'Rejection Failed', message: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent
        className="fixed inset-0 z-50 flex items-stretch justify-end overflow-hidden"
      >
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            feedback('tick');
            onClose();
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        />

        {/* Slide-over Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-lg bg-white dark:bg-[#0c1412] border-l border-gray-200/80 dark:border-white/10 shadow-2xl flex flex-col z-10 h-full overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-gray-900 dark:text-white">
                    Contact & Name Requests
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-mono font-black bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                    {requests.length}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Central Committee verification queue for student credentials
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                feedback('tick');
                onClose();
              }}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Pills */}
          <div className="px-5 py-3 border-b border-gray-100 dark:border-white/5 flex items-center gap-1.5 overflow-x-auto">
            {['all', 'phone', 'email', 'name'].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => {
                  feedback('tick');
                  setFilterType(f);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all capitalize whitespace-nowrap ${
                  filterType === f
                    ? 'bg-emerald-500 text-white shadow-xs'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10'
                }`}
              >
                {f === 'all' ? `All Requests (${requests.length})` : f}
              </button>
            ))}
          </div>

          {/* Content List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {loading ? (
              <div className="py-20 flex flex-col items-center justify-center text-gray-400">
                <RefreshCw className="w-8 h-8 animate-spin mb-3 text-emerald-500" />
                <span className="text-xs font-semibold">Loading requests...</span>
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="py-24 text-center space-y-2">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  Queue Clean & Clear
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                  No pending student profile change requests requiring Central Committee approval.
                </p>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const batchTheme = getBatchTheme(req.batch);
                const isProcessing = processingId === req.id;
                const isRejecting = rejectingId === req.id;

                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-white dark:bg-[#13201d] border border-gray-200/80 dark:border-white/10 shadow-xs space-y-3"
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg ${batchTheme.bg} ${batchTheme.text} border ${batchTheme.border}`}>
                          #{req.tokenNo}
                        </span>
                        <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                          {req.studentName}
                        </h4>
                      </div>

                      <span className="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                        {req.type === 'phone' ? (
                          <Phone className="w-3 h-3 text-amber-500" />
                        ) : req.type === 'email' ? (
                          <Mail className="w-3 h-3 text-teal-500" />
                        ) : (
                          <User className="w-3 h-3 text-indigo-500" />
                        )}
                        <span>{req.type}</span>
                      </span>
                    </div>

                    {/* Diff comparison box */}
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 space-y-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] uppercase font-bold text-gray-400 block mb-0.5">
                            Current
                          </span>
                          <span className="font-mono text-gray-500 line-through truncate block">
                            {req.type === 'name'
                              ? `${req.currentValue?.nameEn || 'None'} ${req.currentValue?.nameMl ? `(${req.currentValue.nameMl})` : ''}`
                              : req.currentValue || 'None'}
                          </span>
                        </div>

                        <ArrowRight className="w-4 h-4 text-emerald-500 shrink-0" />

                        <div className="flex-1 min-w-0">
                          <span className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 block mb-0.5">
                            Proposed
                          </span>
                          <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300 truncate block">
                            {req.type === 'name'
                              ? `${req.requestedValue?.nameEn || ''} ${req.requestedValue?.nameMl ? `(${req.requestedValue.nameMl})` : ''}`
                              : req.requestedValue}
                          </span>
                        </div>
                      </div>

                      {req.reason && (
                        <div className="pt-2 border-t border-gray-200/60 dark:border-white/5 text-[11px] text-gray-500 dark:text-gray-400">
                          <span className="font-semibold text-gray-700 dark:text-gray-300">Reason: </span>
                          <span className="capitalize">{req.reason.replace(/_/g, ' ')}</span>
                          {req.notes && (
                            <p className="mt-0.5 italic text-gray-600 dark:text-gray-400">
                              &ldquo;{req.notes}&rdquo;
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Rejection input area if selected */}
                    {isRejecting && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2 text-xs">
                        <label className="block text-[11px] font-bold text-rose-800 dark:text-rose-300">
                          Rejection Reason:
                        </label>
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="e.g. Unverified number, please contact office"
                          className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-[#13201d] border border-rose-300 dark:border-rose-500/30 text-gray-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                        />
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setRejectingId(null)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReject(req)}
                            disabled={isProcessing}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-rose-600 text-white hover:bg-rose-700 shadow-xs"
                          >
                            Confirm Rejection
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Action buttons */}
                    {!isRejecting && (
                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            feedback('tick');
                            setRejectingId(req.id);
                          }}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-500/20 transition-all active:scale-95"
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApprove(req)}
                          disabled={isProcessing}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-60"
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          <span>Approve & Apply</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
