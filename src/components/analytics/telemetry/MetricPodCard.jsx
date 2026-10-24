import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Sparkles } from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

export default function MetricPodCard({
  title,
  value,
  subvalue,
  delta,
  isPositiveDelta = true,
  icon: Icon,
  color = 'emerald', // 'emerald' | 'amber' | 'indigo' | 'cyan' | 'rose'
  badge,
  progress = null,
  onClick,
}) {
  const colorMap = {
    emerald: {
      border: 'border-emerald-500/25 dark:border-emerald-500/20',
      glow: 'hover:shadow-glow-emerald',
      bgGlow: 'from-emerald-500/10 to-transparent',
      iconBg: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
      progress: 'bg-emerald-500',
    },
    amber: {
      border: 'border-amber-500/25 dark:border-amber-500/20',
      glow: 'hover:shadow-glow-amber',
      bgGlow: 'from-amber-500/10 to-transparent',
      iconBg: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
      progress: 'bg-amber-500',
    },
    indigo: {
      border: 'border-indigo-500/25 dark:border-indigo-500/20',
      glow: 'hover:shadow-indigo-500/20',
      bgGlow: 'from-indigo-500/10 to-transparent',
      iconBg: 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-400',
      badgeBg: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-500/20',
      progress: 'bg-indigo-500',
    },
    cyan: {
      border: 'border-cyan-500/25 dark:border-cyan-500/20',
      glow: 'hover:shadow-cyan-500/20',
      bgGlow: 'from-cyan-500/10 to-transparent',
      iconBg: 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
      badgeBg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
      progress: 'bg-cyan-500',
    },
    rose: {
      border: 'border-rose-500/25 dark:border-rose-500/20',
      glow: 'hover:shadow-glow-red',
      bgGlow: 'from-rose-500/10 to-transparent',
      iconBg: 'bg-rose-500/15 text-rose-600 dark:text-rose-400',
      badgeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
      progress: 'bg-rose-500',
    },
  };

  const scheme = colorMap[color] || colorMap.emerald;

  const handleClick = () => {
    if (onClick) {
      soundEngine.playMechanicalClick();
      hapticEngine.lightTap();
      onClick();
    }
  };

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={handleClick}
      className={`relative glass-panel rounded-2xl p-5 border ${scheme.border} ${scheme.glow} transition-all duration-300 overflow-hidden cursor-pointer group`}
    >
      {/* Background Ambient Glow */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${scheme.bgGlow} opacity-40 group-hover:opacity-75 transition-opacity duration-300 pointer-events-none`}
      />

      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Top Header Row */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            {Icon && (
              <div className={`p-2.5 rounded-xl ${scheme.iconBg} shadow-sm transition-transform duration-300 group-hover:scale-105`}>
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
                {title}
              </span>
              {badge && (
                <span className={`inline-block mt-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${scheme.badgeBg}`}>
                  {badge}
                </span>
              )}
            </div>
          </div>

          {delta && (
            <div
              className={`flex items-center gap-0.5 text-xs font-bold px-2 py-1 rounded-full ${
                isPositiveDelta
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-500/10'
                  : 'text-amber-700 dark:text-amber-400 bg-amber-500/10'
              }`}
            >
              {isPositiveDelta ? (
                <ArrowUpRight className="w-3.5 h-3.5" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5" />
              )}
              <span>{delta}</span>
            </div>
          )}
        </div>

        {/* Center Primary Metric Number */}
        <div className="my-1">
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight font-sans">
            {value}
          </div>
          {subvalue && (
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium">
              {subvalue}
            </div>
          )}
        </div>

        {/* Progress Bar (Optional) */}
        {progress !== null && (
          <div className="mt-3 w-full">
            <div className="h-1.5 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                className={`h-full rounded-full ${scheme.progress}`}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
