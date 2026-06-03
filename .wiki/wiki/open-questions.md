---
title: Open Questions
category: meta
created: 2026-06-03
updated: 2026-06-03
---

# Open Questions

Things the wiki cannot answer yet. Move entries out when resolved (link to the page that answered it).

## Format

```markdown
### q-YYYYMMDD-NN — <question>
- **Why it matters**: short impact statement
- **Where it surfaced**: [[components/x]] / `raw/meetings/2025-01-15.md`
- **Candidates / partial info**: optional
- **Status**: open | answered → [[decisions/...]] | obsolete
```

## Open

<!-- Append new questions below. -->

### q-20260603-01 — i18n dev-only switching: có disable trong prod build không?
- **Why it matters**: Konami code / `devlang` hotkey không nên có trong prod (security/UX). Refactor cần tách thành dev-only.
- **Where it surfaced**: `README.md:120-124`, [[sources/project-readme]]
- **Status**: open

### q-20260603-02 — Email SMTP credentials: cách quản lý secret cho prod?
- **Why it matters**: README hint phải tự update `spring.mail.*` trong application.properties — không an toàn cho production.
- **Where it surfaced**: `README.md:134`, [[sources/project-readme]]
- **Status**: open

### q-20260603-03 — Version history trước v1.1.0 (v1.0.0, v1.0.1)?
- **Why it matters**: DOCS có docx `v1.0.0` và `v1.0.1` nhưng CHANGELOG chỉ liệt kê v1.1.0. Có thể bị mất history.
- **Where it surfaced**: `DOCS/`, `CHANGELOG.md`, [[sources/changelog]]
- **Status**: open

### q-20260603-04 — `PasswordMigrationRunner` chỉ chạy 1 lần hay mỗi startup?
- **Why it matters**: Idempotent migration runner ảnh hưởng startup time + có thể có race condition nếu chạy nhiều instance.
- **Where it surfaced**: `CHANGELOG.md:11`, `README.md:157`, [[sources/project-readme]]
- **Status**: open

### q-20260603-05 — Stock reference value: snapshot khi gửi inquiry hay realtime?
- **Why it matters**: Ảnh hưởng tới tính chính xác khi Overseas xem stock reference. Nếu realtime, có race condition khi Site update concurrent.
- **Where it surfaced**: `DOCS/USER_GUIDE.md:186-188`, [[sources/user-guide]]
- **Status**: open

### q-20260603-06 — Partial response (Site phản hồi 1 phần items): workflow tiếp tục thế nào?
- **Why it matters**: USER_GUIDE chỉ ghi "Một phần" status nhưng không nói có thể tạo PO với items được phản hồi không.
- **Where it surfaced**: `DOCS/USER_GUIDE.md:164`, [[sources/user-guide]]
- **Status**: open

### q-20260603-07 — Token format hiện tại: JWT hay plaintext user ID? ⚠️
- **Why it matters**: FE gửi `Authorization: Bearer <token>` nhưng BE permitAll() — không thấy filter parse. Cần verify token là gì + BE service nào đang verify (nếu có).
- **Where it surfaced**: SecurityConfig (no JWT filter chain), AuthContext (token field)
- **Status**: open

### q-20260603-08 — `account.is_active=false` có disable login không?
- **Why it matters**: Soft-delete consistency. Nếu chỉ FE check, ai gọi BE API vẫn login được.
- **Where it surfaced**: [[data/schema-overview]], AuthService impl chưa verify
- **Status**: open

### q-20260603-09 — Email service block hay async? Có retry không?
- **Why it matters**: Nếu sync, SMTP timeout có thể block PO confirm (UC13). Cần verify `@Async` + retry policy.
- **Where it surfaced**: `IEmailService` (PO confirm trigger), [[features/uc11-12-purchase-order-lifecycle]]
- **Status**: open

### q-20260603-10 — Multi-instance backend: scheduler chạy đồng thời?
- **Why it matters**: Nếu deploy ≥2 nodes, scheduler chạy song song có thể double-process TIMEOUT update. Cần ShedLock hoặc leader election.
- **Where it surfaced**: [[features/uc7-stock-inquiry-timeout]]
- **Status**: open

## Answered
