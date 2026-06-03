// ============================================================================
//  Shared helpers + color tokens for the Order Matrix page.
//  Extracted so Step1Row / Step2Row sub-components and the main page share
//  the same source of truth.
// ============================================================================

export const C = {
  okBg: '#F0FDF4', ok: '#059669', warnBg: '#FFFBEB', warn: '#D97706',
  errBg: '#FEF2F2', err: '#DC2626', pendBg: '#F8FAFC', pend: '#64748B',
  headBg: '#F8FAFC', border: '#E2E8F0',
};

export function rowStatus(chosen, requested) {
  if (chosen <= 0) return { label: 'Chưa chọn', color: 'default' };
  if (chosen >= requested) return { label: 'Đủ', color: 'success' };
  return { label: 'Thiếu', color: 'warning' };
}

// trạng thái 1 ô (mặt hàng × site) suy từ matrix.source
//  inquiry           -> đã phản hồi (tồn thực)
//  reference         -> chưa phản hồi (đang chờ)
//  reference_timeout -> quá hạn, dùng tồn tham khảo (vẫn cho đặt)
export function cellStateFromMatrix(cell) {
  if (!cell || cell.source === 'none' || cell.source == null) return { state: 'PENDING', quantity: 0 };
  if (cell.source === 'inquiry') return { state: 'RESPONDED', quantity: cell.quantity ?? 0 };
  if (cell.source === 'reference_timeout') return { state: 'TIMEOUT', quantity: cell.quantity ?? 0 };
  return { state: 'PENDING', quantity: 0 }; // reference = chưa phản hồi
}
