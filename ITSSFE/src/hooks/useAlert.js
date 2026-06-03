import { useState, useCallback } from 'react';

/**
 * Manages Alert/Snackbar display state. Replace inline {alert && <Alert ...>} patterns
 * scattered across CRUD pages.
 */
export default function useAlert() {
  const [alert, setAlert] = useState(null); // { severity: 'success' | 'error' | 'info', message: string }

  const showAlert = useCallback((message, severity = 'success') => {
    setAlert({ severity, message });
  }, []);

  const showSuccess = useCallback((msg) => setAlert({ severity: 'success', message: msg }), []);
  const showError = useCallback((msg) => setAlert({ severity: 'error', message: msg }), []);
  const closeAlert = useCallback(() => setAlert(null), []);

  return { alert, showAlert, showSuccess, showError, closeAlert };
}
