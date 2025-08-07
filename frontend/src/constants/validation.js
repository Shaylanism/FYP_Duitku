/**
 * Frontend validation constants
 * Mirrors backend validation rules
 */

export const VALIDATION_LIMITS = {
  TRANSACTION: {
    MIN_AMOUNT: 0.05,
    MAX_DESCRIPTION_LENGTH: 90
  },
  BUDGET: {
    MIN_AMOUNT: 0.01
  },
  USER: {
    MIN_PASSWORD_LENGTH: 6
  }
};

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense'
};

export const ERROR_MESSAGES = {
  REQUIRED_FIELDS: (fields) => `${fields.join(', ')} are required`,
  INVALID_AMOUNT: `Amount must be at least RM${VALIDATION_LIMITS.TRANSACTION.MIN_AMOUNT}`,
  INVALID_EMAIL: 'Please provide a valid email address',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_LIMITS.USER.MIN_PASSWORD_LENGTH} characters long`,
  DESCRIPTION_TOO_LONG: (limit) => `Description cannot exceed ${limit} characters`,
  INVALID_TRANSACTION_TYPE: 'Type must be either income or expense'
};