import PlannedPayment from "../models/PlannedPayment.js";
import Transaction from "../models/Transaction.js";
import mongoose from "mongoose";
import { 
    getDaysInCurrentMonth, 
    isValidDueDayForCurrentMonth, 
    isDueDayInPast,
    getNextMonthDueDate 
} from "../utils/dateUtils.js";

class PlannedPaymentController {
    // Create planned payment
    async createPlannedPayment(req, res) {
        try {
            const { title, description, amount, category, dueDay } = req.body;
            const userId = req.user._id; // From auth middleware

            // Validation
            if (!title || !amount || !category || !dueDay) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Title, amount, category, and due day are required" 
                });
            }

            // Validate title length
            if (title.trim().length > 40) {
                return res.status(400).json({
                    success: false,
                    message: "Title cannot exceed 40 characters"
                });
            }

            if (amount <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Amount must be greater than 0" 
                });
            }

            // Validate description length if provided
            if (description && description.trim().length > 30) {
                return res.status(400).json({
                    success: false,
                    message: "Description cannot exceed 30 characters"
                });
            }

            // Validate due day against actual days in current month
            if (!isValidDueDayForCurrentMonth(dueDay)) {
                const maxDays = getDaysInCurrentMonth();
                return res.status(400).json({
                    success: false,
                    message: `Due day must be between 1 and ${maxDays} for the current month`
                });
            }

            // Check if due day is in the past
            const isInPast = isDueDayInPast(parseInt(dueDay));
            let initialTransaction = null;
            
            // Create new planned payment
            const newPlannedPayment = new PlannedPayment({
                user: userId,
                title: title.trim(),
                description: description ? description.trim() : '',
                amount: parseFloat(amount),
                category: category.trim(),
                dueDay: parseInt(dueDay),
                // If due day is in past, mark as settled immediately
                lastSettledDate: isInPast ? new Date() : null
            });
            
            await newPlannedPayment.save();

            // If due day is in past, create an initial transaction
            if (isInPast) {
                initialTransaction = new Transaction({
                    user: userId,
                    type: 'expense',
                    amount: parseFloat(amount),
                    description: `${title.trim()} - Auto-settled (Past Due Date)${description ? ` - ${description.trim()}` : ''}`,
                    category: category.trim()
                });
                await initialTransaction.save();
            }
            
            // Populate user info for response
            await newPlannedPayment.populate('user', 'name email');

            // Calculate next due date for response
            const nextDueDate = isInPast ? getNextMonthDueDate(parseInt(dueDay)) : null;
            
            res.status(201).json({ 
                success: true, 
                message: "Planned payment created successfully", 
                plannedPayment: newPlannedPayment,
                autoSettled: isInPast,
                nextDueDate: nextDueDate,
                initialTransaction: initialTransaction
            });
        } catch (error) {
            console.error("Error creating planned payment:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to create planned payment"
            });
        }
    }

    // Get user's planned payments
    async getPlannedPayments(req, res) {
        try {
            const userId = req.user._id;
            const { page = 1, limit = 10, sortBy = 'dueDay', sortOrder = 'asc' } = req.query;

            // Build query
            const query = { user: userId };

            // Calculate pagination
            const skip = (parseInt(page) - 1) * parseInt(limit);
            const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };

            // Get planned payments with pagination
            const plannedPayments = await PlannedPayment.find(query)
                .sort(sort)
                .skip(skip)
                .limit(parseInt(limit))
                .populate('user', 'name email');

            // Add computed status to each payment
            const paymentsWithStatus = plannedPayments.map(payment => ({
                ...payment.toObject(),
                status: payment.getStatus(),
                nextDueDate: payment.getNextDueDate(),
                isDueThisMonth: payment.isDueThisMonth(),
                isOverdue: payment.isOverdue()
            }));

            // Get total count for pagination
            const total = await PlannedPayment.countDocuments(query);

            // Calculate summary statistics
            const allPayments = await PlannedPayment.find({ user: userId });
            let totalMonthlyAmount = 0;
            let overdueCount = 0;
            let settledCount = 0;
            let pendingCount = 0;

            allPayments.forEach(payment => {
                totalMonthlyAmount += payment.amount;
                const status = payment.getStatus();
                if (status === 'overdue') overdueCount++;
                else if (status === 'settled') settledCount++;
                else if (status === 'pending') pendingCount++;
            });

            res.status(200).json({ 
                success: true, 
                plannedPayments: paymentsWithStatus,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: Math.ceil(total / parseInt(limit)),
                    totalPayments: total,
                    hasNextPage: skip + parseInt(limit) < total,
                    hasPrevPage: parseInt(page) > 1
                },
                summary: {
                    totalMonthlyAmount,
                    overdueCount,
                    settledCount,
                    pendingCount,
                    totalCount: allPayments.length
                }
            });
        } catch (error) {
            console.error("Error fetching planned payments:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to fetch planned payments"
            });
        }
    }

    // Update planned payment
    async updatePlannedPayment(req, res) {
        try {
            const { id } = req.params;
            const { title, description, amount, category, dueDay } = req.body;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid planned payment ID"
                });
            }

            // Validation
            if (amount && amount <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Amount must be greater than 0" 
                });
            }

            // Validate title length if provided
            if (title && title.trim().length > 40) {
                return res.status(400).json({
                    success: false,
                    message: "Title cannot exceed 40 characters"
                });
            }

            // Validate description length if provided
            if (description !== undefined && description.trim().length > 30) {
                return res.status(400).json({
                    success: false,
                    message: "Description cannot exceed 30 characters"
                });
            }

            if (dueDay) {
                // Validate due day against actual days in current month
                if (!isValidDueDayForCurrentMonth(dueDay)) {
                    const maxDays = getDaysInCurrentMonth();
                    return res.status(400).json({
                        success: false,
                        message: `Due day must be between 1 and ${maxDays} for the current month`
                    });
                }
            }

            // Find planned payment and ensure it belongs to the user
            const plannedPayment = await PlannedPayment.findOne({ _id: id, user: userId });
            if (!plannedPayment) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Planned payment not found or not authorized" 
                });
            }

            // Update fields
            if (title) plannedPayment.title = title.trim();
            if (description !== undefined) plannedPayment.description = description.trim();
            if (amount) plannedPayment.amount = parseFloat(amount);
            if (category) plannedPayment.category = category.trim();
            if (dueDay) plannedPayment.dueDay = parseInt(dueDay);

            await plannedPayment.save();
            await plannedPayment.populate('user', 'name email');
            
            // Add computed fields to response
            const response = {
                ...plannedPayment.toObject(),
                status: plannedPayment.getStatus(),
                nextDueDate: plannedPayment.getNextDueDate(),
                isDueThisMonth: plannedPayment.isDueThisMonth(),
                isOverdue: plannedPayment.isOverdue()
            };
            
            res.status(200).json({ 
                success: true, 
                message: "Planned payment updated successfully", 
                plannedPayment: response 
            });
        } catch (error) {
            console.error("Error updating planned payment:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to update planned payment"
            });
        }
    }

    // Delete planned payment
    async deletePlannedPayment(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid planned payment ID"
                });
            }

            // Find and delete planned payment, ensuring it belongs to the user
            const plannedPayment = await PlannedPayment.findOneAndDelete({ _id: id, user: userId });
            if (!plannedPayment) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Planned payment not found or not authorized" 
                });
            }

            res.status(200).json({ 
                success: true, 
                message: "Planned payment deleted successfully" 
            });
        } catch (error) {
            console.error("Error deleting planned payment:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to delete planned payment"
            });
        }
    }

    // Mark payment as settled (creates a transaction)
    async markAsSettled(req, res) {
        try {
            const { id } = req.params;
            const { transactionDescription } = req.body;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid planned payment ID"
                });
            }

            // Find planned payment and ensure it belongs to the user
            const plannedPayment = await PlannedPayment.findOne({ _id: id, user: userId });
            if (!plannedPayment) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Planned payment not found or not authorized" 
                });
            }



            // Check if already settled this month
            if (!plannedPayment.isDueThisMonth()) {
                return res.status(400).json({
                    success: false,
                    message: "Payment has already been settled for this month"
                });
            }

            // Create a transaction for this payment
            const transaction = new Transaction({
                user: userId,
                type: 'expense',
                amount: plannedPayment.amount,
                description: transactionDescription || `${plannedPayment.title} - ${plannedPayment.description}`,
                category: plannedPayment.category
            });

            await transaction.save();

            // Update planned payment with settlement date
            plannedPayment.lastSettledDate = new Date();
            
            // Reset reminder tracking for next month
            plannedPayment.remindersSent = {
                firstReminderSent: null,
                secondReminderSent: null,
                month: null
            };

            await plannedPayment.save();
            await plannedPayment.populate('user', 'name email');
            
            // Add computed fields to response
            const response = {
                ...plannedPayment.toObject(),
                status: plannedPayment.getStatus(),
                nextDueDate: plannedPayment.getNextDueDate(),
                isDueThisMonth: plannedPayment.isDueThisMonth(),
                isOverdue: plannedPayment.isOverdue()
            };

            res.status(200).json({ 
                success: true, 
                message: "Payment marked as settled and transaction created", 
                plannedPayment: response,
                transaction: transaction
            });
        } catch (error) {
            console.error("Error settling payment:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to settle payment"
            });
        }
    }

    // Get planned payment by ID
    async getPlannedPaymentById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: "Invalid planned payment ID"
                });
            }

            const plannedPayment = await PlannedPayment.findOne({ _id: id, user: userId })
                .populate('user', 'name email');

            if (!plannedPayment) {
                return res.status(404).json({ 
                    success: false, 
                    message: "Planned payment not found or not authorized" 
                });
            }

            // Add computed fields to response
            const response = {
                ...plannedPayment.toObject(),
                status: plannedPayment.getStatus(),
                nextDueDate: plannedPayment.getNextDueDate(),
                isDueThisMonth: plannedPayment.isDueThisMonth(),
                isOverdue: plannedPayment.isOverdue()
            };

            res.status(200).json({ 
                success: true, 
                plannedPayment: response 
            });
        } catch (error) {
            console.error("Error fetching planned payment:", error.message);
            res.status(500).json({ 
                success: false, 
                message: "Failed to fetch planned payment"
            });
        }
    }

    // Get payments due for reminders (for background job)
    async getPaymentsDueForReminders(req, res) {
        try {
            const now = new Date();
            const currentMonth = now.toISOString().slice(0, 7);
            
            // Find payments that need reminders
            const payments = await PlannedPayment.find({
                $or: [
                    // First reminder: 3 days before due date
                    {
                        $expr: {
                            $and: [
                                { $lte: [{ $subtract: [{ $dayOfMonth: { $dateFromParts: { year: { $year: now }, month: { $month: now }, day: "$dueDay" } } }, 3] }, { $dayOfMonth: now }] },
                                { $or: [
                                    { "remindersSent.firstReminderSent": null },
                                    { $ne: ["$remindersSent.month", currentMonth] }
                                ]}
                            ]
                        }
                    },
                    // Second reminder: 1 day before due date
                    {
                        $expr: {
                            $and: [
                                { $lte: [{ $subtract: [{ $dayOfMonth: { $dateFromParts: { year: { $year: now }, month: { $month: now }, day: "$dueDay" } } }, 1] }, { $dayOfMonth: now }] },
                                { $or: [
                                    { "remindersSent.secondReminderSent": null },
                                    { $ne: ["$remindersSent.month", currentMonth] }
                                ]}
                            ]
                        }
                    }
                ]
            }).populate('user', 'name email');

            const reminders = payments
                .filter(payment => payment.isDueThisMonth())
                .map(payment => {
                    const daysUntilDue = payment.dueDay - now.getDate();
                    let reminderType = null;
                    
                    if (daysUntilDue <= 1 && (!payment.remindersSent.secondReminderSent || payment.remindersSent.month !== currentMonth)) {
                        reminderType = 'second'; // 1 day before
                    } else if (daysUntilDue <= 3 && (!payment.remindersSent.firstReminderSent || payment.remindersSent.month !== currentMonth)) {
                        reminderType = 'first'; // 3 days before
                    }
                    
                    return reminderType ? {
                        payment: payment,
                        reminderType: reminderType,
                        daysUntilDue: daysUntilDue
                    } : null;
                })
                .filter(reminder => reminder !== null);

            res.status(200).json({
                success: true,
                reminders: reminders
            });
        } catch (error) {
            console.error("Error fetching reminders:", error.message);
            res.status(500).json({
                success: false,
                message: "Failed to fetch reminder data"
            });
        }
    }

    // Get notifications for user login popup
    async getNotifications(req, res) {
        try {
            const userId = req.user._id;
            const now = new Date();
            const currentDay = now.getDate();

            // Get all payments for the user
            const allPayments = await PlannedPayment.find({ 
                user: userId 
            });

            const notifications = [];

            allPayments.forEach(payment => {
                const daysUntilDue = payment.dueDay - currentDay;
                const status = payment.getStatus();
                
                // Add to notifications if:
                // 1. Payment is overdue
                // 2. Payment is due within 3 days and still pending
                if (status === 'overdue' || (status === 'pending' && daysUntilDue <= 3 && daysUntilDue >= 0)) {
                    let urgency = 'normal';
                    let message = '';
                    
                    if (status === 'overdue') {
                        urgency = 'high';
                        const daysPastDue = Math.abs(daysUntilDue);
                        message = `Payment "${payment.title}" is ${daysPastDue} day${daysPastDue > 1 ? 's' : ''} overdue!`;
                    } else if (daysUntilDue === 0) {
                        urgency = 'high';
                        message = `Payment "${payment.title}" is due today!`;
                    } else if (daysUntilDue === 1) {
                        urgency = 'medium';
                        message = `Payment "${payment.title}" is due tomorrow!`;
                    } else {
                        urgency = 'normal';
                        message = `Payment "${payment.title}" is due in ${daysUntilDue} days`;
                    }

                    notifications.push({
                        paymentId: payment._id,
                        title: payment.title,
                        amount: payment.amount,
                        category: payment.category,
                        dueDay: payment.dueDay,
                        daysUntilDue: daysUntilDue,
                        status: status,
                        urgency: urgency,
                        message: message
                    });
                }
            });

            // Sort by urgency (high -> medium -> normal) and then by days until due
            notifications.sort((a, b) => {
                const urgencyOrder = { high: 0, medium: 1, normal: 2 };
                if (urgencyOrder[a.urgency] !== urgencyOrder[b.urgency]) {
                    return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
                }
                return a.daysUntilDue - b.daysUntilDue;
            });

            res.status(200).json({
                success: true,
                notifications: notifications,
                hasUrgentPayments: notifications.some(n => n.urgency === 'high'),
                hasWarnings: notifications.length > 0
            });
        } catch (error) {
            console.error("Error fetching notifications:", error.message);
            res.status(500).json({
                success: false,
                message: "Failed to fetch notifications"
            });
        }
    }
}

export default new PlannedPaymentController(); 