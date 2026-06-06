import * as React from 'react';
import { Container, Typography, Grid, Card, CardContent } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { poApi } from 'src/api';
import { useAuth } from 'src/contexts/auth-context';
import { useTranslation } from 'src/i18n/useTranslation';

function SiteDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [stats, setStats] = React.useState({ pos: 0 });
  const userRef = React.useRef(user);
  React.useEffect(() => { userRef.current = user; }, [user]);

  const loadStats = React.useCallback(() => {
    if (!userRef.current?.siteId) return;
    poApi.getBySite(userRef.current.siteId)
      .then(p => setStats({ pos: Array.isArray(p) ? p.length : 0 }))
      .catch(console.error);
  }, []);

  React.useEffect(() => { loadStats(); }, [loadStats]);
  React.useEffect(() => {
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, [loadStats]);

  const cards = [
    { labelKey: 'site.dashboard.purchaseOrders', value: stats.pos, color: '#2563EB' },
  ];
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{t('site.dashboard.title')} - {user?.siteCode}</Typography>
      <Grid container spacing={3}>
        {cards.map(c => (
          <Grid item xs={12} sm={6} key={c.labelKey}>
            <Card sx={{ borderLeft: `4px solid ${c.color}` }}>
              <CardContent><Typography variant="h3" sx={{ fontWeight: 700, color: c.color }}>{c.value}</Typography><Typography variant="body2" color="text.secondary">{t(c.labelKey)}</Typography></CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}

export default function SiteDashboardPage() {
  return <ProtectedRoute allowedRoles={['SITE']}><DashboardLayout><SiteDashboard /></DashboardLayout></ProtectedRoute>;
}
