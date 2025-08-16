/**
 * Standardized API response constants
 * Ensures consistent response format across the application
 */

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500
};

export const ERROR_TYPES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NO_INCOME: 'NO_INCOME',
  INSUFFICIENT_INCOME: 'INSUFFICIENT_INCOME',
  INSUFFICIENT_MONTHLY_BALANCE: 'INSUFFICIENT_MONTHLY_BALANCE',
  BUDGET_EXCEEDED: 'BUDGET_EXCEEDED',
  OVERDUE_PLANNED_PAYMENTS: 'OVERDUE_PLANNED_PAYMENTS',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  NOT_FOUND: 'NOT_FOUND',
  UNAUTHORIZED: 'UNAUTHORIZED',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY'
};

export const createSuccessResponse = (message, data = null, statusCode = HTTP_STATUS.OK) => ({
  success: true,
  message,
  ...(data && { ...data })
});

export const createErrorResponse = (message, errorType = ERROR_TYPES.VALIDATION_ERROR, statusCode = HTTP_STATUS.BAD_REQUEST, additionalData = {}) => ({
  success: false,
  message,
  errorType,
  ...additionalData
});

export const STANDARD_MESSAGES = {
  // CRUD Operations
  CREATED_SUCCESS: (entity) => `${entity} created successfully`,
  UPDATED_SUCCESS: (entity) => `${entity} updated successfully`,
  DELETED_SUCCESS: (entity) => `${entity} deleted successfully`,
  FETCHED_SUCCESS: (entity) => `${entity} fetched successfully`,
  
  // Common Errors
  NOT_FOUND: (entity) => `${entity} not found or not authorized`,
  ALREADY_EXISTS: (entity) => `${entity} already exists`,
  CREATION_FAILED: (entity) => `Failed to create ${entity}`,
  UPDATE_FAILED: (entity) => `Failed to update ${entity}`,
  DELETE_FAILED: (entity) => `Failed to delete ${entity}`,
  FETCH_FAILED: (entity) => `Failed to fetch ${entity}`,
  OPERATION_FAILED: (operation) => `Failed to ${operation}`,
  
  // Auth Messages
  LOGIN_SUCCESS: 'Login successful',
  REGISTRATION_SUCCESS: 'User registered successfully',
  TOKEN_INVALID: 'Invalid token',
  ACCESS_DENIED: 'Access denied. No token provided.',
  
  // Specific Business Logic
  PAST_MONTH_RESTRICTION: 'Cannot create budgets for past months. You can only set budgets for the current month or future months.',
  PAST_MONTH_EDIT_RESTRICTION: 'Cannot modify budgets for past months. You can only edit budgets for the current month or future months.'
};