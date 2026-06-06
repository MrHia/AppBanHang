import * as React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip, IconButton, Collapse, Box } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { poApi } from 'src/api';
import { useRouter } from 'next/router';
import { useTranslation } from 'src/i18n/useTranslation';

const statusColor = { DRAFT: 'default', SENT: 'warning', CONFIRMED: 'info', REJECTED: 'error', DONE: 'success' };

function ReqGroup({ reqCode, pos, defaultOpen, onReceive }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  const confirmedCount = pos.filter(p => p.status === 'CONFIRMED').length;
  const doneCount = pos.filter(p => p.status === 'DONE').length;
  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer', bgcolor: '#F8FAFC', '& > td': { borderBottom: '1px solid #E2E8F0' } }} onClick={() => setOpen(o => !o)}>
        <TableCell sx={{ width: 48 }}><IconButton size="small">{open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}</IconButton></TableCell>
        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>{reqCode || '(không có REQ)'}</TableCell>
        <TableCell>{pos.length} PO</TableCell>
        <TableCell>
          {confirmedCount > 0 && <Chip size="small" color="info" label={`${confirmedCount} chờ nhận`} sx={{ mr: 0.5 }} />}
          {doneCount > 0 && <Chip size="small" color="success" label={`${doneCount} đã nhận`} />}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell colSpan={4} sx={{ p: 0, borderBottom: open ? '1px solid #E2E8F0' : 'none' }}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ bgcolor: '#FCFCFD', px: 2, py: 1 }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Mã PO</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Site</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Vận chuyển</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }} align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pos.map(p => (
                    <TableRow key={p.id}>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{p.code}</TableCell>
                      <TableCell>{p.siteName}</TableCell>
                      <TableCell>{p.deliveryMethod}</TableCell>
                      <TableCell><Chip size="small" color={statusColor[p.status] || 'default'} label={p.status} /></TableCell>
                      <TableCell align="right">
                        {p.status === 'CONFIRMED'
                          ? <Button size="small" variant="contained" onClick={() => onReceive(p.id)}>Nhận hàng</Button>
                          : p.status === 'DONE'
                            ? <Typography variant="caption" color="success.main">Đã nhận</Typography>
                            : <Typography variant="caption" color="text.disabled">—</Typography>}
                      </TableCell>
                    </TableRow>
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

function ConfirmedPOs() {
  const { t } = useTranslation();
  const [pos, setPOs] = React.useState([]);
  const router = useRouter();

  const loadPOs = React.useCallback(() => {
    poApi.getAll().then(r => setPOs(Array.isArray(r?.data) ? r.data : (Array.isArray(r) ? r : []))).catch(console.error);
  }, []);

  React.useEffect(() => { loadPOs(); }, [loadPOs]);
  React.useEffect(() => { const interval = setInterval(loadPOs, 15000); return () => clearInterval(interval); }, [loadPOs]);

  // nhóm PO theo REQ; REQ có PO mới (id lớn) lên trước
  const groups = React.useMemo(() => {
    const map = new Map();
    pos.forEach(p => {
      const key = p.processRequestCode || '—';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(p);
    });
    // Math.max(...[]) là -Infinity; defensive fallback về 0.
    // Tie-breaker theo reqCode (numeric collation) cho stable order.
    const arr = [...map.entries()].map(([reqCode, list]) => {
      const ids = list.map(x => x.id || 0);
      return { reqCode, pos: list, maxId: ids.length ? Math.max(...ids) : 0 };
    });
    arr.sort((a, b) =>
      (b.maxId - a.maxId) ||
      String(a.reqCode || '').localeCompare(String(b.reqCode || ''), undefined, { numeric: true })
    );
    return arr;
  }, [pos]);

  return (
    <Container maxWidth="xl">
      <Typography variant="h4" sx={{ mb: 1, fontWeight: 700 }}>{t('warehouse.confirmedPos.title')}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Đơn hàng nhóm theo mã yêu cầu (REQ). Mở từng REQ để xem các PO theo site và nhận hàng (chỉ PO đã được site xác nhận).</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ width: 48 }} />
              <TableCell sx={{ fontWeight: 600 }}>Mã yêu cầu (REQ)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Số PO</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Tình trạng</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.map((g, i) => (
              <ReqGroup key={g.reqCode} reqCode={g.reqCode} pos={g.pos} defaultOpen={i === 0} onReceive={(id) => router.push(`/warehouse/receive/${id}`)} />
            ))}
            {groups.length === 0 && <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>Chưa có đơn hàng nào.</TableCell></TableRow>}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}

export default function ConfirmedPOsPage() {
  return <ProtectedRoute allowedRoles={['WAREHOUSE']}><DashboardLayout><ConfirmedPOs /></DashboardLayout></ProtectedRoute>;
}
