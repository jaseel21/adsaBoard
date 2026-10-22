import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  ChevronLeft,
  Flame,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';
import {
  SUPPORT_STATUSES,
  SUPPORT_CATEGORIES,
  SUPPORT_URGENCIES,
  updateTicketStatus,
} from '../../../utils/supportTicketService';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';
import { useLanguage } from '../../../store/LanguageContext';

const LANES = [
  { id: 'new', key: 'statusNew', label: 'New / Inbound', color: 'border-rose-500/40' },
  { id: 'triaged', key: 'statusTriaged', label: 'Triaged', color: 'border-amber-500/40' },
  { id: 'in_progress', key: 'statusInProgress', label: 'In Action', color: 'border-blue-500/40' },
  { id: 'resolved', key: 'statusResolved', label: 'Resolved', color: 'border-emerald-500/40' },
];

export default function SupportKanbanBoard({
  tickets = [],
  onSelectTicket,
  selectedTicketId,
  staffInfo = {},
}) {
  const { t } = useLanguage();

  const handleAdvance = async (e, ticket) => {
    e.stopPropagation();
    let nextStatus = 'triaged';
    if (ticket.status === 'new') nextStatus = 'triaged';
    else if (ticket.status === 'triaged') nextStatus = 'in_progress';
    else if (ticket.status === 'in_progress') nextStatus = 'resolved';
    else return;

    soundEngine.playMechanicalClick();
    hapticEngine.mediumTick();

    try {
      await updateTicketStatus(ticket.id, nextStatus, staffInfo, `Advanced to ${nextStatus}`);
      soundEngine.playSoftChime();
    } catch (err) {
      console.error('Failed to advance ticket status:', err);
    }
  };

  const handleRevert = async (e, ticket) => {
    e.stopPropagation();
    let prevStatus = 'new';
    if (ticket.status === 'resolved') prevStatus = 'in_progress';
    else if (ticket.status === 'in_progress') prevStatus = 'triaged';
    else if (ticket.status === 'triaged') prevStatus = 'new';
    else return;

    soundEngine.playPop();
    hapticEngine.lightTap();

    try {
      await updateTicketStatus(ticket.id, prevStatus, staffInfo, `Reverted to ${prevStatus}`);
    } catch (err) {
      console.error('Failed to revert ticket status:', err);
    }
  };

  const formatElapsed = (createdAt) => {
    if (!createdAt) return 'Just now';
    const date = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {LANES.map((lane) => {
        const laneTickets = tickets.filter((t) => t.status === lane.id);

        return (
          <div
            key={lane.id}
            className="flex flex-col rounded-3xl bg-gray-50/70 dark:bg-white/[0.02] border border-gray-200/80 dark:border-white/10 p-3.5 sm:p-4 min-h-[480px]"
          >
            {/* Lane Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-200/60 dark:border-white/5 mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-wider">
                  {t(lane.key, lane.label)}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-white dark:bg-white/10 text-gray-700 dark:text-gray-300 shadow-xs border border-gray-200/60 dark:border-white/10">
                  {laneTickets.length}
                </span>
              </div>
            </div>

            {/* Lane Ticket Cards Stack */}
            <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto max-h-[70vh] pr-1">
              <AnimatePresence>
                {laneTickets.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 dark:text-gray-600 font-medium">
                    No tickets in this stage
                  </div>
                ) : (
                  laneTickets.map((ticket) => {
                    const isSelected = selectedTicketId === ticket.id;
                    const isCritical = ticket.urgency === 'critical';
                    const categoryInfo = SUPPORT_CATEGORIES[ticket.category] || {};

                    return (
                      <motion.div
                        key={ticket.id}
                        layoutId={`ticket-${ticket.id}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileHover={{ scale: 1.015, y: -2 }}
                        onClick={() => {
                          soundEngine.playMechanicalClick();
                          hapticEngine.lightTap();
                          if (onSelectTicket) onSelectTicket(ticket);
                        }}
                        className={`p-3.5 rounded-2xl bg-white dark:bg-[#0c1412] border cursor-pointer transition-all flex flex-col gap-2.5 shadow-sm ${
                          isSelected
                            ? 'ring-2 ring-emerald-500 border-emerald-500 shadow-md'
                            : isCritical
                            ? 'border-rose-500/50 hover:border-rose-500 ring-1 ring-rose-500/20'
                            : 'border-gray-200/80 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20'
                        }`}
                      >
                        {/* Card Top Row: Code, Urgency, Category */}
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {ticket.ticketNumber}
                          </span>

                          <div className="flex items-center gap-1.5">
                            {isCritical && (
                              <span className="px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 text-[10px] font-extrabold flex items-center gap-1 animate-pulse border border-rose-500/30">
                                <Flame className="w-3 h-3" /> Critical
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                              {formatElapsed(ticket.createdAt)}
                            </span>
                          </div>
                        </div>

                        {/* Subject & Category */}
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">
                            {categoryInfo.label || ticket.category}
                          </span>
                          <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 dark:text-white leading-snug line-clamp-2 mt-0.5">
                            {ticket.subject}
                          </h4>
                        </div>

                        {/* Student Badge & Reply Counter */}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-100 dark:border-white/5">
                          <div className="flex items-center gap-1.5 truncate max-w-[65%]">
                            <User className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
                            <span className="truncate font-semibold text-gray-700 dark:text-gray-300 text-[11px]">
                              {ticket.student?.tokenNumber ? `T#${ticket.student.tokenNumber} • ` : ''}
                              {ticket.student?.name || 'Anonymous'}
                            </span>
                          </div>

                          {/* Quick Stage Shifters */}
                          <div className="flex items-center gap-1">
                            {lane.id !== 'new' && (
                              <button
                                type="button"
                                onClick={(e) => handleRevert(e, ticket)}
                                className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                                title="Revert to previous stage"
                              >
                                <ChevronLeft className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {lane.id !== 'resolved' && (
                              <button
                                type="button"
                                onClick={(e) => handleAdvance(e, ticket)}
                                className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 transition-colors"
                                title="Advance to next stage"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </div>
        );
      })}
    </div>
  );
}
