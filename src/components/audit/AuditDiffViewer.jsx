import React from 'react';
import { ArrowRight, CheckCircle2, XCircle, Minus } from 'lucide-react';

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
        <CheckCircle2 className="w-3.5 h-3.5" /> TRUE
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
        <XCircle className="w-3.5 h-3.5" /> FALSE
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
 * Renders structured before vs after deltas with highlight badges
 */
export default function AuditDiffViewer({ changes, compact = false }) {
  if (!changes || (!changes.before && !changes.after && !changes.fieldsChanged?.length)) {
    return (
      <div className="text-xs text-gray-500 italic py-1">
        No state delta recorded for this event.
      </div>
    );
  }

  const fields = changes.fieldsChanged || Object.keys(changes.after || changes.before || {});

  if (fields.length === 0) {
    return (
      <div className="text-xs text-gray-500 italic py-1">
        {changes.diffSummary || 'Action completed with no field modifications.'}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${compact ? 'text-xs' : 'text-sm'}`}>
      {fields.map((field) => {
        const valBefore = changes.before ? changes.before[field] : undefined;
        const valAfter = changes.after ? changes.after[field] : undefined;
        const isAddition = valBefore === undefined && valAfter !== undefined;
        const isDeletion = valBefore !== undefined && valAfter === undefined;

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
                <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase">
                  Created
                </span>
              )}
              {isDeletion && (
                <span className="px-1.5 py-0.2 rounded-md bg-rose-500/15 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold uppercase">
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
