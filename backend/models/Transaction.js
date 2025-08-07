import mongoose from "mongoose";
import { INCOME_CATEGORIES, EXPENSE_CATEGORIES, getCategoriesByType } from '../constants/categories.js';

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
        min: 0.05
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
                    return getCategoriesByType(this.type).includes(value);
                }
                // For existing records, allow any category (backward compatibility)
                return true;
            },
            message: function(props) {
                const type = this.type;
                const validCategories = getCategoriesByType(type);
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
    return getCategoriesByType(type);
};

const Transaction = mongoose.model("Transaction", transactionSchema);

export default Transaction; 