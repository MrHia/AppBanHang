import * as React from 'react';
import {
  Container, Typography, Card, CardContent, Box, Button, Chip, Alert,
  Grid, LinearProgress, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Collapse, Stepper, Step, StepLabel,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, FormControl,
  InputLabel, Select, MenuItem
} from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { useRouter } from 'next/router';
import { requestApi, inquiryApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import SendIcon from '@mui/icons-material/Send';
import SyncIcon from '@mui/icons-material/Sync';
import FactCheckIcon from '@mui/icons-material/FactCheck';
import TableChartIcon from '@mui/icons-material/TableChart';

const STEP_ICONS = [FactCheckIcon, SendIcon, SyncIcon, TableChartIcon];

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const configs = {
    PENDING:      { color: 'default',   label: t('overseas.processRequest.statusPending'),    icon: null },
    PICKED:       { color: 'info',      label: t('overseas.processRequest.statusPicked'),     icon: React.createElement(CheckCircleIcon, { sx: { fontSize: 14 } }) },
    REJECTED:     { color: 'error',     label: t('overseas.processRequest.statusRejected'),   icon: React.createElement(CancelIcon, { sx: { fontSize: 14 } }) },
    INQUIRY_SENT: { color: 'info',     label: t('overseas.processRequest.statusInquirySent'), icon: React.createElement(SendIcon, { sx: { fontSize: 14 } }) },
    PARTIAL:      { color: 'warning',   label: t('overseas.processRequest.statusPartial'),                              icon: null },
    RESPONDED:    { color: 'success',   label: t('overseas.processRequest.statusResponded'),  icon: React.createElement(CheckCircleIcon, { sx: { fontSize: 14 } }) },
    TIMEOUT:      { color: 'error',     label: t('overseas.processRequest.statusTimeout'),    icon: React.createElement(CancelIcon, { sx: { fontSize: 14 } }) },
  };
  const c = configs[status] || { color: 'default', label: status, icon: null };
  return React.createElement(Chip, { size: 'small', icon: c.icon, label: c.label, color: c.color, sx: { height: 22, fontSize: '0.7rem' } });
}

function Step1AssignSites({ requestId, items, assignments, sites, onBack, onNext }) {
  const { t } = useTranslation();
  const [assignMap, setAssignMap] = React.useState({});
  const [saving, setSaving] = React.useState(false);
  const [alert, setAlert] = React.useState('');

  React.useEffect(() => {
    if (!assignments || !assignments.length) return;
    const init = {};
    assignments.forEach(a => {
      init[a.merchandiseId] = { siteId: a.assignedSiteId || null, rejectReason: a.rejectReason || '' };
    });
    setAssignMap(init);
  }, [assignments]);

  React.useEffect(() => {
    if (!items || !items.length) return;
    if (Object.keys(assignMap).length > 0) return;
    const init = {};
    items.forEach(item => { init[item.merchandiseId] = { siteId: null, rejectReason: '' }; });
    setAssignMap(init);
  }, [items]);

  const handleSiteTick = (merchId, siteId) => {
    setAssignMap(prev => {
      const curr = prev[merchId] || {};
      if (curr.siteId === siteId) return { ...prev, [merchId]: { siteId: null, rejectReason: '' } };
      return { ...prev, [merchId]: { siteId, rejectReason: '' } };
    });
  };

  const handleReject = (merchId, reason) => {
    setAssignMap(prev => ({ ...prev, [merchId]: { siteId: null, rejectReason: reason } }));
  };

  const handleNext = async () => {
    const unfilled = items.filter(item => {
      const asg = assignMap[item.merchandiseId];
      if (!asg) return true;
      if (asg.siteId === null && !asg.rejectReason?.trim()) return true;
      return false;
    });
    if (unfilled.length > 0) {
      setAlert(t('overseas.processRequest.unfilledItems') + ' ' + unfilled.map(i => i.merchandiseCode).join(', '));
      return;
    }
    setSaving(true);
    try {
      const payload = items.map(item => {
        const asg = assignMap[item.merchandiseId];
        return {
          merchandiseId: item.merchandiseId,
          siteId: asg?.siteId || null,
          rejectReason: asg?.siteId === null ? (asg?.rejectReason || null) : null,
        };
      });
      await requestApi.saveMerchandiseAssignments(requestId, payload);
      onNext(assignMap);
    } catch (err) {
      const msg = err?.data?.message || err?.message || t('common.error');
      setAlert(msg);
    } finally { setSaving(false); }
  };

  return React.createElement(Box, null,
    React.createElement(Alert, { severity: 'info', sx: { mb: 3 } }, t('overseas.processRequest.step1Alert')),
    alert && React.createElement(Alert, { severity: 'error', sx: { mb: 2 }, onClose: () => setAlert('') }, alert),
    React.createElement(TableContainer, { component: Paper, variant: 'outlined', sx: { mb: 3 } },
      React.createElement(Table, { size: 'small' },
        React.createElement(TableHead, { sx: { bgcolor: '#F9FAFB' } },
          React.createElement(TableRow, null,
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 120 }, children: t('overseas.processRequest.merchandiseCode') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 200 }, children: t('overseas.processRequest.merchandiseName') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 80 }, align: 'center', children: t('overseas.processRequest.requested') }),
            ...sites.map(s => React.createElement(TableCell, { key: s.id, align: 'center', sx: { fontWeight: 700, minWidth: 110 } },
              React.createElement(Box, null,
                React.createElement(Typography, { variant: 'caption', sx: { fontWeight: 700, display: 'block' }, children: s.code }),
                React.createElement(Typography, { variant: 'caption', color: 'text.secondary', children: s.name })
              )
            )),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 100 }, align: 'center', children: t('overseas.processRequest.status') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 160 }, children: t('overseas.processRequest.rejectReason') })
          )
        ),
        React.createElement(TableBody, null,
          items.map(item => {
            const asg = assignMap[item.merchandiseId] || {};
            const selectedSiteId = asg.siteId;
            const rejectReason = asg.rejectReason || '';
            const isRejected = selectedSiteId === null && rejectReason !== '';
            const rowBg = isRejected ? '#FEF2F2' : selectedSiteId ? '#F0FDF4' : '#FFFFFF';
            return React.createElement(TableRow, { key: item.merchandiseId, hover: true, sx: { bgcolor: rowBg } },
              React.createElement(TableCell, null,
                React.createElement(Typography, { variant: 'body2', fontWeight: 700, sx: { fontFamily: 'monospace' }, children: item.merchandiseCode })
              ),
              React.createElement(TableCell, null,
                React.createElement(Typography, { variant: 'body2', color: 'text.secondary', children: item.merchandiseName })
              ),
              React.createElement(TableCell, { align: 'center' },
                React.createElement(Chip, { size: 'small', label: item.quantity + ' ' + item.unit, variant: 'outlined', sx: { height: 20, fontSize: '0.7rem' } })
              ),
              ...sites.map(site => {
                const isSelected = selectedSiteId === site.id;
                return React.createElement(TableCell, { key: site.id, align: 'center', sx: { p: 0.5 } },
                  React.createElement(Button, {
                    size: 'small',
                    onClick: () => handleSiteTick(item.merchandiseId, site.id),
                    sx: { minWidth: 0, width: 28, height: 28, p: 0, color: isSelected ? 'success.main' : 'text.disabled', fontWeight: 700, fontSize: '1.1rem' },
                    children: isSelected ? '\u2713' : '\u25CB'
                  })
                );
              }),
              React.createElement(TableCell, { align: 'center' },
                React.createElement(StatusBadge, { status: selectedSiteId ? 'PICKED' : (rejectReason ? 'REJECTED' : 'PENDING') })
              ),
              React.createElement(TableCell, null,
                !selectedSiteId && React.createElement(TextField, {
                  size: 'small',
                  placeholder: t('overseas.processRequest.rejectReasonPlaceholder'),
                  value: rejectReason,
                  onChange: e => handleReject(item.merchandiseId, e.target.value),
                  fullWidth: true,
                  error: !selectedSiteId && !rejectReason.trim(),
                  helperText: !selectedSiteId && !rejectReason.trim() ? t('overseas.processRequest.required') : ''
                })
              )
            );
          })
        )
      )
    ),
    React.createElement(Box, { sx: { display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 } },
      React.createElement(Chip, { label: t('overseas.processRequest.assigned') + ': ' + items.filter(i => assignMap[i.merchandiseId]?.siteId).length, color: 'success', variant: 'outlined' }),
      React.createElement(Chip, { label: t('overseas.processRequest.rejected') + ': ' + items.filter(i => !assignMap[i.merchandiseId]?.siteId && assignMap[i.merchandiseId]?.rejectReason).length, color: 'error', variant: 'outlined' }),
      React.createElement(Chip, { label: t('overseas.processRequest.pending') + ': ' + items.filter(i => !assignMap[i.merchandiseId]?.siteId && !assignMap[i.merchandiseId]?.rejectReason).length, color: 'default', variant: 'outlined' })
    ),
    React.createElement(Box, { sx: { mt: 3, display: 'flex', justifyContent: 'space-between' } },
      React.createElement(Button, { onClick: onBack, children: t('overseas.processRequest.back') }),
      React.createElement(Button, { variant: 'contained', onClick: handleNext, disabled: saving, startIcon: React.createElement(FactCheckIcon) },
        saving ? t('overseas.processRequest.saving') : t('overseas.processRequest.saveAndContinue')
      )
    )
  );
}

function Step2SendInquiries({ requestId, assignments, sites, onBack, onNext, setAssignments }) {
  const { t } = useTranslation();
  const [assignList, setAssignList] = React.useState([]);
  const [sending, setSending] = React.useState(false);
  const [alert, setAlert] = React.useState('');
  const [sent, setSent] = React.useState(false);

  React.useEffect(() => {
    requestApi.getMerchandiseAssignments(requestId)
      .then(r => {
        const arr = Array.isArray(r) ? r : [];
        setAssignList(arr);
        setSent(arr.some(a => a.status === 'INQUIRY_SENT'));
      })
      .catch(console.error);
  }, [requestId]);

  const handleSend = async () => {
    setSending(true);
    try {
      await requestApi.sendInquiries(requestId);
      setSent(true);
      setAlert(t('overseas.processRequest.sentSuccessfully'));
      const updated = await requestApi.getMerchandiseAssignments(requestId);
      const arr = Array.isArray(updated) ? updated : [];
      setAssignList(arr);
      if (setAssignments) setAssignments(arr);
    } catch (err) {
      setAlert(err?.data?.message || err?.message || t('common.error'));
    } finally { setSending(false); }
  };

  const pickedAssignments = assignList.filter(a => a.status === 'PICKED' || a.status === 'INQUIRY_SENT');
  const bySite = pickedAssignments.reduce((acc, a) => {
    if (!a.assignedSiteId) return acc;
    if (!acc[a.assignedSiteId]) acc[a.assignedSiteId] = [];
    acc[a.assignedSiteId].push(a);
    return acc;
  }, {});

  return React.createElement(Box, null,
    React.createElement(Alert, { severity: 'info', sx: { mb: 3 } },
      t('overseas.processRequest.step2Alert1'), ' ', React.createElement('strong', null, Object.keys(bySite).length),
      ' ', t('overseas.processRequest.step2Alert2'), ' ', React.createElement('strong', null, '48'),
      ' ', t('overseas.processRequest.step2Alert3')
    ),
    alert && React.createElement(Alert, { severity: sent ? 'success' : 'info', sx: { mb: 2 }, onClose: () => setAlert('') }, alert),
    React.createElement(Grid, { container: true, spacing: 2, sx: { mb: 3 } },
      Object.entries(bySite).map(([siteId, items]) => {
        const site = sites.find(s => s.id == siteId) || {};
        return React.createElement(Grid, { item: true, xs: 12, sm: 6, key: siteId },
          React.createElement(Card, { variant: 'outlined', sx: { border: '1px solid #E5E7EB' } },
            React.createElement(Box, { sx: { px: 2, py: 1, bgcolor: '#F0FDF4', borderBottom: '1px solid #E5E7EB' } },
              React.createElement(Typography, { variant: 'subtitle2', fontWeight: 700, color: 'success.main', children: site.name + ' (' + site.code + ') - ' + site.country }),
              React.createElement(Typography, { variant: 'caption', color: 'text.secondary', children: items.length + ' ' + t('overseas.processRequest.matHang') })
            ),
            React.createElement(CardContent, { sx: { pt: 1 } },
              items.map((a, idx) =>
                React.createElement(Box, { key: idx, sx: { display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 } },
                  React.createElement(Typography, { variant: 'caption', sx: { minWidth: 60, fontWeight: 700, fontFamily: 'monospace' }, children: a.merchandiseCode }),
                  React.createElement(Typography, { variant: 'caption', color: 'text.secondary', children: a.merchandiseName }),
                  React.createElement(Chip, { size: 'small', label: 'YC: ' + a.requestedQty + ' ' + a.unit, variant: 'outlined', sx: { height: 18, fontSize: '0.65rem' } })
                )
              )
            )
          )
        );
      })
    ),
    React.createElement(Box, { sx: { mt: 3, display: 'flex', justifyContent: 'space-between' } },
      React.createElement(Button, { onClick: onBack, children: t('overseas.processRequest.back') }),
      sent
        ? React.createElement(Button, { variant: 'contained', onClick: onNext, startIcon: React.createElement(CheckCircleIcon) }, t('overseas.processRequest.sentContinue'))
        : React.createElement(Button, { variant: 'contained', color: 'primary', onClick: handleSend, disabled: sending, startIcon: React.createElement(SendIcon) },
            sending ? t('overseas.processRequest.sending') : t('overseas.processRequest.sendStockCheck')
          )
    )
  );
}

function Step3Track({ requestId, assignments, sites, onBack, onNext }) {
  const { t } = useTranslation();
  const [statusMap, setStatusMap] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);

  const loadStatus = React.useCallback(async () => {
    try {
      const r = await requestApi.getInquiryStatus(requestId);
      setStatusMap((typeof r === 'object' && !Array.isArray(r)) ? r : {});
    } catch (e) { console.error(e); }
    finally { setLoading(false); setRefreshing(false); }
  }, [requestId]);

  React.useEffect(() => { loadStatus(); }, [loadStatus]);
  const handleRefresh = () => { setRefreshing(true); loadStatus(); };

  const inquiryAssignments = assignments.filter(a => a.status === 'INQUIRY_SENT' || a.status === 'RESPONDED' || a.status === 'TIMEOUT');
  const bySite = inquiryAssignments.reduce((acc, a) => {
    if (!a.assignedSiteId) return acc;
    if (!acc[a.assignedSiteId]) acc[a.assignedSiteId] = [];
    acc[a.assignedSiteId].push(a);
    return acc;
  }, {});
  const anyResponded = Object.values(statusMap).some(s => s?.status === 'RESPONDED' || s?.status === 'TIMEOUT');

  return React.createElement(Box, null,
    React.createElement(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 } },
      React.createElement(Alert, { severity: 'info', sx: { mb: 0, flex: 1 } },
        t('overseas.processRequest.step3Alert1'), ' ', React.createElement('strong', null, '48'),
        ' ', t('overseas.processRequest.step3Alert2'),
        anyResponded && ' ' + t('overseas.processRequest.step3Alert3')
      ),
      React.createElement(Button, { size: 'small', onClick: handleRefresh, disabled: refreshing, sx: { ml: 2 }, children: refreshing ? t('overseas.processRequest.refreshing') : t('overseas.processRequest.refresh') })
    ),
    loading
      ? React.createElement(LinearProgress)
      : React.createElement(Grid, { container: true, spacing: 2 },
          Object.entries(bySite).map(([siteId, items]) => {
            const site = sites.find(s => s.id == siteId) || {};
            const s = statusMap[siteId];
            const status = s?.status || 'PENDING';
            const colors = { PENDING: '#D97706', PARTIAL: '#2563EB', RESPONDED: '#059669', TIMEOUT: '#DC2626' };
            const col = colors[status] || '#6B7280';
            return React.createElement(Grid, { item: true, xs: 12, sm: 6, md: 4, key: siteId },
              React.createElement(Card, { variant: 'outlined', sx: { border: '2px solid ' + col } },
                React.createElement(CardContent, null,
                  React.createElement(Box, { sx: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 } },
                    React.createElement(Box, null,
                      React.createElement(Typography, { variant: 'subtitle2', fontWeight: 700, children: site.name }),
                      React.createElement(Typography, { variant: 'caption', color: 'text.secondary', children: site.code + ' - ' + site.country })
                    ),
                    React.createElement(StatusBadge, { status: status })
                  ),
                  React.createElement(Typography, { variant: 'caption', color: 'text.secondary', display: 'block', mb: 1, children: items.length + ' ' + t('overseas.processRequest.merchandiseAssigned') }),
                  React.createElement(Chip, { size: 'small', label: (s?.respondedCount || 0) + '/' + (s?.totalItems || items.length) + ' ' + t('overseas.processRequest.itemsResponded'), variant: 'outlined', sx: { mb: 0.5 } }),
                  s?.timeoutAt && React.createElement(Typography, { variant: 'caption', color: 'text.secondary', display: 'block', children: t('overseas.processRequest.timeout') + ' ' + new Date(s.timeoutAt).toLocaleString('vi-VN') }),
                  status === 'PENDING' && React.createElement(Typography, { variant: 'caption', color: 'warning.main', children: t('overseas.processRequest.waitingResponse') }),
                  status === 'RESPONDED' && React.createElement(Typography, { variant: 'caption', color: 'success.main', children: t('overseas.processRequest.respondedFully') }),
                  status === 'TIMEOUT' && React.createElement(Typography, { variant: 'caption', color: 'error.main', children: t('overseas.processRequest.timeoutNote') })
                )
              )
            );
          })
        ),
    React.createElement(Box, { sx: { mt: 3, display: 'flex', justifyContent: 'space-between' } },
      React.createElement(Button, { onClick: onBack, children: t('overseas.processRequest.back') }),
      React.createElement(Button, { variant: 'contained', onClick: onNext, disabled: loading || !anyResponded },
        anyResponded ? t('overseas.processRequest.continueMatrix') : t('overseas.processRequest.waitingForResponse')
      )
    )
  );
}

function Step4Matrix({ requestId, items, assignments, sites, onBack }) {
  const { t } = useTranslation();
  const [matrix, setMatrix] = React.useState({});
  const [assignList, setAssignList] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [poDialog, setPoDialog] = React.useState(false);
  const [alert, setAlert] = React.useState('');
  const [hasResponse, setHasResponse] = React.useState(false);

  React.useEffect(() => {
    Promise.all([
      inquiryApi.getMatrix(requestId).catch(() => ({})),
      requestApi.getMerchandiseAssignments(requestId).catch(() => []),
    ]).then(([m, asg]) => {
      setMatrix((typeof m === 'object' && !Array.isArray(m)) ? m : {});
      setAssignList(Array.isArray(asg) ? asg : []);
      const anyResp = Array.isArray(asg) && asg.some(a => a.status === 'RESPONDED' || a.status === 'TIMEOUT');
      setHasResponse(anyResp);
    }).catch(err => console.error(err))
    .finally(() => setLoading(false));
  }, [requestId]);

  if (loading) return React.createElement(LinearProgress);

  const pickedAssignments = assignList.filter(a => a.assignedSiteId && (a.status === 'INQUIRY_SENT' || a.status === 'RESPONDED' || a.status === 'TIMEOUT'));
  const involvedSiteIds = [...new Set(pickedAssignments.map(a => a.assignedSiteId))];
  const involvedSites = involvedSiteIds.map(id => sites.find(s => s.id == id)).filter(Boolean);

  return React.createElement(Box, null,
    React.createElement(Alert, { severity: 'info', sx: { mb: 3 } }, t('overseas.processRequest.step4Alert1')),
    alert && React.createElement(Alert, { severity: 'success', sx: { mb: 2 }, onClose: () => setAlert('') }, alert),
    !hasResponse && React.createElement(Alert, { severity: 'warning', sx: { mb: 2 }, children: t('overseas.processRequest.noSiteResponse') }),
    React.createElement(TableContainer, { component: Paper, variant: 'outlined', sx: { mb: 3 } },
      React.createElement(Table, { size: 'small' },
        React.createElement(TableHead, { sx: { bgcolor: '#F9FAFB' } },
          React.createElement(TableRow, null,
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 120 }, children: t('overseas.processRequest.merchandiseCode') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 80 }, align: 'center', children: t('overseas.processRequest.requested') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 120 }, children: t('overseas.processRequest.siteAssigned') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 100 }, align: 'center', children: t('overseas.processRequest.stockResponse') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 100 }, align: 'center', children: t('overseas.processRequest.status') }),
            React.createElement(TableCell, { sx: { fontWeight: 700, minWidth: 100 }, align: 'center', children: t('overseas.processRequest.orderNow') })
          )
        ),
        React.createElement(TableBody, null,
          items.map(item => {
            const asg = assignList.find(a => a.merchandiseId === item.merchandiseId);
            const assignedSiteId = asg?.assignedSiteId;
            const assignedSite = assignedSiteId ? sites.find(s => s.id == assignedSiteId) : null;
            const siteStock = assignedSiteId && matrix[assignedSiteId]?.[item.merchandiseId];
            const qty = siteStock?.quantity ?? 0;
            const source = siteStock?.source || 'none';
            const status = asg?.status || 'PENDING';
            const canFulfill = status === 'RESPONDED' && qty >= item.quantity;
            const rowBg = canFulfill ? '#F0FDF4' : qty > 0 ? '#FFFBEB' : '#FEF2F2';
            return React.createElement(TableRow, { key: item.merchandiseId, hover: true, sx: { bgcolor: rowBg } },
              React.createElement(TableCell, null,
                React.createElement(Typography, { variant: 'body2', fontWeight: 700, sx: { fontFamily: 'monospace' }, children: item.merchandiseCode }),
                React.createElement(Typography, { variant: 'caption', color: 'text.secondary', children: item.merchandiseName })
              ),
              React.createElement(TableCell, { align: 'center' },
                React.createElement(Chip, { size: 'small', label: item.quantity + ' ' + item.unit, variant: 'outlined', sx: { height: 20, fontSize: '0.7rem' } })
              ),
              React.createElement(TableCell, null,
                assignedSite
                  ? React.createElement(Box, null,
                      React.createElement(Typography, { variant: 'body2', fontWeight: 600, children: assignedSite.code }),
                      React.createElement(Typography, { variant: 'caption', color: 'text.secondary', children: assignedSite.name })
                    )
                  : React.createElement(Typography, { variant: 'caption', color: 'text.disabled', children: '-' })
              ),
              React.createElement(TableCell, { align: 'center' },
                assignedSiteId
                  ? React.createElement(Typography, {
                      variant: 'body2', fontWeight: 800,
                      color: source === 'inquiry' ? 'success.main' : source === 'reference' ? 'warning.main' : source === 'reference_timeout' ? 'error.main' : 'text.disabled',
                      children: source === 'none' ? '-' : qty + (source === 'reference' ? ' ' + t('overseas.processRequest.refStock') : source === 'reference_timeout' ? ' ' + t('overseas.processRequest.refTimeoutStock') : '')
                    })
                  : React.createElement(Typography, { variant: 'caption', color: 'text.disabled', children: '-' })
              ),
              React.createElement(TableCell, { align: 'center' }, React.createElement(StatusBadge, { status: status })),
              React.createElement(TableCell, { align: 'center' },
                (status === 'RESPONDED' || status === 'TIMEOUT')
                  ? React.createElement(Chip, { size: 'small', label: t('overseas.processRequest.orderNow') + ' ' + Math.min(item.quantity, qty) + ' ' + item.unit, color: 'primary', sx: { height: 22, fontSize: '0.7rem' } })
                  : React.createElement(Typography, { variant: 'caption', color: 'text.disabled', children: t('overseas.processRequest.awaitingResponse') })
              )
            );
          })
        )
      )
    ),
    React.createElement(Box, { sx: { display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 } },
      React.createElement(Chip, { label: t('overseas.processRequest.actualStock'), size: 'small', sx: { bgcolor: '#FFFFFF', border: '1px solid #E5E7EB' } }),
      React.createElement(Chip, { label: t('overseas.processRequest.refStock'), size: 'small', sx: { bgcolor: '#FEF9C3', color: '#854D0E' } }),
      React.createElement(Chip, { label: t('overseas.processRequest.refTimeoutStock'), size: 'small', sx: { bgcolor: '#FEF3C7', color: '#92400E' } })
    ),
    React.createElement(Box, { sx: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 } },
      React.createElement(Typography, { variant: 'subtitle1', fontWeight: 700, children: t('overseas.processRequest.createPO') + ' - ' + involvedSites.length + ' Site' }),
      React.createElement(Button, { variant: 'contained', color: 'primary', startIcon: React.createElement(ShoppingCartIcon), onClick: () => setPoDialog(true), disabled: !hasResponse, children: t('overseas.processRequest.createPO') })
    ),
    React.createElement(POCreateDialog, {
      open: poDialog, requestId, items, assignments, sites, matrix,
      onClose: () => setPoDialog(false),
      onCreated: (pos) => { setAlert(t('overseas.processRequest.createdSuccessfully') + ' ' + pos.length + ' ' + t('overseas.processRequest.purchaseOrdersCreated')); setPoDialog(false); }
    }),
    React.createElement(Box, { sx: { mt: 3 } }, React.createElement(Button, { onClick: onBack, children: t('overseas.processRequest.back') }))
  );
}

function POCreateDialog({ open, requestId, items, assignments, sites, matrix, onClose, onCreated }) {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(false);
  const [alert, setAlert] = React.useState('');
  const [step, setStep] = React.useState(0);
  const [delivery, setDelivery] = React.useState({});
  const [poItems, setPoItems] = React.useState({});
  const [preview, setPreview] = React.useState([]);

  React.useEffect(() => {
    if (!open) { setDelivery({}); setPoItems({}); setPreview([]); setStep(0); setAlert(''); return; }
    const init = {};
    assignments.forEach(a => {
      if (!a.assignedSiteId) return;
      const status = a.status;
      if (status !== 'RESPONDED' && status !== 'TIMEOUT') return;
      const siteId = a.assignedSiteId;
      if (!init[siteId]) init[siteId] = {};
      const stockInfo = matrix[siteId]?.[a.merchandiseId];
      const max = stockInfo?.quantity ?? 0;
      const requested = a.requestedQty;
      init[siteId][a.merchandiseId] = Math.min(requested, Math.max(0, max));
    });
    setPoItems(init);
  }, [open, assignments, matrix]);

  const activeSites = sites.filter(s => Object.values(poItems[s.id] || {}).some(qty => qty > 0));

  const handleQtyChange = (siteId, merchId, value) => {
    const max = matrix[siteId]?.[merchId]?.quantity || 0;
    const val = Math.max(0, Math.min(max, parseInt(value) || 0));
    setPoItems(prev => ({ ...prev, [siteId]: { ...(prev[siteId] || {}), [merchId]: val } }));
  };

  const handleDeliveryChange = (siteId, field, value) => {
    setDelivery(prev => ({ ...prev, [siteId]: { ...(prev[siteId] || {}), [field]: value } }));
  };

  const handlePreview = () => {
    const prev = activeSites.map(site => ({
      siteId: site.id, siteCode: site.code, siteName: site.name,
      deliveryMethod: delivery[site.id]?.method || 'SHIP',
      expectedDelivery: delivery[site.id]?.date || '',
      items: Object.entries(poItems[site.id] || {})
        .filter(([, qty]) => qty > 0)
        .map(([merchId, qty]) => {
          const asg = assignments.find(a => a.merchandiseId == merchId);
          const item = items.find(i => i.merchandiseId == merchId);
          return { merchandiseId: parseInt(merchId), merchandiseCode: item?.merchandiseCode || '', merchandiseName: item?.merchandiseName || '', unit: item?.unit || 'piece', orderQty: qty };
        }),
    }));
    setPreview(prev);
    setStep(1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const orders = preview.map(p => ({
        siteId: p.siteId, deliveryMethod: p.deliveryMethod,
        expectedDelivery: p.expectedDelivery || null,
        items: p.items.map(i => ({ merchandiseId: i.merchandiseId, quantity: i.orderQty, unit: i.unit })),
      }));
      const result = await requestApi.createPOBatch(requestId, { orders });
      const pos = Array.isArray(result) ? result : [];
      onCreated(pos);
    } catch (err) {
      setAlert(err?.data?.message || err?.message || t('common.error'));
      setLoading(false);
    }
  };

  if (!open) return null;

  return React.createElement(Dialog, { open, onClose: onClose, maxWidth: 'lg', fullWidth: true, PaperProps: { sx: { borderRadius: 2 } } },
    React.createElement(DialogTitle, { sx: { pb: 1, display: 'flex', alignItems: 'center', gap: 1 } },
      React.createElement(ShoppingCartIcon, { color: 'primary' }),
      ' ' + t('overseas.processRequest.createPO'),
      React.createElement(Box, { sx: { flex: 1 } }),
      React.createElement(Chip, { size: 'small', label: t('overseas.processRequest.step') + ' ' + (step + 1) + '/2', variant: 'outlined' })
    ),
    React.createElement(DialogContent, { dividers: true },
      alert && React.createElement(Alert, { severity: 'error', sx: { mb: 2 }, onClose: () => setAlert('') }, alert),
      step === 0 && React.createElement(Box, null,
        React.createElement(Alert, { severity: 'info', sx: { mb: 2 } },
          t('overseas.processRequest.step4Alert1')
        ),
        activeSites.map(site => {
          const siteAssignments = assignments.filter(a => a.assignedSiteId == site.id && (poItems[site.id]?.[a.merchandiseId] ?? 0) > 0);
          if (siteAssignments.length === 0) return null;
          return React.createElement(Card, { key: site.id, variant: 'outlined', sx: { mb: 2, border: '1px solid #E5E7EB' } },
            React.createElement(Box, { sx: { px: 2, py: 1, bgcolor: '#F0FDF4', borderBottom: '1px solid #E5E7EB' } },
              React.createElement(Typography, { variant: 'subtitle2', fontWeight: 700, color: 'success.main', children: site.name + ' (' + site.code + ') - ' + site.country })
            ),
            React.createElement(CardContent, { sx: { pt: 1 } },
              siteAssignments.map(a => {
                const stockInfo = matrix[site.id]?.[a.merchandiseId];
                const max = stockInfo?.quantity || 0;
                const source = stockInfo?.source || 'none';
                const current = poItems[site.id]?.[a.merchandiseId] || 0;
                return React.createElement(Box, { key: a.merchandiseId, sx: { display: 'flex', alignItems: 'center', gap: 2, mb: 1 } },
                  React.createElement(Box, { sx: { flex: 1 } },
                    React.createElement(Typography, { variant: 'body2', fontWeight: 600, children: a.merchandiseCode }),
                    React.createElement(Typography, { variant: 'caption', color: 'text.secondary', children: 'YC: ' + a.requestedQty + ' | ' + t('overseas.processRequest.stock') + ' ' + max + ' ' + a.unit + (source === 'reference' ? ' ' + t('overseas.processRequest.refStock') : source === 'reference_timeout' ? ' ' + t('overseas.processRequest.refTimeoutStock') : '') })
                  ),
                  React.createElement(TextField, {
                    type: 'number', size: 'small', label: t('overseas.processRequest.enterOrderQty'), value: current,
                    onChange: e => handleQtyChange(site.id, a.merchandiseId, e.target.value),
                    inputProps: { min: 0, max }, sx: { width: 100 }
                  }),
                  current > 0 && React.createElement(Typography, { variant: 'caption', color: 'success.main', sx: { minWidth: 50 }, children: current + '/' + max })
                );
              })
            )
          );
        })
      ),
      step === 1 && React.createElement(Box, null,
        React.createElement(Alert, { severity: 'info', sx: { mb: 2 } }, t('overseas.processRequest.checkPOInfo')),
        preview.map(p =>
          React.createElement(Card, { key: p.siteId, variant: 'outlined', sx: { mb: 2, border: '2px solid #059669' } },
            React.createElement(Box, { sx: { px: 2, py: 1, bgcolor: '#ECFDF5', borderBottom: '1px solid #059669' } },
              React.createElement(Typography, { variant: 'subtitle2', fontWeight: 700, color: 'success.main', children: 'PO cho ' + p.siteName + ' (' + p.siteCode + ') - ' + p.items.length + ' ' + t('overseas.processRequest.matHang') })
            ),
            React.createElement(CardContent, null,
              React.createElement(Box, { sx: { display: 'flex', gap: 2, mb: 2 } },
                React.createElement(FormControl, { size: 'small', sx: { minWidth: 200 } },
                  React.createElement(InputLabel, null, t('overseas.processRequest.transportMethod')),
                  React.createElement(Select, {
                    label: t('overseas.processRequest.transportMethod'), value: p.deliveryMethod,
                    onChange: e => handleDeliveryChange(p.siteId, 'method', e.target.value),
                    children: [
                      React.createElement(MenuItem, { key: 'SHIP', value: 'SHIP', children: t('overseas.processRequest.seaRoute') }),
                      React.createElement(MenuItem, { key: 'AIR', value: 'AIR', children: t('overseas.processRequest.airRoute') }),
                      React.createElement(MenuItem, { key: 'LAND', value: 'LAND', children: t('overseas.processRequest.landRoute') }),
                    ]
                  })
                ),
                React.createElement(TextField, {
                  size: 'small', label: t('overseas.processRequest.expectedDeliveryDate'), type: 'date',
                  InputLabelProps: { shrink: true }, value: p.expectedDelivery,
                  onChange: e => handleDeliveryChange(p.siteId, 'date', e.target.value), sx: { width: 200 }
                })
              ),
              React.createElement(TableContainer, null,
                React.createElement(Table, { size: 'small' },
                  React.createElement(TableHead, null,
                    React.createElement(TableRow, null,
                      React.createElement(TableCell, { sx: { fontWeight: 600 }, children: t('overseas.processRequest.merchandiseCode') }),
                      React.createElement(TableCell, { sx: { fontWeight: 600 }, align: 'center', children: t('overseas.processRequest.quantity') }),
                      React.createElement(TableCell, { sx: { fontWeight: 600 }, align: 'center', children: 'Unit' })
                    )
                  ),
                  React.createElement(TableBody, null,
                    p.items.map(i =>
                      React.createElement(TableRow, { key: i.merchandiseId },
                        React.createElement(TableCell, null, i.merchandiseCode + ' - ' + i.merchandiseName),
                        React.createElement(TableCell, { align: 'center' }, React.createElement(Chip, { size: 'small', label: i.orderQty, color: 'primary' })),
                        React.createElement(TableCell, { align: 'center' }, i.unit)
                      )
                    )
                  )
                )
              )
            )
          )
        )
      )
    ),
    React.createElement(DialogActions, { sx: { px: 3, py: 2, display: 'flex', justifyContent: 'space-between' } },
      React.createElement(Box, null, step > 0 && React.createElement(Button, { onClick: () => setStep(s => s - 1), children: t('overseas.processRequest.back') })),
      React.createElement(Box, { sx: { display: 'flex', gap: 1 } },
        React.createElement(Button, { onClick: onClose, size: 'small', children: t('overseas.processRequest.cancel') }),
        step === 0 && React.createElement(Button, { variant: 'contained', onClick: handlePreview, disabled: activeSites.length === 0, children: t('overseas.processRequest.preview') }),
        step === 1 && React.createElement(Button, { variant: 'contained', color: 'success', onClick: handleSubmit, disabled: loading, startIcon: React.createElement(SendIcon) },
          loading ? t('overseas.processRequest.sendingPO') : t('overseas.processRequest.sendPO') + ' ' + preview.length + ' PO'
        )
      )
    )
  );
}

function ProcessRequestContent() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = router.query;
  const [request, setRequest] = React.useState(null);
  const [items, setItems] = React.useState([]);
  const [assignments, setAssignments] = React.useState([]);
  const [sites, setSites] = React.useState([]);
  const [activeStep, setActiveStep] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [refreshing, setRefreshing] = React.useState(false);
  const [alert, setAlert] = React.useState('');

  const stepLabels = [
    t('overseas.processRequest.stepLabels.step1'),
    t('overseas.processRequest.stepLabels.step2'),
    t('overseas.processRequest.stepLabels.step3'),
    t('overseas.processRequest.stepLabels.step4'),
  ];

  React.useEffect(() => {
    if (!id) return;
    const load = (isAutoRefresh = false) => {
      if (isAutoRefresh) setRefreshing(true);
      else setLoading(true);
      Promise.all([
        requestApi.getById(id).catch(() => null),
        requestApi.getItems(id).catch(() => []),
        requestApi.getMerchandiseAssignments(id).catch(() => []),
      ]).then(([r, it, asg]) => {
        setRequest(r);
        setItems(Array.isArray(it) ? it : []);
        setAssignments(Array.isArray(asg) ? asg : []);
      }).catch(err => {
        if (!isAutoRefresh) setAlert(typeof err === 'string' ? err : (err?.message || t('common.error')));
      }).finally(() => {
        if (isAutoRefresh) setRefreshing(false);
        else setLoading(false);
      });
    };
    load(false);
    const interval = setInterval(() => load(true), 15000);
    return () => clearInterval(interval);
  }, [id]);

  React.useEffect(() => {
    import('src/api').then(m => {
      m.siteApi.getAll().then(s => setSites(Array.isArray(s) ? s : [])).catch(() => {});
    }).catch(() => {});
  }, []);

  React.useEffect(() => {
    if (!request || request.status !== 'PROCESSING') return;
    if (!assignments.length) return;
    const hasSent = assignments.some(a => a.status === 'INQUIRY_SENT');
    const hasResponded = assignments.some(a => a.status === 'RESPONDED' || a.status === 'TIMEOUT');
    if (hasResponded && activeStep < 3) setActiveStep(3);
    else if (hasSent && activeStep < 2) setActiveStep(2);
    else if (activeStep < 1) setActiveStep(1);
  }, [request, assignments, activeStep]);

  if (loading) return React.createElement(LinearProgress);
  if (!request) return React.createElement(Container, { maxWidth: 'xl' },
    React.createElement(Typography, { variant: 'h6', color: 'text.secondary' }, t('overseas.processRequest.notFound'))
  );

  const isProcessing = request.status === 'PROCESSING';
  const handleNext = () => setActiveStep(s => Math.min(s + 1, stepLabels.length - 1));
  const handleBack = () => setActiveStep(s => Math.max(s - 1, 0));
  const statusLabel = request.status === 'PROCESSING' ? t('overseas.processRequest.processing') : request.status === 'DONE' ? t('overseas.processRequest.completed') : request.status;
  const statusColor = request.status === 'PROCESSING' ? 'info' : request.status === 'DONE' ? 'success' : 'warning';

  return React.createElement(Container, { maxWidth: 'xl', sx: { pb: 4 } },
    React.createElement('style', null, '@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }'),
    React.createElement(Box, { sx: { mb: 3 } },
      React.createElement(Box, { sx: { display: 'flex', alignItems: 'center', gap: 2, mb: 1 } },
        refreshing && React.createElement(SyncIcon, { sx: { fontSize: 20, animation: 'spin 1s linear infinite', color: 'text.secondary' } }),
        React.createElement(Typography, { variant: 'h5', fontWeight: 800, color: 'primary.main', children: t('overseas.processRequest.title') }),
        React.createElement(Chip, { label: request.code, sx: { fontFamily: 'monospace', fontWeight: 700, bgcolor: '#EEF2FF', color: '#4338CA' } }),
        React.createElement(Chip, { label: statusLabel, size: 'small', color: statusColor })
      ),
      React.createElement(Box, { sx: { display: 'flex', gap: 3, flexWrap: 'wrap' } },
        React.createElement(Typography, { variant: 'body2', color: 'text.secondary', children: t('overseas.processRequest.desiredDeliveryDate') + ': ' + request.desiredDate }),
        request.createdAt && React.createElement(Typography, { variant: 'body2', color: 'text.secondary', children: t('overseas.processRequest.createdAt') + ': ' + new Date(request.createdAt).toLocaleString('vi-VN') }),
        request.createdByName && React.createElement(Typography, { variant: 'body2', color: 'text.secondary', children: t('overseas.processRequest.createdBy') + ': ' + request.createdByName })
      ),
      request.notes && React.createElement(Typography, { variant: 'body2', color: 'text.secondary', sx: { mt: 0.5, fontStyle: 'italic' }, children: t('overseas.processRequest.notes') + ': ' + request.notes })
    ),
    alert && React.createElement(Collapse, { in: !!alert },
      React.createElement(Alert, { severity: 'info', sx: { mb: 2 }, onClose: () => setAlert('') }, alert)
    ),
    items.length > 0 && React.createElement(Card, { sx: { mb: 3, border: '1px solid #E2E8F0' }, elevation: 0 },
      React.createElement(Box, { sx: { px: 3, py: 2, bgcolor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' } },
        React.createElement(Typography, { variant: 'subtitle1', fontWeight: 700, children: t('overseas.processRequest.merchandiseList') + ' (' + items.length + ')' })
      ),
      React.createElement(Box, { sx: { px: 3, py: 1 } },
        items.map((item, idx) =>
          React.createElement(Box, { key: item.merchandiseId, sx: { display: 'flex', alignItems: 'center', gap: 2, py: 1 } },
            React.createElement(Typography, { variant: 'body2', sx: { minWidth: 30, fontWeight: 700, color: 'text.secondary' }, children: (idx + 1) + '.' }),
            React.createElement(Typography, { variant: 'body2', fontWeight: 600, sx: { fontFamily: 'monospace' }, children: item.merchandiseCode }),
            React.createElement(Typography, { variant: 'body2', color: 'text.secondary', children: '-' }),
            React.createElement(Typography, { variant: 'body2', children: item.merchandiseName }),
            React.createElement(Chip, { size: 'small', label: item.quantity + ' ' + item.unit, variant: 'outlined', sx: { height: 20, fontSize: '0.7rem' } })
          )
        )
      )
    ),
    isProcessing
      ? React.createElement(Box, null,
          React.createElement(Card, { sx: { mb: 3, border: '1px solid #E2E8F0' }, elevation: 0 },
            React.createElement(CardContent, null,
              React.createElement(Stepper, { activeStep: activeStep, alternativeLabel: true, sx: { mb: 1 } },
                stepLabels.map((label, idx) =>
                  React.createElement(Step, { key: label },
                    React.createElement(StepLabel, {
                      StepIconComponent: () => React.createElement(Box, {
                        sx: { width: 32, height: 32, borderRadius: '50%', bgcolor: idx <= activeStep ? 'primary.main' : '#E5E7EB', color: idx <= activeStep ? 'white' : 'text.secondary', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem' },
                        children: React.createElement(STEP_ICONS[idx], { sx: { fontSize: 16 } })
                      }),
                      children: React.createElement(Typography, { variant: 'caption', fontWeight: 600, children: label })
                    })
                  )
                )
              )
            )
          ),
          React.createElement(Card, { sx: { border: '1px solid #E2E8F0' }, elevation: 0 },
            React.createElement(CardContent, null,
              activeStep === 0 && React.createElement(Step1AssignSites, { requestId: request.id, items, assignments, sites, onBack: handleBack, onNext: handleNext }),
              activeStep === 1 && React.createElement(Step2SendInquiries, { requestId: request.id, assignments, sites, onBack: handleBack, onNext: handleNext, setAssignments }),
              activeStep === 2 && React.createElement(Step3Track, { requestId: request.id, assignments, sites, onBack: handleBack, onNext: handleNext }),
              activeStep === 3 && React.createElement(Step4Matrix, { requestId: request.id, items, assignments, sites, onBack: handleBack })
            )
          )
        )
      : React.createElement(Card, { sx: { border: '1px solid #E2E8F0', textAlign: 'center', py: 4 }, elevation: 0 },
          React.createElement(Typography, { variant: 'h6', color: 'text.secondary', sx: { mb: 2 }, children: t('overseas.processRequest.title') + ' - ' + request.status }),
          request.status === 'PENDING' && React.createElement(Button, {
            variant: 'contained', color: 'primary', size: 'large', startIcon: React.createElement(FactCheckIcon),
            onClick: async () => {
              try {
                await requestApi.submit(request.id);
                setAlert(t('overseas.processRequest.startProcessing'));
                setRequest(prev => prev ? { ...prev, status: 'PROCESSING' } : prev);
              } catch (err) {
                setAlert(typeof err === 'string' ? err : (err?.message || t('common.error')));
              }
            },
            children: t('overseas.processRequest.startProcessing')
          }),
          request.status === 'DONE' && React.createElement(Typography, { variant: 'body2', color: 'success.main', fontWeight: 600, children: t('overseas.processRequest.requestCompleted') })
        ),
    React.createElement(Box, { sx: { mt: 3 } }, React.createElement(Button, { onClick: () => router.back(), children: t('overseas.processRequest.backToList') }))
  );
}

export default function ProcessRequestPage() {
  return React.createElement(ProtectedRoute, { allowedRoles: ['OVERSEAS'] },
    React.createElement(DashboardLayout, null, React.createElement(ProcessRequestContent))
  );
}
