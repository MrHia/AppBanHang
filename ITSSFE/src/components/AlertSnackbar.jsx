import { Snackbar, Alert } from '@mui/material';

/**
 * Reusable alert with auto-dismiss. Pair with useAlert() hook.
 */
export default function AlertSnackbar({ alert, onClose, autoHideDuration = 4000 }) {
  return (
    <Snackbar
      open={Boolean(alert)}
      autoHideDuration={autoHideDuration}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      {alert ? (
        <Alert onClose={onClose} severity={alert.severity || 'info'} sx={{ width: '100%' }}>
          {alert.message}
        </Alert>
      ) : <span />}
    </Snackbar>
  );
}
