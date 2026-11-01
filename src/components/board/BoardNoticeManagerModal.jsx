import React, { useState, useEffect, useContext, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Sparkles,
  AlertTriangle,
  ChefHat,
  BookOpen,
  Info,
  Clock,
  Users,
  Check,
  ShieldAlert,
  Loader2,
  Save,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { AuthContext } from '../../store/AuthContext';
import { dialog } from '../../utils/dialog';
import {
  BOARD_NOTICE_PRESETS,
  createBoardNotice,
  updateBoardNotice,
  deleteBoardNotice,
} from '../../utils/boardNoticeService';
import {
  setBoardRangeSupply,
  clearBoardServiceOverride,
} from '../../utils/boardServiceSchedule';
import { addDaysToDate, formatFriendlyDate } from '../../utils/studentExceptionService';

export default function BoardNoticeManagerModal({
  isOpen,
  onClose,
  allStudents = [],
  allBatches = [],
  notices = [],
  targetDateIST,
  editingNotice = null,
  onCompleted = null,
}) {
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();
  const { user, role } = useContext(AuthContext);

  // Tab: 'create' | 'list'
  const [activeTab, setActiveTab] = useState('create');

  // Form Fields
  const [selectedPresetId, setSelectedPresetId] = useState('dars_leave');
  const [title, setTitle] = useState('');
  const [titleMl, setTitleMl] = useState('');
  const [category, setCategory] = useState('dars_leave');
  const [severity, setSeverity] = useState('info');
  const [badgeText, setBadgeText] = useState('മാസാവധി');
  const [badgeTextEn, setBadgeTextEn] = useState('Monthly Leave');
  const [startDate, setStartDate] = useState(targetDateIST || '');
  const [endDate, setEndDate] = useState(targetDateIST || '');
  const [mealScope, setMealScope] = useState('both');
  const [canteenStatus, setCanteenStatus] = useState('normal_with_leave');
  const [targetBatchScope, setTargetBatchScope] = useState('all'); // 'all' or specific batch name
  const [description, setDescription] = useState('');
  const [descriptionMl, setDescriptionMl] = useState('');
  const [autoApplyBulkLeave, setAutoApplyBulkLeave] = useState(true);

  // Editing existing notice
  const [activeEditingId, setActiveEditingId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Apply preset values helper
  const applyPreset = (preset) => {
    setSelectedPresetId(preset.id);
    setTitle(preset.title);
    setTitleMl(preset.titleMl);
    setCategory(preset.category);
    setSeverity(preset.severity);
    setBadgeText(preset.badgeText);
    setBadgeTextEn(preset.badgeTextEn);
    setMealScope(preset.defaultMealScope);
    setCanteenStatus(preset.defaultCanteenStatus);
    setDescription(preset.description);
    setDescriptionMl(preset.descriptionMl);
    setAutoApplyBulkLeave(preset.defaultAutoBulkLeave);
  };

  // Populate form on opening
  useEffect(() => {
    if (isOpen) {
      if (editingNotice) {
        setActiveTab('create');
        setActiveEditingId(editingNotice.id);
        setTitle(editingNotice.title || '');
        setTitleMl(editingNotice.titleMl || '');
        setCategory(editingNotice.category || 'general');
        setSeverity(editingNotice.severity || 'info');
        setBadgeText(editingNotice.badgeText || '');
        setBadgeTextEn(editingNotice.badgeTextEn || '');
        setStartDate(editingNotice.startDate || targetDateIST || '');
        setEndDate(editingNotice.endDate || editingNotice.startDate || targetDateIST || '');
        setMealScope(editingNotice.mealScope || 'both');
        setCanteenStatus(editingNotice.canteenStatus || 'normal_with_leave');
        setTargetBatchScope(
          Array.isArray(editingNotice.targetBatches) && editingNotice.targetBatches[0]
            ? editingNotice.targetBatches[0]
            : 'all'
        );
        setDescription(editingNotice.description || '');
        setDescriptionMl(editingNotice.descriptionMl || '');
        setAutoApplyBulkLeave(Boolean(editingNotice.autoBulkLeaveApplied));
      } else {
        setActiveTab(notices.length > 0 ? 'list' : 'create');
        setActiveEditingId(null);
        setStartDate(targetDateIST || '');
        setEndDate(targetDateIST || '');
        const defaultPreset = BOARD_NOTICE_PRESETS[0];
        applyPreset(defaultPreset);
      }
    }
  }, [isOpen, editingNotice, targetDateIST, notices.length]);

  const actor = {
    uid: user?.uid || 'admin',
    displayName: user?.displayName || user?.email || 'Admin',
    email: user?.email || '',
    role: role || 'canteen_committee',
  };

  // Compute affected student count
  const affectedStudents = useMemo(() => {
    if (targetBatchScope === 'all') return allStudents;
    return allStudents.filter(
      (s) => (s.batch?.trim() || 'Unassigned') === targetBatchScope
    );
  }, [allStudents, targetBatchScope]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !startDate) {
      dialog.alert({
        type: 'warning',
        title: 'Missing Details',
        message: 'Please provide both notice title and valid start date.',
      });
      return;
    }

    feedback('tick');
    setIsSubmitting(true);

    try {
      const noticePayload = {
        title: title.trim(),
        titleMl: titleMl.trim() || title.trim(),
        category,
        severity,
        badgeText: badgeText.trim(),
        badgeTextEn: badgeTextEn.trim(),
        startDate,
        endDate: endDate || startDate,
        mealScope,
        canteenStatus,
        targetBatches: targetBatchScope === 'all' ? 'all' : [targetBatchScope],
        description: description.trim(),
        descriptionMl: descriptionMl.trim() || description.trim(),
        autoBulkLeaveApplied: autoApplyBulkLeave,
        affectedTokenCount: affectedStudents.length,
      };

      let savedNotice;
      if (activeEditingId) {
        savedNotice = await updateBoardNotice(activeEditingId, noticePayload, actor);
        dialog.toast.success('Notice Updated', `Saved "${savedNotice.title}".`);
      } else {
        savedNotice = await createBoardNotice(noticePayload, actor);

        // Coordinated Automation: If canteenStatus is closed or food supply is suspended, update boardServiceSchedule!
        if (canteenStatus === 'closed' || autoApplyBulkLeave) {
          await setBoardRangeSupply({
            startDate,
            endDate: endDate !== startDate ? endDate : startDate,
            mealScope,
            isSupplying: false,
            reasonKey: category,
            noteEn: title,
            noteMl: titleMl || title,
            descEn: description,
            descMl: descriptionMl || description,
            actor,
          });
          dialog.toast.success(
            lang === 'ml' ? 'ഭക്ഷണ വിതരണം നിർത്തിവെച്ചു' : 'Board Food Supply Suspended',
            lang === 'ml'
              ? `കാന്റീനിൽ ഭക്ഷണമില്ലാത്തതായി രേഖപ്പെടുത്തി (${titleMl || title}).`
              : `Canteen food supply turned OFF for ${startDate}${endDate !== startDate ? ` to ${endDate}` : ''}.`
          );
        } else {
          dialog.toast.success('Notice Published', `Notice "${savedNotice.title}" active on board.`);
        }
      }

      if (onCompleted) onCompleted(savedNotice);
      onClose();
    } catch (err) {
      console.error('Error saving board notice:', err);
      dialog.alert({
        type: 'error',
        title: 'Save Failed',
        message: err.message || 'Could not save notice.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (notice) => {
    feedback('pop');
    const confirmed = await dialog.confirm({
      title: `Delete Notice "${notice.title}"?`,
      message: `Are you sure you want to remove this notice? It will disappear from the token board for ${notice.startDate}.`,
      confirmColor: 'rose',
      confirmText: 'Delete Notice',
    });

    if (!confirmed) return;

    try {
      await deleteBoardNotice(notice.id, actor);

      // If food supply was turned OFF for this notice, restore regular supply
      if (notice.canteenStatus === 'closed' || notice.autoBulkLeaveApplied) {
        await setBoardRangeSupply({
          startDate: notice.startDate,
          endDate: notice.endDate || notice.startDate,
          mealScope: notice.mealScope || 'both',
          isSupplying: true,
          actor,
        });
        dialog.toast.success(
          lang === 'ml' ? 'ഭക്ഷണ വിതരണം പുനരാരംഭിച്ചു' : 'Food Supply Restored',
          lang === 'ml' ? 'കാന്റീൻ ഭക്ഷണ വിതരണം സാധാരണ നിലയിലാക്കി.' : 'Restored regular canteen food supply.'
        );
      }

      dialog.toast.success('Notice Deleted', 'Board notice removed.');
      if (onCompleted) onCompleted();
    } catch (err) {
      console.error('Error deleting notice:', err);
      dialog.alert({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete notice.',
      });
    }
  };

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-3xl bg-white dark:bg-[#0c1411] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden my-6"
      >
        {/* Header & Tabs */}
        <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                  {t('boardNoticeStudioTitle', 'Board Notice & Event Studio')}
                </h2>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('boardNoticeStudioSubtitle', 'Manage Monthly Dars Leave, Nikah Ceremonies & Temporary Closures')}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 p-1 rounded-2xl bg-gray-200/60 dark:bg-white/5 border border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                feedback('pop');
                setActiveTab('create');
                setActiveEditingId(null);
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'create'
                  ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {activeEditingId ? t('editNoticeTab', 'Edit Notice') : t('newNoticeTab', '+ Create Notice')}
            </button>
            <button
              type="button"
              onClick={() => {
                feedback('pop');
                setActiveTab('list');
              }}
              className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'list'
                  ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {t('allNoticesTab', 'Active & Upcoming Notices')} ({notices.length})
            </button>
          </div>
        </div>

        {/* Tab 1: Notices Ledger List */}
        {activeTab === 'list' ? (
          <div className="p-4 sm:p-6 space-y-3 max-h-[60vh] overflow-y-auto">
            {notices.length === 0 ? (
              <div className="text-center py-10 space-y-2 text-gray-400">
                <Calendar className="w-10 h-10 mx-auto opacity-30" />
                <p className="text-sm font-semibold">No board notices scheduled.</p>
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create First Notice</span>
                </button>
              </div>
            ) : (
              notices.map((n) => (
                <div
                  key={n.id}
                  className="p-3.5 sm:p-4 rounded-2xl border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-black/10 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                        {n.badgeText || n.category}
                      </span>
                      {n.canteenStatus === 'closed' && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-500">
                          Closed
                        </span>
                      )}
                      <span className="text-[11px] text-gray-400">
                        {n.startDate === n.endDate ? n.startDate : `${n.startDate} → ${n.endDate}`}
                      </span>
                    </div>
                    <h3 className="text-sm font-black text-gray-900 dark:text-white truncate">
                      {lang === 'ml' && n.titleMl ? n.titleMl : n.title}
                    </h3>
                    {(n.description || n.descriptionMl) && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {lang === 'ml' && n.descriptionMl ? n.descriptionMl : n.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        setActiveEditingId(n.id);
                        setTitle(n.title);
                        setTitleMl(n.titleMl);
                        setCategory(n.category);
                        setSeverity(n.severity || 'info');
                        setBadgeText(n.badgeText || '');
                        setBadgeTextEn(n.badgeTextEn || '');
                        setStartDate(n.startDate);
                        setEndDate(n.endDate || n.startDate);
                        setMealScope(n.mealScope || 'both');
                        setCanteenStatus(n.canteenStatus || 'normal_with_leave');
                        setTargetBatchScope(
                          Array.isArray(n.targetBatches) && n.targetBatches[0] ? n.targetBatches[0] : 'all'
                        );
                        setDescription(n.description || '');
                        setDescriptionMl(n.descriptionMl || '');
                        setAutoApplyBulkLeave(Boolean(n.autoBulkLeaveApplied));
                        setActiveTab('create');
                      }}
                      className="p-2 rounded-xl text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      title="Edit Notice"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(n)}
                      className="p-2 rounded-xl text-gray-400 hover:text-rose-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                      title="Delete Notice"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          /* Tab 2: Create / Edit Form */
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* 1. Preset Selector Buttons */}
            {!activeEditingId && (
              <div className="space-y-1.5">
                <label className="text-xs font-black uppercase tracking-wider text-gray-400">
                  {t('selectPresetLabel', '1-Click Presets')}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {BOARD_NOTICE_PRESETS.map((p) => {
                    const isSelected = selectedPresetId === p.id;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          feedback('pop');
                          applyPreset(p);
                        }}
                        className={`p-2.5 rounded-2xl text-left border transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300 shadow-xs'
                            : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <span className="block text-xs font-extrabold truncate">{p.title}</span>
                        <span className="block text-[10px] text-gray-400 truncate">{p.titleMl}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. Titles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Title (English)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Monthly Dars Leave"
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Title (മലയാളം)
                </label>
                <input
                  type="text"
                  value={titleMl}
                  onChange={(e) => setTitleMl(e.target.value)}
                  placeholder="e.g. മാസാന്ത ദർസ് അവധി"
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-900 dark:text-white"
                />
              </div>
            </div>

            {/* 3. Dates & Meals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    if (endDate < e.target.value) setEndDate(e.target.value);
                  }}
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Meal Scope
                </label>
                <select
                  value={mealScope}
                  onChange={(e) => setMealScope(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-900 dark:text-white"
                >
                  <option value="both">Both Meals (Breakfast & Lunch)</option>
                  <option value="breakfast">Breakfast Only</option>
                  <option value="lunch">Lunch Only</option>
                </select>
              </div>
            </div>

            {/* 4. Canteen Operational Status & Batches */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Canteen Operations
                </label>
                <select
                  value={canteenStatus}
                  onChange={(e) => setCanteenStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-900 dark:text-white"
                >
                  <option value="normal_with_leave">Operating (Tokens on Scheduled Leave)</option>
                  <option value="closed">Temporarily Closed (Kitchen Suspended)</option>
                  <option value="open_special">Special Feast / Event Menu</option>
                  <option value="notice_only">Notice Only (Informational)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Applicable Batches
                </label>
                <select
                  value={targetBatchScope}
                  onChange={(e) => setTargetBatchScope(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs font-bold text-gray-900 dark:text-white"
                >
                  <option value="all">All Batches (Entire Dars)</option>
                  {allBatches.map((b) => {
                    const bName = typeof b === 'string' ? b : b.name;
                    return (
                      <option key={bName} value={bName}>
                        {bName}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* 5. Descriptions */}
            <div>
              <label className="text-xs font-black uppercase tracking-wider text-gray-400 block mb-1">
                Notice Note / Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Details displayed on the board banner..."
                rows={2}
                className="w-full p-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-xs text-gray-900 dark:text-white resize-none"
              />
            </div>

            {/* 6. Coordinated Workflow Synergy Toggle */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3">
              <input
                type="checkbox"
                id="autoApplyBulkLeave"
                checked={autoApplyBulkLeave}
                onChange={(e) => setAutoApplyBulkLeave(e.target.checked)}
                className="mt-1 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
              <label htmlFor="autoApplyBulkLeave" className="text-xs cursor-pointer select-none">
                <span className="font-extrabold text-emerald-700 dark:text-emerald-300 block">
                  {lang === 'ml'
                    ? 'ഈ അറിയിപ്പ് പ്രകാരം കാന്റീൻ ഭക്ഷണ വിതരണം നിർത്തുക (ബോർഡ് OFF)'
                    : 'Turn Canteen Food Supply OFF for this notice (Kitchen Suspended)'}
                </span>
                <span className="text-emerald-600/80 dark:text-emerald-400/80 text-[11px] block mt-0.5">
                  {lang === 'ml'
                    ? `വിദ്യാർത്ഥി വിവരങ്ങൾ മാറ്റാതെ തന്നെ, കാന്റീനിൽ ഭക്ഷണമില്ലാത്തതായി രേഖപ്പെടുത്തും. ഡൈനിംഗ് ഓർഡർ എണ്ണം 0 ആകും.`
                    : `Suspends canteen food supply on the board for ${startDate}. Active headcount will reflect 0 service with zero student record modifications.`}
                </span>
              </label>
            </div>

            {/* Submit Footer */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-gray-100 dark:border-white/10">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
              >
                {t('cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-black text-xs shadow-md shadow-emerald-900/30 hover:brightness-110 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>{activeEditingId ? t('updateNotice', 'Update Notice') : t('publishNotice', 'Publish Notice')}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>,
    document.body
  );
}
