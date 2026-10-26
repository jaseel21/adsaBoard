import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  ShieldCheck,
  UtensilsCrossed,
  Printer,
  Sliders,
  Clock,
  User,
  ExternalLink,
  Radio,
  Flame,
} from 'lucide-react';
import { subscribeAuditLogs, formatAuditTime, AUDIT_CATEGORIES } from '../../../utils/auditLogger';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

/**
 * LiveActivityStream
 * Real-time event ticker unifying live presence updates and institutional audit trails.
 */
export default function LiveActivityStream({ onSelectSessionByToken }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const unsub = subscribeAuditLogs(
      (allLogs) => {
        setLogs(allLogs);
        setLoading(false);
      },
      (err) => {
        console.warn('Audit logs subscription error in Sentinel stream:', err);
        setLoading(false);
      },
      { limitCount: 40 }
    );

    return () => unsub();
  }, []);

  const getActionBadge = (log) => {
    const act = log.action || '';
    if (act.startsWith('REMOTE_')) {
      return {
        label: 'Remote Action',
        color: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      };
    }
    if (log.category === AUDIT_CATEGORIES.TOKENS) {
      return {
        label: 'Token Toggle',
        color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      };
    }
    if (log.category === AUDIT_CATEGORIES.DIETARY) {
      return {
        label: 'Dietary Update',
        color: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      };
    }
    if (log.category === AUDIT_CATEGORIES.CANTEEN) {
      return {
        label: 'Canteen Ops',
        color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      };
    }
    return {
      label: 'System Event',
      color: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    };
  };

  return (
    <div className="space-y-3">
      {/* Stream Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-500 animate-pulse" />
          <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
            Live Institutional Activity Pulse
          </h4>
        </div>
        <span className="text-[11px] text-gray-400 flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Real-time Stream</span>
        </span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span>Connecting to activity stream...</span>
        </div>
      ) : logs.length === 0 ? (
        <div className="p-8 text-center text-xs text-gray-400 rounded-2xl bg-white/5 border border-white/5">
          No recent activity logs recorded today.
        </div>
      ) : (
        <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
          {logs.map((log) => {
            const badge = getActionBadge(log);
            const targetToken = log.target?.tokenNo;

            return (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 hover:border-emerald-500/40 transition-all text-xs space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${badge.color}`}
                  >
                    {badge.label}
                  </span>

                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatAuditTime(log.timestamp)}</span>
                  </span>
                </div>

                <p className="font-bold text-gray-900 dark:text-gray-100 text-xs leading-snug">
                  {log.changes?.diffSummary || log.action}
                </p>

                <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 pt-1 border-t border-gray-100 dark:border-white/5">
                  <span className="truncate max-w-[180px]">
                    By: <strong>{log.actor?.displayName || log.actor?.email?.split('@')[0] || 'User'}</strong>
                  </span>

                  {targetToken && onSelectSessionByToken && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEngine.playPop();
                        hapticEngine.lightTap();
                        onSelectSessionByToken(targetToken);
                      }}
                      className="text-emerald-500 font-extrabold hover:underline"
                    >
                      Locate #{targetToken}
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
