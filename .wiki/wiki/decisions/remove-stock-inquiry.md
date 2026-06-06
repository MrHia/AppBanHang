---
title: Remove the stock-inquiry subsystem (Site Response)
category: decisions
tags: [decision, deletion, stock-inquiry, simplification, workflow]
sources: [ITSSBE/src/main/java/com/example/importorder/service/impl/ProcessRequestServiceImpl.java, ITSSFE/src/pages/overseas/process-request/[id].js]
created: 2026-06-06
updated: 2026-06-06
---

# Decision — Remove the stock-inquiry subsystem (Site Response)

**Date**: 2026-06-06
**Decided by**: User (project owner)
**Status**: active — implemented same day

## Context

The original workflow (UC6 + UC7) was:
1. Overseas assigns each merchandise to a Site.
2. Overseas sends a **stock inquiry** to each Site asking "how much do you have?".
3. Site responds quantities through `site/inquiries` page.
4. After 48h timeout, the scheduler auto-flips inquiries to `TIMEOUT`.
5. Overseas reads an **inventory matrix** (inquiry response > reference stock > none cascade) and creates a PO batch.

But `SiteMerchandise.stock_quantity` is already maintained by Site through `site/merchandise.js` — the inquiry response was a **redundant request/response cycle** that just round-tripped the same number. Site never benefited from being asked; Overseas already had the data.

User: *"stock inquiry response cần phải bỏ đi vì mình không cần nó nữa."*

## Options considered

| Option | Pros | Cons |
|--------|------|------|
| **Remove the entire subsystem** (chosen) | Simplest mental model; one source of truth for stock; fewer screens to maintain; 21 fewer BE files; 4 fewer FE files. | Loses the "ask Site to confirm" audit trail (none was kept anyway). |
| Keep but hide the FE | Reversible if requirement returns. | Dead code in BE schedulers, listeners, entities, DTOs. Drift risk. |
| Keep the inquiry but auto-respond | Preserves the workflow shape. | Adds complexity to a flow nobody uses. |

## Decision

Delete the entire stock-inquiry subsystem. Stock for the Overseas decision now comes **only** from `SiteMerchandise.stock_quantity`.

## Concrete deletions

### Backend (21 files removed)
- Entities: `StockInquiry`, `StockInquiryItem`
- DTOs: `StockInquiryDTO`, `StockInquiryItemDTO`, `InquiryStatusDTO`, `StockInfoDTO`
- Repositories: `StockInquiryRepository`, `StockInquiryItemRepository`
- Services: `IStockInquiryService` + impl, `IInquiryCoordinationService` + impl
- Controllers: `StockInquiryController`
- Mappers: `StockInquiryMapper`
- Scheduler: `StockInquiryTimeoutScheduler`
- Event: `InquiryTimeoutEvent`
- Domain/Strategy: `domain/inquiry/stocksource/` package (resolver, context, interface, 3 impls)
- Test: `StockSourceTest`

### Backend (modified)
- `ProcessRequestServiceImpl`: removed `sendInquiries()`, `getInquiryStatus()`, `getInventoryMatrix()` and the corresponding repo/service injections (`siRepo`, `siiRepo`, `inquiryService`).
- `IProcessRequestService`: removed 3 inquiry methods.
- `ProcessRequestController`: removed `POST /{id}/send-inquiries`, `GET /{id}/inquiry-status`, `GET /{id}/inventory-matrix`.
- `PONotificationListener`: removed `onInquiryTimeout`.
- `RequestSite.SelectionStatus` enum trimmed `INQUIRY_SENT, RESPONDED, TIMEOUT` → keeps only `PICKED, REJECTED`.
- `RequestSiteRepository`: dropped `findByRequestAndStatus` and `findDistinctSiteIdsByRequestAndStatuses` (orphans).
- `POEventPublishTest`: removed `notificationListenerNotifiesOverseasOnInquiryTimeout`.

### Frontend (4 files removed + simplification)
- `pages/site/inquiries.js` (the page itself).
- `components/overseas/processrequest/Step2SendInquiries.js`, `Step3Track.js`.
- Old `Step4Matrix.js` replaced by a slimmer `Step2CreatePOs.js` that reads stock directly from `SiteMerchandise`.
- `layouts/dashboard/index.js`: SITE nav no longer contains "Stock Inquiry Response".
- `api/index.js`: `inquiryApi` removed; `requestApi.sendInquiries / getInquiryStatus / getInventoryMatrix` removed.
- `pages/site/dashboard.js`: dropped the inquiry counter card.
- Wizard collapsed from **4 steps → 2 steps**: Step1 Assign sites → Step2 Create PO batch.
- `StatusBadge.js` slimmed to only PENDING / PICKED / REJECTED.
- i18n: removed `nav.stockInquiryResponse`, `site.inquiries.*`, `site.dashboard.stockCheckRequests`, plus the dead step2/step3/step4 wizard keys.

### SQL
- `schema.sql` now `DROP TABLE IF EXISTS stock_inquiry_item; DROP TABLE IF EXISTS stock_inquiry;` and migrates `request_site.status` ENUM to `('PICKED','REJECTED')`.
- `test-data-overseas.sql` rewritten — old scenarios C/D/F (which depended on inquiry rows) collapsed; new scenarios A/B/C/D show PICKED-only flow + a CANCELLED cascade fixture.

## Consequences

### Positive
- ✅ One source of truth for stock: `site_merchandise.stock_quantity`.
- ✅ Wizard cognitive load halved (4 steps → 2).
- ✅ ~25 dead files gone; less to refactor / lint / test.
- ✅ Scheduler removed — no more 5-minute polling.

### Negative / Risks
- ⚠️ Lost the explicit "Site acknowledged the inquiry" audit point. If the business later requires Site sign-off before a PO is sent, we'd reintroduce a thinner version.
- ⚠️ Site no longer has a workflow surface in the system beyond receiving POs and reporting discrepancies. That's fine for now but worth noting.

### Future revisits
- If sign-off ever becomes mandatory: model it as a single `acknowledged_by` column on `purchase_order`, not as a parallel inquiry workflow.

## Related

- [[features/uc7-stock-inquiry-timeout]] (superseded)
- [[features/uc6-overseas-process-request]] (collapsed to 2 steps)
- [[components/processrequest-coordinator]] (InquiryCoordination removed)
- [[components/backend-events]] (InquiryTimeoutEvent removed)
- [[decisions/po-cancellation-cascade]] (paired same-day change)

---

## Backlinks
- [[log]] — 2026-06-06 entry
- [[claims]] — c-20260606-09
