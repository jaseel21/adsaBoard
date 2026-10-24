import React from 'react';
import { motion } from 'framer-motion';
import { Users, Award, ShieldAlert, CheckCircle2, ChevronRight, Trophy } from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';

export default function BatchPerformanceHeatmap({
  batchBenchmarks = [],
  onSelectBatch,
}) {
  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-gray-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-emerald-500" />
            <span>Academic Batch Attendance Benchmarks</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Participation discipline, dining ratios, and dietary avoidances by batch
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {batchBenchmarks.map((b, idx) => {
          const isTop = idx === 0 && b.rate > 85;
          const statusColors = {
            optimal: 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
            moderate: 'text-amber-700 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
            low: 'text-rose-700 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
          }[b.status] || 'text-gray-700 bg-gray-100';

          return (
            <motion.div
              key={b.name}
              whileHover={{ scale: 1.01 }}
              onClick={() => {
                soundEngine.playPop();
                if (onSelectBatch) onSelectBatch(b.name);
              }}
              className="p-3.5 rounded-xl bg-gray-50/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 hover:border-emerald-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {b.name}
                  </span>
                  {isTop && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 inline-flex items-center gap-1">
                      <Trophy className="w-3 h-3 text-amber-500 flex-shrink-0" />
                      <span>Honor</span>
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColors}`}>
                  {b.rate}% Active
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden mb-2.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    b.rate >= 85 ? 'bg-emerald-500' : b.rate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                  }`}
                  style={{ width: `${b.rate}%` }}
                />
              </div>

              {/* Sub-metrics */}
              <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                <span>{b.active} / {b.total} Diners</span>
                <span className="text-gray-400 dark:text-gray-500">
                  {b.optedOut} Leave • {b.beefAvoid} No Beef
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
