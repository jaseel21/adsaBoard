import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  History,
  Printer,
  UtensilsCrossed,
  Sliders,
  Sparkles,
  ShieldAlert,
  Clock,
  User,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Search,
  Filter,
} from 'lucide-react';
import firebase from '../../firebase/config';
import { useFeedback } from '../../utils/useFeedback';
import { formatAuditTime, AUDIT_CATEGORIES } from '../../utils/auditLogger';

/**
 * Canteen & Supply Operations Activity Drawer
 * Provides committee administrators with a centralized real-time audit log
 * of all kitchen manifest prints, token status toggles, and dietary avoidance updates.
 */
export default function CanteenOpsActivityDrawer({
  isOpen,
  onClose,
  activeMeal = 'all',
  targetDateIST = null,
}) {
  const { feedback } = useFeedback();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all'); // 'all' | 'prints' | 'dietary' | 'tokens'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    // Subscribe to audit logs for canteen, dietary, and tokens
    const unsub = firebase
      .firestore()
      .collection('audit_logs')
      .where('category', 'in', [
        AUDIT_CATEGORIES.CANTEEN,
        AUDIT_CATEGORIES.DIETARY,
        AUDIT_CATEGORIES.TOKENS,
      ])
      .orderBy('timestamp', 'desc')
      .limit(80)
      .onSnapshot(
        (snap) => {
          const list = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setLogs(list);
          setLoading(false);
        },
        (err) => {
          console.warn('[CanteenOpsActivityDrawer] Query error:', err);
          // Fallback if composite index not yet built
          firebase
            .firestore()
            .collection('audit_logs')
            .orderBy('timestamp', 'desc')
            .limit(60)
            .get()
            .then((snap) => {
              const list = snap.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((l) =>
                  [AUDIT_CATEGORIES.CANTEEN, AUDIT_CATEGORIES.DIETARY, AUDIT_CATEGORIES.TOKENS].includes(
                    l.category
                  )
                );
              setLogs(list);
              setLoading(false);
            })
            .catch(() => setLoading(false));
        }
      );

    return () => unsub();
  }, [isOpen]);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // Type filter
      if (selectedFilter === 'prints') {
        if (!log.action?.includes('PRINT')) return false;
      } else if (selectedFilter === 'dietary') {
        if (log.category !== AUDIT_CATEGORIES.DIETARY) return false;
      } else if (selectedFilter === 'tokens') {
        if (log.category !== AUDIT_CATEGORIES.TOKENS) return false;
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const str = [
          log.action,
          log.changes?.diffSummary,
          log.actor?.displayName,
          log.actor?.email,
          log.target?.label,
          log.metadata?.meal,
          log.metadata?.targetDateIST,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        if (!str.includes(q)) return false;
      }

      return true;
    });
  }, [logs, selectedFilter, searchQuery]);

  if (!isOpen) return null;

  const handleClose = () => {
    feedback('pop');
    onClose();
  };

  const getActionBadge = (log) => {
    const action = log.action || '';
    if (action.includes('PRINT')) {
      const isReprint = action.includes('DUPLICATE') || action.includes('REPRINT');
      return {
        icon: Printer,
        color: isReprint
          ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-700/50'
          : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/50',
        label: isReprint ? 'Duplicate Print' : 'Manifest Print',
      };
    }
    if (log.category === AUDIT_CATEGORIES.DIETARY) {
      return {
        icon: UtensilsCrossed,
        color:
          'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700/50',
        label: 'Dietary Update',
      };
    }
    return {
      icon: Sliders,
      color:
        'bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700/50',
      label: 'Token Toggle',
    };
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl h-full bg-white dark:bg-[#0c1412] border-l border-gray-200/80 dark:border-white/10 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/5 flex items-center justify-between gap-3 bg-gray-50/70 dark:bg-white/5 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-extrabold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>Canteen & Supply Ops Log</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Real-time timeline of manifest prints, dietary edits, and token changes
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Controls: Search & Category Pills */}
          <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-white/5 space-y-2.5">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search token #, admin email, action..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 text-xs text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All Events', count: logs.length },
                {
                  id: 'prints',
                  label: 'Prints',
                  count: logs.filter((l) => l.action?.includes('PRINT')).length,
                },
                {
                  id: 'dietary',
                  label: 'Dietary Updates',
                  count: logs.filter((l) => l.category === AUDIT_CATEGORIES.DIETARY).length,
                },
                {
                  id: 'tokens',
                  label: 'Token Toggles',
                  count: logs.filter((l) => l.category === AUDIT_CATEGORIES.TOKENS).length,
                },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => {
                    feedback('tick');
                    setSelectedFilter(pill.id);
                  }}
                  className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all ${
                    selectedFilter === pill.id
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:text-gray-900'
                  }`}
                >
                  {pill.label} ({pill.count})
                </button>
              ))}
            </div>
          </div>

          {/* Timeline Feed */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-2">
                <div className="w-5 h-5 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                <span className="text-xs text-gray-400">Loading canteen ops log...</span>
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center space-y-2 text-gray-400">
                <CheckCircle2 className="w-8 h-8 opacity-40 text-emerald-500" />
                <p className="text-xs font-semibold">No canteen events match your filter</p>
              </div>
            ) : (
              filteredLogs.map((log) => {
                const badge = getActionBadge(log);
                const BadgeIcon = badge.icon;
                const actorName =
                  log.actor?.displayName || log.actor?.email?.split('@')[0] || 'User';

                return (
                  <motion.div
                    key={log.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3.5 rounded-2xl bg-gray-50/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 space-y-2 hover:border-emerald-500/30 transition-all text-xs"
                  >
                    {/* Top Row: Badge + Time */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${badge.color}`}
                      >
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>

                      <div className="flex items-center gap-1 text-[11px] text-gray-400">
                        <Clock className="w-3 h-3" />
                        <span>{formatAuditTime(log.timestamp)}</span>
                      </div>
                    </div>

                    {/* Diff / Summary */}
                    <p className="font-semibold text-gray-900 dark:text-white leading-snug">
                      {log.changes?.diffSummary || log.target?.label || log.action}
                    </p>

                    {/* Footer Details: Actor & Meta */}
                    <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-200/40 dark:border-white/5">
                      <div className="flex items-center gap-1 truncate max-w-[240px]">
                        <User className="w-3 h-3 shrink-0" />
                        <span className="truncate">
                          By: <strong>{actorName}</strong> ({log.actor?.role || 'staff'})
                        </span>
                      </div>

                      {log.metadata?.revision && (
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          Rev {log.metadata.revision}
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
