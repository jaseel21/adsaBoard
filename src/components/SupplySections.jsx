import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, Coffee, ArrowLeft, Layers, Printer, FileDown } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import firebase from '../firebase/config';
import { useWorldTime } from '../utils/time';
import { useFeedback } from '../utils/useFeedback';
import { useLanguage } from '../store/LanguageContext';
import {
  getTodayISTDate,
  addDaysToDate,
  getEffectiveStudentMealStatus,
} from '../utils/studentExceptionService';

export default function SupplySections({ defaultMeal }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  // Determine initial meal from prop or pathname
  const initialMeal = useMemo(() => {
    if (defaultMeal) return defaultMeal;
    if (location.pathname.includes('breakfast')) return 'breakfast';
    return 'lunch';
  }, [defaultMeal, location.pathname]);

  const [activeMeal, setActiveMeal] = useState(initialMeal);
  const [documents, setDocuments] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(true);

  // Section Display Options: 'batch' (Academic Batches 1-7) | 'size' (Numeric chunks)
  const [sectionMode, setSectionMode] = useState('batch');
  const [customChunkSize, setCustomChunkSize] = useState(25);

  const { timeHms, dayShort, longDate } = useWorldTime('Asia/Kolkata');
  const [day, setDay] = useState('');
  const todayIST = useMemo(() => getTodayISTDate(), []);

  // Synchronize target meal date (after 2:00 PM IST, view next day's supply)
  const isPostCutoff = Boolean(timeHms && timeHms >= '14:00:00');
  const targetDateIST = useMemo(() => {
    return isPostCutoff ? addDaysToDate(todayIST, 1) : todayIST;
  }, [isPostCutoff, todayIST]);

  useEffect(() => {
    if (!dayShort || !timeHms) return;
    const days = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    if (isPostCutoff) {
      const currentIndex = days.indexOf(dayShort);
      const nextDay = days[(currentIndex + 1) % 7];
      setDay(nextDay);
    } else {
      setDay(dayShort);
    }
  }, [timeHms, dayShort, isPostCutoff]);

  // Reactive real-time student subscription
  useEffect(() => {
    setLoading(true);
    const unsub = firebase
      .firestore()
      .collection('students')
      .onSnapshot(
        (querySnapshot) => {
          const docs = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          docs.sort((a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0));
          setDocuments(docs);
          setLoading(false);
        },
        (err) => {
          console.error('Error in SupplySections real-time listener:', err);
          setLoading(false);
        }
      );

    return () => unsub();
  }, []);

  // Compute dynamic sections based on selected mode
  const dynamicSections = useMemo(() => {
    if (documents.length === 0 || !day) return [];

    if (sectionMode === 'batch') {
      const batches = ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4', 'Batch 5', 'Batch 6', 'Batch 7'];
      return batches.map((bName, idx) => {
        const slice = documents.filter((d) => d.batch === bName);
        const canceledTokens = slice
          .filter((doc) => !getEffectiveStudentMealStatus(doc, targetDateIST, day, activeMeal))
          .map((doc) => doc.tokenNo);

        const rangeStr =
          slice.length > 0 ? `${slice[0].tokenNo} - ${slice[slice.length - 1].tokenNo}` : 'None';

        return {
          id: idx + 1,
          name: bName,
          range: rangeStr,
          canceledTokens,
          total: slice.length,
          activeCount: slice.length - canceledTokens.length,
        };
      });
    }

    const size = Number(customChunkSize) || 25;
    const totalSections = Math.ceil(documents.length / size);
    const result = [];

    for (let i = 0; i < totalSections; i++) {
      const start = i * size;
      const end = Math.min((i + 1) * size, documents.length);
      const slice = documents.slice(start, end);

      const canceledTokens = slice
        .filter((doc) => !getEffectiveStudentMealStatus(doc, targetDateIST, day, activeMeal))
        .map((doc) => doc.tokenNo);

      const rangeStr =
        slice.length > 0
          ? `${slice[0].tokenNo} - ${slice[slice.length - 1].tokenNo}`
          : `${start + 1} - ${end}`;

      result.push({
        id: i + 1,
        name: `Section ${i + 1}`,
        range: rangeStr,
        canceledTokens,
        total: slice.length,
        activeCount: slice.length - canceledTokens.length,
      });
    }

    return result;
  }, [documents, day, sectionMode, customChunkSize, activeMeal, targetDateIST]);

  const toggleSection = (id) => {
    feedback('pop');
    setActiveSection((prev) => (prev === id ? null : id));
  };

  const handleMealSwitch = (newMeal) => {
    feedback('pop');
    setActiveMeal(newMeal);
    navigate(newMeal === 'breakfast' ? '/breakfast' : '/lunch', { replace: true });
  };

  const exportSupplyPdf = () => {
    feedback('tick');
    const doc = new jsPDF('p', 'mm', 'a4');
    const isLunchMeal = activeMeal === 'lunch';

    doc.setFontSize(16);
    doc.setTextColor(isLunchMeal ? 5 : 217, isLunchMeal ? 150 : 119, isLunchMeal ? 105 : 6);
    doc.text(
      `Alathurpadi Dars - ${isLunchMeal ? 'Lunch' : 'Breakfast'} Kitchen Supply Breakdown`,
      14,
      18
    );

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Date: ${targetDateIST} (${(day || '').toUpperCase()}) | Total Students: ${documents.length}`,
      14,
      25
    );

    const columns = dynamicSections.map((sec) => ({
      header: `${sec.name}\n(${sec.activeCount} Served)`,
      dataKey: `s${sec.id}`,
    }));

    const maxSkipped = Math.max(...dynamicSections.map((s) => s.canceledTokens.length), 1);
    const tableBody = Array.from({ length: maxSkipped }).map((_, rIdx) => {
      const row = {};
      dynamicSections.forEach((sec) => {
        row[`s${sec.id}`] =
          sec.canceledTokens[rIdx] !== undefined ? `#${sec.canceledTokens[rIdx]}` : '-';
      });
      return row;
    });

    doc.autoTable({
      columns,
      body: tableBody,
      startY: 32,
      theme: 'grid',
      headStyles: {
        fillColor: isLunchMeal ? [5, 150, 105] : [217, 119, 6],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 9,
      },
      bodyStyles: { fontSize: 8, halign: 'center' },
    });

    doc.save(
      `ADSA_Kitchen_${activeMeal.toUpperCase()}_${targetDateIST}.pdf`
    );
    feedback('success');
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
        <p className="mt-3 text-emerald-600 dark:text-emerald-400 font-semibold text-xs">
          Loading supply sections...
        </p>
      </div>
    );
  }

  const isLunchMeal = activeMeal === 'lunch';
  const totalActive = dynamicSections.reduce((acc, s) => acc + s.activeCount, 0);
  const totalSkipped = dynamicSections.reduce((acc, s) => acc + s.canceledTokens.length, 0);

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Top Banner & Mode Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3.5 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            {isLunchMeal ? (
              <Utensils className="w-5 h-5 text-emerald-500" />
            ) : (
              <Coffee className="w-5 h-5 text-amber-500" />
            )}
            <h1 className="text-lg xs:text-xl sm:text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {isLunchMeal ? 'Lunch Supply Distribution' : 'Breakfast Supply Distribution'}
            </h1>
          </div>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400">
            Canceled and active token breakdown for kitchen tables and dining hall sections
            {isPostCutoff ? ' (Showing Tomorrow\'s Manifest)' : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-start sm:justify-end">
          {/* Meal Toggle Switch */}
          <div className="flex p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
            <button
              onClick={() => handleMealSwitch('lunch')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                isLunchMeal
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Lunch</span>
            </button>

            <button
              onClick={() => handleMealSwitch('breakfast')}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                !isLunchMeal
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Breakfast</span>
            </button>
          </div>

          {/* Grouping Mode Pill */}
          <div className="flex p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
            <button
              onClick={() => {
                feedback('tick');
                setSectionMode('batch');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sectionMode === 'batch'
                  ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              By Batch (1-7)
            </button>

            <button
              onClick={() => {
                feedback('tick');
                setSectionMode('size');
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                sectionMode === 'size'
                  ? 'bg-white dark:bg-white/15 text-gray-900 dark:text-white shadow-xs'
                  : 'text-gray-500 dark:text-gray-400'
              }`}
            >
              Chunks of {customChunkSize}
            </button>
          </div>

          <button
            onClick={exportSupplyPdf}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            <span>Export Kitchen PDF</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Total Students
          </span>
          <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">
            {documents.length}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Meals to Prepare
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {totalActive}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[11px] font-bold text-rose-500 uppercase tracking-wider block">
            Skipped / Off
          </span>
          <span className="text-2xl font-black text-rose-500 mt-1 block">{totalSkipped}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-xs">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
            Active Sections
          </span>
          <span className="text-2xl font-black text-gray-900 dark:text-white mt-1 block">
            {dynamicSections.length}
          </span>
        </div>
      </div>

      {/* Dynamic Sections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {dynamicSections.map((sec) => {
          const isOpen = activeSection === sec.id;
          return (
            <motion.div
              key={sec.id}
              layout
              className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden flex flex-col justify-between"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isLunchMeal
                          ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300'
                      }`}
                    >
                      #{sec.id}
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                        {sec.name}
                      </h3>
                      <p className="text-[11px] font-mono text-gray-400">Tokens {sec.range}</p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      isLunchMeal
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                        : 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-500/20'
                    }`}
                  >
                    {sec.activeCount} Served
                  </span>
                </div>

                <div className="pt-2 border-t border-gray-100 dark:border-white/5 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-600 dark:text-gray-300">
                      Canceled / Skipped Tokens:
                    </span>
                    <span className="font-bold text-rose-500">{sec.canceledTokens.length}</span>
                  </div>

                  {sec.canceledTokens.length === 0 ? (
                    <div className="py-2 text-center text-xs text-gray-400 italic">
                      All tokens attending in this section.
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {sec.canceledTokens.map((tok) => (
                        <span
                          key={tok}
                          className="px-2 py-0.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold border border-rose-200/50 dark:border-rose-500/20"
                        >
                          #{tok}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
