import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getCurrentMonth } from '../utils/monthUtils';
import MonthFilter from './MonthFilter';

const API_URL = '/api/transaction-history';

function TransactionHistoryModal({ isOpen, onClose }) {
  const [history, setHistory] = useState([]);
  const [availableCategories, setAvailableCategories] = useState([]);
  const [predefinedCategories, setPredefinedCategories] = useState({ income: [], expense: [] });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    month: getCurrentMonth(),
    action: '',
    type: '',
    category: '',
    page: 1,
    limit: 20
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalEntries: 0,
    hasNextPage: false,
    hasPrevPage: false
  });

  // Fetch transaction history
  const fetchHistory = async (newFilters = filters) => {
    if (!isOpen) return;
    
    setLoading(true);
    try {
      const params = {};
      if (newFilters.month) params.month = newFilters.month;
      if (newFilters.action) params.action = newFilters.action;
      if (newFilters.type) params.type = newFilters.type;
      if (newFilters.category) params.category = newFilters.category;
      params.page = newFilters.page;
      params.limit = newFilters.limit;

      const res = await axios.get(API_URL, { params });
      setHistory(res.data.history);
      setPagination(res.data.pagination);
      setError('');
    } catch (err) {
      console.error('Failed to fetch transaction history:', err);
      setError('Failed to load transaction history');
    }
    setLoading(false);
  };

  // Fetch available categories from transaction history
  const fetchAvailableCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setAvailableCategories(res.data.categories);
    } catch (err) {
      console.error('Failed to fetch available categories:', err);
    }
  };

  // Fetch predefined categories by type
  const fetchPredefinedCategories = async () => {
    try {
      const res = await axios.get('/api/transactions/categories');
      setPredefinedCategories(res.data.categories);
    } catch (err) {
      console.error('Failed to fetch predefined categories:', err);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
      fetchAvailableCategories();
      fetchPredefinedCategories();
    }
  }, [isOpen]);

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    let newFilters = { ...filters, [key]: value, page: 1 };
    
    // If type changes, reset category filter since available categories will change
    if (key === 'type') {
      newFilters = { ...newFilters, category: '' };
    }
    
    setFilters(newFilters);
    fetchHistory(newFilters);
  };

  // Get available categories based on selected type
  const getFilteredCategories = () => {
    if (filters.type === 'income') {
      return predefinedCategories.income || [];
    } else if (filters.type === 'expense') {
      return predefinedCategories.expense || [];
    } else {
      // If no type selected, show all available categories from history
      return availableCategories;
    }
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    const newFilters = { ...filters, page: newPage };
    setFilters(newFilters);
    fetchHistory(newFilters);
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  // Get action badge color
  const getActionBadgeColor = (action) => {
    switch (action) {
      case 'CREATE':
        return 'status-badge-success';
      case 'UPDATE':
        return 'status-badge-warning';
      case 'DELETE':
        return 'status-badge-error';
      case 'SETTLE_PLANNED_PAYMENT':
      case 'RECEIVE_PLANNED_PAYMENT':
        return 'status-badge-primary';
      default:
        return 'status-badge';
    }
  };

  // Get action icon
  const getActionIcon = (action) => {
    switch (action) {
      case 'CREATE':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        );
      case 'UPDATE':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'DELETE':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        );
      case 'SETTLE_PLANNED_PAYMENT':
      case 'RECEIVE_PLANNED_PAYMENT':
        return (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 10V10" />
          </svg>
        );
      default:
        return null;
    }
  };

  // Render change details for updates
  const renderChangeDetails = (entry) => {
    if (entry.action !== 'UPDATE' || !entry.changeSummary) {
      return null;
    }

    return (
      <div className="mt-2 p-3 bg-neutral-50 rounded-lg">
        <h5 className="text-sm font-medium text-neutral-700 mb-2">Changes:</h5>
        <ul className="text-sm text-neutral-600 space-y-1">
          {entry.changeSummary.map((change, index) => (
            <li key={index} className="flex items-start">
              <span className="w-2 h-2 bg-warning-400 rounded-full mt-2 mr-2 flex-shrink-0"></span>
              {change}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // Render planned payment details
  const renderPlannedPaymentDetails = (entry) => {
    if (!entry.plannedPaymentData) {
      return null;
    }

    const ppData = entry.plannedPaymentData;
    return (
      <div className="mt-2 p-3 bg-primary-50 rounded-lg">
        <h5 className="text-sm font-medium text-primary-700 mb-2">Planned Payment Details:</h5>
        <div className="text-sm text-primary-600 space-y-1">
          <p><span className="font-medium">Title:</span> {ppData.title}</p>
          <p><span className="font-medium">Amount:</span> {formatCurrency(ppData.amount)}</p>
          <p><span className="font-medium">Category:</span> {ppData.category}</p>
          <p><span className="font-medium">Due Day:</span> {ppData.dueDay}</p>
          {ppData.description && (
            <p><span className="font-medium">Description:</span> {ppData.description}</p>
          )}
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-neutral-500 bg-opacity-75 transition-opacity" 
          onClick={onClose}
        ></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-6xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 pt-6 pb-4 border-b border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-10 w-10 bg-gradient-to-r from-accent-500 to-accent-600 rounded-xl flex items-center justify-center mr-4">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-neutral-900">Transaction History</h3>
                  <p className="text-neutral-600">Complete record of all transaction changes</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="rounded-lg p-2 hover:bg-neutral-100 transition-colors duration-200"
              >
                <svg className="w-6 h-6 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>


          </div>

          {/* Filters */}
          <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 items-end">
              {/* Filter by Month */}
              <div>
                <MonthFilter
                  selectedMonth={filters.month}
                  onMonthChange={(month) => handleFilterChange('month', month)}
                  variant="native"
                  showReturnButton={false}
                />
              </div>
              
              {/* Type Filter */}
              <div>
                <label className="banking-label">Type</label>
                <select
                  value={filters.type}
                  onChange={(e) => handleFilterChange('type', e.target.value)}
                  className="banking-select"
                >
                  <option value="">All Types</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </div>
              
              {/* Category Filter */}
              <div>
                <label className="banking-label">Category</label>
                <select
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                  className="banking-select"
                  disabled={!filters.type && availableCategories.length === 0}
                >
                  <option value="">
                    {!filters.type ? 'Select type first...' : 'All Categories'}
                  </option>
                  {getFilteredCategories().map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              {/* Action Filter */}
              <div>
                <label className="banking-label">Action</label>
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className="banking-select"
                >
                  <option value="">All Actions</option>
                  <option value="CREATE">Created</option>
                  <option value="UPDATE">Updated</option>
                  <option value="DELETE">Deleted</option>
                  <option value="SETTLE_PLANNED_PAYMENT">Settled Payment</option>
                  <option value="RECEIVE_PLANNED_PAYMENT">Received Payment</option>
                </select>
              </div>
              
              {/* Clear Filters Button */}
              <div>
                <button
                  onClick={() => {
                    setFilters({ month: '', action: '', type: '', category: '', page: 1, limit: 20 });
                    fetchHistory({ month: '', action: '', type: '', category: '', page: 1, limit: 20 });
                  }}
                  className="btn-ghost px-4 py-2 text-sm w-full"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="bg-white px-6 py-4 max-h-96 overflow-y-auto">
            {error && (
              <div className="alert-error mb-4">
                {error}
              </div>
            )}

            {loading ? (
              <div className="text-center py-12">
                <div className="loading-spinner mx-auto mb-4"></div>
                <p className="text-neutral-600">Loading transaction history...</p>
              </div>
            ) : history.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-neutral-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-neutral-500 font-medium">No history found</p>
                <p className="text-neutral-400 text-sm">No transaction changes match your current filters</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((entry) => (
                  <div key={entry._id} className="border border-neutral-200 rounded-lg p-4 hover:bg-neutral-50 transition-colors duration-200">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 flex-1">
                        <div className="flex-shrink-0">
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium status-badge ${getActionBadgeColor(entry.action)}`}>
                            {getActionIcon(entry.action)}
                            <span>{entry.actionDescription}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-900">{entry.description}</p>
                          <p className="text-xs text-neutral-500 mt-1">{entry.formattedDate}</p>
                          
                          {/* Transaction details */}
                          {entry.newData && (
                            <div className="mt-2 p-3 bg-success-50 rounded-lg">
                              <h5 className="text-sm font-medium text-success-700 mb-2">Transaction Details:</h5>
                              <div className="text-sm text-success-600">
                                <p><span className="font-medium">Type:</span> {entry.newData.type === 'income' ? 'Income' : 'Expense'}</p>
                                <p><span className="font-medium">Amount:</span> {formatCurrency(entry.newData.amount)}</p>
                                <p><span className="font-medium">Category:</span> {entry.newData.category}</p>
                                {entry.newData.description && (
                                  <p><span className="font-medium">Description:</span> {entry.newData.description}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Deleted transaction details */}
                          {entry.action === 'DELETE' && entry.previousData && (
                            <div className="mt-2 p-3 bg-error-50 rounded-lg">
                              <h5 className="text-sm font-medium text-error-700 mb-2">Deleted Transaction:</h5>
                              <div className="text-sm text-error-600">
                                <p><span className="font-medium">Type:</span> {entry.previousData.type === 'income' ? 'Income' : 'Expense'}</p>
                                <p><span className="font-medium">Amount:</span> {formatCurrency(entry.previousData.amount)}</p>
                                <p><span className="font-medium">Category:</span> {entry.previousData.category}</p>
                                {entry.previousData.description && (
                                  <p><span className="font-medium">Description:</span> {entry.previousData.description}</p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Change details for updates */}
                          {renderChangeDetails(entry)}

                          {/* Planned payment details */}
                          {renderPlannedPaymentDetails(entry)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="bg-neutral-50 px-6 py-4 border-t border-neutral-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={!pagination.hasPrevPage}
                    className="btn-ghost px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-neutral-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={!pagination.hasNextPage}
                    className="btn-ghost px-3 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <p className="text-sm text-neutral-600">
                  {pagination.totalEntries} total entries
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TransactionHistoryModal;