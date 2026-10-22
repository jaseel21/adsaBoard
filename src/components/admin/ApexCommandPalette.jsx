import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  X,
  Command,
  Utensils,
  Coffee,
  Lock,
  Unlock,
  Users,
  UtensilsCrossed,
  Sliders,
  Activity,
  ChefHat,
  ArrowRight,
  Sparkles,
  Layers,
  Phone,
  Home,
  Bell,
  HeartHandshake,
} from 'lucide-react';
import { useLanguage } from '../../store/LanguageContext';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';

export default function ApexCommandPalette({
  isOpen = false,
  onClose,
  documents = [],
  onSelectStudent,
  onToggleMeal,
  onToggleLock,
  onOpenDietary,
  onOpenStaff,
  onOpenLockModal,
  navigate,
  isLunch = false,
  effectiveMode,
  isCentralCommittee = false,
}) {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 50);
    }
  }, [isOpen]);

  // Global Key Listener for Cmd+K, Ctrl+K, or Slash (when not in an active input)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          soundEngine.playPop();
          hapticEngine.lightTap();
          // Trigger open via custom event or external state
          window.dispatchEvent(new CustomEvent('apex:open-command-palette'));
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Action Commands list
  const actionCommands = useMemo(() => {
    const list = [
      {
        id: 'toggle_meal',
        title: isLunch ? t('switchBreakfastService', 'Switch to Breakfast Service') : t('switchLunchService', 'Switch to Lunch Service'),
        subtitle: isLunch ? t('viewingLunchTokens', 'Currently viewing Lunch tokens') : t('viewingBreakfastTokens', 'Currently viewing Breakfast tokens'),
        icon: isLunch ? Coffee : Utensils,
        iconColor: isLunch ? 'text-amber-500' : 'text-emerald-500',
        action: () => {
          if (onToggleMeal) onToggleMeal();
          onClose();
        },
      },
    ];

    if (isCentralCommittee) {
      list.push({
        id: 'toggle_lock',
        title: effectiveMode === 'force_unlocked' ? t('activateCutoffSchedule', 'Activate Cutoff Schedule') : t('emergencyBoardUnlock', 'Emergency 24/7 Board Unlock'),
        subtitle: effectiveMode === 'force_unlocked' ? t('enforceDailyCutoffs', 'Enforce daily cutoffs') : t('bypassCutoffsAllDates', 'Bypass cutoffs for all dates'),
        icon: effectiveMode === 'force_unlocked' ? Lock : Unlock,
        iconColor: effectiveMode === 'force_unlocked' ? 'text-amber-500' : 'text-emerald-500',
        action: () => {
          if (onToggleLock) onToggleLock();
          onClose();
        },
      });
    }

    list.push(
      {
        id: 'kitchen_kds',
        title: t('openKitchenKds', 'Open Kitchen Live Display System'),
        subtitle: t('kitchenKdsSub', 'Real-time production headcount dashboard for cooks (/kitchen)'),
        icon: ChefHat,
        iconColor: 'text-amber-500',
        action: () => {
          navigate('/kitchen');
          onClose();
        },
      },
      {
        id: 'dietary_modal',
        title: t('viewDietaryManifest', 'View Kitchen Dietary Manifest'),
        subtitle: t('dietaryManifestSub', 'Allergen distribution & student dietary avoidances'),
        icon: UtensilsCrossed,
        iconColor: 'text-teal-500',
        action: () => {
          if (onOpenDietary) onOpenDietary();
          onClose();
        },
      }
    );

    if (isCentralCommittee) {
      list.push(
        {
          id: 'staff_management',
          title: t('manageStaffRolesAction', 'Manage Staff Roles & Access Delegation'),
          subtitle: t('manageStaffRolesSub', 'Grant or revoke Central Admin, Canteen Officer, or Cook roles'),
          icon: Users,
          iconColor: 'text-purple-500',
          action: () => {
            if (onOpenStaff) onOpenStaff();
            onClose();
          },
        },
        {
          id: 'cutoff_rules',
          title: t('configureCutoffTimers', 'Configure Cutoff Window & Timers'),
          subtitle: t('configureCutoffTimersSub', 'Adjust daily cutoff time and grace period'),
          icon: Sliders,
          iconColor: 'text-blue-500',
          action: () => {
            if (onOpenLockModal) onOpenLockModal();
            onClose();
          },
        },
        {
          id: 'audit_logs',
          title: t('auditLogsAction', 'Audit Trail & Activity Logs'),
          subtitle: t('auditLogsSub', 'Inspect immutable records of all token switches and security events'),
          icon: Activity,
          iconColor: 'text-emerald-500',
          action: () => {
            navigate('/admin/audit-logs');
            onClose();
          },
        }
      );
    }

    list.push({
      id: 'menu_mgmt',
      title: t('canteenPlannerAction', 'Canteen Food Menu Planner'),
      subtitle: t('canteenPlannerSub', 'Update weekly breakfast, lunch, and dinner menus (/admin/menu)'),
      icon: Utensils,
      iconColor: 'text-rose-500',
      action: () => {
        navigate('/admin/menu');
        onClose();
      },
    });

    list.push({
      id: 'notifications_studio',
      title: t('adminNotificationsTitle', 'Broadcast Notifications & Announcements'),
      subtitle: t('adminNotificationsSubtitle', 'Dispatch live announcements, cutoff extensions, and alerts (/admin/notifications)'),
      icon: Bell,
      iconColor: 'text-amber-500',
      action: () => {
        navigate('/admin/notifications');
        onClose();
      },
    });

    list.push({
      id: 'support_command_center',
      title: t('adminSupportTitle', 'Support & Feedback Command Center'),
      subtitle: t('adminSupportSubtitle', 'Live diner telemetry, rapid issue triage, student dossiers & SLA control (/admin/support)'),
      icon: HeartHandshake,
      iconColor: 'text-emerald-500',
      action: () => {
        navigate('/admin/support');
        onClose();
      },
    });

    return list;
  }, [isLunch, effectiveMode, isCentralCommittee, onToggleMeal, onToggleLock, onOpenDietary, onOpenStaff, onOpenLockModal, navigate, onClose, t]);

  // Filtered Results
  const { filteredActions, filteredStudents } = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return {
        filteredActions: actionCommands.slice(0, 5),
        filteredStudents: [],
      };
    }

    const matchedActions = actionCommands.filter(
      (a) => a.title.toLowerCase().includes(q) || a.subtitle.toLowerCase().includes(q)
    );

    const matchedStudents = documents
      .filter((s) => {
        const tokenMatch = String(s.tokenNo || '').includes(q);
        const nameMatch = (s.name || '').toLowerCase().includes(q);
        const mlNameMatch = (s.name_ml || '').toLowerCase().includes(q);
        const roomMatch = (s.roomNo || '').toLowerCase().includes(q);
        const batchMatch = (s.batch || '').toLowerCase().includes(q);
        const phoneMatch = (s.phone || '').includes(q);
        return tokenMatch || nameMatch || mlNameMatch || roomMatch || batchMatch || phoneMatch;
      })
      .slice(0, 15);

    return {
      filteredActions: matchedActions,
      filteredStudents: matchedStudents,
    };
  }, [query, actionCommands, documents]);

  const totalItems = filteredActions.length + filteredStudents.length;

  // Keyboard navigation within list
  const handleKeyDownInList = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + Math.max(1, totalItems)) % Math.max(1, totalItems));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex < filteredActions.length) {
        filteredActions[selectedIndex]?.action();
      } else {
        const studentIndex = selectedIndex - filteredActions.length;
        const student = filteredStudents[studentIndex];
        if (student && onSelectStudent) {
          soundEngine.playMechanicalClick();
          hapticEngine.lightTap();
          onSelectStudent(student);
          onClose();
        }
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Command Modal Box */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -16 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="relative w-full max-w-2xl rounded-2xl sm:rounded-3xl bg-white/95 dark:bg-[#0c1412]/95 border border-gray-200/80 dark:border-white/10 shadow-2xl backdrop-blur-2xl overflow-hidden flex flex-col max-h-[80vh]"
        >
          {/* Header Search Input */}
          <div className="relative flex items-center px-4 sm:px-5 py-3.5 border-b border-gray-100 dark:border-white/10">
            <Search className="w-5 h-5 text-gray-400 dark:text-gray-500 mr-3 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDownInList}
              placeholder={t('commandPalettePlaceholder', 'Type token #, student name, batch, or administrative action...')}
              className="w-full bg-transparent text-sm sm:text-base font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-gray-100 dark:bg-white/10 text-[10px] font-mono text-gray-500 dark:text-gray-400">
                ESC
              </kbd>
            )}
          </div>

          {/* Results List */}
          <div className="overflow-y-auto p-2 sm:p-3 space-y-3 divide-y divide-gray-100 dark:divide-white/5">
            {/* Quick Actions Category */}
            {filteredActions.length > 0 && (
              <div className="space-y-1">
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  {t('quickActions', 'Quick Actions')}
                </div>
                {filteredActions.map((action, idx) => {
                  const isSelected = selectedIndex === idx;
                  const Icon = action.icon;
                  return (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => {
                        soundEngine.playMechanicalClick();
                        hapticEngine.lightTap();
                        action.action();
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-left transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                          : 'hover:bg-gray-100/70 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 dark:bg-white/10 ' + action.iconColor
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs sm:text-sm font-bold truncate">{action.title}</div>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 truncate">
                            {action.subtitle}
                          </div>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            )}

            {/* Student Tokens Category */}
            {filteredStudents.length > 0 && (
              <div className="space-y-1 pt-2">
                <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 flex items-center justify-between">
                  <span>{t('studentTokens', 'Student Tokens')} ({filteredStudents.length})</span>
                  <span className="text-[10px]">{t('pressEnterToOpen', 'Press Enter to open')}</span>
                </div>
                {filteredStudents.map((student, sIdx) => {
                  const itemIndex = filteredActions.length + sIdx;
                  const isSelected = selectedIndex === itemIndex;
                  return (
                    <button
                      key={student.id || student.tokenNo}
                      type="button"
                      onClick={() => {
                        soundEngine.playMechanicalClick();
                        hapticEngine.lightTap();
                        if (onSelectStudent) onSelectStudent(student);
                        onClose();
                      }}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      className={`w-full flex items-center justify-between p-2.5 sm:p-3 rounded-xl text-left transition-colors ${
                        isSelected
                          ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                          : 'hover:bg-gray-100/70 dark:hover:bg-white/5 text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white font-mono font-black flex items-center justify-center text-xs shrink-0 shadow-xs">
                          {student.tokenNo}
                        </div>
                        <div className="truncate">
                          <div className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate flex items-center gap-2">
                            <span>{student.name || 'Unnamed Student'}</span>
                            {student.name_ml && (
                              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                ({student.name_ml})
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-2 truncate">
                            {student.batch && <span>{student.batch}</span>}
                            {student.roomNo && <span>• Room {student.roomNo}</span>}
                            {student.phone && <span>• {student.phone}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {student.block && (
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                            {t('statusBlocked', 'Blocked')}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          {t('inspect', 'Inspect →')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Zero Results */}
            {totalItems === 0 && (
              <div className="p-8 text-center text-gray-400 dark:text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">{t('noMatchingCommands', 'No matching actions or students found')}</p>
                <p className="text-xs mt-1 text-gray-400">Try searching token number or action name</p>
              </div>
            )}
          </div>

          {/* Footer Controls Tip */}
          <div className="px-4 py-2.5 bg-gray-50/80 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/10 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 font-mono text-[10px]">↑</kbd>
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 font-mono text-[10px]">↓</kbd>
                {t('navigate', 'Navigate')}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 font-mono text-[10px]">↵</kbd>
                {t('select', 'Select')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <Sparkles className="w-3.5 h-3.5" />
              <span>ADSA Apex Spotlight</span>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
