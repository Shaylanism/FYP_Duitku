/**
 * Common helper functions
 * Shared utilities across the application
 */

import mongoose from 'mongoose';

/**
 * Validate MongoDB ObjectId
 */
export const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/**
 * Get current month in YYYY-MM format
 */
export const getCurrentMonth = () => {
  return new Date().toISOString().slice(0, 7);
};

/**
 * Check if month is in the past
 */
export const isPastMonth = (month) => {
  return month < getCurrentMonth();
};

/**
 * Create date range for a month
 */
export const getMonthDateRange = (month) => {
  const startDate = new Date(`${month}-01T00:00:00.000Z`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  
  return { startDate, endDate };
};

/**
 * Format currency for display
 */
export const formatCurrency = (amount, currency = 'MYR') => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Sanitize string input
 */
export const sanitizeString = (str) => {
  if (!str) return '';
  return str.toString().trim();
};

/**
 * Parse and validate numeric input
 */
export const parseNumeric = (value, min = 0) => {
  const parsed = parseFloat(value);
  if (isNaN(parsed) || parsed < min) {
    throw new Error(`Invalid numeric value: ${value}`);
  }
  return parsed;
};

/**
 * Calculate pagination parameters
 */
export const calculatePagination = (page, limit, total) => {
  const currentPage = parseInt(page) || 1;
  const itemsPerPage = parseInt(limit) || 10;
  const skip = (currentPage - 1) * itemsPerPage;
  const totalPages = Math.ceil(total / itemsPerPage);
  
  return {
    currentPage,
    itemsPerPage,
    skip,
    totalPages,
    hasNextPage: skip + itemsPerPage < total,
    hasPrevPage: currentPage > 1
  };
};

/**
 * Create aggregation pipeline for totals
 */
export const createTotalAggregation = (matchQuery) => {
  return [
    { $match: matchQuery },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ];
};