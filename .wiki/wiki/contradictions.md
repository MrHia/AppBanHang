---
title: Contradictions
category: meta
created: 2026-06-03
updated: 2026-06-03
---

# Contradictions

When a new source disputes an existing claim or page, record it here instead of overwriting silently. Keep both sides until resolved.

## Format

```markdown
### x-YYYYMMDD-NN — <topic>
- **Claim A** ([[claims#c-...]] or page ref): "..."
  - Source: `raw/docs/...`
- **Claim B** (newer, conflicting): "..."
  - Source: `raw/feedback/...`
- **Status**: open | resolved → A | resolved → B | superseded by [[decisions/...]]
- **Resolution notes**:
```

## Open contradictions

<!-- Append below. Move resolved entries to "Resolved" with the decision link. -->

### x-20260606-01 — plain_password column vs BCrypt-only decision
- **Claim A** ([[decisions/bcrypt-password-hashing]]): "Compromise DB không lộ password trực tiếp" — chỉ lưu BCrypt hash, không lưu plaintext.
  - Source: `CHANGELOG.md` v1.1.0 + decision page.
- **Claim B** (newer, conflicting): Account entity nay có thêm cột `plain_password VARCHAR(100)` lưu song song với hash; trang `/admin/accounts` hiển thị plain text cho ADMIN xem.
  - Source: branch `refactor-all-code` (commit chưa stage) — `Account.java:20-22`, `schema.sql:46-48`, `accounts.js:94-99`, `AccountServiceImpl` + `AuthServiceImpl` + `SiteServiceImpl` + `PasswordMigrationRunner`.
- **Status**: open — đang chờ quyết định chính thức (giả định mục đích demo/BTL).
- **Resolution notes**: Cảnh báo trong code (`// CẢNH BÁO: ... KHÔNG dùng production`) và schema comment đã có. Nếu giữ làm feature demo, cần page [[decisions/plain-password-demo-feature]] mô tả scope (chỉ admin, chỉ branch demo) + plan rollback trước production. Backend hiện KHÔNG có role-check trên `GET /api/accounts` → bất kỳ caller nào cũng đọc được `plainPassword`; FE chặn bằng `ProtectedRoute` nhưng BE thì không — đây là một lỗ hổng cần fix nếu giữ feature.

## Resolved
