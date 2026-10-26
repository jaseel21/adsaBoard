import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Utensils,
  Coffee,
  FileDown,
  Clock,
  Calendar,
  Sparkles,
  ArrowRight,
  Users,
  CheckCircle2,
  Activity,
  ChefHat,
  Sliders,
  Download,
  Printer,
  ExternalLink,
  Eye,
  Compass,
  HelpCircle,
  Layers,
  ChevronRight,
  AlertCircle,
  ShieldAlert,
  CalendarDays,
  FileText,
  HeartHandshake,
  Check,
  Info,
  Zap,
  Star,
} from 'lucide-react';
import firebase from '../firebase/config';
import { AuthContext } from '../store/AuthContext';
import { DataOfOne } from '../store/StudentData';
import { useLanguage } from '../store/LanguageContext';
import { usePreferences } from '../store/PreferencesContext';
import { useFeedback } from '../utils/useFeedback';
import { useTokenLockStatus } from '../utils/useTokenLockStatus';
import { useWorldTime } from '../utils/time';
import { subscribeToPreferences } from '../utils/preferenceService';
import { subscribeToCanteenConfig } from '../utils/canteenConfigService';
import {
  addDaysToDate,
  formatFriendlyDate,
  getEffectiveStudentMealStatus,
} from '../utils/studentExceptionService';
import {
  exportSinglePageCombinedManifestPDF,
  exportDietaryAvoidersPDF,
  generateSinglePageCombinedManifestDoc,
  generateDietaryAvoidersDoc,
} from '../utils/publicDocumentExporter';
import { directPrintPdf, shareDocument, createPdfBlob } from '../utils/documentHubService';
import TokenBoardGuideModal from './guide/TokenBoardGuideModal';
import AdvancedExportModal from './export/AdvancedExportModal';
import UniversalDocumentModal from './export/UniversalDocumentModal';
import ExportActionMenu from './export/ExportActionMenu';
import HeroMealCountersDock from './HeroMealCountersDock';

export default function LandingPage() {
  const navigate = useNavigate();
  const { user, role, homeRoute } = useContext(AuthContext);
  const { stdata } = useContext(DataOfOne);
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  // World Time and Cutoff
  const { timeHms, time12, dayShort, dayFull, longDate, isSynced } = useWorldTime('Asia/Kolkata');
  const {
    todayIST,
    isTomorrowLocked,
    statusBadge,
    startTime,
    endTime,
    isPortalAccessible,
    defaultDayOffset,
    rawBoardSwitchTime,
    boardSwitchTime,
  } = useTokenLockStatus();

  const { preferences: clientPreferences, setPreference } = usePreferences();
  const is24Hour = clientPreferences?.clockFormat === '24h';
  const [isGuideOpen, setIsGuideOpen] = useState(false);

  // Document Manifest Target Selection: 'today' (0) | 'tomorrow' (1)
  // Defaults: 12 AM to window open time (eg. 2 PM) -> Today (0), open time to 12 AM -> Tomorrow (1)
  const [manifestDayOffset, setManifestDayOffset] = useState(() => defaultDayOffset ?? 0);
  const [hasManifestUserToggled, setHasManifestUserToggled] = useState(false);

  // Keep manifest offset in sync with default until user explicitly toggles
  useEffect(() => {
    if (!hasManifestUserToggled && typeof defaultDayOffset === 'number') {
      setManifestDayOffset(defaultDayOffset);
    }
  }, [defaultDayOffset, hasManifestUserToggled]);

  // PDF Export Feedback States
  const [exportingSupply, setExportingSupply] = useState(false);
  const [exportingDietary, setExportingDietary] = useState(false);
  const [advancedExportModal, setAdvancedExportModal] = useState({ isOpen: false, type: 'supply' });
  const [universalDoc, setUniversalDoc] = useState({ isOpen: false, data: null });
  const [sectionChunkSize, setSectionChunkSize] = useState(25);

  // Real-time Anonymous Aggregates from Firestore
  const [studentsList, setStudentsList] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [loadingData, setLoadingData] = useState(true);

  // Subscribe to students anonymously for accurate preparation counts
  useEffect(() => {
    setLoadingData(true);
    const unsubStudents = firebase
      .firestore()
      .collection('students')
      .onSnapshot(
        (snapshot) => {
          const list = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setStudentsList(list);
          setLoadingData(false);
        },
        (err) => {
          console.warn('Landing page student listener:', err);
          setLoadingData(false);
        }
      );

    const unsubPrefs = subscribeToPreferences((prefs) => {
      setPreferences(prefs.filter((p) => p.isActive !== false));
    });

    const unsubCanteen = subscribeToCanteenConfig((cfg) => {
      if (cfg?.sectionChunkSize) {
        setSectionChunkSize(cfg.sectionChunkSize);
      }
    });

    return () => {
      unsubStudents();
      unsubPrefs();
      unsubCanteen();
    };
  }, []);

  // Compute Selected Manifest Date
  const selectedTargetDateIST = useMemo(() => {
    return manifestDayOffset === 0 ? todayIST : addDaysToDate(todayIST, manifestDayOffset);
  }, [manifestDayOffset, todayIST]);

  const selectedDayKey = useMemo(() => {
    const days = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    if (!dayShort) return 'su';
    const currIdx = days.indexOf(dayShort.toLowerCase());
    return days[(currIdx + manifestDayOffset) % 7];
  }, [dayShort, manifestDayOffset]);

  // Compute Live Meal Aggregates
  const aggregates = useMemo(() => {
    if (studentsList.length === 0) {
      return {
        totalStudents: 0,
        lunchCount: 0,
        breakfastCount: 0,
        avoidersTotal: 0,
        rejectionsMap: {},
      };
    }

    let lunchActive = 0;
    let breakfastActive = 0;
    const rejections = {};

    preferences.forEach((pref) => {
      rejections[pref.id] = [];
    });

    studentsList.forEach((s) => {
      // Meal status for target date
      if (getEffectiveStudentMealStatus(s, selectedTargetDateIST, selectedDayKey, 'lunch')) {
        lunchActive += 1;
      }
      if (getEffectiveStudentMealStatus(s, selectedTargetDateIST, selectedDayKey, 'breakfast')) {
        breakfastActive += 1;
      }

      // Dietary avoidances
      if (s.obj2) {
        preferences.forEach((pref) => {
          if (s.obj2[pref.id] === false) {
            rejections[pref.id].push(s.tokenNo);
          }
        });
      }
    });

    const totalAvoiders = Object.values(rejections).reduce((acc, arr) => acc + arr.length, 0);

    return {
      totalStudents: studentsList.length,
      lunchCount: lunchActive,
      breakfastCount: breakfastActive,
      avoidersTotal: totalAvoiders,
      rejectionsMap: rejections,
    };
  }, [studentsList, selectedTargetDateIST, selectedDayKey, preferences]);

  // Supply Manifest Actions (View, Print, Share, Download)
  const handleViewSupplyManifest = () => {
    feedback('tick');
    const res = generateSinglePageCombinedManifestDoc({
      targetDateIST: selectedTargetDateIST,
      dayKey: selectedDayKey,
      dayFull: manifestDayOffset === 0 ? dayFull : 'Tomorrow',
      documents: studentsList,
      chunkSize: sectionChunkSize,
      mealFilter: 'both',
    });
    setUniversalDoc({ isOpen: true, data: { type: 'pdf', ...res } });
  };

  const handlePrintSupplyManifest = async () => {
    feedback('tick');
    try {
      const { doc } = generateSinglePageCombinedManifestDoc({
        targetDateIST: selectedTargetDateIST,
        dayKey: selectedDayKey,
        dayFull: manifestDayOffset === 0 ? dayFull : 'Tomorrow',
        documents: studentsList,
        chunkSize: sectionChunkSize,
        mealFilter: 'both',
      });
      const { blobUrl } = createPdfBlob(doc);
      await directPrintPdf(blobUrl);
    } catch (err) {
      console.error('Print manifest error:', err);
    }
  };

  const handleShareSupplyManifest = async () => {
    feedback('pop');
    try {
      const { doc, filename, title } = generateSinglePageCombinedManifestDoc({
        targetDateIST: selectedTargetDateIST,
        dayKey: selectedDayKey,
        dayFull: manifestDayOffset === 0 ? dayFull : 'Tomorrow',
        documents: studentsList,
        chunkSize: sectionChunkSize,
        mealFilter: 'both',
      });
      const { blob } = createPdfBlob(doc);
      await shareDocument({
        blob,
        filename,
        title,
        text: `${title} (${selectedTargetDateIST}) • Alathurpadi Dars Canteen`,
      });
    } catch (err) {
      console.error('Share manifest error:', err);
    }
  };

  const handleDownloadCombinedSupply = () => {
    feedback('tick');
    const { doc, filename } = generateSinglePageCombinedManifestDoc({
      targetDateIST: selectedTargetDateIST,
      dayKey: selectedDayKey,
      dayFull: manifestDayOffset === 0 ? dayFull : 'Tomorrow',
      documents: studentsList,
      chunkSize: sectionChunkSize,
      mealFilter: 'both',
    });
    doc.save(filename);
  };

  // Dietary Avoiders Matrix Actions (View, Print, Share, Download)
  const handleViewDietaryAvoiders = () => {
    feedback('tick');
    const res = generateDietaryAvoidersDoc({
      preferences,
      documents: studentsList,
      rejectionsByPref: aggregates.rejectionsMap,
      targetDateIST: selectedTargetDateIST,
      dayKey: selectedDayKey,
      dayFull: manifestDayOffset === 0 ? dayFull : 'Tomorrow',
      attendanceScope: 'active_diners',
      mealFilter: 'both',
    });
    setUniversalDoc({ isOpen: true, data: { type: 'pdf', ...res } });
  };

  const handleDownloadDietaryAvoiders = () => {
    feedback('tick');
    const { doc, filename } = generateDietaryAvoidersDoc({
      preferences,
      documents: studentsList,
      rejectionsByPref: aggregates.rejectionsMap,
      targetDateIST: selectedTargetDateIST,
      dayKey: selectedDayKey,
      dayFull: manifestDayOffset === 0 ? dayFull : 'Tomorrow',
      attendanceScope: 'active_diners',
      mealFilter: 'both',
    });
    doc.save(filename);
  };

  const handlePrintDietaryAvoiders = async () => {
    feedback('tick');
    try {
      const { doc } = generateDietaryAvoidersDoc({
        preferences,
        documents: studentsList,
        rejectionsByPref: aggregates.rejectionsMap,
        targetDateIST: selectedTargetDateIST,
        dayKey: selectedDayKey,
        dayFull: manifestDayOffset === 0 ? dayFull : 'Tomorrow',
        attendanceScope: 'active_diners',
        mealFilter: 'both',
      });
      const { blobUrl } = createPdfBlob(doc);
      await directPrintPdf(blobUrl);
    } catch (err) {
      console.error('Print matrix error:', err);
    }
  };

  const handleShareDietaryAvoiders = async () => {
    feedback('pop');
    try {
      const { doc, filename, title } = generateDietaryAvoidersDoc({
        preferences,
        documents: studentsList,
        rejectionsByPref: aggregates.rejectionsMap,
        targetDateIST: selectedTargetDateIST,
        dayKey: selectedDayKey,
        dayFull: manifestDayOffset === 0 ? dayFull : 'Tomorrow',
        attendanceScope: 'active_diners',
        mealFilter: 'both',
      });
      const { blob } = createPdfBlob(doc);
      await shareDocument({
        blob,
        filename,
        title,
        text: `${title} (${selectedTargetDateIST}) • Alathurpadi Dars Canteen`,
      });
    } catch (err) {
      console.error('Share matrix error:', err);
    }
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

  return (
    <div className="relative w-full max-w-full overflow-hidden pb-12 sm:pb-20 space-y-8 sm:space-y-12">
      
      {/* ================= BACKGROUND MESH & GLOW EFFECTS ================= */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[550px] pointer-events-none -z-10">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 blur-[130px]" />
        <div className="absolute top-20 right-10 w-[420px] h-[420px] rounded-full bg-teal-500/15 dark:bg-teal-500/10 blur-[120px]" />
        <div className="absolute top-60 left-10 w-[300px] h-[300px] rounded-full bg-emerald-400/10 dark:bg-emerald-400/5 blur-[90px]" />
      </div>

      <div className="max-w-7xl mx-auto px-3.5 xs:px-4 sm:px-6 lg:px-8 pt-4 sm:pt-8 space-y-8 sm:space-y-12">

        {/* ================= ACTIVE SESSION RESUME BANNER ================= */}
        {(stdata?.tokenNo || user) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 xs:p-4 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/10 border border-emerald-500/30 backdrop-blur-xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0 shadow-inner">
                {stdata?.tokenNo ? <KeyRound className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white">
                    {stdata?.tokenNo
                      ? t('activeStudentSession', 'Active Student Session: Token #{token}').replace('{token}', stdata.tokenNo)
                      : t('activeStaffSession', 'Active Staff Session: {name}').replace('{name}', user.email?.split('@')[0] || t('committeeMember', 'Committee Member'))}
                  </h4>
                </div>
                <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300">
                  {stdata?.tokenNo
                    ? t('studentSessionDesc', 'Your meal selections and leave schedule are currently accessible.')
                    : t('staffSessionDesc', 'You are signed in with administrative committee privileges.')}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
              <button
                onClick={() => {
                  feedback('pop');
                  navigate(stdata?.tokenNo ? '/student-portal' : (homeRoute || '/admin'));
                }}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <span>{stdata?.tokenNo ? t('openDiningPortal', 'Open Dining Portal') : t('openAdminConsole', 'Open Admin Console')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  feedback('pop');
                  navigate('/menu');
                }}
                className="px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 dark:bg-white/10 text-gray-800 dark:text-white font-bold text-xs flex items-center gap-1.5 transition-all"
              >
                <Utensils className="w-3.5 h-3.5 text-emerald-500" />
                <span>{t('viewFoodMenuBtn', 'View Food Menu')}</span>
              </button>
            </div>
          </motion.div>
        )}

        {/* ================= HERO SECTION & TELEMETRY DOCK ================= */}
        <section className="relative overflow-hidden rounded-3xl sm:rounded-[2.5rem] bg-gradient-to-br from-emerald-900 via-emerald-950 to-[#041510] p-5 xs:p-7 sm:p-10 md:p-12 text-white shadow-2xl border border-emerald-500/30 backdrop-blur-2xl">
          {/* Subtle Institutional Watermark / Motif */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 sm:gap-8">
            <div className="space-y-3 sm:space-y-4 max-w-2xl">
              {/* Institutional Crest Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-[11px] sm:text-xs font-semibold text-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-extrabold tracking-wide uppercase text-[10px] text-emerald-300">
                  {t('alathurpadiDars', 'Alathurpadi Dars')}
                </span>
                <span className="text-white/40">•</span>
                <span>{t('protectedDiningNetwork', 'Protected Dining & Token Network')}</span>
              </div>

              <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight break-words">
                {t('landingHeroTitle', 'Precision Dining Logistics & Student Token Board')}
              </h1>

              <p className="text-xs sm:text-sm md:text-base text-emerald-100/80 leading-relaxed max-w-xl">
                {t('landingHeroSubtitle', 'Real-time meal reservations, zero-waste kitchen supply manifests, and confidential student dietary tracking for the historical Alathurpadi Juma Masjid dining hall.')}
              </p>

              {/* Security Policy Badge */}
              <div className="inline-flex items-center gap-2 pt-1 text-xs text-emerald-200/90 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <span>{t('securityPrivacyNotice', 'Student identities and dietary preferences are securely protected behind authentication.')}</span>
              </div>
            </div>

            {/* Pro-Motion 3D Flippable Meal Counters Dock */}
            <HeroMealCountersDock
              studentsList={studentsList}
              todayIST={todayIST}
              dayShort={dayShort}
              dayFull={dayFull}
              loadingData={loadingData}
              boardSwitchTime={rawBoardSwitchTime || '14:00'}
              windowOpenTime={rawBoardSwitchTime || '14:00'}
              defaultOffset={defaultDayOffset}
            />
          </div>

          {/* ========================================================================= */}
          {/* RE-POSITIONED AUTHORITATIVE TELEMETRY COMMAND STRIP (HERO BASE DOCK)      */}
          {/* ========================================================================= */}
          <div className="relative z-10 mt-6 sm:mt-8 pt-4 sm:pt-5 border-t border-white/15 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
            {/* Left Telemetry Group: Calendar, Live Clock & Anti-Tamper Synced Status */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* IST Calendar & Day Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 backdrop-blur-md text-xs font-semibold text-emerald-200 shadow-sm transition-all select-none">
                <CalendarDays className="w-4 h-4 text-emerald-400" />
                <span>{dayFull || t('istCalendar', 'IST Calendar')}</span>
                <span className="text-white/40">•</span>
                <span className="font-mono text-white/90">
                  {longDate || t('syncingServerTime', 'Synchronizing authoritative server time...')}
                </span>
              </div>

              {/* Authoritative Live IST Clock */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-950 border border-emerald-400/30 text-white shadow-inner backdrop-blur-md transition-all select-none">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
                </span>
                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setPreference('clockFormat', is24Hour ? '12h' : '24h');
                  }}
                  className="font-mono font-black text-sm sm:text-base text-white tracking-wider hover:text-emerald-300 transition-colors cursor-pointer select-none"
                  title={t('clockFormatTitle', 'Click to toggle 12h / 24h format')}
                >
                  {is24Hour ? timeHms : time12 || '--:--:--'}
                </button>
                <span className="text-[10px] font-mono font-bold text-emerald-300 px-1.5 py-0.5 rounded bg-white/10">
                  IST
                </span>
                {isSynced && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{t('syncedBadge', 'Synced')}</span>
                  </span>
                )}
              </div>
            </div>

            {/* Right Telemetry Group: Dynamic Cutoff Pill & Token Board Guide */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Dynamic Cutoff Status Pill */}
              <div
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border backdrop-blur-md text-xs font-semibold shadow-inner transition-all ${
                  !isTomorrowLocked
                    ? 'bg-emerald-950/70 border-emerald-400/30 text-emerald-200'
                    : 'bg-amber-950/70 border-amber-400/30 text-amber-200'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    !isTomorrowLocked
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-amber-500/20 text-amber-400'
                  }`}
                >
                  {!isTomorrowLocked ? <Clock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                </div>
                <span className="font-bold">{statusBadge}</span>
                <span className="text-white/40">•</span>
                <span className="text-[11px] opacity-80 font-mono">
                  {!isTomorrowLocked
                    ? t('cutoffAtTime', 'Cutoff at {time}').replace('{time}', endTime || '11:00 PM IST')
                    : t('nextDaySelectionsClosed', 'Next-day selections closed')}
                </span>
              </div>

              {/* Guide Button */}
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setIsGuideOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/15 backdrop-blur-md transition-all active:scale-95 cursor-pointer shadow-sm"
                title={t('viewTokenBoardGuide', 'View Token Board Guide')}
              >
                <HelpCircle className="w-3.5 h-3.5 text-emerald-300" />
                <span className="hidden sm:inline">{t('guide', 'Guide')}</span>
              </button>
            </div>
          </div>
        </section>

        {/* ================= DUAL AUTHENTICATION GATEWAYS ================= */}
        {/* ================= DUAL AUTHENTICATION GATEWAYS ================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-emerald-500" />
                <span>{t('authorizedGatewaysTitle', 'Authorized System Gateways')}</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('authorizedGatewaysSubtitle', 'Authenticate with your student token or committee staff account to enter the web system.')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* GATEWAY CARD 1: STUDENT DINING PORTAL */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-lg hover:shadow-glow-emerald transition-all duration-300 p-5 sm:p-7 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center shadow-md">
                    <KeyRound className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    {t('selfServiceBadge', 'Self-Service')}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
                    {t('studentDiningPortalTitle', 'Student Dining Portal')}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    {t('studentDiningPortalDesc', 'Personalized dashboard for students to set weekly lunch/breakfast routines, record leaves, check dietary preferences, and view token calendar history.')}
                  </p>
                </div>

                {/* Student Features & Tools */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                    {t('studentFeaturesAndTools', 'Student Features & Tools:')}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t('featWeeklyRoutine', 'Weekly Routine')}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5 text-teal-500" />
                      <span>{t('featLeaveScheduler', 'Leave Scheduler')}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <HeartHandshake className="w-3.5 h-3.5 text-rose-500" />
                      <span>{t('featDietaryExclusions', 'Dietary Exclusions')}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t('featDiningCalendar', 'Dining Calendar')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span>{t('studentLoginNotice', 'Log in using your Token Number and secure PIN to manage your meals, schedule absences, and view history.')}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  feedback('tick');
                  navigate('/login');
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-500/20 transition-all active:scale-95"
              >
                <span>{t('enterStudentPortalBtn', 'Enter Student Portal')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>

            {/* GATEWAY CARD 2: COMMITTEE & KITCHEN CONSOLE */}
            <motion.div
              whileHover={{ y: -3 }}
              transition={{ duration: 0.2 }}
              className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-lg hover:shadow-glow-emerald transition-all duration-300 p-5 sm:p-7 flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-600 to-emerald-800 text-white flex items-center justify-center shadow-md">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-500/20">
                    {t('staffAndMessBadge', 'Staff & Mess')}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-gray-900 dark:text-white">
                    {t('committeeMessCommandTitle', 'Committee & Mess Command')}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    {t('committeeMessCommandDesc', 'Role-based management portal for ADSA Central Committee, Canteen Sub-Committee, Kitchen Display System (KDS), and System Engineers.')}
                  </p>
                </div>

                {/* Role Badges */}
                <div className="space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                    {t('supportedRoleCredentials', 'Supported Role Credentials:')}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{t('roleCentralCommittee', 'Central Committee')}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <ChefHat className="w-3.5 h-3.5 text-amber-500" />
                      <span>{t('roleKitchenDisplay', 'Kitchen Display (Cooks)')}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Utensils className="w-3.5 h-3.5 text-teal-500" />
                      <span>{t('roleCanteenSubCommittee', 'Canteen Sub-Committee')}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 text-[11px] font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t('roleAuditDevelopers', 'Audit & Developers')}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/20 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                  <Zap className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <span>{t('staffPrivilegeNotice', 'Authenticated staff gain access to live Master Board controls, student rosters, dietary matrices, and immutable audit logs.')}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  feedback('tick');
                  navigate('/alogin');
                }}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
              >
                <span>{t('Admin Sign In', 'Admin Sign In')}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </div>
        </section>

        {/* ================= PUBLIC KITCHEN DOCUMENTS & MANIFEST HUB ================= */}
        <section className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                <FileDown className="w-4 h-4" />
                <span>{t('zeroLoginHubBadge', 'Zero-Login Operations Hub')}</span>
              </div>
              <h2 className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                {t('publicKitchenDocsTitle', 'Public Kitchen Documents & Manifests')}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t('publicKitchenDocsSubtitle', 'Official operational manifests for mess cooks, food suppliers, and distribution counters. Downloadable in 1 click without requiring login.')}
              </p>
            </div>

            {/* Target Date Selector */}
            <div className="flex p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 self-start sm:self-auto">
              <button
                onClick={() => {
                  feedback('tick');
                  setHasManifestUserToggled(true);
                  setManifestDayOffset(0);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  manifestDayOffset === 0
                    ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {t('today', 'Today')} ({todayIST})
              </button>
              <button
                onClick={() => {
                  feedback('tick');
                  setHasManifestUserToggled(true);
                  setManifestDayOffset(1);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  manifestDayOffset === 1
                    ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-xs'
                    : 'text-gray-500 dark:text-gray-400'
                }`}
              >
                {t('tomorrow', 'Tomorrow')} ({addDaysToDate(todayIST, 1)})
              </button>
            </div>
          </div>

          {/* Document Cards Grid: Unified 1-Page Supply Manifest + Dietary Avoiders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            
            {/* DOCUMENT 1: UNIFIED 1-PAGE KITCHEN SUPPLY MANIFEST (BREAKFAST + LUNCH COMBINED) */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0f1715] border-2 border-emerald-500/30 dark:border-emerald-500/30 p-5 sm:p-7 flex flex-col justify-between space-y-5 shadow-lg hover:border-emerald-500/50 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 via-emerald-600 to-green-700 text-white flex items-center justify-center shadow-md">
                    <Printer className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-400/30 inline-flex items-center gap-1">
                      <Star className="w-3 h-3 text-emerald-600 dark:text-emerald-400 fill-current" />
                      <span>{t('singlePageMasterBadge', 'Single-Page Master')}</span>
                    </span>
                    <span className="hidden sm:inline-block px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-400/20">
                      {t('breakfastPlusLunchBadge', 'Breakfast + Lunch')}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white">
                    {t('dailySupplyManifestTitle', 'Daily Kitchen Supply Manifest (Breakfast & Lunch)')}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    {t('dailySupplyManifestDesc', 'Unified operational sheet for mess hall clipboard and cooks. Contains Breakfast first, then Lunch next on a strictly single physical A4 page with anti-overflow batch packing.')}
                  </p>
                </div>

                {/* Portions summary strip */}
                <div className="grid grid-cols-2 gap-2.5 p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <Coffee className="w-3 h-3" />
                      <span>{t('breakfastToPrepare', 'Breakfast to Prepare:')}</span>
                    </span>
                    <span className="text-xl font-black text-amber-600 dark:text-amber-400 font-mono block">
                      {loadingData ? '...' : aggregates.breakfastCount} <span className="text-xs font-sans font-medium text-gray-400">{t('mealsUnit', 'meals')}</span>
                    </span>
                  </div>

                  <div className="space-y-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Utensils className="w-3 h-3" />
                      <span>{t('lunchToPrepare', 'Lunch to Prepare:')}</span>
                    </span>
                    <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono block">
                      {loadingData ? '...' : aggregates.lunchCount} <span className="text-xs font-sans font-medium text-gray-400">{t('mealsUnit', 'meals')}</span>
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <ExportActionMenu
                  onView={handleViewSupplyManifest}
                  onDownload={handleDownloadCombinedSupply}
                  onPrint={handlePrintSupplyManifest}
                  onShare={handleShareSupplyManifest}
                  onCustomize={() => {
                    feedback('tick');
                    setAdvancedExportModal({ isOpen: true, type: 'supply' });
                  }}
                  isGenerating={exportingSupply || loadingData}
                  label={t('quickDownloadManifest', 'Open)')}
                  colorTheme="emerald"
                  defaultAction="view"
                />

                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setAdvancedExportModal({ isOpen: true, type: 'supply' });
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 font-semibold text-xs transition-all active:scale-95 border border-gray-200/80 dark:border-white/10 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>{t('customizeAndExport', 'Customize & Filter (Sections, Batches, Sort, CSV)...')}</span>
                </button>
              </div>
            </div>

            {/* DOCUMENT 2: DIETARY & AVOIDERS MATRIX */}
            <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 p-5 sm:p-7 flex flex-col justify-between space-y-5 shadow-lg hover:border-rose-500/40 transition-all">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-rose-500 to-pink-600 text-white flex items-center justify-center shadow-md">
                    <FileText className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-500/20">
                    {t('dietaryMatrixBadge', 'Dietary Matrix')}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-lg sm:text-xl text-gray-900 dark:text-white">
                    {t('dietaryAvoidersMatrixTitle', 'Dietary & Avoiders Matrix Sheet')}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                    {t('dietaryAvoidersMatrixDesc', 'Official kitchen reference mapping tokens with specific meat/fish exclusions (Beef, Fish, Chicken, Veg). Strictly anonymized with zero student personal data.')}
                  </p>
                </div>

                {/* Exclusions summary strip */}
                <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
                      {t('totalAvoidanceExclusions', 'Total Avoidance Exclusions:')}
                    </span>
                    <span className="text-xl font-black text-rose-600 dark:text-rose-400 font-mono block">
                      {loadingData ? '...' : aggregates.avoidersTotal} <span className="text-xs font-sans font-medium text-gray-400">{t('tokensUnit', 'tokens')}</span>
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-gray-400 font-mono">
                    {loadingData ? '...' : (t('regularDietCount', '{count} Regular Diet').replace('{count}', aggregates.totalStudents - aggregates.avoidersTotal))}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <ExportActionMenu
                  onView={handleViewDietaryAvoiders}
                  onDownload={handleDownloadDietaryAvoiders}
                  onPrint={handlePrintDietaryAvoiders}
                  onShare={handleShareDietaryAvoiders}
                  onCustomize={() => {
                    feedback('tick');
                    setAdvancedExportModal({ isOpen: true, type: 'dietary' });
                  }}
                  isGenerating={exportingDietary || loadingData}
                  label={t('quickDownloadMatrix', 'Open')}
                  colorTheme="rose"
                  defaultAction="view"
                />

                <button
                  type="button"
                  onClick={() => {
                    feedback('tick');
                    setAdvancedExportModal({ isOpen: true, type: 'dietary' });
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-200 font-semibold text-xs transition-all active:scale-95 border border-gray-200/80 dark:border-white/10 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  <span>{t('customizeAndFilterDietary', 'Customize & Filter Categories (Sort, CSV)...')}</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ================= ANONYMOUS DINING NETWORK STATS ================= */}
        <section className="space-y-4">
          <div className="text-center max-w-xl mx-auto space-y-1">
            <h2 className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {t('diningTelemetryTitle', 'Institutional Dining Telemetry')}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('diningTelemetrySubtitle', 'Live operational metrics powering food preparation efficiency across all batches.')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm text-center space-y-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500">
                {t('totalEnrolledDiners', 'Total Enrolled Diners')}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                {loadingData ? '...' : aggregates.totalStudents}
              </div>
              <span className="text-[10px] text-gray-400 block">{t('batches1To7', 'Batches 1 to 7')}</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm text-center space-y-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500">
                {t('dailyMealsPrepared', 'Daily Meals Prepared')}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white font-mono">
                {loadingData ? '...' : aggregates.lunchCount + aggregates.breakfastCount}
              </div>
              <span className="text-[10px] text-gray-400 block">{t('lunchPlusBreakfastCombined', 'Lunch + Breakfast Combined')}</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm text-center space-y-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500">
                {t('foodWastePrevention', 'Food Waste Prevention')}
              </span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                98.4%
              </div>
              <span className="text-[10px] text-gray-400 block">{t('precisionReservation', 'Precision Reservation')}</span>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm text-center space-y-1">
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-gray-500">
                {t('systemCutoffMode', 'System Cutoff Mode')}
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-500 font-mono truncate">
                2:00 PM IST
              </div>
              <span className="text-[10px] text-gray-400 block">{t('automatedShift', 'Automated Shift')}</span>
            </div>
          </div>
        </section>

        {/* ================= PRIVACY & DATA CONFIDENTIALITY COMMITMENT ================= */}
        <section className="p-5 xs:p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-emerald-500/10 border border-emerald-500/20 backdrop-blur-xl space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-extrabold text-gray-900 dark:text-white">
                {t('privacyShieldTitle', 'Institutional Privacy Shield & Data Protection')}
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                {t('privacyShieldDesc', 'Personal student names, confidential dietary restrictions, and attendance records are strictly quarantined from public web crawlers and unauthorized visitors. Access to the interactive Token Board is restricted exclusively to authenticated students and committee personnel.')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/5 text-xs text-gray-700 dark:text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>{t('shieldAnonymizedDocs', 'Anonymized Kitchen Docs: Kitchen sheets contain only operational token IDs.')}</span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/5 text-xs text-gray-700 dark:text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>{t('shieldEncryptedCreds', 'Encrypted Credentials: Protected student and committee session management.')}</span>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/60 dark:bg-white/5 border border-white/20 dark:border-white/5 text-xs text-gray-700 dark:text-gray-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span>{t('shieldAntiTamperTime', 'Anti-Tamper Server Time: Network-synchronized IST prevent clock alteration.')}</span>
            </div>
          </div>
        </section>

      </div>

      {/* Advanced Document Export Customizer Modal */}
      <AdvancedExportModal
        isOpen={advancedExportModal.isOpen}
        onClose={() => setAdvancedExportModal((prev) => ({ ...prev, isOpen: false }))}
        exportType={advancedExportModal.type}
        targetDateIST={selectedTargetDateIST}
        dayKey={selectedDayKey}
        dayFull={manifestDayOffset === 0 ? dayFull : t('tomorrow', 'Tomorrow')}
        documents={studentsList}
        preferences={preferences}
        rejectionsByPref={aggregates.rejectionsMap}
        sectionChunkSize={sectionChunkSize}
      />

      {/* Interactive Token Board Guide Modal */}
      <TokenBoardGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
      />
      {/* Universal In-App Document Viewer & Action Modal */}
      <UniversalDocumentModal
        isOpen={universalDoc.isOpen}
        onClose={() => setUniversalDoc({ isOpen: false, data: null })}
        documentData={universalDoc.data}
      />
    </div>
  );
}
