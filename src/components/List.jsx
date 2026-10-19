import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileDown, Sparkles, ArrowLeft, UtensilsCrossed } from 'lucide-react';
import firebase from '../firebase/config';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { AuthContext } from '../store/AuthContext';
import { subscribeToPreferences } from '../utils/preferenceService';

const MenuTable = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [documents, setDocuments] = useState([]);
  const [preferences, setPreferences] = useState([]);
  const [rejectionsByPref, setRejectionsByPref] = useState({});
  const [loading, setLoading] = useState(true);

  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();

  useEffect(() => {
    setLoading(true);
    const unsubPrefs = subscribeToPreferences((list) => {
      setPreferences(list.filter((p) => p.isActive));
    });

    const unsubStudents = firebase
      .firestore()
      .collection('students')
      .onSnapshot(
        (querySnapshot) => {
          const tokenDocuments = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          tokenDocuments.sort((a, b) => (Number(a.tokenNo) || 0) - (Number(b.tokenNo) || 0));
          setDocuments(tokenDocuments);
          setLoading(false);
        },
        (error) => {
          console.error('Error in List.jsx real-time tokens listener:', error);
          setLoading(false);
        }
      );

    return () => {
      unsubPrefs();
      unsubStudents();
    };
  }, []);

  // Compute rejections dynamically whenever preferences or documents update
  useEffect(() => {
    if (documents.length === 0 || preferences.length === 0) return;

    const map = {};
    preferences.forEach((pref) => {
      const avoidedTokens = documents
        .filter((doc) => doc.obj2 && doc.obj2[pref.id] === false)
        .map((doc) => doc.tokenNo);
      map[pref.id] = avoidedTokens;
    });

    setRejectionsByPref(map);
  }, [documents, preferences]);

  const generatePDF = () => {
    feedback('tick');
    const doc = new jsPDF('p', 'mm', 'a4');

    const columns = preferences.map((p) => ({
      header: `${p.labelEn} (${p.labelMl || p.labelEn})`,
      dataKey: p.id,
    }));

    const maxLen = Math.max(
      ...preferences.map((p) => (rejectionsByPref[p.id] || []).length),
      1
    );

    const tableData = Array.from({ length: maxLen }).map((_, index) => {
      const row = {};
      preferences.forEach((p) => {
        const list = rejectionsByPref[p.id] || [];
        row[p.id] = index < list.length ? `#${list[index]}` : '-';
      });
      return row;
    });

    doc.setFontSize(16);
    doc.setTextColor(5, 150, 105);
    doc.text('Alathurpadi Dars - Dietary Rejections List', 14, 18);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString('en-GB')}`, 14, 25);

    doc.autoTable({
      columns,
      body: tableData,
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [5, 150, 105], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { fontSize: 10, halign: 'center' },
    });

    doc.save(`ADSA_Dietary_Rejections_${new Date().toISOString().slice(0, 10)}.pdf`);
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
          Loading rejections...
        </p>
      </div>
    );
  }

  const maxRows = Math.max(
    ...preferences.map((p) => (rejectionsByPref[p.id] || []).length),
    1
  );

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 sm:gap-4 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            {t('dietaryAvoidersMatrix', 'Dietary Avoiders Matrix')}
          </h1>
          <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t('dietaryAvoidersSubtitle', 'Tokens with specific meat/fish exclusions for kitchen reference (Dynamic Preferences)')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          {user && (
            <button
              onClick={() => {
                feedback('tick');
                navigate('/admin/dietary');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" />
              <span>{t('manageAvoiders', 'Manage Avoiders')}</span>
            </button>
          )}

          <button
            onClick={() => {
              feedback('tick');
              navigate('/');
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t('navHome', 'Board')}</span>
          </button>

          <button
            onClick={generatePDF}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <FileDown className="w-4 h-4" />
            <span>{t('exportKitchenPdf', 'Export Kitchen PDF')}</span>
          </button>
        </div>
      </div>

      {/* Summary Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {preferences.map((p) => {
          const count = (rejectionsByPref[p.id] || []).length;
          const prefLabel = lang === 'ml' && p.labelMl ? p.labelMl : p.labelEn;
          return (
            <div
              key={p.id}
              className="p-4 rounded-2xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 text-center shadow-xs"
            >
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400 block">
                {prefLabel} {t('excluded', 'Excluded')}
              </span>
              <span className="text-2xl font-extrabold text-rose-500 block mt-1">
                {count}
              </span>
              <span className="text-[10px] text-gray-400 block mt-0.5">
                {documents.length - count} {t('accepted', 'accepted')}
              </span>
            </div>
          );
        })}
      </div>

      {/* Dynamic Table */}
      <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto scrollbar-none touch-pan-x">
          <table className="w-full text-center">
            <thead>
              <tr className="bg-gray-50/80 dark:bg-white/5 border-b border-gray-200/80 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-300">
                {preferences.map((p) => (
                  <th key={p.id} className="py-3.5 px-4">
                    <span>{p.labelEn}</span>
                    <span className="block text-[10px] font-normal text-gray-400 mt-0.5">
                      {p.labelMl}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-xs font-semibold">
              {Array.from({ length: maxRows }).map((_, index) => (
                <tr key={index} className="hover:bg-gray-50/50 dark:hover:bg-white/2 transition-colors">
                  {preferences.map((p) => {
                    const list = rejectionsByPref[p.id] || [];
                    const tokenVal = list[index];
                    return (
                      <td key={p.id} className="py-3 px-4">
                        {tokenVal ? (
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-mono text-xs font-bold">
                            #{tokenVal}
                          </span>
                        ) : (
                          <span className="text-gray-300 dark:text-gray-600">-</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MenuTable;
