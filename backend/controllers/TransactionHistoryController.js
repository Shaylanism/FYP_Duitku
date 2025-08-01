import TransactionHistory from "../models/TransactionHistory.js";
import mongoose from "mongoose";



const transactionHistoryController = {
    // Instance methods
    getTransactionHistory: async function(req, res) {
        try {
            const userId = req.user._id;
            const { 
                page = 1, 
                limit = 20, 
                action, 
                month,
                type,
                category, 
                sortBy = 'createdAt', 
                sortOrder = 'desc' 
            } = req.query;

            // Build query
            const query = { user: userId };
            
            // Filter by action type if provided
            if (action && ['CREATE', 'UPDATE', 'DELETE', 'SETTLE_PLANNED_PAYMENT', 'RECEIVE_PLANNED_PAYMENT'].includes(action)) {
                query.action = action;
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

            // Filter by transaction type if provided
            if (type && ['income', 'expense'].includes(type)) {
                query.$or = [
                    { 'newData.type': type },
                    { 'previousData.type': type }
                ];
            }

            // Filter by transaction category if provided
            if (category && category.trim() !== '') {
                query.$or = query.$or || [];
                const categoryFilter = [
                    { 'newData.category': category },
                    { 'previousData.category': category }
                ];
                
                // If we already have $or from type filter, combine them
                if (query.$or.length > 0) {
                    query.$and = [
                        { $or: query.$or },
                        { $or: categoryFilter }
                    ];
                    delete query.$or;
                } else {
                    query.$or = categoryFilter;
                }
            }

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

            // Get history entries with pagination
            const historyEntries = await TransactionHistory.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('user', 'name email')
                .populate('transactionId', 'type amount description category createdAt')
                .populate('plannedPaymentId', 'title description amount category paymentType dueDay');

            // Get total count for pagination
            const total = await TransactionHistory.countDocuments(query);

            // Add computed fields to each entry
            const enrichedEntries = historyEntries.map(entry => ({
                ...entry.toObject(),
                actionDescription: entry.getActionDescription(),
                changeSummary: entry.getChangeSummary(),
                formattedDate: entry.createdAt.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            }));

            // Calculate summary statistics
            const stats = await transactionHistoryController.getHistoryStats(userId, query.createdAt);

            res.status(200).json({
                success: true,
                history: enrichedEntries,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalEntries: total,
                    hasNextPage: skip + parseInt(limit) < total,
                    hasPrevPage: parseInt(page) > 1
                },
                stats
            });
        } catch (error) {
            console.error("Error fetching transaction history:", error.message);
            res.status(500).json({
                success: false,
                message: "Failed to fetch transaction history"
            });
        }
    },

    getHistoryStats: async function(userId, dateFilter = null) {
        try {
            const matchQuery = { user: userId };
            if (dateFilter) {
                matchQuery.createdAt = dateFilter;
            }

            const stats = await TransactionHistory.aggregate([
                { $match: matchQuery },
                {
                    $group: {
                        _id: '$action',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const result = {
                totalActions: 0,
                creates: 0,
                updates: 0,
                deletes: 0,
                plannedPaymentSettlements: 0
            };

            stats.forEach(stat => {
                result.totalActions += stat.count;
                switch (stat._id) {
                    case 'CREATE':
                        result.creates = stat.count;
                        break;
                    case 'UPDATE':
                        result.updates = stat.count;
                        break;
                    case 'DELETE':
                        result.deletes = stat.count;
                        break;
                    case 'SETTLE_PLANNED_PAYMENT':
                    case 'RECEIVE_PLANNED_PAYMENT':
                        result.plannedPaymentSettlements += stat.count;
                        break;
                }
            });

            return result;
        } catch (error) {
            console.error("Error calculating history stats:", error);
            return {
                totalActions: 0,
                creates: 0,
                updates: 0,
                deletes: 0,
                plannedPaymentSettlements: 0
            };
        }
    },

    getTransactionHistoryById: async function(req, res) {
        try {
            const { transactionId } = req.params;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(transactionId)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid transaction ID"
                });
            }

            const historyEntries = await TransactionHistory.find({
                user: userId,
                transactionId: transactionId
            })
                .sort({ createdAt: -1 })
                .populate('user', 'name email')
                .populate('transactionId', 'type amount description category createdAt')
                .populate('plannedPaymentId', 'title description amount category paymentType dueDay');

            if (historyEntries.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No history found for this transaction"
                });
            }

            // Add computed fields to each entry
            const enrichedEntries = historyEntries.map(entry => ({
                ...entry.toObject(),
                actionDescription: entry.getActionDescription(),
                changeSummary: entry.getChangeSummary(),
                formattedDate: entry.createdAt.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })
            }));

            res.status(200).json({
                success: true,
                history: enrichedEntries
            });
        } catch (error) {
            console.error("Error fetching transaction history by ID:", error.message);
            res.status(500).json({
                success: false,
                message: "Failed to fetch transaction history"
            });
        }
    },

    // Get available categories from transaction history
    getAvailableCategories: async function(req, res) {
        try {
            const userId = req.user._id;

            // Get unique categories from both newData and previousData
            const categories = await TransactionHistory.aggregate([
                { $match: { user: userId } },
                {
                    $group: {
                        _id: null,
                        newCategories: { $addToSet: '$newData.category' },
                        previousCategories: { $addToSet: '$previousData.category' }
                    }
                }
            ]);

            let allCategories = [];
            if (categories.length > 0) {
                const newCats = categories[0].newCategories || [];
                const prevCats = categories[0].previousCategories || [];
                allCategories = [...new Set([...newCats, ...prevCats])].filter(cat => cat && cat.trim() !== '');
            }

            // Sort categories alphabetically
            allCategories.sort();

            res.status(200).json({
                success: true,
                categories: allCategories
            });
        } catch (error) {
            console.error("Error fetching available categories:", error.message);
            res.status(500).json({
                success: false,
                message: "Failed to fetch available categories"
            });
        }
    },

    // Static method for creating history entries
    createEntry: async function(data) {
        try {
            return await TransactionHistory.createHistoryEntry(data);
        } catch (error) {
            console.error('Error creating transaction history entry:', error);
            // Don't throw error to avoid breaking main transaction flow
            return null;
        }
    }
};

export default transactionHistoryController;