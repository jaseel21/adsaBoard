import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  Radio,
  Users,
  ChefHat,
  GraduationCap,
  Shield,
  Activity,
  Layers,
  LayoutGrid,
  Bell,
  RefreshCw,
  Search,
  Building2,
  Sparkles,
} from 'lucide-react';
import { useSentinelFleetData } from '../../../hooks/useSentinelFleetData';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';
import { dialog } from '../../../utils/dialog';
import { remoteBroadcastAlert } from '../../../utils/sentinelControlService';
import useSEO from '../../../hooks/useSEO';

import ApexOrbitalRadar from './ApexOrbitalRadar';
import ApexFleetMatrix from './ApexFleetMatrix';
import CampusZoneTopology from './CampusZoneTopology';
import LiveActivityStream from './LiveActivityStream';
import LiveUserInspectorDrawer from './LiveUserInspectorDrawer';
import ActionBroadcastModal from './modals/ActionBroadcastModal';

/**
 * ApexSentinelDashboard
 * Executive Real-Time Live User Tracking, Activity Tracing & Remote Administrative Control Console.
 */
export default function ApexSentinelDashboard() {
  useSEO({
    title: 'Apex Sentinel: Live Fleet Radar & Control Console',
    description: 'Executive real-time user presence tracking, live activity tracing, and remote administrative intervention cockpit.',
  });

  const {
    sessions,
    filteredSessions,
    telemetry,
    loading,
    searchQuery,
    setSearchQuery,
    selectedRole,
    setSelectedRole,
    selectedZone,
    setSelectedZone,
    selectedDevice,
    setSelectedDevice,
    sortBy,
    setSortBy,
  } = useSentinelFleetData();

  // Active Surface Tab: 'radar' | 'matrix' | 'topology' | 'stream'
  const [activeSurface, setActiveSurface] = useState('radar');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showFleetBroadcastModal, setShowFleetBroadcastModal] = useState(false);
  const [broadcasting, setBroadcasting] = useState(false);

  const handleSurfaceChange = (surface) => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setActiveSurface(surface);
  };

  const handleSelectSession = (sess) => {
    setSelectedSession(sess);
  };

  const handleSelectSessionByToken = (tokenNo) => {
    const found = sessions.find((s) => Number(s.tokenNo) === Number(tokenNo));
    if (found) {
      setSelectedSession(found);
    } else {
      dialog.toast.info(`Token #${tokenNo}`, 'Device not currently active online in live sessions.', 3000);
    }
  };

  const handleFleetBroadcast = async ({ title, message, severity, requireAcknowledgement }) => {
    setBroadcasting(true);
    try {
      await remoteBroadcastAlert({
        isFleet: true,
        title,
        message,
        severity,
        requireAcknowledgement,
      });
      dialog.toast.success('Fleet Broadcast Dispatched', 'Transmitted to all connected devices.', 4000);
      setShowFleetBroadcastModal(false);
    } catch (_) {
      dialog.toast.error('Dispatch Failed', 'Could not broadcast notice.', 3000);
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Executive Command Header */}
      <div className="p-5 sm:p-7 rounded-3xl bg-white/80 dark:bg-[#08120e]/90 border border-gray-200/80 dark:border-emerald-500/20 shadow-xl backdrop-blur-2xl">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-600 to-cyan-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/25 shrink-0 ring-4 ring-emerald-500/10">
              <Compass className="w-7 h-7 animate-spin" style={{ animationDuration: '30s' }} />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Apex Sentinel: Live Fleet Overseer
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span>LIVE PRESENCE</span>
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
                Real-time situational telemetry, continuous activity tracing, and remote intervention cockpit
              </p>
            </div>
          </div>

          {/* Quick Fleet Broadcast Trigger */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playPop();
              hapticEngine.lightTap();
              setShowFleetBroadcastModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-transform transform active:scale-95 shrink-0"
          >
            <Bell className="w-4 h-4 animate-bounce" />
            <span>Broadcast Fleet Alert</span>
          </button>
        </div>

        {/* Telemetry HUD Counter Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-gray-100 dark:border-white/5">
          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
              Total Live Devices
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {telemetry.totalOnline}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
              Active Students
            </span>
            <span className="text-2xl font-black text-teal-600 dark:text-teal-400">
              {telemetry.studentCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
              Kitchen Terminals
            </span>
            <span className="text-2xl font-black text-purple-600 dark:text-purple-400">
              {telemetry.kitchenCount}
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
            <span className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">
              Admins & Staff
            </span>
            <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
              {telemetry.staffCount}
            </span>
          </div>
        </div>
      </div>

      {/* Surface Switcher Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 backdrop-blur-xl overflow-x-auto no-scrollbar">
        {[
          { id: 'radar', label: 'Orbital Radar HUD', icon: Compass },
          { id: 'matrix', label: 'Tactical Fleet Matrix', icon: LayoutGrid },
          { id: 'topology', label: 'Campus Zone Topology', icon: Building2 },
          { id: 'stream', label: 'Live Activity Stream', icon: Activity },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isSelected = activeSurface === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleSurfaceChange(tab.id)}
              className={`relative flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-black text-xs sm:text-sm transition-all shrink-0 select-none ${
                isSelected
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {isSelected && (
                <motion.div
                  layoutId="sentinelActiveSurfacePill"
                  className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-md shadow-emerald-600/30"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}
              <TabIcon className="w-4 h-4 relative z-10 shrink-0" />
              <span className="relative z-10">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Surface Render Area */}
      <div className="transition-all duration-300">
        {activeSurface === 'radar' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7">
              <ApexOrbitalRadar
                sessions={filteredSessions}
                selectedSession={selectedSession}
                onSelectSession={handleSelectSession}
              />
            </div>
            <div className="lg:col-span-5 p-5 rounded-3xl bg-white/80 dark:bg-[#0c1613]/90 border border-gray-200/80 dark:border-white/10 shadow-xl backdrop-blur-xl">
              <LiveActivityStream onSelectSessionByToken={handleSelectSessionByToken} />
            </div>
          </div>
        )}

        {activeSurface === 'matrix' && (
          <ApexFleetMatrix
            sessions={filteredSessions}
            selectedSession={selectedSession}
            onSelectSession={handleSelectSession}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedRole={selectedRole}
            onRoleChange={setSelectedRole}
            selectedDevice={selectedDevice}
            onDeviceChange={setSelectedDevice}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />
        )}

        {activeSurface === 'topology' && (
          <CampusZoneTopology
            sessions={sessions}
            selectedZone={selectedZone}
            onSelectZone={setSelectedZone}
            onSelectSession={handleSelectSession}
          />
        )}

        {activeSurface === 'stream' && (
          <div className="max-w-3xl mx-auto p-6 rounded-3xl bg-white/80 dark:bg-[#0c1613]/90 border border-gray-200/80 dark:border-white/10 shadow-xl backdrop-blur-xl">
            <LiveActivityStream onSelectSessionByToken={handleSelectSessionByToken} />
          </div>
        )}
      </div>

      {/* Deep-Dive Live User Inspector Drawer */}
      <LiveUserInspectorDrawer
        isOpen={Boolean(selectedSession)}
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />

      {/* Fleet Broadcast Modal */}
      <ActionBroadcastModal
        isOpen={showFleetBroadcastModal}
        onClose={() => setShowFleetBroadcastModal(false)}
        isFleet={true}
        onConfirm={handleFleetBroadcast}
        loading={broadcasting}
      />
    </div>
  );
}
