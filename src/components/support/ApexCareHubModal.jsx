import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Search,
  BookOpen,
  PhoneCall,
  HeartHandshake,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { useLanguage } from '../../store/LanguageContext';
import CareDispatcherForm from './CareDispatcherForm';
import CareTracker from './CareTracker';
import CareKnowledgeBase from './CareKnowledgeBase';
import CareDirectory from './CareDirectory';

const TABS = [
  { id: 'feedback', key: 'expressFeedback', label: 'Express Feedback', icon: Sparkles },
  { id: 'tracker', key: 'trackRequest', label: 'Track Request', icon: Search },
  { id: 'faq', key: 'knowledgeBase', label: 'FAQ & Guides', icon: BookOpen },
  { id: 'directory', key: 'committeeHotlines', label: 'Direct Hotlines', icon: PhoneCall },
];

export default function ApexCareHubModal({
  isOpen = false,
  onClose,
  initialTab = 'feedback',
  initialTrackingCode = '',
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [trackingCode, setTrackingCode] = useState(initialTrackingCode);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (initialTrackingCode) {
      setTrackingCode(initialTrackingCode);
      setActiveTab('tracker');
    }
  }, [initialTrackingCode]);

  const handleClose = useCallback(() => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    if (onClose) onClose();
  }, [onClose]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  const handleSwitchTab = (tabId) => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setActiveTab(tabId);
  };

  const handleNavigateTrack = (code) => {
    setTrackingCode(code);
    setActiveTab('tracker');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            transition={{ type: 'spring', stiffness: 420, damping: 30 }}
            className="relative w-full max-w-3xl bg-white dark:bg-[#09110e] border border-gray-200 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col z-10"
          >
            {/* Top Gradient Banner */}
            <div className="p-4 sm:p-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white flex items-center justify-between relative overflow-hidden">
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner">
                  <HeartHandshake className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-100" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base sm:text-xl font-black tracking-tight text-white">
                      {t('careHubTitle', 'ADSA Care & Concierge')}
                    </h2>
                    <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-extrabold uppercase">
                      <ShieldCheck className="w-3 h-3" /> Live
                    </span>
                  </div>
                  <p className="text-[11px] sm:text-xs text-emerald-100 mt-0.5">
                    {t('careHubSubtitle', 'Direct feedback, rapid dispute resolution & campus helpdesk')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="relative z-10 p-2 sm:p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Surface Switcher Tabs */}
            <div className="px-4 sm:px-6 pt-3 bg-gray-50/80 dark:bg-white/5 border-b border-gray-200/80 dark:border-white/10 flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none">
              {TABS.map((tab) => {
                const Icon = tab.icon;
                const isSelected = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleSwitchTab(tab.id)}
                    className={`relative flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition-all cursor-pointer flex-shrink-0 ${
                      isSelected
                        ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-[#09110e] border-t-2 border-emerald-500 shadow-xs'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/60 dark:hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{t(tab.key, tab.label)}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Surface Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 sm:p-7">
              {activeTab === 'feedback' && (
                <CareDispatcherForm
                  onNavigateTrack={handleNavigateTrack}
                />
              )}

              {activeTab === 'tracker' && (
                <CareTracker
                  initialCode={trackingCode}
                />
              )}

              {activeTab === 'faq' && (
                <CareKnowledgeBase
                  onNavigateFeedback={() => setActiveTab('feedback')}
                />
              )}

              {activeTab === 'directory' && (
                <CareDirectory />
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
