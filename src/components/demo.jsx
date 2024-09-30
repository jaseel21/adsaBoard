import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faList, faTicketAlt, faBars, faUser, faUtensils } from '@fortawesome/free-solid-svg-icons';

const Navbar = ({ isAdmin, user, handleHomeBtn, handleListBtn, handleMenueBtn, lunchRoute, breakfastRoute, handleLogout, navigate }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [optionsOpen, setOptionsOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const handleTokenDropdownToggle = () => {
        setIsOpen(!isOpen);
    };

    const handleOptionsDropdownToggle = () => {
        setOptionsOpen(!optionsOpen);
    };

    const closeDropdowns = () => {
        setIsOpen(false);
        setOptionsOpen(false);
    };

    const handleMobileMenuToggle = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <nav className="bg-white py-4 flex justify-between items-center border-b-2 border-gray-200">
            <div className="max-w-7xl mx-auto flex items-center justify-between w-full px-4">
                {/* Logo */}
                <div className="flex-shrink-0">
                    <h1 className="text-3xl font-bold text-gray-700">
                        <span className="text-green-700">ADSA</span> Online
                    </h1>
                </div>

                {/* Navbar Links */}
                <div className="hidden md:flex space-x-8">
                    <button
                        onClick={handleHomeBtn}
                        className="text-gray-700 hover:text-green-700 px-3 py-2 text-lg font-medium"
                    >
                        {isAdmin ? 'Admin' : 'Home'}
                    </button>

                    <button
                        onClick={handleListBtn}
                        className="text-gray-700 hover:text-green-700 px-3 py-2 text-lg font-medium"
                    >
                        List
                    </button>

                    <div className="relative">
                        <button
                            onClick={handleTokenDropdownToggle}
                            className="text-gray-700 hover:text-green-700 px-3 py-2 text-lg font-medium"
                        >
                            Token
                        </button>
                        {isOpen && (
                            <div className="absolute right-0 mt-2 w-32 bg-white border border-gray-200 rounded-md shadow-lg">
                                <div className="py-1">
                                    <button
                                        onClick={() => {
                                            lunchRoute();
                                            closeDropdowns();
                                        }}
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Lunch
                                    </button>
                                    <button
                                        onClick={() => {
                                            breakfastRoute();
                                            closeDropdowns();
                                        }}
                                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                    >
                                        Breakfast
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {isAdmin ? (
                        <div className="relative">
                            <button
                                onClick={handleOptionsDropdownToggle}
                                className="text-gray-700 hover:text-green-700 px-3 py-2 text-lg font-medium flex items-center"
                            >
                                ADSA
                                <svg className="ml-2 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                                    <path
                                        fillRule="evenodd"
                                        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                                        clipRule="evenodd"
                                    />
                                </svg>
                            </button>
                            {optionsOpen && (
                                <div className="absolute right-0 mt-2 w-28 bg-white border border-gray-200 rounded-md shadow-lg">
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
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
                            Menu
                        </button>
                    )}
                </div>

                {/* Mobile Menu Icon */}
                <div className="md:hidden">
                    <button
                        onClick={handleMobileMenuToggle}
                        className="text-gray-700 hover:text-green-700 px-3 py-2 text-lg font-medium"
                    >
                        <FontAwesomeIcon icon={faBars} />
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
