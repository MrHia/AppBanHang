---
title: Backend Architecture — Spring Boot 3 Layered
category: components
tags: [backend, spring-boot, jpa, layered, architecture]
sources: [ITSSBE/pom.xml, ITSSBE/src/main/**, agent-summary]
created: 2026-06-03
updated: 2026-06-03
---

# Backend Architecture — Spring Boot 3 Layered

> Layered architecture: Controller → Service (interface + impl) → Repository → Entity. ModelMapper cho DTO conversion. Lombok cho boilerplate. Spring Mail + Scheduler tách riêng.

## Tech stack

| Layer | Technology |
|-------|-----------|
| Language | Java 17 |
| Framework | Spring Boot 3.1.1 |
| ORM | Spring Data JPA / Hibernate |
| Database | MySQL 8 |
| Security | Spring Security 6 (BCrypt only — no auth filter) |
| Email | Spring Mail (SMTP) |
| DTO mapping | ModelMapper 3.1.0 |
| Boilerplate | Lombok 1.18.46 |
| Build | Maven (multi-stage Docker) |

## Package structure

```
com.example.importorder/
├── config/
│   ├── SecurityConfig                      ⚠️ permitAll() — no role enforcement
│   └── PasswordMigrationRunner             (CommandLineRunner)
├── controller/                              13 @RestController
├── dto/
├── entity/                                  18 @Entity
├── repository/                              JpaRepository<T, Long>
├── scheduler/
│   └── StockInquiryTimeoutScheduler        (5 min fixedRate)
└── service/
    ├── I<Name>Service                      13 interfaces
    └── impl/<Name>ServiceImpl
```

## Entity overview (18)

| Entity | Table | State enum (if any) | Cluster |
|--------|-------|----------------------|---------|
| Account | account | – | Identity |
| Role | role | – | Identity |
| Site | site | – | Identity |
| Merchandise | merchandise | – | Catalog |
| SiteMerchandise | site_merchandise | – | Catalog |
| ProcessRequest | process_request | `RequestStatus`: PENDING, PROCESSING, DONE, CANCELLED | Sales flow |
| RequestItem | request_item | – | Sales flow |
| RequestSite | request_site | `SelectionStatus`: PICKED, REJECTED, INQUIRY_SENT, RESPONDED, TIMEOUT | Sales flow |
| StockInquiry | stock_inquiry | `InquiryStatus`: PENDING, RESPONDED, PARTIAL, TIMEOUT | Overseas flow |
| StockInquiryItem | stock_inquiry_item | – | Overseas flow |
| PurchaseOrder | purchase_order | `POStatus`: DRAFT, SENT, CONFIRMED, REJECTED, DONE; `DeliveryMethod`: SHIP, AIR, LAND | PO flow |
| PODetail | po_detail | – | PO flow |
| WarehouseReceipt | warehouse_receipt | `ReceiptStatus`: PENDING, DONE, RESOLVING | Warehouse flow |
| ReceiptItem | receipt_item | – | Warehouse flow |
| SiteDiscrepancy | site_discrepancy | `DiscrepancyStatus`: OPEN, RESOLVING, RESOLVED | Warehouse flow |
| DiscrepancyMessage | discrepancy_message | `SenderType`: WAREHOUSE, SITE | Warehouse flow |
| Notification | notification | – | Cross-cutting |
| AuditLog | audit_log | – | Cross-cutting |

See [[data/schema-overview]] cho schema chi tiết.

## Controller surface (13)

| Controller | Base path | Note |
|-----------|-----------|------|
| AuthController | `/api/auth` | login, change-password |
| AccountController | `/api/accounts` | CRUD + lock/unlock/reset-password |
| SiteController | `/api/sites` | CRUD |
| MerchandiseController | `/api/merchandise` | CRUD |
| SiteMerchandiseController | `/api/site-merchandise` | CRUD per site |
| ProcessRequestController | `/api/requests` | **Most complex** — multi-step workflow endpoints |
| StockInquiryController | `/api/inquiries` | Create batch, respond, matrix |
| PurchaseOrderController | `/api/po` | DRAFT, SENT, CONFIRM, REJECT, DONE |
| WarehouseController | `/api/warehouse` | Receive, confirm, discrepancy |
| DiscrepancyController | `/api/discrepancies` | Chat messages |
| NotificationController | `/api/notifications` | Bell icon support |
| AuditController | `/api/audit` | Audit query |
| GlobalExceptionHandler | – | IllegalArgumentException, MethodArgumentTypeMismatchException, RuntimeException, Exception |

See [[api/all-endpoints]] cho danh sách endpoint đầy đủ.

## Service responsibilities

Mỗi controller match 1-1 với 1 service interface (trừ `EmailService`, `NotificationService`, `AuditService`, `DiscrepancyMessageService` được dùng cross-cutting). 

**Cross-cutting services:**
- `IEmailService` — gọi từ AccountService (create, reset), SiteService (create), PurchaseOrderService (confirm), WarehouseService (discrepancy notify)
- `INotificationService` — gọi từ PurchaseOrderService (UC16 confirm), WarehouseService (UC18), Scheduler (UC7 timeout)
- `IAuditService` — gọi từ multiple services cho audit trail
- `IDiscrepancyMessageService` — UC19 chat

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

`StockInquiryTimeoutScheduler`:
- `@Scheduled(fixedRate = 300000)` — 5 phút
- Logic: SELECT inquiry WHERE status=PENDING AND timeoutAt <= NOW() → UPDATE TIMEOUT + tương ứng RequestSite → notify OVERSEAS
- `spring.task.scheduling.pool.size=2` (2 threads pool)

See [[features/uc7-stock-inquiry-timeout]].

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

- [[components/security-config]] (sẽ tạo — chi tiết SecurityConfig + plan)
- [[components/stock-inquiry-timeout-scheduler]] (sẽ tạo)
- [[components/email-service]] (sẽ tạo)
- [[api/all-endpoints]] (sẽ tạo)
- [[data/schema-overview]] (sẽ tạo)
- [[analysis/refactor-roadmap]] (sẽ tạo — main deliverable)

---

## Backlinks
- [[overview]] — references backend stack
- [[features/uc1-auth-lifecycle]] — depends on this
- [[features/uc11-12-purchase-order-lifecycle]] — depends on this
