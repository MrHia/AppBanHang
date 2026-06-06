import * as React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Box, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Alert, TextField } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { poApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';

const PO_STATUSES = ['DRAFT', 'SENT', 'CONFIRMED', 'REJECTED', 'DONE'];
const statusColor = { DRAFT: 'default', SENT: 'warning', CONFIRMED: 'info', REJECTED: 'error', DONE: 'success' };

function AdminPurchaseOrders() {
  const { t } = useTranslation();
  const [pos, setPOs] = React.useState([]);
  const [sort, setSort] = React.useState('newest');
  const [alert, setAlert] = React.useState('');
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [detailPO, setDetailPO] = React.useState(null);
  const [details, setDetails] = React.useState([]);
  const [cancelOpen, setCancelOpen] = React.useState(false);
  const [cancelPO, setCancelPO] = React.useState(null);
  const [cancelReason, setCancelReason] = React.useState('');

  const load = React.useCallback(() => {
    poApi.getAll().then(r => setPOs(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))).catch(console.error);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  // numeric:true cho mã PO/REQ chứa số (PO-…-2 vs PO-…-10);
  // tie-breaker theo id để stable.
  const cmp = (x, y) => String(x || '').localeCompare(String(y || ''), undefined, { numeric: true });
  const sorted = React.useMemo(() => {
    const arr = [...pos];
    if (sort === 'newest') arr.sort((a, b) => (b.id || 0) - (a.id || 0));
    else if (sort === 'oldest') arr.sort((a, b) => (a.id || 0) - (b.id || 0));
    else if (sort === 'req') arr.sort((a, b) => cmp(a.processRequestCode, b.processRequestCode) || (a.id || 0) - (b.id || 0));
    return arr;
  }, [pos, sort]);

  // Admin can still force a status via PUT for data-fix purposes — but a real
  // cancellation should go through the cascade endpoint (poApi.reject), which
  // also cancels the parent request and sibling POs and restores stock.
  const changeStatus = async (p, status) => {
    try { await poApi.update(p.id, { status }); setPOs(prev => prev.map(x => x.id === p.id ? { ...x, status } : x)); setAlert(`Đã đổi trạng thái ${p.code} → ${status}`); }
    catch (e) { setAlert(typeof e === 'string' ? e : (e?.message || 'Lỗi')); }
  };

  const openCancel = (p) => { setCancelPO(p); setCancelReason(''); setCancelOpen(true); };
  const handleCancel = async () => {
    try {
      await poApi.reject(cancelPO.id, cancelReason);
      setAlert(`Đã hủy PO ${cancelPO.code} — request cha và các PO anh em cũng đã được hủy`);
      setCancelOpen(false);
      load();
    } catch (e) {
      setAlert(typeof e === 'string' ? e : (e?.message || 'Lỗi'));
    }
  };

  const openDetails = async (p) => {
    setDetailPO(p); setDetails([]); setDetailOpen(true);
    try { const d = await poApi.getDetails(p.id); setDetails(Array.isArray(d) ? d : (Array.isArray(d?.data) ? d.data : [])); } catch (e) { console.error(e); }
  };

  const isCancellable = (status) => status !== 'REJECTED' && status !== 'DONE';

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Quản lý Purchase Order</Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Sắp xếp</InputLabel>
          <Select value={sort} label="Sắp xếp" onChange={e => setSort(e.target.value)}>
            <MenuItem value="newest">Mới nhất</MenuItem>
            <MenuItem value="oldest">Cũ nhất</MenuItem>
            <MenuItem value="req">Theo REQ</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {alert && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setAlert('')}>{alert}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Mã PO</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>REQ</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Site</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Vận chuyển</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Trạng thái (sửa)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map(p => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{p.code}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', color: 'primary.main' }}>{p.processRequestCode || '—'}</TableCell>
                <TableCell>{p.siteName}</TableCell>
                <TableCell>{p.deliveryMethod}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip size="small" label={p.status} color={statusColor[p.status] || 'default'} />
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <Select value={p.status} onChange={e => changeStatus(p, e.target.value)}>
                        {PO_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button size="small" variant="outlined" onClick={() => openDetails(p)}>Chi tiết</Button>
                    {isCancellable(p.status) && (
                      <Button size="small" variant="outlined" color="error" onClick={() => openCancel(p)}>Hủy PO</Button>
                    )}
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>Chưa có purchase order nào.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết {detailPO?.code} {detailPO?.processRequestCode ? `(REQ ${detailPO.processRequestCode})` : ''}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Site: {detailPO?.siteName} · Vận chuyển: {detailPO?.deliveryMethod} · Giao: {detailPO?.expectedDelivery || '—'}</Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>Mã</TableCell><TableCell sx={{ fontWeight: 600 }}>Tên</TableCell><TableCell sx={{ fontWeight: 600 }} align="center">SL</TableCell><TableCell sx={{ fontWeight: 600 }}>ĐV</TableCell></TableRow></TableHead>
            <TableBody>
              {details.map(d => <TableRow key={d.id}><TableCell sx={{ fontFamily: 'monospace' }}>{d.merchandiseCode}</TableCell><TableCell>{d.merchandiseName}</TableCell><TableCell align="center">{d.quantity}</TableCell><TableCell>{d.unit}</TableCell></TableRow>)}
              {details.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 2 }}>Không có dòng chi tiết.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setDetailOpen(false)}>Đóng</Button></DialogActions>
      </Dialog>

      <Dialog open={cancelOpen} onClose={() => setCancelOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Hủy PO {cancelPO?.code}</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            ⚠️ Hủy PO này sẽ hủy luôn Process Request {cancelPO?.processRequestCode ? `(${cancelPO.processRequestCode})` : ''} và mọi PO khác cùng request. Tồn kho đã trừ sẽ được hoàn lại.
          </Alert>
          <TextField fullWidth required label="Lý do hủy" multiline rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelOpen(false)}>Đóng</Button>
          <Button variant="contained" color="error" onClick={handleCancel} disabled={!cancelReason.trim()}>Hủy PO</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default function AdminPurchaseOrdersPage() {
  return <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminPurchaseOrders /></DashboardLayout></ProtectedRoute>;
}
