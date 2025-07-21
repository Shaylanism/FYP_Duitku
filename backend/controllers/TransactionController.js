import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";

class TransactionController {
    // Create transaction
    async createTransaction(req, res) {
        try {
            const { type, amount, description, category } = req.body;
            const userId = req.user._id; // From auth middleware

            // Validation
            if (!type || !amount || !description) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Type, amount, and description are required" 
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

            // Create new transaction
            const newTransaction = new Transaction({
                user: userId,
                type,
                amount: parseFloat(amount),
                description: description.trim(),
                category: category || 'General'
            });
            
            await newTransaction.save();
            
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
            const { page = 1, limit = 10, type, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

            // Build query
            const query = { user: userId };
            if (type && ['income', 'expense'].includes(type)) {
                query.type = type;
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

            // Calculate totals
            const totalIncome = await Transaction.aggregate([
                { $match: { user: userId, type: 'income' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);

            const totalExpense = await Transaction.aggregate([
                { $match: { user: userId, type: 'expense' } },
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
            const { type, amount, description, category } = req.body;
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

            // Find transaction and ensure it belongs to the user
            const transaction = await Transaction.findOne({ _id: id, user: userId });
            if (!transaction) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Transaction not found or not authorized" 
                });
            }

            // Update fields
            if (type) transaction.type = type;
            if (amount) transaction.amount = parseFloat(amount);
            if (description) transaction.description = description.trim();
            if (category) transaction.category = category;

            await transaction.save();
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

            // Find and delete transaction, ensuring it belongs to the user
            const transaction = await Transaction.findOneAndDelete({ _id: id, user: userId });
            if (!transaction) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Transaction not found or not authorized" 
                });
            }

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
}

export default new TransactionController(); 