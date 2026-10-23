import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Compass,
  CheckCircle2,
  Volume2,
  ChevronRight,
  BookOpen,
  Sparkles,
  Droplet,
  Utensils,
  HeartHandshake,
} from 'lucide-react';
import { SACRED_ETHICS_DATA } from '../../data/diningEthicsContent';
import { useFeedback } from '../../utils/useFeedback';

export default function SunnahEtiquetteTimeline() {
  const { sunnahManners } = SACRED_ETHICS_DATA;
  const { feedback } = useFeedback();

  // Active step filter: 'all' or specific phase
  const [selectedPhase, setSelectedPhase] = useState('all');
  const [completedSteps, setCompletedSteps] = useState({});

  const toggleStepCompleted = (id) => {
    feedback('tick');
    setCompletedSteps((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const PHASES = [
    { id: 'all', label: 'എല്ലാ ചര്യകളും (All Sunnahs)' },
    { id: 'before', label: 'ഭക്ഷണത്തിന് മുമ്പ്' },
    { id: 'start', label: 'തുടങ്ങുമ്പോൾ' },
    { id: 'during', label: 'കഴിക്കുമ്പോൾ' },
    { id: 'drink', label: 'വെള്ളം കുടിക്കുമ്പോൾ' },
    { id: 'after', label: 'ഭക്ഷണ ശേഷം' },
  ];

  const filteredSteps =
    selectedPhase === 'all'
      ? sunnahManners
      : sunnahManners.filter((s) => s.phase === selectedPhase);

  return (
    <section id="sunnah-steps" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs font-bold mb-3">
          <Compass className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
          <span>തീൻമേശയിലെ തിരുചര്യ</span>
        </div>
        <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 dark:text-white font-malayalam tracking-tight">
          തിരുനബി ﷺ യുടെ തീൻമേശ മര്യാദകൾ
        </h2>
        <p className="mt-3 text-sm sm:text-base text-gray-600 dark:text-gray-400 font-malayalam max-w-2xl mx-auto">
          ആഹാരം തുടങ്ങുന്നത് മുതൽ തളിക തുടച്ചു വൃത്തിയാക്കുന്നത് വരെയുള്ള ഓരോ ചലനത്തിലും പുണ്യം നിറച്ചുവെച്ച നബിചര്യകൾ.
        </p>

        {/* Phase Filter Tabs */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
          {PHASES.map((phase) => (
            <button
              key={phase.id}
              type="button"
              onClick={() => {
                feedback('tick');
                setSelectedPhase(phase.id);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                selectedPhase === phase.id
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-white/10 border border-gray-200 dark:border-white/10'
              }`}
            >
              {phase.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Steps Grid */}
      <div className="space-y-6">
        <AnimatePresence mode="popLayout">
          {filteredSteps.map((step, idx) => {
            const isDone = Boolean(completedSteps[step.id]);

            return (
              <motion.div
                key={step.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                className={`p-6 sm:p-7 rounded-3xl border transition-all ${
                  isDone
                    ? 'bg-emerald-50/70 dark:bg-emerald-950/25 border-emerald-500/40 shadow-sm'
                    : 'bg-white dark:bg-[#0c1814] border-gray-200 dark:border-white/10 shadow-xs hover:border-emerald-500/30'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  {/* Phase Label & Step Number */}
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-extrabold flex-shrink-0">
                      0{idx + 1}
                    </span>
                    <div>
                      <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider font-malayalam">
                        {step.phaseLabelMl}
                      </span>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white font-malayalam">
                        {step.titleMl}
                      </h3>
                    </div>
                  </div>

                  {/* Practice Commitment Toggle */}
                  <button
                    type="button"
                    onClick={() => toggleStepCompleted(step.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex-shrink-0 ${
                      isDone
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-white/5 hover:bg-emerald-500/10 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isDone ? 'ഞാൻ ഇത് ജീവിതത്തിൽ പാലിക്കുന്നു' : 'ശീലമാക്കാൻ പ്രതിജ്ഞയെടുക്കുക'}</span>
                  </button>
                </div>

                {/* Classical Arabic Hadith Box */}
                <div className="mt-5 p-4 sm:p-5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/15">
                  <p className="font-arabic text-lg sm:text-xl md:text-2xl text-emerald-900 dark:text-emerald-200 font-medium leading-relaxed select-none">
                    {step.arabicText}
                  </p>
                  <p className="mt-2 text-xs font-medium text-emerald-700 dark:text-emerald-400 font-malayalam">
                    {step.reference}
                  </p>
                  <p className="mt-2 text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-malayalam leading-relaxed">
                    &ldquo;{step.hadithMeaningMl}&rdquo;
                  </p>
                </div>

                {/* Practical Notes & Action Guide */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-malayalam">
                  <div className="p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5">
                    <span className="font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                      സുന്നത്ത് വിശേഷം:
                    </span>
                    <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                      {step.sunnahNotesMl}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20">
                    <span className="font-bold text-amber-800 dark:text-amber-300 block mb-1">
                      പ്രായോഗിക പാഠം:
                    </span>
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                      {step.practicalActionMl}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </section>
  );
}
