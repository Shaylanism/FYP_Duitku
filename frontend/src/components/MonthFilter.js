import React from 'react';
import { 
  getCurrentMonth, 
  isCurrentMonth, 
  getMonthOptions, 
  formatMonthDisplay,
  isValidMonthSelection 
} from '../utils/monthUtils';

/**
 * Reusable MonthFilter component for filtering by month
 * Supports both dropdown and native month input variants
 * Restricts selection to current year and below
 */
const MonthFilter = ({ 
  selectedMonth, 
  onMonthChange, 
  variant = 'dropdown', // 'dropdown' or 'native'
  label = 'Filter by Month:',
  showReturnButton = true,
  className = '',
  includeMonths = 11 // Number of previous months to include in dropdown
}) => {
  const handleReturnToCurrentMonth = () => {
    const currentMonth = getCurrentMonth();
    onMonthChange(currentMonth);
  };

  const handleMonthChange = (newMonth) => {
    // Validate month selection (ensure it's not in the future)
    if (isValidMonthSelection(newMonth)) {
      onMonthChange(newMonth);
    } else {
      // If invalid month selected, default to current month
      const currentMonth = getCurrentMonth();
      onMonthChange(currentMonth);
    }
  };

  const monthOptions = getMonthOptions(includeMonths);
  const showReturnBtn = showReturnButton && !isCurrentMonth(selectedMonth);

  if (variant === 'native') {
    // Native HTML5 month input (used by BudgetPlanner)
    return (
      <div className={`month-filter-native ${className}`}>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
        <div className="flex gap-3 items-center">
          <input
            type="month"
            value={selectedMonth}
            max={getCurrentMonth()}
            onChange={(e) => handleMonthChange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500"
          />
          {showReturnBtn && (
            <button
              onClick={handleReturnToCurrentMonth}
              className="px-4 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 transition-colors text-sm"
            >
              Current Month
            </button>
          )}
        </div>
      </div>
    );
  }

  // Dropdown variant (used by TransactionDashboard)
  return (
    <div className={`month-filter-dropdown ${className}`}>
      <label className="block mb-2 font-medium text-gray-700">
        {label}
      </label>
      <div className="flex gap-3 items-center">
        <select
          value={selectedMonth}
          onChange={(e) => handleMonthChange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:border-blue-500 bg-white"
        >
          {monthOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {showReturnBtn && (
          <button
            onClick={handleReturnToCurrentMonth}
            className="px-4 py-2 bg-blue-600 text-white border-none rounded cursor-pointer hover:bg-blue-700 transition-colors text-sm"
          >
            Return to Current Month
          </button>
        )}
      </div>
    </div>
  );
};

export default MonthFilter; 