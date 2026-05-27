import * as React from 'react';
import { Container, Typography, Grid, Card, CardContent, Button } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { requestApi } from 'src/api';
import { useRouter } from 'next/router';
import { useTranslation } from 'src/i18n/useTranslation';

function SalesContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const [pending, setPending] = React.useState(0);

  const loadPending = React.useCallback(() => {
    requestApi.getByStatus('PENDING').then(r => setPending(Array.isArray(r?.data) ? r.data.length : (Array.isArray(r) ? r.length : 0))).catch(console.error);
  }, []);

  React.useEffect(() => { loadPending(); }, [loadPending]);
  React.useEffect(() => {
    const interval = setInterval(loadPending, 15000);
    return () => clearInterval(interval);
  }, [loadPending]);
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{t('sales.dashboard.title')}</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}><Card sx={{ borderLeft: '4px solid #2563EB' }}><CardContent><Typography variant="h3" sx={{ fontWeight: 700, color: '#2563EB' }}>{pending}</Typography><Typography variant="body2" color="text.secondary">{t('sales.dashboard.pendingRequests')}</Typography></CardContent></Card></Grid>
        <Grid item xs={12} sm={6}><Card sx={{ borderLeft: '4px solid #059669' }}><CardContent><Button variant="contained" size="large" onClick={() => router.push('/sales/create-request')}>{t('sales.dashboard.createOrderRequest')}</Button></CardContent></Card></Grid>
      </Grid>
    </Container>
  );
}

export default function SalesDashboard() {
  return <ProtectedRoute allowedRoles={['SALES']}><DashboardLayout><SalesContent /></DashboardLayout></ProtectedRoute>;
}
