import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../store/AuthContext';
import Swal from 'sweetalert2';
import firebase from '../firebase/config';
import { motion, AnimatePresence } from "framer-motion";

const Navbar = ({ isAdmin }) => {
  const { user } = useContext(AuthContext);
  const [email, setEmail] = useState("")
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const tokenDropdownRef = useRef(null);
  const optionsDropdownRef = useRef(null);
  const navbarRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const handleHomeBtn = () => {
    navigate(isAdmin ? '/admin' : '/')
    setMenuOpen(false)
  }

  const AddStudentsCSV = () => {
    navigate(email == "alathurpadidars@gmail.com" && "/add-students")
    if (!email == "alathurpadidars@gmail.com") {
      setIsOpen(!isOpen);
    }
    setMenuOpen(false)
  }

  const handleListBtn = () => {
    navigate('/list')
    setMenuOpen(false);
  }

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout',
      text: 'Are you sure you want to log out?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#f44336',
      cancelButtonColor: '#2E8B57',
      confirmButtonText: 'Logout',
    }).then((result) => {
      if (result.isConfirmed) {
        firebase.auth().signOut();
        navigate('/alogin');
      }
    });
  };

  const handleTokenDropdownToggle = () => {
    setIsOpen(!isOpen);
  };

  const closeDropdowns = () => {
    setIsOpen(false);
    setOptionsOpen(false);
  };

  useEffect(() => {
    if (user && user.bc && user.bc.email) {
      console.log('User email:', user.bc.email);
      setEmail(user.bc.email);
    } else {
      console.log('No user or email found');
      setEmail('');
    }

    const handleClickOutside = (event) => {
      if (navbarRef.current && !navbarRef.current.contains(event.target)) {
        closeDropdowns();
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        navbarRef.current &&
        !navbarRef.current.contains(event.target)
      ) {
        closeDropdowns();
        setMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const lunchRoute = () => {
    navigate('/lunch');
    setMenuOpen(false);
  }

  const breakfastRoute = () => {
    navigate('/breakfast');
    setMenuOpen(false);
  }

  const handleMenueBtn = () => {
    navigate('/menu');
    setMenuOpen(false);
  };

  const handleOptionsDropdownToggle = () => {
    setOptionsOpen((prevState) => !prevState);
  };

  return (
    <nav className="bg-gradient-to-r from-white via-gray-50 to-white shadow-md border-b-2 border-green-600" ref={navbarRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative">
              <img
                src="https://alathurpadidars.in/wp-content/uploads/2019/08/Dars-Site-Logo1.png"
                alt="Dars Site Logo"
                className="relative h-14 w-14 sm:h-20 sm:w-20 md:h-36 md:w-36 object-contain rounded-xl  hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">
                <span className="text-green-700">ADSA</span>{' '}
                <span className="text-gray-700">T-board</span>
              </h1>
            </div>
          </div>

          {/* Hamburger menu for mobile */}
          <div className="flex md:hidden">
            <button
              onClick={toggleMenu}
              className="relative p-2 text-gray-700 hover:text-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 rounded-lg transition-all duration-200"
            >
              <div className="w-6 h-5 flex flex-col justify-between">
                <motion.span
                  animate={menuOpen ? { rotate: 45, y: 8 } : { rotate: 0, y: 0 }}
                  className="w-full h-0.5 bg-current rounded-full"
                />
                <motion.span
                  animate={menuOpen ? { opacity: 0 } : { opacity: 1 }}
                  className="w-full h-0.5 bg-current rounded-full"
                />
                <motion.span
                  animate={menuOpen ? { rotate: -45, y: -8 } : { rotate: 0, y: 0 }}
                  className="w-full h-0.5 bg-current rounded-full"
                />
              </div>
            </button>
          </div>

          {/* Links for larger screens */}
          <div className="hidden md:flex md:items-center md:space-x-2">
            <button
              onClick={handleHomeBtn}
              className="relative px-4 py-2 text-gray-700 hover:text-green-700 font-medium text-sm rounded-lg hover:bg-green-50 transition-all duration-200 group"
            >
              {isAdmin ? 'Admin' : 'Home'}
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-700 group-hover:w-full transition-all duration-300"></span>
            </button>

            <button
              onClick={handleListBtn}
              className="relative px-4 py-2 text-gray-700 hover:text-green-700 font-medium text-sm rounded-lg hover:bg-green-50 transition-all duration-200 group"
            >
              List
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-700 group-hover:w-full transition-all duration-300"></span>
            </button>

            {/* Token Dropdown Button */}
            {email !== "alathurpadidars@gmail.com" && (
              <div className="relative flex items-center" ref={tokenDropdownRef}>
                <button
                  onClick={handleTokenDropdownToggle}
                  className="relative px-4 py-2 text-gray-700 hover:text-green-700 font-medium text-sm rounded-lg hover:bg-green-50 transition-all duration-200 group flex items-center gap-1"
                >
                  Supply
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-700 group-hover:w-full transition-all duration-300"></span>
                </button>

                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      className="absolute left-0 mt-44 w-48 bg-white border border-gray-100 rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 z-10 overflow-hidden"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <div className="py-2">
                        <button
                          onClick={() => {
                            lunchRoute();
                            closeDropdowns();
                          }}
                          className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 text-left font-medium transition-colors duration-150 flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                          Lunch
                        </button>
                        <button
                          onClick={() => {
                            breakfastRoute();
                            closeDropdowns();
                          }}
                          className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 text-left font-medium transition-colors duration-150 flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                          Breakfast
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {email === "alathurpadidars@gmail.com" && isAdmin && (
              <button
                onClick={AddStudentsCSV}
                className="relative px-4 py-2 text-gray-700 hover:text-green-700 font-medium text-sm rounded-lg hover:bg-green-50 transition-all duration-200 group"
              >
                AddStudent
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-700 group-hover:w-full transition-all duration-300"></span>
              </button>
            )}

            {isAdmin ? (
              <div className="relative" ref={optionsDropdownRef}>
                <button
                  onClick={handleOptionsDropdownToggle}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-200 font-medium text-sm shadow-md hover:shadow-lg"
                  aria-expanded={optionsOpen}
                  aria-haspopup="true"
                >
                  {user ? "ADSA" : "Login"}
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${optionsOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                <AnimatePresence>
                  {optionsOpen && (
                    <motion.div
                      className="absolute right-0 mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-2xl ring-1 ring-black ring-opacity-5 z-10 overflow-hidden"
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                      <div className="py-2">
                        <button
                          onClick={() => {
                            if (user) {
                              handleLogout();
                            } else {
                              navigate("/alogin");
                            }
                            closeDropdowns();
                            setMenuOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 text-left font-medium transition-colors duration-150 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          {user ? "Logout" : "Login"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <button
                onClick={handleMenueBtn}
                className="relative px-4 py-2 text-gray-700 hover:text-green-700 font-medium text-sm rounded-lg hover:bg-green-50 transition-all duration-200 group"
              >
                Menu
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-green-700 group-hover:w-full transition-all duration-300"></span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            className="md:hidden w-72 bg-white rounded-2xl ml-auto absolute right-4 top-24 z-50 shadow-2xl border border-gray-100 overflow-hidden"
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3">
              <p className="text-white font-semibold text-sm">Navigation Menu</p>
            </div>
            
            <div className="space-y-1 px-3 py-3">
              <button
                onClick={handleHomeBtn}
                className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-150 flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                {isAdmin ? "Admin" : "Home"}
              </button>

              <button
                onClick={handleListBtn}
                className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-150 flex items-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                List
              </button>

              {email !== "alathurpadidars@gmail.com" && (
                <div className="relative" ref={tokenDropdownRef}>
                  <button
                    onClick={handleTokenDropdownToggle}
                    className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-150 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                      Supply
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        className="mt-1 ml-4 space-y-1"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <button
                          onClick={() => {
                            lunchRoute();
                            closeDropdowns();
                          }}
                          className="w-full px-4 py-2.5 text-sm text-gray-600 hover:text-green-700 hover:bg-green-50 text-left rounded-lg transition-all duration-150 flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                          Lunch
                        </button>
                        <button
                          onClick={() => {
                            breakfastRoute();
                            closeDropdowns();
                          }}
                          className="w-full px-4 py-2.5 text-sm text-gray-600 hover:text-green-700 hover:bg-green-50 text-left rounded-lg transition-all duration-150 flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 bg-green-600 rounded-full"></span>
                          Breakfast
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {email === "alathurpadidars@gmail.com" && isAdmin && (
                <button
                  onClick={AddStudentsCSV}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-150 flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  AddStudent
                </button>
              )}

              {isAdmin ? (
                <div className="relative" ref={optionsDropdownRef}>
                  <button
                    onClick={handleOptionsDropdownToggle}
                    className="w-full px-4 py-3 text-left text-sm font-medium bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all duration-150 flex items-center justify-between shadow-md"
                    aria-expanded={optionsOpen}
                    aria-haspopup="true"
                  >
                    <span className="flex items-center gap-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      {user ? "ADSA" : "Login"}
                    </span>
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${optionsOpen ? 'rotate-180' : ''}`}
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      aria-hidden="true"
                    >
                      <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                    </svg>
                  </button>

                  <AnimatePresence>
                    {optionsOpen && (
                      <motion.div
                        className="mt-1 ml-4"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <button
                          onClick={() => {
                            if (user) {
                              handleLogout();
                            } else {
                              navigate("/alogin");
                            }
                            closeDropdowns();
                            setMenuOpen(false);
                          }}
                          className="w-full px-4 py-2.5 text-sm text-gray-600 hover:text-red-700 hover:bg-red-50 text-left rounded-lg transition-all duration-150 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          {user ? "Logout" : "Login"}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  onClick={handleMenueBtn}
                  className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-green-50 rounded-lg transition-all duration-150 flex items-center gap-3"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                  Menu
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;