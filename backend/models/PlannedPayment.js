import mongoose from "mongoose";
import { getValidDueDayForMonth } from "../utils/dateUtils.js";

const plannedPaymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: [40, 'Title cannot exceed 40 characters']
    },
    description: {
        type: String,
        trim: true,
        maxlength: [30, 'Description cannot exceed 30 characters']
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    paymentType: {
        type: String,
        required: true,
        enum: ['income', 'expense'],
        default: 'expense'
    },
    dueDay: {
        type: Number,
        required: true,
        min: 1,
        max: 31 // Day of the month (1-31). Note: Controller validates against actual month days for new entries
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastSettledDate: {
        type: Date,
        default: null
    },
    reminderSettings: {
        firstReminder: {
            type: Number,
            default: 3 // Days before due date
        },
        secondReminder: {
            type: Number,
            default: 1 // Days before due date
        }
    },
    remindersSent: {
        firstReminderSent: {
            type: Date,
            default: null
        },
        secondReminderSent: {
            type: Date,
            default: null
        },
        incomeReminderSent: {
            type: Date,
            default: null
        },
        month: {
            type: String, // YYYY-MM format to track which month reminders were sent
            default: null
        }
    }
}, { 
    timestamps: true // createdAt and updatedAt
});

// Index for efficient queries by user
plannedPaymentSchema.index({ user: 1, dueDay: 1 });

// Index for reminder queries
plannedPaymentSchema.index({ isActive: 1, dueDay: 1 });

// Method to check if payment is due this month
plannedPaymentSchema.methods.isDueThisMonth = function() {
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
    
    if (!this.lastSettledDate) {
        return true; // Never settled
    }
    
    const lastSettledMonth = this.lastSettledDate.toISOString().slice(0, 7);
    return currentMonth !== lastSettledMonth;
};

// Method to get next due date
plannedPaymentSchema.methods.getNextDueDate = function() {
    const now = new Date();
    let targetYear = now.getFullYear();
    let targetMonth = now.getMonth();
    
    // Get valid due day for current month
    let validDueDay = getValidDueDayForMonth(targetYear, targetMonth, this.dueDay);
    let dueDate = new Date(targetYear, targetMonth, validDueDay);
    
    // If due date has passed this month, move to next month
    if (dueDate <= now) {
        targetMonth += 1;
        if (targetMonth > 11) {
            targetMonth = 0;
            targetYear += 1;
        }
        validDueDay = getValidDueDayForMonth(targetYear, targetMonth, this.dueDay);
        dueDate = new Date(targetYear, targetMonth, validDueDay);
    }
    
    return dueDate;
};

// Method to check if payment is overdue
plannedPaymentSchema.methods.isOverdue = function() {
    const now = new Date();
    const currentDueDate = new Date(now.getFullYear(), now.getMonth(), this.dueDay);
    
    // Check if we've passed the due date this month and payment hasn't been settled
    if (now > currentDueDate && this.isDueThisMonth()) {
        return true;
    }
    
    return false;
};

// Method to check if income payment needs reminder (on due date or after)
plannedPaymentSchema.methods.needsIncomeReminder = function() {
    if (this.paymentType !== 'income') return false;
    
    const now = new Date();
    const currentDay = now.getDate();
    const currentMonth = now.toISOString().slice(0, 7);
    
    // Only remind if payment is due this month and not settled
    if (!this.isDueThisMonth()) return false;
    
    // Remind on due date and every day after
    if (currentDay >= this.dueDay) {
        // Check if we already sent reminder today
        const lastReminderDate = this.remindersSent.incomeReminderSent;
        if (!lastReminderDate) return true;
        
        const lastReminderDay = lastReminderDate.getDate();
        const lastReminderMonth = lastReminderDate.toISOString().slice(0, 7);
        
        // Send reminder if it's a new day or new month
        return (currentDay !== lastReminderDay) || (currentMonth !== lastReminderMonth);
    }
    
    return false;
};

// Method to get payment status
plannedPaymentSchema.methods.getStatus = function() {
    if (this.isOverdue()) return 'overdue';
    if (!this.isDueThisMonth()) return 'settled';
    return 'pending';
};

const PlannedPayment = mongoose.model("PlannedPayment", plannedPaymentSchema);

export default PlannedPayment; 