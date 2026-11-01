import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Save,
  RotateCcw,
  Sparkles,
  Database,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { useLanguage } from '../../../store/LanguageContext';
import { useFeedback } from '../../../utils/useFeedback';
import { dialog } from '../../../utils/dialog';
import { saveAboutMeta, seedAboutInitialData } from '../../../utils/aboutService';

export default function AboutMetaEditor({ meta, actor }) {
  const { lang, t } = useLanguage();
  const { feedback } = useFeedback();

  const [formData, setFormData] = useState({
    hero: { ...(meta?.hero || {}) },
    stats: meta?.stats || [],
    darsEthos: { ...(meta?.darsEthos || {}) },
    adsaStory: { ...(meta?.adsaStory || {}) },
    tboardStory: { ...(meta?.tboardStory || {}) },
  });

  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleHeroChange = (field, val) => {
    setFormData((prev) => ({
      ...prev,
      hero: { ...prev.hero, [field]: val },
    }));
  };

  const handleStatChange = (idx, field, val) => {
    setFormData((prev) => {
      const nextStats = [...prev.stats];
      nextStats[idx] = { ...nextStats[idx], [field]: val };
      return { ...prev, stats: nextStats };
    });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      feedback('tick');
      await saveAboutMeta(formData, actor);
      dialog.toast.success(
        lang === 'ml' ? 'വിജയം' : 'Saved Successfully',
        lang === 'ml' ? 'മെറ്റാഡാറ്റ വിജയകരമായി സേവ് ചെയ്തു' : 'About metadata updated in Firestore.'
      );
    } catch (err) {
      dialog.toast.error(lang === 'ml' ? 'പരാജയം' : 'Save Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSeedDefaults = async () => {
    const confirmed = await dialog.confirm({
      title: lang === 'ml' ? 'ഡാറ്റ സീഡ് ചെയ്യണോ?' : 'Seed / Reset Default Institutional Data?',
      message:
        lang === 'ml'
          ? 'ഫയർസ്റ്റോറിലെ അബൗട്ട് വിവരങ്ങൾ പൂർണ്ണ ഡിഫോൾട്ട് ഡാറ്റ വെച്ച് അപ്‌ഡേറ്റ് ചെയ്യപ്പെടും. തുടരണോ?'
          : 'This will seed complete, authentic Alathurpadi Dars & ADSA content across all About collections in Firestore. Continue?',
      confirmText: lang === 'ml' ? 'അതെ, സീഡ് ചെയ്യുക' : 'Yes, Seed Data',
      cancelText: lang === 'ml' ? 'വേണ്ട' : 'Cancel',
      variant: 'danger',
    });

    if (confirmed) {
      try {
        setSeeding(true);
        feedback('pop');
        await seedAboutInitialData(actor);
        dialog.toast.success(
          lang === 'ml' ? 'സീഡിംഗ് പൂർത്തിയായി' : 'Seeded Successfully',
          lang === 'ml' ? 'അബൗട്ട് ഡാറ്റ വിജയകരമായി അപ്‌ഡേറ്റ് ചെയ്തു' : 'Initial institutional data seeded into Firestore.'
        );
      } catch (err) {
        dialog.toast.error('Seeding Error', err.message);
      } finally {
        setSeeding(false);
      }
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 max-w-5xl">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm">
        <div className="space-y-0.5">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
            {lang === 'ml' ? 'ഹീറോ & മെറ്റാ ക്രമീകരണങ്ങൾ' : 'Hero & Core Institutional Settings'}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {lang === 'ml'
              ? 'ഹെഡ്‌ലൈനുകൾ, സബ്‌ടൈറ്റിലുകൾ, പ്രധാന സ്റ്റാറ്റുകൾ'
              : 'Configure headlines, taglines, badges, and key metric counters.'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            disabled={seeding}
            onClick={handleSeedDefaults}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-bold text-gray-700 dark:text-gray-300 transition-all disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5 text-amber-500" />
            <span>{seeding ? 'Seeding...' : 'Seed Default Data'}</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Hero Headline Fields */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Hero Headlines & Badges
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Badge Text (English)
            </label>
            <input
              type="text"
              value={formData.hero.badgeEn || ''}
              onChange={(e) => handleHeroChange('badgeEn', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500/40 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Badge Text (Malayalam)
            </label>
            <input
              type="text"
              value={formData.hero.badgeMl || ''}
              onChange={(e) => handleHeroChange('badgeMl', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500/40 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Main Title (English)
            </label>
            <input
              type="text"
              value={formData.hero.titleEn || ''}
              onChange={(e) => handleHeroChange('titleEn', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500/40 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Main Title (Malayalam)
            </label>
            <input
              type="text"
              value={formData.hero.titleMl || ''}
              onChange={(e) => handleHeroChange('titleMl', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500/40 outline-none"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Subtitle (English)
            </label>
            <textarea
              rows={2}
              value={formData.hero.subtitleEn || ''}
              onChange={(e) => handleHeroChange('subtitleEn', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500/40 outline-none"
            />
          </div>

          <div className="sm:col-span-2 space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Subtitle (Malayalam)
            </label>
            <textarea
              rows={2}
              value={formData.hero.subtitleMl || ''}
              onChange={(e) => handleHeroChange('subtitleMl', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500/40 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Location (English)
            </label>
            <input
              type="text"
              value={formData.hero.locationEn || ''}
              onChange={(e) => handleHeroChange('locationEn', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500/40 outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
              Official Website URL
            </label>
            <input
              type="url"
              value={formData.hero.officialWebsite || ''}
              onChange={(e) => handleHeroChange('officialWebsite', e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-emerald-500/40 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Key Metric Stats Editor */}
      <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1512] border border-gray-200 dark:border-emerald-500/20 shadow-sm space-y-4">
        <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
          Hero Key Metric Stat Counters (4 Items)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(formData.stats || []).map((stat, sIdx) => (
            <div
              key={stat.id || sIdx}
              className="p-4 rounded-2xl bg-gray-50 dark:bg-black/30 border border-gray-200 dark:border-white/10 space-y-2"
            >
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Value (e.g. 50+)</label>
                <input
                  type="text"
                  value={stat.value || ''}
                  onChange={(e) => handleStatChange(sIdx, 'value', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Label (English)</label>
                <input
                  type="text"
                  value={stat.labelEn || ''}
                  onChange={(e) => handleStatChange(sIdx, 'labelEn', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500">Label (Malayalam)</label>
                <input
                  type="text"
                  value={stat.labelMl || ''}
                  onChange={(e) => handleStatChange(sIdx, 'labelMl', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </form>
  );
}

