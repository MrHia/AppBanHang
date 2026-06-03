import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useCRUDTable from 'src/hooks/useCRUDTable';

describe('useCRUDTable', () => {
  it('loads items on mount', async () => {
    const fetchAll = vi.fn().mockResolvedValue([{ id: 1, name: 'A' }, { id: 2, name: 'B' }]);
    const { result } = renderHook(() => useCRUDTable(fetchAll, { intervalMs: 0 }));
    await waitFor(() => expect(result.current.items).toHaveLength(2));
    expect(fetchAll).toHaveBeenCalledOnce();
  });

  it('reloads when reload is called', async () => {
    const fetchAll = vi.fn().mockResolvedValue([]);
    const { result } = renderHook(() => useCRUDTable(fetchAll, { intervalMs: 0 }));
    await waitFor(() => expect(fetchAll).toHaveBeenCalledOnce());
    await result.current.reload();
    expect(fetchAll).toHaveBeenCalledTimes(2);
  });

  it('handles fetch errors gracefully', async () => {
    const fetchAll = vi.fn().mockRejectedValue(new Error('Network error'));
    const { result } = renderHook(() => useCRUDTable(fetchAll, { intervalMs: 0 }));
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.items).toEqual([]);
  });

  it('normalizes wrapped response { data: [...] }', async () => {
    const fetchAll = vi.fn().mockResolvedValue({ data: [{ id: 1 }] });
    const { result } = renderHook(() => useCRUDTable(fetchAll, { intervalMs: 0 }));
    await waitFor(() => expect(result.current.items).toHaveLength(1));
  });
});
