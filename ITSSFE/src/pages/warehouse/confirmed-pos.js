import * as React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { warehouseApi } from 'src/api';
import { useRouter } from 'next/router';
import { useTranslation } from 'src/i18n/useTranslation';

function ConfirmedPOs() {
  const { t } = useTranslation();
  const [pos, setPOs] = React.useState([]);
  const router = useRouter();

  const loadPOs = React.useCallback(() => {
    warehouseApi.getConfirmedPOs().then(r => setPOs(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))).catch(console.error);
  }, []);

  React.useEffect(() => { loadPOs(); }, [loadPOs]);
  React.useEffect(() => {
    const interval = setInterval(loadPOs, 15000);
    return () => clearInterval(interval);
  }, [loadPOs]);
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{t('warehouse.confirmedPos.title')}</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow><TableCell sx={{ fontWeight: 600 }}>{t('common.code')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('warehouse.confirmedPos.site')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('overseas.purchaseOrders.deliveryMethod')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('site.purchaseOrders.deliveryDate')}</TableCell><TableCell sx={{ fontWeight: 600 }}></TableCell></TableRow>
          </TableHead>
          <TableBody>
            {pos.map(p => (
              <TableRow key={p.id} hover>
                <TableCell>{p.code}</TableCell><TableCell>{p.siteName}</TableCell><TableCell>{p.deliveryMethod}</TableCell><TableCell>{p.expectedDelivery}</TableCell>
                <TableCell><Button size="small" onClick={() => router.push(`/warehouse/receive/${p.id}`)}>{t('warehouse.confirmedPos.receive')}</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default function ConfirmedPOsPage() {
  return <ProtectedRoute allowedRoles={['WAREHOUSE']}><DashboardLayout><ConfirmedPOs /></DashboardLayout></ProtectedRoute>;
}
