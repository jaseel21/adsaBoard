import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, RotateCcw } from 'lucide-react';

/**
 * Builds time buckets (e.g. 12 intervals over recent period)
 */
function computeTimeBuckets(logs = [], bucketCount = 12) {
  if (!logs.length) return [];

  const now = Date.now();
  // Assume a 24-hour window by default
  const windowMs = 24 * 60 * 60 * 1000;
  const startMs = now - windowMs;
  const bucketDuration = windowMs / bucketCount;

  const buckets = Array.from({ length: bucketCount }, (_, i) => {
    const bucketStart = startMs + i * bucketDuration;
    const bucketEnd = bucketStart + bucketDuration;
    const dateObj = new Date(bucketStart);
    const label = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });

    return {
      index: i,
      label,
      start: bucketStart,
      end: bucketEnd,
      count: 0,
      criticalCount: 0,
      warningCount: 0,
      logs: [],
    };
  });

  logs.forEach((log) => {
    const time = new Date(log.timestamp).getTime();
    if (time >= startMs && time <= now) {
      const idx = Math.min(
        bucketCount - 1,
        Math.max(0, Math.floor((time - startMs) / bucketDuration))
      );
      buckets[idx].count++;
      buckets[idx].logs.push(log);
      if (log.severity === 'critical' || log.severity === 'emergency') {
        buckets[idx].criticalCount++;
      } else if (log.severity === 'warning') {
        buckets[idx].warningCount++;
      }
    }
  });

  return buckets;
}

export default function AuditTimelineScrubber({
  logs = [],
  selectedBucketIndex = null,
  onSelectBucket,
  onResetBucket,
  onHapticFeedback,
}) {
  const buckets = useMemo(() => computeTimeBuckets(logs, 14), [logs]);
  const maxCount = useMemo(() => Math.max(1, ...buckets.map((b) => b.count)), [buckets]);

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 p-3 sm:p-5 shadow-sm backdrop-blur-xl space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
              Activity Velocity (Last 24 Hours)
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
              {selectedBucketIndex !== null
                ? `Filtered to interval: ${buckets[selectedBucketIndex]?.label}`
                : 'Click any bar to zoom and filter by time interval'}
            </p>
          </div>
        </div>

        {selectedBucketIndex !== null && (
          <button
            type="button"
            onClick={() => {
              if (onHapticFeedback) onHapticFeedback('tick');
              onResetBucket();
            }}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 text-xs font-bold transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset Interval</span>
          </button>
        )}
      </div>

      {/* Histogram bars */}
      <div className="pt-2">
        <div className="flex items-end justify-between gap-1 sm:gap-2 h-20 sm:h-24 w-full px-1">
          {buckets.map((bucket) => {
            const isSelected = selectedBucketIndex === bucket.index;
            const heightPct = Math.max(8, Math.round((bucket.count / maxCount) * 100));
            const hasCritical = bucket.criticalCount > 0;
            const hasWarning = bucket.warningCount > 0;

            const barColor = isSelected
              ? 'bg-gradient-to-t from-emerald-500 to-green-400 shadow-glow-emerald ring-2 ring-emerald-400'
              : hasCritical
              ? 'bg-gradient-to-t from-rose-600 to-red-400 shadow-glow-red hover:brightness-110'
              : hasWarning
              ? 'bg-gradient-to-t from-amber-600 to-yellow-400 shadow-glow-amber hover:brightness-110'
              : bucket.count > 0
              ? 'bg-gradient-to-t from-emerald-600 to-emerald-400 hover:brightness-110'
              : 'bg-gray-200 dark:bg-white/10 hover:bg-gray-300 dark:hover:bg-white/15';

            return (
              <div
                key={bucket.index}
                onClick={() => {
                  if (bucket.count > 0) {
                    if (onHapticFeedback) onHapticFeedback('tick');
                    onSelectBucket(isSelected ? null : bucket.index, bucket);
                  }
                }}
                className={`flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer select-none transition-transform ${
                  bucket.count === 0 ? 'opacity-40 cursor-default' : 'hover:scale-y-105'
                }`}
              >
                {/* Tooltip on hover */}
                <div className="absolute -top-8 hidden group-hover:flex items-center justify-center pointer-events-none z-20">
                  <div className="px-2 py-0.5 rounded-md bg-gray-900/95 text-white text-[10px] font-bold shadow-lg whitespace-nowrap">
                    {bucket.count} events ({bucket.label})
                  </div>
                </div>

                {/* Animated Bar Column */}
                <motion.div
                  initial={{ height: '0%' }}
                  animate={{ height: `${heightPct}%` }}
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                  className={`w-full rounded-t-md sm:rounded-t-lg transition-all ${barColor}`}
                />

                {/* Bottom Dot or Indicator */}
                {isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />
                )}
              </div>
            );
          })}
        </div>

        {/* X-Axis Labels */}
        <div className="flex items-center justify-between text-[10px] font-mono text-gray-400 mt-2 px-1">
          <span>{buckets[0]?.label || '24h ago'}</span>
          <span className="hidden sm:inline">{buckets[Math.floor(buckets.length / 2)]?.label || '12h ago'}</span>
          <span>Now (Live)</span>
        </div>
      </div>
    </div>
  );
}
