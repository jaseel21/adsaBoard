import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { PieChart, Scale, Utensils, AlertCircle } from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

export default function DietaryDistributionRing({
  dietary = {},
  telemetry = {},
}) {
  const [activeSegment, setActiveSegment] = useState(null);

  const totalDiners = telemetry.activeDiners || 0;
  const beefAvoid = dietary.beefAvoiders || 0;
  const fishAvoid = dietary.fishAvoiders || 0;
  const chickenAvoid = dietary.chickenAvoiders || 0;
  const standardDiners = dietary.fullStandardDiners || Math.max(0, totalDiners - (beefAvoid + fishAvoid + chickenAvoid));

  // Compute segments
  const segments = [
    {
      id: 'standard',
      label: 'Standard Full Diet',
      count: standardDiners,
      color: '#10b981', // emerald
      bgColor: 'bg-emerald-500',
    },
    {
      id: 'beef',
      label: 'No Beef (മാട്ടിറച്ചി ഒഴിവാക്കൽ)',
      count: beefAvoid,
      color: '#ef4444', // red
      bgColor: 'bg-red-500',
    },
    {
      id: 'fish',
      label: 'No Fish (മത്സ്യം ഒഴിവാക്കൽ)',
      count: fishAvoid,
      color: '#3b82f6', // blue
      bgColor: 'bg-blue-500',
    },
    {
      id: 'chicken',
      label: 'No Chicken (ചിക്കൻ ഒഴിവാക്കൽ)',
      count: chickenAvoid,
      color: '#f59e0b', // amber
      bgColor: 'bg-amber-500',
    },
  ].filter((s) => s.count > 0);

  // SVG Geometry for Donut Ring
  const size = 220;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Calculate offsets
  const denominator = Math.max(1, totalDiners);
  let cumulativePercent = 0;

  const ringSegments = segments.map((seg) => {
    const percent = seg.count / denominator;
    const strokeDasharray = `${percent * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativePercent * circumference;
    cumulativePercent += percent;

    return {
      ...seg,
      percent: Math.round(percent * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const currentDisplay = activeSegment || (ringSegments[0] || { label: 'Active Diners', count: totalDiners, percent: 100 });

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-gray-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Scale className="w-4 h-4 text-emerald-500" />
            <span>Dietary & Allergen Distribution</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time breakdown of standard vs customized dietary avoidances
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
        {/* SVG Donut Ring */}
        <div className="relative w-48 h-48 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90 transform" viewBox={`0 0 ${size} ${size}`}>
            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke="currentColor"
              strokeWidth={strokeWidth}
              fill="transparent"
              className="text-gray-200 dark:text-white/5"
            />

            {/* Dynamic Segments */}
            {ringSegments.map((seg) => (
              <motion.circle
                key={seg.id}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={seg.color}
                strokeWidth={activeSegment?.id === seg.id ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: seg.strokeDashoffset }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="cursor-pointer transition-all duration-200 hover:opacity-90"
                onMouseEnter={() => {
                  soundEngine.playPop();
                  setActiveSegment(seg);
                }}
              />
            ))}
          </svg>

          {/* Center Callout */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
            <span className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {currentDisplay.count}
            </span>
            <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider line-clamp-1">
              {currentDisplay.label.split('(')[0]}
            </span>
            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {currentDisplay.percent}%
            </span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full space-y-2">
          {ringSegments.map((seg) => {
            const isHovered = activeSegment?.id === seg.id;
            return (
              <div
                key={seg.id}
                onMouseEnter={() => {
                  soundEngine.playPop();
                  setActiveSegment(seg);
                }}
                onMouseLeave={() => setActiveSegment(null)}
                className={`flex items-center justify-between p-2 rounded-xl transition-all duration-200 cursor-pointer ${
                  isHovered
                    ? 'bg-gray-100 dark:bg-white/10'
                    : 'hover:bg-gray-50 dark:hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">
                    {seg.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-900 dark:text-white">
                    {seg.count}
                  </span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-400">
                    {seg.percent}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
