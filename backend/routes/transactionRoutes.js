import express from "express";
import authMiddleware from "../middleware/auth.js";
import TransactionController from "../controllers/TransactionController.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Transaction routes - directly using controller methods
router.get("/categories", TransactionController.getCategories);
router.get("/check-budget", TransactionController.checkBudgetForTransaction);
router.post("/", TransactionController.createTransaction);
router.get("/", TransactionController.getTransactions);
router.get("/:id", TransactionController.getTransactionById);
router.put("/:id", TransactionController.updateTransaction);
router.delete("/:id", TransactionController.deleteTransaction);

export default router; 