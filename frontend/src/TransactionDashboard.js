import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useAuth } from './contexts/AuthContext';
import { getCurrentMonth, isCurrentMonth } from './utils/monthUtils';
import MonthFilter from './components/MonthFilter';
import IncomeValidationModal from './components/IncomeValidationModal';
import OverduePaymentModal from './components/OverduePaymentModal';
import InsufficientBalanceModal from './components/InsufficientBalanceModal';
import BudgetExceedModal from './components/BudgetExceedModal';

const API_URL = '/api/transactions';

// Enhanced Category Select Component with keyboard navigation and shows 5 options before scrolling
const CategorySelect = ({ name, value, onChange, options, required, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const dropdownRef = useRef(null);
  const containerRef = useRef(null);

  const handleSelect = (category) => {
    onChange({ target: { name, value: category } });
    setIsOpen(false);
    setFocusedIndex(-1);
    setSearchTerm('');
  };

  const scrollToOption = (index) => {
    if (dropdownRef.current && index >= 0) {
      const optionElement = dropdownRef.current.children[index];
      if (optionElement) {
        optionElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  };

  const findOptionByChar = (char, startIndex = 0) => {
    const searchChar = char.toLowerCase();
    for (let i = 0; i < options.length; i++) {
      const index = (startIndex + i) % options.length;
      if (options[index].toLowerCase().startsWith(searchChar)) {
        return index;
      }
    }
    return -1;
  };

  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsOpen(true);
        setFocusedIndex(0);
      }
      return;
    }

    switch (e.key) {
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setFocusedIndex(-1);
        setSearchTerm('');
        break;
      
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = focusedIndex < options.length - 1 ? focusedIndex + 1 : 0;
        setFocusedIndex(nextIndex);
        scrollToOption(nextIndex);
        break;
      
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = focusedIndex > 0 ? focusedIndex - 1 : options.length - 1;
        setFocusedIndex(prevIndex);
        scrollToOption(prevIndex);
        break;
      
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < options.length) {
          handleSelect(options[focusedIndex]);
        }
        break;
      
      default:
        // Handle letter/number key presses for quick navigation
        if (e.key.length === 1 && e.key.match(/[a-zA-Z0-9]/)) {
          e.preventDefault();
          
          // Clear existing timeout
          if (searchTimeout) {
            clearTimeout(searchTimeout);
          }
          
          const newSearchTerm = searchTerm + e.key.toLowerCase();
          setSearchTerm(newSearchTerm);
          
          // Find option that starts with the search term
          const foundIndex = findOptionByChar(newSearchTerm);
          if (foundIndex !== -1) {
            setFocusedIndex(foundIndex);
            scrollToOption(foundIndex);
          }
          
          // Reset search term after 1 second
          const timeout = setTimeout(() => {
            setSearchTerm('');
          }, 1000);
          setSearchTimeout(timeout);
        }
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setFocusedIndex(-1);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        className={`banking-select ${className}`}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`Select ${name}`}
      >
        {value || 'Select category...'}
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-xl shadow-medium border border-neutral-200 max-h-60 overflow-auto">
          <div ref={dropdownRef}>
            {options.map((category, index) => (
              <button
                key={category}
                type="button"
                className={`w-full text-left px-4 py-3 hover:bg-primary-50 hover:text-primary-700 transition-colors duration-200 ${
                  index === focusedIndex ? 'bg-primary-50 text-primary-700' : ''
                } ${index === 0 ? 'rounded-t-xl' : ''} ${index === options.length - 1 ? 'rounded-b-xl' : ''}`}
                onClick={() => handleSelect(category)}
                role="option"
                aria-selected={value === category}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

function TransactionDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [form, setForm] = useState({ 
    type: 'expense', 
    amount: '', 
    description: '', 
    category: '',
    id: null 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [filterType, setFilterType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [incomeModal, setIncomeModal] = useState({ isOpen: false, errorType: '', message: '', details: null });
  const [overdueModal, setOverdueModal] = useState({ isOpen: false, overduePayments: [] });
  const [insufficientBalanceModal, setInsufficientBalanceModal] = useState({ isOpen: false, message: '', details: null });
  const [budgetExceedModal, setBudgetExceedModal] = useState({ isOpen: false, budgetInfo: null });
  const { user } = useAuth();

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_URL}/categories`);
      setCategories(res.data.categories);
      // Set default category when categories are loaded
      if (res.data.categories.expense.length > 0) {
        setForm(prev => ({ 
          ...prev, 
          category: prev.category || res.data.categories.expense[0] 
        }));
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  // Fetch transactions with filters
  const fetchTransactions = async (month = selectedMonth, type = filterType, category = filterCategory) => {
    setLoading(true);
    try {
      const params = {};
      if (month) params.month = month;
      if (type) params.type = type;
      if (category) params.category = category;
      
      const res = await axios.get(API_URL, { params });
      setTransactions(res.data.transactions);
      setSummary(res.data.summary);
      setError('');
    } catch (err) {
      setError('Failed to fetch transactions');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    fetchTransactions();
  }, []);

  // Handle month change
  const handleMonthChange = (newMonth) => {
    setSelectedMonth(newMonth);
    fetchTransactions(newMonth, filterType, filterCategory);
    
    // Cancel editing when switching months to prevent confusion
    if (editing) {
      setForm({ 
        type: 'expense', 
        amount: '', 
        description: '', 
        category: categories.expense?.[0] || '', 
        id: null 
      });
      setEditing(false);
    }
  };

  // Handle filter changes
  const handleFilterChange = (newType, newCategory) => {
    setFilterType(newType);
    setFilterCategory(newCategory);
    fetchTransactions(selectedMonth, newType, newCategory);
  };

  // Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'type') {
      // When type changes, update category to first available option for that type
      const availableCategories = categories[value] || [];
      setForm({ 
        ...form, 
        [name]: value,
        category: availableCategories[0] || ''
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Handle transaction submission (with or without budget override)
  const submitTransaction = async (forceBudgetOverride = false) => {
    try {
      const payload = {
        type: form.type,
        amount: parseFloat(form.amount),
        description: form.description,
        category: form.category
      };

      if (forceBudgetOverride) {
        payload.forceBudgetOverride = true;
      }

      if (editing) {
        await axios.put(`${API_URL}/${form.id}`, payload);
      } else {
        await axios.post(API_URL, payload);
      }
      
      // Reset form with default values
      setForm({ 
        type: 'expense', 
        amount: '', 
        description: '', 
        category: categories.expense?.[0] || '', 
        id: null 
      });
      setEditing(false);
      fetchTransactions(selectedMonth, filterType, filterCategory);
      setError('');
      
      // Close any open modals
      setBudgetExceedModal({ isOpen: false, budgetInfo: null });
      
      return true;
    } catch (err) {
      const errorData = err.response?.data;
      
      // Handle income validation errors with modal
      if (errorData?.errorType === 'NO_INCOME' || errorData?.errorType === 'INSUFFICIENT_INCOME') {
        setIncomeModal({
          isOpen: true,
          errorType: errorData.errorType,
          message: errorData.message,
          details: errorData.details || null
        });
      } else if (errorData?.errorType === 'OVERDUE_PLANNED_PAYMENTS') {
        // Handle overdue planned payments error with modal
        setOverdueModal({
          isOpen: true,
          overduePayments: errorData.overduePayments || []
        });
      } else if (errorData?.errorType === 'INSUFFICIENT_BALANCE') {
        // Handle insufficient balance error with modal
        setInsufficientBalanceModal({
          isOpen: true,
          message: errorData.message,
          details: errorData.details || null
        });
      } else if (errorData?.errorType === 'BUDGET_EXCEEDED') {
        // Handle budget exceeded error with modal
        setBudgetExceedModal({
          isOpen: true,
          budgetInfo: errorData.budgetInfo
        });
      } else {
        setError(errorData?.message || 'Failed to save transaction');
      }
      return false;
    }
  };

  // Add or update transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validation
    if (!form.amount || !form.category) {
      setError('Amount and category are required');
      setLoading(false);
      return;
    }

    if (parseFloat(form.amount) <= 0) {
      setError('Amount must be greater than 0');
      setLoading(false);
      return;
    }

    if (form.description && form.description.trim().length > 90) {
      setError('Description cannot exceed 90 characters');
      setLoading(false);
      return;
    }

    await submitTransaction(false);
    setLoading(false);
  };

  // Handle proceeding with budget override
  const handleBudgetOverride = async () => {
    setLoading(true);
    await submitTransaction(true);
    setLoading(false);
  };

  // Edit transaction
  const handleEdit = (transaction) => {
    setForm({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      category: transaction.category,
      id: transaction._id
    });
    setEditing(true);
  };

  // Delete transaction
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchTransactions(selectedMonth, filterType, filterCategory);
      setError('');
    } catch (err) {
      setError('Failed to delete transaction');
    }
    setLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get current available categories based on selected type
  const availableCategories = categories[form.type] || [];

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="banking-card animate-fade-in">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Transaction Dashboard</h2>
              <p className="text-neutral-600">Track your income and expenses with precision</p>
            </div>
            <div className="min-w-0">
              <MonthFilter
                selectedMonth={selectedMonth}
                onMonthChange={handleMonthChange}
                variant="native"
                label="Filter by Month"
                showReturnButton={true}
              />
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Income Card */}
            <div className="banking-card-elevated bg-gradient-to-br from-success-50 to-success-100 border-success-200">
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-success-500 rounded-xl mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <h3 className="text-success-800 font-semibold mb-2">Total Income</h3>
                <p className="text-2xl font-bold text-success-900">
                  {formatCurrency(summary.totalIncome)}
                </p>
              </div>
            </div>
            
            {/* Expense Card */}
            <div className="banking-card-elevated bg-gradient-to-br from-error-50 to-error-100 border-error-200">
              <div className="p-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-error-500 rounded-xl mb-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                </div>
                <h3 className="text-error-800 font-semibold mb-2">Total Expenses</h3>
                <p className="text-2xl font-bold text-error-900">
                  {formatCurrency(summary.totalExpense)}
                </p>
              </div>
            </div>
            
            {/* Balance Card */}
            <div className={`banking-card-elevated ${summary.balance >= 0 
              ? 'bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200' 
              : 'bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200'}`}>
              <div className="p-6 text-center">
                <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl mb-4 ${summary.balance >= 0 
                  ? 'bg-primary-500' : 'bg-warning-500'}`}>
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className={`font-semibold mb-2 ${summary.balance >= 0 ? 'text-primary-800' : 'text-warning-800'}`}>
                  Monthly Balance
                </h3>
                <p className={`text-2xl font-bold ${summary.balance >= 0 ? 'text-primary-900' : 'text-warning-900'}`}>
                  {formatCurrency(summary.balance)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Form - Only show for current month */}
      {!isCurrentMonth(selectedMonth) && (
        <div className="alert-info animate-slide-down">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 10V10" />
            </svg>
            <span>You are viewing transactions from a previous month. To add new transactions, please return to the current month.</span>
          </div>
        </div>
      )}
      
      {isCurrentMonth(selectedMonth) && (
        <div className="banking-card animate-slide-up">
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-10 w-10 bg-gradient-to-r from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mr-4">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-neutral-900">
                  {editing ? 'Edit Transaction' : 'Add New Transaction'}
                </h3>
                <p className="text-neutral-600">
                  {editing ? 'Update your transaction details' : 'Record your income or expense'}
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="banking-label">Transaction Type</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleChange}
                    required
                    className="banking-select"
                  >
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </select>
                </div>
                
                <div>
                  <label className="banking-label">Amount (RM)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500 text-sm">RM</span>
                    </div>
                    <input
                      type="number"
                      name="amount"
                      placeholder="0.00"
                      value={form.amount}
                      onChange={handleChange}
                      min="0.01"
                      step="0.01"
                      required
                      className="banking-input pl-12"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="banking-label">Category</label>
                  <CategorySelect
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    options={availableCategories}
                    required
                    className="banking-select"
                  />
                </div>
              </div>
              
              <div>
                <label className="banking-label">Description <span className="text-neutral-400 text-sm">(Optional)</span></label>
                <input
                  type="text"
                  name="description"
                  placeholder="Enter transaction description (optional)"
                  value={form.description}
                  onChange={handleChange}
                  maxLength={90}
                  className="banking-input"
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-neutral-500">
                    Maximum 90 characters
                  </span>
                  <span className={`text-xs ${form.description.length > 75 ? 'text-warning-600' : 'text-neutral-500'}`}>
                    {form.description.length}/90
                  </span>
                </div>
              </div>
              
              <div className="flex gap-4 pt-4">
                <button 
                  type="submit" 
                  disabled={loading}
                  className={`${editing ? 'btn-secondary' : 'btn-primary'} ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="loading-spinner mr-2"></div>
                      {editing ? 'Updating...' : 'Adding...'}
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={editing ? "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" : "M12 6v6m0 0v6m0-6h6m-6 0H6"} />
                      </svg>
                      {editing ? 'Update Transaction' : 'Add Transaction'}
                    </div>
                  )}
                </button>
                
                {editing && (
                  <button 
                    type="button" 
                    onClick={() => { 
                      setForm({ 
                        type: 'expense', 
                        amount: '', 
                        description: '', 
                        category: categories.expense?.[0] || '', 
                        id: null 
                      }); 
                      setEditing(false); 
                    }} 
                    className="btn-ghost"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className="alert-error animate-slide-down">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        </div>
      )}
      
      {/* Filter Controls */}
      <div className="banking-card">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="h-10 w-10 bg-gradient-to-r from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-neutral-900">Filter Transactions</h3>
              <p className="text-neutral-600">Narrow down your transaction view</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="banking-label">Transaction Type</label>
              <select
                value={filterType}
                onChange={(e) => handleFilterChange(e.target.value, filterCategory)}
                className="banking-select"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            
            <div>
              <label className="banking-label">Category</label>
              <select
                value={filterCategory}
                onChange={(e) => handleFilterChange(filterType, e.target.value)}
                className="banking-select"
              >
                <option value="">All Categories</option>
                {filterType === 'income' && categories.income.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {filterType === 'expense' && categories.expense.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                {!filterType && [
                  ...categories.income.map(cat => <option key={`income-${cat}`} value={cat}>{cat} (Income)</option>),
                  ...categories.expense.map(cat => <option key={`expense-${cat}`} value={cat}>{cat} (Expense)</option>)
                ]}
              </select>
            </div>
            
            <div className="flex items-end">
              <button
                onClick={() => {
                  setFilterType('');
                  setFilterCategory('');
                  fetchTransactions(selectedMonth, '', '');
                }}
                className="btn-ghost w-full"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="banking-card">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="h-10 w-10 bg-gradient-to-r from-accent-500 to-accent-600 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-neutral-900">Transaction History</h3>
              <p className="text-neutral-600">{transactions.length} transaction{transactions.length !== 1 ? 's' : ''} found</p>
            </div>
          </div>
          
          {loading && !transactions.length ? (
            <div className="text-center py-12">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading transactions...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="banking-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th className="text-right">Amount</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction._id}>
                      <td className="text-sm font-mono">{formatDate(transaction.createdAt)}</td>
                      <td>
                        <span className={`status-badge ${
                          transaction.type === 'income' 
                            ? 'status-badge-success' 
                            : 'status-badge-error'
                        }`}>
                          {transaction.type === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td className="font-medium">{transaction.description || 'No description'}</td>
                      <td className="text-neutral-600">{transaction.category}</td>
                      <td className={`text-right font-bold ${
                        transaction.type === 'income' ? 'text-success-600' : 'text-error-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button 
                            onClick={() => handleEdit(transaction)} 
                            disabled={!isCurrentMonth(selectedMonth)}
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              isCurrentMonth(selectedMonth) 
                                ? 'bg-warning-100 text-warning-700 hover:bg-warning-200' 
                                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                            }`}
                            title={!isCurrentMonth(selectedMonth) ? 'Cannot edit transactions from previous months' : 'Edit transaction'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            onClick={() => handleDelete(transaction._id)} 
                            disabled={!isCurrentMonth(selectedMonth)}
                            className={`p-2 rounded-lg transition-colors duration-200 ${
                              isCurrentMonth(selectedMonth) 
                                ? 'bg-error-100 text-error-700 hover:bg-error-200' 
                                : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                            }`}
                            title={!isCurrentMonth(selectedMonth) ? 'Cannot delete transactions from previous months' : 'Delete transaction'}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-neutral-100 rounded-xl flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                          </div>
                          <p className="text-neutral-500 font-medium">No transactions found</p>
                          <p className="text-neutral-400 text-sm">Start by adding your first transaction above!</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Income Validation Modal */}
      <IncomeValidationModal
        isOpen={incomeModal.isOpen}
        onClose={() => setIncomeModal({ isOpen: false, errorType: '', message: '', details: null })}
        errorType={incomeModal.errorType}
        message={incomeModal.message}
        details={incomeModal.details}
      />

      {/* Overdue Payment Modal */}
      <OverduePaymentModal
        isOpen={overdueModal.isOpen}
        onClose={() => setOverdueModal({ isOpen: false, overduePayments: [] })}
        overduePayments={overdueModal.overduePayments}
        actionType="transaction"
      />

      {/* Insufficient Balance Modal */}
      <InsufficientBalanceModal
        isOpen={insufficientBalanceModal.isOpen}
        onClose={() => setInsufficientBalanceModal({ isOpen: false, message: '', details: null })}
        message={insufficientBalanceModal.message}
        details={insufficientBalanceModal.details}
      />

      {/* Budget Exceed Modal */}
      <BudgetExceedModal
        isOpen={budgetExceedModal.isOpen}
        onClose={() => setBudgetExceedModal({ isOpen: false, budgetInfo: null })}
        onProceed={handleBudgetOverride}
        budgetInfo={budgetExceedModal.budgetInfo}
      />
    </div>
  );
}

export default TransactionDashboard; 