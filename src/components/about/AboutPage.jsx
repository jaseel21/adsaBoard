import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Compass,
  Edit3,
  MapPin,
  ExternalLink,
  Instagram,
  Youtube,
  Facebook,
  Twitter,
  BookOpen,
} from 'lucide-react';
import useSEO from '../../hooks/useSEO';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { AuthContext } from '../../store/AuthContext';
import { ROLES, hasRole } from '../../utils/rbac';

import {
  subscribeAboutMeta,
  subscribeMudarrisun,
  subscribeTenures,
  subscribeFeatures,
  subscribeMilestones,
  subscribeGallery,
} from '../../utils/aboutService';

import AboutHero from './AboutHero';
import DarsHeritageSection from './DarsHeritageSection';
import MudarrisunSection from './MudarrisunSection';
import ADSAStorySection from './ADSAStorySection';
import CentralCommitteeSection from './CentralCommitteeSection';
import CanteenWingSection from './CanteenWingSection';
import CommitteesGridSection from './CommitteesGridSection';
import TBoardOriginSection from './TBoardOriginSection';
import PlatformFeaturesSection from './PlatformFeaturesSection';
import GuideBridgeSection from './GuideBridgeSection';
import CampusGallerySection from './CampusGallerySection';

export default function AboutPage() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { feedback } = useFeedback();
  const { user, role } = useContext(AuthContext);

  const canEdit =
    user &&
    (hasRole(role, ROLES.CENTRAL_COMMITTEE) ||
      hasRole(role, ROLES.CANTEEN_COMMITTEE) ||
      hasRole(role, ROLES.DEVELOPER));

  useSEO({
    title:
      lang === 'ml'
        ? 'ആലത്തൂർപടി ദർസ് & അഡ്സ • പാരമ്പര്യവും ഡിജിറ്റൽ ടി-ബോർഡും'
        : 'About Alathurpadi Dars & ADSA • Sacred Heritage & Digital T-Board',
    description:
      'Historic Alathurpadi Dars mosque-college legacy, Mudarrisun scholars, ADSA Central Committee, Canteen Wing mess operations, and the revolutionary ADSA T-Board food management system.',
    keywords:
      'Alathurpadi Dars, ADSA, Mudarrisun, Dars Canteen, Melmuri Dars, ADSA T-Board, Islamic scholar faculty, Kerala dars system, zero food waste',
    image: '/og-preview.png',
  });

  // Dynamic Content States
  const [meta, setMeta] = useState(null);
  const [mudarrisun, setMudarrisun] = useState([]);
  const [tenures, setTenures] = useState([]);
  const [features, setFeatures] = useState([]);
  const [milestones, setMilestones] = useState([]);
  const [gallery, setGallery] = useState([]);

  // Subscriptions to Firestore with Default Fallback
  useEffect(() => {
    const unsubMeta = subscribeAboutMeta(setMeta);
    const unsubMudarrisun = subscribeMudarrisun(setMudarrisun);
    const unsubTenures = subscribeTenures(setTenures);
    const unsubFeatures = subscribeFeatures(setFeatures);
    const unsubMilestones = subscribeMilestones(setMilestones);
    const unsubGallery = subscribeGallery(setGallery);

    return () => {
      unsubMeta();
      unsubMudarrisun();
      unsubTenures();
      unsubFeatures();
      unsubMilestones();
      unsubGallery();
    };
  }, []);

  const scrollToSection = (sectionId) => {
    feedback('tick');
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const currentTenure = tenures.find((t) => t.isCurrentTenure) || tenures[0];
  const canteenMembers = currentTenure?.canteenWing || [];
  const subCommittees = currentTenure?.subCommittees || [];

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
          <span>{lang === 'ml' ? 'തിരികെ പോവുക (Back)' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                feedback('pop');
                navigate('/admin/about');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-700 dark:text-amber-300 text-xs font-bold transition-all active:scale-95 shadow-sm"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-500" />
              <span>{lang === 'ml' ? 'അബൗട്ട് സ്റ്റുഡിയോ (Edit)' : 'Edit About Content'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              feedback('tick');
              navigate('/guide');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{lang === 'ml' ? 'യൂസർ ഗൈഡ് (Guide)' : 'User Guide'}</span>
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-16 sm:space-y-24">
        {/* 1. Hero Sanctuary & Direct Anchor Dock */}
        <AboutHero
          meta={meta}
          stats={meta?.stats}
          onNavigateSection={scrollToSection}
        />

        {/* 2. Dars Ethos & Sacred Tradition */}
        <DarsHeritageSection ethosData={meta?.darsEthos} />

        {/* 3. Mudarrisun (Faculty Sanctuary) */}
        <MudarrisunSection facultyList={mudarrisun} />

        {/* 4. ADSA Students Association Story & Wings */}
        <ADSAStorySection adsaData={meta?.adsaStory} />

        {/* 5. Central Committee Executive Leadership with Academic Tenure Switcher */}
        <CentralCommitteeSection tenuresList={tenures} />

        {/* 6. Canteen Wing & Mess Guardians */}
        <CanteenWingSection canteenMembers={canteenMembers} />

        {/* 7. Specialized Sub-Committees & Wings */}
        <CommitteesGridSection subCommittees={subCommittees} />

        {/* 8. ADSA T-Board Story & Anti-Waste Mission */}
        <TBoardOriginSection tboardData={meta?.tboardStory} />

        {/* 9. Interactive Platform Features Bento Grid */}
        <PlatformFeaturesSection featuresList={features} />

        {/* 10. Direct Bridge to User Guide & Walkthrough Tour */}
        <GuideBridgeSection />

        {/* 11. Campus Chronicles & Lightbox Gallery */}
        <CampusGallerySection galleryItems={gallery} />

        {/* 12. Institutional Coordinates & Footer Card */}
        <div className="p-8 sm:p-10 rounded-3xl bg-gradient-to-br from-emerald-950 via-[#072418] to-slate-950 text-white border border-emerald-500/30 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-center md:text-left max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold">
              <MapPin className="w-3.5 h-3.5" />
              <span>Alathurpadi Dars & Juma Masjid Campus</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black">
              {lang === 'ml'
                ? 'ആലത്തൂർപടി, മേൽമുറി, മലപ്പുറം, കേരളം'
                : 'Melmuri, Malappuram, Kerala 676517'}
            </h3>
            <p className="text-xs sm:text-sm text-emerald-100/80">
              {lang === 'ml'
                ? 'അറിവിന്റെയും ആത്മീയതയുടെയും പവിത്ര കേന്ദ്രം. സന്ദർശകരെയും പൂർവ്വവിദ്യാർത്ഥികളെയും സ്വാഗതം ചെയ്യുന്നു.'
                : 'The sacred seat of traditional Islamic scholarship and zero-waste dining discipline. Welcoming scholars, alumni, and community guests.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <a
              href="https://maps.google.com/?q=Alathurpadi+Dars+Melmuri+Malappuram"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => feedback('pop')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-95"
            >
              <MapPin className="w-4 h-4 text-amber-300" />
              <span>{lang === 'ml' ? 'ഗൂഗിൾ മാപ്പിൽ കാണുക' : 'View on Google Maps'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <a
              href="https://alathurpadidars.in/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => feedback('pop')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-xs sm:text-sm font-bold transition-all active:scale-95"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>{lang === 'ml' ? 'ഔദ്യോഗിക വെബ്സൈറ്റ്' : 'Official Portal'}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

