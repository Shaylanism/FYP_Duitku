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
    const [showPassword, setShowPassword] = useState(false);
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

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            {/* Background Pattern */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-primary-100 to-transparent opacity-60 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-primary-200 to-transparent opacity-40 rounded-full blur-3xl transform -translate-x-1/4 translate-y-1/4"></div>
            </div>

            <div className="relative sm:mx-auto sm:w-full sm:max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="mx-auto h-16 w-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-glow mb-6">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m-3-6h6m-3 0h.01M9 16h6" />
                        </svg>
                    </div>
                    <h1 className="text-4xl font-bold text-gradient-gold mb-2">Duitku</h1>
                    <p className="text-neutral-600 text-lg">A Financial Management Application</p>
                </div>

                {/* Login Card */}
                <div className="banking-card-premium animate-fade-in">
                    <div className="px-8 py-10">
                        <div className="text-center mb-8">
                            <h2 className="text-2xl font-semibold text-neutral-900 mb-2">Welcome to Duitku</h2>
                            <p className="text-neutral-600">Sign in to access your financial dashboard</p>
                        </div>
                        
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Email Field */}
                            <div>
                                <label className="banking-label">Email Address</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                                        </svg>
                                    </div>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className={`banking-input pl-10 ${error && !formData.email ? 'banking-input-error' : ''}`}
                                        placeholder="Enter your email address"
                                        required
                                        autoComplete="email"
                                    />
                                </div>
                            </div>
                            
                            {/* Password Field */}
                            <div>
                                <label className="banking-label">Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                        </svg>
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className={`banking-input pl-10 pr-10 ${error && !formData.password ? 'banking-input-error' : ''}`}
                                        placeholder="Enter your password"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        onClick={togglePasswordVisibility}
                                    >
                                        {showPassword ? (
                                            <svg className="h-5 w-5 text-neutral-400 hover:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                                            </svg>
                                        ) : (
                                            <svg className="h-5 w-5 text-neutral-400 hover:text-neutral-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        )}
                                    </button>
                                </div>
                            </div>
                            
                            {/* Error Message */}
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
                            
                            {/* Submit Button */}
                            <button 
                                type="submit" 
                                disabled={loading}
                                className={`w-full btn-primary ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                            >
                                {loading ? (
                                    <div className="flex items-center justify-center">
                                        <div className="loading-spinner mr-2"></div>
                                        Signing in...
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center">
                                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                        </svg>
                                        Sign In
                                    </div>
                                )}
                            </button>
                        </form>
                        
                        {/* Divider */}
                        <div className="mt-8 pt-6 border-t border-neutral-200">
                            <div className="text-center">
                                <p className="text-neutral-600">Don't have an account? 
                                    <Link 
                                        to="/register" 
                                        className="ml-1 text-primary-600 hover:text-primary-700 font-medium transition-colors duration-200"
                                    >
                                        Create Account
                                    </Link>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login; 