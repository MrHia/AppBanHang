import * as React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Box, Chip, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { merchandiseApi } from 'src/api';
import Alert from '@mui/material/Alert';
import { useTranslation } from 'src/i18n/useTranslation';

function MerchandiseContent() {
  const { t } = useTranslation();
  const [items, setItems] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [form, setForm] = React.useState({ code: '', name: '', unit: 'piece', description: '' });
  const [alert, setAlert] = React.useState('');

  const load = React.useCallback(() => merchandiseApi.getAll().then(r => setItems(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))).catch(console.error), []);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { const interval = setInterval(load, 15000); return () => clearInterval(interval); }, [load]);

  const handleSave = async () => {
    try { await merchandiseApi.create(form); setAlert(t('admin.merchandise.merchandiseCreated')); setOpen(false); load(); }
    catch (err) { setAlert(typeof err === 'string' ? err : (err?.message || t('common.error'))); }
  };

  const handleDelete = async (m) => {
    const ok = window.confirm(`Ngừng kinh doanh mặt hàng "${m.name}" (${m.code})?\n\nTất cả site đang KD mặt hàng này cũng sẽ ngừng.`);
    if (!ok) return;
    try {
      await merchandiseApi.deactivate(m.id);
      setAlert(`Đã ngừng kinh doanh ${m.code}`);
      load();
    } catch (err) {
      setAlert(typeof err === 'string' ? err : (err?.message || 'Xoá thất bại'));
    }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{t('admin.merchandise.title')}</Typography>
        <Button variant="contained" onClick={() => { setForm({ code: '', name: '', unit: 'piece', description: '' }); setOpen(true); }}>{t('admin.merchandise.addMerchandise')}</Button>
      </Box>
      {alert && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setAlert('')}>{alert}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>{t('common.code')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('common.name')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('admin.merchandise.unit')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('admin.merchandise.description')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('status.label')}</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Thao tác</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {items.map(m => (
              <TableRow key={m.id} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{m.code}</TableCell>
                <TableCell>{m.name}</TableCell>
                <TableCell>{m.unit}</TableCell>
                <TableCell>{m.description}</TableCell>
                <TableCell><Chip label={m.isActive ? t('status.active') : t('status.inactive')} size="small" color={m.isActive ? 'success' : 'default'} /></TableCell>
                <TableCell align="right">
                  {m.isActive ? (
                    <Tooltip title="Ngừng kinh doanh mặt hàng này">
                      <IconButton size="small" color="error" onClick={() => handleDelete(m)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Typography variant="caption" color="text.disabled">Đã ngừng</Typography>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('admin.merchandise.addNewMerchandise')}</DialogTitle>
        <DialogContent>
          <TextField fullWidth label={t('admin.merchandise.merchandiseCode')} value={form.code} onChange={e => setForm({...form, code: e.target.value})} margin="dense" required />
          <TextField fullWidth label={t('common.name')} value={form.name} onChange={e => setForm({...form, name: e.target.value})} margin="dense" />
          <TextField fullWidth label={t('admin.merchandise.unit')} value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} margin="dense" />
          <TextField fullWidth label={t('admin.merchandise.description')} value={form.description} onChange={e => setForm({...form, description: e.target.value})} margin="dense" multiline rows={2} />
        </DialogContent>
        <DialogActions><Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button><Button variant="contained" onClick={handleSave}>{t('common.save')}</Button></DialogActions>
      </Dialog>
    </Container>
  );
}

export default function AdminMerchandise() {
  return <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><MerchandiseContent /></DashboardLayout></ProtectedRoute>;
}
