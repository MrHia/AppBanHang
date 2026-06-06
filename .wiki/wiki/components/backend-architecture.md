---
title: Backend Architecture — Spring Boot 3 Layered
category: components
tags: [backend, spring-boot, jpa, layered, architecture, refactor-phase-2-done, post-inquiry-removal]
sources: [ITSSBE/pom.xml, ITSSBE/src/main/**, agent-summary]
created: 2026-06-03
updated: 2026-06-06
---

# Backend Architecture — Spring Boot 3 Layered

> Layered: Controller → Service (interface + impl) → Repository → Entity. **MapStruct** cho DTO mapping (11 mappers), Lombok cho boilerplate, Spring Events cho cross-context coordination (Observer pattern). Sau khi stock-inquiry subsystem bị xóa (2026-06-06), Phase 2 ISP refactor còn lại 4 service extracted khỏi ProcessRequestService và scheduler đã được loại bỏ.

> [!info] Cập nhật 2026-06-06 — stock-inquiry removed
> Tham khảo [[decisions/remove-stock-inquiry]]. 21 file BE đã xóa, các count bên dưới phản ánh state sau xóa.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Language | Java 17 |
| Framework | Spring Boot 3.1.1 |
| ORM | Spring Data JPA / Hibernate |
| Database | MySQL 8 |
| Security | Spring Security 6 (BCrypt only — no auth filter) |
| Email | Spring Mail (SMTP) |
| DTO mapping | **MapStruct 1.5.5.Final** (chính) + ModelMapper 3.1.0 (legacy, vẫn ở pom nhưng các mapper đều chuyển MapStruct) |
| Events | Spring `ApplicationEventPublisher` + `@EventListener` (Observer) |
| Boilerplate | Lombok 1.18.46 + lombok-mapstruct-binding 0.2.0 |
| Build | Maven (multi-stage Docker) |

## Package structure (sau Phase 2 refactor)

```
com.example.importorder/
├── config/
│   ├── SecurityConfig                      ⚠️ permitAll() — no role enforcement
│   └── PasswordMigrationRunner             (CommandLineRunner, BCrypt migration)
├── controller/                              12 @RestController + GlobalExceptionHandler
├── dto/                                     ~26 DTOs (+ ApiResponse wrapper) — 4 inquiry DTOs removed 2026-06-06
├── entity/                                  16 @Entity — StockInquiry + StockInquiryItem removed
├── event/                                   4 record events (Observer pattern) — InquiryTimeoutEvent removed
│   ├── POSentEvent / POConfirmedEvent / PORejectedEvent
│   └── DiscrepancyCreatedEvent
├── mapper/                                  11 MapStruct @Mapper — StockInquiryMapper removed
├── repository/                              JpaRepository<T, Long>
└── service/
    ├── I<Name>Service                      ~16 interfaces (5 main + 4 ProcessRequest sub-services)
    └── impl/
        ├── <Name>ServiceImpl                main impls
        └── processrequest/                  4 extracted impls (Phase 2) — InquiryCoordination removed
            ├── MerchandiseAssignmentServiceImpl
            ├── POBatchCreationServiceImpl
            ├── RequestItemServiceImpl
            └── SitePickingServiceImpl
```

> [!info] 2026-06-06 — stock-inquiry subsystem deleted
> 21 BE files removed: `StockInquiry*`, `IStockInquiryService` + impl, `IInquiryCoordinationService` + impl, `StockInquiryController`, `StockInquiryMapper`, `StockInquiryTimeoutScheduler`, `InquiryTimeoutEvent`, `domain/inquiry/stocksource/` Strategy package. See [[decisions/remove-stock-inquiry]].

## Entity overview (16) — 2026-06-06: -2 StockInquiry entities

| Entity | Table | State enum (if any) | Cluster |
|--------|-------|----------------------|---------|
| Account | account | – | Identity |
| Role | role | – | Identity |
| Site | site | – | Identity |
| Merchandise | merchandise | – | Catalog |
| SiteMerchandise | site_merchandise | – | Catalog |
| ProcessRequest | process_request | `RequestStatus`: PENDING, PROCESSING, DONE, CANCELLED | Sales flow |
| RequestItem | request_item | – | Sales flow |
| RequestSite | request_site | `SelectionStatus`: PICKED, REJECTED | Sales flow |
| PurchaseOrder | purchase_order | `POStatus`: DRAFT, SENT, CONFIRMED, **REJECTED (terminal — cascade)**, DONE; `DeliveryMethod`: SHIP, AIR, LAND | PO flow |
| PODetail | po_detail | – | PO flow |
| WarehouseReceipt | warehouse_receipt | `ReceiptStatus`: PENDING, DONE, RESOLVING | Warehouse flow |
| ReceiptItem | receipt_item | – | Warehouse flow |
| SiteDiscrepancy | site_discrepancy | `DiscrepancyStatus`: OPEN, RESOLVING, RESOLVED | Warehouse flow |
| DiscrepancyMessage | discrepancy_message | `SenderType`: WAREHOUSE, SITE | Warehouse flow |
| Notification | notification | – | Cross-cutting |
| AuditLog | audit_log | – | Cross-cutting |

See [[data/schema-overview]] cho schema chi tiết.

## Service interfaces (~16, sau khi xóa 2 inquiry services 2026-06-06)

> Phase 2 extract `ProcessRequestServiceImpl` thành **4 services chuyên trách** (trước 2026-06-06: 5; `IInquiryCoordinationService` đã xóa cùng stock-inquiry subsystem). Service `IProcessRequestService` giờ chỉ orchestrate.

| Interface | Responsibility | Cluster |
|-----------|----------------|---------|
| IAccountService | Account CRUD, lock/unlock, reset-password | Identity |
| IAuthService | Login, change-password, token | Identity |
| IAuditService | Audit log per action | Cross-cutting |
| IEmailService | SMTP gửi notification, reset password | Cross-cutting |
| INotificationService | Notification creation + query by role (UC16 bell) | Cross-cutting |
| IMerchandiseService | Merchandise CRUD | Catalog |
| ISiteService | Site CRUD | Identity |
| ISiteMerchandiseService | Site inventory (stock quantity) — single source of truth for stock | Catalog |
| **IProcessRequestService** | Main orchestrator — uỷ thác xuống 4 sub-services | Sales/Overseas flow |
| **IRequestItemService** *(Phase 2)* | CRUD item trong ProcessRequest | Sales/Overseas flow |
| **IMerchandiseAssignmentService** *(Phase 2)* | Step 1: gán 1 site cho mỗi merchandise | Overseas flow |
| **ISitePickingService** *(Phase 2)* | Multi-site picking variant | Overseas flow |
| **IPOBatchCreationService** *(Phase 2)* | Batch tạo PO | Overseas → PO flow |
| IPurchaseOrderService | PO CRUD + state machine. `rejectPO` **cascades** parent request + sibling POs (2026-06-06). | PO flow |
| IWarehouseService | Nhận PO, lập receipt, discrepancy resolve | Warehouse flow |
| IDiscrepancyMessageService | UC19 chat WAREHOUSE ↔ SITE | Warehouse flow |

**Removed 2026-06-06**: `IStockInquiryService`, `IInquiryCoordinationService`. See [[decisions/remove-stock-inquiry]].

## Events (Spring ApplicationEvent — Observer pattern)

Cross-cutting concerns (notification, email, audit) được decouple khỏi business logic qua **4 events** (2026-06-06: -InquiryTimeoutEvent):

| Event | Publish khi | Listener side-effects |
|-------|------------|------------------------|
| `POSentEvent(poId, poCode)` | Overseas bấm "Send PO" | Email site, notification site |
| `POConfirmedEvent(poId, ...)` | Site confirm PO | UC16: notify WAREHOUSE; email |
| `PORejectedEvent(poId, reason)` | Bất kỳ role nào cancel PO (Site/Overseas/Admin). Service tự cascade CANCELLED lên parent request + sibling POs. | Notify OVERSEAS với lý do; email |
| `DiscrepancyCreatedEvent(receiptId, ...)` | Warehouse báo discrepancy | UC18: notify SITE; email |

Pattern thay vì gọi trực tiếp `notificationService.create(...)` + `emailService.send(...)` trong service business: business chỉ `eventPublisher.publishEvent(new POSentEvent(...))` → các listener xử lý độc lập. Decouple test, dễ extend (thêm listener mới không sửa business).

## Mappers (MapStruct, 11 mappers)

Mỗi cluster có 1 mapper, tự sinh `*MapperImpl` trong `target/generated-sources/annotations/`. Mặc định auto-map field cùng tên; field cross-entity (role.name, site.id) dùng `@Mapping(target=..., source=...)`. Tham khảo [[bugs/account-mapper-plain-password]] cho ví dụ auto-map field mới.

| Mapper | Coverage |
|--------|----------|
| AccountMapper | Account ↔ AccountDTO (+roleName, siteId, siteCode flat) |
| AuthMapper | Account → LoginResponse (token, loginAt do service tự set) |
| AuditLogMapper | AuditLog ↔ AuditLogDTO |
| DiscrepancyMessageMapper | DiscrepancyMessage ↔ DiscrepancyMessageDTO |
| MerchandiseMapper | Merchandise ↔ MerchandiseDTO |
| NotificationMapper | Notification ↔ NotificationDTO |
| ProcessRequestMapper | ProcessRequest ↔ ProcessRequestDTO + nested items |
| PurchaseOrderMapper | PO ↔ PurchaseOrderDTO + nested details |
| SiteMapper | Site ↔ SiteDTO |
| SiteMerchandiseMapper | SiteMerchandise ↔ SiteMerchandiseDTO |
| WarehouseMapper | WarehouseReceipt ↔ WarehouseReceiptDTO + receipt items |

**Removed 2026-06-06**: `StockInquiryMapper`. Mapper count: 12 → 11.

## Tests (`src/test/java/...`, 6 files — 2026-06-06: -StockSourceTest)

| Test | Coverage |
|------|----------|
| AuthLoginIntegrationTest | UC1 full flow trên H2 (login OK/fail, case-insensitive email, mustChangePassword, lockout 5-fail) |
| AccountServiceTest | Role cardinality rule + admin gõ tay vs reset-password (Mockito) |
| AssignmentValidationTest | Merchandise→site assignment business rules |
| POEventPublishTest | Đảm bảo PO state transition publish đúng event (Observer) |
| POStateTest | PO state machine, **REJECTED terminal**, cancellation từ DRAFT/SENT/CONFIRMED (mới 2026-06-06) |
| PurchaseOrderMapperTest | MapStruct mapper coverage |

**Removed 2026-06-06**: `StockSourceTest` (Strategy package deleted).

## Controller surface (12)

| Controller | Base path | Note |
|-----------|-----------|------|
| AuthController | `/api/auth` | login, change-password |
| AccountController | `/api/accounts` | CRUD + lock/unlock/reset-password |
| SiteController | `/api/sites` | CRUD |
| MerchandiseController | `/api/merchandise` | CRUD |
| SiteMerchandiseController | `/api/site-merchandise` | CRUD per site |
| ProcessRequestController | `/api/requests` | 2-step workflow endpoints (post 2026-06-06: -send-inquiries, -inquiry-status, -inventory-matrix) |
| PurchaseOrderController | `/api/po` | DRAFT, SENT, CONFIRM, **REJECT (terminal — cascade)**, DONE |
| WarehouseController | `/api/warehouse` | Receive, confirm, discrepancy |
| DiscrepancyController | `/api/discrepancies` | Chat messages |
| NotificationController | `/api/notifications` | Bell icon support |
| AuditController | `/api/audit` | Audit query |
| GlobalExceptionHandler | – | IllegalArgumentException, MethodArgumentTypeMismatchException, RuntimeException, Exception |

See [[api/all-endpoints]] cho danh sách endpoint đầy đủ.

## Service-Controller mapping

12 controllers → 12 main services (1-1, sau khi `StockInquiryController` xóa). Cross-cutting services (`IEmailService`, `INotificationService`, `IAuditService`) không có controller riêng. Service Phase 2 hiện tại (`IMerchandiseAssignment*`, `IPOBatchCreation*`, `IRequestItem*`, `ISitePicking*`) được inject vào `ProcessRequestServiceImpl` (delegate pattern) — không expose controller riêng, vẫn đi qua `/api/requests/*`.

**Cross-cutting publish/subscribe** (qua events):
- Trước Phase 3: service business gọi `notificationService.create(...)` + `emailService.send(...)` trực tiếp → coupling cao.
- Sau Phase 3: service business chỉ `publishEvent(POSentEvent(...))` → listener tách rời handle notification + email + audit độc lập. Xem [[components/backend-events]].

## Security configuration ⚠️

> [!warning] **CRITICAL**: SecurityConfig dùng `permitAll()` — backend **không** enforce role-based access
> Tất cả endpoint đều mở. Authentication hiện chỉ được verify ở FE bằng cách check sessionStorage. Refactor priority **#1**: thêm JWT filter + role guards.

| Setting | Current value |
|---------|---------------|
| CSRF | Disabled |
| Session policy | `STATELESS` |
| CORS | localhost:3000, localhost:3001 (GET/POST/PUT/DELETE/OPTIONS, credentials enabled) |
| Password encoder | `BCryptPasswordEncoder` |
| Auth filter chain | **permitAll()** — không có JWT/Basic/Form auth |

See [[decisions/security-rewrite-jwt]] (sẽ tạo cho refactor decision).

## Scheduler

> [!info] No active schedulers (2026-06-06)
> `StockInquiryTimeoutScheduler` was the only scheduled job; it was deleted with the stock-inquiry subsystem. The `scheduler/` package no longer exists. `spring.task.scheduling.pool.size` config is now unused. See [[decisions/remove-stock-inquiry]] and [[features/uc7-stock-inquiry-timeout]] (deprecated page).

## Risks & Refactor notes

> [!warning] Migration runner risk
> `PasswordMigrationRunner` chạy mỗi startup (skip BCrypt `$2`-prefixed). Nếu fail giữa chừng → state không nhất quán. Cần wrap trong **single transaction** + dùng flag idempotent.

> [!warning] hibernate.ddl-auto=update
> Cho phép Hibernate tự migrate schema lúc startup. Có thể drop column nếu rename. Refactor: chuyển sang **validate** + Flyway hoặc Liquibase.

> [!info] No JWT
> FE gửi `Authorization: Bearer <token>` nhưng BE không có JWT filter. Token này có thể chỉ là user ID encoded. **Cần migrate sang JWT thực** với refresh token.

> [!tip] Service impl nằm trong sub-package `impl/`
> Pattern này phù hợp DDD nhưng có thể overkill cho hệ thống nhỏ. Cân nhắc gộp interface + class khi refactor những service không cần polymorphism.

## Related

- [[components/backend-events]] — Observer pattern, 4 event types (Phase 3, post-2026-06-06)
- [[components/processrequest-coordinator]] — Phase 2 ISP refactor (4 extracted services, post-2026-06-06)
- [[decisions/remove-stock-inquiry]] — 2026-06-06 deletion (21 BE files)
- [[decisions/po-cancellation-cascade]] — REJECTED terminal + cascade (2026-06-06)
- [[analysis/refactor-roadmap]] — Status: P2 (ISP) + P3 (Events) done; P1 (Mapper) done qua MapStruct migration
- [[decisions/bcrypt-password-hashing]] — security decision

---

## Backlinks
- [[overview]] — references backend stack
- [[features/uc1-auth-lifecycle]] — depends on this
- [[features/uc11-12-purchase-order-lifecycle]] — depends on this
