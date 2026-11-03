import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  Compass,
  Printer,
  Sparkles,
  Layers,
  Clock,
  Filter,
  UserCheck,
  Command,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import ColorSystemLegend from './ColorSystemLegend';
import TokenSimulator from './TokenSimulator';
import {
  TimingsAndCutoff,
  ViewsAndFilters,
  StudentPortalTips,
  KitchenAndSheets,
  ShortcutsAndGestures,
  VisualSlidePostModule,
} from './GuideModules';
import WalkthroughTour from './WalkthroughTour';
import useSEO from '../../hooks/useSEO';
import { useTourEngine } from '../tour/TourEngineContext';

const GuidePage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const { openMissionHub } = useTourEngine();
  const initialTab = searchParams.get('tab') || 'visual-slides';
  const [activeTab, setActiveTab] = useState(initialTab);

  useSEO({
    title: 'System Guide & Visual User Manual',
    description:
      'Comprehensive documentation and visual manual on meal schedules, cutoff rules, color codes, and gestures for ADSA T-Board.',
    keywords:
      'adsa t-board guide, token board manual, canteen cutoff rules, color system legend, student guide',
    image: '/og-preview.png',
  });

  const TABS = [
    { id: 'visual-slides', label: 'Slide Post Guide', icon: Sparkles },
    { id: 'student-portal', label: 'Student Portal Walkthrough', icon: UserCheck },
    { id: 'color-system', label: 'Color System', icon: Layers },
    { id: 'simulator', label: 'Tactile Simulator', icon: Sparkles },
    { id: 'timings-cutoff', label: 'Cutoff & IST Time', icon: Clock },
    { id: 'views-filters', label: 'Views & Search', icon: Filter },
    { id: 'kitchen-sheets', label: 'Kitchen Sheets', icon: Printer },
    { id: 'shortcuts', label: 'Shortcuts & Power Tips', icon: Command },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-8">
      {/* Back button and page breadcrumbs */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => {
            feedback('tick');
            navigate('/');
          }}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Token Board</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              feedback('tick');
              window.print();
            }}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Manual</span>
          </button>
          <button
            onClick={() => {
              feedback('pop');
              openMissionHub();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Start Live Tour</span>
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-800 via-emerald-900 to-teal-950 p-6 sm:p-10 text-white shadow-xl border border-emerald-500/20 backdrop-blur-xl">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-xs font-semibold text-emerald-200">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Comprehensive Documentation & Visual Manual</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Token Board System Guide
          </h1>
          <p className="text-sm text-emerald-100/80 leading-relaxed">
            Everything students, kitchen chefs, and mess administrators need to know about dining schedules, color codes, cut-off rules, and real-time operations.
          </p>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                feedback('tick');
                setActiveTab(tab.id);
                setSearchParams({ tab: tab.id });
              }}
              className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-[#0f1715] text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 border border-gray-200/80 dark:border-white/10'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'visual-slides' && <VisualSlidePostModule />}
        {activeTab === 'student-portal' && <StudentPortalTips />}
        {activeTab === 'color-system' && <ColorSystemLegend />}
        {activeTab === 'simulator' && <TokenSimulator />}
        {activeTab === 'views-filters' && <ViewsAndFilters />}
        {activeTab === 'timings-cutoff' && <TimingsAndCutoff />}
        {activeTab === 'kitchen-sheets' && <KitchenAndSheets />}
        {activeTab === 'shortcuts' && <ShortcutsAndGestures />}
      </div>
    </div>
  );
};

export default GuidePage;
