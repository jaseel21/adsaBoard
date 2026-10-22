import React from 'react';
import {
  ArrowRight,
  CheckCircle2,
  XCircle,
  Utensils,
  Coffee,
  Calendar,
  Sliders,
  Shield,
  Clock,
  Sparkles,
} from 'lucide-react';
import { isTokenAudit, extractTokenDeltas } from '../../utils/tokenAuditHelper';

/**
 * Format a value for clean, readable display
 */
function formatValue(val) {
  if (val === null || val === undefined) {
    return <span className="text-gray-400 italic">None</span>;
  }
  if (typeof val === 'boolean') {
    return val ? (
      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
        <CheckCircle2 className="w-3.5 h-3.5" /> ON (Dining)
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
        <XCircle className="w-3.5 h-3.5" /> OFF (Skipping)
      </span>
    );
  }
  if (Array.isArray(val)) {
    if (val.length === 0) return <span className="text-gray-400 italic">Empty list</span>;
    return (
      <div className="flex flex-wrap gap-1">
        {val.map((item, idx) => (
          <span
            key={idx}
            className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 text-[11px] font-mono"
          >
            {typeof item === 'object' ? JSON.stringify(item) : String(item)}
          </span>
        ))}
      </div>
    );
  }
  if (typeof val === 'object') {
    return (
      <pre className="text-[11px] font-mono bg-black/5 dark:bg-black/30 p-1.5 rounded overflow-x-auto max-w-full">
        {JSON.stringify(val, null, 2)}
      </pre>
    );
  }
  return <span className="font-mono text-xs">{String(val)}</span>;
}

/**
 * Render a single state status badge
 */
function renderStatusBadge(val, fallbackLabel) {
  if (val === true || fallbackLabel === 'ON' || fallbackLabel === 'Active' || fallbackLabel === 'Active / Unlocked') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
        <span>{fallbackLabel || 'ON (Dining)'}</span>
      </span>
    );
  }
  if (val === false || fallbackLabel === 'OFF' || fallbackLabel === 'Leave' || fallbackLabel === 'Frozen / Locked') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
        <XCircle className="w-3.5 h-3.5 shrink-0" />
        <span>{fallbackLabel || 'OFF (Skipping)'}</span>
      </span>
    );
  }
  if (fallbackLabel) {
    return <span className="font-medium text-xs text-gray-700 dark:text-gray-300">{fallbackLabel}</span>;
  }
  return formatValue(val);
}

/**
 * Specialized renderer for Token and Meal state changes
 */
function TokenDeltasView({ deltas, compact = false, diffSummary }) {
  if (!deltas || deltas.length === 0) {
    return (
      <div className="text-xs text-gray-500 italic py-1">
        {diffSummary || 'Action completed with no field modifications.'}
      </div>
    );
  }

  return (
    <div className={`space-y-2.5 ${compact ? 'text-xs' : 'text-sm'}`}>
      {deltas.map((item, idx) => {
        const isLunch = item.meal === 'lunch';
        const isBf = item.meal === 'breakfast';

        return (
          <div
            key={idx}
            className="p-3 sm:p-3.5 rounded-2xl bg-gray-50/90 dark:bg-white/[0.04] border border-gray-200/70 dark:border-white/10 transition-all shadow-sm space-y-2"
          >
            {/* Header: Scope, Day/Date, Meal Badge */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 flex-wrap">
                {item.date ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[11px] font-bold border border-blue-500/20">
                    <Calendar className="w-3 h-3" />
                    <span>{item.scopeLabel || item.date}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[11px] font-bold border border-purple-500/20">
                    <Clock className="w-3 h-3" />
                    <span>{item.scopeLabel || item.day || 'Weekly Routine'}</span>
                  </span>
                )}

                {item.tokenNo && (
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold">
                    Token #{item.tokenNo}
                  </span>
                )}
              </div>

              {/* Meal Badge */}
              <div className="flex items-center gap-1">
                {isLunch && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[11px] font-bold border border-amber-500/30">
                    <Utensils className="w-3 h-3" />
                    <span>Lunch</span>
                  </span>
                )}
                {isBf && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-orange-500/15 text-orange-600 dark:text-orange-400 text-[11px] font-bold border border-orange-500/30">
                    <Coffee className="w-3 h-3" />
                    <span>Breakfast</span>
                  </span>
                )}
                {!isLunch && !isBf && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-500/15 text-teal-600 dark:text-teal-400 text-[11px] font-bold border border-teal-500/30">
                    <Sliders className="w-3 h-3" />
                    <span>{item.mealLabel || 'All Meals'}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Before vs After Transition Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-stretch">
              {/* Previous State */}
              <div className="p-2.5 rounded-xl bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/20 text-rose-900 dark:text-rose-200 min-w-0">
                <div className="text-[10px] font-bold text-rose-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Previous</span>
                </div>
                <div className="min-w-0">
                  {renderStatusBadge(item.previous, item.previousLabel)}
                </div>
              </div>

              {/* Current State */}
              <div className="p-2.5 rounded-xl bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 min-w-0">
                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1 flex items-center justify-between">
                  <span>Current</span>
                  <ArrowRight className="w-3 h-3 text-emerald-500 hidden sm:inline" />
                </div>
                <div className="min-w-0">
                  {renderStatusBadge(item.current, item.currentLabel)}
                </div>
              </div>
            </div>

            {/* Optional Item Note / Reason */}
            {item.note && (
              <div className="text-[11px] text-gray-500 dark:text-gray-400 italic pt-0.5 flex items-center gap-1">
                <span>Note:</span>
                <span>{item.note}</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Main Audit Diff Viewer
 * Renders structured before vs after deltas. Automatically switches to Token-aware
 * presentation when handling token, meal, and dining schedule events.
 */
export default function AuditDiffViewer({ log, changes, compact = false }) {
  const activeChanges = changes || log?.changes;

  // 1. Check if this is a Token-based audit event
  const isTokenEvent = isTokenAudit(log);
  if (isTokenEvent && log) {
    const tokenDeltas = extractTokenDeltas(log);
    if (tokenDeltas && tokenDeltas.length > 0) {
      return (
        <TokenDeltasView
          deltas={tokenDeltas}
          compact={compact}
          diffSummary={activeChanges?.diffSummary}
        />
      );
    }
  }

  // 2. Generic fallback for events with no changes recorded
  if (!activeChanges || (!activeChanges.before && !activeChanges.after && !activeChanges.fieldsChanged?.length)) {
    return (
      <div className="text-xs text-gray-500 italic py-1">
        {activeChanges?.diffSummary || 'No state delta recorded for this event.'}
      </div>
    );
  }

  const fields = activeChanges.fieldsChanged || Object.keys(activeChanges.after || activeChanges.before || {});

  if (fields.length === 0) {
    return (
      <div className="text-xs text-gray-500 italic py-1">
        {activeChanges.diffSummary || 'Action completed with no field modifications.'}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      {fields.map((field) => {
        const valBefore = activeChanges.before ? activeChanges.before[field] : undefined;
        const valAfter = activeChanges.after ? activeChanges.after[field] : undefined;
        const isAddition = valBefore === undefined && valAfter !== undefined;
        const isDeletion = valBefore !== undefined && valAfter === undefined;

        // Prevent showing empty "Previous: None / Current: None" when both are undefined
        if (valBefore === undefined && valAfter === undefined) {
          return (
            <div
              key={field}
              className="p-2 sm:p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/5 transition-all"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-mono text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  {field}
                </span>
                <span className="px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                  Updated
                </span>
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400 italic">
                {activeChanges.diffSummary || `Modified property "${field}"`}
              </div>
            </div>
          );
        }

        return (
          <div
            key={field}
            className="p-2 sm:p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/5 transition-all"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-mono text-[11px] sm:text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {field}
              </span>
              {isAddition && (
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase">
                  Created
                </span>
              )}
              {isDeletion && (
                <span className="px-1.5 py-0.5 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold uppercase">
                  Removed
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
              {/* Before state */}
              <div className="p-2 rounded-lg bg-rose-500/10 dark:bg-rose-950/20 border border-rose-500/20 text-rose-900 dark:text-rose-200 min-w-0 break-words">
                <div className="text-[10px] font-semibold text-rose-500 uppercase tracking-wider mb-0.5">
                  Previous
                </div>
                {formatValue(valBefore)}
              </div>

              {/* After state */}
              <div className="p-2 rounded-lg bg-emerald-500/10 dark:bg-emerald-950/20 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 min-w-0 break-words">
                <div className="text-[10px] font-semibold text-emerald-500 uppercase tracking-wider mb-0.5 flex items-center justify-between">
                  <span>Current</span>
                  <ArrowRight className="w-3 h-3 text-emerald-500 hidden sm:inline" />
                </div>
                {formatValue(valAfter)}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
