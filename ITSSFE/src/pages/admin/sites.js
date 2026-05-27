import * as React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Chip } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { siteApi } from 'src/api';
import Alert from '@mui/material/Alert';
import { useTranslation } from 'src/i18n/useTranslation';

function SitesContent() {
  const { t } = useTranslation();
  const [sites, setSites] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ code: '', name: '', country: '', email: '', phone: '', address: '' });
  const [alert, setAlert] = React.useState('');

  const load = React.useCallback(() => siteApi.getAll().then(r => setSites(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))).catch(console.error), []);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { const interval = setInterval(load, 15000); return () => clearInterval(interval); }, [load]);

  const handleSave = async () => {
    try {
      await siteApi.create(form);
      setAlert(t('admin.sites.siteCreated'));
      setOpen(false);
      load();
    } catch (err) { setAlert(typeof err === 'string' ? err : (err?.message || t('common.error'))); }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{t('admin.sites.title')}</Typography>
        <Button variant="contained" onClick={() => { setForm({ code: '', name: '', country: '', email: '', phone: '', address: '' }); setOpen(true); }}>{t('admin.sites.addSite')}</Button>
      </Box>
      {alert && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setAlert('')}>{alert}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>{t('common.code')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('common.name')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('admin.sites.country')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('common.email')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('status.label')}</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {sites.map(s => (
              <TableRow key={s.id} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{s.code}</TableCell>
                <TableCell>{s.name}</TableCell>
                <TableCell>{s.country}</TableCell>
                <TableCell>{s.email}</TableCell>
                <TableCell><Chip label={s.isActive ? t('status.active') : t('status.inactive')} size="small" color={s.isActive ? 'success' : 'default'} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('admin.sites.addNewSite')}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label={t('admin.sites.siteName')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} margin="dense" />
          <TextField fullWidth label={t('admin.sites.country')} value={form.country} onChange={e => setForm({...form, country: e.target.value})} margin="dense" />
          <TextField fullWidth label={t('common.email')} value={form.email} onChange={e => setForm({...form, email: e.target.value})} margin="dense" />
          <TextField fullWidth label={t('common.phone')} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} margin="dense" />
          <TextField fullWidth label={t('admin.sites.address')} value={form.address} onChange={e => setForm({...form, address: e.target.value})} margin="dense" multiline rows={2} />
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button variant="contained" onClick={handleSave}>{t('common.save')}</Button></DialogActions>
      </Dialog>
    </Container>
  );
}

export default function AdminSites() {
  return <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><SitesContent /></DashboardLayout></ProtectedRoute>;
}
