---
title: UC1 — Auth & Account Lifecycle
category: features
tags: [auth, security, account, bcrypt, lockout]
sources: [README.md, CHANGELOG.md, DOCS/USER_GUIDE.md]
created: 2026-06-03
updated: 2026-06-03
---

# UC1 — Auth & Account Lifecycle

> Login → 5-fail lockout → must-change-password → email lifecycle events.

## Behavior summary

| Aspect | Behavior |
|--------|----------|
| Password storage | BCrypt (since v1.1.0); plaintext auto-migrated bởi `PasswordMigrationRunner` |
| Login validation | Email không phân biệt hoa/thường; password validation min 8 chars |
| Account lockout | 5 lần sai → khóa **30 phút** (cột `failed_attempts`, `locked_until`) (see [[claims#c-20260603-10]]) |
| Must-change-password | Set sau khi Admin tạo account hoặc reset password; require đổi mật khẩu trên lần đầu login |
| Self-protection | Admin **không thể** khóa tài khoản của chính mình (bug fix v1.1.0) |

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

## API surface (preliminary)

> Sẽ verify khi map controller xong.

- `POST /api/auth/login`
- `POST /api/auth/change-password`
- `POST /api/auth/logout`
- `POST /api/accounts` (admin only)
- `POST /api/accounts/{id}/lock` (admin only — self-protection)
- `POST /api/accounts/{id}/reset-password` (admin only)

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

- [[decisions/bcrypt-password-hashing]] (sẽ tạo — quyết định dùng BCrypt v1.1.0)
- [[bugs/admin-self-lock]] (sẽ tạo — đã fix v1.1.0)

---

## Backlinks
- [[overview]] — references UC1
- [[sources/changelog]] — UC1 changes documented in v1.1.0
- [[sources/user-guide]] — login UX documented
