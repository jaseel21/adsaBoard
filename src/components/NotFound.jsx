import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Compass,
  ArrowLeft,
  Home,
  UtensilsCrossed,
  KeyRound,
  ShieldCheck,
  Search,
  Sparkles,
} from 'lucide-react';
import { useFeedback } from '../utils/useFeedback';

export default function NotFound() {
  const navigate = useNavigate();
  const { feedback } = useFeedback();

  const handleGoBack = () => {
    feedback('tick');
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  const handleNav = (path) => {
    feedback('pop');
    navigate(path);
  };

  return (
    <div className="relative min-h-[85vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 overflow-hidden">
      {/* Radiant ambient glow orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/15 dark:bg-emerald-500/20 blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-teal-500/10 dark:bg-teal-500/15 blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl w-full text-center space-y-8">
        
        {/* Animated 404 Badge & Floating Radar */}
        <div className="relative inline-block">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="relative"
          >
            {/* Giant Stylized 404 Display */}
            <span className="text-8xl sm:text-9xl font-black font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-emerald-600 via-teal-500 to-green-700 dark:from-emerald-400 dark:via-teal-300 dark:to-green-500 select-none drop-shadow-sm">
              404
            </span>

            {/* Floating Compass / Radar Icon */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -top-3 -right-3 sm:-top-4 sm:-right-4 w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white dark:bg-[#121c19] border border-emerald-300/60 dark:border-emerald-500/30 shadow-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400"
            >
              <Compass className="w-6 h-6 sm:w-7 sm:h-7 animate-spin-slow" />
            </motion.div>
          </motion.div>
        </div>

        {/* Text Header */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="space-y-3"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
            <span>Page Relocated or Not Found</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Lost in the Canteen Corridors?
          </h1>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300 max-w-lg mx-auto leading-relaxed">
            The page, meal menu, or token record you are looking for is unavailable or has moved to a new hall.
          </p>
        </motion.div>

        {/* Quick Navigational Hub Cards */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left"
        >
          {/* Card 1: Home Token Board */}
          <button
            onClick={() => handleNav('/')}
            className="group p-4 rounded-2xl bg-white/80 dark:bg-[#121c19]/90 border border-gray-200/80 dark:border-white/10 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <Home className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 dark:text-white block group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Token Board Matrix
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                Live tokens & meal counts
              </span>
            </div>
          </button>

          {/* Card 2: Food Menu */}
          <button
            onClick={() => handleNav('/menu')}
            className="group p-4 rounded-2xl bg-white/80 dark:bg-[#121c19]/90 border border-gray-200/80 dark:border-white/10 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 dark:text-white block group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Canteen Menu
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                Weekly dishes & timings
              </span>
            </div>
          </button>

          {/* Card 3: Student Portal */}
          <button
            onClick={() => handleNav('/login')}
            className="group p-4 rounded-2xl bg-white/80 dark:bg-[#121c19]/90 border border-gray-200/80 dark:border-white/10 shadow-sm hover:border-emerald-500/50 hover:shadow-md transition-all flex flex-col justify-between text-left"
          >
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-950/50 text-teal-600 dark:text-teal-400 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-900 dark:text-white block group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                Student Portal
              </span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5 block">
                Update meal reservations
              </span>
            </div>
          </button>
        </motion.div>

        {/* Primary Action Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2"
        >
          <button
            onClick={handleGoBack}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back to Previous Page</span>
          </button>

          <button
            onClick={() => handleNav('/')}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-lg shadow-emerald-600/25 transition-all transform active:scale-95"
          >
            <Home className="w-4 h-4" />
            <span>Return to Main Board</span>
          </button>
        </motion.div>

        {/* Security / System Footer Note */}
        <div className="pt-6 border-t border-gray-200/60 dark:border-white/5 flex items-center justify-center gap-1.5 text-xs text-gray-400">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>Alathurpadi Dars Students Association (ADSA) • Official Token System</span>
        </div>
      </div>
    </div>
  );
}
