import React, { useEffect, useState, useContext, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Lock,
  Unlock,
  Utensils,
  Coffee,
  Sliders,
  Calendar,
  ShieldCheck,
  Search,
  Check,
  X,
  Users,
  UtensilsCrossed,
  Home,
  Clock,
} from 'lucide-react';
import { dialog } from '../utils/dialog';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { AuthContext } from '../store/AuthContext';
import { useWorldTime } from '../utils/time';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { useTokenLockStatus } from '../utils/useTokenLockStatus';
import TokenLockManagerModal from './TokenLockManagerModal';
import { getTodayISTDate, getEffectiveStudentMealStatus, getActiveStudentException } from '../utils/studentExceptionService';

const SwitchButton = ({ number, block, isOn, onLeave, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      transition={{ type: 'spring', stiffness: 500, damping: 28 }}
      onClick={onClick}
      aria-label={`Token ${number}`}
      className={`
        relative group flex items-center justify-center flex-shrink-0
        w-10 h-10 xs:w-11 xs:h-11 min-[400px]:w-12 min-[400px]:h-12 sm:w-14 sm:h-14 aspect-square rounded-xl sm:rounded-2xl select-none font-extrabold
        text-xs min-[400px]:text-sm sm:text-base tracking-tight font-mono
        shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400/50
        ${
          block
            ? 'bg-gradient-to-b from-gray-700 to-gray-900 text-gray-300 border border-gray-600/40 shadow-inner'
            : onLeave
            ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-amber-500/25 hover:shadow-glow-amber border-2 border-amber-300'
            : isOn
            ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25 hover:shadow-glow-emerald border border-emerald-400/40'
            : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25 hover:shadow-glow-red border border-rose-400/40'
        }
      `}
    >
      {!block && (
        <span className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
      )}

      {block ? (
        <Lock className="w-4 h-4 text-gray-300" />
      ) : (
        <span className="relative z-10 leading-none">{number}</span>
      )}

      {/* Mini indicator dot / leave badge */}
      {onLeave ? (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-yellow-300 animate-pulse" />
      ) : (
        <span
          className={`absolute bottom-1 w-1 h-1 rounded-full ${
            block ? 'bg-gray-400' : isOn ? 'bg-white/80' : 'bg-white/60'
          }`}
        />
      )}
    </motion.button>
  );
};

function Admin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setStdata } = useContext(DataOfOne);
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const [documents, setDocuments] = useState([]);
  const [isLunch, setIsLunch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showLockManagerModal, setShowLockManagerModal] = useState(false);

  const {
    effectiveMode,
    isTomorrowLocked,
    activeWindow,
    startTime: lockStartTime,
    endTime: lockEndTime,
    saveLockConfig,
  } = useTokenLockStatus();

  const { dayShort } = useWorldTime('Asia/Kolkata');
  const [day, setDay] = useState('');

  useEffect(() => {
    if (location.state?.isLunch !== undefined) {
      setIsLunch(location.state.isLunch);
    }
  }, [location.state]);

  useEffect(() => {
    if (dayShort) setDay(dayShort);
  }, [dayShort]);

  const todayIST = getTodayISTDate();

  useEffect(() => {
    setLoading(true);

    const unsubStudents = firebase
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
          console.error('Error fetching admin data:', error);
          setLoading(false);
        }
      );

    return () => {
      unsubStudents();
    };
  }, []);

  const toggleBoardLock = async () => {
    if (!user) {
      navigate('/alogin');
      return;
    }
    feedback('tick');
    const isCurrentlyUnlocked = effectiveMode === 'force_unlocked';
    const nextMode = isCurrentlyUnlocked ? 'auto' : 'force_unlocked';

    const confirmed = await dialog.confirm({
      title: nextMode === 'force_unlocked' ? 'Emergency Unlock All Tokens?' : 'Revert to Scheduled Cutoffs?',
      message: nextMode === 'force_unlocked'
        ? 'Students will be allowed to update tokens for all dates 24/7, bypassing daily cutoffs.'
        : `Token updates will return to standard schedule (${lockStartTime} – ${lockEndTime} IST).`,
      icon: nextMode === 'force_unlocked' ? 'unlock' : 'lock',
      confirmColor: nextMode === 'force_unlocked' ? 'emerald' : 'amber',
      confirmText: nextMode === 'force_unlocked' ? 'Unlock Board' : 'Activate Schedule',
      cancelText: 'Cancel',
    });

    if (confirmed) {
      try {
        await saveLockConfig({
          overrideMode: nextMode,
          temporaryOverride: { active: false, mode: 'force_unlocked', expiresAt: null, reason: '' },
        });
        dialog.toast.success(
          nextMode === 'force_unlocked' ? 'Token Board Unlocked' : 'Standard Schedule Active',
          nextMode === 'force_unlocked'
            ? 'Students can now update tokens 24/7.'
            : `Token updates returned to standard cutoff window (${lockStartTime} – ${lockEndTime}).`
        );
      } catch (err) {
        console.error('Error toggling board:', err);
        dialog.alert({
          type: 'error',
          title: 'Update Failed',
          message: err.message || 'Could not update token board status.',
        });
      }
    }
  };

  const handleStudentSelect = (doc) => {
    feedback('tick');
    navigate(`/student-management?token=${doc.tokenNo}`);
  };

  // Compute live lunch and breakfast counts taking exceptions into account
  const { lunchCount, breakfastCount } = useMemo(() => {
    let l = 0;
    let b = 0;
    if (!day) return { lunchCount: 0, breakfastCount: 0 };

    documents.forEach((doc) => {
      if (!doc.block) {
        if (getEffectiveStudentMealStatus(doc, todayIST, day, 'lunch')) l++;
        if (getEffectiveStudentMealStatus(doc, todayIST, day, 'breakfast')) b++;
      }
    });

    return { lunchCount: l, breakfastCount: b };
  }, [documents, day, todayIST]);

  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      String(doc.tokenNo).includes(q) ||
      (doc.nameEn && doc.nameEn.toLowerCase().includes(q)) ||
      (doc.nameMl && doc.nameMl.toLowerCase().includes(q)) ||
      (doc.name && doc.name.toLowerCase().includes(q)) ||
      (doc.uname && doc.uname.toLowerCase().includes(q)) ||
      (doc.username && doc.username.toLowerCase().includes(q))
    );
  });

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
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      
      {/* Admin Action Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 sm:gap-4">
        
        {/* Board Cutoff & Lock Center Card */}
        <div className="md:col-span-5 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl flex flex-col justify-between gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
                <h2 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
                  Token Cutoff & Locking
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {effectiveMode === 'force_unlocked'
                  ? 'Board is UNLOCKED (Open 24/7 for all dates)'
                  : effectiveMode === 'force_locked'
                  ? 'EMERGENCY FREEZE (All updates suspended)'
                  : `Schedule Active (${lockStartTime} – ${lockEndTime}) • Tomorrow is ${!isTomorrowLocked ? 'Open' : 'Locked'}`}
              </p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={() => {
                  feedback('tick');
                  setShowLockManagerModal(true);
                }}
                className="p-2 sm:p-2.5 rounded-xl bg-gray-100 hover:bg-emerald-50 dark:bg-white/5 dark:hover:bg-emerald-950/30 text-gray-700 dark:text-gray-300 hover:text-emerald-600 transition-colors"
                title="Configure Cutoff Window, Schedule & Timers"
              >
                <Sliders className="w-4 h-4" />
              </button>

              <button
                onClick={toggleBoardLock}
                className={`px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-xl flex items-center gap-1.5 font-bold text-xs shadow-md transition-all transform active:scale-95 ${
                  effectiveMode === 'force_unlocked'
                    ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
                    : effectiveMode === 'force_locked'
                    ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/25'
                    : 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/25'
                }`}
              >
                {effectiveMode === 'force_unlocked' ? (
                  <>
                    <Unlock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Unlocked</span>
                  </>
                ) : effectiveMode === 'force_locked' ? (
                  <>
                    <Lock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Frozen</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span>Auto ({!isTomorrowLocked ? 'Open' : 'Cutoff'})</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-white/5 text-[11px] font-semibold text-gray-500 dark:text-gray-400">
            <span>
              Window: <b>{lockStartTime} – {lockEndTime}</b>
            </span>
            <button
              type="button"
              onClick={() => {
                feedback('tick');
                setShowLockManagerModal(true);
              }}
              className="text-emerald-600 dark:text-emerald-400 hover:underline font-bold"
            >
              Edit Window & Rules →
            </button>
          </div>
        </div>

        {/* Meal View & Management Links */}
        <div className="md:col-span-7 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl sm:rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          
          {/* Meal Toggle with active pills and live counts */}
          <div className="flex w-full sm:w-auto p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 relative">
            <button
              onClick={() => {
                feedback('pop');
                setIsLunch(true);
              }}
              className={`flex-1 sm:flex-none relative flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition-all ${
                isLunch
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {isLunch && (
                <motion.div
                  layoutId="adminActiveMealPill"
                  className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-green-600 rounded-xl shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Utensils className="w-3.5 h-3.5 relative z-10 shrink-0" />
              <span className="relative z-10">Lunch</span>
              <span className="relative z-10 px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-bold">
                {lunchCount}
              </span>
            </button>

            <button
              onClick={() => {
                feedback('pop');
                setIsLunch(false);
              }}
              className={`flex-1 sm:flex-none relative flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs transition-all ${
                !isLunch
                  ? 'text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {!isLunch && (
                <motion.div
                  layoutId="adminActiveMealPill"
                  className="absolute inset-0 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl shadow-md"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Coffee className="w-3.5 h-3.5 relative z-10 shrink-0" />
              <span className="relative z-10">Breakfast</span>
              <span className="relative z-10 px-1.5 py-0.2 rounded-md bg-white/20 text-[10px] font-bold">
                {breakfastCount}
              </span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                feedback('tick');
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
              title="Go to Public Home (/)"
            >
              <Home className="w-3.5 h-3.5 text-emerald-500" />
              <span>Home</span>
            </button>

            <button
              onClick={() => {
                feedback('tick');
                navigate('/student-management');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Students</span>
            </button>

            <button
              onClick={() => {
                feedback('tick');
                navigate('/admin/menu');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
            >
              <Utensils className="w-3.5 h-3.5 text-emerald-500" />
              <span>Food Menu</span>
            </button>

            <button
              onClick={() => {
                feedback('tick');
                navigate('/admin/dietary');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
            >
              <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" />
              <span>Dietary</span>
            </button>

            <div className="relative w-full sm:w-auto">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Token or name..."
                className="w-full sm:w-40 md:w-44 pl-8 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Token Matrix */}
      <div className="rounded-2xl sm:rounded-3xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 p-3 sm:p-6 shadow-sm backdrop-blur-xl">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center sm:text-left">
          Click on any student token below to edit individual preferences or lock/unlock their account.
        </p>

        <div className="flex flex-wrap justify-center gap-2 min-[380px]:gap-2.5 sm:gap-3">
          {filteredDocuments.map((doc) => {
            const hasDateExc = Boolean(
              getActiveStudentException(doc, todayIST, isLunch ? 'lunch' : 'breakfast')
            );
            const isOn = getEffectiveStudentMealStatus(
              doc,
              todayIST,
              day,
              isLunch ? 'lunch' : 'breakfast'
            );
            return (
              <SwitchButton
                key={doc.id || doc.tokenNo}
                number={doc.tokenNo}
                block={Boolean(doc.block)}
                isOn={isOn}
                onLeave={hasDateExc}
                onClick={() => handleStudentSelect(doc)}
              />
            );
          })}
        </div>
      </div>

      {/* Token Lock & Cutoff Schedule Manager Modal */}
      <TokenLockManagerModal
        isOpen={showLockManagerModal}
        onClose={() => setShowLockManagerModal(false)}
      />
    </div>
  );
}

export default Admin;
