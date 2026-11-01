import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  X,
  Sparkles,
  ShieldCheck,
  Clock,
  Trash2,
  Maximize2,
  RefreshCw,
} from 'lucide-react';
import { optimizeProfilePhoto } from '../../utils/imageOptimizer';
import { submitPhotoRequest } from '../../utils/photoModerationService';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';
import IslamicAvatar from '../ui/IslamicAvatar';

export default function PhotoUploadModal({
  isOpen,
  onClose,
  student,
  onPhotoSubmitted = null,
}) {
  const { feedback } = useFeedback();
  const fileInputRef = useRef(null);

  const [dragActive, setDragActive] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [optimizedResult, setOptimizedResult] = useState(null);
  const [submissionNote, setSubmissionNote] = useState('');
  const [maskShape, setMaskShape] = useState('arch'); // 'arch' | 'circle'

  if (!isOpen || !student) return null;

  const currentPhoto = student.photoURL;
  const pendingPhoto = student.pendingPhotoRequest?.status === 'pending'
    ? student.pendingPhotoRequest.photoURL
    : null;

  const handleFileChange = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      dialog.alert({
        type: 'warning',
        title: 'Unsupported File',
        message: 'Please select a valid image file (JPG, PNG, WebP).',
      });
      return;
    }

    feedback('tick');
    setOptimizing(true);
    try {
      const result = await optimizeProfilePhoto(file, {
        maxWidth: 400,
        maxHeight: 400,
        quality: 0.88,
        cropSquare: true,
      });
      setOptimizedResult(result);
    } catch (err) {
      console.error('Image optimization failed:', err);
      dialog.alert({
        type: 'error',
        title: 'Optimization Error',
        message: err.message || 'Could not process the selected image.',
      });
    } finally {
      setOptimizing(false);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!optimizedResult?.dataUrl) return;

    feedback('pop');
    setSubmitting(true);
    try {
      await submitPhotoRequest({
        student,
        dataUrl: optimizedResult.dataUrl,
        reason: submissionNote,
      });

      dialog.toast.success(
        'Photo Submitted for Approval',
        'Your profile photo has been sent to the Central Committee. It will appear once approved.'
      );

      if (onPhotoSubmitted) {
        onPhotoSubmitted(optimizedResult.dataUrl);
      }
      onClose();
    } catch (err) {
      console.error('Photo submission error:', err);
      dialog.alert({
        type: 'error',
        title: 'Submission Failed',
        message: err.message || 'Could not submit your photo. Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setOptimizedResult(null);
    setSubmissionNote('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <AnimatePresence>
      <div data-lenis-prevent className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            feedback('tick');
            onClose();
          }}
          className="fixed inset-0 bg-black/70 backdrop-blur-md transition-opacity"
        />

        {/* Modal Dialog Card */}
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          transition={{ duration: 0.18 }}
          className="relative w-full max-w-lg rounded-3xl bg-white dark:bg-[#111a17] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden z-10 space-y-5 p-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
                  Student Profile Photo (DP)
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Token #{student.tokenNo} • {student.nameEn || student.name}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                feedback('tick');
                onClose();
              }}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Pending Approval Notice Banner */}
          {pendingPhoto && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-500/30 flex items-start gap-3">
              <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 animate-pulse" />
              <div className="text-xs text-amber-950 dark:text-amber-200">
                <strong className="block font-bold">Existing Photo Submission Under Review</strong>
                <p className="mt-0.5 opacity-90">
                  You already have a photo submission awaiting Central Committee review. Uploading a new photo will replace it.
                </p>
              </div>
            </div>
          )}

          {/* Main Area: Upload Dropzone or Live Cropped Preview */}
          {!optimizedResult ? (
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all ${
                dragActive
                  ? 'border-emerald-500 bg-emerald-500/10 scale-[1.01]'
                  : 'border-gray-300 dark:border-white/15 hover:border-emerald-500/50 bg-gray-50/50 dark:bg-white/[0.02]'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={(e) => handleFileChange(e.target.files?.[0])}
                className="hidden"
              />

              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-3 shadow-inner">
                {optimizing ? (
                  <RefreshCw className="w-6 h-6 animate-spin text-emerald-500" />
                ) : (
                  <Upload className="w-6 h-6" />
                )}
              </div>

              <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                {optimizing ? 'Optimizing image...' : 'Select or Drag & Drop Profile Photo'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-xs mx-auto">
                JPG, PNG, or WebP. Automatically optimized & compressed to under 45 KB.
              </p>

              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-xl bg-white dark:bg-[#1a2622] hover:bg-gray-100 dark:hover:bg-white/10 text-xs font-bold text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-white/10 shadow-xs"
              >
                Browse Files / Camera
              </button>
            </div>
          ) : (
            /* Live Cropped Preview Stage */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 p-4 rounded-3xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10">
                {/* Visual Preview Frame */}
                <div className="relative">
                  <div
                    className={`w-32 h-32 overflow-hidden shadow-xl border-2 border-emerald-500/50 transition-all ${
                      maskShape === 'circle' ? 'rounded-full' : 'rounded-3xl'
                    }`}
                  >
                    <img
                      src={optimizedResult.dataUrl}
                      alt="Cropped Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Mask Style Switcher Pill */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/80 backdrop-blur-md text-[10px] text-white border border-white/20">
                    <button
                      type="button"
                      onClick={() => setMaskShape('arch')}
                      className={`px-1.5 py-0.5 rounded ${maskShape === 'arch' ? 'bg-emerald-500 font-bold' : 'opacity-60'}`}
                    >
                      Arch
                    </button>
                    <button
                      type="button"
                      onClick={() => setMaskShape('circle')}
                      className={`px-1.5 py-0.5 rounded ${maskShape === 'circle' ? 'bg-emerald-500 font-bold' : 'opacity-60'}`}
                    >
                      Round
                    </button>
                  </div>
                </div>

                {/* Compression Telemetry */}
                <div className="space-y-1.5 text-xs text-gray-600 dark:text-gray-300 text-center sm:text-left">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Optimized Successfully</span>
                  </div>
                  <p>Dimensions: <strong>400 × 400 px</strong> (1:1)</p>
                  <p>
                    Size: <strong>{optimizedResult.sizeKb} KB</strong> (from {optimizedResult.originalSizeKb} KB)
                  </p>
                  <p>Format: <span className="font-mono uppercase">{optimizedResult.format.replace('image/', '')}</span></p>

                  <button
                    type="button"
                    onClick={handleReset}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 dark:text-rose-400 hover:underline pt-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Choose Different Photo</span>
                  </button>
                </div>
              </div>

              {/* Optional Submission Note */}
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Optional Note for Central Committee
                </label>
                <input
                  type="text"
                  value={submissionNote}
                  onChange={(e) => setSubmissionNote(e.target.value)}
                  placeholder="e.g. Official academic passport portrait"
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          )}

          {/* Dars Campus Etiquette & Modesty Notice */}
          <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-900 dark:text-emerald-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Campus Dining Etiquette Guideline</span>
            </div>
            <p className="leading-relaxed opacity-90">
              Please submit a clear, respectful portrait in accordance with Dars institutional dress etiquette. Photos require administrative confirmation before appearing publicly on the token board.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                onClose();
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>

            {optimizedResult && (
              <button
                type="button"
                disabled={submitting}
                onClick={handleSubmit}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-extrabold shadow-md shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Submit for Admin Approval</span>
                  </>
                )}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
