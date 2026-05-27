import * as React from 'react';
import { Container, Typography, Grid, Card, CardContent } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { accountApi, siteApi, merchandiseApi, requestApi, poApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';

function DashboardContent() {
  const { t } = useTranslation();
  const [stats, setStats] = React.useState({ accounts: 0, sites: 0, merchandise: 0, requests: 0, pos: 0 });

  const loadStats = React.useCallback(() => {
    Promise.all([accountApi.getAll(), siteApi.getAll(), merchandiseApi.getAll(), requestApi.getAll(), poApi.getAll()])
      .then(([a, s, m, r, p]) => setStats({ accounts: Array.isArray(a?.data) ? a.data.length : (Array.isArray(a) ? a.length : 0), sites: Array.isArray(s?.data) ? s.data.length : (Array.isArray(s) ? s.length : 0), merchandise: Array.isArray(m?.data) ? m.data.length : (Array.isArray(m) ? m.length : 0), requests: Array.isArray(r?.data) ? r.data.length : (Array.isArray(r) ? r.length : 0), pos: Array.isArray(p?.data) ? p.data.length : (Array.isArray(p) ? p.length : 0) }))
      .catch(console.error);
  }, []);

  React.useEffect(() => { loadStats(); }, [loadStats]);
  React.useEffect(() => {
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const cards = [
    { labelKey: 'admin.dashboard.accounts', value: stats.accounts, color: '#2563EB' },
    { labelKey: 'admin.dashboard.sites', value: stats.sites, color: '#059669' },
    { labelKey: 'admin.dashboard.merchandise', value: stats.merchandise, color: '#D97706' },
    { labelKey: 'admin.dashboard.orderRequests', value: stats.requests, color: '#DC2626' },
    { labelKey: 'admin.dashboard.purchaseOrders', value: stats.pos, color: '#7C3AED' },
  ];
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{t('admin.dashboard.title')}</Typography>
      <Grid container spacing={3}>
        {cards.map(c => (
          <Grid item xs={12} sm={6} md={4} key={c.labelKey}>
            <Card sx={{ borderLeft: `4px solid ${c.color}` }}>
              <CardContent>
                <Typography variant="h3" sx={{ fontWeight: 700, color: c.color }}>{c.value}</Typography>
                <Typography variant="body2" color="text.secondary">{t(c.labelKey)}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default function AdminDashboard() {
  return <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><DashboardContent /></DashboardLayout></ProtectedRoute>;
}
