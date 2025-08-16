/**
 * Budget validation logic
 * Centralized validation for budget-related operations
 */

import { VALIDATION_LIMITS, ERROR_MESSAGES, REGEX_PATTERNS } from '../constants/validation.js';

export class BudgetValidator {
  /**
   * Validate budget creation data
   */
  static validateCreate(data) {
    const errors = [];
    const { category, budgetAmount, month } = data;

    // Required fields
    if (!category || !budgetAmount || !month) {
      errors.push(ERROR_MESSAGES.REQUIRED_FIELDS(['category', 'budgetAmount', 'month']));
    }

    // Budget amount validation
    if (budgetAmount !== undefined && (isNaN(budgetAmount) || parseFloat(budgetAmount) < VALIDATION_LIMITS.BUDGET.MIN_AMOUNT)) {
      errors.push(ERROR_MESSAGES.INVALID_BUDGET_AMOUNT);
    }

    // Month format validation
    if (month && !REGEX_PATTERNS.MONTH_FORMAT.test(month)) {
      errors.push(ERROR_MESSAGES.INVALID_MONTH_FORMAT);
    }

    // Past month validation
    if (month && this.isPastMonth(month)) {
      errors.push('Cannot create budgets for past months. You can only set budgets for the current month or future months.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate budget update data
   */
  static validateUpdate(data) {
    const errors = [];
    const { category, budgetAmount, month } = data;

    // Budget amount validation (if provided)
    if (budgetAmount !== undefined && (isNaN(budgetAmount) || parseFloat(budgetAmount) < VALIDATION_LIMITS.BUDGET.MIN_AMOUNT)) {
      errors.push(ERROR_MESSAGES.INVALID_BUDGET_AMOUNT);
    }

    // Month format validation (if provided)
    if (month && !REGEX_PATTERNS.MONTH_FORMAT.test(month)) {
      errors.push(ERROR_MESSAGES.INVALID_MONTH_FORMAT);
    }

    // Past month validation (if provided)
    if (month && this.isPastMonth(month)) {
      errors.push('Cannot modify budgets for past months. You can only edit budgets for the current month or future months.');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate query parameters
   */
  static validateQuery(query) {
    const errors = [];
    const { month, category, amount } = query;

    // Month format validation (if provided)
    if (month && !REGEX_PATTERNS.MONTH_FORMAT.test(month)) {
      errors.push(ERROR_MESSAGES.INVALID_MONTH_FORMAT);
    }

    // Amount validation (if provided)
    if (amount !== undefined && (isNaN(amount) || parseFloat(amount) < VALIDATION_LIMITS.BUDGET.MIN_AMOUNT)) {
      errors.push(ERROR_MESSAGES.INVALID_BUDGET_AMOUNT);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Check if month is in the past
   */
  static isPastMonth(month) {
    const currentMonth = new Date().toISOString().slice(0, 7);
    return month < currentMonth;
  }

  /**
   * Validate ObjectId format
   */
  static validateObjectId(id) {
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  }
}