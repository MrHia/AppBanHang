---
title: UC7 — Stock Inquiry & 48h Auto-Timeout (DEPRECATED — removed 2026-06-06)
category: features
tags: [stock-inquiry, scheduler, timeout, notification, deprecated, removed]
sources: [CHANGELOG.md, DOCS/USER_GUIDE.md]
created: 2026-06-03
updated: 2026-06-06
---

# UC7 — Stock Inquiry & 48h Auto-Timeout

> [!warning] Feature removed on 2026-06-06
> The entire stock-inquiry subsystem (Site Response) has been deleted from the codebase.
> See [[decisions/remove-stock-inquiry]] for the rationale and the full deletion manifest.
> This page is kept for historical reference only.

## Why removed

`SiteMerchandise.stock_quantity` is already maintained by Site through `site/merchandise.js`, so the inquiry/response cycle was redundant. Overseas now reads stock directly when running the 2-step wizard ([[features/uc6-overseas-process-request]]).

## What was deleted

- Backend: `StockInquiry`, `StockInquiryItem` entities; their DTOs, repositories, mapper, service interfaces & impls; `StockInquiryController`; `StockInquiryTimeoutScheduler`; `InquiryTimeoutEvent`; the `domain/inquiry/stocksource/` Strategy package; `StockSourceTest`.
- Backend orchestrator (`ProcessRequestServiceImpl`): `sendInquiries`, `getInquiryStatus`, `getInventoryMatrix` methods removed.
- Backend listener (`PONotificationListener`): `onInquiryTimeout` handler removed.
- Frontend: `pages/site/inquiries.js`, `Step2SendInquiries`, `Step3Track` components, `inquiryApi`, and 80+ i18n keys.
- SQL: `DROP TABLE stock_inquiry_item; DROP TABLE stock_inquiry;` plus the `request_site.status` enum trim to `('PICKED','REJECTED')`.

## Historical reference

Original state machine (now defunct):
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

The 5-minute polling scheduler (`@Scheduled(fixedRate = 300000)`) is gone.

## Related

- [[decisions/remove-stock-inquiry]] — decision rationale
- [[features/uc6-overseas-process-request]] — replacement workflow
- [[components/processrequest-coordinator]] — InquiryCoordination service removed
- [[components/backend-events]] — InquiryTimeoutEvent removed

---

## Backlinks
- [[overview]] — references UC7
- [[sources/changelog]] — feature added v1.1.0
- [[decisions/remove-stock-inquiry]] — supersedes
