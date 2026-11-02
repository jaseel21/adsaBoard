import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  Calendar,
  Lock,
  Layers,
  Search,
  Printer,
  Sparkles,
  Command,
  Smartphone,
  Globe,
  KeyRound,
  LogOut,
  Save,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Download,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { guideStaggerVariants, guideItemVariants } from './guideAnimations';

// 1. Timings & Cutoff Rules Component
export const TimingsAndCutoff = () => {
  const { lang } = useLanguage();
  const isMl = lang === 'ml';

  return (
    <motion.div variants={guideStaggerVariants} initial="hidden" animate="show" className="space-y-6 text-xs sm:text-sm">
      <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 flex items-start gap-3.5">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
          <Clock className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-base font-extrabold text-gray-900 dark:text-white">
            {isMl ? 'ഔദ്യോഗിക IST സെർവർ ക്ലോക്കും തത്സമയ സിൻക്രണൈസേഷനും' : 'Authoritative IST Server Clock & Anti-Tamper Defense'}
          </h3>
          <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">
            {isMl
              ? 'കാന്റീൻ സമയം കർശനമായി ഇന്ത്യൻ സ്റ്റാൻഡേർഡ് സമയം (Asia/Kolkata) അനുസരിച്ചാണ് പ്രവർത്തിക്കുന്നത്. വിദ്യാർത്ഥികളുടെ ഫോണിലെ സമയം തെറ്റിയാലും സെർവർ സമയം കൃത്യത ഉറപ്പാക്കുന്നു.'
              : 'The canteen operates strictly on Indian Standard Time (Asia/Kolkata). Even if a student alters their computer or mobile system clock, the server time guarantees absolute integrity.'}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Today Finalized */}
        <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-600 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </span>
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
              {isMl ? 'ഇന്നത്തെ ഭക്ഷണം ഫൈനൽ' : 'Today: Finalized for Kitchen'}
            </h4>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            {isMl
              ? 'ഇന്നത്തെ ഭക്ഷണം കിച്ചണിലേക്ക് തയ്യാറാക്കാൻ നൽകിയതിനാൽ അന്നേ ദിവസം സ്വന്തമായി മാറ്റങ്ങൾ വരുത്താൻ സാധിക്കില്ല.'
              : 'Today’s portion counts are locked for kitchen cooking and pantry allocation. Self-service updates for today are disabled.'}
          </p>
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200 text-xs border border-rose-300/40">
            <strong>{isMl ? 'ലോക്ക്ഡ്:' : 'Locked:'}</strong> {isMl ? 'അടിയന്തിര കാര്യങ്ങൾക്ക് അഡ്മിൻ വഴി മാത്രം.' : 'Admin override only for emergencies.'}
          </div>
        </motion.div>

        {/* Pillar 2: Tomorrow Cutoff */}
        <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </span>
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
              {isMl ? 'നാളത്തെ ഭക്ഷണം: 11:00 PM കട്ട്-ഓഫ്' : 'Tomorrow: 11:00 PM Cutoff'}
            </h4>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            {isMl
              ? 'അടുത്ത ദിവസത്തെ ഭക്ഷണത്തിൽ മാറ്റം വരുത്താൻ രാത്രി 11:00 PM IST വരെ സമയം അനുവദിച്ചിരിക്കുന്നു. 11 മണിക്ക് കിച്ചൺ പർച്ചേസിനായി നാളത്തെ മീൽസ് ലോക്ക് ആകും.'
              : 'Next-day meals remain open all day until 11:00 PM IST. At 11:00 PM, counts freeze so cooks receive exact procurement numbers.'}
          </p>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs border border-amber-300/40">
            <strong>{isMl ? '11:00 PM IST:' : 'Cutoff at 11:00 PM:'}</strong> {isMl ? 'ഭക്ഷ്യവസ്തുക്കൾ പാഴാവാതിരിക്കാൻ സഹായിക്കുന്നു.' : 'Guarantees zero food shortage or waste.'}
          </div>
        </motion.div>

        {/* Pillar 3: Future Advance Dates */}
        <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 flex items-center justify-center font-bold">
              <Calendar className="w-4 h-4" />
            </span>
            <h4 className="font-extrabold text-sm text-gray-900 dark:text-white">
              {isMl ? 'ഭാവി തീയതികൾ 24/7 ഓപ്പൺ' : 'Future Dates: Always 24/7 Open'}
            </h4>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
            {isMl
              ? 'നാളെയൊഴികെ വരാനിരിക്കുന്ന ഏതൊരു ദിവസത്തെയും അവധികളും യാത്രകളും ദിവസങ്ങൾക്ക് മുമ്പേ തന്നെ ഷെഡ്യൂൾ ചെയ്യാം.'
              : 'Advance leaves and weekend travels can be scheduled for any upcoming date on the dining calendar 24/7!'}
          </p>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 text-xs border border-emerald-300/40">
            <strong>{isMl ? 'ലീവ് പ്ലാനിംഗ്:' : 'Advance Leaves:'}</strong> {isMl ? 'യാത്ര പോകുന്നവർക്ക് മുൻകൂട്ടി ലീവ് രേഖപ്പെടുത്താം.' : 'Schedule leaves days or weeks ahead.'}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

// 2. Views & Filters Guide Component
export const ViewsAndFilters = () => {
  const { lang } = useLanguage();
  const isMl = lang === 'ml';

  return (
    <motion.div variants={guideStaggerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-3">
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-500" />
          <span>{isMl ? 'ടോക്കൺ ബോർഡിലെ 3 പ്രധാന വ്യൂ മോഡുകൾ' : 'The Three Distinct Board View Modes'}</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
            <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 block mb-1">
              {isMl ? '1. എല്ലാ ടോക്കണുകളും (Matrix)' : '1. All Tokens (Matrix)'}
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {isMl
                ? '1 മുതൽ 197 വരെയുള്ള എല്ലാ വിദ്യാർത്ഥി ടോക്കണുകളും സംഖ്യാക്രമത്തിൽ ഒറ്റനോട്ടത്തിൽ കാണാം.'
                : 'High-density matrix showing tokens 1 through 197 in numerical order for quick overall scanning.'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
            <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 block mb-1">
              {isMl ? '2. അക്കാദമിക് ബാച്ച് പ്രകാരം' : '2. By Academic Batch'}
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {isMl
                ? 'ബാച്ച് 1 മുതൽ 7 വരെയുള്ള ക്ലാസുകളായി തിരിച്ച് ഓരോ ബാച്ചിലെയും സജീവ എണ്ണം മനസ്സിലാക്കാം.'
                : 'Organized into Batches 1 to 7 with collapsible accordion panels and individual active counts.'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
            <span className="font-bold text-xs text-emerald-600 dark:text-emerald-400 block mb-1">
              {isMl ? '3. ഡൈനിംഗ് സെക്ഷനുകൾ പ്രകാരം' : '3. By Dynamic Sections'}
            </span>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {isMl
                ? 'ഭക്ഷണ വിതരണത്തിനായി 5 ഭൗതിക സോണുകളായി തിരിച്ചുള്ള ക്രമീകരണം.'
                : 'Clustered into 5 physical dining distribution zones for streamlined kitchen counter service.'}
            </p>
          </div>
        </div>
      </motion.div>

      <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-3">
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-emerald-500" />
          <span>{isMl ? 'സെർച്ചും ഫിൽട്ടറുകളും' : 'Search, Sorting & Multi-Faceted Filters'}</span>
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {isMl
            ? 'സെർച്ച് ബാർ വഴി വിദ്യാർത്ഥികളെ പല രീതിയിൽ കണ്ടെത്താം:'
            : 'The search bar supports bilingual fuzzy matching across multiple student attributes:'}
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 font-semibold text-center">
            {isMl ? 'ടോക്കൺ നമ്പർ' : 'Token Number'} <code className="block text-[11px] text-emerald-500 font-mono mt-0.5">042</code>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 font-semibold text-center">
            {isMl ? 'ഇംഗ്ലീഷ് പേര്' : 'English Name'} <code className="block text-[11px] text-emerald-500 font-mono mt-0.5">Ahmed</code>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 font-semibold text-center font-malayalam">
            {isMl ? 'മലയാളം പേര്' : 'Malayalam Name'} <code className="block text-[11px] text-emerald-500 font-mono mt-0.5">അഹ്‌മദ്</code>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 font-semibold text-center">
            {isMl ? 'യൂസർനെയിം' : 'Username'} <code className="block text-[11px] text-emerald-500 font-mono mt-0.5">@ahmed</code>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 3. Student Portal Step-by-Step Manual
export const StudentPortalTips = () => {
  const { lang } = useLanguage();
  const isMl = lang === 'ml';

  const steps = [
    {
      num: '01',
      icon: Globe,
      color: 'emerald',
      titleEn: 'Enter Official Link',
      titleMl: 'പോർട്ടൽ തുറക്കുക',
      descEn: 'Open Chrome or Safari on mobile or desktop and visit canteen.alathurpadidars.in. Click the "Login" button in the top navigation bar.',
      descMl: 'മൊബൈലിലോ കമ്പ്യൂട്ടറിലോ canteen.alathurpadidars.in തുറക്കുക. മുകളിലെ നാവിഗേഷൻ ബാറിലുള്ള "Login" ബട്ടണിൽ ക്ലിക്ക് ചെയ്യുക.',
    },
    {
      num: '02',
      icon: KeyRound,
      color: 'blue',
      titleEn: 'Enter Token & Password',
      titleMl: 'ലോഗിൻ ചെയ്യുക',
      descEn: 'Type your assigned Token Number (e.g. 042) or username, followed by your private password (e.g. ••••••••), then click "Sign In to Portal".',
      descMl: 'നിങ്ങളുടെ ടോക്കൺ നമ്പറും (ഉദാ: 042) രഹസ്യ പാസ്‌വേഡും (ഉദാ: ••••••••) കൃത്യമായി നൽകി "Sign In to Portal" ബട്ടൺ അമർത്തുക.',
    },
    {
      num: '03',
      icon: Sparkles,
      color: 'teal',
      titleEn: 'Student Dashboard Overview',
      titleMl: 'പേഴ്സണൽ ഡാഷ്‌ബോർഡ്',
      descEn: 'Review your verified name, batch, token #, real-time IST clock, tomorrow dining status, and assigned dietary badges (beef, chicken, fish, mutton).',
      descMl: 'നിങ്ങളുടെ പേര്, ബാച്ച്, ടോക്കൺ നമ്പർ, തത്സമയ IST ക്ലോക്ക്, നാളത്തെ ഭക്ഷണാവസ്ഥ, ഡയറ്ററി വിഭവങ്ങൾ എന്നിവ ഡാഷ്‌ബോർഡിൽ പരിശോധിക്കുക.',
    },
    {
      num: '04',
      icon: Calendar,
      color: 'purple',
      titleEn: 'Update Meals & Advance Leaves',
      titleMl: 'ഭക്ഷണം അപ്‌ഡേറ്റ് ചെയ്യുക',
      descEn: 'Single-Day Leave: Click date and flip Breakfast/Lunch to OFF (auto-restores in 24h). Weekly Routine: Configure recurring 7-day habits. Advance leaves can be booked days ahead.',
      descMl: 'ഒറ്റ ദിവസത്തെ ലീവ്: തീയതി ക്ലിക്ക് ചെയ്ത് Breakfast/Lunch OFF ആക്കുക. സ്ഥിരം റൂട്ടീൻ: ആഴ്ചയിലെ നിശ്ചിത ദിവസങ്ങൾ ഓഫ് ചെയ്യാം. ഭാവി തീയതികളിലെ ലീവുകൾ എപ്പോൾ വേണമെങ്കിലും രേഖപ്പെടുത്താം.',
    },
    {
      num: '05',
      icon: Save,
      color: 'green',
      titleEn: 'Save Preferences',
      titleMl: 'മാറ്റങ്ങൾ സേവ് ചെയ്യുക',
      descEn: 'Whenever you make changes, the floating action bar highlights. Click "Save Preferences" to commit changes instantly to the live server.',
      descMl: 'മാറ്റങ്ങൾ വരുത്തിയയുടൻ അടിയിൽ വരുന്ന ഫ്ലോട്ടിംഗ് ബാറിലെ പച്ച നിറത്തിലുള്ള "Save Preferences" ബട്ടൺ ക്ലിക്ക് ചെയ്ത് ഉറപ്പുവരുത്തുക.',
    },
    {
      num: '06',
      icon: LogOut,
      color: 'rose',
      titleEn: 'Safe Logout & Auto-Idle Guard',
      titleMl: 'സുരക്ഷിതമായി ലോഗ് ഔട്ട് ചെയ്യുക',
      descEn: 'Always click "Log Out" on public devices. The portal enforces a 5-minute idle countdown with audio alert to prevent unauthorized tampering.',
      descMl: 'പബ്ലിക് കമ്പ്യൂട്ടറുകളിൽ ഉപയോഗം കഴിഞ്ഞാൽ "Log Out" ചെയ്യുക. കൃത്രിമം തടയാൻ 5 മിനിറ്റ് ഉപയോഗിക്കാതിരുന്നാൽ സിസ്റ്റം സ്വയം ലോഗ് ഔട്ട് ആകും.',
    },
  ];

  return (
    <motion.div variants={guideStaggerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Visual Carousel Banner */}
      <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-700 to-emerald-900 text-white shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-bold text-emerald-100">
            <span>{isMl ? 'ഔദ്യോഗിക സ്ലൈഡ് കാരൗസൽ' : 'Official Visual Carousel'}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
          <h3 className="text-base sm:text-lg font-black">
            {isMl ? '1080x1920 വിദ്യാർത്ഥി യൂസർ ഗൈഡ് സ്ലൈഡുകൾ' : '1080x1920 Portrait Guide Carousel'}
          </h3>
          <p className="text-xs text-emerald-100/90 leading-relaxed max-w-xl">
            {isMl
              ? 'ലോഗിൻ, ലീവ് രേഖപ്പെടുത്തൽ, സേവിങ് എന്നിവ വിശദീകരിക്കുന്ന അതിമനോഹരമായ മലയാളം സ്ലൈഡ് പോസ്റ്റുകൾ കാണാനും ഡൗൺലോഡ് ചെയ്യാനും സാധിക്കും.'
              : 'Award-winning visual slide posts formatted in portrait 1080x1920 with interactive portal walkthrough (Demo Token 042).'}
          </p>
        </div>
        <a
          href="/guide-carousel.html"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white text-emerald-900 font-black text-xs shadow-md hover:bg-emerald-50 transition-all active:scale-95 flex-shrink-0"
        >
          <span>{isMl ? 'കാരൗസൽ തുറക്കുക' : 'Open Slide Carousel'}</span>
          <ExternalLink className="w-4 h-4" />
        </a>
      </motion.div>

      {/* 6 Step Walkthrough Grid */}
      <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            <span>{isMl ? 'ഘട്ടം ഘട്ടമായുള്ള ഉപയോഗക്രമം (Step-by-Step Flow)' : 'End-to-End Student Portal Workflow'}</span>
          </h3>
          <span className="text-xs font-bold text-gray-500">6 Steps</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
          {steps.map((st) => {
            const Icon = st.icon;
            return (
              <div
                key={st.num}
                className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-black text-xs flex items-center justify-center">
                      {st.num}
                    </span>
                    <Icon className="w-4 h-4 text-gray-400" />
                  </div>
                  <h4 className="font-extrabold text-xs text-gray-900 dark:text-white">
                    {isMl ? st.titleMl : st.titleEn}
                  </h4>
                  <p className="text-[11px] sm:text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {isMl ? st.descMl : st.descEn}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
};

// 4. Kitchen & Supply Sheets Guide
export const KitchenAndSheets = () => {
  const { lang } = useLanguage();
  const isMl = lang === 'ml';

  return (
    <motion.div variants={guideStaggerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-3">
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Printer className="w-5 h-5 text-emerald-500" />
          <span>{isMl ? 'കിച്ചൺ ഓപ്പറേഷൻസും സപ്ലൈ ഷീറ്റുകളും' : 'Kitchen Operations & Supply Sheet Generation'}</span>
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
          {isMl
            ? 'കാന്റീൻ കിച്ചൺ സ്റ്റാഫ് തത്സമയ ടോക്കൺ എണ്ണങ്ങളെ അടിസ്ഥാനമാക്കിയുള്ള പ്രിന്റബിൾ സപ്ലൈ ഷീറ്റുകൾ ആശ്രയിക്കുന്നു:'
            : 'The canteen mess staff relies on the printable kitchen supply sheet generated directly from live token counts:'}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
            <span className="font-bold text-gray-900 dark:text-white block mb-1">
              {isMl ? 'വൺ-ക്ലിക്ക് പ്രിന്റും PDF എക്സ്പോർട്ടും' : 'One-Click Print & PDF Export'}
            </span>
            <p className="text-gray-600 dark:text-gray-300">
              {isMl
                ? 'ഹെഡർ ബാനറിലെ "Kitchen Sheet" ബട്ടൺ വഴി അതാത് ബാച്ച് തിരിച്ചുള്ള കൃത്യമായ കണക്കുകൾ പ്രിന്റ് ചെയ്യാം.'
                : 'Accessible via the "Kitchen Sheet" button in the header banner. Outputs clean, tabular printouts with batch totals.'}
            </p>
          </div>
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10">
            <span className="font-bold text-gray-900 dark:text-white block mb-1">
              {isMl ? 'ഡയറ്ററി അവോയ്ഡേഴ്സ് ലിസ്റ്റ്' : 'Dietary Avoiders List'}
            </span>
            <p className="text-gray-600 dark:text-gray-300">
              {isMl
                ? 'ബീഫ്, ചിക്കൻ, മീൻ ഒഴിവാക്കിയവരുടെ എണ്ണം കൃത്യമായി കിച്ചണിൽ ലഭിക്കുന്നതിനാൽ പകരം വിഭവങ്ങൾ കുറവില്ലാതെ ഒരുക്കാം.'
                : 'Kitchen sheets include exact counts of beef, chicken, and fish avoiders for the day, ensuring alternative dishes are prepared without shortage.'}
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// 5. Shortcuts & Power Tips
export const ShortcutsAndGestures = () => {
  const { lang } = useLanguage();
  const isMl = lang === 'ml';

  const shortcuts = [
    { key: '?', descEn: 'Open / Close this Interactive Guide', descMl: 'ഗൈഡ് ഓപ്പൺ / ക്ലോസ് ചെയ്യുക' },
    { key: 'B', descEn: 'Instant switch to Breakfast slot', descMl: 'ബ്രേക്ക്ഫാസ്റ്റ് സ്ലോട്ടിലേക്ക് മാറുക' },
    { key: 'L', descEn: 'Instant switch to Lunch slot', descMl: 'ലഞ്ച് സ്ലോട്ടിലേക്ക് മാറുക' },
    { key: '/', descEn: 'Focus live Search bar', descMl: 'ലൈവ് സെർച്ച് ബാറിലേക്ക് ഫോക്കസ് ചെയ്യുക' },
    { key: 'Esc', descEn: 'Close any open modal or drawer', descMl: 'തുറന്ന മോഡലുകൾ ക്ലോസ് ചെയ്യുക' },
  ];

  return (
    <motion.div variants={guideStaggerVariants} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={guideItemVariants} className="p-5 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm space-y-4">
        <h3 className="font-extrabold text-base text-gray-900 dark:text-white flex items-center gap-2">
          <Command className="w-5 h-5 text-emerald-500" />
          <span>{isMl ? 'കീബോർഡ് ഷോർട്ട്കട്ടുകൾ (ഡെസ്ക്ടോപ്പ്)' : 'Keyboard Shortcuts (Desktop Power Users)'}</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 flex items-center justify-between"
            >
              <span className="text-gray-600 dark:text-gray-300">{isMl ? sc.descMl : sc.descEn}</span>
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
          <span>{isMl ? 'മൊബൈൽ ടച്ച് എർഗണോമിക്സ്' : 'Mobile & Touch Ergonomics'}</span>
        </h3>
        <p className="text-xs text-gray-600 dark:text-gray-300">
          {isMl
            ? 'സ്മാർട്ട്‌ഫോണുകളിൽ താഴേക്ക് സ്വൈപ്പ് ചെയ്ത് മോഡലുകൾ ക്ലോസ് ചെയ്യാം (Swipe-down). തംബ് ടച്ച് ടാർഗെറ്റുകളും വൈബ്രേഷൻ ഫീഡ്ബാക്കും ലഭ്യമാണ്.'
            : 'On iPhone and Android screens, all dialogs transform into native bottom sheets with swipe-down gestures for dismissal, tactile vibration pulses, and generous thumb touch targets.'}
        </p>
      </motion.div>
    </motion.div>
  );
};

// 6. Interactive Visual Slide Post Carousel Module
export const VisualSlidePostModule = () => {
  const { lang } = useLanguage();
  const isMl = lang === 'ml';
  const [activeSlide, setActiveSlide] = useState(0);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(0.35);

  const slideTitles = [
    { en: '01 • Cover: ADSA Canteen Guide', ml: '01 • കവർ: ADSA കാന്റീൻ ഗൈഡ്' },
    { en: '02 • Step 1: Open Website Link', ml: '02 • ഘട്ടം 1: വെബ്സൈറ്റ് സന്ദർശനം' },
    { en: '03 • Step 2: Sign In (Token & Password)', ml: '03 • ഘട്ടം 2: ലോഗിൻ ചെയ്യുക' },
    { en: '04 • Step 3: Student Dashboard', ml: '04 • ഘട്ടം 3: പേഴ്സണൽ ഡാഷ്‌ബോർഡ്' },
    { en: '05 • Step 4: Update Meals & Leaves', ml: '05 • ഘട്ടം 4: ഭക്ഷണം അപ്‌ഡേറ്റ്' },
    { en: '06 • Step 5: Save Preferences', ml: '06 • ഘട്ടം 5: മാറ്റങ്ങൾ സേവ് ചെയ്യുക' },
    { en: '07 • Step 6: Safe Logout & Security', ml: '07 • ഘട്ടം 6: സുരക്ഷിതമായി ലോഗ് ഔട്ട്' },
    { en: '08 • Cutoff & Important Dining Rules', ml: '08 • കട്ട്-ഓഫും പ്രധാന നിയമങ്ങളും' },
    { en: '09 • Color System Legend', ml: '09 • സിസ്റ്റം കളർ കോഡുകൾ' },
    { en: '10 • Care Hub & Help Contacts', ml: '10 • സഹായവും ബന്ധപ്പെടാനുള്ള വിവരങ്ങളും' },
  ];

  const currentNumberStr = String(activeSlide + 1).padStart(2, '0');
  const slideHtmlSrc = `/assets/slides/slide_${currentNumberStr}.html`;
  const slideSvgSrc = `/assets/slides_svg/slide_${currentNumberStr}.svg`;

  useEffect(() => {
    if (!containerRef.current) return;
    const updateScale = () => {
      if (containerRef.current) {
        setScale(containerRef.current.clientWidth / 1080);
      }
    };
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  return (
    <motion.div variants={guideStaggerVariants} initial="hidden" animate="show" className="space-y-6">
      {/* Top Action Bar */}
      <motion.div variants={guideItemVariants} className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-950 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] sm:text-xs font-bold text-emerald-200 uppercase tracking-wider mb-1">
            <span>1080x1920 Portrait Infographics</span>
          </div>
          <h3 className="text-base sm:text-lg font-black text-white">
            {isMl ? 'ഔദ്യോഗിക വിദ്യാർത്ഥി ഗൈഡ് സ്ലൈഡുകൾ' : 'Official Student Guide Carousel'}
          </h3>
          <p className="text-xs text-emerald-100/80">
            {isMl ? '10 സ്ലൈഡുകളിലൂടെ കാന്റീൻ ടോക്കൺ സിസ്റ്റം എളുപ്പത്തിൽ പഠിക്കാം.' : 'Step-by-step visual slide deck rendered in portrait format.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          <a
            href={slideSvgSrc}
            download={`ADSA_Guide_Slide_${currentNumberStr}.svg`}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all active:scale-95"
            title="Download Vector SVG"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isMl ? 'SVG സേവ് ചെയ്യുക' : 'Save SVG'}</span>
          </a>
          <a
            href="/guide-carousel.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs shadow-md transition-all active:scale-95"
          >
            <span>{isMl ? 'ഫുൾ സ്ക്രീൻ & എക്‌സ്‌പോർട്ട്' : 'Web Viewer & Export'}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </motion.div>

      {/* Main Slide Carousel Box */}
      <motion.div variants={guideItemVariants} className="p-4 sm:p-6 rounded-3xl bg-white dark:bg-[#0f1715] border border-gray-200/80 dark:border-white/10 shadow-sm flex flex-col items-center space-y-4">
        {/* Navigation Top Header */}
        <div className="w-full flex items-center justify-between text-xs">
          <button
            onClick={() => setActiveSlide((prev) => (prev > 0 ? prev - 1 : 9))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold transition-all active:scale-95"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isMl ? 'മുമ്പത്തേത്' : 'Prev'}</span>
          </button>

          <div className="text-center">
            <span className="font-extrabold text-sm text-gray-900 dark:text-white block">
              {isMl ? slideTitles[activeSlide].ml : slideTitles[activeSlide].en}
            </span>
            <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
              {activeSlide + 1} / 10
            </span>
          </div>

          <button
            onClick={() => setActiveSlide((prev) => (prev < 9 ? prev + 1 : 0))}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-gray-700 dark:text-gray-300 font-bold transition-all active:scale-95"
          >
            <span>{isMl ? 'അടുത്തത്' : 'Next'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Scaled Slide Viewport Mockup */}
        <div
          ref={containerRef}
          className="relative w-full max-w-sm aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border-2 border-gray-300 dark:border-white/15 bg-[#020f0a]"
        >
          <iframe
            key={currentNumberStr}
            src={slideHtmlSrc}
            title={slideTitles[activeSlide].en}
            className="border-none origin-top-left pointer-events-none select-none"
            style={{
              width: '1080px',
              height: '1920px',
              transform: `scale(${scale})`,
            }}
            scrolling="no"
          />
        </div>

        {/* Dots Indicator */}
        <div className="flex items-center gap-1.5 pt-2 flex-wrap justify-center">
          {slideTitles.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveSlide(idx)}
              className={`h-2 rounded-full transition-all ${
                activeSlide === idx
                  ? 'w-6 bg-emerald-500'
                  : 'w-2 bg-gray-300 dark:bg-white/20 hover:bg-gray-400'
              }`}
              title={`Slide ${idx + 1}`}
            />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};
