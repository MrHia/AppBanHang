// ============================================================================
//  StatusBadge — shared status chip used across the process-request steps.
//  Only 3 statuses survive after the stock-inquiry removal: PENDING / PICKED / REJECTED.
// ============================================================================
import * as React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { useTranslation } from 'src/i18n/useTranslation';

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const configs = {
    PENDING:  { color: 'default', label: t('overseas.processRequest.statusPending'),  icon: null },
    PICKED:   { color: 'info',    label: t('overseas.processRequest.statusPicked'),   icon: React.createElement(CheckCircleIcon, { sx: { fontSize: 14 } }) },
    REJECTED: { color: 'error',   label: t('overseas.processRequest.statusRejected'), icon: React.createElement(CancelIcon, { sx: { fontSize: 14 } }) },
  };
  const c = configs[status] || { color: 'default', label: status, icon: null };
  return React.createElement(Chip, { size: 'small', icon: c.icon, label: c.label, color: c.color, sx: { height: 22, fontSize: '0.7rem' } });
}
