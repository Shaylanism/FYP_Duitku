import mongoose from "mongoose";

const budgetSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    category: {
        type: String,
        required: true,
        trim: true
    },
    budgetAmount: {
        type: Number,
        required: true,
        min: 0.05
    },
    month: {
        type: String,
        required: true,
        match: /^\d{4}-\d{2}$/ // YYYY-MM format
    }
}, { 
    timestamps: true // createdAt and updatedAt
});

// Index for efficient queries by user and month
budgetSchema.index({ user: 1, month: -1 });

// Ensure unique budget per category per month per user
budgetSchema.index({ user: 1, category: 1, month: 1 }, { unique: true });

const Budget = mongoose.model("Budget", budgetSchema);

export default Budget; 