import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './contexts/AuthContext';
import { getCurrentMonth, isCurrentMonth } from './utils/monthUtils';
import MonthFilter from './components/MonthFilter';

const API_URL = '/api/transactions';

// Custom Category Select Component that shows only 3 options before scrolling
const CategorySelect = ({ name, value, onChange, options, required, className }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (category) => {
    onChange({ target: { name, value: category } });
    setIsOpen(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.category-dropdown')) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative category-dropdown">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        className={`${className} bg-white cursor-pointer flex items-center justify-between`}
      >
        <span className={value ? 'text-gray-900' : 'text-gray-500'}>
          {value || 'Select category...'}
        </span>
        <svg 
          className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg">
          <div className="max-h-32 overflow-y-auto"> {/* Shows ~4 options before scroll */}
            {options.length === 0 ? (
              <div className="px-3 py-2 text-gray-500">Loading categories...</div>
            ) : (
              options.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => handleSelect(category)}
                  className={`w-full text-left px-3 py-2 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none ${
                    value === category ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                  }`}
                >
                  {category}
                </button>
              ))
            )}
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

  // Add or update transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validation
    if (!form.amount || !form.description || !form.category) {
      setError('Amount, description, and category are required');
      setLoading(false);
      return;
    }

    if (parseFloat(form.amount) <= 0) {
      setError('Amount must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      if (editing) {
        await axios.put(`${API_URL}/${form.id}`, {
          type: form.type,
          amount: parseFloat(form.amount),
          description: form.description,
          category: form.category
        });
      } else {
        await axios.post(API_URL, {
          type: form.type,
          amount: parseFloat(form.amount),
          description: form.description,
          category: form.category
        });
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
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save transaction');
    }
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
    return new Intl.NumberFormat('en-US', {
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
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Transaction Dashboard</h2>
            <p className="text-gray-600">Manage your income and expenses</p>
          </div>
          <MonthFilter
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
            variant="native"
            label="Filter by Month"
            showReturnButton={true}
          />
        </div>

        {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="p-4 bg-green-50 rounded-lg text-center">
          <h3 className="mb-2 mt-0 text-green-800">Total Income</h3>
          <p className="m-0 text-2xl font-bold text-green-900">
            {formatCurrency(summary.totalIncome)}
          </p>
        </div>
        <div className="p-4 bg-red-50 rounded-lg text-center">
          <h3 className="mb-2 mt-0 text-red-800">Total Expenses</h3>
          <p className="m-0 text-2xl font-bold text-red-900">
            {formatCurrency(summary.totalExpense)}
          </p>
        </div>
        <div className={`p-4 rounded-lg text-center ${summary.balance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <h3 className={`mb-2 mt-0 ${summary.balance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>Balance</h3>
          <p className={`m-0 text-2xl font-bold ${summary.balance >= 0 ? 'text-blue-900' : 'text-orange-900'}`}>
            {formatCurrency(summary.balance)}
          </p>
        </div>
      </div>

      {/* Transaction Form - Only show for current month */}
      {!isCurrentMonth(selectedMonth) && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-blue-800 text-sm mb-0">
            📅 You are viewing transactions from a previous month. To add new transactions, please return to the current month.
          </p>
        </div>
      )}
      {isCurrentMonth(selectedMonth) && (
        <form onSubmit={handleSubmit} className="mb-6 p-5 bg-gray-50 rounded-lg">
          <h3 className="mt-0 mb-4">{editing ? 'Edit Transaction' : 'Add New Transaction'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block mb-1 font-medium">Type</label>
              <select
                name="type"
                value={form.type}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Amount (RM)</label>
              <input
                type="number"
                name="amount"
                placeholder="0.00"
                value={form.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 box-border"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Category</label>
              <CategorySelect
                name="category"
                value={form.category}
                onChange={handleChange}
                options={availableCategories}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-1 font-medium">Description</label>
            <input
              type="text"
              name="description"
              placeholder="Enter transaction description"
              value={form.description}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 box-border"
            />
          </div>
          <div className="flex gap-2">
            <button 
              type="submit" 
              disabled={loading}
              className={`px-4 py-2 border-none rounded cursor-pointer transition-colors ${
                editing 
                  ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-600' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              } ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? (editing ? 'Updating...' : 'Adding...') : (editing ? 'Update Transaction' : 'Add Transaction')}
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
                className="px-4 py-2 bg-gray-600 text-white border-none rounded cursor-pointer hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      )}

      {error && <div className="text-red-700 mb-3 p-2 bg-red-50 rounded">{error}</div>}
      
      {/* Filter Controls */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Filter Transactions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Transaction Type</label>
            <select
              value={filterType}
              onChange={(e) => handleFilterChange(e.target.value, filterCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Category</label>
            <select
              value={filterCategory}
              onChange={(e) => handleFilterChange(filterType, e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
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
              className="w-full px-4 py-2 bg-gray-600 text-white border-none rounded cursor-pointer hover:bg-gray-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      {loading && !transactions.length ? (
        <div className="text-center py-5">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border-b-2 border-gray-300 text-left py-3 px-2">Date</th>
                <th className="border-b-2 border-gray-300 text-left py-3 px-2">Type</th>
                <th className="border-b-2 border-gray-300 text-left py-3 px-2">Description</th>
                <th className="border-b-2 border-gray-300 text-left py-3 px-2">Category</th>
                <th className="border-b-2 border-gray-300 text-right py-3 px-2">Amount</th>
                <th className="border-b-2 border-gray-300 text-center py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id} className="border-b border-gray-100">
                  <td className="py-3 px-2 text-sm">{formatDate(transaction.createdAt)}</td>
                  <td className="py-3 px-2">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      transaction.type === 'income' 
                        ? 'bg-green-200 text-green-800' 
                        : 'bg-red-200 text-red-800'
                    }`}>
                      {transaction.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                  </td>
                  <td className="py-3 px-2">{transaction.description}</td>
                  <td className="py-3 px-2 text-gray-600">{transaction.category}</td>
                  <td className={`py-3 px-2 text-right font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                  </td>
                  <td className="py-3 px-2 text-center">
                    <button 
                      onClick={() => handleEdit(transaction)} 
                      disabled={!isCurrentMonth(selectedMonth)}
                      className={`mr-2 px-3 py-1 border-none rounded text-xs transition-colors ${
                        isCurrentMonth(selectedMonth) 
                          ? 'bg-yellow-500 text-gray-900 cursor-pointer hover:bg-yellow-600' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={!isCurrentMonth(selectedMonth) ? 'Cannot edit transactions from previous months' : ''}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(transaction._id)} 
                      disabled={!isCurrentMonth(selectedMonth)}
                      className={`px-3 py-1 border-none rounded text-xs transition-colors ${
                        isCurrentMonth(selectedMonth) 
                          ? 'bg-red-600 text-white cursor-pointer hover:bg-red-700' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      title={!isCurrentMonth(selectedMonth) ? 'Cannot delete transactions from previous months' : ''}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center text-gray-500 py-5">
                    No transactions found. Add your first transaction above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      </div>
    </div>
  );
}

export default TransactionDashboard; 