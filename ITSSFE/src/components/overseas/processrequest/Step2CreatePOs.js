// ============================================================================
//  Step2CreatePOs — Show site assignments + stock from SiteMerchandise,
//  then launch the PO creation dialog.
//  Replaces the legacy Step4Matrix that depended on the (removed) stock-inquiry
//  response. Stock is now read directly from `site_merchandise.stock_quantity`.
// ============================================================================
import * as React from 'react';
import {
  Box, Button, Chip, Alert, Typography, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { requestApi, siteMerchandiseApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';
import StatusBadge from './StatusBadge';
import POCreateDialog from './POCreateDialog';

export default function Step2CreatePOs({ requestId, items, sites, onBack }) {
  const { t } = useTranslation();
  const [stockMatrix, setStockMatrix] = React.useState({});
  const [assignList, setAssignList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [poDialog, setPoDialog] = React.useState(false);
  const [alert, setAlert] = React.useState('');

  React.useEffect(() => {
    requestApi.getMerchandiseAssignments(requestId)
      .then(asg => {
        const list = Array.isArray(asg) ? asg : [];
        setAssignList(list);
        const siteIds = [...new Set(list.filter(a => a.assignedSiteId).map(a => a.assignedSiteId))];
        return Promise.all(siteIds.map(id =>
          siteMerchandiseApi.getBySite(id).then(rows => ({ id, rows: Array.isArray(rows) ? rows : [] })).catch(() => ({ id, rows: [] }))
        ));
      })
      .then(perSite => {
        const map = {};
        perSite.forEach(({ id, rows }) => {
          map[id] = {};
          rows.forEach(r => {
            if (r.merchandiseId != null) {
              map[id][r.merchandiseId] = { quantity: r.stockQuantity || 0, source: 'reference' };
            }
          });
        });
        setStockMatrix(map);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [requestId]);

  if (loading) return React.createElement(LinearProgress);

  const pickedAssignments = assignList.filter(a => a.assignedSiteId && a.status === 'PICKED');
  const involvedSiteIds = [...new Set(pickedAssignments.map(a => a.assignedSiteId))];
  const involvedSites = involvedSiteIds.map(id => sites.find(s => s.id == id)).filter(Boolean);
  const canCreate = pickedAssignments.length > 0;

  return React.createElement(Box, null,
    React.createElement(Alert, { severity: 'info', sx: { mb: 3 } }, t('overseas.processRequest.step2CreateAlert')),
    alert && React.createElement(Alert, { severity: 'success', sx: { mb: 2 }, onClose: () => setAlert('') }, alert),
    !canCreate && React.createElement(Alert, { severity: 'warning', sx: { mb: 2 }, children: t('overseas.processRequest.noPickedAssignments') }),
    React.createElement(TableContainer, { component: Paper, variant: 'outlined', sx: { mb: 3 } },
      React.createElement(Table, { size: 'small' },
        React.createElement(TableHead, { sx: { bgcolor: '#F9FAFB' } },
          React.createElement(TableRow, null,
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 120 }, children: t('overseas.processRequest.merchandiseCode') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 80 }, align: 'center', children: t('overseas.processRequest.requested') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 120 }, children: t('overseas.processRequest.siteAssigned') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 100 }, align: 'center', children: t('overseas.processRequest.refStockHeader') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 100 }, align: 'center', children: t('overseas.processRequest.status') })
          )
        ),
        React.createElement(TableBody, null,
          items.map(item => {
            const asg = assignList.find(a => a.merchandiseId === item.merchandiseId);
            const assignedSiteId = asg?.assignedSiteId;
            const assignedSite = assignedSiteId ? sites.find(s => s.id == assignedSiteId) : null;
            const siteStock = assignedSiteId && stockMatrix[assignedSiteId]?.[item.merchandiseId];
            const qty = siteStock?.quantity ?? 0;
            const status = asg?.status || 'PENDING';
            const canFulfill = status === 'PICKED' && qty >= item.quantity;
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
                      color: canFulfill ? 'success.main' : qty > 0 ? 'warning.main' : 'error.main',
                      children: qty + ' ' + item.unit
                    })
                  : React.createElement(Typography, { variant: 'caption', color: 'text.disabled', children: '-' })
              ),
              React.createElement(TableCell, { align: 'center' }, React.createElement(StatusBadge, { status: status }))
            );
          })
        )
      )
    ),
    React.createElement(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 } },
      React.createElement(Typography, { variant: 'subtitle1', fontWeight: 700, children: t('overseas.processRequest.createPO') + ' - ' + involvedSites.length + ' Site' }),
      React.createElement(Button, { variant: 'contained', color: 'primary', startIcon: React.createElement(ShoppingCartIcon), onClick: () => setPoDialog(true), disabled: !canCreate, children: t('overseas.processRequest.createPO') })
    ),
    React.createElement(POCreateDialog, {
      open: poDialog, requestId, items, assignments: assignList, sites, matrix: stockMatrix,
      onClose: () => setPoDialog(false),
      onCreated: (pos) => { setAlert(t('overseas.processRequest.createdSuccessfully') + ' ' + pos.length + ' ' + t('overseas.processRequest.purchaseOrdersCreated')); setPoDialog(false); }
    }),
    React.createElement(Box, { sx: { mt: 3 } }, React.createElement(Button, { onClick: onBack, children: t('overseas.processRequest.back') }))
  );
}
