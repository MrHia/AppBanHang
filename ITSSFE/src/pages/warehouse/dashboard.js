import * as React from 'react';
import { Container, Typography, Grid, Card, CardContent } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { warehouseApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';

function WHContent() {
  const { t } = useTranslation();
  const [pos, setPOs] = React.useState([]);

  const loadPOs = React.useCallback(() => {
    warehouseApi.getConfirmedPOs().then(r => setPOs(Array.isArray(r) ? r : [])).catch(console.error);
  }, []);

  React.useEffect(() => { loadPOs(); }, [loadPOs]);
  React.useEffect(() => {
    const interval = setInterval(loadPOs, 15000);
    return () => clearInterval(interval);
  }, [loadPOs]);
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{t('warehouse.dashboard.title')}</Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}><Card sx={{ borderLeft: '4px solid #2563EB' }}><CardContent><Typography variant="h3" sx={{ fontWeight: 700, color: '#2563EB' }}>{pos.length || 0}</Typography><Typography variant="body2" color="text.secondary">{t('warehouse.dashboard.confirmedOrders')}</Typography></CardContent></Card></Grid>
      </Grid>
    </Container>
  );
}

export default function WarehouseDashboard() {
  return <ProtectedRoute allowedRoles={['WAREHOUSE']}><DashboardLayout><WHContent /></DashboardLayout></ProtectedRoute>;
}
