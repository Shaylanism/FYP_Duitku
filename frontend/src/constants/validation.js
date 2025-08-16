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
    MIN_AMOUNT: 0.05
  },
  PLANNED_PAYMENT: {
    MIN_AMOUNT: 0.05,
    MAX_DESCRIPTION_LENGTH: 30,
    MAX_TITLE_LENGTH: 40,
    MIN_DUE_DAY: 1,
    MAX_DUE_DAY: 31
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
  INVALID_BUDGET_AMOUNT: `Budget amount must be at least RM${VALIDATION_LIMITS.BUDGET.MIN_AMOUNT}`,
  INVALID_PLANNED_PAYMENT_AMOUNT: `Amount must be at least RM${VALIDATION_LIMITS.PLANNED_PAYMENT.MIN_AMOUNT}`,
  INVALID_EMAIL: 'Please provide a valid email address',
  PASSWORD_TOO_SHORT: `Password must be at least ${VALIDATION_LIMITS.USER.MIN_PASSWORD_LENGTH} characters long`,
  DESCRIPTION_TOO_LONG: (limit) => `Description cannot exceed ${limit} characters`,
  INVALID_TRANSACTION_TYPE: 'Type must be either income or expense'
};