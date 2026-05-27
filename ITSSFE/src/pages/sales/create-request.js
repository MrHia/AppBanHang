import * as React from 'react';
import { Container, Typography, Box, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { requestApi, merchandiseApi } from 'src/api';
import { useAuth } from 'src/contexts/auth-context';
import { useTranslation } from 'src/i18n/useTranslation';

function CreateRequestContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = React.useState([]);
  const [selected, setSelected] = React.useState([]);
  const [desiredDate, setDesiredDate] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [alert, setAlert] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [addOpen, setAddOpen] = React.useState(false);
  const [addForm, setAddForm] = React.useState({ merchandiseId: '', quantity: '', unit: 'piece' });

  React.useEffect(() => { merchandiseApi.getAll().then(r => setItems(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))).catch(console.error); }, []);

  const addItem = () => {
    if (!addForm.merchandiseId || !addForm.quantity) return;
    const m = items.find(x => x.id === parseInt(addForm.merchandiseId));
    if (!m) return;
    setSelected([...selected, { merchandiseId: m.id, merchandiseCode: m.code, merchandiseName: m.name, quantity: parseInt(addForm.quantity), unit: m.unit }]);
    setAddOpen(false);
    setAddForm({ merchandiseId: '', quantity: '', unit: 'piece' });
  };

  const today = new Date().toISOString().split('T')[0];

  const handleSubmit = async () => {
    if (selected.length === 0) { setAlert(t('sales.createRequest.noMerchandiseAdded')); return; }
    if (!desiredDate || desiredDate < today) { setAlert(t('sales.createRequest.invalidDate')); return; }
    setLoading(true);
    try {
      const req = await requestApi.create({ desiredDate, notes }, user.id).then(r => r?.data || r);
      const reqId = req?.id || req;
      for (const item of selected) { await requestApi.addItem(reqId, item); }
      setAlert(t('sales.createRequest.requestCreated') + ' ' + (req?.code || reqId));
      setSelected([]);
      setNotes('');
    } catch (err) { setAlert(typeof err === 'string' ? err : (err?.message || t('common.error'))); }
    finally { setLoading(false); }
  };

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{t('sales.createRequest.title')}</Typography>
      {alert && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAlert('')}>{alert}</Alert>}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <TextField label={t('sales.createRequest.desiredDeliveryDate')} type="date" value={desiredDate} onChange={e => setDesiredDate(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label={t('sales.createRequest.notes')} value={notes} onChange={e => setNotes(e.target.value)} sx={{ flex: 1 }} />
          </Box>
          <Button variant="outlined" onClick={() => setAddOpen(true)}>+ {t('sales.createRequest.addMerchandise')}</Button>
        </CardContent>
      </Card>
      <Card>
        <CardContent sx={{ p: 0 }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#F9FAFB' }}>
                <TableRow><TableCell sx={{ fontWeight: 600 }}>{t('common.code')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('common.name')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('overseas.processRequest.quantity')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('admin.merchandise.unit')}</TableCell><TableCell sx={{ fontWeight: 600 }}></TableCell></TableRow>
              </TableHead>
              <TableBody>
                {selected.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}>{t('sales.createRequest.noMerchandiseAdded')}</TableCell></TableRow>}
                {selected.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>{s.merchandiseCode}</TableCell><TableCell>{s.merchandiseName}</TableCell><TableCell>{s.quantity}</TableCell><TableCell>{s.unit}</TableCell>
                    <TableCell><Button size="small" color="error" onClick={() => setSelected(selected.filter((_, j) => j !== i))}>{t('sales.createRequest.remove')}</Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      <Box sx={{ mt: 3 }}><Button variant="contained" size="large" onClick={handleSubmit} disabled={loading} fullWidth>{t('sales.createRequest.submitRequest')}</Button></Box>

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('sales.createRequest.addMerchandise')}</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel>{t('common.name')}</InputLabel>
            <Select value={addForm.merchandiseId} label={t('common.name')} onChange={e => { const m = items.find(x => x.id === parseInt(e.target.value)); setAddForm({ ...addForm, merchandiseId: e.target.value, unit: m?.unit || 'piece' }); }}>
              {items.map(m => <MenuItem key={m.id} value={m.id}>{m.code} - {m.name}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField fullWidth label={t('overseas.processRequest.quantity')} type="number" value={addForm.quantity} onChange={e => setAddForm({...addForm, quantity: e.target.value})} margin="dense" required />
        </DialogContent>
        <DialogActions><Button onClick={() => setAddOpen(false)}>{t('common.cancel')}</Button><Button variant="contained" onClick={addItem}>{t('common.add')}</Button></DialogActions>
      </Dialog>
    </Container>
  );
}

export default function CreateRequest() {
  return <ProtectedRoute allowedRoles={['SALES']}><DashboardLayout><CreateRequestContent /></DashboardLayout></ProtectedRoute>;
}
