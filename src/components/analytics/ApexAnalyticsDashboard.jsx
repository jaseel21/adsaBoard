import React, { useState, useEffect, useMemo, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Activity,
  ShieldCheck,
  Sparkles,
  Maximize2,
  Minimize2,
  Calendar,
  Layers,
  Clock,
  RotateCcw,
  AlertCircle,
  HelpCircle,
  UtensilsCrossed,
} from 'lucide-react';
import firebase from '../../firebase/config';
import { AuthContext } from '../../store/AuthContext';
import { useLanguage } from '../../store/LanguageContext';
import { useWorldTime } from '../../utils/time';
import { getTodayISTDate, addDaysToDate } from '../../utils/studentExceptionService';
import { subscribeToPreferences } from '../../utils/preferenceService';
import { computeDashboardTelemetry } from '../../utils/analyticsEngine';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';

// Subcomponents
import TimeMachineRibbon from './controls/TimeMachineRibbon';
import AnalyticsTelemetryHud from './telemetry/AnalyticsTelemetryHud';
import SplineAttendanceWave from './charts/SplineAttendanceWave';
import DietaryDistributionRing from './charts/DietaryDistributionRing';
import BatchPerformanceHeatmap from './charts/BatchPerformanceHeatmap';
import DecisionTimingHistogram from './charts/DecisionTimingHistogram';
import KitchenRationCalculator from './kitchen/KitchenRationCalculator';
import StudentCohortInsights from './cohorts/StudentCohortInsights';
import AnalyticsExportMenu from './export/AnalyticsExportMenu';

export default function ApexAnalyticsDashboard() {
  const { user, role } = useContext(AuthContext);
  const { t } = useLanguage();

  // Real-time Verified IST Clock
  const { timeHms, todayIST: worldTodayIST } = useWorldTime('Asia/Kolkata');
  const todayIST = useMemo(() => worldTodayIST || getTodayISTDate(), [worldTodayIST]);

  // Firestore Data State
  const [students, setStudents] = useState([]);
  const [preferencesList, setPreferencesList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Controls State
  const [timeSpan, setTimeSpan] = useState('today'); // 'today' | 'tomorrow' | '7d' | '30d' | 'custom'
  const [meal, setMeal] = useState('lunch');         // 'breakfast' | 'lunch' | 'both'
  const [batchFilter, setBatchFilter] = useState('all');
  const [isKiosk, setIsKiosk] = useState(false);

  // Derive target date based on timeSpan
  const targetDateIST = useMemo(() => {
    if (timeSpan === 'tomorrow') {
      return addDaysToDate(todayIST, 1);
    }
    return todayIST;
  }, [timeSpan, todayIST]);

  // Real-time Subscriptions
  useEffect(() => {
    setLoading(true);
    const unsubPrefs = subscribeToPreferences((list) => {
      setPreferencesList(list.filter((p) => p.isActive));
    });

    const unsubStudents = firebase
      .firestore()
      .collection('students')
      .onSnapshot(
        (snap) => {
          const docs = snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }));
          docs.sort((a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0));
          setStudents(docs);
          setLoading(false);
        },
        (err) => {
          console.error('Error in Analytics real-time listener:', err);
          setLoading(false);
        }
      );

    return () => {
      unsubPrefs();
      unsubStudents();
    };
  }, []);

  // Compute dynamic batches list
  const allBatches = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.batch) set.add(s.batch);
    });
    return Array.from(set).map((name) => ({ name }));
  }, [students]);

  // Memoized Statistical Telemetry Calculation
  const analyticsData = useMemo(() => {
    return computeDashboardTelemetry({
      students,
      preferencesList,
      targetDateIST,
      effectiveDay: 'today',
      meal,
      batchFilter,
      timeSpan,
    });
  }, [students, preferencesList, targetDateIST, meal, batchFilter, timeSpan]);

  const toggleKiosk = () => {
    soundEngine.playMechanicalClick();
    hapticEngine.lightTap();
    setIsKiosk(!isKiosk);
  };

  if (loading && students.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh] p-6">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
            Synthesizing operational telemetry...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 transition-all duration-300 ${
      isKiosk ? 'fixed inset-0 z-50 bg-[#f8faf8] dark:bg-[#080d0b] overflow-y-auto p-6 max-w-none' : ''
    }`}>
      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-sm">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                  Apex Intelligence Command
                </h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/25">
                  v2.4
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
                Real-time dining telemetry, preparation ratios, student welfare & kitchen economics
              </p>
            </div>
          </div>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-3">
          <AnalyticsExportMenu
            telemetry={analyticsData.telemetry}
            dietary={analyticsData.dietary}
            batchBenchmarks={analyticsData.batchBenchmarks}
            wasteEconomics={analyticsData.wasteEconomics}
            kitchenRations={analyticsData.kitchenRations}
            meta={analyticsData.meta}
          />

          <button
            onClick={toggleKiosk}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/15 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 transition-colors shadow-sm"
            title={isKiosk ? 'Exit Fullscreen' : 'Boardroom Fullscreen Presentation'}
          >
            {isKiosk ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Time-Machine Horizon Ribbon */}
      <TimeMachineRibbon
        timeSpan={timeSpan}
        setTimeSpan={setTimeSpan}
        meal={meal}
        setMeal={setMeal}
        batchFilter={batchFilter}
        setBatchFilter={setBatchFilter}
        allBatches={allBatches}
        targetDateIST={targetDateIST}
        onResetToToday={() => setTimeSpan('today')}
        isLive={timeSpan === 'today'}
        serverTimeHms={timeHms}
      />

      {/* Primary Telemetry Velocity HUD */}
      <AnalyticsTelemetryHud
        telemetry={analyticsData.telemetry}
        dietary={analyticsData.dietary}
        wasteEconomics={analyticsData.wasteEconomics}
        kitchenRations={analyticsData.kitchenRations}
      />

      {/* Charts Grid: Spline Trendline Waves & Dietary Donut Ring */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <SplineAttendanceWave
            points={analyticsData.trendWaves}
            meal={meal}
          />
        </div>
        <div>
          <DietaryDistributionRing
            dietary={analyticsData.dietary}
            telemetry={analyticsData.telemetry}
          />
        </div>
      </div>

      {/* Charts Grid: Batch Performance & Decision Timing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <BatchPerformanceHeatmap
          batchBenchmarks={analyticsData.batchBenchmarks}
          onSelectBatch={(batchName) => setBatchFilter(batchName)}
        />
        <DecisionTimingHistogram
          hours={analyticsData.decisionTiming}
        />
      </div>

      {/* Kitchen Ration Preparation Projections */}
      <KitchenRationCalculator
        kitchenRations={analyticsData.kitchenRations}
        telemetry={analyticsData.telemetry}
        meta={analyticsData.meta}
      />

      {/* Student Cohort Insights & Welfare Radar */}
      <StudentCohortInsights
        cohortInsights={analyticsData.cohortInsights}
      />
    </div>
  );
}
