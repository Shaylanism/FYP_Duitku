import React from 'react';

const BudgetWarningModal = ({ 
  isOpen, 
  onClose, 
  onProceed, 
  category, 
  budgetAmount, 
  existingSpent, 
  transactionCount,
  month 
}) => {
  if (!isOpen) return null;

  const remaining = budgetAmount - existingSpent;
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount || 0);
  };

  const formatMonthDisplay = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center mb-4">
          <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
            <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Budget Impact Warning</h3>
        </div>
        
        <div className="mb-6">
          <p className="text-gray-600 mb-4">
            You already have <strong>{transactionCount}</strong> transaction {transactionCount > 1 ? 's' : ''} 
            in the <strong>{category}</strong> category for <strong>{formatMonthDisplay(month)}</strong>.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <h4 className="font-semibold text-gray-800 mb-2">Budget Impact Summary:</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Proposed Budget:</span>
                <span className="font-medium">{formatCurrency(budgetAmount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Already Spent:</span>
                <span className="font-medium text-red-600">{formatCurrency(existingSpent)}</span>
              </div>
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between">
                  <span className="font-medium">Remaining Budget:</span>
                  <span className={`font-bold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(remaining)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {remaining < 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-red-700 text-sm font-medium">
                  Warning: Your proposed budget is less than what you've already spent!
                </p>
              </div>
            </div>
          )}

          <p className="text-gray-600 text-sm">
            Creating this budget will show the current spending status. Do you want to proceed?
          </p>
        </div>
        
        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Proceed
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetWarningModal; 