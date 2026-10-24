import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../store/AuthContext';
import { DataOfOne } from '../store/StudentData';
import { useIdleTimer } from '../utils/useIdleTimer';
import { dialog } from '../utils/dialog';
import firebase from '../firebase/config';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { usePreferences } from '../store/PreferencesContext';
import { useSidebar } from './nav/SidebarContext';

import FloatingDesktopNav from './nav/FloatingDesktopNav';
import MobileTopBar from './nav/MobileTopBar';
import MobileBottomDock from './nav/MobileBottomDock';
import NavSearchModal from './nav/NavSearchModal';
import StaffManagementModal from './StaffManagementModal';
import ShareActionModal from './ui/ShareActionModal';
import NotificationTickerBanner from './notifications/NotificationTickerBanner';

const Navbar = ({ isAdmin }) => {
  const {
    user,
    role,
    staffProfile,
    roleBadge,
    isCook,
    isCanteenCommittee,
    isCentralCommittee,
    isDeveloper,
    homeRoute,
  } = useContext(AuthContext);
  const { stdata, logoutStudent } = useContext(DataOfOne);
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const location = useLocation();
  const navigate = useNavigate();

  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useSidebar();

  // State
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);

  // Committee idle timeout: 15 mins
  useIdleTimer({
    timeoutMs: 900000,
    warningMs: 30000,
    onTimeout: () => {
      if (user) {
        firebase.auth().signOut();
        feedback('warning');
        navigate('/alogin', {
          state: { notice: 'Administrator session expired due to inactivity. Please sign in again.' },
        });
      }
    },
    enabled: Boolean(user && isAdmin),
  });

  const { preferences } = usePreferences();
  const kioskMode = preferences?.kioskTimeoutMode || 'strict';
  const studentTimeoutConfig = React.useMemo(() => {
    if (kioskMode === 'persistent') {
      return { timeoutMs: 86400000, warningMs: 60000, enabled: false };
    }
    if (kioskMode === 'extended') {
      return { timeoutMs: 900000, warningMs: 30000, enabled: true }; // 15 mins
    }
    return { timeoutMs: 150000, warningMs: 25000, enabled: true }; // 2.5 mins strict
  }, [kioskMode]);

  // Student idle timeout (respects preferences.kioskTimeoutMode)
  useIdleTimer({
    timeoutMs: studentTimeoutConfig.timeoutMs,
    warningMs: studentTimeoutConfig.warningMs,
    onTimeout: () => {
      if (stdata) {
        if (logoutStudent) logoutStudent();
        feedback('warning');
        dialog.toast.info(
          t('sessionExpired', 'Session Expired'),
          t('sessionExpiredStudent', 'Student session signed out automatically to protect public campus terminals.')
        );
        if (location.pathname === '/student' || location.pathname === '/student-portal') {
          navigate('/');
        }
      }
    },
    enabled: Boolean(stdata && !user && studentTimeoutConfig.enabled),
  });

  // Global Command+K / Ctrl+K search listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleLogoutAdmin = async () => {
    const confirmed = await dialog.confirm({
      title: t('navLogout', 'Logout'),
      message: t('logoutConfirmMsg', 'Are you sure you want to sign out of the ADSA Committee console?'),
      confirmText: t('navLogout', 'Yes, Logout'),
      cancelText: t('cancel', 'Cancel'),
      confirmColor: 'rose',
      icon: 'warning',
    });

    if (confirmed) {
      await firebase.auth().signOut();
      dialog.toast.info('Signed Out', 'You have been safely signed out of the committee console.');
      navigate('/alogin');
    }
  };

  const handleLogoutStudent = () => {
    feedback('tick');
    if (logoutStudent) logoutStudent();
    dialog.toast.info('Signed Out', 'Your student token session has been cleared.');
    if (location.pathname === '/student' || location.pathname === '/student-portal') {
      navigate('/');
    }
  };

  const handleSearchNavigate = (item) => {
    if (item.isModalAction) {
      if (item.action === 'open_staff_modal') setStaffModalOpen(true);
      if (item.action === 'open_share_modal') setShareModalOpen(true);
      return;
    }
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <>
      {/* Top Header Placeholder to give comfortable space for floating navbar */}
      <header id="nav-landmark" role="banner" aria-label="Primary Navigation" className="relative w-full">
        {/* Desktop Floating Dynamic Island Navbar */}
        <FloatingDesktopNav
          user={user}
          stdata={stdata}
          isCook={isCook}
          isCanteenCommittee={isCanteenCommittee}
          onOpenSidebar={toggleSidebar}
          onOpenSearch={() => setSearchModalOpen(true)}
        />

        {/* Desktop Spacer so page hero sits nicely below floating nav */}
        <div className="hidden md:block h-20" />

        {/* Mobile Minimalist Top Bar */}
        <MobileTopBar
          user={user}
          roleBadge={roleBadge}
          stdata={stdata}
          onOpenSidebar={toggleSidebar}
          onOpenSearch={() => setSearchModalOpen(true)}
          onOpenShareModal={() => setShareModalOpen(true)}
        />
      </header>

      {/* Ambient Broadcast Sticky Banner Marquee */}
      <div id="announcements-landmark" role="region" aria-label="Announcements & Cutoffs">
        <NotificationTickerBanner />
      </div>

      {/* Mobile Floating Bottom Ergonomic Dock */}
      <MobileBottomDock
        stdata={stdata}
        user={user}
        isCook={isCook}
        isCanteenCommittee={isCanteenCommittee}
        onOpenSidebar={toggleSidebar}
        sidebarOpen={sidebarOpen}
      />

      {/* High-speed Command Palette / Search Modal */}
      <NavSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onNavigate={handleSearchNavigate}
        userRole={role}
        isStudent={Boolean(stdata?.tokenNo)}
      />

      {/* Staff Roles & Delegation Modal */}
      <StaffManagementModal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
      />

      {/* Universal Social Share Modal */}
      <ShareActionModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />
    </>
  );
};

export default Navbar;