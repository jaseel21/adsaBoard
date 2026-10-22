import React from 'react';
import { motion } from 'framer-motion';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';

export const POPULAR_TAGS = [
  { id: 'HotterFood', label: '🔥 Hotter Food', category: 'food' },
  { id: 'MoreGravy', label: '🍲 More Gravy', category: 'food' },
  { id: 'LessSalt', label: '🧂 Balanced Salt', category: 'food' },
  { id: 'TastyFood', label: '👌 Great Taste', category: 'food' },
  { id: 'PortionSize', label: '🍚 Generous Portions', category: 'food' },
  { id: 'Cleanliness', label: '✨ Mess Hygiene', category: 'service' },
  { id: 'FastServing', label: '⚡ Faster Counter Serving', category: 'service' },
  { id: 'FriendlyStaff', label: '🤝 Courteous Staff', category: 'service' },
  { id: 'CutoffClarity', label: '⏰ Cutoff Timing Help', category: 'admin' },
  { id: 'DietaryLabeling', label: '🥗 Dietary Labels', category: 'admin' },
  { id: 'EmergencyUnblock', label: '🚨 Urgent Unblock', category: 'admin' },
];

export default function CareTagCloud({ selectedTags = [], onToggleTag }) {
  const handleToggle = (tagId) => {
    soundEngine.playMechanicalClick();
    hapticEngine.lightTap();
    if (onToggleTag) onToggleTag(tagId);
  };

  return (
    <div className="w-full flex flex-col gap-2">
      <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        Quick Micro-Tags (Tap to include)
      </span>
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        {POPULAR_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag.id);
          return (
            <motion.button
              key={tag.id}
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleToggle(tag.id)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/30'
                  : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:border-emerald-400/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
              }`}
            >
              {tag.label}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
