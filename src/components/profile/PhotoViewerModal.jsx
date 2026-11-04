import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, Trash2, CheckCircle2, Clock, ShieldCheck, Download, Sparkles } from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { getBatchTheme } from '../../utils/batchTheme';

export default function PhotoViewerModal({
  isOpen,
  onClose,
  student,
  onOpenUploadModal,
  onRemovePhoto,
}) {
  const { language } = useLanguage();
  const { feedback } = useFeedback();

  if (!isOpen || !student) return null;

  const photoURL =
    student.pendingPhotoRequest?.status === 'pending'
      ? student.pendingPhotoRequest.photoURL
      : student.photoURL;

  const isPending = student.pendingPhotoRequest?.status === 'pending';
  const batchTheme = getBatchTheme(student.batch);

  return (
    <AnimatePresence>
      <div
        data-lenis-prevent
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto overscroll-contain"
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
          className="fixed inset-0 bg-black/80 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 16 }}
          transition={{ type: 'spring', damping: 26, stiffness: 280 }}
          className="relative w-full max-w-sm sm:max-w-md bg-white dark:bg-[#0c1412] rounded-3xl border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden z-10 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02]">
            <div className="flex items-center gap-2.5">
              <span className={`font-mono font-black text-xs px-2.5 py-0.5 rounded-lg ${batchTheme.bg} ${batchTheme.text} border ${batchTheme.border}`}>
                #{student.tokenNo}
              </span>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 dark:text-white truncate max-w-[200px]">
                  {student.nameEn || student.name || `Token #${student.tokenNo}`}
                </h3>
                {student.nameMl && (
                  <p className="text-[11px] font-malayalam text-gray-500 dark:text-gray-400 truncate">
                    {student.nameMl}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                feedback('tick');
                onClose();
              }}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Photo Canvas */}
          <div className="relative p-6 flex flex-col items-center justify-center bg-radial from-emerald-500/5 via-transparent to-transparent">
            {photoURL ? (
              <div className="relative group max-w-[280px] sm:max-w-[320px] aspect-square rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-2xl shadow-emerald-500/10">
                <img
                  src={photoURL}
                  alt={student.nameEn || student.name}
                  className="w-full h-full object-cover select-none"
                />

                {isPending && (
                  <div className="absolute inset-x-0 bottom-0 py-2 px-3 bg-amber-500/95 backdrop-blur-sm text-white text-xs font-bold text-center flex items-center justify-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 animate-spin" />
                    <span>{language === 'ml' ? 'കമ്മിറ്റി പരിശോധനയിൽ (Pending)' : 'Under Committee Review'}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-48 h-48 rounded-2xl bg-gray-100 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 flex flex-col items-center justify-center text-gray-400">
                <Camera className="w-10 h-10 mb-2 opacity-50" />
                <span className="text-xs font-semibold">No Photo Uploaded</span>
              </div>
            )}

            {/* Status Information */}
            <div className="mt-4 flex items-center gap-2">
              {student.photoURL && !isPending && (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{language === 'ml' ? 'അംഗീകരിച്ച ഔദ്യോഗിക ചിത്രം' : 'Official Approved Portrait'}</span>
                </span>
              )}
            </div>
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.02] flex items-center justify-between gap-3">
            {student.photoURL && onRemovePhoto && (
              <button
                type="button"
                onClick={() => {
                  feedback('pop');
                  onRemovePhoto();
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-500/20 transition-all active:scale-95"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{language === 'ml' ? 'ചിത്രം ഒഴിവാക്കുക' : 'Remove Photo'}</span>
              </button>
            )}

            {onOpenUploadModal && (
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  onClose();
                  onOpenUploadModal();
                }}
                className="ml-auto inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {student.photoURL
                    ? language === 'ml'
                      ? 'ചിത്രം മാറ്റുക'
                      : 'Change Photo'
                    : language === 'ml'
                    ? 'ചിത്രം ചേർക്കുക'
                    : 'Upload Photo'}
                </span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
