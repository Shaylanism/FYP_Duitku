import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './contexts/AuthContext';

const API_URL = '/api/transactions';

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
  const { user, logout } = useAuth();

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

  // Fetch transactions
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
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
      fetchTransactions();
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
      fetchTransactions();
      setError('');
    } catch (err) {
      setError('Failed to delete transaction');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
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
    <div className="max-w-6xl mx-auto my-8 p-5 bg-white rounded-lg shadow-md">
      {/* Header with user info and logout */}
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <div>
          <h2 className="text-2xl font-bold m-0">Transaction Dashboard</h2>
          <p className="text-gray-600 mt-1 mb-0">Welcome back, {user?.name}</p>
        </div>
        <button 
          onClick={handleLogout}
          className="px-4 py-2 bg-red-600 text-white border-none rounded cursor-pointer hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
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

      {/* Transaction Form */}
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
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            >
              {availableCategories.length === 0 && (
                <option value="">Loading categories...</option>
              )}
              {availableCategories.map(category => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
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

      {error && <div className="text-red-700 mb-3 p-2 bg-red-50 rounded">{error}</div>}
      
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
                      className="mr-2 px-3 py-1 bg-yellow-500 text-gray-900 border-none rounded cursor-pointer text-xs hover:bg-yellow-600 transition-colors"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(transaction._id)} 
                      className="px-3 py-1 bg-red-600 text-white border-none rounded cursor-pointer text-xs hover:bg-red-700 transition-colors"
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
  );
}

export default TransactionDashboard; 