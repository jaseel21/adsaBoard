import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Save,
  X,
  Sparkles,
  Pin,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  CheckCircle2,
  Sliders,
  ChevronDown,
} from 'lucide-react';
import { AuthContext } from '../../../store/AuthContext';
import { dialog } from '../../../utils/dialog';
import {
  createNotification,
  updateNotification,
  NOTIFICATION_CATEGORIES,
  NOTIFICATION_SEVERITIES,
} from '../../../utils/notificationService';
import { NOTIFICATION_PRESETS } from './NotificationPresetTemplates';
import AudienceTargetSelector from './AudienceTargetSelector';
import NotificationDevicePreview from './NotificationDevicePreview';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

export default function ApexNotificationComposer({
  isOpen = false,
  onClose,
  editingNotification = null,
  onSuccess,
}) {
  const { user, staffProfile, role } = useContext(AuthContext);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('general');
  const [severity, setSeverity] = useState('info');
  const [targetAudience, setTargetAudience] = useState({ type: 'all' });
  const [bannerPinned, setBannerPinned] = useState(false);
  const [allowDismiss, setAllowDismiss] = useState(true);

  // CTA
  const [hasCta, setHasCta] = useState(false);
  const [ctaLabel, setCtaLabel] = useState('');
  const [ctaType, setCtaType] = useState('route');
  const [ctaTarget, setCtaTarget] = useState('');

  // Scheduling
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');

  const [saving, setSaving] = useState(false);

  // Populate fields if editing
  useEffect(() => {
    if (editingNotification) {
      setTitle(editingNotification.title || '');
      setBody(editingNotification.body || '');
      setCategory(editingNotification.category || 'general');
      setSeverity(editingNotification.severity || 'info');
      setTargetAudience(editingNotification.targetAudience || { type: 'all' });
      setBannerPinned(Boolean(editingNotification.bannerPinned));
      setAllowDismiss(editingNotification.allowDismiss !== false);

      if (editingNotification.cta) {
        setHasCta(true);
        setCtaLabel(editingNotification.cta.label || '');
        setCtaType(editingNotification.cta.actionType || 'route');
        setCtaTarget(editingNotification.cta.target || '');
      } else {
        setHasCta(false);
        setCtaLabel('');
        setCtaTarget('');
      }
    } else {
      // Reset defaults
      setTitle('');
      setBody('');
      setCategory('general');
      setSeverity('info');
      setTargetAudience({ type: 'all' });
      setBannerPinned(false);
      setAllowDismiss(true);
      setHasCta(false);
      setCtaLabel('');
      setCtaTarget('');
      setIsScheduled(false);
    }
  }, [editingNotification, isOpen]);

  // Apply a template preset
  const handleApplyPreset = (preset) => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setTitle(preset.title);
    setBody(preset.body);
    setCategory(preset.category);
    setSeverity(preset.severity);
    setTargetAudience(preset.targetAudience);
    setBannerPinned(Boolean(preset.bannerPinned));

    if (preset.cta) {
      setHasCta(true);
      setCtaLabel(preset.cta.label);
      setCtaType(preset.cta.actionType || 'route');
      setCtaTarget(preset.cta.target);
    }
  };

  const currentPayload = {
    title,
    body,
    category,
    severity,
    targetAudience,
    bannerPinned,
    allowDismiss,
    cta: hasCta && ctaLabel && ctaTarget ? { label: ctaLabel, actionType: ctaType, target: ctaTarget } : null,
  };

  // Submit Handler with Double Confirmation Guard
  const handleSubmit = async (isDraft = false) => {
    if (!title.trim()) {
      dialog.toast.warning('Title Required', 'Please enter a title for the announcement.');
      return;
    }
    if (!body.trim()) {
      dialog.toast.warning('Message Body Required', 'Please provide announcement details.');
      return;
    }

    if (!isDraft) {
      // Safety confirmation before broadcasting
      const confirmed = await dialog.confirm({
        title: editingNotification ? 'Update Broadcast?' : 'Confirm Broadcast Launch',
        message: bannerPinned
          ? `You are about to launch a broadcast notice to ${
              targetAudience.type === 'all' ? 'All Campus Users' : targetAudience.type
            }. This notice will also be PINNED as a prominent banner on top of all pages.`
          : `Dispatch this announcement to ${
              targetAudience.type === 'all' ? 'All Campus Users' : targetAudience.type
            }?`,
        confirmText: editingNotification ? 'Update Notice' : 'Broadcast Now',
        cancelText: 'Keep Editing',
        confirmColor: severity === 'critical' ? 'rose' : 'emerald',
        icon: severity === 'critical' ? 'warning' : 'info',
      });

      if (!confirmed) return;
    }

    setSaving(true);
    soundEngine.playMechanicalClick();
    hapticEngine.mediumTick();

    const actor = {
      uid: user?.uid || 'committee-admin',
      name: staffProfile?.name || user?.displayName || 'Canteen Committee',
      role: role || 'canteen_committee',
      email: user?.email || '',
    };

    try {
      const finalRecord = {
        ...currentPayload,
        status: isDraft ? 'draft' : isScheduled ? 'scheduled' : 'active',
      };

      if (editingNotification?.id) {
        await updateNotification(editingNotification.id, finalRecord, actor);
        dialog.toast.success('Updated', 'Broadcast announcement updated successfully.');
      } else {
        await createNotification(finalRecord, actor);
        dialog.toast.success('Broadcasted', 'Announcement dispatched and active in real-time!');
      }

      soundEngine.playSoftChime();
      hapticEngine.successPulse();

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('[ApexComposer] Save Error:', err);
      dialog.toast.error('Broadcast Failed', err.message || 'Could not post announcement.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 16 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
        className="w-full max-w-6xl max-h-[92vh] bg-white dark:bg-[#0c1411] border border-gray-200/80 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Studio Header Bar */}
        <div className="px-5 py-4 border-b border-gray-200/80 dark:border-white/10 bg-gray-50/80 dark:bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white">
                {editingNotification ? 'Edit Broadcast Announcement' : 'Apex Broadcast Studio & Composer'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Author and broadcast live alerts, menu specials, and critical operational updates
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Body: Split-Pane Editor vs Live Simulator */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6 p-5 sm:p-6">
          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            {/* Quick Presets Bar */}
            <div className="p-3 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/70 dark:border-white/10">
              <span className="text-[11px] font-bold text-gray-500 dark:text-gray-400 block mb-2">
                Quick Announcement Presets:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {NOTIFICATION_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-emerald-500 hover:text-emerald-600 transition-colors"
                  >
                    {preset.title.length > 25 ? preset.title.slice(0, 25) + '…' : preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Announcement Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Cutoff Extended by 45 Minutes"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-gray-50/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Category & Severity Pair */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-gray-50/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="general">General Campus Notice</option>
                  <option value="menu">Food Menu & Specials</option>
                  <option value="cutoff">Cutoff & Window Deadlines</option>
                  <option value="urgent">Urgent Operational Notice</option>
                  <option value="feast">Festive Banquet / Feast</option>
                  <option value="maintenance">Kitchen Maintenance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Urgency / Severity Level
                </label>
                <select
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-gray-50/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="info">Standard Notice (Emerald)</option>
                  <option value="success">Confirmed Success (Teal)</option>
                  <option value="warning">Important Caution (Amber)</option>
                  <option value="critical">Critical / Urgent (Crimson)</option>
                  <option value="festive">Festive / Feast Celebration (Gold)</option>
                </select>
              </div>
            </div>

            {/* Target Audience Segment Selector */}
            <AudienceTargetSelector value={targetAudience} onChange={setTargetAudience} />

            {/* Body Content Textarea */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Announcement Message (Markdown Supported) *
              </label>
              <textarea
                rows={4}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Write the full announcement text, timings, or details..."
                className="w-full p-3 text-xs rounded-xl bg-gray-50/70 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Ambient Banner & CTA Options */}
            <div className="p-3.5 rounded-2xl bg-gray-50/70 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 space-y-3">
              {/* Pinned Top Banner Toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={bannerPinned}
                  onChange={(e) => setBannerPinned(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1.5">
                    <Pin className="w-3.5 h-3.5 text-amber-500 rotate-45" />
                    <span>Pin to Top Sticky Ambient Banner</span>
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 block">
                    Displays high-visibility alert across the top of the homepage and token boards.
                  </span>
                </div>
              </label>

              {/* Action CTA Button Toggle */}
              <label className="flex items-center gap-3 cursor-pointer select-none pt-2 border-t border-gray-200/60 dark:border-white/5">
                <input
                  type="checkbox"
                  checked={hasCta}
                  onChange={(e) => setHasCta(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    Attach Interactive Action Button (CTA)
                  </span>
                  <span className="text-[11px] text-gray-500 dark:text-gray-400 block">
                    e.g. Link to food menu, student portal, or PDF downloads.
                  </span>
                </div>
              </label>

              {/* CTA Inputs */}
              {hasCta && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                  <input
                    type="text"
                    value={ctaLabel}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="Button Label (e.g. View Menu)"
                    className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={ctaTarget}
                    onChange={(e) => setCtaTarget(e.target.value)}
                    placeholder="Route or URL (e.g. /menu)"
                    className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-black/30 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Live Simulator (5 cols) */}
          <div className="lg:col-span-5 h-full">
            <NotificationDevicePreview notificationData={currentPayload} />
          </div>
        </div>

        {/* Studio Footer Action Bar */}
        <div className="px-5 py-3.5 border-t border-gray-200/80 dark:border-white/10 bg-gray-50/90 dark:bg-black/30 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(true)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-200 bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 hover:bg-gray-50 transition-all flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save as Draft</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit(false)}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 active:scale-95 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{saving ? 'Broadcasting...' : editingNotification ? 'Update Broadcast' : 'Broadcast Announcement'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
