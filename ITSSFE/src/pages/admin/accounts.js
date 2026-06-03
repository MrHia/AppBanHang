import * as React from 'react';
import { Container, Typography, Button, Box, Chip, IconButton, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import KeyIcon from '@mui/icons-material/Key';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { DataTable, FormDialog, AlertSnackbar } from 'src/components';
import { useCRUDTable, useFormDialog, useAlert } from 'src/hooks';
import { accountApi, siteApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';

const ROLE_OPTIONS = ['ADMIN', 'OVERSEAS', 'SITE', 'WAREHOUSE', 'SALES'];
// Vai trò duy nhất (chỉ 1 tài khoản). SITE/SALES được phép nhiều.
const UNIQUE_ROLES = ['ADMIN', 'OVERSEAS', 'WAREHOUSE'];
const INITIAL_FORM = { email: '', firstName: '', lastName: '', phone: '', roleName: 'SALES', password: '', siteId: '' };

// Module-level fetcher so the hook's identity stays stable across renders.
const fetchAccounts = () => accountApi.getAll();

function AccountsContent() {
  const { t } = useTranslation();
  const { items: accounts, reload } = useCRUDTable(fetchAccounts);
  const form = useFormDialog({ initialState: INITIAL_FORM });
  const { alert, showSuccess, showError, closeAlert } = useAlert();
  const [sites, setSites] = React.useState([]);

  React.useEffect(() => {
    siteApi.getAll().then(s => setSites(Array.isArray(s) ? s : [])).catch(() => {});
  }, []);

  // Tập hợp role duy nhất đã có tài khoản → ẩn khỏi danh sách khi tạo mới.
  const takenUniqueRoles = React.useMemo(
    () => new Set((accounts || []).filter(a => UNIQUE_ROLES.includes(a.roleName)).map(a => a.roleName)),
    [accounts]
  );

  const fields = React.useMemo(() => {
    const roleOptions = ROLE_OPTIONS.filter(r => {
      if (!UNIQUE_ROLES.includes(r)) return true;                       // SITE/SALES luôn có
      if (form.isEditing && form.formData.roleName === r) return true;  // giữ role hiện tại khi sửa
      return !takenUniqueRoles.has(r);                                  // ẩn role duy nhất đã tồn tại
    });
    const list = [
      { key: 'email', label: t('common.email'), type: 'email', required: true, disabled: form.isEditing },
      { key: 'firstName', label: t('admin.accounts.firstName') },
      { key: 'lastName', label: t('admin.accounts.lastName') },
      { key: 'phone', label: t('common.phone') },
      { key: 'roleName', label: t('admin.accounts.role'), type: 'select', options: roleOptions, required: true },
    ];
    // Chọn site khi role = SITE để tài khoản gắn đúng địa điểm.
    if (form.formData.roleName === 'SITE') {
      list.push({
        key: 'siteId', label: t('admin.accounts.site', 'Site'), type: 'select',
        options: (sites || []).map(s => ({ value: s.id, label: `${s.code} - ${s.name}` })),
      });
    }
    // Mật khẩu: tạo = mật khẩu tạm (trống → BE tự sinh); sửa = đổi mật khẩu (trống → giữ nguyên).
    list.push({
      key: 'password', type: 'password',
      label: form.isEditing
        ? t('admin.accounts.newPasswordOptional', 'Mật khẩu mới (để trống nếu giữ nguyên)')
        : t('admin.accounts.tempPassword'),
    });
    return list;
  }, [t, form.isEditing, form.formData.roleName, sites, takenUniqueRoles]);

  const handleSave = async () => {
    try {
      // Loại field rỗng để BE update theo kiểu partial (không ghi đè bằng giá trị trống).
      const payload = { ...form.formData };
      if (!payload.password) delete payload.password;
      if (payload.siteId === '' || payload.siteId == null) delete payload.siteId;

      if (form.isEditing) {
        await accountApi.update(form.editingId, payload);
        showSuccess(t('admin.accounts.accountUpdated'));
      } else {
        await accountApi.create(payload);
        showSuccess(t('admin.accounts.accountCreated'));
      }
      form.closeDialog();
      reload();
    } catch (err) {
      showError(typeof err === 'string' ? err : (err?.message || t('common.error')));
    }
  };

  const handleAction = async (id, action) => {
    try {
      if (action === 'lock') await accountApi.lock(id);
      else if (action === 'unlock') await accountApi.unlock(id);
      else if (action === 'reset') await accountApi.resetPassword(id);
      reload();
    } catch (err) {
      showError(typeof err === 'string' ? err : (err?.message || t('common.error')));
    }
  };

  const columns = [
    { key: 'email', label: t('common.email') },
    { key: 'name', label: t('admin.accounts.fullName'), render: r => `${r.firstName || ''} ${r.lastName || ''}`.trim() },
    {
      key: 'roleName', label: t('admin.accounts.role'),
      render: r => <Chip label={r.roleName} size="small" color={r.roleName === 'ADMIN' ? 'error' : r.roleName === 'SITE' ? 'warning' : 'default'} />,
    },
    {
      key: 'status', label: t('status.label'),
      render: r => <Chip label={r.isActive ? t('status.active') : t('status.locked')} size="small" color={r.isActive ? 'success' : 'error'} />,
    },
    {
      key: 'actions', label: t('common.actions'),
      render: r => (
        <Stack direction="row" spacing={0.5}>
          <IconButton size="small" onClick={() => form.openDialog(r)} title={t('common.save')}><EditIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => handleAction(r.id, 'lock')} title={t('admin.accounts.lock')}><LockIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => handleAction(r.id, 'unlock')} title={t('admin.accounts.unlock')}><LockOpenIcon fontSize="small" /></IconButton>
          <IconButton size="small" onClick={() => handleAction(r.id, 'reset')} title={t('admin.accounts.resetPassword')}><KeyIcon fontSize="small" /></IconButton>
        </Stack>
      ),
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{t('admin.accounts.title')}</Typography>
        <Button variant="contained" onClick={() => form.openDialog()}>{t('admin.accounts.createAccount')}</Button>
      </Box>
      <DataTable columns={columns} rows={accounts} emptyMessage={t('common.noData')} />
      <FormDialog
        open={form.open}
        title={form.isEditing ? t('admin.accounts.updateAccount') : t('admin.accounts.createNewAccount')}
        fields={fields}
        formData={form.formData}
        setField={form.setField}
        onClose={form.closeDialog}
        onSubmit={handleSave}
        submitLabel={t('common.save')}
        cancelLabel={t('common.cancel')}
      />
      <AlertSnackbar alert={alert} onClose={closeAlert} />
    </Container>
  );
}

export default function AdminAccounts() {
  return <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><AccountsContent /></DashboardLayout></ProtectedRoute>;
}
