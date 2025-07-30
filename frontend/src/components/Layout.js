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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [lastNotificationIds, setLastNotificationIds] = useState(new Set());

  const handleLogout = () => {
    logout();
  };

  // Fetch payment notifications
  const fetchNotifications = async (showModalOnNewNotifications = false) => {
    try {
      const res = await axios.get('/api/planned-payments/notifications');
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setHasWarnings(res.data.hasWarnings);
        
        // Only show modal if explicitly requested and there are new notifications
        if (showModalOnNewNotifications && res.data.notifications.length > 0) {
          // Check if there are any new notifications (notifications not seen before)
          const currentNotificationIds = new Set(res.data.notifications.map(n => n.paymentId));
          const hasNewNotifications = res.data.notifications.some(n => !lastNotificationIds.has(n.paymentId));
          
          if (hasNewNotifications || !notificationCheckDone) {
            setShowNotificationModal(true);
            setLastNotificationIds(currentNotificationIds);
          }
        }
        
        // Mark that we've done the initial notification check
        if (!notificationCheckDone) {
          setNotificationCheckDone(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
      if (!notificationCheckDone) {
        setNotificationCheckDone(true);
      }
    }
  };

  // Handle settling payment from modal
  const handleSettlePayment = async (paymentId, description) => {
    try {
      await axios.put(`/api/planned-payments/${paymentId}/settle`, {
        transactionDescription: description
      });
      
      // Refresh notifications after settling (but don't show modal)
      fetchNotifications(false);
      
      // Show success message
      alert('Payment settled successfully and transaction created!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to settle payment');
    }
  };

  // Fetch notifications when component mounts (show modal for initial notifications)
  useEffect(() => {
    if (user && !notificationCheckDone) {
      fetchNotifications(true);
    }
  }, [user, notificationCheckDone]);

  // Check for notifications periodically (every 5 minutes) - don't show modal automatically
  useEffect(() => {
    if (user && notificationCheckDone) {
      const interval = setInterval(() => {
        fetchNotifications(false); // Don't show modal on interval checks
      }, 5 * 60 * 1000); // 5 minutes

      return () => clearInterval(interval);
    }
  }, [user, notificationCheckDone]);

  // Reset notification check when user logs out and refresh on payment settlement
  useEffect(() => {
    const handleLogoutEvent = () => {
      setNotificationCheckDone(false);
      setNotifications([]);
      setHasWarnings(false);
      setShowNotificationModal(false);
      setLastNotificationIds(new Set());
    };

    const handlePaymentSettled = () => {
      fetchNotifications(false); // Don't show modal when payment is settled
    };

    window.addEventListener('userLoggedOut', handleLogoutEvent);
    window.addEventListener('paymentSettled', handlePaymentSettled);
    
    return () => {
      window.removeEventListener('userLoggedOut', handleLogoutEvent);
      window.removeEventListener('paymentSettled', handlePaymentSettled);
    };
  }, []);

  // Refresh notifications when navigating to planned payments page - don't show modal
  useEffect(() => {
    if (user && location.pathname === '/dashboard/planned-payments' && notificationCheckDone) {
      // Small delay to ensure the page has loaded
      const timer = setTimeout(() => {
        fetchNotifications(false); // Don't show modal on navigation
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [location.pathname, user, notificationCheckDone]);

  const navigationItems = [
    {
      path: '/dashboard/transactions',
      name: 'Transactions',
      description: 'View and manage transactions',
      icon: (
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    },
    {
      path: '/dashboard/budget-planner',
      name: 'Budget Planner',
      description: 'Plan and track budgets',
      icon: (
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    },
    {
      path: '/dashboard/planned-payments',
      name: 'Planned Payments',
      description: 'Schedule recurring payments',
      hasWarning: hasWarnings,
      icon: (
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )
    },
    {
      path: '/dashboard/retirement-planner',
      name: 'Retirement Planner',
      description: 'Plan for your future',
      icon: (
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m-3-6h6m-3 0h.01M9 16h6" />
        </svg>
      )
    },
    {
      path: '/dashboard/export-report',
      name: 'Export Report',
      description: 'Generate financial reports',
      icon: (
        <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2h2z" />
        </svg>
      )
    }
  ];

  const getPageTitle = () => {
    const currentItem = navigationItems.find(item => item.path === location.pathname);
    return currentItem ? currentItem.name : 'Dashboard';
  };

  return (
    <div className="flex h-screen bg-neutral-25">
      {/* Sidebar */}
      <div className={`${sidebarCollapsed ? 'w-20' : 'w-72'} bg-white shadow-strong border-r border-neutral-200 flex flex-col transition-all duration-300`}>
        {/* Header Section */}
        <div className="p-6 border-b border-neutral-100">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-glow">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m-3-6h6m-3 0h.01M9 16h6" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gradient-gold">Duitku</h1>
                  <p className="text-xs text-neutral-500">Financial Management</p>
                </div>
              </div>
            )}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 rounded-lg hover:bg-neutral-100 transition-colors duration-200"
            >
              <svg className="w-5 h-5 text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* User Info */}
        {!sidebarCollapsed && (
          <div className="p-6 bg-gradient-to-r from-primary-50 to-primary-100 border-b border-primary-200">
            <div className="flex items-center space-x-3">
              <div className="h-12 w-12 bg-gradient-to-r from-primary-400 to-primary-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-neutral-900 truncate">
                  Welcome back,
                </p>
                <p className="text-lg font-bold text-primary-700 truncate">
                  {user?.name}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${isActive ? 'nav-item-active' : 'nav-item'} group relative`}
                title={sidebarCollapsed ? item.name : ''}
              >
                <div className="flex items-center">
                  {item.icon}
                  {!sidebarCollapsed && (
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{item.name}</span>
                        {item.hasWarning && (
                          <div className="flex items-center">
                            <span className="w-2 h-2 bg-warning-500 rounded-full animate-pulse"></span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs opacity-75 mt-0.5">{item.description}</p>
                    </div>
                  )}
                  {sidebarCollapsed && item.hasWarning && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-warning-500 rounded-full animate-pulse"></div>
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Logout Section */}
        <div className="p-4 border-t border-neutral-200">
          <button 
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-error-600 hover:bg-error-50 rounded-xl transition-all duration-200 group"
            title={sidebarCollapsed ? 'Logout' : ''}
          >
            <svg className="nav-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {!sidebarCollapsed && (
              <span className="font-medium">Logout</span>
            )}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-neutral-200 shadow-soft">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-semibold text-neutral-900">{getPageTitle()}</h2>
                <p className="text-sm text-neutral-600 mt-1">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              
              {/* Header Actions */}
              <div className="flex items-center space-x-4">
                {/* Notifications */}
                {hasWarnings && (
                  <button
                    onClick={() => setShowNotificationModal(true)}
                    className="relative p-2 rounded-xl bg-warning-50 text-warning-600 hover:bg-warning-100 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-warning-500 rounded-full animate-pulse"></span>
                  </button>
                )}
                
                {/* User Menu */}
                <div className="flex items-center space-x-3 pl-4 border-l border-neutral-200">
                  <div className="text-right">
                    <p className="text-sm font-medium text-neutral-900">{user?.name}</p>
                    <p className="text-xs text-neutral-500">{user?.email}</p>
                  </div>
                  <div className="h-10 w-10 bg-gradient-to-r from-primary-400 to-primary-500 rounded-xl flex items-center justify-center">
                    <span className="text-white font-semibold">
                      {user?.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-neutral-25">
          <div className="p-6">
            <Outlet />
          </div>
        </main>
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