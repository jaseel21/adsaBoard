import React, { useState, useEffect, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sliders, Sparkles, ArrowLeft, RotateCcw } from 'lucide-react';
import { AuthContext } from '../../store/AuthContext';
import { DataOfOne } from '../../store/StudentData';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { usePreferences } from '../../store/PreferencesContext';
import { getVisibleSettingsSections } from '../../utils/preferencesConfig';
import useSEO from '../../hooks/useSEO';

import SettingsSidebarNav from './SettingsSidebarNav';
import SettingsQuickSearch from './SettingsQuickSearch';
import SettingsUnsavedDock from './SettingsUnsavedDock';

import GeneralSection from './sections/GeneralSection';
import AppearanceSection from './sections/AppearanceSection';
import SoundHapticsSection from './sections/SoundHapticsSection';
import AccountProfileSection from './sections/AccountProfileSection';
import SecuritySessionsSection from './sections/SecuritySessionsSection';
import PrivacyStorageSection from './sections/PrivacyStorageSection';
import DataBackupSection from './sections/DataBackupSection';
import CanteenOpsSection from './sections/CanteenOpsSection';
import HelpDiagnosticsSection from './sections/HelpDiagnosticsSection';

export default function SettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();

  useSEO({
    title: 'Preferences & System Settings',
    description: 'Personalize themes, language, synthesized audio effects, dining token credentials, and campus security parameters.',
    keywords: 'settings, preferences, appearance, dark theme, audio feedback, kiosk guard, adsa t-board',
  });

  const {
    user,
    role,
    roleBadge,
    staffProfile,
    isAdmin,
  } = useContext(AuthContext);

  const { stdata, setStdata, logoutStudent } = useContext(DataOfOne);

  const {
    preferences,
    setPreference,
    savePreferences,
    discardChanges,
    resetToFactoryDefaults,
    isDirty,
    dirtyCount,
  } = usePreferences();

  // Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Determine visible sections based on user role
  const visibleSections = useMemo(
    () => getVisibleSettingsSections(role, Boolean(stdata?.tokenNo)),
    [role, stdata?.tokenNo]
  );

  // Active section tracking via URL Hash or fallback
  const [activeSectionId, setActiveSectionId] = useState(() => {
    const hash = location.hash?.replace('#', '');
    if (hash && visibleSections.some((s) => s.id === hash)) {
      return hash;
    }
    return visibleSections[0]?.id || 'general';
  });

  // Sync hash changes
  useEffect(() => {
    const hash = location.hash?.replace('#', '');
    if (hash && visibleSections.some((s) => s.id === hash)) {
      setActiveSectionId(hash);
    }
  }, [location.hash, visibleSections]);

  const handleSelectSection = (id) => {
    setActiveSectionId(id);
    navigate(`/settings#${id}`, { replace: true });
    // Scroll smoothly to main panel on mobile
    if (window.innerWidth < 1024) {
      const el = document.getElementById(`section-${id}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // Section component renderer
  const renderSection = (id) => {
    switch (id) {
      case 'general':
        return <GeneralSection preferences={preferences} setPreference={setPreference} />;
      case 'appearance':
        return <AppearanceSection preferences={preferences} setPreference={setPreference} />;
      case 'feedback':
        return <SoundHapticsSection preferences={preferences} setPreference={setPreference} />;
      case 'account':
        return (
          <AccountProfileSection
            user={user}
            role={role}
            roleBadge={roleBadge}
            staffProfile={staffProfile}
            stdata={stdata}
            setStdata={setStdata}
            logoutStudent={logoutStudent}
          />
        );
      case 'security':
        return (
          <SecuritySessionsSection
            preferences={preferences}
            setPreference={setPreference}
            user={user}
            stdata={stdata}
          />
        );
      case 'privacy':
        return (
          <PrivacyStorageSection
            preferences={preferences}
            setPreference={setPreference}
            resetToFactoryDefaults={resetToFactoryDefaults}
            stdata={stdata}
          />
        );
      case 'backup':
        return (
          <DataBackupSection
            user={user}
            role={role}
            isAdmin={isAdmin}
            stdata={stdata}
          />
        );
      case 'canteen-ops':
        return (
          <CanteenOpsSection
            preferences={preferences}
            setPreference={setPreference}
            user={user}
            role={role}
          />
        );
      case 'about':
        return <HelpDiagnosticsSection />;
      default:
        return <GeneralSection preferences={preferences} setPreference={setPreference} />;
    }
  };

  // Filter sections by search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return visibleSections;
    const q = searchQuery.toLowerCase().trim();
    return visibleSections.filter((sec) => {
      const matchLabelEn = sec.labelEn.toLowerCase().includes(q);
      const matchLabelMl = sec.labelMl.toLowerCase().includes(q);
      const matchDescEn = sec.descriptionEn.toLowerCase().includes(q);
      const matchDescMl = sec.descriptionMl.toLowerCase().includes(q);
      const matchId = sec.id.toLowerCase().includes(q);
      return matchLabelEn || matchLabelMl || matchDescEn || matchDescMl || matchId;
    });
  }, [searchQuery, visibleSections]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-28">
      {/* Top Header Card */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-1">
            <Sliders className="w-4 h-4" />
            <span className="uppercase tracking-wider">
              {language === 'ml' ? 'സിസ്റ്റം കൺട്രോൾ സെന്റർ' : 'System Preferences'}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
            {language === 'ml' ? 'ക്രമീകരണങ്ങളും മുൻഗണനകളും' : 'Settings & Preferences'}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
            {language === 'ml'
              ? 'ആപ്പിന്റെ പ്രതീതി, ശബ്ദം, വ്യക്തിഗത വിവരങ്ങൾ, കിയോസ്ക് സുരക്ഷ എന്നിവ മാറ്റുക'
              : 'Configure visual themes, synthesized audio feedback, token credentials, and disaster recovery'}
          </p>
        </div>

        {/* Quick Search */}
        <div className="w-full md:w-80">
          <SettingsQuickSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            matchCount={searchQuery ? filteredSections.length : null}
          />
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        {/* Left Sticky Sidebar */}
        <SettingsSidebarNav
          sections={visibleSections}
          activeSectionId={activeSectionId}
          onSelectSection={handleSelectSection}
        />

        {/* Right Content Panel */}
        <main className="flex-1 w-full min-w-0">
          {searchQuery ? (
            /* Multi-Section Search Results View */
            <div className="space-y-10">
              {filteredSections.length > 0 ? (
                filteredSections.map((sec) => (
                  <div key={sec.id} id={`section-${sec.id}`} className="space-y-4">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                      <span className="text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                        {language === 'ml' ? sec.labelMl : sec.labelEn}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">#{sec.id}</span>
                    </div>
                    {renderSection(sec.id)}
                  </div>
                ))
              ) : (
                <div className="p-12 text-center rounded-3xl bg-white/70 dark:bg-[#0c1412]/70 border border-gray-200/80 dark:border-white/10 space-y-3">
                  <Sliders className="w-8 h-8 text-gray-400 mx-auto opacity-50" />
                  <span className="text-sm font-extrabold text-gray-700 dark:text-gray-300 block">
                    No Settings Found for &quot;{searchQuery}&quot;
                  </span>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Try searching for theme, language, audio, password, backup, or kiosk timeout.
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Standard Single Active Section View */
            <div id={`section-${activeSectionId}`}>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSectionId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.15 }}
                >
                  {renderSection(activeSectionId)}
                </motion.div>
              </AnimatePresence>
            </div>
          )}
        </main>
      </div>

      {/* Sticky Unsaved Changes Floating Dock */}
      <SettingsUnsavedDock
        isDirty={isDirty}
        dirtyCount={dirtyCount}
        onSave={savePreferences}
        onDiscard={discardChanges}
      />
    </div>
  );
}
