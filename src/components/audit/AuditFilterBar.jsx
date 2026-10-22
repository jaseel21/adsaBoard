import React from 'react';
import { motion } from 'framer-motion';
import {
  Search,
  Filter,
  Sliders,
  Users,
  UtensilsCrossed,
  ShieldAlert,
  Radio,
  X,
  Shield,
  GraduationCap,
  Printer,
} from 'lucide-react';
import { AUDIT_CATEGORIES } from '../../utils/auditLogger';

export default function AuditFilterBar({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onSelectCategory,
  selectedSeverity,
  onSelectSeverity,
  selectedActorRole,
  onSelectActorRole,
  countsByCategory = {},
  isLiveStreaming = true,
  onResetFilters,
  onHapticFeedback,
}) {
  const categories = [
    { id: 'all', label: 'All Activity', icon: Filter },
    { id: AUDIT_CATEGORIES.CANTEEN, label: 'Canteen & Supply', icon: Printer },
    { id: AUDIT_CATEGORIES.TOKENS, label: 'Tokens', icon: Sliders },
    { id: AUDIT_CATEGORIES.DIETARY, label: 'Dietary', icon: UtensilsCrossed },
    { id: AUDIT_CATEGORIES.STUDENTS, label: 'Students', icon: Users },
    { id: AUDIT_CATEGORIES.MENU, label: 'Menu', icon: UtensilsCrossed },
    { id: AUDIT_CATEGORIES.SECURITY, label: 'Security', icon: ShieldAlert },
  ];

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    selectedCategory !== 'all' ||
    selectedSeverity !== 'all' ||
    selectedActorRole !== 'all';

  return (
    <div className="space-y-3">
      {/* Search Input & Radar Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Omni Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search action, token #, admin email, student name, diff..."
            className="w-full pl-10 pr-9 py-2.5 rounded-2xl bg-white/80 dark:bg-[#0f1715]/80 border border-gray-200/80 dark:border-white/10 text-xs sm:text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm backdrop-blur-xl transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                if (onHapticFeedback) onHapticFeedback('tick');
                onSearchChange('');
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Live Radar Status + Secondary Dropdowns */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-between sm:justify-end">
          {/* Severity selector */}
          <select
            value={selectedSeverity}
            onChange={(e) => {
              if (onHapticFeedback) onHapticFeedback('tick');
              onSelectSeverity(e.target.value);
            }}
            className="px-3 py-2.5 rounded-2xl bg-white/80 dark:bg-[#0f1715]/80 border border-gray-200/80 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm backdrop-blur-xl"
          >
            <option value="all">Severity: All</option>
            <option value="info">Info</option>
            <option value="notice">Notice</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
            <option value="emergency">Emergency</option>
          </select>

          {/* Actor Role selector */}
          <select
            value={selectedActorRole}
            onChange={(e) => {
              if (onHapticFeedback) onHapticFeedback('tick');
              onSelectActorRole(e.target.value);
            }}
            className="px-3 py-2.5 rounded-2xl bg-white/80 dark:bg-[#0f1715]/80 border border-gray-200/80 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 shadow-sm backdrop-blur-xl"
          >
            <option value="all">Actor: Everyone</option>
            <option value="admin">Committee Admins</option>
            <option value="student">Student Self-Service</option>
            <option value="system">System Automated</option>
          </select>

          {/* Live Radar Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl border text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-xl select-none ${
              isLiveStreaming
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 shadow-glow-emerald/30'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="hidden xs:inline">Live Radar</span>
          </div>

          {/* Reset Filters Pill */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                if (onHapticFeedback) onHapticFeedback('tick');
                onResetFilters();
              }}
              className="p-2.5 rounded-2xl bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
              title="Reset all filters"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Category Pills (Touch scrollable on mobile) */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none touch-pan-x pb-1 pt-0.5">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          const Icon = cat.icon;
          const count = countsByCategory[cat.id] ?? (cat.id === 'all' ? countsByCategory.total : 0);

          return (
            <button
              key={cat.id}
              onClick={() => {
                if (onHapticFeedback) onHapticFeedback('tick');
                onSelectCategory(cat.id);
              }}
              className={`relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 select-none ${
                isSelected
                  ? 'text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/5 hover:border-emerald-500/30'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="auditActiveCategoryPill"
                  className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl shadow-md"
                  transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                />
              )}

              <Icon className="w-3.5 h-3.5 relative z-10 shrink-0" />
              <span className="relative z-10 whitespace-nowrap">{cat.label}</span>
              {typeof count === 'number' && (
                <span
                  className={`relative z-10 px-1.5 py-0.2 rounded-md text-[10px] font-extrabold ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
