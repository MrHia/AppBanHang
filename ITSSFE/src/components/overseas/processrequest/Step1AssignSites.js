// ============================================================================
//  Step1AssignSites — Pick a site per merchandise (or mark rejected with reason)
//  and save the merchandise assignments.
// ============================================================================
import * as React from 'react';
import {
  Box, Button, Chip, Alert, Typography, TextField,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import { requestApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';
import StatusBadge from './StatusBadge';

export default function Step1AssignSites({ requestId, items, assignments, sites, hasSentInquiries, onBack, onNext }) {
  const { t } = useTranslation();
  const [assignMap, setAssignMap] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [alert, setAlert] = React.useState('');

  React.useEffect(() => {
    if (!assignments || !assignments.length) return;
    const init = {};
    assignments.forEach(a => {
      init[a.merchandiseId] = { siteId: a.assignedSiteId || null, rejectReason: a.rejectReason || '' };
    });
    setAssignMap(init);
  }, [assignments]);

  React.useEffect(() => {
    if (!items || !items.length) return;
    if (Object.keys(assignMap).length > 0) return;
    const init = {};
    items.forEach(item => { init[item.merchandiseId] = { siteId: null, rejectReason: '' }; });
    setAssignMap(init);
  }, [items]);

  const handleSiteTick = (merchId, siteId) => {
    setAssignMap(prev => {
      const curr = prev[merchId] || {};
      if (curr.siteId === siteId) return { ...prev, [merchId]: { siteId: null, rejectReason: '' } };
      return { ...prev, [merchId]: { siteId, rejectReason: '' } };
    });
  };

  const handleReject = (merchId, reason) => {
    setAssignMap(prev => ({ ...prev, [merchId]: { siteId: null, rejectReason: reason } }));
  };

  const handleNext = async () => {
    const unfilled = items.filter(item => {
      const asg = assignMap[item.merchandiseId];
      if (!asg) return true;
      if (asg.siteId === null && !asg.rejectReason?.trim()) return true;
      return false;
    });
    if (unfilled.length > 0) {
      setAlert(t('overseas.processRequest.unfilledItems') + ' ' + unfilled.map(i => i.merchandiseCode).join(', '));
      return;
    }
    setSaving(true);
    try {
      const payload = items.map(item => {
        const asg = assignMap[item.merchandiseId];
        return {
          merchandiseId: item.merchandiseId,
          siteId: asg?.siteId || null,
          rejectReason: asg?.siteId === null ? (asg?.rejectReason || null) : null,
        };
      });
      await requestApi.saveMerchandiseAssignments(requestId, payload);
      onNext(assignMap);
    } catch (err) {
      const msg = err?.data?.message || err?.message || t('common.error');
      setAlert(msg);
    } finally { setSaving(false); }
  };

  return React.createElement(Box, null,
    React.createElement(Alert, { severity: 'info', sx: { mb: 3 } }, t('overseas.processRequest.step1Alert')),
    alert && React.createElement(Alert, { severity: 'error', sx: { mb: 2 }, onClose: () => setAlert('') }, alert),
    React.createElement(TableContainer, { component: Paper, variant: 'outlined', sx: { mb: 3 } },
      React.createElement(Table, { size: 'small' },
        React.createElement(TableHead, { sx: { bgcolor: '#F9FAFB' } },
          React.createElement(TableRow, null,
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 120 }, children: t('overseas.processRequest.merchandiseCode') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 200 }, children: t('overseas.processRequest.merchandiseName') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 80 }, align: 'center', children: t('overseas.processRequest.requested') }),
            ...sites.map(s => React.createElement(TableCell, { key: s.id, align: 'center', sx: { fontWeight: 700, minWidth: 110 } },
              React.createElement(Box, null,
                React.createElement(Typography, { variant: 'caption', sx: { fontWeight: 700, display: 'block' }, children: s.code }),
                React.createElement(Typography, { variant: 'caption', color: 'text.secondary', children: s.name })
              )
            )),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 100 }, align: 'center', children: t('overseas.processRequest.status') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 160 }, children: t('overseas.processRequest.rejectReason') })
          )
        ),
        React.createElement(TableBody, null,
          items.map(item => {
            const asg = assignMap[item.merchandiseId] || {};
            const selectedSiteId = asg.siteId;
            const rejectReason = asg.rejectReason || '';
            const isRejected = selectedSiteId === null && rejectReason !== '';
            const rowBg = isRejected ? '#FEF2F2' : selectedSiteId ? '#F0FDF4' : '#FFFFFF';
            return React.createElement(TableRow, { key: item.merchandiseId, hover: true, sx: { bgcolor: rowBg } },
              React.createElement(TableCell, null,
                React.createElement(Typography, { variant: 'body2', fontWeight: 700, sx: { fontFamily: 'monospace' }, children: item.merchandiseCode })
              ),
              React.createElement(TableCell, null,
                React.createElement(Typography, { variant: 'body2', color: 'text.secondary', children: item.merchandiseName })
              ),
              React.createElement(TableCell, { align: 'center' },
                React.createElement(Chip, { size: 'small', label: item.quantity + ' ' + item.unit, variant: 'outlined', sx: { height: 20, fontSize: '0.7rem' } })
              ),
              ...sites.map(site => {
                const isSelected = selectedSiteId === site.id;
                return React.createElement(TableCell, { key: site.id, align: 'center', sx: { p: 0.5 } },
                  React.createElement(Button, {
                    size: 'small',
                    onClick: () => handleSiteTick(item.merchandiseId, site.id),
                    sx: { minWidth: 0, width: 28, height: 28, p: 0, color: isSelected ? 'success.main' : 'text.disabled', fontWeight: 700, fontSize: '1.1rem' },
                    children: isSelected ? '✓' : '○'
                  })
                );
              }),
              React.createElement(TableCell, { align: 'center' },
                React.createElement(StatusBadge, { status: selectedSiteId ? 'PICKED' : (rejectReason ? 'REJECTED' : 'PENDING') })
              ),
              React.createElement(TableCell, null,
                !selectedSiteId && React.createElement(TextField, {
                  size: 'small',
                  placeholder: t('overseas.processRequest.rejectReasonPlaceholder'),
                  value: rejectReason,
                  onChange: e => handleReject(item.merchandiseId, e.target.value),
                  fullWidth: true,
                  error: !selectedSiteId && !rejectReason.trim(),
                  helperText: !selectedSiteId && !rejectReason.trim() ? t('overseas.processRequest.required') : ''
                })
              )
            );
          })
        )
      )
    ),
    React.createElement(Box, { sx: { display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 } },
      React.createElement(Chip, { label: t('overseas.processRequest.assigned') + ': ' + items.filter(i => assignMap[i.merchandiseId]?.siteId).length, color: 'success', variant: 'outlined' }),
      React.createElement(Chip, { label: t('overseas.processRequest.rejected') + ': ' + items.filter(i => !assignMap[i.merchandiseId]?.siteId && assignMap[i.merchandiseId]?.rejectReason).length, color: 'error', variant: 'outlined' }),
      React.createElement(Chip, { label: t('overseas.processRequest.pending') + ': ' + items.filter(i => !assignMap[i.merchandiseId]?.siteId && !assignMap[i.merchandiseId]?.rejectReason).length, color: 'default', variant: 'outlined' })
    ),
    React.createElement(Box, { sx: { mt: 3, display: 'flex', justifyContent: 'space-between' } },
      React.createElement(Button, { onClick: onBack, disabled: hasSentInquiries, children: t('overseas.processRequest.back') }),
      React.createElement(Button, { variant: 'contained', onClick: handleNext, disabled: saving, startIcon: React.createElement(FactCheckIcon) },
        saving ? t('overseas.processRequest.saving') : t('overseas.processRequest.saveAndContinue')
      )
    )
  );
}
