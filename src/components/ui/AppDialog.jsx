import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, HelpCircle, X } from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';

const DialogContext = createContext(null);

export function DialogProvider({ children }) {
  const [dialogState, setDialogState] = useState(null);
  const { feedback } = useFeedback();

  const closeDialog = useCallback(() => {
    setDialogState(null);
  }, []);

  const showConfirm = useCallback(
    ({
      title,
      message,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmColor = 'emerald', // 'emerald' | 'rose' | 'amber'
      icon = 'question',
      onConfirm,
      onCancel,
    }) => {
      feedback('pop');
      return new Promise((resolve) => {
        setDialogState({
          type: 'confirm',
          title,
          message,
          confirmText,
          cancelText,
          confirmColor,
          icon,
          onConfirm: () => {
            feedback('success');
            closeDialog();
            if (onConfirm) onConfirm();
            resolve(true);
          },
          onCancel: () => {
            feedback('tick');
            closeDialog();
            if (onCancel) onCancel();
            resolve(false);
          },
        });
      });
    },
    [feedback, closeDialog]
  );

  const showAlert = useCallback(
    ({
      title,
      message,
      type = 'success', // 'success' | 'error' | 'warning' | 'info'
      confirmText = 'OK',
      onConfirm,
    }) => {
      feedback(type === 'error' || type === 'warning' ? 'warning' : 'success');
      return new Promise((resolve) => {
        setDialogState({
          type: 'alert',
          title,
          message,
          alertType: type,
          confirmText,
          onConfirm: () => {
            feedback('tick');
            closeDialog();
            if (onConfirm) onConfirm();
            resolve(true);
          },
        });
      });
    },
    [feedback, closeDialog]
  );

  return (
    <DialogContext.Provider value={{ showConfirm, showAlert, closeDialog }}>
      {children}

      <AnimatePresence>
        {dialogState && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={closeDialog}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 12 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-2xl p-6 sm:p-7 space-y-5 text-center relative overflow-hidden backdrop-blur-2xl"
            >
              {/* Close Button */}
              <button
                onClick={closeDialog}
                className="absolute right-4 top-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Icon */}
              <div className="flex justify-center">
                {dialogState.type === 'confirm' ? (
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                      dialogState.confirmColor === 'rose'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 shadow-rose-500/20'
                        : dialogState.confirmColor === 'amber'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 shadow-amber-500/20'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-emerald-500/20'
                    }`}
                  >
                    <HelpCircle className="w-7 h-7" />
                  </div>
                ) : (
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg ${
                      dialogState.alertType === 'error'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 shadow-rose-500/20'
                        : dialogState.alertType === 'warning'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 shadow-amber-500/20'
                        : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-emerald-500/20'
                    }`}
                  >
                    {dialogState.alertType === 'error' ? (
                      <AlertCircle className="w-7 h-7" />
                    ) : dialogState.alertType === 'warning' ? (
                      <AlertTriangle className="w-7 h-7" />
                    ) : (
                      <CheckCircle2 className="w-7 h-7" />
                    )}
                  </div>
                )}
              </div>

              {/* Title & Body */}
              <div className="space-y-1.5">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                  {dialogState.title}
                </h3>
                {dialogState.message && (
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto">
                    {dialogState.message}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-center gap-2.5">
                {dialogState.type === 'confirm' && (
                  <button
                    type="button"
                    onClick={dialogState.onCancel}
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 transition-all active:scale-95"
                  >
                    {dialogState.cancelText}
                  </button>
                )}

                <button
                  type="button"
                  onClick={dialogState.onConfirm}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-95 ${
                    dialogState.confirmColor === 'rose' || dialogState.alertType === 'error'
                      ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-500/25'
                      : dialogState.confirmColor === 'amber' || dialogState.alertType === 'warning'
                      ? 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 shadow-amber-500/25'
                      : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-emerald-500/25'
                  }`}
                >
                  {dialogState.confirmText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </DialogContext.Provider>
  );
}

export function useAppDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useAppDialog must be used within a DialogProvider');
  }
  return context;
}
