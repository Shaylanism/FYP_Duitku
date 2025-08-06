/**
 * Validation constants
 * Centralized validation rules and limits
 */

export const VALIDATION_LIMITS = {
  TRANSACTION: {
    MIN_AMOUNT: 0.01,
    MAX_DESCRIPTION_LENGTH: 90
  },
  BUDGET: {
    MIN_AMOUNT: 0.01
  },
  USER: {
    MIN_PASSWORD_LENGTH: 6
  },
  PLANNED_PAYMENT: {
    MIN_AMOUNT: 0.01,
    MAX_DESCRIPTION_LENGTH: 200,
    MIN_DUE_DAY: 1,
    MAX_DUE_DAY: 31
  }
};

export const REGEX_PATTERNS = {
  MONTH_FORMAT: /^\d{4}-\d{2}$/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
};

export const ERROR_MESSAGES = {
  REQUIRED_FIELDS: (fields) => `${fields.join(', ')} are required`,
  INVALID_AMOUNT: 'Amount must be greater than 0',
  INVALID_EMAIL: 'Please provide a valid email address',
  INVALID_MONTH_FORMAT: 'Month must be in YYYY-MM format',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_LIMITS.USER.MIN_PASSWORD_LENGTH} characters long`,
  DESCRIPTION_TOO_LONG: (limit) => `Description cannot exceed ${limit} characters`,
  INVALID_TRANSACTION_TYPE: 'Type must be either income or expense',
  INVALID_CATEGORY: (category, type, validCategories) => 
    `Invalid category '${category}' for ${type} transaction. Valid categories are: ${validCategories.join(', ')}`
};