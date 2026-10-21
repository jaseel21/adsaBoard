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
} from 'lucide-react';
import { dialog } from '../utils/dialog';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { AuthContext } from '../store/AuthContext';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { useTokenLockStatus } from '../utils/useTokenLockStatus';
import { useTokenBoardController } from '../utils/useTokenBoardController';

import TokenLockManagerModal from './TokenLockManagerModal';
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
import { getActiveStudentException, getEffectiveStudentMealStatus } from '../utils/studentExceptionService';
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
  const [showDietaryModal, setShowDietaryModal] = useState(false);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [popoverStudent, setPopoverStudent] = useState(null);
  const [fullDrawerStudent, setFullDrawerStudent] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

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
          {/* ================= DATE & SCHEDULE SELECTOR RIBBON ================= */}
      <TokenBoardDateRibbon
        controller={controller}
        showCalendarPicker={true}
      />

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
          /* ================= VIEW MODE 2: BY ACADEMIC BATCH ================= */
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
      />

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
        existingBatches={allBatches.map((b) => b.name)}
        onSaved={handleStudentSaved}
        onDeleted={handleStudentDeleted}
      />

      {/* 3. Token Lock & Cutoff Schedule Manager Modal */}
      <TokenLockManagerModal
        isOpen={showLockManagerModal}
        onClose={() => setShowLockManagerModal(false)}
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
