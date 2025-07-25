import Budget from "../models/Budget.js";
import mongoose from "mongoose";

class BudgetController {
    // Create budget
    async createBudget(req, res) {
        try {
            const { category, budgetAmount, month } = req.body;
            const userId = req.user._id; // From auth middleware

            // Validation
            if (!category || !budgetAmount || !month) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Category, budget amount, and month are required" 
                });
            }

            if (budgetAmount <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Budget amount must be greater than 0" 
                });
            }

            // Validate month format (YYYY-MM)
            const monthRegex = /^\d{4}-\d{2}$/;
            if (!monthRegex.test(month)) {
                return res.status(400).json({
                    success: false,
                    message: "Month must be in YYYY-MM format"
                });
            }

            // Only allow budget creation for current month or future months
            const currentMonth = new Date().toISOString().slice(0, 7);
            if (month < currentMonth) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot create budgets for past months. You can only set budgets for the current month or future months."
                });
            }

            // Create new budget
            const newBudget = new Budget({
                user: userId,
                category: category.trim(),
                budgetAmount: parseFloat(budgetAmount),
                month
            });
            
            await newBudget.save();
            
            // Populate user info for response
            await newBudget.populate('user', 'name email');
            
            res.status(201).json({ 
                success: true, 
                message: "Budget created successfully", 
                budget: newBudget 
            });
        } catch (error) {
            console.error("Error creating budget:", error.message);
            
            // Handle duplicate key error (budget already exists for this category/month/user)
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: "Budget already exists for this category in the selected month"
                });
            }
            
            res.status(500).json({ 
                success: false, 
                message: "Failed to create budget"
            });
        }
    }

    // Get user's budgets
    async getBudgets(req, res) {
        try {
            const userId = req.user._id;
            const { month, page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

            // Build query
            const query = { user: userId };
            if (month) {
                query.month = month;
            }

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

            // Get budgets with pagination
            const budgets = await Budget.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('user', 'name email');

            // Get total count for pagination
            const total = await Budget.countDocuments(query);

            // Calculate total budget amount for the query
            const totalBudgetResult = await Budget.aggregate([
                { $match: query },
                { $group: { _id: null, total: { $sum: '$budgetAmount' } } }
            ]);

            const totalBudgetAmount = totalBudgetResult[0]?.total || 0;

            res.status(200).json({ 
                success: true, 
                budgets,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalBudgets: total,
                    hasNextPage: skip + parseInt(limit) < total,
                    hasPrevPage: parseInt(page) > 1
                },
                summary: {
                    totalBudgetAmount: totalBudgetAmount
                }
            });
        } catch (error) {
            console.error("Error fetching budgets:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to fetch budgets"
            });
        }
    }

    // Update budget
    async updateBudget(req, res) {
        try {
            const { id } = req.params;
            const { category, budgetAmount, month } = req.body;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid budget ID"
                });
            }

            // Validation
            if (budgetAmount && budgetAmount <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Budget amount must be greater than 0" 
                });
            }

            // Validate month format if provided
            if (month) {
                const monthRegex = /^\d{4}-\d{2}$/;
                if (!monthRegex.test(month)) {
                    return res.status(400).json({
                        success: false,
                        message: "Month must be in YYYY-MM format"
                    });
                }

                // Only allow budget updates for current month or future months
                const currentMonth = new Date().toISOString().slice(0, 7);
                if (month < currentMonth) {
                    return res.status(400).json({
                        success: false,
                        message: "Cannot modify budgets for past months. You can only edit budgets for the current month or future months."
                    });
                }
            }

            // Find budget and ensure it belongs to the user
            const budget = await Budget.findOne({ _id: id, user: userId });
            if (!budget) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Budget not found or not authorized" 
                });
            }

            // Check if existing budget is from a past month
            const currentMonth = new Date().toISOString().slice(0, 7);
            if (budget.month < currentMonth) {
                return res.status(400).json({
                    success: false,
                    message: "Cannot modify budgets for past months. You can only edit budgets for the current month or future months."
                });
            }

            // Update fields
            if (category) budget.category = category.trim();
            if (budgetAmount) budget.budgetAmount = parseFloat(budgetAmount);
            if (month) budget.month = month;

            await budget.save();
            await budget.populate('user', 'name email');
            
            res.status(200).json({ 
                success: true, 
                message: "Budget updated successfully", 
                budget 
            });
        } catch (error) {
            console.error("Error updating budget:", error.message);
            
            // Handle duplicate key error
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: "Budget already exists for this category in the selected month"
                });
            }
            
            res.status(500).json({ 
                success: false, 
                message: "Failed to update budget"
            });
        }
    }

    // Delete budget
    async deleteBudget(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid budget ID"
                });
            }

            // Find and delete budget, ensuring it belongs to the user
            const budget = await Budget.findOneAndDelete({ _id: id, user: userId });
            if (!budget) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Budget not found or not authorized" 
                });
            }

            res.status(200).json({ 
                success: true, 
                message: "Budget deleted successfully" 
            });
        } catch (error) {
            console.error("Error deleting budget:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to delete budget"
            });
        }
    }

    // Get budget by ID
    async getBudgetById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid budget ID"
                });
            }

            const budget = await Budget.findOne({ _id: id, user: userId })
                .populate('user', 'name email');

            if (!budget) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Budget not found or not authorized" 
                });
            }

            res.status(200).json({ 
                success: true, 
                budget 
            });
        } catch (error) {
            console.error("Error fetching budget:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to fetch budget"
            });
        }
    }

    // Copy budgets from source month to current month
    async copyBudgets(req, res) {
        try {
            const { sourceMonth } = req.body;
            const userId = req.user._id;

            // Validation
            if (!sourceMonth) {
                return res.status(400).json({
                    success: false,
                    message: "Source month is required"
                });
            }

            // Validate month format (YYYY-MM)
            const monthRegex = /^\d{4}-\d{2}$/;
            if (!monthRegex.test(sourceMonth)) {
                return res.status(400).json({
                    success: false,
                    message: "Source month must be in YYYY-MM format"
                });
            }

            const currentMonth = new Date().toISOString().slice(0, 7);

            // Prevent copying from future months or current month
            if (sourceMonth >= currentMonth) {
                return res.status(400).json({
                    success: false,
                    message: "Can only copy budgets from past months"
                });
            }

            // Get budgets from source month
            const sourceBudgets = await Budget.find({
                user: userId,
                month: sourceMonth
            });

            if (sourceBudgets.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: "No budgets found for the source month"
                });
            }

            // Check if current month already has budgets
            const existingBudgets = await Budget.find({
                user: userId,
                month: currentMonth
            });

            if (existingBudgets.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: "Current month already has budgets. Please delete existing budgets before copying."
                });
            }

            // Create new budgets for current month
            const newBudgets = sourceBudgets.map(budget => ({
                user: userId,
                category: budget.category,
                budgetAmount: budget.budgetAmount,
                month: currentMonth
            }));

            const createdBudgets = await Budget.insertMany(newBudgets);

            res.status(201).json({
                success: true,
                message: `Successfully copied ${createdBudgets.length} budgets from ${sourceMonth} to ${currentMonth}`,
                budgets: createdBudgets
            });

        } catch (error) {
            console.error("Error copying budgets:", error.message);
            
            // Handle duplicate key error
            if (error.code === 11000) {
                return res.status(400).json({
                    success: false,
                    message: "Some budgets already exist for the current month"
                });
            }
            
            res.status(500).json({
                success: false,
                message: "Failed to copy budgets"
            });
        }
    }
}

export default new BudgetController(); 