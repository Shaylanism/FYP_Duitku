import Transaction from "../models/Transaction.js";
import Budget from "../models/Budget.js";
import mongoose from "mongoose";
import { validateExpenseTransactionCreation } from "../utils/plannedPaymentValidation.js";
import TransactionHistoryController from "./TransactionHistoryController.js";

class TransactionController {
    // Get categories for transaction types
    async getCategories(req, res) {
        try {
            const categories = {
                income: Transaction.getIncomeCategories(),
                expense: Transaction.getExpenseCategories()
            };
            
            res.status(200).json({
                success: true,
                categories
            });
        } catch (error) {
            console.error("Error fetching categories:", error.message);
            res.status(500).json({
                success: false,
                message: "Failed to fetch categories"
            });
        }
    }

    // Check budget exceedance endpoint
    async checkBudgetForTransaction(req, res) {
        try {
            const { category, amount } = req.query;
            const userId = req.user._id;

            // Validation
            if (!category || !amount) {
                return res.status(400).json({
                    success: false,
                    message: "Category and amount are required"
                });
            }

            const transactionAmount = parseFloat(amount);
            if (transactionAmount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Amount must be greater than 0"
                });
            }

            const budgetCheck = await this.checkBudgetExceedance(userId, category, transactionAmount);

            res.status(200).json({
                success: true,
                ...budgetCheck
            });
        } catch (error) {
            console.error("Error checking budget for transaction:", error.message);
            res.status(500).json({
                success: false,
                message: "Failed to check budget for transaction"
            });
        }
    }

    // Create transaction
    async createTransaction(req, res) {
        try {
            const { type, amount, description, category, forceBudgetOverride } = req.body;
            const userId = req.user._id; // From auth middleware

            // Validation
            if (!type || !amount || !category) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Type, amount, and category are required" 
                });
            }

            if (!['income', 'expense'].includes(type)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Type must be either 'income' or 'expense'" 
                });
            }

            if (amount <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Amount must be greater than 0" 
                });
            }

            // Validate description length if provided
            if (description && description.trim().length > 90) {
                return res.status(400).json({
                    success: false,
                    message: "Description cannot exceed 90 characters"
                });
            }

            // Validate category based on type
            const validCategories = Transaction.getCategoriesByType(type);
            if (!validCategories.includes(category)) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid category '${category}' for ${type} transaction. Valid categories are: ${validCategories.join(', ')}`
                });
            }

            // Income validation for expense transactions
            if (type === 'expense') {
                // Check for overdue expense planned payments first
                const overdueValidation = await validateExpenseTransactionCreation(userId);
                if (!overdueValidation.isValid) {
                    return res.status(400).json({
                        success: false,
                        message: overdueValidation.message,
                        errorType: overdueValidation.errorType,
                        overduePayments: overdueValidation.overduePayments
                    });
                }

                const incomeValidation = await this.validateIncomeForExpense(userId, parseFloat(amount));
                if (!incomeValidation.isValid) {
                    return res.status(400).json({
                        success: false,
                        message: incomeValidation.message,
                        errorType: incomeValidation.errorType
                    });
                }

                // Check budget exceedance for expense transactions
                if (!forceBudgetOverride) {
                    const budgetCheck = await this.checkBudgetExceedance(userId, category, parseFloat(amount));
                    if (budgetCheck.hasExceedance) {
                        return res.status(400).json({
                            success: false,
                            message: "This transaction will exceed your budget",
                            errorType: "BUDGET_EXCEEDED",
                            budgetInfo: budgetCheck.budgetInfo
                        });
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
            
            res.status(201).json({ 
                success: true, 
                message: "Transaction created successfully", 
                transaction: newTransaction 
            });
        } catch (error) {
            console.error("Error creating transaction:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to create transaction"
            });
        }
    }

    // Get user's transactions
    async getTransactions(req, res) {
        try {
            const userId = req.user._id;
            const { page = 1, limit = 10, type, category, month, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

            // Build query
            const query = { user: userId };
            if (type && ['income', 'expense'].includes(type)) {
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

            // Calculate totals with same filtering as main query
            const incomeQuery = { user: userId, type: 'income' };
            const expenseQuery = { user: userId, type: 'expense' };
            
            // Apply month filtering to aggregation queries if present
            if (query.createdAt) {
                incomeQuery.createdAt = query.createdAt;
                expenseQuery.createdAt = query.createdAt;
            }

            // Apply category filtering to aggregation queries if present
            if (query.category) {
                incomeQuery.category = query.category;
                expenseQuery.category = query.category;
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

            res.status(200).json({ 
                success: true, 
                transactions,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalTransactions: total,
                    hasNextPage: skip + parseInt(limit) < total,
                    hasPrevPage: parseInt(page) > 1
                },
                summary: {
                    totalIncome: incomeTotal,
                    totalExpense: expenseTotal,
                    balance: balance
                }
            });
        } catch (error) {
            console.error("Error fetching transactions:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to fetch transactions"
            });
        }
    }

    // Update transaction
    async updateTransaction(req, res) {
        try {
            const { id } = req.params;
            const { type, amount, description, category, forceBudgetOverride } = req.body;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid transaction ID"
                });
            }

            // Validation
            if (type && !['income', 'expense'].includes(type)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Type must be either 'income' or 'expense'" 
                });
            }

            if (amount && amount <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Amount must be greater than 0" 
                });
            }

            // Validate description length if provided
            if (description && description.trim().length > 90) {
                return res.status(400).json({
                    success: false,
                    message: "Description cannot exceed 90 characters"
                });
            }

            // Find transaction and ensure it belongs to the user
            const transaction = await Transaction.findOne({ _id: id, user: userId });
            if (!transaction) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Transaction not found or not authorized" 
                });
            }

            // Store original data for history tracking
            const originalData = {
                type: transaction.type,
                amount: transaction.amount,
                description: transaction.description,
                category: transaction.category,
                createdAt: transaction.createdAt
            };

            // Validate category if provided and using predefined categories only
            const transactionType = type || transaction.type;
            if (category) {
                const validCategories = Transaction.getCategoriesByType(transactionType);
                if (!validCategories.includes(category)) {
                    // For updates, we'll be more permissive to maintain backward compatibility
                    // But we'll still provide feedback about valid categories
                    console.warn(`Category '${category}' is not in predefined list for ${transactionType}. Valid categories are: ${validCategories.join(', ')}`);
                }
            }

            // Income validation for expense transactions during updates
            const finalAmount = amount ? parseFloat(amount) : transaction.amount;
            const finalCategory = category || transaction.category;
            
            if (transactionType === 'expense') {
                // Check for overdue expense planned payments first
                const overdueValidation = await validateExpenseTransactionCreation(userId);
                if (!overdueValidation.isValid) {
                    return res.status(400).json({
                        success: false,
                        message: overdueValidation.message,
                        errorType: overdueValidation.errorType,
                        overduePayments: overdueValidation.overduePayments
                    });
                }

                // Calculate the amount difference for validation
                const amountDifference = transaction.type === 'expense' 
                    ? finalAmount - transaction.amount 
                    : finalAmount;
                
                if (amountDifference > 0) {
                    const incomeValidation = await this.validateIncomeForExpense(userId, amountDifference, transaction._id);
                    if (!incomeValidation.isValid) {
                        return res.status(400).json({
                            success: false,
                            message: incomeValidation.message,
                            errorType: incomeValidation.errorType
                        });
                    }
                }

                // Check budget exceedance for expense transaction updates
                if (!forceBudgetOverride) {
                    const budgetCheck = await this.checkBudgetExceedance(userId, finalCategory, finalAmount, transaction._id);
                    if (budgetCheck.hasExceedance) {
                        return res.status(400).json({
                            success: false,
                            message: "This transaction update will exceed your budget",
                            errorType: "BUDGET_EXCEEDED",
                            budgetInfo: budgetCheck.budgetInfo
                        });
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
            
            res.status(200).json({ 
                success: true, 
                message: "Transaction updated successfully", 
                transaction 
            });
        } catch (error) {
            console.error("Error updating transaction:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to update transaction"
            });
        }
    }

    // Delete transaction
    async deleteTransaction(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid transaction ID"
                });
            }

            // Find transaction first to get data for history
            const transaction = await Transaction.findOne({ _id: id, user: userId });
            if (!transaction) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Transaction not found or not authorized" 
                });
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
            await Transaction.findOneAndDelete({ _id: id, user: userId });

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

            res.status(200).json({ 
                success: true, 
                message: "Transaction deleted successfully" 
            });
        } catch (error) {
            console.error("Error deleting transaction:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to delete transaction"
            });
        }
    }

    // Get transaction by ID
    async getTransactionById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid transaction ID"
                });
            }

            const transaction = await Transaction.findOne({ _id: id, user: userId })
                .populate('user', 'name email');

            if (!transaction) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Transaction not found or not authorized" 
                });
            }

            res.status(200).json({ 
                success: true, 
                transaction 
            });
        } catch (error) {
            console.error("Error fetching transaction:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to fetch transaction"
            });
        }
    }

    // Helper method to check budget exceedance for expense transactions
    async checkBudgetExceedance(userId, category, amount, excludeTransactionId = null) {
        try {
            const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM format

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
                type: 'expense',
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

    // Helper method to validate income for expense transactions
    async validateIncomeForExpense(userId, expenseAmount, excludeTransactionId = null) {
        try {
            // Get user's total income
            const incomeQuery = { user: userId, type: 'income' };
            const totalIncomeResult = await Transaction.aggregate([
                { $match: incomeQuery },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalIncome = totalIncomeResult[0]?.total || 0;

            // Check if user has any income
            if (totalIncome === 0) {
                return {
                    isValid: false,
                    message: "You cannot add expenses without any recorded income. Please add an income transaction first.",
                    errorType: "NO_INCOME"
                };
            }

            // Get user's total expenses (excluding the transaction being updated if any)
            const expenseQuery = { user: userId, type: 'expense' };
            if (excludeTransactionId) {
                expenseQuery._id = { $ne: excludeTransactionId };
            }
            
            const totalExpenseResult = await Transaction.aggregate([
                { $match: expenseQuery },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalExpenses = totalExpenseResult[0]?.total || 0;

            // Check if new expense would exceed income
            const potentialTotalExpenses = totalExpenses + expenseAmount;
            if (potentialTotalExpenses > totalIncome) {
                const availableAmount = totalIncome - totalExpenses;
                return {
                    isValid: false,
                    message: `Insufficient income. You have RM${availableAmount.toFixed(2)} available to spend, but you're trying to spend RM${expenseAmount.toFixed(2)}.`,
                    errorType: "INSUFFICIENT_INCOME",
                    details: {
                        totalIncome,
                        totalExpenses,
                        availableAmount,
                        requestedAmount: expenseAmount
                    }
                };
            }

            return {
                isValid: true,
                message: "Income validation passed"
            };
        } catch (error) {
            console.error("Error validating income:", error.message);
            return {
                isValid: false,
                message: "Failed to validate income. Please try again.",
                errorType: "VALIDATION_ERROR"
            };
        }
    }
}

export default new TransactionController(); 