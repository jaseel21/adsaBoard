import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  LayoutGrid,
  CreditCard,
  Filter,
  Shield,
  ChefHat,
  GraduationCap,
  Users,
  Smartphone,
  Laptop,
  Tablet,
  Clock,
  Radio,
  SlidersHorizontal,
  ChevronRight,
  Flame,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Zap,
} from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

/**
 * ApexFleetMatrix
 * High-performance grid of all connected live users.
 * Supports tactile keycaps mode and rich dossier cards mode with instant multi-filtering.
 */
export default function ApexFleetMatrix({
  sessions = [],
  selectedSession = null,
  onSelectSession,
  onTriggerAction,
  searchQuery = '',
  onSearchChange,
  selectedRole = 'all',
  onRoleChange,
  selectedDevice = 'all',
  onDeviceChange,
  sortBy = 'recent',
  onSortChange,
}) {
  const [viewDensity, setViewDensity] = useState('dossier'); // 'dossier' | 'keycaps'

  const getStatusColor = (s) => {
    if (s.isFrozen) return 'bg-red-500 text-white';
    if (s.status === 'away') return 'bg-gray-400 text-gray-900';
    if (s.status === 'idle') return 'bg-amber-400 text-gray-900';
    if (s.userType === 'student') return 'bg-emerald-500 text-white';
    if (s.role === 'cook' || s.route?.startsWith('/kitchen')) return 'bg-purple-500 text-white';
    if (s.userType === 'staff') return 'bg-cyan-500 text-white';
    return 'bg-blue-500 text-white';
  };

  const getDeviceIcon = (devType) => {
    if (devType === 'mobile') return Smartphone;
    if (devType === 'tablet') return Tablet;
    return Laptop;
  };

  const formatIdleTime = (sec = 0) => {
    if (sec < 60) return `${sec}s idle`;
    const m = Math.floor(sec / 60);
    return `${m}m idle`;
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar: Search, Filters, View Density */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 backdrop-blur-xl">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search token #, student name, batch, route, device..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 text-xs sm:text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          />
        </div>

        {/* View Density & Sort Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Density Toggle */}
          <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                setViewDensity('dossier');
              }}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewDensity === 'dossier'
                  ? 'bg-white dark:bg-[#15231f] text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title="Dossier Cards"
            >
              <CreditCard className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                setViewDensity('keycaps');
              }}
              className={`p-1.5 rounded-lg text-xs font-bold transition-all ${
                viewDensity === 'keycaps'
                  ? 'bg-white dark:bg-[#15231f] text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
              }`}
              title="Tactile Keycaps Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>

          {/* Sort Selector */}
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
          >
            <option value="recent">Most Recent</option>
            <option value="token">Token Number</option>
            <option value="idle">Inactivity Duration</option>
            <option value="route">Route Name</option>
          </select>
        </div>
      </div>

      {/* Quick Filter Pills */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        {[
          { id: 'all', label: 'All Fleet' },
          { id: 'student', label: 'Students', icon: GraduationCap },
          { id: 'kitchen', label: 'Kitchen / KDS', icon: ChefHat },
          { id: 'staff', label: 'Admins & Staff', icon: Shield },
          { id: 'guest', label: 'Public Visitors', icon: Users },
        ].map((pill) => {
          const PillIcon = pill.icon;
          return (
            <button
              key={pill.id}
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                onRoleChange(pill.id);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all ${
                selectedRole === pill.id
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'bg-white/80 dark:bg-white/5 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200/60 dark:border-white/5'
              }`}
            >
              {PillIcon && <PillIcon className="w-3.5 h-3.5" />}
              <span>{pill.label}</span>
            </button>
          );
        })}
      </div>

      {/* Empty State */}
      {sessions.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white/60 dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/10 space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <h4 className="text-base font-extrabold text-gray-900 dark:text-white">
            No Active Sessions Found
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
            No devices currently match your filter criteria or search query. As soon as users open the app, they appear instantly.
          </p>
        </div>
      ) : viewDensity === 'keycaps' ? (
        /* High-Density Tactile Keycaps Grid */
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
          {sessions.map((s) => {
            const isSelected = selectedSession?.sessionId === s.sessionId;
            const DeviceIcon = getDeviceIcon(s.device?.type);

            return (
              <motion.button
                key={s.sessionId}
                type="button"
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  soundEngine.playMechanicalClick();
                  hapticEngine.mediumTick();
                  if (onSelectSession) onSelectSession(s);
                }}
                className={`relative p-3 rounded-2xl flex flex-col items-center justify-center text-center transition-all select-none border ${
                  isSelected
                    ? 'bg-emerald-500/15 border-emerald-500 text-emerald-400 shadow-lg shadow-emerald-500/20 ring-2 ring-emerald-500/30'
                    : 'bg-white dark:bg-[#0c1613] border-gray-200/80 dark:border-white/10 hover:border-emerald-500/40 text-gray-800 dark:text-gray-200'
                }`}
              >
                {/* Status Dot */}
                <span
                  className={`absolute top-2 right-2 w-2 h-2 rounded-full ${getStatusColor(s)}`}
                />

                <DeviceIcon className="w-4 h-4 mb-1 text-gray-400" />

                <span className="text-sm font-black tracking-tight truncate max-w-full">
                  {s.userType === 'student' && s.tokenNo ? `#${s.tokenNo}` : s.identifier}
                </span>

                <span className="text-[10px] text-gray-400 truncate max-w-full mt-0.5">
                  {s.routeTitle || s.route}
                </span>
              </motion.button>
            );
          })}
        </div>
      ) : (
        /* Rich Dossier Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
          {sessions.map((s) => {
            const isSelected = selectedSession?.sessionId === s.sessionId;
            const DeviceIcon = getDeviceIcon(s.device?.type);

            return (
              <motion.div
                key={s.sessionId}
                whileHover={{ y: -2 }}
                onClick={() => {
                  soundEngine.playMechanicalClick();
                  hapticEngine.mediumTick();
                  if (onSelectSession) onSelectSession(s);
                }}
                className={`cursor-pointer p-4 rounded-2xl sm:rounded-3xl border transition-all duration-200 backdrop-blur-xl ${
                  isSelected
                    ? 'bg-emerald-500/10 dark:bg-emerald-950/30 border-emerald-500 shadow-xl shadow-emerald-500/15 ring-2 ring-emerald-500/20'
                    : 'bg-white/80 dark:bg-[#0b1411]/90 border-gray-200/80 dark:border-white/10 hover:border-emerald-500/40'
                }`}
              >
                {/* Header Row: Identity & Status Badge */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border border-white/10 shadow-sm ${
                        s.userType === 'student'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : s.userType === 'staff'
                          ? 'bg-cyan-500/15 text-cyan-400'
                          : s.role === 'cook'
                          ? 'bg-purple-500/15 text-purple-400'
                          : 'bg-blue-500/15 text-blue-400'
                      }`}
                    >
                      {s.userType === 'student' ? (
                        <GraduationCap className="w-5 h-5" />
                      ) : s.userType === 'staff' ? (
                        <Shield className="w-5 h-5" />
                      ) : s.role === 'cook' ? (
                        <ChefHat className="w-5 h-5" />
                      ) : (
                        <Users className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
                        {s.identifier}
                      </h4>
                      {s.batch && (
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                          {s.batch}
                        </p>
                      )}
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      s.status === 'active'
                        ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                        : s.status === 'idle'
                        ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                        : 'bg-gray-500/15 text-gray-400 border border-gray-500/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    <span>{s.status}</span>
                  </span>
                </div>

                {/* Telemetry Chips Row */}
                <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 space-y-1.5 text-xs text-gray-600 dark:text-gray-300 mb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-gray-400 text-[11px]">Active Screen:</span>
                    <span className="font-bold text-gray-900 dark:text-white truncate max-w-[180px]">
                      {s.routeTitle || s.route}
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400">
                      <DeviceIcon className="w-3.5 h-3.5" />
                      <span>{s.device?.os} ({s.device?.browser})</span>
                    </div>

                    <span className="text-emerald-500 font-extrabold">
                      {s.network?.latencyMs || 32}ms
                    </span>
                  </div>

                  {s.idleDurationSeconds > 0 && (
                    <div className="flex items-center justify-between gap-2 text-[11px] text-amber-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Inactivity:</span>
                      </span>
                      <span className="font-bold">{formatIdleTime(s.idleDurationSeconds)}</span>
                    </div>
                  )}
                </div>

                {/* Footer Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-white/5 text-xs">
                  <span className="text-[11px] text-gray-400 truncate">
                    Zone: <strong>{s.zone || 'Campus'}</strong>
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      soundEngine.playPop();
                      hapticEngine.lightTap();
                      if (onSelectSession) onSelectSession(s);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 transition-all transform active:scale-95"
                  >
                    <span>Inspect</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
