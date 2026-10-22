import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sliders,
  Users,
  UtensilsCrossed,
  Shield,
  ShieldAlert,
  Cpu,
  Clock,
  ChevronDown,
  ExternalLink,
  Laptop,
  Smartphone,
  Tablet,
  Check,
  AlertTriangle,
  Info,
  Flame,
  Printer,
} from 'lucide-react';
import { formatAuditTime } from '../../utils/auditLogger';
import { isTokenAudit } from '../../utils/tokenAuditHelper';
import AuditDiffViewer from './AuditDiffViewer';

/**
 * Category Icon Resolver
 */
function getCategoryIcon(category) {
  switch (category) {
    case 'canteen':
      return <Printer className="w-4 h-4" />;
    case 'tokens':
      return <Sliders className="w-4 h-4" />;
    case 'students':
      return <Users className="w-4 h-4" />;
    case 'menu':
      return <UtensilsCrossed className="w-4 h-4" />;
    case 'dietary':
      return <UtensilsCrossed className="w-4 h-4" />;
    case 'security':
      return <ShieldAlert className="w-4 h-4" />;
    case 'system':
    default:
      return <Cpu className="w-4 h-4" />;
  }
}

/**
 * Category Theme Resolver
 */
function getCategoryStyles(category) {
  switch (category) {
    case 'canteen':
      return 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30';
    case 'tokens':
      return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20';
    case 'students':
      return 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20';
    case 'menu':
      return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20';
    case 'dietary':
      return 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20';
    case 'security':
      return 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20';
    case 'system':
    default:
      return 'bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-500/20';
  }
}

/**
 * Severity Indicator Resolver
 */
function getSeverityBadge(severity) {
  switch (severity) {
    case 'emergency':
      return {
        label: 'EMERGENCY',
        dot: 'bg-red-500 animate-ping',
        bg: 'bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30',
        icon: <Flame className="w-3 h-3 text-red-500" />,
      };
    case 'critical':
      return {
        label: 'CRITICAL',
        dot: 'bg-rose-500',
        bg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        icon: <AlertTriangle className="w-3 h-3 text-rose-500" />,
      };
    case 'warning':
      return {
        label: 'WARNING',
        dot: 'bg-amber-500',
        bg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
        icon: <AlertTriangle className="w-3 h-3 text-amber-500" />,
      };
    case 'notice':
      return {
        label: 'NOTICE',
        dot: 'bg-cyan-500',
        bg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
        icon: <Info className="w-3 h-3 text-cyan-500" />,
      };
    case 'info':
    default:
      return {
        label: 'INFO',
        dot: 'bg-emerald-500',
        bg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        icon: <Check className="w-3 h-3 text-emerald-500" />,
      };
  }
}

/**
 * Device Icon Resolver
 */
function getDeviceIcon(deviceType) {
  if (deviceType === 'mobile') return <Smartphone className="w-3 h-3 text-gray-400" />;
  if (deviceType === 'tablet') return <Tablet className="w-3 h-3 text-gray-400" />;
  return <Laptop className="w-3 h-3 text-gray-400" />;
}

export default function AuditCard({ log, onInspect, onHapticFeedback }) {
  const [expandedDiff, setExpandedDiff] = useState(false);
  const severityBadge = getSeverityBadge(log.severity);
  const categoryStyle = getCategoryStyles(log.category);
  const hasDiffData = Boolean(
    log.changes?.fieldsChanged?.length || log.changes?.before || log.changes?.after || isTokenAudit(log)
  );

  const handleToggleExpand = (e) => {
    e.stopPropagation();
    if (onHapticFeedback) onHapticFeedback('tick');
    setExpandedDiff(!expandedDiff);
  };

  const handleCardClick = () => {
    if (onHapticFeedback) onHapticFeedback('pop');
    if (onInspect) onInspect(log);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      onClick={handleCardClick}
      className="group relative rounded-2xl bg-white/80 dark:bg-[#0f1715]/85 border border-gray-200/80 dark:border-white/10 p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer backdrop-blur-xl"
    >
      {/* Top Header Row */}
      <div className="flex items-start justify-between gap-3">
        {/* Left: Category Icon + Action & Summary */}
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`p-2 sm:p-2.5 rounded-xl border flex-shrink-0 ${categoryStyle} transition-transform group-hover:scale-105`}
          >
            {getCategoryIcon(log.category)}
          </div>

          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-extrabold text-xs sm:text-sm text-gray-900 dark:text-white tracking-tight">
                {log.action.replace(/_/g, ' ')}
              </span>

              {/* Target pill */}
              {log.target?.label && (
                <span className="px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-mono text-[10px] font-bold border border-gray-200/60 dark:border-white/5 truncate max-w-[200px]">
                  {log.target.label}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 font-medium line-clamp-1">
              {log.changes?.diffSummary || log.metadata?.reason || 'State updated'}
            </p>
          </div>
        </div>

        {/* Right: Severity Badge + Time */}
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <div className="flex items-center gap-1.5">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider border ${severityBadge.bg}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${severityBadge.dot}`} />
              {severityBadge.label}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
            <Clock className="w-3 h-3 text-gray-400" />
            <span>{formatAuditTime(log.timestamp)}</span>
          </div>
        </div>
      </div>

      {/* Footer Info Row: Actor Identity, Device, and Expand CTA */}
      <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2 text-xs">
        {/* Actor Info */}
        <div className="flex items-center gap-1.5 min-w-0 text-gray-500 dark:text-gray-400 font-medium">
          <span className="flex-shrink-0">
            {log.actor?.role === 'admin' ? (
              <Shield className="w-3.5 h-3.5 text-emerald-500 inline" />
            ) : log.actor?.role === 'student' ? (
              <span className="px-1 py-0.2 rounded bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[9px] font-bold">
                Student
              </span>
            ) : (
              <Cpu className="w-3.5 h-3.5 text-blue-500 inline" />
            )}
          </span>
          <span className="font-semibold text-gray-700 dark:text-gray-200 truncate">
            {log.actor?.displayName || log.actor?.email || 'Unknown Actor'}
          </span>
          {log.metadata?.deviceType && (
            <span className="hidden sm:inline-flex items-center gap-1 ml-1" title={log.metadata.deviceType}>
              {getDeviceIcon(log.metadata.deviceType)}
            </span>
          )}
        </div>

        {/* Action Buttons: Expand diff + Inspect */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {hasDiffData && (
            <button
              type="button"
              onClick={handleToggleExpand}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-300 hover:text-emerald-600 text-[11px] font-bold transition-colors"
            >
              <span>{expandedDiff ? 'Hide Diff' : 'View Diff'}</span>
              <ChevronDown
                className={`w-3 h-3 transition-transform duration-200 ${
                  expandedDiff ? 'rotate-180' : ''
                }`}
              />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleCardClick();
            }}
            className="p-1 rounded-lg text-gray-400 hover:text-emerald-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
            title="Inspect Full Event Payload"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Inline Diff Section */}
      <AnimatePresence>
        {expandedDiff && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            className="mt-3 pt-3 border-t border-dashed border-gray-200 dark:border-white/10 overflow-hidden"
          >
            <AuditDiffViewer log={log} changes={log.changes} compact={true} />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
