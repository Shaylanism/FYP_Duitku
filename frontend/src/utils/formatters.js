/**
 * Formatting utility functions
 * Consistent formatting across the application
 */

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
 * Format date for display
 */
export const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Format month for display (e.g., "December 2024")
 */
export const formatMonthDisplay = (month) => {
  return new Date(month + '-01').toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });
};

/**
 * Truncate text with ellipsis
 */
export const truncateText = (text, maxLength) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Capitalize first letter
 */
export const capitalize = (str) => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/**
 * Format number with commas
 */
export const formatNumber = (num) => {
  return new Intl.NumberFormat('en-MY').format(num);
};