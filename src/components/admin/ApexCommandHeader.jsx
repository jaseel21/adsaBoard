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
  Bell,
  Ban,
  Compass,
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
  onToggleLock,
  onOpenStaffModal,
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
                ADSA Apex Command
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                {t('masterBoard', 'Master Board')}
              </span>
              {roleBadge && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.badgeClass}`}>
                  {roleBadge.label}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 flex-wrap">
              <span>{t('liveDiningSystem', 'Alathurpadi Dars Institutional Dining Intelligence')}</span>
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
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Staff Roles Modal Trigger (Central Committee only) */}
            {isCentralCommittee && onOpenStaffModal && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  hapticEngine.lightTap();
                  onOpenStaffModal();
                }}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200/60 dark:border-white/10 transition-colors"
                title="Manage Staff Roles & Access Delegation"
              >
                <Users className="w-4 h-4" />
              </button>
            )}

            {/* Cutoff Window Editor Trigger (Central Committee only) */}
            {isCentralCommittee && onOpenLockModal && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  hapticEngine.lightTap();
                  onOpenLockModal();
                }}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200/60 dark:border-white/10 transition-colors"
                title="Configure Cutoff Window & Board Lock Schedules"
              >
                <Sliders className="w-4 h-4" />
              </button>
            )}

            {/* Block & Fine Registry Console Trigger */}
            {onOpenBlockModal && (
              <button
                type="button"
                onClick={() => {
                  soundEngine.playPop();
                  hapticEngine.lightTap();
                  onOpenBlockModal();
                }}
                className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-gray-700 dark:text-gray-300 hover:text-rose-600 dark:hover:text-rose-400 border border-gray-200/60 dark:border-white/10 transition-colors"
                title="Block & Fine Registry / Food Waste Penalties"
              >
                <Ban className="w-4 h-4 text-rose-500" />
              </button>
            )}

            {/* Notifications & Broadcast Studio Shortcut */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                navigate('/admin/notifications');
              }}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200/60 dark:border-white/10 transition-colors"
              title="Broadcast Announcements Studio & Ledger"
            >
              <Bell className="w-4 h-4 text-emerald-500" />
            </button>

            {/* Apex Sentinel Live Radar Shortcut */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                navigate('/admin/sentinel');
              }}
              className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-cyan-50 dark:hover:bg-cyan-950/40 text-gray-700 dark:text-gray-300 hover:text-cyan-500 dark:hover:text-cyan-400 border border-gray-200/60 dark:border-white/10 transition-colors"
              title="Apex Sentinel Live Fleet Radar & Remote Control"
            >
              <Compass className="w-4 h-4 text-cyan-400" />
            </button>

            {/* Master Lock Switch Pill (Interactive for Central Committee, Informational for Canteen Committee) */}
            <button
              type="button"
              disabled={!isCentralCommittee || !onToggleLock}
              onClick={() => {
                if (isCentralCommittee && onToggleLock) {
                  soundEngine.playMechanicalClick();
                  hapticEngine.mediumTick();
                  onToggleLock();
                }
              }}
              className={`px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-md transition-all ${
                !isCentralCommittee ? 'cursor-default opacity-90' : 'transform active:scale-95 cursor-pointer'
              } ${
                effectiveMode === 'force_unlocked'
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
                  : effectiveMode === 'force_locked'
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25'
                  : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
              }`}
              title={
                isCentralCommittee
                  ? 'Toggle Master Board Lock / Override'
                  : 'Board cutoff schedule enforced by Central Committee'
              }
            >
              {effectiveMode === 'force_unlocked' ? (
                <>
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{t('unlocked', '24/7 Open')}</span>
                </>
              ) : effectiveMode === 'force_locked' ? (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  <span>{t('frozen', 'Frozen')}</span>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{!isTomorrowLocked ? (t('open') || 'Open') : (t('locked') || 'Cutoff')}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
