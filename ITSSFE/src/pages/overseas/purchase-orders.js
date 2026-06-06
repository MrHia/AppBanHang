import * as React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { poApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';

function POsContent() {
  const { t } = useTranslation();
  const [pos, setPOs] = React.useState([]);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelId, setCancelId] = React.useState(null);
  const [cancelReason, setCancelReason] = React.useState('');
  const [alert, setAlert] = React.useState('');

  const load = React.useCallback(() => {
    poApi.getAll().then(r => setPOs(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))).catch(console.error);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  const openCancel = (id) => { setCancelId(id); setCancelReason(''); setCancelOpen(true); };
  const handleCancel = async () => {
    try {
      await poApi.reject(cancelId, cancelReason);
      setAlert(t('site.purchaseOrders.orderRejected'));
      setCancelOpen(false);
      load();
    } catch (err) {
      setAlert(typeof err === 'string' ? err : (err?.message || t('common.error')));
    }
  };

  const statusColor = { DRAFT: 'default', SENT: 'warning', CONFIRMED: 'success', REJECTED: 'error', DONE: 'primary' };
  const statusLabel = { DRAFT: t('status.draft'), SENT: t('status.sent'), CONFIRMED: t('status.confirmed'), REJECTED: t('overseas.purchaseOrders.cancelled'), DONE: t('status.done') };
  const isCancellable = (status) => status !== 'REJECTED' && status !== 'DONE';

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{t('overseas.purchaseOrders.title')}</Typography>
      {alert && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setAlert('')}>{alert}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>{t('overseas.purchaseOrders.poCode')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('overseas.purchaseOrders.site')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('overseas.purchaseOrders.deliveryMethod')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('overseas.purchaseOrders.expectedDelivery')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('status.label')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pos.map(p => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{p.code}</TableCell>
                <TableCell>{p.siteName} ({p.siteCode})</TableCell>
                <TableCell>{p.deliveryMethod}</TableCell>
                <TableCell>{p.expectedDelivery}</TableCell>
                <TableCell><Chip label={statusLabel[p.status] || p.status} size="small" color={statusColor[p.status] || 'default'} /></TableCell>
                <TableCell>
                  {isCancellable(p.status) && (
                    <Button size="small" color="error" variant="outlined" onClick={() => openCancel(p.id)}>
                      {t('overseas.purchaseOrders.cancelPO')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('overseas.purchaseOrders.cancelPO')}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>{t('overseas.purchaseOrders.cancelCascadeWarning')}</Alert>
          <TextField fullWidth required label={t('overseas.purchaseOrders.cancelReason')} multiline rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" color="error" onClick={handleCancel} disabled={!cancelReason.trim()}>{t('overseas.purchaseOrders.cancelPO')}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default function OverseaPOs() {
  return <ProtectedRoute allowedRoles={['OVERSEAS']}><DashboardLayout><POsContent /></DashboardLayout></ProtectedRoute>;
}
