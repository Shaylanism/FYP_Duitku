/**
 * Centralized error handling middleware
 * Standardizes error responses across the application
 */

import { HTTP_STATUS, ERROR_TYPES, createErrorResponse } from '../constants/responses.js';

export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let errorResponse = createErrorResponse(
    'Internal server error',
    ERROR_TYPES.VALIDATION_ERROR,
    statusCode
  );

  // Handle custom service errors
  if (err.type) {
    switch (err.type) {
      case ERROR_TYPES.NOT_FOUND:
        statusCode = HTTP_STATUS.NOT_FOUND;
        break;
      case ERROR_TYPES.UNAUTHORIZED:
        statusCode = HTTP_STATUS.UNAUTHORIZED;
        break;
      case ERROR_TYPES.VALIDATION_ERROR:
        statusCode = HTTP_STATUS.BAD_REQUEST;
        break;
      case ERROR_TYPES.DUPLICATE_ENTRY:
        statusCode = HTTP_STATUS.CONFLICT;
        break;
      case ERROR_TYPES.NO_INCOME:
      case ERROR_TYPES.INSUFFICIENT_INCOME:
      case ERROR_TYPES.BUDGET_EXCEEDED:
      case ERROR_TYPES.OVERDUE_PLANNED_PAYMENTS:
      case ERROR_TYPES.INSUFFICIENT_BALANCE:
        statusCode = HTTP_STATUS.BAD_REQUEST;
        break;
      default:
        statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
    }

    errorResponse = createErrorResponse(
      err.message,
      err.type,
      statusCode,
      {
        ...(err.details && { details: err.details }),
        ...(err.budgetInfo && { budgetInfo: err.budgetInfo }),
        ...(err.overduePayments && { overduePayments: err.overduePayments })
      }
    );
  }
  // Handle MongoDB errors
  else if (err.name === 'ValidationError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    const errors = Object.values(err.errors).map(e => e.message);
    errorResponse = createErrorResponse(
      errors.join(', '),
      ERROR_TYPES.VALIDATION_ERROR,
      statusCode
    );
  }
  // Handle MongoDB duplicate key error
  else if (err.code === 11000) {
    statusCode = HTTP_STATUS.CONFLICT;
    const field = Object.keys(err.keyPattern)[0];
    errorResponse = createErrorResponse(
      `${field} already exists`,
      ERROR_TYPES.DUPLICATE_ENTRY,
      statusCode
    );
  }
  // Handle MongoDB cast error (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = HTTP_STATUS.BAD_REQUEST;
    errorResponse = createErrorResponse(
      'Invalid ID format',
      ERROR_TYPES.VALIDATION_ERROR,
      statusCode
    );
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorResponse = createErrorResponse(
      'Invalid token',
      ERROR_TYPES.UNAUTHORIZED,
      statusCode
    );
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    errorResponse = createErrorResponse(
      'Token expired',
      ERROR_TYPES.UNAUTHORIZED,
      statusCode
    );
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Async error wrapper
 * Catches async errors and passes them to error handler
 */
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req, res, next) => {
  const error = createErrorResponse(
    `Route ${req.originalUrl} not found`,
    ERROR_TYPES.NOT_FOUND,
    HTTP_STATUS.NOT_FOUND
  );
  res.status(HTTP_STATUS.NOT_FOUND).json(error);
};