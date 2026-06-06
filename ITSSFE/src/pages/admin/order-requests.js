import * as React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Box, FormControl, InputLabel, Select, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { requestApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';

const REQ_STATUSES = ['PENDING', 'PROCESSING', 'DONE', 'CANCELLED'];
const statusColor = { PENDING: 'warning', PROCESSING: 'info', DONE: 'success', CANCELLED: 'default' };

function AdminOrderRequests() {
  const { t } = useTranslation();
  const [requests, setRequests] = React.useState([]);
  const [sort, setSort] = React.useState('newest');
  const [alert, setAlert] = React.useState('');
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reviewReq, setReviewReq] = React.useState(null);
  const [reviewItems, setReviewItems] = React.useState([]);

  const load = React.useCallback(() => {
    requestApi.getAll().then(r => setRequests(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))).catch(console.error);
  }, []);
  React.useEffect(() => { load(); }, [load]);

  // numeric:true để mã có số (REQ-…-2 vs REQ-…-10) sort đúng;
  // tie-breaker id để stable giữa các lần refresh.
  const cmp = (x, y) => String(x || '').localeCompare(String(y || ''), undefined, { numeric: true });
  const sorted = React.useMemo(() => {
    const arr = [...requests];
    if (sort === 'newest') arr.sort((a, b) => cmp(b.createdAt, a.createdAt) || (b.id || 0) - (a.id || 0));
    else if (sort === 'oldest') arr.sort((a, b) => cmp(a.createdAt, b.createdAt) || (a.id || 0) - (b.id || 0));
    else if (sort === 'code') arr.sort((a, b) => cmp(a.code, b.code) || (a.id || 0) - (b.id || 0));
    return arr;
  }, [requests, sort]);

  const changeStatus = async (r, status) => {
    try { await requestApi.updateStatus(r.id, status); setRequests(prev => prev.map(x => x.id === r.id ? { ...x, status } : x)); setAlert(`Đã đổi trạng thái ${r.code} → ${status}`); }
    catch (e) { setAlert(typeof e === 'string' ? e : (e?.message || 'Lỗi')); }
  };

  const openReview = async (r) => {
    setReviewReq(r); setReviewItems([]); setReviewOpen(true);
    try { const it = await requestApi.getItems(r.id); setReviewItems(Array.isArray(it) ? it : (Array.isArray(it?.data) ? it.data : [])); } catch (e) { console.error(e); }
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2, mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Quản lý Order Request</Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Sắp xếp</InputLabel>
          <Select value={sort} label="Sắp xếp" onChange={e => setSort(e.target.value)}>
            <MenuItem value="newest">Mới nhất</MenuItem>
            <MenuItem value="oldest">Cũ nhất</MenuItem>
            <MenuItem value="code">Theo mã</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {alert && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setAlert('')}>{alert}</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Mã REQ</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Người tạo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Ngày tạo</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Ngày giao</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Số MH</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Trạng thái (sửa)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map(r => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.code}</TableCell>
                <TableCell>{r.createdByName}</TableCell>
                <TableCell>{r.createdAt}</TableCell>
                <TableCell>{r.desiredDate}</TableCell>
                <TableCell>{r.itemCount}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Chip size="small" label={r.status} color={statusColor[r.status] || 'default'} />
                    <FormControl size="small" sx={{ minWidth: 130 }}>
                      <Select value={r.status} onChange={e => changeStatus(r, e.target.value)}>
                        {REQ_STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                      </Select>
                    </FormControl>
                  </Box>
                </TableCell>
                <TableCell><Button size="small" variant="outlined" onClick={() => openReview(r)}>Chi tiết</Button></TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}>Chưa có order request nào.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết {reviewReq?.code}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>Ngày giao: {reviewReq?.desiredDate || '—'}{reviewReq?.notes ? ` · Ghi chú: ${reviewReq.notes}` : ''}</Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>Mã</TableCell><TableCell sx={{ fontWeight: 600 }}>Tên</TableCell><TableCell sx={{ fontWeight: 600 }} align="center">SL</TableCell><TableCell sx={{ fontWeight: 600 }}>ĐV</TableCell></TableRow></TableHead>
            <TableBody>
              {reviewItems.map(it => <TableRow key={it.id}><TableCell sx={{ fontFamily: 'monospace' }}>{it.merchandiseCode}</TableCell><TableCell>{it.merchandiseName}</TableCell><TableCell align="center">{it.quantity}</TableCell><TableCell>{it.unit}</TableCell></TableRow>)}
              {reviewItems.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 2 }}>Không có mặt hàng.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setReviewOpen(false)}>Đóng</Button></DialogActions>
      </Dialog>
    </Container>
  );
}

export default function AdminOrderRequestsPage() {
  return <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AdminOrderRequests /></DashboardLayout></ProtectedRoute>;
}
