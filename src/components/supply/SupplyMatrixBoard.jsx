import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Utensils,
  Heart,
  ChevronRight,
  Eye,
  Layers,
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { getEffectiveStudentMealStatus } from '../../utils/studentExceptionService';

export default function SupplyMatrixBoard({
  documents = [],
  servedMap = new Map(),
  meal = 'lunch',
  targetDateIST,
  effectiveDay,
  chunkSize = 25,
  onServe,
  onUnserve,
  onOpenGraceModal,
  onInspectDispute,
  soundEnabled = true,
  hapticEnabled = true,
  highContrast = false,
}) {
  const [filterMode, setFilterMode] = useState('ALL'); // 'ALL' | 'UNSERVED' | 'SERVED' | 'AVOIDERS' | 'DIETARY'
  const [groupingMode, setGroupingMode] = useState('sections'); // 'sections' | 'batches' | 'all'
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSectionId, setActiveSectionId] = useState(1);
  const [selectedTokenDetail, setSelectedTokenDetail] = useState(null);

  // Audio helpers
  const playClick = useCallback(() => {
    if (soundEnabled) soundEngine.playMechanicalClick();
    if (hapticEnabled) hapticEngine.lightTap();
  }, [soundEnabled, hapticEnabled]);

  const playApproved = useCallback(() => {
    if (soundEnabled) soundEngine.playServingApprovedChime();
    if (hapticEnabled) hapticEngine.servingApproved();
  }, [soundEnabled, hapticEnabled]);

  const playWarning = useCallback(() => {
    if (soundEnabled) soundEngine.playAvoiderWarningTone();
    if (hapticEnabled) hapticEngine.avoiderWarning();
  }, [soundEnabled, hapticEnabled]);

  // Compute status for all student documents
  const enrichedStudents = useMemo(() => {
    return documents.map((student) => {
      const tokenNo = Number(student.tokenNo);
      const isEligible = getEffectiveStudentMealStatus(
        student,
        targetDateIST,
        effectiveDay,
        meal
      );
      const servedRecord = servedMap.get(tokenNo) || null;

      // Check dietary avoidances
      const d = student.obj2 || {};
      const hasDietaryAvoidance =
        d.fish === false || d.beef === false || d.chicken === false || d.mutton === false;

      let status = 'ELIGIBLE_UNSERVED';
      if (servedRecord) {
        status = 'SERVED';
      } else if (!isEligible) {
        status = 'AVOIDER';
      }

      return {
        ...student,
        tokenNo,
        isEligible,
        servedRecord,
        hasDietaryAvoidance,
        status,
      };
    });
  }, [documents, servedMap, targetDateIST, effectiveDay, meal]);

  // Filtered students by search & filter chip
  const filteredStudents = useMemo(() => {
    let result = enrichedStudents;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          String(s.tokenNo).includes(q) ||
          (s.uname && s.uname.toLowerCase().includes(q)) ||
          (s.name && s.name.toLowerCase().includes(q)) ||
          (s.batch && s.batch.toLowerCase().includes(q))
      );
    }

    // Filter mode
    if (filterMode === 'UNSERVED') {
      result = result.filter((s) => s.status === 'ELIGIBLE_UNSERVED');
    } else if (filterMode === 'SERVED') {
      result = result.filter((s) => s.status === 'SERVED');
    } else if (filterMode === 'AVOIDERS') {
      result = result.filter((s) => s.status === 'AVOIDER');
    } else if (filterMode === 'DIETARY') {
      result = result.filter((s) => s.hasDietaryAvoidance);
    }

    return result;
  }, [enrichedStudents, searchQuery, filterMode]);

  // Dynamic chunk sections
  const sections = useMemo(() => {
    if (groupingMode === 'batches') {
      const batches = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4', 'Batch 5', 'Batch 6', 'Batch 7'];
      return batches.map((bName, idx) => {
        const slice = enrichedStudents.filter((s) => s.batch === bName);
        const servedCount = slice.filter((s) => s.status === 'SERVED').length;
        const eligibleCount = slice.filter((s) => s.isEligible).length;
        return {
          id: idx + 1,
          name: bName,
          students: slice,
          servedCount,
          eligibleCount,
          total: slice.length,
        };
      });
    }

    if (groupingMode === 'all') {
      const servedCount = enrichedStudents.filter((s) => s.status === 'SERVED').length;
      const eligibleCount = enrichedStudents.filter((s) => s.isEligible).length;
      return [
        {
          id: 1,
          name: 'All Tokens',
          students: enrichedStudents,
          servedCount,
          eligibleCount,
          total: enrichedStudents.length,
        },
      ];
    }

    // Default 'sections' mode (1-25, 26-50, etc.)
    const size = Number(chunkSize) || 25;
    const totalSections = Math.ceil(enrichedStudents.length / size) || 1;
    const result = [];

    for (let i = 0; i < totalSections; i++) {
      const start = i * size;
      const end = Math.min((i + 1) * size, enrichedStudents.length);
      const slice = enrichedStudents.slice(start, end);
      const servedCount = slice.filter((s) => s.status === 'SERVED').length;
      const eligibleCount = slice.filter((s) => s.isEligible).length;
      const range = slice.length > 0 ? `${slice[0].tokenNo} - ${slice[slice.length - 1].tokenNo}` : '';

      result.push({
        id: i + 1,
        name: `Section ${i + 1}`,
        range,
        students: slice,
        servedCount,
        eligibleCount,
        total: slice.length,
      });
    }

    return result;
  }, [enrichedStudents, groupingMode, chunkSize]);

  // Current active slice to display
  const currentSection = useMemo(() => {
    return sections.find((s) => s.id === activeSectionId) || sections[0] || null;
  }, [sections, activeSectionId]);

  // Visible students in matrix
  const displayedStudents = useMemo(() => {
    if (searchQuery.trim() || filterMode !== 'ALL') {
      return filteredStudents;
    }
    return currentSection ? currentSection.students : filteredStudents;
  }, [searchQuery, filterMode, filteredStudents, currentSection]);

  // Handle clicking a token card
  const handleTokenClick = (student) => {
    playClick();
    if (student.status === 'ELIGIBLE_UNSERVED') {
      // 1-tap instant serve!
      playApproved();
      onServe(student.tokenNo, student, 'matrix');
    } else {
      // Open inspection drawer / modal
      setSelectedTokenDetail(student);
    }
  };

  return (
    <div className="w-full flex flex-col space-y-4">
      {/* FILTER & GROUPING CONTROLS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0c1411] border border-gray-200 dark:border-emerald-900/30 shadow-sm">
        {/* SEARCH BAR */}
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Token # or Name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-[#060a08] border border-gray-200 dark:border-emerald-900/40 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* STATUS FILTER PILLS */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'ALL', label: 'All' },
            { id: 'UNSERVED', label: 'Unserved', color: 'emerald' },
            { id: 'SERVED', label: 'Served', color: 'purple' },
            { id: 'AVOIDERS', label: 'Token OFF', color: 'rose' },
            { id: 'DIETARY', label: 'Dietary', color: 'amber' },
          ].map((chip) => {
            const isActive = filterMode === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => {
                  playClick();
                  setFilterMode(chip.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>

        {/* GROUPING TOGGLE */}
        <div className="flex items-center space-x-1 p-1 rounded-xl bg-gray-100 dark:bg-[#060a08] border border-gray-200 dark:border-emerald-900/40">
          <button
            onClick={() => {
              playClick();
              setGroupingMode('sections');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              groupingMode === 'sections'
                ? 'bg-white dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Sections
          </button>
          <button
            onClick={() => {
              playClick();
              setGroupingMode('batches');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              groupingMode === 'batches'
                ? 'bg-white dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Batches
          </button>
          <button
            onClick={() => {
              playClick();
              setGroupingMode('all');
            }}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
              groupingMode === 'all'
                ? 'bg-white dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* SECTION TABS (Only when not in full search mode and grouping is sections or batches) */}
      {!searchQuery && groupingMode !== 'all' && (
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {sections.map((sec) => {
            const isActive = sec.id === activeSectionId;
            return (
              <button
                key={sec.id}
                onClick={() => {
                  playClick();
                  setActiveSectionId(sec.id);
                }}
                className={`flex-shrink-0 px-4 py-2 rounded-2xl border text-xs font-bold transition-all cursor-pointer flex items-center space-x-2 ${
                  isActive
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/20'
                    : 'bg-white dark:bg-[#0c1411] border-gray-200 dark:border-emerald-900/30 text-gray-700 dark:text-gray-300 hover:border-emerald-400'
                }`}
              >
                <span>{sec.name}</span>
                {sec.range && <span className="opacity-75 font-mono text-[10px]">[{sec.range}]</span>}
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${
                    isActive
                      ? 'bg-emerald-700 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
                  }`}
                >
                  {sec.servedCount}/{sec.eligibleCount}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* MAIN KEYCAP MATRIX GRID */}
      <div className="p-4 sm:p-6 rounded-3xl bg-white/70 dark:bg-[#0a120e]/80 backdrop-blur-md border border-gray-200 dark:border-emerald-900/30 shadow-xl">
        {displayedStudents.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <Utensils className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No tokens match the active filter or section.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2.5 sm:gap-3">
            {displayedStudents.map((student) => {
              const { status, tokenNo } = student;

              // Styles per status
              let cardStyle =
                'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 border-emerald-300 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-200';
              let badge = null;

              if (status === 'SERVED') {
                cardStyle =
                  'bg-slate-100 dark:bg-[#121c22] border-slate-300 dark:border-slate-800 text-slate-500 dark:text-slate-400 opacity-70';
                badge = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
              } else if (status === 'AVOIDER') {
                cardStyle =
                  'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 border-rose-300 dark:border-rose-800/50 text-rose-900 dark:text-rose-300';
                badge = <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />;
              }

              return (
                <motion.button
                  key={tokenNo}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleTokenClick(student)}
                  className={`relative p-2.5 sm:p-3 rounded-2xl border flex flex-col items-center justify-between min-h-[76px] sm:min-h-[82px] cursor-pointer transition-all shadow-sm ${cardStyle}`}
                >
                  {/* Top Badge Icons */}
                  <div className="w-full flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold opacity-60">
                      {student.batch ? student.batch.replace('Batch ', 'B') : ''}
                    </span>
                    {badge}
                  </div>

                  {/* Big Bold Token Number */}
                  <div className="text-xl sm:text-2xl font-black font-mono tracking-tight my-0.5">
                    {tokenNo}
                  </div>

                  {/* Student Small Name / Time */}
                  <div className="w-full text-center truncate text-[10px] font-medium leading-none opacity-80">
                    {status === 'SERVED'
                      ? 'Served'
                      : status === 'AVOIDER'
                      ? 'Avoider'
                      : student.uname?.split(' ')[0] || 'Ready'}
                  </div>

                  {/* Dietary indicator dot */}
                  {student.hasDietaryAvoidance && (
                    <span
                      className="w-1.5 h-1.5 rounded-full bg-amber-500 absolute top-1.5 right-1.5"
                      title="Dietary Avoidance Active"
                    />
                  )}
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* TOKEN DETAIL POPOVER MODAL (When clicking a served or avoider card) */}
      <AnimatePresence>
        {selectedTokenDetail && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedTokenDetail(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md p-6 rounded-3xl bg-white dark:bg-[#0c1411] border border-gray-200 dark:border-emerald-900/40 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-emerald-900/30">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                    #{selectedTokenDetail.tokenNo}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      selectedTokenDetail.status === 'SERVED'
                        ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                        : selectedTokenDetail.status === 'AVOIDER'
                        ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                        : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                    }`}
                  >
                    {selectedTokenDetail.status}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTokenDetail(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {selectedTokenDetail.uname || selectedTokenDetail.name}
                </h3>
                <p className="text-xs text-gray-500">{selectedTokenDetail.batch || 'Dars Student'}</p>
              </div>

              {selectedTokenDetail.servedRecord && (
                <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/40 text-xs text-purple-900 dark:text-purple-200 space-y-1">
                  <div>
                    <strong>Served Time:</strong>{' '}
                    {new Date(selectedTokenDetail.servedRecord.servedAtIso).toLocaleTimeString('en-IN')}
                  </div>
                  <div>
                    <strong>Served By:</strong>{' '}
                    {selectedTokenDetail.servedRecord.servedByName} (
                    {selectedTokenDetail.servedRecord.counterId})
                  </div>
                </div>
              )}

              {selectedTokenDetail.status === 'AVOIDER' && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/40 text-xs text-rose-900 dark:text-rose-200 leading-relaxed">
                  Token is currently turned OFF for {meal}. Food should not be taken without an active token.
                </div>
              )}

              {/* ACTION BUTTONS */}
              <div className="flex items-center space-x-2 pt-2">
                {selectedTokenDetail.status === 'SERVED' && (
                  <button
                    onClick={async () => {
                      await onUnserve(selectedTokenDetail.tokenNo, selectedTokenDetail);
                      setSelectedTokenDetail(null);
                    }}
                    className="flex-1 py-3 rounded-xl bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Undo Serving</span>
                  </button>
                )}

                {selectedTokenDetail.status === 'AVOIDER' && (
                  <button
                    onClick={() => {
                      const tNo = selectedTokenDetail.tokenNo;
                      const st = selectedTokenDetail;
                      setSelectedTokenDetail(null);
                      onOpenGraceModal(tNo, st);
                    }}
                    className="flex-1 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <Heart className="w-3.5 h-3.5" />
                    <span>Issue Grace Plate</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    const st = selectedTokenDetail;
                    setSelectedTokenDetail(null);
                    onInspectDispute(st);
                  }}
                  className="py-3 px-4 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold text-xs flex items-center justify-center space-x-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>History</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
