import * as React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { poApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';

function POsContent() {
  const { t } = useTranslation();
  const [pos, setPOs] = React.useState([]);
  React.useEffect(() => { poApi.getAll().then(r => setPOs(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))).catch(console.error); }, []);
  const statusColor = { DRAFT: 'default', SENT: 'warning', CONFIRMED: 'success', REJECTED: 'error', DONE: 'primary' };
  const statusLabel = { DRAFT: t('status.draft'), SENT: t('status.sent'), CONFIRMED: t('status.confirmed'), REJECTED: t('status.rejected'), DONE: t('status.done') };
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{t('overseas.purchaseOrders.title')}</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>{t('overseas.purchaseOrders.poCode')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('overseas.purchaseOrders.site')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('overseas.purchaseOrders.deliveryMethod')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('overseas.purchaseOrders.expectedDelivery')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('status.label')}</TableCell></TableRow>
          </TableHead>
          <TableBody>
            {pos.map(p => (
              <TableRow key={p.id} hover>
                <TableCell sx={{ fontFamily: 'monospace' }}>{p.code}</TableCell>
                <TableCell>{p.siteName} ({p.siteCode})</TableCell>
                <TableCell>{p.deliveryMethod}</TableCell>
                <TableCell>{p.expectedDelivery}</TableCell>
                <TableCell><Chip label={statusLabel[p.status] || p.status} size="small" color={statusColor[p.status] || 'default'} /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default function OverseaPOs() {
  return <ProtectedRoute allowedRoles={['OVERSEAS']}><DashboardLayout><POsContent /></DashboardLayout></ProtectedRoute>;
}
