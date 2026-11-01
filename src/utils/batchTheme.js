/**
 * ADSA Academic Batch Color Palette Engine
 * Assigns a single, consistent, distinct color theme to each academic batch.
 * Guarantees that every student in the same batch shares an identical color badge.
 */

export const BATCH_PALETTES = [
  {
    id: 'emerald',
    name: 'Emerald Green',
    gradient: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-500/15 dark:bg-emerald-500/20',
    border: 'border-emerald-500/40 dark:border-emerald-500/30',
    text: 'text-emerald-800 dark:text-emerald-200',
    ring: 'ring-emerald-500/50',
    badgeBg: 'bg-emerald-600',
    badgeText: 'text-white',
    glow: 'rgba(16, 185, 129, 0.25)',
    hex: '#059669',
  },
  {
    id: 'blue',
    name: 'Sapphire Blue',
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-500/15 dark:bg-blue-500/20',
    border: 'border-blue-500/40 dark:border-blue-500/30',
    text: 'text-blue-800 dark:text-blue-200',
    ring: 'ring-blue-500/50',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    glow: 'rgba(37, 99, 235, 0.25)',
    hex: '#2563eb',
  },
  {
    id: 'purple',
    name: 'Amethyst Purple',
    gradient: 'from-purple-500 to-violet-600',
    bg: 'bg-purple-500/15 dark:bg-purple-500/20',
    border: 'border-purple-500/40 dark:border-purple-500/30',
    text: 'text-purple-800 dark:text-purple-200',
    ring: 'ring-purple-500/50',
    badgeBg: 'bg-purple-600',
    badgeText: 'text-white',
    glow: 'rgba(147, 51, 234, 0.25)',
    hex: '#9333ea',
  },
  {
    id: 'amber',
    name: 'Warm Amber',
    gradient: 'from-amber-500 to-orange-600',
    bg: 'bg-amber-500/15 dark:bg-amber-500/20',
    border: 'border-amber-500/40 dark:border-amber-500/30',
    text: 'text-amber-900 dark:text-amber-200',
    ring: 'ring-amber-500/50',
    badgeBg: 'bg-amber-500',
    badgeText: 'text-white',
    glow: 'rgba(245, 158, 11, 0.25)',
    hex: '#d97706',
  },
  {
    id: 'teal',
    name: 'Persian Teal',
    gradient: 'from-teal-500 to-emerald-600',
    bg: 'bg-teal-500/15 dark:bg-teal-500/20',
    border: 'border-teal-500/40 dark:border-teal-500/30',
    text: 'text-teal-800 dark:text-teal-200',
    ring: 'ring-teal-500/50',
    badgeBg: 'bg-teal-600',
    badgeText: 'text-white',
    glow: 'rgba(20, 184, 166, 0.25)',
    hex: '#0d9488',
  },
  {
    id: 'indigo',
    name: 'Royal Indigo',
    gradient: 'from-indigo-500 to-blue-700',
    bg: 'bg-indigo-500/15 dark:bg-indigo-500/20',
    border: 'border-indigo-500/40 dark:border-indigo-500/30',
    text: 'text-indigo-800 dark:text-indigo-200',
    ring: 'ring-indigo-500/50',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    glow: 'rgba(99, 102, 241, 0.25)',
    hex: '#4f46e5',
  },
  {
    id: 'rose',
    name: 'Crimson Rose',
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-rose-500/15 dark:bg-rose-500/20',
    border: 'border-rose-500/40 dark:border-rose-500/30',
    text: 'text-rose-800 dark:text-rose-200',
    ring: 'ring-rose-500/50',
    badgeBg: 'bg-rose-600',
    badgeText: 'text-white',
    glow: 'rgba(244, 63, 94, 0.25)',
    hex: '#e11d48',
  },
  {
    id: 'cyan',
    name: 'Sky Cyan',
    gradient: 'from-cyan-500 to-teal-600',
    bg: 'bg-cyan-500/15 dark:bg-cyan-500/20',
    border: 'border-cyan-500/40 dark:border-cyan-500/30',
    text: 'text-cyan-800 dark:text-cyan-200',
    ring: 'ring-cyan-500/50',
    badgeBg: 'bg-cyan-600',
    badgeText: 'text-white',
    glow: 'rgba(6, 182, 212, 0.25)',
    hex: '#0891b2',
  },
  {
    id: 'orange',
    name: 'Copper Orange',
    gradient: 'from-orange-500 to-amber-700',
    bg: 'bg-orange-500/15 dark:bg-orange-500/20',
    border: 'border-orange-500/40 dark:border-orange-500/30',
    text: 'text-orange-900 dark:text-orange-200',
    ring: 'ring-orange-500/50',
    badgeBg: 'bg-orange-600',
    badgeText: 'text-white',
    glow: 'rgba(249, 115, 22, 0.25)',
    hex: '#ea580c',
  },
  {
    id: 'slate',
    name: 'Steel Slate',
    gradient: 'from-slate-600 to-gray-800',
    bg: 'bg-slate-500/15 dark:bg-slate-500/20',
    border: 'border-slate-500/40 dark:border-slate-500/30',
    text: 'text-slate-800 dark:text-slate-200',
    ring: 'ring-slate-500/50',
    badgeBg: 'bg-slate-700',
    badgeText: 'text-white',
    glow: 'rgba(100, 116, 139, 0.25)',
    hex: '#475569',
  },
];

/**
 * Deterministic string hash function
 */
function hashString(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/**
 * Returns the unique color theme assigned to the given batch name.
 * Normalizes input so "Batch 2024", "batch 2024", and " BATCH 2024 " resolve identically.
 */
export function getBatchTheme(batchName = 'General') {
  const clean = (batchName || 'General').trim().toLowerCase();
  const idx = hashString(clean) % BATCH_PALETTES.length;
  return BATCH_PALETTES[idx];
}
