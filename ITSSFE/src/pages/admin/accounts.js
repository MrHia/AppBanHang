import * as React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Select, MenuItem, FormControl, InputLabel, Chip, Box, IconButton } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import KeyIcon from '@mui/icons-material/Key';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { accountApi } from 'src/api';
import Alert from '@mui/material/Alert';
import { useTranslation } from 'src/i18n/useTranslation';

function AccountsContent() {
  const { t } = useTranslation();
  const [accounts, setAccounts] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [form, setForm] = React.useState({ email: '', firstName: '', lastName: '', phone: '', roleName: 'SALES', password: '' });
  const [alert, setAlert] = React.useState('');

  const load = React.useCallback(() => accountApi.getAll().then(r => setAccounts(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))).catch(console.error), []);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { const interval = setInterval(load, 15000); return () => clearInterval(interval); }, [load]);

  const handleSave = async () => {
    try {
      if (editing) { await accountApi.update(editing.id, form); setAlert(t('admin.accounts.accountUpdated')); }
      else { await accountApi.create(form); setAlert(t('admin.accounts.accountCreated')); }
      setOpen(false); load();
    } catch (err) { setAlert(typeof err === 'string' ? err : (err?.message || t('common.error'))); }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'lock') await accountApi.lock(id);
      if (action === 'unlock') await accountApi.unlock(id);
      if (action === 'reset') await accountApi.resetPassword(id);
      load();
    } catch (err) { setAlert(typeof err === 'string' ? err : (err?.message || t('common.error'))); }
  };

  const getStatusLabel = (a) => a.isActive ? t('status.active') : t('status.locked');

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{t('admin.accounts.title')}</Typography>
        <Button variant="contained" onClick={() => { setEditing(null); setForm({ email: '', firstName: '', lastName: '', phone: '', roleName: 'SALES', password: '' }); setOpen(true); }}>{t('admin.accounts.createAccount')}</Button>
      </Box>
      {alert && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setAlert('')}>{alert}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>{t('common.email')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('admin.accounts.fullName')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('admin.accounts.role')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('status.label')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {accounts.map(a => (
              <TableRow key={a.id} hover>
                <TableCell>{a.email}</TableCell>
                <TableCell>{a.firstName} {a.lastName}</TableCell>
                <TableCell><Chip label={a.roleName} size="small" color={a.roleName === 'ADMIN' ? 'error' : a.roleName === 'SITE' ? 'warning' : 'default'} /></TableCell>
                <TableCell><Chip label={getStatusLabel(a)} size="small" color={a.isActive ? 'success' : 'error'} /></TableCell>
                <TableCell>
                  <IconButton size="small" onClick={() => handleAction(a.id, 'lock')} title={t('admin.accounts.lock')}><LockIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => handleAction(a.id, 'unlock')} title={t('admin.accounts.unlock')}><LockOpenIcon fontSize="small" /></IconButton>
                  <IconButton size="small" onClick={() => handleAction(a.id, 'reset')} title={t('admin.accounts.resetPassword')}><KeyIcon fontSize="small" /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? t('admin.accounts.updateAccount') : t('admin.accounts.createNewAccount')}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label={t('common.email')} value={form.email} onChange={e => setForm({...form, email: e.target.value})} margin="dense" required />
          <TextField fullWidth label={t('admin.accounts.firstName')} value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} margin="dense" />
          <TextField fullWidth label={t('admin.accounts.lastName')} value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} margin="dense" />
          <TextField fullWidth label={t('common.phone')} value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} margin="dense" />
          <FormControl fullWidth margin="dense">
            <InputLabel>{t('admin.accounts.role')}</InputLabel>
            <Select value={form.roleName} label={t('admin.accounts.role')} onChange={e => setForm({...form, roleName: e.target.value})}>
              {['ADMIN','OVERSEAS','SITE','WAREHOUSE','SALES'].map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
            </Select>
          </FormControl>
          {!editing && <TextField fullWidth label={t('admin.accounts.tempPassword')} value={form.password} onChange={e => setForm({...form, password: e.target.value})} margin="dense" helperText={t('admin.accounts.tempPasswordHelper')} />}
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button variant="contained" onClick={handleSave}>{t('common.save')}</Button></DialogActions>
      </Dialog>
    </Container>
  );
}

export default function AdminAccounts() {
  return <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AccountsContent /></DashboardLayout></ProtectedRoute>;
}
