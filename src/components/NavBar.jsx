import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { AuthContext } from '../store/AuthContext';
import { DataOfOne } from '../store/StudentData';
import { useIdleTimer } from '../utils/useIdleTimer';
import { dialog } from '../utils/dialog';
import firebase from '../firebase/config';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import { usePreferences } from '../store/PreferencesContext';
import { getKioskTimeoutConfig } from '../utils/preferencesConfig';
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
    return getKioskTimeoutConfig(kioskMode);
  }, [kioskMode]);

  const handleStudentTimeout = React.useCallback(() => {
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
  }, [stdata, logoutStudent, feedback, t, location.pathname, navigate]);

  // Global Student Inactivity Kiosk Safety Guard
  const {
    isWarning: isStudentWarning,
    remainingSeconds: studentRemainingSeconds,
    resetTimer: resetStudentTimer,
  } = useIdleTimer({
    timeoutMs: studentTimeoutConfig.timeoutMs,
    warningMs: studentTimeoutConfig.warningMs,
    onTimeout: handleStudentTimeout,
    enabled: Boolean(stdata?.tokenNo && !user && studentTimeoutConfig.enabled),
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

      {/* Public Kiosk Auto-Logout Modal Warning (Global Guard) */}
      <AnimatePresence>
        {isStudentWarning && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 10 }}
              className="w-full max-w-sm rounded-3xl bg-white dark:bg-[#0f1715] border border-amber-300 dark:border-amber-500/30 p-6 shadow-2xl text-center space-y-4"
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="kiosk-timeout-title"
              aria-describedby="kiosk-timeout-desc"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 id="kiosk-timeout-title" className="text-base font-bold text-gray-900 dark:text-white">
                  {t('publicComputerSafety', 'Still here? (Public Computer Safety)')}
                </h3>
                <p id="kiosk-timeout-desc" className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {t('publicComputerWarning', 'To protect your token on this public computer, your session will automatically log out in:')}
                </p>
                <div className="text-3xl font-mono font-black text-amber-500 mt-2">
                  {studentRemainingSeconds}s
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={resetStudentTimer}
                  className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold text-xs shadow-md active:scale-95 transition-transform"
                >
                  {t('stayLoggedIn', 'Stay Logged In')}
                </button>
                <button
                  type="button"
                  onClick={handleStudentTimeout}
                  className="px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 font-bold text-xs active:scale-95 transition-transform"
                >
                  {t('exitNow', 'Exit Now')}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;