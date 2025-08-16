/**
 * Planned Payment validation logic
 * Centralized validation for planned payment-related operations
 */

import { VALIDATION_LIMITS, ERROR_MESSAGES } from '../constants/validation.js';
import PlannedPayment from '../models/PlannedPayment.js';
import Transaction from '../models/Transaction.js';

export class PlannedPaymentValidator {
  /**
   * Validate planned payment creation data
   */
  static validateCreate(data) {
    const errors = [];
    const { title, amount, category, dueDay, paymentType = 'expense', description } = data;

    // Required fields
    if (!title || !amount || !category || !dueDay) {
      errors.push(ERROR_MESSAGES.REQUIRED_FIELDS(['title', 'amount', 'category', 'dueDay']));
    }

    // Amount validation
    if (amount !== undefined && (isNaN(amount) || parseFloat(amount) < VALIDATION_LIMITS.PLANNED_PAYMENT.MIN_AMOUNT)) {
      errors.push(ERROR_MESSAGES.INVALID_PLANNED_PAYMENT_AMOUNT);
    }

    // Payment type validation
    if (paymentType && !['income', 'expense'].includes(paymentType)) {
      errors.push('Payment type must be either "income" or "expense"');
    }

    // Title length validation
    if (title && title.trim().length > 40) {
      errors.push('Title cannot exceed 40 characters');
    }

    // Description length validation
    if (description && description.trim().length > 30) {
      errors.push('Description cannot exceed 30 characters');
    }

    // Due day validation
    if (dueDay !== undefined && (isNaN(dueDay) || parseInt(dueDay) < VALIDATION_LIMITS.PLANNED_PAYMENT.MIN_DUE_DAY || parseInt(dueDay) > VALIDATION_LIMITS.PLANNED_PAYMENT.MAX_DUE_DAY)) {
      errors.push(`Due day must be between ${VALIDATION_LIMITS.PLANNED_PAYMENT.MIN_DUE_DAY} and ${VALIDATION_LIMITS.PLANNED_PAYMENT.MAX_DUE_DAY}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate planned payment update data
   */
  static validateUpdate(data) {
    const errors = [];
    const { title, amount, category, dueDay, paymentType, description } = data;

    // Amount validation (if provided)
    if (amount !== undefined && (isNaN(amount) || parseFloat(amount) < VALIDATION_LIMITS.PLANNED_PAYMENT.MIN_AMOUNT)) {
      errors.push(ERROR_MESSAGES.INVALID_PLANNED_PAYMENT_AMOUNT);
    }

    // Payment type validation (if provided)
    if (paymentType && !['income', 'expense'].includes(paymentType)) {
      errors.push('Payment type must be either "income" or "expense"');
    }

    // Title length validation (if provided)
    if (title && title.trim().length > 40) {
      errors.push('Title cannot exceed 40 characters');
    }

    // Description length validation (if provided)
    if (description !== undefined && description.trim().length > 30) {
      errors.push('Description cannot exceed 30 characters');
    }

    // Due day validation (if provided)
    if (dueDay !== undefined && (isNaN(dueDay) || parseInt(dueDay) < VALIDATION_LIMITS.PLANNED_PAYMENT.MIN_DUE_DAY || parseInt(dueDay) > VALIDATION_LIMITS.PLANNED_PAYMENT.MAX_DUE_DAY)) {
      errors.push(`Due day must be between ${VALIDATION_LIMITS.PLANNED_PAYMENT.MIN_DUE_DAY} and ${VALIDATION_LIMITS.PLANNED_PAYMENT.MAX_DUE_DAY}`);
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
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    return objectIdRegex.test(id);
  }

  // ============================================================================
  // BUSINESS LOGIC VALIDATION METHODS
  // ============================================================================

  /**
   * Check if a user has any overdue expense planned payments
   * @param {string} userId - The user's ID
   * @returns {Promise<{hasOverdueExpenses: boolean, overduePayments: Array}>}
   */
  static async checkOverdueExpensePayments(userId) {
    try {
      // Get all active expense planned payments for the user
      const expensePayments = await PlannedPayment.find({ 
        user: userId, 
        isActive: true, 
        paymentType: 'expense' 
      });

      // Filter for overdue payments
      const overduePayments = expensePayments.filter(payment => payment.isOverdue());

      return {
        hasOverdueExpenses: overduePayments.length > 0,
        overduePayments: overduePayments.map(payment => ({
          id: payment._id,
          title: payment.title,
          amount: payment.amount,
          dueDay: payment.dueDay,
          category: payment.category,
          daysOverdue: new Date().getDate() - payment.dueDay
        }))
      };
    } catch (error) {
      console.error("Error checking overdue expense payments:", error);
      throw error;
    }
  }

  /**
   * Validate if user can create expense transactions based on overdue planned payments
   * @param {string} userId - The user's ID
   * @returns {Promise<{isValid: boolean, message?: string, overduePayments?: Array}>}
   */
  static async validateExpenseTransactionCreation(userId) {
    try {
      const { hasOverdueExpenses, overduePayments } = await this.checkOverdueExpensePayments(userId);
      
      if (hasOverdueExpenses) {
        return {
          isValid: false,
          message: "You cannot add expense transactions while you have overdue planned payments. Please settle your overdue payments first.",
          errorType: "OVERDUE_PLANNED_PAYMENTS",
          overduePayments
        };
      }

      return {
        isValid: true
      };
    } catch (error) {
      console.error("Error validating expense transaction creation:", error);
      return {
        isValid: false,
        message: "Failed to validate transaction creation. Please try again.",
        errorType: "VALIDATION_ERROR"
      };
    }
  }

  /**
   * Validate if user can create new planned payments based on overdue expense planned payments
   * @param {string} userId - The user's ID
   * @param {string} paymentType - The type of payment being created ('income' or 'expense')
   * @returns {Promise<{isValid: boolean, message?: string, overduePayments?: Array}>}
   */
  static async validatePlannedPaymentCreation(userId, paymentType = 'expense') {
    try {
      const { hasOverdueExpenses, overduePayments } = await this.checkOverdueExpensePayments(userId);
      
      // Only block expense planned payments when there are overdue expenses
      // Allow income planned payments even when there are overdue expense payments
      if (hasOverdueExpenses && paymentType === 'expense') {
        return {
          isValid: false,
          message: "You cannot create new expense planned payments while you have overdue expense payments. Please settle your overdue payments first.",
          errorType: "OVERDUE_PLANNED_PAYMENTS",
          overduePayments
        };
      }

      return {
        isValid: true
      };
    } catch (error) {
      console.error("Error validating planned payment creation:", error);
      return {
        isValid: false,
        message: "Failed to validate planned payment creation. Please try again.",
        errorType: "VALIDATION_ERROR"
      };
    }
  }

  /**
   * Validate if user has sufficient balance to settle an expense planned payment
   * @param {string} userId - The user's ID
   * @param {number} expenseAmount - The amount of the expense payment to settle
   * @returns {Promise<{isValid: boolean, message?: string, details?: object}>}
   */
  static async validateBalanceForExpenseSettlement(userId, expenseAmount) {
    try {
      // Get user's total income
      const incomeQuery = { user: userId, type: 'income' };
      const totalIncomeResult = await Transaction.aggregate([
        { $match: incomeQuery },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalIncome = totalIncomeResult[0]?.total || 0;

      // Get user's total expenses
      const expenseQuery = { user: userId, type: 'expense' };
      const totalExpenseResult = await Transaction.aggregate([
        { $match: expenseQuery },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalExpenses = totalExpenseResult[0]?.total || 0;

      // Calculate current balance
      const currentBalance = totalIncome - totalExpenses;

      // Check if user has sufficient balance to settle this expense
      if (currentBalance < expenseAmount) {
        return {
          isValid: false,
          message: `Insufficient balance to settle this payment. You have RM${currentBalance.toFixed(2)} available, but need RM${expenseAmount.toFixed(2)}.`,
          errorType: "INSUFFICIENT_BALANCE",
          details: {
            totalIncome,
            totalExpenses,
            currentBalance,
            requiredAmount: expenseAmount
          }
        };
      }

      return {
        isValid: true,
        message: "Balance validation passed"
      };
    } catch (error) {
      console.error("Error validating balance for expense settlement:", error);
      return {
        isValid: false,
        message: "Failed to validate balance. Please try again.",
        errorType: "VALIDATION_ERROR"
      };
    }
  }
}
