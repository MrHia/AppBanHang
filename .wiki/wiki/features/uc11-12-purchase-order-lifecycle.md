---
title: UC11/UC12 — Purchase Order Lifecycle (DRAFT/SENT/CONFIRMED/REJECTED/DONE)
category: features
tags: [purchase-order, lifecycle, state-machine, cancellation, cascade]
sources: [CHANGELOG.md, DOCS/USER_GUIDE.md, ITSSBE/src/main/java/com/example/importorder/domain/po/state/]
created: 2026-06-03
updated: 2026-06-06
---

# UC11/UC12 — Purchase Order Lifecycle

> PO starts DRAFT, can be edited while DRAFT, transitions DRAFT → SENT → CONFIRMED → DONE.
> **REJECTED is a terminal cancellation state** (new 2026-06-06). Cancelling any PO cascades the parent ProcessRequest and every sibling PO to CANCELLED/REJECTED and restores deducted stock.

## State machine (after 2026-06-06 refactor)

```
                                 ┌──► DONE          (terminal)
                                 │
   create()    send()    confirm()    markDone()
    │           │           │           │
    ▼           ▼           ▼           ▼
   DRAFT ───► SENT ───► CONFIRMED ───► DONE
    │           │           │
    │           │           │ reject(reason)
    │           │           ▼
    │           │       REJECTED       (terminal — cancellation)
    │           │           ▲
    │           └───────────┤ reject(reason)
    │                       │
    └───────────────────────┘ reject(reason)
```

> [!info] What changed on 2026-06-06
> - REJECTED used to loop back to DRAFT (legacy UC12 "Overseas revises and resends"). Now REJECTED is **terminal** — see [[decisions/po-cancellation-cascade]].
> - `reject(reason)` is now legal from DRAFT, SENT, and CONFIRMED (all interpreted as cancellation). DONE remains terminal.
> - Cancelling a PO cascades: parent ProcessRequest → CANCELLED, every sibling PO → REJECTED, stock restored for any sibling that had consumed it (SENT or CONFIRMED).

## Cascade rule

Triggered by `POST /api/po/{id}/reject?reason=...`. All three roles share this endpoint:
- **Site** — reject button on `site/purchase-orders.js` (only SENT POs reach the Site).
- **Overseas** — new cancel button on `overseas/purchase-orders.js`.
- **Admin** — new cancel button on `admin/purchase-orders.js`.

`PurchaseOrderServiceImpl.rejectPO(id, reason)` then:
1. Transitions the trigger PO to REJECTED.
2. Restores stock for the trigger if previous status was SENT or CONFIRMED (DRAFT had no deduction).
3. Publishes `PORejectedEvent`.
4. Sets the parent `ProcessRequest.status = CANCELLED`.
5. For each sibling PO of the request: skip if REJECTED/DONE, otherwise reject with reason `"Cascaded from PO {triggerCode}: {reason}"`, restore stock if applicable.
6. Audit-logs `REQUEST_CANCELLED_CASCADE` + `PO_CANCELLED_CASCADE`.
7. Notifies OVERSEAS via `INotificationService`.

The whole cascade runs inside one `@Transactional` boundary — partial failure rolls back the entire operation.

## API surface

| Endpoint | Purpose |
|----------|---------|
| `POST /api/po/draft` | Multi-site batch create DRAFT |
| `PUT /api/po/{id}/items` | Edit DRAFT items |
| `POST /api/po/{id}/send` | DRAFT → SENT |
| `POST /api/po/{id}/confirm` | Site action, SENT → CONFIRMED |
| `POST /api/po/{id}/reject?reason=…` | **Cancel** — DRAFT/SENT/CONFIRMED → REJECTED, plus cascade. Replaces old "send back for revision" semantics. |
| `POST /api/po/{id}/done` | CONFIRMED → DONE |
| `GET /api/po` (and per-site/per-request) | List |

## Data touched on cancellation

- `purchase_order.status = 'REJECTED'`, `rejection_reason` set.
- `purchase_order.status` of every sibling = 'REJECTED' (same reason chain).
- `process_request.status = 'CANCELLED'`.
- `site_merchandise.stock_quantity` += each PODetail.quantity for every PO that had previously consumed stock.
- `audit_log`: `REQUEST_CANCELLED_CASCADE`, `PO_CANCELLED_CASCADE` per sibling.
- `notification`: one OVERSEAS row per cascade.

## Tests covering the new behaviour

- `POStateTest.rejectedStateIsTerminal` — all 5 transitions throw on a REJECTED PO.
- `POStateTest.draftStateAllowsRejectAsCancellation` — DRAFT → REJECTED legal.
- `POStateTest.confirmedStateAllowsRejectAsCancellation` — CONFIRMED → REJECTED legal.
- `POStateTest.doneStateIsTerminal` (unchanged) — DONE remains untouchable.

> [!tip] What was UC12
> The old UC12 (Overseas revises a Site-rejected PO back to DRAFT) is **removed**. Revising a cancelled PO now requires starting a brand new ProcessRequest. If revision-loop semantics are needed in the future, model it as a separate "revision" endpoint, not as a state-machine cycle.

## Related bug

- [[bugs/rejectpo-loses-reason]] — historical; the original revision-loop bug is moot now that REJECTED is terminal (reason is preserved either way).

## Related

- [[decisions/po-cancellation-cascade]] — design rationale (2026-06-06)
- [[features/uc6-overseas-process-request]] — PO batch is created at end of the 2-step wizard
- [[features/uc15-20-warehouse-discrepancy]] — runs after CONFIRMED → DONE
- [[components/backend-events]] — `PORejectedEvent`

---

## Backlinks
- [[overview]] — references UC11/12
- [[sources/changelog]] — features in v1.1.0
- [[sources/user-guide]] — workflow documented
- [[decisions/po-cancellation-cascade]] — supersedes the UC12 revision loop
