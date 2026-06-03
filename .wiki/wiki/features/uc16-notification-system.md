---
title: UC16 — Cross-role Notification System
category: features
tags: [notification, cross-role, bell-icon, websocket-candidate]
sources: [CHANGELOG.md]
created: 2026-06-03
updated: 2026-06-03
---

# UC16 — Cross-role Notification System

> Khi 1 role thực hiện action → role khác nhận notification (bell + unread count).

## Trigger points (known)

| Trigger | Source role | Target role | Entity |
|---------|-------------|-------------|--------|
| Site confirm PO | SITE | WAREHOUSE | purchase_order |
| Stock inquiry TIMEOUT | (scheduler) | OVERSEAS | stock_inquiry |
| Warehouse create discrepancy | WAREHOUSE | SITE | site_discrepancy |
| Site response discrepancy | SITE | WAREHOUSE | discrepancy_message |
| (TBD) Sales create request | SALES | OVERSEAS | process_request |
| (TBD) Overseas send inquiry | OVERSEAS | SITE | stock_inquiry |

> [!question] Verify triggers
> Một số trigger trên dựa vào suy luận từ workflow. Cần grep `notificationService.create(...)` trong code để xác nhận toàn bộ.

## Data schema

Table `notification` (see [[claims#c-20260603-08]]):

```sql
id              INT PK AUTO_INCREMENT
recipient_role  VARCHAR(50) NOT NULL   -- WAREHOUSE | SITE | OVERSEAS | SALES | ADMIN
title           VARCHAR(255) NOT NULL
message         TEXT NOT NULL
is_read         BOOLEAN DEFAULT FALSE
entity_type     VARCHAR(50)            -- purchase_order | stock_inquiry | site_discrepancy | ...
entity_id       INT
created_at      DATETIME DEFAULT NOW()
```

> [!warning] No recipient_user_id
> Hiện tại notification gửi theo **role**, không theo **user**. Nghĩa là tất cả user của 1 role thấy chung. Có thể OK với hệ thống nhỏ nhưng cần xem xét trong refactor (multi-warehouse scenario).

## API surface (preliminary)

- `GET /api/notifications?role=…&unread=true`
- `POST /api/notifications/{id}/read`
- `POST /api/notifications/read-all` (?)

## Frontend integration

- Dashboard layout có **bell icon** + unread count badge
- Click bell → dropdown list → click item → navigate đến entity (deep-link by entity_type + entity_id)

## Refactor opportunities

> [!tip] Move to per-user notifications
> Thêm `recipient_user_id` column, fallback `recipient_role` cho broadcast. Cần migration script.

> [!info] Realtime
> Polling hiện tại (re-fetch sau X giây). Refactor candidates: **SSE** (lightweight), **WebSocket** (full-duplex), **STOMP over WS** (Spring built-in).

> [!warning] entity_type là string
> Nên là enum để tránh typo. Khi refactor BE → FE deep-link, cần single source of truth cho mapping entity_type → route.

## Related

- [[features/uc7-stock-inquiry-timeout]] — TIMEOUT triggers
- [[features/uc11-12-purchase-order-lifecycle]] — confirm trigger
- [[features/uc15-20-warehouse-discrepancy]] — create + response triggers

---

## Backlinks
- [[overview]] — references UC16
- [[sources/changelog]] — feature added v1.1.0
