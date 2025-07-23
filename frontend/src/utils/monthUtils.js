/**
 * Shared utility functions for month filtering across components
 */

/**
 * Get current month in YYYY-MM format
 * @returns {string} Current month in YYYY-MM format
 */
export const getCurrentMonth = () => {
  return new Date().toISOString().slice(0, 7);
};

/**
 * Check if a month is in the past
 * @param {string} month - Month in YYYY-MM format
 * @returns {boolean} True if month is in the past
 */
export const isPastMonth = (month) => {
  return month < getCurrentMonth();
};

/**
 * Check if a month is in the future
 * @param {string} month - Month in YYYY-MM format
 * @returns {boolean} True if month is in the future
 */
export const isFutureMonth = (month) => {
  return month > getCurrentMonth();
};

/**
 * Validate if a month selection is allowed (current year and below only)
 * @param {string} month - Month in YYYY-MM format
 * @returns {boolean} True if month selection is valid
 */
export const isValidMonthSelection = (month) => {
  return month <= getCurrentMonth();
};

/**
 * Check if a month is the current month
 * @param {string} month - Month in YYYY-MM format
 * @returns {boolean} True if month is the current month
 */
export const isCurrentMonth = (month) => {
  return month === getCurrentMonth();
};

/**
 * Format month for display (e.g., "December 2024")
 * @param {string} month - Month in YYYY-MM format
 * @returns {string} Formatted month string
 */
export const formatMonthDisplay = (month) => {
  return new Date(month + '-01').toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long' 
  });
};

/**
 * Generate month options for dropdown (current and previous months, limited to current year and below)
 * @param {number} numberOfMonths - Number of previous months to include (default: 11)
 * @returns {Array} Array of month options with value and label
 */
export const getMonthOptions = (numberOfMonths = 11) => {
  const options = [];
  const now = new Date();
  const currentMonth = getCurrentMonth();
  
  for (let i = 0; i <= numberOfMonths; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = date.toISOString().slice(0, 7);
    
    // Ensure we don't include future months (safeguard)
    if (value <= currentMonth) {
      const label = formatMonthDisplay(value);
      options.push({ value, label });
    }
  }
  
  return options;
};

/**
 * Get months from a list of items that have a month property
 * @param {Array} items - Array of items with month property
 * @param {boolean} pastOnly - Only include past months (default: true)
 * @returns {Array} Array of unique months sorted
 */
export const getAvailableMonthsFromItems = (items, pastOnly = true) => {
  const months = [...new Set(items
    .map(item => item.month)
    .filter(month => pastOnly ? isPastMonth(month) : true)
    .sort()
  )];
  
  return months;
};

/**
 * Create date range for a month (useful for database queries)
 * @param {string} month - Month in YYYY-MM format
 * @returns {Object} Object with startDate and endDate
 */
export const getMonthDateRange = (month) => {
  const startDate = new Date(`${month}-01T00:00:00.000Z`);
  const endDate = new Date(startDate);
  endDate.setMonth(endDate.getMonth() + 1);
  
  return { startDate, endDate };
}; 