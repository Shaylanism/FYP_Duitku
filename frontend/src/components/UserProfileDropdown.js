import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';

const UserProfileDropdown = () => {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };



  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Picture Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 bg-gradient-to-r from-primary-400 to-primary-500 rounded-xl flex items-center justify-center hover:from-primary-500 hover:to-primary-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 group"
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label="User profile menu"
      >
        <span className="text-white font-semibold text-lg">
          {user?.name?.charAt(0).toUpperCase()}
        </span>
        {/* Dropdown indicator */}
        <svg 
          className={`absolute -bottom-1 -right-1 w-4 h-4 text-white bg-primary-600 rounded-full p-0.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-strong border border-neutral-200 py-2 z-50 animate-fade-in">
          {/* User Info Section */}
          <div className="px-4 py-3 border-b border-neutral-100">
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gradient-to-r from-primary-400 to-primary-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 truncate">
                  {user?.name}
                </p>
                <p className="text-xs text-neutral-500 truncate">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            {/* Logout Option */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-sm text-error-600 hover:bg-error-50 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfileDropdown;