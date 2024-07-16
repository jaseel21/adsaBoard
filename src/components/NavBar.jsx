import React, { useState, useRef, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHome, faList, faTicketAlt, faUtensils } from '@fortawesome/free-solid-svg-icons';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ isAdmin }) => {
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const dropdownRef = useRef(null);

    // Navigation handlers
    const handleHomeBtn = () => {
        if(isAdmin){
            navigate('/admin')
        }else{

            navigate('/');
        }
    };

    const handleListBtn = () => {
        navigate('/list');
    };

    const handleMenuBtn = () => {
        navigate('/menu');
    };

    const handleDropdownToggle = () => {
        setIsOpen(prevState => !prevState);
    };

    const closeDropdown = () => {
        setIsOpen(false);
    };

    const lunchRoute = () => {
        navigate('/lunch');
    };

    const breakfastRoute = () => {
        navigate('/breakfast');
    };

    // Close the dropdown when clicking outside
    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                closeDropdown();
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);

        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, []);

    return (
        <nav className="bg-transparent py-4 md:p-4 flex">
            <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
                <div className="relative flex items-center justify-between h-16">
                    {/* Navbar Links */}
                    <div className="justify-center items-center sm:block sm:ml-6 w-full sm:w-auto">
                        <div className="flex justify-center sm:justify-start sm:space-x-0 md:space-x-4">
                            {/* Home Button */}
                            <button
                                onClick={handleHomeBtn}
                                className="text-gray-900 hover:bg-gray-300 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                            >
                                <FontAwesomeIcon icon={faHome} className="mr-1" />
                                {isAdmin ? 'Admin' : 'Home'} {/* Fixed the display text */}
                            </button>
                            {/* List Button */}
                            <button
                                onClick={handleListBtn}
                                className="text-gray-900 hover:bg-gray-300 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                            >
                                <FontAwesomeIcon icon={faList} className="mr-1" />
                                List
                            </button>
                            {/* Token Dropdown Button */}
                            <div className="relative">
                                <button
                                    onClick={handleDropdownToggle}
                                    className="text-gray-900 hover:bg-gray-300 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                                >
                                    <FontAwesomeIcon icon={faTicketAlt} className="mr-1" />
                                    Token
                                </button>

                                {/* Dropdown menu */}
                                {isOpen && (
                                    <div ref={dropdownRef} className="absolute right-0 mt-2 w-auto bg-white rounded-md shadow-lg z-10">
                                        <div className="py-1">
                                            {/* Option 1 */}
                                            <button
                                                onClick={() => {
                                                    lunchRoute();
                                                    closeDropdown();
                                                }}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                            >
                                                Lunch
                                            </button>

                                            {/* Option 2 */}
                                            <button
                                                onClick={() => {
                                                    breakfastRoute();
                                                    closeDropdown();
                                                }}
                                                className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                                            >
                                                Breakfast
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                            {/* Food Menu Link */}
                            <button
                                onClick={handleMenuBtn}
                                className="text-gray-900 hover:bg-gray-300 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium flex items-center"
                            >
                                <FontAwesomeIcon icon={faUtensils} className="mr-1" />
                                Menu
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
