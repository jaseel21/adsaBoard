import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HeartHandshake,
  Sparkles,
  Search,
  BookOpen,
  PhoneCall,
  ShieldCheck,
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { useLanguage } from '../../store/LanguageContext';
import CareDispatcherForm from './CareDispatcherForm';
import CareTracker from './CareTracker';
import CareKnowledgeBase from './CareKnowledgeBase';
import CareDirectory from './CareDirectory';
import useSEO from '../../hooks/useSEO';

const TABS = [
  { id: 'feedback', key: 'expressFeedback', label: 'Express Feedback', icon: Sparkles },
  { id: 'tracker', key: 'trackRequest', label: 'Track Request', icon: Search },
  { id: 'faq', key: 'knowledgeBase', label: 'FAQ & Guides', icon: BookOpen },
  { id: 'directory', key: 'committeeHotlines', label: 'Direct Hotlines', icon: PhoneCall },
];

export default function CareHubPage() {
  const { t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabParam = searchParams.get('tab');
  const codeParam = searchParams.get('code') || '';

  const [activeTab, setActiveTab] = useState(
    tabParam && TABS.some((t) => t.id === tabParam) ? tabParam : 'feedback'
  );
  const [trackingCode, setTrackingCode] = useState(codeParam);

  useSEO({
    title: 'ADSA Care & Concierge Hub • Campus Helpdesk',
    description:
      'Direct student inquiry tracking, 1-click token unblocking, committee hotlines, and campus dining assistance for Alathurpadi Dars.',
    keywords:
      'adsa care, alathurpadi dars helpdesk, token unblock, canteen feedback, dars student support',
    image: '/og-support.png',
  });

  useEffect(() => {
    if (tabParam && TABS.some((t) => t.id === tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    if (codeParam) {
      setTrackingCode(codeParam);
      setActiveTab('tracker');
    }
  }, [codeParam]);

  const handleTabChange = (tabId) => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
  };

  const handleNavigateTrack = (code) => {
    setTrackingCode(code);
    setActiveTab('tracker');
    setSearchParams({ tab: 'tracker', code });
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 flex flex-col gap-6 sm:gap-8">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl relative overflow-hidden"
      >
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-3xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
              <HeartHandshake className="w-7 h-7 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {t('careHubTitle', 'ADSA Care & Concierge')}
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase">
                  <ShieldCheck className="w-3.5 h-3.5" /> Campus Helpdesk
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1 max-w-xl">
                {t('careHubSubtitle', 'Direct feedback, rapid dispute resolution & campus helpdesk')}
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Surface Navigation Ribbon */}
      <div className="flex items-center p-1.5 rounded-2xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/10 shadow-sm overflow-x-auto scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabChange(tab.id)}
              className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                isSelected
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-600/20'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t(tab.key, tab.label)}</span>
            </button>
          );
        })}
      </div>

      {/* Surface Content Body */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="p-5 sm:p-8 rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/10 shadow-xl"
      >
        {activeTab === 'feedback' && (
          <CareDispatcherForm onNavigateTrack={handleNavigateTrack} />
        )}

        {activeTab === 'tracker' && (
          <CareTracker initialCode={trackingCode} />
        )}

        {activeTab === 'faq' && (
          <CareKnowledgeBase onNavigateFeedback={() => handleTabChange('feedback')} />
        )}

        {activeTab === 'directory' && (
          <CareDirectory />
        )}
      </motion.div>
    </div>
  );
}
