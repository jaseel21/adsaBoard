import React from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Utensils,
  Scale,
  ThumbsUp,
  Layers,
  Sparkles,
  Zap,
  HeartHandshake,
  Clock,
  Leaf,
  AlertCircle,
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';

export const POPULAR_TAGS = [
  { id: 'HotterFood', label: 'Hotter Food', icon: Flame, iconColor: 'text-rose-500', category: 'food' },
  { id: 'MoreGravy', label: 'More Gravy', icon: Utensils, iconColor: 'text-amber-500', category: 'food' },
  { id: 'LessSalt', label: 'Balanced Salt', icon: Scale, iconColor: 'text-blue-500', category: 'food' },
  { id: 'TastyFood', label: 'Great Taste', icon: ThumbsUp, iconColor: 'text-emerald-500', category: 'food' },
  { id: 'PortionSize', label: 'Generous Portions', icon: Layers, iconColor: 'text-amber-600', category: 'food' },
  { id: 'Cleanliness', label: 'Mess Hygiene', icon: Sparkles, iconColor: 'text-teal-500', category: 'service' },
  { id: 'FastServing', label: 'Faster Counter Serving', icon: Zap, iconColor: 'text-amber-500', category: 'service' },
  { id: 'FriendlyStaff', label: 'Courteous Staff', icon: HeartHandshake, iconColor: 'text-indigo-500', category: 'service' },
  { id: 'CutoffClarity', label: 'Cutoff Timing Help', icon: Clock, iconColor: 'text-purple-500', category: 'admin' },
  { id: 'DietaryLabeling', label: 'Dietary Labels', icon: Leaf, iconColor: 'text-emerald-500', category: 'admin' },
  { id: 'EmergencyUnblock', label: 'Urgent Unblock', icon: AlertCircle, iconColor: 'text-rose-500', category: 'admin' },
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
          const Icon = tag.icon;
          return (
            <motion.button
              key={tag.id}
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleToggle(tag.id)}
              className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border inline-flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm shadow-emerald-500/30'
                  : 'bg-white dark:bg-white/5 text-gray-600 dark:text-gray-300 border-gray-200/80 dark:border-white/10 hover:border-emerald-400/50 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${isSelected ? 'text-white' : tag.iconColor}`} />
              <span>{tag.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
