import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  Calendar,
  ShieldAlert,
  Share2,
  Printer,
  Copy,
  Check,
  Lock,
  Unlock,
  Info,
  X,
  ExternalLink,
} from 'lucide-react';
import { useContextMenuPosition } from '../../hooks/useContextMenuPosition';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';

/**
 * ContextMenuDock
 * Sleek glassmorphic right-click fast action palette.
 * Replaces the clumsy native browser menu with instantaneous, context-aware dining actions.
 */
export default function ContextMenuDock({
  isOpen,
  x,
  y,
  data,
  type,
  onClose,
  onAction,
}) {
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef(null);

  const coords = useContextMenuPosition(x, y, 260, 320);

  // Close on outside click or scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleScroll = () => {
      onClose();
    };

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !data) return null;

  const doc = data.doc || data;
  const tokenNo = doc.tokenNo;
  const nameEn = doc.nameEn || doc.name || `Token #${tokenNo}`;
  const isBlocked = Boolean(doc.block);
  const isOn = Boolean(data.isOn);
  const isLunch = Boolean(data.isLunch);

  const handleCopyLink = async () => {
    feedback('pop');
    try {
      const url = `${window.location.origin}/student?token=${tokenNo}`;
      await navigator.clipboard.writeText(url);
      setCopied(true);
      dialog.toast.success('Link Copied', `Direct link for Token #${tokenNo} copied to clipboard.`);
      setTimeout(() => setCopied(false), 2000);
      onClose();
    } catch (_) {
      dialog.toast.error('Copy Error', 'Could not copy link to clipboard.');
    }
  };

  const menuItems = [
    {
      id: 'toggle-status',
      label: isOn
        ? isLunch
          ? t('cancelLunch', 'Cancel Lunch (Turn Off)')
          : t('cancelBreakfast', 'Cancel Breakfast (Turn Off)')
        : isLunch
        ? t('activateLunch', 'Serve Lunch (Turn On)')
        : t('activateBreakfast', 'Serve Breakfast (Turn On)'),
      icon: isLunch ? Utensils : Coffee,
      color: isOn ? 'text-rose-500' : 'text-emerald-500',
      action: () => {
        feedback(isOn ? 'warning' : 'success');
        if (onAction) onAction('toggleStatus', data);
        onClose();
      },
    },
    {
      id: 'open-calendar',
      label: t('scheduleLeave', 'Schedule Leave / Overrides'),
      icon: Calendar,
      color: 'text-sky-500',
      action: () => {
        feedback('tick');
        if (onAction) onAction('openCalendar', data);
        onClose();
      },
    },
    {
      id: 'dietary-info',
      label: t('dietaryRestrictions', 'Dietary Exclusions'),
      icon: Info,
      color: 'text-amber-500',
      action: () => {
        feedback('tick');
        if (onAction) onAction('dietaryInfo', data);
        onClose();
      },
    },
    {
      id: 'copy-link',
      label: copied ? t('copied', 'Copied!') : t('copyStudentLink', 'Copy Student Portal Link'),
      icon: copied ? Check : Copy,
      color: copied ? 'text-emerald-500' : 'text-gray-500 dark:text-gray-400',
      action: handleCopyLink,
    },
  ];

  return (
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.92, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ left: `${coords.left}px`, top: `${coords.top}px` }}
        className="fixed z-[99999] w-64 rounded-2xl p-2 bg-white/95 dark:bg-[#0f1715]/95 backdrop-blur-2xl border border-gray-200/90 dark:border-white/15 shadow-2xl text-gray-800 dark:text-gray-100 select-none"
        role="menu"
        aria-label="Token Context Menu"
      >
        {/* Header: Token details badge */}
        <div className="px-3 py-2 border-b border-gray-100 dark:border-white/10 mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs text-white ${
                isBlocked
                  ? 'bg-gray-800'
                  : isOn
                  ? 'bg-emerald-500'
                  : 'bg-rose-500'
              }`}
            >
              {tokenNo}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-extrabold truncate">{nameEn}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {isBlocked ? 'Account Blocked' : isOn ? 'Meal Active' : 'Meal Cancelled'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
            aria-label="Close menu"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Action Items */}
        <div className="space-y-0.5">
          {menuItems.map((item, idx) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={item.action}
                onMouseEnter={() => {
                  setSelectedIndex(idx);
                  feedback('tick');
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all duration-150 text-left ${
                  selectedIndex === idx
                    ? 'bg-emerald-500/15 dark:bg-emerald-400/20 text-emerald-900 dark:text-emerald-100 shadow-xs'
                    : 'hover:bg-gray-100/80 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Icon className={`w-4 h-4 flex-shrink-0 ${item.color}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
