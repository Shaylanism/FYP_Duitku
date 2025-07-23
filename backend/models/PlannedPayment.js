import mongoose from "mongoose";

const plannedPaymentSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
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
    dueDay: {
        type: Number,
        required: true,
        min: 1,
        max: 31 // Day of the month (1-31)
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
    let dueDate = new Date(now.getFullYear(), now.getMonth(), this.dueDay);
    
    // If due date has passed this month, move to next month
    if (dueDate <= now) {
        dueDate = new Date(now.getFullYear(), now.getMonth() + 1, this.dueDay);
    }
    
    return dueDate;
};

// Method to check if payment is overdue
plannedPaymentSchema.methods.isOverdue = function() {
    if (!this.isActive) return false;
    
    const now = new Date();
    const currentDueDate = new Date(now.getFullYear(), now.getMonth(), this.dueDay);
    
    // Check if we've passed the due date this month and payment hasn't been settled
    if (now > currentDueDate && this.isDueThisMonth()) {
        return true;
    }
    
    return false;
};

// Method to get payment status
plannedPaymentSchema.methods.getStatus = function() {
    if (!this.isActive) return 'inactive';
    if (this.isOverdue()) return 'overdue';
    if (!this.isDueThisMonth()) return 'settled';
    return 'pending';
};

const PlannedPayment = mongoose.model("PlannedPayment", plannedPaymentSchema);

export default PlannedPayment; 