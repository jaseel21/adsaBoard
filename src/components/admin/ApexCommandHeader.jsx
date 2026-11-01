import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  ShieldCheck,
  Lock,
  Unlock,
  Sliders,
  Users,
  Sparkles,
  Sun,
  Sunset,
  Moon,
  AlertCircle,
  HelpCircle,
  LayoutDashboard,
  Command,
} from 'lucide-react';
import { useWorldTime } from '../../utils/time';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { useLanguage } from '../../store/LanguageContext';

export default function ApexCommandHeader({
  effectiveMode,
  isTomorrowLocked,
  lockStartTime,
  lockEndTime,
  onOpenLockModal,
  onOpenBlockModal,
  onOpenGovernanceModal,
  onOpenBackupVault,
  onToggleLock,
  onOpenStaffModal,
  onOpenNoticeManager,
  onOpenBulkModal,
  isCentralCommittee = false,
  roleBadge,
  user,
}) {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { timeHms, timeAmPm, dayLong, longDate } = useWorldTime('Asia/Kolkata');

  // Compute atmospheric phase from current IST hour
  const atmosphericPhase = useMemo(() => {
    if (!timeHms) return { phase: 'day', label: 'Daylight Shift', icon: Sun, color: 'emerald' };
    const hour = parseInt(timeHms.slice(0, 2), 10);
    if (hour >= 5 && hour < 11) {
      return { phase: 'morning', label: 'Morning Prep Shift', icon: Sun, color: 'teal' };
    }
    if (hour >= 11 && hour < 16) {
      return { phase: 'afternoon', label: 'Midday Dining Service', icon: Sun, color: 'emerald' };
    }
    if (hour >= 16 && hour < 20) {
      return { phase: 'evening', label: 'Evening Shift', icon: Sunset, color: 'amber' };
    }
    return { phase: 'night', label: 'Night Standby', icon: Moon, color: 'indigo' };
  }, [timeHms]);

  // Compute Cutoff Progress (toward 14:00 IST)
  const cutoffProgress = useMemo(() => {
    if (!timeHms) return { percent: 50, remainingStr: '--', isUrgent: false };
    const [h, m, s] = timeHms.split(':').map(Number);
    const currentMins = h * 60 + m;
    const cutoffMins = 14 * 60; // 2:00 PM IST = 840 mins

    if (currentMins >= cutoffMins) {
      return {
        percent: 100,
        remainingStr: 'Cutoff Closed',
        isUrgent: false,
      };
    }

    const diffMins = cutoffMins - currentMins;
    const hoursLeft = Math.floor(diffMins / 60);
    const minsLeft = diffMins % 60;
    const percent = Math.min(100, Math.round((currentMins / cutoffMins) * 100));

    return {
      percent,
      remainingStr: `${hoursLeft}h ${minsLeft}m to cutoff`,
      isUrgent: diffMins <= 60,
    };
  }, [timeHms]);

  const IconPhase = atmosphericPhase.icon;

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-lg backdrop-blur-xl p-4 sm:p-6 transition-all duration-300 w-full max-w-full min-w-0">
      {/* Ambient background glow orb */}
      <div className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-gradient-to-br from-emerald-500/10 to-transparent blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full min-w-0">
        {/* Left: Institute & Console Title */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
            <ShieldCheck className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>

          <div className="space-y-0.5 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-gray-900 dark:text-white">
                ADSA Admin
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                {t('tokenBoard', 'Token Board')}
              </span>
              {roleBadge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.badgeClass}`}>
                  {roleBadge.label}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
              <span>{t('liveDiningSystem', 'Alathurpadi Dars Canteen System')}</span>
              <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
              <span className="hidden sm:inline font-medium text-emerald-600 dark:text-emerald-400">
                {atmosphericPhase.label}
              </span>
            </p>
          </div>
        </div>

        {/* Right: Clock & Shift Status Controls */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 sm:gap-3 self-end sm:self-auto w-full sm:w-auto min-w-0 justify-between sm:justify-end">
          {/* Radial Cutoff Dial & Digital Clock */}
          <div className="flex items-center gap-2.5 sm:gap-3 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl bg-gray-50/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 shadow-inner shrink-0">
            {/* SVG Circular Radial Progress */}
            <div className="relative w-9 h-9 flex items-center justify-center shrink-0">
              <svg className="w-9 h-9 transform -rotate-90" viewBox="0 0 36 36">
                <path
                  className="text-gray-200 dark:text-white/10"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className={
                    effectiveMode === 'force_unlocked'
                      ? 'text-emerald-500'
                      : effectiveMode === 'force_locked'
                      ? 'text-rose-500'
                      : cutoffProgress.isUrgent
                      ? 'text-amber-500 animate-pulse'
                      : 'text-emerald-500'
                  }
                  strokeDasharray={`${cutoffProgress.percent}, 100`}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <IconPhase className="w-3.5 h-3.5 absolute text-gray-600 dark:text-gray-300" />
            </div>

            <div className="flex flex-col">
              <span className="font-mono text-xs font-black tracking-tight text-gray-900 dark:text-white">
                {timeAmPm || timeHms || '--:--'} <span className="text-[10px] opacity-75 font-normal">IST</span>
              </span>
              <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                {effectiveMode === 'force_unlocked'
                  ? '24/7 Unlocked'
                  : effectiveMode === 'force_locked'
                  ? 'Locked'
                  : cutoffProgress.remainingStr}
              </span>
            </div>
          </div>

          {/* Action Trigger Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Quick Switch to Super Admin Executive Command Dashboard */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                navigate('/admin');
              }}
              className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25 flex items-center gap-1.5 font-bold text-xs transition-all shadow-xs"
              title="Return to Admin Dashboard"
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{t('adminDashboard', 'Dashboard')}</span>
            </button>

            {/* Board Notice & Event Studio Trigger */}
            {onOpenNoticeManager && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  hapticEngine.lightTap();
                  onOpenNoticeManager();
                }}
                className="px-2.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/25 flex items-center gap-1.5 font-bold text-xs transition-all shadow-xs cursor-pointer"
                title="Board Notices & Events (Monthly Dars Leave, Nikah, Temporary Close)"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden md:inline">{t('notices', 'Notices')}</span>
              </button>
            )}

            {/* Board Bulk Action Studio Trigger */}
            {onOpenBulkModal && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  hapticEngine.lightTap();
                  onOpenBulkModal();
                }}
                className="px-2.5 py-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/25 flex items-center gap-1.5 font-bold text-xs transition-all shadow-xs cursor-pointer"
                title="Board Bulk Action Studio (Turn ON/OFF, Mark Leaves in Batch)"
              >
                <Sliders className="w-3.5 h-3.5 text-blue-500" />
                <span className="hidden md:inline">{t('bulkActions', 'Bulk Actions')}</span>
              </button>
            )}

            {/* Global Command Palette Trigger */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                window.dispatchEvent(new CustomEvent('apex:open-command-palette'));
              }}
              className="px-2.5 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-white/10 flex items-center gap-1 text-xs font-semibold transition-colors"
              title="Open Command Palette (⌘K)"
            >
              <Command className="w-3.5 h-3.5 text-gray-500" />
              <span className="hidden md:inline font-mono text-[10px] text-gray-400">⌘K</span>
            </button>

            {/* Unified Master Board Status & Settings Controller */}
            <div
              className={`inline-flex items-center rounded-xl p-0.5 border shadow-md transition-all shrink-0 ${
                effectiveMode === 'force_unlocked'
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30'
                  : effectiveMode === 'force_locked'
                  ? 'bg-rose-500/10 dark:bg-rose-500/15 border-rose-500/30'
                  : !isTomorrowLocked
                  ? 'bg-emerald-500/10 dark:bg-emerald-500/15 border-emerald-500/30'
                  : 'bg-amber-500/10 dark:bg-amber-500/15 border-amber-500/30'
              }`}
            >
              {/* Primary Board Status Button */}
              <button
                type="button"
                onClick={() => {
                  if (isCentralCommittee && onToggleLock) {
                    soundEngine.playMechanicalClick();
                    hapticEngine.mediumTick();
                    onToggleLock();
                  } else if (onOpenLockModal) {
                    soundEngine.playPop();
                    hapticEngine.lightTap();
                    onOpenLockModal();
                  }
                }}
                className={`px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg flex items-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                  effectiveMode === 'force_unlocked'
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : effectiveMode === 'force_locked'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                    : !isTomorrowLocked
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                    : 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                }`}
                title={
                  isCentralCommittee
                    ? 'Board Status: Click to quick-toggle Open / Frozen'
                    : 'Board Status: Click to view Cutoff Schedule'
                }
              >
                {effectiveMode === 'force_unlocked' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{t('unlocked', 'Board: Open')}</span>
                  </>
                ) : effectiveMode === 'force_locked' ? (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t('frozen', 'Board: Frozen')}</span>
                  </>
                ) : (
                  <>
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        !isTomorrowLocked ? 'bg-white animate-pulse' : 'bg-white/80'
                      }`}
                    />
                    <Clock className="w-3.5 h-3.5" />
                    <span>
                      {!isTomorrowLocked ? t('boardOpen', 'Board: Open') : t('boardCutoff', 'Board: Cutoff')}
                    </span>
                  </>
                )}
              </button>

              {/* Integrated Board Cutoff & Locking Engine Trigger */}
              {onOpenLockModal && (
                <button
                  type="button"
                  onClick={() => {
                    soundEngine.playPop();
                    hapticEngine.lightTap();
                    onOpenLockModal();
                  }}
                  className={`px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg flex items-center gap-1.5 font-bold text-xs transition-all cursor-pointer ${
                    effectiveMode === 'force_unlocked'
                      ? 'text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20 active:scale-95'
                      : effectiveMode === 'force_locked'
                      ? 'text-rose-800 dark:text-rose-200 hover:bg-rose-500/20 active:scale-95'
                      : !isTomorrowLocked
                      ? 'text-emerald-800 dark:text-emerald-200 hover:bg-emerald-500/20 active:scale-95'
                      : 'text-amber-800 dark:text-amber-200 hover:bg-amber-500/20 active:scale-95'
                  }`}
                  title="Configure Cutoff Window & Board Lock Schedules"
                >
                  <Sliders className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Cutoff &amp; Lock Schedules</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
