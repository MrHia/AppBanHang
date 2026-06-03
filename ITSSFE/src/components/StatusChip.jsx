import { Chip } from '@mui/material';

/**
 * Reusable status chip with color mapping per status group.
 *
 * Usage: <StatusChip status="CONFIRMED" group="po" />
 */
const STATUS_COLOR_MAP = {
  po: {
    DRAFT: 'default', SENT: 'info', CONFIRMED: 'success', REJECTED: 'error', DONE: 'success',
  },
  request: {
    PENDING: 'default', PROCESSING: 'info', DONE: 'success', CANCELLED: 'error',
  },
  inquiry: {
    PENDING: 'default', RESPONDED: 'success', PARTIAL: 'warning', TIMEOUT: 'error',
  },
  receipt: {
    PENDING: 'default', DONE: 'success', RESOLVING: 'warning',
  },
  discrepancy: {
    OPEN: 'warning', RESOLVING: 'info', RESOLVED: 'success',
  },
  default: {
    active: 'success', true: 'success', inactive: 'default', false: 'default',
  },
};

export default function StatusChip({ status, group = 'default', size = 'small' }) {
  const palette = STATUS_COLOR_MAP[group] || STATUS_COLOR_MAP.default;
  const color = palette[status] || palette[String(status)] || 'default';
  return <Chip label={status} color={color} size={size} variant={color === 'default' ? 'outlined' : 'filled'} />;
}
