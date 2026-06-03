---
title: Frontend Architecture — Next.js 14 Pages Router
category: components
tags: [frontend, nextjs, react, mui, context, axios]
sources: [ITSSFE/package.json, ITSSFE/src/**, agent-summary]
created: 2026-06-03
updated: 2026-06-03
---

# Frontend Architecture — Next.js 14 Pages Router

> Pages Router (không phải App Router), 2 contexts (Auth + Language), 2 layouts (Dashboard + Auth), 11 API helper groups via Axios. Hoàn toàn CSR + sessionStorage auth.

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

## Page tree (27 pages)

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
│   ├── process-request.js                 # UC6 step 1 (entry)
│   ├── process-request/[id].js            # UC6 step 2-5 (multi-step)
│   ├── order-matrix/[id].js               # UC6 step 5 detail
│   └── purchase-orders.js
├── site/
│   ├── dashboard.js
│   ├── merchandise.js                     # UC stock mgmt
│   ├── inquiries.js                       # UC7 respond
│   ├── purchase-orders.js                 # UC13 confirm/reject
│   └── discrepancies.js                   # UC19 respond
└── warehouse/
    ├── dashboard.js
    ├── confirmed-pos.js                   # UC15 list
    ├── receive/[id].js                    # UC15 detail receive
    └── discrepancies.js                   # UC20 resolve
```

## Contexts (2)

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

### API groups (11)

| Group | Purpose | Endpoints used |
|-------|---------|----------------|
| authApi | login, change-password | `/api/auth/*` |
| accountApi | CRUD + lock/unlock + reset | `/api/accounts/*` |
| siteApi | CRUD | `/api/sites/*` |
| merchandiseApi | CRUD | `/api/merchandise/*` |
| siteMerchandiseApi | per-site catalog | `/api/site-merchandise/*` |
| requestApi | Full workflow (≈18 methods) | `/api/requests/*` |
| inquiryApi | get, respond, matrix | `/api/inquiries/*` |
| poApi | DRAFT/SENT/CONFIRM/REJECT/DONE | `/api/po/*` |
| warehouseApi | receive + discrepancy | `/api/warehouse/*` |
| discrepancyApi | chat | `/api/discrepancies/*` |
| notificationApi | bell | `/api/notifications/*` |
| auditApi | log query | `/api/audit/*` |

## i18n

| File | Size | Categories |
|------|------|-----------|
| `en.json` | ~13.6 KB | common, notifications, status, nav, footer, admin.*, sales.*, overseas.*, site.*, warehouse.* |
| `vi.json` | ~15 KB | (mirror of en.json) |

Pattern: `t('nav.dashboard')` → `dict.nav.dashboard`.

## Shared components

- `ProtectedRoute` — check `isAuthenticated` + `allowedRoles`; redirect `/auth/login` nếu fail
- `Footer` — system name + copyright + lang switcher

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

- [[components/auth-context]] (sẽ tạo — chi tiết)
- [[components/language-context]] (sẽ tạo)
- [[components/api-client]] (sẽ tạo)
- [[analysis/refactor-roadmap]] (sẽ tạo)

---

## Backlinks
- [[overview]] — references FE stack
- [[features/uc1-auth-lifecycle]] — uses AuthContext
- [[features/uc6-overseas-process-request]] — main FE complexity
