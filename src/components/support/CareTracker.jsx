import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MessageSquare,
  Send,
  User,
  ShieldCheck,
  ChevronRight,
  Flame,
  CornerDownRight,
  Sparkles,
} from 'lucide-react';
import {
  lookupTicket,
  subscribeTicketById,
  appendTicketMessage,
  getLocalRecentTickets,
  SUPPORT_STATUSES,
  SUPPORT_CATEGORIES,
} from '../../utils/supportTicketService';
import { soundEngine } from '../../utils/soundEffects';
import { hapticEngine } from '../../utils/haptics';
import { useLanguage } from '../../store/LanguageContext';

const STAGES = [
  { id: 'new', key: 'stageReceived', label: 'Logged' },
  { id: 'triaged', key: 'stageTriaged', label: 'Triaged' },
  { id: 'in_progress', key: 'stageAction', label: 'In Action' },
  { id: 'resolved', key: 'stageResolved', label: 'Resolved' },
];

export default function CareTracker({ initialCode = '' }) {
  const { t } = useLanguage();
  const [query, setQuery] = useState(initialCode);
  const [loading, setLoading] = useState(false);
  const [recentTickets, setRecentTickets] = useState([]);
  const [activeTicket, setActiveTicket] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Follow-up reply state
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);

  // Load recent tickets on mount
  useEffect(() => {
    setRecentTickets(getLocalRecentTickets());
  }, []);

  const performSearch = useCallback(
    async (targetTerm) => {
      const term = (targetTerm || '').trim();
      if (!term) return;

      soundEngine.playMechanicalClick();
      hapticEngine.lightTap();
      setLoading(true);
      setErrorMsg('');

      try {
        const results = await lookupTicket(term);
        if (results && results.length > 0) {
          soundEngine.playPop();
          hapticEngine.lightTap();
          setActiveTicket(results[0]);
        } else {
          soundEngine.playCautionThud();
          setActiveTicket(null);
          setErrorMsg(t('noTicketFound', 'No matching ticket found for this code or token.'));
        }
      } catch (err) {
        console.error('Error tracking ticket:', err);
        setErrorMsg('Failed to search tickets. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [t]
  );

  const handleSearch = (searchTerm) => {
    performSearch(typeof searchTerm === 'string' ? searchTerm : query);
  };

  // If initialCode provided, automatically execute search
  useEffect(() => {
    if (initialCode) {
      performSearch(initialCode);
    }
  }, [initialCode, performSearch]);

  // Subscribe in real-time to active ticket updates
  useEffect(() => {
    if (!activeTicket?.id) return;
    const unsub = subscribeTicketById(
      activeTicket.id,
      (updated) => {
        if (updated) setActiveTicket(updated);
      },
      (err) => console.error('Ticket live sync error:', err)
    );
    return () => unsub();
  }, [activeTicket?.id]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !activeTicket?.id) return;

    try {
      setSendingReply(true);
      soundEngine.playMechanicalClick();
      hapticEngine.lightTap();

      await appendTicketMessage(activeTicket.id, {
        senderType: 'student',
        senderName: activeTicket.student?.name || 'Diner',
        message: replyText.trim(),
        isInternal: false,
      });

      soundEngine.playSoftChime();
      hapticEngine.successPulse();
      setReplyText('');
    } catch (err) {
      console.error('Failed to append reply:', err);
      soundEngine.playCautionThud();
    } finally {
      setSendingReply(false);
    }
  };

  // Determine stage progression index (0 to 3)
  const getStageIndex = (status) => {
    switch (status) {
      case 'new':
        return 0;
      case 'triaged':
        return 1;
      case 'in_progress':
        return 2;
      case 'resolved':
      case 'closed':
        return 3;
      default:
        return 0;
    }
  };

  const currentStageIdx = activeTicket ? getStageIndex(activeTicket.status) : 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Search Input Box */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
          Lookup by Code or Token
        </label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder={t('trackingInputPlaceholder', 'Enter Reference Code (e.g. CARE-2026-1042) or Token #')}
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs sm:text-sm font-mono font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 transition-all"
            />
          </div>
          <button
            type="button"
            onClick={() => handleSearch()}
            disabled={loading}
            className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Searching...' : t('trackTicketBtn', 'Track Status')}
          </button>
        </div>

        {/* Recent Tickets History Quick Chips */}
        {recentTickets.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mt-1">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mr-1">
              Recent:
            </span>
            {recentTickets.map((rec) => (
              <button
                key={rec.ticketNumber}
                type="button"
                onClick={() => {
                  setQuery(rec.ticketNumber);
                  handleSearch(rec.ticketNumber);
                }}
                className="px-2.5 py-0.5 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-mono text-xs font-semibold border border-gray-200/60 dark:border-white/10 transition-colors"
              >
                {rec.ticketNumber}
              </button>
            ))}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Ticket Details & Timeline */}
      {activeTicket && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-6 p-5 sm:p-6 rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200/80 dark:border-white/10 shadow-xl"
        >
          {/* Header Card */}
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-200/80 dark:border-white/10 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {activeTicket.ticketNumber}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  activeTicket.status === 'resolved'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-500/30'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-500/30'
                }`}>
                  {SUPPORT_STATUSES[activeTicket.status]?.label || activeTicket.status}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-gray-900 dark:text-white mt-1">
                {activeTicket.subject}
              </h3>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-gray-400 dark:text-gray-500 block">
                Category: {SUPPORT_CATEGORIES[activeTicket.category]?.label || activeTicket.category}
              </span>
              {activeTicket.student?.tokenNumber && (
                <span className="text-xs font-mono font-bold text-gray-700 dark:text-gray-300">
                  Token #{activeTicket.student.tokenNumber}
                </span>
              )}
            </div>
          </div>

          {/* Milestone Step Progress Bar */}
          <div className="py-2">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-4">
              {t('ticketStatusTimeline', 'Resolution Milestone Timeline')}
            </span>

            <div className="relative flex items-center justify-between">
              {/* Connecting background line */}
              <div className="absolute top-1/2 left-0 right-0 -translate-y-1/2 h-1 bg-gray-200 dark:bg-white/10 rounded-full z-0" />
              {/* Connecting active filled line */}
              <div
                className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-emerald-500 rounded-full z-0 transition-all duration-500"
                style={{ width: `${(currentStageIdx / (STAGES.length - 1)) * 100}%` }}
              />

              {STAGES.map((stg, idx) => {
                const isPassed = idx <= currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                return (
                  <div key={stg.id} className="relative z-10 flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isCurrent
                          ? 'bg-emerald-600 text-white ring-4 ring-emerald-500/30 shadow-glow-emerald scale-110'
                          : isPassed
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-100 dark:bg-[#1a2521] text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-white/10'
                      }`}
                    >
                      {isPassed ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                    </div>
                    <span
                      className={`text-[10px] sm:text-xs font-extrabold mt-1.5 ${
                        isCurrent
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isPassed
                          ? 'text-gray-800 dark:text-gray-200'
                          : 'text-gray-400 dark:text-gray-600'
                      }`}
                    >
                      {t(stg.key, stg.label)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Conversation Thread */}
          <div className="flex flex-col gap-3">
            <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              Communication & Updates
            </span>

            <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto p-1">
              {(activeTicket.thread || []).filter((msg) => !msg.isInternal).map((msg) => {
                const isStudent = msg.senderType === 'student';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col p-3.5 rounded-2xl text-xs max-w-[85%] ${
                      isStudent
                        ? 'self-start bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-gray-900 dark:text-white'
                        : 'self-end bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/30 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100 shadow-sm'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="font-extrabold text-[11px] flex items-center gap-1">
                        {!isStudent && <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />}
                        {msg.senderName}
                      </span>
                      <span className="text-[10px] text-gray-400 dark:text-gray-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Follow-up Reply Input */}
          {activeTicket.status !== 'closed' && (
            <form onSubmit={handleSendReply} className="flex gap-2 pt-2 border-t border-gray-200/60 dark:border-white/10">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t('studentReplyPlaceholder', 'Type a follow-up reply or question...')}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <button
                type="submit"
                disabled={sendingReply || !replyText.trim()}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
              >
                {sendingReply ? '...' : t('sendReplyBtn', 'Send Reply')}
              </button>
            </form>
          )}
        </motion.div>
      )}
    </div>
  );
}
