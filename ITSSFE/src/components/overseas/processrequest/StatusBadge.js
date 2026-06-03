// ============================================================================
//  StatusBadge — shared status chip used across the process-request steps.
// ============================================================================
import * as React from 'react';
import { Chip } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import SendIcon from '@mui/icons-material/Send';
import { useTranslation } from 'src/i18n/useTranslation';

export default function StatusBadge({ status }) {
  const { t } = useTranslation();
  const configs = {
    PENDING:      { color: 'default',   label: t('overseas.processRequest.statusPending'),    icon: null },
    PICKED:       { color: 'info',      label: t('overseas.processRequest.statusPicked'),     icon: React.createElement(CheckCircleIcon, { sx: { fontSize: 14 } }) },
    REJECTED:     { color: 'error',     label: t('overseas.processRequest.statusRejected'),   icon: React.createElement(CancelIcon, { sx: { fontSize: 14 } }) },
    INQUIRY_SENT: { color: 'info',     label: t('overseas.processRequest.statusInquirySent'), icon: React.createElement(SendIcon, { sx: { fontSize: 14 } }) },
    PARTIAL:      { color: 'warning',   label: t('overseas.processRequest.statusPartial'),                              icon: null },
    RESPONDED:    { color: 'success',   label: t('overseas.processRequest.statusResponded'),  icon: React.createElement(CheckCircleIcon, { sx: { fontSize: 14 } }) },
    TIMEOUT:      { color: 'error',     label: t('overseas.processRequest.statusTimeout'),    icon: React.createElement(CancelIcon, { sx: { fontSize: 14 } }) },
  };
  const c = configs[status] || { color: 'default', label: status, icon: null };
  return React.createElement(Chip, { size: 'small', icon: c.icon, label: c.label, color: c.color, sx: { height: 22, fontSize: '0.7rem' } });
}
