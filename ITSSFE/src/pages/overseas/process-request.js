import * as React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Button } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { requestApi } from 'src/api';
import { useRouter } from 'next/router';
import { useTranslation } from 'src/i18n/useTranslation';

function ProcessRequestList() {
  const { t } = useTranslation();
  const router = useRouter();
  const [requests, setRequests] = React.useState([]);
  const statusColor = { PENDING: 'warning', PROCESSING: 'info', DONE: 'success', CANCELLED: 'default' };
  const statusLabel = { PENDING: t('status.pending'), PROCESSING: t('status.processing'), DONE: t('status.done'), CANCELLED: t('status.cancelled') };

  React.useEffect(() => {
    requestApi.getByStatus('PENDING').then(r => setRequests(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))).catch(console.error);
  }, []);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{t('overseas.processRequests.title')}</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>{t('overseas.processRequests.requestCode')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('common.createdAt')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('overseas.processRequests.expectedDeliveryDate')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('status.label')}</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {requests.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>{t('overseas.processRequests.noRequests')}</TableCell>
              </TableRow>
            )}
            {requests.map(r => (
              <TableRow key={r.id} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{r.code}</TableCell>
                <TableCell>{r.createdAt}</TableCell>
                <TableCell>{r.desiredDate}</TableCell>
                <TableCell><Chip label={statusLabel[r.status] || r.status} size="small" color="warning" /></TableCell>
                <TableCell>
                  <Button size="small" variant="contained" onClick={() => router.push(`/overseas/process-request/${r.id}`)}>
                    {t('overseas.processRequests.process')}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default function ProcessRequest() {
  return <ProtectedRoute allowedRoles={['OVERSEAS']}><DashboardLayout><ProcessRequestList /></DashboardLayout></ProtectedRoute>;
}
