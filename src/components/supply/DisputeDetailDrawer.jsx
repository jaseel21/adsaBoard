import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Calendar,
  Clock,
  ShieldCheck,
  ShieldAlert,
  Utensils,
  Heart,
  Phone,
  AlertCircle,
} from 'lucide-react';
import IslamicAvatar from '../ui/IslamicAvatar';
import { getEffectiveStudentMealStatus } from '../../utils/studentExceptionService';

const DAY_LABELS = {
  su: 'Sunday',
  mo: 'Monday',
  tu: 'Tuesday',
  we: 'Wednesday',
  th: 'Thursday',
  fr: 'Friday',
  sa: 'Saturday',
};

export default function DisputeDetailDrawer({
  isOpen,
  onClose,
  student,
  meal = 'lunch',
  targetDateIST,
  effectiveDay,
  onOpenGraceModal,
}) {
  if (!isOpen || !student) return null;

  const isEligibleToday = getEffectiveStudentMealStatus(
    student,
    targetDateIST,
    effectiveDay,
    meal
  );

  const routine = student.obj || {};
  const dietary = student.obj2 || {};
  const dateExceptions = student.dateExceptions || {};

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 26, stiffness: 260 }}
        className="w-full max-w-lg h-full bg-white dark:bg-[#0c1411] border-l border-gray-200 dark:border-emerald-900/40 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto shadow-2xl"
      >
        <div className="space-y-6">
          {/* HEADER */}
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-emerald-900/30">
            <div className="flex items-center space-x-3">
              <IslamicAvatar student={student} size="md" showStatusRing={false} />
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Token #{student.tokenNo}
                </h3>
                <p className="text-xs text-gray-500">{student.batch || 'Dars Student'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* NAME & CONTACT */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-[#060a08] border border-gray-200 dark:border-emerald-900/40 space-y-1.5">
            <div className="text-sm font-bold text-gray-900 dark:text-white">
              {student.uname || student.name}
            </div>
            {student.phone && (
              <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                <Phone className="w-3.5 h-3.5" />
                <span>{student.phone}</span>
              </div>
            )}
            <div className="pt-2 flex items-center space-x-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  isEligibleToday
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {isEligibleToday ? 'Token Active Today' : 'Token Inactive / Avoider Today'}
              </span>
              {student.block && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-600 text-white">
                  Blocked
                </span>
              )}
            </div>
          </div>

          {/* STANDARD WEEKLY ROUTINE */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center space-x-1.5">
              <Calendar className="w-4 h-4" />
              <span>Standard Weekly Routine</span>
            </h4>
            <div className="grid grid-cols-7 gap-1.5 text-center text-xs">
              {['su', 'mo', 'tu', 'we', 'th', 'fr', 'sa'].map((day) => {
                const bfOn = routine.breakfast?.[day] !== false;
                const lnOn = routine.lunch?.[day] !== false;
                const isCurrent = day === effectiveDay;
                return (
                  <div
                    key={day}
                    className={`p-2 rounded-xl border flex flex-col items-center space-y-1 ${
                      isCurrent
                        ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/40 font-bold'
                        : 'border-gray-200 dark:border-emerald-900/30 bg-gray-50 dark:bg-[#070b09]'
                    }`}
                  >
                    <span className="uppercase font-mono text-[10px] text-gray-400">{day}</span>
                    <span
                      className={`text-[10px] px-1 py-0.5 rounded font-mono ${
                        bfOn ? 'text-emerald-600' : 'text-gray-400 line-through'
                      }`}
                      title={`Breakfast: ${bfOn ? 'ON' : 'OFF'}`}
                    >
                      Bf
                    </span>
                    <span
                      className={`text-[10px] px-1 py-0.5 rounded font-mono ${
                        lnOn ? 'text-emerald-600' : 'text-rose-500 line-through font-bold'
                      }`}
                      title={`Lunch: ${lnOn ? 'ON' : 'OFF'}`}
                    >
                      Ln
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* DATE EXCEPTIONS SCHEDULED */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center space-x-1.5">
              <Clock className="w-4 h-4" />
              <span>Active Date Overrides / Leave</span>
            </h4>
            {Object.keys(dateExceptions).length === 0 ? (
              <p className="text-xs text-gray-400 italic">No scheduled date exceptions.</p>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {Object.entries(dateExceptions).map(([dateStr, exc]) => (
                  <div
                    key={dateStr}
                    className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                      dateStr === targetDateIST
                        ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold'
                        : 'border-gray-200 dark:border-emerald-900/20 text-gray-600 dark:text-gray-300'
                    }`}
                  >
                    <div>
                      <span className="font-mono">{dateStr}</span>
                      {exc.label && <span className="opacity-80 ml-2">({exc.label})</span>}
                    </div>
                    <div className="space-x-1 font-mono text-[10px]">
                      <span>Bf: {exc.breakfast ? 'ON' : 'OFF'}</span>
                      <span>Ln: {exc.lunch ? 'ON' : 'OFF'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* DIETARY PREFERENCES */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Dietary Allowances
            </h4>
            <div className="flex flex-wrap gap-2 text-xs">
              {['fish', 'beef', 'chicken', 'mutton'].map((meatKey) => {
                const isAllowed = dietary[meatKey] !== false;
                return (
                  <span
                    key={meatKey}
                    className={`px-3 py-1 rounded-xl font-medium capitalize flex items-center space-x-1.5 ${
                      isAllowed
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 line-through'
                    }`}
                  >
                    <span>{meatKey}</span>
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION */}
        <div className="pt-6 border-t border-gray-100 dark:border-emerald-900/30 flex items-center space-x-3">
          <button
            onClick={() => {
              onClose();
              onOpenGraceModal(student.tokenNo, student);
            }}
            className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center space-x-2"
          >
            <Heart className="w-4 h-4" />
            <span>Issue Grace Plate</span>
          </button>
          <button
            onClick={onClose}
            className="py-3.5 px-6 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-xs"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
}
