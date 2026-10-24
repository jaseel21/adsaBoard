import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle } from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';

export default function DecisionTimingHistogram({
  hours = [],
}) {
  const [hoveredHour, setHoveredHour] = useState(null);

  const maxVolume = Math.max(...hours.map((h) => h.volume), 10);

  return (
    <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-gray-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
        <div>
          <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span>24-Hour Token Toggle Decision Timing</span>
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Temporal distribution of when students toggle attendance before board cutoff locks
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          <span className="text-emerald-700 dark:text-emerald-400">Evening Cutoff Window (7 PM - 10 PM)</span>
        </div>
      </div>

      {/* Bar Histogram */}
      <div className="w-full h-36 flex items-end justify-between gap-1 sm:gap-1.5 pt-6 pb-2">
        {hours.map((item) => {
          const heightPercent = (item.volume / maxVolume) * 100;
          const isCutoff = item.isCutoffWindow;
          const isHovered = hoveredHour?.hour === item.hour;

          return (
            <div
              key={item.hour}
              className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer group"
              onMouseEnter={() => {
                soundEngine.playPop();
                setHoveredHour(item);
              }}
              onMouseLeave={() => setHoveredHour(null)}
            >
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(6, heightPercent)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className={`w-full rounded-t-sm transition-all duration-200 ${
                  isHovered
                    ? 'bg-emerald-400 shadow-glow-emerald'
                    : isCutoff
                    ? 'bg-emerald-500/80'
                    : 'bg-gray-300 dark:bg-white/10 group-hover:bg-gray-400 dark:group-hover:bg-white/20'
                }`}
              />
              {/* Selective labels for every 3 hours */}
              {item.hour % 4 === 0 && (
                <span className="text-[9px] text-gray-400 dark:text-gray-500 font-mono mt-1">
                  {item.label}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Hover Info Footer */}
      <div className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400 font-medium">
        {hoveredHour ? (
          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
            {hoveredHour.label}: ~{hoveredHour.volume}% of daily token toggles occur in this hour
          </span>
        ) : (
          <span>Over 65% of student meal opt-outs occur between 7:00 PM and 9:45 PM before evening cutoff.</span>
        )}
      </div>
    </div>
  );
}
