/**
 * Custom hook for API calls
 * Provides loading states and error handling for API operations
 */

import { useState, useCallback } from 'react';

export const useApi = (apiFunction) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const execute = useCallback(async (...args) => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiFunction(...args);
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'An error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunction]);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setData(null);
  }, []);

  return {
    loading,
    error,
    data,
    execute,
    reset
  };
};

/**
 * Hook for form submissions with API calls
 */
export const useFormSubmit = (submitFunction) => {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = useCallback(async (formData) => {
    try {
      setSubmitting(true);
      setError(null);
      const result = await submitFunction(formData);
      return result;
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || 'Submission failed';
      setError(errorMessage);
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, [submitFunction]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    submitting,
    error,
    submit,
    clearError
  };
};