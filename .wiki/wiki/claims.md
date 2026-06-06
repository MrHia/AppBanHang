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

#### c-20260604-01 — Account lockout từng vô hiệu do @Transactional rollback; fix bằng noRollbackFor
- **Sources**: `ITSSBE/.../service/impl/AuthServiceImpl.java`, [[bugs/login-lockout-rollback]], commit `17cec57`
- **Status**: active (resolved bug)
- **First seen**: 2026-06-04
- **Notes**: `login` save() failedAttempts rồi throw RuntimeException → rollback → counter mãi 0. `@Transactional(noRollbackFor=RuntimeException.class)` fix. Verified trên Docker MySQL: 1→2→3→4→5 + locked_until set.

#### c-20260604-02 — Role cardinality: ADMIN/OVERSEAS/WAREHOUSE duy nhất; SITE/SALES nhiều
- **Sources**: `AccountServiceImpl.assertRoleCardinality`, `AccountRepository.countByRole_Name`, [[decisions/role-cardinality]]
- **Status**: active
- **First seen**: 2026-06-04
- **Notes**: Đếm TẤT CẢ account của role (kể cả khóa). Enforce ở create + update; FE ẩn role duy nhất đã tồn tại.

#### c-20260604-03 — 2 luồng đổi mật khẩu admin: reset (auto-gen + buộc đổi) vs update (gõ tay, không buộc đổi)
- **Sources**: `AccountServiceImpl.resetPassword` vs `AccountServiceImpl.update`, [[features/uc1-auth-lifecycle]]
- **Status**: active
- **First seen**: 2026-06-04

#### c-20260604-04 — FE enforce first-login: ProtectedRoute + login redirect tới /auth/change-password
- **Sources**: `ITSSFE/src/components/ProtectedRoute.js`, `pages/auth/login.js`, `pages/auth/change-password.js`
- **Status**: active
- **First seen**: 2026-06-04
- **Notes**: change-password page KHÔNG bọc ProtectedRoute → tránh redirect loop. `auth-context.updateUser()` clear cờ sau khi đổi.

#### c-20260604-05 — Login verified chạy thật trên Docker MySQL (compose `db`)
- **Sources**: Demo session 2026-06-04 (`docker compose up -d db` + backend local + curl)
- **Status**: active
- **First seen**: 2026-06-04
- **Notes**: Seed passwords đã là BCrypt `$2a$10$` trong schema.sql. Verified: login đa role, sai mật khẩu, lockout (failed_attempts persist), change-password + must-change flow.

#### c-20260606-01 — Phase 2 ISP refactor done: ProcessRequest God Class tách thành 5 services
- **Sources**: `ITSSBE/src/main/java/com/example/importorder/service/impl/processrequest/` (5 files), tương ứng 5 interfaces mới `IRequestItemService`, `IMerchandiseAssignmentService`, `ISitePickingService`, `IInquiryCoordinationService`, `IPOBatchCreationService`. Pattern delegate qua composition trong `ProcessRequestServiceImpl`.
- **Status**: active
- **First seen**: 2026-06-06
- **Notes**: Trước refactor wiki ghi 13 service interfaces; nay là 18. Xem [[components/processrequest-coordinator]].

#### c-20260606-02 — Phase 3 Observer events done: 5 ApplicationEvents thay coupling notify+email
- **Sources**: `ITSSBE/src/main/java/com/example/importorder/event/` chứa POSentEvent, POConfirmedEvent, PORejectedEvent, DiscrepancyCreatedEvent, InquiryTimeoutEvent (Java records). Test bao phủ: `POEventPublishTest`.
- **Status**: active
- **First seen**: 2026-06-06
- **Notes**: Xem [[components/backend-events]]. Listener-side chưa survey kỹ — flagged trong [[open-questions]].

#### c-20260606-03 — Mapper layer dùng MapStruct (KHÔNG phải ModelMapper)
- **Sources**: `ITSSBE/pom.xml:22,70-72,105-112` (mapstruct + mapstruct-processor + lombok-mapstruct-binding); 12 mapper files có `@Mapper(componentModel = "spring")`; sinh `*MapperImpl` ở `target/generated-sources/annotations/`.
- **Status**: active (supersedes implicit claim trong [[components/backend-architecture]] v1)
- **First seen**: 2026-06-06
- **Notes**: ModelMapper 3.1.0 vẫn ở pom (legacy) nhưng tất cả mapper hiện dùng MapStruct. Wiki cũ ghi "ModelMapper cho DTO conversion" → đã sửa.

#### c-20260606-04 — Phase 4 FE refactor done: 7 reusable components + 3 custom hooks
- **Sources**: `ITSSFE/src/components/index.js` (re-export 7: ProtectedRoute, Footer, DataTable, FormDialog, ConfirmDialog, StatusChip, AlertSnackbar); `ITSSFE/src/hooks/` (useAlert, useCRUDTable, useFormDialog).
- **Status**: active
- **First seen**: 2026-06-06
- **Notes**: Trước Phase 4 wiki ghi "only 2 reusable components". Xem [[components/fe-component-library]] + [[components/fe-custom-hooks]].

#### c-20260606-05 — Phase 5 split mega pages done: process-request/[id].js từ 780L xuống 180L
- **Sources**: `wc -l ITSSFE/src/pages/overseas/process-request/[id].js` = 180 lines (2026-06-06). Baseline: [[analysis/academic-code-review]] và wiki gốc claim 780L.
- **Status**: active
- **First seen**: 2026-06-06
- **Notes**: BE orchestrator `ProcessRequestServiceImpl` còn 576L vì là delegator hub. Logic chính đã chuyển xuống 5 sub-services.

#### c-20260606-06 — DTOs đã tăng từ ~20 → 30 (thêm 10 workflow DTOs cho ISP refactor)
- **Sources**: `ls ITSSBE/src/main/java/com/example/importorder/dto/` đếm = 30 files (2026-06-06).
- **Status**: active
- **First seen**: 2026-06-06
- **Notes**: Bao gồm `MerchandiseAssignmentDTO`, `SitePickDTO`, `SitePickRequest`, `InquiryStatusDTO`, `CreatePOBatchRequest`, `MerchandisePickRequest`, `SiteOptionDTO`, `StockInfoDTO`, `RequestSiteDTO`, `SiteDiscrepancyDTO` (mới so với baseline).

#### c-20260606-07 — Test suite: 7 test files
- **Sources**: `find ITSSBE/src/test/java -name "*.java"` (2026-06-06)
- **Status**: active
- **First seen**: 2026-06-06
- **Notes**: AuthLoginIntegrationTest, AccountServiceTest, AssignmentValidationTest, POEventPublishTest, POStateTest, PurchaseOrderMapperTest, StockSourceTest. Coverage: auth, account rule, ISP assignment, PO Observer, PO State, mapper, Strategy stock source.

#### c-20260606-08 — Branch `refactor-all-code` thêm cột `plain_password` cho demo BTL — KHÔNG dùng production
- **Sources**: `Account.java:20-22`, `SQL/schema.sql:46-48`, `accounts.js:94-99`, tất cả set-password paths trong `AccountServiceImpl/AuthServiceImpl/SiteServiceImpl/PasswordMigrationRunner`.
- **Status**: active (demo feature, contradicts BCrypt-only decision)
- **First seen**: 2026-06-06
- **Notes**: Xem contradiction `x-20260606-01`. BE controller chưa có role-check trên `GET /api/accounts` → leak nếu giữ feature lên production.

#### c-20260606-09 — Stock-inquiry subsystem xóa toàn bộ (21 BE + 4 FE files)
- **Sources**: [[decisions/remove-stock-inquiry]]; verify bằng `ls service/`, `ls entity/`, `ls event/` không còn StockInquiry* / InquiryCoordination / InquiryTimeoutEvent.
- **Status**: active
- **First seen**: 2026-06-06
- **Notes**: Counts mới: 16 entities, 12 controllers, 16 services, 11 mappers, 4 events, 0 scheduler. Single source of truth cho stock: `site_merchandise.stock_quantity`. Wizard FE: 4 step → 2 step.

#### c-20260606-10 — PO REJECTED là TERMINAL state — cancel cascade lên parent request + sibling POs
- **Sources**: `domain/po/state/RejectedState.java` (all methods throw), `PurchaseOrderServiceImpl.rejectPO` cascade logic, [[decisions/po-cancellation-cascade]].
- **Status**: active (supersedes legacy "REJECTED → DRAFT" semantic from v1.1.0)
- **First seen**: 2026-06-06
- **Notes**: UC12 (Overseas revise PO loop) đã bỏ. Cancel reachable từ DRAFT/SENT/CONFIRMED. Restore stock chỉ khi PO trước đó ở SENT/CONFIRMED (DRAFT chưa consume). Audit: `REQUEST_CANCELLED_CASCADE` + `PO_CANCELLED_CASCADE`.

#### c-20260606-11 — 3 role có thể trigger cancel PO qua chung `POST /api/po/{id}/reject`
- **Sources**: `site/purchase-orders.js` (Reject), `overseas/purchase-orders.js` (Cancel mới), `admin/purchase-orders.js` (Hủy PO mới), `PurchaseOrderController.rejectPO`.
- **Status**: active
- **First seen**: 2026-06-06
- **Notes**: Hợp nhất endpoint giúp logic cascade chỉ 1 chỗ. FE cả 3 trang có cascade-warning Alert trước khi confirm.

#### c-20260606-09 — Stock-inquiry subsystem hoàn toàn bị xóa 2026-06-06; Overseas đọc stock thẳng từ `site_merchandise.stock_quantity`
- **Sources**: [[decisions/remove-stock-inquiry]], `git log` 2026-06-06 (21 BE + 4 FE files removed), schema.sql `DROP TABLE stock_inquiry*`.
- **Status**: active
- **First seen**: 2026-06-06
- **Notes**: Cập nhật `c-20260603-20` (8 state enums) → còn 6: POStatus, RequestStatus, SelectionStatus (trimmed), ReceiptStatus, DiscrepancyStatus, DeliveryMethod, SenderType. Updates `c-20260603-21` (4-in-1 file) — wizard nay 2 bước với 2 file con.

#### c-20260606-10 — REJECTED là TERMINAL state cho PurchaseOrder; không còn loop REJECTED → DRAFT
- **Sources**: [[decisions/po-cancellation-cascade]], `RejectedState.java` (mọi method throw), `POStateTest.rejectedStateIsTerminal`, `PurchaseOrderServiceImpl.rejectPO` (không còn gọi `resetFromRejected`).
- **Status**: active (supersedes legacy UC12 revision loop)
- **First seen**: 2026-06-06
- **Notes**: `DraftState` và `ConfirmedState` nay cũng cho `reject()` — cancellation từ bất kỳ non-terminal status. DONE vẫn terminal.

#### c-20260606-11 — Cancel 1 PO cascades: parent ProcessRequest → CANCELLED, mọi sibling PO → REJECTED, stock được hoàn lại nếu trước đó SENT/CONFIRMED
- **Sources**: `PurchaseOrderServiceImpl.rejectPO` + `cascadeCancelRequest`, [[decisions/po-cancellation-cascade]], test data scenario `REQ-TEST-CANCELLED` trong `SQL/test-data-overseas.sql`.
- **Status**: active
- **First seen**: 2026-06-06
- **Notes**: Audit logs `REQUEST_CANCELLED_CASCADE` + `PO_CANCELLED_CASCADE`. Notification gửi OVERSEAS. Cascade chạy trong 1 `@Transactional` boundary — atomic. Idempotent: re-cancel PO đã REJECTED short-circuit ở state machine.
