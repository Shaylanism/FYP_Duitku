import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Login = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        // Basic validation
        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            setLoading(false);
            return;
        }

        const result = await login(formData.email, formData.password);
        
        if (!result.success) {
            setError(result.message);
        }
        
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-5">
            <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Welcome Back</h2>
                <p className="text-center text-gray-600 mb-8">Sign in to your account</p>
                
                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="mb-5">
                        <label className="block mb-1.5 font-medium text-gray-800">Email</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded text-base transition-colors duration-300 focus:border-blue-500 focus:outline-none box-border"
                            placeholder="Enter your email"
                            required
                        />
                    </div>
                    
                    <div className="mb-5">
                        <label className="block mb-1.5 font-medium text-gray-800">Password</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded text-base transition-colors duration-300 focus:border-blue-500 focus:outline-none box-border"
                            placeholder="Enter your password"
                            required
                        />
                    </div>
                    
                    {error && (
                        <div className="bg-red-50 text-red-700 p-3 rounded mb-4 text-center">
                            {error}
                        </div>
                    )}
                    
                    <button 
                        type="submit" 
                        disabled={loading}
                        className={`w-full p-3 bg-blue-600 text-white border-none rounded text-base font-medium cursor-pointer transition-colors duration-300 mt-2 hover:bg-blue-700 ${
                            loading ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                    >
                        {loading ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>
                
                <div className="text-center mt-6">
                    <p>Don't have an account? <Link to="/register" className="text-blue-600 no-underline font-medium hover:text-blue-700">Sign up</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Login; 