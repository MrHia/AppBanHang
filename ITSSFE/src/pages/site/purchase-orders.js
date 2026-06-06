import * as React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { poApi } from 'src/api';
import { useAuth } from 'src/contexts/auth-context';
import { useTranslation } from 'src/i18n/useTranslation';

function SitePOsContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pos, setPOs] = React.useState([]);
  const [rejectOpen, setRejectOpen] = React.useState(false);
  const [rejectId, setRejectId] = React.useState(null);
  const [reason, setReason] = React.useState('');
  const [alert, setAlert] = React.useState('');

  const userRef = React.useRef(user);
  React.useEffect(() => { userRef.current = user; }, [user]);

  const loadPOs = React.useCallback(() => { if (!userRef.current?.siteId) return; poApi.getBySite(userRef.current.siteId).then(r => setPOs(Array.isArray(r) ? r : [])).catch(console.error); }, []);
  React.useEffect(() => { loadPOs(); }, [loadPOs]);
  React.useEffect(() => {
    const interval = setInterval(loadPOs, 15000);
    return () => clearInterval(interval);
  }, [loadPOs]);

  const handleConfirm = async (id) => {
    try { await poApi.confirm(id); setAlert(t('site.purchaseOrders.orderConfirmed')); setPOs(pos.map(p => p.id === id ? {...p, status: 'CONFIRMED'} : p)); }
    catch (err) { setAlert(typeof err === 'string' ? err : (err?.message || t('common.error'))); }
  };

  const handleReject = async () => {
    try { await poApi.reject(rejectId, reason); setAlert(t('site.purchaseOrders.orderRejected')); setRejectOpen(false); setPOs(pos.map(p => p.id === rejectId ? {...p, status: 'REJECTED'} : p)); }
    catch (err) { setAlert(typeof err === 'string' ? err : (err?.message || t('common.error'))); }
  };

  const statusColor = { DRAFT: 'default', SENT: 'warning', CONFIRMED: 'success', REJECTED: 'error', DONE: 'primary' };
  const statusLabel = { DRAFT: t('status.draft'), SENT: t('status.sent'), CONFIRMED: t('status.confirmed'), REJECTED: t('status.rejected'), DONE: t('status.done') };
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{t('site.purchaseOrders.title')}</Typography>
      {alert && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setAlert('')}>{alert}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>{t('common.code')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('overseas.purchaseOrders.deliveryMethod')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('site.purchaseOrders.deliveryDate')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('status.label')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {pos.map(p => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{p.code}</TableCell><TableCell>{p.deliveryMethod}</TableCell><TableCell>{p.status === 'SENT' ? (p.expectedDelivery || '—') : '—'}</TableCell>
                <TableCell><Chip label={statusLabel[p.status] || p.status} size="small" color={statusColor[p.status] || 'default'} /></TableCell>
                <TableCell>{p.status === 'SENT' && <><Button size="small" color="success" onClick={() => handleConfirm(p.id)}>{t('site.purchaseOrders.confirm')}</Button><Button size="small" color="error" onClick={() => { setRejectId(p.id); setRejectOpen(true); }}>{t('site.purchaseOrders.reject')}</Button></>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('site.purchaseOrders.rejectPurchaseOrder')}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>{t('site.purchaseOrders.rejectCascadeWarning')}</Alert>
          <TextField fullWidth required label={t('site.purchaseOrders.rejectReason')} multiline rows={3} value={reason} onChange={e => setReason(e.target.value)} margin="dense" />
        </DialogContent>
        <DialogActions><Button onClick={() => setRejectOpen(false)}>{t('common.cancel')}</Button><Button variant="contained" color="error" onClick={handleReject} disabled={!reason.trim()}>{t('common.submit')}</Button></DialogActions>
      </Dialog>
    </Container>
  );
}

export default function SitePOs() {
  return <ProtectedRoute allowedRoles={['SITE']}><DashboardLayout><SitePOsContent /></DashboardLayout></ProtectedRoute>;
}
