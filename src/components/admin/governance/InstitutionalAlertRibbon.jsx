import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Lock, AlertTriangle, X } from 'lucide-react';
import { useMasterGovernance } from '../../../store/MasterGovernanceContext';

export default function InstitutionalAlertRibbon() {
  const {
    isEmergencyMealOverrideActive,
    emergencyMealOverrideNote,
    isReadOnlyLockdown,
  } = useMasterGovernance();

  if (!isEmergencyMealOverrideActive && !isReadOnlyLockdown) {
    return null;
  }

  return (
    <div className="w-full relative z-40">
      {/* Emergency Meal Override Ribbon */}
      {isEmergencyMealOverrideActive && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gradient-to-r from-emerald-600 via-teal-600 to-green-700 text-white px-4 py-2 text-xs font-bold shadow-md flex items-center justify-between border-b border-emerald-400/30"
        >
          <div className="flex items-center gap-2 mx-auto text-center flex-wrap justify-center">
            <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
            <Zap className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span className="uppercase tracking-wider font-extrabold text-[11px] bg-black/20 px-2 py-0.5 rounded-full">
              Central Committee Override
            </span>
            <span>
              All meal cutoff locks are temporarily suspended
              {emergencyMealOverrideNote ? ` — ${emergencyMealOverrideNote}` : ''}. Tokens can be toggled freely.
            </span>
          </div>
        </motion.div>
      )}

      {/* Read-Only Lockdown Ribbon */}
      {isReadOnlyLockdown && !isEmergencyMealOverrideActive && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white px-4 py-2 text-xs font-bold shadow-md flex items-center justify-between border-b border-amber-400/30"
        >
          <div className="flex items-center gap-2 mx-auto text-center flex-wrap justify-center">
            <Lock className="w-3.5 h-3.5 text-white shrink-0" />
            <span className="uppercase tracking-wider font-extrabold text-[11px] bg-black/20 px-2 py-0.5 rounded-full">
              Read-Only Lockdown
            </span>
            <span>
              Institutional token modifications are temporarily frozen for system audit.
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
