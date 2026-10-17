import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Utensils, ArrowLeft } from 'lucide-react';
import firebase from '../firebase/config';
import { useWorldTime } from '../utils/time';
import { useFeedback } from '../utils/useFeedback';

const Section = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [activeSection, setActiveSection] = useState(null);
  const [loading, setLoading] = useState(true);

  const { feedback } = useFeedback();
  const { timeHms, dayShort } = useWorldTime('Asia/Kolkata');
  const [day, setDay] = useState('');

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
      } catch (err) {
        console.error('Error fetching students:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Dynamically group students into sections of 25
  const sections = useMemo(() => {
    if (documents.length === 0 || !day) return [];
    const sectionSize = 25;
    const totalSections = Math.ceil(documents.length / sectionSize);
    const result = [];

    for (let i = 0; i < totalSections; i++) {
      const start = i * sectionSize;
      const end = Math.min((i + 1) * sectionSize, documents.length);
      const slice = documents.slice(start, end);

      // Canceled / blocked tokens for lunch
      const canceledTokens = slice
        .filter((doc) => doc.block || (doc.obj && !doc.obj.lunch?.[day]))
        .map((doc) => doc.tokenNo);

      result.push({
        id: i + 1,
        range: `${start + 1} - ${end}`,
        canceledTokens,
        total: slice.length,
      });
    }

    return result;
  }, [documents, day]);

  const toggleSection = (id) => {
    feedback('pop');
    setActiveSection((prev) => (prev === id ? null : id));
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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-500" />
            Lunch Supply Distribution by Sections
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Each section manages batches of 25 students. Numbers shown inside are canceled/skipped tokens.
          </p>
        </div>

        <button
          onClick={() => {
            feedback('tick');
            navigate('/');
          }}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors self-end sm:self-auto"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Board</span>
        </button>
      </div>

      <div className="grid grid-cols-1 min-[360px]:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
        {sections.map((sec) => {
          const isOpen = activeSection === sec.id;
          return (
            <div
              key={sec.id}
              className="rounded-2xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm overflow-hidden backdrop-blur-xl transition-all"
            >
              <button
                onClick={() => toggleSection(sec.id)}
                className={`w-full p-4 flex flex-col items-center text-center transition-colors ${
                  isOpen
                    ? 'bg-emerald-500 text-white'
                    : 'hover:bg-gray-50 dark:hover:bg-white/5 text-gray-900 dark:text-white'
                }`}
              >
                <Utensils className={`w-5 h-5 mb-1 ${isOpen ? 'text-white' : 'text-emerald-500'}`} />
                <span className="font-bold text-sm">Section {sec.id}</span>
                <span className={`text-xs ${isOpen ? 'text-emerald-100' : 'text-gray-400'}`}>
                  Tokens {sec.range}
                </span>

                <span
                  className={`mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isOpen
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {sec.canceledTokens.length} Canceled
                </span>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-3 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/5"
                  >
                    <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-2">
                      Skipped Tokens:
                    </p>
                    {sec.canceledTokens.length === 0 ? (
                      <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
                        All tokens taking lunch!
                      </p>
                    ) : (
                      <div className="flex flex-wrap gap-1.5">
                        {sec.canceledTokens.map((tokenNo) => (
                          <span
                            key={tokenNo}
                            className="px-2 py-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 font-mono text-xs font-bold border border-rose-200/50 dark:border-rose-500/20"
                          >
                            #{tokenNo}
                          </span>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Section;
