import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Utensils,
  Coffee,
  Sliders,
  Calendar,
  ShieldCheck,
  Search,
  Check,
  X,
  Users,
  UtensilsCrossed,
  Home,
  Clock,
  Activity,
  Layers,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Printer,
  RotateCcw,
  ChefHat,
  CalendarDays,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Info,
  ExternalLink,
  Edit,
  Receipt,
  Ban,
} from 'lucide-react';
import { dialog } from '../utils/dialog';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { AuthContext } from '../store/AuthContext';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { useTokenLockStatus } from '../utils/useTokenLockStatus';
import { useTokenBoardController } from '../utils/useTokenBoardController';
import { getStudentFineAmount } from '../utils/mealScheduleService';

import TokenLockManagerModal from './TokenLockManagerModal';
import BlockManagementModal from './admin/BlockManagementModal';
import StudentDrawer from './StudentDrawer';
import AuditLiveTicker from './audit/AuditLiveTicker';
import StaffManagementModal from './StaffManagementModal';
import TokenBoardControls from './ui/TokenBoardControls';
import TokenBoardDateRibbon from './ui/TokenBoardDateRibbon';
import AdminTokenPopover from './ui/AdminTokenPopover';
import DietaryBreakdownModal from './ui/DietaryBreakdownModal';

import ApexCommandHeader from './admin/ApexCommandHeader';
import ApexTelemetryHud from './admin/ApexTelemetryHud';
import ApexSurfaceTabs from './admin/ApexSurfaceTabs';
import ApexOperationsRadar from './admin/ApexOperationsRadar';
import ApexCommandPalette from './admin/ApexCommandPalette';
import ApexFloatingDock from './admin/ApexFloatingDock';
import TactileKeycap from './admin/keycaps/TactileKeycap';
import DossierCardKeycap from './admin/keycaps/DossierCardKeycap';

import { logAuditEvent, AUDIT_CATEGORIES, AUDIT_SEVERITIES } from '../utils/auditLogger';
import {
  getActiveStudentException,
  getEffectiveStudentMealStatus,
  formatFriendlyDate,
} from '../utils/studentExceptionService';
import { getRoleBadgeInfo } from '../utils/rbac';
import { soundEngine } from '../utils/soundEffects';
import { hapticEngine } from '../utils/haptics';

export default function Admin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role, isCentralCommittee } = useContext(AuthContext);
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const roleBadge = useMemo(() => getRoleBadgeInfo(role), [role]);

  // Unified Token Board Controller Hook
  const controller = useTokenBoardController({
    autoEveningShift: true, // Today before window open time (eg. 2 PM), Tomorrow after open time
    initialMeal: location.state?.isLunch !== undefined ? (location.state.isLunch ? 'lunch' : 'breakfast') : 'lunch',
    initialViewCategory: 'all',
    initialViewDensity: 'matrix',
  });

  const {
    documents,
    filteredDocuments,
    loading,
    preferencesList,
    allBatches,
    allTokens,
    isLunch,
    toggleMeal,
    targetDateIST,
    effectiveDay,
    viewCategory,
    viewDensity,
    groupedByBatch,
    groupedBySection,
    collapsedBatches,
    toggleBatchCollapse,
    collapseAllBatches,
    expandAllBatches,
    metrics,
  } = controller;

  const existingBatchNames = useMemo(() => {
    return allBatches.map((b) => b.name);
  }, [allBatches]);

  // Board Cutoff Locking Hook
  const {
    effectiveMode,
    isTomorrowLocked,
    activeWindow,
    startTime: lockStartTime,
    endTime: lockEndTime,
    saveLockConfig,
  } = useTokenLockStatus();

  // Dual-Surface State: 'matrix' (Tactical Keycap Matrix) vs 'radar' (Operations Visual Telemetry)
  const [activeSurface, setActiveSurface] = useState('matrix');
  const [showCommandPalette, setShowCommandPalette] = useState(false);

  // Global Apex Command Palette Event Listener
  useEffect(() => {
    const handleOpenPalette = () => setShowCommandPalette(true);
    window.addEventListener('apex:open-command-palette', handleOpenPalette);
    return () => window.removeEventListener('apex:open-command-palette', handleOpenPalette);
  }, []);

  // Modals & Popover State
  const [showLockManagerModal, setShowLockManagerModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [popoverStudent, setPopoverStudent] = useState(null);
  const [detailsDoc, setDetailsDoc] = useState(null);
  const [fullDrawerStudent, setFullDrawerStudent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const daysList = [
    { key: 'su', label: t('days')?.su || 'Sun' },
    { key: 'mo', label: t('days')?.mo || 'Mon' },
    { key: 'tu', label: t('days')?.tu || 'Tue' },
    { key: 'we', label: t('days')?.we || 'Wed' },
    { key: 'th', label: t('days')?.th || 'Thu' },
    { key: 'fr', label: t('days')?.fr || 'Fri' },
    { key: 'sa', label: t('days')?.sa || 'Sat' },
  ];

  // Deep Link Support: Check for `?token=...` in URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tokenParam = params.get('token');
    if (tokenParam && documents.length > 0) {
      const match = documents.find((s) => String(s.tokenNo) === String(tokenParam));
      if (match) {
        setFullDrawerStudent(match);
        setDrawerOpen(true);
      }
    }
  }, [location.search, documents]);

  // Keep popoverStudent synchronized with live Firestore documents
  const popoverStudentId = popoverStudent?.id;
  useEffect(() => {
    if (popoverStudentId && documents?.length > 0) {
      const match = documents.find((s) => s.id === popoverStudentId);
      if (match) {
        setPopoverStudent(match);
      }
    }
  }, [documents, popoverStudentId]);

  // Master Board Lock Toggle
  const toggleBoardLock = async () => {
    if (!user) {
      navigate('/alogin');
      return;
    }
    feedback('tick');
    const isCurrentlyUnlocked = effectiveMode === 'force_unlocked';
    const nextMode = isCurrentlyUnlocked ? 'auto' : 'force_unlocked';

    const confirmed = await dialog.confirm({
      title: nextMode === 'force_unlocked' ? 'Emergency Unlock All Tokens?' : 'Revert to Scheduled Cutoffs?',
      message: nextMode === 'force_unlocked'
        ? 'Students will be allowed to update tokens for all dates 24/7, bypassing daily cutoffs.'
        : `Token updates will return to standard schedule (Cutoff at ${lockEndTime} IST).`,
      icon: nextMode === 'force_unlocked' ? 'unlock' : 'lock',
      confirmColor: nextMode === 'force_unlocked' ? 'emerald' : 'amber',
      confirmText: nextMode === 'force_unlocked' ? 'Unlock Board' : 'Activate Schedule',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await saveLockConfig({
          overrideMode: nextMode,
          temporaryOverride: { active: false, mode: 'force_unlocked', expiresAt: null, reason: '' },
        });

        await logAuditEvent({
          category: AUDIT_CATEGORIES.TOKENS,
          action: 'BOARD_LOCK_CHANGE',
          severity: nextMode === 'force_unlocked' ? AUDIT_SEVERITIES.WARNING : AUDIT_SEVERITIES.INFO,
          target: { type: 'system_config', id: 'tokenboard', label: 'Master Token Board' },
          changes: {
            diffSummary: `Master Board lock changed to ${nextMode === 'force_unlocked' ? 'UNLOCKED (24/7)' : 'SCHEDULED AUTO'}`,
            fieldsChanged: ['overrideMode'],
            before: { overrideMode: effectiveMode },
            after: { overrideMode: nextMode },
          },
          metadata: {
            reason: nextMode === 'force_unlocked' ? 'Emergency 24/7 Unlock' : 'Reverted to Scheduled Cutoff',
          },
        });

        dialog.toast.success(
          nextMode === 'force_unlocked' ? 'Token Board Unlocked' : 'Standard Schedule Active',
          nextMode === 'force_unlocked'
            ? 'Students can now update tokens 24/7.'
            : `Token updates returned to standard cutoff schedule (Cutoff at ${lockEndTime}).`
        );
      } catch (err) {
        console.error('Error toggling board:', err);
        dialog.alert({
          type: 'error',
          title: 'Update Failed',
          message: err.message || 'Could not update token board status.',
        });
      }
    }
  };

  // When a token button is clicked: Open Quick 2-Action Popover with Audio-Haptic Feedback
  const handleTokenClick = (doc) => {
    soundEngine.playMechanicalClick();
    hapticEngine.lightTap();
    setPopoverStudent(doc);
  };

  // Open Full CRUD Drawer from popover or direct request
  const handleOpenFullDrawer = (doc) => {
    soundEngine.playSoftChime();
    hapticEngine.mediumTick();
    setPopoverStudent(null);
    setFullDrawerStudent(doc);
    setDrawerOpen(true);
  };

  const handleStudentSaved = (savedStudent) => {
    setFullDrawerStudent(savedStudent);
  };

  const handleStudentDeleted = (deletedId) => {
    setDrawerOpen(false);
    setFullDrawerStudent(null);
  };

  // High-Performance Unified Token Renderer matching standard design language
  const renderTokenItems = (studentList) => {
    if (viewDensity === 'cards') {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
          {studentList.map((doc) => {
            const isBlocked = Boolean(doc.block);
            const hasDateExc = Boolean(
              getActiveStudentException(doc, targetDateIST, isLunch ? 'lunch' : 'breakfast')
            );
            const isOn = getEffectiveStudentMealStatus(
              doc,
              targetDateIST,
              effectiveDay,
              isLunch ? 'lunch' : 'breakfast'
            );
            return (
              <DossierCardKeycap
                key={doc.id || doc.tokenNo}
                doc={doc}
                isOn={isOn}
                onLeave={hasDateExc}
                isBlocked={isBlocked}
                isLunch={isLunch}
                onClick={handleTokenClick}
              />
            );
          })}
        </div>
      );
    }

    // Default: Standard Compact Matrix (identical across Home page, Admin, and Student portal)
    return (
      <div className="flex flex-wrap justify-center sm:justify-start gap-2 min-[380px]:gap-2.5 sm:gap-3">
        {studentList.map((doc) => {
          const isBlocked = Boolean(doc.block);
          const hasDateExc = Boolean(
            getActiveStudentException(doc, targetDateIST, isLunch ? 'lunch' : 'breakfast')
          );
          const isOn = getEffectiveStudentMealStatus(
            doc,
            targetDateIST,
            effectiveDay,
            isLunch ? 'lunch' : 'breakfast'
          );
          return (
            <TactileKeycap
              key={doc.id || doc.tokenNo}
              number={doc.tokenNo}
              isOn={isOn}
              onLeave={hasDateExc}
              isBlocked={isBlocked}
              onClick={() => handleTokenClick(doc)}
            />
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[50vh]">
        <div className="flex space-x-2">
          {[0, 1, 2].map((idx) => (
            <motion.div
              key={idx}
              className="w-3.5 h-3.5 rounded-full bg-emerald-500"
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: idx * 0.15 }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full min-w-0 max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 overflow-x-hidden">
      
      {/* ================= 1. APEX COMMAND CONSOLE HEADER ================= */}
      <ApexCommandHeader
        effectiveMode={effectiveMode}
        isTomorrowLocked={isTomorrowLocked}
        lockStartTime={lockStartTime}
        lockEndTime={lockEndTime}
        onOpenLockModal={isCentralCommittee ? () => setShowLockManagerModal(true) : null}
        onOpenBlockModal={() => setShowBlockModal(true)}
        onToggleLock={isCentralCommittee ? toggleBoardLock : null}
        onOpenStaffModal={isCentralCommittee ? () => setShowStaffModal(true) : null}
        isCentralCommittee={isCentralCommittee}
        roleBadge={roleBadge}
        user={user}
      />

      {/* ================= 2. OPERATIONAL QUICK NAV & SHIFT CONTROL STRIP ================= */}
      <div className="flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl w-full max-w-full min-w-0 overflow-hidden">
        {/* Meal Shift Segmented Toggle */}
        <div className="flex w-full sm:w-auto p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 relative">
          <button
            type="button"
            onClick={() => {
              soundEngine.playPop();
              hapticEngine.lightTap();
              toggleMeal('breakfast');
            }}
            className={`flex-1 sm:flex-none relative flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition-all ${
              !isLunch
                ? 'text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {!isLunch && (
              <motion.div
                layoutId="adminActiveMealPill"
                className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-md"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Coffee className="w-3.5 h-3.5 relative z-10 shrink-0" />
            <span className="relative z-10">{t('navBreakfast') || 'Breakfast'}</span>
            <span className="relative z-10 px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-bold">
              {metrics.breakfastCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playPop();
              hapticEngine.lightTap();
              toggleMeal('lunch');
            }}
            className={`flex-1 sm:flex-none relative flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition-all ${
              isLunch
                ? 'text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {isLunch && (
              <motion.div
                layoutId="adminActiveMealPill"
                className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl shadow-md"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Utensils className="w-3.5 h-3.5 relative z-10 shrink-0" />
            <span className="relative z-10">{t('navLunch') || 'Lunch'}</span>
            <span className="relative z-10 px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-bold">
              {metrics.lunchCount}
            </span>
          </button>
        </div>

        {/* Action Navigation Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto min-w-0">
          <button
            type="button"
            onClick={() => {
              soundEngine.playPop();
              hapticEngine.lightTap();
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors shrink-0"
            title={t('publicHomeView') || 'Public Home View'}
          >
            <Home className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('navHome') || 'Home'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playPop();
              hapticEngine.lightTap();
              navigate('/student-management');
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md transition-all shrink-0"
          >
            <Users className="w-3.5 h-3.5" />
            <span>{t('navStudentMgmt') || 'Students'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playPop();
              hapticEngine.lightTap();
              navigate('/admin/menu');
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors shrink-0"
          >
            <Utensils className="w-3.5 h-3.5 text-emerald-500" />
            <span>{t('navMenu') || 'Food Menu'}</span>
          </button>

          {/* Kitchen Display System (KDS) Button for Cooks & Admins */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playPop();
              hapticEngine.lightTap();
              navigate('/kitchen');
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-amber-50 dark:hover:bg-amber-950/30 hover:text-amber-600 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors shrink-0"
            title={t('kitchenLiveDisplayTitle') || 'Open Kitchen Live Production Display'}
          >
            <ChefHat className="w-3.5 h-3.5 text-amber-500" />
            <span>{t('kitchen', 'Kitchen')}</span>
          </button>

          {/* Dietary Breakdown Summary Trigger */}
          <button
            type="button"
            onClick={() => {
              soundEngine.playPop();
              hapticEngine.lightTap();
              setShowDietaryModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:text-teal-600 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors shrink-0"
            title={t('dietaryDistributionTitle') || 'Kitchen Dietary Distribution Breakdown'}
          >
            <UtensilsCrossed className="w-3.5 h-3.5 text-teal-500" />
            <span>{t('navDietary') || 'Dietary'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playPop();
              hapticEngine.lightTap();
              navigate('/admin/audit-logs');
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors shrink-0"
            title="Audit Trail & System Logs"
          >
            <Activity className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">{t('navAuditLogs') || 'Audit Log'}</span>
          </button>
        </div>
      </div>

      {/* ================= 3. APEX TELEMETRY HUD ================= */}
      <ApexTelemetryHud
        documents={documents}
        filteredDocuments={filteredDocuments}
        isLunch={isLunch}
        metrics={metrics}
        preferencesList={preferencesList}
        targetDateIST={targetDateIST}
        onOpenDietaryModal={() => {
          soundEngine.playSoftChime();
          setShowDietaryModal(true);
        }}
      />

      {/* ================= 4. DUAL-SURFACE SWITCHER ================= */}
      <ApexSurfaceTabs
        activeSurface={activeSurface}
        onChangeSurface={setActiveSurface}
        tokenCount={documents.length}
      />

      {/* ================= DATE & SCHEDULE SELECTOR RIBBON ================= */}
      <TokenBoardDateRibbon
        controller={controller}
        showCalendarPicker={true}
      />

      {/* Surface 1: Operations Visual Radar Surface */}
      {activeSurface === 'radar' ? (
        <ApexOperationsRadar
          documents={documents}
          isLunch={isLunch}
          targetDateIST={targetDateIST}
          effectiveDay={effectiveDay}
          groupedByBatch={groupedByBatch}
          groupedBySection={groupedBySection}
          metrics={metrics}
          onOpenDietaryModal={() => setShowDietaryModal(true)}
        />
      ) : (
        /* Surface 2: Tactical Token Matrix Surface */
        <>
          {/* ================= ADVANCED CONTROLS TOOLBAR: SEARCH, SORT, FILTER & DENSITY ================= */}
          <TokenBoardControls
            controller={controller}
            showDensityToggle={true}
          />

      {/* Live Activity Radar Ticker */}
      <AuditLiveTicker />

      {/* ================= TOKEN BOARD DISPLAY ================= */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 p-3.5 sm:p-6 shadow-sm backdrop-blur-xl min-h-[320px] w-full max-w-full min-w-0 overflow-hidden">
        
        {/* Quick Instructions / Count Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {t('showingTokensCount', 'Showing {filtered} of {total} tokens for {meal}. Click any token to toggle meals or edit accounts.')
              .replace('{filtered}', filteredDocuments.length)
              .replace('{total}', documents.length)
              .replace('{meal}', isLunch ? (t('navLunch') || 'Lunch') : (t('navBreakfast') || 'Breakfast'))}
          </p>

          {viewCategory === 'batch' && (
            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={expandAllBatches}
                className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
              >
                {t('expandAll', 'Expand All')}
              </button>
              <span className="text-gray-300 dark:text-gray-600">•</span>
              <button
                type="button"
                onClick={collapseAllBatches}
                className="text-gray-500 dark:text-gray-400 font-medium hover:underline"
              >
                {t('collapseAll', 'Collapse All')}
              </button>
            </div>
          )}
        </div>

        {/* Empty Search / Filter State */}
        {filteredDocuments.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-gray-50/50 dark:bg-white/[0.01] border border-dashed border-gray-200 dark:border-white/10">
            <Search className="w-8 h-8 mx-auto text-gray-400 mb-2" />
            <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300">
              {t('noMatchingTokens', 'No matching student tokens found')}
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              {t('noMatchingTokensDesc', 'Try adjusting your search query, batch filter, or status chips.')}
            </p>
            <button
              type="button"
              onClick={controller.resetAllFilters}
              className="mt-3.5 px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
            >
              {t('resetFilters', 'Reset Filters')}
            </button>
          </div>
        ) : viewCategory === 'batch' ? (
          /* ================= VIEW MODE 2: BY BATCH ================= */
          <div className="space-y-4 sm:space-y-5">
            {Object.entries(groupedByBatch).map(([batchName, batchStudents]) => {
              if (batchStudents.length === 0) return null;
              const isCollapsed = Boolean(collapsedBatches[batchName]);

              const activeInBatch = batchStudents.filter(
                (s) => !s.block && getEffectiveStudentMealStatus(s, targetDateIST, effectiveDay, isLunch ? 'lunch' : 'breakfast')
              ).length;
              const batchPercentage = batchStudents.length > 0 ? Math.round((activeInBatch / batchStudents.length) * 100) : 0;

              return (
                <div
                  key={batchName}
                  className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] overflow-hidden shadow-xs"
                >
                  {/* Batch Header Bar */}
                  <button
                    type="button"
                    onClick={() => toggleBatchCollapse(batchName)}
                    className="w-full p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-gray-50/70 dark:bg-white/[0.03] hover:bg-gray-100/70 dark:hover:bg-white/[0.05] transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white">
                            {batchName}
                          </h3>
                          <span className="px-2 py-0.2 rounded-md bg-black/5 dark:bg-white/10 text-[10px] font-bold text-gray-600 dark:text-gray-300">
                            {batchStudents.length} {t('students', 'students')}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">
                          {t('tokensRange', 'Tokens {start} – {end}')
                            .replace('{start}', batchStudents[0]?.tokenNo || '')
                            .replace('{end}', batchStudents[batchStudents.length - 1]?.tokenNo || '')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      {/* Active Count & Mini Progress Bar */}
                      <div className="text-right">
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          {activeInBatch} / {batchStudents.length} {t('studentsActive', 'Active')} ({batchPercentage}%)
                        </span>
                        <div className="w-24 sm:w-32 h-1.5 rounded-full bg-gray-200 dark:bg-white/10 mt-1 overflow-hidden">
                          <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                            style={{ width: `${batchPercentage}%` }}
                          />
                        </div>
                      </div>

                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>

                  {/* Batch Body */}
                  {!isCollapsed && (
                    <div className="p-3.5 sm:p-5 border-t border-gray-100 dark:border-white/5">
                      {renderTokenItems(batchStudents)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : viewCategory === 'section' ? (
          /* ================= VIEW MODE 3: BY MESS SECTIONS (CHUNKS OF 25) ================= */
          <div className="space-y-4 sm:space-y-5">
            {groupedBySection.map((section) => (
              <div
                key={section.id}
                className="rounded-2xl border border-gray-200/80 dark:border-white/10 bg-white/60 dark:bg-white/[0.02] p-4 sm:p-5 space-y-3 shadow-xs"
              >
                <div className="flex flex-wrap sm:flex-nowrap items-center justify-between border-b border-gray-100 dark:border-white/5 pb-2.5 gap-2 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                    <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white truncate">
                      {section.title}
                    </h3>
                    <span className="px-2 py-0.2 rounded-md bg-gray-100 dark:bg-white/10 text-[10px] font-bold text-gray-600 dark:text-gray-300 shrink-0">
                      Tokens {section.range}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                    {section.activeCount} / {section.totalCount} {t('statusServing', 'Active Serving')}
                  </span>
                </div>

                {renderTokenItems(section.students)}
              </div>
            ))}
          </div>
        ) : (
          /* ================= VIEW MODE 1: ALL TOKENS CONTINUOUS GRID ================= */
          renderTokenItems(filteredDocuments)
        )}
      </div>
    </>
  )}

      {/* ================= MODALS & POPUPS ================= */}

      {/* 1. Tactical Admin Quick Popover (Decision 3) */}
      <AdminTokenPopover
        isOpen={Boolean(popoverStudent)}
        onClose={() => setPopoverStudent(null)}
        student={popoverStudent}
        isLunch={isLunch}
        targetDateIST={targetDateIST}
        effectiveDay={effectiveDay}
        onOpenFullDrawer={handleOpenFullDrawer}
        onStudentUpdated={(updatedStudent) => {
          setPopoverStudent(updatedStudent);
        }}
        onOpenDetails={(s) => {
          setPopoverStudent(null);
          setDetailsDoc(s);
        }}
      />

      {/* 1.5. Full Student Token Details Modal (Shared design with Home page) */}
      <AnimatePresence>
        {detailsDoc && (
          <div
            key="admin-student-details-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setDetailsDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden max-h-[92dvh] flex flex-col"
            >
              {/* Modal Header */}
              <div
                className={`p-4 sm:p-5 text-white flex items-center justify-between gap-3 ${
                  detailsDoc.block
                    ? 'bg-gradient-to-r from-gray-800 to-gray-900'
                    : getEffectiveStudentMealStatus(detailsDoc, targetDateIST, effectiveDay, isLunch ? 'lunch' : 'breakfast')
                    ? 'bg-gradient-to-r from-emerald-600 to-green-600'
                    : 'bg-gradient-to-r from-rose-600 to-red-600'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="relative w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-mono font-black text-xl text-white shadow-inner flex-shrink-0">
                    {detailsDoc.tokenNo}
                    {Boolean(detailsDoc.block) && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 border border-white/40 flex items-center justify-center shadow-xs">
                        <Lock className="w-2.5 h-2.5 text-white" />
                      </span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-bold text-white truncate">
                      {detailsDoc.nameEn || detailsDoc.name || `Student #${detailsDoc.tokenNo}`}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-white/80 flex-wrap">
                      {detailsDoc.nameMl && (
                        <span className="font-malayalam">{detailsDoc.nameMl}</span>
                      )}
                      <span>•</span>
                      <span>{detailsDoc.batch || t('generalBatch', 'General Batch')}</span>
                      {(detailsDoc.username || detailsDoc.uname) && (
                        <>
                          <span>•</span>
                          <span className="font-mono">@{detailsDoc.username || detailsDoc.uname}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setDetailsDoc(null);
                  }}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 overflow-y-auto max-h-[calc(90dvh-110px)] pb-safe">
                {detailsDoc.block ? (
                  /* Blocked Student Notice */
                  <div className="space-y-4">
                    <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 flex items-start gap-3.5 shadow-sm">
                      <div className="w-11 h-11 rounded-2xl bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 mt-0.5 border border-rose-300/60 dark:border-rose-500/30">
                        <Ban className="w-6 h-6" />
                      </div>
                      <div className="text-xs text-rose-950 dark:text-rose-100 min-w-0 flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-black text-base sm:text-lg block text-rose-950 dark:text-white">
                            Token #{detailsDoc.tokenNo} Blocked
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-200/80 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 border border-rose-300/60">
                            Dual-Grid Suspension
                          </span>
                        </div>
                        <p className="leading-relaxed text-rose-800 dark:text-rose-300 text-xs">
                          {t(
                            'studentDualGridBlockedDesc',
                            'Both Breakfast and Lunch dining privileges are temporarily suspended due to food waste or attendance infraction.'
                          )}
                        </p>
                        {detailsDoc.blockReason && (
                          <div className="p-2.5 rounded-xl bg-white/80 dark:bg-black/30 border border-rose-200 dark:border-rose-500/20 text-xs">
                            <span className="font-bold text-rose-950 dark:text-rose-200">
                              {t('blockReasonLabel', 'Reason')}:
                            </span>{' '}
                            <span className="italic font-medium text-rose-900 dark:text-rose-200">&ldquo;{detailsDoc.blockReason}&rdquo;</span>
                          </div>
                        )}

                        {/* Prominent Fine Payable Notification Card */}
                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 border border-amber-500/30 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-xs font-black text-amber-950 dark:text-amber-200">
                              <Receipt className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>Fine Payable Amount</span>
                            </div>
                            <span className="font-mono text-lg font-black text-amber-950 dark:text-amber-100 px-2.5 py-0.5 rounded-xl bg-amber-500/20 border border-amber-500/30">
                              ₹{getStudentFineAmount(detailsDoc)}
                            </span>
                          </div>

                          <div className="p-2 rounded-xl bg-white/80 dark:bg-black/40 text-[11px] leading-relaxed text-amber-950 dark:text-amber-200">
                            <strong>Notice to Student:</strong> Please pay the required fine of <strong>₹{getStudentFineAmount(detailsDoc)}</strong> at the <strong>ADSA Canteen Office</strong> to clear this block and restore both Breakfast and Lunch meal tokens.
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Admin Action Buttons */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          setDetailsDoc(null);
                          setShowBlockModal(true);
                        }}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Manage Fine in Block Hub</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          const s = detailsDoc;
                          setDetailsDoc(null);
                          handleOpenFullDrawer(s);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all cursor-pointer shadow-sm text-center flex items-center justify-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>{t('editFullProfile', 'Edit Profile')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          setDetailsDoc(null);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 font-bold text-xs transition-colors cursor-pointer"
                      >
                        {t('closeNotice', 'Close')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Single-Day Exception Alert if applicable (No gold, clean red/rose) */}
                    {(() => {
                      const activeExc = getActiveStudentException(detailsDoc, targetDateIST);
                      if (activeExc) {
                        const bfStatus = activeExc.breakfast !== undefined ? (activeExc.breakfast ? t('takingOn', 'Taking (ON)') : t('skippedOff', 'Skipped (OFF)')) : null;
                        const luStatus = activeExc.lunch !== undefined ? (activeExc.lunch ? t('takingOn', 'Taking (ON)') : t('skippedOff', 'Skipped (OFF)')) : null;
                        return (
                          <div className="p-3.5 sm:p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-500/30 flex items-start gap-2.5">
                            <CalendarDays className="w-5 h-5 text-rose-600 dark:text-rose-400 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-rose-900 dark:text-rose-200">
                              <span className="font-bold block">
                                {t('singleDayExceptionActive', 'Single-Day Exception Active for')} {formatFriendlyDate(targetDateIST)}
                              </span>
                              <span className="block mt-0.5">
                                {bfStatus && <>{t('navBreakfast', 'Breakfast')}: <strong>{bfStatus}</strong> </>}
                                {luStatus && <>• {t('navLunch', 'Lunch')}: <strong>{luStatus}</strong></>}
                              </span>
                              <span className="text-[11px] opacity-75 block mt-1">
                                {t('regularRoutineResumesTomorrow', 'Regular weekly dining routine automatically resumes tomorrow.')}
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Breakfast Schedule Grid */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Coffee className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t('navBreakfast') || 'Breakfast Routine'}</span>
                        </span>
                        <span className="text-[11px] text-gray-400 font-semibold">{t('weeklyOptIn', 'Weekly Routine')}</span>
                      </div>

                      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                        {daysList.map(({ key, label }) => {
                          const active = detailsDoc.obj?.breakfast?.[key] === true;
                          const isCurrentDay = key === effectiveDay;
                          return (
                            <div
                              key={key}
                              className={`p-2 rounded-xl text-center border font-mono transition-all ${
                                isCurrentDay ? 'ring-2 ring-emerald-500/60 ring-offset-1' : ''
                              } ${
                                active
                                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white border-emerald-400/40 shadow-xs'
                                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30'
                              }`}
                            >
                              <span className="block text-[10px] font-bold uppercase">{label}</span>
                              <span className="block text-xs font-black mt-0.5">{active ? 'ON' : 'OFF'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Lunch Schedule Grid */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                          <Utensils className="w-3.5 h-3.5 text-emerald-500" />
                          <span>{t('navLunch') || 'Lunch Routine'}</span>
                        </span>
                        <span className="text-[11px] text-gray-400 font-semibold">{t('weeklyOptIn', 'Weekly Routine')}</span>
                      </div>

                      <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
                        {daysList.map(({ key, label }) => {
                          const active = detailsDoc.obj?.lunch?.[key] === true;
                          const isCurrentDay = key === effectiveDay;
                          return (
                            <div
                              key={key}
                              className={`p-2 rounded-xl text-center border font-mono transition-all ${
                                isCurrentDay ? 'ring-2 ring-emerald-500/60 ring-offset-1' : ''
                              } ${
                                active
                                  ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white border-emerald-400/40 shadow-xs'
                                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-200/50 dark:border-rose-900/30'
                              }`}
                            >
                              <span className="block text-[10px] font-bold uppercase">{label}</span>
                              <span className="block text-xs font-black mt-0.5">{active ? 'ON' : 'OFF'}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Dietary Inclusions & Exemptions */}
                    <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/5">
                      <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        {t('dietaryPreferencesLabel', 'Dietary Inclusions & Exemptions')}
                      </span>
                      <div className="flex flex-wrap gap-1.5 sm:gap-2">
                        {preferencesList.map((pref) => {
                          const isIncluded =
                            detailsDoc.obj2 && detailsDoc.obj2[pref.id] !== undefined
                              ? Boolean(detailsDoc.obj2[pref.id])
                              : true;
                          return (
                            <span
                              key={pref.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                                isIncluded
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20'
                                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isIncluded ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span>{pref.labelEn || pref.name}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Admin Action Bar */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          const s = detailsDoc;
                          setDetailsDoc(null);
                          handleOpenFullDrawer(s);
                        }}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <Edit className="w-4 h-4" />
                        <span>{t('editFullProfile', 'Edit Full Profile in Drawer')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          const tNo = detailsDoc.tokenNo;
                          setDetailsDoc(null);
                          navigate(`/student?token=${tNo}`);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-800 dark:text-gray-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>{t('studentPortal', 'Student Portal')}</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. Full In-Place Student CRUD Drawer */}
      <StudentDrawer
        isOpen={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          setFullDrawerStudent(null);
          if (location.search.includes('token=')) {
            navigate('/admin', { replace: true });
          }
        }}
        student={fullDrawerStudent}
        existingTokens={allTokens}
        existingBatches={existingBatchNames}
        onSaved={handleStudentSaved}
        onDeleted={handleStudentDeleted}
      />

      {/* 3. Token Board Cutoff Lock Manager Modal */}
      <TokenLockManagerModal
        isOpen={showLockManagerModal}
        onClose={() => setShowLockManagerModal(false)}
      />

      {/* 3.5 Dedicated Canteen Block & Fine Registry Modal */}
      <BlockManagementModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        allStudents={documents}
      />

      {/* 4. Kitchen Dietary Distribution Modal */}
      <DietaryBreakdownModal
        isOpen={showDietaryModal}
        onClose={() => setShowDietaryModal(false)}
        documents={documents}
        preferencesList={preferencesList}
        targetDateIST={targetDateIST}
        effectiveDay={effectiveDay}
        isLunch={isLunch}
      />

      {/* 5. Staff Roles & Access Control Modal */}
      <StaffManagementModal
        isOpen={showStaffModal}
        onClose={() => setShowStaffModal(false)}
      />

      {/* 6. Spotlight Command Palette (⌘K) */}
      <ApexCommandPalette
        isOpen={showCommandPalette}
        onClose={() => setShowCommandPalette(false)}
        documents={documents}
        onSelectStudent={handleTokenClick}
        onToggleMeal={() => toggleMeal(isLunch ? 'breakfast' : 'lunch')}
        onToggleLock={isCentralCommittee ? toggleBoardLock : null}
        onOpenDietary={() => setShowDietaryModal(true)}
        onOpenStaff={isCentralCommittee ? () => setShowStaffModal(true) : null}
        onOpenLockModal={isCentralCommittee ? () => setShowLockManagerModal(true) : null}
        onOpenBlockModal={() => setShowBlockModal(true)}
        navigate={navigate}
        isLunch={isLunch}
        effectiveMode={effectiveMode}
        isCentralCommittee={isCentralCommittee}
      />

      {/* 7. Floating Ergonomic Glass Dock */}
      <ApexFloatingDock
        onOpenCommandPalette={() => setShowCommandPalette(true)}
        activeSurface={activeSurface}
        onChangeSurface={setActiveSurface}
        viewDensity={viewDensity}
        onChangeDensity={controller.setViewDensity}
      />
    </div>
  );
}
