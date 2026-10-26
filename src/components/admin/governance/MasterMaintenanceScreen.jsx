import React from 'react';
import { motion } from 'framer-motion';
import { Wrench, ShieldAlert, Lock, ArrowRight, RefreshCw, PhoneCall, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function MasterMaintenanceScreen({ message }) {
  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 bg-[#060a08] text-gray-100 relative overflow-hidden select-none">
      {/* Background cyber grid & radiant orbs */}
      <div className="absolute inset-0 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px] opacity-10 pointer-events-none" />
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative z-10 max-w-lg w-full bg-[#0d1512]/90 border border-emerald-500/30 rounded-3xl p-6 sm:p-10 shadow-2xl backdrop-blur-2xl text-center space-y-6"
      >
        {/* Animated Badge Icon */}
        <div className="relative mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 flex items-center justify-center shadow-lg shadow-emerald-500/15">
          <Wrench className="w-10 h-10 text-emerald-400 animate-pulse" />
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 animate-ping" />
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-black" />
        </div>

        {/* Titles */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
            <ShieldAlert className="w-3.5 h-3.5" />
            Institutional Dining System Standby
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Under Scheduled Maintenance
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
            {message ||
              'ADSA T-Board is currently undergoing essential scheduled database maintenance and optimization. Dining services and token selections will resume shortly.'}
          </p>
        </div>

        {/* Real-time Retry Button */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={handleRefresh}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Check System Status
          </button>

          <Link
            to="/alogin"
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/15 text-gray-200 border border-white/10 flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <Lock className="w-3.5 h-3.5 text-cyan-400" />
            Staff Authorization
          </Link>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-white/10 text-[11px] text-gray-500 flex items-center justify-center gap-2">
          <span>Jamia Nooriya Islamic Canteen Board</span>
          <span>•</span>
          <Link to="/support" className="text-emerald-400 hover:underline">
            Support Desk
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
