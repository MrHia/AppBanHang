import * as React from 'react';
import { Container, Typography, Grid, Card, CardContent } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { requestApi, poApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';

function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = React.useState({ pending: 0, processing: 0, po: 0 });

  const loadStats = React.useCallback(() => {
    Promise.all([requestApi.getByStatus('PENDING'), requestApi.getByStatus('PROCESSING'), poApi.getAll()])
      .then(([p, pr, pos]) => setStats({ pending: Array.isArray(p?.data) ? p.data.length : (Array.isArray(p) ? p.length : 0), processing: Array.isArray(pr?.data) ? pr.data.length : (Array.isArray(pr) ? pr.length : 0), po: Array.isArray(pos?.data) ? pos.data.length : (Array.isArray(pos) ? pos.length : 0) }))
      .catch(console.error);
  }, []);

  React.useEffect(() => { loadStats(); }, [loadStats]);
  React.useEffect(() => {
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const cards = [
    { labelKey: 'overseas.dashboard.pendingRequests', value: stats.pending, color: '#F59E0B' },
    { labelKey: 'overseas.dashboard.processingRequests', value: stats.processing, color: '#2563EB' },
    { labelKey: 'overseas.dashboard.purchaseOrders', value: stats.po, color: '#059669' },
  ];
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{t('overseas.dashboard.title')}</Typography>
      <Grid container spacing={3}>
        {cards.map(c => (
          <Grid item xs={12} sm={4} key={c.labelKey}>
            <Card sx={{ borderLeft: `4px solid ${c.color}` }}>
              <CardContent><Typography variant="h3" sx={{ fontWeight: 700, color: c.color }}>{c.value}</Typography><Typography variant="body2" color="text.secondary">{t(c.labelKey)}</Typography></CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default function OverseaDashboard() {
  return <ProtectedRoute allowedRoles={['OVERSEAS']}><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>;
}
