import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Radio,
  Crosshair,
  Shield,
  ChefHat,
  GraduationCap,
  Users,
  Smartphone,
  Laptop,
  Tablet,
  Activity,
  Zap,
  Clock,
  Sparkles,
} from 'lucide-react';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

/**
 * ApexOrbitalRadar
 * Aerospace-grade 360° SVG conical radar sweep and polar coordinate node field.
 * Visualizes live users orbiting the institutional central server core.
 */
export default function ApexOrbitalRadar({
  sessions = [],
  selectedSession = null,
  onSelectSession,
  onTriggerAction,
}) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const containerRef = useRef(null);

  // Map sessions onto polar coordinates (angle theta, radius r)
  const radarNodes = useMemo(() => {
    const cx = 250;
    const cy = 250;

    // 3 Concentric Ring Radii
    const R_INNER = 85;   // Admins & Kitchen (Core Operators)
    const R_MIDDLE = 150; // Active Students (Dining Members)
    const R_OUTER = 210;  // Public Visitors & Guests

    // Deterministic pseudo-random angle generator from session ID string
    const getAngleFromId = (id, offsetIndex, totalInGroup) => {
      let hash = 0;
      for (let i = 0; i < id.length; i++) {
        hash = (hash << 5) - hash + id.charCodeAt(i);
        hash |= 0;
      }
      const baseAngle = ((Math.abs(hash) % 360) * Math.PI) / 180;
      // Evenly distribute within group to avoid overlapping
      const dispersion = (offsetIndex / Math.max(1, totalInGroup)) * 2 * Math.PI;
      return (baseAngle + dispersion) % (2 * Math.PI);
    };

    const innerGroup = sessions.filter(
      (s) => s.userType === 'staff' || s.role === 'cook' || s.route?.startsWith('/kitchen')
    );
    const middleGroup = sessions.filter((s) => s.userType === 'student');
    const outerGroup = sessions.filter(
      (s) => s.userType !== 'student' && s.userType !== 'staff' && s.role !== 'cook'
    );

    const nodes = [];

    // Helper to position
    const processGroup = (group, radius) => {
      group.forEach((s, idx) => {
        const theta = getAngleFromId(s.sessionId, idx, group.length);
        // Add subtle radial variation (+/- 12px)
        const r = radius + ((idx % 3) - 1) * 10;
        const x = cx + r * Math.cos(theta);
        const y = cy + r * Math.sin(theta);

        nodes.push({
          session: s,
          x,
          y,
          r,
          theta,
          radiusCategory: radius === R_INNER ? 'inner' : radius === R_MIDDLE ? 'middle' : 'outer',
        });
      });
    };

    processGroup(innerGroup, R_INNER);
    processGroup(middleGroup, R_MIDDLE);
    processGroup(outerGroup, R_OUTER);

    return nodes;
  }, [sessions]);

  const handleNodeClick = (node, e) => {
    e.stopPropagation();
    soundEngine.playMechanicalClick();
    hapticEngine.mediumTick();
    if (onSelectSession) onSelectSession(node.session);
  };

  const getNodeColor = (s) => {
    if (s.isFrozen) return '#ef4444'; // Red for frozen
    if (s.status === 'away') return '#9ca3af'; // Gray
    if (s.status === 'idle') return '#f59e0b'; // Amber

    if (s.userType === 'student') return '#10b981'; // Emerald
    if (s.role === 'cook' || s.route?.startsWith('/kitchen')) return '#8b5cf6'; // Violet
    if (s.userType === 'staff') return '#06b6d4'; // Cyan
    return '#3b82f6'; // Blue
  };

  const getDeviceIcon = (devType) => {
    if (devType === 'mobile') return Smartphone;
    if (devType === 'tablet') return Tablet;
    return Laptop;
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full aspect-square max-w-[560px] mx-auto select-none flex items-center justify-center p-2 sm:p-4 rounded-3xl bg-[#070e0c]/90 border border-emerald-500/20 shadow-2xl backdrop-blur-2xl overflow-hidden"
    >
      {/* Ambient Grid Lines Background */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b98115_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-40" />

      {/* SVG Radar Display */}
      <svg
        viewBox="0 0 500 500"
        className="w-full h-full relative z-10 overflow-visible"
      >
        <defs>
          {/* Conical Gradient for the Sweep */}
          <linearGradient id="radarSweepGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#06b6d4" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>

          {/* Node Glow Filters */}
          <filter id="emeraldGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Radar Concentric Rings */}
        <circle cx="250" cy="250" r="85" fill="none" stroke="#10b981" strokeOpacity="0.15" strokeDasharray="3 3" />
        <circle cx="250" cy="250" r="150" fill="none" stroke="#10b981" strokeOpacity="0.2" strokeWidth="1" />
        <circle cx="250" cy="250" r="210" fill="none" stroke="#10b981" strokeOpacity="0.15" strokeDasharray="4 4" />

        {/* Crosshair Axes */}
        <line x1="40" y1="250" x2="460" y2="250" stroke="#10b981" strokeOpacity="0.12" strokeWidth="1" />
        <line x1="250" y1="40" x2="250" y2="460" stroke="#10b981" strokeOpacity="0.12" strokeWidth="1" />
        <line x1="102" y1="102" x2="398" y2="398" stroke="#10b981" strokeOpacity="0.06" strokeDasharray="2 4" />
        <line x1="398" y1="102" x2="102" y2="398" stroke="#10b981" strokeOpacity="0.06" strokeDasharray="2 4" />

        {/* Center Institutional Server Core */}
        <g transform="translate(250, 250)">
          <circle r="22" fill="#042f2e" stroke="#10b981" strokeWidth="1.5" />
          <circle r="30" fill="none" stroke="#10b981" strokeOpacity="0.3" className="animate-ping" style={{ animationDuration: '3s' }} />
          <Compass className="w-5 h-5 text-emerald-400 -translate-x-2.5 -translate-y-2.5 pointer-events-none" />
        </g>

        {/* Rotating Radar Conical Sweep */}
        <g transform="translate(250, 250)">
          <g className="origin-center animate-[spin_6s_linear_infinite]">
            {/* Sweep Pie Slice */}
            <path
              d="M 0 0 L 0 -220 A 220 220 0 0 1 155 -155 Z"
              fill="url(#radarSweepGradient)"
              opacity="0.65"
            />
            {/* Leading Edge Line */}
            <line x1="0" y1="0" x2="0" y2="-225" stroke="#34d399" strokeWidth="1.5" strokeOpacity="0.9" />
          </g>
        </g>

        {/* Connected User Nodes */}
        {radarNodes.map((node) => {
          const s = node.session;
          const isSelected = selectedSession?.sessionId === s.sessionId;
          const isHovered = hoveredNode?.sessionId === s.sessionId;
          const color = getNodeColor(s);

          return (
            <g
              key={s.sessionId}
              transform={`translate(${node.x}, ${node.y})`}
              className="cursor-pointer transition-transform"
              onClick={(e) => handleNodeClick(node, e)}
              onMouseEnter={() => setHoveredNode(s)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* Outer Pulse Ripple on Hover / Selection */}
              {(isSelected || isHovered) && (
                <circle
                  r="18"
                  fill="none"
                  stroke={color}
                  strokeWidth="1.5"
                  strokeOpacity="0.75"
                  className="animate-ping"
                  style={{ animationDuration: '1.5s' }}
                />
              )}

              {/* Target Reticle Box if Selected */}
              {isSelected && (
                <rect
                  x="-14"
                  y="-14"
                  width="28"
                  height="28"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                  className="animate-[spin_10s_linear_infinite]"
                />
              )}

              {/* Node Aura */}
              <circle r="9" fill={color} fillOpacity="0.25" filter="url(#emeraldGlow)" />

              {/* Node Core Dot */}
              <circle
                r={isSelected ? 6 : 4.5}
                fill={color}
                stroke="#09120f"
                strokeWidth="1.5"
                className="transition-all duration-200"
              />

              {/* Token # or Role Monogram */}
              {s.userType === 'student' && s.tokenNo ? (
                <text
                  y="16"
                  textAnchor="middle"
                  fill="#d1fae5"
                  fontSize="9"
                  fontWeight="900"
                  className="pointer-events-none select-none tracking-tight drop-shadow-md"
                >
                  #{s.tokenNo}
                </text>
              ) : s.userType === 'staff' ? (
                <text
                  y="16"
                  textAnchor="middle"
                  fill="#a5f3fc"
                  fontSize="8"
                  fontWeight="800"
                  className="pointer-events-none select-none tracking-tight drop-shadow-md"
                >
                  ADMIN
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      {/* Floating HUD Reticle Card when a node is hovered or selected */}
      <AnimatePresence>
        {(hoveredNode || selectedSession) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-4 inset-x-4 sm:inset-x-8 z-20 p-3 sm:p-3.5 rounded-2xl bg-[#091512]/95 border border-emerald-500/30 shadow-2xl backdrop-blur-xl flex items-center justify-between gap-3 text-xs"
          >
            {(() => {
              const active = hoveredNode || selectedSession;
              const DeviceIcon = getDeviceIcon(active.device?.type);
              const color = getNodeColor(active);

              return (
                <>
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/10 shadow-sm"
                      style={{ backgroundColor: `${color}25` }}
                    >
                      {active.userType === 'student' ? (
                        <GraduationCap className="w-5 h-5 text-emerald-400" />
                      ) : active.userType === 'staff' ? (
                        <Shield className="w-5 h-5 text-cyan-400" />
                      ) : active.role === 'cook' ? (
                        <ChefHat className="w-5 h-5 text-purple-400" />
                      ) : (
                        <Users className="w-5 h-5 text-blue-400" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white truncate text-xs sm:text-sm">
                          {active.identifier}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider"
                          style={{ backgroundColor: `${color}25`, color }}
                        >
                          {active.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-gray-400 truncate">
                        <span className="truncate">{active.routeTitle || active.route}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 shrink-0">
                          <DeviceIcon className="w-3 h-3" />
                          <span>{active.device?.os}</span>
                        </span>
                        <span>•</span>
                        <span className="text-emerald-400 font-bold shrink-0">
                          {active.network?.latencyMs || 28}ms
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Inspect Button */}
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playPop();
                      hapticEngine.lightTap();
                      if (onSelectSession) onSelectSession(active);
                    }}
                    className="shrink-0 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-600/30 transition-all transform active:scale-95"
                  >
                    Inspect
                  </button>
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Radar Legend Chips */}
      <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 flex items-center justify-between text-[11px] text-gray-400 pointer-events-none">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
          <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span className="font-bold text-gray-200">RADAR SWEEP ACTIVE</span>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md">
          <span className="text-emerald-400 font-extrabold">{sessions.length}</span>
          <span className="text-gray-400">NODES TRACKED</span>
        </div>
      </div>
    </div>
  );
}
