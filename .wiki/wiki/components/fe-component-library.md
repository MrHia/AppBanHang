---
title: FE Component Library — Phase 4 refactor
category: components
tags: [frontend, react, mui, reusable, compound, refactor-phase-4]
sources: [ITSSFE/src/components/]
created: 2026-06-06
updated: 2026-06-06
---

# FE Component Library — Phase 4 refactor

> Trước Phase 4 FE chỉ có 2 reusable (`ProtectedRoute`, `Footer`); các trang admin/CRUD copy-paste pattern (Dialog + Table + Snackbar) tới 95% giống nhau. Phase 4 trích xuất thành **7 components + 3 custom hooks** (xem [[components/fe-custom-hooks]]).

## Re-export pattern

```js
// src/components/index.js
export { default as ProtectedRoute } from './ProtectedRoute';
export { default as Footer } from './Footer';
export { default as DataTable } from './DataTable';
export { default as FormDialog } from './FormDialog';
export { default as ConfirmDialog } from './ConfirmDialog';
export { default as StatusChip } from './StatusChip';
export { default as AlertSnackbar } from './AlertSnackbar';
```

Tác dụng: page import 1 dòng `import { DataTable, FormDialog, AlertSnackbar } from 'src/components';` thay vì 3 dòng riêng → giảm noise.

## Components

### 1. `ProtectedRoute` (cũ — giữ nguyên)
Guard role-based access. Check `useAuth().user.roleName` ∈ `allowedRoles`; nếu không → redirect `/auth/login`.
```jsx
<ProtectedRoute allowedRoles={['ADMIN']}>
  <DashboardLayout><AdminAccountsPage /></DashboardLayout>
</ProtectedRoute>
```

### 2. `Footer` (cũ — giữ nguyên)
System name + copyright + lang switcher (VI/EN). Trong cả `DashboardLayout` lẫn `AuthLayout`.

### 3. `DataTable` (Phase 4)
MUI `Table` wrapper, field-driven config:
```jsx
const columns = [
  { key: 'email', label: t('common.email') },
  { key: 'roleName', label: 'Role', render: r => <StatusChip status={r.roleName} /> },
  { key: 'actions', label: 'Actions', render: r => <IconButton .../> },
];
<DataTable columns={columns} rows={items} emptyMessage="Không có dữ liệu" />
```
Property `render` cho custom cell content. Auto handle pagination + empty state.

### 4. `FormDialog` (Phase 4)
Modal CREATE/EDIT theo schema field. Đi cặp với `useFormDialog`:
```jsx
const fields = [
  { key: 'email', label: 'Email', type: 'email', required: true, disabled: form.isEditing },
  { key: 'roleName', label: 'Role', type: 'select', options: ['ADMIN', 'SALES'] },
];
<FormDialog
  open={form.open} title={form.isEditing ? 'Edit' : 'Create'}
  fields={fields} formData={form.formData} setField={form.setField}
  onClose={form.closeDialog} onSubmit={handleSave}
/>
```
Type hỗ trợ: `text`, `email`, `password`, `select` (with `options: string[]` hoặc `[{value, label}]`).

### 5. `ConfirmDialog` (Phase 4)
Modal xác nhận xoá / hành động phá huỷ.
```jsx
<ConfirmDialog open={delConfirm.open} title="Xoá tài khoản?"
  onConfirm={handleDelete} onCancel={delConfirm.close} />
```

### 6. `StatusChip` (Phase 4)
MUI `Chip` với color mapping tự động theo enum (POStatus, RequestStatus, ...):
```jsx
<StatusChip status="CONFIRMED" />   // → green chip
<StatusChip status="REJECTED" />    // → red chip
<StatusChip status="DRAFT" />       // → default chip
```
Color map define trong `StatusChip.js`.

### 7. `AlertSnackbar` (Phase 4)
Toast thông báo, đi cặp với `useAlert`:
```jsx
const { alert, showSuccess, showError, closeAlert } = useAlert();
// ...
<AlertSnackbar alert={alert} onClose={closeAlert} />
// trong handler: showSuccess('Tạo tài khoản thành công') hoặc showError(err.message)
```

## Pattern composition điển hình

Trang CRUD admin (ví dụ [admin/accounts.js](ITSSFE/src/pages/admin/accounts.js)):
```jsx
const { items, reload } = useCRUDTable(() => accountApi.getAll());
const form = useFormDialog({ initialState: INITIAL_FORM });
const { alert, showSuccess, showError, closeAlert } = useAlert();

const handleSave = async () => {
  try {
    form.isEditing ? await accountApi.update(form.editingId, payload)
                   : await accountApi.create(payload);
    showSuccess('OK'); form.closeDialog(); reload();
  } catch (err) { showError(err.message); }
};

return (
  <>
    <DataTable columns={columns} rows={items} />
    <FormDialog ... onSubmit={handleSave} />
    <AlertSnackbar alert={alert} onClose={closeAlert} />
  </>
);
```

Trang `admin/accounts.js` sau Phase 4 ≈ 137 dòng (so với baseline ~350 dòng).

## Related

- [[components/fe-custom-hooks]] — hooks đi kèm
- [[components/frontend-architecture]] — page tree, layouts
- [[analysis/academic-design-patterns]] — Compound Component pattern
- [[analysis/refactor-roadmap]] — Phase 4 status

---

## Backlinks
- [[components/frontend-architecture]] — listed
- [[components/fe-custom-hooks]] — đi cặp
