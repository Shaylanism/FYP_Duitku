import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_URL = '/api/users'; // Proxy to backend

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({ name: '', email: '', id: null });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);

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
    fetchUsers();
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
      fetchUsers();
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
      fetchUsers();
      setError('');
    } catch (err) {
      setError('Failed to delete user');
    }
    setLoading(false);
  };

  return (
    <div style={{ maxWidth: 600, margin: '2rem auto', padding: 20, background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' }}>
      <h2>User Management</h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 24 }}>
        <input
          name="name"
          placeholder="Name"
          value={form.name}
          onChange={handleChange}
          required
          style={{ marginRight: 8 }}
        />
        <input
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          required
          style={{ marginRight: 8 }}
        />
        <button type="submit" disabled={loading}>
          {editing ? 'Update' : 'Add'} User
        </button>
        {editing && (
          <button type="button" onClick={() => { setForm({ name: '', email: '', id: null }); setEditing(false); }} style={{ marginLeft: 8 }}>
            Cancel
          </button>
        )}
      </form>
      {error && <div style={{ color: 'red', marginBottom: 12 }}>{error}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Name</th>
              <th style={{ borderBottom: '1px solid #ccc', textAlign: 'left' }}>Email</th>
              <th style={{ borderBottom: '1px solid #ccc' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user._id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <button onClick={() => handleEdit(user)} style={{ marginRight: 8 }}>Edit</button>
                  <button onClick={() => handleDelete(user._id)} style={{ color: 'red' }}>Delete</button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: 'center', color: '#888' }}>No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default UserManagement; 