import React from 'react';

const PastDueDateModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  paymentTitle, 
  dueDay, 
  nextDueDate 
}) => {
  if (!isOpen) return null;

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <div className="flex-shrink-0">
            <svg className="h-10 w-10 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              Past Due Date Detected
            </h3>
          </div>
        </div>
        
        <div className="mb-6">
          <p className="text-sm text-gray-700 mb-3">
            The due date you selected (<strong>day {dueDay}</strong>) has already passed this month.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3 mb-3">
            <p className="text-sm text-yellow-800">
              <strong>What will happen:</strong>
            </p>
            <ul className="text-sm text-yellow-700 mt-2 list-disc list-inside space-y-1">
              <li>The payment "<strong>{paymentTitle}</strong>" will be created but marked as <span className="font-medium">Settled</span></li>
              <li>An expense transaction will be automatically created for this month</li>
              <li>The next due date will be set to <strong>{formatDate(nextDueDate)}</strong></li>
            </ul>
          </div>
          
          <p className="text-sm text-gray-600">
            Do you want to continue with creating this planned payment?
          </p>
        </div>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default PastDueDateModal; 