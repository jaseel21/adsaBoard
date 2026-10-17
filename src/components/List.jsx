import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileDown, Sparkles, AlertCircle } from 'lucide-react';
import firebase from '../firebase/config';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';

const MenuTable = () => {
  const [documents, setDocuments] = useState([]);
  const [beef, setBeef] = useState([]);
  const [chicken, setChicken] = useState([]);
  const [fish, setFish] = useState([]);
  const [mutton, setMutton] = useState([]);
  const [loading, setLoading] = useState(true);

  const { t } = useLanguage();
  const { feedback } = useFeedback();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const querySnapshot = await firebase.firestore().collection('students').get();
        const tokenDocuments = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        tokenDocuments.sort((a, b) => a.tokenNo - b.tokenNo);
        setDocuments(tokenDocuments);
        fetchRejections(tokenDocuments);
      } catch (error) {
        console.error('Error fetching tokens:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchRejections = (docs) => {
      const beefTokens = docs.filter((doc) => doc.obj2 && !doc.obj2.beef).map((doc) => doc.tokenNo);
      setBeef(beefTokens);

      const chickenTokens = docs.filter((doc) => doc.obj2 && !doc.obj2.chicken).map((doc) => doc.tokenNo);
      setChicken(chickenTokens);

      const fishTokens = docs.filter((doc) => doc.obj2 && !doc.obj2.fish).map((doc) => doc.tokenNo);
      setFish(fishTokens);

      const muttonTokens = docs.filter((doc) => doc.obj2 && !doc.obj2.mutton).map((doc) => doc.tokenNo);
      setMutton(muttonTokens);
    };

    fetchData();
  }, []);

  const generatePDF = () => {
    feedback('tick');
    const doc = new jsPDF('p', 'mm', 'a4');

    const columns = [
      { header: 'Beef', dataKey: 'beef' },
      { header: 'Chicken', dataKey: 'chicken' },
      { header: 'Fish', dataKey: 'fish' },
      { header: 'Mutton', dataKey: 'mutton' },
    ];

    const maxLen = Math.max(beef.length, chicken.length, fish.length, mutton.length);
    const tableData = Array.from({ length: maxLen }).map((_, index) => ({
      beef: index < beef.length ? beef[index] : '-',
      chicken: index < chicken.length ? chicken[index] : '-',
      fish: index < fish.length ? fish[index] : '-',
      mutton: index < mutton.length ? mutton[index] : '-',
    }));

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

  const maxRows = Math.max(beef.length, chicken.length, fish.length, mutton.length);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            Dietary Avoiders Matrix
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Tokens with specific meat/fish exclusions for kitchen reference
          </p>
        </div>

        <button
          onClick={generatePDF}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all transform active:scale-95"
        >
          <FileDown className="w-4 h-4" />
          <span>Export PDF</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-lg overflow-hidden backdrop-blur-xl">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10 text-center">
            <thead className="bg-gray-50 dark:bg-[#131d1a]">
              <tr>
                <th className="py-3.5 px-4 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                  🥩 {t('beef')} ({beef.length})
                </th>
                <th className="py-3.5 px-4 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                  🍗 {t('chicken')} ({chicken.length})
                </th>
                <th className="py-3.5 px-4 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                  🐟 {t('fish')} ({fish.length})
                </th>
                <th className="py-3.5 px-4 text-xs font-bold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                  🍖 {t('mutton')} ({mutton.length})
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5 text-sm font-semibold text-gray-800 dark:text-gray-200">
              {maxRows === 0 ? (
                <tr>
                  <td colSpan="4" className="py-8 text-xs text-gray-400">
                    No dietary restrictions reported.
                  </td>
                </tr>
              ) : (
                Array.from({ length: maxRows }).map((_, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono">
                      {index < beef.length ? (
                        <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs">
                          #{beef[index]}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {index < chicken.length ? (
                        <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs">
                          #{chicken[index]}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {index < fish.length ? (
                        <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs">
                          #{fish[index]}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      {index < mutton.length ? (
                        <span className="px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-xs">
                          #{mutton[index]}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MenuTable;
