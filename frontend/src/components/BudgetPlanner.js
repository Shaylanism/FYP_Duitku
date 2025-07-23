import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = '/api/budgets';
const TRANSACTIONS_API = '/api/transactions';

function BudgetPlanner() {
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [transactionSummary, setTransactionSummary] = useState({});
  const [form, setForm] = useState({ 
    category: '', 
    budgetAmount: '', 
    id: null 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM format
  const [copyLoading, setCopyLoading] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]); // Months with existing budgets

  // Helper functions
  const getCurrentMonth = () => new Date().toISOString().slice(0, 7);
  const isPastMonth = (month) => month < getCurrentMonth();
  const isFutureMonth = (month) => month > getCurrentMonth();

  // Fetch available months with existing budgets
  const fetchAvailableMonths = async () => {
    try {
      const res = await axios.get(`${API_URL}`);
      const allBudgets = res.data.budgets || [];
      
      // Get unique months from past budgets only
      const months = [...new Set(allBudgets
        .map(budget => budget.month)
        .filter(month => isPastMonth(month))
        .sort()
      )];
      
      setAvailableMonths(months);
    } catch (err) {
      console.error('Failed to fetch available months:', err);
    }
  };

  // Fetch categories from transactions API
  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${TRANSACTIONS_API}/categories`);
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

  // Fetch budgets for selected month
  const fetchBudgets = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_URL}?month=${selectedMonth}`);
      setBudgets(res.data.budgets || []);
      setError('');
    } catch (err) {
      // If budgets endpoint doesn't exist yet, just set empty array
      if (err.response?.status === 404) {
        setBudgets([]);
      } else {
        setError('Failed to fetch budgets');
      }
    }
    setLoading(false);
  };

  // Fetch transaction summary for the selected month to compare with budget
  const fetchTransactionSummary = async () => {
    try {
      const res = await axios.get(`${TRANSACTIONS_API}?month=${selectedMonth}`);
      const transactions = res.data.transactions || [];
      
      // Group expenses by category for the selected month
      const summary = {};
      transactions
        .filter(t => t.type === 'expense')
        .forEach(transaction => {
          if (!summary[transaction.category]) {
            summary[transaction.category] = 0;
          }
          summary[transaction.category] += transaction.amount;
        });
      
      setTransactionSummary(summary);
    } catch (err) {
      console.error('Failed to fetch transaction summary:', err);
      setTransactionSummary({});
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchAvailableMonths();
  }, []);

  useEffect(() => {
    fetchBudgets();
    fetchTransactionSummary();
  }, [selectedMonth]);

  // Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Add or update budget
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validation
    if (!form.category || !form.budgetAmount) {
      setError('Category and budget amount are required');
      setLoading(false);
      return;
    }

    if (parseFloat(form.budgetAmount) <= 0) {
      setError('Budget amount must be greater than 0');
      setLoading(false);
      return;
    }

    try {
      const budgetData = {
        category: form.category,
        budgetAmount: parseFloat(form.budgetAmount),
        month: selectedMonth
      };

      if (editing) {
        await axios.put(`${API_URL}/${form.id}`, budgetData);
      } else {
        await axios.post(API_URL, budgetData);
      }
      
      // Reset form
      setForm({ 
        category: categories.expense?.[0] || '', 
        budgetAmount: '', 
        id: null 
      });
      setEditing(false);
      fetchBudgets();
      setError('');
    } catch (err) {
      // For now, we'll simulate the behavior since backend doesn't exist yet
      const newBudget = {
        _id: Date.now().toString(),
        category: form.category,
        budgetAmount: parseFloat(form.budgetAmount),
        month: selectedMonth,
        createdAt: new Date().toISOString()
      };

      if (editing) {
        setBudgets(prev => prev.map(b => b._id === form.id ? {...newBudget, _id: form.id} : b));
      } else {
        setBudgets(prev => [...prev, newBudget]);
      }

      setForm({ 
        category: categories.expense?.[0] || '', 
        budgetAmount: '', 
        id: null 
      });
      setEditing(false);
      setError('');
    }
    setLoading(false);
  };

  // Edit budget
  const handleEdit = (budget) => {
    setForm({
      category: budget.category,
      budgetAmount: budget.budgetAmount.toString(),
      id: budget._id
    });
    setEditing(true);
  };

  // Delete budget
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchBudgets();
      setError('');
    } catch (err) {
      // Simulate deletion for now
      setBudgets(prev => prev.filter(b => b._id !== id));
      setError('');
    }
    setLoading(false);
  };

  // Copy budgets from selected month to current month
  const handleCopyBudgets = async (sourceMonth) => {
    if (!window.confirm(`Are you sure you want to copy budgets from ${new Date(sourceMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} to current month?`)) {
      return;
    }

    setCopyLoading(true);
    try {
      await axios.post(`${API_URL}/copy`, { sourceMonth });
      
      // Refresh budgets and available months
      fetchBudgets();
      fetchAvailableMonths();
      setError('');
      
      // Switch to current month to show copied budgets
      setSelectedMonth(getCurrentMonth());
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to copy budgets');
    }
    setCopyLoading(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount || 0);
  };

  const getSpentAmount = (category) => {
    return transactionSummary[category] || 0;
  };

  const getBudgetStatus = (budgetAmount, spentAmount) => {
    const percentage = (spentAmount / budgetAmount) * 100;
    if (percentage <= 50) return { color: 'green', status: 'On Track' };
    if (percentage <= 80) return { color: 'yellow', status: 'Warning' };
    if (percentage <= 100) return { color: 'orange', status: 'Near Limit' };
    return { color: 'red', status: 'Over Budget' };
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Budget Planner</h2>
            <p className="text-gray-600">Plan and track your monthly spending</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Month</label>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Budget Form or Past Month Info */}
        {isPastMonth(selectedMonth) ? (
          <div className="mb-6 p-5 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="mt-0 mb-2 text-blue-800">Viewing Past Month Budget</h3>
                <p className="text-blue-600 mb-4">
                  You're viewing budgets for {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. 
                  Past month budgets cannot be modified but can be used for comparison or copied to the current month.
                </p>
                
                {budgets.length > 0 && (
                  <button
                    onClick={() => handleCopyBudgets(selectedMonth)}
                    disabled={copyLoading}
                    className={`px-4 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 transition-colors ${
                      copyLoading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {copyLoading ? 'Copying...' : 'Copy to Current Month'}
                  </button>
                )}
              </div>
              
              {availableMonths.length > 1 && (
                <div className="ml-4">
                  <label className="block text-sm font-medium text-blue-700 mb-2">Copy from other month:</label>
                  <select
                    onChange={(e) => e.target.value && handleCopyBudgets(e.target.value)}
                    className="px-3 py-2 border border-blue-300 rounded focus:outline-none focus:border-blue-500"
                    value=""
                  >
                    <option value="">Select month to copy...</option>
                    {availableMonths
                      .filter(month => month !== selectedMonth)
                      .map(month => (
                        <option key={month} value={month}>
                          {new Date(month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mb-6 p-5 bg-gray-50 rounded-lg">
            <h3 className="mt-0 mb-4">{editing ? 'Edit Budget' : 'Add New Budget'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block mb-1 font-medium">Category</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="">Select category...</option>
                {categories.expense.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Budget Amount (RM)</label>
              <input
                type="number"
                name="budgetAmount"
                placeholder="0.00"
                value={form.budgetAmount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
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
              {loading ? (editing ? 'Updating...' : 'Adding...') : (editing ? 'Update Budget' : 'Add Budget')}
            </button>
            {editing && (
              <button 
                type="button" 
                onClick={() => { 
                  setForm({ 
                    category: categories.expense?.[0] || '', 
                    budgetAmount: '', 
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

        {/* Copy from past month option when current month has no budgets */}
        {!isPastMonth(selectedMonth) && budgets.length === 0 && availableMonths.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="mt-0 mb-2 text-green-800">Quick Start</h4>
            <p className="text-green-600 mb-3">No budgets found for this month. You can copy budgets from a previous month to get started quickly.</p>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-green-700">Copy from:</label>
              <select
                onChange={(e) => e.target.value && handleCopyBudgets(e.target.value)}
                className="px-3 py-2 border border-green-300 rounded focus:outline-none focus:border-green-500"
                value=""
                disabled={copyLoading}
              >
                <option value="">Select a month...</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>
                    {new Date(month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {error && <div className="text-red-700 mb-3 p-2 bg-red-50 rounded">{error}</div>}
        
        {/* Budgets Table */}
        {loading && !budgets.length ? (
          <div className="text-center py-5">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-b-2 border-gray-300 text-left py-3 px-2">Category</th>
                  <th className="border-b-2 border-gray-300 text-right py-3 px-2">Budget</th>
                  <th className="border-b-2 border-gray-300 text-right py-3 px-2">Spent</th>
                  <th className="border-b-2 border-gray-300 text-right py-3 px-2">Remaining</th>
                  <th className="border-b-2 border-gray-300 text-center py-3 px-2">Status</th>
                  <th className="border-b-2 border-gray-300 text-center py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((budget) => {
                  const spentAmount = getSpentAmount(budget.category);
                  const remaining = budget.budgetAmount - spentAmount;
                  const status = getBudgetStatus(budget.budgetAmount, spentAmount);
                  
                  return (
                    <tr key={budget._id} className="border-b border-gray-100">
                      <td className="py-3 px-2 font-medium">{budget.category}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(budget.budgetAmount)}</td>
                      <td className="py-3 px-2 text-right">{formatCurrency(spentAmount)}</td>
                      <td className={`py-3 px-2 text-right font-medium ${
                        remaining >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(remaining)}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          status.color === 'green' ? 'bg-green-200 text-green-800' :
                          status.color === 'yellow' ? 'bg-yellow-200 text-yellow-800' :
                          status.color === 'orange' ? 'bg-orange-200 text-orange-800' :
                          'bg-red-200 text-red-800'
                        }`}>
                          {status.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        {isPastMonth(selectedMonth) ? (
                          <span className="text-gray-500 text-xs">View Only</span>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleEdit(budget)} 
                              className="mr-2 px-3 py-1 bg-yellow-500 text-gray-900 border-none rounded cursor-pointer text-xs hover:bg-yellow-600 transition-colors"
                            >
                              Edit
                            </button>
                            <button 
                              onClick={() => handleDelete(budget._id)} 
                              className="px-3 py-1 bg-red-600 text-white border-none rounded cursor-pointer text-xs hover:bg-red-700 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {budgets.length === 0 && (
                  <tr>
                    <td colSpan="6" className="text-center text-gray-500 py-5">
                      No budgets found for {new Date(selectedMonth).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}. Add your first budget above!
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

export default BudgetPlanner; 