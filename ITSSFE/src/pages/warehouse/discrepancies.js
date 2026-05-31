import * as React from 'react';
import {
  Container, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert,
  Box, Chip, CircularProgress, IconButton, Collapse
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { warehouseApi } from 'src/api';
import { useAuth } from 'src/contexts/auth-context';
import { useTranslation } from 'src/i18n/useTranslation';

const statusColor = (s) => s === 'OPEN' ? 'error' : s === 'RESOLVING' ? 'warning' : s === 'RESOLVED' ? 'success' : 'default';
const getOrdered = (d) => (d.orderedQuantity != null ? d.orderedQuantity : (d.shortage || 0) + (d.excess || 0));
const getReceived = (d) => {
  if (d.receivedQuantity != null) return d.receivedQuantity;
  const o = getOrdered(d);
  if (d.shortage > 0) return o - d.shortage;
  if (d.excess > 0) return o + d.excess;
  return o;
};
const getDiscDisplay = (d) => d.shortage > 0 ? `-${d.shortage}` : d.excess > 0 ? `+${d.excess}` : '0';

// Một nhóm REQ (dropdown) chứa các chênh lệch
function ReqGroup({ reqCode, discs, defaultOpen, onResolve }) {
  const [open, setOpen] = React.useState(!!defaultOpen);
  const openCount = discs.filter(d => d.status !== 'RESOLVED').length;
  return (
    <>
      <TableRow hover sx={{ cursor: 'pointer', bgcolor: '#F8FAFC', '& > td': { borderBottom: '1px solid #E2E8F0' } }} onClick={() => setOpen(o => !o)}>
        <TableCell sx={{ width: 48 }}><IconButton size="small">{open ? <KeyboardArrowDownIcon /> : <KeyboardArrowRightIcon />}</IconButton></TableCell>
        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700, color: 'primary.main' }}>{reqCode || '(không có REQ)'}</TableCell>
        <TableCell>{discs.length} chênh lệch</TableCell>
        <TableCell>
          {openCount > 0
            ? <Chip size="small" color="error" label={`${openCount} chờ xử lý`} />
            : <Chip size="small" color="success" label="Đã xử lý hết" />}
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
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Mặt hàng</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }} align="center">Đặt</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }} align="center">Thực nhận</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }} align="center">Chênh lệch</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }}>Trạng thái</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: 'text.secondary' }} align="right">Thao tác</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {discs.map(d => (
                    <TableRow key={d.id}>
                      <TableCell sx={{ fontFamily: 'monospace' }}>{d.poCode || '—'}</TableCell>
                      <TableCell>{d.siteName || '—'}</TableCell>
                      <TableCell>{d.merchandiseName}</TableCell>
                      <TableCell align="center">{getOrdered(d)}</TableCell>
                      <TableCell align="center">{getReceived(d)}</TableCell>
                      <TableCell align="center" sx={{ color: d.shortage > 0 ? 'error.main' : 'warning.main', fontWeight: 700 }}>{getDiscDisplay(d)}</TableCell>
                      <TableCell><Chip size="small" label={d.status} color={statusColor(d.status)} /></TableCell>
                      <TableCell align="right">
                        {d.status !== 'RESOLVED'
                          ? <Button size="small" variant="contained" onClick={() => onResolve(d)}>Xử lý</Button>
                          : <Typography variant="caption" color="success.main">Đã xử lý</Typography>}
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

function DiscrepanciesContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [discrepancies, setDiscrepancies] = React.useState([]);
  const [open, setOpen] = React.useState(false);
  const [currentDisc, setCurrentDisc] = React.useState(null);
  const [notes, setNotes] = React.useState('');
  const [alert, setAlert] = React.useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const discs = await warehouseApi.getAllDiscrepancies();
      setDiscrepancies(Array.isArray(discs) ? discs : (Array.isArray(discs?.data) ? discs.data : []));
    } catch (err) { console.error(err); }
    setLoading(false);
  };
  React.useEffect(() => { loadData(); }, []);

  // nhóm theo REQ; REQ có discrepancy mới (id lớn) lên trước
  const groups = React.useMemo(() => {
    const map = new Map();
    discrepancies.forEach(d => {
      const key = d.processRequestCode || '—';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(d);
    });
    const arr = [...map.entries()].map(([reqCode, list]) => ({ reqCode, discs: list, maxId: Math.max(...list.map(x => x.id)) }));
    arr.sort((a, b) => b.maxId - a.maxId);
    return arr;
  }, [discrepancies]);

  const handleResolve = async () => {
    try {
      await warehouseApi.resolveDiscrepancy(currentDisc.id, notes, user.id);
      setAlert(t('warehouse.discrepancies.resolved'));
      setOpen(false); setNotes('');
      setDiscrepancies(prev => prev.map(d => d.id === currentDisc.id ? { ...d, status: 'RESOLVED' } : d));
    } catch (err) { setAlert(typeof err === 'string' ? err : (err?.message || t('common.error'))); }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{t('warehouse.discrepancies.title')}</Typography>
        <Button variant="outlined" onClick={loadData}>{t('common.refresh')}</Button>
      </Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>Chênh lệch nhóm theo mã yêu cầu (REQ). Mở từng REQ để xem chi tiết theo PO và xử lý.</Typography>

      {alert && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setAlert('')}>{alert}</Alert>}

      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ bgcolor: '#F9FAFB' }}>
            <TableRow>
              <TableCell sx={{ width: 48 }} />
              <TableCell sx={{ fontWeight: 600 }}>Mã yêu cầu (REQ)</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Số chênh lệch</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Tình trạng</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups.length === 0
              ? <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4 }}>{t('warehouse.discrepancies.noDiscrepancies')}</TableCell></TableRow>
              : groups.map((g, i) => <ReqGroup key={g.reqCode} reqCode={g.reqCode} discs={g.discs} defaultOpen={i === 0} onResolve={(d) => { setCurrentDisc(d); setOpen(true); }} />)}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('warehouse.discrepancies.resolveDiscrepancy')}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>REQ:</strong> {currentDisc?.processRequestCode || '—'} · <strong>PO:</strong> {currentDisc?.poCode || '—'}<br />
            <strong>{t('common.name')}:</strong> {currentDisc?.merchandiseName}<br />
            <strong>{t('warehouse.discrepancies.expectedQty')}:</strong> {currentDisc ? getOrdered(currentDisc) : '-'}{' · '}
            <strong>{t('warehouse.discrepancies.receivedQty')}:</strong> {currentDisc ? getReceived(currentDisc) : '-'}{' · '}
            <strong>{t('warehouse.discrepancies.discrepancy')}:</strong>{' '}
            <Typography component="span" sx={{ color: (currentDisc?.shortage > 0) ? 'error.main' : 'warning.main', fontWeight: 700 }}>
              {currentDisc ? getDiscDisplay(currentDisc) : '-'}
            </Typography>
          </Typography>
          <TextField fullWidth label={t('warehouse.discrepancies.resolutionNotes')} multiline rows={3}
            value={notes} onChange={e => setNotes(e.target.value)} margin="dense"
            placeholder={t('warehouse.discrepancies.resolutionNotesPlaceholder') || 'Nhập ghi chú giải quyết...'} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
          <Button variant="contained" onClick={handleResolve}>{t('warehouse.discrepancies.confirmResolution')}</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default function DiscrepanciesPage() {
  return <ProtectedRoute allowedRoles={['WAREHOUSE']}><DashboardLayout><DiscrepanciesContent /></DashboardLayout></ProtectedRoute>;
}
