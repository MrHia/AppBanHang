---
title: UC1 — Auth & Account Lifecycle
category: features
tags: [auth, security, account, bcrypt, lockout, change-password, role-cardinality]
sources: [README.md, CHANGELOG.md, DOCS/USER_GUIDE.md, ITSSBE/.../AccountServiceImpl.java, ITSSBE/.../AuthServiceImpl.java]
created: 2026-06-03
updated: 2026-06-04
---

# UC1 — Auth & Account Lifecycle

> Login → 5-fail lockout → must-change-password → email lifecycle events. Mở rộng 2026-06-04: admin sửa mật khẩu/role mọi user, role cardinality, đổi mật khẩu cho mọi role.

## Behavior summary

| Aspect | Behavior |
|--------|----------|
| Password storage | BCrypt (since v1.1.0); plaintext auto-migrated bởi `PasswordMigrationRunner` |
| Login validation | Email không phân biệt hoa/thường + trim; password min 8 chars |
| Account lockout | 5 lần sai → khóa **30 phút** (`failed_attempts`, `locked_until`). ⚠️ Từng bị vô hiệu bởi @Transactional rollback → đã fix 2026-06-04, xem [[bugs/login-lockout-rollback]] |
| Must-change-password | Set khi Admin tạo account / reset password (mật khẩu tự sinh); buộc đổi lần đầu login |
| Self-protection | Admin **không thể** khóa tài khoản của chính mình (bug fix v1.1.0) |
| **Admin edit (2026-06-04)** | Admin sửa được **mật khẩu** (optional, để trống = giữ) + **role** + **site** của mọi tài khoản |
| **Role cardinality (2026-06-04)** | ADMIN/OVERSEAS/WAREHOUSE **duy nhất**; SITE/SALES **nhiều**. Xem [[decisions/role-cardinality]] |
| **Đổi mật khẩu (2026-06-04)** | **Mọi role** tự đổi mật khẩu qua `/auth/change-password` (nút 🔑 trên AppBar) |
| **First-login enforce (2026-06-04)** | FE `ProtectedRoute` + `login.js` redirect tới change-password khi `mustChangePassword=true` |

## Flow — First login

```
Admin creates account
  → password tạm + must_change_password = TRUE
  → Email gửi tới user với password tạm
    → User login → backend trả về JWT/session + flag mustChangePassword
      → FE redirect tới /auth/change-password
        → POST /api/auth/change-password
        → backend verify old, hash BCrypt, set must_change_password = FALSE
```

## Lockout state machine

```
            (success)                         (5th fail)
LOGIN_OK ◄──────────── ATTEMPTING ─────────────────► LOCKED(30min)
   ▲                       │                            │
   │                       │ (fail < 5)                 │ (30 min elapse)
   │                       ▼                            │
   │                  failed_attempts++ ◄───────────────┘
   │                       │
   └───────────────────────┘ (auto reset failed_attempts on success)
```

## v1.2 ext (2026-06-04) — Account management mở rộng

Yêu cầu user: admin chỉnh sửa account + mật khẩu mọi role; role duy nhất vs nhiều; mọi role tự đổi mật khẩu; first-login mật khẩu tự sinh thì buộc đổi.

**Backend** (`AccountServiceImpl`, `AuthServiceImpl`):
- `update()`: sửa password (BCrypt, optional), role (+ cardinality), site
- `create()`: chặn role duy nhất trùng (`assertRoleCardinality`), gán site nếu có
- 2 luồng đổi mật khẩu admin: **reset-password** (auto-gen + `mustChangePassword=true` + email) vs **update password** (admin gõ tay → `mustChangePassword=false`, chủ ý)
- `AccountRepository.countByRole_Name()` phục vụ cardinality

**Frontend**:
- `pages/auth/change-password.js` (MỚI) — mọi role; first-login hiện cảnh báo + chỉ cho Đăng xuất
- `auth-context.updateUser()` clear cờ sau khi đổi
- `ProtectedRoute` + `login.js` enforce; change-password page KHÔNG bọc ProtectedRoute (tránh redirect loop)
- `admin/accounts.js`: form sửa thêm ô mật khẩu, dropdown Site khi role=SITE, ẩn role duy nhất đã tồn tại, email khóa khi sửa

**Tests**: `AccountServiceTest` (4 — cardinality + password edit), `AuthLoginIntegrationTest` (6 — login/lockout/change-password trên H2). Verified live trên Docker MySQL.

## API surface (verified)

- `POST /api/auth/login`
- `POST /api/auth/change-password?accountId=&oldPassword=&newPassword=` (mọi role)
- `GET/POST/PUT/DELETE /api/accounts` — CRUD (PUT nay sửa cả password/role/site)
- `POST /api/accounts/{id}/lock?actorId=` (self-protection guard)
- `POST /api/accounts/{id}/unlock`
- `POST /api/accounts/{id}/reset-password` (auto-gen + email)

> [!info] Token hiện tại
> `login` trả `token = UUID.randomUUID()` (chưa phải JWT thật) — xem [[open-questions#q-20260603-07]]. SecurityConfig `permitAll()` ([[claims#c-20260603-18]]).

## Data touched

- `account` (must_change_password, failed_attempts, locked_until)
- `role`
- `site` (FK in account for SITE role)
- Email side-effect: SMTP via Spring Mail

## Risks & Refactor notes

> [!warning] Refactor risk
> `PasswordMigrationRunner` chạy trên startup — chưa rõ idempotent thế nào (see [[open-questions#q-20260603-04]]). Trước khi refactor auth, **test kỹ migration path** với DB có cả plaintext và BCrypt mix.

> [!tip] Refactor opportunity
> Hiện chưa dùng JWT — phải verify cách session/token được handle. SecurityConfig (đang được Explore agent map) sẽ trả lời.

> [!info] SMTP secret management
> `application.properties` chứa SMTP credentials → cần move sang env var / vault trong refactor (see [[open-questions#q-20260603-02]]).

## Related

- [[decisions/bcrypt-password-hashing]] — quyết định dùng BCrypt v1.1.0
- [[decisions/role-cardinality]] — ADMIN/OVERSEAS/WAREHOUSE duy nhất (2026-06-04)
- [[bugs/login-lockout-rollback]] — @Transactional rollback làm lockout vô hiệu (fixed 2026-06-04)

---

## Backlinks
- [[overview]] — references UC1
- [[sources/changelog]] — UC1 changes documented in v1.1.0
- [[sources/user-guide]] — login UX documented
- [[bugs/login-lockout-rollback]] — lockout là 1 phần UC1
- [[decisions/role-cardinality]] — account cardinality
