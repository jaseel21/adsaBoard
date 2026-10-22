import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AuthContext } from './AuthContext';
import { DataOfOne } from './StudentData';
import {
  subscribeToActiveNotifications,
  isNotificationApplicable,
  incrementNotificationView,
  incrementNotificationAck,
} from '../utils/notificationService';
import { soundEngine } from '../utils/soundEffects';
import { hapticEngine } from '../utils/haptics';

export const NotificationContext = createContext({
  notifications: [],
  unreadCount: 0,
  unreadNotifications: [],
  pinnedNotifications: [],
  isDrawerOpen: false,
  openDrawer: () => {},
  closeDrawer: () => {},
  toggleDrawer: () => {},
  markAsRead: () => {},
  markAllAsRead: () => {},
  dismissBanner: () => {},
  selectedNotification: null,
  setSelectedNotification: () => {},
  activeCategory: 'all',
  setActiveCategory: () => {},
  searchQuery: '',
  setSearchQuery: () => {},
});

const READ_STORAGE_KEY = 'adsa_notifications_read_v1';
const DISMISSED_BANNERS_KEY = 'adsa_notifications_dismissed_banners_v1';
const ACK_DIALOGS_STORAGE_KEY = 'adsa_ack_dialog_notifications_v1';

export const NotificationProvider = ({ children }) => {
  const { user, role, isStaff } = useContext(AuthContext);
  const { stdata } = useContext(DataOfOne);

  const [rawNotifications, setRawNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Persistent Read IDs, Dismissed Banners, and Acknowledged Dialogs
  const [readIds, setReadIds] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(READ_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  const [dismissedBannerIds, setDismissedBannerIds] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(DISMISSED_BANNERS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  const [acknowledgedDialogIds, setAcknowledgedDialogIds] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = localStorage.getItem(ACK_DIALOGS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (_) {
      return [];
    }
  });

  // Track previous notification count to trigger alerts on fresh broadcasts
  const prevCountRef = useRef(0);
  const isInitialLoadRef = useRef(true);

  // Subscribe to real-time active notifications
  useEffect(() => {
    const unsubscribe = subscribeToActiveNotifications({
      onUpdate: (items) => {
        setRawNotifications(items);
        setLoading(false);

        // If not initial load and new items arrived, ring crystal chime & haptic
        if (!isInitialLoadRef.current && items.length > prevCountRef.current) {
          const newest = items[0];
          if (newest?.severity === 'critical') {
            soundEngine.playCautionThud();
            hapticEngine.urgentAlert();
          } else {
            soundEngine.playNotificationChime();
            hapticEngine.notificationAlert();
          }
        }
        isInitialLoadRef.current = false;
        prevCountRef.current = items.length;
      },
      onError: (err) => {
        console.warn('[NotificationProvider] Fallback on error:', err);
        setLoading(false);
      },
    });

    return () => unsubscribe();
  }, []);

  // Filter applicable notifications for the current user/device context
  const applicableNotifications = useMemo(() => {
    const userContext = {
      isStaff,
      role,
      tokenNo: stdata?.tokenNo,
      batch: stdata?.batch,
    };

    return rawNotifications.filter((n) => isNotificationApplicable(n, userContext));
  }, [rawNotifications, isStaff, role, stdata?.tokenNo, stdata?.batch]);

  // Derived filtered items based on category and search
  const filteredNotifications = useMemo(() => {
    return applicableNotifications.filter((item) => {
      // Category match
      if (activeCategory !== 'all') {
        if (activeCategory === 'urgent' && item.severity !== 'critical' && item.severity !== 'warning') {
          return false;
        } else if (activeCategory !== 'urgent' && item.category !== activeCategory) {
          return false;
        }
      }

      // Search match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const titleMatch = item.title?.toLowerCase().includes(q);
        const bodyMatch = item.body?.toLowerCase().includes(q);
        return titleMatch || bodyMatch;
      }

      return true;
    });
  }, [applicableNotifications, activeCategory, searchQuery]);

  // Unread items & unread count
  const unreadNotifications = useMemo(() => {
    return applicableNotifications.filter((n) => !readIds.includes(n.id));
  }, [applicableNotifications, readIds]);

  const unreadCount = unreadNotifications.length;

  // Active Pinned Banners that haven't been dismissed
  const pinnedNotifications = useMemo(() => {
    return applicableNotifications.filter(
      (n) => n.bannerPinned && !dismissedBannerIds.includes(n.id)
    );
  }, [applicableNotifications, dismissedBannerIds]);

  // Active High-Urgency Dialog Notification (Unacknowledged)
  const activeDialogNotification = useMemo(() => {
    return applicableNotifications.find((n) => {
      const isDialog = n.displayStyle === 'dialog' || n.displayStyle === 'all';
      return isDialog && !acknowledgedDialogIds.includes(n.id);
    }) || null;
  }, [applicableNotifications, acknowledgedDialogIds]);

  // Mark single notification as read
  const markAsRead = (id) => {
    if (!id || readIds.includes(id)) return;
    const updated = [...readIds, id];
    setReadIds(updated);
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}
    soundEngine.playPop();
    hapticEngine.lightTap();
    incrementNotificationAck(id);
  };

  // Explicitly acknowledge an urgent dialog notification
  const acknowledgeDialog = (id) => {
    if (!id) return;
    const updated = [...acknowledgedDialogIds, id];
    setAcknowledgedDialogIds(updated);
    try {
      localStorage.setItem(ACK_DIALOGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}
    markAsRead(id);
    soundEngine.playDismissWhoosh();
    hapticEngine.lightTap();
  };

  // Mark all currently applicable notifications as read
  const markAllAsRead = () => {
    const allIds = applicableNotifications.map((n) => n.id);
    const updated = Array.from(new Set([...readIds, ...allIds]));
    setReadIds(updated);
    try {
      localStorage.setItem(READ_STORAGE_KEY, JSON.stringify(updated));
    } catch (_) {}
    soundEngine.playDismissWhoosh();
    hapticEngine.successPulse();
  };

  // Dismiss a pinned banner
  const dismissBanner = (id) => {
    if (!id || dismissedBannerIds.includes(id)) return;
    const updated = [...dismissedBannerIds, id];
    setDismissedBannerIds(updated);
    try {
      localStorage.setItem(DISMISSED_BANNERS_KEY, JSON.stringify(updated));
    } catch (_) {}
    soundEngine.playDismissWhoosh();
    hapticEngine.lightTap();
  };

  // Drawer Controls with Audio/Haptic
  const openDrawer = useCallback(() => {
    setIsDrawerOpen(true);
    soundEngine.playNotificationChime();
    hapticEngine.lightTap();
  }, []);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    soundEngine.playDismissWhoosh();
    hapticEngine.lightTap();
  }, []);

  const toggleDrawer = useCallback(() => {
    setIsDrawerOpen((prev) => {
      if (prev) {
        soundEngine.playDismissWhoosh();
      } else {
        soundEngine.playNotificationChime();
      }
      hapticEngine.lightTap();
      return !prev;
    });
  }, []);

  // Global Keyboard Shortcut: Press 'N' or 'Shift+N' to open drawer (when not typing in an input)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || document.activeElement?.isContentEditable) {
        return;
      }
      if (e.key === 'n' || e.key === 'N') {
        if (!e.ctrlKey && !e.metaKey && !e.altKey) {
          e.preventDefault();
          toggleDrawer();
        }
      }
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, toggleDrawer, closeDrawer]);

  return (
    <NotificationContext.Provider
      value={{
        notifications: applicableNotifications,
        filteredNotifications,
        unreadCount,
        unreadNotifications,
        pinnedNotifications,
        activeDialogNotification,
        acknowledgedDialogIds,
        acknowledgeDialog,
        readIds,
        loading,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        markAsRead,
        markAllAsRead,
        dismissBanner,
        selectedNotification,
        setSelectedNotification,
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
