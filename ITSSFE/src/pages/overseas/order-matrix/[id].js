// ============================================================================
//  Đặt hàng nhập khẩu — 1-step (rút gọn, không hỏi tồn).
//  Backend trả thẳng danh sách (site × method) đúng hẹn + tồn kho cho từng mặt hàng
//  qua endpoint /requests/{id}/site-options.
//  User nhập số lượng vào dòng muốn đặt → group theo (siteId, method) → tạo PO batch.
// ============================================================================
import * as React from 'react';
import {
  Container, Typography, Card, Box, Button, Chip, Alert, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Tooltip, Snackbar, TextField, Divider,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import FlightIcon from '@mui/icons-material/Flight';
import DirectionsBoatIcon from '@mui/icons-material/DirectionsBoat';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { useRouter } from 'next/router';
import { requestApi } from 'src/api';
import { C } from 'src/components/overseas/matrixUtils';

const rowKey = (siteId, method) => `${siteId}-${method}`;

function OrderMatrixContent() {
  const router = useRouter();
  const { id } = router.query;

  const [request, setRequest] = React.useState(null);
  const [options, setOptions] = React.useState([]);   // SiteOptionDTO[]
  const [orderMap, setOrderMap] = React.useState({}); // {merchId: {"siteId-method": qty}}
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const [error, setError] = React.useState('');

  const loadAll = React.useCallback(async (rid) => {
    setLoading(true);
    try {
      const [r, opts] = await Promise.all([
        requestApi.getById(rid).catch(() => null),
        requestApi.getSiteOptions(rid).catch(() => []),
      ]);
      setRequest(r);
      setOptions(Array.isArray(opts) ? opts : []);
    } catch (e) {
      setError(e?.message || 'Không tải được dữ liệu');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { if (id) loadAll(id); }, [id, loadAll]);

  const handleQty = (merchId, siteId, method, raw, max) => {
    const v = Math.max(0, Math.min(max, parseInt(raw, 10) || 0));
    setOrderMap(prev => ({
      ...prev,
      [merchId]: { ...(prev[merchId] || {}), [rowKey(siteId, method)]: v }
    }));
  };

  // Tổng đã đặt theo (merchId) → kiểm tra đủ với requestedQty
  const totalsByMerch = React.useMemo(() => {
    const t = {};
    Object.entries(orderMap).forEach(([mid, per]) => {
      t[mid] = Object.values(per).reduce((s, q) => s + (q || 0), 0);
    });
    return t;
  }, [orderMap]);

  // Tổng quan: bao nhiêu mặt hàng đã đặt đủ
  const allFilled = options.length > 0 && options.every(o =>
    (totalsByMerch[o.merchandiseId] || 0) >= (o.requestedQty || 0)
  );

  // Group theo (siteId, method) để tạo PO batch
  const ordersByPo = React.useMemo(() => {
    const acc = {}; // key = "siteId-method", value = { siteId, method, expected, items: [] }
    options.forEach(o => {
      const per = orderMap[o.merchandiseId] || {};
      o.rows?.forEach(row => {
        const qty = per[rowKey(row.siteId, row.deliveryMethod)] || 0;
        if (qty <= 0) return;
        const key = rowKey(row.siteId, row.deliveryMethod);
        if (!acc[key]) {
          acc[key] = {
            siteId: row.siteId,
            siteCode: row.siteCode,
            method: row.deliveryMethod,
            expectedDelivery: row.expectedDelivery,
            items: [],
          };
        }
        acc[key].items.push({ merchandiseId: o.merchandiseId, quantity: qty, unit: o.unit });
      });
    });
    return acc;
  }, [options, orderMap]);

  const poCount = Object.keys(ordersByPo).length;
  const totalUnits = Object.values(ordersByPo).flatMap(p => p.items).reduce((s, i) => s + i.quantity, 0);

  const handleCreatePO = async () => {
    // Validate đủ số lượng cho mỗi mặt hàng
    const missing = options.filter(o => (totalsByMerch[o.merchandiseId] || 0) < (o.requestedQty || 0));
    if (missing.length > 0) {
      const names = missing.map(o => `${o.merchandiseCode} (cần ${o.requestedQty}, đặt ${totalsByMerch[o.merchandiseId] || 0})`).join('; ');
      setError(`Chưa đủ số lượng nhập khẩu: ${names}`);
      return;
    }
    setSubmitting(true);
    try {
      const orders = Object.values(ordersByPo).map(p => ({
        siteId: p.siteId,
        deliveryMethod: p.method,
        expectedDelivery: p.expectedDelivery,
        items: p.items,
      }));
      const res = await requestApi.createPOBatch(id, { orders });
      const n = Array.isArray(res) ? res.length : poCount;
      setToast(`Đã tạo ${n} Purchase Order.`);
      setTimeout(() => router.push('/overseas/requests'), 1200);
    } catch (e) {
      setError(e?.data?.message || e?.message || 'Tạo PO thất bại');
    } finally { setSubmitting(false); }
  };

  if (loading) return <LinearProgress />;
  if (!request) return <Container maxWidth="lg"><Typography variant="h6" color="text.secondary" sx={{ mt: 4 }}>Không tìm thấy yêu cầu</Typography></Container>;

  // PO chỉ được nhập khi request còn xử lý (PENDING/PROCESSING).
  // Khi đã DONE (PO đã gửi) hoặc CANCELLED → khoá form, không hiện textbox.
  const isLocked = request.status === 'DONE' || request.status === 'CANCELLED';
  const lockedReason = request.status === 'DONE'
    ? 'Purchase Order đã được tạo và gửi cho yêu cầu này — không thể nhập lại số lượng.'
    : 'Yêu cầu đã bị hủy — không thể tạo PO mới.';
  const lockedSeverity = request.status === 'CANCELLED' ? 'error' : 'success';

  return (
    <Container maxWidth="lg" sx={{ pb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2, mb: 2, flexWrap: 'wrap' }}>
        <Inventory2Icon color="primary" />
        <Typography variant="h5" fontWeight={800} color="primary.main">Đặt hàng nhập khẩu</Typography>
        <Chip label={request.code} sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: '#EEF2FF', color: '#4338CA' }} />
        <Chip
          label={request.status}
          size="small"
          color={request.status === 'DONE' ? 'success' : request.status === 'CANCELLED' ? 'error' : request.status === 'PROCESSING' ? 'info' : 'warning'}
        />
        {request.desiredDate && (
          <Chip label={`Cần nhận trước: ${request.desiredDate}`} variant="outlined" color="primary" />
        )}
      </Box>

      {isLocked ? (
        <Alert severity={lockedSeverity} sx={{ mb: 2 }}>{lockedReason}</Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          Mỗi mặt hàng hiện danh sách <b>site đáp ứng được ngày nhận</b> kèm tồn kho, phương thức vận chuyển và ngày dự kiến giao.
          Bạn nhập số lượng vào dòng muốn đặt — có thể chia nhiều site nếu 1 site không đủ.
          Số lượng phải <b>&gt; 0</b> và <b>≤ tồn kho</b>; tổng số đặt phải <b>≥ số sales yêu cầu</b>.
        </Alert>
      )}

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {options.length === 0 && (
        <Alert severity="warning">Yêu cầu chưa có mặt hàng nào.</Alert>
      )}

      {options.map(opt => {
        const totalOrdered = totalsByMerch[opt.merchandiseId] || 0;
        const enough = totalOrdered >= (opt.requestedQty || 0);
        // Ưu tiên (theo UC): SHIP > AIR, sau đó tồn kho nhiều nhất trước.
        // Tie-breaker theo siteCode (numeric collation) để thứ tự ổn định khi
        // 2 site có cùng stock — tránh việc hàng nhảy chỗ mỗi lần reload.
        const sortedRows = [...(opt.rows || [])].sort((a, b) => {
          if (a.deliveryMethod !== b.deliveryMethod) return a.deliveryMethod === 'SHIP' ? -1 : 1;
          const stockDiff = (b.stockQuantity || 0) - (a.stockQuantity || 0);
          if (stockDiff !== 0) return stockDiff;
          return String(a.siteCode || '').localeCompare(String(b.siteCode || ''), undefined, { numeric: true });
        });
        return (
          <Card key={opt.merchandiseId} elevation={0} sx={{ border: `1px solid ${C.border}`, mb: 3 }}>
            <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Box sx={{ flex: 1 }}>
                <Typography fontWeight={700}>{opt.merchandiseCode} — {opt.merchandiseName}</Typography>
                <Typography variant="caption" color="text.secondary">Sales yêu cầu: <b>{opt.requestedQty}</b> {opt.unit}</Typography>
              </Box>
              <Chip
                label={`Đã đặt ${totalOrdered}/${opt.requestedQty}`}
                color={enough ? 'success' : (totalOrdered > 0 ? 'warning' : 'default')}
                variant={enough ? 'filled' : 'outlined'}
              />
            </Box>
            <Divider />
            {sortedRows.length === 0 ? (
              <Box sx={{ p: 3 }}>
                <Alert severity="error">Không có site nào đáp ứng được ngày nhận mong muốn cho mặt hàng này.</Alert>
              </Box>
            ) : (
              <TableContainer component={Paper} elevation={0}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: C.headBg }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Site</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Quốc gia</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="right">Tồn kho</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Phương thức</TableCell>
                      <TableCell sx={{ fontWeight: 700 }} align="center">Ngày dự kiến giao</TableCell>
                      {!isLocked && (
                        <TableCell sx={{ fontWeight: 700 }} align="center">Số lượng đặt</TableCell>
                      )}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {sortedRows.map(row => {
                      const k = rowKey(row.siteId, row.deliveryMethod);
                      const v = (orderMap[opt.merchandiseId] || {})[k] || 0;
                      const isAir = row.deliveryMethod === 'AIR';
                      return (
                        <TableRow key={`${opt.merchandiseId}-${k}`} hover>
                          <TableCell>
                            <Typography fontWeight={600}>{row.siteCode}</Typography>
                            <Typography variant="caption" color="text.secondary">{row.siteName}</Typography>
                          </TableCell>
                          <TableCell>{row.siteCountry}</TableCell>
                          <TableCell align="right"><b>{row.stockQuantity}</b></TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              icon={isAir ? <FlightIcon /> : <DirectionsBoatIcon />}
                              label={isAir ? 'Hàng không' : 'Tàu biển'}
                              color={isAir ? 'warning' : 'info'}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell align="center">
                            <Typography variant="body2">{row.expectedDelivery}</Typography>
                            <Typography variant="caption" color="text.secondary">({row.deliveryDays} ngày)</Typography>
                          </TableCell>
                          {!isLocked && (
                            <TableCell align="center">
                              <TextField
                                size="small"
                                type="number"
                                inputProps={{ min: 0, max: row.stockQuantity, style: { textAlign: 'right', width: 70 } }}
                                value={v || ''}
                                onChange={(e) => handleQty(opt.merchandiseId, row.siteId, row.deliveryMethod, e.target.value, row.stockQuantity)}
                                error={v > row.stockQuantity}
                                helperText={v > row.stockQuantity ? `>${row.stockQuantity}` : ''}
                              />
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Card>
        );
      })}

      {!isLocked && (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', position: 'sticky', bottom: 0, bgcolor: '#fff', borderTop: `1px solid ${C.border}`, py: 2, px: 1 }}>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip label={`${poCount} PO sẽ tạo`} variant="outlined" />
            <Chip label={`Tổng ${totalUnits} đơn vị`} variant="outlined" color={totalUnits > 0 ? 'primary' : 'default'} />
            {!allFilled && totalUnits > 0 && (
              <Chip label="Chưa đủ số lượng yêu cầu" color="warning" />
            )}
          </Box>
          <Tooltip title={poCount === 0 ? 'Nhập số lượng cho ít nhất 1 dòng' : ''}>
            <span>
              <Button
                variant="contained"
                size="large"
                startIcon={<ShoppingCartIcon />}
                disabled={poCount === 0 || submitting || !allFilled}
                onClick={handleCreatePO}
              >
                {submitting ? 'Đang tạo...' : `Gửi đặt hàng (${poCount} PO)`}
              </Button>
            </span>
          </Tooltip>
        </Box>
      )}

      <Box sx={{ mt: 2 }}>
        <Button onClick={() => router.back()}>← Quay lại danh sách</Button>
      </Box>
      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast('')} message={toast} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Container>
  );
}

export default function OrderMatrixPage() {
  return (
    <ProtectedRoute allowedRoles={['OVERSEAS']}>
      <DashboardLayout>
        <OrderMatrixContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
