import React, { useState, useEffect, useMemo, useContext, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  ArrowLeft,
  Grid,
  Camera,
  Mic,
  FileText,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  RotateCcw,
  RefreshCw,
  Flame,
  Users,
} from 'lucide-react';
import firebase from '../../firebase/config';
import { AuthContext } from '../../store/AuthContext';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { useDateController } from '../../utils/useDateController';
import { useTokenLockStatus } from '../../utils/useTokenLockStatus';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import useSEO from '../../hooks/useSEO';
import {
  subscribeToMealSupplyLedger,
  markTokenServed,
  unmarkTokenServed,
  issueGracePlate,
  logUnauthorizedAttempt,
  computeServingMetrics,
} from '../../utils/mealSupplyService';
import {
  subscribeToBoardServiceSchedule,
  getMealSupplyStatus,
} from '../../utils/boardServiceSchedule';
import TactileNumpadHUD from './TactileNumpadHUD';
import SupplyMatrixBoard from './SupplyMatrixBoard';
import OpticalTokenScanner from './OpticalTokenScanner';
import VoiceSupplyAssistant from './VoiceSupplyAssistant';
import GracePlateModal from './GracePlateModal';
import DisputeDetailDrawer from './DisputeDetailDrawer';
import ServingReconciliationModal from './ServingReconciliationModal';

export default function FoodSupplyController() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, role, userRole } = useContext(AuthContext);
  const currentRole = role || userRole;
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();

  // Active Meal Selection: 'lunch' | 'breakfast'
  const initialMeal = useMemo(() => {
    const q = searchParams.get('meal');
    if (q === 'lunch' || q === 'breakfast') return q;
    return 'lunch';
  }, [searchParams]);

  const [activeMeal, setActiveMeal] = useState(initialMeal);

  // Controller Operating Modes: 'numpad' | 'matrix' | 'scanner' | 'voice'
  const [activeMode, setActiveMode] = useState('numpad');

  // Device & Display Controls
  const [wakeLockActive, setWakeLockActive] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(() => soundEngine.isEnabled());
  const [hapticEnabled, setHapticEnabled] = useState(() => hapticEngine.isEnabled());
  const [highContrast, setHighContrast] = useState(false);

  // Modals & Drawers
  const [graceModalState, setGraceModalState] = useState({ isOpen: false, tokenNo: null, student: null });
  const [disputeDrawerState, setDisputeDrawerState] = useState({ isOpen: false, student: null });
  const [isReconciliationOpen, setIsReconciliationOpen] = useState(false);

  // Real-time Data States
  const [documents, setDocuments] = useState([]);
  const [servedMap, setServedMap] = useState(new Map());
  const [ledgerSummary, setLedgerSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  // Date Controller
  const { rawBoardSwitchTime } = useTokenLockStatus();
  const dateController = useDateController({
    initialCustomDate: searchParams.get('date') || '',
    initialDateMode: searchParams.get('date') ? 'custom' : 'auto',
    autoEveningShift: true,
    boardSwitchTime: rawBoardSwitchTime || '14:00',
  });

  const { targetDateIST, effectiveDay, isToday, isTomorrow, dayShort } = dateController;

  useSEO({
    title: `Live ${activeMeal === 'lunch' ? 'Lunch' : 'Breakfast'} Food Supply Controller • ADSA Sentinel`,
    description: `Official real-time food distribution and token verification console for Alathurpadi Dars canteen staff and suppliers.`,
  });

  // Keep mobile screen awake during meal serving
  useEffect(() => {
    let sentinel = null;
    if (wakeLockActive && typeof window !== 'undefined' && 'wakeLock' in navigator) {
      navigator.wakeLock
        .request('screen')
        .then((s) => {
          sentinel = s;
        })
        .catch(() => {});
    }
    return () => {
      if (sentinel) sentinel.release().catch(() => {});
    };
  }, [wakeLockActive]);

  // Reactive Firestore student list subscription
  useEffect(() => {
    setLoading(true);
    const unsub = firebase
      .firestore()
      .collection('students')
      .onSnapshot(
        (snap) => {
          const docs = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          docs.sort((a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0));
          setDocuments(docs);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching students for supply controller:', err);
          setLoading(false);
        }
      );
    return () => unsub();
  }, []);

  // Reactive Multi-Counter Serving Ledger Subscription
  useEffect(() => {
    if (!activeMeal || !targetDateIST) return;

    const unsub = subscribeToMealSupplyLedger(activeMeal, targetDateIST, ({ summary, servedMap: map }) => {
      setLedgerSummary(summary);
      setServedMap(new Map(map));
    });

    return () => unsub();
  }, [activeMeal, targetDateIST]);

  const [boardServiceSchedule, setBoardServiceSchedule] = useState({});

  useEffect(() => {
    const unsub = subscribeToBoardServiceSchedule((schedule) => {
      setBoardServiceSchedule(schedule || {});
    });
    return () => unsub();
  }, []);

  const mealSupplyStatus = useMemo(() => {
    return getMealSupplyStatus(boardServiceSchedule, targetDateIST, activeMeal);
  }, [boardServiceSchedule, targetDateIST, activeMeal]);

  const isSupplyActive = mealSupplyStatus.isSupplying !== false;

  // Telemetry Metrics
  const metrics = useMemo(() => {
    const raw = computeServingMetrics({
      documents,
      servedMap,
      meal: activeMeal,
      targetDateIST,
      effectiveDay,
    });

    if (!isSupplyActive) {
      return {
        ...raw,
        totalEligible: 0,
        remainingEligibleCount: 0,
        completionPercentage: 0,
        isSupplySuspended: true,
        supplyNotice: mealSupplyStatus,
      };
    }

    return raw;
  }, [documents, servedMap, activeMeal, targetDateIST, effectiveDay, isSupplyActive, mealSupplyStatus]);

  // Handlers
  const handleMealSwitch = (newMeal) => {
    feedback('pop');
    setActiveMeal(newMeal);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set('meal', newMeal);
        return next;
      },
      { replace: true }
    );
  };

  const handleServeToken = async (tokenNo, student, method = 'numpad') => {
    await markTokenServed({
      meal: activeMeal,
      targetDateIST,
      tokenNo,
      student,
      serverUser: user,
      serverRole: currentRole,
      counterId: 'Counter 1',
      method,
    });
  };

  const handleUnserveToken = async (tokenNo, student) => {
    await unmarkTokenServed({
      meal: activeMeal,
      targetDateIST,
      tokenNo,
      student,
      serverUser: user,
      serverRole: currentRole,
    });
  };

  const handleLogInterception = (tokenNo, student) => {
    logUnauthorizedAttempt({
      meal: activeMeal,
      targetDateIST,
      tokenNo,
      student,
      serverUser: user,
      serverRole: currentRole,
      counterId: 'Counter 1',
    });
  };

  const handleToggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.setEnabled(next);
  };

  const handleToggleHaptic = () => {
    const next = !hapticEnabled;
    setHapticEnabled(next);
    hapticEngine.setEnabled(next);
  };

  return (
    <div
      className={`min-h-screen w-full flex flex-col transition-colors duration-300 ${
        highContrast
          ? 'bg-black text-white'
          : 'bg-[#f4f7f5] dark:bg-[#070d0a] text-gray-900 dark:text-gray-100'
      }`}
    >
      {/* TOP NAVIGATION & CONTROLLER HEADER */}
      <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/80 dark:bg-[#09120e]/85 border-b border-gray-200 dark:border-emerald-900/40 px-4 sm:px-6 py-3 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* LEFT: TITLE & BACK BUTTON */}
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/supply')}
              className="p-2 rounded-2xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
              title="Return to Supply Sections"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-black text-gray-900 dark:text-white flex items-center space-x-2">
                  <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                    Food Supply Sentinel
                  </span>
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700/50">
                  LIVE SYNC
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Alathurpadi Dars • Real-Time Canteen Distribution Controller
              </p>
            </div>
          </div>

          {/* CENTER: MEAL SWITCHER */}
          <div className="flex items-center space-x-1.5 p-1 rounded-2xl bg-gray-100 dark:bg-[#050807] border border-gray-200 dark:border-emerald-900/40">
            <button
              onClick={() => handleMealSwitch('breakfast')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeMeal === 'breakfast'
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Coffee className="w-4 h-4" />
              <span>Breakfast</span>
            </button>
            <button
              onClick={() => handleMealSwitch('lunch')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 cursor-pointer ${
                activeMeal === 'lunch'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
              }`}
            >
              <Utensils className="w-4 h-4" />
              <span>Lunch</span>
            </button>
          </div>

          {/* RIGHT: DEVICE HARDWARE TOGGLES & RECONCILE */}
          <div className="flex items-center space-x-2">
            {/* Screen WakeLock */}
            <button
              onClick={() => setWakeLockActive((prev) => !prev)}
              className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                wakeLockActive
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 border-gray-300'
              }`}
              title={wakeLockActive ? 'Screen Keep-Awake ON' : 'Screen Keep-Awake OFF'}
            >
              <Smartphone className="w-4 h-4" />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={handleToggleSound}
              className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                soundEnabled
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-400'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-800 border-gray-300'
              }`}
              title={soundEnabled ? 'Audio Synthesizer ON' : 'Audio Muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* High Contrast Sunlight Mode */}
            <button
              onClick={() => setHighContrast((prev) => !prev)}
              className={`p-2 rounded-xl text-xs font-bold border transition-colors ${
                highContrast
                  ? 'bg-amber-400 text-black border-amber-500 font-black'
                  : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300 border-gray-300'
              }`}
              title="Toggle Sunlight High-Contrast Mode"
            >
              <Sun className="w-4 h-4" />
            </button>

            {/* End of Service Reconcile Button */}
            <button
              onClick={() => {
                feedback('tick');
                setIsReconciliationOpen(true);
              }}
              className="py-2 px-3.5 rounded-xl bg-gray-900 hover:bg-black dark:bg-gray-800 dark:hover:bg-gray-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reconcile Report</span>
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Food Supply Suspended Alert Banner */}
        {!isSupplyActive && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-rose-500/15 via-red-500/10 to-amber-500/10 border-2 border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-800 dark:text-rose-200"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-extrabold text-sm sm:text-base">
                    {lang === 'ml'
                      ? 'കാന്റീൻ ഭക്ഷണ വിതരണം നിർത്തിവെച്ചിരിക്കുന്നു'
                      : 'Canteen Food Supply Suspended'}
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/40">
                    {lang === 'ml' ? 'വിതരണം ഇല്ല' : '0 Diners'}
                  </span>
                </div>
                <p className="text-xs text-rose-700/80 dark:text-rose-300/80 mt-0.5 font-medium">
                  {lang === 'ml'
                    ? (mealSupplyStatus.noteMl || mealSupplyStatus.reasonObj?.labelMl || 'ഈ ഷിഫ്റ്റിൽ കൗണ്ടറുകളിൽ ഭക്ഷണ വിതരണം ഉണ്ടായിരിക്കുന്നതല്ല.')
                    : (mealSupplyStatus.noteEn || mealSupplyStatus.reasonObj?.labelEn || 'No food serving operations for this meal at counters.')}
                </p>
              </div>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-mono font-bold text-rose-600 dark:text-rose-400">
              0 {lang === 'ml' ? 'വിഹിതം' : 'Plates'}
            </div>
          </motion.div>
        )}

        {/* LIVE TELEMETRY KPI DOCK */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1411] border border-gray-200 dark:border-emerald-900/30 shadow-sm text-center">
            <div className="text-2xl sm:text-3xl font-black font-mono text-emerald-600 dark:text-emerald-400">
              {metrics.totalEligible}
            </div>
            <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
              Eligible Diners
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1411] border border-gray-200 dark:border-emerald-900/30 shadow-sm text-center">
            <div className="text-2xl sm:text-3xl font-black font-mono text-purple-600 dark:text-purple-400">
              {metrics.eligibleServedCount}
            </div>
            <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
              Served ({metrics.completionPercentage}%)
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1411] border border-gray-200 dark:border-emerald-900/30 shadow-sm text-center">
            <div className="text-2xl sm:text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
              {metrics.remainingEligibleCount}
            </div>
            <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
              Remaining Unserved
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1411] border border-gray-200 dark:border-emerald-900/30 shadow-sm text-center">
            <div className="text-2xl sm:text-3xl font-black font-mono text-rose-500">
              {metrics.gracePlatesCount}
            </div>
            <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
              Grace Plates
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1411] border border-gray-200 dark:border-emerald-900/30 shadow-sm text-center col-span-2 sm:col-span-1">
            <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-600 dark:text-cyan-400">
              {metrics.remainingDietaryCounts.fishAvoiders + metrics.remainingDietaryCounts.beefAvoiders}
            </div>
            <div className="text-[11px] text-gray-500 font-semibold uppercase tracking-wider">
              Dietary Special Left
            </div>
          </div>
        </div>

        {/* PROGRESS BAR */}
        <div className="w-full h-2 rounded-full bg-gray-200 dark:bg-gray-800 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${metrics.completionPercentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 shadow-sm"
          />
        </div>

        {/* CONTROLLER OPERATING MODE TABS */}
        <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-emerald-900/30 pb-2">
          {[
            { id: 'numpad', label: 'Tactile Keypad', icon: Smartphone },
            { id: 'matrix', label: 'Token Matrix', icon: Grid },
            { id: 'scanner', label: 'Optical / Laser Scanner', icon: Camera },
            { id: 'voice', label: 'Voice Assistant', icon: Mic },
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = activeMode === mode.id;
            return (
              <button
                key={mode.id}
                onClick={() => {
                  feedback('pop');
                  setActiveMode(mode.id);
                }}
                className={`flex-1 sm:flex-none py-2.5 px-4 rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-white dark:bg-[#0c1411] border border-gray-200 dark:border-emerald-900/30 text-gray-600 dark:text-gray-300 hover:border-emerald-400'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* ACTIVE MODE VIEWPORT */}
        <div className="w-full">
          {activeMode === 'numpad' && (
            <TactileNumpadHUD
              documents={documents}
              servedMap={servedMap}
              meal={activeMeal}
              targetDateIST={targetDateIST}
              effectiveDay={effectiveDay}
              onServe={handleServeToken}
              onUnserve={handleUnserveToken}
              onOpenGraceModal={(tokenNo, student) =>
                setGraceModalState({ isOpen: true, tokenNo, student })
              }
              onLogInterception={handleLogInterception}
              onInspectDispute={(student) =>
                setDisputeDrawerState({ isOpen: true, student })
              }
              soundEnabled={soundEnabled}
              hapticEnabled={hapticEnabled}
              highContrast={highContrast}
            />
          )}

          {activeMode === 'matrix' && (
            <SupplyMatrixBoard
              documents={documents}
              servedMap={servedMap}
              meal={activeMeal}
              targetDateIST={targetDateIST}
              effectiveDay={effectiveDay}
              onServe={handleServeToken}
              onUnserve={handleUnserveToken}
              onOpenGraceModal={(tokenNo, student) =>
                setGraceModalState({ isOpen: true, tokenNo, student })
              }
              onInspectDispute={(student) =>
                setDisputeDrawerState({ isOpen: true, student })
              }
              soundEnabled={soundEnabled}
              hapticEnabled={hapticEnabled}
              highContrast={highContrast}
            />
          )}

          {activeMode === 'scanner' && (
            <div className="space-y-6">
              <OpticalTokenScanner
                onScanToken={(tokenNo) => {
                  const student = documents.find((d) => Number(d.tokenNo) === Number(tokenNo));
                  if (student) {
                    handleServeToken(tokenNo, student, 'scanner');
                  }
                }}
                isActive={activeMode === 'scanner'}
                soundEnabled={soundEnabled}
                hapticEnabled={hapticEnabled}
              />
            </div>
          )}

          {activeMode === 'voice' && (
            <VoiceSupplyAssistant
              documents={documents}
              servedMap={servedMap}
              meal={activeMeal}
              targetDateIST={targetDateIST}
              effectiveDay={effectiveDay}
              onServe={handleServeToken}
              isActive={activeMode === 'voice'}
              soundEnabled={soundEnabled}
              hapticEnabled={hapticEnabled}
            />
          )}
        </div>
      </main>

      {/* MODALS & DRAWERS */}
      <GracePlateModal
        isOpen={graceModalState.isOpen}
        onClose={() => setGraceModalState({ isOpen: false, tokenNo: null, student: null })}
        tokenNo={graceModalState.tokenNo}
        student={graceModalState.student}
        meal={activeMeal}
        targetDateIST={targetDateIST}
        serverUser={user}
        serverRole={currentRole}
      />

      <DisputeDetailDrawer
        isOpen={disputeDrawerState.isOpen}
        onClose={() => setDisputeDrawerState({ isOpen: false, student: null })}
        student={disputeDrawerState.student}
        meal={activeMeal}
        targetDateIST={targetDateIST}
        effectiveDay={effectiveDay}
        onOpenGraceModal={(tokenNo, student) =>
          setGraceModalState({ isOpen: true, tokenNo, student })
        }
      />

      <ServingReconciliationModal
        isOpen={isReconciliationOpen}
        onClose={() => setIsReconciliationOpen(false)}
        meal={activeMeal}
        targetDateIST={targetDateIST}
        metrics={metrics}
        documents={documents}
        servedMap={servedMap}
      />
    </div>
  );
}
