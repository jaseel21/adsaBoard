import React, { useState, useMemo, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  ChevronDown,
  LogOut,
  KeyRound,
  ShieldCheck,
  PanelLeftClose,
  PanelLeft,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  NAV_CATEGORIES,
  getGroupedNavItems,
  searchNavItems,
} from './navigationConfig';
import { useSidebar } from './SidebarContext';
import { AuthContext } from '../../store/AuthContext';
import { DataOfOne } from '../../store/StudentData';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import { dialog } from '../../utils/dialog';
import firebase from '../../firebase/config';
import StaffManagementModal from '../StaffManagementModal';
import ShareActionModal from '../ui/ShareActionModal';
import CanteenOpsActivityDrawer from '../admin/CanteenOpsActivityDrawer';

export default function BrowserLeftSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();
  const { sidebarOpen, closeSidebar, toggleSidebar, isDesktop } = useSidebar();

  const {
    user,
    role: userRole,
    roleBadge,
    staffProfile,
    isCentralCommittee,
  } = useContext(AuthContext);

  const { stdata, logoutStudent } = useContext(DataOfOne);

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState({});

  // Modals inside sidebar
  const [staffModalOpen, setStaffModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [opsLogOpen, setOpsLogOpen] = useState(false);

  const toggleCategory = (categoryId) => {
    feedback('tick');
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleNavigate = (path) => {
    feedback('tick');
    navigate(path);
    if (!isDesktop) {
      closeSidebar();
    }
  };

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

  const handleItemClick = (item) => {
    if (item.isModalAction) {
      if (item.action === 'open_staff_modal') setStaffModalOpen(true);
      if (item.action === 'open_share_modal') setShareModalOpen(true);
      if (item.action === 'open_ops_log_modal') setOpsLogOpen(true);
      if (!isDesktop) closeSidebar();
      return;
    }

    if (item.path) {
      handleNavigate(item.path);
    }
  };

  const isStudent = Boolean(stdata?.tokenNo);

  const groupedItems = useMemo(
    () => getGroupedNavItems(userRole, isStudent),
    [userRole, isStudent]
  );

  const searchResults = useMemo(
    () => searchNavItems(searchQuery, userRole, isStudent),
    [searchQuery, userRole, isStudent]
  );

  const isActive = (path) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  // Content of the sidebar
  const sidebarBody = (
    <div className="flex flex-col h-full w-full bg-white/95 dark:bg-[#0a120f]/95 backdrop-blur-2xl border-r border-gray-200/80 dark:border-white/10 select-none overflow-hidden">
      {/* 1. Sidebar Header with Brand and Collapse Toggle */}
      <div className="h-16 px-4 border-b border-gray-100 dark:border-white/10 flex items-center justify-between gap-2 bg-gray-50/80 dark:bg-white/5 flex-shrink-0 pt-[env(safe-area-inset-top)] sm:pt-0">
        <div
          onClick={() => handleNavigate('/')}
          className="flex items-center gap-2.5 cursor-pointer min-w-0 group"
          title="Go to Home"
        >
          <div className="w-8 h-8 rounded-xl p-0.5 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/60 dark:to-emerald-900/30 border border-emerald-300/60 dark:border-emerald-500/20 shadow-xs flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform overflow-hidden">
            <img
              src="https://alathurpadiDars.in/wp-content/uploads/2019/08/Dars-Site-Logo1.png"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
              alt="Alathurpadi Dars Crest"
              className="w-6 h-6 object-contain"
            />
          </div>

          <div className="flex items-center gap-1 min-w-0 leading-none">
            <span className="font-black text-base tracking-tight text-emerald-600 dark:text-emerald-400">
              ADSA
            </span>
            <span className="font-extrabold text-base tracking-tight text-gray-800 dark:text-white">
              T-Board
            </span>
          </div>
        </div>

        {/* Collapse Button (Desktop: PanelLeftClose, Mobile: X) */}
        <button
          type="button"
          onClick={() => {
            feedback('tick');
            toggleSidebar();
          }}
          className="p-1.5 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-white/10 transition-colors flex items-center justify-center"
          title={isDesktop ? 'Collapse Left Sidebar (⌘B)' : 'Close Sidebar'}
          aria-label="Toggle Sidebar"
        >
          {isDesktop ? <PanelLeftClose className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </button>
      </div>

      {/* 2. Instant Search Input */}
      <div className="p-3 border-b border-gray-100 dark:border-white/5 flex-shrink-0">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'ml'
                ? 'പേജുകൾ അല്ലെങ്കിൽ ടൂളുകൾ തിരയുക...'
                : 'Search pages, manifests...'
            }
            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-gray-100/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* 3. User Session Card */}
      <div className="px-3.5 py-2.5 bg-emerald-50/40 dark:bg-emerald-950/20 border-b border-emerald-500/15 flex-shrink-0">
        {stdata?.tokenNo ? (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                Token #{stdata.tokenNo}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handleLogoutStudent}
                  className="p-1 rounded-md text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  title="Sign Out Token"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {stdata.nameEn || stdata.name || `Student #${stdata.tokenNo}`}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {stdata.batch || 'Active Dining Member'}
              </p>
            </div>
          </div>
        ) : user ? (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge?.badgeClass || ''}`}>
                {roleBadge?.label || 'Staff'}
              </span>
              <button
                type="button"
                onClick={handleLogoutAdmin}
                className="flex items-center gap-1 text-[10px] font-bold text-rose-600 hover:underline"
              >
                <LogOut className="w-3 h-3" />
                <span>{t('navLogout', 'Logout')}</span>
              </button>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                {staffProfile?.displayName || user.email}
              </p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                {staffProfile?.department || roleBadge?.fullLabel}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-1.5">
            <div className="min-w-0">
              <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                {language === 'ml' ? 'ലോഗിൻ ചെയ്യുക' : 'Student / Staff'}
              </p>
              <p className="text-[10px] text-gray-400 truncate">
                {language === 'ml' ? 'ഭക്ഷണ വിവരങ്ങൾ കാണാം' : 'Sign in to manage meals'}
              </p>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                type="button"
                onClick={() => handleNavigate('/login')}
                className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] shadow-xs flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" />
                <span>{t('navLogin', 'Login')}</span>
              </button>

              <button
                type="button"
                onClick={() => handleNavigate('/alogin')}
                className="p-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200"
                title="Committee Staff Login"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 4. Categorized Navigation Groups */}
      <div data-lenis-prevent className="flex-1 overflow-y-auto p-3 space-y-4">
        {searchQuery.trim() !== '' ? (
          /* Search Results */
          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">
              Results ({searchResults.length})
            </p>
            {searchResults.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">
                No matching pages found
              </p>
            ) : (
              searchResults.map((item) => {
                const Icon = item.icon || Sparkles;
                const active = isActive(item.path);
                const label = language === 'ml' ? item.labelMl || item.labelEn : item.labelEn;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className={`w-full flex items-center gap-2.5 p-2 rounded-xl text-left transition-all ${
                      active
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 border border-emerald-300/60 dark:border-emerald-500/30'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100/70 dark:hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <Icon className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                    <span className="text-xs font-bold truncate flex-1 text-gray-900 dark:text-white">
                      {label}
                    </span>
                    <ArrowRight className="w-3 h-3 text-gray-400 flex-shrink-0" />
                  </button>
                );
              })
            )}
          </div>
        ) : (
          /* Categorized Accordion Groups */
          Object.values(groupedItems).map(({ category, items }) => {
            const isCollapsed = Boolean(collapsedCategories[category.id]);
            const categoryLabel = language === 'ml' ? category.labelMl : category.labelEn;

            return (
              <div key={category.id} className="space-y-1">
                {/* Accordion Category Header */}
                <button
                  type="button"
                  onClick={() => toggleCategory(category.id)}
                  className="w-full flex items-center justify-between px-1 py-1 text-left group"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {categoryLabel}
                    </span>
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400">
                      {items.length}
                    </span>
                  </div>
                  <ChevronDown
                    className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${
                      isCollapsed ? '-rotate-90' : ''
                    }`}
                  />
                </button>

                {/* Items in Category */}
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="space-y-0.5"
                    >
                      {items.map((item) => {
                        const Icon = item.icon || Sparkles;
                        const active = isActive(item.path);
                        const label = language === 'ml' ? item.labelMl || item.labelEn : item.labelEn;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => handleItemClick(item)}
                            className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-left transition-all ${
                              active
                                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 border border-emerald-300/60 dark:border-emerald-500/30 font-bold shadow-xs'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100/60 dark:hover:bg-white/5 border border-transparent font-medium'
                            }`}
                          >
                            <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-emerald-600 dark:text-emerald-400' : 'text-emerald-500/80'}`} />
                            <span className="text-xs truncate flex-1">
                              {label}
                            </span>
                            {item.allowedRoles && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                Staff
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* ================= DESKTOP VIEWPORT: DOCKED, FIXED LEFT SIDEBAR ================= */}
      <aside
        aria-label="Desktop Sidebar Navigation"
        className={`hidden lg:block fixed top-0 bottom-0 left-0 z-30 h-screen w-72 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full pointer-events-none shadow-none'
        }`}
      >
        <div className="w-72 h-full">
          {sidebarBody}
        </div>
      </aside>

      {/* When Desktop Sidebar is collapsed: A subtle floating toggle icon on top-left to expand */}
      {!sidebarOpen && (
        <button
          type="button"
          onClick={() => {
            feedback('tick');
            toggleSidebar();
          }}
          className="hidden lg:flex fixed top-4 left-4 z-40 p-2.5 rounded-full bg-white/90 dark:bg-[#0c1412]/90 backdrop-blur-2xl border border-gray-200/80 dark:border-white/10 shadow-xl hover:scale-105 active:scale-95 text-gray-700 dark:text-gray-200 transition-all"
          title="Open Left Sidebar (⌘B)"
          aria-label="Expand Sidebar"
        >
          <PanelLeft className="w-4 h-4 text-emerald-500" />
        </button>
      )}

      {/* ================= MOBILE VIEWPORT: SLIDE-OVER FROM LEFT (WITH TOUCH SCRIM) ================= */}
      <AnimatePresence>
        {!isDesktop && sidebarOpen && (
          <div className="lg:hidden fixed inset-0 z-50 flex justify-start">
            {/* Mobile Backdrop Scrim */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeSidebar}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Mobile Panel: Slides from LEFT */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="relative w-72 max-w-[85vw] h-full shadow-2xl z-10"
            >
              {sidebarBody}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Universal Popups / Modals Triggered from Sidebar (Mounted at root level outside sidebar layout) */}
      <StaffManagementModal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
      />

      <ShareActionModal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
      />

      {/* Canteen & Supply Ops Activity Log Drawer (Admin Only) */}
      <CanteenOpsActivityDrawer
        isOpen={opsLogOpen}
        onClose={() => setOpsLogOpen(false)}
      />
    </>
  );
}
