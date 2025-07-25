import mongoose from "mongoose";

const retirementPlanSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    // Input fields from user
    currentAge: {
        type: Number,
        required: true,
        min: 18,
        max: 100
    },
    retirementAge: {
        type: Number,
        required: true,
        min: 50,
        max: 100
    },
    lifeExpectancy: {
        type: Number,
        required: true,
        min: 60,
        max: 120
    },
    currentSalary: {
        type: Number,
        required: true,
        min: 0.01
    },
    epfBalance: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    prsBalance: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    monthlyContributionPrs: {
        type: Number,
        required: true,
        min: 0,
        default: 0
    },
    preRetirementReturn: {
        type: Number,
        required: true,
        min: 0,
        max: 20,
        default: 4.0 // 4% default
    },
    postRetirementReturn: {
        type: Number,
        required: true,
        min: 0,
        max: 20,
        default: 4.0 // 4% default
    },
    inflationRate: {
        type: Number,
        required: true,
        min: 0,
        max: 20,
        default: 3.0 // 3% default
    },
    // Calculated results
    lastDrawnSalary: {
        type: Number
    },
    targetMonthlyIncome: {
        type: Number
    },
    totalFundsNeeded: {
        type: Number
    },
    projectedEpfBalance: {
        type: Number
    },
    projectedPrsBalance: {
        type: Number
    },
    totalProjectedSavings: {
        type: Number
    },
    fundingGap: {
        type: Number
    },
    additionalMonthlySavingsRequired: {
        type: Number
    },
    // Calculation metadata
    yearsToRetirement: {
        type: Number
    },
    yearsInRetirement: {
        type: Number
    },
    calculationDate: {
        type: Date,
        default: Date.now
    }
}, { 
    timestamps: true // createdAt and updatedAt
});

// Index for efficient queries by user
retirementPlanSchema.index({ user: 1, calculationDate: -1 });

const RetirementPlan = mongoose.model("RetirementPlan", retirementPlanSchema);

export default RetirementPlan; 