import * as React from 'react';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  Box, Chip, CircularProgress
} from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { warehouseApi } from 'src/api';
import { useAuth } from 'src/contexts/auth-context';
import { useTranslation } from 'src/i18n/useTranslation';

function DiscrepanciesContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [discrepancies, setDiscrepancies] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [currentDisc, setCurrentDisc] = React.useState(null);
  const [notes, setNotes] = React.useState('');
  const [alert, setAlert] = React.useState('');

  React.useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const pos = await warehouseApi.getConfirmedPOs();
      const posArray = Array.isArray(pos) ? pos : [];
      const allDiscs = [];
      for (const po of posArray) {
        try {
          const receipt = await warehouseApi.receiveGoods(po.id, user.id);
          const receiptData = Array.isArray(receipt) ? receipt : receipt;
          if (receiptData && receiptData.id) {
            const discs = await warehouseApi.getDiscrepancies(receiptData.id);
            const discsArray = Array.isArray(discs) ? discs : [];
            for (const d of discsArray) {
              allDiscs.push({ ...d, poCode: po.code, siteName: po.siteName });
            }
          }
        } catch (_) {}
      }
      setDiscrepancies(allDiscs);
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const handleResolve = async () => {
    try {
      await warehouseApi.resolveDiscrepancy(currentDisc.id, notes, user.id);
      setAlert(t('warehouse.discrepancies.resolved'));
      setOpen(false);
      setNotes('');
      setDiscrepancies(prev => prev.map(d => d.id === currentDisc.id ? { ...d, status: 'RESOLVED' } : d));
    } catch (err) { setAlert(typeof err === 'string' ? err : (err?.message || t('common.error'))); }
  };

  const getOrdered = (d) => (d.shortage || 0) + (d.excess || 0);
  const getReceived = (d) => {
    const o = getOrdered(d);
    if (d.shortage > 0) return o - d.shortage;
    if (d.excess > 0) return o + d.excess;
    return o;
  };
  const getDiscDisplay = (d) => {
    if (d.shortage > 0) return `-${d.shortage}`;
    if (d.excess > 0) return `+${d.excess}`;
    return '0';
  };
  const getDiscColor = (d) => d.shortage > 0 ? 'error' : d.excess > 0 ? 'warning' : 'default';
  const getStatusColor = (s) => s === 'OPEN' ? 'error' : s === 'RESOLVING' ? 'warning' : s === 'RESOLVED' ? 'success' : 'default';

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
      <CircularProgress />
    </Box>
  );

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{t('warehouse.discrepancies.title')}</Typography>
        <Button variant="outlined" onClick={loadData}>{t('common.refresh')}</Button>
      </Box>

      {alert && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAlert('')}>{alert}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>{t('common.id')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('warehouse.discrepancies.poCode')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('warehouse.discrepancies.site')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('common.name')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('warehouse.discrepancies.expectedQty')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('warehouse.discrepancies.receivedQty')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('warehouse.discrepancies.discrepancy')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('status.label')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {discrepancies.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} align="center" sx={{ py: 4 }}>{t('warehouse.discrepancies.noDiscrepancies')}</TableCell>
              </TableRow>
            ) : discrepancies.map(d => (
              <TableRow key={d.id} hover>
                <TableCell>{d.id}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{d.poCode || '-'}</TableCell>
                <TableCell>{d.siteName || '-'}</TableCell>
                <TableCell>{d.merchandiseName}</TableCell>
                <TableCell>{getOrdered(d)}</TableCell>
                <TableCell>{getReceived(d)}</TableCell>
                <TableCell sx={{ color: getDiscColor(d) === 'error' ? 'error.main' : 'warning.main', fontWeight: 700 }}>
                  {getDiscDisplay(d)}
                </TableCell>
                <TableCell><Chip label={d.status} color={getStatusColor(d.status)} size="small" /></TableCell>
                <TableCell>
                  {d.status !== 'RESOLVED' && (
                    <Button size="small" variant="contained" onClick={() => { setCurrentDisc(d); setOpen(true); }}>
                      {t('warehouse.discrepancies.resolve')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('warehouse.discrepancies.resolveDiscrepancy')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>{t('common.name')}:</strong> {currentDisc?.merchandiseName}<br />
            <strong>{t('warehouse.discrepancies.expectedQty')}:</strong> {currentDisc ? getOrdered(currentDisc) : '-'}<br />
            <strong>{t('warehouse.discrepancies.receivedQty')}:</strong> {currentDisc ? getReceived(currentDisc) : '-'}<br />
            <strong>{t('warehouse.discrepancies.discrepancy')}:</strong>{' '}
            <Typography component="span" sx={{ color: getDiscColor(currentDisc || {}) === 'error' ? 'error.main' : 'warning.main', fontWeight: 700 }}>
              {currentDisc ? getDiscDisplay(currentDisc) : '-'}
            </Typography>
          </Typography>
          <TextField fullWidth label={t('warehouse.discrepancies.resolutionNotes')} multiline rows={3}
            value={notes} onChange={e => setNotes(e.target.value)} margin="dense"
            placeholder={t('warehouse.discrepancies.resolutionNotesPlaceholder') || 'Nhập ghi chú giải quyết...'} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleResolve}>{t('warehouse.discrepancies.confirmResolution')}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default function DiscrepanciesPage() {
  return <ProtectedRoute allowedRoles={['WAREHOUSE']}><DashboardLayout><DiscrepanciesContent /></DashboardLayout></ProtectedRoute>;
}
