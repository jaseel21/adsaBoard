import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Phone,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Flame,
  AlertCircle,
  User,
  Lock,
  Unlock,
  Send,
  Trash2,
  Sparkles,
  RotateCcw,
  Paperclip,
} from 'lucide-react';
import {
  updateTicketStatus,
  appendTicketMessage,
  resolveTicket,
  deleteSupportTicket,
  CANNED_RESPONSES,
  SUPPORT_STATUSES,
  SUPPORT_CATEGORIES,
} from '../../../utils/supportTicketService';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';
import { useLanguage } from '../../../store/LanguageContext';
import ApexLinkPreview from '../../preview/ApexLinkPreview';
import firebase from '../../../firebase/config';

export default function SupportInspectorDrawer({
  isOpen = false,
  ticket = null,
  onClose,
  staffInfo = {},
  isCentralCommittee = false,
}) {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState('public'); // 'public' | 'internal'
  const [messageText, setMessageText] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);

  if (!isOpen || !ticket) return null;

  const handleClose = () => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    if (onClose) onClose();
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!messageText.trim() || !ticket.id) return;

    try {
      setSendingMsg(true);
      soundEngine.playMechanicalClick();
      hapticEngine.lightTap();

      const isInternal = activeTab === 'internal';
      await appendTicketMessage(ticket.id, {
        senderType: 'staff',
        senderName: staffInfo.name || staffInfo.email || 'Committee Officer',
        message: messageText.trim(),
        isInternal,
      });

      soundEngine.playSoftChime();
      setMessageText('');
    } catch (err) {
      console.error('Failed to append message:', err);
      soundEngine.playCautionThud();
    } finally {
      setSendingMsg(false);
    }
  };

  const handleSelectCanned = (canned) => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setMessageText(canned.text);
  };

  const handleExecuteResolve = async () => {
    try {
      soundEngine.playMechanicalClick();
      hapticEngine.successPulse();

      await resolveTicket(
        ticket.id,
        resolutionNotes.trim() || 'Issue addressed and resolved by committee.',
        staffInfo
      );

      soundEngine.playSoftChime();
      setShowResolveModal(false);
    } catch (err) {
      console.error('Failed to resolve ticket:', err);
      soundEngine.playCautionThud();
    }
  };

  const handleReopen = async () => {
    try {
      soundEngine.playPop();
      await updateTicketStatus(ticket.id, 'in_progress', staffInfo, 'Reopened for additional review');
    } catch (err) {
      console.error('Failed to reopen ticket:', err);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to permanently delete ticket ${ticket.ticketNumber}?`)) {
      return;
    }
    try {
      soundEngine.playCautionThud();
      await deleteSupportTicket(ticket.id, staffInfo);
      handleClose();
    } catch (err) {
      console.error('Failed to delete ticket:', err);
    }
  };

  // 1-Click unblock student token if studentToken exists and user is Central Committee
  const handleUnblockStudent = async () => {
    if (!ticket.student?.tokenNumber) return;
    try {
      soundEngine.playMechanicalClick();
      hapticEngine.mediumTick();

      const db = firebase.firestore();
      const tokenStr = String(ticket.student.tokenNumber);

      // Search student by token number or ID
      const querySnap = await db.collection('students').where('id', '==', ticket.student.tokenNumber).get();
      if (!querySnap.empty) {
        const studentDoc = querySnap.docs[0];
        await studentDoc.ref.update({
          block: false,
          blockReason: 'Unblocked via Care Ticket resolution',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });
      }

      await appendTicketMessage(ticket.id, {
        senderType: 'staff',
        senderName: staffInfo.name || 'Central Committee',
        message: `Token #${ticket.student.tokenNumber} has been verified and successfully unblocked in the master registry.`,
        isInternal: false,
      });

      soundEngine.playSoftChime();
      hapticEngine.successPulse();
      alert(`Token #${ticket.student.tokenNumber} has been successfully unblocked!`);
    } catch (err) {
      console.error('Failed to unblock student token:', err);
      soundEngine.playCautionThud();
      alert('Failed to unblock token. Please verify permissions.');
    }
  };

  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/50 backdrop-blur-xs"
      />

      {/* Inspector Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 350 }}
        className="relative w-full max-w-xl bg-white dark:bg-[#0c1412] border-l border-gray-200 dark:border-white/10 shadow-2xl h-full flex flex-col z-10"
      >
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-900 text-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-base sm:text-lg font-black tracking-wider">
                {ticket.ticketNumber}
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                isResolved
                  ? 'bg-emerald-500/30 text-emerald-100 border border-emerald-400/40'
                  : 'bg-amber-500/30 text-amber-100 border border-amber-400/40'
              }`}>
                {ticket.status}
              </span>
            </div>
            <h3 className="text-xs sm:text-sm font-extrabold text-emerald-100 mt-0.5 line-clamp-1">
              {ticket.subject}
            </h3>
          </div>

          <button
            type="button"
            onClick={handleClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-5">
          {/* Student Dossier Box */}
          <div className="p-4 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  {t('inspectorDossier', 'Student Dining Dossier')}
                </span>
              </div>

              {ticket.student?.tokenNumber && (
                <span className="font-mono text-xs font-black px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                  Token #{ticket.student.tokenNumber}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Name</span>
                <span className="font-bold text-gray-900 dark:text-white">
                  {ticket.student?.name || 'Anonymous Diner'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-bold text-gray-400 uppercase block">Batch & Room</span>
                <span className="font-semibold text-gray-800 dark:text-gray-200">
                  {ticket.student?.batch || '--'} {ticket.student?.room ? `• ${ticket.student.room}` : ''}
                </span>
              </div>
            </div>

            {/* Direct Connect Buttons */}
            {ticket.student?.phone && (
              <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60 dark:border-white/5">
                <ApexLinkPreview url={`tel:${ticket.student.phone.replace(/\s+/g, '')}`} className="flex-1">
                  <a
                    href={`tel:${ticket.student.phone.replace(/\s+/g, '')}`}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 text-xs font-bold text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>{t('callStudentBtn', 'Call Student')}</span>
                  </a>
                </ApexLinkPreview>

                <ApexLinkPreview url={`https://wa.me/${ticket.student.phone.replace(/[^0-9]/g, '')}`} className="flex-1">
                  <a
                    href={`https://wa.me/${ticket.student.phone.replace(/[^0-9]/g, '')}?text=Assalamu%20Alaikum,%20regarding%20your%20ADSA%20Care%20ticket%20${ticket.ticketNumber}:`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-xs font-bold text-white shadow-sm transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{t('whatsappStudentBtn', 'WhatsApp Student')}</span>
                  </a>
                </ApexLinkPreview>
              </div>
            )}

            {/* 1-Click Unblock Token Trigger (Central Committee) */}
            {ticket.category === 'token_lock' && ticket.student?.tokenNumber && isCentralCommittee && (
              <button
                type="button"
                onClick={handleUnblockStudent}
                className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-bold text-xs shadow-md shadow-teal-600/25 active:scale-98 transition-all cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>{t('unblockTokenBtn', '1-Click Unblock Token')}</span>
              </button>
            )}
          </div>

          {/* Evidence Attachments */}
          {ticket.attachments && ticket.attachments.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                Attached Evidence
              </span>
              <div className="flex flex-wrap gap-2">
                {ticket.attachments.map((att, idx) => (
                  <ApexLinkPreview
                    key={idx}
                    url={att.url}
                    overrides={{ title: att.name || 'Attachment Evidence', mediaType: 'document' }}
                  >
                    <a
                      href={att.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-2 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-xs font-semibold text-gray-800 dark:text-gray-200 border border-gray-200/80 dark:border-white/10"
                    >
                      <Paperclip className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="truncate max-w-[150px]">{att.name || 'Attachment'}</span>
                    </a>
                  </ApexLinkPreview>
                ))}
              </div>
            </div>
          )}

          {/* Thread View Tabs: Public vs Internal */}
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between border-b border-gray-200/80 dark:border-white/10 pb-1.5">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('public')}
                  className={`text-xs font-bold pb-1 transition-all ${
                    activeTab === 'public'
                      ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-500'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {t('inspectorPublicThread', 'Public Student Thread')}
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('internal')}
                  className={`text-xs font-bold pb-1 transition-all ${
                    activeTab === 'internal'
                      ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-500'
                      : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {t('inspectorInternalNotes', 'Private Committee Notes')}
                </button>
              </div>
            </div>

            {/* Thread Messages */}
            <div className="flex flex-col gap-2.5 max-h-72 overflow-y-auto p-1">
              {(ticket.thread || [])
                .filter((msg) => (activeTab === 'internal' ? true : !msg.isInternal))
                .map((msg) => {
                  const isStudent = msg.senderType === 'student';
                  const isInternal = Boolean(msg.isInternal);

                  return (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-2xl text-xs flex flex-col gap-1 ${
                        isInternal
                          ? 'bg-amber-50/70 dark:bg-amber-950/20 border border-amber-500/30 text-amber-950 dark:text-amber-200'
                          : isStudent
                          ? 'bg-gray-100 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 text-gray-900 dark:text-white'
                          : 'bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-500/30 text-emerald-950 dark:text-emerald-100'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="flex items-center gap-1">
                          {isInternal ? (
                            <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-200/60 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                              Internal Note
                            </span>
                          ) : (
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          )}
                          <span>{msg.senderName}</span>
                        </span>
                        <span className="text-[10px] font-mono text-gray-400">
                          {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                    </div>
                  );
                })}
            </div>

            {/* Canned Responses Preset Bar */}
            <div className="flex flex-col gap-1.5 pt-2">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                Quick Canned Templates
              </span>
              <div className="flex flex-wrap gap-1.5">
                {CANNED_RESPONSES.map((can) => (
                  <button
                    key={can.id}
                    type="button"
                    onClick={() => handleSelectCanned(can)}
                    className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-gray-600 dark:text-gray-300 hover:text-emerald-600 text-[11px] font-semibold transition-colors border border-gray-200/60 dark:border-white/10"
                  >
                    + {can.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Reply Input Box */}
            <form onSubmit={handleSendMessage} className="flex gap-2 pt-2">
              <input
                type="text"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder={
                  activeTab === 'internal'
                    ? 'Write confidential staff note...'
                    : 'Write official response to student...'
                }
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <button
                type="submit"
                disabled={sendingMsg || !messageText.trim()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 disabled:opacity-40 transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>

        {/* Action Footer */}
        <div className="p-4 bg-gray-50 dark:bg-white/5 border-t border-gray-200/80 dark:border-white/10 flex items-center justify-between gap-2">
          {isCentralCommittee && (
            <button
              type="button"
              onClick={handleDelete}
              className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              title="Delete Ticket"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2 ml-auto">
            {isResolved ? (
              <button
                type="button"
                onClick={handleReopen}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-200 dark:bg-white/10 hover:bg-gray-300 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t('reopenTicketBtn', 'Reopen Ticket')}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowResolveModal(true)}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25 active:scale-95 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('markResolvedBtn', 'Mark as Resolved')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Resolution Notes Modal Overlay */}
        <AnimatePresence>
          {showResolveModal && (
            <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="w-full max-w-md p-5 rounded-3xl bg-white dark:bg-[#0c1412] border border-gray-200 dark:border-white/10 shadow-2xl flex flex-col gap-4"
              >
                <h4 className="text-sm font-extrabold text-gray-900 dark:text-white">
                  Mark Ticket as Resolved
                </h4>
                <p className="text-xs text-gray-500">
                  Provide an official summary or closing note for {ticket.ticketNumber}. This will be visible on the student&apos;s tracker.
                </p>
                <textarea
                  rows={3}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="e.g. Reviewed meal seasoning with head chef; added extra gravy portion for dinner..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-xs text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/40 resize-none"
                />

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowResolveModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleExecuteResolve}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md shadow-emerald-600/25"
                  >
                    Confirm &amp; Resolve
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
