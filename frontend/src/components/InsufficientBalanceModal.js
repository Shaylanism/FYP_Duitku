import React from 'react';
import { formatCurrency } from '../utils/formatters';

const InsufficientBalanceModal = ({ isOpen, onClose, details, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0 w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">
                Insufficient Balance
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                You don't have enough funds to settle this payment.
              </p>
            </div>
          </div>
        </div>

        <div className="p-6">
          <p className="text-gray-700 mb-4">
            {message}
          </p>

          {details && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-orange-900 mb-3">Monthly Balance Summary:</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-orange-700">Monthly Income:</span>
                  <span className="font-medium text-green-700">{formatCurrency(details.monthlyIncome || details.totalIncome || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Monthly Expenses:</span>
                  <span className="font-medium text-red-700">{formatCurrency(details.monthlyExpenses || details.totalExpenses || 0)}</span>
                </div>
                <div className="flex justify-between border-t border-orange-300 pt-2">
                  <span className="text-orange-800 font-medium">Available Balance:</span>
                  <span className="font-bold text-orange-900">{formatCurrency(details.availableBalance || details.currentBalance || 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-orange-700">Requested Amount:</span>
                  <span className="font-medium text-orange-800">{formatCurrency(details.requestedAmount || details.requiredAmount || 0)}</span>
                </div>
                {details.month && (
                  <div className="flex justify-between">
                    <span className="text-orange-700">Month:</span>
                    <span className="font-medium text-orange-800">{details.month}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="ml-3">
                <h4 className="text-sm font-medium text-blue-900">What you can do:</h4>
                <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
                  <li>Add more income transactions to increase your balance</li>
                  <li>Wait until you receive more income before settling this payment</li>
                  <li>Consider if this is an essential expense that needs immediate settlement</li>
                </ul>
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

export default InsufficientBalanceModal;