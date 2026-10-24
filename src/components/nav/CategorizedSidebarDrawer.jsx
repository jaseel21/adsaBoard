import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Search,
  ChevronDown,
  ChevronRight,
  LogOut,
  KeyRound,
  ShieldCheck,
  ExternalLink,
  Sparkles,
  Lock,
  ArrowRight,
  Settings,
} from 'lucide-react';
import {
  NAV_CATEGORIES,
  getGroupedNavItems,
  searchNavItems,
} from './navigationConfig';
import { useLanguage } from '../../store/LanguageContext';
import { useFeedback } from '../../utils/useFeedback';
import ThemeSwitch from '../ThemeSwitch';
import LanguageSwitch from '../LanguageSwitch';
import BlockManagementModal from '../admin/BlockManagementModal';

export default function CategorizedSidebarDrawer({
  isOpen,
  onClose,
  user,
  userRole,
  roleBadge,
  staffProfile,
  stdata,
  isCook,
  isCanteenCommittee,
  isCentralCommittee,
  isDeveloper,
  onOpenStaffModal,
  onOpenShareModal,
  onLogoutAdmin,
  onLogoutStudent,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { feedback } = useFeedback();

  const [searchQuery, setSearchQuery] = useState('');
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [blockModalOpen, setBlockModalOpen] = useState(false);

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
    onClose();
  };

  const handleItemClick = (item) => {
    if (item.isModalAction) {
      if (item.action === 'open_staff_modal') {
        onOpenStaffModal();
      } else if (item.action === 'open_share_modal') {
        onOpenShareModal();
      } else if (item.action === 'open_block_modal') {
        setBlockModalOpen(true);
      }
      onClose();
      return;
    }

    if (item.path) {
      handleNavigate(item.path);
    }
  };

  const isStudent = Boolean(stdata?.tokenNo);

  // Grouped items
  const groupedItems = useMemo(
    () => getGroupedNavItems(userRole, isStudent),
    [userRole, isStudent]
  );

  // Search filtered items
  const searchResults = useMemo(
    () => searchNavItems(searchQuery, userRole, isStudent),
    [searchQuery, userRole, isStudent]
  );

  const isActive = (path) => {
    if (!path) return false;
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex justify-end">
        {/* Backdrop Scrim */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm"
        />

        {/* Slide-over Drawer Panel */}
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          className="relative w-full max-w-md h-full bg-white dark:bg-[#0a120f] border-l border-gray-200/80 dark:border-white/10 shadow-2xl flex flex-col z-10 overflow-hidden"
        >
          {/* Top Drawer Header */}
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-white/10 flex items-center justify-between gap-3 bg-gray-50/60 dark:bg-white/5">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl p-0.5 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/60 dark:to-emerald-900/30 border border-emerald-300/60 dark:border-emerald-500/20 shadow-sm flex items-center justify-center flex-shrink-0">
                <img
                  src="https://alathurpadiDars.in/wp-content/uploads/2019/08/Dars-Site-Logo1.png"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                  alt="Alathurpadi Dars Crest"
                  className="w-7 h-7 object-contain"
                />
              </div>

              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base tracking-tight text-emerald-600 dark:text-emerald-400">
                    ADSA
                  </span>
                  <span className="font-extrabold text-base tracking-tight text-gray-800 dark:text-white">
                    T-Board
                  </span>
                </div>
                <span className="text-[10px] text-gray-400 font-medium truncate">
                  {language === 'ml' ? 'സമഗ്ര കാമ്പസ് നാവിഗേഷൻ' : 'Campus Navigation System'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                feedback('tick');
                onClose();
              }}
              className="p-2 rounded-xl text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-200/60 dark:hover:bg-white/10 transition-colors"
              aria-label="Close menu drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Real-time Search Input inside Drawer */}
          <div className="p-3 sm:p-4 border-b border-gray-100 dark:border-white/5">
            <div className="relative">
              <Search className="w-4 h-4 text-emerald-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  language === 'ml'
                    ? 'പേജുകൾ അല്ലെങ്കിൽ ടൂളുകൾ തിരയുക...'
                    : 'Search pages, manifests, tools...'
                }
                className="w-full pl-9 pr-8 py-2 rounded-xl bg-gray-100/80 dark:bg-white/5 border border-gray-200/60 dark:border-white/10 text-xs font-semibold text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500 transition-colors"
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

          {/* Active Session Card */}
          <div className="px-4 py-3 bg-emerald-50/40 dark:bg-emerald-950/20 border-b border-emerald-500/15">
            {stdata?.tokenNo ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                      Active Student Session
                    </span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                    Token #{stdata.tokenNo}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                      {stdata.nameEn || stdata.name || `Student #${stdata.tokenNo}`}
                    </p>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      {stdata.batch || 'Active Dining Member'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        feedback('tick');
                        onLogoutStudent();
                        onClose();
                      }}
                      className="p-1 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Sign Out Token"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : user ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge?.badgeClass || ''}`}>
                    {roleBadge?.label || 'Staff'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      feedback('tick');
                      onLogoutAdmin();
                      onClose();
                    }}
                    className="flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:underline"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>{t('navLogout', 'Logout')}</span>
                  </button>
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-900 dark:text-white">
                    {staffProfile?.displayName || user.email}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">
                    {staffProfile?.department || roleBadge?.fullLabel}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-800 dark:text-gray-200">
                    {language === 'ml' ? 'ലോഗിൻ ചെയ്തിട്ടില്ല' : 'Public Visitor Mode'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {language === 'ml' ? 'ഭക്ഷണ വിവരങ്ങൾ ലഭ്യമാണ്' : 'Access dining rosters or sign in'}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleNavigate('/login')}
                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] shadow-sm flex items-center gap-1"
                  >
                    <KeyRound className="w-3 h-3" />
                    <span>{t('navLogin', 'Login')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavigate('/alogin')}
                    className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-white/10 dark:hover:bg-white/20 text-gray-700 dark:text-gray-200 font-bold text-[11px]"
                    title="Committee Staff Login"
                  >
                    <ShieldCheck className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Scrollable Navigation Categories */}
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {searchQuery.trim() !== '' ? (
              /* Search Results View */
              <div className="space-y-1.5">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-1">
                  Search Results ({searchResults.length})
                </p>
                {searchResults.length === 0 ? (
                  <p className="text-xs text-gray-400 py-6 text-center">
                    No matching pages found for &ldquo;{searchQuery}&rdquo;
                  </p>
                ) : (
                  searchResults.map((item) => {
                    const Icon = item.icon || Sparkles;
                    const active = isActive(item.path);
                    const label = language === 'ml' ? item.labelMl || item.labelEn : item.labelEn;
                    const desc = language === 'ml' ? item.descriptionMl || item.descriptionEn : item.descriptionEn;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleItemClick(item)}
                        className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                          active
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-900 dark:text-emerald-100 border border-emerald-300/60 dark:border-emerald-500/30'
                            : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent'
                        }`}
                      >
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            active
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate text-gray-900 dark:text-white">
                            {label}
                          </p>
                          <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate">
                            {desc}
                          </p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      </button>
                    );
                  })
                )}
              </div>
            ) : (
              /* Grouped Categorized View */
              Object.values(groupedItems).map(({ category, items }) => {
                const isCollapsed = Boolean(collapsedCategories[category.id]);
                const categoryLabel = language === 'ml' ? category.labelMl : category.labelEn;

                return (
                  <div key={category.id} className="space-y-1.5">
                    {/* Category Accordion Header */}
                    <button
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between px-1 py-1 text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-black uppercase tracking-wider text-gray-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
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

                    {/* Category Items List */}
                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.18 }}
                          className="space-y-1"
                        >
                          {items.map((item) => {
                            const Icon = item.icon || Sparkles;
                            const active = isActive(item.path);
                            const label = language === 'ml' ? item.labelMl || item.labelEn : item.labelEn;
                            const desc = language === 'ml' ? item.descriptionMl || item.descriptionEn : item.descriptionEn;

                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={() => handleItemClick(item)}
                                className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all group ${
                                  active
                                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 border border-emerald-300/60 dark:border-emerald-500/30 shadow-sm'
                                    : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent'
                                }`}
                              >
                                <div
                                  className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                                    active
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 group-hover:text-emerald-600'
                                  }`}
                                >
                                  <Icon className="w-4 h-4" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-bold truncate text-gray-900 dark:text-white">
                                      {label}
                                    </span>
                                    {item.allowedRoles && (
                                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
                                        Staff
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                    {desc}
                                  </p>
                                </div>
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

          {/* Bottom Utility Bar */}
          <div className="p-3 sm:p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-black/30 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <LanguageSwitch />
              <ThemeSwitch />
              <button
                type="button"
                onClick={() => handleNavigate('/settings')}
                className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-200/60 dark:hover:bg-white/10 border border-gray-200/60 dark:border-white/10 active:scale-95 transition-colors flex items-center justify-center cursor-pointer"
                title={language === 'ml' ? 'ക്രമീകരണങ്ങൾ' : 'Settings & Preferences'}
                aria-label="Settings"
              >
                <Settings className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                feedback('pop');
                onOpenShareModal();
                onClose();
              }}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 border border-gray-200/80 dark:border-white/10 text-xs font-bold text-gray-700 dark:text-gray-200 transition-colors"
            >
              Share Link
            </button>
          </div>
        </motion.div>
      </div>

      {/* Block & Fine Management Radar Modal */}
      <BlockManagementModal
        isOpen={blockModalOpen}
        onClose={() => setBlockModalOpen(false)}
      />
    </AnimatePresence>
  );
}
