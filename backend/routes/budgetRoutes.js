import express from "express";
import authMiddleware from "../middleware/auth.js";
import BudgetController from "../controllers/BudgetController.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Budget routes - delegating to controller
router.post("/", (req, res) => BudgetController.createBudget(req, res));
router.post("/copy", (req, res) => BudgetController.copyBudgets(req, res));
router.get("/", (req, res) => BudgetController.getBudgets(req, res));
router.get("/with-spending", (req, res) => BudgetController.getBudgetsWithSpending(req, res));
router.get("/check-impact", (req, res) => BudgetController.checkTransactionImpact(req, res));
router.get("/check-exceedance", (req, res) => BudgetController.checkBudgetExceedance(req, res));
router.get("/:id", (req, res) => BudgetController.getBudgetById(req, res));
router.put("/:id", (req, res) => BudgetController.updateBudget(req, res));
router.delete("/:id", (req, res) => BudgetController.deleteBudget(req, res));

export default router; 