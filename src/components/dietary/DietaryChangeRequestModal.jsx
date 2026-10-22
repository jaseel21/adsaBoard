import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  X,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Check,
  Send,
  Trash2,
  AlertTriangle,
  Info,
  HeartHandshake,
  Drumstick,
  Fish,
  Egg,
  Coffee,
  Apple,
  Leaf,
  UtensilsCrossed,
  Utensils,
} from 'lucide-react';
import { dialog } from '../../utils/dialog';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import {
  REASON_CATEGORIES,
  computeDietaryChanges,
  submitDietaryChangeRequest,
  cancelDietaryChangeRequest,
} from '../../utils/dietaryRequestService';

const ICON_MAP = {
  Utensils,
  UtensilsCrossed,
  Drumstick,
  Fish,
  Egg,
  Apple,
  Coffee,
  Leaf,
};

const getCategoryIcon = (iconName, className = 'w-4 h-4') => {
  const IconComp = ICON_MAP[iconName] || Utensils;
  return <IconComp className={className} />;
};

export default function DietaryChangeRequestModal({
  isOpen,
  onClose,
  student,
  currentDietary = {},
  preferencesList = [],
  pendingRequest = null,
  onSuccess,
}) {
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();

  // Working state for requested preferences
  const [draftDietary, setDraftDietary] = useState({});
  const [reasonCategory, setReasonCategory] = useState('allergy');
  const [reasonText, setReasonText] = useState('');
  const [urgency, setUrgency] = useState('normal');
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Initialize form when modal opens or pendingRequest changes
  useEffect(() => {
    if (isOpen) {
      if (pendingRequest && pendingRequest.requestedDietary) {
        setDraftDietary({ ...pendingRequest.requestedDietary });
        setReasonCategory(pendingRequest.reasonCategory || 'allergy');
        setReasonText(pendingRequest.reasonText || '');
        setUrgency(pendingRequest.urgency || 'normal');
      } else {
        // Default draft to current dietary settings
        const initial = {};
        preferencesList.forEach((pref) => {
          const val =
            currentDietary[pref.id] !== false &&
            currentDietary[pref.id.toLowerCase()] !== false;
          initial[pref.id] = val;
        });
        setDraftDietary(initial);
        setReasonCategory('allergy');
        setReasonText('');
        setUrgency('normal');
      }
    }
  }, [isOpen, pendingRequest, currentDietary, preferencesList]);

  // Compute live change delta
  const changes = useMemo(() => {
    return computeDietaryChanges(currentDietary, draftDietary, preferencesList);
  }, [currentDietary, draftDietary, preferencesList]);

  if (!isOpen) return null;

  const handleTogglePref = (prefId) => {
    feedback('pop');
    setDraftDietary((prev) => {
      const currentVal = prev[prefId] !== false;
      return {
        ...prev,
        [prefId]: !currentVal,
      };
    });
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (changes.length === 0) {
      dialog.toast.warning(
        t('noDietaryChangesSelected', 'No Changes Selected'),
        t('noDietaryChangesDesc', 'Please modify at least one dietary preference to submit a request.')
      );
      feedback('warning');
      return;
    }

    setSubmitting(true);
    feedback('tick');

    try {
      await submitDietaryChangeRequest({
        student,
        currentDietary,
        requestedDietary: draftDietary,
        preferencesList,
        reasonCategory,
        reasonText,
        urgency,
      });

      dialog.toast.success(
        t('requestSubmitted', 'Request Submitted'),
        t('requestSubmittedDesc', 'Your dietary change request has been sent to the Canteen Committee.')
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error submitting dietary change request:', err);
      dialog.toast.error(
        t('submissionFailed', 'Submission Failed'),
        err.message || 'Could not submit request.'
      );
      feedback('error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!pendingRequest?.id) return;

    const confirmed = await dialog.confirm({
      title: t('withdrawRequestTitle', 'Withdraw Dietary Request?'),
      message: t('withdrawRequestConfirm', 'Are you sure you want to cancel this pending request? The Canteen Committee will not process it.'),
      confirmText: t('withdrawConfirm', 'Yes, Withdraw'),
      cancelText: t('cancel', 'Keep Request'),
      isDestructive: true,
    });

    if (!confirmed) return;

    setCancelling(true);
    feedback('tick');

    try {
      await cancelDietaryChangeRequest(
        pendingRequest.id,
        student.documentId || student.id,
        student.tokenNo
      );

      dialog.toast.info(
        t('requestCancelled', 'Request Withdrawn'),
        t('requestCancelledDesc', 'Your pending dietary change request has been cancelled.')
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Error cancelling dietary request:', err);
      dialog.toast.error('Withdrawal Failed', err.message);
      feedback('error');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 340 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/90 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col my-auto max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-800 text-white relative">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-emerald-200" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider font-extrabold text-emerald-200 bg-white/10 px-2 py-0.5 rounded-md">
                      {t('tokenNumber', 'Token')} #{student?.tokenNo}
                    </span>
                    {pendingRequest && (
                      <span className="text-[11px] font-black uppercase tracking-wide px-2 py-0.5 rounded-md bg-amber-400 text-amber-950 flex items-center gap-1 animate-pulse">
                        <Clock className="w-3 h-3" />
                        {t('pendingApproval', 'Pending Review')}
                      </span>
                    )}
                  </div>
                  <h2 className="text-lg sm:text-xl font-black text-white mt-1">
                    {t('requestDietaryChangeTitle', 'Request Dietary Preference Change')}
                  </h2>
                  <p className="text-xs text-emerald-100/90 mt-0.5">
                    {student?.name || `Student #${student?.tokenNo}`} • {student?.batch || 'ADSA Student'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-5 overflow-y-auto">
            {/* Informational Banner */}
            <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/20 flex items-start gap-3 text-xs text-emerald-900 dark:text-emerald-200 leading-relaxed">
              <Info className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">
                  {t('dietaryNoticeHighlight', 'Dietary preferences directly govern mess food inventory and kitchen preparations.')}
                </p>
                <p className="text-[11px] opacity-80 mt-0.5">
                  {t('dietaryNoticeDetails', 'Submitting this form notifies the ADSA Canteen Committee. Upon approval, your allowances will automatically update.')}
                </p>
              </div>
            </div>

            {/* Pending Request Alert (if active) */}
            {pendingRequest && (
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-amber-900 dark:text-amber-200">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>{t('activeRequestUnderReview', 'An active request is currently under review by the committee.')}</span>
                  </div>
                </div>
                <p className="text-[11px] text-amber-800 dark:text-amber-300/90">
                  {t('pendingRequestReason', 'Submitted reason')}: {pendingRequest.reasonText || REASON_CATEGORIES[pendingRequest.reasonCategory]?.labelEn || 'Dietary change'}
                </p>
              </div>
            )}

            {/* Category Preferences Selector Grid */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  {t('selectDesiredPreferences', 'Desired Dietary Inclusions & Exemptions')}
                </label>
                <span className="text-[11px] text-gray-500 dark:text-gray-400">
                  {t('tapToToggle', 'Tap card to toggle')}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {preferencesList.map((pref) => {
                  const isDraftIncluded = draftDietary[pref.id] !== false;
                  const isCurrentIncluded =
                    currentDietary[pref.id] !== false &&
                    currentDietary[pref.id.toLowerCase()] !== false;
                  const isModified = isDraftIncluded !== isCurrentIncluded;

                  return (
                    <button
                      type="button"
                      key={pref.id}
                      onClick={() => handleTogglePref(pref.id)}
                      className={`p-3 rounded-2xl border text-left transition-all relative flex items-center justify-between gap-3 ${
                        isDraftIncluded
                          ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-500/30'
                          : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-300 dark:border-rose-500/30'
                      } ${isModified ? 'ring-2 ring-emerald-500/50' : ''}`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            isDraftIncluded
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                              : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                          }`}
                        >
                          {getCategoryIcon(pref.icon, 'w-4 h-4')}
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-bold text-gray-900 dark:text-white block truncate">
                            {language === 'ml' && pref.labelMl ? pref.labelMl : (pref.labelEn || pref.name)}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                            {language === 'ml' ? pref.labelEn : pref.labelMl}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end flex-shrink-0">
                        <span
                          className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            isDraftIncluded
                              ? 'bg-emerald-500 text-white'
                              : 'bg-rose-500 text-white'
                          }`}
                        >
                          {isDraftIncluded ? t('takingIncluded', 'Taking (Yes)') : t('avoidExcluded', 'Avoid (No)')}
                        </span>

                        {isModified && (
                          <span className="text-[9px] font-black text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" />
                            {t('modifiedBadge', 'Change')}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live Difference Summary Badge */}
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider text-[11px]">
                  {t('requestedChangesSummary', 'Requested Modification Delta')}
                </span>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {changes.length} {changes.length === 1 ? t('itemChanged', 'item changed') : t('itemsChanged', 'items changed')}
                </span>
              </div>

              {changes.length === 0 ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                  {t('noModificationsSelected', 'No changes selected. Tap on any item above to switch between taking or avoiding.')}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {changes.map((c) => (
                    <span
                      key={c.prefId}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-900 dark:text-white"
                    >
                      <span>{language === 'ml' ? c.labelMl : c.labelEn}:</span>
                      <span className={c.from ? 'text-emerald-600 line-through text-[11px]' : 'text-rose-600 line-through text-[11px]'}>
                        {c.from ? t('included', 'Included') : t('avoided', 'Avoided')}
                      </span>
                      <ArrowRight className="w-3 h-3 text-gray-400" />
                      <span className={c.to ? 'text-emerald-600 font-extrabold' : 'text-rose-600 font-extrabold'}>
                        {c.to ? t('included', 'Included') : t('avoided', 'Avoided')}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Reason Category Quick Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 block">
                {t('reasonCategoryLabel', 'Reason for Change')}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {Object.values(REASON_CATEGORIES).map((cat) => {
                  const isSelected = reasonCategory === cat.id;
                  return (
                    <button
                      type="button"
                      key={cat.id}
                      onClick={() => {
                        feedback('tick');
                        setReasonCategory(cat.id);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                          : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:bg-gray-200 dark:hover:bg-white/10'
                      }`}
                    >
                      {language === 'ml' ? cat.labelMl : cat.labelEn}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reason Notes Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  {t('additionalExplanation', 'Additional Details / Medical Note')}
                </label>
                <span className="text-[10px] text-gray-400">
                  {t('optional', 'Optional')}
                </span>
              </div>
              <textarea
                value={reasonText}
                onChange={(e) => setReasonText(e.target.value)}
                placeholder={t(
                  'dietaryReasonPlaceholder',
                  'E.g., Doctor advised avoiding red meat, experiencing allergy reaction, personal preference...'
                )}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none"
              />
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="p-4 sm:p-5 bg-gray-50 dark:bg-white/5 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div>
              {pendingRequest ? (
                <button
                  type="button"
                  onClick={handleWithdraw}
                  disabled={cancelling || submitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-xs font-bold border border-rose-200 dark:border-rose-800/40 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{cancelling ? t('withdrawing', 'Withdrawing...') : t('withdrawRequest', 'Withdraw Request')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
                >
                  {t('cancel', 'Cancel')}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || changes.length === 0}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black text-white shadow-md transition-all ${
                  changes.length === 0
                    ? 'bg-gray-300 dark:bg-white/10 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-500/20 active:scale-95 cursor-pointer'
                }`}
              >
                {submitting ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>{t('submitting', 'Submitting Request...')}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {pendingRequest
                        ? t('updateAndResubmit', 'Update Request')
                        : t('submitToCommittee', 'Submit Request to Committee')}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
