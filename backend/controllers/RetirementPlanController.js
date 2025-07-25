import RetirementPlan from "../models/RetirementPlan.js";
import mongoose from "mongoose";

class RetirementPlanController {
    // Calculate retirement plan
    async calculateRetirementPlan(req, res) {
        try {
            const {
                currentAge,
                retirementAge,
                lifeExpectancy,
                currentSalary,
                epfBalance,
                prsBalance,
                monthlyContributionPrs,
                preRetirementReturn = 4.0,
                postRetirementReturn = 4.0,
                inflationRate = 3.0
            } = req.body;

            const userId = req.user._id; // From auth middleware

            // Validation
            if (!currentAge || !retirementAge || !lifeExpectancy || !currentSalary) {
                return res.status(400).json({
                    success: false,
                    message: "Current age, retirement age, life expectancy, and current salary are required"
                });
            }

            if (currentAge >= retirementAge) {
                return res.status(400).json({
                    success: false,
                    message: "Current age must be less than retirement age"
                });
            }

            if (retirementAge >= lifeExpectancy) {
                return res.status(400).json({
                    success: false,
                    message: "Retirement age must be less than life expectancy"
                });
            }

            if (currentSalary <= 0) {
                return res.status(400).json({
                    success: false,
                    message: "Current salary must be greater than 0"
                });
            }

            // Perform calculations
            const calculations = this.performRetirementCalculations({
                currentAge,
                retirementAge,
                lifeExpectancy,
                currentSalary,
                epfBalance: epfBalance || 0,
                prsBalance: prsBalance || 0,
                monthlyContributionPrs: monthlyContributionPrs || 0,
                preRetirementReturn,
                postRetirementReturn,
                inflationRate
            });

            // Create new retirement plan
            const newRetirementPlan = new RetirementPlan({
                user: userId,
                currentAge,
                retirementAge,
                lifeExpectancy,
                currentSalary,
                epfBalance: epfBalance || 0,
                prsBalance: prsBalance || 0,
                monthlyContributionPrs: monthlyContributionPrs || 0,
                preRetirementReturn,
                postRetirementReturn,
                inflationRate,
                ...calculations
            });

            const savedPlan = await newRetirementPlan.save();

            res.status(201).json({
                success: true,
                message: "Retirement plan calculated successfully",
                retirementPlan: savedPlan
            });

        } catch (err) {
            console.error("Error calculating retirement plan:", err);
            res.status(500).json({
                success: false,
                message: "Failed to calculate retirement plan",
                error: err.message
            });
        }
    }

    // Perform the actual retirement calculations
    performRetirementCalculations({
        currentAge,
        retirementAge,
        lifeExpectancy,
        currentSalary,
        epfBalance,
        prsBalance,
        monthlyContributionPrs,
        preRetirementReturn,
        postRetirementReturn,
        inflationRate
    }) {
        const yearsToRetirement = retirementAge - currentAge;
        const yearsInRetirement = lifeExpectancy - retirementAge;
        
        // Calculate last drawn salary with 3% annual increment
        const salaryGrowthRate = 3.0;
        const lastDrawnSalary = currentSalary * Math.pow(1 + salaryGrowthRate / 100, yearsToRetirement);
        
        // Target monthly income: 2/3 of last drawn salary
        const targetMonthlyIncome = (lastDrawnSalary * 2) / 3;
        
        // Adjust target income for inflation during retirement
        const inflationAdjustedTargetIncome = targetMonthlyIncome;
        
        // Calculate total funds needed (present value at retirement)
        // This is the lump sum needed at retirement to provide monthly income
        const monthlyReturnRate = postRetirementReturn / 100 / 12;
        const totalMonthsInRetirement = yearsInRetirement * 12;
        
        let totalFundsNeeded;
        if (monthlyReturnRate > 0) {
            // Present value of annuity formula
            const pvAnnuityFactor = (1 - Math.pow(1 + monthlyReturnRate, -totalMonthsInRetirement)) / monthlyReturnRate;
            totalFundsNeeded = inflationAdjustedTargetIncome * pvAnnuityFactor;
        } else {
            // If no return rate, just multiply monthly income by total months
            totalFundsNeeded = inflationAdjustedTargetIncome * totalMonthsInRetirement;
        }

        // Project EPF balance at retirement (4% average dividend)
        const epfGrowthRate = 4.0 / 100;
        const projectedEpfBalance = epfBalance * Math.pow(1 + epfGrowthRate, yearsToRetirement);

        // Project PRS balance at retirement
        const prsGrowthRate = preRetirementReturn / 100;
        const currentPrsValue = prsBalance * Math.pow(1 + prsGrowthRate, yearsToRetirement);
        
        // Future value of monthly PRS contributions
        let futurePrsContributions = 0;
        if (monthlyContributionPrs > 0 && prsGrowthRate > 0) {
            const monthlyGrowthRate = prsGrowthRate / 12;
            const totalMonthsToRetirement = yearsToRetirement * 12;
            const fvAnnuityFactor = (Math.pow(1 + monthlyGrowthRate, totalMonthsToRetirement) - 1) / monthlyGrowthRate;
            futurePrsContributions = monthlyContributionPrs * fvAnnuityFactor;
        } else if (monthlyContributionPrs > 0) {
            futurePrsContributions = monthlyContributionPrs * yearsToRetirement * 12;
        }
        
        const projectedPrsBalance = currentPrsValue + futurePrsContributions;

        // Total projected savings
        const totalProjectedSavings = projectedEpfBalance + projectedPrsBalance;

        // Funding gap
        const fundingGap = Math.max(0, totalFundsNeeded - totalProjectedSavings);

        // Additional monthly savings required to close the gap
        let additionalMonthlySavingsRequired = 0;
        if (fundingGap > 0 && yearsToRetirement > 0) {
            const monthlyGrowthRate = preRetirementReturn / 100 / 12;
            const totalMonthsToRetirement = yearsToRetirement * 12;
            
            if (monthlyGrowthRate > 0) {
                const fvAnnuityFactor = (Math.pow(1 + monthlyGrowthRate, totalMonthsToRetirement) - 1) / monthlyGrowthRate;
                additionalMonthlySavingsRequired = fundingGap / fvAnnuityFactor;
            } else {
                additionalMonthlySavingsRequired = fundingGap / totalMonthsToRetirement;
            }
        }

        return {
            yearsToRetirement,
            yearsInRetirement,
            lastDrawnSalary: Math.round(lastDrawnSalary * 100) / 100,
            targetMonthlyIncome: Math.round(targetMonthlyIncome * 100) / 100,
            totalFundsNeeded: Math.round(totalFundsNeeded * 100) / 100,
            projectedEpfBalance: Math.round(projectedEpfBalance * 100) / 100,
            projectedPrsBalance: Math.round(projectedPrsBalance * 100) / 100,
            totalProjectedSavings: Math.round(totalProjectedSavings * 100) / 100,
            fundingGap: Math.round(fundingGap * 100) / 100,
            additionalMonthlySavingsRequired: Math.round(additionalMonthlySavingsRequired * 100) / 100
        };
    }

    // Get user's retirement plans (history)
    async getRetirementPlans(req, res) {
        try {
            const userId = req.user._id;
            const limit = parseInt(req.query.limit) || 10;

            const retirementPlans = await RetirementPlan.find({ user: userId })
                .sort({ calculationDate: -1 })
                .limit(limit);

            res.status(200).json({
                success: true,
                retirementPlans
            });

        } catch (err) {
            console.error("Error fetching retirement plans:", err);
            res.status(500).json({
                success: false,
                message: "Failed to fetch retirement plans",
                error: err.message
            });
        }
    }

    // Get retirement plan by ID
    async getRetirementPlanById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid retirement plan ID"
                });
            }

            const retirementPlan = await RetirementPlan.findOne({
                _id: id,
                user: userId
            });

            if (!retirementPlan) {
                return res.status(404).json({
                    success: false,
                    message: "Retirement plan not found"
                });
            }

            res.status(200).json({
                success: true,
                retirementPlan
            });

        } catch (err) {
            console.error("Error fetching retirement plan:", err);
            res.status(500).json({
                success: false,
                message: "Failed to fetch retirement plan",
                error: err.message
            });
        }
    }

    // Delete retirement plan
    async deleteRetirementPlan(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user._id;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid retirement plan ID"
                });
            }

            const deletedPlan = await RetirementPlan.findOneAndDelete({
                _id: id,
                user: userId
            });

            if (!deletedPlan) {
                return res.status(404).json({
                    success: false,
                    message: "Retirement plan not found"
                });
            }

            res.status(200).json({
                success: true,
                message: "Retirement plan deleted successfully"
            });

        } catch (err) {
            console.error("Error deleting retirement plan:", err);
            res.status(500).json({
                success: false,
                message: "Failed to delete retirement plan",
                error: err.message
            });
        }
    }
}

export default new RetirementPlanController(); 