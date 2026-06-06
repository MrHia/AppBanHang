// ============================================================================
//  POCreateDialog — 2-step dialog: pick per-site quantities, then confirm
//  delivery info and dispatch the PO batch.
// ============================================================================
import * as React from 'react';
import {
  Box, Card, CardContent, Button, Chip, Alert, Typography, TextField,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  FormControl, InputLabel, Select, MenuItem,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SendIcon from '@mui/icons-material/Send';
import { requestApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';

export default function POCreateDialog({ open, requestId, items, assignments, sites, matrix, onClose, onCreated }) {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);
  const [alert, setAlert] = React.useState('');
  const [step, setStep] = React.useState(0);
  const [delivery, setDelivery] = React.useState({});
  const [poItems, setPoItems] = React.useState({});
  const [preview, setPreview] = React.useState([]);

  React.useEffect(() => {
    if (!open) { setDelivery({}); setPoItems({}); setPreview([]); setStep(0); setAlert(''); return; }
    const init = {};
    assignments.forEach(a => {
      if (!a.assignedSiteId) return;
      if (a.status !== 'PICKED') return;
      const siteId = a.assignedSiteId;
      if (!init[siteId]) init[siteId] = {};
      const stockInfo = matrix[siteId]?.[a.merchandiseId];
      const max = stockInfo?.quantity ?? 0;
      const requested = a.requestedQty;
      init[siteId][a.merchandiseId] = Math.min(requested, Math.max(0, max));
    });
    setPoItems(init);
  }, [open, assignments, matrix]);

  const activeSites = sites.filter(s => Object.values(poItems[s.id] || {}).some(qty => qty > 0));

  const handleQtyChange = (siteId, merchId, value) => {
    const max = matrix[siteId]?.[merchId]?.quantity || 0;
    const val = Math.max(0, Math.min(max, parseInt(value) || 0));
    setPoItems(prev => ({ ...prev, [siteId]: { ...(prev[siteId] || {}), [merchId]: val } }));
  };

  const handleDeliveryChange = (siteId, field, value) => {
    setDelivery(prev => ({ ...prev, [siteId]: { ...(prev[siteId] || {}), [field]: value } }));
  };

  const handlePreview = () => {
    const prev = activeSites.map(site => ({
      siteId: site.id, siteCode: site.code, siteName: site.name,
      deliveryMethod: delivery[site.id]?.method || 'SHIP',
      expectedDelivery: delivery[site.id]?.date || '',
      items: Object.entries(poItems[site.id] || {})
        .filter(([, qty]) => qty > 0)
        .map(([merchId, qty]) => {
          const asg = assignments.find(a => a.merchandiseId == merchId);
          const item = items.find(i => i.merchandiseId == merchId);
          return { merchandiseId: parseInt(merchId), merchandiseCode: item?.merchandiseCode || '', merchandiseName: item?.merchandiseName || '', unit: item?.unit || 'piece', orderQty: qty };
        }),
    }));
    setPreview(prev);
    setStep(1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const orders = preview.map(p => ({
        siteId: p.siteId, deliveryMethod: p.deliveryMethod,
        expectedDelivery: p.expectedDelivery || null,
        items: p.items.map(i => ({ merchandiseId: i.merchandiseId, quantity: i.orderQty, unit: i.unit })),
      }));
      const result = await requestApi.createPOBatch(requestId, { orders });
      const pos = Array.isArray(result) ? result : [];
      onCreated(pos);
    } catch (err) {
      setAlert(err?.data?.message || err?.message || t('common.error'));
      setLoading(false);
    }
  };

  if (!open) return null;

  return React.createElement(Dialog, { open, onClose: onClose, maxWidth: 'lg', fullWidth: true, PaperProps: { sx: { borderRadius: 2 } } },
    React.createElement(DialogTitle, { sx: { pb: 1, display: 'flex', alignItems: 'center', gap: 1 } },
      React.createElement(ShoppingCartIcon, { color: 'primary' }),
      ' ' + t('overseas.processRequest.createPO'),
      React.createElement(Box, { sx: { flex: 1 } }),
      React.createElement(Chip, { size: 'small', label: t('overseas.processRequest.step') + ' ' + (step + 1) + '/2', variant: 'outlined' })
    ),
    React.createElement(DialogContent, { dividers: true },
      alert && React.createElement(Alert, { severity: 'error', sx: { mb: 2 }, onClose: () => setAlert('') }, alert),
      step === 0 && React.createElement(Box, null,
        React.createElement(Alert, { severity: 'info', sx: { mb: 2 } },
          t('overseas.processRequest.step4Alert1')
        ),
        activeSites.map(site => {
          const siteAssignments = assignments.filter(a => a.assignedSiteId == site.id && (poItems[site.id]?.[a.merchandiseId] ?? 0) > 0);
          if (siteAssignments.length === 0) return null;
          return React.createElement(Card, { key: site.id, variant: 'outlined', sx: { mb: 2, border: '1px solid #E5E7EB' } },
            React.createElement(Box, { sx: { px: 2, py: 1, bgcolor: '#F0FDF4', borderBottom: '1px solid #E5E7EB' } },
              React.createElement(Typography, { variant: 'subtitle2', fontWeight: 700, color: 'success.main', children: site.name + ' (' + site.code + ') - ' + site.country })
            ),
            React.createElement(CardContent, { sx: { pt: 1 } },
              siteAssignments.map(a => {
                const stockInfo = matrix[site.id]?.[a.merchandiseId];
                const max = stockInfo?.quantity || 0;
                const source = stockInfo?.source || 'none';
                const current = poItems[site.id]?.[a.merchandiseId] || 0;
                return React.createElement(Box, { key: a.merchandiseId, sx: { display: 'flex', alignItems: 'center', gap: 2, mb: 1 } },
                  React.createElement(Box, { sx: { flex: 1 } },
                    React.createElement(Typography, { variant: 'body2', fontWeight: 600, children: a.merchandiseCode }),
                    React.createElement(Typography, { variant: 'caption', color: 'text.secondary', children: 'YC: ' + a.requestedQty + ' | ' + t('overseas.processRequest.stock') + ' ' + max + ' ' + a.unit + (source === 'reference' ? ' ' + t('overseas.processRequest.refStock') : '') })
                  ),
                  React.createElement(TextField, {
                    type: 'number', size: 'small', label: t('overseas.processRequest.enterOrderQty'), value: current,
                    onChange: e => handleQtyChange(site.id, a.merchandiseId, e.target.value),
                    inputProps: { min: 0, max }, sx: { width: 100 }
                  }),
                  current > 0 && React.createElement(Typography, { variant: 'caption', color: 'success.main', sx: { minWidth: 50 }, children: current + '/' + max })
                );
              })
            )
          );
        })
      ),
      step === 1 && React.createElement(Box, null,
        React.createElement(Alert, { severity: 'info', sx: { mb: 2 } }, t('overseas.processRequest.checkPOInfo')),
        preview.map(p =>
          React.createElement(Card, { key: p.siteId, variant: 'outlined', sx: { mb: 2, border: '2px solid #059669' } },
            React.createElement(Box, { sx: { px: 2, py: 1, bgcolor: '#ECFDF5', borderBottom: '1px solid #059669' } },
              React.createElement(Typography, { variant: 'subtitle2', fontWeight: 700, color: 'success.main', children: 'PO cho ' + p.siteName + ' (' + p.siteCode + ') - ' + p.items.length + ' ' + t('overseas.processRequest.matHang') })
            ),
            React.createElement(CardContent, null,
              React.createElement(Box, { sx: { display: 'flex', gap: 2, mb: 2 } },
                React.createElement(FormControl, { size: 'small', sx: { minWidth: 200 } },
                  React.createElement(InputLabel, null, t('overseas.processRequest.transportMethod')),
                  React.createElement(Select, {
                    label: t('overseas.processRequest.transportMethod'), value: p.deliveryMethod,
                    onChange: e => handleDeliveryChange(p.siteId, 'method', e.target.value),
                    children: [
                      React.createElement(MenuItem, { key: 'SHIP', value: 'SHIP', children: t('overseas.processRequest.seaRoute') }),
                      React.createElement(MenuItem, { key: 'AIR', value: 'AIR', children: t('overseas.processRequest.airRoute') }),
                      React.createElement(MenuItem, { key: 'LAND', value: 'LAND', children: t('overseas.processRequest.landRoute') }),
                    ]
                  })
                ),
                React.createElement(TextField, {
                  size: 'small', label: t('overseas.processRequest.expectedDeliveryDate'), type: 'date',
                  InputLabelProps: { shrink: true }, value: p.expectedDelivery,
                  onChange: e => handleDeliveryChange(p.siteId, 'date', e.target.value), sx: { width: 200 }
                })
              ),
              React.createElement(TableContainer, null,
                React.createElement(Table, { size: 'small' },
                  React.createElement(TableHead, null,
                    React.createElement(TableRow, null,
                      React.createElement(TableCell, { sx: { fontWeight: 600 }, children: t('overseas.processRequest.merchandiseCode') }),
                      React.createElement(TableCell, { sx: { fontWeight: 600 }, align: 'center', children: t('overseas.processRequest.quantity') }),
                      React.createElement(TableCell, { sx: { fontWeight: 600 }, align: 'center', children: 'Unit' })
                    )
                  ),
                  React.createElement(TableBody, null,
                    p.items.map(i =>
                      React.createElement(TableRow, { key: i.merchandiseId },
                        React.createElement(TableCell, null, i.merchandiseCode + ' - ' + i.merchandiseName),
                        React.createElement(TableCell, { align: 'center' }, React.createElement(Chip, { size: 'small', label: i.orderQty, color: 'primary' })),
                        React.createElement(TableCell, { align: 'center' }, i.unit)
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    ),
    React.createElement(DialogActions, { sx: { px: 3, py: 2, display: 'flex', justifyContent: 'space-between' } },
      React.createElement(Box, null, step > 0 && React.createElement(Button, { onClick: () => setStep(s => s - 1), children: t('overseas.processRequest.back') })),
      React.createElement(Box, { sx: { display: 'flex', gap: 1 } },
        React.createElement(Button, { onClick: onClose, size: 'small', children: t('overseas.processRequest.cancel') }),
        step === 0 && React.createElement(Button, { variant: 'contained', onClick: handlePreview, disabled: activeSites.length === 0, children: t('overseas.processRequest.preview') }),
        step === 1 && React.createElement(Button, { variant: 'contained', color: 'success', onClick: handleSubmit, disabled: loading, startIcon: React.createElement(SendIcon) },
          loading ? t('overseas.processRequest.sendingPO') : t('overseas.processRequest.sendPO') + ' ' + preview.length + ' PO'
        )
      )
    )
  );
}
