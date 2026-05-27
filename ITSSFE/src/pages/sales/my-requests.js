import * as React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { requestApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';

function MyRequests() {
  const { t } = useTranslation();
  const [requests, setRequests] = React.useState([]);

  const loadRequests = React.useCallback(() => {
    requestApi.getAll().then(r => setRequests(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))).catch(console.error);
  }, []);

  React.useEffect(() => { loadRequests(); }, [loadRequests]);
  React.useEffect(() => {
    const interval = setInterval(loadRequests, 15000);
    return () => clearInterval(interval);
  }, [loadRequests]);
  const statusColor = { PENDING: 'warning', PROCESSING: 'info', DONE: 'success', CANCELLED: 'default' };
  const statusLabel = { PENDING: t('status.pending'), PROCESSING: t('status.processing'), DONE: t('status.done'), CANCELLED: t('status.cancelled') };
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{t('sales.myRequests.title')}</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>{t('common.code')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('common.createdAt')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('sales.myRequests.desiredDate')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('status.label')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('sales.myRequests.itemCount')}</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {requests.map(r => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{r.code}</TableCell>
                <TableCell>{r.createdAt}</TableCell>
                <TableCell>{r.desiredDate}</TableCell>
                <TableCell><Chip label={statusLabel[r.status] || r.status} size="small" color={statusColor[r.status] || 'default'} /></TableCell>
                <TableCell>{r.itemCount}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default function MyRequestsPage() {
  return <ProtectedRoute allowedRoles={['SALES']}><DashboardLayout><MyRequests /></DashboardLayout></ProtectedRoute>;
}
