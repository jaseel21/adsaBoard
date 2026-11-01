import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Eye,
  RefreshCw,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react';
import {
  subscribePendingPhotoRequests,
  approvePhotoRequest,
  rejectPhotoRequest,
  PHOTO_REJECTION_REASONS,
} from '../../utils/photoModerationService';
import { AuthContext } from '../../store/AuthContext';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';
import { getBatchTheme } from '../../utils/batchTheme';
import IslamicAvatar from '../ui/IslamicAvatar';

export default function PhotoModerationDrawer({
  isOpen,
  onClose,
}) {
  const { user } = useContext(AuthContext);
  const { feedback } = useFeedback();

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState(PHOTO_REJECTION_REASONS[0].labelEn);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    const unsub = subscribePendingPhotoRequests((list) => {
      setRequests(list);
      setLoading(false);
    });
    return () => unsub();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApprove = async (req) => {
    feedback('pop');
    setProcessingId(req.id);
    try {
      await approvePhotoRequest({
        requestId: req.id,
        studentId: req.studentId,
        photoURL: req.photoURL,
        tokenNo: req.tokenNo,
        studentName: req.studentName,
        adminEmail: user?.email || 'admin',
      });
      dialog.toast.success(
        'Photo Approved',
        `Token ${req.tokenNo} profile photo is now active.`
      );
    } catch (err) {
      console.error('Approve photo error:', err);
      dialog.alert({ type: 'error', title: 'Approval Failed', message: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (req) => {
    feedback('tick');
    setProcessingId(req.id);
    try {
      await rejectPhotoRequest({
        requestId: req.id,
        studentId: req.studentId,
        reason: rejectReason,
        tokenNo: req.tokenNo,
        studentName: req.studentName,
        adminEmail: user?.email || 'admin',
      });
      dialog.toast.info(
        'Photo Rejected',
        `Token ${req.tokenNo} photo submission was rejected.`
      );
      setRejectingId(null);
    } catch (err) {
      console.error('Reject photo error:', err);
      dialog.alert({ type: 'error', title: 'Rejection Failed', message: err.message });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <AnimatePresence>
      <div data-lenis-prevent className="fixed inset-0 z-50 overflow-hidden">
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
        <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            className="w-screen max-w-md bg-white dark:bg-[#0c1411] border-l border-gray-200 dark:border-white/10 shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>Photo Moderation Queue</span>
                    {requests.length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-white">
                        {requests.length}
                      </span>
                    )}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Review and confirm student profile picture submissions
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  onClose();
                }}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {loading ? (
                <div className="py-12 text-center text-xs text-gray-400">
                  <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-500" />
                  Loading moderation requests...
                </div>
              ) : requests.length === 0 ? (
                <div className="py-16 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                    Queue is Clear
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    All student profile photo submissions have been reviewed and approved.
                  </p>
                </div>
              ) : (
                requests.map((req) => {
                  const isProcessing = processingId === req.id;
                  const isRejecting = rejectingId === req.id;

                  return (
                    <motion.div
                      key={req.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-3xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 shadow-xs space-y-3"
                    >
                      {/* Student Info Bar */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`font-mono font-black text-xs px-2 py-0.5 rounded-lg ${getBatchTheme(req.batch).bg} ${getBatchTheme(req.batch).text} border ${getBatchTheme(req.batch).border}`}>
                            {req.tokenNo}
                          </span>
                          <span className="font-bold text-sm text-gray-900 dark:text-white">
                            {req.studentName}
                          </span>
                        </div>
                        {req.batch && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${getBatchTheme(req.batch).bg} ${getBatchTheme(req.batch).text} border ${getBatchTheme(req.batch).border}`}>
                            {req.batch}
                          </span>
                        )}
                      </div>

                      {/* Photo Comparison Frame */}
                      <div className="flex items-center justify-center gap-4 py-2">
                        {/* Current Batch-colored Token Keycap */}
                        <div className="text-center space-y-1">
                          <IslamicAvatar student={{ tokenNo: req.tokenNo, nameEn: req.studentName, batch: req.batch }} size={72} animate={false} />
                          <span className="block text-[10px] text-gray-400 font-medium">Token Keycap</span>
                        </div>

                        {/* Arrow */}
                        <div className="text-gray-300 dark:text-gray-600">➔</div>

                        {/* Submitted Photo */}
                        <div className="text-center space-y-1">
                          <div className="w-[72px] h-[72px] rounded-2xl overflow-hidden border-2 border-amber-500/60 shadow-md">
                            <img
                              src={req.photoURL}
                              alt="Submitted"
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <span className="block text-[10px] text-amber-600 dark:text-amber-400 font-bold">New Photo</span>
                        </div>
                      </div>

                      {req.submissionNote && (
                        <p className="text-[11px] italic text-gray-500 dark:text-gray-400 bg-white/70 dark:bg-black/30 p-2 rounded-xl border border-gray-200/60 dark:border-white/5">
                          Note: &ldquo;{req.submissionNote}&rdquo;
                        </p>
                      )}

                      {/* Rejection Reasons Sub-form */}
                      {isRejecting ? (
                        <div className="p-3 rounded-2xl bg-rose-50/80 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/30 space-y-2">
                          <label className="block text-[11px] font-bold text-rose-900 dark:text-rose-200">
                            Select Reason for Rejection:
                          </label>
                          <select
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl bg-white dark:bg-black/40 border border-rose-300 dark:border-rose-500/40 text-xs text-gray-900 dark:text-white"
                          >
                            {PHOTO_REJECTION_REASONS.map((r) => (
                              <option key={r.id} value={r.labelEn}>
                                {r.labelEn}
                              </option>
                            ))}
                          </select>

                          <div className="flex items-center justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setRejectingId(null)}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-gray-500 hover:text-gray-700"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => handleReject(req)}
                              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
                            >
                              Confirm Rejection
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* Action Buttons */
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => handleApprove(req)}
                            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Approve Photo</span>
                          </button>

                          <button
                            type="button"
                            disabled={isProcessing}
                            onClick={() => {
                              feedback('tick');
                              setRejectingId(req.id);
                            }}
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gray-100 hover:bg-rose-50 dark:bg-white/5 dark:hover:bg-rose-950/30 text-gray-700 hover:text-rose-600 dark:text-gray-300 dark:hover:text-rose-400 text-xs font-bold transition-all border border-gray-200 dark:border-white/10"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  );
}
