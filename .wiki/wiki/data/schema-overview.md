---
title: Data Schema — 18 tables, MySQL 8
category: data
tags: [schema, mysql, jpa, entity-mapping]
sources: [SQL/schema.sql, SQL/migration_multisite_request_site.sql, agent-summary]
created: 2026-06-03
updated: 2026-06-03
---

# Data Schema — 18 tables, MySQL 8

> Schema chia 4 cluster: **Identity** (role, site, account), **Catalog** (merchandise, site_merchandise), **Workflow** (request, inquiry, po, receipt, discrepancy), **Cross-cutting** (notification, audit_log).

## Cluster diagram

```
                    ┌────────┐
                    │  role  │
                    └────┬───┘
                         │ 1:N
                         ▼
                    ┌──────────┐
       ┌─────────►  │ account  │ ◄─────┐
       │            └────┬─────┘       │
   created_by         site_id          │ resolved_by
       │                 │             │
       │           ┌─────▼───┐         │
       │           │  site   │         │
       │           └────┬────┘         │
       │                │ 1:N          │
       │                ▼              │
       │      ┌───────────────────┐    │
       │      │ site_merchandise  │    │
       │      └─────────┬─────────┘    │
       │                │ N:1          │
       │                ▼              │
       │          ┌─────────────┐      │
       │          │ merchandise │ ◄─┐  │
       │          └─────────────┘   │  │
       │                            │  │
   ┌───▼──────────────────┐  M:N (via item tables)
   │  process_request     │ ─┐         │
   │  status: PENDING…    │  │         │
   └────────┬─────────────┘  │         │
            │ 1:N             │         │
   ┌────────▼──────┐  ┌──────▼──────┐  │
   │ request_item  │  │ request_site│ ─┤
   └───────────────┘  │ status:PICKED│
                      │  REJECTED   │
                      │  INQUIRY_*  │
                      └─────────────┘
            │
            │ 1:N
   ┌────────▼──────┐
   │ stock_inquiry │ ─┐
   │ status: PEND… │  │ 1:N
   └────────┬──────┘  ▼
            │     ┌──────────────────┐
            │     │ stock_inquiry_item│
            │     └──────────────────┘
            │ 1:N
   ┌────────▼──────────┐
   │ purchase_order    │ ─┐
   │ status: DRAFT/SENT│  │ 1:N
   │  CONFIRMED/REJ/   │  ▼
   │  DONE             │ ┌─────────┐
   │ delivery: SHIP…   │ │po_detail│
   └────────┬──────────┘ └─────────┘
            │ 1:N
   ┌────────▼──────────┐
   │ warehouse_receipt │ ─┐
   │ status: PEND/DONE…│  │ 1:N
   └────────┬──────────┘  ▼
            │         ┌─────────────┐
            │         │ receipt_item│
            │         └─────────────┘
            │ 1:N
   ┌────────▼─────────────┐
   │ site_discrepancy     │ ─┐
   │ status: OPEN/RES…    │  │ 1:N
   │ shortage / excess    │  ▼
   └──────────────────────┘ ┌──────────────────────┐
                            │ discrepancy_message  │
                            │ senderType: WH/SITE  │
                            └──────────────────────┘

   Cross-cutting:
   ┌──────────────┐  ┌──────────┐
   │ notification │  │ audit_log│
   └──────────────┘  └──────────┘
```

## Tables (18)

### Identity
- **role** (id, name): ADMIN, OVERSEAS, SITE, WAREHOUSE, SALES
- **site** (id, code, name, country, email, phone, address, is_active, timestamps): seed 3 sites US/JP/DE
- **account** (id, email, password, first/last_name, phone, is_active, failed_attempts, locked_until, must_change_password, role_id, site_id, created_at): seed 7 default accounts

### Catalog
- **merchandise** (id, code, name, unit, description, is_active, created_at): seed MH-001..MH-010
- **site_merchandise** (id, site_id, merchandise_id, stock_quantity, is_active, updated_at), unique(site_id, merchandise_id): 14 seed assignments

### Workflow

**Sales request:**
- **process_request** (id, code, desired_date, notes, status, created_by, timestamps) — status PENDING/PROCESSING/DONE/CANCELLED
- **request_item** (id, process_request_id CASCADE, merchandise_id, quantity, unit)
- **request_site** (id, process_request_id CASCADE, site_id, merchandise_id, status, reject_reason, created_at), unique(process_request_id, merchandise_id, site_id) — status PICKED/REJECTED/INQUIRY_SENT/RESPONDED/TIMEOUT

**Stock inquiry:**
- **stock_inquiry** (id, process_request_id, site_id, status, created_at, responded_at, timeout_at) — status PENDING/RESPONDED/PARTIAL/TIMEOUT
- **stock_inquiry_item** (id, stock_inquiry_id CASCADE, merchandise_id, quantity)

**Purchase order:**
- **purchase_order** (id, code, process_request_id, site_id, status, delivery_method, expected_delivery, rejection_reason, created_at, confirmed_at) — status DRAFT/SENT/CONFIRMED/REJECTED/DONE, delivery_method SHIP/AIR/LAND
- **po_detail** (id, purchase_order_id CASCADE, merchandise_id, quantity, unit)

**Warehouse:**
- **warehouse_receipt** (id, purchase_order_id, received_at, received_by, status) — status PENDING/DONE/RESOLVING
- **receipt_item** (id, warehouse_receipt_id CASCADE, merchandise_id, ordered_quantity, received_quantity)
- **site_discrepancy** (id, warehouse_receipt_id, merchandise_id, shortage, excess, resolution_notes, status, resolved_by, resolved_at) — status OPEN/RESOLVING/RESOLVED
- **discrepancy_message** (id, discrepancy_id CASCADE, sender_type, sender_id, message, sent_at) — sender_type WAREHOUSE/SITE

### Cross-cutting
- **notification** (id, recipient_role, title, message, is_read, entity_type, entity_id, created_at)
- **audit_log** (id, actor_id, action, entity_type, entity_id, details, created_at)

## Seed data summary

- **Roles**: 5 (ADMIN, OVERSEAS, SITE, WAREHOUSE, SALES)
- **Sites**: SITE-US-001, SITE-JP-001, SITE-DE-001
- **Accounts**: 7 (admin, sales, warehouse, overseas + 3 site_xx) — plaintext passwords, auto-migrated to BCrypt on first run
- **Merchandise**: 10 items (MH-001..MH-010)
- **Site inventory**: 14 assignments (5 per site for US/JP, 6 for DE)

Test data file (`SQL/test-data-overseas.sql`) loads 6 scenarios `REQ-TEST-STEP1`..`REQ-TEST-TIMEOUT` for E2E testing.

## Migration history

- `migration_multisite_request_site.sql`: changed `request_site` UNIQUE constraint from `(process_request_id, merchandise_id)` to `(process_request_id, merchandise_id, site_id)`. Cho phép cùng 1 merchandise inquiry từ nhiều site (previously only 1 site per merchandise).

## Risks & Refactor notes

> [!warning] `shortage` + `excess` cùng 1 dòng
> `site_discrepancy` có **2 cột** số — 1 dòng vừa có shortage và excess không lý do nghiệp vụ. Refactor: 1 cột `diff` (signed) hoặc tách thành 2 row.

> [!warning] No FK indexes explicit
> Schema không khai báo INDEX cho FK columns ngoài UNIQUE constraints. MySQL InnoDB auto-create cho FK, nhưng cần verify query plan với EXPLAIN cho các query JOIN nhiều.

> [!info] `notification.entity_type` là VARCHAR
> Không có enum/check constraint. Refactor: thêm CHECK hoặc tách thành nhiều table per entity type.

> [!info] No soft-delete cho account/site
> `is_active` flag = soft-delete pattern. Refactor: consistency check — `account.is_active=false` có disable login không? (Cần verify trong AuthService.)

> [!tip] Numeric types
> `quantity`, `stock_quantity`, `shortage`, `excess` đều là INT. Nếu cần decimal (kg, lít) → cần đổi DECIMAL trong tương lai. Hiện chỉ INT = đếm.

> [!warning] No optimistic locking
> Không có `@Version` trên entity. Concurrent update có thể overwrite silent. Quan trọng với `site_merchandise.stock_quantity` khi multiple users update đồng thời.

## Related

- [[components/backend-architecture]] — entity → service mapping
- [[features/uc4-sales-create-request]] — process_request + request_item
- [[features/uc6-overseas-process-request]] — request_site + stock_inquiry
- [[features/uc11-12-purchase-order-lifecycle]] — purchase_order + po_detail
- [[features/uc15-20-warehouse-discrepancy]] — receipt + discrepancy
- [[infra/docker-compose]] (sẽ tạo)

---

## Backlinks
- [[overview]] — references DB
- [[components/backend-architecture]] — references entities
