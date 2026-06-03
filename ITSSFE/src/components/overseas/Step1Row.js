// ============================================================================
//  BƯỚC 1 — Một dòng "mặt hàng" trong bảng chọn site hỏi tồn kho.
//  Click để mở rộng, tick chọn các site có kinh doanh mặt hàng này.
// ============================================================================
import * as React from 'react';
import {
  Box, Typography, Chip, TableRow, TableCell, IconButton, Collapse,
  Checkbox, FormControlLabel,
} from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import { C } from './matrixUtils';

export default function Step1Row({ item, candidateSites, selectedSiteIds, onToggle, defaultOpen }) {
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
