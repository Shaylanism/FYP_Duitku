/**
 * Date utility functions for the application
 */

/**
 * Get the number of days in a specific month
 * @param {number} year - The year
 * @param {number} month - The month (0-based, so January = 0)
 * @returns {number} Number of days in the month
 */
export const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
};

/**
 * Get the number of days in the current month
 * @returns {number} Number of days in the current month
 */
export const getDaysInCurrentMonth = () => {
    const now = new Date();
    return getDaysInMonth(now.getFullYear(), now.getMonth());
};

/**
 * Validate if a due day is valid for the current month
 * @param {number} dueDay - The due day to validate
 * @returns {boolean} True if valid, false otherwise
 */
export const isValidDueDayForCurrentMonth = (dueDay) => {
    if (dueDay < 1) return false;
    const maxDays = getDaysInCurrentMonth();
    return dueDay <= maxDays;
};

/**
 * Get a valid due day for a specific month (adjusts if the requested day doesn't exist)
 * @param {number} year - The year
 * @param {number} month - The month (0-based)
 * @param {number} requestedDay - The requested due day
 * @returns {number} Valid due day for the month
 */
export const getValidDueDayForMonth = (year, month, requestedDay) => {
    const lastDayOfMonth = getDaysInMonth(year, month);
    return Math.min(requestedDay, lastDayOfMonth);
};

/**
 * Check if a due day is in the past for the current month
 * @param {number} dueDay - The due day to check
 * @returns {boolean} True if the due day has already passed this month
 */
export const isDueDayInPast = (dueDay) => {
    const now = new Date();
    const currentDay = now.getDate();
    return dueDay < currentDay;
};

/**
 * Get the next month's due date for a given due day
 * @param {number} dueDay - The due day
 * @returns {Date} The next month's due date
 */
export const getNextMonthDueDate = (dueDay) => {
    const now = new Date();
    let nextMonth = now.getMonth() + 1;
    let nextYear = now.getFullYear();
    
    // Handle year rollover
    if (nextMonth > 11) {
        nextMonth = 0;
        nextYear += 1;
    }
    
    // Get valid due day for next month
    const validDueDay = getValidDueDayForMonth(nextYear, nextMonth, dueDay);
    return new Date(nextYear, nextMonth, validDueDay);
}; 