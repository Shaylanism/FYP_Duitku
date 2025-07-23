import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link, useLocation, Outlet } from 'react-router-dom';
import axios from 'axios';
import PaymentNotificationModal from './PaymentNotificationModal';

const Layout = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [notifications, setNotifications] = useState([]);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [hasWarnings, setHasWarnings] = useState(false);
  const [notificationCheckDone, setNotificationCheckDone] = useState(false);

  const handleLogout = () => {
    logout();
  };

  // Fetch payment notifications
  const fetchNotifications = async () => {
    try {
      const res = await axios.get('/api/planned-payments/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setHasWarnings(res.data.hasWarnings);
        
        // Show modal only if there are notifications and we haven't shown it yet
        if (res.data.notifications.length > 0 && !notificationCheckDone) {
          setShowNotificationModal(true);
        }
        setNotificationCheckDone(true);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      setNotificationCheckDone(true);
    }
  };

  // Handle settling payment from modal
  const handleSettlePayment = async (paymentId, description) => {
    try {
      await axios.put(`/api/planned-payments/${paymentId}/settle`, {
        transactionDescription: description
      });
      
      // Refresh notifications after settling
      fetchNotifications();
      
      // Show success message
      alert('Payment settled successfully and transaction created!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to settle payment');
    }
  };

  // Fetch notifications when component mounts
  useEffect(() => {
    if (user && !notificationCheckDone) {
      fetchNotifications();
    }
  }, [user, notificationCheckDone]);

  // Check for notifications periodically (every 5 minutes)
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        fetchNotifications();
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [user]);

  // Reset notification check when user logs out and refresh on payment settlement
  useEffect(() => {
    const handleLogout = () => {
      setNotificationCheckDone(false);
      setNotifications([]);
      setHasWarnings(false);
      setShowNotificationModal(false);
    };

    const handlePaymentSettled = () => {
      fetchNotifications();
    };

    window.addEventListener('userLoggedOut', handleLogout);
    window.addEventListener('paymentSettled', handlePaymentSettled);
    
    return () => {
      window.removeEventListener('userLoggedOut', handleLogout);
      window.removeEventListener('paymentSettled', handlePaymentSettled);
    };
  }, []);

  // Refresh notifications when navigating to planned payments page
  useEffect(() => {
    if (user && location.pathname === '/dashboard/planned-payments') {
      // Small delay to ensure the page has loaded
      const timer = setTimeout(() => {
        fetchNotifications();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, user]);

  const navigationItems = [
    {
      path: '/dashboard/transactions',
      name: 'Transactions',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      path: '/dashboard/budget-planner',
      name: 'Budget Planner',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      path: '/dashboard/planned-payments',
      name: 'Planned Payments',
      hasWarning: hasWarnings,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    }
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-800">Duitku</h1>
            <p className="text-sm text-gray-600">Welcome, {user?.name}</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-4 py-3 rounded-lg transition-colors duration-200 relative ${
                        isActive
                          ? 'bg-blue-100 text-blue-700 border-r-4 border-blue-700'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      {item.name}
                      {item.hasWarning && (
                        <span className="ml-auto">
                          <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="px-4 py-4 border-t border-gray-200">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          <Outlet />
        </div>
      </div>

      {/* Payment Notification Modal */}
      <PaymentNotificationModal
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
        notifications={notifications}
        onSettlePayment={handleSettlePayment}
      />
    </div>
  );
};

export default Layout; 