import PlannedPayment from "../models/PlannedPayment.js";
import Transaction from "../models/Transaction.js";

/**
 * Check if a user has any overdue expense planned payments
 * @param {string} userId - The user's ID
 * @returns {Promise<{hasOverdueExpenses: boolean, overduePayments: Array}>}
 */
export const checkOverdueExpensePayments = async (userId) => {
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
};

/**
 * Validate if user can create expense transactions based on overdue planned payments
 * @param {string} userId - The user's ID
 * @returns {Promise<{isValid: boolean, message?: string, overduePayments?: Array}>}
 */
export const validateExpenseTransactionCreation = async (userId) => {
    try {
        const { hasOverdueExpenses, overduePayments } = await checkOverdueExpensePayments(userId);
        
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
};

/**
 * Validate if user can create new planned payments based on overdue expense planned payments
 * @param {string} userId - The user's ID
 * @param {string} paymentType - The type of payment being created ('income' or 'expense')
 * @returns {Promise<{isValid: boolean, message?: string, overduePayments?: Array}>}
 */
export const validatePlannedPaymentCreation = async (userId, paymentType = 'expense') => {
    try {
        const { hasOverdueExpenses, overduePayments } = await checkOverdueExpensePayments(userId);
        
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
};

/**
 * Validate if user has sufficient balance to settle an expense planned payment
 * @param {string} userId - The user's ID
 * @param {number} expenseAmount - The amount of the expense payment to settle
 * @returns {Promise<{isValid: boolean, message?: string, details?: object}>}
 */
export const validateBalanceForExpenseSettlement = async (userId, expenseAmount) => {
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
};