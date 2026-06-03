import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useFormDialog from 'src/hooks/useFormDialog';

describe('useFormDialog', () => {
  it('starts closed with initial state', () => {
    const { result } = renderHook(() => useFormDialog({ initialState: { name: '' } }));
    expect(result.current.open).toBe(false);
    expect(result.current.formData).toEqual({ name: '' });
    expect(result.current.isEditing).toBe(false);
  });

  it('opens in create mode with no data', () => {
    const { result } = renderHook(() => useFormDialog({ initialState: { name: '' } }));
    act(() => result.current.openDialog());
    expect(result.current.open).toBe(true);
    expect(result.current.isEditing).toBe(false);
  });

  it('opens in edit mode with provided data', () => {
    const { result } = renderHook(() => useFormDialog({ initialState: { name: '' } }));
    act(() => result.current.openDialog({ id: 5, name: 'Alice' }));
    expect(result.current.open).toBe(true);
    expect(result.current.formData.name).toBe('Alice');
    expect(result.current.editingId).toBe(5);
    expect(result.current.isEditing).toBe(true);
  });

  it('setField updates a single field', () => {
    const { result } = renderHook(() => useFormDialog({ initialState: { name: '', email: '' } }));
    act(() => result.current.setField('email', 'a@b.com'));
    expect(result.current.formData.email).toBe('a@b.com');
    expect(result.current.formData.name).toBe('');
  });

  it('closeDialog resets state', () => {
    const { result } = renderHook(() => useFormDialog({ initialState: { name: '' } }));
    act(() => result.current.openDialog({ id: 1, name: 'X' }));
    act(() => result.current.closeDialog());
    expect(result.current.open).toBe(false);
    expect(result.current.editingId).toBe(null);
  });
});
