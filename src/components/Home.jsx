import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  Printer,
  Edit3,
  Calendar,
  Clock,
  Search,
  Check,
  X,
  Lock,
  Sparkles,
  Users,
  User,
  Filter,
  ArrowRight,
  ShieldAlert,
  ArrowUpDown,
  Layers,
  ChevronDown,
  ChevronRight,
  CalendarDays,
  ShieldCheck,
  HelpCircle,
  Compass,
  Home as HomeIcon,
} from 'lucide-react';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { usePortalStatus } from '../utils/usePortalStatus';
import {
  getActiveStudentException,
  getEffectiveStudentMealStatus,
  formatFriendlyDate,
} from '../utils/studentExceptionService';
import { useTokenBoardController } from '../utils/useTokenBoardController';

import NextMealSpotlight from './NextMealSpotlight';
import TokenBoardGuideModal from './guide/TokenBoardGuideModal';
import WalkthroughTour from './guide/WalkthroughTour';
import TokenBoardControls from './ui/TokenBoardControls';
import TokenBoardDateRibbon from './ui/TokenBoardDateRibbon';
import TokenCard from './ui/TokenCard';
import TokenButton from './ui/TokenButton';
import './Home.css';

// Animated Rolling Counter Component
const RollingCounter = ({ value, label, colorClass, glowClass, icon: Icon, badge, onClick }) => {
  const { t } = useLanguage();
  return (
    <motion.div
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`relative overflow-hidden p-3 xs:p-4 sm:p-5 rounded-xl xs:rounded-2xl bg-white/80 dark:bg-[#121c19]/90 border border-gray-200/80 dark:border-white/10 shadow-sm transition-all duration-300 min-w-0 cursor-pointer ${glowClass}`}
    >
      <div className="flex items-center justify-between gap-1 mb-1.5 xs:mb-2 min-w-0">
        <div className="flex items-center gap-1 min-w-0">
          <span className="text-[11px] xs:text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300 truncate">
            {label}
          </span>
          {badge && (
            <span className="text-[9px] xs:text-[10px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shrink-0">
              {badge}
            </span>
          )}
        </div>
        <div className={`w-7 h-7 xs:w-8 xs:h-8 rounded-xl flex items-center justify-center shrink-0 ${colorClass}`}>
          <Icon className="w-3.5 h-3.5 xs:w-4 xs:h-4 text-white" />
        </div>
      </div>

      <div className="flex items-baseline gap-1.5 xs:gap-2 min-w-0">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-xl xs:text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white"
        >
          {value}
        </motion.span>
        <span className="text-[10px] xs:text-xs text-gray-400 font-medium">{t('orders', 'orders')}</span>
      </div>
    </motion.div>
  );
};


export default function Home() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();
  const portalStatus = usePortalStatus();

  // Unified Token Board Controller Hook
  const controller = useTokenBoardController({
    autoEveningShift: true, // Public Home auto-advances for tomorrow after 2:00 PM IST
    initialMeal: 'lunch',
    initialViewCategory: 'all',
    initialViewDensity: 'matrix',
  });

  const {
    documents,
    filteredDocuments,
    loading,
    isLunch,
    toggleMeal,
    targetDateIST,
    todayIST,
    effectiveDay,
    viewCategory,
    viewDensity,
    groupedByBatch,
    groupedBySection,
    collapsedBatches,
    toggleBatchCollapse,
    preferencesList,
    metrics,
    timeHms,
    time12,
    longDate,
    dayShort,
    dayFull,
    isSynced,
    isDeviceDesynced,
    deviceOffsetMinutes,
    isPostEveningCutoff,
  } = controller;

  // Dialog & Modal States
  const [detailsDoc, setDetailsDoc] = useState(null);
  const [blockedAlertDoc, setBlockedAlertDoc] = useState(null);
  const [lockedPortalAlertOpen, setLockedPortalAlertOpen] = useState(false);
  const [is24Hour, setIs24Hour] = useState(false);

  // Guide & Spotlight Tour States
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [showFirstTimePrompt, setShowFirstTimePrompt] = useState(false);

  useEffect(() => {
    try {
      const tourSeen = localStorage.getItem('adsatboard-tour-seen');
      const promptDismissed = localStorage.getItem('adsatboard-guide-prompt-dismissed');
      if (!tourSeen && !promptDismissed) {
        setShowFirstTimePrompt(true);
      }
    } catch (_) {}
  }, []);

  const dismissFirstTimePrompt = () => {
    feedback('light');
    setShowFirstTimePrompt(false);
    try {
      localStorage.setItem('adsatboard-guide-prompt-dismissed', 'true');
    } catch (_) {}
  };

  // Global Keyboard Shortcut: Press '?' to open guide
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName ? e.target.tagName.toLowerCase() : '';
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;

      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        feedback('tick');
        setIsGuideOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [feedback]);

  const localizedDay = t('daysFull')?.[dayShort] || dayFull;

  const handleOpenDetails = (doc) => {
    feedback('pop');
    setDetailsDoc(doc);
  };

  const handleOpenBlocked = (doc) => {
    feedback('warning');
    setBlockedAlertDoc(doc);
  };

  const handleUpdateTokenClick = () => {
    feedback('tick');
    if (!portalStatus.isOpen) {
      setLockedPortalAlertOpen(true);
    } else {
      navigate('/login');
    }
  };

  const daysList = [
    { key: 'su', label: t('days')?.su || 'Sun' },
    { key: 'mo', label: t('days')?.mo || 'Mon' },
    { key: 'tu', label: t('days')?.tu || 'Tue' },
    { key: 'we', label: t('days')?.we || 'Wed' },
    { key: 'th', label: t('days')?.th || 'Thu' },
    { key: 'fr', label: t('days')?.fr || 'Fri' },
    { key: 'sa', label: t('days')?.sa || 'Sat' },
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-3 xs:px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6 min-w-0">
      
      {/* ================= FIRST-TIME VISITOR GENTLE ONBOARDING PROMPT ================= */}
      {showFirstTimePrompt && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-3.5 sm:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-500/15 via-teal-500/10 to-emerald-500/5 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm backdrop-blur-md"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
                {t('firstTimePromptTitle') || 'New to the Canteen Token Board?'}
              </h4>
              <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300">
                {t('firstTimePromptDesc') || 'Explore our interactive guide or take a 60-second spotlight tour to master the board.'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
            <button
              onClick={() => {
                feedback('tick');
                dismissFirstTimePrompt();
                setIsTourOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>{t('takeTour') || 'Take Tour'}</span>
            </button>
            <button
              onClick={() => {
                feedback('tick');
                dismissFirstTimePrompt();
                setIsGuideOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-gray-800 dark:text-white font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('openGuide') || 'Open Guide'}</span>
            </button>
            <button
              onClick={dismissFirstTimePrompt}
              className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              title="Dismiss prompt"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* ================= HERO BANNER & STATS DOCK ================= */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 p-4 sm:p-6 md:p-8 text-white shadow-xl border border-emerald-500/20 backdrop-blur-xl w-full max-w-full min-w-0">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6 min-w-0 w-full">
          <div className="space-y-1.5 sm:space-y-2 max-w-xl min-w-0">
            <div className="inline-flex items-center gap-2 px-2.5 sm:px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] sm:text-xs font-semibold text-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="truncate">Alathurpadi Dars Live Dining System</span>
            </div>

            <h1 className="text-xl xs:text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-white break-words">
              Canteen Token Board
            </h1>

            <p className="text-xs sm:text-sm text-emerald-100/80 leading-relaxed break-words">
              Real-time meal reservations, dietary tracking, and kitchen distribution counters for students and mess administration.
            </p>
          </div>

          {/* Quick Counter Cards with Drill-Down Filtering */}
          <div className="grid grid-cols-2 gap-2 xs:gap-3 w-full md:w-auto min-w-0">
            <RollingCounter
              value={metrics.breakfastCount}
              label={t('navBreakfast') || 'Breakfast'}
              badge={isPostEveningCutoff ? 'Tomorrow' : undefined}
              colorClass="bg-gradient-to-br from-amber-500 to-orange-600"
              glowClass={!isLunch ? 'border-amber-400 ring-2 ring-amber-500/30' : 'border-amber-500/30 dark:border-amber-500/20'}
              icon={Coffee}
              onClick={() => {
                feedback('pop');
                toggleMeal('breakfast');
              }}
            />
            <RollingCounter
              value={metrics.lunchCount}
              label={t('navLunch') || 'Lunch'}
              badge={isPostEveningCutoff ? 'Tomorrow' : undefined}
              colorClass="bg-gradient-to-br from-emerald-500 to-green-600"
              glowClass={isLunch ? 'border-emerald-400 ring-2 ring-emerald-500/30' : 'border-emerald-500/30 dark:border-emerald-500/20'}
              icon={Utensils}
              onClick={() => {
                feedback('pop');
                toggleMeal('lunch');
              }}
            />
          </div>
        </div>

        {/* Action Dock inside Banner */}
        <div className="relative z-10 mt-4 sm:mt-6 pt-3.5 sm:pt-5 border-t border-white/10 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2.5 sm:gap-3 min-w-0 w-full">
          {/* Live Anti-Tamper Server Time, Day & Date Widget */}
          <div className="flex flex-wrap items-center gap-1.5 xs:gap-2 sm:gap-2.5 min-w-0 w-full lg:w-auto">
            {/* Day & Date Pill */}
            <div className="inline-flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md text-xs font-semibold text-emerald-100 shadow-sm transition-all select-none min-w-0 max-w-full">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-extrabold text-white text-xs sm:text-sm shrink-0">
                  {localizedDay}
                </span>
                <span className="text-emerald-400/50">•</span>
                <span className="text-emerald-200 font-medium truncate">
                  {longDate || 'Loading IST...'}
                </span>
              </div>
            </div>

            {/* Live Server Clock with Seconds */}
            <button
              type="button"
              onClick={() => setIs24Hour((prev) => !prev)}
              className="inline-flex items-center gap-1.5 xs:gap-2 px-2.5 xs:px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-950 border border-emerald-400/30 text-white shadow-inner backdrop-blur-md transition-all active:scale-95 text-left cursor-pointer group min-w-0"
              title="Authoritative server time synchronized via network (immune to device clock manipulation). Click to toggle 12h/24h format."
            >
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              <Clock className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0 group-hover:rotate-12 transition-transform" />
              <span className="font-mono font-black text-xs sm:text-sm tracking-wider text-emerald-100">
                {is24Hour ? timeHms : time12 || '--:--:--'}
              </span>
              <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 shrink-0">
                IST
              </span>
              {isSynced && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-sans font-medium text-emerald-300/80 pl-1 border-l border-emerald-500/30 shrink-0">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>{t('serverTimeSynced', 'Synced')}</span>
                </span>
              )}
            </button>

            {/* Anti-tamper Warning if student's device clock deviates from true server time */}
            {isDeviceDesynced && (
              <div
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/40 text-[11px] font-bold text-amber-200 shadow-sm min-w-0"
                title={`Device clock differs by ~${Math.abs(deviceOffsetMinutes)}m from real IST. Portal operates strictly on network server time.`}
              >
                <ShieldAlert className="w-3.5 h-3.5 text-amber-300 flex-shrink-0 animate-pulse" />
                <span className="hidden xs:inline truncate">{t('deviceDesynced', 'Device Desynced • Using Server Time')}</span>
                <span className="xs:hidden truncate">{t('usingServerTime', 'Using Server Time')}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col min-[380px]:flex-row items-stretch min-[380px]:items-center gap-2 w-full lg:w-auto min-w-0">
            {/* Landing Page Button */}
            <button
              onClick={() => {
                feedback('tick');
                navigate('/');
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-xs border border-white/20 transition-all active:scale-95 whitespace-nowrap min-w-0 shadow-sm"
              title="Return to Public Landing Page"
            >
              <HomeIcon className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>{t('landingPage', 'Landing Page')}</span>
            </button>

            {/* Interactive Token Board Guide Button */}
            <button
              onClick={() => {
                feedback('tick');
                setIsGuideOpen(true);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-xs border border-white/20 transition-all active:scale-95 whitespace-nowrap min-w-0 shadow-sm"
              title="Open Token Board Interactive Guide (or press '?')"
            >
              <HelpCircle className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
              <span>{t('howToUse') || 'How to Use'}</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-white/20 text-[10px] font-mono border border-white/20">?</kbd>
            </button>

            <button
              onClick={() => {
                feedback('tick');
                navigate('/pdfg');
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-xs border border-white/20 transition-all active:scale-95 whitespace-nowrap min-w-0"
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span>{t('supplyListBtn') || 'Kitchen Sheet'}</span>
            </button>

            {/* Smart Locked/Open Token Update Button */}
            <button
              data-tour="update-token-btn"
              onClick={handleUpdateTokenClick}
              className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 xs:gap-2 px-3 xs:px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 min-w-0 text-center ${
                portalStatus.isOpen
                  ? 'bg-white text-emerald-800 hover:bg-emerald-50'
                  : 'bg-amber-400/90 hover:bg-amber-400 text-gray-900 border border-amber-300'
              }`}
            >
              {portalStatus.isOpen ? (
                <>
                  <Edit3 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">{t('updateTokenBtn', 'Update Token')}</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-gray-900 flex-shrink-0" />
                  <span className="hidden sm:inline truncate">{t('tokenPortalLocked', 'Token Portal Locked')} ({portalStatus.statusBadge})</span>
                  <span className="sm:hidden truncate">{t('locked', 'Locked')} ({portalStatus.statusBadge.split(' ')[0]})</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ================= CANTEEN MEAL SPOTLIGHT ================= */}
      <NextMealSpotlight
        documents={documents}
        lunchOrdersCount={metrics.lunchCount}
        breakfastOrdersCount={metrics.breakfastCount}
      />

      {/* ================= DATE RIBBON: TODAY VS TOMORROW SWITCHER ================= */}
      <TokenBoardDateRibbon
        controller={controller}
        showCalendarPicker={false}
      />

      {/* ================= UNIFIED ADVANCED FILTER DOCK ================= */}
      <TokenBoardControls
        controller={controller}
        showDensityToggle={true}
      />

      {/* ================= TOKEN DISPLAY MATRIX ================= */}
      <div data-tour="token-grid" className="min-h-[300px]">
        {filteredDocuments.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/50 dark:bg-[#0f1715]/50 border border-gray-200/60 dark:border-white/5">
            <Filter className="w-8 h-8 mx-auto text-gray-400" />
            <p className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
              {t('noTokensMatch', 'No tokens match your search or filter.')}
            </p>
            <button
              type="button"
              onClick={controller.resetAllFilters}
              className="mt-3 px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-sm"
            >
              {t('resetFilters', 'Reset Filters')}
            </button>
          </div>
        ) : viewCategory === 'batch' ? (
          /* View Mode 2: Grouped by Academic Batch */
          <div className="space-y-4 sm:space-y-6">
            {Object.entries(groupedByBatch).map(([bName, batchStudents]) => {
              if (batchStudents.length === 0) return null;
              const isCollapsed = Boolean(collapsedBatches[bName]);
              const activeCount = batchStudents.filter((s) => {
                return !s.block && getEffectiveStudentMealStatus(s, targetDateIST, effectiveDay, isLunch ? 'lunch' : 'breakfast');
              }).length;
              const batchPercentage = batchStudents.length > 0 ? Math.round((activeCount / batchStudents.length) * 100) : 0;

              return (
                <div
                  key={bName}
                  className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden"
                >
                  <button
                    type="button"
                    onClick={() => toggleBatchCollapse(bName)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between bg-gray-50/80 dark:bg-white/5 border-b border-gray-200/60 dark:border-white/10 text-left hover:bg-gray-100/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-sm">
                        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                          {bName}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {batchStudents.length} {t('studentsTotal', 'Students Total')} • Tokens {batchStudents[0]?.tokenNo} – {batchStudents[batchStudents.length - 1]?.tokenNo}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                        {activeCount} / {batchStudents.length} {t('statusActive', 'Active')} ({batchPercentage}%)
                      </span>
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="p-4 sm:p-5">
                      {viewDensity === 'cards' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                          {batchStudents.map((doc) => {
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
                              <TokenCard
                                key={doc.id || doc.tokenNo}
                                doc={doc}
                                isOn={isOn}
                                onLeave={hasDateExc}
                                isBlocked={isBlocked}
                                isLunch={isLunch}
                                onClick={handleOpenDetails}
                              />
                            );
                          })}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2 sm:gap-2.5">
                          {batchStudents.map((doc) => {
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
                              <TokenButton
                                key={doc.id || doc.tokenNo}
                                doc={doc}
                                isOn={isOn}
                                onLeave={hasDateExc}
                                onClick={handleOpenDetails}
                                onBlockedClick={handleOpenBlocked}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : viewCategory === 'section' ? (
          /* View Mode 3: Grouped by Mess Sections of 25 */
          <div className="space-y-4 sm:space-y-6">
            {groupedBySection.map((sec) => (
              <div
                key={sec.id}
                className="rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden"
              >
                <div className="p-4 sm:p-5 flex items-center justify-between bg-gray-50/80 dark:bg-white/5 border-b border-gray-200/60 dark:border-white/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
                      #{sec.id}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-sm sm:text-base text-gray-900 dark:text-white">
                        {sec.title} (Tokens {sec.range})
                      </h3>
                      <p className="text-xs text-gray-500">
                        {sec.students.length} {t('studentsInSection', 'Students in this Section')}
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300">
                    {sec.activeCount} / {sec.totalCount} {t('statusActive', 'Active')}
                  </span>
                </div>

                <div className="p-4 sm:p-5">
                  {viewDensity === 'cards' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
                      {sec.students.map((doc) => {
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
                          <TokenCard
                            key={doc.id || doc.tokenNo}
                            doc={doc}
                            isOn={isOn}
                            onLeave={hasDateExc}
                            isBlocked={isBlocked}
                            isLunch={isLunch}
                            onClick={handleOpenDetails}
                          />
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2 sm:gap-2.5">
                      {sec.students.map((doc) => {
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
                          <TokenButton
                            key={doc.id || doc.tokenNo}
                            doc={doc}
                            isOn={isOn}
                            onLeave={hasDateExc}
                            onClick={handleOpenDetails}
                            onBlockedClick={handleOpenBlocked}
                          />
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* View Mode 1: All Tokens Continuous Matrix */
          viewDensity === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-3">
              {filteredDocuments.map((doc) => {
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
                  <TokenCard
                    key={doc.id || doc.tokenNo}
                    doc={doc}
                    isOn={isOn}
                    onLeave={hasDateExc}
                    isBlocked={isBlocked}
                    isLunch={isLunch}
                    onClick={handleOpenDetails}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-wrap justify-center gap-2 min-[380px]:gap-2.5 sm:gap-3 py-2">
              {filteredDocuments.map((doc) => {
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
                  <TokenButton
                    key={doc.id || doc.tokenNo}
                    doc={doc}
                    isOn={isOn}
                    onLeave={hasDateExc}
                    onClick={handleOpenDetails}
                    onBlockedClick={handleOpenBlocked}
                  />
                );
              })}
            </div>
          )
        )}
      </div>

      {/* ================= MODAL: UPGRADED STUDENT TOKEN DETAILS ================= */}
      <AnimatePresence>
        {detailsDoc && (
          <div
            key="home-details-modal-portal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
            onClick={() => setDetailsDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]"
            >
              {/* Header Banner */}
              <div
                className={`relative p-4 xs:p-6 text-white flex-shrink-0 ${
                  detailsDoc.block
                    ? 'bg-gradient-to-r from-gray-800 via-gray-800 to-gray-900'
                    : 'bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-800'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 xs:gap-3.5 min-w-0">
                    <div className="relative w-11 h-11 xs:w-14 xs:h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-extrabold text-lg xs:text-2xl shadow-inner border border-white/30 flex-shrink-0">
                      {detailsDoc.tokenNo}
                      {Boolean(detailsDoc.block) && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 border border-white/40 flex items-center justify-center shadow-xs">
                          <Lock className="w-2.5 h-2.5 text-white" />
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base xs:text-xl font-bold tracking-tight truncate">
                          {detailsDoc.nameEn || detailsDoc.name || `Student #${detailsDoc.tokenNo}`}
                        </h2>
                      </div>
                      {detailsDoc.nameMl && (
                        <p
                          className={`text-xs font-medium mt-0.5 truncate font-malayalam ${
                            detailsDoc.block ? 'text-gray-300' : 'text-emerald-100'
                          }`}
                        >
                          {detailsDoc.nameMl}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 xs:gap-2 mt-1 xs:mt-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 border border-white/20">
                          {detailsDoc.batch || t('generalBatch', 'General Batch')}
                        </span>
                        {detailsDoc.roomNo && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/15 border border-white/15">
                            Room {detailsDoc.roomNo}
                          </span>
                        )}
                        <span
                          className={`text-[10px] xs:text-[11px] flex items-center gap-1 font-mono ${
                            detailsDoc.block ? 'text-gray-300' : 'text-emerald-100'
                          }`}
                        >
                          @{detailsDoc.username || detailsDoc.uname || detailsDoc.tokenNo}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      feedback('tick');
                      setDetailsDoc(null);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex-shrink-0 cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-4 xs:p-6 space-y-4 xs:space-y-5 overflow-y-auto max-h-[calc(90dvh-110px)] pb-safe">
                {detailsDoc.block ? (
                  /* ================= BLOCKED STUDENT VIEW: ONLY PERSONAL DETAILS & NOTICE ================= */
                  <div className="space-y-4">
                    {/* Admin Blocked Alert */}
                    <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-300 dark:border-red-500/30 flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div className="text-xs text-red-900 dark:text-red-200 min-w-0 flex-1">
                        <span className="font-extrabold text-sm block">
                          {t('tokenLockedByAdmin', `Token #${detailsDoc.tokenNo} Locked by Admin`).replace('{token}', detailsDoc.tokenNo)}
                        </span>
                        <span className="block mt-1 leading-relaxed text-red-800 dark:text-red-300">
                          {t('studentTokenSuspendedDesc', 'This student account has been administratively suspended. Dining privileges and token changes are paused.')}
                        </span>
                        {detailsDoc.blockReason && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-white/70 dark:bg-black/30 border border-red-200 dark:border-red-500/20 text-xs">
                            <span className="font-bold text-red-950 dark:text-red-200">
                              {t('blockReasonLabel', 'Reason')}:
                            </span>{' '}
                            <span className="italic font-medium">&ldquo;{detailsDoc.blockReason}&rdquo;</span>
                          </div>
                        )}
                        <span className="block mt-2 text-[11px] text-red-700/80 dark:text-red-300/80">
                          {t('consultOffice', 'Please consult the ADSA Office or Canteen Secretary to resolve status.')}
                        </span>
                      </div>
                    </div>

                    {/* Simple Close button instead of login */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          feedback('tick');
                          setDetailsDoc(null);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold text-xs transition-colors cursor-pointer shadow-sm"
                      >
                        {t('closeNotice', 'Close')}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ================= ACTIVE / UNBLOCKED STUDENT VIEW: FULL SCHEDULES & PREFERENCES ================= */
                  <>
                    {/* Active Date Exception Notice if any for today / target date */}
                    {(() => {
                      const activeExc = getActiveStudentException(detailsDoc, targetDateIST);
                      if (activeExc) {
                        const bfStatus = activeExc.breakfast !== undefined ? (activeExc.breakfast ? t('takingOn', 'Taking (ON)') : t('skippedOff', 'Skipped (OFF)')) : null;
                        const luStatus = activeExc.lunch !== undefined ? (activeExc.lunch ? t('takingOn', 'Taking (ON)') : t('skippedOff', 'Skipped (OFF)')) : null;
                        return (
                          <div className="p-3.5 xs:p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-500/30 flex items-start gap-2.5 xs:gap-3">
                            <CalendarDays className="w-4 h-4 xs:w-5 xs:h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                            <div className="text-xs text-amber-900 dark:text-amber-200">
                              <span className="font-bold block">
                                {t('singleDayExceptionActive', 'Single-Day Exception Active for')} {formatFriendlyDate(targetDateIST)}
                              </span>
                              <span className="block mt-0.5">
                                {bfStatus && <>{t('navBreakfast', 'Breakfast')}: <strong>{bfStatus}</strong> </>}
                                {luStatus && <>• {t('navLunch', 'Lunch')}: <strong>{luStatus}</strong></>}
                              </span>
                              <span className="text-[11px] opacity-75 block mt-1">
                                {targetDateIST === todayIST
                                  ? t('regularRoutineResumesTomorrow', 'Regular weekly dining routine automatically resumes tomorrow.')
                                  : t('singleDayOverrideTomorrow', 'Single-day override scheduled for tomorrow.')}
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
                        <span className="text-[11px] text-gray-400 font-semibold">{t('weeklyOptIn', 'Weekly Opt-in')}</span>
                      </div>

                      <div className="grid grid-cols-7 gap-1 xs:gap-1.5">
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
                        <span className="text-[11px] text-gray-400 font-semibold">{t('weeklyOptIn', 'Weekly Opt-in')}</span>
                      </div>

                      <div className="grid grid-cols-7 gap-1 xs:gap-1.5">
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
                      <div className="flex flex-wrap gap-1.5 xs:gap-2">
                        {preferencesList.map((pref) => {
                          const isIncluded =
                            detailsDoc.obj2 && detailsDoc.obj2[pref.id] !== undefined
                              ? Boolean(detailsDoc.obj2[pref.id])
                              : true;
                          return (
                            <span
                              key={pref.id}
                              className={`inline-flex items-center gap-1.5 px-2.5 xs:px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
                                isIncluded
                                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20'
                                  : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-500/20'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${isIncluded ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span>{lang === 'ml' && pref.labelMl ? pref.labelMl : (pref.labelEn || pref.name)}</span>
                              {!isIncluded && <span className="text-[10px] opacity-80">({t('exempt', 'Exempt')})</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Action Button to Update Own Token */}
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          feedback('tick');
                          setDetailsDoc(null);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                        onClickCapture={() => {
                          if (!portalStatus.isOpen) {
                            setLockedPortalAlertOpen(true);
                          } else {
                            navigate(`/login?token=${detailsDoc.tokenNo}`);
                          }
                        }}
                      >
                        <span>{t('areYouStudent', `Are you Student #${detailsDoc.tokenNo}? Update your Preferences`).replace('{token}', detailsDoc.tokenNo)}</span>
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: LOCKED PORTAL SCHEDULE NOTICE ================= */}
      <AnimatePresence>
        {lockedPortalAlertOpen && (
          <div
            key="home-locked-portal-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
            onClick={() => setLockedPortalAlertOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0f1715] border border-amber-200 dark:border-amber-500/20 shadow-2xl p-6 text-center space-y-4"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('tokenUpdatesSuspended', 'Token Updates are Suspended')}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                  {t('tokenUpdatesSuspendedDesc', 'Token updates have been temporarily paused by the ADSA Canteen Committee. Normal operational updates will resume shortly.')}
                </p>
                <div className="mt-3 p-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-500/20 text-xs font-semibold text-amber-800 dark:text-amber-300">
                  {t('currentStatusColon', 'Current Status:')} {portalStatus.statusBadge}
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  onClick={() => {
                    feedback('tick');
                    setLockedPortalAlertOpen(false);
                    navigate('/menu');
                  }}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                >
                  {t('viewCanteenMenu', 'View Canteen Menu')}
                </button>
                <button
                  onClick={() => setLockedPortalAlertOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs"
                >
                  {t('understood', 'Understood')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: BLOCKED NOTICE ================= */}
      <AnimatePresence>
        {blockedAlertDoc && (
          <div
            key="home-blocked-alert-modal"
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setBlockedAlertDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0f1715] border border-red-200 dark:border-red-500/20 shadow-2xl p-6 text-center space-y-4"
            >
              <div className="w-14 h-14 mx-auto rounded-2xl bg-red-100 dark:bg-red-950/40 text-red-600 dark:text-red-400 flex items-center justify-center">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {t('tokenLockedByAdmin', `Token #${blockedAlertDoc.tokenNo} Locked by Admin`).replace('{token}', blockedAlertDoc.tokenNo)}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                  {t('studentTokenSuspendedDesc', 'This student account has been administratively suspended. Dining privileges and self-service token changes are paused.')}
                </p>
                {blockedAlertDoc.blockReason && (
                  <div className="mt-3 p-3 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-500/20 text-xs font-medium text-red-800 dark:text-red-300">
                    {t('blockReasonLabel', 'Reason')}: <em>&ldquo;{blockedAlertDoc.blockReason}&rdquo;</em>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setBlockedAlertDoc(null)}
                  className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs"
                >
                  {t('closeNotice', 'Close Notice')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= MODAL: INTERACTIVE HOW-TO-USE GUIDE & SIMULATOR ================= */}
      <TokenBoardGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />

      {/* ================= SPOTLIGHT WALKTHROUGH TOUR ================= */}
      <WalkthroughTour
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
      />
    </div>
  );
}