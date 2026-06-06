---
title: Log
category: log
created: 2026-06-03
updated: 2026-06-03
---

# AppBanHang — Log

Chronological record of all wiki operations.

## [2026-06-03] init | Wiki initialized
- Created `.wiki/` inside project folder
- Project slug: `appbanhang`
- Detected stack: Spring Boot 3.1 + Next.js 14 + MySQL 8
- Detected 18 entities, 13 controllers, 13 services, 5 frontend role groups
- Ready for first source ingest

## [2026-06-03] ingest | README.md + CHANGELOG.md
- Pages created: [[overview]], [[sources/project-readme]], [[sources/changelog]]
- Pages updated: [[index]], [[claims]]

## [2026-06-03] ingest | USER_GUIDE.md
- Pages created: [[sources/user-guide]]
- Pages updated: [[claims]] (+7 claims), [[open-questions]] (+2 Qs)

## [2026-06-03] map | Backend architecture (Explore agent)
- Pages created: [[components/backend-architecture]]
- Claims added: c-20260603-18 (permitAll critical), c-20260603-19 (ddl-auto), c-20260603-20 (enums), c-20260603-23 (CORS)
- Open questions added: q-20260603-07..10 (token format, is_active, email async, multi-instance scheduler)

## [2026-06-03] map | Frontend architecture (Explore agent)
- Pages created: [[components/frontend-architecture]]
- Claims added: c-20260603-21 (process-request 4-in-1), c-20260603-22 (27 pages + 11 API groups)

## [2026-06-03] map | Data + infra (Explore agent)
- Pages created: [[data/schema-overview]], [[infra/docker-compose]]

## [2026-06-03] write | Feature pages
- Pages created: 7 UC pages (UC1, UC4, UC6, UC7, UC11/12, UC15-20, UC16)

## [2026-06-03] write | Bug + decision pages
- Pages created: [[bugs/rejectpo-loses-reason]], [[bugs/discrepancy-field-mismatch]], [[decisions/bcrypt-password-hashing]]

## [2026-06-03] write | ⭐ Refactor roadmap (main deliverable)
- Pages created: [[analysis/refactor-roadmap]] — 6-phase plan, critical security findings, open questions blocking start
- Pages updated: [[index]] with quick-links + critical findings summary

## [2026-06-03] pivot | Context change — Academic (BTL ĐHBK) thay vì Production
- User clarified: dự án là bài tập lớn ĐHBK, chấm theo SOLID + Design Patterns + Clean Code
- Production roadmap đánh dấu out-of-scope, giữ làm tham khảo
- Dispatched 2 Explore agents code review BE + FE (academic angle)
  - BE Grade: B- / 7.5-8/10 (God class, toDTO duplication, missing patterns)
  - FE Grade: C / B- (CRUD duplication, mega pages, missing reusable components)

## [2026-06-03] write | Academic deliverables (via Workflow, 5 agents parallel + 1 adversarial critic)
- Pages created:
  - [[analysis/academic-code-review]] — 542 lines, evidence-driven SOLID + clean code audit
  - [[analysis/academic-target-architecture]] — 531 lines, 4 bounded contexts (collapsed from 7), package-by-feature
  - [[analysis/academic-design-patterns]] — 863 lines, 6 patterns selected, Before/After code
  - [[analysis/academic-refactor-plan]] — 655 lines, 5 phases × 10 weeks, milestone checklist
- Critic flagged: State pattern bug, MapStruct config order, broken wikilinks, NO UML diagrams (biggest grade risk)

## [2026-06-03] fix | Apply critic findings (via Workflow, 5 agents parallel + 1 verify)
- Pages created:
  - [[analysis/academic-uml-diagrams]] — 520 lines, 16 Mermaid diagrams (ER, class, state, sequence, use case, activity, component)
- Pages updated: all 4 academic pages
  - Fixed State pattern (entity holds @Transient state ref, RejectedState.reset() preserves reason)
  - Fixed MapStruct annotationProcessorPaths order (lombok → mapstruct-processor → lombok-mapstruct-binding)
  - All Observer listeners @TransactionalEventListener(AFTER_COMMIT)
  - Chain of Responsibility unified on Spring @Autowired List<> + @Order
  - Bounded contexts collapsed 7 → 4
  - ISP interfaces aligned: 5 helpers + 1 core
  - Effort bumped realistic: total ~10 weeks
  - All broken wikilinks fixed

## [2026-06-04] feature | Account management mở rộng (UC1 ext)
- Code: AccountServiceImpl (edit password/role/site + role cardinality), AuthServiceImpl,
  AccountRepository.countByRole_Name, FE change-password page + ProtectedRoute enforce +
  admin/accounts site picker. Commit `5ce01ef`.
- Pages updated: [[features/uc1-auth-lifecycle]] (v1.2 ext section)
- Pages created: [[decisions/role-cardinality]]
- Claims: c-20260604-02, c-20260604-03, c-20260604-04

## [2026-06-04] bugfix | Account lockout @Transactional rollback (test caught it)
- Integration test AuthLoginIntegrationTest (H2) bắt được bug: failed_attempts không tăng
- Root cause: @Transactional rollback cú save() khi login ném RuntimeException
- Fix: @Transactional(noRollbackFor=RuntimeException.class). Commit `17cec57`.
- Pages created: [[bugs/login-lockout-rollback]]
- Claims: c-20260604-01

## [2026-06-04] verify | Demo login trên Docker MySQL
- `docker compose up -d db` + backend local + curl: login đa role, lockout, change-password
- Claims: c-20260604-05
- Pages updated: [[index]] (link bug + decision mới)

## [2026-06-06] review | Branch refactor-all-code — feature `plain_password` demo
- Phạm vi review: 8 file modified trên branch `refactor-all-code` (BE entity/DTO/mapper/services/runner + FE accounts.js + SQL schema + seeds).
- Bug đã fix: i18n key `common.edit` thiếu (tooltip render literal `"common.edit"`) + hardcoded VN `"Mật khẩu hiện tại"` chuyển sang `admin.accounts.currentPassword`.
- Bug đã xác minh OK: MapStruct auto-map `plainPassword` (verified từ `AccountMapperImpl.java:38`).
- Contradiction ghi nhận: x-20260606-01 (cột `plain_password` vs decision [[decisions/bcrypt-password-hashing]]).
- Pages updated: [[contradictions]]

## [2026-06-06] bugfix | Site never received "new PO" notification when Overseas dispatched a batch
- Driver: user question — *"Có phát hiện ra bug khi oversea gửi order nhưng site không nhận được k?"*
- Root cause: two separate gaps stacked.
  - **Bug A**: `ProcessRequestServiceImpl.createPOBatch` writes `status=SENT` to the DB directly without calling `eventPublisher.publishEvent(new POSentEvent(...))`. The `sendPO()` state-machine path *did* publish the event, but the batch shortcut bypassed it entirely, so `POAuditListener.onPOSent` (and anything else listening) never fired.
  - **Bug B**: `PONotificationListener` had **no** `onPOSent` handler at all — even an explicit `sendPO` call would never create a SITE notification. The codebase had zero rows with `recipient_role='SITE'` for the bell icon.
  - **Side bug**: notification dropdown deep-linked every `purchase_order` notification to `/warehouse/confirmed-pos` regardless of role, so a SITE user clicking the bell hit a forbidden Warehouse route.
- Fix: introduce per-site addressing in `notification` (new `recipient_site_id INT NULL`), so the existing role-wide broadcast semantics are preserved (NULL) and SITE rows now target one site (non-NULL).
  - Entity `Notification` + `NotificationDTO` + `NotificationRepository` (3 new per-(role, site) queries) + `INotificationService` (overload + 3 new read methods) + `NotificationServiceImpl` + `NotificationController` (optional `siteId` query param).
  - `POSentEvent` extended with `siteId`, `siteName`.
  - `PurchaseOrderServiceImpl.sendPO` publishes the richer event.
  - `ProcessRequestServiceImpl` injects `ApplicationEventPublisher` and publishes `POSentEvent` for every PO in the batch, just before transitioning the request to DONE.
  - `PONotificationListener.onPOSent` creates a notification with `recipientSiteId = siteId`, so only that site's users see the bell badge.
  - FE: `notificationApi.{getByRole,getUnread,getUnreadCount}` accept `siteId`; `layouts/dashboard/index.js` passes `user.siteId`; new `notificationDeepLink(n)` routes the click target by `user.roleName` (SITE → /site/purchase-orders, WAREHOUSE → /warehouse/confirmed-pos, etc.).
  - SQL: `notification` gains `recipient_site_id INT NULL` + FK to `site(id)` + idempotent `ALTER TABLE … ADD COLUMN IF NOT EXISTS` for existing DBs.
- Tests: 40/40 pass. Updated `POEventPublishTest.auditListenerLogsPOSent` for the new event signature, added `notificationListenerNotifiesTargetSiteOnPOSent` covering the per-site notification path.
- Pages updated: [[components/backend-events]] (POSentEvent now richer + acts as the "PO sent to Site" hook), [[components/backend-architecture]] (notification table +1 column).

## [2026-06-06] refactor | Remove stock-inquiry subsystem (Task 1) + cascade-cancel PO → ProcessRequest (Task 2)
- Driver: user request — *"stock inquiry response cần phải bỏ đi vì mình không cần nó nữa"* và *"1 trong bất cứ purchased order ... bị huỷ thì đơn request tổng cần được hủy luôn"*.
- BE deletions (21 files): entities `StockInquiry`/`StockInquiryItem`, DTOs `StockInquiryDTO`/`StockInquiryItemDTO`/`InquiryStatusDTO`/`StockInfoDTO`, repositories `StockInquiry*Repository`, services `IStockInquiryService`+impl, `IInquiryCoordinationService`+impl, controller `StockInquiryController`, mapper `StockInquiryMapper`, scheduler `StockInquiryTimeoutScheduler`, event `InquiryTimeoutEvent`, domain package `domain/inquiry/stocksource/` (6 files), test `StockSourceTest`.
- BE modifications: `ProcessRequestServiceImpl` lost `sendInquiries`/`getInquiryStatus`/`getInventoryMatrix`; `IProcessRequestService` trimmed; `ProcessRequestController` lost 3 endpoints; `PONotificationListener.onInquiryTimeout` removed; `RequestSite.SelectionStatus` enum trimmed `PICKED, REJECTED, INQUIRY_SENT, RESPONDED, TIMEOUT` → `PICKED, REJECTED`; `RequestSiteRepository` orphan methods removed.
- BE Task 2: `RejectedState` made TERMINAL; `DraftState` + `ConfirmedState` gained `reject()` to support cancellation from any non-terminal state; `PurchaseOrderServiceImpl.rejectPO` now cascades — parent request → CANCELLED, sibling POs → REJECTED (with cascade reason), stock restored for SENT/CONFIRMED siblings, audit + OVERSEAS notification fired; `SiteMerchandiseRepository` injection added; controller success message + UC12 comment retired.
- FE deletions: `pages/site/inquiries.js`, `Step2SendInquiries.js`, `Step3Track.js`, old `Step4Matrix.js`. New: `Step2CreatePOs.js` (reads stock from `siteMerchandiseApi`).
- FE modifications: 4-step wizard → 2 steps; SITE nav loses "Stock Inquiry Response"; `inquiryApi` + 3 `requestApi` inquiry methods removed; cancel buttons + cascade-warning Alerts added on `overseas/purchase-orders.js`, `site/purchase-orders.js`, `admin/purchase-orders.js`; site dashboard inquiry counter card removed; i18n keys pruned (80+ removed, ~10 new for cancel UX).
- SQL: `DROP TABLE stock_inquiry_item; DROP TABLE stock_inquiry;` + `request_site.status` ENUM trim; `test-data-overseas.sql` rewritten with new scenarios A/B/C/D (last one demonstrates the cancel cascade).
- Tests: BE `mvn test` → 39/39 pass. `POStateTest` rewritten: `rejectedStateResetPreservesReason` → `rejectedStateIsTerminal`; added `draftStateAllowsRejectAsCancellation` + `confirmedStateAllowsRejectAsCancellation`. `POEventPublishTest` lost the inquiry-timeout test.
- Pages created: [[decisions/remove-stock-inquiry]], [[decisions/po-cancellation-cascade]]
- Pages updated: [[features/uc7-stock-inquiry-timeout]] (marked deprecated), [[features/uc11-12-purchase-order-lifecycle]] (terminal REJECTED + cascade), [[features/uc6-overseas-process-request]] (2-step wizard), [[components/processrequest-coordinator]] (5→4 services), [[components/backend-events]] (5→4 events), [[components/backend-architecture]] (entity/service/event/mapper/test counts), [[index]], [[overview]], [[claims]] (+3 new).

## [2026-06-06] re-ingest | Full project snapshot refresh
- Lý do: user báo "đã chỉnh sửa quá nhiều trong code". Re-survey BE + FE qua Explore agent + filesystem.
- Phát hiện chính:
  - BE: service interfaces từ **13 → 18** (Phase 2 ISP refactor). Package `event/` mới với 5 events (Phase 3 Observer). MapStruct (KHÔNG ModelMapper) là layer mapping chính.
  - FE: reusable components từ **2 → 7**. Mới có `hooks/` với **3 custom hooks** (Phase 4). Trang `process-request/[id].js` từ 780L → **180L** (Phase 5).
  - DTOs: ~20 → **30** (thêm 10 workflow DTOs cho ISP refactor).
  - Tests: 7 test files (auth, account, assignment, PO event, PO state, mapper, stock source).
- Pages created: [[components/backend-events]], [[components/processrequest-coordinator]], [[components/fe-component-library]], [[components/fe-custom-hooks]]
- Pages updated: [[components/backend-architecture]] (fix ModelMapper claim → MapStruct, +service table, +mapper table, +event table, +test table), [[components/frontend-architecture]] (+components, +hooks), [[index]] (refactor progress 5/5 ✅), [[overview]] (refactor evidence), [[claims]] (+8 claims c-20260606-01..08)

## [2026-06-06] re-ingest #2 | Stock-inquiry subsystem deleted + PO cascade
- Lý do: user thực hiện 2 thay đổi lớn cùng ngày: (a) xóa toàn bộ stock-inquiry subsystem, (b) cho phép cancel PO cascade lên request + siblings.
- Verify counts mới:
  - BE: 16 entities (-2), 12 controllers (-1), 16 services (-2), 11 mappers (-1), 4 events (-1), 0 scheduler (-1)
  - FE: -1 page (`site/inquiries.js`), -1 API group (`inquiryApi`), wizard 4-step → 2-step
- Pages tự cập nhật (linter user): [[components/processrequest-coordinator]] (5→4 services), [[components/backend-events]] (5→4 events), [[features/uc7-stock-inquiry-timeout]] (deprecated banner), [[decisions/remove-stock-inquiry]] (mới), [[decisions/po-cancellation-cascade]] (mới)
- Pages đồng bộ thêm (turn này): [[components/backend-architecture]] (mapper count, controller count, related links), [[components/frontend-architecture]] (page tree, API groups), [[index]] (refactor progress counts), [[overview]] (P1/P5 counts), [[claims]] (+3 claims c-20260606-09..11)
