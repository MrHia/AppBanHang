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
  IconButton, Collapse, TextField, Tooltip, Snackbar, Checkbox, FormControlLabel,
  Stepper, Step, StepLabel, Divider,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SendIcon from '@mui/icons-material/Send';
import RefreshIcon from '@mui/icons-material/Refresh';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { useRouter } from 'next/router';
import { requestApi, inquiryApi, siteMerchandiseApi, poApi } from 'src/api';

const C = {
  okBg: '#F0FDF4', ok: '#059669', warnBg: '#FFFBEB', warn: '#D97706',
  errBg: '#FEF2F2', err: '#DC2626', pendBg: '#F8FAFC', pend: '#64748B',
  headBg: '#F8FAFC', border: '#E2E8F0',
};

function rowStatus(chosen, requested) {
  if (chosen <= 0) return { label: 'Chưa chọn', color: 'default' };
  if (chosen >= requested) return { label: 'Đủ', color: 'success' };
  return { label: 'Thiếu', color: 'warning' };
}

// trạng thái 1 ô (mặt hàng × site) suy từ matrix.source
//  inquiry           -> đã phản hồi (tồn thực)
//  reference         -> chưa phản hồi (đang chờ)
//  reference_timeout -> quá hạn, dùng tồn tham khảo (vẫn cho đặt)
function cellStateFromMatrix(cell) {
  if (!cell || cell.source === 'none' || cell.source == null) return { state: 'PENDING', quantity: 0 };
  if (cell.source === 'inquiry') return { state: 'RESPONDED', quantity: cell.quantity ?? 0 };
  if (cell.source === 'reference_timeout') return { state: 'TIMEOUT', quantity: cell.quantity ?? 0 };
  return { state: 'PENDING', quantity: 0 }; // reference = chưa phản hồi
}

// ============================ BƯỚC 1: chọn site ============================
function Step1Row({ item, candidateSites, selectedSiteIds, onToggle, defaultOpen }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  const none = selectedSiteIds.length === 0;
  return (
    <>
      <TableRow hover sx={{ bgcolor: none ? '#FFFFFF' : '#EEF2FF', cursor: 'pointer', '& > td': { borderBottom: `1px solid ${C.border}` } }} onClick={() => setOpen(o => !o)}>
        <TableCell sx={{ width: 48 }}><IconButton size="small">{open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}</IconButton></TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{item.merchandiseCode}</Typography>
          <Typography variant="caption" color="text.secondary">{item.merchandiseName}</Typography>
        </TableCell>
        <TableCell align="center"><Chip size="small" variant="outlined" label={`${item.quantity} ${item.unit || ''}`} sx={{ height: 22, fontSize: '0.72rem' }} /></TableCell>
        <TableCell align="center">
          {none
            ? <Chip size="small" color="warning" label="⚠ chưa chọn site" sx={{ height: 22, fontSize: '0.72rem' }} />
            : <Typography variant="body2" fontWeight={700} color="primary.main">{selectedSiteIds.length} site</Typography>}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={4} sx={{ p: 0, borderBottom: open ? `1px solid ${C.border}` : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ bgcolor: '#FCFCFD', px: 6, py: 1.5 }}>
              {candidateSites.length === 0
                ? <Typography variant="caption" color="error.main">Không có site nào kinh doanh mặt hàng này.</Typography>
                : <>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Các site có <b>kinh doanh mặt hàng này</b> — tick chọn site muốn hỏi tồn kho:
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      {candidateSites.map(s => (
                        <FormControlLabel key={s.id}
                          control={<Checkbox checked={selectedSiteIds.includes(s.id)} onChange={() => onToggle(item.merchandiseId, s.id)} />}
                          label={
                            <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                              <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{s.code}</Typography>
                              <Typography variant="caption" color="text.secondary">{s.name}</Typography>
                            </Box>
                          } />
                      ))}
                    </Box>
                  </>}
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

// ============================ BƯỚC 2: dòng site ============================
function SiteSubRow({ site, cell, value, unit, ordered, onChange }) {
  const { state, quantity } = cell;
  // ĐÃ tạo PO cho ô này → khoá ô nhập, chỉ hiện số đã đặt (read-only)
  if (ordered > 0) {
    return (
      <TableRow sx={{ bgcolor: '#EFF6FF' }}>
        <TableCell sx={{ pl: 6, borderBottom: 'none' }}>
          <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{site.code}</Typography>
          <Typography variant="caption" color="text.secondary">{site.name}{site.country ? ` · ${site.country}` : ''}</Typography>
        </TableCell>
        <TableCell align="center" sx={{ borderBottom: 'none' }}>
          <Typography variant="body2" fontWeight={800} sx={{ color: C.ok }}>{quantity != null ? quantity : '—'}</Typography>
        </TableCell>
        <TableCell align="center" sx={{ borderBottom: 'none' }}>
          <Chip size="small" label={`Đã đặt ${ordered} ${unit}`} sx={{ height: 22, fontSize: '0.72rem', bgcolor: '#DBEAFE', color: '#1E40AF', fontWeight: 700 }} />
        </TableCell>
        <TableCell align="center" sx={{ borderBottom: 'none' }}>
          <Typography variant="caption" color="text.secondary">đã tạo PO</Typography>
        </TableCell>
      </TableRow>
    );
  }
  if (state === 'PENDING') {
    return (
      <TableRow sx={{ bgcolor: C.pendBg }}>
        <TableCell sx={{ pl: 6, borderBottom: 'none' }}>
          <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', color: C.pend }}>{site.code}</Typography>
          <Typography variant="caption" color="text.secondary">{site.name}{site.country ? ` · ${site.country}` : ''}</Typography>
        </TableCell>
        <TableCell align="center" sx={{ borderBottom: 'none' }}><Typography variant="body2" color="text.disabled">—</Typography></TableCell>
        <TableCell align="center" sx={{ borderBottom: 'none' }}>
          <Chip size="small" icon={<HourglassEmptyIcon sx={{ fontSize: 14 }} />} label="Đang chờ phản hồi" sx={{ height: 22, fontSize: '0.72rem', bgcolor: '#FEF3C7', color: '#92400E' }} />
        </TableCell>
        <TableCell sx={{ borderBottom: 'none' }} />
      </TableRow>
    );
  }
  const soldOut = quantity <= 0;
  const isTimeout = state === 'TIMEOUT';
  return (
    <TableRow sx={{ bgcolor: soldOut ? C.errBg : isTimeout ? C.warnBg : value > 0 ? C.okBg : '#FFFFFF' }}>
      <TableCell sx={{ pl: 6, borderBottom: 'none' }}>
        <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{site.code}</Typography>
        <Typography variant="caption" color="text.secondary">{site.name}{site.country ? ` · ${site.country}` : ''}</Typography>
      </TableCell>
      <TableCell align="center" sx={{ borderBottom: 'none' }}>
        <Typography variant="body2" fontWeight={800} sx={{ color: isTimeout ? C.err : C.ok }}>{quantity}</Typography>
        {isTimeout && <Typography variant="caption" sx={{ color: C.err }}>tham khảo (quá hạn)</Typography>}
      </TableCell>
      <TableCell align="center" sx={{ borderBottom: 'none' }}>
        {soldOut
          ? <Typography variant="caption" color="error.main" fontWeight={600}>— hết hàng —</Typography>
          : <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
              <TextField type="number" size="small" value={value} onChange={e => onChange(site.id, e.target.value)} inputProps={{ min: 0, max: quantity, style: { textAlign: 'center', width: 64 } }} />
              <Typography variant="caption" color="text.secondary">≤ {quantity} {unit}</Typography>
            </Box>}
      </TableCell>
      <TableCell align="center" sx={{ borderBottom: 'none' }}>
        {value > 0 && <Chip size="small" label={`đặt ${value}`} sx={{ height: 20, fontSize: '0.7rem', bgcolor: C.okBg, color: C.ok, fontWeight: 700 }} />}
      </TableCell>
    </TableRow>
  );
}

function Step2Row({ item, sites, matrix, orderMap, orderedByMerch, onQty, defaultOpen }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  const mine = orderMap[item.merchandiseId] || {};
  const ordered = orderedByMerch[item.merchandiseId] || {};
  // tổng "đã chọn đặt" = số ĐÃ đặt (PO) + số đang nhập
  const chosen = Object.values(ordered).reduce((s, v) => s + (v || 0), 0) + Object.values(mine).reduce((s, v) => s + (v || 0), 0);
  const cells = sites.map(s => ({ site: s, cell: cellStateFromMatrix(matrix[s.id]?.[item.merchandiseId]) }));
  const respondedCnt = cells.filter(c => c.cell.state !== 'PENDING').length;
  const pendingCnt = cells.length - respondedCnt;
  const st = respondedCnt === 0 ? { label: 'Đang chờ', color: 'info' } : rowStatus(chosen, item.quantity);
  const bg = respondedCnt === 0 ? C.pendBg : (chosen >= item.quantity && chosen > 0 ? C.okBg : chosen > 0 ? C.warnBg : '#FFFFFF');
  return (
    <>
      <TableRow hover sx={{ bgcolor: bg, cursor: 'pointer', '& > td': { borderBottom: `1px solid ${C.border}` } }} onClick={() => setOpen(o => !o)}>
        <TableCell sx={{ width: 48 }}><IconButton size="small">{open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}</IconButton></TableCell>
        <TableCell>
          <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{item.merchandiseCode}</Typography>
          <Typography variant="caption" color="text.secondary">{item.merchandiseName}</Typography>
        </TableCell>
        <TableCell align="center"><Chip size="small" variant="outlined" label={`${item.quantity} ${item.unit || ''}`} sx={{ height: 22, fontSize: '0.72rem' }} /></TableCell>
        <TableCell align="center">
          <Typography variant="body2" fontWeight={600}>{respondedCnt}/{cells.length} phản hồi</Typography>
          {pendingCnt > 0 && <Typography variant="caption" sx={{ color: C.warn }}>⏳ chờ {pendingCnt} site</Typography>}
        </TableCell>
        <TableCell align="center"><Typography variant="body2" fontWeight={800} sx={{ color: chosen >= item.quantity && chosen > 0 ? C.ok : chosen > 0 ? C.warn : 'text.disabled' }}>{chosen}/{item.quantity}</Typography></TableCell>
        <TableCell align="center"><Chip size="small" color={st.color} label={st.label} sx={{ height: 22, fontSize: '0.72rem' }} /></TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={6} sx={{ p: 0, borderBottom: open ? `1px solid ${C.border}` : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ bgcolor: '#FCFCFD', px: 1, py: 1 }}>
              <Table size="small">
                <TableHead><TableRow>
                  <TableCell sx={{ pl: 6, fontWeight: 700, color: 'text.secondary', borderBottom: 'none' }}>Site</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary', borderBottom: 'none' }}>Tồn kho</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: 'text.secondary', borderBottom: 'none' }}>Số lượng đặt</TableCell>
                  <TableCell sx={{ borderBottom: 'none' }} />
                </TableRow></TableHead>
                <TableBody>
                  {cells.map(({ site, cell }) => (
                    <SiteSubRow key={site.id} site={site} cell={cell} unit={item.unit || ''} value={mine[site.id] || 0}
                      ordered={ordered[site.id] || 0}
                      onChange={(sid, raw) => onQty(item.merchandiseId, sid, raw, cell.quantity || 0)} />
                  ))}
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

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
