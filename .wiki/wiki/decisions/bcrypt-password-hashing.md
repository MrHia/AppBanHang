---
title: Adopt BCrypt for password hashing
category: decisions
tags: [decision, security, auth, bcrypt]
sources: [CHANGELOG.md]
created: 2026-06-03
updated: 2026-06-03
---

# Decision — Adopt BCrypt for password hashing

**Date**: 2026-05-25 (v1.1.0 release)  
**Decided by**: Backend team (per CHANGELOG)  
**Status**: active

## Context

Trước v1.1.0, password lưu **plaintext** trong DB. Compromise DB = lộ toàn bộ tài khoản. Cần migrate sang password hashing trước khi production.

## Options considered

| Option | Pros | Cons |
|--------|------|------|
| **BCrypt** (chosen) | Spring Security built-in, work-factor tunable, well-vetted | Slower than SHA (intentional) |
| **Argon2** | Memory-hard, hiện đại hơn | Cần dependency thêm, performance impact lớn |
| **PBKDF2** | NIST recommended | Dễ GPU-accelerated nếu iterations thấp |
| **scrypt** | Memory-hard | Spring Security support yếu hơn |
| **SHA-256 + salt** | Fast | Vulnerable to GPU brute-force |

## Decision

**Adopt `BCryptPasswordEncoder`** với default strength (10).

Implementation:
- `SecurityConfig.passwordEncoder()` returns `new BCryptPasswordEncoder()`
- `AuthServiceImpl` dùng `passwordEncoder.matches(rawPwd, hashedPwd)`
- `AccountServiceImpl.create()` + `resetPassword()` dùng `passwordEncoder.encode(rawPwd)`
- `PasswordMigrationRunner` (CommandLineRunner) quét account table on startup:
  - Skip entries with password starting `$2` (BCrypt prefix)
  - Encode + save còn lại

## Consequences

### Positive

- ✅ Compromise DB không lộ password trực tiếp
- ✅ Familiar pattern, dễ maintain
- ✅ Auto-migration cho existing data (CHANGELOG note)

### Negative / Risks

- ⚠️ Startup time tăng nếu DB lớn (PasswordMigrationRunner scan + encode)
- ⚠️ Strength 10 là 2025-class. Năm 2026+ nên bump 12 (refactor P1.4)
- ⚠️ Migration runner chạy mỗi startup (đã idempotent nhưng waste cycles) — see [[open-questions#q-20260603-04]]

### Future revisits

- [[decisions/upgrade-bcrypt-strength]] (sẽ tạo khi cần) — bump 10 → 12
- [[decisions/argon2-evaluation]] (nếu compute power tăng đáng kể)

## Related

- [[features/uc1-auth-lifecycle]]
- [[components/backend-architecture]] — SecurityConfig
- [[analysis/refactor-roadmap]] Phase 1.4 — password policy hardening

---

## Backlinks
- [[sources/changelog]] — feature announced
- [[features/uc1-auth-lifecycle]] — uses BCrypt
