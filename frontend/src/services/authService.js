/**
 * Authentication Service
 * Handles all auth-related API calls
 */

import { apiRequest } from './apiService.js';

const ENDPOINTS = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  VERIFY: '/auth/verify'
};

export const authService = {
  /**
   * Login user
   */
  login: async (email, password) => {
    const response = await apiRequest.post(ENDPOINTS.LOGIN, { email, password });
    return response.data;
  },

  /**
   * Register new user
   */
  register: async (name, email, password) => {
    const response = await apiRequest.post(ENDPOINTS.REGISTER, { name, email, password });
    return response.data;
  },

  /**
   * Verify token
   */
  verifyToken: async () => {
    const response = await apiRequest.get(ENDPOINTS.VERIFY);
    return response.data;
  }
};