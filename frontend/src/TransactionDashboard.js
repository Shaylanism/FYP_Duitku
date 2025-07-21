import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './contexts/AuthContext';

const API_URL = '/api/transactions';

function TransactionDashboard() {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, balance: 0 });
  const [form, setForm] = useState({ 
    type: 'expense', 
    amount: '', 
    description: '', 
    category: 'General',
    id: null 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const { user, logout } = useAuth();

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
    fetchTransactions();
  }, []);

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add or update transaction
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    // Validation
    if (!form.amount || !form.description) {
      setError('Amount and description are required');
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
      setForm({ type: 'expense', amount: '', description: '', category: 'General', id: null });
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
      currency: 'USD'
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

  return (
    <div style={{ maxWidth: 1200, margin: '2rem auto', padding: 20, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      {/* Header with user info and logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #eee' }}>
        <div>
          <h2 style={{ margin: 0 }}>Transaction Dashboard</h2>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>Welcome back, {user?.name}</p>
        </div>
        <button 
          onClick={handleLogout}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#dc3545', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Logout
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <div style={{ padding: 16, backgroundColor: '#e8f5e9', borderRadius: 8, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#2e7d32' }}>Total Income</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#1b5e20' }}>
            {formatCurrency(summary.totalIncome)}
          </p>
        </div>
        <div style={{ padding: 16, backgroundColor: '#ffebee', borderRadius: 8, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', color: '#c62828' }}>Total Expenses</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: '#b71c1c' }}>
            {formatCurrency(summary.totalExpense)}
          </p>
        </div>
        <div style={{ padding: 16, backgroundColor: summary.balance >= 0 ? '#e3f2fd' : '#fff3e0', borderRadius: 8, textAlign: 'center' }}>
          <h3 style={{ margin: '0 0 8px 0', color: summary.balance >= 0 ? '#1565c0' : '#ef6c00' }}>Balance</h3>
          <p style={{ margin: 0, fontSize: '24px', fontWeight: 'bold', color: summary.balance >= 0 ? '#0d47a1' : '#e65100' }}>
            {formatCurrency(summary.balance)}
          </p>
        </div>
      </div>

      {/* Transaction Form */}
      <form onSubmit={handleSubmit} style={{ marginBottom: 24, padding: 20, backgroundColor: '#f8f9fa', borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>{editing ? 'Edit Transaction' : 'Add New Transaction'}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: '500' }}>Type</label>
            <select
              name="type"
              value={form.type}
              onChange={handleChange}
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
            >
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: '500' }}>Amount ($)</label>
            <input
              type="number"
              name="amount"
              placeholder="0.00"
              value={form.amount}
              onChange={handleChange}
              min="0.01"
              step="0.01"
              required
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: '500' }}>Category</label>
            <input
              type="text"
              name="category"
              placeholder="General"
              value={form.category}
              onChange={handleChange}
              style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
            />
          </div>
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 4, fontWeight: '500' }}>Description</label>
          <input
            type="text"
            name="description"
            placeholder="Enter transaction description"
            value={form.description}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            type="submit" 
            disabled={loading}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: editing ? '#ffc107' : '#007bff', 
              color: editing ? '#212529' : 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? (editing ? 'Updating...' : 'Adding...') : (editing ? 'Update Transaction' : 'Add Transaction')}
          </button>
          {editing && (
            <button 
              type="button" 
              onClick={() => { 
                setForm({ type: 'expense', amount: '', description: '', category: 'General', id: null }); 
                setEditing(false); 
              }} 
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#6c757d', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      {error && <div style={{ color: 'red', marginBottom: 12, padding: '8px', backgroundColor: '#fee', borderRadius: '4px' }}>{error}</div>}
      
      {/* Transactions Table */}
      {loading && !transactions.length ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ borderBottom: '2px solid #dee2e6', textAlign: 'left', padding: '12px 8px' }}>Date</th>
                <th style={{ borderBottom: '2px solid #dee2e6', textAlign: 'left', padding: '12px 8px' }}>Type</th>
                <th style={{ borderBottom: '2px solid #dee2e6', textAlign: 'left', padding: '12px 8px' }}>Description</th>
                <th style={{ borderBottom: '2px solid #dee2e6', textAlign: 'left', padding: '12px 8px' }}>Category</th>
                <th style={{ borderBottom: '2px solid #dee2e6', textAlign: 'right', padding: '12px 8px' }}>Amount</th>
                <th style={{ borderBottom: '2px solid #dee2e6', textAlign: 'center', padding: '12px 8px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction._id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                  <td style={{ padding: '12px 8px', fontSize: '14px' }}>{formatDate(transaction.createdAt)}</td>
                  <td style={{ padding: '12px 8px' }}>
                    <span style={{ 
                      padding: '4px 8px', 
                      borderRadius: '4px', 
                      fontSize: '12px', 
                      fontWeight: '500',
                      backgroundColor: transaction.type === 'income' ? '#d4edda' : '#f8d7da',
                      color: transaction.type === 'income' ? '#155724' : '#721c24'
                    }}>
                      {transaction.type === 'income' ? 'Income' : 'Expense'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px' }}>{transaction.description}</td>
                  <td style={{ padding: '12px 8px', color: '#666' }}>{transaction.category}</td>
                  <td style={{ 
                    padding: '12px 8px', 
                    textAlign: 'right', 
                    fontWeight: '500',
                    color: transaction.type === 'income' ? '#28a745' : '#dc3545'
                  }}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(transaction.amount))}
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleEdit(transaction)} 
                      style={{ 
                        marginRight: 8, 
                        padding: '4px 12px', 
                        backgroundColor: '#ffc107', 
                        color: '#212529', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(transaction._id)} 
                      style={{ 
                        padding: '4px 12px', 
                        backgroundColor: '#dc3545', 
                        color: 'white', 
                        border: 'none', 
                        borderRadius: '4px', 
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
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