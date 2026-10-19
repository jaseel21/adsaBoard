import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  Utensils,
  Coffee,
  ShieldAlert,
  ShieldCheck,
  Layers,
  KeyRound,
  Trash2,
  AlertTriangle,
  Download,
  Copy,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { dialog } from '../utils/dialog';
import firebase from '../firebase/config';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { subscribeToPreferences } from '../utils/preferenceService';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../utils/auditLogger';

export default function BulkActionModal({
  isOpen,
  onClose,
  selectedStudents = [],
  onCompleted,
  allBatches = []
}) {
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const [activeAction, setActiveAction] = useState('meals'); // 'meals' | 'dietary' | 'batch' | 'status' | 'password' | 'delete'
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Meals state
  const [targetMeal, setTargetMeal] = useState('lunch'); // 'lunch' | 'breakfast' | 'both'
  const [mealDays, setMealDays] = useState({
    su: true, mo: true, tu: true, we: true, th: true, fr: true, sa: true
  });
  const [mealActionVal, setMealActionVal] = useState(true); // true = turn ON, false = turn OFF

  // Dietary state
  const [dietaryChanges, setDietaryChanges] = useState({});
  const [availablePreferences, setAvailablePreferences] = useState([]);

  React.useEffect(() => {
    const unsub = subscribeToPreferences((list) => {
      setAvailablePreferences(list.filter((p) => p.isActive));
    });
    return () => unsub();
  }, []);

  // Batch state
  const [newBatch, setNewBatch] = useState(allBatches[0] || 'Batch 2024');

  // Status state
  const [newBlockStatus, setNewBlockStatus] = useState(true);
  const [bulkBlockReason, setBulkBlockReason] = useState('Administrative bulk update');

  // Password reset roster state
  const [generatedRoster, setGeneratedRoster] = useState(null);

  if (!isOpen) return null;

  const count = selectedStudents.length;

  const chunkArray = (array, size) => {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
      chunked.push(array.slice(i, i + size));
    }
    return chunked;
  };

  // 1. Bulk Meal Update
  const handleBulkMeals = async () => {
    feedback('tick');
    setLoading(true);
    setProgress(0);

    try {
      const db = firebase.firestore();
      const chunks = chunkArray(selectedStudents, 400);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const batch = db.batch();

        chunk.forEach(st => {
          const docRef = db.collection('students').doc(st.id);
          const currentLunch = st.obj?.lunch || { su: true, mo: true, tu: true, we: true, th: true, fr: true, sa: true };
          const currentBf = st.obj?.breakfast || { su: true, mo: true, tu: true, we: true, th: true, fr: true, sa: true };

          const updatedLunch = { ...currentLunch };
          const updatedBf = { ...currentBf };

          Object.keys(mealDays).forEach(day => {
            if (mealDays[day]) {
              if (targetMeal === 'lunch' || targetMeal === 'both') {
                updatedLunch[day] = mealActionVal;
              }
              if (targetMeal === 'breakfast' || targetMeal === 'both') {
                updatedBf[day] = mealActionVal;
              }
            }
          });

          batch.update(docRef, {
            'obj.lunch': updatedLunch,
            'obj.breakfast': updatedBf,
            updatedAt: new Date().toISOString()
          });
        });

        await batch.commit();
        setProgress(Math.round(((i + 1) / chunks.length) * 100));
      }

      await logAuditEvent({
        category: AUDIT_CATEGORIES.TOKENS,
        action: 'BULK_STUDENT_UPDATE',
        severity: AUDIT_SEVERITIES.WARNING,
        target: { type: 'student', id: 'bulk', label: `Bulk Meal Update (${count} Students)` },
        changes: {
          diffSummary: `Bulk updated ${targetMeal.toUpperCase()} for ${count} students to ${mealActionVal ? 'ON' : 'OFF'}`,
          fieldsChanged: [targetMeal],
        },
        metadata: {
          batchCount: count,
          meal: targetMeal,
          status: mealActionVal,
        },
      });

      dialog.toast.success('Meals Updated', `Successfully updated meal schedules for ${count} students.`);
      if (onCompleted) onCompleted();
      onClose();
    } catch (err) {
      console.error('Bulk meals error:', err);
      dialog.alert({ type: 'error', title: 'Update Failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 2. Bulk Dietary Update
  const handleBulkDietary = async () => {
    feedback('tick');
    setLoading(true);
    setProgress(0);

    try {
      const db = firebase.firestore();
      const chunks = chunkArray(selectedStudents, 400);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const batch = db.batch();

        chunk.forEach(st => {
          const docRef = db.collection('students').doc(st.id);
          const currentDiet = st.obj2 || { beef: true, chicken: true, fish: true, mutton: true };
          const updatedDiet = { ...currentDiet };

          ['beef', 'chicken', 'fish', 'mutton'].forEach(key => {
            if (dietaryChanges[key] === 'on') updatedDiet[key] = true;
            if (dietaryChanges[key] === 'off') updatedDiet[key] = false;
          });

          batch.update(docRef, {
            obj2: updatedDiet,
            updatedAt: new Date().toISOString()
          });
        });

        await batch.commit();
        setProgress(Math.round(((i + 1) / chunks.length) * 100));
      }

      dialog.toast.success('Dietary Updated', `Updated dietary preferences for ${count} students.`);
      if (onCompleted) onCompleted();
      onClose();
    } catch (err) {
      console.error('Bulk dietary error:', err);
      dialog.alert({ type: 'error', title: 'Update Failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 3. Bulk Batch Reassignment
  const handleBulkBatch = async () => {
    if (!newBatch.trim()) {
      dialog.alert({ type: 'warning', title: 'Missing Batch', message: 'Please enter a valid batch name.' });
      return;
    }
    feedback('tick');
    setLoading(true);

    try {
      const db = firebase.firestore();
      const chunks = chunkArray(selectedStudents, 400);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const batch = db.batch();

        chunk.forEach(st => {
          const docRef = db.collection('students').doc(st.id);
          batch.update(docRef, {
            batch: newBatch.trim(),
            updatedAt: new Date().toISOString()
          });
        });

        await batch.commit();
      }

      dialog.toast.success('Batch Reassigned', `Moved ${count} students to "${newBatch}".`);
      if (onCompleted) onCompleted();
      onClose();
    } catch (err) {
      console.error('Bulk batch error:', err);
      dialog.alert({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 4. Bulk Status (Lock/Unlock)
  const handleBulkStatus = async () => {
    feedback('tick');
    setLoading(true);

    try {
      const db = firebase.firestore();
      const chunks = chunkArray(selectedStudents, 400);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const batch = db.batch();

        chunk.forEach(st => {
          const docRef = db.collection('students').doc(st.id);
          batch.update(docRef, {
            block: newBlockStatus,
            blockReason: newBlockStatus ? bulkBlockReason.trim() : '',
            updatedAt: new Date().toISOString()
          });
        });

        await batch.commit();
      }

      await logAuditEvent({
        category: AUDIT_CATEGORIES.STUDENTS,
        action: newBlockStatus ? 'STUDENT_BLOCK' : 'STUDENT_UNBLOCK',
        severity: newBlockStatus ? AUDIT_SEVERITIES.CRITICAL : AUDIT_SEVERITIES.NOTICE,
        target: { type: 'student', id: 'bulk', label: `Bulk Status Update (${count} Students)` },
        changes: {
          diffSummary: `Mass ${newBlockStatus ? 'BLOCKED' : 'UNBLOCKED'} ${count} students`,
          fieldsChanged: ['block', 'blockReason'],
          before: { block: !newBlockStatus },
          after: { block: newBlockStatus, blockReason: newBlockStatus ? bulkBlockReason.trim() : '' },
        },
        metadata: {
          batchCount: count,
          reason: bulkBlockReason.trim() || undefined,
        },
      });

      dialog.toast.success(
        newBlockStatus ? 'Students Blocked' : 'Students Unblocked',
        `${count} students have been ${newBlockStatus ? 'blocked' : 'unblocked'}.`
      );
      if (onCompleted) onCompleted();
      onClose();
    } catch (err) {
      console.error('Bulk status error:', err);
      dialog.alert({ type: 'error', title: 'Error', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // 5. Bulk Password Reset & Roster Generation
  const handleBulkPasswordReset = async () => {
    feedback('tick');
    setLoading(true);

    try {
      const db = firebase.firestore();
      const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
      const roster = [];
      const chunks = chunkArray(selectedStudents, 400);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const batch = db.batch();

        chunk.forEach(st => {
          let newPass = '';
          for (let p = 0; p < 6; p++) {
            newPass += chars.charAt(Math.floor(Math.random() * chars.length));
          }

          roster.push({
            tokenNo: st.tokenNo,
            nameEn: st.nameEn || st.name || '',
            nameMl: st.nameMl || '',
            uname: st.username || st.uname || String(st.tokenNo || ''),
            newPassword: newPass,
            batch: st.batch || 'General'
          });

          const docRef = db.collection('students').doc(st.id);
          batch.update(docRef, {
            password: newPass,
            updatedAt: new Date().toISOString()
          });
        });

        await batch.commit();
      }

      setGeneratedRoster(roster);
      dialog.toast.success('Passwords Reset', `Generated fresh credentials for ${count} students.`);
      if (onCompleted) onCompleted();
    } catch (err) {
      console.error('Bulk pass error:', err);
      dialog.alert({ type: 'error', title: 'Reset Failed', message: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPasswordRoster = () => {
    if (!generatedRoster) return;
    feedback('tick');
    const header = ['Token No', 'English Name', 'Malayalam Name', 'Username', 'New Password', 'Batch'];
    const rows = generatedRoster.map(r => [
      r.tokenNo,
      `"${(r.nameEn || '').replace(/"/g, '""')}"`,
      `"${(r.nameMl || '').replace(/"/g, '""')}"`,
      `"${(r.uname || '').replace(/"/g, '""')}"`,
      r.newPassword,
      `"${(r.batch || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [header.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ADSA_Password_Reset_Roster_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 6. Bulk Delete
  const handleBulkDelete = async () => {
    const tokenListStr = selectedStudents.slice(0, 10).map(s => `#${s.tokenNo}`).join(', ') + (count > 10 ? ` and ${count - 10} more...` : '');

    const confirmed = await dialog.confirm({
      title: `Delete ${count} Students?`,
      message: `You are about to permanently delete ${count} student records: ${tokenListStr}. This action cannot be undone.`,
      icon: 'trash',
      confirmColor: 'rose',
      confirmText: 'Yes, Permanently Delete All',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      setLoading(true);
      try {
        const db = firebase.firestore();
        const chunks = chunkArray(selectedStudents, 400);

        for (let i = 0; i < chunks.length; i++) {
          const chunk = chunks[i];
          const batch = db.batch();
          chunk.forEach(st => {
            batch.delete(db.collection('students').doc(st.id));
          });
          await batch.commit();
        }

        dialog.toast.success('Deleted!', `${count} student records have been deleted.`);
        if (onCompleted) onCompleted();
        onClose();
      } catch (err) {
        console.error('Bulk delete error:', err);
        dialog.alert({ type: 'error', title: 'Delete Error', message: err.message });
      } finally {
        setLoading(false);
      }
    }
  };

  const daysList = [
    { key: 'su', label: t('days')?.su || 'Sun' },
    { key: 'mo', label: t('days')?.mo || 'Mon' },
    { key: 'tu', label: t('days')?.tu || 'Tue' },
    { key: 'we', label: t('days')?.we || 'Wed' },
    { key: 'th', label: t('days')?.th || 'Thu' },
    { key: 'fr', label: t('days')?.fr || 'Fri' },
    { key: 'sa', label: t('days')?.sa || 'Sat' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 xs:p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh] pb-safe"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-200/80 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-emerald-500/10 via-transparent to-transparent">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center font-bold text-sm sm:text-base shadow-md shadow-emerald-500/20 flex-shrink-0">
              {count}
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                {t('bulkActionsBtn') || 'Bulk Student Operations'}
              </h3>
              <p className="text-[11px] sm:text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                Targeting {count} selected students
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Tabs */}
        <div className="flex border-b border-gray-200/80 dark:border-white/10 bg-gray-50/70 dark:bg-white/[0.02] px-3 sm:px-4 overflow-x-auto scrollbar-none whitespace-nowrap touch-pan-x">
          {[
            { id: 'meals', label: 'Meals', icon: Utensils },
            { id: 'dietary', label: 'Dietary', icon: Coffee },
            { id: 'batch', label: 'Batch', icon: Layers },
            { id: 'status', label: 'Lock/Unlock', icon: ShieldCheck },
            { id: 'password', label: 'Reset Passwords', icon: KeyRound },
            { id: 'delete', label: 'Delete', icon: Trash2, danger: true },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeAction === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => { feedback('tick'); setActiveAction(tab.id); }}
                className={`py-2.5 sm:py-3 px-3 sm:px-3.5 text-xs font-bold border-b-2 whitespace-nowrap flex items-center gap-1.5 transition-all flex-shrink-0 ${
                  active
                    ? tab.danger
                      ? 'border-rose-500 text-rose-600 dark:text-rose-400'
                      : 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                    : tab.danger
                    ? 'border-transparent text-rose-400 hover:text-rose-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body Content */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
          {/* TAB 1: MEALS */}
          {activeAction === 'meals' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  Target Meal Service
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'lunch', label: 'Lunch Only', icon: Utensils },
                    { id: 'breakfast', label: 'Breakfast Only', icon: Coffee },
                    { id: 'both', label: 'Both Meals', icon: Sparkles },
                  ].map(item => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setTargetMeal(item.id)}
                      className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                        targetMeal === item.id
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm shadow-emerald-500/30'
                          : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                  Desired Action
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMealActionVal(true)}
                    className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      mealActionVal === true
                        ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Turn ON (Eating Meal)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMealActionVal(false)}
                    className={`p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border transition-all ${
                      mealActionVal === false
                        ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                        : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <X className="w-4 h-4" />
                    <span>Turn OFF (Skip Meal)</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                    Apply to Specific Days
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setMealDays({ su: true, mo: true, tu: true, we: true, th: true, fr: true, sa: true })}
                      className="text-[11px] font-bold text-emerald-600 hover:underline"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => setMealDays({ su: false, mo: false, tu: false, we: false, th: false, fr: false, sa: false })}
                      className="text-[11px] font-bold text-gray-400 hover:underline"
                    >
                      Clear
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-2">
                  {daysList.map(d => {
                    const selected = Boolean(mealDays[d.key]);
                    return (
                      <button
                        key={d.key}
                        type="button"
                        onClick={() => setMealDays(prev => ({ ...prev, [d.key]: !prev[d.key] }))}
                        className={`py-2.5 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all ${
                          selected
                            ? 'bg-emerald-500 text-white shadow-sm'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                        }`}
                      >
                        <span>{d.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="button"
                onClick={handleBulkMeals}
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold shadow-md hover:from-emerald-700 hover:to-green-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Updating in batches...' : `Apply Meal Updates to ${count} Students`}
              </button>
            </div>
          )}

          {/* TAB 2: DIETARY */}
          {activeAction === 'dietary' && (
            <div className="space-y-4">
              <p className="text-xs text-gray-500">
                Choose which meat types to allow or exempt for all {count} selected students:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availablePreferences.map(item => (
                  <div key={item.id} className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200/80 dark:border-white/10 space-y-2">
                    <span className="text-xs font-bold text-gray-900 dark:text-white">{item.labelEn}</span>
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { val: 'no_change', label: 'Unchanged' },
                        { val: 'on', label: 'Allow' },
                        { val: 'off', label: 'Exempt' },
                      ].map(opt => (
                        <button
                          key={opt.val}
                          type="button"
                          onClick={() => setDietaryChanges(prev => ({ ...prev, [item.id]: opt.val }))}
                          className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                            (dietaryChanges[item.id] || 'no_change') === opt.val
                              ? opt.val === 'on'
                                ? 'bg-emerald-500 text-white'
                                : opt.val === 'off'
                                ? 'bg-rose-500 text-white'
                                : 'bg-gray-700 text-white dark:bg-gray-600'
                              : 'bg-gray-200 dark:bg-white/5 text-gray-600 dark:text-gray-400'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleBulkDietary}
                disabled={loading}
                className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold shadow-md hover:from-emerald-700 hover:to-green-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Updating in batches...' : `Apply Dietary Preferences to ${count} Students`}
              </button>
            </div>
          )}

          {/* TAB 3: BATCH REASSIGNMENT */}
          {activeAction === 'batch' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                  Select or Enter New Batch / Academic Year
                </label>
                <input
                  type="text"
                  list="bulkBatchList"
                  value={newBatch}
                  onChange={(e) => setNewBatch(e.target.value)}
                  placeholder="e.g. Batch 2025, Senior Dars"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <datalist id="bulkBatchList">
                  {allBatches.map(b => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <p className="text-xs text-gray-500">
                This will move all {count} selected students into batch <b>&quot;{newBatch}&quot;</b>.
              </p>

              <button
                type="button"
                onClick={handleBulkBatch}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white text-xs font-bold shadow-md hover:from-emerald-700 hover:to-green-700 transition-all disabled:opacity-50"
              >
                {loading ? 'Updating in batches...' : `Reassign ${count} Students to "${newBatch}"`}
              </button>
            </div>
          )}

          {/* TAB 4: LOCK / UNLOCK */}
          {activeAction === 'status' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setNewBlockStatus(false)}
                  className={`p-4 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                    newBlockStatus === false
                      ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-sm'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500'
                  }`}
                >
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  <span>Unblock (Active)</span>
                </button>

                <button
                  type="button"
                  onClick={() => setNewBlockStatus(true)}
                  className={`p-4 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-2 transition-all ${
                    newBlockStatus === true
                      ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-500 text-rose-700 dark:text-rose-300 shadow-sm'
                      : 'bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-500'
                  }`}
                >
                  <ShieldAlert className="w-6 h-6 text-rose-500" />
                  <span>Block (Lock Tokens)</span>
                </button>
              </div>

              {newBlockStatus && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                    Reason for Locking
                  </label>
                  <input
                    type="text"
                    value={bulkBlockReason}
                    onChange={(e) => setBulkBlockReason(e.target.value)}
                    placeholder="e.g. Vacation period, semester break"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500/40"
                  />
                </div>
              )}

              <button
                type="button"
                onClick={handleBulkStatus}
                disabled={loading}
                className={`w-full py-3 rounded-xl text-white text-xs font-bold shadow-md transition-all disabled:opacity-50 ${
                  newBlockStatus
                    ? 'bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-700 hover:to-red-700'
                    : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700'
                }`}
              >
                {loading ? 'Applying changes...' : `${newBlockStatus ? 'Block' : 'Unblock'} ${count} Students`}
              </button>
            </div>
          )}

          {/* TAB 5: RESET PASSWORDS */}
          {activeAction === 'password' && (
            <div className="space-y-4">
              {!generatedRoster ? (
                <>
                  <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 space-y-1">
                    <p className="font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Security Notice</span>
                    </p>
                    <p>
                      This will generate a brand new, random 6-character password for each of the <b>{count}</b> selected students.
                      You will immediately receive a downloadable CSV roster to distribute the new credentials.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleBulkPasswordReset}
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-600 to-yellow-600 text-white text-xs font-bold shadow-md hover:from-amber-700 hover:to-yellow-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>{loading ? 'Generating passwords...' : `Reset Passwords for ${count} Students`}</span>
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-2">
                    <p className="font-bold flex items-center gap-1.5">
                      <Check className="w-4 h-4" />
                      <span>Passwords Generated Successfully!</span>
                    </p>
                    <p>
                      Generated temporary credentials for {generatedRoster.length} students. Download the CSV below to distribute.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleDownloadPasswordRoster}
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download New Password Roster (CSV)</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 6: DELETE */}
          {activeAction === 'delete' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200/50 dark:border-rose-500/20 text-xs text-rose-800 dark:text-rose-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Permanent Deletion Warning</span>
                </p>
                <p>
                  You are about to permanently erase <b>{count}</b> student documents from the database. Token allocations and dietary records will be deleted immediately.
                </p>
              </div>

              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 text-white text-xs font-bold shadow-md hover:from-rose-700 hover:to-red-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{loading ? 'Deleting...' : `Confirm & Delete ${count} Students`}</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
