import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { subscribeAuditLogs, formatAuditTime } from '../../utils/auditLogger';
import { useFeedback } from '../../utils/useFeedback';

export default function AuditLiveTicker({ onSelectLog }) {
  const navigate = useNavigate();
  const { feedback } = useFeedback();
  const [latestLog, setLatestLog] = useState(null);
  const [hasPulse, setHasPulse] = useState(false);

  useEffect(() => {
    // 1. Subscribe to latest Firestore entry
    const unsub = subscribeAuditLogs(
      (logs) => {
        if (logs.length > 0) {
          setLatestLog(logs[0]);
          setHasPulse(true);
          const t = setTimeout(() => setHasPulse(false), 2500);
          return () => clearTimeout(t);
        }
      },
      null,
      { limitCount: 1 }
    );

    // 2. Also listen for instantaneous in-memory events from current window
    const handleLocalEvent = (e) => {
      if (e.detail) {
        setLatestLog(e.detail);
        setHasPulse(true);
        setTimeout(() => setHasPulse(false), 2500);
      }
    };

    window.addEventListener('adsa:audit_event', handleLocalEvent);

    return () => {
      unsub();
      window.removeEventListener('adsa:audit_event', handleLocalEvent);
    };
  }, []);

  if (!latestLog) return null;

  const handleClick = () => {
    feedback('tick');
    if (onSelectLog) {
      onSelectLog(latestLog);
    } else {
      navigate('/admin/audit-logs');
    }
  };

  return (
    <motion.div
      layout
      onClick={handleClick}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`relative group flex items-center justify-between gap-2.5 sm:gap-3 px-3.5 sm:px-4 py-2.5 rounded-2xl cursor-pointer border backdrop-blur-xl transition-all select-none w-full max-w-full min-w-0 overflow-hidden ${
        hasPulse
          ? 'bg-emerald-500/15 border-emerald-500/40 shadow-glow-emerald'
          : 'bg-white/80 dark:bg-[#0f1715]/85 border-gray-200/80 dark:border-white/10 hover:border-emerald-500/30 shadow-sm'
      }`}
    >
      {/* Left indicator + text */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
        <div className="relative flex-shrink-0 flex items-center justify-center">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="absolute w-4 h-4 rounded-full bg-emerald-500/40 animate-ping" />
        </div>

        <div className="flex items-center gap-2 min-w-0 flex-wrap sm:flex-nowrap">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/20 px-2 py-0.5 rounded-md flex-shrink-0">
            Live Feed
          </span>

          <span className="font-extrabold text-xs text-gray-900 dark:text-white truncate">
            {latestLog.action.replace(/_/g, ' ')}
          </span>

          <span className="text-gray-400 text-xs hidden md:inline">•</span>

          <span className="text-xs text-gray-600 dark:text-gray-300 truncate hidden md:inline font-medium">
            {latestLog.changes?.diffSummary || latestLog.target?.label || 'Action registered'}
          </span>
        </div>
      </div>

      {/* Right time + CTA arrow */}
      <div className="flex items-center gap-2 flex-shrink-0 text-xs font-bold text-gray-500 dark:text-gray-400">
        <span className="text-[11px] font-medium hidden sm:inline">
          {formatAuditTime(latestLog.timestamp)}
        </span>
        <span className="text-emerald-600 dark:text-emerald-400 group-hover:underline flex items-center gap-0.5">
          <span>Audit Log</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </motion.div>
  );
}
