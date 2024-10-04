import React, { useState, useRef, useEffect, useContext } from 'react';

    import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

    import { faHome, faList, faTicketAlt, faUtensils, faUser } from '@fortawesome/free-solid-svg-icons';

    import { useNavigate } from 'react-router-dom';

    import { AuthContext } from '../store/AuthContext';

    import Swal from 'sweetalert2';

    import firebase from '../firebase/config';



    const Navbar = ({ isAdmin }) => {

        const { user } = useContext(AuthContext);

        const [isOpen, setIsOpen] = useState(false);

        const [optionsOpen, setOptionsOpen] = useState(false);

        const navigate = useNavigate();

        const tokenDropdownRef = useRef(null);

        const optionsDropdownRef = useRef(null);



        // Navigation handlers

        const handleHomeBtn = () => {

            if (isAdmin) {

                navigate('/admin');

            } else {

                navigate('/');

            }

        };



        const handleListBtn = () => {

            navigate('/list');

        };



        const handleTokenDropdownToggle = () => {

            setIsOpen(prevState => !prevState);

        };



        const handleOptionsDropdownToggle = () => {

            setOptionsOpen(prevState => !prevState);

        };



        const closeDropdowns = () => {

            setIsOpen(false);

            setOptionsOpen(false);

        };



        const lunchRoute = () => {

            navigate('/lunch');

        };



        const breakfastRoute = () => {

            navigate('/breakfast');

        };



        const handleMenueBtn = () => {

            navigate('/menu');

        };



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



        // Close dropdowns when clicking outside

        useEffect(() => {

            const handleOutsideClick = (event) => {

                // Check if the click is outside the token dropdown

                if (tokenDropdownRef.current && !tokenDropdownRef.current.contains(event.target)) {

                    setIsOpen(false);

                }

        

                // Check if the click is outside the options dropdown

                if (optionsDropdownRef.current && !optionsDropdownRef.current.contains(event.target)) {

                    setOptionsOpen(false);

                }

            };

        

            // Add event listener for click outside

            document.addEventListener('mousedown', handleOutsideClick);

        

            // Clean up the event listener on component unmount

            return () => {

                document.removeEventListener('mousedown', handleOutsideClick);

            };

        }, [isOpen, optionsOpen]); // Include dependencies so the effect runs on state changes

        



        return (

            <nav className="bg-white py-4 flex justify-between items-center border-b-2 border-gray-200">

                <div className="max-w-7xl mx-auto flex items-center justify-between w-full px-4">

                <div className="flex-shrink-0">

                        <h1 className="text-3xl font-bold text-gray-700">

                            <span className="text-green-700">ADSA</span> Online

                        </h1>

                    </div>

                    <div className="relative flex items-center justify-between h-16">

                        {/* Navbar Links */}

                        

                        <div className="justify-center items-center sm:block sm:ml-6 w-full sm:w-auto">

                            <div className="flex justify-center sm:justify-start sm:space-x-0 md:space-x-4">

                                {/* Home Button */}

                                <button

                                    onClick={handleHomeBtn}

                                    className="text-gray-700 hover:text-green-700 px-3 py-2 text-lg font-medium"

                                >

                                    {/* <FontAwesomeIcon icon={faHome} className="mr-1" /> */}

                                    {isAdmin ? 'Admin' : 'Home'}

                                </button>

                                {/* List Button */}

                                <button

                                    onClick={handleListBtn}

                                    className="text-gray-700 hover:text-green-700 px-3 py-2 text-lg font-medium"

                                >

                                    {/* <FontAwesomeIcon icon={faList} className="mr-1" /> */}

                                    List

                                </button>

                                {/* Token Dropdown Button */}

                                <div className="relative" ref={tokenDropdownRef}>

                                    <button

                                        onClick={handleTokenDropdownToggle}

                                        className="text-gray-700 hover:text-green-700 px-3 py-2 text-lg font-medium"

                                    >

                                        {/* <FontAwesomeIcon icon={faTicketAlt} className="mr-1" /> */}

                                        Token

                                    </button>

                                    {/* Token Dropdown Menu */}

                                    {isOpen && (

                                        <div  className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">

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

                                {/* Options Dropdown Button */}

                                {isAdmin ? (

                                    <div className="relative" ref={optionsDropdownRef}>

                                        <button

                                            onClick={handleOptionsDropdownToggle}

                                            className="  rounded-md  flex items-center text-gray-700 hover:text-green-700 px-3 py-2 text-lg font-medium"

                                            aria-expanded={optionsOpen}

                                            aria-haspopup="true"

                                        >

                                            {/* <FontAwesomeIcon icon={faUser} className="mr-1" /> */}

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

                                        className="text-gray-700 hover:text-green-700 px-3 py-2 text-lg font-medium"

                                    >

                                        {/* <FontAwesomeIcon icon={faUtensils} className="mr-1" /> */}

                                        Menu

                                    </button>

                                )}

                            </div>

                        </div>

                    </div>

                </div>

            </nav>

        );

    };



    export default Navbar;
