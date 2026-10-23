import React, { useState, useEffect, useMemo, useContext } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Ban,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Receipt,
  Clock,
  Coffee,
  UtensilsCrossed,
  Search,
  Filter,
  Check,
  X,
  Edit2,
  Save,
  RotateCcw,
  Sparkles,
  DollarSign,
  Users,
  Trash2,
  Download,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import { dialog } from '../../utils/dialog';
import { useFeedback } from '../../utils/useFeedback';
import { useLanguage } from '../../store/LanguageContext';
import { AuthContext } from '../../store/AuthContext';
import firebase from '../../firebase/config';
import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../../utils/auditLogger';
import { approveUnblockRequest } from '../../utils/unblockRequestService';
import {
  DAY_KEYS,
  DAY_NAMES,
  DEFAULT_MEAL_SCHEDULE,
  DEFAULT_FINE_POLICY,
  BLOCK_REASON_CATEGORIES,
  subscribeToMealScheduleAndFines,
  saveMealScheduleAndFines,
  getStudentFineAmount,
  formatMealTimeRange,
} from '../../utils/mealScheduleService';

export default function BlockManagementModal({
  isOpen,
  onClose,
  allStudents = [],
  onStudentUpdated,
}) {
  const { user, role } = useContext(AuthContext);
  const { lang, t } = useLanguage();
  const { feedback } = useFeedback();

  // Active Top-Level View: 'roster' | 'settings' | 'new_block'
  const [activeTab, setActiveTab] = useState('roster');

  // Real-time Meal & Fine Settings
  const [mealSchedule, setMealSchedule] = useState(DEFAULT_MEAL_SCHEDULE);
  const [finePolicy, setFinePolicy] = useState(DEFAULT_FINE_POLICY);
  const [savingSettings, setSavingSettings] = useState(false);

  // Filter & Search in Roster
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBatch, setFilterBatch] = useState('all');
  const [filterReason, setFilterReason] = useState('all');
  const [filterFineStatus, setFilterFineStatus] = useState('all'); // 'all' | 'unpaid' | 'paid' | 'waived'
  const [selectedTokens, setSelectedTokens] = useState([]);

  // New Block Form State
  const [blockTokensInput, setBlockTokensInput] = useState('');
  const [blockMeal, setBlockMeal] = useState('lunch'); // 'breakfast' | 'lunch' | 'both'
  const [blockDay, setBlockDay] = useState('fr');
  const [blockReasonCategory, setBlockReasonCategory] = useState('food_waste');
  const [customReasonNote, setCustomReasonNote] = useState('');
  const [customFineInput, setCustomFineInput] = useState('');
  const [blockingInProgress, setBlockingInProgress] = useState(false);

  // Subscribe to real-time settings
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeToMealScheduleAndFines((data) => {
      if (data?.mealSchedule) setMealSchedule(data.mealSchedule);
      if (data?.finePolicy) setFinePolicy(data.finePolicy);
    });
    return () => unsub();
  }, [isOpen]);

  // Extract all blocked students
  const blockedStudents = useMemo(() => {
    return allStudents
      .filter((s) => Boolean(s.block))
      .sort((a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0));
  }, [allStudents]);

  // Extract batches from all students
  const availableBatches = useMemo(() => {
    const set = new Set();
    allStudents.forEach((s) => {
      if (s.batch) set.add(s.batch.trim());
    });
    return Array.from(set).sort();
  }, [allStudents]);

  // Filtered Roster
  const filteredRoster = useMemo(() => {
    return blockedStudents.filter((st) => {
      // Search token, name, phone, room
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesToken = String(st.tokenNo || '').includes(q);
        const matchesName = (st.name || st.nameEn || '').toLowerCase().includes(q);
        const matchesMl = (st.nameMl || '').toLowerCase().includes(q);
        const matchesRoom = String(st.roomNo || '').toLowerCase().includes(q);
        const matchesPhone = String(st.phone || '').toLowerCase().includes(q);
        if (!matchesToken && !matchesName && !matchesMl && !matchesRoom && !matchesPhone) return false;
      }

      // Batch filter
      if (filterBatch !== 'all' && (st.batch || '').trim() !== filterBatch) {
        return false;
      }

      // Reason filter
      if (filterReason !== 'all' && (st.blockCategory || 'food_waste') !== filterReason) {
        return false;
      }

      // Fine Status filter
      if (filterFineStatus !== 'all') {
        const status = st.fineStatus || 'unpaid';
        if (status !== filterFineStatus) return false;
      }

      return true;
    });
  }, [blockedStudents, searchQuery, filterBatch, filterReason, filterFineStatus]);

  // Telemetry Aggregates
  const telemetry = useMemo(() => {
    let totalUnpaidFines = 0;
    let foodWasteCount = 0;
    let pendingAppealsCount = 0;

    blockedStudents.forEach((st) => {
      const fine = getStudentFineAmount(st, finePolicy);
      const isPaidOrWaived = st.fineStatus === 'paid' || st.fineStatus === 'waived';
      if (!isPaidOrWaived) {
        totalUnpaidFines += fine;
      }
      if (st.blockCategory === 'food_waste' || !st.blockCategory) {
        foodWasteCount++;
      }
      if (st.pendingUnblockRequest?.status === 'pending') {
        pendingAppealsCount++;
      }
    });

    return {
      totalBlocked: blockedStudents.length,
      totalUnpaidFines,
      foodWasteCount,
      pendingAppealsCount,
    };
  }, [blockedStudents, finePolicy]);

  if (!isOpen || typeof document === 'undefined') return null;

  // Single Student Unblock
  const handleUnblockStudent = async (student) => {
    feedback('tick');
    const confirmed = await dialog.confirm({
      title: `Unblock Token #${student.tokenNo}?`,
      message: `Re-activate Token #${student.tokenNo} (${student.name || 'Student'}) into dining rotation on both Breakfast and Lunch grids?`,
      confirmText: 'Unblock Student',
      confirmColor: 'emerald',
      icon: 'check',
    });

    if (!confirmed) return;

    try {
      if (student.pendingUnblockRequest?.ticketId) {
        await approveUnblockRequest({
          studentId: student.id,
          tokenNo: student.tokenNo,
          ticketId: student.pendingUnblockRequest.ticketId,
          reviewerInfo: { uid: user?.uid, name: user?.displayName || user?.email, email: user?.email, role },
          resolutionNote: 'Unblocked via Admin Block Manager',
        });
      } else {
        await firebase.firestore().collection('students').doc(student.id).update({
          block: false,
          blockReason: '',
          blockCategory: null,
          fineAmount: null,
          fineStatus: null,
          pendingUnblockRequest: null,
          updatedAt: new Date().toISOString(),
          lastUnblockedAt: new Date().toISOString(),
          lastUnblockedBy: user?.displayName || user?.email || 'Admin',
        });
      }

      await logAuditEvent({
        category: AUDIT_CATEGORIES.TOKENS,
        action: 'STUDENT_UNBLOCK',
        severity: AUDIT_SEVERITIES.INFO,
        target: { type: 'student', id: student.id, label: `Token #${student.tokenNo}` },
        changes: {
          diffSummary: `Token #${student.tokenNo} unblocked and dining access restored.`,
          before: { block: true },
          after: { block: false },
        },
      });

      dialog.toast.success('Student Unblocked', `Token #${student.tokenNo} is now active.`);
      if (onStudentUpdated) onStudentUpdated();
    } catch (err) {
      console.error('Error unblocking student:', err);
      dialog.alert({ type: 'error', title: 'Unblock Failed', message: err.message });
    }
  };

  // Toggle Fine Status (Unpaid -> Paid -> Waived)
  const handleToggleFineStatus = async (student, newStatus) => {
    feedback('tick');
    try {
      await firebase.firestore().collection('students').doc(student.id).update({
        fineStatus: newStatus,
        updatedAt: new Date().toISOString(),
        fineSettledAt: newStatus === 'paid' ? new Date().toISOString() : null,
        fineSettledBy: newStatus === 'paid' ? (user?.displayName || user?.email || 'Admin') : null,
      });

      dialog.toast.success('Fine Status Updated', `Token #${student.tokenNo} fine set to ${newStatus.toUpperCase()}`);
      if (onStudentUpdated) onStudentUpdated();
    } catch (err) {
      console.error('Error updating fine status:', err);
      dialog.alert({ type: 'error', title: 'Update Failed', message: err.message });
    }
  };

  // Bulk Unblock Selected Students
  const handleBulkUnblock = async () => {
    if (selectedTokens.length === 0) return;
    feedback('tick');

    const confirmed = await dialog.confirm({
      title: `Unblock ${selectedTokens.length} Students?`,
      message: `Are you sure you want to restore full dining access for ${selectedTokens.length} students?`,
      confirmText: `Unblock (${selectedTokens.length})`,
      confirmColor: 'emerald',
    });

    if (!confirmed) return;

    try {
      const db = firebase.firestore();
      const batch = db.batch();

      selectedTokens.forEach((tokenId) => {
        const student = blockedStudents.find((s) => s.id === tokenId);
        if (student) {
          const docRef = db.collection('students').doc(student.id);
          batch.update(docRef, {
            block: false,
            blockReason: '',
            blockCategory: null,
            fineAmount: null,
            fineStatus: null,
            pendingUnblockRequest: null,
            updatedAt: new Date().toISOString(),
          });
        }
      });

      await batch.commit();

      await logAuditEvent({
        category: AUDIT_CATEGORIES.TOKENS,
        action: 'BULK_STUDENT_UNBLOCK',
        severity: AUDIT_SEVERITIES.INFO,
        target: { type: 'student', id: 'bulk', label: `Bulk Unblock (${selectedTokens.length} Students)` },
        changes: {
          diffSummary: `Bulk unblocked ${selectedTokens.length} students from Block Manager`,
        },
      });

      dialog.toast.success('Bulk Unblock Complete', `${selectedTokens.length} students successfully unblocked.`);
      setSelectedTokens([]);
      if (onStudentUpdated) onStudentUpdated();
    } catch (err) {
      console.error('Bulk unblock error:', err);
      dialog.alert({ type: 'error', title: 'Bulk Unblock Failed', message: err.message });
    }
  };

  // Bulk Settle Fines
  const handleBulkSettleFines = async (statusToSet = 'paid') => {
    if (selectedTokens.length === 0) return;
    feedback('tick');

    try {
      const db = firebase.firestore();
      const batch = db.batch();

      selectedTokens.forEach((tokenId) => {
        const student = blockedStudents.find((s) => s.id === tokenId);
        if (student) {
          const docRef = db.collection('students').doc(student.id);
          batch.update(docRef, {
            fineStatus: statusToSet,
            updatedAt: new Date().toISOString(),
            fineSettledAt: statusToSet === 'paid' ? new Date().toISOString() : null,
          });
        }
      });

      await batch.commit();
      dialog.toast.success('Fines Updated', `Marked ${selectedTokens.length} student fines as ${statusToSet.toUpperCase()}.`);
      setSelectedTokens([]);
      if (onStudentUpdated) onStudentUpdated();
    } catch (err) {
      console.error('Bulk fine settlement error:', err);
      dialog.alert({ type: 'error', title: 'Update Failed', message: err.message });
    }
  };

  // Submit New Block for One or More Students
  const handleCreateNewBlock = async (e) => {
    e.preventDefault();
    feedback('tick');

    const tokenNumbers = blockTokensInput
      .split(/[\s,]+/)
      .map((t) => Number(t.trim()))
      .filter((n) => !isNaN(n) && n > 0);

    if (tokenNumbers.length === 0) {
      dialog.alert({ type: 'warning', title: 'Missing Tokens', message: 'Please enter at least one valid token number.' });
      return;
    }

    setBlockingInProgress(true);

    try {
      const db = firebase.firestore();
      const batch = db.batch();
      let matchedCount = 0;

      // Calculate default fine for this block if not overridden
      const resolvedFine = customFineInput !== ''
        ? Number(customFineInput)
        : getStudentFineAmount({ blockMeal, blockDay }, finePolicy);

      const categoryMeta = BLOCK_REASON_CATEGORIES[blockReasonCategory] || BLOCK_REASON_CATEGORIES.food_waste;
      const finalReason = customReasonNote.trim() || categoryMeta.labelEn;

      tokenNumbers.forEach((tNo) => {
        const student = allStudents.find((s) => Number(s.tokenNo) === tNo);
        if (student) {
          matchedCount++;
          const docRef = db.collection('students').doc(student.id);
          batch.update(docRef, {
            block: true,
            blockReason: finalReason,
            blockCategory: blockReasonCategory,
            blockMeal,
            blockDay,
            fineAmount: resolvedFine,
            fineStatus: 'unpaid',
            blockedAt: new Date().toISOString(),
            blockedBy: user?.displayName || user?.email || 'Admin',
            updatedAt: new Date().toISOString(),
          });
        }
      });

      if (matchedCount === 0) {
        throw new Error('No registered students found matching the entered token numbers.');
      }

      await batch.commit();

      await logAuditEvent({
        category: AUDIT_CATEGORIES.TOKENS,
        action: 'STUDENT_BLOCK',
        severity: AUDIT_SEVERITIES.WARNING,
        target: { type: 'student', id: 'bulk_block', label: `Blocked ${matchedCount} Students` },
        changes: {
          diffSummary: `Blocked ${matchedCount} students for ${categoryMeta.labelEn}. Fine: ₹${resolvedFine}`,
        },
      });

      dialog.toast.success(
        'Students Blocked',
        `${matchedCount} student${matchedCount > 1 ? 's' : ''} blocked. Both Breakfast and Lunch grids are suspended.`
      );

      setBlockTokensInput('');
      setCustomReasonNote('');
      setCustomFineInput('');
      setActiveTab('roster');
      if (onStudentUpdated) onStudentUpdated();
    } catch (err) {
      console.error('Error creating block:', err);
      dialog.alert({ type: 'error', title: 'Block Failed', message: err.message });
    } finally {
      setBlockingInProgress(false);
    }
  };

  // Save Settings Tab
  const handleSaveSettings = async () => {
    feedback('tick');
    setSavingSettings(true);
    try {
      await saveMealScheduleAndFines({
        mealSchedule,
        finePolicy,
        actor: {
          uid: user?.uid,
          displayName: user?.displayName || user?.email,
          role,
        },
      });
      dialog.toast.success('Settings Saved', 'Meal schedule and fine rates saved to Firestore.');
    } catch (err) {
      console.error('Error saving settings:', err);
      dialog.alert({ type: 'error', title: 'Save Failed', message: err.message });
    } finally {
      setSavingSettings(false);
    }
  };

  // Reset to Standard Fine Preset
  const handleApplyStandardFines = () => {
    feedback('pop');
    setFinePolicy(DEFAULT_FINE_POLICY);
    dialog.toast.info('Standard Rates Applied', 'All days: ₹50 | Friday BF: ₹100 | Friday Lunch: ₹200');
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
        {/* Scrim Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ type: 'spring', damping: 28, stiffness: 340 }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/10 shadow-2xl overflow-hidden z-10"
        >
          {/* Header */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between bg-gradient-to-r from-gray-50/80 to-white dark:from-[#0a110f] dark:to-[#0c1412] flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 shadow-xs border border-rose-500/20">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                  <span>{lang === 'ml' ? 'കാന്റീൻ ബ്ലോക്ക് & പിഴ മാനേജ്‌മെന്റ്' : 'Block & Fine Management'}</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                    {telemetry.totalBlocked}
                  </span>
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {lang === 'ml'
                    ? 'ഭക്ഷണം പാഴാക്കൽ, വൈകിവരൽ പിഴകൾ, ടോക്കൺ ബ്ലോക്ക് നിയന്ത്രണം'
                    : 'Food waste penalties, fine ledger & dual-grid suspension'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Pill Tabs */}
          <div className="px-5 pt-3 pb-2 border-b border-gray-100 dark:border-white/5 flex items-center justify-between gap-2 flex-shrink-0 bg-gray-50/50 dark:bg-white/[0.02]">
            <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-gray-200/60 dark:bg-white/5 border border-gray-200 dark:border-white/5">
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setActiveTab('roster');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'roster'
                    ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                <span>{lang === 'ml' ? 'ബ്ലോക്ക് ചെയ്തവർ' : 'Blocked Roster'}</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black">
                  {telemetry.totalBlocked}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setActiveTab('new_block');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'new_block'
                    ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Ban className="w-3.5 h-3.5 text-rose-500" />
                <span>{lang === 'ml' ? 'പുതിയ ബ്ലോക്ക്' : 'Block Student(s)'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setActiveTab('settings');
                }}
                className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-500" />
                <span>{lang === 'ml' ? 'സമയവും പിഴയും' : 'Timings & Fine Matrix'}</span>
              </button>
            </div>

            {/* Total Unpaid Fine Capsule */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-700 dark:text-amber-300 font-bold">
              <Receipt className="w-3.5 h-3.5" />
              <span>Unpaid Fines:</span>
              <span className="font-mono text-sm font-black">₹{telemetry.totalUnpaidFines}</span>
            </div>
          </div>

          {/* Tab 1: Blocked Students Roster */}
          {activeTab === 'roster' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Telemetry HUD Cards */}
              <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 flex-shrink-0 bg-gray-50/30 dark:bg-white/[0.01]">
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 block">
                    Total Blocked
                  </span>
                  <span className="text-xl font-black text-rose-900 dark:text-rose-100 font-mono">
                    {telemetry.totalBlocked}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-500/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
                    Unpaid Fines
                  </span>
                  <span className="text-xl font-black text-amber-900 dark:text-amber-100 font-mono">
                    ₹{telemetry.totalUnpaidFines}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-500/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400 block">
                    Food Waste Causes
                  </span>
                  <span className="text-xl font-black text-orange-900 dark:text-orange-100 font-mono">
                    {telemetry.foodWasteCount}
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-500/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                    Pending Appeals
                  </span>
                  <span className="text-xl font-black text-purple-900 dark:text-purple-100 font-mono">
                    {telemetry.pendingAppealsCount}
                  </span>
                </div>
              </div>

              {/* Filter Toolbar */}
              <div className="px-4 py-2 border-y border-gray-100 dark:border-white/5 flex flex-wrap items-center justify-between gap-2 flex-shrink-0 bg-white dark:bg-[#0c1412]">
                <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by Token #, Name, Room..."
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-transparent focus:border-emerald-500 text-xs text-gray-900 dark:text-white outline-none"
                    />
                  </div>

                  {/* Batch Selector */}
                  <select
                    value={filterBatch}
                    onChange={(e) => setFilterBatch(e.target.value)}
                    className="py-1.5 px-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-transparent text-xs text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                  >
                    <option value="all">All Batches</option>
                    {availableBatches.map((b) => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>

                  {/* Fine Status Filter */}
                  <select
                    value={filterFineStatus}
                    onChange={(e) => setFilterFineStatus(e.target.value)}
                    className="py-1.5 px-2.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-transparent text-xs text-gray-700 dark:text-gray-300 outline-none cursor-pointer"
                  >
                    <option value="all">All Fine States</option>
                    <option value="unpaid">Unpaid Fines</option>
                    <option value="paid">Paid</option>
                    <option value="waived">Waived</option>
                  </select>
                </div>

                {/* Bulk Action Controls */}
                {selectedTokens.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-gray-500">
                      {selectedTokens.length} Selected:
                    </span>
                    <button
                      type="button"
                      onClick={handleBulkUnblock}
                      className="py-1.5 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs cursor-pointer"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Unblock</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSettleFines('paid')}
                      className="py-1.5 px-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 text-gray-800 dark:text-white font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Mark Paid</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleBulkSettleFines('waived')}
                      className="py-1.5 px-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-400 font-bold text-xs cursor-pointer"
                      title="Waive Fine"
                    >
                      Waive
                    </button>
                  </div>
                )}
              </div>

              {/* Roster Table Content */}
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {filteredRoster.length === 0 ? (
                  <div className="py-16 text-center text-gray-400 dark:text-gray-500">
                    <ShieldCheck className="w-12 h-12 mx-auto text-emerald-500/40 mb-2" />
                    <p className="font-bold text-sm text-gray-700 dark:text-gray-300">
                      {blockedStudents.length === 0 ? 'No Blocked Students' : 'No Students Match Filter'}
                    </p>
                    <p className="text-xs mt-1">
                      {blockedStudents.length === 0
                        ? 'All registered students are active in the canteen rotation.'
                        : 'Try adjusting your search query or filter settings.'}
                    </p>
                  </div>
                ) : (
                  filteredRoster.map((student) => {
                    const isSelected = selectedTokens.includes(student.id);
                    const fineAmt = getStudentFineAmount(student, finePolicy);
                    const fineStatus = student.fineStatus || 'unpaid';
                    const categoryMeta = BLOCK_REASON_CATEGORIES[student.blockCategory] || BLOCK_REASON_CATEGORIES.food_waste;
                    const hasPendingAppeal = student.pendingUnblockRequest?.status === 'pending';

                    return (
                      <div
                        key={student.id}
                        className={`p-3.5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-rose-50/80 dark:bg-rose-950/20 border-rose-400 dark:border-rose-500/40 shadow-xs'
                            : 'bg-white dark:bg-white/[0.02] border-gray-200/70 dark:border-white/5 hover:border-gray-300 dark:hover:border-white/10'
                        }`}
                      >
                        {/* Student ID & Details */}
                        <div className="flex items-start gap-3 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedTokens((prev) => [...prev, student.id]);
                              } else {
                                setSelectedTokens((prev) => prev.filter((id) => id !== student.id));
                              }
                            }}
                            className="mt-1 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-gray-300 cursor-pointer"
                          />

                          <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 font-mono font-black text-sm flex items-center justify-center flex-shrink-0 border border-rose-500/20">
                            #{student.tokenNo}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white truncate">
                                {student.name || student.nameEn || `Token #${student.tokenNo}`}
                              </span>
                              <span className="px-2 py-0.2 rounded-md text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                                {student.batch || 'General'}
                              </span>
                              {hasPendingAppeal && (
                                <span className="px-2 py-0.2 rounded-md text-[10px] font-black bg-purple-500 text-white animate-pulse">
                                  Appeal Pending
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                              <span className="font-semibold text-rose-600 dark:text-rose-400">
                                {categoryMeta.labelEn}:
                              </span>{' '}
                              &ldquo;{student.blockReason || 'Food waste / missed meal'}&rdquo;
                            </p>
                          </div>
                        </div>

                        {/* Fine Amount & Fine Status Island */}
                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-white/5 flex-shrink-0">
                          <div className="text-right">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                              Fine Amount
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-base font-black text-gray-900 dark:text-white">
                                ₹{fineAmt}
                              </span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                fineStatus === 'paid'
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                                  : fineStatus === 'waived'
                                  ? 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                              }`}>
                                {fineStatus}
                              </span>
                            </div>
                          </div>

                          {/* Quick Action Buttons */}
                          <div className="flex items-center gap-1">
                            {fineStatus === 'unpaid' ? (
                              <button
                                type="button"
                                onClick={() => handleToggleFineStatus(student, 'paid')}
                                className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-emerald-50 text-emerald-600 dark:text-emerald-400 border border-gray-200/60 dark:border-white/10 transition-all cursor-pointer"
                                title="Mark Fine Paid"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleToggleFineStatus(student, 'unpaid')}
                                className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-rose-50 text-gray-400 hover:text-rose-600 transition-all cursor-pointer"
                                title="Revert to Unpaid"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {/* 1-Click Unblock Button */}
                            <button
                              type="button"
                              onClick={() => handleUnblockStudent(student)}
                              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm transition-all cursor-pointer active:scale-95"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Unblock</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Tab 2: New Block Form */}
          {activeTab === 'new_block' && (
            <div className="flex-1 overflow-y-auto p-5">
              <form onSubmit={handleCreateNewBlock} className="max-w-xl mx-auto space-y-4">
                <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/20 flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-rose-950 dark:text-rose-200 space-y-1">
                    <span className="font-bold block">Dual-Grid Suspension Policy:</span>
                    <span>
                      Blocking a student suspends their dining privileges in <strong>both Breakfast and Lunch</strong> grids simultaneously.
                      Food waste penalties require office settlement or unblock review.
                    </span>
                  </div>
                </div>

                {/* Tokens Input */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Student Token Number(s) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={blockTokensInput}
                    onChange={(e) => setBlockTokensInput(e.target.value)}
                    placeholder="e.g. 12, 45, 88 (comma or space separated)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm text-gray-900 dark:text-white outline-none focus:border-rose-500"
                  />
                  <p className="text-[11px] text-gray-500 mt-1">
                    Enter one or multiple tokens for bulk disciplinary action.
                  </p>
                </div>

                {/* Infraction Category */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Reason / Infraction Category
                  </label>
                  <select
                    value={blockReasonCategory}
                    onChange={(e) => setBlockReasonCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm text-gray-900 dark:text-white outline-none cursor-pointer"
                  >
                    {Object.values(BLOCK_REASON_CATEGORIES).map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.labelEn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Grid Violated & Day */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Meal Grid Violated
                    </label>
                    <select
                      value={blockMeal}
                      onChange={(e) => setBlockMeal(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white outline-none cursor-pointer"
                    >
                      <option value="breakfast">Breakfast Grid</option>
                      <option value="lunch">Lunch Grid</option>
                      <option value="both">Both Meals</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                      Day of Violation
                    </label>
                    <select
                      value={blockDay}
                      onChange={(e) => setBlockDay(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white outline-none cursor-pointer"
                    >
                      {DAY_KEYS.map((k) => (
                        <option key={k} value={k}>
                          {DAY_NAMES[k].en}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Fine Amount Override */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Fine Amount (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                    <input
                      type="number"
                      value={customFineInput}
                      onChange={(e) => setCustomFineInput(e.target.value)}
                      placeholder={`Default for ${DAY_NAMES[blockDay].en} ${blockMeal}: ₹${getStudentFineAmount({ blockMeal, blockDay }, finePolicy)}`}
                      className="w-full pl-7 pr-3.5 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    Leave blank to use the standard policy rate (e.g., Friday Lunch is ₹200).
                  </p>
                </div>

                {/* Custom Note */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                    Additional Administrative Note
                  </label>
                  <textarea
                    rows={2}
                    value={customReasonNote}
                    onChange={(e) => setCustomReasonNote(e.target.value)}
                    placeholder="Specific remarks (e.g., missed Friday Biryani after active token)..."
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white outline-none resize-none"
                  />
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('roster')}
                    className="py-2.5 px-4 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={blockingInProgress}
                    className="py-2.5 px-5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/25 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Ban className="w-4 h-4" />
                    <span>{blockingInProgress ? 'Processing...' : 'Block Student(s)'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab 3: Timings & Fine Policy Settings Matrix */}
          {activeTab === 'settings' && (
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
                <div>
                  <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                    Campus Meal Timings & Fine Matrix
                  </h4>
                  <p className="text-xs text-gray-500">
                    Universal schedule fetched automatically by the menu and public displays.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleApplyStandardFines}
                    className="py-1.5 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Standard Preset</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveSettings}
                    disabled={savingSettings}
                    className="py-1.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{savingSettings ? 'Saving...' : 'Save Settings'}</span>
                  </button>
                </div>
              </div>

              {/* Day-by-Day Configuration Table */}
              <div className="space-y-3">
                {DAY_KEYS.map((dayKey) => {
                  const daySched = mealSchedule[dayKey] || DEFAULT_MEAL_SCHEDULE[dayKey];
                  const dayFine = finePolicy[dayKey] || DEFAULT_FINE_POLICY[dayKey];
                  const isFriday = dayKey === 'fr';

                  return (
                    <div
                      key={dayKey}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        isFriday
                          ? 'bg-purple-50/40 dark:bg-purple-950/15 border-purple-200 dark:border-purple-500/20'
                          : 'bg-white dark:bg-white/[0.02] border-gray-200/80 dark:border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-extrabold text-xs text-gray-900 dark:text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span>{DAY_NAMES[dayKey].en} ({DAY_NAMES[dayKey].ml})</span>
                          {isFriday && (
                            <span className="px-2 py-0.2 rounded text-[10px] font-black bg-purple-500 text-white">
                              Jumu&apos;ah Special
                            </span>
                          )}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* Breakfast Timing & Fine */}
                        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 space-y-2">
                          <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <Coffee className="w-3.5 h-3.5 text-amber-500" />
                            <span>Breakfast</span>
                          </span>

                          <div className="grid grid-cols-3 gap-1.5 text-xs">
                            <div>
                              <span className="text-[10px] text-gray-400 block">Start</span>
                              <input
                                type="time"
                                value={daySched.breakfast.startTime}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMealSchedule((prev) => ({
                                    ...prev,
                                    [dayKey]: {
                                      ...prev[dayKey],
                                      breakfast: {
                                        ...prev[dayKey].breakfast,
                                        startTime: val,
                                        label: formatMealTimeRange(val, prev[dayKey].breakfast.endTime),
                                      },
                                    },
                                  }));
                                }}
                                className="w-full py-1 px-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-mono font-bold"
                              />
                            </div>

                            <div>
                              <span className="text-[10px] text-gray-400 block">End</span>
                              <input
                                type="time"
                                value={daySched.breakfast.endTime}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMealSchedule((prev) => ({
                                    ...prev,
                                    [dayKey]: {
                                      ...prev[dayKey],
                                      breakfast: {
                                        ...prev[dayKey].breakfast,
                                        endTime: val,
                                        label: formatMealTimeRange(prev[dayKey].breakfast.startTime, val),
                                      },
                                    },
                                  }));
                                }}
                                className="w-full py-1 px-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-mono font-bold"
                              />
                            </div>

                            <div>
                              <span className="text-[10px] text-gray-400 block">Fine (₹)</span>
                              <input
                                type="number"
                                value={dayFine.breakfast}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setFinePolicy((prev) => ({
                                    ...prev,
                                    [dayKey]: {
                                      ...prev[dayKey],
                                      breakfast: val,
                                    },
                                  }));
                                }}
                                className="w-full py-1 px-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-mono font-bold text-rose-600 dark:text-rose-400"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Lunch Timing & Fine */}
                        <div className="p-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 space-y-2">
                          <span className="text-[11px] font-bold text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" />
                            <span>Lunch</span>
                          </span>

                          <div className="grid grid-cols-3 gap-1.5 text-xs">
                            <div>
                              <span className="text-[10px] text-gray-400 block">Start</span>
                              <input
                                type="time"
                                value={daySched.lunch.startTime}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMealSchedule((prev) => ({
                                    ...prev,
                                    [dayKey]: {
                                      ...prev[dayKey],
                                      lunch: {
                                        ...prev[dayKey].lunch,
                                        startTime: val,
                                        label: formatMealTimeRange(val, prev[dayKey].lunch.endTime),
                                      },
                                    },
                                  }));
                                }}
                                className="w-full py-1 px-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-mono font-bold"
                              />
                            </div>

                            <div>
                              <span className="text-[10px] text-gray-400 block">End</span>
                              <input
                                type="time"
                                value={daySched.lunch.endTime}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setMealSchedule((prev) => ({
                                    ...prev,
                                    [dayKey]: {
                                      ...prev[dayKey],
                                      lunch: {
                                        ...prev[dayKey].lunch,
                                        endTime: val,
                                        label: formatMealTimeRange(prev[dayKey].lunch.startTime, val),
                                      },
                                    },
                                  }));
                                }}
                                className="w-full py-1 px-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-mono font-bold"
                              />
                            </div>

                            <div>
                              <span className="text-[10px] text-gray-400 block">Fine (₹)</span>
                              <input
                                type="number"
                                value={dayFine.lunch}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setFinePolicy((prev) => ({
                                    ...prev,
                                    [dayKey]: {
                                      ...prev[dayKey],
                                      lunch: val,
                                    },
                                  }));
                                }}
                                className="w-full py-1 px-1.5 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-xs font-mono font-bold text-rose-600 dark:text-rose-400"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
