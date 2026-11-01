import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Power,
  Database,
  Sliders,
  Users,
  UtensilsCrossed,
  ChefHat,
  BarChart3,
  Compass,
  Bell,
  HeartHandshake,
  Activity,
  Printer,
  FileText,
  Ban,
  Clock,
  Lock,
  Unlock,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Sun,
  Sunset,
  Moon,
  ChevronRight,
  TrendingUp,
  LayoutDashboard,
  CheckCircle2,
  Calendar,
  Layers,
  History,
  GraduationCap,
} from 'lucide-react';
import firebase from '../../firebase/config';
import { AuthContext } from '../../store/AuthContext';
import { useLanguage } from '../../store/LanguageContext';
import { useMasterGovernance } from '../../store/MasterGovernanceContext';
import { useTokenLockStatus } from '../../utils/useTokenLockStatus';
import { useWorldTime } from '../../utils/time';
import { getTodayISTDate, addDaysToDate, formatFriendlyDate, getEffectiveStudentMealStatus } from '../../utils/studentExceptionService';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { dialog } from '../../utils/dialog';

// Modals
import MasterGovernanceCockpitModal from './governance/MasterGovernanceCockpitModal';
import BackupVaultModal from './vault/BackupVaultModal';
import StaffManagementModal from '../StaffManagementModal';
import TokenLockManagerModal from '../TokenLockManagerModal';
import BlockManagementModal from './BlockManagementModal';
import CanteenOpsActivityDrawer from './CanteenOpsActivityDrawer';

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { user, role, roleBadge, isCentralCommittee } = useContext(AuthContext);
  const { t, language } = useLanguage();

  // World Time & Cutoff Hooks
  const { timeHms, timeAmPm, todayIST: worldTodayIST } = useWorldTime('Asia/Kolkata');
  const todayIST = useMemo(() => worldTodayIST || getTodayISTDate(), [worldTodayIST]);

  const {
    effectiveMode,
    isTomorrowLocked,
    saveLockConfig,
  } = useTokenLockStatus();

  const {
    isMaintenanceMode,
    isReadOnlyLockdown,
    isEmergencyMealOverrideActive,
  } = useMasterGovernance();

  // Target Date & Meal Selector State
  const [selectedDate, setSelectedDate] = useState(todayIST);
  const [selectedMeal, setSelectedMeal] = useState('lunch'); // 'lunch' | 'breakfast'

  // Live Database Collections State
  const [students, setStudents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals State
  const [governanceOpen, setGovernanceOpen] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [opsLogOpen, setOpsLogOpen] = useState(false);

  // Real-time Firestore Listeners
  useEffect(() => {
    setLoadingData(true);

    const unsubStudents = firebase
      .firestore()
      .collection('students')
      .onSnapshot(
        (snap) => {
          const list = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          setStudents(list);
          setLoadingData(false);
        },
        (err) => {
          console.error('Error fetching students:', err);
          setLoadingData(false);
        }
      );

    const unsubTickets = firebase
      .firestore()
      .collection('support_tickets')
      .where('status', 'in', ['new', 'in_progress'])
      .onSnapshot((snap) => {
        setTickets(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });

    const unsubAudit = firebase
      .firestore()
      .collection('audit_logs')
      .orderBy('timestamp', 'desc')
      .limit(6)
      .onSnapshot((snap) => {
        setAuditLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      });

    return () => {
      unsubStudents();
      unsubTickets();
      unsubAudit();
    };
  }, []);

  // Sync selectedDate with todayIST when loaded
  useEffect(() => {
    if (todayIST) {
      setSelectedDate((prev) => (prev ? prev : todayIST));
    }
  }, [todayIST]);

  // Aggregate Operational Counts
  const metrics = useMemo(() => {
    const totalEnrolled = students.length;
    let activeDiners = 0;
    let beefAvoiders = 0;
    let fishAvoiders = 0;
    let chickenAvoiders = 0;
    let blockedCount = 0;
    let withFinesCount = 0;
    let unassignedBatchCount = 0;

    students.forEach((st) => {
      if (st.block) blockedCount++;
      if (st.fineStatus === 'pending' || Number(st.fineAmount) > 0) withFinesCount++;
      if (!st.batch || !st.batch.trim()) unassignedBatchCount++;

      const isDining = !st.block && getEffectiveStudentMealStatus(
        st,
        selectedDate,
        'today',
        selectedMeal
      );

      if (isDining) {
        activeDiners++;
        const obj2 = st.obj2 || {};
        if (obj2.beef === false) beefAvoiders++;
        if (obj2.fish === false) fishAvoiders++;
        if (obj2.chicken === false) chickenAvoiders++;
      }
    });

    const eligible = Math.max(0, totalEnrolled - blockedCount);
    const optedOut = Math.max(0, eligible - activeDiners);
    const turnoutPercent = eligible > 0 ? Math.round((activeDiners / eligible) * 100) : 0;

    return {
      totalEnrolled,
      activeDiners,
      optedOut,
      blockedCount,
      withFinesCount,
      unassignedBatchCount,
      turnoutPercent,
      beefAvoiders,
      fishAvoiders,
      chickenAvoiders,
      specialDietCount: beefAvoiders + fishAvoiders + chickenAvoiders,
    };
  }, [students, selectedDate, selectedMeal]);

  // Cutoff Dial Calculation (IST toward 14:00)
  const cutoffProgress = useMemo(() => {
    if (!timeHms) return { percent: 50, remainingStr: '--', isUrgent: false };
    const [h, m] = timeHms.split(':').map(Number);
    const currentMins = h * 60 + m;
    const cutoffMins = 14 * 60; // 2:00 PM IST

    if (currentMins >= cutoffMins) {
      return { percent: 100, remainingStr: 'Cutoff Window Closed', isUrgent: false };
    }
    const diff = cutoffMins - currentMins;
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    const percent = Math.min(100, Math.round((currentMins / cutoffMins) * 100));

    return {
      percent,
      remainingStr: `${hrs}h ${mins}m to lock`,
      isUrgent: diff <= 60,
    };
  }, [timeHms]);

  // Quick Lock Toggle
  const handleToggleMasterLock = async () => {
    if (!isCentralCommittee) return;
    soundEngine.playMechanicalClick();
    hapticEngine.mediumTick();

    const newMode = effectiveMode === 'force_locked' ? 'auto' : 'force_locked';
    const confirmed = await dialog.confirm({
      title: newMode === 'force_locked' ? 'Freeze Board Instantly?' : 'Resume Automatic Cutoff?',
      message: newMode === 'force_locked'
        ? 'Freezing will immediately prevent all students from changing meal attendance.'
        : 'The board will resume normal scheduled cutoff hours (2:00 PM IST).',
      confirmText: newMode === 'force_locked' ? 'Yes, Freeze Board' : 'Resume Auto Mode',
      confirmColor: newMode === 'force_locked' ? 'rose' : 'emerald',
    });

    if (confirmed) {
      await saveLockConfig({ mode: newMode });
      dialog.toast.success('Lock Mode Updated', `Master Board is now ${newMode === 'force_locked' ? 'Frozen' : 'Auto'}`);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ================= 1. EXECUTIVE STATUS & PULSE HEADER ================= */}
      <div className="relative overflow-hidden rounded-3xl bg-white/90 dark:bg-[#0c1412]/90 border border-gray-200/80 dark:border-white/10 shadow-xl backdrop-blur-xl p-5 sm:p-7">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-emerald-500/10 dark:bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Branding & Role Identity */}
          <div className="flex items-start sm:items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/25 shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Admin Dashboard
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-black uppercase tracking-wider bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  Admin Portal
                </span>
                {roleBadge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge.badgeClass}`}>
                    {roleBadge.label}
                  </span>
                )}
              </div>

              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                <span>Alathurpadi Dars Canteen Administration</span>
                <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                  {user?.email}
                </span>
              </p>
            </div>
          </div>

          {/* Right: Real-time System Health & Cutoff Dial */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Cutoff Dial & Digital Clock */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 shadow-inner">
              <div className="relative w-10 h-10 flex items-center justify-center shrink-0">
                <svg className="w-10 h-10 transform -rotate-90" viewBox="0 0 36 36">
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
                <Clock className="w-4 h-4 absolute text-gray-600 dark:text-gray-300" />
              </div>

              <div>
                <div className="font-mono text-xs font-black text-gray-900 dark:text-white flex items-center gap-1">
                  <span>{timeAmPm || timeHms || '--:--'}</span>
                  <span className="text-[10px] text-gray-400 font-normal">IST</span>
                </div>
                <div className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                  {effectiveMode === 'force_unlocked'
                    ? '24/7 Open'
                    : effectiveMode === 'force_locked'
                    ? 'Board Frozen'
                    : cutoffProgress.remainingStr}
                </div>
              </div>
            </div>

            {/* Quick Master Lock Toggle Pill */}
            {isCentralCommittee && (
              <button
                type="button"
                onClick={handleToggleMasterLock}
                className={`px-3.5 py-2.5 rounded-2xl flex items-center gap-2 font-bold text-xs shadow-md transition-all active:scale-95 cursor-pointer ${
                  effectiveMode === 'force_locked'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/25'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/25'
                }`}
                title="Toggle Master Board Freeze Override"
              >
                {effectiveMode === 'force_locked' ? (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>Board Frozen</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-4 h-4" />
                    <span>Board Active</span>
                  </>
                )}
              </button>
            )}

            {/* Master Governance Trigger */}
            <button
              type="button"
              onClick={() => {
                soundEngine.playPop();
                hapticEngine.lightTap();
                setGovernanceOpen(true);
              }}
              className="p-2.5 rounded-2xl bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-600/40 transition-colors"
              title="Open Master Governance Cockpit (Emergency Killswitches & Modes)"
            >
              <Power className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Warnings Banner if system active flags are on */}
        {(isMaintenanceMode || isReadOnlyLockdown || isEmergencyMealOverrideActive) && (
          <div className="mt-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-between text-xs text-amber-800 dark:text-amber-200">
            <div className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                {isMaintenanceMode && 'Institutional Maintenance Screen Active • '}
                {isReadOnlyLockdown && 'Read-Only Lockdown Active • '}
                {isEmergencyMealOverrideActive && 'Emergency Meal Override Engaged'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setGovernanceOpen(true)}
              className="font-bold underline hover:opacity-80"
            >
              Manage Switches
            </button>
          </div>
        )}
      </div>

      {/* ================= 2. OPERATIONAL VELOCITY & ATTENDANCE SNAPSHOT ================= */}
      <div className="glass-panel rounded-3xl p-5 sm:p-6 border border-gray-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark space-y-4">
        {/* Date & Meal Filter Ribbon */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 dark:border-white/5 pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <h2 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
              Institutional Dining Snapshot
            </h2>
            <span className="text-xs text-gray-400 font-medium">
              ({formatFriendlyDate(selectedDate)})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Quick Date Pills */}
            <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedDate(todayIST)}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedDate === todayIST
                    ? 'bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(addDaysToDate(todayIST, 1))}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedDate === addDaysToDate(todayIST, 1)
                    ? 'bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                Tomorrow
              </button>
            </div>

            {/* Meal Switcher */}
            <div className="flex items-center p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedMeal('breakfast')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedMeal === 'breakfast'
                    ? 'bg-white dark:bg-amber-600 text-gray-900 dark:text-white shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                Breakfast
              </button>
              <button
                type="button"
                onClick={() => setSelectedMeal('lunch')}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  selectedMeal === 'lunch'
                    ? 'bg-white dark:bg-emerald-600 text-gray-900 dark:text-white shadow-xs font-bold'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-white'
                }`}
              >
                Lunch
              </button>
            </div>
          </div>
        </div>

        {/* 4 Summary Stat Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {/* Card 1: Enrolled Capacity */}
          <div className="p-4 rounded-2xl bg-gray-50/80 dark:bg-white/[0.03] border border-gray-200/60 dark:border-white/5">
            <span className="text-[11px] font-bold uppercase tracking-tight text-gray-500 dark:text-gray-400">
              Total Enrolled
            </span>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white font-mono mt-1">
              {metrics.totalEnrolled} <span className="text-xs font-normal text-gray-400">tokens</span>
            </div>
            <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">
              {metrics.blockedCount > 0 ? `${metrics.blockedCount} blocked tokens` : 'All tokens active'}
            </div>
          </div>

          {/* Card 2: Active Diners Headcount */}
          <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/20">
            <span className="text-[11px] font-bold uppercase tracking-tight text-emerald-700 dark:text-emerald-400">
              Active Headcount
            </span>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {metrics.activeDiners} <span className="text-xs font-normal text-emerald-700/70 dark:text-emerald-300/70">diners</span>
            </div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-300 font-semibold mt-1">
              {metrics.turnoutPercent}% dining turnout yield
            </div>
          </div>

          {/* Card 3: Opted-Out / Saved Portions */}
          <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-500/20">
            <span className="text-[11px] font-bold uppercase tracking-tight text-amber-700 dark:text-amber-400">
              Opted-Out / Leaves
            </span>
            <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
              {metrics.optedOut} <span className="text-xs font-normal text-amber-700/70 dark:text-amber-300/70">portions</span>
            </div>
            <div className="text-[10px] text-amber-700 dark:text-amber-300 mt-1">
              Saved from over-cooking via cutoffs
            </div>
          </div>

          {/* Card 4: Action Required Pulse */}
          <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/20 border border-purple-500/20">
            <span className="text-[11px] font-bold uppercase tracking-tight text-purple-700 dark:text-purple-400">
              Action Required
            </span>
            <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">
              {tickets.length} <span className="text-xs font-normal text-purple-700/70 dark:text-purple-300/70">open tickets</span>
            </div>
            <div className="text-[10px] text-purple-700 dark:text-purple-300 mt-1">
              {metrics.withFinesCount > 0 ? `${metrics.withFinesCount} pending fines` : 'No unpaid fines'}
            </div>
          </div>
        </div>

        {/* Warning if any students are unassigned to an academic batch */}
        {metrics.unassignedBatchCount > 0 && (
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <b>{metrics.unassignedBatchCount} student tokens</b> have no academic batch assigned.
              </span>
            </div>
            <button
              type="button"
              onClick={() => navigate('/student-management')}
              className="font-bold underline hover:opacity-80"
            >
              Assign in Student Directory &rarr;
            </button>
          </div>
        )}
      </div>

      {/* ================= 3. SYSTEMATIC COMMAND LAUNCHPAD ================= */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4 text-emerald-500" />
            <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white tracking-tight">
              Central Command Hub
            </h2>
          </div>
          <span className="text-xs text-gray-400 font-semibold">
            Direct shortcuts to all administrative consoles
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* GROUP 1: EXECUTIVE & GOVERNANCE */}
          <div className="glass-panel rounded-2xl p-4 border border-purple-500/20 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-purple-700 dark:text-purple-300 border-b border-purple-500/15 pb-2">
              <ShieldCheck className="w-4 h-4 text-purple-500" />
              <span>Executive & Governance</span>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setGovernanceOpen(true)}
                className="w-full p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Power className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">System Maintenance</div>
                    <div className="text-[10px] text-gray-400">Emergency & lockdown</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-500 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => setVaultOpen(true)}
                className="w-full p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">Backup & Restore</div>
                    <div className="text-[10px] text-gray-400">Snapshots & recovery</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-500 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => setStaffModalOpen(true)}
                className="w-full p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">Staff Roles & Access</div>
                    <div className="text-[10px] text-gray-400">Permission delegation</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-500 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/audit-logs')}
                className="w-full p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 hover:bg-purple-50 dark:hover:bg-purple-950/30 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Activity className="w-4 h-4 text-purple-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">Central Audit Trail</div>
                    <div className="text-[10px] text-gray-400">Security history logs</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-purple-500 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/about')}
                className="w-full p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/25 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <GraduationCap className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  <div>
                    <div className="text-xs font-bold text-purple-900 dark:text-purple-200">Institutional About Studio</div>
                    <div className="text-[10px] text-purple-700/80 dark:text-purple-300/80">Mudarrisun & committees CRUD</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-purple-600 transition-colors" />
              </button>
            </div>
          </div>

          {/* GROUP 2: TOKEN & STUDENT OPERATIONS */}
          <div className="glass-panel rounded-2xl p-4 border border-emerald-500/20 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 border-b border-emerald-500/15 pb-2">
              <Sliders className="w-4 h-4 text-emerald-500" />
              <span>Token Operations</span>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => navigate('/admin/master-board')}
                className="w-full p-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/25 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <div>
                    <div className="text-xs font-bold text-emerald-900 dark:text-emerald-200">Master Token Board</div>
                    <div className="text-[10px] text-emerald-700/80 dark:text-emerald-300/80">Tactile keycap matrix</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-emerald-600 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/student-management')}
                className="w-full p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Users className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">Student Directory</div>
                    <div className="text-[10px] text-gray-400">Enrollment & batches</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => setBlockModalOpen(true)}
                className="w-full p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Ban className="w-4 h-4 text-rose-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">Blocked Tokens & Fines</div>
                    <div className="text-[10px] text-gray-400">Penalties & appeals</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-rose-500 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => setLockModalOpen(true)}
                className="w-full p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Sliders className="w-4 h-4 text-emerald-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">Token Cutoff & Locking Engine</div>
                    <div className="text-[10px] text-gray-400">Configure cutoff window and board lock schedules</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
              </button>
            </div>
          </div>

          {/* GROUP 3: KITCHEN & CATERING LOGISTICS */}
          <div className="glass-panel rounded-2xl p-4 border border-amber-500/20 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-700 dark:text-amber-300 border-b border-amber-500/15 pb-2">
              <ChefHat className="w-4 h-4 text-amber-500" />
              <span>Kitchen Logistics</span>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => navigate('/kitchen')}
                className="w-full p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <ChefHat className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">Kitchen Display (KDS)</div>
                    <div className="text-[10px] text-gray-400">Real-time cook counters</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-500 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/menu')}
                className="w-full p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <UtensilsCrossed className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">Menu Studio</div>
                    <div className="text-[10px] text-gray-400">Weekly meal builder</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-500 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/dietary')}
                className="w-full p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">Dietary Care Console</div>
                    <div className="text-[10px] text-gray-400">Avoidance approvals</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-500 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/supply')}
                className="w-full p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Printer className="w-4 h-4 text-amber-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">Supply Manifest Sheet</div>
                    <div className="text-[10px] text-gray-400">Print distribution sheet</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-amber-500 transition-colors" />
              </button>
            </div>
          </div>

          {/* GROUP 4: INTELLIGENCE & COMMUNICATIONS */}
          <div className="glass-panel rounded-2xl p-4 border border-cyan-500/20 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-cyan-700 dark:text-cyan-300 border-b border-cyan-500/15 pb-2">
              <BarChart3 className="w-4 h-4 text-cyan-500" />
              <span>Intelligence & Radar</span>
            </div>

            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => navigate('/admin/analytics')}
                className="w-full p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-cyan-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">Apex Analytics & Reports</div>
                    <div className="text-[10px] text-gray-400">Telemetry & period stats</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-500 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/sentinel')}
                className="w-full p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-cyan-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">Live Sentinel Radar</div>
                    <div className="text-[10px] text-gray-400">Presence & user tracing</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-500 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/notifications')}
                className="w-full p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <Bell className="w-4 h-4 text-cyan-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">Broadcast Studio</div>
                    <div className="text-[10px] text-gray-400">Campus banners & alerts</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-500 transition-colors" />
              </button>

              <button
                type="button"
                onClick={() => navigate('/admin/support')}
                className="w-full p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/5 hover:bg-cyan-50 dark:hover:bg-cyan-950/30 text-left transition-colors flex items-center justify-between group"
              >
                <div className="flex items-center gap-2.5">
                  <HeartHandshake className="w-4 h-4 text-cyan-500" />
                  <div>
                    <div className="text-xs font-bold text-gray-900 dark:text-white">Support & Care Center</div>
                    <div className="text-[10px] text-gray-400">
                      {tickets.length > 0 ? `${tickets.length} open inquiries` : 'All tickets resolved'}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-gray-400 group-hover:text-cyan-500 transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= 4. RECENT AUDIT ACTIVITY TICKER ================= */}
      <div className="glass-panel rounded-2xl p-4 sm:p-5 border border-gray-200/80 dark:border-white/10 shadow-glass dark:shadow-glass-dark">
        <div className="flex items-center justify-between mb-3 border-b border-gray-100 dark:border-white/5 pb-2.5">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-500" />
            <h3 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
              Recent System Activity & Audit Stream
            </h3>
          </div>
          <button
            type="button"
            onClick={() => navigate('/admin/audit-logs')}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>View Full Log</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {auditLogs.length === 0 ? (
          <div className="text-center py-4 text-xs text-gray-400">
            No recent audit events recorded.
          </div>
        ) : (
          <div className="space-y-2">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between p-2 rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-gray-900 dark:text-white">
                      {log.action || log.event || 'System Action'}
                    </span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 ml-2">
                      by {log.actorEmail || log.performedBy || 'System'}
                    </span>
                  </div>
                </div>
                <span className="text-[10px] text-gray-400 shrink-0 font-mono ml-2">
                  {log.timestamp ? new Date(log.timestamp.toDate ? log.timestamp.toDate() : log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'recently'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ================= MODAL MOUNTS ================= */}
      <MasterGovernanceCockpitModal
        isOpen={governanceOpen}
        onClose={() => setGovernanceOpen(false)}
      />

      <BackupVaultModal
        isOpen={vaultOpen}
        onClose={() => setVaultOpen(false)}
      />

      <StaffManagementModal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
      />

      <TokenLockManagerModal
        isOpen={lockModalOpen}
        onClose={() => setLockModalOpen(false)}
        onOpenBlockModal={() => {
          setLockModalOpen(false);
          setBlockModalOpen(true);
        }}
      />

      <BlockManagementModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
        onOpenTimeModal={() => {
          setBlockModalOpen(false);
          setLockModalOpen(true);
        }}
      />

      <CanteenOpsActivityDrawer
        isOpen={opsLogOpen}
        onClose={() => setOpsLogOpen(false)}
      />
    </div>
  );
}
