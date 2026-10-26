import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  CheckSquare,
  Square,
  MinusSquare,
  User,
  Coffee,
  Utensils,
  Ban,
  ShieldCheck,
  Calendar,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import InlineEditableCell from './InlineEditableCell';
import { getCategoryIcon } from '../../avoiders/dietaryIcons';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

export default function VirtualizedEntityGrid({
  students = [],
  selectedIds = new Set(),
  onToggleSelect,
  onSelectAll,
  onClearAll,
  onUpdateField,
  onToggleMealStatus,
  onOpenDrawer,
  onOpenCalendar,
  targetDateIST,
  effectiveDay = 'su',
  allBatches = [],
  preferencesList = [],
  isCentralCommittee = false,
}) {
  const [sortField, setSortField] = useState('tokenNo');
  const [sortAsc, setSortAsc] = useState(true);

  // Sorting
  const sortedStudents = useMemo(() => {
    const list = [...students];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'tokenNo') {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
      } else if (sortField === 'lunch' || sortField === 'breakfast') {
        valA = a.obj?.[sortField]?.[effectiveDay] ? 1 : 0;
        valB = b.obj?.[sortField]?.[effectiveDay] ? 1 : 0;
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
    return list;
  }, [students, sortField, sortAsc, effectiveDay]);

  const handleSort = (field) => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const isAllSelected = students.length > 0 && selectedIds.size === students.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < students.length;

  const batchOptions = useMemo(() => {
    return allBatches.map((b) => ({ value: b, label: b }));
  }, [allBatches]);

  const statusOptions = [
    { value: 'active', label: 'Active Dining' },
    { value: 'blocked', label: 'Blocked / Suspended' },
  ];

  return (
    <div className="w-full bg-white dark:bg-[#0c1411]/90 border border-gray-200/80 dark:border-white/10 rounded-2xl sm:rounded-3xl shadow-lg backdrop-blur-xl overflow-hidden flex flex-col">
      {/* Table Container */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[850px]">
          {/* Sticky Header */}
          <thead>
            <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/80 dark:bg-black/30 text-[11px] font-black uppercase text-gray-500 dark:text-gray-400 tracking-wider select-none">
              {/* Checkbox Header */}
              <th className="py-3.5 px-4 w-12 text-center">
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPop();
                    hapticEngine.lightTap();
                    if (isAllSelected) onClearAll();
                    else onSelectAll();
                  }}
                  className="flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:scale-110 transition-transform"
                >
                  {isAllSelected ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : isIndeterminate ? (
                    <MinusSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              </th>

              {/* Token */}
              <th
                onClick={() => handleSort('tokenNo')}
                className="py-3.5 px-3 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors w-20"
              >
                <div className="flex items-center gap-1">
                  <span>Token</span>
                  {sortField === 'tokenNo' ? (
                    sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>

              {/* Student Name */}
              <th
                onClick={() => handleSort('name')}
                className="py-3.5 px-4 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
              >
                <div className="flex items-center gap-1">
                  <span>Student Name</span>
                  {sortField === 'name' ? (
                    sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>

              {/* Batch */}
              <th
                onClick={() => handleSort('batch')}
                className="py-3.5 px-3 cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors w-36"
              >
                <div className="flex items-center gap-1">
                  <span>Batch</span>
                  {sortField === 'batch' ? (
                    sortAsc ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </div>
              </th>

              {/* Lunch Toggle */}
              <th className="py-3.5 px-3 text-center w-28">
                <div className="flex items-center justify-center gap-1 text-emerald-500 font-extrabold">
                  <Utensils className="w-3.5 h-3.5" />
                  <span>Lunch</span>
                </div>
              </th>

              {/* Breakfast Toggle */}
              <th className="py-3.5 px-3 text-center w-28">
                <div className="flex items-center justify-center gap-1 text-amber-500 font-extrabold">
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Breakfast</span>
                </div>
              </th>

              {/* Dietary Tags */}
              <th className="py-3.5 px-4 w-44">Dietary Constraints</th>

              {/* Status */}
              <th className="py-3.5 px-3 text-center w-28">Status</th>

              {/* Actions */}
              <th className="py-3.5 px-4 text-right w-20">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs">
            {sortedStudents.map((st) => {
              const isSelected = selectedIds.has(st.id);
              const isBlocked = Boolean(st.block);

              // Extract meal status for effectiveDay
              const lunchActive = Boolean(st.obj?.lunch?.[effectiveDay]);
              const breakfastActive = Boolean(st.obj?.breakfast?.[effectiveDay]);

              // Check if date-specific exception overrides this day
              const dateExc = st.dateExceptions?.[targetDateIST];
              const effectiveLunch = dateExc?.lunch !== undefined ? dateExc.lunch : lunchActive;
              const effectiveBreakfast = dateExc?.breakfast !== undefined ? dateExc.breakfast : breakfastActive;

              // Dietary tags list
              const dietaryNames = Object.keys(st.obj2 || {})
                .filter((prefId) => st.obj2[prefId])
                .map((prefId) => {
                  const found = preferencesList.find((p) => p.id === prefId);
                  return found ? found.name : prefId;
                });

              return (
                <tr
                  key={st.id}
                  className={`group transition-colors ${
                    isSelected
                      ? 'bg-emerald-500/10 dark:bg-emerald-950/25'
                      : isBlocked
                      ? 'bg-rose-500/[0.03] dark:bg-rose-950/10 hover:bg-gray-50/70 dark:hover:bg-white/[0.02]'
                      : 'hover:bg-gray-50/70 dark:hover:bg-white/[0.02]'
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playPop();
                        hapticEngine.lightTap();
                        onToggleSelect(st.id);
                      }}
                      className="text-gray-400 hover:text-emerald-500 transition-colors"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="w-4 h-4" />
                      )}
                    </button>
                  </td>

                  {/* Token Number */}
                  <td className="py-3 px-3">
                    <span className="font-mono font-black text-xs px-2.5 py-1 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-gray-200 border border-gray-200/60 dark:border-white/5">
                      {String(st.tokenNo).padStart(3, '0')}
                    </span>
                  </td>

                  {/* Student Name */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <InlineEditableCell
                        value={st.name}
                        type="text"
                        disabled={!isCentralCommittee}
                        onCommit={(newVal) => onUpdateField(st.id, 'name', newVal)}
                        className="font-bold text-gray-900 dark:text-white"
                      />
                      {(st.nameMl || st.malName) && (
                        <span className="text-[10px] text-gray-400 pl-2">
                          {st.nameMl || st.malName}
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Batch Dropdown */}
                  <td className="py-3 px-3">
                    <InlineEditableCell
                      value={st.batch || 'Unassigned'}
                      type="select"
                      options={batchOptions}
                      disabled={!isCentralCommittee}
                      onCommit={(newVal) => onUpdateField(st.id, 'batch', newVal)}
                      className="text-gray-600 dark:text-gray-300 font-medium"
                    />
                  </td>

                  {/* Lunch Toggle */}
                  <td className="py-3 px-3 text-center">
                    <InlineEditableCell
                      value={effectiveLunch}
                      type="toggle"
                      toggleColor="emerald"
                      toggleLabelOn="Lunch ON"
                      toggleLabelOff="OFF"
                      onCommit={(newVal) => onToggleMealStatus(st.id, 'lunch', newVal)}
                    />
                  </td>

                  {/* Breakfast Toggle */}
                  <td className="py-3 px-3 text-center">
                    <InlineEditableCell
                      value={effectiveBreakfast}
                      type="toggle"
                      toggleColor="amber"
                      toggleLabelOn="BF ON"
                      toggleLabelOff="OFF"
                      onCommit={(newVal) => onToggleMealStatus(st.id, 'breakfast', newVal)}
                    />
                  </td>

                  {/* Dietary Avoiders */}
                  <td className="py-3 px-4">
                    {dietaryNames.length === 0 ? (
                      <span className="text-gray-400 text-[11px]">Standard</span>
                    ) : (
                      <div className="flex items-center gap-1 flex-wrap">
                        {dietaryNames.slice(0, 2).map((dName, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20 truncate max-w-[100px]"
                          >
                            {dName}
                          </span>
                        ))}
                        {dietaryNames.length > 2 && (
                          <span className="text-[10px] text-teal-500 font-bold">
                            +{dietaryNames.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Block Status */}
                  <td className="py-3 px-3 text-center">
                    <InlineEditableCell
                      value={isBlocked ? 'blocked' : 'active'}
                      type="select"
                      options={statusOptions}
                      disabled={!isCentralCommittee}
                      onCommit={(newVal) => onUpdateField(st.id, 'block', newVal === 'blocked')}
                      className={
                        isBlocked
                          ? 'text-rose-600 dark:text-rose-400 font-bold bg-rose-500/10 rounded-md'
                          : 'text-emerald-600 dark:text-emerald-400 font-bold bg-emerald-500/10 rounded-md'
                      }
                    />
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playPop();
                          onOpenCalendar(st);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        title="View Attendance Calendar"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          soundEngine.playPop();
                          onOpenDrawer(st);
                        }}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-cyan-500 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        title="Open Full Profile Drawer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Grid Footer with Total Count */}
      <div className="p-4 bg-gray-50/80 dark:bg-black/20 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>Showing <strong className="text-gray-900 dark:text-white font-mono">{students.length}</strong> student records</span>
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          Click or double-click any cell to inline edit with auto-sync.
        </span>
      </div>
    </div>
  );
}
