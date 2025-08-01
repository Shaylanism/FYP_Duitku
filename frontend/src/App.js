import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Layout from './components/Layout';
import TransactionDashboard from './TransactionDashboard';
import BudgetPlanner from './components/BudgetPlanner';
import PlannedPayments from './components/PlannedPayments';
import RetirementPlanner from './components/RetirementPlanner';
import FinancialReportExport from './components/FinancialReportExport';
import AIChatbot from './components/AIChatbot';

// Loading Component
const LoadingScreen = () => (
  <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100 flex flex-col justify-center items-center">
    {/* Background Pattern */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-primary-100 to-transparent opacity-60 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 left-0 w-1/2 h-1/2 bg-gradient-to-tr from-primary-200 to-transparent opacity-40 rounded-full blur-3xl transform -translate-x-1/4 translate-y-1/4"></div>
    </div>
    
    <div className="relative text-center">
      {/* Logo */}
      <div className="mx-auto h-16 w-16 bg-gradient-to-r from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-glow mb-6 animate-pulse">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m-3-6h6m-3 0h.01M9 16h6" />
        </svg>
      </div>
      
      {/* Brand */}
      <h1 className="text-4xl font-bold text-gradient-gold mb-2">Duitku</h1>
      <p className="text-neutral-600 text-lg mb-8">Premier Financial Management</p>
      
      {/* Loading Spinner */}
      <div className="flex items-center justify-center space-x-2">
        <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce"></div>
        <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
        <div className="w-3 h-3 bg-primary-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
      </div>
      
      <p className="text-neutral-500 mt-4 text-sm">Loading your financial dashboard...</p>
    </div>
  </div>
);

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Public Route Component (redirects to dashboard if already authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return <LoadingScreen />;
  }
  
  return isAuthenticated ? <Navigate to="/dashboard" /> : children;
};

function AppContent() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        
        {/* Protected Routes with Layout */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route path="transactions" element={<TransactionDashboard />} />
          <Route path="budget-planner" element={<BudgetPlanner />} />
          <Route path="planned-payments" element={<PlannedPayments />} />
          <Route path="retirement-planner" element={<RetirementPlanner />} />
          <Route path="export-report" element={<FinancialReportExport />} />
          <Route path="ai-chatbot" element={<AIChatbot />} />
          <Route index element={<Navigate to="transactions" replace />} />
        </Route>
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" />} />
        
        {/* Catch all other routes */}
        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
