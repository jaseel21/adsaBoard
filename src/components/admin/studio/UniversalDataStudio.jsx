import React, { useState, useMemo, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  Download,
  Upload,
  UserPlus,
  RefreshCw,
  Layers,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  RotateCw,
  Utensils,
  Coffee,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import VirtualizedEntityGrid from './VirtualizedEntityGrid';
import BulkDispatcherBar from './BulkDispatcherBar';
import StudentDrawer from '../../StudentDrawer';
import StudentDetailCalendarModal from '../../ui/StudentDetailCalendarModal';
import { useOperationHistory } from '../../../hooks/useOperationHistory';
import { AuthContext } from '../../../store/AuthContext';
import { useLanguage } from '../../../store/LanguageContext';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';
import { dialog } from '../../../utils/dialog';
import firebase from '../../../firebase/config';
import Papa from 'papaparse';

export default function UniversalDataStudio({
  students = [],
  preferencesList = [],
  allBatches = [],
  targetDateIST,
  effectiveDay = 'su',
  onStudentSaved,
  onStudentDeleted,
}) {
  const { user, isCentralCommittee } = useContext(AuthContext);
  const { t } = useLanguage();

  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL'); // 'ALL' | 'ACTIVE' | 'BLOCKED'

  // Selection Set (Document IDs)
  const [selectedIds, setSelectedIds] = useState(new Set());

  // Modal / Drawer state
  const [drawerStudent, setDrawerStudent] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [calendarStudent, setCalendarStudent] = useState(null);

  // Reversible Undo / Redo Hook
  const { canUndo, canRedo, undo, redo, lastOperation, pushAndExecute } = useOperationHistory();

  // Filter students based on search, batch, and status
  const filteredStudents = useMemo(() => {
    return students.filter((st) => {
      // Search Match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const tokenMatch = String(st.tokenNo || '').includes(q);
        const nameMatch = (st.name || '').toLowerCase().includes(q);
        const malMatch = (st.nameMl || st.malName || '').toLowerCase().includes(q);
        const roomMatch = (st.roomNo || '').toLowerCase().includes(q);
        if (!tokenMatch && !nameMatch && !malMatch && !roomMatch) return false;
      }

      // Batch Match
      if (selectedBatch !== 'ALL' && st.batch !== selectedBatch) {
        return false;
      }

      // Status Match
      if (selectedStatus === 'ACTIVE' && st.block) return false;
      if (selectedStatus === 'BLOCKED' && !st.block) return false;

      return true;
    });
  }, [students, searchQuery, selectedBatch, selectedStatus]);

  // Selection Handlers
  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAll = () => {
    const allFilteredIds = new Set(filteredStudents.map((s) => s.id));
    setSelectedIds(allFilteredIds);
  };

  const handleClearAll = () => {
    setSelectedIds(new Set());
  };

  // Reversible Single Field Edit (e.g. name, batch, block status)
  const handleUpdateField = async (studentId, field, newVal) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const prevVal = student[field];
    const studentRef = firebase.firestore().collection('students').doc(studentId);

    await pushAndExecute({
      description: `Update token #${student.tokenNo} ${field} to "${newVal}"`,
      execute: async () => {
        await studentRef.update({
          [field]: newVal,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      },
      rollback: async () => {
        await studentRef.update({
          [field]: prevVal === undefined ? firebase.firestore.FieldValue.delete() : prevVal,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      },
    });
  };

  // Reversible Meal Toggle (Updates exception for targetDateIST or weekly default)
  const handleToggleMealStatus = async (studentId, mealKey, newVal) => {
    const student = students.find((s) => s.id === studentId);
    if (!student) return;

    const studentRef = firebase.firestore().collection('students').doc(studentId);
    const prevExceptions = { ...(student.dateExceptions || {}) };
    const prevDateMeal = prevExceptions[targetDateIST]?.[mealKey];

    const nextExceptions = {
      ...prevExceptions,
      [targetDateIST]: {
        ...(prevExceptions[targetDateIST] || {}),
        [mealKey]: newVal,
      },
    };

    await pushAndExecute({
      description: `Toggle token #${student.tokenNo} ${mealKey} -> ${newVal ? 'ON' : 'OFF'}`,
      execute: async () => {
        await studentRef.update({
          dateExceptions: nextExceptions,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      },
      rollback: async () => {
        await studentRef.update({
          dateExceptions: prevExceptions,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      },
    });
  };

  // Bulk Actions
  const handleBulkToggleMeal = async (mealKey) => {
    const targetStudents = students.filter((s) => selectedIds.has(s.id));
    if (targetStudents.length === 0) return;

    const confirmed = await dialog.confirm({
      title: `Bulk Toggle ${mealKey.toUpperCase()}?`,
      message: `Toggle ${mealKey} status for all ${targetStudents.length} selected students on ${targetDateIST}?`,
      confirmLabel: 'Apply Bulk Toggle',
      tone: 'primary',
    });
    if (!confirmed) return;

    const db = firebase.firestore();
    const batch = db.batch();
    const rollbackMap = {};

    targetStudents.forEach((st) => {
      const prevExc = { ...(st.dateExceptions || {}) };
      rollbackMap[st.id] = prevExc;

      const currentVal = prevExc[targetDateIST]?.[mealKey] !== undefined
        ? prevExc[targetDateIST][mealKey]
        : Boolean(st.obj?.[mealKey]?.[effectiveDay]);

      const nextVal = !currentVal;

      const nextExc = {
        ...prevExc,
        [targetDateIST]: {
          ...(prevExc[targetDateIST] || {}),
          [mealKey]: nextVal,
        },
      };

      const ref = db.collection('students').doc(st.id);
      batch.update(ref, {
        dateExceptions: nextExc,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    });

    await pushAndExecute({
      description: `Bulk toggle ${mealKey} for ${targetStudents.length} students`,
      execute: async () => {
        await batch.commit();
      },
      rollback: async () => {
        const rbBatch = db.batch();
        Object.keys(rollbackMap).forEach((stId) => {
          const ref = db.collection('students').doc(stId);
          rbBatch.update(ref, {
            dateExceptions: rollbackMap[stId],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        });
        await rbBatch.commit();
      },
    });

    soundEngine.playSoftChime();
    hapticEngine.successPulse();
  };

  const handleBulkChangeBatch = async (newBatchName) => {
    const targetStudents = students.filter((s) => selectedIds.has(s.id));
    if (targetStudents.length === 0) return;

    const db = firebase.firestore();
    const batch = db.batch();
    const rollbackBatches = {};

    targetStudents.forEach((st) => {
      rollbackBatches[st.id] = st.batch || '';
      const ref = db.collection('students').doc(st.id);
      batch.update(ref, {
        batch: newBatchName,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    });

    await pushAndExecute({
      description: `Moved ${targetStudents.length} students to batch "${newBatchName}"`,
      execute: async () => {
        await batch.commit();
      },
      rollback: async () => {
        const rbBatch = db.batch();
        Object.keys(rollbackBatches).forEach((stId) => {
          const ref = db.collection('students').doc(stId);
          rbBatch.update(ref, {
            batch: rollbackBatches[stId],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        });
        await rbBatch.commit();
      },
    });

    soundEngine.playSoftChime();
    hapticEngine.successPulse();
  };

  const handleBulkChangeStatus = async () => {
    const targetStudents = students.filter((s) => selectedIds.has(s.id));
    if (targetStudents.length === 0) return;

    const confirmed = await dialog.confirm({
      title: 'Bulk Toggle Block Status?',
      message: `Invert active/blocked status for all ${targetStudents.length} selected students?`,
      confirmLabel: 'Invert Status',
      tone: 'warning',
    });
    if (!confirmed) return;

    const db = firebase.firestore();
    const batch = db.batch();
    const rollbackStatus = {};

    targetStudents.forEach((st) => {
      rollbackStatus[st.id] = Boolean(st.block);
      const nextBlock = !st.block;
      const ref = db.collection('students').doc(st.id);
      batch.update(ref, {
        block: nextBlock,
        blockReason: nextBlock ? 'Bulk Administrative Freeze' : null,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
    });

    await pushAndExecute({
      description: `Bulk status shift for ${targetStudents.length} students`,
      execute: async () => {
        await batch.commit();
      },
      rollback: async () => {
        const rbBatch = db.batch();
        Object.keys(rollbackStatus).forEach((stId) => {
          const ref = db.collection('students').doc(stId);
          rbBatch.update(ref, {
            block: rollbackStatus[stId],
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          });
        });
        await rbBatch.commit();
      },
    });

    soundEngine.playSoftChime();
    hapticEngine.successPulse();
  };

  // CSV Export for filtered / selected students
  const handleExportCsv = (onlySelected = false) => {
    const dataToExport = onlySelected
      ? students.filter((s) => selectedIds.has(s.id))
      : filteredStudents;

    if (dataToExport.length === 0) return;

    soundEngine.playPop();
    const rows = dataToExport.map((s) => ({
      TokenNo: s.tokenNo,
      NameEn: s.name,
      NameMl: s.nameMl || s.malName || '',
      Batch: s.batch || '',
      RoomNo: s.roomNo || '',
      ContactPhone: s.phone || '',
      Status: s.block ? 'Blocked' : 'Active',
      LunchActive: Boolean(s.obj?.lunch?.[effectiveDay]),
      BreakfastActive: Boolean(s.obj?.breakfast?.[effectiveDay]),
    }));

    const csvContent = Papa.unparse(rows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `adsa_students_${onlySelected ? 'selected' : 'roster'}_${targetDateIST}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="space-y-4 w-full">
      {/* Top Filter & Tooling Strip */}
      <div className="p-4 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0c1411]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Quick search by token, student name, Malayalam name, or room..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Right: Filters & Tools */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Batch Selector */}
          <select
            value={selectedBatch}
            onChange={(e) => {
              soundEngine.playPop();
              setSelectedBatch(e.target.value);
            }}
            className="text-xs px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Batches</option>
            {allBatches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* Status Selector */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              soundEngine.playPop();
              setSelectedStatus(e.target.value);
            }}
            className="text-xs px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active Dining Only</option>
            <option value="BLOCKED">Blocked Only</option>
          </select>

          {/* CSV Export Button */}
          <button
            type="button"
            onClick={() => handleExportCsv(false)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 shadow-xs flex items-center gap-2 transition-all active:scale-95"
            title="Export filtered roster to CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Virtualized Entity Grid */}
      <VirtualizedEntityGrid
        students={filteredStudents}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onClearAll={handleClearAll}
        onUpdateField={handleUpdateField}
        onToggleMealStatus={handleToggleMealStatus}
        onOpenDrawer={(st) => {
          setDrawerStudent(st);
          setIsDrawerOpen(true);
        }}
        onOpenCalendar={(st) => {
          setCalendarStudent(st);
        }}
        targetDateIST={targetDateIST}
        effectiveDay={effectiveDay}
        allBatches={allBatches}
        preferencesList={preferencesList}
        isCentralCommittee={isCentralCommittee}
      />

      {/* Floating Tactical Bulk Dispatcher Bar */}
      <BulkDispatcherBar
        selectedCount={selectedIds.size}
        onClearSelection={handleClearAll}
        onBulkToggleMeal={handleBulkToggleMeal}
        onBulkChangeBatch={handleBulkChangeBatch}
        onBulkChangeStatus={handleBulkChangeStatus}
        onBulkExportCsv={() => handleExportCsv(true)}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        lastOperation={lastOperation}
        allBatches={allBatches}
      />

      {/* Full Profile Drawer */}
      <StudentDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setDrawerStudent(null);
        }}
        student={drawerStudent}
        existingTokens={students.map((s) => s.tokenNo)}
        existingBatches={allBatches}
        onSaved={(updated) => {
          if (onStudentSaved) onStudentSaved(updated);
        }}
        onDeleted={(deletedId) => {
          if (onStudentDeleted) onStudentDeleted(deletedId);
        }}
      />

      {/* Individual Attendance Calendar Modal */}
      {calendarStudent && (
        <StudentDetailCalendarModal
          isOpen={Boolean(calendarStudent)}
          onClose={() => setCalendarStudent(null)}
          student={calendarStudent}
          currentDateIST={targetDateIST}
        />
      )}
    </div>
  );
}
