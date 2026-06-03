---
title: rejectPO mất rejectionReason (FIXED v1.1.0)
category: bugs
tags: [bug, fixed, purchase-order, state-machine]
sources: [CHANGELOG.md]
created: 2026-06-03
updated: 2026-06-03
---

# rejectPO mất rejectionReason (FIXED v1.1.0)

> **Status**: Fixed in v1.1.0 (2026-05-25)

## Symptoms

Khi Site reject 1 PO với reason, status sau đó trở về DRAFT nhưng `rejection_reason` bị **null** → Overseas không biết tại sao bị reject để chỉnh sửa.

## Root cause

Trong `PurchaseOrderServiceImpl.rejectPO(id, reason)`:

```java
po.setStatus(POStatus.REJECTED);
po.setRejectionReason(reason);
// ...
po.setStatus(POStatus.DRAFT);  // ← overwrite!
poRepository.save(po);
```

Status được set REJECTED rồi immediately overwrite DRAFT, nhưng cập nhật trên cùng entity → reason vẫn còn trong memory nhưng UPDATE SQL có thể bị JPA flush sau khi status đã quay lại DRAFT.

Actually root cause là **logic intent confusion**: design ban đầu là REJECTED nhưng UX cần quay lại DRAFT để Overseas edit. Code reflect 2 intent đối chọi.

## Fix

Đặt status thẳng DRAFT, giữ `rejection_reason` cho mục đích display:

```java
po.setStatus(POStatus.DRAFT);
po.setRejectionReason(reason);
poRepository.save(po);
```

Per [[claims#c-20260603-07]]: PO lifecycle DRAFT → SENT → CONFIRMED | REJECTED→DRAFT(giữ reason).

## Verification

- [ ] Manual: Site reject 1 PO → check `purchase_order.rejection_reason` không null → Overseas xem reason → edit + send lại
- [ ] Unit test: `rejectPO_preserves_reason_when_back_to_DRAFT`

## Impact for refactor

> [!warning] State machine ambiguity
> Bug này phát sinh vì transition REJECT không phải pure "REJECTED" — nó hybrid REJECTED+DRAFT. Khi refactor (P3 - state machine), nên model rõ:
> - **RejectionEvent** ≠ state "REJECTED" — chỉ là sự kiện sinh data
> - Final state sau reject là DRAFT (với reason as metadata)
> - Hoặc thêm sub-state DRAFT_REJECTED để Overseas thấy "đã từng bị reject"

## Related

- [[features/uc11-12-purchase-order-lifecycle]]
- [[analysis/refactor-roadmap]] (Phase 3.1 — state machine)

---

## Backlinks
- [[sources/changelog]] — bug fix announced
- [[features/uc11-12-purchase-order-lifecycle]] — affected feature
