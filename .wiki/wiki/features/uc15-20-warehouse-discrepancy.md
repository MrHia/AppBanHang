---
title: UC15-UC20 — Warehouse Receive & Discrepancy Handling
category: features
tags: [warehouse, receive, discrepancy, site-response]
sources: [CHANGELOG.md, DOCS/USER_GUIDE.md]
created: 2026-06-03
updated: 2026-06-03
---

# UC15-UC20 — Warehouse Receive & Discrepancy Handling

> Warehouse nhận hàng từ Site (CONFIRMED PO) → nếu qty thực ≠ qty kỳ vọng → tạo discrepancy → Site phản hồi → resolved.

## Flow

```
PO CONFIRMED (UC13) ──notify──► Warehouse (UC16 bell)
                                     │
                                     ▼
                      Warehouse mở /warehouse/receive
                                     │
                                     ▼
                     Per item: nhập qty thực nhận
                                     │
                          ┌──────────┴──────────┐
                          │                     │
                          ▼                     ▼
                      qty match           qty ≠ expected
                          │                     │
                          ▼                     ▼
                      DONE              CREATE discrepancy (UC18)
                                                │
                                                ▼
                                         (shortage / excess)
                                                │
                                                ▼
                                  Notify Site → Site response (UC19)
                                                │
                                                ▼
                                  Warehouse resolve (UC20)
```

## Discrepancy types

| Type | Meaning | Sign |
|------|---------|------|
| `shortage` | Nhận thiếu | Negative (e.g. -5) |
| `excess` | Nhận thừa | Positive (e.g. +3) |

See [[claims#c-20260603-09]], [[claims#c-20260603-15]].

> [!bug] Pre-v1.1.0 field mismatch
> Frontend dùng tên field khác (không phải `shortage`/`excess`) → mapping sai. Fixed v1.1.0.

## API surface (preliminary)

- `POST /api/warehouse/receipts` — tạo receipt batch
- `GET /api/warehouse/confirmed-pos` — pos waiting receive
- `GET /api/discrepancies` (filter by role: WAREHOUSE vs SITE)
- `POST /api/discrepancies/{id}/messages` — UC19 Site response
- `POST /api/discrepancies/{id}/resolve` — UC20 Warehouse close

## Data touched

- `warehouse_receipt` (po_id, received_by, received_at)
- `receipt_item` (receipt_id, merchandise_id, expected_qty, actual_qty, diff)
- `site_discrepancy` (id, receipt_id, merchandise_id, type, quantity, status, created_at)
- `discrepancy_message` (id, discrepancy_id, sender, message, sent_at)
- `notification` (UC16: notify Warehouse when PO CONFIRMED; UC18: notify Site when discrepancy created)

## Discrepancy state machine

```
NEW ──Site responds──► RESOLVING ──Warehouse resolves──► RESOLVED
                                                            │
                                                            ▼
                                                       (with note)
```

Set bởi `DiscrepancyMessageService.sendMessage()` → updates status RESOLVING.

## Refactor opportunities

> [!warning] Two-way messaging without realtime
> Currently Site response qua DiscrepancyMessage table — polling-based. Refactor có thể thêm **WebSocket / SSE** nếu volume tăng.

> [!info] Atomicity
> Khi nhận hàng + tạo discrepancy: phải **single transaction** để tránh receipt tồn tại mà thiếu discrepancy.

> [!tip] Discrepancy type enum
> `shortage` / `excess` — hardcoded string? Nên là enum (Java + DB ENUM hoặc CHECK constraint).

## Related

- [[features/uc11-12-purchase-order-lifecycle]] — UC15 trigger là PO CONFIRMED
- [[features/uc16-notification-system]] — UC16 hook
- [[features/uc13-site-confirm-reject-po]] — Site actions

---

## Backlinks
- [[overview]] — references UC15-20
- [[sources/changelog]] — UC19 added, field mismatch fixed v1.1.0
- [[sources/user-guide]] — workflow documented
