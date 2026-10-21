import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Vibrate,
  VibrateOff,
  Sparkles,
  Lock,
  Unlock,
  Check,
  X,
  RotateCcw,
  CalendarDays,
  ExternalLink,
  HelpCircle,
  Coffee,
  Utensils,
  CheckCircle2,
} from 'lucide-react';
import { useFeedback } from '../../utils/useFeedback';
import { guideStaggerVariants, guideItemVariants } from './guideAnimations';

const INITIAL_SIMULATOR_TOKENS = [
  {
    tokenNo: '07',
    nameEn: 'Ahmad Bilal',
    nameMl: 'അഹ്മദ് ബിലാൽ',
    batch: 'Batch 7 (2026)',
    username: 'ahmad_07',
    state: 'active', // 'active' | 'skipped' | 'leave' | 'blocked'
    dietary: ['No Beef'],
    reason: 'Active Order confirmed from standard weekly schedule.',
  },
  {
    tokenNo: '42',
    nameEn: 'Muhammed Anas',
    nameMl: 'മുഹമ്മദ് അനസ്',
    batch: 'Batch 6 (2025)',
    username: 'anas_42',
    state: 'skipped',
    dietary: [],
    reason: 'Skipped for this meal slot (Routine opt-out).',
  },
  {
    tokenNo: '108',
    nameEn: 'Salman Faris',
    nameMl: 'സൽമാൻ ഫാരിസ്',
    batch: 'Batch 4 (2023)',
    username: 'salman_108',
    state: 'leave',
    dietary: ['No Fish'],
    reason: 'Single-Day Leave Exception applied specifically for today.',
  },
  {
    tokenNo: '189',
    nameEn: 'Zuhair Rahman',
    nameMl: 'സുഹൈർ റഹ്മാൻ',
    batch: 'Batch 1 (2020)',
    username: 'zuhair_189',
    state: 'blocked',
    dietary: [],
    reason: 'Account locked by committee administration.',
  },
];

const TokenSimulator = () => {
  const { feedback, soundEnabled, setSoundEnabled, hapticsEnabled, setHapticsEnabled } = useFeedback();
  const [tokens, setTokens] = useState(INITIAL_SIMULATOR_TOKENS);
  const [selectedTokenNo, setSelectedTokenNo] = useState('07');
  const [simulatedMeal, setSimulatedMeal] = useState('breakfast');
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  const selectedToken = tokens.find((t) => t.tokenNo === selectedTokenNo) || tokens[0];

  const handleTokenClick = (tok) => {
    setSelectedTokenNo(tok.tokenNo);
    if (tok.state === 'active') {
      feedback('tick');
    } else if (tok.state === 'skipped') {
      feedback('pop');
    } else if (tok.state === 'leave') {
      feedback('success');
    } else {
      feedback('warning');
    }
  };

  const updateSelectedState = (newState) => {
    setTokens((prev) =>
      prev.map((t) => {
        if (t.tokenNo === selectedTokenNo) {
          let reason = '';
          if (newState === 'active') reason = 'User toggled: confirmed dining active.';
          else if (newState === 'skipped') reason = 'User toggled: meal skipped.';
          else if (newState === 'leave') reason = 'User toggled: Single-Day temporary leave exception.';
          else if (newState === 'blocked') reason = 'User toggled: Committee security lock.';
          return { ...t, state: newState, reason };
        }
        return t;
      })
    );

    if (newState === 'active') feedback('tick');
    else if (newState === 'skipped') feedback('pop');
    else if (newState === 'leave') feedback('success');
    else feedback('warning');
  };

  const resetSimulator = () => {
    setTokens(INITIAL_SIMULATOR_TOKENS);
    setSelectedTokenNo('07');
    feedback('light');
  };

  return (
    <motion.div
      variants={guideStaggerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Sandbox Header with Sensory Toggles */}
      <motion.div
        variants={guideItemVariants}
        className="p-5 rounded-3xl bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center flex-shrink-0 shadow-inner">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
              Tactile Live Sandbox Simulator
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Interactive sandbox with live spring physics, sound synthesis, and mobile haptics.
            </p>
          </div>
        </div>

        {/* Sensory Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const next = !soundEnabled;
              setSoundEnabled(next);
              if (next) feedback('tick');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              soundEnabled
                ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-gray-100 dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/10'
            }`}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
            <span>Sound {soundEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={() => {
              const next = !hapticsEnabled;
              setHapticsEnabled(next);
              if (next) feedback('tick');
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all ${
              hapticsEnabled
                ? 'bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/30'
                : 'bg-gray-100 dark:bg-white/5 text-gray-400 border-gray-200 dark:border-white/10'
            }`}
          >
            {hapticsEnabled ? <Vibrate className="w-3.5 h-3.5" /> : <VibrateOff className="w-3.5 h-3.5" />}
            <span>Haptics {hapticsEnabled ? 'ON' : 'OFF'}</span>
          </button>

          <button
            onClick={resetSimulator}
            className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Reset sandbox"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Token Sandbox Grid */}
        <motion.div
          variants={guideItemVariants}
          className="lg:col-span-7 p-6 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm space-y-6"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
              Interactive Sample Tokens (Click to select & test)
            </span>
            <div className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-white/5 text-xs font-bold">
              <button
                onClick={() => {
                  feedback('tick');
                  setSimulatedMeal('breakfast');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  simulatedMeal === 'breakfast'
                    ? 'bg-white dark:bg-[#1a2521] text-amber-600 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Breakfast
              </button>
              <button
                onClick={() => {
                  feedback('tick');
                  setSimulatedMeal('lunch');
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  simulatedMeal === 'lunch'
                    ? 'bg-white dark:bg-[#1a2521] text-emerald-600 shadow-sm'
                    : 'text-gray-500'
                }`}
              >
                Lunch
              </button>
            </div>
          </div>

          {/* Tokens Array */}
          <div className="flex flex-wrap items-center justify-center gap-4 py-4 bg-gray-50/60 dark:bg-white/[0.02] rounded-2xl border border-dashed border-gray-200 dark:border-white/10">
            {tokens.map((tok) => {
              const isSelected = tok.tokenNo === selectedTokenNo;
              const isBlocked = tok.state === 'blocked';
              const onLeave = tok.state === 'leave';
              const isOn = tok.state === 'active';

              return (
                <div key={tok.tokenNo} className="flex flex-col items-center gap-1.5">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleTokenClick(tok)}
                    className={`
                      w-14 h-14 aspect-square rounded-2xl font-mono font-extrabold text-base select-none relative shadow-sm transition-all focus:outline-none cursor-pointer
                      ${
                        isSelected
                          ? 'ring-4 ring-emerald-500/40 ring-offset-2 dark:ring-offset-[#0f1715]'
                          : ''
                      }
                      ${
                        isBlocked
                          ? 'bg-gradient-to-b from-gray-700 to-gray-900 text-gray-300 border border-gray-600/40'
                          : onLeave
                          ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white border-2 border-amber-300 shadow-amber-500/25'
                          : isOn
                          ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white border border-emerald-400/40 shadow-emerald-500/25'
                          : 'bg-gradient-to-br from-rose-500 to-red-600 text-white border border-rose-400/40 shadow-rose-500/25'
                      }
                    `}
                  >
                    {onLeave && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-yellow-300 animate-pulse border border-orange-500" />
                    )}

                    {isBlocked ? (
                      <Lock className="w-4 h-4 mx-auto text-gray-300" />
                    ) : (
                      <span>{tok.tokenNo}</span>
                    )}

                    <span
                      className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                        isBlocked ? 'bg-gray-400' : 'bg-white/70'
                      }`}
                    />
                  </motion.button>
                  <span className="text-[10px] font-bold text-gray-500 uppercase">
                    #{tok.tokenNo}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Sandbox State Switcher Buttons */}
          <div className="space-y-2 pt-2 border-t border-gray-100 dark:border-white/5">
            <span className="text-xs font-bold text-gray-500 block">
              Mutate Selected Token (#{selectedToken.tokenNo}):
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => updateSelectedState('active')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedToken.state === 'active'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Active (ON)</span>
              </button>

              <button
                onClick={() => updateSelectedState('skipped')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedToken.state === 'skipped'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <X className="w-3.5 h-3.5" />
                <span>Skipped (OFF)</span>
              </button>

              <button
                onClick={() => updateSelectedState('leave')}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedToken.state === 'leave'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>1-Day Leave</span>
              </button>

              <button
                onClick={() =>
                  updateSelectedState(selectedToken.state === 'blocked' ? 'active' : 'blocked')
                }
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                  selectedToken.state === 'blocked'
                    ? 'bg-gray-800 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{selectedToken.state === 'blocked' ? 'Unblock' : 'Block'}</span>
              </button>
            </div>
          </div>
        </motion.div>

        {/* Live Inspector Preview Card */}
        <motion.div
          variants={guideItemVariants}
          className="lg:col-span-5 p-6 rounded-3xl bg-white/90 dark:bg-[#0f1715]/90 border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col justify-between space-y-4"
        >
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                Sandbox Inspector
              </span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  selectedToken.state === 'active'
                    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                    : selectedToken.state === 'skipped'
                    ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30'
                    : selectedToken.state === 'leave'
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                    : 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border border-gray-500/30'
                }`}
              >
                {selectedToken.state}
              </span>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-mono font-black text-xl shadow-md">
                {selectedToken.tokenNo}
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm text-gray-900 dark:text-white truncate">
                  {selectedToken.nameEn}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 font-malayalam truncate">
                  {selectedToken.nameMl}
                </p>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                  @{selectedToken.username} • {selectedToken.batch}
                </span>
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-xs space-y-1.5">
              <span className="font-bold text-gray-700 dark:text-gray-200 block">
                Calculated Rationale:
              </span>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {selectedToken.reason}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              feedback('tick');
              setPreviewModalOpen(true);
            }}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold text-xs shadow-md hover:from-emerald-500 hover:to-teal-600 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Launch Mock Student Details Modal</span>
          </button>
        </motion.div>
      </div>

      {/* Mock Details Modal for Sandbox */}
      <AnimatePresence>
        {previewModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl"
            onClick={() => setPreviewModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200 dark:border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="bg-gradient-to-r from-emerald-600 to-teal-800 p-5 text-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center font-mono font-black text-lg">
                    {selectedToken.tokenNo}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm">{selectedToken.nameEn}</h3>
                    <p className="text-xs text-emerald-100 font-malayalam">{selectedToken.nameMl}</p>
                  </div>
                </div>
                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4 text-xs">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-500/20">
                  <span className="font-bold text-emerald-800 dark:text-emerald-300 block">
                    Weekly Routine Preview
                  </span>
                  <div className="grid grid-cols-7 gap-1 mt-2 text-center font-bold">
                    {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                      <div
                        key={i}
                        className={`py-1 rounded-lg ${
                          i % 2 === 0 ? 'bg-emerald-600 text-white' : 'bg-rose-500/20 text-rose-600'
                        }`}
                      >
                        {d}
                      </div>
                    ))}
                  </div>
                </div>

                <p className="text-gray-500 dark:text-gray-400 text-center text-[11px]">
                  This is the exact high-fidelity inspection dialog that opens when students or staff tap any token on the live board.
                </p>

                <button
                  onClick={() => setPreviewModalOpen(false)}
                  className="w-full py-2 rounded-xl bg-gray-100 dark:bg-white/5 font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors"
                >
                  Close Mock Inspector
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default TokenSimulator;
