import * as React from 'react';
import { Container, Typography, Button, Box, Chip, IconButton, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import DashboardLayout from 'src/layouts/dashboard';
import ProtectedRoute from 'src/components/ProtectedRoute';
import { DataTable, FormDialog, ConfirmDialog, AlertSnackbar } from 'src/components';
import { useCRUDTable, useFormDialog, useAlert } from 'src/hooks';
import { merchandiseApi } from 'src/api';
import { useTranslation } from 'src/i18n/useTranslation';

const INITIAL_FORM = { code: '', name: '', unit: 'piece', description: '' };

const fetchMerchandise = () => merchandiseApi.getAll();

function MerchandiseContent() {
  const { t } = useTranslation();
  const { items, reload } = useCRUDTable(fetchMerchandise);
  const form = useFormDialog({ initialState: INITIAL_FORM });
  const { alert, showSuccess, showError, closeAlert } = useAlert();
  const [confirmDelete, setConfirmDelete] = React.useState(null);

  const fields = [
    { key: 'code', label: t('admin.merchandise.merchandiseCode'), required: true },
    { key: 'name', label: t('common.name') },
    { key: 'unit', label: t('admin.merchandise.unit') },
    { key: 'description', label: t('admin.merchandise.description'), multiline: true },
  ];

  const handleSave = async () => {
    try {
      await merchandiseApi.create(form.formData);
      showSuccess(t('admin.merchandise.merchandiseCreated'));
      form.closeDialog();
      reload();
    } catch (err) {
      showError(typeof err === 'string' ? err : (err?.message || t('common.error')));
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    const m = confirmDelete;
    try {
      await merchandiseApi.deactivate(m.id);
      showSuccess(`Đã ngừng kinh doanh ${m.code}`);
      reload();
    } catch (err) {
      showError(typeof err === 'string' ? err : (err?.message || 'Xoá thất bại'));
    } finally {
      setConfirmDelete(null);
    }
  };

  const columns = [
    { key: 'code', label: t('common.code'), render: r => <Box component="span" sx={{ fontFamily: 'monospace' }}>{r.code}</Box> },
    { key: 'name', label: t('common.name') },
    { key: 'unit', label: t('admin.merchandise.unit') },
    { key: 'description', label: t('admin.merchandise.description') },
    {
      key: 'status', label: t('status.label'),
      render: r => <Chip label={r.isActive ? t('status.active') : t('status.inactive')} size="small" color={r.isActive ? 'success' : 'default'} />,
    },
    {
      key: 'actions', label: 'Thao tác', align: 'right',
      render: r => r.isActive ? (
        <Tooltip title="Ngừng kinh doanh mặt hàng này">
          <IconButton size="small" color="error" onClick={() => setConfirmDelete(r)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ) : (
        <Typography variant="caption" color="text.disabled">Đã ngừng</Typography>
      ),
    },
  ];

  return (
    <Container maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, mt: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>{t('admin.merchandise.title')}</Typography>
        <Button variant="contained" onClick={() => form.openDialog()}>{t('admin.merchandise.addMerchandise')}</Button>
      </Box>
      <DataTable columns={columns} rows={items} emptyMessage={t('common.noData')} />
      <FormDialog
        open={form.open}
        title={t('admin.merchandise.addNewMerchandise')}
        fields={fields}
        formData={form.formData}
        setField={form.setField}
        onClose={form.closeDialog}
        onSubmit={handleSave}
        submitLabel={t('common.save')}
        cancelLabel={t('common.cancel')}
      />
      <ConfirmDialog
        open={Boolean(confirmDelete)}
        title="Xác nhận ngừng kinh doanh"
        message={confirmDelete ? `Ngừng kinh doanh mặt hàng "${confirmDelete.name}" (${confirmDelete.code})? Tất cả site đang KD mặt hàng này cũng sẽ ngừng.` : ''}
        confirmLabel={t('common.confirm')}
        cancelLabel={t('common.cancel')}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={handleConfirmDelete}
        danger
      />
      <AlertSnackbar alert={alert} onClose={closeAlert} />
    </Container>
  );
}

export default function AdminMerchandise() {
  return <ProtectedRoute allowedRoles={['ADMIN']}><DashboardLayout><MerchandiseContent /></DashboardLayout></ProtectedRoute>;
}
