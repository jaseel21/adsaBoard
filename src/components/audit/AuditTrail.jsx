import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Activity,
  Download,
  RotateCcw,
  Sliders,
  Users,
  AlertTriangle,
  ArrowLeft,
  Sparkles,
  Inbox,
  Flame,
  ChevronUp,
} from 'lucide-react';
import {
  subscribeAuditLogs,
  AUDIT_CATEGORIES,
  AUDIT_SEVERITIES,
} from '../../utils/auditLogger';
import { useFeedback } from '../../utils/useFeedback';
import AuditCard from './AuditCard';
import AuditFilterBar from './AuditFilterBar';
import AuditTimelineScrubber from './AuditTimelineScrubber';
import AuditInspectorDrawer from './AuditInspectorDrawer';
import AuditExportModal from './AuditExportModal';

export default function AuditTrail() {
  const navigate = useNavigate();
  const { feedback } = useFeedback();

  // State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedActorRole, setSelectedActorRole] = useState('all');
  const [selectedBucketIndex, setSelectedBucketIndex] = useState(null);
  const [selectedBucketLogs, setSelectedBucketLogs] = useState(null);

  // Inspector & Export Modals
  const [inspectingLog, setInspectingLog] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);

  // Real-time listener
  useEffect(() => {
    setLoading(true);

    const unsub = subscribeAuditLogs(
      (allLogs) => {
        setLogs(allLogs);
        setLoading(false);
      },
      (err) => {
        console.error('Audit trail subscription error:', err);
        setLoading(false);
      },
      { limitCount: 200 }
    );

    return () => unsub();
  }, []);

  // Compute Category Counts
  const countsByCategory = useMemo(() => {
    const counts = {
      total: logs.length,
      [AUDIT_CATEGORIES.CANTEEN]: 0,
      [AUDIT_CATEGORIES.TOKENS]: 0,
      [AUDIT_CATEGORIES.STUDENTS]: 0,
      [AUDIT_CATEGORIES.MENU]: 0,
      [AUDIT_CATEGORIES.DIETARY]: 0,
      [AUDIT_CATEGORIES.SECURITY]: 0,
      [AUDIT_CATEGORIES.SYSTEM]: 0,
    };

    logs.forEach((log) => {
      if (counts[log.category] !== undefined) {
        counts[log.category]++;
      }
    });

    return counts;
  }, [logs]);

  // Compute Quick Stats
  const stats = useMemo(() => {
    const now = Date.now();
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    let todayCount = 0;
    let criticalCount = 0;
    const actorSet = new Set();

    logs.forEach((l) => {
      const t = new Date(l.timestamp).getTime();
      if (t >= startOfToday) todayCount++;
      if (l.severity === AUDIT_SEVERITIES.CRITICAL || l.severity === AUDIT_SEVERITIES.EMERGENCY) {
        criticalCount++;
      }
      if (l.actor?.email || l.actor?.uid) {
        actorSet.add(l.actor.email || l.actor.uid);
      }
    });

    return {
      total: logs.length,
      today: todayCount,
      critical: criticalCount,
      uniqueActors: actorSet.size,
    };
  }, [logs]);

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    let result = logs;

    // Filter by timeline bucket if selected
    if (selectedBucketLogs) {
      const bucketLogIds = new Set(selectedBucketLogs.map((l) => l.id));
      result = result.filter((l) => bucketLogIds.has(l.id));
    }

    // Category filter
    if (selectedCategory !== 'all') {
      result = result.filter((l) => l.category === selectedCategory);
    }

    // Severity filter
    if (selectedSeverity !== 'all') {
      result = result.filter((l) => l.severity === selectedSeverity);
    }

    // Actor Role filter
    if (selectedActorRole !== 'all') {
      result = result.filter((l) => l.actor?.role === selectedActorRole);
    }

    // Omni Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((l) => {
        return (
          l.action?.toLowerCase().includes(q) ||
          l.category?.toLowerCase().includes(q) ||
          l.actor?.displayName?.toLowerCase().includes(q) ||
          l.actor?.email?.toLowerCase().includes(q) ||
          String(l.actor?.tokenNo || '').includes(q) ||
          l.target?.label?.toLowerCase().includes(q) ||
          String(l.target?.tokenNo || '').includes(q) ||
          l.changes?.diffSummary?.toLowerCase().includes(q) ||
          l.metadata?.reason?.toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [
    logs,
    selectedBucketLogs,
    selectedCategory,
    selectedSeverity,
    selectedActorRole,
    searchQuery,
  ]);

  const handleResetFilters = () => {
    feedback('tick');
    setSearchQuery('');
    setSelectedCategory('all');
    setSelectedSeverity('all');
    setSelectedActorRole('all');
    setSelectedBucketIndex(null);
    setSelectedBucketLogs(null);
  };

  const scrollToTop = () => {
    feedback('pop');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-6">
      {/* Top Breadcrumb & Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                feedback('tick');
                navigate('/admin');
              }}
              className="p-1.5 rounded-xl bg-gray-100 hover:bg-emerald-50 dark:bg-white/5 dark:hover:bg-emerald-950/30 text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors"
              title="Return to Master Board"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-500" />
              <h1 className="text-lg sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                ADSA Command Radar • Audit Ledger
              </h1>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 pl-8">
            Real-time, cryptographically auditable record of committee state changes, cutoff shifts & student updates.
          </p>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto pl-8 sm:pl-0">
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              setShowExportModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report (PDF / CSV)</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Total Events */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Recorded</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white font-mono">
            {stats.total}
          </div>
          <span className="text-[10px] text-gray-400 font-medium">Synced with Firestore</span>
        </div>

        {/* Today's Actions */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Today (IST)</span>
            <Sparkles className="w-4 h-4 text-cyan-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white font-mono">
            {stats.today}
          </div>
          <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-medium">Active today</span>
        </div>

        {/* Critical Alerts */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Critical Events</span>
            <Flame className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white font-mono">
            {stats.critical}
          </div>
          <span className="text-[10px] text-rose-500 font-medium">Freezes & Blocks</span>
        </div>

        {/* Active Admins / Actors */}
        <div className="p-3.5 sm:p-4 rounded-2xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Actors</span>
            <Users className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white font-mono">
            {stats.uniqueActors}
          </div>
          <span className="text-[10px] text-blue-500 font-medium">Distinct accounts</span>
        </div>
      </div>

      {/* Activity Velocity Timeline Scrubber */}
      <AuditTimelineScrubber
        logs={logs}
        selectedBucketIndex={selectedBucketIndex}
        onSelectBucket={(idx, bucket) => {
          setSelectedBucketIndex(idx);
          setSelectedBucketLogs(bucket ? bucket.logs : null);
        }}
        onResetBucket={() => {
          setSelectedBucketIndex(null);
          setSelectedBucketLogs(null);
        }}
        onHapticFeedback={feedback}
      />

      {/* Multi-Dimensional Filter Bar */}
      <AuditFilterBar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        selectedSeverity={selectedSeverity}
        onSelectSeverity={setSelectedSeverity}
        selectedActorRole={selectedActorRole}
        onSelectActorRole={setSelectedActorRole}
        countsByCategory={countsByCategory}
        isLiveStreaming={true}
        onResetFilters={handleResetFilters}
        onHapticFeedback={feedback}
      />

      {/* Stream Header & Active Count */}
      <div className="flex items-center justify-between px-1 text-xs text-gray-500 dark:text-gray-400 font-bold">
        <span>
          Showing <span className="text-emerald-600 dark:text-emerald-400 font-mono">{filteredLogs.length}</span> of{' '}
          <span className="font-mono">{logs.length}</span> recorded logs
        </span>
        {selectedBucketIndex !== null && (
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
            Time-filtered active
          </span>
        )}
      </div>

      {/* Audit Feed List */}
      <div className="space-y-3">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="flex space-x-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-3.5 h-3.5 rounded-full bg-emerald-500"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                />
              ))}
            </div>
            <p className="text-xs text-gray-400 font-semibold">Connecting to live audit feed...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/50 dark:bg-[#0f1715]/50 border border-dashed border-gray-300 dark:border-white/10 space-y-3">
            <Inbox className="w-10 h-10 text-gray-400 mx-auto" />
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                No matching audit logs found
              </h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Try widening your search keywords or resetting active category and severity filters.
              </p>
            </div>
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-xs font-bold text-gray-700 dark:text-gray-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          <motion.div
            layout
            className="space-y-3"
            initial="hidden"
            animate="visible"
            variants={{
              visible: { transition: { staggerChildren: 0.04 } },
            }}
          >
            <AnimatePresence mode="popLayout">
              {filteredLogs.map((log) => (
                <AuditCard
                  key={log.id}
                  log={log}
                  onInspect={(selected) => setInspectingLog(selected)}
                  onHapticFeedback={feedback}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Floating Scroll to Top button */}
      <button
        type="button"
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-30 p-3 rounded-2xl bg-white/90 dark:bg-[#14201c]/90 text-emerald-600 dark:text-emerald-400 shadow-xl border border-gray-200/80 dark:border-white/10 hover:scale-105 active:scale-95 transition-all backdrop-blur-xl"
        title="Scroll to Top"
      >
        <ChevronUp className="w-5 h-5" />
      </button>

      {/* Detail Inspector Drawer */}
      <AuditInspectorDrawer
        log={inspectingLog}
        isOpen={Boolean(inspectingLog)}
        onClose={() => setInspectingLog(null)}
        onHapticFeedback={feedback}
      />

      {/* Export Modal */}
      <AuditExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        logs={filteredLogs}
        onHapticFeedback={feedback}
      />
    </div>
  );
}
