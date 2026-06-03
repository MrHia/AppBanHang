import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, MenuItem } from '@mui/material';

/**
 * Pattern: Compound Component — schema-driven form dialog.
 *
 * Field schema item: { key, label, type?: 'text'|'email'|'password'|'number'|'select', required?, options? }
 *
 * Usage:
 *   <FormDialog
 *     open={form.open}
 *     title={form.isEditing ? 'Edit Account' : 'Create Account'}
 *     fields={[
 *       { key: 'email', label: 'Email', type: 'email', required: true },
 *       { key: 'roleName', label: 'Role', type: 'select', options: ['ADMIN','SALES','OVERSEAS','WAREHOUSE','SITE'] },
 *     ]}
 *     formData={form.formData}
 *     setField={form.setField}
 *     onClose={form.closeDialog}
 *     onSubmit={handleSubmit}
 *   />
 */
export default function FormDialog({ open, title, fields, formData, setField, onClose, onSubmit, submitLabel = 'Save', cancelLabel = 'Cancel', maxWidth = 'sm' }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {fields.map(f => (
            <TextField
              key={f.key}
              label={f.label}
              type={f.type === 'select' ? 'text' : (f.type || 'text')}
              select={f.type === 'select'}
              required={f.required}
              fullWidth
              value={formData[f.key] ?? ''}
              onChange={e => setField(f.key, e.target.value)}
              disabled={f.disabled}
              multiline={f.multiline}
              rows={f.multiline ? 3 : undefined}
            >
              {f.type === 'select' && (f.options || []).map(opt => {
                const value = typeof opt === 'string' ? opt : opt.value;
                const label = typeof opt === 'string' ? opt : opt.label;
                return <MenuItem key={value} value={value}>{label}</MenuItem>;
              })}
            </TextField>
          ))}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelLabel}</Button>
        <Button onClick={onSubmit} variant="contained">{submitLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}
