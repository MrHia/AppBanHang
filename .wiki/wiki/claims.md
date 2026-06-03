---
title: Claims Ledger
category: meta
created: 2026-06-03
updated: 2026-06-03
---

# Claims Ledger

Cross-page factual claims with citations. Each entry must cite a source page or raw file. Claims here are reused by other pages via `(see [[claims#claim-id]])`.

## How to use

- Append a new claim when ingesting reveals a fact that multiple pages will reference.
- Each claim gets a stable ID: `c-YYYYMMDD-NN` (date + serial).
- If a later source contradicts an existing claim, do **not** delete it. Append the new claim and add an entry to [[contradictions]].
- If a claim becomes uncertain, move it to [[open-questions]].

## Format

```markdown
### c-YYYYMMDD-NN — <one-line claim>
- **Sources**: `raw/docs/auth-spec.md:42`, [[components/auth-service]]
- **Status**: active | disputed | superseded
- **First seen**: YYYY-MM-DD
- **Notes**: optional context
```

## Active claims

<!-- Append new claims below. Keep newest at the top of each year-section. -->

### 2026

#### c-20260603-01 — Service ports: BE 8081, FE 3000, MySQL 3307 (host) / 3306 (container)
- **Sources**: `README.md:59,69`, `docker-compose.yml:13,31`
- **Status**: active
- **First seen**: 2026-06-03
- **Notes**: MySQL dùng 3307 vì 3306 bị chiếm bởi project `gamecotuong` của user.

#### c-20260603-02 — Multi-site: Site US / JP / DE đều có account riêng, tồn kho riêng
- **Sources**: `README.md:81-83`, `SQL/schema.sql:24-31` (table `site`), [[components/site-merchandise]] (sẽ có)
- **Status**: active
- **First seen**: 2026-06-03

#### c-20260603-03 — i18n: default English, persist sessionStorage
- **Sources**: `README.md:127`
- **Status**: active
- **First seen**: 2026-06-03
- **Notes**: 3 dev-only switching methods (Konami code, `devlang` hotkey, hidden pixel triple-click).

#### c-20260603-04 — DB migration thủ công: ALTER account ADD must_change_password + CREATE notification
- **Sources**: `README.md:141-154`, `CHANGELOG.md:73-74`
- **Status**: active
- **First seen**: 2026-06-03
- **Notes**: Có `PasswordMigrationRunner` auto-migrate plaintext → BCrypt nhưng phải tự chạy ALTER cho 2 thay đổi schema.

#### c-20260603-05 — v1.1.0 (2026-05-25) là release security lớn: BCrypt + 5-attempt lockout + must-change-password
- **Sources**: `CHANGELOG.md:3-20`
- **Status**: active
- **First seen**: 2026-06-03

#### c-20260603-06 — UC7 timeout scheduler: fixedRate 5 phút, update PENDING → TIMEOUT sau 48h
- **Sources**: `CHANGELOG.md:49-52`, `ITSSBE/.../scheduler/StockInquiryTimeoutScheduler.java` (sẽ verify)
- **Status**: active
- **First seen**: 2026-06-03

#### c-20260603-07 — PO state machine: DRAFT → SENT → CONFIRMED | REJECTED→DRAFT (giữ rejectionReason)
- **Sources**: `CHANGELOG.md:33-36, 56-58`
- **Status**: active
- **First seen**: 2026-06-03
- **Notes**: Bug fix v1.1.0 — rejectPO trước đây mất reason vì set status REJECTED rồi overwrite DRAFT.

#### c-20260603-08 — Notification table schema: id, recipient_role, title, message, is_read, entity_type, entity_id, created_at
- **Sources**: `CHANGELOG.md:144-154`, `SQL/schema.sql:57-67`
- **Status**: active
- **First seen**: 2026-06-03

#### c-20260603-09 — Discrepancy có 2 loại: `shortage` / `excess`; backend field naming, frontend đã map đúng (sau fix)
- **Sources**: `CHANGELOG.md:80`
- **Status**: active
- **First seen**: 2026-06-03

#### c-20260603-10 — Account lockout: 5 lần sai mật khẩu → khóa 30 phút
- **Sources**: `DOCS/USER_GUIDE.md:23`, `SQL/schema.sql:46-47` (cột `failed_attempts`, `locked_until`)
- **Status**: active
- **First seen**: 2026-06-03

#### c-20260603-11 — Overseas Process Request: 5 bước (Find → Pick → Send → Track → Aggregate)
- **Sources**: `DOCS/USER_GUIDE.md:118-189`
- **Status**: active
- **First seen**: 2026-06-03

#### c-20260603-12 — Site response window: 48h hardcoded
- **Sources**: `DOCS/USER_GUIDE.md:155`, `CHANGELOG.md:51`
- **Status**: active
- **First seen**: 2026-06-03

#### c-20260603-13 — Stock display markers: `(no marker)` chính thức, `(Ref)` chưa PH, `(Ref*)` timeout
- **Sources**: `DOCS/USER_GUIDE.md:186-188`
- **Status**: active
- **First seen**: 2026-06-03

#### c-20260603-14 — Multi-site PO splitting: 1 request → nhiều PO; mỗi PO có 1 shipping method + delivery date
- **Sources**: `DOCS/USER_GUIDE.md:175-183`
- **Status**: active
- **First seen**: 2026-06-03

#### c-20260603-15 — Discrepancy: âm = thiếu, dương = thừa; Site phản hồi với lý do + phương án
- **Sources**: `DOCS/USER_GUIDE.md:243-251, 275-279`
- **Status**: active
- **First seen**: 2026-06-03

#### c-20260603-16 — Site Merchandise có soft-delete "Ngừng KD"
- **Sources**: `DOCS/USER_GUIDE.md:211-215`
- **Status**: active
- **First seen**: 2026-06-03

#### c-20260603-17 — Request code format: REQ-YYYYMMDD-NNN
- **Sources**: `DOCS/USER_GUIDE.md:106`
- **Status**: active
- **First seen**: 2026-06-03

#### c-20260603-18 — SecurityConfig dùng `permitAll()` — BE không enforce role auth ⚠️
- **Sources**: `ITSSBE/.../config/SecurityConfig.java` (via Explore agent), [[components/backend-architecture]]
- **Status**: active
- **First seen**: 2026-06-03
- **Notes**: Auth chỉ enforce ở FE (ProtectedRoute + sessionStorage). Bất kỳ ai gọi BE API trực tiếp đều bypass auth. **#1 refactor priority**.

#### c-20260603-19 — `hibernate.ddl-auto=update` đang active
- **Sources**: `ITSSBE/src/main/resources/application.properties` (via Explore agent)
- **Status**: active
- **First seen**: 2026-06-03
- **Notes**: Risky cho prod. Refactor: switch sang `validate` + Flyway/Liquibase.

#### c-20260603-20 — 8 state enums trong workflow: POStatus, RequestStatus, SelectionStatus, ReceiptStatus, InquiryStatus, DiscrepancyStatus, DeliveryMethod, SenderType
- **Sources**: Backend entity classes (via Explore agent), [[components/backend-architecture]]
- **Status**: active
- **First seen**: 2026-06-03

#### c-20260603-21 — `process-request/[id].js` đảm nhận 4 bước UI trong 1 file (Pick + Send + Track + Aggregate)
- **Sources**: Frontend (via Explore agent), [[components/frontend-architecture]]
- **Status**: active
- **First seen**: 2026-06-03
- **Notes**: Candidate cho tách thành 4 sub-routes trong refactor.

#### c-20260603-22 — FE gồm 27 pages, 11 API helper groups (~40+ methods)
- **Sources**: `ITSSFE/src/pages/`, `ITSSFE/src/api/index.js` (via Explore agent)
- **Status**: active
- **First seen**: 2026-06-03

#### c-20260603-23 — CORS chỉ allow localhost:3000 và localhost:3001
- **Sources**: SecurityConfig (via Explore agent)
- **Status**: active
- **First seen**: 2026-06-03
- **Notes**: Hardcoded — refactor cần config qua env var cho prod domain.
