import express from 'express';
import TransactionHistoryController from '../controllers/TransactionHistoryController.js';
import authMiddleware from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// GET /api/transaction-history - Get user's transaction history with pagination and filters
router.get('/', TransactionHistoryController.getTransactionHistory);

// GET /api/transaction-history/categories - Get available categories for filtering
router.get('/categories', TransactionHistoryController.getAvailableCategories);

// GET /api/transaction-history/transaction/:transactionId - Get history for a specific transaction
router.get('/transaction/:transactionId', TransactionHistoryController.getTransactionHistoryById);

export default router;