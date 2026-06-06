---
title: PO cancellation cascades to ProcessRequest + sibling POs
category: decisions
tags: [decision, purchase-order, state-machine, cancellation, cascade, atomicity]
sources: [ITSSBE/src/main/java/com/example/importorder/service/impl/PurchaseOrderServiceImpl.java, ITSSBE/src/main/java/com/example/importorder/domain/po/state/RejectedState.java]
created: 2026-06-06
updated: 2026-06-06
---

# Decision — PO cancellation cascades to ProcessRequest + sibling POs

**Date**: 2026-06-06
**Decided by**: User (project owner)
**Status**: active — implemented same day

## Context

A `ProcessRequest` produces N `PurchaseOrder` rows in one batch via `POST /api/requests/{id}/po-batch` — one PO per Site touched by the request. Before this change:

- `REJECTED` was a transient state: `SentState.reject()` → REJECTED, then `RejectedState.resetFromRejected()` immediately put the PO back into DRAFT preserving the rejection reason (legacy UC12 — Overseas edits and resends).
- A PO that the Site rejected did **not** affect the parent request or its sibling POs.

The user wanted a stronger semantic: *"1 trong bất cứ purchased order (đơn đặt hàng từ overseas sang site) bị huỷ thì đơn request tổng cần được hủy luôn"* — if any PO is cancelled, the whole request (and all sibling POs) must be cancelled too.

## Options considered

| Option | Pros | Cons |
|--------|------|------|
| **Make REJECTED terminal + cascade** (chosen) | Aligns the data model with the business rule: a request is either fully realised or fully cancelled. Stock automatically restored. | Loses the REJECTED → DRAFT revision loop (UC12 removed). |
| New `CANCELLED` state alongside REJECTED | Keeps UC12's revision loop for Site-rejection. | Two terminal states that mean "ended without completion" is confusing; FE has to label both as "Cancelled". |
| Cascade only when Overseas cancels, not when Site rejects | Preserves UC12 behaviour. | Inconsistent — the same DB row ends in REJECTED via two different paths with very different blast radius. |

## Decision

1. **`REJECTED` is a TERMINAL state.** `RejectedState` throws `IllegalStateException` on every transition (including `resetFromRejected`).
2. The REJECTED → DRAFT loop (legacy UC12) is gone. PO revisions are not supported anymore — start a new request.
3. Cancellation is now reachable from any non-terminal state: `DRAFT`, `SENT`, `CONFIRMED` all support `reject(reason)`. (DONE remains terminal.)
4. `PurchaseOrderServiceImpl.rejectPO(id, reason)` cascades:
   - Transitions the trigger PO to REJECTED.
   - Restores stock for the trigger PO if its previous status was SENT or CONFIRMED (no-op for DRAFT — no stock had been consumed).
   - Publishes `PORejectedEvent`.
   - Sets the parent `ProcessRequest` to CANCELLED.
   - Iterates every sibling PO of the same request:
     - Skip already-terminal (REJECTED, DONE).
     - Reject with reason `"Cascaded from PO {triggerCode}: {reason}"`.
     - Restore stock if its previous status was SENT or CONFIRMED.
   - Audit log: `REQUEST_CANCELLED_CASCADE` on the request + `PO_CANCELLED_CASCADE` on each sibling.
   - Notify OVERSEAS with one notification per cascade.
5. All three roles can trigger cancellation:
   - **Site** — via "Reject" button on `site/purchase-orders.js` (only SENT POs reach the Site).
   - **Overseas** — via new "Cancel PO" button on `overseas/purchase-orders.js` (any non-terminal status).
   - **Admin** — via new "Hủy PO" button on `admin/purchase-orders.js` (data-fix path).
6. All three call the same `POST /api/po/{id}/reject?reason=...` endpoint.

## Concrete code touchpoints

- `domain/po/state/RejectedState.java` — all five methods throw.
- `domain/po/state/DraftState.java` — `reject()` now transitions to REJECTED (previously threw).
- `domain/po/state/ConfirmedState.java` — same.
- `service/impl/PurchaseOrderServiceImpl.java`:
  - `rejectPO` no longer calls `resetFromRejected`.
  - New private helpers: `cascadeCancelRequest`, `consumedStock`, `restoreStockForPO`.
  - Added `SiteMerchandiseRepository` injection.
- `controller/PurchaseOrderController.java` — message string updated; UC12 comment retired.
- `test/.../POStateTest.java` — `rejectedStateResetPreservesReason` (old) → `rejectedStateIsTerminal`; new `draftStateAllowsRejectAsCancellation` + `confirmedStateAllowsRejectAsCancellation`.
- FE: cancel UI on overseas + admin PO pages; cascade-warning Alerts on all three role pages.

## Consequences

### Positive
- ✅ Stock invariant restored: at any moment, `site_merchandise.stock_quantity` reflects only actually-active POs.
- ✅ Sales never gets partial fulfilment with no signal — a single cancellation kills the request loudly.
- ✅ State machine is more honest: `REJECTED` is final, like `DONE`.
- ✅ Idempotent: re-cancelling an already-REJECTED PO short-circuits at the state machine.

### Negative / Risks
- ⚠️ UC12 (Overseas revises a Site-rejected PO) is gone. If the business needs that flow, it would now require a brand new ProcessRequest.
- ⚠️ The cascade is best-effort within one `@Transactional` boundary. If the DB rolls back mid-cascade, the entire operation reverts — which is the correct behaviour, but worth noting if we ever shard.

### Future revisits
- If granular cancellation is ever needed (cancel a PO without killing the parent), this would need a `cancel_scope` flag on the endpoint. Out of scope today.

## Related

- [[features/uc11-12-purchase-order-lifecycle]] (state machine updated)
- [[features/uc6-overseas-process-request]] (2-step wizard)
- [[decisions/remove-stock-inquiry]] (paired same-day change)
- [[bugs/rejectpo-loses-reason]] (the original revision-loop bug is now moot)

---

## Backlinks
- [[log]] — 2026-06-06 entry
- [[claims]] — c-20260606-10, c-20260606-11
