import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  GraduationCap,
  Sparkles,
  Layers,
  Users,
  Compass,
  Eye,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import useSEO from '../../../hooks/useSEO';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { AuthContext } from '../../../store/AuthContext';
import { ROLES, hasRole } from '../../../utils/rbac';

import {
  subscribeAboutMeta,
  subscribeMudarrisun,
  subscribeTenures,
} from '../../../utils/aboutService';

import AboutMetaEditor from './AboutMetaEditor';
import AboutMudarrisunEditor from './AboutMudarrisunEditor';
import AboutTenureEditor from './AboutTenureEditor';

export default function AboutStudio() {
  const navigate = useNavigate();
  const { lang, t } = useLanguage();
  const { feedback } = useFeedback();
  const { user, role } = useContext(AuthContext);

  const actor = {
    name: user?.displayName || user?.email || 'Central Admin',
    email: user?.email,
    role,
  };

  useSEO({
    title: 'Institutional About Studio & Content Manager',
    description: 'Dynamic administrative control for Alathurpadi Dars About page, Mudarrisun faculty, and ADSA committees.',
  });

  const [activeTab, setActiveTab] = useState('mudarrisun'); // 'meta' | 'mudarrisun' | 'committees'

  // Subscriptions
  const [meta, setMeta] = useState(null);
  const [mudarrisun, setMudarrisun] = useState([]);
  const [tenures, setTenures] = useState([]);

  useEffect(() => {
    const unsubMeta = subscribeAboutMeta(setMeta);
    const unsubMudarrisun = subscribeMudarrisun(setMudarrisun);
    const unsubTenures = subscribeTenures(setTenures);

    return () => {
      unsubMeta();
      unsubMudarrisun();
      unsubTenures();
    };
  }, []);

  const TABS = [
    {
      id: 'mudarrisun',
      labelEn: 'Mudarrisun Faculty',
      labelMl: 'മുദരിസുമാർ',
      icon: GraduationCap,
      badge: mudarrisun.length,
    },
    {
      id: 'committees',
      labelEn: 'Tenures & Committees',
      labelMl: 'കമ്മിറ്റി ഭാരവാഹികൾ',
      icon: Users,
      badge: tenures.length,
    },
    {
      id: 'meta',
      labelEn: 'Hero & Institutional Meta',
      labelMl: 'ഹീറോ & മെറ്റാ ക്രമീകരണങ്ങൾ',
      icon: Settings,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-white/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              feedback('tick');
              navigate('/admin');
            }}
            className="p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-gray-300 transition-all active:scale-95"
            title="Back to Admin Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                {lang === 'ml' ? 'അബൗട്ട് സ്റ്റുഡിയോ (About Studio)' : 'Institutional About Studio'}
              </h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30">
                Live CRUD
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {lang === 'ml'
                ? 'മുദരിസുമാർ, അഡ്സ സെൻട്രൽ കമ്മിറ്റി, കാന്റീൻ വിംഗ് വിവരങ്ങൾ തത്സമയം മാറ്റുക'
                : 'Real-time content management for Alathurpadi Dars & ADSA T-Board About page.'}
            </p>
          </div>
        </div>

        {/* View Public Live Page Button */}
        <button
          type="button"
          onClick={() => {
            feedback('pop');
            navigate('/about');
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <Eye className="w-4 h-4" />
          <span>{lang === 'ml' ? 'ലൈവ് പേജ് കാണുക' : 'View Public Page'}</span>
        </button>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((tab) => {
          const IconComp = tab.icon;
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                feedback('tick');
                setActiveTab(tab.id);
              }}
              className={`relative inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white dark:bg-[#0c1512] text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 border border-gray-200 dark:border-emerald-500/20'
              }`}
            >
              <IconComp className="w-4 h-4" />
              <span>{lang === 'ml' ? tab.labelMl : tab.labelEn}</span>
              {tab.badge !== undefined && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-500'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="pt-2">
        {activeTab === 'mudarrisun' && (
          <AboutMudarrisunEditor facultyList={mudarrisun} actor={actor} />
        )}

        {activeTab === 'committees' && (
          <AboutTenureEditor tenuresList={tenures} actor={actor} />
        )}

        {activeTab === 'meta' && (
          <AboutMetaEditor meta={meta} actor={actor} />
        )}
      </div>
    </div>
  );
}

