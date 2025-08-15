/**
 * Transaction Service
 * Business logic layer for transaction operations
 */

import Transaction from '../models/Transaction.js';
import Budget from '../models/Budget.js';
import { validateExpenseTransactionCreation } from '../utils/plannedPaymentValidation.js';
import TransactionHistoryController from '../controllers/TransactionHistoryController.js';
import { TRANSACTION_TYPES, getCategoriesByType } from '../constants/categories.js';
import { ERROR_TYPES } from '../constants/responses.js';

export class TransactionService {
  /**
   * Get transaction categories
   */
  static getCategories() {
    return {
      income: Transaction.getIncomeCategories(),
      expense: Transaction.getExpenseCategories()
    };
  }

  /**
   * Create a new transaction
   */
  static async createTransaction(userId, transactionData, forceBudgetOverride = false) {
    const { type, amount, description, category } = transactionData;

    // Income validation for expense transactions
    if (type === TRANSACTION_TYPES.EXPENSE) {
      // Check for overdue expense planned payments first
      const overdueValidation = await validateExpenseTransactionCreation(userId);
      if (!overdueValidation.isValid) {
        const error = new Error(overdueValidation.message);
        error.type = ERROR_TYPES.OVERDUE_PLANNED_PAYMENTS;
        error.overduePayments = overdueValidation.overduePayments;
        throw error;
      }

      const monthlyBalanceValidation = await this.validateMonthlyBalanceForExpense(userId, parseFloat(amount));
      if (!monthlyBalanceValidation.isValid) {
        const error = new Error(monthlyBalanceValidation.message);
        error.type = monthlyBalanceValidation.errorType;
        error.details = monthlyBalanceValidation.details;
        throw error;
      }

      // Check budget exceedance for expense transactions
      if (!forceBudgetOverride) {
        const budgetCheck = await this.checkBudgetExceedance(userId, category, parseFloat(amount));
        if (budgetCheck.hasExceedance) {
          const error = new Error("This transaction will exceed your budget");
          error.type = ERROR_TYPES.BUDGET_EXCEEDED;
          error.budgetInfo = budgetCheck.budgetInfo;
          throw error;
        }
      }
    }

    // Create new transaction
    const newTransaction = new Transaction({
      user: userId,
      type,
      amount: parseFloat(amount),
      description: description ? description.trim() : '',
      category
    });
    
    await newTransaction.save();
    
    // Create history entry for transaction creation
    await TransactionHistoryController.createEntry({
      user: userId,
      action: 'CREATE',
      transactionId: newTransaction._id,
      newData: {
        type: newTransaction.type,
        amount: newTransaction.amount,
        description: newTransaction.description,
        category: newTransaction.category,
        createdAt: newTransaction.createdAt
      },
      description: `Added new ${newTransaction.type} transaction: ${newTransaction.category} - ${newTransaction.description || 'No description'}`,
      metadata: {
        source: 'MANUAL'
      }
    });
    
    // Populate user info for response
    await newTransaction.populate('user', 'name email');
    
    return newTransaction;
  }

  /**
   * Get transactions with filters and pagination
   */
  static async getTransactions(userId, filters = {}) {
    const { page = 1, limit = 10, type, category, month, sortBy = 'createdAt', sortOrder = 'desc' } = filters;

    // Build query
    const query = { user: userId };
    if (type && Object.values(TRANSACTION_TYPES).includes(type)) {
      query.type = type;
    }

    // Add category filtering if provided
    if (category && category.trim() !== '') {
      query.category = category;
    }

    // Add month filtering if provided (YYYY-MM format)
    if (month) {
      const monthRegex = /^\d{4}-\d{2}$/;
      if (monthRegex.test(month)) {
        // Create date range for the entire month
        const startDate = new Date(`${month}-01T00:00:00.000Z`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        
        query.createdAt = {
          $gte: startDate,
          $lt: endDate
        };
      }
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

    // Get transactions with pagination
    const transactions = await Transaction.find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .populate('user', 'name email');

    // Get total count for pagination
    const total = await Transaction.countDocuments(query);

    // Calculate summary
    const summary = await this.calculateTransactionSummary(userId, { month, category });

    return {
      transactions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTransactions: total,
        hasNextPage: skip + parseInt(limit) < total,
        hasPrevPage: parseInt(page) > 1
      },
      summary
    };
  }

  /**
   * Calculate transaction summary for given filters
   */
  static async calculateTransactionSummary(userId, filters = {}) {
    const { month, category } = filters;

    // Build base queries
    const incomeQuery = { user: userId, type: TRANSACTION_TYPES.INCOME };
    const expenseQuery = { user: userId, type: TRANSACTION_TYPES.EXPENSE };
    
    // Apply month filtering if present
    if (month) {
      const monthRegex = /^\d{4}-\d{2}$/;
      if (monthRegex.test(month)) {
        const startDate = new Date(`${month}-01T00:00:00.000Z`);
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + 1);
        
        const dateFilter = {
          $gte: startDate,
          $lt: endDate
        };
        
        incomeQuery.createdAt = dateFilter;
        expenseQuery.createdAt = dateFilter;
      }
    }

    // Apply category filtering if present
    if (category) {
      incomeQuery.category = category;
      expenseQuery.category = category;
    }

    const totalIncome = await Transaction.aggregate([
      { $match: incomeQuery },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const totalExpense = await Transaction.aggregate([
      { $match: expenseQuery },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);

    const incomeTotal = totalIncome[0]?.total || 0;
    const expenseTotal = totalExpense[0]?.total || 0;
    const balance = incomeTotal - expenseTotal;

    return {
      totalIncome: incomeTotal,
      totalExpense: expenseTotal,
      balance: balance
    };
  }

  /**
   * Update a transaction
   */
  static async updateTransaction(userId, transactionId, updateData, forceBudgetOverride = false) {
    const { type, amount, description, category } = updateData;

    // Find transaction and ensure it belongs to the user
    const transaction = await Transaction.findOne({ _id: transactionId, user: userId });
    if (!transaction) {
      const error = new Error("Transaction not found or not authorized");
      error.type = ERROR_TYPES.NOT_FOUND;
      throw error;
    }

    // Store original data for history tracking
    const originalData = {
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category,
      createdAt: transaction.createdAt
    };

    const transactionType = type || transaction.type;
    const finalAmount = amount ? parseFloat(amount) : transaction.amount;
    const finalCategory = category || transaction.category;
    
    if (transactionType === TRANSACTION_TYPES.EXPENSE) {
      // Check for overdue expense planned payments first
      const overdueValidation = await validateExpenseTransactionCreation(userId);
      if (!overdueValidation.isValid) {
        const error = new Error(overdueValidation.message);
        error.type = ERROR_TYPES.OVERDUE_PLANNED_PAYMENTS;
        error.overduePayments = overdueValidation.overduePayments;
        throw error;
      }

      // Calculate the amount difference for validation
      const amountDifference = transaction.type === TRANSACTION_TYPES.EXPENSE 
        ? finalAmount - transaction.amount 
        : finalAmount;
      
      if (amountDifference > 0) {
        const monthlyBalanceValidation = await this.validateMonthlyBalanceForExpense(userId, amountDifference, transaction._id);
        if (!monthlyBalanceValidation.isValid) {
          const error = new Error(monthlyBalanceValidation.message);
          error.type = monthlyBalanceValidation.errorType;
          error.details = monthlyBalanceValidation.details;
          throw error;
        }
      }

      // Check budget exceedance for expense transaction updates
      if (!forceBudgetOverride) {
        const budgetCheck = await this.checkBudgetExceedance(userId, finalCategory, finalAmount, transaction._id);
        if (budgetCheck.hasExceedance) {
          const error = new Error("This transaction update will exceed your budget");
          error.type = ERROR_TYPES.BUDGET_EXCEEDED;
          error.budgetInfo = budgetCheck.budgetInfo;
          throw error;
        }
      }
    }

    // Update fields
    if (type) transaction.type = type;
    if (amount) transaction.amount = parseFloat(amount);
    if (description !== undefined) transaction.description = description ? description.trim() : '';
    if (category) transaction.category = category;

    await transaction.save();

    // Create history entry for transaction update
    const newData = {
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category,
      createdAt: transaction.createdAt
    };

    await TransactionHistoryController.createEntry({
      user: userId,
      action: 'UPDATE',
      transactionId: transaction._id,
      previousData: originalData,
      newData: newData,
      description: `Modified ${transaction.type} transaction: ${transaction.category} - ${transaction.description || 'No description'}`,
      metadata: {
        source: 'MANUAL'
      }
    });

    await transaction.populate('user', 'name email');
    
    return transaction;
  }

  /**
   * Delete a transaction
   */
  static async deleteTransaction(userId, transactionId) {
    // Find transaction first to get data for history
    const transaction = await Transaction.findOne({ _id: transactionId, user: userId });
    if (!transaction) {
      const error = new Error("Transaction not found or not authorized");
      error.type = ERROR_TYPES.NOT_FOUND;
      throw error;
    }

    // Store transaction data for history
    const deletedData = {
      type: transaction.type,
      amount: transaction.amount,
      description: transaction.description,
      category: transaction.category,
      createdAt: transaction.createdAt
    };

    // Delete the transaction
    await Transaction.findOneAndDelete({ _id: transactionId, user: userId });

    // Create history entry for transaction deletion
    await TransactionHistoryController.createEntry({
      user: userId,
      action: 'DELETE',
      transactionId: null, // Transaction no longer exists
      previousData: deletedData,
      description: `Deleted ${deletedData.type} transaction: ${deletedData.category} - ${deletedData.description || 'No description'}`,
      metadata: {
        source: 'MANUAL'
      }
    });

    return true;
  }

  /**
   * Get transaction by ID
   */
  static async getTransactionById(userId, transactionId) {
    const transaction = await Transaction.findOne({ _id: transactionId, user: userId })
      .populate('user', 'name email');

    if (!transaction) {
      const error = new Error("Transaction not found or not authorized");
      error.type = ERROR_TYPES.NOT_FOUND;
      throw error;
    }

    return transaction;
  }

  /**
   * Helper method to check budget exceedance for expense transactions
   */
  static async checkBudgetExceedance(userId, category, amount, excludeTransactionId = null) {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);

      // Check if budget exists for this category and current month
      const budget = await Budget.findOne({
        user: userId,
        category: category.trim(),
        month: currentMonth
      });

      if (!budget) {
        return {
          hasExceedance: false,
          hasBudget: false
        };
      }

      // Create date range for the current month
      const startDate = new Date(`${currentMonth}-01T00:00:00.000Z`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      // Get existing transactions for this category and month
      const query = {
        user: userId,
        category: category.trim(),
        type: TRANSACTION_TYPES.EXPENSE,
        createdAt: {
          $gte: startDate,
          $lt: endDate
        }
      };

      // Exclude the transaction being updated if any
      if (excludeTransactionId) {
        query._id = { $ne: excludeTransactionId };
      }

      const transactions = await Transaction.find(query);

      // Calculate total spent
      const currentSpent = transactions.reduce((sum, transaction) => sum + transaction.amount, 0);
      const totalAfterTransaction = currentSpent + amount;
      const remainingBudget = budget.budgetAmount - currentSpent;
      const exceedanceAmount = totalAfterTransaction - budget.budgetAmount;

      const hasExceedance = totalAfterTransaction > budget.budgetAmount;

      return {
        hasExceedance,
        hasBudget: true,
        budgetInfo: {
          category: budget.category,
          budgetAmount: budget.budgetAmount,
          currentSpent,
          remainingBudget,
          transactionAmount: amount,
          totalAfterTransaction,
          exceedanceAmount: hasExceedance ? exceedanceAmount : 0,
          month: currentMonth
        }
      };
    } catch (error) {
      console.error("Error checking budget exceedance:", error.message);
      return {
        hasExceedance: false,
        hasBudget: false,
        error: "Failed to check budget exceedance"
      };
    }
  }

  /**
   * Helper method to validate monthly balance for expense transactions
   */
  static async validateMonthlyBalanceForExpense(userId, expenseAmount, excludeTransactionId = null) {
    try {
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format
      
      // Create date range for the current month
      const startDate = new Date(`${currentMonth}-01T00:00:00.000Z`);
      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);

      // Get current month's income
      const monthlyIncomeQuery = { 
        user: userId, 
        type: TRANSACTION_TYPES.INCOME,
        createdAt: {
          $gte: startDate,
          $lt: endDate
        }
      };
      
      const monthlyIncomeResult = await Transaction.aggregate([
        { $match: monthlyIncomeQuery },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const monthlyIncome = monthlyIncomeResult[0]?.total || 0;

      // Check if user has any income for this month
      if (monthlyIncome === 0) {
        return {
          isValid: false,
          message: "You cannot add expenses without any income recorded for this month. Please add an income transaction first.",
          errorType: ERROR_TYPES.NO_INCOME,
          details: {
            monthlyIncome: 0,
            monthlyExpenses: 0,
            availableBalance: 0,
            requestedAmount: expenseAmount,
            month: currentMonth
          }
        };
      }

      // Get current month's expenses (excluding the transaction being updated if any)
      const monthlyExpenseQuery = { 
        user: userId, 
        type: TRANSACTION_TYPES.EXPENSE,
        createdAt: {
          $gte: startDate,
          $lt: endDate
        }
      };
      
      if (excludeTransactionId) {
        monthlyExpenseQuery._id = { $ne: excludeTransactionId };
      }
      
      const monthlyExpenseResult = await Transaction.aggregate([
        { $match: monthlyExpenseQuery },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const monthlyExpenses = monthlyExpenseResult[0]?.total || 0;

      // Calculate available monthly balance
      const availableMonthlyBalance = monthlyIncome - monthlyExpenses;
      
      // Check if new expense would exceed monthly balance
      if (expenseAmount > availableMonthlyBalance) {
        return {
          isValid: false,
          message: `Insufficient monthly balance. You have RM${availableMonthlyBalance.toFixed(2)} available this month, but you're trying to spend RM${expenseAmount.toFixed(2)}.`,
          errorType: ERROR_TYPES.INSUFFICIENT_MONTHLY_BALANCE,
          details: {
            monthlyIncome,
            monthlyExpenses,
            availableBalance: availableMonthlyBalance,
            requestedAmount: expenseAmount,
            month: currentMonth
          }
        };
      }

      return {
        isValid: true,
        message: "Monthly balance validation passed",
        details: {
          monthlyIncome,
          monthlyExpenses,
          availableBalance: availableMonthlyBalance,
          requestedAmount: expenseAmount,
          month: currentMonth
        }
      };
    } catch (error) {
      console.error("Error validating monthly balance:", error.message);
      return {
        isValid: false,
        message: "Failed to validate monthly balance. Please try again.",
        errorType: ERROR_TYPES.VALIDATION_ERROR
      };
    }
  }
}