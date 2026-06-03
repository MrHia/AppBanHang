// ============================================================================
//  Step4Matrix — Aggregate stock responses into a matrix and launch the
//  PO creation dialog.
// ============================================================================
import * as React from 'react';
import {
  Box, Button, Chip, Alert, Typography, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { requestApi, inquiryApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';
import StatusBadge from './StatusBadge';
import POCreateDialog from './POCreateDialog';

export default function Step4Matrix({ requestId, items, assignments, sites, hasSentInquiries, onBack }) {
  const { t } = useTranslation();
  const [matrix, setMatrix] = React.useState({});
  const [assignList, setAssignList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [poDialog, setPoDialog] = React.useState(false);
  const [alert, setAlert] = React.useState('');
  const [hasResponse, setHasResponse] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      inquiryApi.getMatrix(requestId).catch(() => ({})),
      requestApi.getMerchandiseAssignments(requestId).catch(() => []),
    ]).then(([m, asg]) => {
      setMatrix((typeof m === 'object' && !Array.isArray(m)) ? m : {});
      setAssignList(Array.isArray(asg) ? asg : []);
      const anyResp = Array.isArray(asg) && asg.some(a => a.status === 'RESPONDED' || a.status === 'TIMEOUT');
      setHasResponse(anyResp);
    }).catch(err => console.error(err))
    .finally(() => setLoading(false));
  }, [requestId]);

  if (loading) return React.createElement(LinearProgress);

  const pickedAssignments = assignList.filter(a => a.assignedSiteId && (a.status === 'INQUIRY_SENT' || a.status === 'RESPONDED' || a.status === 'TIMEOUT'));
  const involvedSiteIds = [...new Set(pickedAssignments.map(a => a.assignedSiteId))];
  const involvedSites = involvedSiteIds.map(id => sites.find(s => s.id == id)).filter(Boolean);

  return React.createElement(Box, null,
    React.createElement(Alert, { severity: 'info', sx: { mb: 3 } }, t('overseas.processRequest.step4Alert1')),
    alert && React.createElement(Alert, { severity: 'success', sx: { mb: 2 }, onClose: () => setAlert('') }, alert),
    !hasResponse && React.createElement(Alert, { severity: 'warning', sx: { mb: 2 }, children: t('overseas.processRequest.noSiteResponse') }),
    React.createElement(TableContainer, { component: Paper, variant: 'outlined', sx: { mb: 3 } },
      React.createElement(Table, { size: 'small' },
        React.createElement(TableHead, { sx: { bgcolor: '#F9FAFB' } },
          React.createElement(TableRow, null,
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 120 }, children: t('overseas.processRequest.merchandiseCode') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 80 }, align: 'center', children: t('overseas.processRequest.requested') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 120 }, children: t('overseas.processRequest.siteAssigned') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 100 }, align: 'center', children: t('overseas.processRequest.stockResponse') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 100 }, align: 'center', children: t('overseas.processRequest.status') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 100 }, align: 'center', children: t('overseas.processRequest.orderNow') })
          )
        ),
        React.createElement(TableBody, null,
          items.map(item => {
            const asg = assignList.find(a => a.merchandiseId === item.merchandiseId);
            const assignedSiteId = asg?.assignedSiteId;
            const assignedSite = assignedSiteId ? sites.find(s => s.id == assignedSiteId) : null;
            const siteStock = assignedSiteId && matrix[assignedSiteId]?.[item.merchandiseId];
            const qty = siteStock?.quantity ?? 0;
            const source = siteStock?.source || 'none';
            const status = asg?.status || 'PENDING';
            const canFulfill = status === 'RESPONDED' && qty >= item.quantity;
            const rowBg = canFulfill ? '#F0FDF4' : qty > 0 ? '#FFFBEB' : '#FEF2F2';
            return React.createElement(TableRow, { key: item.merchandiseId, hover: true, sx: { bgcolor: rowBg } },
              React.createElement(TableCell, null,
                React.createElement(Typography, { variant: 'body2', fontWeight: 700, sx: { fontFamily: 'monospace' }, children: item.merchandiseCode }),
                React.createElement(Typography, { variant: 'caption', color: 'text.secondary', children: item.merchandiseName })
              ),
              React.createElement(TableCell, { align: 'center' },
                React.createElement(Chip, { size: 'small', label: item.quantity + ' ' + item.unit, variant: 'outlined', sx: { height: 20, fontSize: '0.7rem' } })
              ),
              React.createElement(TableCell, null,
                assignedSite
                  ? React.createElement(Box, null,
                      React.createElement(Typography, { variant: 'body2', fontWeight: 600, children: assignedSite.code }),
                      React.createElement(Typography, { variant: 'caption', color: 'text.secondary', children: assignedSite.name })
                    )
                  : React.createElement(Typography, { variant: 'caption', color: 'text.disabled', children: '-' })
              ),
              React.createElement(TableCell, { align: 'center' },
                assignedSiteId
                  ? React.createElement(Typography, {
                      variant: 'body2', fontWeight: 800,
                      color: source === 'inquiry' ? 'success.main' : source === 'reference' ? 'warning.main' : source === 'reference_timeout' ? 'error.main' : 'text.disabled',
                      children: source === 'none' ? '-' : qty + (source === 'reference' ? ' ' + t('overseas.processRequest.refStock') : source === 'reference_timeout' ? ' ' + t('overseas.processRequest.refTimeoutStock') : '')
                    })
                  : React.createElement(Typography, { variant: 'caption', color: 'text.disabled', children: '-' })
              ),
              React.createElement(TableCell, { align: 'center' }, React.createElement(StatusBadge, { status: status })),
              React.createElement(TableCell, { align: 'center' },
                (status === 'RESPONDED' || status === 'TIMEOUT')
                  ? React.createElement(Chip, { size: 'small', label: t('overseas.processRequest.orderNow') + ' ' + Math.min(item.quantity, qty) + ' ' + item.unit, color: 'primary', sx: { height: 22, fontSize: '0.7rem' } })
                  : React.createElement(Typography, { variant: 'caption', color: 'text.disabled', children: t('overseas.processRequest.awaitingResponse') })
              )
            );
          })
        )
      )
    ),
    React.createElement(Box, { sx: { display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 } },
      React.createElement(Chip, { label: t('overseas.processRequest.actualStock'), size: 'small', sx: { bgcolor: '#FFFFFF', border: '1px solid #E5E7EB' } }),
      React.createElement(Chip, { label: t('overseas.processRequest.refStock'), size: 'small', sx: { bgcolor: '#FEF9C3', color: '#854D0E' } }),
      React.createElement(Chip, { label: t('overseas.processRequest.refTimeoutStock'), size: 'small', sx: { bgcolor: '#FEF3C7', color: '#92400E' } })
    ),
    React.createElement(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 } },
      React.createElement(Typography, { variant: 'subtitle1', fontWeight: 700, children: t('overseas.processRequest.createPO') + ' - ' + involvedSites.length + ' Site' }),
      React.createElement(Button, { variant: 'contained', color: 'primary', startIcon: React.createElement(ShoppingCartIcon), onClick: () => setPoDialog(true), disabled: !hasResponse, children: t('overseas.processRequest.createPO') })
    ),
    React.createElement(POCreateDialog, {
      open: poDialog, requestId, items, assignments, sites, matrix,
      onClose: () => setPoDialog(false),
      onCreated: (pos) => { setAlert(t('overseas.processRequest.createdSuccessfully') + ' ' + pos.length + ' ' + t('overseas.processRequest.purchaseOrdersCreated')); setPoDialog(false); }
    }),
    React.createElement(Box, { sx: { mt: 3 } }, React.createElement(Button, { onClick: onBack, disabled: hasSentInquiries, children: t('overseas.processRequest.back') }))
  );
}
