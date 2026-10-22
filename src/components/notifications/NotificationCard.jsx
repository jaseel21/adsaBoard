import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  Clock,
  UtensilsCrossed,
  ArrowRight,
  ExternalLink,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Pin,
  Calendar,
} from 'lucide-react';
import { useNotifications } from '../../store/NotificationContext';
import { useLanguage } from '../../store/LanguageContext';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { AUTHORITY_METADATA } from '../../utils/notificationService';
import ApexLinkPreview from '../preview/ApexLinkPreview';
import ApexBookmarkCard from '../preview/ApexBookmarkCard';

// Friendly Relative Time Formatter
function formatRelativeTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) {
    const hours = Math.floor(diffSec / 3600);
    return `${hours}h ago`;
  }
  if (diffSec < 172800) return 'Yesterday';

  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function NotificationCard({ notification, index = 0 }) {
  const { markAsRead, readIds, setSelectedNotification } = useNotifications();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const isRead = readIds.includes(notification.id);
  const severity = notification.severity || 'info';
  const category = notification.category || 'general';

  // Severity theme config
  const severityConfig = {
    critical: {
      border: 'border-rose-500/40 dark:border-rose-500/40',
      bg: 'bg-rose-50/60 dark:bg-rose-950/20',
      glow: 'shadow-sm shadow-rose-500/10',
      badge: 'bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-300 border-rose-300 dark:border-rose-600/40',
      icon: AlertCircle,
      iconColor: 'text-rose-600 dark:text-rose-400',
    },
    warning: {
      border: 'border-amber-500/40 dark:border-amber-500/40',
      bg: 'bg-amber-50/60 dark:bg-amber-950/20',
      glow: 'shadow-sm shadow-amber-500/10',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300 dark:border-amber-600/40',
      icon: AlertTriangle,
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
    festive: {
      border: 'border-amber-400/50 dark:border-amber-400/30',
      bg: 'bg-gradient-to-br from-amber-50/80 via-yellow-50/30 to-amber-50/10 dark:from-amber-950/30 dark:via-yellow-950/10 dark:to-transparent',
      glow: 'shadow-md shadow-amber-500/15',
      badge: 'bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-300 border-amber-300 dark:border-amber-500/40',
      icon: Sparkles,
      iconColor: 'text-amber-500',
    },
    success: {
      border: 'border-teal-500/40 dark:border-teal-500/30',
      bg: 'bg-teal-50/60 dark:bg-teal-950/20',
      glow: 'shadow-sm shadow-teal-500/10',
      badge: 'bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 border-teal-300 dark:border-teal-600/40',
      icon: CheckCircle2,
      iconColor: 'text-teal-600 dark:text-teal-400',
    },
    info: {
      border: 'border-emerald-500/30 dark:border-emerald-500/20',
      bg: 'bg-white/80 dark:bg-white/5',
      glow: 'shadow-sm',
      badge: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-300 dark:border-emerald-600/30',
      icon: Clock,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
  };

  const currentTheme = severityConfig[severity] || severityConfig.info;
  const IconComponent = currentTheme.icon;

  const handleCta = (e) => {
    e.stopPropagation();
    markAsRead(notification.id);
    if (!notification.cta?.target) return;

    soundEngine.playMechanicalClick();
    hapticEngine.lightTap();

    if (notification.cta.actionType === 'url') {
      window.open(notification.cta.target, '_blank', 'noopener,noreferrer');
    } else {
      navigate(notification.cta.target);
    }
  };

  const handleCardClick = () => {
    markAsRead(notification.id);
    if (notification.body && notification.body.length > 140) {
      setExpanded(!expanded);
      soundEngine.playPop();
    }
  };

  // Format audience label
  const getAudienceLabel = () => {
    const target = notification.targetAudience;
    if (!target || target.type === 'all' || target.type === 'public') return 'All Campus';
    if (target.type === 'students') return 'All Students';
    if (target.type === 'batches' && target.batches?.length) {
      return `Batches: ${target.batches.join(', ')}`;
    }
    if (target.type === 'staff') return 'Kitchen & Staff';
    if (target.type === 'committee') return 'Committee';
    return 'Targeted';
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03, duration: 0.2 }}
      onClick={handleCardClick}
      className={`group relative p-3.5 sm:p-4 rounded-2xl border backdrop-blur-xl transition-all duration-300 cursor-pointer select-none ${
        currentTheme.border
      } ${currentTheme.bg} ${currentTheme.glow} ${
        !isRead ? 'ring-1 ring-emerald-500/20' : 'opacity-85 hover:opacity-100'
      }`}
    >
      {/* Pinned Marker Badge */}
      {notification.bannerPinned && (
        <div className="absolute top-3 right-3 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-[10px] font-black">
          <Pin className="w-2.5 h-2.5 rotate-45" />
          <span>Pinned</span>
        </div>
      )}

      {/* Top Metadata Row: Icon, Severity Tag, Category & Relative Timestamp */}
      <div className="flex items-start gap-2.5">
        <div
          className={`p-2 rounded-xl flex-shrink-0 ${
            severity === 'critical'
              ? 'bg-rose-500/15'
              : severity === 'festive'
              ? 'bg-amber-500/20 animate-pulse'
              : severity === 'warning'
              ? 'bg-amber-500/15'
              : 'bg-emerald-500/15'
          }`}
        >
          <IconComponent className={`w-4 h-4 ${currentTheme.iconColor}`} />
        </div>

        <div className="flex-1 min-w-0 pr-12">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Unread Glowing Dot */}
            {!isRead && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
            )}

            {/* Category / Urgency Pill */}
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide border ${currentTheme.badge}`}
            >
              {category}
            </span>

            {/* Audience Scope Pill */}
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 border border-gray-200/60 dark:border-white/5">
              {getAudienceLabel()}
            </span>

            {/* Relative Timestamp */}
            <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400 ml-auto flex-shrink-0">
              {formatRelativeTime(notification.publishAt || notification.createdAt)}
            </span>
          </div>

          {/* Title */}
          <h4
            className={`mt-1.5 text-sm sm:text-base font-extrabold tracking-tight transition-colors ${
              !isRead
                ? 'text-gray-900 dark:text-white'
                : 'text-gray-700 dark:text-gray-300 group-hover:text-emerald-600 dark:group-hover:text-emerald-400'
            }`}
          >
            {notification.title}
          </h4>

          {/* Body Content */}
          <p
            className={`mt-1 text-xs text-gray-600 dark:text-gray-300 font-medium leading-relaxed ${
              !expanded && notification.body?.length > 140 ? 'line-clamp-2' : ''
            }`}
          >
            {notification.body}
          </p>

          {/* Expand/Collapse Toggle for long notices */}
          {notification.body?.length > 140 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
              className="mt-1 flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              <span>{expanded ? 'Show less' : 'Read full note'}</span>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {/* Footer Bar: Author Signature & Action CTA */}
          <div className="mt-3 pt-2.5 border-t border-gray-200/50 dark:border-white/10 flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-gray-500 dark:text-gray-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {notification.senderAttribution && notification.senderAttribution.showSender === false
                  ? t('officialCampusNotice', 'Official Bulletin')
                  : notification.senderAttribution?.authorityType
                  ? (notification.senderAttribution.authorityType === 'custom' && notification.senderAttribution.customTitle
                      ? notification.senderAttribution.customTitle
                      : (AUTHORITY_METADATA[notification.senderAttribution.authorityType]?.[lang === 'ml' ? 'labelMl' : 'labelEn'] || 'ADSA Committee'))
                  : (notification.createdBy?.name || 'ADSA Canteen Committee')}
                {notification.senderAttribution?.showSender !== false && notification.senderAttribution?.signOffName ? ` • ${notification.senderAttribution.signOffName}` : ''}
              </span>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {/* Mark as read tick button */}
              {!isRead && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                  }}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-bold text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-gray-200 dark:border-white/10 transition-colors flex items-center gap-1"
                  title="Mark as read"
                >
                  <Check className="w-3 h-3 text-emerald-500" />
                  <span>Mark read</span>
                </button>
              )}

              {/* Action CTA Button */}
              {notification.cta?.label && notification.cta?.target && (
                <ApexLinkPreview url={notification.cta.target}>
                  <button
                    type="button"
                    onClick={handleCta}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-sm shadow-emerald-600/20 active:scale-95 transition-all"
                  >
                    <span>{notification.cta.label}</span>
                    {notification.cta.actionType === 'url' ? (
                      <ExternalLink className="w-3 h-3" />
                    ) : (
                      <ArrowRight className="w-3 h-3" />
                    )}
                  </button>
                </ApexLinkPreview>
              )}
            </div>
          </div>

          {/* Embedded Bookmark Card on Expansion */}
          {expanded && notification.cta?.actionType === 'url' && notification.cta?.target && (
            <div className="mt-2.5 pt-2 border-t border-gray-200/40 dark:border-white/5">
              <ApexBookmarkCard url={notification.cta.target} compact />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
