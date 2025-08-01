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
        min: 40,
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
    monthlyContributionPrsPercentage: {
        type: Number,
        required: false,
        min: 0,
        max: 20,
        default: 0 // Default 0% if not specified
    },
    monthlyEpfContributionRate: {
        type: Number,
        required: false,
        min: 0,
        max: 30,
        default: 23 // Default Malaysian EPF rate (11% employee + 12% employer)
    },
    employeeEpfContributionRate: {
        type: Number,
        required: false,
        min: 0,
        max: 11,
        default: 11 // Default Malaysian employee EPF rate (maximum 11%)
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
    // Optional user-defined target monthly income
    targetMonthlyIncomeInput: {
        type: Number,
        required: false,
        min: 0
    },
    // Salary increment preferences
    enableSalaryIncrements: {
        type: Boolean,
        required: false,
        default: true // Default to enabled for backward compatibility
    },
    salaryIncrementRate: {
        type: Number,
        required: false,
        min: 0,
        max: 20,
        default: 3.0 // Default 3% increment rate
    },
    // Calculated results
    lastDrawnSalary: {
        type: Number
    },
    targetMonthlyIncome: {
        type: Number
    },
    monthlyEpfContribution: {
        type: Number
    },
    monthlyEmployeeEpfContribution: {
        type: Number
    },
    disposableMonthlySalary: {
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