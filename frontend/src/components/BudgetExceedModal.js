import React from 'react';

const BudgetExceedModal = ({ 
  isOpen, 
  onClose, 
  onProceed, 
  budgetInfo 
}) => {
  if (!isOpen || !budgetInfo) return null;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount || 0);
  };

  const formatMonthDisplay = (monthStr) => {
    const [year, month] = monthStr.split('-');
    const date = new Date(year, month - 1);
    return date.toLocaleDateString('en-MY', { year: 'numeric', month: 'long' });
  };

  const {
    category,
    budgetAmount,
    currentSpent,
    transactionAmount,
    totalAfterTransaction,
    exceedanceAmount,
    month
  } = budgetInfo;

  const percentageUsed = ((currentSpent / budgetAmount) * 100);
  const percentageAfterTransaction = ((totalAfterTransaction / budgetAmount) * 100);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full mx-4 shadow-2xl animate-fade-in">
        <div className="p-5">
          {/* Compact Header */}
          <div className="flex items-start mb-4">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center mr-3 mt-0.5">
              <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-neutral-900 mb-1">Budget Exceeded</h3>
              <p className="text-sm text-neutral-600 mb-2">{category} • {formatMonthDisplay(month)}</p>
              <p className="text-xs text-error-700 font-medium">
                Overspend: <span className="font-bold">{formatCurrency(exceedanceAmount)}</span>
              </p>
            </div>
          </div>
          
          {/* Consolidated Budget Visual */}
          <div className="bg-gradient-to-r from-warning-50 to-error-50 rounded-lg p-4 mb-4 border border-warning-200">
            {/* Progress Visualization */}
            <div className="relative">
              <div className="flex justify-between text-xs font-medium mb-2">
                <span className="text-neutral-700">Budget Progress</span>
                <span className="text-error-700">{percentageAfterTransaction.toFixed(0)}% used</span>
              </div>
              
              {/* Stacked Progress Bar */}
              <div className="w-full bg-neutral-200 rounded-full h-3 relative overflow-hidden">
                {/* Current spending */}
                <div 
                  className="bg-warning-500 h-3 rounded-full transition-all duration-300 absolute left-0 top-0" 
                  style={{ width: `${Math.min(percentageUsed, 100)}%` }}
                ></div>
                {/* Transaction amount (overflow) */}
                <div 
                  className="bg-error-500 h-3 transition-all duration-300 absolute top-0" 
                  style={{ 
                    left: `${Math.min(percentageUsed, 100)}%`,
                    width: `${Math.min(((transactionAmount / budgetAmount) * 100), 100 - Math.min(percentageUsed, 100))}%`
                  }}
                ></div>
                {/* Overflow indicator */}
                {percentageAfterTransaction > 100 && (
                  <div className="absolute right-0 top-0 w-1 h-3 bg-error-600"></div>
                )}
              </div>
            </div>

            {/* Key Numbers */}
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-neutral-600">Budget:</span>
                <span className="font-semibold text-neutral-900 ml-1">{formatCurrency(budgetAmount)}</span>
              </div>
              <div>
                <span className="text-neutral-600">Spent:</span>
                <span className="font-semibold text-warning-700 ml-1">{formatCurrency(currentSpent)}</span>
              </div>
              <div>
                <span className="text-neutral-600">This Transaction:</span>
                <span className="font-semibold text-error-700 ml-1">{formatCurrency(transactionAmount)}</span>
              </div>
              <div>
                <span className="text-neutral-600">New Total:</span>
                <span className="font-bold text-error-800 ml-1">{formatCurrency(totalAfterTransaction)}</span>
              </div>
            </div>
          </div>

          {/* Concise Warning */}
          <div className="bg-error-50 rounded-lg p-3 mb-4 border border-error-200">
            <p className="text-error-800 text-sm">
              <strong>Warning:</strong> This exceeds your budget by <strong>{formatCurrency(exceedanceAmount)}</strong>. 
              Consider adjusting your budget or reconsidering this expense.
            </p>
          </div>
        </div>
        
        {/* Compact Action Buttons */}
        <div className="border-t border-neutral-200 px-5 py-4">
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="btn-ghost text-sm px-4 py-2"
            >
              Cancel
            </button>
            <button
              onClick={onProceed}
              className="btn-warning text-sm px-4 py-2"
            >
              Proceed Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BudgetExceedModal;