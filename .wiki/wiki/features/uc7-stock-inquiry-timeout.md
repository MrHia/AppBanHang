---
title: UC7 — Stock Inquiry & 48h Auto-Timeout
category: features
tags: [stock-inquiry, scheduler, timeout, notification]
sources: [CHANGELOG.md, DOCS/USER_GUIDE.md]
created: 2026-06-03
updated: 2026-06-03
---

# UC7 — Stock Inquiry & 48h Auto-Timeout

> Site nhận inquiry, phản hồi số tồn kho thực tế. Nếu > 48h chưa phản hồi → auto-TIMEOUT.

## State machine

```
                  PENDING ────(Site responds qty)──► COMPLETED
                     │
                     │ (>= 48h elapsed)
                     ▼
                  TIMEOUT
                     │
                     ▼
         Overseas dùng stock reference (Ref*)
```

## Backend implementation

| Component | Detail |
|-----------|--------|
| Class | `scheduler/StockInquiryTimeoutScheduler` |
| Annotation | `@Scheduled(fixedRate = 300000)` — chạy mỗi 5 phút |
| Logic | Query `stock_inquiry WHERE status = 'PENDING' AND created_at < NOW() - INTERVAL 48 HOUR` → UPDATE status = 'TIMEOUT' |
| Side effect | Tạo notification cho OVERSEAS (recipient_role='OVERSEAS') (see [[features/uc16-notification-system]]) |

See [[claims#c-20260603-06]] cho fixedRate config.

## Site response flow

1. Site sees inquiry tại `site/inquiries`
2. "Respond" → form nhập qty per merchandise
3. Submit → status PENDING → COMPLETED, save qty vào `stock_inquiry_item.responded_quantity`

## Data touched

- `stock_inquiry` (status: PENDING | COMPLETED | TIMEOUT, có thể có PARTIAL?)
- `stock_inquiry_item` (qty_requested, qty_responded)
- `notification` (UC16 hook)

## Risks & Refactor notes

> [!warning] 5-minute polling for 48h SLA
> 5 phút polling rate = lag tối đa 5 phút trước khi đánh dấu TIMEOUT. OK với SLA 48h, nhưng nếu trong tương lai cần SLA ngắn hơn (ví dụ 2h), cần đổi sang **event-driven** (delay queue).

> [!info] Time zone
> `INTERVAL 48 HOUR` từ `created_at`. Cần đảm bảo backend, DB, FE đều cùng timezone (hiện cấu hình `serverTimezone=UTC` trong docker-compose).

> [!tip] Concurrent scheduler
> Nếu deploy multi-instance, scheduler chạy đồng thời trên nhiều node có thể double-process. Refactor nên dùng **distributed lock** (e.g. ShedLock) hoặc leader election.

## Related

- [[features/uc6-overseas-process-request]] — sinh ra inquiry này
- [[features/uc16-notification-system]] — TIMEOUT triggers notification
- [[components/stock-inquiry-timeout-scheduler]] (sẽ tạo từ Explore output)

---

## Backlinks
- [[overview]] — references UC7
- [[sources/changelog]] — feature added v1.1.0
