import React from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Lock,
  Unlock,
  Layers,
  Filter,
  Search,
  Users,
  Printer,
  Sparkles,
  Command,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Utensils,
  Coffee,
} from 'lucide-react';
import { guideStaggerVariants, guideItemVariants } from './guideAnimations';

// 1. Timings & Cutoff Rules Component
export const TimingsAndCutoff = () => {
  return (
    <motion.div variants={guideStaggerVariants} initial="hidden" animate="show" className="space-y-6 text-xs sm:text-sm">
      <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-start gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
            Authoritative IST Server Clock & Anti-Tamper Defense
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
            The canteen operates strictly on Indian Standard Time (Asia/Kolkata). Even if a student alters their computer or mobile system clock, the server time guarantees absolute integrity.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </span>
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
              Daily Update Window (02:00 PM - 11:00 PM)
            </h4>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            The student portal is unlocked daily from <strong>02:00 PM until 11:00 PM IST</strong> for updates to the following day&apos;s meals. Outside this window, next-day meals are locked.
          </p>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs border border-amber-300/40">
            <strong>Cutoff at 11:00 PM:</strong> Ensures kitchen staff have the exact raw material and portion calculations for morning procurement.
          </div>
        </motion.div>

        <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </span>
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
              Advance Dates Always Remain Open
            </h4>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            While the daily 11:00 PM cutoff closes updates for <em>tomorrow</em>, any student may schedule advance single-day exceptions for <strong>future dates</strong> at any time!
          </p>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 text-xs border border-emerald-300/40">
            <strong>Planning Leaves:</strong> Students traveling for weekends can schedule their leaves days in advance.
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// 2. Views & Filters Guide Component
export const ViewsAndFilters = () => {
  return (
    <motion.div variants={guideStaggerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-3">
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-500" />
          <span>The Three Distinct Board View Modes</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
            <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 block mb-1">
              1. All Tokens (Matrix)
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              High-density matrix showing tokens 1 through 197 in numerical order for quick overall scanning.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
            <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 block mb-1">
              2. By Academic Batch
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Organized into Batches 1 to 7 with collapsible accordion panels and individual active counts.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
            <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 block mb-1">
              3. By Dynamic Sections
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Clustered into 5 physical dining distribution zones for streamlined kitchen counter service.
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-3">
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-emerald-500" />
          <span>Search, Sorting & Multi-Faceted Filters</span>
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          The search bar supports bilingual fuzzy matching across multiple student attributes:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 font-semibold text-center">
            Token Number <code className="block text-[11px] text-emerald-500 font-mono mt-0.5">42</code>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 font-semibold text-center">
            English Name <code className="block text-[11px] text-emerald-500 font-mono mt-0.5">Bilal</code>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 font-semibold text-center font-malayalam">
            മലയാളം പേര് <code className="block text-[11px] text-emerald-500 font-mono mt-0.5">അനസ്</code>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 font-semibold text-center">
            Username <code className="block text-[11px] text-emerald-500 font-mono mt-0.5">@anas_42</code>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 3. Student Portal Tips
export const StudentPortalTips = () => {
  return (
    <motion.div variants={guideStaggerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-3">
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-500" />
          <span>Managing Your Token in the Student Portal</span>
        </h3>
        <div className="space-y-3 text-xs sm:text-sm text-gray-600 dark:text-gray-300">
          <div className="p-3.5 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-500/20">
            <strong className="text-emerald-900 dark:text-emerald-300 block mb-0.5">
              1. Single-Day Override (Leaving for a Day?)
            </strong>
            <span>
              In the Student Portal, click on the target date in the calendar and flip Breakfast or Lunch to OFF. This creates a temporary leave that automatically expires after 24 hours. The token will show as <strong>Red</strong> on the board.
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
            <strong className="text-gray-900 dark:text-white block mb-0.5">
              2. Permanent Weekly Routine
            </strong>
            <span>
              If you have permanent recurring dining plans (e.g., fasting every Monday and Thursday), update your 7-day weekly schedule grid.
            </span>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-500/20">
            <strong className="text-amber-900 dark:text-amber-300 block mb-0.5">
              3. Public Computer Security & Auto-Logout
            </strong>
            <span>
              To prevent classmates from altering your dining choices, the portal enforces a strict <strong>5-minute idle auto-logout</strong> with sound warning and countdown. Always click &quot;Save &amp; Log Out&quot; when finished!
            </span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 4. Kitchen & Supply Sheets Guide
export const KitchenAndSheets = () => {
  return (
    <motion.div variants={guideStaggerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-3">
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Printer className="w-5 h-5 text-emerald-500" />
          <span>Kitchen Operations & Supply Sheet Generation</span>
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          The canteen mess staff relies on the printable kitchen supply sheet generated directly from live token counts:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
            <span className="font-bold text-gray-900 dark:text-white block mb-1">
              One-Click Print & PDF Export
            </span>
            <p className="text-gray-600 dark:text-gray-300">
              Accessible via the &quot;Kitchen Sheet&quot; button in the header banner. Outputs clean, tabular printouts with batch totals.
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
            <span className="font-bold text-gray-900 dark:text-white block mb-1">
              Dietary Avoiders List
            </span>
            <p className="text-gray-600 dark:text-gray-300">
              Kitchen sheets include exact counts of beef, chicken, and fish avoiders for the day, ensuring alternative dishes are prepared without shortage.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 5. Shortcuts & Power Tips
export const ShortcutsAndGestures = () => {
  const shortcuts = [
    { key: '?', desc: 'Open / Close this Interactive Guide' },
    { key: 'L', desc: 'Instant switch to Lunch slot' },
    { key: 'B', desc: 'Instant switch to Breakfast slot' },
    { key: '/', desc: 'Focus live Search bar' },
    { key: 'Esc', desc: 'Close any open modal or drawer' },
  ];

  return (
    <motion.div variants={guideStaggerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4">
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Command className="w-5 h-5 text-emerald-500" />
          <span>Keyboard Shortcuts (Desktop Power Users)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 flex items-center justify-between"
            >
              <span className="text-gray-600 dark:text-gray-300">{sc.desc}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1f2d29] border border-gray-300 dark:border-white/20 font-mono font-bold text-xs shadow-sm">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-3">
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-emerald-500" />
          <span>Mobile & Touch Ergonomics</span>
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          On iPhone and Android screens, all dialogs transform into native bottom sheets with <strong>swipe-down gestures</strong> for dismissal, tactile vibration pulses, and generous thumb touch targets (`touch-target`).
        </p>
      </motion.div>
    </motion.div>
  );
};
