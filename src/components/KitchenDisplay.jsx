import React, { useState, useEffect, useMemo, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChefHat,
  Utensils,
  Coffee,
  Printer,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Users,
  Search,
  Filter,
  RefreshCw,
  Home,
  LogOut,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Flame,
} from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import firebase from '../firebase/config';
import { AuthContext } from '../store/AuthContext';
import { useWorldTime } from '../utils/time';
import { useFeedback } from '../utils/useFeedback';
import { useLanguage } from '../store/LanguageContext';
import { dialog } from '../utils/dialog';
import {
  addDaysToDate,
  getEffectiveStudentMealStatus,
} from '../utils/studentExceptionService';
import { subscribeToPreferences } from '../utils/preferenceService';

export default function KitchenDisplay() {
  const navigate = useNavigate();
  const { user, staffProfile, roleBadge, logoutAdmin } = useContext(AuthContext);
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const [activeMeal, setActiveMeal] = useState('lunch'); // 'lunch' | 'breakfast'
  const [students, setStudents] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBatch, setSelectedBatch] = useState('ALL');
  const [dietFilter, setDietFilter] = useState('ALL'); // 'ALL' | 'SPECIAL_ONLY'

  const { timeHms, dayShort, todayIST } = useWorldTime('Asia/Kolkata');

  // Post 2:00 PM cutoff, kitchen cooks prepare for the next day!
  const isPostCutoff = Boolean(timeHms && timeHms >= '14:00:00');
  const targetDateIST = useMemo(() => {
    return isPostCutoff ? addDaysToDate(todayIST, 1) : todayIST;
  }, [isPostCutoff, todayIST]);

  const targetDayKey = useMemo(() => {
    if (!dayShort) return 'su';
    const days = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    const currentIndex = days.indexOf(dayShort.toLowerCase().slice(0, 2));
    if (isPostCutoff) {
      return days[(currentIndex + 1) % 7];
    }
    return days[currentIndex >= 0 ? currentIndex : 0];
  }, [dayShort, isPostCutoff]);

  // Load preferences
  useEffect(() => {
    const unsub = subscribeToPreferences((list) => {
      setPreferences(list.filter((p) => p.isActive));
    });
    return () => unsub();
  }, []);

  // Real-time student subscription
  useEffect(() => {
    setLoading(true);
    const unsub = firebase
      .firestore()
      .collection('students')
      .onSnapshot(
        (snapshot) => {
          const docs = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          docs.sort((a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0));
          setStudents(docs);
          setLoading(false);
        },
        (err) => {
          console.error('KitchenDisplay listener error:', err);
          setLoading(false);
        }
      );

    return () => unsub();
  }, []);

  // Compute live meal metrics
  const mealMetrics = useMemo(() => {
    let totalEligible = 0;
    let totalTakingMeal = 0;
    let totalOptedOut = 0;
    let specialDietCount = 0;

    const dietaryCounts = {
      beefAvoiders: 0,
      fishAvoiders: 0,
      chickenAvoiders: 0,
      muttonAvoiders: 0,
      customAvoiders: 0,
    };

    const takingStudents = [];
    const specialCareList = [];

    students.forEach((student) => {
      if (student.block) return; // Blocked tokens not counted
      totalEligible++;

      const isTaking = getEffectiveStudentMealStatus(
        student,
        activeMeal,
        targetDayKey,
        targetDateIST
      );

      if (isTaking) {
        totalTakingMeal++;
        takingStudents.push(student);

        // Check dietary avoidances
        const obj2 = student.obj2 || {};
        const hasBeefAvoid = obj2.beef === false;
        const hasFishAvoid = obj2.fish === false;
        const hasChickenAvoid = obj2.chicken === false;
        const hasMuttonAvoid = obj2.mutton === false;

        const customAvoids = preferences
          .filter((p) => obj2[p.id] === false)
          .map((p) => p.nameEn || p.id);

        if (hasBeefAvoid) dietaryCounts.beefAvoiders++;
        if (hasFishAvoid) dietaryCounts.fishAvoiders++;
        if (hasChickenAvoid) dietaryCounts.chickenAvoiders++;
        if (hasMuttonAvoid) dietaryCounts.muttonAvoiders++;
        if (customAvoids.length > 0) dietaryCounts.customAvoiders++;

        const isSpecial = hasBeefAvoid || hasFishAvoid || hasChickenAvoid || hasMuttonAvoid || customAvoids.length > 0;
        if (isSpecial) {
          specialDietCount++;
          specialCareList.push({
            student,
            hasBeefAvoid,
            hasFishAvoid,
            hasChickenAvoid,
            hasMuttonAvoid,
            customAvoids,
          });
        }
      } else {
        totalOptedOut++;
      }
    });

    return {
      totalEligible,
      totalTakingMeal,
      totalOptedOut,
      specialDietCount,
      regularCount: totalTakingMeal - specialDietCount,
      dietaryCounts,
      takingStudents,
      specialCareList,
    };
  }, [students, activeMeal, targetDayKey, targetDateIST, preferences]);

  // Unique batches
  const allBatches = useMemo(() => {
    const set = new Set();
    students.forEach((s) => {
      if (s.batch && s.batch.trim()) set.add(s.batch.trim());
    });
    return Array.from(set).sort();
  }, [students]);

  // Filtered Special Care list
  const filteredSpecialCare = useMemo(() => {
    return mealMetrics.specialCareList.filter((item) => {
      const s = item.student;
      const matchesSearch =
        !searchQuery ||
        String(s.tokenNo).includes(searchQuery) ||
        (s.nameEn && s.nameEn.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (s.roomNo && s.roomNo.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesBatch = selectedBatch === 'ALL' || s.batch === selectedBatch;
      return matchesSearch && matchesBatch;
    });
  }, [mealMetrics.specialCareList, searchQuery, selectedBatch]);

  // One-click Kitchen Dispatch PDF Print
  const handlePrintKitchenSheet = () => {
    feedback('tick');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('ADSA CANTEEN - KITCHEN PREPARATION DISPATCH', 14, 15);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Service: ${activeMeal.toUpperCase()} | Target Date: ${targetDateIST} (${targetDayKey.toUpperCase()})`, 14, 22);
    doc.text(`Generated At: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`, 14, 27);

    // Summary Box
    doc.autoTable({
      startY: 32,
      theme: 'grid',
      head: [['Metric', 'Headcount Portions', 'Kitchen Notes']],
      body: [
        ['TOTAL SERVICE HEADCOUNT', String(mealMetrics.totalTakingMeal), 'Primary food prep count'],
        ['Standard Regular Portions', String(mealMetrics.regularCount), 'General preparation'],
        ['Special Dietary Portions', String(mealMetrics.specialDietCount), 'Separate packing / plating required'],
        ['Beef Avoiders (Alternative)', String(mealMetrics.dietaryCounts.beefAvoiders), 'Prepare chicken/fish or veg substitute'],
        ['Fish Avoiders (Alternative)', String(mealMetrics.dietaryCounts.fishAvoiders), 'Prepare beef/chicken or veg substitute'],
        ['Tokens Opted Out', String(mealMetrics.totalOptedOut), 'Meals cancelled'],
      ],
      headStyles: { fillColor: [16, 185, 129] },
    });

    // Special Care Orders Table
    if (mealMetrics.specialCareList.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text('SPECIAL CARE & ALLERGY ROSTER (BY ROOM)', 14, doc.lastAutoTable.finalY + 10);

      const careRows = mealMetrics.specialCareList.map((item) => {
        const s = item.student;
        const restrictions = [];
        if (item.hasBeefAvoid) restrictions.push('NO BEEF');
        if (item.hasFishAvoid) restrictions.push('NO FISH');
        if (item.hasChickenAvoid) restrictions.push('NO CHICKEN');
        if (item.hasMuttonAvoid) restrictions.push('NO MUTTON');
        if (item.customAvoids.length > 0) restrictions.push(`NO ${item.customAvoids.join(', ')}`);

        return [
          `#${s.tokenNo}`,
          s.nameEn || s.name || 'Student',
          s.roomNo || 'N/A',
          s.batch || 'General',
          restrictions.join(' • ') || 'Custom Diet',
        ];
      });

      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 14,
        theme: 'striped',
        head: [['Token', 'Student Name', 'Room No', 'Batch', 'Dietary Exemption']],
        body: careRows,
        headStyles: { fillColor: [245, 158, 11] },
      });
    }

    doc.save(`ADSA_Kitchen_Prep_${activeMeal}_${targetDateIST}.pdf`);
    dialog.toast.success('Print Sheet Ready', `Generated PDF dispatch report for ${activeMeal}.`);
  };

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto p-3 xs:p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
      {/* Top Banner: Shift & KDS Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-emerald-900 to-green-950 text-white shadow-xl border border-emerald-800/40">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-inner">
            <ChefHat className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {t('kitchenDisplaySystem', 'Kitchen Display System (KDS)')}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 border border-emerald-400/40 text-emerald-200">
                {t('live', 'Live')}
              </span>
            </div>
            <p className="text-xs text-emerald-200/80">
              {t('kdsSubtitle', 'Real-time meal preparation headcounts & dietary care roster')}
            </p>
          </div>
        </div>

        {/* Meal Selector & Print CTA */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center p-1 rounded-xl bg-black/40 border border-white/10">
            <button
              onClick={() => {
                feedback('tick');
                setActiveMeal('lunch');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMeal === 'lunch'
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>{t('lunchShift', 'Lunch Shift')}</span>
            </button>
            <button
              onClick={() => {
                feedback('tick');
                setActiveMeal('breakfast');
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeMeal === 'breakfast'
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>{t('breakfastShift', 'Breakfast Shift')}</span>
            </button>
          </div>

          <button
            onClick={handlePrintKitchenSheet}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white text-emerald-950 hover:bg-emerald-50 font-bold text-xs shadow-md transition-all active:scale-95"
            title="Download formatted kitchen dispatch PDF"
          >
            <Printer className="w-4 h-4 text-emerald-700" />
            <span className="hidden sm:inline">{t('printDispatchSheet', 'Print Dispatch Sheet')}</span>
          </button>
        </div>
      </div>

      {/* Target Shift Banner (Today vs Tomorrow) */}
      <div className="flex items-center justify-between text-xs px-2 text-gray-500 dark:text-gray-400">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span>
            {t('preparingFor', 'Preparing for:')}{' '}
            <strong className="text-gray-900 dark:text-white">
              {targetDateIST} ({targetDayKey.toUpperCase()})
            </strong>
          </span>
          {isPostCutoff && (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-700/50">
              {t('nextDayCutoffNotice', 'Next-Day Service (After 2:00 PM Cutoff)')}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-gray-400" />
          <span>IST: {timeHms || '--:--:--'}</span>
        </div>
      </div>

      {/* Big Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Service Count */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-500/15">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-100 block">
            {t('totalPortions', 'Total Portions')} ({activeMeal === 'lunch' ? (t('lunch') || 'Lunch') : (t('breakfast') || 'Breakfast')})
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono">
              {loading ? '...' : mealMetrics.totalTakingMeal}
            </span>
            <span className="text-xs text-emerald-100 font-semibold">
              of {mealMetrics.totalEligible} {t('active', 'Active')}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-100/90 font-medium">
            {t('primaryCookQuantity', 'Primary cook quantity for serving counter')}
          </p>
        </div>

        {/* Regular Portions */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
            {t('standardRegularPortions', 'Standard / Regular Portions')}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono text-gray-900 dark:text-white">
              {loading ? '...' : mealMetrics.regularCount}
            </span>
            <span className="text-xs text-gray-500 font-semibold">{t('noRestrictions', 'No restrictions')}</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            {t('standardPrep', 'Standard meal preparation')}
          </p>
        </div>

        {/* Special Dietary Count */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f1715] border border-amber-200 dark:border-amber-500/30 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block">
            {t('specialCareDietary', 'Special Care / Dietary')}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono text-amber-600 dark:text-amber-400">
              {loading ? '...' : mealMetrics.specialDietCount}
            </span>
            <span className="text-xs text-amber-600 font-semibold">{t('specialPlates', 'Special plates')}</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            {t('separatePlatingNeeded', 'Separate plating or substitute needed')}
          </p>
        </div>

        {/* Opted Out / Leaves */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 block">
            {t('optedOutCancelled', 'Opted Out (Cancelled)')}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black font-mono text-rose-600 dark:text-rose-400">
              {loading ? '...' : mealMetrics.totalOptedOut}
            </span>
            <span className="text-xs text-rose-500 font-semibold">{t('excluded', 'Excluded')}</span>
          </div>
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
            {t('savedFoodNotDining', 'Saved food (not dining)')}
          </p>
        </div>
      </div>

      {/* Dietary Avoidance Breakdown Pills */}
      <div className="p-4 rounded-2xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {t('specificAvoidanceCounts', 'Specific Avoidance Counts (Substitute Requirements)')}
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-500/20 flex items-center justify-between">
            <span className="text-xs font-bold text-rose-900 dark:text-rose-200">{t('noBeef', 'No Beef')}:</span>
            <span className="font-mono text-sm font-black text-rose-700 dark:text-rose-300">
              {mealMetrics.dietaryCounts.beefAvoiders}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-500/20 flex items-center justify-between">
            <span className="text-xs font-bold text-blue-900 dark:text-blue-200">{t('noFish', 'No Fish')}:</span>
            <span className="font-mono text-sm font-black text-blue-700 dark:text-blue-300">
              {mealMetrics.dietaryCounts.fishAvoiders}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-500/20 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-900 dark:text-amber-200">{t('noChicken', 'No Chicken')}:</span>
            <span className="font-mono text-sm font-black text-amber-700 dark:text-amber-300">
              {mealMetrics.dietaryCounts.chickenAvoiders}
            </span>
          </div>
          <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-500/20 flex items-center justify-between">
            <span className="text-xs font-bold text-purple-900 dark:text-purple-200">{t('customAvoiders', 'Custom Avoiders:')}</span>
            <span className="font-mono text-sm font-black text-purple-700 dark:text-purple-300">
              {mealMetrics.dietaryCounts.customAvoiders}
            </span>
          </div>
        </div>
      </div>

      {/* Special Care Roster & Plate Dispatch List */}
      <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span>{t('specialCareDiningRoster', 'Special Care Dining Roster (Room Distribution)')}</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400">
                {filteredSpecialCare.length} {t('orders', 'Orders')}
              </span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {t('exactRoomTokensSpecial', 'Exact room numbers and tokens requiring special food assembly')}
            </p>
          </div>

          {/* Search & Batch Filters */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('tokenOrRoomPlaceholder', 'Token or Room...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={selectedBatch}
              onChange={(e) => setSelectedBatch(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">{t('allBatches', 'All Batches')}</option>
              {allBatches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filteredSpecialCare.length === 0 ? (
          <div className="py-12 text-center text-gray-400 space-y-2">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500/80" />
            <p className="text-xs font-semibold">
              {t('noSpecialDietaryShift', 'No special dietary avoidances registered for this meal shift.')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredSpecialCare.map((item) => {
              const s = item.student;
              return (
                <div
                  key={s.id}
                  className="p-3.5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-500/30 flex flex-col justify-between space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-black text-gray-900 dark:text-white">
                          Token #{s.tokenNo}
                        </span>
                        {s.roomNo && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-gray-900 dark:bg-white text-white dark:text-gray-900">
                            {t('room', 'Room')} {s.roomNo}
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-0.5 truncate">
                        {s.nameEn || s.name || 'Student'}
                      </p>
                      <p className="text-[11px] text-gray-400">{s.batch || 'General'}</p>
                    </div>
                  </div>

                  {/* Badges of Restrictions */}
                  <div className="flex flex-wrap gap-1 pt-1 border-t border-amber-200/60 dark:border-amber-500/20">
                    {item.hasBeefAvoid && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-700 dark:text-rose-300 border border-rose-300">
                        {t('noBeef', 'No Beef')}
                      </span>
                    )}
                    {item.hasFishAvoid && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border border-blue-300">
                        {t('noFish', 'No Fish')}
                      </span>
                    )}
                    {item.hasChickenAvoid && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-300">
                        {t('noChicken', 'No Chicken')}
                      </span>
                    )}
                    {item.hasMuttonAvoid && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-300">
                        {t('noMutton', 'No Mutton')}
                      </span>
                    )}
                    {item.customAvoids.map((name) => (
                      <span
                        key={name}
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-white/20"
                      >
                        No {name}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
