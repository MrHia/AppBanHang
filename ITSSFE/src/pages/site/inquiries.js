import * as React from 'react';
import { Container, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Chip, Alert } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { inquiryApi } from 'src/api';
import { useAuth } from 'src/contexts/auth-context';
import { useTranslation } from 'src/i18n/useTranslation';

function InquiriesContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [inquiries, setInquiries] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [items, setItems] = React.useState([]);
  const [currentId, setCurrentId] = React.useState(null);
  const [responses, setResponses] = React.useState({});
  const [alert, setAlert] = React.useState('');

  const userRef = React.useRef(user);
  React.useEffect(() => { userRef.current = user; }, [user]);

  const load = React.useCallback(() => { if (!userRef.current?.siteId) return; inquiryApi.getPendingForSite(userRef.current.siteId).then(r => setInquiries(Array.isArray(r) ? r : [])).catch(console.error); }, []);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => {
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const openRespond = async (id) => {
    setCurrentId(id);
    const res = await inquiryApi.getItems(id);
    const itemsArray = Array.isArray(res) ? res : [];
    setItems(itemsArray);
    const init = {};
    itemsArray.forEach(i => { init[i.id] = i.quantity || 0; });
    setResponses(init);
    setOpen(true);
  };

  const handleRespond = async () => {
    try {
      const itemsData = Object.entries(responses).map(([id, qty]) => ({ id: parseInt(id), quantity: parseInt(qty) }));
      await inquiryApi.respond(currentId, itemsData);
      setAlert(t('site.inquiries.responseSubmitted'));
      setOpen(false);
      load();
    } catch (err) { setAlert(typeof err === 'string' ? err : (err?.message || t('common.error'))); }
  };

  const statusColor = { PENDING: 'warning', PROCESSING: 'info', DONE: 'success', CANCELLED: 'default' };
  const statusLabel = { PENDING: t('status.pending'), PROCESSING: t('status.processing'), DONE: t('status.done'), CANCELLED: t('status.cancelled') };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{t('site.inquiries.title')}</Typography>
      {alert && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAlert('')}>{alert}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>{t('site.inquiries.requestCode')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('common.name')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('status.label')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('common.createdAt')}</TableCell><TableCell sx={{ fontWeight: 600 }}></TableCell></TableRow>
          </TableHead>
          <TableBody>
            {inquiries.map(i => (
              <TableRow key={i.id} hover>
                <TableCell>{i.processRequestCode}</TableCell><TableCell>{i.siteName}</TableCell>
                <TableCell><Chip label={statusLabel[i.status] || i.status} size="small" color={statusColor[i.status] || 'default'} /></TableCell>
                <TableCell>{i.createdAt}</TableCell>
                <TableCell><Button size="small" variant="contained" onClick={() => openRespond(i.id)}>{t('site.inquiries.respond')}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('site.inquiries.stockInquiryResponse')}</DialogTitle>
        <DialogContent>
          {items.map(item => (
            <Box key={item.id} sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 1 }}>
              <Box sx={{ flex: 1 }}><Typography variant="body2">{item.merchandiseCode} - {item.merchandiseName}</Typography></Box>
              <TextField label={t('site.inquiries.stockQuantity')} type="number" size="small" value={responses[item.id] || 0} onChange={e => setResponses({...responses, [item.id]: e.target.value})} sx={{ width: 150 }} />
            </Box>
          ))}
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button variant="contained" onClick={handleRespond}>{t('site.inquiries.submitResponse')}</Button></DialogActions>
      </Dialog>
    </Container>
  );
}

export default function SiteInquiries() {
  return <ProtectedRoute allowedRoles={['SITE']}><DashboardLayout><InquiriesContent /></DashboardLayout></ProtectedRoute>;
}
