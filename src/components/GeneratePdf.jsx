import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Printer, FileDown, ArrowLeft, Coffee, Utensils, Calendar } from 'lucide-react';
import firebase from '../firebase/config';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useWorldTime } from '../utils/time';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';

const GeneratePdf = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [day, setDay] = useState('');

  const { timeHms, dayShort, longDate } = useWorldTime('Asia/Kolkata');

  useEffect(() => {
    if (!dayShort || !timeHms) return;
    const currentTime = timeHms;
    const days = ['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'];
    if (currentTime > '18:00:00') {
      const currentIndex = days.indexOf(dayShort);
      const nextDay = days[(currentIndex + 1) % 7];
      setDay(nextDay);
    } else {
      setDay(dayShort);
    }
  }, [timeHms, dayShort]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await firebase.firestore().collection('students').get();
        const docs = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        docs.sort((a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0));
        setDocuments(docs);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Compute 8 sections of 25 for lunch and breakfast
  const { lunchSections, breakfastSections, beef, chicken, fish, mutton } = useMemo(() => {
    const sectionSize = 25;
    const totalSections = Math.min(8, Math.ceil(documents.length / sectionSize) || 1);

    const lSections = [];
    const bSections = [];

    for (let i = 0; i < totalSections; i++) {
      const start = i * sectionSize;
      const end = Math.min((i + 1) * sectionSize, documents.length);
      const slice = documents.slice(start, end);

      const lCanceled = slice
        .filter((doc) => doc.block || (doc.obj && !doc.obj.lunch?.[day]))
        .map((doc) => doc.tokenNo);

      const bCanceled = slice
        .filter((doc) => doc.block || (doc.obj && !doc.obj.breakfast?.[day]))
        .map((doc) => doc.tokenNo);

      lSections.push(lCanceled);
      bSections.push(bCanceled);
    }

    const beefList = documents.filter((doc) => doc.obj2 && !doc.obj2.beef).map((doc) => doc.tokenNo);
    const chickenList = documents.filter((doc) => doc.obj2 && !doc.obj2.chicken).map((doc) => doc.tokenNo);
    const fishList = documents.filter((doc) => doc.obj2 && !doc.obj2.fish).map((doc) => doc.tokenNo);
    const muttonList = documents.filter((doc) => doc.obj2 && !doc.obj2.mutton).map((doc) => doc.tokenNo);

    return {
      lunchSections: lSections,
      breakfastSections: bSections,
      beef: beefList,
      chicken: chickenList,
      fish: fishList,
      mutton: muttonList,
    };
  }, [documents, day]);

  const generatePDF = () => {
    feedback('tick');
    const doc = new jsPDF('p', 'mm', 'a4');

    // Header
    doc.setFontSize(16);
    doc.setTextColor(5, 150, 105);
    doc.text('Alathurpadi Dars Canteen - Daily Supply Manifest', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Schedule Date: ${longDate || new Date().toDateString()} (${day.toUpperCase()})`, 14, 25);

    // Lunch Table
    const lColumns = lunchSections.map((_, idx) => ({
      header: `Sec ${idx + 1} (${idx * 25 + 1}-${Math.min((idx + 1) * 25, documents.length)})`,
      dataKey: `s${idx}`,
    }));
    const maxLRows = Math.max(...lunchSections.map((s) => s.length), 1);
    const lBody = Array.from({ length: maxLRows }).map((_, rIdx) => {
      const row = {};
      lunchSections.forEach((sec, sIdx) => {
        row[`s${sIdx}`] = sec[rIdx] !== undefined ? sec[rIdx] : '-';
      });
      return row;
    });

    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text('1. Lunch - Canceled/Skipped Tokens', 14, 34);

    doc.autoTable({
      columns: lColumns,
      body: lBody,
      startY: 38,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8, halign: 'center' },
    });

    // Breakfast Table
    const yAfterLunch = doc.lastAutoTable.finalY + 12;
    const bColumns = breakfastSections.map((_, idx) => ({
      header: `Sec ${idx + 1}`,
      dataKey: `s${idx}`,
    }));
    const maxBRows = Math.max(...breakfastSections.map((s) => s.length), 1);
    const bBody = Array.from({ length: maxBRows }).map((_, rIdx) => {
      const row = {};
      breakfastSections.forEach((sec, sIdx) => {
        row[`s${sIdx}`] = sec[rIdx] !== undefined ? sec[rIdx] : '-';
      });
      return row;
    });

    doc.setFontSize(13);
    doc.setTextColor(0, 0, 0);
    doc.text('2. Breakfast - Canceled/Skipped Tokens', 14, yAfterLunch);

    doc.autoTable({
      columns: bColumns,
      body: bBody,
      startY: yAfterLunch + 4,
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8, halign: 'center' },
    });

    doc.save(`ADSA_Kitchen_Supply_${day}_${new Date().toISOString().slice(0, 10)}.pdf`);
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
      </div>
    );
  }

  const maxLRows = Math.max(...lunchSections.map((s) => s.length), 1);
  const maxBRows = Math.max(...breakfastSections.map((s) => s.length), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Printer className="w-5 h-5 text-emerald-500" />
            Kitchen Supply Manifest Generator
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Sections 1-8 canceled tokens breakdown for kitchen distribution ({longDate})
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              feedback('tick');
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Board</span>
          </button>

          <button
            onClick={generatePDF}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/25 transition-all transform active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            <span>Download Kitchen PDF</span>
          </button>
        </div>
      </div>

      {/* Lunch Manifest Table */}
      <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 p-6 shadow-md overflow-hidden backdrop-blur-xl space-y-3">
        <div className="flex items-center gap-2">
          <Utensils className="w-4 h-4 text-emerald-500" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Lunch Supply - Canceled Tokens (Sec 1 to {lunchSections.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10 text-center text-xs">
            <thead className="bg-emerald-50/70 dark:bg-emerald-950/30">
              <tr>
                {lunchSections.map((sec, idx) => (
                  <th key={idx} className="py-2.5 px-3 font-bold text-emerald-800 dark:text-emerald-300">
                    Sec {idx + 1}
                    <span className="block text-[10px] opacity-75 font-normal">
                      ({sec.length} skipped)
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-mono">
              {Array.from({ length: maxLRows }).map((_, rIdx) => (
                <tr key={rIdx} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                  {lunchSections.map((sec, sIdx) => (
                    <td key={sIdx} className="py-2 px-3 text-gray-700 dark:text-gray-300">
                      {sec[rIdx] !== undefined ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          #{sec[rIdx]}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Breakfast Manifest Table */}
      <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 p-6 shadow-md overflow-hidden backdrop-blur-xl space-y-3">
        <div className="flex items-center gap-2">
          <Coffee className="w-4 h-4 text-amber-500" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">
            Breakfast Supply - Canceled Tokens (Sec 1 to {breakfastSections.length})
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10 text-center text-xs">
            <thead className="bg-amber-50/70 dark:bg-amber-950/30">
              <tr>
                {breakfastSections.map((sec, idx) => (
                  <th key={idx} className="py-2.5 px-3 font-bold text-amber-800 dark:text-amber-300">
                    Sec {idx + 1}
                    <span className="block text-[10px] opacity-75 font-normal">
                      ({sec.length} skipped)
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 font-mono">
              {Array.from({ length: maxBRows }).map((_, rIdx) => (
                <tr key={rIdx} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                  {breakfastSections.map((sec, sIdx) => (
                    <td key={sIdx} className="py-2 px-3 text-gray-700 dark:text-gray-300">
                      {sec[rIdx] !== undefined ? (
                        <span className="font-bold text-amber-600 dark:text-amber-400">
                          #{sec[rIdx]}
                        </span>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600">-</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GeneratePdf;
