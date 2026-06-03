import { useState, useCallback } from 'react';

/**
 * Pattern: Custom Hook + Compound Component setup.
 * Manages form dialog state (open/closed + form data) for both CREATE and EDIT modes.
 *
 * Usage:
 *   const form = useFormDialog({ initialState: { email: '', name: '' } });
 *   <Button onClick={() => form.openDialog()}>Create</Button>                  // create mode
 *   <Button onClick={() => form.openDialog(existingRow)}>Edit</Button>        // edit mode
 *   <FormDialog open={form.open} formData={form.formData} setField={form.setField} onClose={form.closeDialog} ... />
 */
export default function useFormDialog({ initialState = {} } = {}) {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState(initialState);
  const [editingId, setEditingId] = useState(null);

  const openDialog = useCallback((initialData) => {
    if (initialData) {
      setFormData({ ...initialState, ...initialData });
      setEditingId(initialData.id ?? null);
    } else {
      setFormData(initialState);
      setEditingId(null);
    }
    setOpen(true);
  }, [initialState]);

  const closeDialog = useCallback(() => {
    setOpen(false);
    setFormData(initialState);
    setEditingId(null);
  }, [initialState]);

  const setField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return { open, formData, editingId, openDialog, closeDialog, setField, isEditing: editingId !== null };
}
