import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from './contexts/AuthContext';

const API_URL = '/api/users'; // Proxy to backend

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', id: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const { user, logout } = useAuth();

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await axios.get(API_URL);
      setUsers(res.data.users);
      setError('');
    } catch (err) {
      setError('Failed to fetch users');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers().catch(error => {
      console.error('Failed to fetch users:', error);
      setError('Failed to load users. Please refresh the page.');
    });
  }, []);

  // Handle form input
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Add or update user
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        await axios.put(`${API_URL}/${form.id}`, { name: form.name, email: form.email });
      } else {
        await axios.post(API_URL, { name: form.name, email: form.email });
      }
      setForm({ name: '', email: '', id: null });
      setEditing(false);
      fetchUsers().catch(error => {
        console.error('Failed to refresh users after save:', error);
      });
      setError('');
    } catch (err) {
      setError('Failed to save user');
    }
    setLoading(false);
  };

  // Edit user
  const handleEdit = (user) => {
    setForm({ name: user.name, email: user.email, id: user._id });
    setEditing(true);
  };

  // Delete user
  const handleDelete = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${API_URL}/${id}`);
      fetchUsers().catch(error => {
        console.error('Failed to refresh users after delete:', error);
      });
      setError('');
    } catch (err) {
      setError('Failed to delete user');
    }
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <div style={{ maxWidth: 800, margin: '2rem auto', padding: 20, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      {/* Header with user info and logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid #eee' }}>
        <div>
          <h2 style={{ margin: 0 }}>User Management</h2>
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

      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          style={{ marginRight: 8, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{ marginRight: 8, padding: '8px 12px', border: '1px solid #ddd', borderRadius: '4px' }}
        />
        <button 
          type="submit" 
          disabled={loading}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {editing ? 'Update' : 'Add'} User
        </button>
        {editing && (
          <button 
            type="button" 
            onClick={() => { setForm({ name: '', email: '', id: null }); setEditing(false); }} 
            style={{ 
              marginLeft: 8, 
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
      </form>
      {error && <div style={{ color: 'red', marginBottom: 12, padding: '8px', backgroundColor: '#fee', borderRadius: '4px' }}>{error}</div>}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '20px' }}>Loading...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '2px solid #dee2e6', textAlign: 'left', padding: '12px 8px' }}>Name</th>
              <th style={{ borderBottom: '2px solid #dee2e6', textAlign: 'left', padding: '12px 8px' }}>Email</th>
              <th style={{ borderBottom: '2px solid #dee2e6', textAlign: 'center', padding: '12px 8px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id} style={{ borderBottom: '1px solid #f8f9fa' }}>
                <td style={{ padding: '12px 8px' }}>{user.name}</td>
                <td style={{ padding: '12px 8px' }}>{user.email}</td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  <button 
                    onClick={() => handleEdit(user)} 
                    style={{ 
                      marginRight: 8, 
                      padding: '4px 12px', 
                      backgroundColor: '#ffc107', 
                      color: '#212529', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Edit
                  </button>
                  <button 
                    onClick={() => handleDelete(user._id)} 
                    style={{ 
                      padding: '4px 12px', 
                      backgroundColor: '#dc3545', 
                      color: 'white', 
                      border: 'none', 
                      borderRadius: '4px', 
                      cursor: 'pointer' 
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserManagement; 