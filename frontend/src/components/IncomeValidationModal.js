import React from 'react';
import { formatCurrency } from '../utils/formatters';

const IncomeValidationModal = ({ 
  isOpen, 
  onClose, 
  errorType, 
  message, 
  details = null 
}) => {
  if (!isOpen) return null;

  const getModalContent = () => {
    switch (errorType) {
      case 'NO_INCOME':
        return {
          title: 'No Income Found',
          icon: (
            <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          ),
          description: 'You need to record at least one income transaction before you can add expenses. This helps ensure you\'re spending within your means.',
          actionText: 'Add Income First'
        };
      
      case 'INSUFFICIENT_INCOME':
        return {
          title: 'Insufficient Income',
          icon: (
            <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          ),
          description: 'This expense would exceed your available income. Please adjust the amount or add more income.',
          actionText: 'Adjust Amount'
        };
      
      default:
        return {
          title: 'Transaction Error',
          icon: (
            <div className="w-16 h-16 bg-error-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-error-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ),
          description: 'There was an error processing your transaction. Please try again.',
          actionText: 'Try Again'
        };
    }
  };

  const modalContent = getModalContent();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full animate-fade-in">
        <div className="p-6">
          {/* Header */}
          <div className="text-center">
            {modalContent.icon}
            <h3 className="text-xl font-bold text-neutral-900 mb-2">
              {modalContent.title}
            </h3>
            <p className="text-neutral-600 mb-4">
              {message}
            </p>
            <p className="text-sm text-neutral-500 mb-6">
              {modalContent.description}
            </p>
          </div>

          {/* Details for insufficient income */}
          {errorType === 'INSUFFICIENT_INCOME' && details && (
            <div className="bg-neutral-50 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-neutral-800 mb-3">Financial Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-neutral-600">Monthly Income:</span>
                  <span className="font-medium text-success-600">
                    {formatCurrency(details.monthlyIncome || details.totalIncome || 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Monthly Expenses:</span>
                  <span className="font-medium text-error-600">
                    {formatCurrency(details.monthlyExpenses || details.totalExpenses || 0)}
                  </span>
                </div>
                <div className="border-t border-neutral-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Available to Spend:</span>
                    <span className="font-bold text-primary-600">
                      {formatCurrency(details.availableBalance || details.availableAmount || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-600">Requested Amount:</span>
                  <span className="font-medium text-warning-600">
                    {formatCurrency(details.requestedAmount || 0)}
                  </span>
                </div>
                {details.month && (
                  <div className="flex justify-between">
                    <span className="text-neutral-600">Month:</span>
                    <span className="font-medium text-neutral-800">{details.month}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 btn-primary"
            >
              {modalContent.actionText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncomeValidationModal;