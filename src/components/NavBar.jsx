import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../store/AuthContext';
import Swal from 'sweetalert2';
import firebase from '../firebase/config';
import { motion, AnimatePresence } from "framer-motion";

const Navbar = ({ isAdmin }) => {
  const { user } = useContext(AuthContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // For token dropdown
  const [optionsOpen, setOptionsOpen] = useState(false); // For options dropdown
  const tokenDropdownRef = useRef(null); // Ref for token dropdown
  const optionsDropdownRef = useRef(null); // Ref for options dropdown
  const navbarRef = useRef(null); // Ref for the entire navbar
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);



  const handleHomeBtn = ()=> {
    navigate(isAdmin ? '/admin' : '/')
    setMenuOpen(false)
  } 

  const handleListBtn = ()=> {
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

  // Function to handle dropdown toggle
  const handleTokenDropdownToggle = () => {
    setIsOpen(!isOpen);

  };

  const closeDropdowns = () => {
    setIsOpen(false);
    setOptionsOpen(false);
  };

  // Close dropdowns and menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        navbarRef.current && // Check if click is outside the navbar
        !navbarRef.current.contains(event.target)
      ) {
        closeDropdowns();
        setMenuOpen(false); // Close the menu if open
      }
    };

    // Add event listener for click outside
    document.addEventListener('mousedown', handleClickOutside);

    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  

  const lunchRoute = () => {
    navigate('/lunch');
    setMenuOpen(false); // Close navbar when navigating to lunch
  }
  

  const breakfastRoute =()=>{
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
    <nav className="bg-white border-b  border-gray-200" ref={navbarRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <h1 className="text-2xl font-bold text-gray-700">
              <span className="text-green-700">ADSA</span> T-board
            </h1>
          </div>

          {/* Hamburger menu for mobile */}
          <div className="flex md:hidden">
          <button
        onClick={toggleMenu}
        className="text-gray-700 hover:text-green-700 focus:outline-none"
      >
        {menuOpen ? (
           <svg
           className="h-6 w-6"
           xmlns="http://www.w3.org/2000/svg"
           fill="none"
           viewBox="0 0 24 24"
           stroke="currentColor"
         >
           <path
             strokeLinecap="round"
             strokeLinejoin="round"
             strokeWidth="2"
             d="M6 18L18 6M6 6l12 12"
           />
         </svg>
        ) : (
         
        <svg
        className="h-6 w-6"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          d="M4 6h16M4 12h16m-7 6h7"
        />
      </svg>
        
        )}
      </button>
          </div>

          {/* Links for larger screens */}
          <div className="hidden md:flex md:space-x-6">
            <button
              onClick={handleHomeBtn}
              className="text-gray-700 hover:text-green-700 px-3 py-2 text-sm font-medium"
            >
              {isAdmin ? 'Admin' : 'Home'}
            </button>
            <button
              onClick={handleListBtn}
              className="text-gray-700 hover:text-green-700 px-3 py-2 text-sm font-medium"
            >
              List
            </button>

            {/* Token Dropdown Button */}
            <div className="relative flex items-center" ref={tokenDropdownRef}>
              <button
                onClick={handleTokenDropdownToggle}
                className="text-gray-700 hover:text-green-700 px-3 py-2 text-sm font-medium"
              >
                Supply
              </button>

              {/* Token Dropdown Menu */}
              <AnimatePresence>
            {isOpen && (
              <motion.div
                className="absolute left-0 mt-28 w-38 bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      lunchRoute();
                      closeDropdowns();
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                  >
                    Lunch
                  </button>
                  <button
                    onClick={() => {
                      breakfastRoute();
                      closeDropdowns();
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                  >
                    Breakfast
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
            </div>

            {isAdmin ? (
              <div className="relative" ref={optionsDropdownRef}>
                <button
                  onClick={handleOptionsDropdownToggle}
                  className=" rounded-md flex items-center text-gray-700 hover:text-green-700 px-3 py-2 text-sm font-medium"
                  aria-expanded={optionsOpen}
                  aria-haspopup="true"
                >
                  {user ? "ADSA" : "Login"}
                  <svg className="-mr-1 h-5 w-5 text-gray-400 ml-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Options Dropdown Menu */}
                <AnimatePresence>
              {optionsOpen && (
                <motion.div
                  className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="py-1">
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
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 text-left"
                    >
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
                className="text-gray-700 hover:text-green-700 px-3 py-2 text-sm font-medium"
              >
                Menu
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
     

      <AnimatePresence>
  {menuOpen && (
    <motion.div
      className="md:hidden w-3/5 text-white rounded-lg bg-gray-900/80 backdrop-blur-md ml-auto absolute right-2 top-16 z-50 shadow-lg"
      initial={{ opacity: 0, y: -15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
    >
      <div className="space-y-3 px-4 py-5">
        {/* Home Button */}
        <button
          onClick={handleHomeBtn}
          className="block w-full px-4 py-2 text-left text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
        >
          {isAdmin ? "Admin" : "Home"}
        </button>

        {/* List Button */}
        <button
          onClick={handleListBtn}
          className="block w-full px-4 py-2 text-left text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
        >
          List
        </button>

        {/* Supply Dropdown */}
        <div className="relative" ref={tokenDropdownRef}>
          <button
            onClick={handleTokenDropdownToggle}
            className="block w-full px-4 py-2 text-left text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
          >
            Supply
          </button>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                className="absolute left-0 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10"
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
              >
                <div className="py-2">
                  <button
                    onClick={() => {
                      lunchRoute();
                      closeDropdowns();
                    }}
                    className="block w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white text-left"
                  >
                    Lunch
                  </button>
                  <button
                    onClick={() => {
                      breakfastRoute();
                      closeDropdowns();
                    }}
                    className="block w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white text-left"
                  >
                    Breakfast
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Admin Options */}
        {isAdmin ? (
          <div className="relative" ref={optionsDropdownRef}>
            <button
              onClick={handleOptionsDropdownToggle}
              className="block w-full px-4 py-2 text-left text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg flex items-center justify-between"
              aria-expanded={optionsOpen}
              aria-haspopup="true"
            >
              {user ? "ADSA" : "Login"}
              <svg
                className="w-5 h-5 ml-2 text-gray-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
            <AnimatePresence>
              {optionsOpen && (
                <motion.div
                  className="absolute left-0 mt-2 w-full bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10"
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div>
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
                      className="block w-full px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white text-left"
                    >
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
            className="block w-full px-4 py-2 text-left text-sm font-medium text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg"
          >
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
