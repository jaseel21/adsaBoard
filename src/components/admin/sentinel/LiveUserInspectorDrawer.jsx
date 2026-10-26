import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Shield,
  ChefHat,
  GraduationCap,
  Users,
  Smartphone,
  Laptop,
  Tablet,
  Radio,
  Clock,
  Compass,
  AlertTriangle,
  LogOut,
  Lock,
  Unlock,
  RotateCcw,
  Bell,
  Activity,
  History,
  Sliders,
  ExternalLink,
  ChevronRight,
  Zap,
} from 'lucide-react';
import firebase from '../../../firebase/config';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';
import { dialog } from '../../../utils/dialog';
import { formatAuditTime } from '../../../utils/auditLogger';
import {
  remoteTerminateSession,
  remoteTeleportRoute,
  remoteBroadcastAlert,
  remoteFreezePortal,
  remoteUnfreezePortal,
  remotePingUser,
  remoteReloadClient,
} from '../../../utils/sentinelControlService';

import ActionKillSessionModal from './modals/ActionKillSessionModal';
import ActionTeleportModal from './modals/ActionTeleportModal';
import ActionBroadcastModal from './modals/ActionBroadcastModal';
import ActionFreezeModal from './modals/ActionFreezeModal';

/**
 * LiveUserInspectorDrawer
 * Deep telemetry analysis, correlated audit history, and direct intervention cockpit.
 */
export default function LiveUserInspectorDrawer({
  isOpen = false,
  session = null,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('telemetry'); // 'telemetry' | 'controls' | 'audits'
  const [correlatedLogs, setCorrelatedLogs] = useState([]);
  const [loadingAudits, setLoadingAudits] = useState(false);

  // Modal States
  const [showKillModal, setShowKillModal] = useState(false);
  const [showTeleportModal, setShowTeleportModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [showFreezeModal, setShowFreezeModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch Correlated Audit Logs when on 'audits' tab
  useEffect(() => {
    if (!isOpen || !session || activeTab !== 'audits') return;

    setLoadingAudits(true);
    let query = firebase.firestore().collection('audit_logs');

    if (session.tokenNo) {
      query = query.where('target.tokenNo', '==', Number(session.tokenNo));
    } else if (session.userId) {
      query = query.where('actor.uid', '==', session.userId);
    }

    query
      .orderBy('timestamp', 'desc')
      .limit(25)
      .get()
      .then((snap) => {
        const logs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setCorrelatedLogs(logs);
        setLoadingAudits(false);
      })
      .catch((err) => {
        console.warn('Could not query correlated audit logs:', err);
        setLoadingAudits(false);
      });
  }, [isOpen, session, activeTab]);

  if (!isOpen || !session) return null;

  const handleTabChange = (tab) => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setActiveTab(tab);
  };

  // Remote Action Handlers
  const handlePing = async () => {
    soundEngine.playSoftChime();
    hapticEngine.lightTap();
    setActionLoading(true);
    try {
      await remotePingUser(session, 'Administrator sent a quick verification ping');
      dialog.toast.success('Ping Dispatched', `Attention signal sent to ${session.identifier}`, 3000);
    } catch (_) {
      dialog.toast.error('Dispatch Failed', 'Could not transmit ping to user', 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReload = async () => {
    soundEngine.playSoftChime();
    hapticEngine.mediumTick();
    setActionLoading(true);
    try {
      await remoteReloadClient(session, 'Applying administrative updates');
      dialog.toast.info('Reload Command Sent', `Instructed ${session.identifier} to reload`, 3000);
    } catch (_) {
      dialog.toast.error('Failed', 'Could not send reload command', 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmKill = async (reason) => {
    setActionLoading(true);
    try {
      await remoteTerminateSession(session, reason);
      dialog.toast.success('Session Terminated', `Forced logout for ${session.identifier}`, 3500);
      setShowKillModal(false);
      onClose();
    } catch (_) {
      dialog.toast.error('Termination Failed', 'Error dispatching logout command', 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmTeleport = async (route, reason) => {
    setActionLoading(true);
    try {
      await remoteTeleportRoute(session, route, reason);
      dialog.toast.success('Teleported', `Directed ${session.identifier} to ${route}`, 3500);
      setShowTeleportModal(false);
    } catch (_) {
      dialog.toast.error('Teleport Failed', 'Could not direct user route', 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmBroadcast = async ({ title, message, severity, requireAcknowledgement }) => {
    setActionLoading(true);
    try {
      await remoteBroadcastAlert({
        targetSession: session,
        title,
        message,
        severity,
        requireAcknowledgement,
      });
      dialog.toast.success('Alert Dispatched', `Modal notice sent to ${session.identifier}`, 3500);
      setShowBroadcastModal(false);
    } catch (_) {
      dialog.toast.error('Alert Failed', 'Could not transmit alert notice', 3000);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmFreeze = async (reason) => {
    setActionLoading(true);
    try {
      if (session.isFrozen) {
        await remoteUnfreezePortal(session, reason);
        dialog.toast.success('Portal Restored', `Unfrozen access for ${session.identifier}`, 3500);
      } else {
        await remoteFreezePortal(session, reason);
        dialog.toast.warning('Portal Frozen', `Locked access for ${session.identifier}`, 3500);
      }
      setShowFreezeModal(false);
    } catch (_) {
      dialog.toast.error('Action Failed', 'Could not update freeze state', 3000);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 27, stiffness: 320 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-xl h-full bg-[#0a1310] text-white border-l border-white/10 shadow-2xl flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="p-5 border-b border-white/10 bg-[#0d1815] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border border-white/15 ${
                  session.userType === 'student'
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : session.userType === 'staff'
                    ? 'bg-cyan-500/20 text-cyan-400'
                    : session.role === 'cook'
                    ? 'bg-purple-500/20 text-purple-400'
                    : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {session.userType === 'student' ? (
                  <GraduationCap className="w-6 h-6" />
                ) : session.userType === 'staff' ? (
                  <Shield className="w-6 h-6" />
                ) : session.role === 'cook' ? (
                  <ChefHat className="w-6 h-6" />
                ) : (
                  <Users className="w-6 h-6" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-black text-white truncate">
                    {session.identifier}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                      session.isFrozen
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : session.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {session.isFrozen ? 'FROZEN' : session.status}
                  </span>
                </div>
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  Session: <code className="font-mono text-gray-300">{session.sessionId}</code>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 3-Tab Ribbon */}
          <div className="p-2 border-b border-white/10 flex items-center gap-1 bg-black/20">
            {[
              { id: 'telemetry', label: 'Live Telemetry', icon: Activity },
              { id: 'controls', label: 'Remote Cockpit', icon: Zap },
              { id: 'audits', label: 'Correlated Audit Trail', icon: History },
            ].map((tab) => {
              const TabIcon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <TabIcon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === 'telemetry' && (
              <div className="space-y-4">
                {/* Diagnostics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Current Route
                    </span>
                    <p className="text-sm font-extrabold text-white truncate">
                      {session.routeTitle || session.route}
                    </p>
                    <span className="text-[10px] text-gray-400 block font-mono">
                      {session.route}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Network Latency (RTT)
                    </span>
                    <p className="text-sm font-extrabold text-emerald-400 flex items-center gap-1.5">
                      <Radio className="w-4 h-4 animate-pulse" />
                      <span>{session.network?.latencyMs || 28} ms</span>
                    </p>
                    <span className="text-[10px] text-gray-400 block">
                      Type: {session.network?.effectiveType || 'Broadband'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Device & OS
                    </span>
                    <p className="text-sm font-extrabold text-white">
                      {session.device?.os} ({session.device?.browser})
                    </p>
                    <span className="text-[10px] text-gray-400 block">
                      Screen: {session.device?.viewport} ({session.device?.type})
                    </span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10 space-y-1">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                      Campus Zone
                    </span>
                    <p className="text-sm font-extrabold text-teal-300 capitalize">
                      {session.zone?.replace('_', ' ') || 'Campus Wide'}
                    </p>
                    <span className="text-[10px] text-gray-400 block">
                      Tab: {session.isTabFocused ? 'Focused Active' : 'Background Tab'}
                    </span>
                  </div>
                </div>

                {/* Inactivity & Freeze Banner */}
                {session.isFrozen && (
                  <div className="p-4 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-300 text-xs space-y-1">
                    <div className="flex items-center gap-2 font-black">
                      <Lock className="w-4 h-4 text-red-400" />
                      <span>Portal Locked by Admin</span>
                    </div>
                    <p>{session.freezeReason || 'Administrative lock applied.'}</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'controls' && (
              <div className="space-y-3">
                <p className="text-xs text-gray-400 mb-2">
                  Immediate remote administrative actions applied directly to this client device:
                </p>

                {/* Action 1: Attention Ping */}
                <button
                  type="button"
                  onClick={handlePing}
                  disabled={actionLoading}
                  className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-emerald-600/20 border border-white/10 hover:border-emerald-500/40 text-left transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Send Attention Ping</h4>
                      <p className="text-[11px] text-gray-400">
                        Plays a gentle audio chime and haptic tap on the client screen
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>

                {/* Action 2: Direct Broadcast Modal */}
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(true)}
                  disabled={actionLoading}
                  className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-amber-600/20 border border-white/10 hover:border-amber-500/40 text-left transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Targeted Alert Notice</h4>
                      <p className="text-[11px] text-gray-400">
                        Pushes a high-priority frosted modal requiring user acknowledgment
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>

                {/* Action 3: Route Teleport */}
                <button
                  type="button"
                  onClick={() => setShowTeleportModal(true)}
                  disabled={actionLoading}
                  className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-teal-600/20 border border-white/10 hover:border-teal-500/40 text-left transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                      <Compass className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Teleport User Route</h4>
                      <p className="text-[11px] text-gray-400">
                        Navigate user to /menu, /supply, /adab, or /avoiders instantly
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>

                {/* Action 4: Freeze / Unfreeze Portal */}
                <button
                  type="button"
                  onClick={() => setShowFreezeModal(true)}
                  disabled={actionLoading}
                  className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-cyan-600/20 border border-white/10 hover:border-cyan-500/40 text-left transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
                      {session.isFrozen ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">
                        {session.isFrozen ? 'Restore Portal (Unfreeze)' : 'Freeze Dining Portal (Lock)'}
                      </h4>
                      <p className="text-[11px] text-gray-400">
                        {session.isFrozen ? 'Restore editing permissions' : 'Lock token toggles during crunch'}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>

                {/* Action 5: Force Reload */}
                <button
                  type="button"
                  onClick={handleReload}
                  disabled={actionLoading}
                  className="w-full p-3.5 rounded-2xl bg-white/5 hover:bg-blue-600/20 border border-white/10 hover:border-blue-500/40 text-left transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center shrink-0">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-white">Soft Client Reload</h4>
                      <p className="text-[11px] text-gray-400">
                        Refreshes client web page for latest cache and code bundles
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </button>

                {/* Action 6: Force Logout / Terminate */}
                <button
                  type="button"
                  onClick={() => setShowKillModal(true)}
                  disabled={actionLoading}
                  className="w-full p-3.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-left transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                      <LogOut className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-red-400">Force Session Termination</h4>
                      <p className="text-[11px] text-gray-400">
                        Immediately kicks user, purges session tokens, and logs security audit
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-red-400" />
                </button>
              </div>
            )}

            {activeTab === 'audits' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Audit records matching <strong>{session.identifier}</strong>:
                  </span>
                  <span className="text-[11px] font-bold text-emerald-400">
                    {correlatedLogs.length} events
                  </span>
                </div>

                {loadingAudits ? (
                  <div className="p-8 text-center text-xs text-gray-400 flex flex-col items-center gap-2">
                    <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span>Querying historical audit trail...</span>
                  </div>
                ) : correlatedLogs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-gray-400 rounded-2xl bg-white/5 border border-white/5">
                    No previous audit records found for this identity.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {correlatedLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-3 rounded-2xl bg-white/5 border border-white/10 space-y-1 text-xs"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono text-emerald-400 uppercase font-black">
                            {log.action}
                          </span>
                          <span className="text-gray-400">{formatAuditTime(log.timestamp)}</span>
                        </div>
                        <p className="font-semibold text-gray-200">
                          {log.changes?.diffSummary || log.action}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Child Action Modals */}
      <ActionKillSessionModal
        isOpen={showKillModal}
        onClose={() => setShowKillModal(false)}
        session={session}
        onConfirm={handleConfirmKill}
        loading={actionLoading}
      />

      <ActionTeleportModal
        isOpen={showTeleportModal}
        onClose={() => setShowTeleportModal(false)}
        session={session}
        onConfirm={handleConfirmTeleport}
        loading={actionLoading}
      />

      <ActionBroadcastModal
        isOpen={showBroadcastModal}
        onClose={() => setShowBroadcastModal(false)}
        session={session}
        onConfirm={handleConfirmBroadcast}
        loading={actionLoading}
      />

      <ActionFreezeModal
        isOpen={showFreezeModal}
        onClose={() => setShowFreezeModal(false)}
        session={session}
        isCurrentlyFrozen={session.isFrozen}
        onConfirm={handleConfirmFreeze}
        loading={actionLoading}
      />
    </AnimatePresence>
  );
}
