import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Calendar, Info } from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';

export default function SplineAttendanceWave({
  points = [],
  meal = 'lunch', // 'breakfast' | 'lunch' | 'both'
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  // SVG dimensions
  const width = 800;
  const height = 260;
  const paddingX = 40;
  const paddingY = 30;

  const chartWidth = width - paddingX * 2;
  const chartHeight = height - paddingY * 2;

  // Max student capacity
  const maxCapacity = useMemo(() => {
    if (!points || points.length === 0) return 100;
    const maxVal = Math.max(
      ...points.map((p) => Math.max(p.breakfastCount || 0, p.lunchCount || 0, p.totalStudents || 100))
    );
    return Math.max(maxVal, 50);
  }, [points]);

  // Generate SVG coordinates
  const coordinates = useMemo(() => {
    if (!points || points.length === 0) return { bk: [], ln: [] };
    const step = chartWidth / Math.max(1, points.length - 1);

    const bk = points.map((p, idx) => {
      const x = paddingX + idx * step;
      const y = paddingY + chartHeight - (p.breakfastCount / maxCapacity) * chartHeight;
      return { x, y, data: p };
    });

    const ln = points.map((p, idx) => {
      const x = paddingX + idx * step;
      const y = paddingY + chartHeight - (p.lunchCount / maxCapacity) * chartHeight;
      return { x, y, data: p };
    });

    return { bk, ln };
  }, [points, chartWidth, chartHeight, maxCapacity]);

  // Construct smooth cubic Bezier path
  const makeSmoothPath = (coords) => {
    if (!coords || coords.length === 0) return '';
    if (coords.length === 1) return `M ${coords[0].x} ${coords[0].y}`;

    let path = `M ${coords[0].x} ${coords[0].y}`;
    for (let i = 0; i < coords.length - 1; i++) {
      const p0 = coords[i];
      const p1 = coords[i + 1];
      const cx1 = p0.x + (p1.x - p0.x) / 2;
      const cy1 = p0.y;
      const cx2 = p0.x + (p1.x - p0.x) / 2;
      const cy2 = p1.y;
      path += ` C ${cx1} ${cy1}, ${cx2} ${cy2}, ${p1.x} ${p1.y}`;
    }
    return path;
  };

  const linePathBk = useMemo(() => makeSmoothPath(coordinates.bk), [coordinates.bk]);
  const linePathLn = useMemo(() => makeSmoothPath(coordinates.ln), [coordinates.ln]);

  const areaPathLn = useMemo(() => {
    if (!coordinates.ln || coordinates.ln.length === 0) return '';
    const first = coordinates.ln[0];
    const last = coordinates.ln[coordinates.ln.length - 1];
    return `${linePathLn} L ${last.x} ${paddingY + chartHeight} L ${first.x} ${paddingY + chartHeight} Z`;
  }, [linePathLn, coordinates.ln, chartHeight]);

  const activePoint = hoveredIdx !== null && points[hoveredIdx] ? points[hoveredIdx] : null;

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-gray-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" />
              <span>Dining Influx Waves & Trendlines</span>
            </h3>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Multi-Day Horizon
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time daily breakfast & lunch participation waves with historical variance
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
            <span className="w-3 h-1 bg-emerald-500 rounded-full" />
            <span>Lunch</span>
          </div>
          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
            <span className="w-3 h-1 bg-amber-500 rounded-full" />
            <span>Breakfast</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative w-full overflow-x-auto scrollbar-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-48 sm:h-64 overflow-visible"
        >
          <defs>
            {/* Emerald Area Gradient */}
            <linearGradient id="emeraldArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>

            {/* Glowing Stroke Filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="#10b981" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Horizontal Grid Guidelines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = paddingY + chartHeight * ratio;
            const val = Math.round(maxCapacity * (1 - ratio));
            return (
              <g key={ratio} className="opacity-30 dark:opacity-20">
                <line
                  x1={paddingX}
                  y1={y}
                  x2={width - paddingX}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={paddingX - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="text-[10px] fill-gray-500 dark:fill-gray-400 font-mono font-medium"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Area Fill for Lunch */}
          <path d={areaPathLn} fill="url(#emeraldArea)" />

          {/* Breakfast Spline Curve */}
          <motion.path
            d={linePathBk}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* Lunch Spline Curve */}
          <motion.path
            d={linePathLn}
            fill="none"
            stroke="#10b981"
            strokeWidth="3"
            strokeLinecap="round"
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />

          {/* Interactive Scrubbing Columns & Nodes */}
          {points.map((p, idx) => {
            const coord = coordinates.ln[idx] || { x: 0, y: 0 };
            const isTarget = p.isTarget;
            const isHovered = hoveredIdx === idx;

            return (
              <g
                key={p.date}
                className="cursor-pointer"
                onMouseEnter={() => {
                  soundEngine.playPop();
                  setHoveredIdx(idx);
                }}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Vertical hover line */}
                {isHovered && (
                  <line
                    x1={coord.x}
                    y1={paddingY}
                    x2={coord.x}
                    y2={paddingY + chartHeight}
                    stroke="#10b981"
                    strokeWidth="1.5"
                    strokeDasharray="3 3"
                    className="opacity-75"
                  />
                )}

                {/* Lunch Node */}
                <circle
                  cx={coord.x}
                  cy={coord.y}
                  r={isHovered ? 6 : isTarget ? 5 : 3.5}
                  className={`transition-all duration-200 ${
                    isHovered
                      ? 'fill-emerald-400 stroke-white dark:stroke-[#080d0b] stroke-2'
                      : 'fill-emerald-500'
                  }`}
                />

                {/* X-axis Day Label */}
                <text
                  x={coord.x}
                  y={height - 8}
                  textAnchor="middle"
                  className={`text-[11px] font-semibold transition-colors ${
                    isTarget || isHovered
                      ? 'fill-emerald-600 dark:fill-emerald-400 font-bold'
                      : 'fill-gray-500 dark:fill-gray-400'
                  }`}
                >
                  {p.shortLabel}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip Card */}
        {activePoint && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute top-2 right-4 glass-panel rounded-xl p-3 border border-emerald-500/30 shadow-lg text-xs pointer-events-none z-20 min-w-[170px]"
          >
            <div className="font-bold text-gray-900 dark:text-white flex items-center justify-between pb-1.5 border-b border-gray-200 dark:border-white/10 mb-1.5">
              <span>{activePoint.friendlyDate}</span>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                {activePoint.shortLabel}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400 font-medium">
                <span>Lunch Diners:</span>
                <span className="font-bold">{activePoint.lunchCount} ({activePoint.lunchRate}%)</span>
              </div>
              <div className="flex items-center justify-between text-amber-700 dark:text-amber-400 font-medium">
                <span>Breakfast:</span>
                <span className="font-bold">{activePoint.breakfastCount} ({activePoint.breakfastRate}%)</span>
              </div>
              <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-100 dark:border-white/5">
                Total Enrolled: {activePoint.totalStudents} students
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
