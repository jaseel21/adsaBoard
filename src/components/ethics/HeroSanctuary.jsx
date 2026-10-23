import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  Volume2,
  VolumeX,
  Compass,
  ArrowDown,
  Heart,
  Scale,
  BookOpen,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { SACRED_ETHICS_DATA } from '../../data/diningEthicsContent';
import { useFeedback } from '../../utils/useFeedback';

/**
 * Web Audio API gentle spiritual chime synthesizer
 * Generates an organic, warm acoustic bell chime without any external audio asset dependency.
 */
const playHarmonicChime = (freq = 528) => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    // Primary bell tone
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, ctx.currentTime);

    // Warm subtle harmonic
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 1.5, ctx.currentTime);

    // Natural exponential acoustic decay
    gain1.gain.setValueAtTime(0.2, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.2);

    gain2.gain.setValueAtTime(0.08, ctx.currentTime);
    gain2.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.8);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start();
    osc2.start();

    osc1.stop(ctx.currentTime + 2.3);
    osc2.stop(ctx.currentTime + 1.9);
  } catch (_) {}
};

export default function HeroSanctuary({ onNavigateSection, pledgeSigned }) {
  const { feedback } = useFeedback();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [greeting, setGreeting] = useState('');
  const { hero } = SACRED_ETHICS_DATA;

  useEffect(() => {
    const hr = new Date().getHours();
    if (hr >= 4 && hr < 7) {
      setGreeting('സുബഹിക്ക് ശേഷമുള്ള അനുഗൃഹീത പ്രഭാതം');
    } else if (hr >= 7 && hr < 12) {
      setGreeting('വിജ്ഞാനത്തിന്റെ തിളക്കമുള്ള പകലിൽ');
    } else if (hr >= 12 && hr < 16) {
      setGreeting('ളുഹ്‌ർ വേളയിലെ വിഭവസമൃദ്ധമായ അന്നം');
    } else if (hr >= 16 && hr < 19) {
      setGreeting('അസ്വർ - മഗ്‌രിബ് വേളയിലെ ആത്മീയ ചിന്ത');
    } else {
      setGreeting('ഇശാക്ക് ശേഷമുള്ള അനുഗൃഹീത രാവിൽ');
    }
  }, []);

  const handlePlayTone = () => {
    feedback('tick');
    if (soundEnabled) {
      playHarmonicChime(528);
    }
  };

  const QUICK_JUMP_PILLS = [
    { id: 'dars-soul', label: 'ദർസിന്റെ ആത്മാവ്', icon: Heart },
    { id: 'sunnah-steps', label: 'തീൻമേശ സുന്നത്ത്', icon: Compass },
    { id: 'plate-balance', label: '1/3 പ്ലേറ്റ് മിതത്വം', icon: Scale },
    { id: 'anti-waste', label: 'ഇസ്റാഫ് & പാഴാക്കൽ', icon: Sparkles },
    { id: 'scholarly-vault', label: 'ജ്ഞാനമൊഴികൾ', icon: BookOpen },
    { id: 'adab-pledge', label: 'അദബ് ഉടമ്പടി', icon: ShieldCheck },
  ];

  return (
    <section className="relative overflow-hidden pt-8 pb-14 px-4 sm:px-6 lg:px-8 border-b border-emerald-500/15 dark:border-emerald-500/20 bg-gradient-to-b from-emerald-50/70 via-white to-[#f8faf8] dark:from-[#031d16] dark:via-[#06241b] dark:to-[#080d0b] transition-colors duration-300">
      {/* Mystical Background Lighting Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-96 bg-gradient-to-b from-emerald-500/10 via-amber-400/5 to-transparent blur-3xl pointer-events-none -z-10" />

      {/* Subtle Arabic Sacred Geometric Arabesque Watermark */}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.06] pointer-events-none select-none -z-10 bg-[radial-gradient(#10b981_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto flex flex-col items-center text-center">
        {/* Dynamic Spiritual Greeting Badge */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 border border-emerald-500/30 text-emerald-800 dark:text-emerald-300 text-xs sm:text-sm font-semibold mb-6 backdrop-blur-md shadow-xs"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{greeting}</span>
          <span className="text-emerald-400">•</span>
          <span className="font-arabic font-normal tracking-wide">ആലത്തൂർപടി ദർസ്</span>
        </motion.div>

        {/* Calligraphic Bismillah Emblem */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="relative mb-5 group cursor-pointer"
          onClick={handlePlayTone}
          title="ബിസ്മില്ലാഹ് സ്മരിക്കുക"
        >
          <div className="px-6 py-2.5 rounded-2xl bg-white/70 dark:bg-[#0f241d]/80 border border-emerald-500/20 dark:border-emerald-500/35 shadow-sm hover:shadow-glow-emerald transition-all duration-300">
            <p className="font-arabic text-2xl sm:text-3xl md:text-4xl text-emerald-800 dark:text-emerald-200 tracking-wider font-medium select-none">
              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
            </p>
          </div>
          {/* <span className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 text-[10px] tracking-wider uppercase font-bold text-amber-700 dark:text-amber-400 bg-amber-500/10 dark:bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-amber-500/30">
            തുടക്കം പരമകാരുണികന്റെ നാമത്തിൽ
          </span> */}
        </motion.div>

        {/* Main Sacred Title */}
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-6 text-3xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight font-malayalam leading-tight"
        >
          {hero.titleMl}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-amber-600 dark:from-emerald-400 dark:via-teal-300 dark:to-amber-400">
            അന്നവും അദബും
          </span>
        </motion.h1>

        {/* Arabic Secondary Title */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25 }}
          className="mt-2 text-xl sm:text-2xl font-arabic text-emerald-700 dark:text-emerald-300/90 font-medium select-none"
        >
          {hero.titleAr}
        </motion.p>

        {/* Evocative Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-4 text-base sm:text-lg text-emerald-900 dark:text-emerald-200/90 font-semibold max-w-2xl font-malayalam"
        >
          {hero.subtitleMl}
        </motion.p>

        {/* Deep Philosophical Paragraph */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-3 text-sm sm:text-base text-gray-700 dark:text-gray-300 max-w-3xl leading-relaxed font-malayalam"
        >
          {hero.descriptionMl}
        </motion.p>

        {/* Interactive Opening Dua Banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-8 w-full max-w-3xl p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-amber-500/10 to-emerald-500/10 dark:from-emerald-950/40 dark:via-amber-950/20 dark:to-emerald-950/40 border border-emerald-500/25 dark:border-emerald-500/35 relative overflow-hidden backdrop-blur-sm"
        >
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex-1">
              <p className="font-arabic text-lg sm:text-xl text-emerald-900 dark:text-emerald-200 font-semibold leading-relaxed">
                {hero.openingDuaAr}
              </p>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1.5 font-malayalam font-medium">
                {hero.openingDuaMeaningMl}
              </p>
            </div>
            <button
              type="button"
              onClick={handlePlayTone}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md hover:shadow-glow-emerald transition-all active:scale-95 flex-shrink-0"
              title="ആത്മീയ നാദം ശ്രവിക്കുക"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>ശ്രവിക്കുക</span>
            </button>
          </div>
        </motion.div>

        {/* Quick Navigation Anchor Chips */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-2 max-w-3xl"
        >
          {QUICK_JUMP_PILLS.map((pill) => {
            const Icon = pill.icon;
            const isPledge = pill.id === 'adab-pledge' && pledgeSigned;
            return (
              <button
                key={pill.id}
                type="button"
                onClick={() => {
                  feedback('tick');
                  onNavigateSection(pill.id);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 ${
                  isPledge
                    ? 'bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/40 shadow-xs'
                    : 'bg-white/80 dark:bg-white/5 hover:bg-emerald-500/15 dark:hover:bg-emerald-500/25 border border-gray-200 dark:border-white/10 hover:border-emerald-500/30 text-gray-800 dark:text-gray-200'
                }`}
              >
                {isPledge ? (
                  <Check className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                ) : (
                  <Icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                )}
                <span>{pill.label}</span>
              </button>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
