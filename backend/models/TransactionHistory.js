import mongoose from "mongoose";

const transactionHistorySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        enum: ['CREATE', 'UPDATE', 'DELETE', 'SETTLE_PLANNED_PAYMENT', 'RECEIVE_PLANNED_PAYMENT'],
        required: true
    },
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        required: false // null for deleted transactions
    },
    plannedPaymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'PlannedPayment',
        required: false // only for planned payment related actions
    },
    // Snapshot of transaction data before the change (for updates and deletes)
    previousData: {
        type: {
            type: String,
            enum: ['income', 'expense']
        },
        amount: Number,
        description: String,
        category: String,
        createdAt: Date
    },
    // Snapshot of transaction data after the change (for creates and updates)
    newData: {
        type: {
            type: String,
            enum: ['income', 'expense']
        },
        amount: Number,
        description: String,
        category: String,
        createdAt: Date
    },
    // Additional context for planned payment operations
    plannedPaymentData: {
        title: String,
        description: String,
        amount: Number,
        category: String,
        paymentType: {
            type: String,
            enum: ['income', 'expense']
        },
        dueDay: Number
    },
    // User-friendly description of the action
    description: {
        type: String,
        required: true
    },
    metadata: {
        userAgent: String,
        ipAddress: String,
        source: {
            type: String,
            enum: ['MANUAL', 'PLANNED_PAYMENT', 'SYSTEM'],
            default: 'MANUAL'
        }
    }
}, { 
    timestamps: true // createdAt and updatedAt
});

// Index for efficient queries by user and date
transactionHistorySchema.index({ user: 1, createdAt: -1 });
transactionHistorySchema.index({ transactionId: 1 });
transactionHistorySchema.index({ plannedPaymentId: 1 });

// Static method to create history entry
transactionHistorySchema.statics.createHistoryEntry = async function(data) {
    try {
        const historyEntry = new this(data);
        await historyEntry.save();
        return historyEntry;
    } catch (error) {
        console.error('Error creating transaction history entry:', error);
        throw error;
    }
};

// Method to format currency for display
transactionHistorySchema.methods.formatCurrency = function(amount) {
    return new Intl.NumberFormat('en-MY', {
        style: 'currency',
        currency: 'MYR'
    }).format(amount);
};

// Method to get human-readable action description
transactionHistorySchema.methods.getActionDescription = function() {
    const actionDescriptions = {
        'CREATE': 'Added transaction',
        'UPDATE': 'Modified transaction',
        'DELETE': 'Deleted transaction', 
        'SETTLE_PLANNED_PAYMENT': 'Settled planned payment',
        'RECEIVE_PLANNED_PAYMENT': 'Received planned payment'
    };
    return actionDescriptions[this.action] || this.action;
};

// Method to get change summary for updates
transactionHistorySchema.methods.getChangeSummary = function() {
    if (this.action !== 'UPDATE' || !this.previousData || !this.newData) {
        return null;
    }

    const changes = [];
    const prev = this.previousData;
    const curr = this.newData;

    if (prev.type !== curr.type) {
        changes.push(`Type: ${prev.type} → ${curr.type}`);
    }
    if (prev.amount !== curr.amount) {
        changes.push(`Amount: ${this.formatCurrency(prev.amount)} → ${this.formatCurrency(curr.amount)}`);
    }
    if (prev.description !== curr.description) {
        changes.push(`Description: "${prev.description || 'No description'}" → "${curr.description || 'No description'}"`);
    }
    if (prev.category !== curr.category) {
        changes.push(`Category: ${prev.category} → ${curr.category}`);
    }

    return changes.length > 0 ? changes : null;
};

const TransactionHistory = mongoose.model("TransactionHistory", transactionHistorySchema);

export default TransactionHistory;