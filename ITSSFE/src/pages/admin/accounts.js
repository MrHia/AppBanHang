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
import { accountApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';

const ROLE_OPTIONS = ['ADMIN', 'OVERSEAS', 'SITE', 'WAREHOUSE', 'SALES'];
const INITIAL_FORM = { email: '', firstName: '', lastName: '', phone: '', roleName: 'SALES', password: '' };

// Module-level fetcher so the hook's identity stays stable across renders.
const fetchAccounts = () => accountApi.getAll();

function AccountsContent() {
  const { t } = useTranslation();
  const { items: accounts, reload } = useCRUDTable(fetchAccounts);
  const form = useFormDialog({ initialState: INITIAL_FORM });
  const { alert, showSuccess, showError, closeAlert } = useAlert();

  const fields = React.useMemo(() => {
    const base = [
      { key: 'email', label: t('common.email'), type: 'email', required: true },
      { key: 'firstName', label: t('admin.accounts.firstName') },
      { key: 'lastName', label: t('admin.accounts.lastName') },
      { key: 'phone', label: t('common.phone') },
      { key: 'roleName', label: t('admin.accounts.role'), type: 'select', options: ROLE_OPTIONS, required: true },
    ];
    return form.isEditing ? base : [...base, { key: 'password', label: t('admin.accounts.tempPassword'), type: 'password' }];
  }, [t, form.isEditing]);

  const handleSave = async () => {
    try {
      if (form.isEditing) {
        await accountApi.update(form.editingId, form.formData);
        showSuccess(t('admin.accounts.accountUpdated'));
      } else {
        await accountApi.create(form.formData);
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
