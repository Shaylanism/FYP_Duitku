import mongoose from "mongoose";

// Define predefined categories for each transaction type
const INCOME_CATEGORIES = ['Salary', 'Rental', 'Sale', 'Refund', 'Others'];
const EXPENSE_CATEGORIES = ['Car', 'Fuel', 'Food & Beverages', 'Home', 'Bills', 'Health', 'Education', 'Transportation', 'Entertainment', 'Shopping', 'Insurance', 'Tax', 'Others'];

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['income', 'expense'],
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    description: {
        type: String,
        required: false,
        trim: true,
        maxlength: [90, 'Description cannot exceed 90 characters'],
        default: ''
    },
    category: {
        type: String,
        required: true,
        validate: {
            validator: function(value) {
                // Allow existing invalid categories to remain, just in case remove/add categories
                // But validate new transactions against predefined categories
                if (this.isNew) {
                    if (this.type === 'income') {
                        return INCOME_CATEGORIES.includes(value);
                    } else if (this.type === 'expense') {
                        return EXPENSE_CATEGORIES.includes(value);
                    }
                    return false;
                }
                // For existing records, allow any category (backward compatibility)
                return true;
            },
            message: function(props) {
                const type = this.type;
                const validCategories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
                return `Invalid category '${props.value}' for ${type} transaction. Valid categories are: ${validCategories.join(', ')}`;
            }
        }
    }
}, { 
    timestamps: true // createdAt and updatedAt
});

// Index for efficient queries by user
transactionSchema.index({ user: 1, createdAt: -1 });

// Static methods to get categories
transactionSchema.statics.getIncomeCategories = function() {
    return INCOME_CATEGORIES;
};

transactionSchema.statics.getExpenseCategories = function() {
    return EXPENSE_CATEGORIES;
};

transactionSchema.statics.getCategoriesByType = function(type) {
    return type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
};

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction; 