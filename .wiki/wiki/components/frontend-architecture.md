---
title: Frontend Architecture — Next.js 14 Pages Router
category: components
tags: [frontend, nextjs, react, mui, context, axios, refactor-phase-4-done]
sources: [ITSSFE/package.json, ITSSFE/src/**, agent-summary]
created: 2026-06-03
updated: 2026-06-06
---

# Frontend Architecture — Next.js 14 Pages Router

> Pages Router (không phải App Router), 1 AuthContext + 1 LanguageContext (vị trí khác nhau), 2 layouts (Dashboard + Auth), 11 API helper groups via Axios. CSR + sessionStorage auth. **Phase 4 refactor done**: từ 2 reusable components → 7, thêm 3 custom hooks (useAlert, useCRUDTable, useFormDialog) gom CRUD logic.

## Tech stack

| Concern | Tech |
|---------|------|
| Framework | Next.js 14.0.4 (Pages Router) |
| UI | React 18.2.0 + MUI v5.15 + Emotion 11.11 |
| HTTP | Axios 1.6 |
| State | React Context (Auth, Language) |
| Persistence | sessionStorage (auth token, user, locale) |
| Routing | File-system based (`src/pages/`) |
| i18n | Custom (vi.json / en.json) |

## Page tree (27 pages — `site/inquiries.js` removed 2026-06-06)

```
src/pages/
├── index.js                              # Root redirect
├── _app.js                                # Global providers
├── _document.js                           # HTML wrapper
├── auth/
│   └── login.js                           # Login form
├── admin/
│   ├── dashboard.js
│   ├── accounts.js
│   ├── sites.js
│   ├── merchandise.js
│   ├── order-requests.js
│   └── purchase-orders.js
├── sales/
│   ├── dashboard.js
│   ├── create-request.js                  # UC4
│   └── my-requests.js
├── overseas/
│   ├── dashboard.js
│   ├── requests.js
│   ├── process-request.js                 # UC6 entry
│   ├── process-request/[id].js            # UC6 2-step wizard (180L, post-split)
│   ├── order-matrix/[id].js               # Stock matrix detail (đọc từ SiteMerchandise)
│   └── purchase-orders.js
├── site/
│   ├── dashboard.js
│   ├── merchandise.js                     # Site quản lý stock (single source of truth)
│   ├── purchase-orders.js                 # UC13 confirm/cancel (cascades)
│   └── discrepancies.js                   # UC19 respond
└── warehouse/
    ├── dashboard.js
    ├── confirmed-pos.js                   # UC15 list
    ├── receive/[id].js                    # UC15 detail receive
    └── discrepancies.js                   # UC20 resolve
```

## Contexts (2 — vị trí khác nhau)

`src/contexts/` chỉ có **AuthContext**. LanguageContext sống ở `src/i18n/LanguageContext.js` (gắn liền dictionary), không trong `contexts/`.

### AuthContext (`src/contexts/auth-context.js`)

```js
state = { isAuthenticated, isLoading, user }
user  = { id, email, firstName, lastName, roleName, siteId, siteCode, mustChangePassword, token }
```

Actions: `INITIALIZE`, `SIGN_IN`, `SIGN_OUT`. Persists via sessionStorage keys `token` + `user`.

`signIn(email, password)`: gọi authApi.login → dispatch SIGN_IN.

`signOut()`: clear sessionStorage → dispatch SIGN_OUT.

### LanguageContext (`src/i18n/LanguageContext.js`)

```js
state = { locale: 'en' | 'vi', t, ready }
```

`t(key, fallback?)` truy cập nested dot-key. Fallback chain: locale → English → raw key. Persist via `app_locale` key trong sessionStorage. Update `<html lang="...">` khi đổi.

## Layouts (2)

### DashboardLayout (`src/layouts/dashboard/`)

- **AppBar**: menu toggle + system title + role label + notification bell + user name + logout
- **Drawer (240px)**: role-specific nav items (Dashboard, role pages)
- **Main content**: gray bg, 3px padding, flexgrow
- **Footer**: language switcher VI/EN
- **Easter eggs**: Konami code + `devlang` hotkey (dev-only language toggle)
- **Notifications**: bell icon + unread count + dropdown + role-based deep-link routing

### AuthLayout (`src/layouts/auth/`)

- Centered flex container + Footer
- Used by `/auth/login` page only

## API client (`src/api/index.js`)

- **baseURL**: `http://localhost:8081/api`
- **Request interceptor**: inject `Authorization: Bearer {sessionStorage.token}`
- **Response interceptor**: unwrap `{success, message, data}` → `data`
- **401 handler**: clear sessionStorage → redirect `/auth/login`

### API groups (10 — `inquiryApi` removed 2026-06-06)

| Group | Purpose | Endpoints used |
|-------|---------|----------------|
| authApi | login, change-password | `/api/auth/*` |
| accountApi | CRUD + lock/unlock + reset | `/api/accounts/*` |
| siteApi | CRUD | `/api/sites/*` |
| merchandiseApi | CRUD | `/api/merchandise/*` |
| siteMerchandiseApi | per-site catalog + stock (single source of truth) | `/api/site-merchandise/*` |
| requestApi | 2-step workflow (assign sites → create PO batch) | `/api/requests/*` |
| poApi | DRAFT/SENT/CONFIRM/REJECT/DONE — reject **cascades** parent + siblings | `/api/po/*` |
| warehouseApi | receive + discrepancy | `/api/warehouse/*` |
| discrepancyApi | chat | `/api/discrepancies/*` |
| notificationApi | bell | `/api/notifications/*` |
| auditApi | log query | `/api/audit/*` |

> [!info] Removed 2026-06-06
> `inquiryApi` đã xóa cùng stock-inquiry subsystem. `requestApi` mất 3 methods: `sendInquiries`, `getInquiryStatus`, `getInventoryMatrix`. Xem [[decisions/remove-stock-inquiry]].

## i18n

| File | Size | Categories |
|------|------|-----------|
| `en.json` | ~13.6 KB | common, notifications, status, nav, footer, admin.*, sales.*, overseas.*, site.*, warehouse.* |
| `vi.json` | ~15 KB | (mirror of en.json) |

Pattern: `t('nav.dashboard')` → `dict.nav.dashboard`.

## Shared components (7 — Phase 4 refactor done)

> Trước Phase 4: chỉ 2 reusable (`ProtectedRoute`, `Footer`). Phase 4 thêm 5 components + 3 hooks để gom CRUD pattern lặp lại 95% giữa các trang admin (accounts/sites/merchandise/...).

Re-exported từ `src/components/index.js`:

| Component | Vai trò | Usage pattern |
|-----------|---------|---------------|
| `ProtectedRoute` | Guard role-based access, redirect `/auth/login` | Bọc page-level: `<ProtectedRoute allowedRoles={['ADMIN']}>...</ProtectedRoute>` |
| `Footer` | System name + copyright + lang switcher | Trong layouts |
| `DataTable` | Bảng CRUD với columns + rows + emptyMessage | `<DataTable columns={...} rows={accounts} />` |
| `FormDialog` | Modal Create/Edit; field-driven (key, label, type, options) | Đi cặp với `useFormDialog` hook |
| `ConfirmDialog` | Modal xác nhận xoá | `<ConfirmDialog open onConfirm={...}>` |
| `StatusChip` | MUI Chip với màu mapped sang status enum (POStatus, RequestStatus, ...) | Trong DataTable column render |
| `AlertSnackbar` | Toast success/error với auto-close | Đi cặp với `useAlert` hook |

## Custom hooks (`src/hooks/`, 3 — Phase 4)

Mỗi hook encapsulate 1 concern lặp lại giữa các trang CRUD:

| Hook | Trả về | Khi dùng |
|------|--------|----------|
| `useAlert()` | `{ alert, showSuccess, showError, closeAlert }` | Thay thế `useState` cho snackbar — gọn 1 dòng thay vì 4 |
| `useCRUDTable(fetcher)` | `{ items, loading, reload }` + 15s auto-poll | Trang nào hiển thị list + cần refresh |
| `useFormDialog({ initialState })` | `{ open, formData, isEditing, editingId, openDialog, closeDialog, setField }` | Mọi page có nút Create/Edit |

**Pattern composition** (xem ví dụ thực tế trong [admin/accounts.js](ITSSFE/src/pages/admin/accounts.js)):

```js
const { items, reload } = useCRUDTable(() => accountApi.getAll());
const form = useFormDialog({ initialState: INITIAL_FORM });
const { alert, showSuccess, showError, closeAlert } = useAlert();
// ... render <DataTable />, <FormDialog />, <AlertSnackbar />
```

Tác động: trang `admin/accounts.js` sau Phase 4 ≈ 137 lines so với pattern cũ ≈ 350+ lines (theo [[analysis/academic-code-review]] gốc).

## Build config

- `jsconfig.json`: paths `src/*` → `src/*` (alias)
- `next.config.js`: `reactStrictMode: true`, không có middleware/rewrites/redirects
- `_app.js`: provider chain AuthProvider → LanguageProvider → ThemeProvider → CssBaseline

## Risks & Refactor notes

> [!warning] CSR-only, no SSR/ISR
> Pages Router với sessionStorage auth = **không thể SSR** (sessionStorage chỉ tồn tại browser). Mọi page sẽ flash login state. Refactor cân nhắc App Router + cookies thay sessionStorage để enable SSR.

> [!warning] sessionStorage token = mất khi tab close
> UX: user phải re-login mỗi tab mới. Refactor: cookie HttpOnly + refresh token.

> [!info] Multi-step state trong `process-request/[id].js`
> 1 file đảm nhận 4 bước (Pick site, send inquiry, track, aggregate). Cần verify state persistence (URL params hay backend?). Refactor: tách thành 4 sub-routes.

> [!tip] No state management library
> Chỉ dùng React Context. Đủ cho hiện tại nhưng nếu UI complexity tăng (especially process-request) → cần **Zustand / Redux Toolkit / TanStack Query** (server state caching).

> [!tip] No data fetching abstraction
> Mỗi page tự `useEffect` + axios. Refactor: **TanStack Query** giúp caching, loading state, retry, optimistic update.

> [!warning] Easter eggs in production
> Konami code + `devlang` hotkey nên disable in prod build (see [[open-questions#q-20260603-01]]).

## Related

- [[components/fe-component-library]] — 7 reusable components chi tiết (Phase 4)
- [[components/fe-custom-hooks]] — 3 hooks chi tiết (Phase 4)
- [[analysis/refactor-roadmap]] — Status: Phase 4 done

---

## Backlinks
- [[overview]] — references FE stack
- [[features/uc1-auth-lifecycle]] — uses AuthContext
- [[features/uc6-overseas-process-request]] — main FE complexity
