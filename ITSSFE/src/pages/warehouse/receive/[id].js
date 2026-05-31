import * as React from 'react';
import { Container, Typography, Card, CardContent, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, TextField, Box, Alert, Chip, CircularProgress } from '@mui/material';
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
  const [receiving, setReceiving] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);
  const [done, setDone] = React.useState(false);     // đã xác nhận nhận hàng xong
  const [summary, setSummary] = React.useState([]);  // kết quả thừa/thiếu từng mặt hàng
  const [alert, setAlert] = React.useState('');

  React.useEffect(() => {
    if (!id) return;
    poApi.getById(id).then(r => { setPO(r?.data || r); return poApi.getDetails(id); })
      .then(d => { const arr = Array.isArray(d?.data) ? d.data : (Array.isArray(d) ? d : []); setDetails(arr); const init = {}; arr.forEach(i => { init[i.id] = i.quantity; }); setReceivedQty(init); })
      .catch(console.error);
  }, [id]);

  const handleReceive = async () => {
    if (receiving || receiptId) return;            // chống bấm nhiều lần
    setReceiving(true);
    try {
      const receipt = await warehouseApi.receiveGoods(parseInt(id), user.id).then(r => r?.data || r);
      const rid = receipt?.id || receipt;
      setReceiptId(rid);
      const items = await warehouseApi.getReceiptItems(rid);
      const arr = Array.isArray(items?.data) ? items.data : (Array.isArray(items) ? items : []);
      setReceiptItems(arr);
      // mặc định số thực nhận = số đặt
      const init = {}; arr.forEach(ri => { init[ri.id] = ri.orderedQuantity; });
      setReceivedQty(init);
      setAlert(t('warehouse.receive.goodsReceived'));
    } catch (err) { setAlert(typeof err === 'string' ? err : (err?.message || t('common.error'))); }
    finally { setReceiving(false); }
  };

  const handleConfirm = async () => {
    if (confirming || done) return;                 // chống bấm nhiều lần
    setConfirming(true);
    try {
      const itemsData = receiptItems.map(ri => ({ id: ri.id, receivedQuantity: receivedQty[ri.id] || 0 }));
      await warehouseApi.confirmReceipt(receiptId, itemsData);
      // tính thừa/thiếu để hiển thị ngay
      const rows = receiptItems.map(ri => {
        const received = receivedQty[ri.id] || 0;
        const diff = received - ri.orderedQuantity;
        return { name: ri.merchandiseName, ordered: ri.orderedQuantity, received, diff };
      });
      setSummary(rows);
      setDone(true);
      const hasDiff = rows.some(r => r.diff !== 0);
      setAlert(hasDiff
        ? 'Đã ghi nhận. Có chênh lệch — hệ thống đã tạo bản ghi để Site xử lý.'
        : 'Nhận đủ hàng, không chênh lệch — đơn đã đóng (DONE).');
    } catch (err) { setAlert(typeof err === 'string' ? err : (err?.message || t('common.error'))); }
    finally { setConfirming(false); }
  };

  if (!po) return null;
  const hasDiff = summary.some(r => r.diff !== 0);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 2, fontWeight: 700 }}>{t('warehouse.receive.receiveGoods')} {po.code}</Typography>
      {alert && <Alert severity={done ? (hasDiff ? 'warning' : 'success') : 'info'} sx={{ mb: 2 }} onClose={() => setAlert('')}>{alert}</Alert>}
      <Card sx={{ mb: 3 }}>
        <CardContent><Typography>{t('overseas.purchaseOrders.site')}: {po.siteName}</Typography><Typography>{t('overseas.purchaseOrders.deliveryMethod')}: {po.deliveryMethod}</Typography><Typography>{t('overseas.purchaseOrders.expectedDelivery')}: {po.expectedDelivery}</Typography></CardContent>
      </Card>

      {/* Đã xác nhận xong → hiện kết quả thừa/thiếu, đóng đơn, ẩn mọi nút nhập */}
      {done ? (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography variant="h6">Kết quả nhận hàng</Typography>
            <Chip size="small" color={hasDiff ? 'warning' : 'success'} label={hasDiff ? 'CHÊNH LỆCH — chờ xử lý' : 'ĐÃ ĐÓNG ĐƠN (DONE)'} />
          </Box>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead><TableRow>
                <TableCell sx={{ fontWeight: 600 }}>{t('common.name')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Số đặt</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Thực nhận</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Chênh lệch</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {summary.map((r, i) => (
                  <TableRow key={i} sx={{ bgcolor: r.diff === 0 ? '#F0FDF4' : r.diff < 0 ? '#FEF2F2' : '#FFFBEB' }}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell align="center">{r.ordered}</TableCell>
                    <TableCell align="center">{r.received}</TableCell>
                    <TableCell align="center">
                      {r.diff === 0
                        ? <Chip size="small" label="Đủ" sx={{ bgcolor: '#DCFCE7', color: '#166534' }} />
                        : r.diff < 0
                          ? <Chip size="small" color="error" label={`Thiếu ${-r.diff}`} />
                          : <Chip size="small" color="warning" label={`Thừa ${r.diff}`} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {hasDiff && <Alert severity="info" sx={{ mt: 2 }}>Bản ghi chênh lệch đã được tạo. Sang mục <b>Discrepancies</b> để theo dõi/giải quyết với Site.</Alert>}
          <Box sx={{ mt: 2 }}><Button variant="outlined" onClick={() => router.push('/warehouse/confirmed-pos')}>← Về danh sách PO</Button></Box>
        </>
      ) : !receiptId ? (
        <Button variant="contained" onClick={handleReceive} disabled={receiving} startIcon={receiving ? <CircularProgress size={18} /> : null}>
          {receiving ? 'Đang nhận...' : t('warehouse.receive.receiveGoodsBtn')}
        </Button>
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
                    <TableCell><TextField type="number" size="small" value={receivedQty[ri.id] ?? 0} onChange={e => setReceivedQty({...receivedQty, [ri.id]: Math.max(0, parseInt(e.target.value) || 0)})} disabled={confirming} inputProps={{ min: 0 }} sx={{ width: 100 }} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box sx={{ mt: 2 }}>
            <Button variant="contained" onClick={handleConfirm} disabled={confirming} startIcon={confirming ? <CircularProgress size={18} /> : null}>
              {confirming ? 'Đang xác nhận...' : t('warehouse.receive.confirmReceipt')}
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}

export default function ReceivePage() {
  return <ProtectedRoute allowedRoles={['WAREHOUSE']}><DashboardLayout><ReceiveContent /></DashboardLayout></ProtectedRoute>;
}
