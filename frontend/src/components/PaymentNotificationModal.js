import React from 'react';

const PaymentNotificationModal = ({ isOpen, onClose, notifications, onSettlePayment }) => {
  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount || 0);
  };

  const getUrgencyIcon = (urgency) => {
    switch (urgency) {
      case 'high':
        return (
          <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-5 h-5 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getUrgencyBorder = (urgency) => {
    switch (urgency) {
      case 'high':
        return 'border-l-4 border-red-500 bg-red-50';
      case 'medium':
        return 'border-l-4 border-orange-500 bg-orange-50';
      default:
        return 'border-l-4 border-blue-500 bg-blue-50';
    }
  };

  const handleSettlePayment = (payment) => {
    const description = prompt(
      `Enter transaction description for settling "${payment.title}":`,
      `${payment.title} - Monthly payment`
    );
    
    if (description !== null) {
      onSettlePayment(payment.paymentId, description);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-orange-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-lg font-bold text-gray-800">Payment Reminders</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-lg font-medium text-gray-800 mb-2">All Caught Up!</h4>
              <p className="text-gray-600">You have no pending payment reminders.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 mb-4">
                You have {notifications.length} payment{notifications.length > 1 ? 's' : ''} that need your attention:
              </p>
              
              {notifications.map((notification, index) => (
                <div key={notification.paymentId} className={`p-4 rounded-lg ${getUrgencyBorder(notification.urgency)}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3 flex-1">
                      {getUrgencyIcon(notification.urgency)}
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-800">{notification.title}</h4>
                          <span className="text-lg font-bold text-gray-800">
                            {formatCurrency(notification.amount)}
                          </span>
                        </div>
                        <p className={`text-sm mb-2 ${
                          notification.urgency === 'high' ? 'text-red-700' :
                          notification.urgency === 'medium' ? 'text-orange-700' :
                          'text-blue-700'
                        }`}>
                          {notification.message}
                        </p>
                        <div className="flex items-center text-xs text-gray-600 space-x-4">
                          <span>Category: {notification.category}</span>
                          <span>Due: {notification.dueDay}{notification.dueDay === 1 ? 'st' : notification.dueDay === 2 ? 'nd' : notification.dueDay === 3 ? 'rd' : 'th'} of each month</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {notification.status === 'pending' && (
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => handleSettlePayment(notification)}
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                      >
                        Settle Payment
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {notifications.length > 0 && (
              <span>
                {notifications.filter(n => n.urgency === 'high').length > 0 && (
                  <span className="text-red-600 font-medium">
                    {notifications.filter(n => n.urgency === 'high').length} urgent
                  </span>
                )}
                {notifications.filter(n => n.urgency === 'medium').length > 0 && (
                  <>
                    {notifications.filter(n => n.urgency === 'high').length > 0 && ', '}
                    <span className="text-orange-600 font-medium">
                      {notifications.filter(n => n.urgency === 'medium').length} due soon
                    </span>
                  </>
                )}
              </span>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentNotificationModal; 