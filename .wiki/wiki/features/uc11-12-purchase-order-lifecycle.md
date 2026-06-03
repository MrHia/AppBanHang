---
title: UC11/UC12 — Purchase Order Lifecycle (DRAFT/SENT/CONFIRMED/REJECTED)
category: features
tags: [purchase-order, draft, lifecycle, state-machine]
sources: [CHANGELOG.md, DOCS/USER_GUIDE.md]
created: 2026-06-03
updated: 2026-06-03
---

# UC11/UC12 — Purchase Order Lifecycle

> PO bắt đầu DRAFT (UC11) → có thể edit khi DRAFT (UC12) → SENT → CONFIRMED hoặc REJECTED (về lại DRAFT giữ reason).

## State machine

```
                  ┌─────────────► CONFIRMED ─► Warehouse receive (UC15)
                  │ (Site OK)
   CREATE         │
     │            │
     ▼            ▼
   DRAFT ──Send──► SENT
     ▲            │
     │            │ (Site reject + reason)
     │            ▼
     └────────  REJECTED ──auto-back──► DRAFT (rejectionReason preserved)
       Overseas edit                    [BUG FIXED v1.1.0]
       (UC12)
```

## Key behaviors

| Behavior | Detail |
|----------|--------|
| Create → DRAFT | `create()` set `status = DRAFT` (trước v1.1.0: SENT trực tiếp) |
| Send DRAFT → SENT | `sendPO()` endpoint riêng |
| Edit DRAFT | `PUT /api/po/{id}/items` — **chỉ** khi status = DRAFT |
| Reject → DRAFT | Status về DRAFT, **giữ `rejectionReason`** để Overseas edit theo feedback |
| Qty cap | PO item qty ≤ qty từ inquiry response (UC11 validation) |

See [[claims#c-20260603-07]].

## API surface (preliminary)

- `POST /api/po/draft` — multi-site batch create DRAFT
- `PUT /api/po/{id}/items` — edit DRAFT items
- `POST /api/po/{id}/send` — DRAFT → SENT
- `POST /api/po/{id}/confirm` — Site action
- `POST /api/po/{id}/reject` — Site action với reason
- `GET /api/po?role=…` — list theo role

## Data touched

- `purchase_order` (id, code, request_id, site_id, status, shipping_method, expected_delivery, rejection_reason, created_at)
- `po_detail` (po_id, merchandise_id, quantity, unit_price?)

## Refactor opportunities

> [!tip] Explicit state machine
> Currently state transitions phân tán trong service methods. Refactor có thể dùng **Spring State Machine** hoặc abstract state class — dễ test edge cases.

> [!warning] PO status enum chưa verify
> Có thể có thêm CANCELED, COMPLETED, ARCHIVED. Cần map từ entity `PurchaseOrder` (Explore agent sẽ trả).

> [!info] Multi-site batch creation
> 1 click có thể tạo N PO cùng lúc → cần **transactional**: hoặc tạo tất cả, hoặc không tạo gì. Check existing impl trong PurchaseOrderServiceImpl.

## Related bug

- [[bugs/rejectpo-loses-reason]] — đã fix v1.1.0

## Related

- [[features/uc6-overseas-process-request]] — PO sinh ra từ aggregate step
- [[features/uc13-site-confirm-reject-po]] — Site actions
- [[features/uc15-warehouse-receive]] — sau khi CONFIRMED

---

## Backlinks
- [[overview]] — references UC11/12
- [[sources/changelog]] — features in v1.1.0
- [[sources/user-guide]] — workflow documented
