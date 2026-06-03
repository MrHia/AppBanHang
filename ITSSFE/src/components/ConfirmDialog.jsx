import { Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, Button } from '@mui/material';

/**
 * Pattern: Reusable confirm dialog (replaces window.confirm — browser-dependent, not i18n-able).
 */
export default function ConfirmDialog({ open, title = 'Confirm', message, onConfirm, onCancel, confirmLabel = 'OK', cancelLabel = 'Cancel', danger = false }) {
  return (
    <Dialog open={open} onClose={onCancel}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{cancelLabel}</Button>
        <Button onClick={onConfirm} color={danger ? 'error' : 'primary'} variant="contained">{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
