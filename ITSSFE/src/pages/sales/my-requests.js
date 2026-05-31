import * as React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, FormControl, InputLabel, Select, MenuItem, Box, Dialog, DialogTitle, DialogContent, DialogActions, Alert } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { requestApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';
import { useRouter } from 'next/router';

function MyRequests() {
  const { t } = useTranslation();
  const router = useRouter();
  const [requests, setRequests] = React.useState([]);
  const [sort, setSort] = React.useState('newest');
  const [reviewOpen, setReviewOpen] = React.useState(false);
  const [reviewReq, setReviewReq] = React.useState(null);
  const [reviewItems, setReviewItems] = React.useState([]);

  const loadRequests = React.useCallback(() => {
    requestApi.getAll().then(r => setRequests(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))).catch(console.error);
  }, []);

  React.useEffect(() => { loadRequests(); }, [loadRequests]);
  React.useEffect(() => {
    const interval = setInterval(loadRequests, 15000);
    return () => clearInterval(interval);
  }, [loadRequests]);

  // sắp xếp; mặc định mới nhất theo createdAt
  const sorted = React.useMemo(() => {
    const arr = [...requests];
    if (sort === 'newest') arr.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
    else if (sort === 'oldest') arr.sort((a, b) => String(a.createdAt || '').localeCompare(String(b.createdAt || '')));
    else if (sort === 'code') arr.sort((a, b) => String(a.code || '').localeCompare(String(b.code || '')));
    return arr;
  }, [requests, sort]);

  const openReview = async (r) => {
    setReviewReq(r); setReviewItems([]); setReviewOpen(true);
    try { const it = await requestApi.getItems(r.id); setReviewItems(Array.isArray(it) ? it : (Array.isArray(it?.data) ? it.data : [])); }
    catch (e) { console.error(e); }
  };

  const statusColor = { PENDING: 'warning', PROCESSING: 'info', DONE: 'success', CANCELLED: 'default' };
  const statusLabel = { PENDING: t('status.pending'), PROCESSING: t('status.processing'), DONE: t('status.done'), CANCELLED: t('status.cancelled') };
  const created = router.query.created;

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{t('sales.myRequests.title')}</Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Sắp xếp</InputLabel>
          <Select value={sort} label="Sắp xếp" onChange={e => setSort(e.target.value)}>
            <MenuItem value="newest">Mới nhất (tạo gần đây)</MenuItem>
            <MenuItem value="oldest">Cũ nhất</MenuItem>
            <MenuItem value="code">Theo mã</MenuItem>
          </Select>
        </FormControl>
      </Box>
      {created && <Alert severity="success" sx={{ mb: 2 }} onClose={() => router.replace('/sales/my-requests', undefined, { shallow: true })}>Đã gửi yêu cầu <b>{created}</b> thành công.</Alert>}
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>{t('common.code')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('common.createdAt')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('sales.myRequests.desiredDate')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('status.label')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('sales.myRequests.itemCount')}</TableCell><TableCell sx={{ fontWeight: 600 }}></TableCell></TableRow>
          </TableHead>
          <TableBody>
            {sorted.map(r => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{r.code}</TableCell>
                <TableCell>{r.createdAt}</TableCell>
                <TableCell>{r.desiredDate}</TableCell>
                <TableCell><Chip label={statusLabel[r.status] || r.status} size="small" color={statusColor[r.status] || 'default'} /></TableCell>
                <TableCell>{r.itemCount}</TableCell>
                <TableCell><Button size="small" variant="outlined" onClick={() => openReview(r)}>Review</Button></TableCell>
              </TableRow>
            ))}
            {sorted.length === 0 && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>Chưa có yêu cầu nào.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={reviewOpen} onClose={() => setReviewOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Chi tiết yêu cầu {reviewReq?.code}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Ngày giao mong muốn: {reviewReq?.desiredDate || '—'}{reviewReq?.notes ? ` · Ghi chú: ${reviewReq.notes}` : ''}
          </Typography>
          <Table size="small">
            <TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>Mã</TableCell><TableCell sx={{ fontWeight: 600 }}>Tên</TableCell><TableCell sx={{ fontWeight: 600 }} align="center">SL</TableCell><TableCell sx={{ fontWeight: 600 }}>ĐV</TableCell></TableRow></TableHead>
            <TableBody>
              {reviewItems.map(it => (
                <TableRow key={it.id}><TableCell sx={{ fontFamily: 'monospace' }}>{it.merchandiseCode}</TableCell><TableCell>{it.merchandiseName}</TableCell><TableCell align="center">{it.quantity}</TableCell><TableCell>{it.unit}</TableCell></TableRow>
              ))}
              {reviewItems.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 2 }}>Đang tải / không có mặt hàng.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setReviewOpen(false)}>{t('common.cancel') || 'Đóng'}</Button></DialogActions>
      </Dialog>
    </Container>
  );
}

export default function MyRequestsPage() {
  return <ProtectedRoute allowedRoles={['SALES']}><DashboardLayout><MyRequests /></DashboardLayout></ProtectedRoute>;
}
