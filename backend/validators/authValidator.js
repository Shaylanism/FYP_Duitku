/**
 * Authentication validation logic
 * Centralized validation for auth-related operations
 */

import { VALIDATION_LIMITS, ERROR_MESSAGES, REGEX_PATTERNS } from '../constants/validation.js';

export class AuthValidator {
  /**
   * Validate user registration data
   */
  static validateRegister(data) {
    const errors = [];
    const { name, email, password } = data;

    // Required fields
    if (!name || !email || !password) {
      errors.push(ERROR_MESSAGES.REQUIRED_FIELDS(['name', 'email', 'password']));
    }

    // Email validation
    if (email && !REGEX_PATTERNS.EMAIL.test(email)) {
      errors.push(ERROR_MESSAGES.INVALID_EMAIL);
    }

    // Password validation
    if (password && password.length < VALIDATION_LIMITS.USER.MIN_PASSWORD_LENGTH) {
      errors.push(ERROR_MESSAGES.PASSWORD_TOO_SHORT);
    }

    // Name validation
    if (name && name.trim().length === 0) {
      errors.push('Name cannot be empty');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate user login data
   */
  static validateLogin(data) {
    const errors = [];
    const { email, password } = data;

    // Required fields
    if (!email || !password) {
      errors.push(ERROR_MESSAGES.REQUIRED_FIELDS(['email', 'password']));
    }

    // Email validation
    if (email && !REGEX_PATTERNS.EMAIL.test(email)) {
      errors.push(ERROR_MESSAGES.INVALID_EMAIL);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate JWT token format
   */
  static validateTokenFormat(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }

    // Basic JWT format check (3 parts separated by dots)
    const parts = token.split('.');
    return parts.length === 3;
  }
}