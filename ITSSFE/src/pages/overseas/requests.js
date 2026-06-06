import * as React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button, Box, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { requestApi } from 'src/api';
import { useRouter } from 'next/router';
import { useTranslation } from 'src/i18n/useTranslation';

function RequestsContent() {
  const { t } = useTranslation();
  const [requests, setRequests] = React.useState([]);
  const [sort, setSort] = React.useState('newest');
  const router = useRouter();
  const load = React.useCallback(() => { requestApi.getAll().then(r => setRequests(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))).catch(console.error); }, []);
  React.useEffect(() => { load(); }, [load]);
  React.useEffect(() => { const interval = setInterval(load, 15000); return () => clearInterval(interval); }, [load]);
  const statusColor = { PENDING: 'warning', PROCESSING: 'info', DONE: 'success', CANCELLED: 'default' };
  const statusLabel = { PENDING: t('status.pending'), PROCESSING: t('status.processing'), DONE: t('status.done'), CANCELLED: t('status.cancelled') };

  // mặc định sort theo thời gian tạo mới nhất.
  // Tie-breaker (id) giữ thứ tự ổn định giữa các lần refresh khi nhiều dòng
  // có cùng createdAt; numeric:true để mã có hậu tố số (REQ-…-2 vs REQ-…-10)
  // sort theo giá trị số chứ không theo ký tự.
  const cmpCode = (x, y) => String(x || '').localeCompare(String(y || ''), undefined, { numeric: true });
  const sorted = React.useMemo(() => {
    const arr = [...requests];
    if (sort === 'newest') arr.sort((a, b) => cmpCode(b.createdAt, a.createdAt) || (b.id || 0) - (a.id || 0));
    else if (sort === 'oldest') arr.sort((a, b) => cmpCode(a.createdAt, b.createdAt) || (a.id || 0) - (b.id || 0));
    else if (sort === 'code') arr.sort((a, b) => cmpCode(a.code, b.code) || (a.id || 0) - (b.id || 0));
    return arr;
  }, [requests, sort]);

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{t('overseas.requests.title')}</Typography>
        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel>Sắp xếp</InputLabel>
          <Select value={sort} label="Sắp xếp" onChange={e => setSort(e.target.value)}>
            <MenuItem value="newest">Mới nhất (tạo gần đây)</MenuItem>
            <MenuItem value="oldest">Cũ nhất</MenuItem>
            <MenuItem value="code">Theo mã</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>{t('common.code')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('common.createdAt')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('overseas.requests.createdBy')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('overseas.requests.desiredDate')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('status.label')}</TableCell><TableCell sx={{ fontWeight: 600 }}></TableCell></TableRow>
          </TableHead>
          <TableBody>
            {sorted.map(r => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{r.code}</TableCell>
                <TableCell>{r.createdAt}</TableCell>
                <TableCell>{r.createdByName}</TableCell>
                <TableCell>{r.desiredDate}</TableCell>
                <TableCell><Chip label={statusLabel[r.status] || r.status} size="small" color={statusColor[r.status] || 'default'} /></TableCell>
                <TableCell><Button size="small" onClick={() => router.push(`/overseas/order-matrix/${r.id}`)}>{t('overseas.requests.detail')}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default function OverseaRequests() {
  return <ProtectedRoute allowedRoles={['OVERSEAS']}><DashboardLayout><RequestsContent /></DashboardLayout></ProtectedRoute>;
}
