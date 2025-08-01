import React from 'react';

const OverduePaymentModal = ({ isOpen, onClose, overduePayments, actionType }) => {
  if (!isOpen) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  const actionText = actionType === 'transaction' ? 'add expense transactions' : 'create expense planned payments';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-96 flex flex-col">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                Overdue Payments Found
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You have overdue expense payments that need to be settled first.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-gray-700 mb-4">
            You cannot {actionText} while you have overdue expense payments. 
            Please settle the following payments first:
          </p>
          
          {actionType === 'planned_payment' && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="ml-3">
                  <p className="text-sm text-green-800">
                    <strong>Note:</strong> You can still create <strong>income</strong> planned payments even with overdue expenses.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {overduePayments?.map((payment, index) => (
              <div key={payment.id || index} className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h4 className="font-medium text-red-900">{payment.title}</h4>
                    <p className="text-sm text-red-700">Category: {payment.category}</p>
                    <p className="text-sm text-red-700">Due Day: {payment.dueDay}</p>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-900">{formatCurrency(payment.amount)}</div>
                    <div className="text-sm text-red-600">
                      {payment.daysOverdue > 0 ? `${payment.daysOverdue} day${payment.daysOverdue > 1 ? 's' : ''} overdue` : 'Due now'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">How to resolve this:</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Go to the <strong>Planned Payments</strong> section and mark these overdue payments as "Settled" 
                  to continue adding new transactions or planned payments.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverduePaymentModal;