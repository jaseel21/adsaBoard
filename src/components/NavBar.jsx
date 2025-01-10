import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../store/AuthContext';
import Swal from 'sweetalert2';
import firebase from '../firebase/config';

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
    <nav className="bg-white border-b border-gray-200" ref={navbarRef}>
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
              {isOpen && (
                <div className="absolute mt-40 w-48 bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        lunchRoute();
                        closeDropdowns();
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Lunch
                    </button>
                    <button
                      onClick={() => {
                        breakfastRoute();
                        closeDropdowns();
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Breakfast
                    </button>
                  </div>
                </div>
              )}
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
                {optionsOpen && (
                  <div className="absolute right-0 mt-2 w-28 bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          if (user) {
                            handleLogout();
                          } else {
                            navigate("/alogin");
                          }
                          closeDropdowns();
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        {user ? 'Logout' : 'Login'}
                      </button>
                    </div>
                  </div>
                )}
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
      {menuOpen && (
        <div className="md:hidden">
          <div className="space-y-1 px-2 pb-3 sm:px-3">
            <button
              onClick={handleHomeBtn}
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-gray-100"
            >
              {isAdmin ? 'Admin' : 'Home'}
            </button>
            <button
              onClick={handleListBtn}
              className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-gray-100"
            >
              List
            </button>

            {/* Token Dropdown Button */}
            <div className="relative " ref={tokenDropdownRef}>
              <button
                onClick={handleTokenDropdownToggle}
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-gray-100"
              >
                Supply
              </button>

              {/* Token Dropdown Menu */}
              {isOpen && (
                <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1">
                    <button
                      onClick={() => {
                        lunchRoute();
                        closeDropdowns();
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Lunch
                    </button>
                    <button
                      onClick={() => {
                        breakfastRoute();
                        closeDropdowns();
                      }}
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                    >
                      Breakfast
                    </button>
                  </div>
                </div>
              )}
            </div>

            {isAdmin ? (
              <div className="relative" ref={optionsDropdownRef}>
                <button
                  onClick={handleOptionsDropdownToggle}
                  className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-gray-100"
                  aria-expanded={optionsOpen}
                  aria-haspopup="true"
                >
                  {user ? "ADSA" : "Login"}
                  <svg className="-mr-1 h-5 w-5 text-gray-400 ml-2" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Options Dropdown Menu */}
                {optionsOpen && (
                  <div className="absolute left-0 mt-1 w-48 bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          if (user) {
                            handleLogout();
                          } else {
                            navigate("/alogin");
                          }
                          closeDropdowns();
                          setMenuOpen(false)
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                      >
                        {user ? 'Logout' : 'Login'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={handleMenueBtn}
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:text-green-700 hover:bg-gray-100"
              >
                Menu
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
