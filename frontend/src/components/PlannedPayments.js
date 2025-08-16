import React, { useEffect, useState } from 'react';
import axios from 'axios';
import PastDueDateModal from './PastDueDateModal';
import OverduePaymentModal from './OverduePaymentModal';
import InsufficientBalanceModal from './InsufficientBalanceModal';

const API_URL = '/api/planned-payments';
const TRANSACTIONS_API = '/api/transactions';

function PlannedPayments() {
  const [plannedPayments, setPlannedPayments] = useState([]);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [form, setForm] = useState({ 
    title: '',
    amount: '',
    category: '',
    dueDay: '',
    paymentType: 'expense',
    id: null 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [settlingPayment, setSettlingPayment] = useState(null);
  const [showPastDueModal, setShowPastDueModal] = useState(false);
  const [pendingPaymentData, setPendingPaymentData] = useState(null);
  const [showOverdueModal, setShowOverdueModal] = useState(false);
  const [overduePayments, setOverduePayments] = useState([]);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);
  const [balanceError, setBalanceError] = useState({ message: '', details: null });

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

  // Fetch planned payments
  const fetchPlannedPayments = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setPlannedPayments(res.data.plannedPayments || []);
      setError('');
    } catch (err) {
      setError('Failed to fetch planned payments');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCategories();
    fetchPlannedPayments();
  }, []);

  // Handle form input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Add or update planned payment
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validation
    if (!form.title || !form.amount || !form.category || !form.dueDay || !form.paymentType) {
      setError('Title, amount, category, payment type, and due day are required');
      setLoading(false);
      return;
    }

    if (form.title.trim().length > 40) {
      setError('Title cannot exceed 40 characters');
      setLoading(false);
      return;
    }

    if (parseFloat(form.amount) <= 0) {
      setError('Amount must be greater than 0');
      setLoading(false);
      return;
    }

    const dueDay = parseInt(form.dueDay);
    const maxDaysInMonth = getDaysInCurrentMonth();
    const currentDay = new Date().getDate();
    
    if (dueDay < 1 || dueDay > maxDaysInMonth) {
      setError(`Due day must be between 1 and ${maxDaysInMonth} for the current month`);
      setLoading(false);
      return;
    }
    
    if (dueDay === currentDay) {
      setError('You cannot create a planned payment for the current day. Please select a different due day.');
      setLoading(false);
      return;
    }

    const paymentData = {
      title: form.title,
      amount: parseFloat(form.amount),
      category: form.category,
      dueDay: dueDay,
      paymentType: form.paymentType
    };

    // Check if due day is in the past and this is a new payment (not editing)
    if (!editing && isDueDayInPast(dueDay)) {
      // Show confirmation modal for past due date
      setPendingPaymentData(paymentData);
      setShowPastDueModal(true);
      setLoading(false);
      return;
    }

    // Proceed with normal submission
    await submitPayment(paymentData);
  };

  // Actual submission logic (extracted to be reusable)
  const submitPayment = async (paymentData) => {
    setLoading(true);
    try {
      let response;
      if (editing) {
        response = await axios.put(`${API_URL}/${form.id}`, paymentData);
      } else {
        response = await axios.post(API_URL, paymentData);
      }
      
      // Reset form
      setForm({ 
        title: '',
        amount: '',
        category: getDefaultCategory('expense'),
        dueDay: '',
        paymentType: 'expense',
        id: null 
      });
      setEditing(false);
      fetchPlannedPayments();
      setError('');

      // Show success message if payment was auto-settled
      if (response.data.autoSettled) {
        alert(`Payment "${paymentData.title}" was created and automatically marked as settled for this month. The next due date is ${new Date(response.data.nextDueDate).toLocaleDateString()}.`);
        
        // Dispatch event to refresh notifications in Layout
        window.dispatchEvent(new CustomEvent('paymentSettled'));
      }
    } catch (err) {
      const errorData = err.response?.data;
      
      // Handle overdue planned payments error with modal
      if (errorData?.errorType === 'OVERDUE_PLANNED_PAYMENTS') {
        setOverduePayments(errorData.overduePayments || []);
        setShowOverdueModal(true);
      } else {
        setError(errorData?.message || 'Failed to save planned payment');
      }
    }
    setLoading(false);
  };

  // Handle modal confirmation
  const handleModalConfirm = async () => {
    setShowPastDueModal(false);
    if (pendingPaymentData) {
      await submitPayment(pendingPaymentData);
      setPendingPaymentData(null);
    }
  };

  // Handle modal cancellation
  const handleModalCancel = () => {
    setShowPastDueModal(false);
    setPendingPaymentData(null);
    setLoading(false);
  };

  // Edit planned payment
  const handleEdit = (payment) => {
    setForm({
      title: payment.title,
      amount: payment.amount.toString(),
      category: payment.category,
      dueDay: payment.dueDay.toString(),
      paymentType: payment.paymentType || 'expense',
      id: payment._id
    });
    setEditing(true);
  };

  // Delete planned payment
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this planned payment?')) {
      return;
    }
    
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchPlannedPayments();
      setError('');
    } catch (err) {
      setError('Failed to delete planned payment');
    }
    setLoading(false);
  };

  // Mark payment as settled
  const handleSettle = async (payment) => {
    const actionText = payment.paymentType === 'income' ? 'receiving' : 'settling';
    const description = prompt(
      `Enter transaction description for ${actionText} "${payment.title}":`,
      `${payment.title}`
    );
    
    if (description === null) return; // User cancelled
    
    setSettlingPayment(payment._id);
    try {
      await axios.put(`${API_URL}/${payment._id}/settle`, {
        transactionDescription: description
      });
      fetchPlannedPayments();
      setError('');
      const successMessage = payment.paymentType === 'income' 
        ? 'Income received successfully and transaction created!'
        : 'Payment settled successfully and transaction created!';
      alert(successMessage);
      
      // Dispatch event to refresh notifications in Layout
      window.dispatchEvent(new CustomEvent('paymentSettled'));
    } catch (err) {
      const errorData = err.response?.data;
      
      // Handle insufficient balance error with modal
      if (errorData?.errorType === 'INSUFFICIENT_BALANCE') {
        setBalanceError({
          message: errorData.message,
          details: errorData.details
        });
        setShowInsufficientBalanceModal(true);
      } else {
        setError(errorData?.message || 'Failed to settle payment');
      }
    }
    setSettlingPayment(null);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'MYR'
    }).format(amount || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'settled':
        return 'bg-green-200 text-green-800';
      case 'pending':
        return 'bg-yellow-200 text-yellow-800';
      case 'overdue':
        return 'bg-red-200 text-red-800';
      default:
        return 'bg-blue-200 text-blue-800';
    }
  };

  const getDaysUntilDue = (dueDay) => {
    const now = new Date();
    const currentDay = now.getDate();
    let daysUntil = dueDay - currentDay;
    
    // If due day has passed this month, calculate for next month
    if (daysUntil < 0) {
      const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, dueDay);
      daysUntil = Math.ceil((nextMonth - now) / (1000 * 60 * 60 * 24));
    }
    
    return daysUntil;
  };

  // Helper function to get number of days in current month
  const getDaysInCurrentMonth = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  };

  // Helper function to check if due day is in the past
  const isDueDayInPast = (dueDay) => {
    const now = new Date();
    const currentDay = now.getDate();
    return dueDay < currentDay;
  };

  // Helper function to get next month's due date
  const getNextMonthDueDate = (dueDay) => {
    const now = new Date();
    let nextMonth = now.getMonth() + 1;
    let nextYear = now.getFullYear();
    
    // Handle year rollover
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear += 1;
    }
    
    // Get valid due day for next month (handle months with fewer days)
    const lastDayOfNextMonth = new Date(nextYear, nextMonth + 1, 0).getDate();
    const validDueDay = Math.min(dueDay, lastDayOfNextMonth);
    
    return new Date(nextYear, nextMonth, validDueDay);
  };

  // Generate options for due day based on current month, excluding current day
  const currentDay = new Date().getDate();
  const dueDayOptions = Array.from({ length: getDaysInCurrentMonth() }, (_, i) => i + 1)
    .filter(day => day !== currentDay);

  // Helper to get available categories based on payment type
  const getAvailableCategories = (paymentType) => {
    return paymentType === 'income' ? categories.income : categories.expense;
  };

  // Helper to get first available category for payment type
  const getDefaultCategory = (paymentType) => {
    const availableCategories = getAvailableCategories(paymentType);
    return availableCategories.length > 0 ? availableCategories[0] : '';
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Planned Payments</h2>
          <p className="text-gray-600">Manage your recurring income and expense payment reminders</p>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="mb-6 p-5 bg-gray-50 rounded-lg">
          <h3 className="mt-0 mb-4">{editing ? 'Edit Planned Payment' : 'Add New Planned Payment'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <div>
              <label className="block mb-1 font-medium">Title *</label>
              <input
                type="text"
                name="title"
                placeholder="e.g., Electricity Bill"
                value={form.title}
                onChange={handleChange}
                maxLength={40}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500">
                  Maximum 40 characters
                </span>
                <span className={`text-xs ${form.title.length > 35 ? 'text-orange-600' : 'text-gray-500'}`}>
                  {form.title.length}/40
                </span>
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium">Payment Type *</label>
              <select
                name="paymentType"
                value={form.paymentType}
                onChange={(e) => {
                  const newPaymentType = e.target.value;
                  setForm({ 
                    ...form, 
                    paymentType: newPaymentType,
                    category: getDefaultCategory(newPaymentType) // Set default category for new payment type
                  });
                }}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="">Select category...</option>
                {getAvailableCategories(form.paymentType).map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Due Day (1 - 30/31) *</label>
              <select
                name="dueDay"
                value={form.dueDay}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              >
                <option value="">Select day...</option>
                {dueDayOptions.map(day => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Amount (RM) *</label>
              <input
                type="number"
                name="amount"
                placeholder="0.00"
                value={form.amount}
                onChange={handleChange}
                min="0.05"
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
              {loading ? (editing ? 'Updating...' : 'Adding...') : (editing ? 'Update Payment' : 'Add Payment')}
            </button>
            {editing && (
              <button 
                type="button" 
                onClick={() => { 
                  setForm({ 
                    title: '',
                    amount: '',
                    category: getDefaultCategory('expense'),
                    dueDay: '',
                    paymentType: 'expense',
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
        
        {/* Payments Table */}
        {loading && !plannedPayments.length ? (
          <div className="text-center py-5">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border-b-2 border-gray-300 text-left py-3 px-2">Title</th>
                  <th className="border-b-2 border-gray-300 text-left py-3 px-2">Type</th>
                  <th className="border-b-2 border-gray-300 text-left py-3 px-2">Category</th>
                  <th className="border-b-2 border-gray-300 text-right py-3 px-2">Amount</th>
                  <th className="border-b-2 border-gray-300 text-center py-3 px-2">Due Day</th>
                  <th className="border-b-2 border-gray-300 text-center py-3 px-2">Next Due</th>
                  <th className="border-b-2 border-gray-300 text-center py-3 px-2">Status</th>
                  <th className="border-b-2 border-gray-300 text-center py-3 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {plannedPayments.map((payment) => {
                  const daysUntil = getDaysUntilDue(payment.dueDay);
                  
                  return (
                    <tr key={payment._id} className="border-b border-gray-100">
                      <td className="py-3 px-2">
                        <div>
                          <div className="font-medium">{payment.title}</div>
                          {payment.description && (
                            <div className="text-sm text-gray-600">{payment.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          payment.paymentType === 'income' 
                            ? 'bg-blue-200 text-blue-800' 
                            : 'bg-gray-200 text-gray-800'
                        }`}>
                          {payment.paymentType === 'income' ? 'Income' : 'Expense'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-gray-600">{payment.category}</td>
                      <td className="py-3 px-2 text-right font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="py-3 px-2 text-center">{payment.dueDay}</td>
                      <td className="py-3 px-2 text-center">
                        <div className="text-sm">
                          {payment.nextDueDate ? formatDate(payment.nextDueDate) : 'N/A'}
                        </div>
                        {daysUntil <= 3 && daysUntil > 0 && (
                          <div className="text-xs text-orange-600 font-medium">
                            {daysUntil} day{daysUntil !== 1 ? 's' : ''} left
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(payment.status)}`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <div className="flex gap-1 justify-center flex-wrap">
                          {(payment.status === 'pending' || payment.status === 'overdue') && (
                            <button 
                              onClick={() => handleSettle(payment)}
                              disabled={settlingPayment === payment._id}
                              className={`px-2 py-1 text-white border-none rounded cursor-pointer text-xs transition-colors ${
                                payment.status === 'overdue' 
                                  ? 'bg-red-600 hover:bg-red-700' 
                                  : 'bg-green-600 hover:bg-green-700'
                              }`}
                            >
                              {settlingPayment === payment._id 
                                ? 'Settling...' 
                                : payment.paymentType === 'income' ? 'Received' : 'Settle'
                              }
                            </button>
                          )}
                          <button 
                            onClick={() => handleEdit(payment)} 
                            className="px-2 py-1 bg-yellow-500 text-gray-900 border-none rounded cursor-pointer text-xs hover:bg-yellow-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(payment._id)} 
                            className="px-2 py-1 bg-red-600 text-white border-none rounded cursor-pointer text-xs hover:bg-red-700 transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {plannedPayments.length === 0 && (
                  <tr>
                    <td colSpan="8" className="text-center text-gray-500 py-5">
                      No planned payments found. Add your first payment plan above!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Past Due Date Confirmation Modal */}
      <PastDueDateModal
        isOpen={showPastDueModal}
        onClose={handleModalCancel}
        onConfirm={handleModalConfirm}
        paymentTitle={pendingPaymentData?.title || ''}
        dueDay={pendingPaymentData?.dueDay || 0}
        nextDueDate={pendingPaymentData ? getNextMonthDueDate(pendingPaymentData.dueDay) : null}
      />

      {/* Overdue Payment Modal */}
      <OverduePaymentModal
        isOpen={showOverdueModal}
        onClose={() => setShowOverdueModal(false)}
        overduePayments={overduePayments}
        actionType="planned_payment"
      />

      {/* Insufficient Balance Modal */}
      <InsufficientBalanceModal
        isOpen={showInsufficientBalanceModal}
        onClose={() => setShowInsufficientBalanceModal(false)}
        message={balanceError.message}
        details={balanceError.details}
      />
    </div>
  );
}

export default PlannedPayments; 