import express from "express";
import authMiddleware from "../middleware/auth.js";
import BudgetController from "../controllers/BudgetController.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Budget routes - directly using controller methods
router.post("/", BudgetController.createBudget);
router.post("/copy", BudgetController.copyBudgets);
router.get("/", BudgetController.getBudgets);
router.get("/with-spending", BudgetController.getBudgetsWithSpending);
router.get("/check-impact", BudgetController.checkTransactionImpact);
router.get("/check-exceedance", BudgetController.checkBudgetExceedance);
router.get("/:id", BudgetController.getBudgetById);
router.put("/:id", BudgetController.updateBudget);
router.delete("/:id", BudgetController.deleteBudget);

export default router; 