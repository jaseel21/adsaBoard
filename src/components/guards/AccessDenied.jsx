import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, ArrowRight, Lock, LogOut } from 'lucide-react';
import { AuthContext } from '../../store/AuthContext';
import { ROLE_LABELS, getRoleBadgeInfo } from '../../utils/rbac';
import { useFeedback } from '../../utils/useFeedback';

export default function AccessDenied({ allowedRoles = [] }) {
  const navigate = useNavigate();
  const { user, role, homeRoute, logoutAdmin } = useContext(AuthContext);
  const { feedback } = useFeedback();

  const userBadge = getRoleBadgeInfo(role);
  const allowedNames = allowedRoles
    .map((r) => ROLE_LABELS[r] || r)
    .join(' or ');

  return (
    <div className="flex-1 flex items-center justify-center p-3 xs:p-4 sm:p-6 min-h-[calc(100dvh-8rem)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-lg rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-[#0f1715]/95 border border-rose-200 dark:border-rose-500/20 shadow-2xl p-5 xs:p-6 sm:p-8 space-y-6 backdrop-blur-xl text-center"
      >
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-rose-500 to-red-600 text-white flex items-center justify-center shadow-lg shadow-rose-500/20">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border border-rose-300 dark:border-rose-600/30 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300">
            <Lock className="w-3.5 h-3.5" />
            <span>403 Restricted Access</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-gray-900 dark:text-white">
            Access Level Insufficient
          </h1>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed max-w-md mx-auto">
            This administrative area requires elevated permissions. Your account does not have authorization to view or modify this console.
          </p>
        </div>

        {/* Role Diagnostic Card */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-left space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-semibold">Your Active Role:</span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${userBadge.badgeClass}`}>
              {userBadge.label}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400 font-semibold">Signed In Email:</span>
            <span className="font-mono text-gray-800 dark:text-gray-200 font-bold truncate max-w-[200px]">
              {user?.email || 'Authenticated User'}
            </span>
          </div>

          <div className="pt-2 border-t border-gray-200/60 dark:border-white/10 text-xs">
            <span className="text-gray-500 dark:text-gray-400 block font-semibold mb-1">
              Authorized Roles For This Area:
            </span>
            <span className="font-semibold text-rose-600 dark:text-rose-400">
              {allowedNames || 'Restricted Committee'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={() => {
              feedback('tick');
              navigate(homeRoute || '/');
            }}
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-sm shadow-md shadow-emerald-500/20 transition-all transform active:scale-95"
          >
            <span>Proceed to Your Designated Console</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                feedback('tick');
                navigate('/');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white transition-colors py-1.5 px-3 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Public Home</span>
            </button>

            <span className="text-gray-300 dark:text-white/20">•</span>

            <button
              onClick={async () => {
                feedback('tick');
                await logoutAdmin();
                navigate('/alogin');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors py-1.5 px-3 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Switch Account</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
