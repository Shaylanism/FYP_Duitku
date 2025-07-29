import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  getCurrentMonth, 
  isPastMonth, 
  isFutureMonth, 
  formatMonthDisplay,
  getAvailableMonthsFromItems 
} from '../utils/monthUtils';
import MonthFilter from './MonthFilter';
import BudgetWarningModal from './BudgetWarningModal';

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
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth()); // YYYY-MM format
  const [copyLoading, setCopyLoading] = useState(false);
  const [availableMonths, setAvailableMonths] = useState([]); // Months with existing budgets
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [transactionImpact, setTransactionImpact] = useState(null);
  const [pendingBudgetData, setPendingBudgetData] = useState(null);

  // Fetch available months with existing budgets
  const fetchAvailableMonths = async () => {
    try {
      const res = await axios.get(`${API_URL}`);
      const allBudgets = res.data.budgets || [];
      
      // Get unique months from past budgets only
      const months = getAvailableMonthsFromItems(allBudgets, true);
      
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

  // Check transaction impact before creating budget
  const checkTransactionImpact = async (category, month) => {
    try {
      const res = await axios.get(`${API_URL}/check-impact?category=${encodeURIComponent(category)}&month=${month}`);
      return res.data;
    } catch (err) {
      if (err.response?.data?.budgetExists) {
        throw new Error(err.response.data.message);
      }
      // If error is not about existing budget, return no impact (no transactions)
      return { hasTransactions: false, totalSpent: 0 };
    }
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

    const budgetData = {
      category: form.category,
      budgetAmount: parseFloat(form.budgetAmount),
      month: selectedMonth
    };

    try {
      // If editing, proceed directly without checking transactions
      if (editing) {
        await axios.put(`${API_URL}/${form.id}`, budgetData);
        // Reset form
        setForm({ 
          category: categories.expense?.[0] || '', 
          budgetAmount: '', 
          id: null 
        });
        setEditing(false);
        fetchBudgets();
        setError('');
        setLoading(false);
        return;
      }

      // For new budgets, check transaction impact first
      const impact = await checkTransactionImpact(form.category, selectedMonth);
      
      if (impact.hasTransactions) {
        // Show warning modal
        setTransactionImpact(impact);
        setPendingBudgetData(budgetData);
        setShowWarningModal(true);
        setLoading(false);
        return;
      }

      // No existing transactions, proceed with budget creation
      await createBudgetDirectly(budgetData);
      
    } catch (err) {
      setError(err.message || 'Failed to create budget');
      setLoading(false);
    }
  };

  // Create budget directly (used after confirmation or when no transactions exist)
  const createBudgetDirectly = async (budgetData) => {
    try {
      await axios.post(API_URL, budgetData);
      
      // Reset form
      setForm({ 
        category: categories.expense?.[0] || '', 
        budgetAmount: '', 
        id: null 
      });
      setEditing(false);
      fetchBudgets();
      setError('');
      setLoading(false);
    } catch (err) {
      // Fallback for simulation when backend is not fully connected
      const newBudget = {
        _id: Date.now().toString(),
        category: budgetData.category,
        budgetAmount: budgetData.budgetAmount,
        month: budgetData.month,
        createdAt: new Date().toISOString()
      };

      setBudgets(prev => [...prev, newBudget]);
      setForm({ 
        category: categories.expense?.[0] || '', 
        budgetAmount: '', 
        id: null 
      });
      setEditing(false);
      setError('');
      setLoading(false);
    }
  };

  // Handle modal proceed
  const handleModalProceed = () => {
    setShowWarningModal(false);
    if (pendingBudgetData) {
      createBudgetDirectly(pendingBudgetData);
      setPendingBudgetData(null);
    }
    setTransactionImpact(null);
  };

  // Handle modal cancel
  const handleModalCancel = () => {
    setShowWarningModal(false);
    setPendingBudgetData(null);
    setTransactionImpact(null);
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
    if (!window.confirm(`Are you sure you want to copy budgets from ${formatMonthDisplay(sourceMonth)} to current month?`)) {
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
    return new Intl.NumberFormat('en-MY', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount || 0);
  };

  const getSpentAmount = (category) => {
    return transactionSummary[category] || 0;
  };

  const getBudgetStatus = (budgetAmount, spentAmount) => {
    const percentage = (spentAmount / budgetAmount) * 100;
    if (percentage <= 50) return { color: 'success', status: 'On Track' };
    if (percentage <= 80) return { color: 'warning', status: 'Warning' };
    if (percentage <= 100) return { color: 'error', status: 'Near Limit' };
    return { color: 'error', status: 'Over Budget' };
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="banking-card animate-fade-in">
        <div className="p-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-neutral-900 mb-2">Budget Planner</h2>
              <p className="text-neutral-600">Plan and track your monthly spending with precision</p>
            </div>
            <div className="min-w-0">
              <MonthFilter
                selectedMonth={selectedMonth}
                onMonthChange={setSelectedMonth}
                variant="native"
                label="Select Month"
                showReturnButton={true}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Budget Form or Past Month Info */}
      {isPastMonth(selectedMonth) ? (
        <div className="alert-info animate-slide-down">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 10V10" />
                </svg>
                <span className="font-semibold">Viewing Past Month Budget</span>
              </div>
              <p className="mb-4">
                You're viewing budgets for {formatMonthDisplay(selectedMonth)}. 
                Past month budgets cannot be modified but can be used for comparison or copied to the current month.
              </p>
              
              {budgets.length > 0 && (
                <button
                  onClick={() => handleCopyBudgets(selectedMonth)}
                  disabled={copyLoading}
                  className={`btn-primary ${copyLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {copyLoading ? (
                    <div className="flex items-center">
                      <div className="loading-spinner mr-2"></div>
                      Copying...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy to Current Month
                    </div>
                  )}
                </button>
              )}
            </div>
            
            {availableMonths.length > 1 && (
              <div className="ml-6 min-w-0">
                <label className="banking-label">Copy from other month:</label>
                <select
                  onChange={(e) => e.target.value && handleCopyBudgets(e.target.value)}
                  className="banking-select"
                  value=""
                >
                  <option value="">Select month to copy...</option>
                  {availableMonths
                    .filter(month => month !== selectedMonth)
                    .map(month => (
                      <option key={month} value={month}>
                        {formatMonthDisplay(month)}
                      </option>
                    ))}
                </select>
              </div>
            )}
          </div>
        </div>
      ) : (
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
                  {editing ? 'Edit Budget' : 'Add New Budget'}
                </h3>
                <p className="text-neutral-600">
                  {editing ? 'Update your budget allocation' : 'Set spending limits for your categories'}
                </p>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="banking-label">Category</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleChange}
                    required
                    className="banking-select"
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
                  <label className="banking-label">Budget Amount (RM)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <span className="text-neutral-500 text-sm">RM</span>
                    </div>
                    <input
                      type="number"
                      name="budgetAmount"
                      placeholder="0.00"
                      value={form.budgetAmount}
                      onChange={handleChange}
                      min="0.01"
                      step="0.01"
                      required
                      className="banking-input pl-12"
                    />
                  </div>
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
                      {editing ? 'Update Budget' : 'Add Budget'}
                    </div>
                  )}
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

      {/* Copy from past month option when current month has no budgets */}
      {!isPastMonth(selectedMonth) && budgets.length === 0 && availableMonths.length > 0 && (
        <div className="alert-success animate-slide-down">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-3">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-semibold">Quick Start</span>
              </div>
              <p className="mb-4">No budgets found for this month. You can copy budgets from a previous month to get started quickly.</p>
            </div>
            
            <div className="ml-6 min-w-0">
              <label className="banking-label">Copy from:</label>
              <select
                onChange={(e) => e.target.value && handleCopyBudgets(e.target.value)}
                className="banking-select"
                value=""
                disabled={copyLoading}
              >
                <option value="">Select a month...</option>
                {availableMonths.map(month => (
                  <option key={month} value={month}>
                    {formatMonthDisplay(month)}
                  </option>
                ))}
              </select>
            </div>
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
      
      {/* Budgets Table */}
      <div className="banking-card">
        <div className="p-6">
          <div className="flex items-center mb-6">
            <div className="h-10 w-10 bg-gradient-to-r from-accent-500 to-accent-600 rounded-xl flex items-center justify-center mr-4">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-neutral-900">Budget Overview</h3>
              <p className="text-neutral-600">{budgets.length} budget{budgets.length !== 1 ? 's' : ''} for {formatMonthDisplay(selectedMonth)}</p>
            </div>
          </div>
          
          {loading && !budgets.length ? (
            <div className="text-center py-12">
              <div className="loading-spinner mx-auto mb-4"></div>
              <p className="text-neutral-600">Loading budgets...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="banking-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th className="text-right">Budget</th>
                    <th className="text-right">Spent</th>
                    <th className="text-right">Remaining</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.map((budget) => {
                    const spentAmount = getSpentAmount(budget.category);
                    const remaining = budget.budgetAmount - spentAmount;
                    const status = getBudgetStatus(budget.budgetAmount, spentAmount);
                    
                    return (
                      <tr key={budget._id}>
                        <td className="font-medium">{budget.category}</td>
                        <td className="text-right font-bold">{formatCurrency(budget.budgetAmount)}</td>
                        <td className="text-right">{formatCurrency(spentAmount)}</td>
                        <td className={`text-right font-bold ${
                          remaining >= 0 ? 'text-success-600' : 'text-error-600'
                        }`}>
                          {formatCurrency(remaining)}
                        </td>
                        <td className="text-center">
                          <span className={`status-badge status-badge-${status.color}`}>
                            {status.status}
                          </span>
                        </td>
                        <td className="text-center">
                          {isPastMonth(selectedMonth) ? (
                            <span className="status-badge status-badge-neutral">View Only</span>
                          ) : (
                            <div className="flex items-center justify-center space-x-2">
                              <button 
                                onClick={() => handleEdit(budget)} 
                                className="p-2 rounded-lg bg-warning-100 text-warning-700 hover:bg-warning-200 transition-colors duration-200"
                                title="Edit budget"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>
                              <button 
                                onClick={() => handleDelete(budget._id)} 
                                className="p-2 rounded-lg bg-error-100 text-error-700 hover:bg-error-200 transition-colors duration-200"
                                title="Delete budget"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {budgets.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-center py-12">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-neutral-100 rounded-xl flex items-center justify-center mb-4">
                            <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                          </div>
                          <p className="text-neutral-500 font-medium">No budgets found for {formatMonthDisplay(selectedMonth)}</p>
                          <p className="text-neutral-400 text-sm">Add your first budget above to start tracking your spending!</p>
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

      {/* Budget Warning Modal */}
      <BudgetWarningModal
        isOpen={showWarningModal}
        onClose={handleModalCancel}
        onProceed={handleModalProceed}
        category={form.category}
        budgetAmount={parseFloat(form.budgetAmount) || 0}
        existingSpent={transactionImpact?.totalSpent || 0}
        transactionCount={transactionImpact?.transactionCount || 0}
        month={selectedMonth}
      />
    </div>
  );
}

export default BudgetPlanner; 