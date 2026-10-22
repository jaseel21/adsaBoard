import React, { useState } from 'react';
import {
  Smartphone,
  Tablet,
  Monitor,
  Volume2,
  Sparkles,
  Pin,
  AlertCircle,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import NotificationCard from '../NotificationCard';
import { soundEngine } from '../../../utils/soundEffects';
import { AUTHORITY_METADATA } from '../../../utils/notificationService';

export default function NotificationDevicePreview({ notificationData }) {
  const [viewport, setViewport] = useState('mobile'); // 'mobile' | 'tablet' | 'desktop'
  const [previewMode, setPreviewMode] = useState(
    notificationData?.displayStyle === 'dialog' || notificationData?.displayStyle === 'all'
      ? 'dialog'
      : 'card'
  );

  const isDialogNotice =
    notificationData?.displayStyle === 'dialog' || notificationData?.displayStyle === 'all';

  const sender = notificationData.senderAttribution;
  const authorityKey = sender?.authorityType || 'central_committee';
  const authorityMeta = AUTHORITY_METADATA[authorityKey] || AUTHORITY_METADATA.central_committee;
  const authorityLabel =
    authorityKey === 'custom' && sender?.customTitle ? sender.customTitle : authorityMeta?.labelEn || 'ADSA Committee';

  const mockNotification = {
    id: 'preview-draft',
    title: notificationData.title || 'Untitled Announcement',
    body: notificationData.body || 'Announcement details and instructions will appear here...',
    category: notificationData.category || 'general',
    severity: notificationData.severity || 'info',
    displayStyle: notificationData.displayStyle || 'drawer',
    targetAudience: notificationData.targetAudience || { type: 'all' },
    bannerPinned: Boolean(notificationData.bannerPinned),
    cta: notificationData.cta?.label ? notificationData.cta : null,
    senderAttribution: notificationData.senderAttribution || { showSender: true, authorityType: 'canteen_wing' },
    publishAt: new Date(),
    createdBy: {
      name: 'ADSA Canteen Committee',
      role: 'canteen_committee',
    },
    createdAt: new Date(),
  };

  const playPreviewAudio = () => {
    if (notificationData.severity === 'critical' || isDialogNotice) {
      soundEngine.playCautionThud();
    } else {
      soundEngine.playNotificationChime();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50/70 dark:bg-black/30 rounded-2xl border border-gray-200/80 dark:border-white/10 p-4">
      {/* Top Simulator Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200/60 dark:border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-black text-gray-800 dark:text-gray-200 tracking-tight">
            Live WYSIWYG Device Simulator
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Card vs Dialog Preview Toggle */}
          <div className="flex items-center p-0.5 rounded-xl bg-gray-200/80 dark:bg-white/10 border border-gray-300/40 dark:border-white/5">
            <button
              type="button"
              onClick={() => setPreviewMode('card')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                previewMode === 'card'
                  ? 'bg-white dark:bg-[#131b18] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Drawer Card
            </button>
            <button
              type="button"
              onClick={() => setPreviewMode('dialog')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                previewMode === 'dialog'
                  ? 'bg-white dark:bg-[#131b18] text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Urgent Popup
            </button>
          </div>

          {/* Audio Chime Preview */}
          <button
            type="button"
            onClick={playPreviewAudio}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-white dark:bg-white/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 hover:bg-emerald-50 transition-all shadow-xs"
            title="Listen to arrival audio"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
            <span className="hidden sm:inline">Sound</span>
          </button>

          {/* Viewport Toggles */}
          <div className="flex items-center p-0.5 rounded-xl bg-gray-200/80 dark:bg-white/10 border border-gray-300/40 dark:border-white/5">
            <button
              type="button"
              onClick={() => setViewport('mobile')}
              className={`p-1.5 rounded-lg transition-all ${
                viewport === 'mobile'
                  ? 'bg-white dark:bg-[#131b18] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              title="Mobile View (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('tablet')}
              className={`p-1.5 rounded-lg transition-all ${
                viewport === 'tablet'
                  ? 'bg-white dark:bg-[#131b18] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              title="Tablet View (540px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport('desktop')}
              className={`p-1.5 rounded-lg transition-all ${
                viewport === 'desktop'
                  ? 'bg-white dark:bg-[#131b18] text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
              title="Desktop View (Full)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Simulator Device Screen Frame */}
      <div className="flex-1 flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
        <div
          className={`transition-all duration-300 w-full rounded-2xl sm:rounded-3xl border border-gray-300/80 dark:border-white/15 bg-white dark:bg-[#0c1310] shadow-2xl overflow-hidden flex flex-col relative ${
            viewport === 'mobile'
              ? 'max-w-[340px] min-h-[460px]'
              : viewport === 'tablet'
              ? 'max-w-[480px] min-h-[460px]'
              : 'max-w-full min-h-[420px]'
          }`}
        >
          {/* Simulated App Header */}
          <div className="px-3.5 py-2.5 border-b border-gray-200/80 dark:border-white/10 bg-gray-50/90 dark:bg-black/30 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-xs font-black text-gray-800 dark:text-white tracking-tight">
                ADSA T-Board
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/5 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                {viewport.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Simulated Top Ambient Banner if Pinned */}
          {(notificationData.bannerPinned || notificationData.displayStyle === 'banner' || notificationData.displayStyle === 'all') && (
            <div
              className={`px-3 py-1.5 text-[11px] font-extrabold text-white flex items-center justify-between gap-2 shadow-sm ${
                notificationData.severity === 'critical'
                  ? 'bg-rose-600'
                  : notificationData.severity === 'festive'
                  ? 'bg-amber-600'
                  : 'bg-emerald-600'
              }`}
            >
              <div className="flex items-center gap-1.5 truncate">
                <Pin className="w-3 h-3 rotate-45 flex-shrink-0" />
                <span className="truncate">{mockNotification.title}</span>
              </div>
              <span className="px-1.5 py-0.2 rounded bg-black/20 text-[9px] font-mono">
                Pinned Banner
              </span>
            </div>
          )}

          {/* SIMULATED VIEW 1: Emergency Dialog Popup Mode */}
          {previewMode === 'dialog' ? (
            <div className="relative flex-1 bg-black/60 backdrop-blur-sm p-4 flex items-center justify-center">
              <div className="w-full rounded-2xl border border-rose-500/40 bg-[#12080a] text-white p-4 shadow-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-rose-500/20 text-rose-500 animate-pulse">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase">
                      Urgent Flash Alert
                    </span>
                    <h5 className="text-xs font-black tracking-tight text-white mt-1">
                      {mockNotification.title}
                    </h5>
                  </div>
                </div>

                <p className="text-[11px] text-gray-300 leading-relaxed max-h-24 overflow-y-auto">
                  {mockNotification.body}
                </p>

                {/* Sender Tag */}
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-bold">
                      {sender?.showSender ? authorityLabel : 'Official Campus Bulletin'}
                    </span>
                  </div>
                  {sender?.showSender && sender?.signOffName && (
                    <span className="text-gray-400">{sender.signOffName}</span>
                  )}
                </div>

                {/* Simulated Acknowledge Button */}
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <div className="px-3 py-1 rounded-xl bg-white/15 text-white font-bold text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>I Understand</span>
                  </div>
                  {mockNotification.cta?.label && (
                    <div className="px-3 py-1 rounded-xl bg-rose-600 text-white font-black text-[10px] flex items-center gap-1">
                      <span>{mockNotification.cta.label}</span>
                      <ArrowRight className="w-2.5 h-2.5" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* SIMULATED VIEW 2: Drawer Card Mode */
            <div className="p-3.5 space-y-3 flex-1 flex flex-col justify-center">
              <div className="text-[10px] uppercase font-mono tracking-wider text-gray-400 mb-1">
                Recipient Card Preview:
              </div>
              <NotificationCard notification={mockNotification} index={0} />
            </div>
          )}

          {/* Simulated Device Bottom Bar */}
          <div className="p-2 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-black/20 flex items-center justify-center">
            <div className="w-24 h-1 rounded-full bg-gray-300 dark:bg-white/20" />
          </div>
        </div>
      </div>
    </div>
  );
}
