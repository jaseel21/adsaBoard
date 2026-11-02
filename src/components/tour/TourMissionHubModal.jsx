import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Compass,
  CheckCircle2,
  Clock,
  Zap,
  Eye,
  ArrowRight,
  Trophy,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useTourEngine } from './TourEngineContext';
import { TOUR_TRACKS } from './tourTracks';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

export default function TourMissionHubModal() {
  const {
    isMissionHubOpen,
    closeMissionHub,
    completedTracks,
    startTour,
  } = useTourEngine();

  const { lang, t } = useLanguage();
  const { feedback } = useFeedback();

  if (!isMissionHubOpen) return null;

  const totalMissions = TOUR_TRACKS.length;
  const completedCount = completedTracks.length;
  const percentComplete = Math.round((completedCount / totalMissions) * 100);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-xl">
        {/* Backdrop dismissal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeMissionHub}
          className="fixed inset-0"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="relative z-10 w-full max-w-2xl max-h-[90vh] bg-white dark:bg-[#0b1411] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-gray-900 dark:text-white"
        >
          {/* Header */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-emerald-800 via-teal-900 to-emerald-950 text-white flex-shrink-0 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-inner flex-shrink-0">
                <Compass className="w-6 h-6 animate-spin-slow" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg sm:text-xl font-black tracking-tight">
                    {lang === 'ml' ? 'ലൈവ് ടൂർ മിഷൻ ഹബ്' : 'Interactive Tour & Mission Hub'}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                    Pro Quests
                  </span>
                </div>
                <p className="text-xs text-emerald-100/80">
                  {completedCount} of {totalMissions} missions completed ({percentComplete}%)
                </p>
              </div>
            </div>

            <button
              onClick={closeMissionHub}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Progress Bar Header */}
          <div className="h-1.5 bg-gray-100 dark:bg-white/5 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
              style={{ width: `${percentComplete}%` }}
            />
          </div>

          {/* Missions List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3.5 scrollbar-thin">
            {TOUR_TRACKS.map((track, idx) => {
              const isCompleted = completedTracks.includes(track.id);
              const Icon = track.icon || Compass;

              return (
                <div
                  key={track.id}
                  className={`
                    p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4
                    ${
                      isCompleted
                        ? 'bg-emerald-500/5 dark:bg-emerald-500/10 border-emerald-500/30'
                        : 'bg-gray-50/80 dark:bg-white/[0.02] border-gray-200/80 dark:border-white/10 hover:border-emerald-500/30'
                    }
                  `}
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <span
                      className={`
                        w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm
                        ${
                          isCompleted
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-200/80 dark:bg-white/10 text-gray-700 dark:text-gray-300'
                        }
                      `}
                    >
                      {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </span>

                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                          {lang === 'ml' ? track.badgeMl : track.badge}
                        </span>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>~{track.estimatedMinutes} mins</span>
                        </span>
                        {isCompleted && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">
                            Completed ✓
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-extrabold text-gray-900 dark:text-white leading-snug">
                        {lang === 'ml' ? track.titleMl : track.titleEn}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed">
                        {lang === 'ml' ? track.descriptionMl : track.descriptionEn}
                      </p>
                    </div>
                  </div>

                  {/* Launch Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-200/60 dark:border-white/10">
                    <button
                      onClick={() => {
                        feedback('pop');
                        startTour(track.id, 'interactive');
                      }}
                      className="flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-extrabold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md flex items-center justify-center gap-1.5 transition-all active:scale-95"
                    >
                      <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                      <span>{isCompleted ? 'Replay Quest' : 'Start Quest'}</span>
                    </button>
                    <button
                      onClick={() => {
                        feedback('tick');
                        startTour(track.id, 'cinematic');
                      }}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-gray-100 hover:bg-gray-200 dark:bg-white/5 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-all"
                      title="Watch as cinematic presentation"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 dark:bg-white/[0.02] border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1.5">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>Earn dining mastery badges upon completion</span>
            </div>
            <button
              onClick={closeMissionHub}
              className="px-3 py-1.5 rounded-xl font-bold hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

