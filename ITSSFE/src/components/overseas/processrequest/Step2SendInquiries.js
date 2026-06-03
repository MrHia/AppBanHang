// ============================================================================
//  Step2SendInquiries — Group picked assignments by site, then trigger
//  the stock-inquiry batch send.
// ============================================================================
import * as React from 'react';
import {
  Box, Card, CardContent, Button, Chip, Alert, Typography, Grid,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { requestApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';

export default function Step2SendInquiries({ requestId, assignments, sites, hasSentInquiries, onBack, onNext, setAssignments }) {
  const { t } = useTranslation();
  const [assignList, setAssignList] = React.useState([]);
  const [sending, setSending] = React.useState(false);
  const [alert, setAlert] = React.useState('');
  const [sent, setSent] = React.useState(false);

  React.useEffect(() => {
    requestApi.getMerchandiseAssignments(requestId)
      .then(r => {
        const arr = Array.isArray(r) ? r : [];
        setAssignList(arr);
        setSent(arr.some(a => a.status === 'INQUIRY_SENT'));
      })
      .catch(console.error);
  }, [requestId]);

  const handleSend = async () => {
    setSending(true);
    try {
      await requestApi.sendInquiries(requestId);
      setSent(true);
      setAlert(t('overseas.processRequest.sentSuccessfully'));
      const updated = await requestApi.getMerchandiseAssignments(requestId);
      const arr = Array.isArray(updated) ? updated : [];
      setAssignList(arr);
      if (setAssignments) setAssignments(arr);
    } catch (err) {
      setAlert(err?.data?.message || err?.message || t('common.error'));
    } finally { setSending(false); }
  };

  const pickedAssignments = assignList.filter(a => a.status === 'PICKED' || a.status === 'INQUIRY_SENT');
  const bySite = pickedAssignments.reduce((acc, a) => {
    if (!a.assignedSiteId) return acc;
    if (!acc[a.assignedSiteId]) acc[a.assignedSiteId] = [];
    acc[a.assignedSiteId].push(a);
    return acc;
  }, {});

  return React.createElement(Box, null,
    React.createElement(Alert, { severity: 'info', sx: { mb: 3 } },
      t('overseas.processRequest.step2Alert1'), ' ', React.createElement('strong', null, Object.keys(bySite).length),
      ' ', t('overseas.processRequest.step2Alert2'), ' ', React.createElement('strong', null, '48'),
      ' ', t('overseas.processRequest.step2Alert3')
    ),
    alert && React.createElement(Alert, { severity: sent ? 'success' : 'info', sx: { mb: 2 }, onClose: () => setAlert('') }, alert),
    React.createElement(Grid, { container: true, spacing: 2, sx: { mb: 3 } },
      Object.entries(bySite).map(([siteId, items]) => {
        const site = sites.find(s => s.id == siteId) || {};
        return React.createElement(Grid, { item: true, xs: 12, sm: 6, key: siteId },
          React.createElement(Card, { variant: 'outlined', sx: { border: '1px solid #E5E7EB' } },
            React.createElement(Box, { sx: { px: 2, py: 1, bgcolor: '#F0FDF4', borderBottom: '1px solid #E5E7EB' } },
              React.createElement(Typography, { variant: 'subtitle2', fontWeight: 700, color: 'success.main', children: site.name + ' (' + site.code + ') - ' + site.country }),
              React.createElement(Typography, { variant: 'caption', color: 'text.secondary', children: items.length + ' ' + t('overseas.processRequest.matHang') })
            ),
            React.createElement(CardContent, { sx: { pt: 1 } },
              items.map((a, idx) =>
                React.createElement(Box, { key: idx, sx: { display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 } },
                  React.createElement(Typography, { variant: 'caption', sx: { minWidth: 60, fontWeight: 700, fontFamily: 'monospace' }, children: a.merchandiseCode }),
                  React.createElement(Typography, { variant: 'caption', color: 'text.secondary', children: a.merchandiseName }),
                  React.createElement(Chip, { size: 'small', label: 'YC: ' + a.requestedQty + ' ' + a.unit, variant: 'outlined', sx: { height: 18, fontSize: '0.65rem' } })
                )
              )
            )
          )
        );
      })
    ),
    React.createElement(Box, { sx: { mt: 3, display: 'flex', justifyContent: 'space-between' } },
      React.createElement(Button, { onClick: onBack, disabled: sent, children: t('overseas.processRequest.back') }),
      sent
        ? React.createElement(Button, { variant: 'contained', onClick: onNext, startIcon: React.createElement(CheckCircleIcon) }, t('overseas.processRequest.sentContinue'))
        : React.createElement(Button, { variant: 'contained', color: 'primary', onClick: handleSend, disabled: sending, startIcon: React.createElement(SendIcon) },
            sending ? t('overseas.processRequest.sending') : t('overseas.processRequest.sendStockCheck')
          )
    )
  );
}
