import React from 'react';
import { motion } from 'framer-motion';
import { HeartPulse, Award, ShieldAlert, Phone, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';

export default function StudentCohortInsights({
  cohortInsights = {},
}) {
  const welfareAlerts = cohortInsights.welfareAlerts || [];
  const honorRollCount = cohortInsights.honorRollCount || 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Pod 1: Student Welfare Radar (Consecutive Missed Meals) */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-rose-500/30 dark:border-rose-500/20 shadow-glass dark:shadow-glass-dark">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <HeartPulse className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>Student Welfare & Health Radar</span>
                {welfareAlerts.length > 0 && (
                  <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded-full bg-rose-500 text-white">
                    {welfareAlerts.length}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Students with 4+ consecutive missed meals flagged for welfare follow-up
              </p>
            </div>
          </div>
        </div>

        {welfareAlerts.length === 0 ? (
          <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center text-xs text-emerald-700 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
            Zero chronic absenteeism detected across all active students today.
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {welfareAlerts.map((student) => (
              <div
                key={student.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-700 dark:text-rose-300 font-mono font-bold flex items-center justify-center text-[11px]">
                    #{student.tokenNo}
                  </span>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <span>{student.name}</span>
                      <span className="text-[10px] text-gray-400">({student.batch})</span>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">
                      Room: {student.room} • Missed {student.consecutiveMissed} meals
                    </div>
                  </div>
                </div>

                {student.phone ? (
                  <a
                    href={`tel:${student.phone}`}
                    onClick={() => soundEngine.playPop()}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-500 text-white font-semibold text-[10px] hover:bg-rose-600 transition-colors"
                  >
                    <Phone className="w-3 h-3" />
                    <span>Call</span>
                  </a>
                ) : (
                  <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400">
                    Needs Visit
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pod 2: Consistency & Discipline Honor Roll */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-emerald-500/30 dark:border-emerald-500/20 shadow-glass dark:shadow-glass-dark">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                <span>100% Dining Consistency Club</span>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                  {honorRollCount} Active
                </span>
              </h3>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Students demonstrating perfect dining discipline & zero unauthorized waste
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/30 text-xs">
          <div className="flex items-center justify-between text-emerald-800 dark:text-emerald-300 font-bold mb-1">
            <span>Mess Attendance Discipline Index</span>
            <span className="text-sm font-extrabold font-mono">94.8%</span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-[11px] leading-relaxed">
            {honorRollCount} students have maintained unbroken token accuracy and meal attendance over the last 14 days, minimizing food wastage across all messes.
          </p>
        </div>
      </div>
    </div>
  );
}
