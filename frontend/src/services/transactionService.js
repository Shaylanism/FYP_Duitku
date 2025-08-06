/**
 * Transaction Service
 * Handles all transaction-related API calls
 */

import { apiRequest } from './apiService.js';

const ENDPOINTS = {
  TRANSACTIONS: '/transactions',
  CATEGORIES: '/transactions/categories',
  CHECK_BUDGET: '/transactions/check-budget'
};

export const transactionService = {
  /**
   * Get transaction categories
   */
  getCategories: async () => {
    const response = await apiRequest.get(ENDPOINTS.CATEGORIES);
    return response.data;
  },

  /**
   * Create a new transaction
   */
  createTransaction: async (transactionData) => {
    const response = await apiRequest.post(ENDPOINTS.TRANSACTIONS, transactionData);
    return response.data;
  },

  /**
   * Get transactions with filters and pagination
   */
  getTransactions: async (filters = {}) => {
    const response = await apiRequest.get(ENDPOINTS.TRANSACTIONS, { params: filters });
    return response.data;
  },

  /**
   * Get transaction by ID
   */
  getTransactionById: async (id) => {
    const response = await apiRequest.get(`${ENDPOINTS.TRANSACTIONS}/${id}`);
    return response.data;
  },

  /**
   * Update a transaction
   */
  updateTransaction: async (id, updateData) => {
    const response = await apiRequest.put(`${ENDPOINTS.TRANSACTIONS}/${id}`, updateData);
    return response.data;
  },

  /**
   * Delete a transaction
   */
  deleteTransaction: async (id) => {
    const response = await apiRequest.delete(`${ENDPOINTS.TRANSACTIONS}/${id}`);
    return response.data;
  },

  /**
   * Check budget impact for a transaction
   */
  checkBudgetForTransaction: async (category, amount) => {
    const response = await apiRequest.get(ENDPOINTS.CHECK_BUDGET, {
      params: { category, amount }
    });
    return response.data;
  }
};