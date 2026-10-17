import React, { useEffect, useState, useContext } from 'react';
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
} from 'lucide-react';
import Swal from 'sweetalert2';
import firebase from '../firebase/config';
import { DataOfOne } from '../store/StudentData';
import { AuthContext } from '../store/AuthContext';
import { useWorldTime } from '../utils/time';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';

const SwitchButton = ({ number, block, isOn, onClick }) => {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className={`
        relative flex items-center justify-center flex-shrink-0
        w-11 h-11 min-[380px]:w-12 min-[380px]:h-12 sm:w-14 sm:h-14 aspect-square rounded-2xl select-none font-extrabold
        text-xs min-[380px]:text-sm sm:text-base tracking-tight font-mono
        shadow-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-emerald-400/50
        ${
          block
            ? 'bg-gradient-to-b from-gray-700 to-gray-900 text-gray-300 border border-gray-600/40 shadow-inner'
            : isOn
            ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-emerald-500/25 border border-emerald-400/40'
            : 'bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-rose-500/25 border border-rose-400/40'
        }
      `}
    >
      {block ? <Lock className="w-4 h-4 text-gray-300" /> : <span className="leading-none">{number}</span>}
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
  const [isChecked, setIsChecked] = useState(false);
  const [isLunch, setIsLunch] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

        const doc = await firebase
          .firestore()
          .collection('tokenboard')
          .doc('g8iJVNn2RQkysjMAvX1h')
          .get();
        if (doc.exists) {
          setIsChecked(Boolean(doc.data().status));
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleBoardLock = () => {
    if (!user) {
      navigate('/alogin');
      return;
    }
    feedback('tick');
    const nextStatus = !isChecked;

    Swal.fire({
      title: nextStatus ? 'Unlock Token Board?' : 'Lock Token Board?',
      text: nextStatus
        ? 'Students will be allowed to update tokens outside normal cutoff hours.'
        : 'Token updates will revert to strict standard schedule.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: nextStatus ? '#10b981' : '#ef4444',
      confirmButtonText: nextStatus ? 'Unlock Board' : 'Lock Board',
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await firebase
            .firestore()
            .collection('tokenboard')
            .doc('g8iJVNn2RQkysjMAvX1h')
            .set({ status: nextStatus }, { merge: true });
          setIsChecked(nextStatus);
          feedback('success');
        } catch (err) {
          console.error('Error toggling board:', err);
        }
      }
    });
  };

  const handleStudentSelect = async (doc) => {
    feedback('tick');
    const studentData = { ...doc, documentId: doc.id, isLunch };
    setStdata(studentData);
    navigate('/astudent-port');
  };

  const filteredDocuments = documents.filter((doc) => {
    if (!searchQuery.trim()) return true;
    return (
      String(doc.tokenNo).includes(searchQuery.trim()) ||
      (doc.uname && doc.uname.toLowerCase().includes(searchQuery.toLowerCase().trim()))
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Admin Action Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Board Lock Control */}
        <div className="md:col-span-5 p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Master Board Override
              </h2>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {isChecked
                ? 'Board is UNLOCKED (open 24/7 for updates)'
                : 'Board is LOCKED to standard schedule (2 PM - 11 PM)'}
            </p>
          </div>

          <button
            onClick={toggleBoardLock}
            className={`p-3.5 rounded-2xl flex items-center gap-2 font-bold text-xs shadow-md transition-all transform active:scale-95 ${
              isChecked
                ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/25'
                : 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/25'
            }`}
          >
            {isChecked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            <span>{isChecked ? 'Unlocked' : 'Locked'}</span>
          </button>
        </div>

        {/* Meal View & Management Links */}
        <div className="md:col-span-7 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 p-5 rounded-3xl bg-white/80 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm backdrop-blur-xl">
          
          {/* Meal Toggle */}
          <div className="flex p-1 rounded-2xl bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10">
            <button
              onClick={() => {
                feedback('pop');
                setIsLunch(true);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isLunch
                  ? 'bg-emerald-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <Utensils className="w-3.5 h-3.5" />
              <span>Lunch</span>
            </button>

            <button
              onClick={() => {
                feedback('pop');
                setIsLunch(false);
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                !isLunch
                  ? 'bg-amber-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Breakfast</span>
            </button>
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
            <button
              onClick={() => {
                feedback('tick');
                navigate('/student-management');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md transition-all"
            >
              <Users className="w-3.5 h-3.5" />
              <span>Students Console</span>
            </button>

            <button
              onClick={() => {
                feedback('tick');
                navigate('/m-tokens');
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/15 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Range</span>
            </button>

            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Token or name..."
                className="w-36 sm:w-44 pl-8 pr-3 py-2 rounded-xl bg-gray-50 dark:bg-[#15221e] border border-gray-200/80 dark:border-white/10 text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Token Matrix */}
      <div className="rounded-3xl bg-white/70 dark:bg-[#0f1715]/70 border border-gray-200/80 dark:border-white/10 p-4 sm:p-6 shadow-sm backdrop-blur-xl">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 text-center sm:text-left">
          Click on any student token below to edit individual preferences or lock/unlock their account.
        </p>

        <div className="flex flex-wrap justify-center gap-2 min-[380px]:gap-2.5 sm:gap-3">
          {filteredDocuments.map((doc) => {
            const isOn = Boolean(
              isLunch ? doc.obj?.lunch?.[day] : doc.obj?.breakfast?.[day]
            );
            return (
              <SwitchButton
                key={doc.id || doc.tokenNo}
                number={doc.tokenNo}
                block={Boolean(doc.block)}
                isOn={isOn}
                onClick={() => handleStudentSelect(doc)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Admin;
