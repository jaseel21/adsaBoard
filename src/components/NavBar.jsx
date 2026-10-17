import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../store/AuthContext';
import Swal from 'sweetalert2';
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
  UserPlus,
  Sliders,
  Home,
  ShieldAlert,
  Users,
  KeyRound,
  UtensilsCrossed,
} from 'lucide-react';
import { useLanguage } from '../store/LanguageContext';
import { useFeedback } from '../utils/useFeedback';
import ThemeSwitch from './ThemeSwitch';
import LanguageSwitch from './LanguageSwitch';

const Navbar = ({ isAdmin }) => {
  const { user } = useContext(AuthContext);
  const { t } = useLanguage();
  const { feedback } = useFeedback();
  const location = useLocation();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [supplyDropdownOpen, setSupplyDropdownOpen] = useState(false);
  const [adminDropdownOpen, setAdminDropdownOpen] = useState(false);

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

  const handleLogout = () => {
    feedback('warning');
    Swal.fire({
      title: t('navLogout'),
      text: 'Are you sure you want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#10b981',
      confirmButtonText: t('navLogout'),
      cancelButtonText: t('cancel'),
    }).then((result) => {
      if (result.isConfirmed) {
        firebase.auth().signOut();
        feedback('pop');
        navigate('/alogin');
      }
    });
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 w-full bg-white/80 dark:bg-[#080d0b]/85 backdrop-blur-xl border-b border-gray-200/80 dark:border-white/10 transition-colors duration-300"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Brand Logo & Name */}
          <div
            onClick={() => handleNav(isAdmin ? '/admin' : '/')}
            className="flex items-center gap-2.5 sm:gap-3 cursor-pointer group select-none"
          >
            <div className="relative">
              <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-2xl p-1 bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/60 dark:to-emerald-900/30 border border-emerald-300/60 dark:border-emerald-500/20 shadow-sm group-hover:scale-105 group-hover:shadow-glow-emerald transition-all duration-300 flex items-center justify-center">
                <img
                  src="https://alathurpadidars.in/wp-content/uploads/2019/08/Dars-Site-Logo1.png"
                  alt="Alathurpadi Dars Logo"
                  className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
                />
              </div>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <span className="font-extrabold text-lg sm:text-2xl tracking-tight text-emerald-600 dark:text-emerald-400">
                  ADSA
                </span>
                <span className="font-bold text-lg sm:text-2xl tracking-tight text-gray-800 dark:text-white">
                  T-Board
                </span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-medium text-gray-500 dark:text-gray-400 -mt-0.5 hidden sm:block">
                {t('appSubtitle')}
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            <button
              onClick={() => handleNav(isAdmin ? '/admin' : '/')}
              className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive('/') || isActive('/admin')
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
                  : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100/60 dark:hover:bg-white/5'
              }`}
            >
              {isAdmin ? t('navAdmin') : t('navHome')}
            </button>

            <button
              onClick={() => handleNav('/list')}
              className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive('/list')
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
                  : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100/60 dark:hover:bg-white/5'
              }`}
            >
              {t('navList')}
            </button>

            <button
              onClick={() => handleNav('/menu')}
              className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive('/menu')
                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
                  : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100/60 dark:hover:bg-white/5'
              }`}
            >
              {t('navMenu') || 'Menu'}
            </button>

            {/* Supply Dropdown */}
            <div className="relative" ref={supplyDropdownRef}>
              <button
                onClick={() => {
                  feedback('tick');
                  setSupplyDropdownOpen(!supplyDropdownOpen);
                }}
                className={`relative px-3.5 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 transition-all duration-200 ${
                  isActive('/lunch') || isActive('/breakfast')
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
                    : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-100/60 dark:hover:bg-white/5'
                }`}
              >
                <span>{t('navSupply')}</span>
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
                    className="absolute left-0 mt-2 w-48 rounded-2xl bg-white dark:bg-[#131b18] border border-gray-200/80 dark:border-white/10 shadow-xl py-1.5 z-50 backdrop-blur-xl"
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
                      <span>{t('navMenu') || 'Weekly Menu'}</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Non-Admin Direct Student Portal Link */}
            {!isAdmin && (
              <button
                onClick={() => handleNav('/login')}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all active:scale-95 ml-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>{t('navStudentPortal') || 'Student Portal'}</span>
              </button>
            )}

            {/* Admin specific links */}
            {isAdmin && (
              <>
                <button
                  onClick={() => handleNav('/student-management')}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive('/student-management')
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
                      : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:bg-gray-100/60 dark:hover:bg-white/5'
                  }`}
                >
                  <Users className="w-4 h-4 text-emerald-500" />
                  <span>{t('navStudentMgmt') || 'Students'}</span>
                </button>

                <button
                  onClick={() => handleNav('/admin/menu')}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1.5 ${
                    isActive('/admin/menu') || isActive('/menu-management')
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
                      : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:bg-gray-100/60 dark:hover:bg-white/5'
                  }`}
                >
                  <Utensils className="w-4 h-4 text-emerald-500" />
                  <span>{t('navMenuMgmt') || 'Menu'}</span>
                </button>

                <button
                  onClick={() => handleNav('/add-students')}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive('/add-students')
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
                      : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:bg-gray-100/60 dark:hover:bg-white/5'
                  }`}
                >
                  {t('navAddStudent')}
                </button>

                <button
                  onClick={() => handleNav('/m-tokens')}
                  className={`px-3 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive('/m-tokens')
                      ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/80 dark:bg-emerald-950/40'
                      : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:bg-gray-100/60 dark:hover:bg-white/5'
                  }`}
                >
                  {t('navManageTokens')}
                </button>
              </>
            )}

            {/* Admin Login/Profile Button */}
            {isAdmin && (
              <div className="relative" ref={adminDropdownRef}>
                <button
                  onClick={() => {
                    feedback('tick');
                    setAdminDropdownOpen(!adminDropdownOpen);
                  }}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white font-semibold text-xs shadow-md transition-all"
                >
                  <span>{user ? 'ADSA Committee' : t('navLogin')}</span>
                  <ChevronDown className={`w-3.5 h-3.5 ${adminDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {adminDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -6, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-52 rounded-2xl bg-white dark:bg-[#131b18] border border-gray-200/80 dark:border-white/10 shadow-xl py-1.5 z-50 backdrop-blur-xl"
                    >
                      <button
                        onClick={() => handleNav('/student-management')}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Users className="w-4 h-4 text-emerald-500" />
                        <span>{t('navStudentMgmt') || 'Students Console'}</span>
                      </button>

                      <button
                        onClick={() => handleNav('/admin/menu')}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Utensils className="w-4 h-4 text-emerald-500" />
                        <span>{t('navMenuMgmt') || 'Canteen Menu Console'}</span>
                      </button>

                      <button
                        onClick={() => handleNav('/admin')}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      >
                        <Sliders className="w-4 h-4 text-emerald-500" />
                        <span>Master Token Board</span>
                      </button>

                      <div className="h-px bg-gray-100 dark:bg-white/10 my-1" />

                      {user ? (
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>{t('navLogout')}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleNav('/alogin')}
                          className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>{t('navLogin')}</span>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </nav>

          {/* Right Action Island: Language + Theme Switches + Mobile Hamburger */}
          <div className="flex items-center gap-2">
            <LanguageSwitch />
            <ThemeSwitch />

            {/* Mobile hamburger button */}
            <div className="flex md:hidden">
              <button
                onClick={() => {
                  feedback('pop');
                  setMobileMenuOpen(!mobileMenuOpen);
                }}
                className="p-2 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200/70 dark:border-white/10 transition-colors"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
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
            className="md:hidden overflow-hidden border-t border-gray-200/80 dark:border-white/10 bg-white/95 dark:bg-[#0b1210]/95 backdrop-blur-2xl"
          >
            <div className="px-4 py-4 space-y-2">
              <button
                onClick={() => handleNav(isAdmin ? '/admin' : '/')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive('/') || isActive('/admin')
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                <Home className="w-4 h-4" />
                <span>{isAdmin ? t('navAdmin') : t('navHome')}</span>
              </button>

              <button
                onClick={() => handleNav('/list')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive('/list')
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>{t('navList')}</span>
              </button>

              <button
                onClick={() => handleNav('/login')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold ${
                  isActive('/login') || isActive('/student-portal')
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5'
                }`}
              >
                <KeyRound className="w-4 h-4 text-emerald-500" />
                <span>{t('navStudentPortal') || 'Student Portal'}</span>
              </button>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() => handleNav('/lunch')}
                  className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-500/20 active:scale-95 transition-transform"
                >
                  <Utensils className="w-3.5 h-3.5" />
                  <span>{t('navLunch')}</span>
                </button>

                <button
                  onClick={() => handleNav('/breakfast')}
                  className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-500/20 active:scale-95 transition-transform"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>{t('navBreakfast')}</span>
                </button>

                <button
                  onClick={() => handleNav('/menu')}
                  className="flex items-center justify-center gap-1.5 px-2 py-2.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-500/20 active:scale-95 transition-transform"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>{t('navMenu') || 'Menu'}</span>
                </button>
              </div>

              {isAdmin && (
                <>
                  <button
                    onClick={() => handleNav('/student-management')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <Users className="w-4 h-4 text-emerald-500" />
                    <span>{t('navStudentMgmt') || 'Student Management'}</span>
                  </button>

                  <button
                    onClick={() => handleNav('/admin/menu')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <Utensils className="w-4 h-4 text-emerald-500" />
                    <span>{t('navMenuMgmt') || 'Menu Management'}</span>
                  </button>

                  <button
                    onClick={() => handleNav('/add-students')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <UserPlus className="w-4 h-4 text-emerald-500" />
                    <span>{t('navAddStudent')}</span>
                  </button>

                  <button
                    onClick={() => handleNav('/m-tokens')}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                  >
                    <Sliders className="w-4 h-4 text-emerald-500" />
                    <span>{t('navManageTokens')}</span>
                  </button>
                </>
              )}

              {user ? (
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('navLogout')}</span>
                </button>
              ) : (
                <button
                  onClick={() => handleNav('/alogin')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                >
                  <LogIn className="w-4 h-4" />
                  <span>{t('navLogin')}</span>
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Navbar;