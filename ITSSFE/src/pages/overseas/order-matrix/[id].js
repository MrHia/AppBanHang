// ============================================================================
//  Đặt hàng nhập khẩu — trang 2 bước (multi-site)
//  Bước 1: Chọn nhiều site (có kinh doanh mặt hàng) để gửi yêu cầu hỏi tồn kho.
//  Bước 2: Chờ phản hồi & Đặt hàng — site chưa trả "Đang chờ", site đã trả hiện
//          tồn kho + ô nhập số lượng đặt (≤ tồn). Gom theo site → tạo Purchase Order.
//  Trạng thái nằm ở CẤP Ô (mặt hàng × site) nên thể hiện được cả PARTIAL.
// ============================================================================
import * as React from 'react';
import {
  Container, Typography, Card, Box, Button, Chip, Alert, LinearProgress,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Tooltip, Snackbar, Stepper, Step, StepLabel,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { useRouter } from 'next/router';
import { requestApi, inquiryApi, siteMerchandiseApi, poApi } from 'src/api';
import Step1Row from 'src/components/overseas/Step1Row';
import Step2Row from 'src/components/overseas/Step2Row';
import { C } from 'src/components/overseas/matrixUtils';

// ============================ TRANG CHÍNH ============================
function OrderMatrixContent() {
  const router = useRouter();
  const { id } = router.query;

  const [request, setRequest] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [siteMerch, setSiteMerch] = React.useState([]); // [{siteId, siteCode, siteName, merchandiseId, isActive}]
  const [picks, setPicks] = React.useState([]);         // getSitePicks: [{merchandiseId, siteId, siteCode, siteName, siteCountry, status}]
  const [statusMap, setStatusMap] = React.useState({}); // {siteId: {status, respondedCount, totalItems, timeoutAt}}
  const [matrix, setMatrix] = React.useState({});       // {siteId: {merchId: {quantity, source}}}

  const [step, setStep] = React.useState(0);
  const [selected, setSelected] = React.useState({});   // {merchId: [siteId,...]} — Bước 1
  const [orderMap, setOrderMap] = React.useState({});   // {merchId: {siteId: qty}} — Bước 2 (đang nhập)
  const [orderedMap, setOrderedMap] = React.useState({}); // {merchId: {siteId: qty}} — ĐÃ tạo PO (khoá)
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [toast, setToast] = React.useState('');
  const [error, setError] = React.useState('');

  const sentAlready = picks.some(p => p.status !== 'PICKED');

  const loadStep2 = React.useCallback(async (rid) => {
    const [st, mx, pos] = await Promise.all([
      requestApi.getInquiryStatus(rid).catch(() => ({})),
      inquiryApi.getMatrix(rid).catch(() => ({})),
      poApi.getByRequest(rid).catch(() => []),
    ]);
    setStatusMap((st && typeof st === 'object' && !Array.isArray(st)) ? st : {});
    setMatrix((mx && typeof mx === 'object' && !Array.isArray(mx)) ? mx : {});

    // Số đã ĐẶT (đã tạo PO) theo từng (mặt hàng × site) → để khoá ô + hiển thị
    const posArr = Array.isArray(pos) ? pos : (Array.isArray(pos?.data) ? pos.data : []);
    const om = {};
    await Promise.all(posArr.map(async (po) => {
      const det = await poApi.getDetails(po.id).catch(() => []);
      const dets = Array.isArray(det) ? det : (Array.isArray(det?.data) ? det.data : []);
      dets.forEach(d => {
        if (!om[d.merchandiseId]) om[d.merchandiseId] = {};
        om[d.merchandiseId][po.siteId] = (om[d.merchandiseId][po.siteId] || 0) + (d.quantity || 0);
      });
    }));
    setOrderedMap(om);
  }, []);

  const loadAll = React.useCallback(async (rid, isRefresh) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [r, it, sm, pk] = await Promise.all([
        requestApi.getById(rid).catch(() => null),
        requestApi.getItems(rid).catch(() => []),
        siteMerchandiseApi.getAll().catch(() => []),
        requestApi.getSitePicks(rid).catch(() => []),
      ]);
      setRequest(r);
      setItems(Array.isArray(it) ? it : []);
      setSiteMerch(Array.isArray(sm) ? sm : []);
      const picksArr = Array.isArray(pk) ? pk : [];
      setPicks(picksArr);

      const sent = picksArr.some(p => p.status !== 'PICKED');
      if (sent) {
        await loadStep2(rid);
        setStep(1);
      } else {
        // prefill lựa chọn đã lưu (nếu có) cho Bước 1
        const sel = {};
        picksArr.forEach(p => { (sel[p.merchandiseId] = sel[p.merchandiseId] || []).push(p.siteId); });
        setSelected(sel);
        setStep(0);
      }
    } catch (e) {
      setError(e?.message || 'Không tải được dữ liệu');
    } finally {
      if (isRefresh) setRefreshing(false); else setLoading(false);
    }
  }, [loadStep2]);

  React.useEffect(() => { if (id) loadAll(id, false); }, [id, loadAll]);

  // auto-refresh trạng thái phản hồi ở Bước 2
  React.useEffect(() => {
    if (step !== 1 || !id) return;
    const t = setInterval(() => { setRefreshing(true); loadStep2(id).finally(() => setRefreshing(false)); }, 15000);
    return () => clearInterval(t);
  }, [step, id, loadStep2]);

  // site có kinh doanh từng mặt hàng
  const candidatesByMerch = React.useMemo(() => {
    const m = {};
    siteMerch.filter(s => s.isActive !== false).forEach(s => {
      (m[s.merchandiseId] = m[s.merchandiseId] || []).push({ id: s.siteId, code: s.siteCode, name: s.siteName });
    });
    return m;
  }, [siteMerch]);

  // site đã chọn cho từng mặt hàng (Bước 2, từ server picks)
  const picksByMerch = React.useMemo(() => {
    const m = {};
    picks.forEach(p => {
      (m[p.merchandiseId] = m[p.merchandiseId] || []).push({ id: p.siteId, code: p.siteCode, name: p.siteName, country: p.siteCountry });
    });
    return m;
  }, [picks]);

  const toggleSite = (merchId, siteId) => setSelected(prev => {
    const cur = prev[merchId] || [];
    return { ...prev, [merchId]: cur.includes(siteId) ? cur.filter(x => x !== siteId) : [...cur, siteId] };
  });

  const merchWithSite = items.filter(i => (selected[i.merchandiseId] || []).length > 0).length;
  const totalSelectedSites = React.useMemo(() => new Set(Object.values(selected).flat()).size, [selected]);

  const handleSend = async () => {
    const payload = [];
    Object.entries(selected).forEach(([merchId, siteIds]) => siteIds.forEach(siteId => payload.push({ merchandiseId: Number(merchId), siteId })));
    if (payload.length === 0) { setError('Hãy chọn ít nhất 1 site cho 1 mặt hàng'); return; }
    setSubmitting(true);
    try {
      await requestApi.saveSitePicks(id, payload);
      await requestApi.sendInquiries(id);
      setToast('Đã gửi yêu cầu hỏi tồn kho tới các site.');
      await loadAll(id, true);
    } catch (e) {
      setError(e?.data?.message || e?.message || 'Gửi yêu cầu thất bại');
    } finally { setSubmitting(false); }
  };

  const handleQty = (merchId, siteId, raw, max) => {
    const v = Math.max(0, Math.min(max, parseInt(raw, 10) || 0));
    setOrderMap(prev => ({ ...prev, [merchId]: { ...(prev[merchId] || {}), [siteId]: v } }));
  };

  const ordersBySite = React.useMemo(() => {
    const acc = {};
    Object.entries(orderMap).forEach(([merchId, per]) => {
      const it = items.find(i => String(i.merchandiseId) === String(merchId));
      Object.entries(per).forEach(([siteId, qty]) => {
        if (!qty || qty <= 0) return;
        (acc[siteId] = acc[siteId] || []).push({ merchandiseId: Number(merchId), quantity: qty, unit: it?.unit || 'piece' });
      });
    });
    return acc;
  }, [orderMap, items]);

  const totalUnits = Object.values(ordersBySite).flat().reduce((s, i) => s + i.quantity, 0);
  const poSites = Object.keys(ordersBySite).length;

  const handleCreatePO = async () => {
    if (poSites === 0) return;
    setSubmitting(true);
    try {
      const orders = Object.entries(ordersBySite).map(([siteId, lineItems]) => ({
        siteId: Number(siteId), deliveryMethod: 'SHIP', expectedDelivery: null, items: lineItems,
      }));
      const res = await requestApi.createPOBatch(id, { orders });
      const n = Array.isArray(res) ? res.length : poSites;
      setToast(`Đã tạo ${n} Purchase Order.`);
      setOrderMap({});
      await loadStep2(id); // nạp lại → các ô vừa đặt sẽ khoá và hiện "Đã đặt X"
    } catch (e) {
      setError(e?.data?.message || e?.message || 'Tạo PO thất bại');
    } finally { setSubmitting(false); }
  };

  // tiến độ phản hồi (Bước 2)
  const inquiredSiteIds = React.useMemo(() => [...new Set(picks.map(p => p.siteId))], [picks]);
  const respondedSiteCount = inquiredSiteIds.filter(sid => {
    const s = statusMap[sid]?.status;
    return s === 'RESPONDED' || s === 'TIMEOUT' || s === 'PARTIAL';
  }).length;

  if (loading) return <LinearProgress />;
  if (!request) return <Container maxWidth="lg"><Typography variant="h6" color="text.secondary" sx={{ mt: 4 }}>Không tìm thấy yêu cầu</Typography></Container>;

  return (
    <Container maxWidth="lg" sx={{ pb: 6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mt: 2, mb: 2 }}>
        <Inventory2Icon color="primary" />
        <Typography variant="h5" fontWeight={800} color="primary.main">Xử lý yêu cầu đặt hàng nhập khẩu</Typography>
        <Chip label={request.code} sx={{ fontFamily: 'monospace', fontWeight: 700, bgcolor: '#EEF2FF', color: '#4338CA' }} />
      </Box>

      <Card elevation={0} sx={{ border: `1px solid ${C.border}`, p: 2, mb: 3 }}>
        <Stepper activeStep={step} alternativeLabel>
          <Step><StepLabel>Chọn site hỏi tồn kho</StepLabel></Step>
          <Step><StepLabel>Chờ phản hồi & Đặt hàng</StepLabel></Step>
        </Stepper>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {step === 0 && (
        <>
          <Alert severity="info" sx={{ mb: 2 }}>Mở từng mặt hàng, tick các <b>site có kinh doanh mặt hàng đó</b> muốn gửi yêu cầu hỏi tồn kho. Một mặt hàng có thể hỏi <b>nhiều site</b>.</Alert>
          <Card elevation={0} sx={{ border: `1px solid ${C.border}`, mb: 3 }}>
            <TableContainer component={Paper} elevation={0}><Table>
              <TableHead sx={{ bgcolor: C.headBg }}><TableRow>
                <TableCell sx={{ width: 48 }} />
                <TableCell sx={{ fontWeight: 700 }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Yêu cầu</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Site đã chọn</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {items.map((item, i) => (
                  <Step1Row key={item.merchandiseId} item={item} candidateSites={candidatesByMerch[item.merchandiseId] || []}
                    selectedSiteIds={selected[item.merchandiseId] || []} onToggle={toggleSite} defaultOpen={i === 0} />
                ))}
                {items.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}><Typography color="text.secondary">Chưa có sản phẩm.</Typography></TableCell></TableRow>}
              </TableBody>
            </Table></TableContainer>
          </Card>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', position: 'sticky', bottom: 0, bgcolor: '#fff', borderTop: `1px solid ${C.border}`, py: 2, px: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Chip label={`${merchWithSite}/${items.length} mặt hàng đã chọn site`} variant="outlined" />
              <Chip label={`${totalSelectedSites} site sẽ nhận yêu cầu`} variant="outlined" color={totalSelectedSites > 0 ? 'primary' : 'default'} />
            </Box>
            <Tooltip title={merchWithSite === 0 ? 'Hãy chọn ít nhất 1 site' : ''}><span>
              <Button variant="contained" size="large" startIcon={<SendIcon />} disabled={merchWithSite === 0 || submitting} onClick={handleSend}>
                {submitting ? 'Đang gửi...' : 'Gửi yêu cầu lấy tồn kho →'}
              </Button>
            </span></Tooltip>
          </Box>
        </>
      )}

      {step === 1 && (
        <>
          <Card elevation={0} sx={{ border: `1px solid ${C.border}`, p: 2, mb: 2 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', mb: 1 }}>
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>Tiến độ phản hồi từ các site</Typography>
                <Typography variant="caption" color="text.secondary">Đã gửi yêu cầu tới <b>{inquiredSiteIds.length}</b> site · mỗi site có 48h để phản hồi. Mở lại trang để cập nhật.</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip color={respondedSiteCount >= inquiredSiteIds.length && inquiredSiteIds.length > 0 ? 'success' : 'info'} label={`Đã phản hồi ${respondedSiteCount}/${inquiredSiteIds.length} site`} />
                <Button size="small" variant="outlined" startIcon={<RefreshIcon />} disabled={refreshing} onClick={() => { setRefreshing(true); loadStep2(id).finally(() => setRefreshing(false)); }}>
                  {refreshing ? 'Đang làm mới...' : 'Làm mới'}
                </Button>
              </Box>
            </Box>
            <LinearProgress variant="determinate" value={inquiredSiteIds.length ? Math.round(respondedSiteCount / inquiredSiteIds.length * 100) : 0} sx={{ height: 6, borderRadius: 3 }} />
          </Card>

          {respondedSiteCount === 0
            ? <Alert severity="warning" sx={{ mb: 2 }}>⏳ <b>Đang chờ các site phản hồi.</b> Khi một site gửi tồn kho về, dòng tương ứng sẽ mở ô nhập số lượng. Site chưa trả hiển thị <b>"Đang chờ phản hồi"</b>.</Alert>
            : <Alert severity="success" sx={{ mb: 2 }}>Đã có <b>{respondedSiteCount}/{inquiredSiteIds.length}</b> site phản hồi. Nhập số lượng đặt cho site đã có tồn (≤ tồn). Site chưa trả vẫn để <b>"Đang chờ"</b>.</Alert>}

          <Card elevation={0} sx={{ border: `1px solid ${C.border}`, mb: 3 }}>
            <TableContainer component={Paper} elevation={0}><Table>
              <TableHead sx={{ bgcolor: C.headBg }}><TableRow>
                <TableCell sx={{ width: 48 }} />
                <TableCell sx={{ fontWeight: 700 }}>Sản phẩm</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Yêu cầu</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Phản hồi</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Đã chọn đặt</TableCell>
                <TableCell sx={{ fontWeight: 700 }} align="center">Trạng thái</TableCell>
              </TableRow></TableHead>
              <TableBody>
                {items.map((item, i) => (
                  <Step2Row key={item.merchandiseId} item={item} sites={picksByMerch[item.merchandiseId] || []}
                    matrix={matrix} orderMap={orderMap} orderedByMerch={orderedMap} onQty={handleQty} defaultOpen={i === 0} />
                ))}
              </TableBody>
            </Table></TableContainer>
          </Card>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap', position: 'sticky', bottom: 0, bgcolor: '#fff', borderTop: `1px solid ${C.border}`, py: 2, px: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
              <Chip label={`${poSites} site sẽ nhận PO`} variant="outlined" />
              <Chip label={`Tổng ${totalUnits} đơn vị`} variant="outlined" color={totalUnits > 0 ? 'primary' : 'default'} />
            </Box>
            <Tooltip title={poSites === 0 ? 'Chưa có site nào để tạo PO (chờ phản hồi hoặc nhập số lượng)' : ''}><span>
              <Button variant="contained" size="large" startIcon={<ShoppingCartIcon />} disabled={poSites === 0 || submitting} onClick={handleCreatePO}>
                {submitting ? 'Đang tạo...' : `Tạo Purchase Order${poSites ? ` (${poSites})` : ''}`}
              </Button>
            </span></Tooltip>
          </Box>
        </>
      )}

      <Box sx={{ mt: 2 }}><Button onClick={() => router.back()}>← Quay lại danh sách</Button></Box>
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
