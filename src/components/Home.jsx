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
  Filter,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import firebase from '../firebase/config';
import { useWorldTime } from '../utils/time';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import './Home.css';

// Animated Rolling Counter Component
const RollingCounter = ({ value, label, colorClass, glowClass, icon: Icon }) => {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-[#121c19]/90 border border-gray-200/80 dark:border-white/10 shadow-sm transition-all duration-300 ${glowClass}`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-gray-300">
          {label}
        </span>
        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl sm:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white"
        >
          {value}
        </motion.span>
        <span className="text-xs text-gray-400 font-medium">orders</span>
      </div>
    </motion.div>
  );
};

// Next-Gen Tactile Token Button
const TokenButton = ({ doc, isOn, onClick, onBlockedClick }) => {
  const isBlocked = Boolean(doc.block);

  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
      layout
      transition={{ type: 'spring', stiffness: 450, damping: 25 }}
      onClick={() => {
        if (isBlocked) {
          onBlockedClick(doc);
        } else {
          onClick(doc);
        }
      }}
      aria-label={`Token ${doc.tokenNo}`}
      className={`
        relative group flex items-center justify-center
        w-13 h-13 sm:w-14 sm:h-14 rounded-2xl select-none font-bold text-sm sm:text-base tracking-wide
        shadow-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/50
        ${
          isBlocked
            ? 'bg-gradient-to-b from-gray-700 to-gray-900 text-gray-300 border border-gray-600/40 shadow-inner'
            : isOn
            ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25 hover:shadow-glow-emerald border border-emerald-400/40'
            : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25 hover:shadow-glow-red border border-rose-400/40'
        }
      `}
    >
      {/* Light sheen on hover */}
      {!isBlocked && (
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}

      {/* Lock icon badge for blocked students */}
      {isBlocked ? (
        <Lock className="w-4 h-4 text-gray-400" />
      ) : (
        <span className="relative z-10">{doc.tokenNo}</span>
      )}

      {/* Mini indicator dot */}
      <span
        className={`absolute bottom-1 w-1 h-1 rounded-full ${
          isBlocked
            ? 'bg-gray-500'
            : isOn
            ? 'bg-white/80'
            : 'bg-white/60'
        }`}
      />
    </motion.button>
  );
};

const SwitchPage = () => {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const { feedback } = useFeedback();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLunch, setIsLunch] = useState(true);
  const [detailsDoc, setDetailsDoc] = useState(null);
  const [blockedAlertDoc, setBlockedAlertDoc] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, off, blocked

  const { timeHms, longDate, dayShort, isSynced } = useWorldTime('Asia/Kolkata');
  const [day, setDay] = useState('');

  // Determine current or next day for meal allocation (after 6:00 PM IST, view next day)
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

  // Real-time Firestore Subscription (instant updates across all connected clients)
  useEffect(() => {
    setLoading(true);
    const unsubscribe = firebase
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
        (error) => {
          console.error('Error with real-time students listener:', error);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  // Compute live lunch and breakfast counts
  const { lunchCount, breakfastCount } = useMemo(() => {
    let l = 0;
    let b = 0;
    if (!day) return { lunchCount: 0, breakfastCount: 0 };

    documents.forEach((doc) => {
      if (!doc.block) {
        if (doc.obj?.lunch?.[day]) l++;
        if (doc.obj?.breakfast?.[day]) b++;
      }
    });

    return { lunchCount: l, breakfastCount: b };
  }, [documents, day]);

  // Filtered documents based on search query and status tab
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Search matching
      const matchesSearch =
        searchQuery.trim() === '' ||
        String(doc.tokenNo).includes(searchQuery.trim()) ||
        (doc.uname && doc.uname.toLowerCase().includes(searchQuery.toLowerCase().trim()));

      if (!matchesSearch) return false;

      // Status matching
      const isBlocked = Boolean(doc.block);
      const isOn = isLunch ? doc.obj?.lunch?.[day] : doc.obj?.breakfast?.[day];

      if (statusFilter === 'active') return !isBlocked && isOn;
      if (statusFilter === 'off') return !isBlocked && !isOn;
      if (statusFilter === 'blocked') return isBlocked;

      return true;
    });
  }, [documents, searchQuery, statusFilter, isLunch, day]);

  const toggleMeal = (mealType) => {
    feedback('pop');
    setIsLunch(mealType === 'lunch');
  };

  const handleOpenDetails = (doc) => {
    feedback('tick');
    setDetailsDoc(doc);
  };

  const handleOpenBlocked = (doc) => {
    feedback('warning');
    setBlockedAlertDoc(doc);
  };

  const daysList = [
    { key: 'su', label: t('days').su },
    { key: 'mo', label: t('days').mo },
    { key: 'tu', label: t('days').tu },
    { key: 'we', label: t('days').we },
    { key: 'th', label: t('days').th },
    { key: 'fr', label: t('days').fr },
    { key: 'sa', label: t('days').sa },
  ];

  if (loading && documents.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="flex space-x-2">
          {[0, 1, 2].map((idx) => (
            <motion.div
              key={idx}
              className="w-3.5 h-3.5 rounded-full bg-emerald-500"
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 0.6, delay: idx * 0.15 }}
            />
          ))}
        </div>
        <p className="mt-4 text-emerald-600 dark:text-emerald-400 font-semibold text-sm">
          {t('syncingTime')}
        </p>
      </div>
    );
  }

  const isNextDayActive = timeHms && timeHms > '18:00:00';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
      
      {/* ================= BENTO GRID HERO HEADER ================= */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Bento Tile 1: Schedule & Live Clock */}
        <div className="md:col-span-5 p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/50 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('serverSynced')}</span>
            </div>

            <span className="font-mono text-xs font-semibold text-gray-500 dark:text-gray-400">
              {timeHms || '12:00:00'} IST
            </span>
          </div>

          <div className="mt-4">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white capitalize flex items-center gap-2">
              <Calendar className="w-5 h-5 text-emerald-500" />
              {day && t('daysFull')[day]}
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {longDate}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <span>
              {isNextDayActive ? t('nextDaySupply') : t('currentDay')}
            </span>
          </div>
        </div>

        {/* Bento Tile 2: Live Meal Headcounts */}
        <div className="md:col-span-4 grid grid-cols-2 gap-3">
          <RollingCounter
            value={lunchCount}
            label={t('lunchCount')}
            colorClass="bg-gradient-to-br from-emerald-500 to-green-600"
            glowClass="hover:shadow-glow-emerald"
            icon={Utensils}
          />
          <RollingCounter
            value={breakfastCount}
            label={t('breakfastCount')}
            colorClass="bg-gradient-to-br from-amber-500 to-orange-600"
            glowClass="hover:shadow-glow-amber"
            icon={Coffee}
          />
        </div>

        {/* Bento Tile 3: Quick Action Launchpad */}
        <div className="md:col-span-3 p-5 rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-green-700 text-white shadow-lg flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-6 -mt-6 w-28 h-28 bg-white/10 rounded-full blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-emerald-100">
                {t('totalStudents')}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-xs font-bold">
                {documents.length}
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-2 font-medium">
              {t('cutoffNotice')}
            </p>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => {
                feedback('tick');
                navigate('/pdfg');
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur-md text-white font-semibold text-xs border border-white/20 transition-all active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('supplyListBtn')}</span>
            </button>

            <button
              onClick={() => {
                feedback('tick');
                navigate('/login');
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{t('updateTokenBtn')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= CONTROLS DOCK: MEAL TOGGLE & SEARCH ================= */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-3 rounded-2xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
        
        {/* Meal Segmented Toggle Switch */}
        <div className="relative flex p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 w-full sm:w-auto">
          <button
            onClick={() => toggleMeal('lunch')}
            className={`relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex-1 sm:flex-none ${
              isLunch
                ? 'text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {isLunch && (
              <motion.div
                layoutId="activeMealPill"
                className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl shadow-md"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Utensils className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{t('navLunch')}</span>
            <span className="relative z-10 px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-bold">
              {lunchCount}
            </span>
          </button>

          <button
            onClick={() => toggleMeal('breakfast')}
            className={`relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-200 flex-1 sm:flex-none ${
              !isLunch
                ? 'text-white'
                : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {!isLunch && (
              <motion.div
                layoutId="activeMealPill"
                className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-md"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <Coffee className="w-4 h-4 relative z-10" />
            <span className="relative z-10">{t('navBreakfast')}</span>
            <span className="relative z-10 px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-bold">
              {breakfastCount}
            </span>
          </button>
        </div>

        {/* Filter Chips & Search Input */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-gray-100 dark:bg-white/5 text-xs font-semibold">
            {['all', 'active', 'off', 'blocked'].map((chip) => (
              <button
                key={chip}
                onClick={() => {
                  feedback('tick');
                  setStatusFilter(chip);
                }}
                className={`px-2.5 py-1 rounded-lg capitalize transition-colors ${
                  statusFilter === chip
                    ? 'bg-white dark:bg-[#192420] text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {chip === 'all'
                  ? t('allTokens')
                  : chip === 'active'
                  ? t('activeTokens')
                  : chip === 'off'
                  ? t('offTokens')
                  : t('blockedTokens')}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-50 dark:bg-[#121c19] border border-gray-200/80 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ================= TOKEN MATRIX GRID ================= */}
      <div className="min-h-[300px]">
        {filteredDocuments.length === 0 ? (
          <div className="p-12 text-center rounded-3xl bg-white/50 dark:bg-[#0f1715]/50 border border-gray-200/60 dark:border-white/5">
            <Filter className="w-8 h-8 mx-auto text-gray-400" />
            <p className="mt-2 text-sm font-semibold text-gray-600 dark:text-gray-400">
              No tokens match your search or filter.
            </p>
          </div>
        ) : (
          <motion.div
            layout
            className="flex flex-wrap justify-center gap-2.5 sm:gap-3 py-2"
          >
            {filteredDocuments.map((doc) => {
              const isOn = Boolean(
                isLunch ? doc.obj?.lunch?.[day] : doc.obj?.breakfast?.[day]
              );
              return (
                <TokenButton
                  key={doc.id || doc.tokenNo}
                  doc={doc}
                  isOn={isOn}
                  onClick={handleOpenDetails}
                  onBlockedClick={handleOpenBlocked}
                />
              );
            })}
          </motion.div>
        )}
      </div>

      {/* ================= TOKEN DETAILS MODAL ================= */}
      <AnimatePresence>
        {detailsDoc && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setDetailsDoc(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden"
            >
              {/* Modal Header */}
              <div className="relative bg-gradient-to-r from-emerald-600 to-green-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center font-extrabold text-xl">
                      {detailsDoc.tokenNo}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold tracking-tight">
                        {detailsDoc.uname || 'Student'}
                      </h2>
                      <span className="text-xs text-emerald-100 flex items-center gap-1 mt-0.5">
                        <Check className="w-3.5 h-3.5" />
                        {t('statusActive')}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      feedback('tick');
                      setDetailsDoc(null);
                    }}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-5 sm:p-6 space-y-5">
                
                {/* Breakfast Schedule Grid */}
                <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Coffee className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="text-xs font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                      {t('navBreakfast')}
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {daysList.map(({ key, label }) => {
                      const active = detailsDoc.obj?.breakfast?.[key] === true;
                      return (
                        <div key={key} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                            {label}
                          </span>
                          <div
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                              active
                                ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                            }`}
                          >
                            {active ? <Check className="w-4 h-4" /> : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lunch Schedule Grid */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Utensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200 uppercase tracking-wider">
                      {t('navLunch')}
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                    {daysList.map(({ key, label }) => {
                      const active = detailsDoc.obj?.lunch?.[key] === true;
                      return (
                        <div key={key} className="flex flex-col items-center gap-1">
                          <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400">
                            {label}
                          </span>
                          <div
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${
                              active
                                ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-sm'
                                : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                            }`}
                          >
                            {active ? <Check className="w-4 h-4" /> : '-'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Edit Button */}
                <div className="pt-2 flex justify-end gap-2">
                  <button
                    onClick={() => {
                      feedback('tick');
                      setDetailsDoc(null);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    {t('close')}
                  </button>

                  <button
                    onClick={() => {
                      feedback('tick');
                      navigate(`/login?token=${detailsDoc.tokenNo}`);
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md transition-all active:scale-95"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t('editPreferences')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ================= BLOCKED NOTICE MODAL ================= */}
      <AnimatePresence>
        {blockedAlertDoc && (
          <div
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
                  Token {blockedAlertDoc.tokenNo} Locked
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  {t('blockedMessage')}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setBlockedAlertDoc(null)}
                  className="w-full py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs transition-colors"
                >
                  {t('close')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SwitchPage;