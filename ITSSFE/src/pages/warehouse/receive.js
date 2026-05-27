import * as React from 'react';
import { Container, Typography, Card, CardContent, Button, Box } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { useRouter } from 'next/router';
import { useTranslation } from 'src/i18n/useTranslation';

function ReceiveIndex() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700 }}>{t('warehouse.receive.title')}</Typography>
      <Card>
        <CardContent>
          <Typography variant="body1" sx={{ mb: 2 }}>{t('warehouse.receive.selectOrder')}</Typography>
          <Box>
            <Button variant="contained" onClick={() => router.push('/warehouse/confirmed-pos')}>{t('warehouse.receive.viewConfirmedOrders')}</Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}

export default function ReceiveIndexPage() {
  return <ProtectedRoute allowedRoles={['WAREHOUSE']}><DashboardLayout><ReceiveIndex /></DashboardLayout></ProtectedRoute>;
}
