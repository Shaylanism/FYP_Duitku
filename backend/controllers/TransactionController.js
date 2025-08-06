import { TransactionService } from '../services/TransactionService.js';
import { TransactionValidator } from '../validators/transactionValidator.js';
import { createSuccessResponse, createErrorResponse, HTTP_STATUS, STANDARD_MESSAGES } from '../constants/responses.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { isValidObjectId } from '../utils/helpers.js';

class TransactionController {
    // Get categories for transaction types
    getCategories = asyncHandler(async (req, res) => {
        const categories = TransactionService.getCategories();
        
        res.status(HTTP_STATUS.OK).json(createSuccessResponse(
            STANDARD_MESSAGES.FETCHED_SUCCESS('Categories'),
            { categories }
        ));
    });

    // Check budget exceedance endpoint
    checkBudgetForTransaction = asyncHandler(async (req, res) => {
            const { category, amount } = req.query;
            const userId = req.user._id;

            // Validation
            if (!category || !amount) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(
                "Category and amount are required"
            ));
            }

            const transactionAmount = parseFloat(amount);
            if (transactionAmount <= 0) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(
                "Amount must be greater than 0"
            ));
        }

        const budgetCheck = await TransactionService.checkBudgetExceedance(userId, category, transactionAmount);

        res.status(HTTP_STATUS.OK).json(createSuccessResponse(
            'Budget check completed',
            budgetCheck
        ));
    });

    // Create transaction
    createTransaction = asyncHandler(async (req, res) => {
            const { type, amount, description, category, forceBudgetOverride } = req.body;
        const userId = req.user._id;

            // Validation
        const validation = TransactionValidator.validateCreate({ type, amount, description, category });
        if (!validation.isValid) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(
                validation.errors.join(', ')
            ));
        }

        const transaction = await TransactionService.createTransaction(
            userId, 
            { type, amount, description, category }, 
            forceBudgetOverride
        );
        
        res.status(HTTP_STATUS.CREATED).json(createSuccessResponse(
            STANDARD_MESSAGES.CREATED_SUCCESS('Transaction'),
            { transaction }
        ));
    });

    // Get user's transactions
    getTransactions = asyncHandler(async (req, res) => {
            const userId = req.user._id;
        const filters = req.query;

        const result = await TransactionService.getTransactions(userId, filters);
        
        res.status(HTTP_STATUS.OK).json(createSuccessResponse(
            STANDARD_MESSAGES.FETCHED_SUCCESS('Transactions'),
            result
        ));
    });

    // Update transaction
    updateTransaction = asyncHandler(async (req, res) => {
            const { id } = req.params;
            const { type, amount, description, category, forceBudgetOverride } = req.body;
            const userId = req.user._id;

        if (!isValidObjectId(id)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(
                "Invalid transaction ID"
            ));
            }

            // Validation
        const validation = TransactionValidator.validateUpdate({ type, amount, description, category });
        if (!validation.isValid) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(
                validation.errors.join(', ')
            ));
        }

        const transaction = await TransactionService.updateTransaction(
            userId, 
            id, 
            { type, amount, description, category }, 
            forceBudgetOverride
        );
        
        res.status(HTTP_STATUS.OK).json(createSuccessResponse(
            STANDARD_MESSAGES.UPDATED_SUCCESS('Transaction'),
            { transaction }
        ));
    });

    // Delete transaction
    deleteTransaction = asyncHandler(async (req, res) => {
            const { id } = req.params;
            const userId = req.user._id;

        if (!isValidObjectId(id)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(
                "Invalid transaction ID"
            ));
        }

        await TransactionService.deleteTransaction(userId, id);

        res.status(HTTP_STATUS.OK).json(createSuccessResponse(
            STANDARD_MESSAGES.DELETED_SUCCESS('Transaction')
        ));
    });

    // Get transaction by ID
    getTransactionById = asyncHandler(async (req, res) => {
            const { id } = req.params;
            const userId = req.user._id;

        if (!isValidObjectId(id)) {
            return res.status(HTTP_STATUS.BAD_REQUEST).json(createErrorResponse(
                "Invalid transaction ID"
            ));
        }

        const transaction = await TransactionService.getTransactionById(userId, id);

        res.status(HTTP_STATUS.OK).json(createSuccessResponse(
            STANDARD_MESSAGES.FETCHED_SUCCESS('Transaction'),
            { transaction }
        ));
    });


}

export default new TransactionController(); 