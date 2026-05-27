import * as React from 'react';
import {
  Container, Typography, Card, CardContent, Box, Button, Chip, Alert,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, IconButton, Collapse, Tooltip, Select, MenuItem, FormControl,
  InputLabel, InputAdornment, LinearProgress
} from '@mui/material';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { siteMerchandiseApi, merchandiseApi } from 'src/api';
import { useAuth } from 'src/contexts/auth-context';
import { useTranslation } from 'src/i18n/useTranslation';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AddIcon from '@mui/icons-material/Add';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelPresentationIcon from '@mui/icons-material/CancelPresentation';
import InventoryIcon from '@mui/icons-material/Inventory';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';

function StockCell({ value, onSave, unit }) {
  const [editing, setEditing] = React.useState(false);
  const [draft, setDraft] = React.useState(value || 0);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => { setDraft(value || 0); }, [value]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      setEditing(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        <TextField
          type="number"
          size="small"
          value={draft}
          onChange={e => setDraft(Math.max(0, parseInt(e.target.value) || 0))}
          inputProps={{ min: 0, style: { padding: '4px 8px', width: 70 } }}
          autoFocus
          onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') setEditing(false); }}
        />
        <IconButton size="small" onClick={handleSave} disabled={saving} color="success">
          <SaveIcon fontSize="small" />
        </IconButton>
        <IconButton size="small" onClick={() => { setDraft(value || 0); setEditing(false); }} color="error">
          <CancelIcon fontSize="small" />
        </IconButton>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Typography
        variant="body2"
        fontWeight={600}
        color={value > 0 ? 'success.main' : 'error.main'}
      >
        {value || 0}
      </Typography>
      <Tooltip title="Edit stock">
        <IconButton size="small" onClick={() => setEditing(true)} sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}>
          <EditIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </Box>
  );
}

function AddMerchandiseDialog({ open, onClose, onAdded, user, t }) {
  const [catalog, setCatalog] = React.useState([]);
  const [siteMerch, setSiteMerch] = React.useState([]);
  const [selectedId, setSelectedId] = React.useState('');
  const [initialStock, setInitialStock] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');

  React.useEffect(() => {
    if (!open) return;
    Promise.all([
      merchandiseApi.getAll(),
      siteMerchandiseApi.getBySite(user.siteId)
    ]).then(([cat, sm]) => {
      const smIds = new Set((Array.isArray(sm) ? sm : []).map(m => m.merchandiseId));
      const available = (Array.isArray(cat) ? cat : []).filter(m => !smIds.has(m.id));
      setCatalog(available);
      setSiteMerch(Array.isArray(sm) ? sm : []);
    }).catch(console.error);
  }, [open, user.siteId]);

  const filtered = catalog.filter(m =>
    m.code?.toLowerCase().includes(search.toLowerCase()) ||
    m.name?.toLowerCase().includes(search.toLowerCase())
  );

  const existingIds = new Set(siteMerch.map(m => m.merchandiseId));

  const handleAdd = async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      await onAdded(parseInt(selectedId), initialStock);
      setSelectedId('');
      setInitialStock(0);
      setSearch('');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 2 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <AddIcon color="primary" />
        {t('site.merchandiseMgmt.addMerchandise')}
      </DialogTitle>
      <DialogContent dividers>
        <TextField
          fullWidth
          size="small"
          placeholder="Search by code or name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
          sx={{ mb: 2, mt: 1 }}
        />

        {filtered.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body2" color="text.secondary">
              {catalog.length === 0 ? t('site.merchandiseMgmt.noMerchandise') : 'No matching merchandise'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 300, overflow: 'auto' }}>
            {filtered.map(m => (
              <Box
                key={m.id}
                onClick={() => { setSelectedId(m.id); setInitialStock(0); }}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 2, p: 1.5, borderRadius: 1,
                  border: selectedId === String(m.id) ? '2px solid #2563EB' : '1px solid #E5E7EB',
                  bgcolor: selectedId === String(m.id) ? '#EFF6FF' : 'white',
                  cursor: 'pointer', '&:hover': { bgcolor: '#F9FAFB', borderColor: '#2563EB' },
                  transition: 'all 0.15s'
                }}
              >
                <Box sx={{ flex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace' }}>{m.code}</Typography>
                    <Typography variant="body2" fontWeight={500}>{m.name}</Typography>
                  </Box>
                  <Typography variant="caption" color="text.secondary">{m.unit} — {m.description}</Typography>
                </Box>
                {selectedId === String(m.id) && (
                  <CheckCircleIcon fontSize="small" color="primary" />
                )}
              </Box>
            ))}
          </Box>
        )}

        {selectedId && (
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label={t('site.merchandiseMgmt.currentStock')}
              type="number"
              size="small"
              value={initialStock}
              onChange={e => setInitialStock(Math.max(0, parseInt(e.target.value) || 0))}
              inputProps={{ min: 0 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {t('site.merchandiseMgmt.stockReferenceNote')}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} size="small">{t('common.cancel')}</Button>
        <Button
          variant="contained"
          onClick={handleAdd}
          disabled={!selectedId || loading}
          size="small"
        >
          {t('site.merchandiseMgmt.addMerchandise')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SiteMerchandiseContent() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [items, setItems] = React.useState([]);
  const [alert, setAlert] = React.useState('');
  const [alertType, setAlertType] = React.useState('success');
  const [loading, setLoading] = React.useState(true);
  const [addOpen, setAddOpen] = React.useState(false);
  const [tab, setTab] = React.useState(0);

  const showAlert = (msg, type = 'success') => {
    setAlert(msg);
    setAlertType(type);
  };

  const load = () => {
    setLoading(true);
    siteMerchandiseApi.getBySite(user.siteId)
      .then(r => setItems(Array.isArray(r) ? r : []))
      .catch(err => showAlert(typeof err === 'string' ? err : (err?.message || t('common.error')), 'error'))
      .finally(() => setLoading(false));
  };

  React.useEffect(() => { if (user?.siteId) load(); }, [user]);

  const handleUpdateStock = async (id, stockQty) => {
    await siteMerchandiseApi.updateStock(id, stockQty);
    setItems(items.map(i => i.id === id ? { ...i, stockQuantity: stockQty } : i));
    showAlert(t('site.merchandiseMgmt.updateStockSuccess'));
  };

  const handleAdd = async (merchId, stockQty) => {
    await siteMerchandiseApi.addMerchandise(user.siteId, { merchandiseId: merchId, stockQuantity: stockQty });
    load();
    showAlert(t('site.merchandiseMgmt.addSuccess'));
    setAddOpen(false);
  };

  const handleToggleActive = async (item) => {
    if (item.isActive) {
      await siteMerchandiseApi.removeMerchandise(item.id);
      showAlert(t('site.merchandiseMgmt.removeSuccess'));
    } else {
      await siteMerchandiseApi.addMerchandise(user.siteId, { merchandiseId: item.merchandiseId, stockQuantity: item.stockQuantity || 0 });
      showAlert(t('site.merchandiseMgmt.activateMerchandise'));
    }
    load();
  };

  const activeItems = items.filter(i => i.isActive);
  const inactiveItems = items.filter(i => !i.isActive);
  const activeStock = activeItems.reduce((s, i) => s + (i.stockQuantity || 0), 0);

  const displayedItems = tab === 0 ? activeItems : inactiveItems;

  return (
    <Container maxWidth="xl" sx={{ pb: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <InventoryIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight={800}>{t('site.merchandiseMgmt.title')}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary">
          {t('site.merchandiseMgmt.stockReferenceNote')}
        </Typography>
      </Box>

      {/* Stats Bar */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Card sx={{ flex: 1, minWidth: 180, bgcolor: '#ECFDF5', border: '1px solid #A7F3D0' }} elevation={0}>
          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="caption" color="success.dark" fontWeight={600}>{t('site.merchandiseMgmt.activeList')}</Typography>
            <Typography variant="h4" fontWeight={800} color="success.main">{activeItems.length}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 180, bgcolor: '#FEF2F2', border: '1px solid #FECACA' }} elevation={0}>
          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="caption" color="error.dark" fontWeight={600}>{t('site.merchandiseMgmt.totalStock')}</Typography>
            <Typography variant="h4" fontWeight={800} color="error.main">{activeStock}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, minWidth: 180, bgcolor: '#F3F4F6', border: '1px solid #E5E7EB' }} elevation={0}>
          <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600}>{t('site.merchandiseMgmt.inactiveCount')}</Typography>
            <Typography variant="h4" fontWeight={800} color="text.secondary">{inactiveItems.length}</Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Alert */}
      <Collapse in={!!alert}>
        <Alert severity={alertType} sx={{ mb: 2 }} onClose={() => setAlert('')}>{alert}</Alert>
      </Collapse>

      {/* Action Bar */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Button
            size="small"
            variant={tab === 0 ? 'contained' : 'outlined'}
            onClick={() => setTab(0)}
            startIcon={<CheckCircleIcon />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('site.merchandiseMgmt.inStock')} ({activeItems.length})
          </Button>
          <Button
            size="small"
            variant={tab === 1 ? 'contained' : 'outlined'}
            onClick={() => setTab(1)}
            startIcon={<CancelPresentationIcon />}
            sx={{ textTransform: 'none', fontWeight: 600 }}
          >
            {t('site.merchandiseMgmt.inactive')} ({inactiveItems.length})
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={load}
            sx={{ textTransform: 'none' }}
          >
            Refresh
          </Button>
          {tab === 0 && (
            <Button
              size="small"
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setAddOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              {t('site.merchandiseMgmt.addMerchandise')}
            </Button>
          )}
        </Box>
      </Box>

      {/* Table */}
      <Card sx={{ border: '1px solid #E2E8F0' }} elevation={0}>
        {loading && <LinearProgress />}
        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: '#F8FAFC' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>{t('common.code')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('common.name')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('admin.merchandise.unit')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('site.merchandiseMgmt.stockQuantity')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('status.label')}</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {displayedItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <Box sx={{ opacity: 0.5 }}>
                      <InventoryIcon sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="body2" color="text.secondary">
                        {tab === 0 ? t('site.merchandiseMgmt.noMerchandise') : 'No inactive merchandise'}
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              )}
              {displayedItems.map(item => (
                <TableRow
                  key={item.id}
                  hover
                  sx={{ opacity: item.isActive ? 1 : 0.6, bgcolor: item.isActive ? 'transparent' : '#FAFAFA' }}
                >
                  <TableCell sx={{ fontFamily: 'monospace', fontWeight: 700 }}>{item.merchandiseCode}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>{item.merchandiseName}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={item.unit || 'piece'} size="small" variant="outlined" sx={{ fontSize: '0.7rem', height: 20 }} />
                  </TableCell>
                  <TableCell>
                    {tab === 0 ? (
                      <StockCell
                        value={item.stockQuantity}
                        unit={item.unit}
                        onSave={(qty) => handleUpdateStock(item.id, qty)}
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">{item.stockQuantity || 0}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      icon={item.isActive ? <CheckCircleIcon /> : <CancelPresentationIcon />}
                      label={item.isActive ? t('site.merchandiseMgmt.inStock') : t('site.merchandiseMgmt.outOfStock')}
                      color={item.isActive ? 'success' : 'default'}
                      variant="outlined"
                      sx={{ fontWeight: 600 }}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title={item.isActive ? t('site.merchandiseMgmt.deactivateMerchandise') : t('site.merchandiseMgmt.activateMerchandise')}>
                      <IconButton
                        size="small"
                        onClick={() => handleToggleActive(item)}
                        color={item.isActive ? 'error' : 'success'}
                      >
                        {item.isActive ? <RemoveCircleOutlineIcon /> : <AddIcon />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Add Dialog */}
      <AddMerchandiseDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={handleAdd}
        user={user}
        t={t}
      />
    </Container>
  );
}

export default function SiteMerchandisePage() {
  return (
    <ProtectedRoute allowedRoles={['SITE']}>
      <DashboardLayout><SiteMerchandiseContent /></DashboardLayout>
    </ProtectedRoute>
  );
}
