import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Pattern: Custom Hook — encapsulate CRUD page state + 15s polling.
 * Eliminates duplication across admin/accounts.js, admin/sites.js, admin/merchandise.js.
 *
 * IMPORTANT: fetchAll prop should be stable (memoized with useCallback in parent
 * OR a module-level constant). Hook uses useRef internally to keep latest fetchAll
 * reference without re-creating interval on each render.
 */
export default function useCRUDTable(fetchAll, { intervalMs = 15000 } = {}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fetchRef = useRef(fetchAll);

  useEffect(() => { fetchRef.current = fetchAll; }, [fetchAll]);

  const reload = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const data = await fetchRef.current();
      const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
      setItems(list);
    } catch (e) { setError(e); console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { reload(); }, [reload]);

  useEffect(() => {
    if (!intervalMs) return;
    const t = setInterval(reload, intervalMs);
    return () => clearInterval(t);
  }, [reload, intervalMs]);

  return { items, setItems, loading, error, reload };
}
