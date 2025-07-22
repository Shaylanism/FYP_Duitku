import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
        // Clear error when user starts typing
        if (error) setError('');
    };

    const validateForm = () => {
        if (!formData.name || !formData.email || !formData.password || !formData.confirmPassword) {
            setError('Please fill in all fields');
            return false;
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return false;
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return false;
        }

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            setError('Please enter a valid email address');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!validateForm()) {
            setLoading(false);
            return;
        }

        const result = await register(formData.name, formData.email, formData.password);
        
        if (!result.success) {
            setError(result.message);
        }
        
        setLoading(false);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 p-5">
            <div className="bg-white p-10 rounded-lg shadow-lg w-full max-w-sm">
                <h2 className="text-3xl font-bold text-center mb-2 text-gray-800">Create Account</h2>
                <p className="text-center text-gray-600 mb-8">Sign up for a new account</p>
                
                <form onSubmit={handleSubmit} className="flex flex-col">
                    <div className="mb-5">
                        <label className="block mb-1.5 font-medium text-gray-800">Full Name</label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded text-base transition-colors duration-300 focus:border-blue-500 focus:outline-none box-border"
                            placeholder="Enter your full name"
                            required
                        />
                    </div>
                    
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
                            placeholder="Enter your password (min 6 characters)"
                            required
                        />
                    </div>
                    
                    <div className="mb-5">
                        <label className="block mb-1.5 font-medium text-gray-800">Confirm Password</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            className="w-full p-3 border border-gray-300 rounded text-base transition-colors duration-300 focus:border-blue-500 focus:outline-none box-border"
                            placeholder="Confirm your password"
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
                        className={`w-full p-3 bg-green-600 text-white border-none rounded text-base font-medium cursor-pointer transition-colors duration-300 mt-2 hover:bg-green-700 ${
                            loading ? 'opacity-70 cursor-not-allowed' : ''
                        }`}
                    >
                        {loading ? 'Creating Account...' : 'Create Account'}
                    </button>
                </form>
                
                <div className="text-center mt-6">
                    <p>Already have an account? <Link to="/login" className="text-blue-600 no-underline font-medium hover:text-blue-700">Sign in</Link></p>
                </div>
            </div>
        </div>
    );
};

export default Register; 