import * as React from 'react';
import { Container, Typography, Table, TableBody, TableCell, TableHead, TableRow, Button, Dialog, DialogTitle, DialogContent, DialogActions, Box, Chip, IconButton, Tooltip, Alert } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { DataTable, FormDialog, ConfirmDialog, AlertSnackbar } from 'src/components';
import { useCRUDTable, useFormDialog, useAlert } from 'src/hooks';
import { siteApi, siteMerchandiseApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';

const INITIAL_FORM = { code: '', name: '', country: '', email: '', phone: '', address: '' };

const fetchSites = () => siteApi.getAll();

function SitesContent() {
  const { t } = useTranslation();
  const { items: sites, reload } = useCRUDTable(fetchSites);
  const form = useFormDialog({ initialState: INITIAL_FORM });
  const { alert, showSuccess, showError, closeAlert } = useAlert();

  // Products-by-site dialog state
  const [prodOpen, setProdOpen] = React.useState(false);
  const [prodSite, setProdSite] = React.useState(null);
  const [products, setProducts] = React.useState([]);
  const [confirmRemoveProd, setConfirmRemoveProd] = React.useState(null);

  // Credentials reveal dialog (shown after site create returns generated login)
  const [credOpen, setCredOpen] = React.useState(false);
  const [credInfo, setCredInfo] = React.useState(null);

  const reloadProducts = async (siteId) => {
    try {
      const r = await siteMerchandiseApi.getBySite(siteId);
      setProducts(Array.isArray(r) ? r : (Array.isArray(r?.data) ? r.data : []));
    } catch (e) { console.error(e); }
  };

  const openProducts = async (site) => {
    setProdSite(site);
    setProducts([]);
    setProdOpen(true);
    reloadProducts(site.id);
  };

  const handleConfirmRemoveProduct = async () => {
    if (!confirmRemoveProd || !prodSite) return;
    const p = confirmRemoveProd;
    try {
      await siteMerchandiseApi.removeMerchandise(p.id);
      await reloadProducts(prodSite.id);
    } catch (err) {
      showError(typeof err === 'string' ? err : (err?.message || 'Xoá thất bại'));
    } finally {
      setConfirmRemoveProd(null);
    }
  };

  const handleSave = async () => {
    if (!form.formData.code?.trim()) {
      showError('Vui lòng nhập mã site (ví dụ: SITE-VN-001)');
      return;
    }
    try {
      const res = await siteApi.create(form.formData);
      const data = res?.data || res;
      if (data?.generatedEmail && data?.generatedPassword) {
        setCredInfo({ siteName: data.name || form.formData.name, email: data.generatedEmail, password: data.generatedPassword });
        setCredOpen(true);
      } else {
        showSuccess(t('admin.sites.siteCreated'));
      }
      form.closeDialog();
      reload();
    } catch (err) {
      showError(typeof err === 'string' ? err : (err?.message || t('common.error')));
    }
  };

  const fields = [
    { key: 'code', label: t('common.code'), required: true },
    { key: 'name', label: t('admin.sites.siteName') },
    { key: 'country', label: t('admin.sites.country') },
    { key: 'email', label: t('common.email') },
    { key: 'phone', label: t('common.phone') },
    { key: 'address', label: t('admin.sites.address'), multiline: true },
  ];

  const columns = [
    { key: 'code', label: t('common.code'), render: r => <Box component="span" sx={{ fontFamily: 'monospace' }}>{r.code}</Box> },
    { key: 'name', label: t('common.name') },
    { key: 'country', label: t('admin.sites.country') },
    { key: 'email', label: t('common.email') },
    {
      key: 'status', label: t('status.label'),
      render: r => <Chip label={r.isActive ? t('status.active') : t('status.inactive')} size="small" color={r.isActive ? 'success' : 'default'} />,
    },
    {
      key: 'products', label: 'Sản phẩm',
      render: r => <Button size="small" variant="outlined" onClick={() => openProducts(r)}>Xem sản phẩm</Button>,
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{t('admin.sites.title')}</Typography>
        <Button variant="contained" onClick={() => form.openDialog()}>{t('admin.sites.addSite')}</Button>
      </Box>
      <DataTable columns={columns} rows={sites} emptyMessage={t('common.noData')} />

      <FormDialog
        open={form.open}
        title={t('admin.sites.addNewSite')}
        fields={fields}
        formData={form.formData}
        setField={form.setField}
        onClose={form.closeDialog}
        onSubmit={handleSave}
        submitLabel={t('common.save')}
        cancelLabel={t('common.cancel')}
      />

      {/* Dialog: hiển thị tài khoản + mật khẩu tạm thời sau khi tạo site */}
      <Dialog open={credOpen} onClose={() => setCredOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Tạo site thành công</DialogTitle>
        <DialogContent dividers>
          <Alert severity="success" sx={{ mb: 2 }}>
            Đã tạo site <b>{credInfo?.siteName}</b> kèm tài khoản đăng nhập. Vui lòng lưu lại thông tin bên dưới — mật khẩu sẽ không hiển thị lại.
          </Alert>
          <Box sx={{ bgcolor: '#F4F6F8', p: 2, borderRadius: 1, fontFamily: 'monospace' }}>
            <Box sx={{ mb: 1 }}><b>Email:</b> {credInfo?.email}</Box>
            <Box><b>Mật khẩu tạm thời:</b> {credInfo?.password}</Box>
          </Box>
          <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>
            Site sẽ được yêu cầu đổi mật khẩu trong lần đăng nhập đầu tiên. Email cũng đã được gửi tới địa chỉ liên hệ của site.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { navigator.clipboard?.writeText(`Email: ${credInfo?.email}\nMật khẩu: ${credInfo?.password}`); }}>Copy</Button>
          <Button variant="contained" onClick={() => setCredOpen(false)}>Đã lưu</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog: sản phẩm của site */}
      <Dialog open={prodOpen} onClose={() => setProdOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Sản phẩm site {prodSite?.code} kinh doanh</DialogTitle>
        <DialogContent dividers>
          <Table size="small">
            <TableHead><TableRow><TableCell sx={{ fontWeight: 600 }}>Mã</TableCell><TableCell sx={{ fontWeight: 600 }}>Tên</TableCell><TableCell sx={{ fontWeight: 600 }}>ĐV</TableCell><TableCell sx={{ fontWeight: 600 }}>Trạng thái</TableCell><TableCell sx={{ fontWeight: 600 }} align="right">Thao tác</TableCell></TableRow></TableHead>
            <TableBody>
              {products.map(p => (
                <TableRow key={p.id}>
                  <TableCell sx={{ fontFamily: 'monospace' }}>{p.merchandiseCode}</TableCell>
                  <TableCell>{p.merchandiseName}</TableCell>
                  <TableCell>{p.unit || '—'}</TableCell>
                  <TableCell><Chip size="small" label={p.isActive ? 'Đang KD' : 'Ngừng'} color={p.isActive ? 'success' : 'default'} /></TableCell>
                  <TableCell align="right">
                    {p.isActive ? (
                      <Tooltip title="Xoá mặt hàng khỏi site">
                        <IconButton size="small" color="error" onClick={() => setConfirmRemoveProd(p)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    ) : (
                      <Typography variant="caption" color="text.disabled">Đã xoá</Typography>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {products.length === 0 && <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Site này chưa kinh doanh mặt hàng nào.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </DialogContent>
        <DialogActions><Button onClick={() => setProdOpen(false)}>Đóng</Button></DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(confirmRemoveProd)}
        title="Xác nhận xoá"
        message={confirmRemoveProd && prodSite ? `Xoá mặt hàng "${confirmRemoveProd.merchandiseName}" khỏi site ${prodSite.code}?` : ''}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirmRemoveProd(null)}
        onConfirm={handleConfirmRemoveProduct}
        danger
      />

      <AlertSnackbar alert={alert} onClose={closeAlert} />
    </Container>
  );
}

export default function AdminSites() {
  return <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><SitesContent /></DashboardLayout></ProtectedRoute>;
}
