import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  UtensilsCrossed,
  Sparkles,
  Heart,
  Share2,
  Printer,
  Compass,
} from 'lucide-react';
import useSEO from '../../hooks/useSEO';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';

import HeroSanctuary from './HeroSanctuary';
import DarsHeartbeatSection from './DarsHeartbeatSection';
import PropheticPlateBalanceSimulator from './PropheticPlateBalanceSimulator';
import SunnahEtiquetteTimeline from './SunnahEtiquetteTimeline';
import AntiWasteImpactCalculator from './AntiWasteImpactCalculator';
import KitchenAngelsSection from './KitchenAngelsSection';
import ScholarlyTreasuresVault from './ScholarlyTreasuresVault';
import MultilingualPoeticGarden from './MultilingualPoeticGarden';
import StudentAdabPledgeModal from './StudentAdabPledgeModal';
import ShareableQuoteCardModal from './ShareableQuoteCardModal';

export default function DiningEthicsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { feedback } = useFeedback();

  const [pledgeSigned, setPledgeSigned] = useState(false);
  const [activeQuoteForShare, setActiveQuoteForShare] = useState(null);

  useSEO({
    title: 'ആദാബുൽ മാഇദ • അന്നവും അദബും | ADSA T-Board',
    description:
      'ദർസിലെ പവിത്രമായ തീൻമേശ മര്യാദകൾ, തിരുനബി ﷺ യുടെ ചര്യ, 1/3 വയറിന്റെ സമതുലിതാവസ്ഥ, അന്നം പാഴാക്കാതിരിക്കാനുള്ള ആഹ്വാനം. ആലത്തൂർപടി ദർസ് ഫുഡ് മാനേജ്‌മെന്റ് സിസ്റ്റം.',
    keywords:
      'adab al maidah, dars food ethics, islamic dining discipline, eating sunnah, food waste in islam, alathurpadi dars canteen, ആദാബുൽ മാഇദ, ഭക്ഷണ മര്യാദകൾ, തിരുസുന്നത്ത്',
    image: '/og-preview.png',
  });

  const scrollToSection = (id) => {
    feedback('tick');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#f8faf8] dark:bg-[#080d0b] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      {/* Top Breadcrumb & Action Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-2 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            feedback('tick');
            navigate(-1);
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>തിരികെ പോവുക (Back)</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              navigate('/menu');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs font-bold border border-emerald-500/25 transition-all active:scale-95"
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>ഭക്ഷണ മെനു കാണുക</span>
          </button>

          <button
            type="button"
            onClick={() => {
              feedback('tick');
              window.print();
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>പ്രിന്റ് ചെയ്യുക</span>
          </button>
        </div>
      </div>

      {/* 1. Hero Sanctuary */}
      <HeroSanctuary
        onNavigateSection={scrollToSection}
        pledgeSigned={pledgeSigned}
      />

      {/* 2. Dars Heartbeat: Sustained by Community Sweat & Love */}
      <DarsHeartbeatSection />

      {/* 3. The Prophetic 1/3 Belly Balance Simulator */}
      <PropheticPlateBalanceSimulator />

      {/* 4. Prophetic Dining Sunnah Timeline */}
      <SunnahEtiquetteTimeline />

      {/* 5. Anti-Waste Impact Calculator */}
      <AntiWasteImpactCalculator />

      {/* 6. Kitchen Angels & Mess Decorum */}
      <KitchenAngelsSection />

      {/* 7. Scholarly Treasures (Ghazali, Makhdum, Sufi Masters) */}
      <ScholarlyTreasuresVault
        onShareQuote={(quote) => setActiveQuoteForShare(quote)}
      />

      {/* 8. Multilingual Poetic Garden */}
      <MultilingualPoeticGarden />

      {/* 9. The Student's Adab Pledge & Golden Seal */}
      <StudentAdabPledgeModal
        onPledgeStatusChange={(status) => setPledgeSigned(status)}
      />

      {/* Share Modal */}
      <ShareableQuoteCardModal
        quote={activeQuoteForShare}
        isOpen={Boolean(activeQuoteForShare)}
        onClose={() => setActiveQuoteForShare(null)}
      />

      {/* Bottom Contemplative Footer Note */}
      <div className="py-12 border-t border-emerald-500/15 text-center px-4">
        <p className="font-arabic text-xl sm:text-2xl text-emerald-800 dark:text-emerald-300 font-medium select-none mb-2">
          رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ
        </p>
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-malayalam">
          ആലത്തൂർപടി ദർസ് കാമ്പസ് ഫുഡ് മാനേജ്‌മെന്റ് സിസ്റ്റം • അഹ്‌ലുസ്സുന്നത്തി വൽ ജമാഅ ആദർശങ്ങളിൽ അധിഷ്ഠിതം
        </p>
      </div>
    </div>
  );
}
