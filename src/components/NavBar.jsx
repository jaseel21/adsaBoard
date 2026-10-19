import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../store/AuthContext';
import { DataOfOne } from '../store/StudentData';
import { useIdleTimer } from '../utils/useIdleTimer';
import { dialog } from '../utils/dialog';
import firebase from '../firebase/config';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Utensils,
  Coffee,
  ChevronDown,
  LogOut,
  LogIn,
  Menu,
  X,
  FileText,
  Sliders,
  Home,
  ShieldAlert,
  Users,
  KeyRound,
  UtensilsCrossed,
  ExternalLink,
  Eye,
  ShieldCheck,
  CheckCircle2,
  UserCheck,
  Activity,
  HelpCircle,
  ChefHat,
  Layers,
  Printer,
} from 'lucide-react';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import ThemeSwitch from './ThemeSwitch';
import LanguageSwitch from './LanguageSwitch';
import StaffManagementModal from './StaffManagementModal';

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

  // Public Computer Committee Idle Protection: Auto-logout admin after 15 mins of inactivity
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

  // Shared Campus Computer Kiosk Protection: Auto-logout student after 2.5 mins of inactivity
  useIdleTimer({
    timeoutMs: 150000,
    warningMs: 25000,
    onTimeout: () => {
      if (stdata) {
        if (logoutStudent) logoutStudent();
        feedback('warning');
        dialog.toast.info(
          t('sessionExpired', 'Session Expired'),
          t('sessionExpiredStudent', 'Student session signed out automatically to protect public campus terminals.')
        );
        if (location.pathname === '/student-portal') {
          navigate('/');
        }
      }
    },
    enabled: Boolean(stdata && !user),
  });

  const [email, setEmail] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supplyDropdownOpen, setSupplyDropdownOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);
  const [staffModalOpen, setStaffModalOpen] = useState(false);

  const supplyDropdownRef = useRef(null);
  const adminDropdownRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    if (user && user.email) {
      setEmail(user.email);
    } else if (user && user.bc && user.bc.email) {
      setEmail(user.bc.email);
    } else {
      setEmail('');
    }
  }, [user]);

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (supplyDropdownRef.current && !supplyDropdownRef.current.contains(event.target)) {
        setSupplyDropdownOpen(false);
      }
      if (adminDropdownRef.current && !adminDropdownRef.current.contains(event.target)) {
        setAdminDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNav = (path) => {
    feedback('tick');
    navigate(path);
    setMobileMenuOpen(false);
    setSupplyDropdownOpen(false);
    setAdminDropdownOpen(false);
  };

  const handleLogout = async () => {
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

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 w-full bg-white/85 dark:bg-[#080d0b]/90 backdrop-blur-2xl border-b border-gray-200/80 dark:border-white/10 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-2.5 xs:px-3.5 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Name */}
          <div
            onClick={() => handleNav('/')}
            className="flex items-center gap-2 xs:gap-2.5 sm:gap-3 cursor-pointer group select-none flex-shrink-0 min-w-0"
            title="Go to Home Page (/)"
          >
            <div className="relative flex-shrink-0">
              <div className="w-8 h-8 xs:w-9 xs:h-9 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl p-0.5 sm:p-1 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/60 dark:to-emerald-900/30 border border-emerald-300/60 dark:border-emerald-500/20 shadow-sm group-hover:scale-105 group-hover:shadow-glow-emerald transition-all duration-300 flex items-center justify-center">
                <img
                  src="https://alathurpadiDars.in/wp-content/uploads/2019/08/Dars-Site-Logo1.png"
                  onError={(e) => {
                    // Fallback in case remote image is blocked
                    e.currentTarget.style.display = 'none';
                  }}
                  alt="Alathurpadi Dars Logo"
                  className="w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 object-contain"
                />
              </div>
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 xs:gap-1.5 flex-nowrap">
                <span className="font-black text-base xs:text-lg sm:text-2xl tracking-tight text-emerald-600 dark:text-emerald-400">
                  ADSA
                </span>
                <span className="font-extrabold text-base xs:text-lg sm:text-2xl tracking-tight text-gray-800 dark:text-white">
                  T-Board
                </span>
                {isAdmin && (
                  <span className="ml-1 px-1.5 xs:px-2 py-0.5 rounded-full text-[9px] xs:text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                    Admin
                  </span>
                )}
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 dark:text-gray-400 -mt-0.5 hidden sm:block">
                {isAdmin ? t('committeeCommandConsole', 'Committee Command Console') : t('appSubtitle')}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-1.5">
            {/* If ADMIN View */}
            {isAdmin ? (
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-gray-100/70 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
                {/* Home Page Button */}
                <button
                  onClick={() => handleNav('/')}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/60 dark:hover:bg-white/5 transition-all duration-200"
                  title="Go to Home Page (/)"
                >
                  <Home className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('navHome') || 'Home'}</span>
                </button>

                {/* Master Board (Central Committee & Devs) */}
                {isCentralCommittee && (
                  <button
                    onClick={() => handleNav('/admin')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      location.pathname === '/admin' || location.pathname === '/alogin'
                        ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-emerald-950/60 shadow-sm border border-emerald-500/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t('masterBoard', 'Master Board')}</span>
                  </button>
                )}

                {/* Students Management Console (Central Committee & Devs) */}
                {isCentralCommittee && (
                  <button
                    onClick={() => handleNav('/student-management')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive('/student-management')
                        ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-emerald-950/60 shadow-sm border border-emerald-500/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <Users className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t('studentsConsole', 'Students')}</span>
                  </button>
                )}

                {/* Canteen Menu Console (Canteen Sub-Committee, Central, Devs) */}
                {isCanteenCommittee && (
                  <button
                    onClick={() => handleNav('/admin/menu')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive('/admin/menu') || isActive('/menu-management')
                        ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-emerald-950/60 shadow-sm border border-emerald-500/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t('canteenMenuConsole', 'Menu')}</span>
                  </button>
                )}

                {/* Dietary Management Console (Canteen Sub-Committee, Central, Devs) */}
                {isCanteenCommittee && (
                  <button
                    onClick={() => handleNav('/admin/dietary')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive('/admin/dietary') || isActive('/dietary-management') || isActive('/admin/avoiders')
                        ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-emerald-950/60 shadow-sm border border-emerald-500/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t('dietaryAvoidersConsole', 'Dietary')}</span>
                  </button>
                )}

                {/* Dedicated Kitchen Display Console (Cooks, Canteen Sub-Committee, Central, Devs) */}
                <button
                  onClick={() => handleNav('/kitchen')}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                    isActive('/kitchen')
                      ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-emerald-950/60 shadow-sm border border-emerald-500/20'
                      : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/50 dark:hover:bg-white/5'
                  }`}
                  title="Kitchen Preparation & Live Headcounts"
                >
                  <ChefHat className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{t('kitchen', 'Kitchen')}</span>
                </button>

                {/* Audit Trail & Activity Console (Central Committee & Devs) */}
                {isCentralCommittee && (
                  <button
                    onClick={() => handleNav('/admin/audit-logs')}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive('/admin/audit-logs') || isActive('/admin/audit')
                        ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-emerald-950/60 shadow-sm border border-emerald-500/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/50 dark:hover:bg-white/5'
                    }`}
                    title="Audit Trail & System Logs"
                  >
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t('auditTrailLogs', 'Audit Log')}</span>
                  </button>
                )}

                {/* Supply Dropdown */}
                <div className="relative" ref={supplyDropdownRef}>
                  <button
                    onClick={() => {
                      feedback('tick');
                      setSupplyDropdownOpen(!supplyDropdownOpen);
                    }}
                    className={`flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${
                      isActive('/lunch') || isActive('/breakfast')
                        ? 'text-emerald-600 dark:text-emerald-400 bg-white dark:bg-emerald-950/60 shadow-sm border border-emerald-500/20'
                        : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/50 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{t('navSupply', 'Supply')}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        supplyDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {supplyDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#131b18] border border-gray-200/80 dark:border-white/10 shadow-2xl py-1.5 z-50 backdrop-blur-xl"
                      >
                        <button
                          onClick={() => handleNav('/lunch')}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          <Utensils className="w-4 h-4 text-emerald-500" />
                          <span>{t('navLunch')}</span>
                        </button>
                        <button
                          onClick={() => handleNav('/breakfast')}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-amber-50 dark:hover:bg-amber-950/40 hover:text-amber-600 dark:hover:text-amber-400 transition-colors"
                        >
                          <Coffee className="w-4 h-4 text-amber-500" />
                          <span>{t('navBreakfast')}</span>
                        </button>
                        <div className="h-px bg-gray-100 dark:bg-white/10 my-1" />
                        <button
                          onClick={() => handleNav('/menu')}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
                          <span>{t('canteenMenuDisplay', 'Canteen Food Menu')}</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              /* If PUBLIC View */
              <>
                <button
                  onClick={() => handleNav('/')}
                  className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    location.pathname === '/'
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
                      : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100/60 dark:hover:bg-white/5'
                  }`}
                >
                  {t('navHome')}
                </button>

                {/* Authenticated Token Board link (visible if student or staff is logged in) */}
                {(stdata?.tokenNo || user) && (
                  <button
                    onClick={() => handleNav('/board')}
                    className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                      isActive('/board')
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
                        : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100/60 dark:hover:bg-white/5'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t('tokenBoard', 'Token Board')}</span>
                  </button>
                )}

                {/* Supply & Kitchen Documents Dropdown */}
                <div className="relative" ref={supplyDropdownRef}>
                  <button
                    onClick={() => {
                      feedback('tick');
                      setSupplyDropdownOpen(!supplyDropdownOpen);
                    }}
                    className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                      isActive('/lunch') || isActive('/breakfast') || isActive('/list')
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
                        : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100/60 dark:hover:bg-white/5'
                    }`}
                  >
                    <span>{t('navSupply', 'Kitchen Documents')}</span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 transition-transform duration-200 ${
                        supplyDropdownOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {supplyDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute left-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#131b18] border border-gray-200/80 dark:border-white/10 shadow-xl py-1.5 z-50 backdrop-blur-xl"
                      >
                        <button
                          onClick={() => handleNav('/lunch')}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          <Printer className="w-4 h-4 text-emerald-500" />
                          <span>Supply Manifest (Breakfast + Lunch)</span>
                        </button>
                        <div className="h-px bg-gray-100 dark:bg-white/10 my-1" />
                        <button
                          onClick={() => handleNav('/list')}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          <FileText className="w-4 h-4 text-rose-500" />
                          <span>Dietary Avoiders Matrix</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Authenticated Food Menu link (visible if student or staff is logged in) */}
                {(stdata?.tokenNo || user) && (
                  <button
                    onClick={() => handleNav('/menu')}
                    className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                      isActive('/menu')
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
                        : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100/60 dark:hover:bg-white/5'
                    }`}
                  >
                    <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t('navMenu') || 'Food Menu'}</span>
                  </button>
                )}

                {/* Direct Student Portal Key CTA Button or Active Session Pill */}
                {stdata && stdata.tokenNo ? (
                  <div className="flex items-center gap-1 p-1 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-500/30 ml-2">
                    <button
                      onClick={() => handleNav('/student-portal')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:underline"
                      title="Open Student Dining Portal"
                    >
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Token #{stdata.tokenNo}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        feedback('tick');
                        if (logoutStudent) logoutStudent();
                        navigate('/');
                      }}
                      className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="Log out of student account (Important for public computers)"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => handleNav('/login')}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-bold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 ml-2"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{t('navStudentPortal') || 'Student Portal'}</span>
                  </button>
                )}

                {/* Staff Console shortcut if staff is logged in while viewing public pages */}
                {user && !isAdmin && (
                  <button
                    onClick={() => handleNav(homeRoute || '/admin')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all ml-1"
                    title="Open Designated Staff Console"
                  >
                    {isCook ? (
                      <ChefHat className="w-3.5 h-3.5 text-emerald-500" />
                    ) : isCanteenCommittee && !isCentralCommittee ? (
                      <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Sliders className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                    <span>
                      {isCook
                        ? t('kitchenPortal', 'Kitchen Portal')
                        : isCanteenCommittee && !isCentralCommittee
                        ? t('canteenMenuConsole', 'Canteen Console')
                        : t('adminConsole', 'Admin Console')}
                    </span>
                  </button>
                )}
              </>
            )}

            {/* Admin Profile / Auth Pill (for Admin mode or when committee user is logged in) */}
            {(isAdmin || user) && (
              <div className="relative ml-2" ref={adminDropdownRef}>
                <button
                  onClick={() => {
                    feedback('tick');
                    setAdminDropdownOpen(!adminDropdownOpen);
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition-all"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="max-w-[130px] truncate">{roleBadge?.label || (user ? 'Staff' : 'Sign In')}</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform ${adminDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {adminDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-[#131b18] border border-gray-200/80 dark:border-white/10 shadow-2xl py-2 z-50 backdrop-blur-xl"
                    >
                      {user && (
                        <div className="px-3.5 py-2.5 border-b border-gray-100 dark:border-white/10 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('staffRole', 'Staff Role')}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${roleBadge?.badgeClass || ''}`}>
                              {roleBadge?.label}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-gray-800 dark:text-gray-200 truncate">
                            {staffProfile?.displayName || email || 'Staff User'}
                          </p>
                          <p className="text-[10px] text-gray-400 truncate">
                            {staffProfile?.department || email}
                          </p>
                        </div>
                      )}

                      {/* Go to Primary Role Console */}
                      {user && (
                        <button
                          onClick={() => handleNav(homeRoute || '/')}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          <Sliders className="w-4 h-4 text-emerald-500" />
                          <span>{t('myPrimaryConsole', 'My Primary Console')}</span>
                        </button>
                      )}

                      {/* Go to Public Home Page */}
                      <button
                        onClick={() => handleNav('/')}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Home className="w-4 h-4 text-emerald-500" />
                        <span>{t('homePagePublic', 'Home Page (Landing)')}</span>
                      </button>

                      {/* Go to Token Board */}
                      <button
                        onClick={() => handleNav('/board')}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Layers className="w-4 h-4 text-emerald-500" />
                        <span>{t('tokenBoard', 'Token Board')}</span>
                      </button>

                      {/* Kitchen Display Link (All staff) */}
                      <button
                        onClick={() => handleNav('/kitchen')}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <ChefHat className="w-4 h-4 text-emerald-500" />
                        <span>{t('kitchenDisplaySystem', 'Kitchen Display System')}</span>
                      </button>

                      {/* Menu & Dietary (Canteen Sub-Committee, Central, Devs) */}
                      {isCanteenCommittee && (
                        <>
                          <button
                            onClick={() => handleNav('/admin/menu')}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
                            <span>{t('canteenMenuConsole', 'Canteen Menu Console')}</span>
                          </button>

                          <button
                            onClick={() => handleNav('/admin/dietary')}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
                            <span>{t('dietaryAvoidersConsole', 'Dietary & Avoiders')}</span>
                          </button>
                        </>
                      )}

                      {/* Master Board & Students (Central Committee & Devs only) */}
                      {isCentralCommittee && (
                        <>
                          <button
                            onClick={() => handleNav('/admin')}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            <Sliders className="w-4 h-4 text-emerald-500" />
                            <span>{t('masterBoard', 'Master Token Board')}</span>
                          </button>

                          <button
                            onClick={() => handleNav('/student-management')}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            <Users className="w-4 h-4 text-emerald-500" />
                            <span>{t('studentsConsole', 'Students Console')}</span>
                          </button>

                          <button
                            onClick={() => handleNav('/admin/audit-logs')}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            <Activity className="w-4 h-4 text-emerald-500" />
                            <span>{t('auditTrailLogs', 'Audit Trail Logs')}</span>
                          </button>

                          <button
                            onClick={() => {
                              feedback('tick');
                              setStaffModalOpen(true);
                              setAdminDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            <ShieldCheck className="w-4 h-4 text-emerald-500" />
                            <span>{t('staffRolesAccess', 'Staff Roles & Access')}</span>
                          </button>
                        </>
                      )}

                      <div className="h-px bg-gray-100 dark:bg-white/10 my-1" />

                      {user ? (
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t('navLogout') || 'Log Out'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleNav('/alogin')}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>{t('navLogin') || 'Sign In'}</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>

          {/* Right Action Island: Language + Theme Switches + Guide Button + Mobile Hamburger */}
          <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 flex-shrink-0">
            {/* Quick Guide Trigger Icon Button */}
            <button
              onClick={() => {
                feedback('tick');
                navigate('/guide');
              }}
              className="p-2 sm:px-2.5 sm:py-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 border border-gray-200/70 dark:border-white/10 transition-all flex items-center gap-1.5 active:scale-95 text-xs font-bold"
              title="Token Board Guide (/guide or press '?')"
            >
              <HelpCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="hidden xl:inline">{t('tokenBoardGuide') || 'Guide'}</span>
            </button>

            <LanguageSwitch />
            <ThemeSwitch />

            {/* Mobile hamburger button */}
            <div className="flex md:hidden">
              <button
                onClick={() => {
                  feedback('pop');
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="p-2 xs:p-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200/70 dark:border-white/10 transition-colors flex items-center justify-center min-w-[38px] min-h-[38px] active:scale-95"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-4 h-4 xs:w-5 xs:h-5 text-emerald-500" /> : <Menu className="w-4 h-4 xs:w-5 xs:h-5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-y-auto max-h-[calc(100dvh-4rem)] border-t border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0b1210]/95 backdrop-blur-2xl shadow-2xl pb-safe"
          >
            <div className="px-3.5 xs:px-4 py-4 space-y-2">
              {isAdmin ? (
                <>
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 mb-2">
                    <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      {t('committeeAdminPanel', 'Committee Admin Panel')}
                    </p>
                  </div>

                  {/* Public Home Page Link */}
                  <button
                    onClick={() => handleNav('/')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                  >
                    <Home className="w-4 h-4 text-emerald-500" />
                    <span>{t('homePagePublic', 'Home Page (Public)')}</span>
                  </button>

                  {/* Kitchen Display Link (All staff) */}
                  <button
                    onClick={() => handleNav('/kitchen')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold ${
                      isActive('/kitchen')
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <ChefHat className="w-4 h-4 text-emerald-500" />
                    <span>{t('kitchenDisplaySystem', 'Kitchen Display System')}</span>
                  </button>

                  {/* Master Token Board (Central Committee & Devs) */}
                  {isCentralCommittee && (
                    <button
                      onClick={() => handleNav('/admin')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold ${
                        isActive('/admin')
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <Sliders className="w-4 h-4 text-emerald-500" />
                      <span>{t('masterBoard', 'Master Token Board')}</span>
                    </button>
                  )}

                  {/* Student Management (Central Committee & Devs) */}
                  {isCentralCommittee && (
                    <button
                      onClick={() => handleNav('/student-management')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold ${
                        isActive('/student-management')
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <Users className="w-4 h-4 text-emerald-500" />
                      <span>{t('studentsConsole', 'Students Console')}</span>
                    </button>
                  )}

                  {/* Canteen Menu (Canteen Sub-Committee, Central, Devs) */}
                  {isCanteenCommittee && (
                    <button
                      onClick={() => handleNav('/admin/menu')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold ${
                        isActive('/admin/menu') || isActive('/menu-management')
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
                      <span>{t('canteenMenuConsole', 'Canteen Menu Console')}</span>
                    </button>
                  )}

                  {/* Dietary & Avoiders (Canteen Sub-Committee, Central, Devs) */}
                  {isCanteenCommittee && (
                    <button
                      onClick={() => handleNav('/admin/dietary')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold ${
                        isActive('/admin/dietary') || isActive('/dietary-management') || isActive('/admin/avoiders')
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
                      <span>{t('dietaryAvoidersConsole', 'Dietary & Avoiders')}</span>
                    </button>
                  )}

                  {/* Audit Logs (Central Committee & Devs) */}
                  {isCentralCommittee && (
                    <button
                      onClick={() => handleNav('/admin/audit-logs')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold ${
                        isActive('/admin/audit-logs') || isActive('/admin/audit')
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <Activity className="w-4 h-4 text-emerald-500" />
                      <span>{t('auditTrailLogs', 'Audit Log & Radar')}</span>
                    </button>
                  )}

                  {/* Supply Quick Button */}
                  <button
                    onClick={() => handleNav('/lunch')}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/20 active:scale-95"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Supply Manifest (Breakfast + Lunch - 1 Page)</span>
                  </button>

                  <button
                    onClick={() => handleNav('/')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-200/60 dark:border-emerald-500/20 mt-1"
                  >
                    <Home className="w-3.5 h-3.5" />
                    <span>{t('homePagePublic', 'Go to Home Page (Public)')}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleNav('/')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold ${
                      location.pathname === '/'
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <Home className="w-4 h-4 text-emerald-500" />
                    <span>{t('navHome')}</span>
                  </button>

                  {/* Authenticated Token Board link */}
                  {(stdata?.tokenNo || user) && (
                    <button
                      onClick={() => handleNav('/board')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold ${
                        isActive('/board')
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <Layers className="w-4 h-4 text-emerald-500" />
                      <span>{t('tokenBoard', 'Token Board')}</span>
                    </button>
                  )}

                  {/* Authenticated Food Menu link */}
                  {(stdata?.tokenNo || user) && (
                    <button
                      onClick={() => handleNav('/menu')}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold ${
                        isActive('/menu')
                          ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                      }`}
                    >
                      <UtensilsCrossed className="w-4 h-4 text-emerald-500" />
                      <span>{t('navMenu') || 'Food Menu'}</span>
                    </button>
                  )}

                  {stdata && stdata.tokenNo ? (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300/60 dark:border-emerald-500/30">
                      <button
                        onClick={() => handleNav('/student-portal')}
                        className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300"
                      >
                        <UserCheck className="w-4 h-4 text-emerald-600" />
                        <span>Token #{stdata.tokenNo} {t('tokenPortal', 'Portal')}</span>
                      </button>
                      <button
                        onClick={() => {
                          feedback('tick');
                          if (logoutStudent) logoutStudent();
                          navigate('/');
                          setMobileMenuOpen(false);
                        }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-bold"
                      >
                        <LogOut className="w-3 h-3" />
                        <span>{t('exit', 'Exit')}</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleNav('/login')}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-green-600 shadow-md shadow-emerald-500/20"
                    >
                      <KeyRound className="w-4 h-4" />
                      <span>{t('navStudentPortal') || 'Student Portal'}</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleNav('/list')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold ${
                      isActive('/list')
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <FileText className="w-4 h-4 text-emerald-500" />
                    <span>{t('navList')}</span>
                  </button>

                  <button
                    onClick={() => handleNav('/guide')}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold ${
                      isActive('/guide')
                        ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <HelpCircle className="w-4 h-4 text-emerald-500" />
                    <span>{t('tokenBoardGuide') || 'Token Board Guide'}</span>
                  </button>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => handleNav('/lunch')}
                      className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/20 active:scale-95"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Supply Manifest</span>
                    </button>

                    <button
                      onClick={() => handleNav('/list')}
                      className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-bold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/50 dark:border-rose-500/20 active:scale-95"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>{t('navList') || 'Dietary Matrix'}</span>
                    </button>
                  </div>

                  <div className="h-px bg-gray-100 dark:bg-white/10 my-2" />

                  <button
                    onClick={() => handleNav(user ? '/admin' : '/alogin')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>{user ? t('adminConsole', 'Admin Console') : t('committeeLogin', 'Committee Login')}</span>
                  </button>
                </>
              )}

              {/* Logout button if logged in */}
              {user && (
                <div className="pt-2 border-t border-gray-100 dark:border-white/10">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('navLogout') || 'Log Out'}</span>
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Staff Roles & Delegation Modal */}
      <StaffManagementModal
        isOpen={staffModalOpen}
        onClose={() => setStaffModalOpen(false)}
      />
    </header>
  );
};

export default Navbar;