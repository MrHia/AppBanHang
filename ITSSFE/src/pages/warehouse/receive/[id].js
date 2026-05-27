import * as React from 'react';
import { Container, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Box, Alert } from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { warehouseApi, poApi } from 'src/api';
import { useAuth } from 'src/contexts/auth-context';
import { useRouter } from 'next/router';
import { useTranslation } from 'src/i18n/useTranslation';

function ReceiveContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [po, setPO] = React.useState(null);
  const [details, setDetails] = React.useState([]);
  const [receiptId, setReceiptId] = React.useState(null);
  const [receiptItems, setReceiptItems] = React.useState([]);
  const [receivedQty, setReceivedQty] = React.useState({});
  const [alert, setAlert] = React.useState('');

  React.useEffect(() => {
    if (!id) return;
    poApi.getById(id).then(r => { setPO(r?.data || r); return poApi.getDetails(id); })
      .then(d => { const arr = Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []); setDetails(arr); const init = {}; arr.forEach(i => { init[i.id] = i.quantity; }); setReceivedQty(init); })
      .catch(console.error);
  }, [id]);

  const handleReceive = async () => {
    try {
      const receipt = await warehouseApi.receiveGoods(parseInt(id), user.id).then(r => r?.data || r);
      setReceiptId(receipt?.id || receipt);
      const items = await warehouseApi.getReceiptItems(receipt?.id || receipt);
      setReceiptItems(Array.isArray(items?.data) ? items.data : (Array.isArray(items) ? items : []));
      setAlert(t('warehouse.receive.goodsReceived'));
    } catch (err) { setAlert(typeof err === 'string' ? err : (err?.message || t('common.error'))); }
  };

  const handleConfirm = async () => {
    try {
      const itemsData = receiptItems.map(ri => ({ id: ri.id, receivedQuantity: receivedQty[ri.id] || 0 }));
      await warehouseApi.confirmReceipt(receiptId, itemsData);
      setAlert(t('warehouse.receive.receiptConfirmed'));
    } catch (err) { setAlert(typeof err === 'string' ? err : (err?.message || t('common.error'))); }
  };

  if (!po) return null;
  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>{t('warehouse.receive.receiveGoods')} {po.code}</Typography>
      {alert && <Alert severity="info" sx={{ mb: 2 }} onClose={() => setAlert('')}>{alert}</Alert>}
      <Card sx={{ mb: 3 }}>
        <CardContent><Typography>{t('overseas.purchaseOrders.site')}: {po.siteName}</Typography><Typography>{t('overseas.purchaseOrders.deliveryMethod')}: {po.deliveryMethod}</Typography><Typography>{t('overseas.purchaseOrders.expectedDelivery')}: {po.expectedDelivery}</Typography></CardContent>
      </Card>
      {!receiptId ? (
        <Button variant="contained" onClick={handleReceive}>{t('warehouse.receive.receiveGoodsBtn')}</Button>
      ) : (
        <>
          <Typography variant="h6" sx={{ mb: 1 }}>{t('warehouse.receive.enterReceivedQty')}</Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>{t('common.name')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('warehouse.receive.orderedQty')}</TableCell><TableCell sx={{ fontWeight: 600 }}>{t('warehouse.receive.receivedQty')}</TableCell></TableRow></TableHead>
              <TableBody>
                {receiptItems.map(ri => (
                  <TableRow key={ri.id}>
                    <TableCell>{ri.merchandiseName}</TableCell>
                    <TableCell>{ri.orderedQuantity}</TableCell>
                    <TableCell><TextField type="number" size="small" value={receivedQty[ri.id] || 0} onChange={e => setReceivedQty({...receivedQty, [ri.id]: parseInt(e.target.value)})} sx={{ width: 100 }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2 }}><Button variant="contained" onClick={handleConfirm}>{t('warehouse.receive.confirmReceipt')}</Button></Box>
        </>
      )}
    </Container>
  );
}

export default function ReceivePage() {
  return <ProtectedRoute allowedRoles={['WAREHOUSE']}><DashboardLayout><ReceiveContent /></DashboardLayout></ProtectedRoute>;
}
