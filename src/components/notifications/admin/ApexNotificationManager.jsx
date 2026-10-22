import React, { useState, useEffect, useContext, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Plus,
  Search,
  Filter,
  Pin,
  PinOff,
  Edit2,
  Trash2,
  Archive,
  Eye,
  CheckCircle2,
  Users,
  Radio,
  Clock,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { AuthContext } from '../../../store/AuthContext';
import { useLanguage } from '../../../store/LanguageContext';
import { dialog } from '../../../utils/dialog';
import {
  subscribeToAllNotifications,
  togglePinNotification,
  archiveNotification,
  deleteNotification,
} from '../../../utils/notificationService';
import ApexNotificationComposer from './ApexNotificationComposer';
import { soundEngine } from '../../../utils/soundEffects';
import { hapticEngine } from '../../../utils/haptics';

export default function ApexNotificationManager() {
  const { user, staffProfile, role } = useContext(AuthContext);
  const { t } = useLanguage();

  const [allNotifications, setAllNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'draft' | 'scheduled' | 'archived'
  const [searchQuery, setSearchQuery] = useState('');

  // Composer Modal State
  const [composerOpen, setComposerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  // Subscribe to all notifications in real-time
  useEffect(() => {
    const unsub = subscribeToAllNotifications({
      onUpdate: (items) => {
        setAllNotifications(items);
        setLoading(false);
      },
      onError: (err) => {
        console.error('[ApexManager] Subscribe Error:', err);
        setLoading(false);
      },
    });

    return () => unsub();
  }, []);

  // Filtered Ledger Items
  const filteredItems = useMemo(() => {
    return allNotifications.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const mTitle = item.title?.toLowerCase().includes(q);
        const mBody = item.body?.toLowerCase().includes(q);
        const mAuthor = item.createdBy?.name?.toLowerCase().includes(q);
        return mTitle || mBody || mAuthor;
      }
      return true;
    });
  }, [allNotifications, statusFilter, searchQuery]);

  // Telemetry Calculations
  const metrics = useMemo(() => {
    const active = allNotifications.filter((n) => n.status === 'active');
    const pinned = active.filter((n) => n.bannerPinned);
    const drafts = allNotifications.filter((n) => n.status === 'draft');
    const totalViews = allNotifications.reduce((acc, curr) => acc + (curr.stats?.viewCount || 0), 0);
    const totalAcks = allNotifications.reduce((acc, curr) => acc + (curr.stats?.ackCount || 0), 0);

    return {
      activeCount: active.length,
      pinnedCount: pinned.length,
      draftCount: drafts.length,
      totalViews,
      totalAcks,
    };
  }, [allNotifications]);

  const actor = useMemo(
    () => ({
      uid: user?.uid || 'committee-admin',
      name: staffProfile?.name || user?.displayName || 'Canteen Committee',
      role: role || 'canteen_committee',
      email: user?.email || '',
    }),
    [user, staffProfile, role]
  );

  // Handlers
  const handleTogglePin = async (item) => {
    soundEngine.playMechanicalClick();
    hapticEngine.lightTap();
    const newStatus = !item.bannerPinned;
    try {
      await togglePinNotification(item.id, newStatus, actor);
      dialog.toast.info(
        newStatus ? 'Pinned to Top Banner' : 'Unpinned from Banner',
        `"${item.title}" banner status updated.`
      );
    } catch (err) {
      dialog.toast.error('Pin Update Failed', err.message);
    }
  };

  const handleArchive = async (item) => {
    const confirmed = await dialog.confirm({
      title: 'Archive Announcement?',
      message: `Are you sure you want to pull down "${item.title}" from active broadcasts?`,
      confirmText: 'Yes, Archive',
      cancelText: 'Cancel',
      confirmColor: 'amber',
    });

    if (confirmed) {
      soundEngine.playDismissWhoosh();
      try {
        await archiveNotification(item.id, actor);
        dialog.toast.info('Archived', `Announcement moved to archives.`);
      } catch (err) {
        dialog.toast.error('Archive Failed', err.message);
      }
    }
  };

  const handleDelete = async (item) => {
    const confirmed = await dialog.confirm({
      title: 'Delete Announcement?',
      message: `Permanently delete "${item.title}"? This action is recorded in the central audit trail.`,
      confirmText: 'Delete Permanently',
      cancelText: 'Cancel',
      confirmColor: 'rose',
      icon: 'warning',
    });

    if (confirmed) {
      soundEngine.playCautionThud();
      hapticEngine.warningBuzz();
      try {
        await deleteNotification(item.id, item.title, actor);
        dialog.toast.success('Deleted', 'Announcement permanently removed.');
      } catch (err) {
        dialog.toast.error('Delete Failed', err.message);
      }
    }
  };

  const handleEdit = (item) => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setEditingItem(item);
    setComposerOpen(true);
  };

  const handleNewBroadcast = () => {
    soundEngine.playPop();
    hapticEngine.lightTap();
    setEditingItem(null);
    setComposerOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f8faf8] dark:bg-[#080d0b] text-gray-900 dark:text-gray-100 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header HUD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 sm:p-6 rounded-3xl bg-white/80 dark:bg-[#0c1411]/90 backdrop-blur-2xl border border-gray-200/80 dark:border-white/10 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-gray-900 dark:text-white">
                  {t('adminNotificationsTitle', 'Apex Broadcast Studio & Ledger')}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  Live Operations
                </span>
              </div>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {t(
                  'adminNotificationsSubtitle',
                  'Broadcast live announcements, manage scheduled alerts, and monitor audience reach'
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleNewBroadcast}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs shadow-md shadow-emerald-600/25 active:scale-95 transition-all w-fit"
          >
            <Plus className="w-4 h-4" />
            <span>{t('newBroadcastBtn', 'New Broadcast')}</span>
          </button>
        </div>

        {/* Telemetry HUD Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="p-4 rounded-2xl bg-white/70 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold">
              <span>Active Broadcasts</span>
              <Radio className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
              {metrics.activeCount}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              Live on student portals
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold">
              <span>Pinned Top Banners</span>
              <Pin className="w-4 h-4 text-amber-500 rotate-45" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
              {metrics.pinnedCount}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
              High visibility marquees
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold">
              <span>Audience Reach</span>
              <Users className="w-4 h-4 text-teal-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
              ~340
            </div>
            <div className="text-[11px] text-teal-600 dark:text-teal-400 font-semibold mt-0.5">
              Active campus subscribers
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/70 dark:bg-white/5 border border-gray-200/70 dark:border-white/10 backdrop-blur-xl">
            <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs font-bold">
              <span>Drafts & Queued</span>
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white mt-1">
              {metrics.draftCount}
            </div>
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold mt-0.5">
              Ready to dispatch
            </div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-3 sm:p-4 rounded-2xl bg-white/80 dark:bg-[#0c1411]/80 backdrop-blur-xl border border-gray-200/80 dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100 dark:bg-white/5 border border-gray-200/60 dark:border-white/5 overflow-x-auto w-full sm:w-auto">
            {['all', 'active', 'draft', 'archived'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all uppercase tracking-wider ${
                  statusFilter === st
                    ? 'bg-white dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 shadow-sm border border-emerald-500/20'
                    : 'text-gray-500 hover:text-gray-800 dark:hover:text-gray-200'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, content, author..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Broadcast Announcements Ledger */}
        <div className="space-y-3">
          {loading ? (
            <div className="p-12 text-center text-sm font-bold text-gray-500">
              Loading broadcast ledger...
            </div>
          ) : filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#0c1411] border transition-all backdrop-blur-xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  item.status === 'active'
                    ? 'border-gray-200/80 dark:border-white/10'
                    : 'border-dashed border-gray-300 dark:border-white/10 opacity-75'
                }`}
              >
                {/* Left Info Column */}
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Status Pill */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        item.status === 'active'
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                          : item.status === 'draft'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                          : 'bg-gray-500/15 text-gray-600 dark:text-gray-400 border border-gray-500/30'
                      }`}
                    >
                      {item.status}
                    </span>

                    {/* Category Pill */}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300">
                      {item.category}
                    </span>

                    {/* Severity Pill */}
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        item.severity === 'critical'
                          ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                          : item.severity === 'festive'
                          ? 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                          : item.severity === 'warning'
                          ? 'bg-amber-500/15 text-amber-600'
                          : 'bg-emerald-500/10 text-emerald-600'
                      }`}
                    >
                      {item.severity}
                    </span>

                    {/* Pinned Badge */}
                    {item.bannerPinned && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                        <Pin className="w-2.5 h-2.5 rotate-45" />
                        <span>Pinned Banner</span>
                      </span>
                    )}

                    {/* Target Audience Scope */}
                    <span className="text-[11px] font-mono text-gray-500 dark:text-gray-400">
                      Audience: {item.targetAudience?.type || 'all'}
                      {item.targetAudience?.batches?.length ? ` (${item.targetAudience.batches.join(', ')})` : ''}
                    </span>
                  </div>

                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white tracking-tight">
                    {item.title}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 max-w-3xl leading-relaxed">
                    {item.body}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[11px] font-medium text-gray-400">
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{item.createdBy?.name || 'Administrator'}</span>
                    </span>
                    <span>•</span>
                    <span>
                      {item.createdAt?.toDate
                        ? item.createdAt.toDate().toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Just now'}
                    </span>
                  </div>
                </div>

                {/* Right Action Island */}
                <div className="flex items-center gap-2 flex-shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-gray-100 dark:border-white/5">
                  {/* Pin/Unpin Toggle */}
                  <button
                    type="button"
                    onClick={() => handleTogglePin(item)}
                    className={`p-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border ${
                      item.bannerPinned
                        ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-400/50'
                        : 'bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-gray-300'
                    }`}
                    title={item.bannerPinned ? 'Unpin from Top Banner' : 'Pin to Top Banner'}
                  >
                    <Pin className={`w-3.5 h-3.5 ${item.bannerPinned ? 'rotate-45' : ''}`} />
                    <span className="hidden sm:inline">{item.bannerPinned ? 'Pinned' : 'Pin'}</span>
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleEdit(item)}
                    className="p-2 rounded-xl text-xs font-bold bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
                    title="Edit announcement"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Edit</span>
                  </button>

                  {/* Archive Button */}
                  {item.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleArchive(item)}
                      className="p-2 rounded-xl text-xs font-bold bg-white dark:bg-white/5 text-amber-600 dark:text-amber-400 border border-gray-200 dark:border-white/10 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                      title="Archive announcement"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    className="p-2 rounded-xl text-xs font-bold bg-white dark:bg-white/5 text-rose-600 dark:text-rose-400 border border-gray-200 dark:border-white/10 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="p-12 text-center rounded-3xl bg-white/70 dark:bg-white/5 border border-gray-200/80 dark:border-white/10 space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center mx-auto">
                <Bell className="w-8 h-8 text-emerald-500" />
              </div>
              <h3 className="text-base font-extrabold text-gray-800 dark:text-gray-200">
                No announcements found
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                Create a live campus announcement, publish meal updates, or post emergency cutoff extensions.
              </p>
              <button
                type="button"
                onClick={handleNewBroadcast}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Announcement</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Apex Composer Modal Studio */}
      <ApexNotificationComposer
        isOpen={composerOpen}
        onClose={() => {
          setComposerOpen(false);
          setEditingItem(null);
        }}
        editingNotification={editingItem}
        onSuccess={() => {
          // Real-time listener will automatically update state
        }}
      />
    </div>
  );
}
