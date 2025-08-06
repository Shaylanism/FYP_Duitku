/**
 * Transaction validation logic
 * Centralized validation for transaction-related operations
 */

import { VALIDATION_LIMITS, ERROR_MESSAGES, REGEX_PATTERNS } from '../constants/validation.js';
import { TRANSACTION_TYPES, validateCategory } from '../constants/categories.js';

export class TransactionValidator {
  /**
   * Validate transaction creation data
   */
  static validateCreate(data) {
    const errors = [];
    const { type, amount, description, category } = data;

    // Required fields
    if (!type || !amount || !category) {
      errors.push(ERROR_MESSAGES.REQUIRED_FIELDS(['type', 'amount', 'category']));
    }

    // Type validation
    if (type && !Object.values(TRANSACTION_TYPES).includes(type)) {
      errors.push(ERROR_MESSAGES.INVALID_TRANSACTION_TYPE);
    }

    // Amount validation
    if (amount !== undefined && (isNaN(amount) || parseFloat(amount) < VALIDATION_LIMITS.TRANSACTION.MIN_AMOUNT)) {
      errors.push(ERROR_MESSAGES.INVALID_AMOUNT);
    }

    // Description validation
    if (description && description.trim().length > VALIDATION_LIMITS.TRANSACTION.MAX_DESCRIPTION_LENGTH) {
      errors.push(ERROR_MESSAGES.DESCRIPTION_TOO_LONG(VALIDATION_LIMITS.TRANSACTION.MAX_DESCRIPTION_LENGTH));
    }

    // Category validation
    if (type && category && !validateCategory(type, category)) {
      const validCategories = type === TRANSACTION_TYPES.INCOME ? 
        import('../constants/categories.js').then(m => m.INCOME_CATEGORIES) :
        import('../constants/categories.js').then(m => m.EXPENSE_CATEGORIES);
      // For synchronous validation, we'll handle this in the service layer
      errors.push(`Invalid category for ${type} transaction`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate transaction update data
   */
  static validateUpdate(data) {
    const errors = [];
    const { type, amount, description, category } = data;

    // Type validation (if provided)
    if (type && !Object.values(TRANSACTION_TYPES).includes(type)) {
      errors.push(ERROR_MESSAGES.INVALID_TRANSACTION_TYPE);
    }

    // Amount validation (if provided)
    if (amount !== undefined && (isNaN(amount) || parseFloat(amount) < VALIDATION_LIMITS.TRANSACTION.MIN_AMOUNT)) {
      errors.push(ERROR_MESSAGES.INVALID_AMOUNT);
    }

    // Description validation (if provided)
    if (description !== undefined && description.trim().length > VALIDATION_LIMITS.TRANSACTION.MAX_DESCRIPTION_LENGTH) {
      errors.push(ERROR_MESSAGES.DESCRIPTION_TOO_LONG(VALIDATION_LIMITS.TRANSACTION.MAX_DESCRIPTION_LENGTH));
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate ObjectId format
   */
  static validateObjectId(id) {
    // MongoDB ObjectId validation
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  }
}