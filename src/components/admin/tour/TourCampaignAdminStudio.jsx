import React, { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Calendar,
  Clock,
  Users,
  Sparkles,
  Save,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Zap,
  Eye,
  Sliders,
  ShieldCheck,
  Monitor,
  Smartphone,
  Laptop,
  Timer,
  X,
} from 'lucide-react';
import {
  DEFAULT_TOUR_CAMPAIGN,
  subscribeToTourCampaign,
  updateTourCampaign,
  getISTDateTime,
} from '../../../utils/tourCampaignService';
import { AuthContext } from '../../../store/AuthContext';
import { useFeedback } from '../../../utils/useFeedback';
import { dialog } from '../../../utils/dialog';

export default function TourCampaignAdminStudio() {
  const { user, role } = useContext(AuthContext);
  const { feedback } = useFeedback();

  const [campaign, setCampaign] = useState(DEFAULT_TOUR_CAMPAIGN);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [previewMode, setPreviewMode] = useState('desktop'); // 'desktop' | 'mobile'

  useEffect(() => {
    const unsub = subscribeToTourCampaign((cfg) => {
      setCampaign(cfg);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    feedback('tick');
    try {
      await updateTourCampaign(campaign, {
        uid: user?.uid || 'admin',
        displayName: user?.displayName || user?.email || 'Admin',
        role: role || 'admin',
      });
      setSaveSuccess(true);
      feedback('success');
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save tour campaign settings:', err);
      dialog.alert('Error', 'Failed to save tour campaign settings: ' + err.message);
      feedback('error');
    } finally {
      setSaving(false);
    }
  };

  const { dateStr, timeStr } = getISTDateTime();

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-600 rounded-full animate-spin" />
          <span className="text-xs font-semibold text-gray-500">Loading tour governance...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-emerald-800 via-teal-900 to-emerald-950 p-6 sm:p-8 text-white shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center text-white shadow-inner flex-shrink-0">
            <Compass className="w-6 h-6 animate-spin-slow" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">Live Tour Governance & Campaigns</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                Master Control
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100/80">
              Configure who receives automated tour prompts, active date ranges, and time windows.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2.5 rounded-2xl bg-white hover:bg-emerald-50 text-emerald-900 font-extrabold text-xs shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
          >
            {saving ? (
              <span className="w-4 h-4 border-2 border-emerald-900/30 border-t-emerald-900 rounded-full animate-spin" />
            ) : saveSuccess ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Save className="w-4 h-4 text-emerald-700" />
            )}
            <span>{saveSuccess ? 'Saved Live!' : 'Publish Campaign'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Targeting & Schedules (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Master Switch & Audience */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1613] border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base">Audience Targeting & Master Switch</h3>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={campaign.enabled}
                  onChange={(e) => setCampaign({ ...campaign, enabled: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                {
                  id: 'first_time',
                  label: 'First-Time Visitors Only',
                  desc: 'Prompts guests & students who have not completed onboarding.',
                },
                {
                  id: 'all',
                  label: 'All Campus Visitors',
                  desc: 'Prompts everyone on landing (ideal for major feature launches).',
                },
                {
                  id: 'students_only',
                  label: 'Students Only',
                  desc: 'Only prompts users navigating the student portal or dining areas.',
                },
                {
                  id: 'disabled',
                  label: 'Mute All Prompts',
                  desc: 'No automatic prompts; tour remains strictly manual via Guide.',
                },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setCampaign({ ...campaign, targetAudience: opt.id })}
                  className={`
                    p-4 rounded-2xl border text-left transition-all
                    ${
                      campaign.targetAudience === opt.id
                        ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500'
                        : 'bg-gray-50/70 dark:bg-white/[0.02] border-gray-200 dark:border-white/10 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                    }
                  `}
                >
                  <span className="font-extrabold text-xs block mb-1">{opt.label}</span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 block leading-snug">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Device Targeting Section */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1613] border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <Monitor className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-base">Device Targeting & Platform Control</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Control which device screens receive automated tour prompts.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {[
                {
                  id: 'all',
                  label: 'All Devices',
                  desc: 'Prompts on desktops, laptops, tablets, and smartphones.',
                  icon: Laptop,
                },
                {
                  id: 'desktop_only',
                  label: 'Desktop Only',
                  desc: 'Only prompts on desktop/laptop screens (≥ 768px). Silent on mobile.',
                  icon: Monitor,
                },
                {
                  id: 'mobile_only',
                  label: 'Mobile Only',
                  desc: 'Only prompts visitors on mobile handhelds (< 768px). Silent on desktop.',
                  icon: Smartphone,
                },
              ].map((opt) => {
                const Icon = opt.icon;
                const isSelected = (campaign.targetDevice || 'all') === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setCampaign({ ...campaign, targetDevice: opt.id })}
                    className={`
                      p-4 rounded-2xl border text-left transition-all flex flex-col justify-between
                      ${
                        isSelected
                          ? 'bg-emerald-500/10 border-emerald-500 text-emerald-900 dark:text-emerald-100 shadow-sm ring-1 ring-emerald-500'
                          : 'bg-gray-50/70 dark:bg-white/[0.02] border-gray-200 dark:border-white/10 hover:border-gray-300 text-gray-700 dark:text-gray-300'
                      }
                    `}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`p-1.5 rounded-xl ${
                          isSelected
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-200 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="font-extrabold text-xs block">{opt.label}</span>
                    </div>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 block leading-snug">
                      {opt.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date Range & Time Window */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1613] border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
            <div className="flex items-center gap-2.5">
              <Calendar className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-base">Date Range & Time Constraints</h3>
            </div>

            {/* Date Range */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-xs text-gray-900 dark:text-white block">
                    Active Date Window (Campus Term)
                  </span>
                  <span className="text-[11px] text-gray-500">Only prompt users within specific dates.</span>
                </div>
                <input
                  type="checkbox"
                  checked={campaign.dateRange?.enforceDateRange || false}
                  onChange={(e) =>
                    setCampaign({
                      ...campaign,
                      dateRange: { ...campaign.dateRange, enforceDateRange: e.target.checked },
                    })
                  }
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </div>

              {campaign.dateRange?.enforceDateRange && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Start Date</label>
                    <input
                      type="date"
                      value={campaign.dateRange?.startDate || ''}
                      onChange={(e) =>
                        setCampaign({
                          ...campaign,
                          dateRange: { ...campaign.dateRange, startDate: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">End Date</label>
                    <input
                      type="date"
                      value={campaign.dateRange?.endDate || ''}
                      onChange={(e) =>
                        setCampaign({
                          ...campaign,
                          dateRange: { ...campaign.dateRange, endDate: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Time Window */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-extrabold text-xs text-gray-900 dark:text-white block">
                    Daily IST Time Window (Dining Hours)
                  </span>
                  <span className="text-[11px] text-gray-500">Prevent disturbing students during late-night hours.</span>
                </div>
                <input
                  type="checkbox"
                  checked={campaign.timeWindow?.enforceTimeWindow || false}
                  onChange={(e) =>
                    setCampaign({
                      ...campaign,
                      timeWindow: { ...campaign.timeWindow, enforceTimeWindow: e.target.checked },
                    })
                  }
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </div>

              {campaign.timeWindow?.enforceTimeWindow && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Start Time (IST)</label>
                    <input
                      type="time"
                      value={campaign.timeWindow?.startTime || '08:00'}
                      onChange={(e) =>
                        setCampaign({
                          ...campaign,
                          timeWindow: { ...campaign.timeWindow, startTime: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">End Time (IST)</label>
                    <input
                      type="time"
                      value={campaign.timeWindow?.endTime || '22:00'}
                      onChange={(e) =>
                        setCampaign({
                          ...campaign,
                          timeWindow: { ...campaign.timeWindow, endTime: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Current IST status indicator */}
            <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span>Current Server IST: <strong>{dateStr}</strong> at <strong>{timeStr}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column: Trigger Rules & Banner Preview */}
        <div className="space-y-6">
          {/* Trigger Frequency */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1613] border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-emerald-600" />
              <h3 className="font-extrabold text-base">Prompt Frequency</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Delay Before Prompt (Seconds)
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={campaign.triggerRule?.delaySeconds ?? 3}
                  onChange={(e) =>
                    setCampaign({
                      ...campaign,
                      triggerRule: { ...campaign.triggerRule, delaySeconds: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                    Auto-Close Countdown (Seconds)
                  </label>
                  <span className="text-[11px] font-extrabold text-emerald-600">
                    {(campaign.triggerRule?.autoCloseSeconds ?? 12) === 0
                      ? 'Disabled (Manual Only)'
                      : `${campaign.triggerRule?.autoCloseSeconds ?? 12}s`}
                  </span>
                </div>
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={campaign.triggerRule?.autoCloseSeconds ?? 12}
                  onChange={(e) =>
                    setCampaign({
                      ...campaign,
                      triggerRule: {
                        ...campaign.triggerRule,
                        autoCloseSeconds: Math.max(0, Math.min(60, Number(e.target.value))),
                      },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                />
                <span className="text-[10px] text-gray-400 block mt-0.5">
                  Automatically dismisses prompt if visitor ignores it. Set 0 to keep open indefinitely.
                </span>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300 block mb-1">
                  Dismissal Cooldown (Days)
                </label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={campaign.triggerRule?.repromptCooldownDays ?? 7}
                  onChange={(e) =>
                    setCampaign({
                      ...campaign,
                      triggerRule: { ...campaign.triggerRule, repromptCooldownDays: Number(e.target.value) },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl text-xs bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10"
                />
                <span className="text-[10px] text-gray-400 block mt-0.5">Set 0 to never prompt again if dismissed.</span>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-white/10">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Enforce until mission completed
                </span>
                <input
                  type="checkbox"
                  checked={campaign.triggerRule?.enforceUntilCompleted || false}
                  onChange={(e) =>
                    setCampaign({
                      ...campaign,
                      triggerRule: { ...campaign.triggerRule, enforceUntilCompleted: e.target.checked },
                    })
                  }
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
              </div>
            </div>
          </div>

          {/* Banner Copy Preview */}
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0c1613] border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-600 block">
                Live Banner Preview
              </span>
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setPreviewMode('desktop')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                    previewMode === 'desktop'
                      ? 'bg-white dark:bg-emerald-600 text-emerald-900 dark:text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Monitor className="w-3 h-3" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewMode('mobile')}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 ${
                    previewMode === 'mobile'
                      ? 'bg-white dark:bg-emerald-600 text-emerald-900 dark:text-white shadow-xs'
                      : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                  }`}
                >
                  <Smartphone className="w-3 h-3" />
                  <span>Mobile Compact</span>
                </button>
              </div>
            </div>

            {previewMode === 'desktop' ? (
              /* Desktop Preview */
              <div className="relative rounded-2xl bg-gradient-to-br from-emerald-900 to-teal-950 p-4 text-white text-xs space-y-2 border border-emerald-400/30 shadow-md overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Compass className="w-4 h-4 text-emerald-300 animate-spin-slow" />
                    <span className="font-extrabold truncate">{campaign.bannerContent?.titleEn}</span>
                  </div>
                  <span className="p-1 rounded-md text-gray-400">
                    <X className="w-3.5 h-3.5" />
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 leading-snug">{campaign.bannerContent?.subtitleEn}</p>
                <div className="pt-2 flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-emerald-500 text-white font-extrabold text-[10px] flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-300 fill-amber-300" />
                    <span>Start Interactive Tour</span>
                  </span>
                  <span className="text-[10px] text-gray-400">Later</span>
                </div>
                {(campaign.triggerRule?.autoCloseSeconds ?? 12) > 0 && (
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 w-3/4 animate-pulse" />
                  </div>
                )}
              </div>
            ) : (
              /* Mobile Compact Preview */
              <div className="relative rounded-2xl bg-gradient-to-br from-emerald-900 via-teal-950 to-[#08120e] p-2.5 text-white text-xs border border-emerald-400/35 shadow-md overflow-hidden">
                <div className="flex items-center justify-between gap-2">
                  <span className="w-7 h-7 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 flex-shrink-0">
                    <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                  </span>
                  <div className="flex-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[8px] font-extrabold uppercase tracking-wider text-emerald-400">
                        Interactive Tour
                      </span>
                      <span className="px-1 py-0.2 rounded text-[7px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                        v2.0
                      </span>
                    </div>
                    <h4 className="text-[11px] font-black truncate leading-tight">
                      {campaign.bannerContent?.titleEn}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="py-1 px-2.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-[10px] shadow-xs flex items-center gap-1">
                      <Zap className="w-2.5 h-2.5 text-amber-300 fill-amber-300" />
                      <span>Tour</span>
                    </span>
                    <span className="p-1 rounded-md text-gray-400">
                      <X className="w-3 h-3" />
                    </span>
                  </div>
                </div>
                {(campaign.triggerRule?.autoCloseSeconds ?? 12) > 0 && (
                  <div className="absolute inset-x-0 bottom-0 h-0.5 bg-white/10 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-300 w-3/4 animate-pulse" />
                  </div>
                )}
              </div>
            )}
            <p className="text-[10px] text-gray-400 italic">
              {(campaign.triggerRule?.autoCloseSeconds ?? 12) > 0
                ? `* Auto-dismisses in ${campaign.triggerRule?.autoCloseSeconds ?? 12}s if untouched. Pauses on hover/touch.`
                : '* Manual dismissal only (no auto-close).'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

