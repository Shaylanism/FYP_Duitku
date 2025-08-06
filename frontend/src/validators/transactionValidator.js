/**
 * Frontend transaction validation
 * Client-side validation for transaction forms
 */

import { VALIDATION_LIMITS, ERROR_MESSAGES, TRANSACTION_TYPES } from '../constants/validation.js';

export const transactionValidator = {
  /**
   * Validate transaction form data
   */
  validateTransactionForm: (data) => {
    const errors = {};
    const { type, amount, description, category } = data;

    // Required fields
    if (!type) errors.type = 'Transaction type is required';
    if (!amount) errors.amount = 'Amount is required';
    if (!category) errors.category = 'Category is required';

    // Type validation
    if (type && !Object.values(TRANSACTION_TYPES).includes(type)) {
      errors.type = ERROR_MESSAGES.INVALID_TRANSACTION_TYPE;
    }

    // Amount validation
    if (amount !== undefined && amount !== '') {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount < VALIDATION_LIMITS.TRANSACTION.MIN_AMOUNT) {
        errors.amount = ERROR_MESSAGES.INVALID_AMOUNT;
      }
    }

    // Description validation
    if (description && description.trim().length > VALIDATION_LIMITS.TRANSACTION.MAX_DESCRIPTION_LENGTH) {
      errors.description = ERROR_MESSAGES.DESCRIPTION_TOO_LONG(VALIDATION_LIMITS.TRANSACTION.MAX_DESCRIPTION_LENGTH);
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Validate amount input
   */
  validateAmount: (amount) => {
    if (!amount || amount === '') {
      return { isValid: false, error: 'Amount is required' };
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) {
      return { isValid: false, error: 'Amount must be a valid number' };
    }

    if (numAmount < VALIDATION_LIMITS.TRANSACTION.MIN_AMOUNT) {
      return { isValid: false, error: ERROR_MESSAGES.INVALID_AMOUNT };
    }

    return { isValid: true };
  },

  /**
   * Validate description length
   */
  validateDescription: (description) => {
    if (!description) return { isValid: true };

    if (description.trim().length > VALIDATION_LIMITS.TRANSACTION.MAX_DESCRIPTION_LENGTH) {
      return {
        isValid: false,
        error: ERROR_MESSAGES.DESCRIPTION_TOO_LONG(VALIDATION_LIMITS.TRANSACTION.MAX_DESCRIPTION_LENGTH)
      };
    }

    return { isValid: true };
  }
};