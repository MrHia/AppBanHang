---
title: FE Custom Hooks — Phase 4 refactor
category: components
tags: [frontend, react-hooks, custom-hooks, refactor-phase-4]
sources: [ITSSFE/src/hooks/]
created: 2026-06-06
updated: 2026-06-06
---

# FE Custom Hooks — Phase 4 refactor

> 3 hooks gom state pattern lặp lại giữa các trang CRUD: `useAlert`, `useCRUDTable`, `useFormDialog`. Trước Phase 4 mỗi trang quản 6-10 `useState` rời rạc.

## Re-export

```js
// src/hooks/index.js (xác minh từ ls)
// xuất useAlert, useCRUDTable, useFormDialog
```

Page import: `import { useAlert, useCRUDTable, useFormDialog } from 'src/hooks';`

## `useAlert()`

Quản lý state snackbar (success/error). Thay 4 dòng `useState` + handlers bằng 1 dòng.

**API:**
```js
const { alert, showSuccess, showError, closeAlert } = useAlert();
```

| Field | Kiểu | Vai trò |
|-------|------|---------|
| `alert` | `{ open, severity, message }` | Pass cho `<AlertSnackbar />` |
| `showSuccess(msg)` | fn | Mở snackbar màu xanh |
| `showError(msg)` | fn | Mở snackbar màu đỏ |
| `closeAlert()` | fn | Đóng snackbar (pass cho `onClose`) |

Pattern: `try { ...; showSuccess(...) } catch (err) { showError(err.message) }`.

## `useCRUDTable(fetcher)`

Encapsulate fetch list + auto-reload (15s polling default).

**API:**
```js
const { items, loading, reload } = useCRUDTable(() => accountApi.getAll());
```

| Field | Kiểu | Vai trò |
|-------|------|---------|
| `items` | array | Data fetched, mặc định `[]` |
| `loading` | boolean | True khi đang fetch |
| `reload()` | fn | Trigger fetch lại ngay (gọi sau create/update/delete) |

**Lưu ý**: hàm `fetcher` phải có **stable identity** giữa các render (define ngoài component hoặc dùng `useCallback`) để tránh re-fetch vô hạn. Trong code thực tế trang admin define ở module level:

```js
const fetchAccounts = () => accountApi.getAll();  // module-level, stable
function AccountsContent() {
  const { items, reload } = useCRUDTable(fetchAccounts);
  // ...
}
```

## `useFormDialog({ initialState })`

State machine cho modal Create/Edit: mở-đóng + form data + edit ID.

**API:**
```js
const form = useFormDialog({ initialState: { email: '', roleName: 'SALES' } });
```

| Field | Kiểu | Vai trò |
|-------|------|---------|
| `form.open` | boolean | Dialog đang mở? |
| `form.formData` | object | Field values hiện tại |
| `form.isEditing` | boolean | Chế độ Edit (có editingId) vs Create |
| `form.editingId` | number\|null | ID của row đang edit (truyền cho `accountApi.update(editingId, ...)`) |
| `form.openDialog(row?)` | fn | Mở dialog. Có `row` → edit mode + pre-fill `formData = row` |
| `form.closeDialog()` | fn | Đóng + reset `formData` về `initialState` |
| `form.setField(key, value)` | fn | Update 1 field (gọi từ `FormDialog` khi user gõ) |

**Lưu ý field rỗng khi update**: payload tới BE cần loại field rỗng để không ghi đè giá trị cũ:
```js
const payload = { ...form.formData };
if (!payload.password) delete payload.password;
if (payload.siteId === '' || payload.siteId == null) delete payload.siteId;
```

## Tác động

Trang CRUD trước Phase 4:
```js
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(false);
const [open, setOpen] = useState(false);
const [formData, setFormData] = useState(INITIAL);
const [editingId, setEditingId] = useState(null);
const [alertOpen, setAlertOpen] = useState(false);
const [alertMessage, setAlertMessage] = useState('');
const [alertSeverity, setAlertSeverity] = useState('success');
// + 6 hàm handler open/close/show/hide...
```

Sau Phase 4:
```js
const { items, reload } = useCRUDTable(fetcher);
const form = useFormDialog({ initialState: INITIAL });
const { alert, showSuccess, showError, closeAlert } = useAlert();
```

→ Giảm ~30 dòng boilerplate per page × 6 trang admin = đáng kể.

## Related

- [[components/fe-component-library]] — components đi cặp
- [[components/frontend-architecture]] — context tổng
- [[analysis/academic-design-patterns]] — Custom Hook pattern
- [[analysis/refactor-roadmap]] — Phase 4

---

## Backlinks
- [[components/frontend-architecture]] — listed
- [[components/fe-component-library]] — đi cặp
