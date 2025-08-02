import RetirementPlan from "../models/RetirementPlan.js";
import mongoose from "mongoose";

class RetirementPlanController {
    // Calculate retirement plan (create or update existing)
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
                monthlyContributionPrsPercentage,
                monthlyEpfContributionRate,
                employeeEpfContributionRate,
                targetMonthlyIncomeInput,
                preRetirementReturn = 4.0,
                postRetirementReturn = 4.0,
                inflationRate = 3.0,
                enableSalaryIncrements = true,
                salaryIncrementRate = 3.0
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

            // Validate EPF contribution rate
            if (monthlyEpfContributionRate !== undefined && (monthlyEpfContributionRate < 0 || monthlyEpfContributionRate > 30)) {
                return res.status(400).json({
                    success: false,
                    message: "EPF contribution rate must be between 0% and 30%"
                });
            }

            // Validate employee EPF contribution rate (maximum 11%)
            if (employeeEpfContributionRate !== undefined && (employeeEpfContributionRate < 0 || employeeEpfContributionRate > 11)) {
                return res.status(400).json({
                    success: false,
                    message: "Employee EPF contribution rate must be between 0% and 11%"
                });
            }

            // Validate salary increment rate
            if (enableSalaryIncrements && (salaryIncrementRate < 0 || salaryIncrementRate > 20)) {
                return res.status(400).json({
                    success: false,
                    message: "Salary increment rate must be between 0% and 20%"
                });
            }

            // Validate PRS contribution percentage
            if (monthlyContributionPrsPercentage !== undefined && (monthlyContributionPrsPercentage < 0 || monthlyContributionPrsPercentage > 20)) {
                return res.status(400).json({
                    success: false,
                    message: "PRS contribution percentage must be between 0% and 20%"
                });
            }

            // Calculate monthly PRS contribution from percentage (prioritize percentage over fixed amount)
            let calculatedMonthlyContributionPrs;
            const prsPercentage = monthlyContributionPrsPercentage || 0;
            
            if (prsPercentage > 0) {
                calculatedMonthlyContributionPrs = currentSalary * (prsPercentage / 100);
            } else {
                calculatedMonthlyContributionPrs = monthlyContributionPrs || 0;
            }

            // Perform calculations
            const calculations = this.performRetirementCalculations({
                currentAge,
                retirementAge,
                lifeExpectancy,
                currentSalary,
                epfBalance: epfBalance || 0,
                prsBalance: prsBalance || 0,
                monthlyContributionPrs: calculatedMonthlyContributionPrs,
                monthlyContributionPrsPercentage: prsPercentage,
                monthlyEpfContributionRate: monthlyEpfContributionRate || 23,
                employeeEpfContributionRate: employeeEpfContributionRate || 11,
                targetMonthlyIncomeInput: targetMonthlyIncomeInput || null,
                preRetirementReturn,
                postRetirementReturn,
                inflationRate,
                enableSalaryIncrements,
                salaryIncrementRate
            });

            // Checks if the user already has a retirement plan
            const existingPlan = await RetirementPlan.findOne({ user: userId });

            const planData = {
                user: userId,
                currentAge,
                retirementAge,
                lifeExpectancy,
                currentSalary,
                epfBalance: epfBalance || 0,
                prsBalance: prsBalance || 0,
                monthlyContributionPrs: calculatedMonthlyContributionPrs,
                monthlyContributionPrsPercentage: prsPercentage,
                monthlyEpfContributionRate: monthlyEpfContributionRate || 23,
                employeeEpfContributionRate: employeeEpfContributionRate || 11,
                targetMonthlyIncomeInput: targetMonthlyIncomeInput || null,
                preRetirementReturn,
                postRetirementReturn,
                inflationRate,
                enableSalaryIncrements,
                salaryIncrementRate,
                calculationDate: new Date(), // Update calculation date
                ...calculations
            };

            let savedPlan;
            if (existingPlan) {
                // Update existing retirementplan
                savedPlan = await RetirementPlan.findOneAndUpdate(
                    { user: userId },
                    planData,
                    { new: true, runValidators: true }
                );
            } else {
                // Create new retirementplan
                const newRetirementPlan = new RetirementPlan(planData);
                savedPlan = await newRetirementPlan.save();
            }

            res.status(existingPlan ? 200 : 201).json({
                success: true,
                message: existingPlan ? "Retirement plan updated successfully" : "Retirement plan created successfully",
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

    // Performs the actual retirement calculations
    performRetirementCalculations({
        currentAge,
        retirementAge,
        lifeExpectancy,
        currentSalary,
        epfBalance,
        prsBalance,
        monthlyContributionPrs,
        monthlyContributionPrsPercentage,
        monthlyEpfContributionRate,
        employeeEpfContributionRate,
        targetMonthlyIncomeInput,
        preRetirementReturn,
        postRetirementReturn,
        inflationRate,
        enableSalaryIncrements,
        salaryIncrementRate
    }) {
        const yearsToRetirement = retirementAge - currentAge;
        const yearsInRetirement = lifeExpectancy - retirementAge;
        
        // Calculate employee EPF contribution and disposable salary
        const monthlyEmployeeEpfContribution = currentSalary * (employeeEpfContributionRate / 100);
        const disposableMonthlySalary = currentSalary - monthlyEmployeeEpfContribution - monthlyContributionPrs;
        
        // Calculates last drawn salary with the option of salary increments
        let lastDrawnSalary;
        if (enableSalaryIncrements) {
            lastDrawnSalary = currentSalary * Math.pow(1 + salaryIncrementRate / 100, yearsToRetirement);
        } else {
            lastDrawnSalary = currentSalary; // No increments, salary stays the same
        }
        
        // Target monthly income: use user input if provided, otherwise 2/3 of last drawn salary will be the default
        const targetMonthlyIncome = targetMonthlyIncomeInput && targetMonthlyIncomeInput > 0 
            ? targetMonthlyIncomeInput 
            : (lastDrawnSalary * 2) / 3;
        
        // Calculate total funds needed (present value at retirement)
        // This accounts for inflation during retirement to maintain purchasing power
        const monthlyReturnRate = postRetirementReturn / 100 / 12;
        const monthlyInflationRate = inflationRate / 100 / 12;
        const totalMonthsInRetirement = yearsInRetirement * 12;
        
        let totalFundsNeeded;
        if (monthlyReturnRate > 0) {
            if (Math.abs(monthlyReturnRate - monthlyInflationRate) < 0.000001) {
                // Special case: return rate equals inflation rate
                // In this case, the present value is simply: PMT × n
                totalFundsNeeded = targetMonthlyIncome * totalMonthsInRetirement;
            } else {
                // Growing annuity formula for inflation-adjusted income
                // PV = PMT × [1 - ((1+g)/(1+r))^n] / (r - g)
                // Where: r = return rate, g = inflation rate, n = periods
                const growthRatio = (1 + monthlyInflationRate) / (1 + monthlyReturnRate);
                const pvGrowingAnnuityFactor = (1 - Math.pow(growthRatio, totalMonthsInRetirement)) / (monthlyReturnRate - monthlyInflationRate);
                totalFundsNeeded = targetMonthlyIncome * pvGrowingAnnuityFactor;
            }
        } else {
            // If no return rate, calculate the nominal sum needed with inflation growth
            // This is the sum of a geometric series: a × (1 - r^n) / (1 - r)
            if (monthlyInflationRate > 0) {
                const geometricSeriesSum = (1 - Math.pow(1 + monthlyInflationRate, totalMonthsInRetirement)) / (-monthlyInflationRate);
                totalFundsNeeded = targetMonthlyIncome * geometricSeriesSum;
            } else {
                totalFundsNeeded = targetMonthlyIncome * totalMonthsInRetirement;
            }
        }

        // Project EPF balance at retirement (4% average dividend)
        const epfGrowthRate = 4.0 / 100;
        const currentEpfValue = epfBalance * Math.pow(1 + epfGrowthRate, yearsToRetirement);
        
        // Calculate monthly EPF contribution amount from salary and rate
        // Since currentSalary is already monthly, no division by 12 is needed
        const initialMonthlyEpfContribution = currentSalary * (monthlyEpfContributionRate / 100);
        
        // Future value of EPF contributions at retirement
        // Two scenarios to add:
        // 1. Salary increments enabled: Contributions grow annually with salary (growing annuity)
        // 2. Salary increments disabled: Contributions remain constant (regular annuity)
        let futureEpfContributions = 0;
        if (initialMonthlyEpfContribution > 0) {
            if (enableSalaryIncrements && salaryIncrementRate > 0) {
                // Growing annuity: contributions increase with salary each year
                const annualSalaryGrowthRate = salaryIncrementRate / 100;
                const epfAnnualGrowthRate = epfGrowthRate;
                
                // Calculate future value of growing annuity (annual contributions)
                const annualEpfContribution = initialMonthlyEpfContribution * 12;
                
                if (Math.abs(annualSalaryGrowthRate - epfAnnualGrowthRate) < 0.0001) {
                    // Special case: growth rates are equal
                    futureEpfContributions = annualEpfContribution * yearsToRetirement * Math.pow(1 + epfAnnualGrowthRate, yearsToRetirement);
                } else {
                    // General case: Growing annuity formula
                    // FV = PMT × [(1+r)^n - (1+g)^n] / (r - g)
                    // Where: r = investment return, g = payment growth rate, n = periods
                    const termA = Math.pow(1 + epfAnnualGrowthRate, yearsToRetirement);
                    const termB = Math.pow(1 + annualSalaryGrowthRate, yearsToRetirement);
                    const fvGrowingAnnuityFactor = (termA - termB) / (epfAnnualGrowthRate - annualSalaryGrowthRate);
                    futureEpfContributions = annualEpfContribution * fvGrowingAnnuityFactor;
                }
            } else {
                // No salary increments: regular annuity calculation
                if (epfGrowthRate > 0) {
                    const monthlyGrowthRate = epfGrowthRate / 12;
                    const totalMonthsToRetirement = yearsToRetirement * 12;
                    const fvAnnuityFactor = (Math.pow(1 + monthlyGrowthRate, totalMonthsToRetirement) - 1) / monthlyGrowthRate;
                    futureEpfContributions = initialMonthlyEpfContribution * fvAnnuityFactor;
                } else {
                    futureEpfContributions = initialMonthlyEpfContribution * yearsToRetirement * 12;
                }
            }
        }
        
        const projectedEpfBalance = currentEpfValue + futureEpfContributions;

        // Project PRS balance at retirement
        const prsGrowthRate = preRetirementReturn / 100;
        const currentPrsValue = prsBalance * Math.pow(1 + prsGrowthRate, yearsToRetirement);
        
        // Future value of monthly PRS contributions
        let futurePrsContributions = 0;
        if (monthlyContributionPrs > 0) {
            // Check if PRS contribution is percentage-based and salary increments are enabled
            if (monthlyContributionPrsPercentage > 0 && enableSalaryIncrements && salaryIncrementRate > 0) {
                // Growing annuity: PRS contributions increase with salary each year
                const annualSalaryGrowthRate = salaryIncrementRate / 100;
                const prsAnnualGrowthRate = prsGrowthRate;
                
                // Calculate future value of growing annuity (annual contributions)
                const annualPrsContribution = monthlyContributionPrs * 12;
                
                if (Math.abs(annualSalaryGrowthRate - prsAnnualGrowthRate) < 0.0001) {
                    // Special case: growth rates are equal
                    futurePrsContributions = annualPrsContribution * yearsToRetirement * Math.pow(1 + prsAnnualGrowthRate, yearsToRetirement);
                } else {
                    // General case: Growing annuity formula
                    // FV = PMT × [(1+r)^n - (1+g)^n] / (r - g)
                    // Where: r = investment return, g = payment growth rate, n = periods
                    const termA = Math.pow(1 + prsAnnualGrowthRate, yearsToRetirement);
                    const termB = Math.pow(1 + annualSalaryGrowthRate, yearsToRetirement);
                    const fvGrowingAnnuityFactor = (termA - termB) / (prsAnnualGrowthRate - annualSalaryGrowthRate);
                    futurePrsContributions = annualPrsContribution * fvGrowingAnnuityFactor;
                }
            } else {
                // Regular annuity: PRS contributions remain constant
                if (prsGrowthRate > 0) {
                    const monthlyGrowthRate = prsGrowthRate / 12;
                    const totalMonthsToRetirement = yearsToRetirement * 12;
                    const fvAnnuityFactor = (Math.pow(1 + monthlyGrowthRate, totalMonthsToRetirement) - 1) / monthlyGrowthRate;
                    futurePrsContributions = monthlyContributionPrs * fvAnnuityFactor;
                } else {
                    futurePrsContributions = monthlyContributionPrs * yearsToRetirement * 12;
                }
            }
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
            monthlyEpfContribution: Math.round(initialMonthlyEpfContribution * 100) / 100, // Total monthly EPF contribution (employee + employer)
            monthlyEmployeeEpfContribution: Math.round(monthlyEmployeeEpfContribution * 100) / 100, // Employee EPF contribution only
            disposableMonthlySalary: Math.round(disposableMonthlySalary * 100) / 100, // Salary after EPF and PRS deductions
            totalFundsNeeded: Math.round(totalFundsNeeded * 100) / 100,
            projectedEpfBalance: Math.round(projectedEpfBalance * 100) / 100,
            projectedPrsBalance: Math.round(projectedPrsBalance * 100) / 100,
            totalProjectedSavings: Math.round(totalProjectedSavings * 100) / 100,
            fundingGap: Math.round(fundingGap * 100) / 100,
            additionalMonthlySavingsRequired: Math.round(additionalMonthlySavingsRequired * 100) / 100
        };
    }

    // Get user's retirement plan (single plan)
    async getRetirementPlan(req, res) {
        try {
            const userId = req.user._id;

            const retirementPlan = await RetirementPlan.findOne({ user: userId });

            if (!retirementPlan) {
                return res.status(404).json({
                    success: false,
                    message: "No retirement plan found"
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

    // Delete user's retirement plan
    async deleteRetirementPlan(req, res) {
        try {
            const userId = req.user._id;

            const deletedPlan = await RetirementPlan.findOneAndDelete({ user: userId });

            if (!deletedPlan) {
                return res.status(404).json({
                    success: false,
                    message: "No retirement plan found to delete"
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