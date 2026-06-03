// ============================================================================
//  BƯỚC 2 — Một dòng "mặt hàng" trong bảng chờ phản hồi & đặt hàng.
//  Mở rộng để xem từng site: tồn kho thực, ô nhập số lượng đặt, hoặc
//  trạng thái "đã tạo PO" / "đang chờ phản hồi" / "hết hàng" / "quá hạn".
// ============================================================================
import * as React from 'react';
import {
  Box, Typography, Chip, TableRow, TableCell, IconButton, Collapse,
  Table, TableBody, TableHead, TextField,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import { C, rowStatus, cellStateFromMatrix } from './matrixUtils';

// ----- Sub-row: một site bên dưới mặt hàng -----
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

// ----- Main: dòng mặt hàng (mở rộng → bảng các site con) -----
export default function Step2Row({ item, sites, matrix, orderMap, orderedByMerch, onQty, defaultOpen }) {
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
