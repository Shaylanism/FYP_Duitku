/**
 * Transaction category constants
 * Centralized management of transaction categories
 */

export const INCOME_CATEGORIES = ['Salary', 'Others'];

export const EXPENSE_CATEGORIES = [
  'Car', 
  'Fuel', 
  'Food & Beverages', 
  'House', 
  'Utilities/Bills', 
  'Health', 
  'Transportation', 
  'Entertainment', 
  'Shopping', 
  'Insurance', 
  'Savings/Investments', 
  'Debt Payment', 
  'Others'
];

export const TRANSACTION_TYPES = {
  INCOME: 'income',
  EXPENSE: 'expense'
};

export const getCategoriesByType = (type) => {
  return type === TRANSACTION_TYPES.INCOME ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
};

export const validateCategory = (type, category) => {
  const validCategories = getCategoriesByType(type);
  return validCategories.includes(category);
};