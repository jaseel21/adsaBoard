import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  HelpCircle,
  X,
  Lock,
  Unlock,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const DialogContext = createContext(null);

// Single Toast Item with auto-countdown progress and hover-to-pause
function ToastItem({ toast, onDismiss }) {
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(100);
  const startTimeRef = useRef(Date.now());
  const remainingTimeRef = useRef(toast.duration || 3000);
  const totalDuration = toast.duration || 3000;

  useEffect(() => {
    let rafId;

    const tick = () => {
      if (!isPaused) {
        const elapsed = Date.now() - startTimeRef.current;
        const currentRemaining = Math.max(0, remainingTimeRef.current - elapsed);
        const percent = (currentRemaining / totalDuration) * 100;
        setProgress(percent);

        if (currentRemaining <= 0) {
          onDismiss(toast.id);
          return;
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    startTimeRef.current = Date.now();
    rafId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(rafId);
  }, [isPaused, onDismiss, toast.id, totalDuration]);

  const handleMouseEnter = () => {
    const elapsed = Date.now() - startTimeRef.current;
    remainingTimeRef.current = Math.max(0, remainingTimeRef.current - elapsed);
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    startTimeRef.current = Date.now();
    setIsPaused(false);
  };

  const typeConfig = {
    success: {
      icon: CheckCircle2,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      iconBg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-500/30 shadow-emerald-500/20',
      progressBar: 'bg-gradient-to-r from-emerald-500 to-teal-400',
      glow: 'shadow-emerald-500/10',
    },
    error: {
      icon: AlertCircle,
      iconColor: 'text-rose-500 dark:text-rose-400',
      iconBg: 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-500/30 shadow-rose-500/20',
      progressBar: 'bg-gradient-to-r from-rose-500 to-red-400',
      glow: 'shadow-rose-500/10',
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-amber-500 dark:text-amber-400',
      iconBg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-500/30 shadow-amber-500/20',
      progressBar: 'bg-gradient-to-r from-amber-500 to-yellow-400',
      glow: 'shadow-amber-500/10',
    },
    info: {
      icon: Info,
      iconColor: 'text-sky-500 dark:text-sky-400',
      iconBg: 'bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-500/30 shadow-sky-500/20',
      progressBar: 'bg-gradient-to-r from-sky-500 to-blue-400',
      glow: 'shadow-sky-500/10',
    },
  };

  const cfg = typeConfig[toast.type] || typeConfig.success;
  const IconComponent = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -16, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.92, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', stiffness: 450, damping: 30 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`pointer-events-auto w-full max-w-sm sm:max-w-md rounded-2xl bg-white/95 dark:bg-[#0f1715]/95 border border-gray-200/90 dark:border-white/10 shadow-2xl ${cfg.glow} backdrop-blur-2xl p-4 flex items-start gap-3.5 relative overflow-hidden transition-all duration-200`}
    >
      {/* Icon Badge */}
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border shadow-sm ${cfg.iconBg}`}
      >
        <IconComponent className={`w-5 h-5 ${cfg.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pr-4 space-y-0.5">
        <h4 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-tight">
          {toast.title}
        </h4>
        {toast.message && (
          <p className="text-xs text-gray-500 dark:text-gray-400 leading-snug break-words">
            {toast.message}
          </p>
        )}
      </div>

      {/* Close Button */}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Bottom Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-100 dark:bg-white/5 overflow-hidden">
        <div
          className={`h-full ${cfg.progressBar} transition-all duration-75`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </motion.div>
  );
}

export function DialogProvider({ children }) {
  const [dialogState, setDialogState] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [promptInput, setPromptInput] = useState('');
  const promptInputRef = useRef(null);
  const { feedback } = useFeedback();

  const closeDialog = useCallback(() => {
    setDialogState(null);
    setPromptInput('');
  }, []);

  const modalTrapRef = useFocusTrap({
    active: Boolean(dialogState),
    onClose: closeDialog,
    initialFocusRef: dialogState?.type === 'prompt' ? promptInputRef : null,
    restoreFocus: true,
  });

  // Dismiss a specific toast
  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Show Toast
  const showToast = useCallback(
    ({ title, message, type = 'success', duration = 3000 }) => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 6);
      feedback(type === 'error' || type === 'warning' ? 'warning' : 'success');
      setToasts((prev) => [
        ...prev.slice(-3), // keep maximum 4 toasts stacked
        { id, title, message, type, duration },
      ]);
      return id;
    },
    [feedback]
  );

  // Show Confirm Modal
  const showConfirm = useCallback(
    ({
      title,
      message,
      confirmText = 'Confirm',
      cancelText = 'Cancel',
      confirmColor = 'emerald', // 'emerald' | 'rose' | 'amber' | 'sky'
      icon = 'question', // 'question' | 'unlock' | 'lock' | 'trash' | 'warning'
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

  // Show Alert Modal
  const showAlert = useCallback(
    ({
      title,
      message,
      type = 'info', // 'success' | 'error' | 'warning' | 'info'
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

  // Show Prompt Modal (Text / input prompt)
  const showPrompt = useCallback(
    ({
      title,
      message,
      placeholder = '',
      defaultValue = '',
      confirmText = 'Submit',
      cancelText = 'Cancel',
      confirmColor = 'emerald',
      inputType = 'text',
      options = null,
      onConfirm,
      onCancel,
    }) => {
      feedback('pop');
      // If options is provided and no defaultValue, select first option
      const initialVal =
        defaultValue ||
        (options
          ? Array.isArray(options)
            ? options[0]?.value || ''
            : Object.keys(options)[0] || ''
          : '');
      setPromptInput(initialVal);
      return new Promise((resolve) => {
        setDialogState({
          type: 'prompt',
          title,
          message,
          placeholder,
          defaultValue: initialVal,
          confirmText,
          cancelText,
          confirmColor,
          inputType,
          options,
          resolvePrompt: (value) => {
            feedback('success');
            closeDialog();
            if (onConfirm) onConfirm(value);
            resolve(value);
          },
          rejectPrompt: () => {
            feedback('tick');
            closeDialog();
            if (onCancel) onCancel();
            resolve(null);
          },
        });
      });
    },
    [feedback, closeDialog]
  );

  // Register singleton manager
  useEffect(() => {
    dialog.register({
      showConfirm,
      showAlert,
      showPrompt,
      showToast,
      closeDialog,
    });
    return () => dialog.unregister();
  }, [showConfirm, showAlert, showPrompt, showToast, closeDialog]);

  // Focus prompt input when open
  useEffect(() => {
    if (dialogState?.type === 'prompt' && promptInputRef.current) {
      setTimeout(() => {
        promptInputRef.current?.focus();
        promptInputRef.current?.select();
      }, 50);
    }
  }, [dialogState?.type]);

  // Global Keyboard listener: Escape to cancel, Enter to confirm (when modal active)
  useEffect(() => {
    if (!dialogState) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (dialogState.type === 'confirm' && dialogState.onCancel) {
          dialogState.onCancel();
        } else if (dialogState.type === 'prompt' && dialogState.rejectPrompt) {
          dialogState.rejectPrompt();
        } else if (dialogState.type === 'alert' && dialogState.onConfirm) {
          dialogState.onConfirm();
        } else {
          closeDialog();
        }
      } else if (e.key === 'Enter') {
        // If user is inside a textarea in prompt, don't submit on enter
        if (dialogState.type === 'prompt' && e.target?.tagName === 'TEXTAREA') {
          return;
        }
        e.preventDefault();
        if (dialogState.type === 'confirm' && dialogState.onConfirm) {
          dialogState.onConfirm();
        } else if (dialogState.type === 'prompt' && dialogState.resolvePrompt) {
          dialogState.resolvePrompt(promptInput);
        } else if (dialogState.type === 'alert' && dialogState.onConfirm) {
          dialogState.onConfirm();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dialogState, promptInput, closeDialog]);

  // Helper to get modal icon component
  const renderModalIcon = () => {
    if (!dialogState) return null;

    if (dialogState.type === 'confirm') {
      const color = dialogState.confirmColor || 'emerald';
      const iconType = dialogState.icon;

      let Icon = HelpCircle;
      if (iconType === 'unlock') Icon = Unlock;
      else if (iconType === 'lock') Icon = Lock;
      else if (iconType === 'trash' || color === 'rose') Icon = Trash2;
      else if (iconType === 'warning' || color === 'amber') Icon = AlertTriangle;

      const colorMap = {
        rose: 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 shadow-rose-500/20',
        amber: 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 shadow-amber-500/20',
        sky: 'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/30 shadow-sky-500/20',
        emerald: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 shadow-emerald-500/20',
      };

      return (
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${
            colorMap[color] || colorMap.emerald
          }`}
        >
          <Icon className="w-7 h-7" />
        </div>
      );
    }

    if (dialogState.type === 'prompt') {
      const color = dialogState.confirmColor || 'emerald';
      return (
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${
            color === 'rose'
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 shadow-rose-500/20'
              : color === 'amber'
              ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 shadow-amber-500/20'
              : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 shadow-emerald-500/20'
          }`}
        >
          <ArrowRight className="w-7 h-7" />
        </div>
      );
    }

    // Alert Modal
    const alertType = dialogState.alertType || 'info';
    let Icon = CheckCircle2;
    let badgeClass =
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 shadow-emerald-500/20';

    if (alertType === 'error') {
      Icon = AlertCircle;
      badgeClass =
        'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/30 shadow-rose-500/20';
    } else if (alertType === 'warning') {
      Icon = AlertTriangle;
      badgeClass =
        'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 shadow-amber-500/20';
    } else if (alertType === 'info') {
      Icon = Info;
      badgeClass =
        'bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-500/30 shadow-sky-500/20';
    }

    return (
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg ${badgeClass}`}>
        <Icon className="w-7 h-7" />
      </div>
    );
  };

  // Helper for confirm button styling
  const getConfirmButtonClass = (color) => {
    switch (color) {
      case 'rose':
        return 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700 shadow-rose-500/25';
      case 'amber':
        return 'bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700 shadow-amber-500/25';
      case 'sky':
        return 'bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 shadow-sky-500/25';
      case 'emerald':
      default:
        return 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-emerald-500/25';
    }
  };

  return (
    <DialogContext.Provider
      value={{
        showConfirm,
        showAlert,
        showPrompt,
        showToast,
        closeDialog,
        toast: {
          success: (title, msg, dur) => showToast({ title, message: msg, type: 'success', duration: dur }),
          error: (title, msg, dur) => showToast({ title, message: msg, type: 'error', duration: dur }),
          warning: (title, msg, dur) => showToast({ title, message: msg, type: 'warning', duration: dur }),
          info: (title, msg, dur) => showToast({ title, message: msg, type: 'info', duration: dur }),
        },
      }}
    >
      {children}

      {typeof document !== 'undefined' &&
        createPortal(
          <>
            {/* Floating Toast Notification Container (Top Right on desktop, Top Center on mobile) */}
      <div className="fixed top-4 sm:top-5 right-0 sm:right-5 left-0 sm:left-auto z-[100] flex flex-col items-center sm:items-end gap-2.5 pointer-events-none px-4 sm:px-0">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>

      {/* Glassmorphic Modal Layer (Confirm / Alert / Prompt) */}
      <AnimatePresence>
        {dialogState && (
          <div
            data-lenis-prevent
            className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/60 backdrop-blur-md overscroll-contain"
            onClick={closeDialog}
          >
            <motion.div
              ref={modalTrapRef}
              role="dialog"
              aria-modal="true"
              aria-labelledby="app-dialog-title"
              aria-describedby={dialogState.message ? "app-dialog-message" : undefined}
              initial={{ opacity: 0, scale: 0.92, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 14 }}
              transition={{ type: 'spring', stiffness: 450, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              data-lenis-prevent
              className="w-full max-w-md rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-[#0f1715]/95 border border-gray-200/90 dark:border-white/10 shadow-2xl p-5 xs:p-6 sm:p-7 space-y-4 sm:space-y-5 text-center relative overflow-hidden backdrop-blur-2xl max-h-[90dvh] overflow-y-auto pb-safe overscroll-contain"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={closeDialog}
                aria-label="Close dialog"
                className="absolute right-4 top-4 p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors focus:ring-2 focus:ring-emerald-500/50 outline-none"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Ambient Glow & Icon */}
              <div className="flex justify-center pt-1">{renderModalIcon()}</div>

              {/* Title & Body */}
              <div className="space-y-2">
                <h3
                  id="app-dialog-title"
                  className="text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-white leading-snug"
                >
                  {dialogState.title}
                </h3>
                {dialogState.message && (
                  <p
                    id="app-dialog-message"
                    className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-sm mx-auto"
                  >
                    {dialogState.message}
                  </p>
                )}
              </div>

              {/* Prompt Input Field (If Prompt Modal) */}
              {dialogState.type === 'prompt' && (
                <div className="pt-1 text-left">
                  {dialogState.options ? (
                    <select
                      ref={promptInputRef}
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-gray-50 dark:bg-[#14201c] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs sm:text-sm shadow-inner"
                    >
                      {dialogState.placeholder && (
                        <option value="" disabled>
                          {dialogState.placeholder}
                        </option>
                      )}
                      {Array.isArray(dialogState.options)
                        ? dialogState.options.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))
                        : Object.entries(dialogState.options).map(([val, label]) => (
                            <option key={val} value={val}>
                              {label}
                            </option>
                          ))}
                    </select>
                  ) : (
                    <input
                      ref={promptInputRef}
                      type={dialogState.inputType || 'text'}
                      value={promptInput}
                      onChange={(e) => setPromptInput(e.target.value)}
                      placeholder={dialogState.placeholder}
                      className="w-full py-2.5 px-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 text-xs sm:text-sm shadow-inner"
                    />
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-center gap-2.5">
                {(dialogState.type === 'confirm' || dialogState.type === 'prompt') && (
                  <button
                    type="button"
                    onClick={
                      dialogState.type === 'confirm'
                        ? dialogState.onCancel
                        : dialogState.rejectPrompt
                    }
                    className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 transition-all active:scale-95"
                  >
                    {dialogState.cancelText || 'Cancel'}
                  </button>
                )}

                <button
                  type="button"
                  onClick={
                    dialogState.type === 'confirm'
                      ? dialogState.onConfirm
                      : dialogState.type === 'prompt'
                      ? () => dialogState.resolvePrompt(promptInput)
                      : dialogState.onConfirm
                  }
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-95 ${getConfirmButtonClass(
                    dialogState.confirmColor || (dialogState.alertType === 'error' ? 'rose' : dialogState.alertType === 'warning' ? 'amber' : 'emerald')
                  )}`}
                >
                  {dialogState.confirmText || 'OK'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
          </>,
          document.body
        )}
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
