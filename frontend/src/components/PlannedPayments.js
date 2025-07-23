import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = '/api/planned-payments';
const TRANSACTIONS_API = '/api/transactions';

function PlannedPayments() {
  const [plannedPayments, setPlannedPayments] = useState([]);
  const [categories, setCategories] = useState({ income: [], expense: [] });
  const [form, setForm] = useState({ 
    title: '',
    description: '',
    amount: '',
    category: '',
    dueDay: '',
    id: null 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [settlingPayment, setSettlingPayment] = useState(null);

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
    if (!form.title || !form.amount || !form.category || !form.dueDay) {
      setError('Title, amount, category, and due day are required');
      setLoading(false);
      return;
    }

    if (parseFloat(form.amount) <= 0) {
      setError('Amount must be greater than 0');
      setLoading(false);
      return;
    }

    const dueDay = parseInt(form.dueDay);
    if (dueDay < 1 || dueDay > 31) {
      setError('Due day must be between 1 and 31');
      setLoading(false);
      return;
    }

    try {
      const paymentData = {
        title: form.title,
        description: form.description,
        amount: parseFloat(form.amount),
        category: form.category,
        dueDay: dueDay
      };

      if (editing) {
        await axios.put(`${API_URL}/${form.id}`, paymentData);
      } else {
        await axios.post(API_URL, paymentData);
      }
      
      // Reset form
      setForm({ 
        title: '',
        description: '',
        amount: '',
        category: categories.expense?.[0] || '',
        dueDay: '',
        id: null 
      });
      setEditing(false);
      fetchPlannedPayments();
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save planned payment');
    }
    setLoading(false);
  };

  // Edit planned payment
  const handleEdit = (payment) => {
    setForm({
      title: payment.title,
      description: payment.description || '',
      amount: payment.amount.toString(),
      category: payment.category,
      dueDay: payment.dueDay.toString(),
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
    const description = prompt(
      `Enter transaction description for settling "${payment.title}":`,
      `${payment.title} - ${payment.description}`
    );
    
    if (description === null) return; // User cancelled
    
    setSettlingPayment(payment._id);
    try {
      await axios.put(`${API_URL}/${payment._id}/settle`, {
        transactionDescription: description
      });
      fetchPlannedPayments();
      setError('');
      alert('Payment settled successfully and transaction created!');
      
      // Dispatch event to refresh notifications in Layout
      window.dispatchEvent(new CustomEvent('paymentSettled'));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to settle payment');
    }
    setSettlingPayment(null);
  };

  // Toggle active status
  const handleToggleActive = async (payment) => {
    try {
      await axios.put(`${API_URL}/${payment._id}`, {
        isActive: !payment.isActive
      });
      fetchPlannedPayments();
      setError('');
    } catch (err) {
      setError('Failed to update payment status');
    }
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
      case 'inactive':
        return 'bg-gray-200 text-gray-800';
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

  // Generate options for due day
  const dueDayOptions = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Planned Payments</h2>
          <p className="text-gray-600">Manage your recurring bills and payment reminders</p>
        </div>

        {/* Payment Form */}
        <form onSubmit={handleSubmit} className="mb-6 p-5 bg-gray-50 rounded-lg">
          <h3 className="mt-0 mb-4">{editing ? 'Edit Planned Payment' : 'Add New Planned Payment'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
            <div>
              <label className="block mb-1 font-medium">Title *</label>
              <input
                type="text"
                name="title"
                placeholder="e.g., Electricity Bill"
                value={form.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Amount (RM) *</label>
              <input
                type="number"
                name="amount"
                placeholder="0.00"
                value={form.amount}
                onChange={handleChange}
                min="0.01"
                step="0.01"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Due Day (1-31) *</label>
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
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
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
                {categories.expense.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-1 font-medium">Description</label>
              <input
                type="text"
                name="description"
                placeholder="Additional details (optional)"
                value={form.description}
                onChange={handleChange}
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
                    description: '',
                    amount: '',
                    category: categories.expense?.[0] || '',
                    dueDay: '',
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
                      <td className="py-3 px-2 text-gray-600">{payment.category}</td>
                      <td className="py-3 px-2 text-right font-medium">{formatCurrency(payment.amount)}</td>
                      <td className="py-3 px-2 text-center">{payment.dueDay}</td>
                      <td className="py-3 px-2 text-center">
                        <div className="text-sm">
                          {payment.nextDueDate ? formatDate(payment.nextDueDate) : 'N/A'}
                        </div>
                        {payment.isActive && daysUntil <= 3 && daysUntil > 0 && (
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
                          {payment.isActive && payment.status === 'pending' && (
                            <button 
                              onClick={() => handleSettle(payment)}
                              disabled={settlingPayment === payment._id}
                              className="px-2 py-1 bg-green-600 text-white border-none rounded cursor-pointer text-xs hover:bg-green-700 transition-colors"
                            >
                              {settlingPayment === payment._id ? 'Settling...' : 'Settle'}
                            </button>
                          )}
                          <button 
                            onClick={() => handleEdit(payment)} 
                            className="px-2 py-1 bg-yellow-500 text-gray-900 border-none rounded cursor-pointer text-xs hover:bg-yellow-600 transition-colors"
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleToggleActive(payment)}
                            className={`px-2 py-1 border-none rounded cursor-pointer text-xs transition-colors ${
                              payment.isActive 
                                ? 'bg-orange-500 text-white hover:bg-orange-600' 
                                : 'bg-blue-500 text-white hover:bg-blue-600'
                            }`}
                          >
                            {payment.isActive ? 'Disable' : 'Enable'}
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
                    <td colSpan="7" className="text-center text-gray-500 py-5">
                      No planned payments found. Add your first payment plan above!
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

export default PlannedPayments; 