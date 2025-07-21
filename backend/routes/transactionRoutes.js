import express from "express";
import authMiddleware from "../middleware/auth.js";
import TransactionController from "../controllers/TransactionController.js";

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Transaction routes - delegating to controller
router.post("/", (req, res) => TransactionController.createTransaction(req, res));
router.get("/", (req, res) => TransactionController.getTransactions(req, res));
router.get("/:id", (req, res) => TransactionController.getTransactionById(req, res));
router.put("/:id", (req, res) => TransactionController.updateTransaction(req, res));
router.delete("/:id", (req, res) => TransactionController.deleteTransaction(req, res));

export default router; 