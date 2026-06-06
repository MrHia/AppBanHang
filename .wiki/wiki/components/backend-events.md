---
title: Backend Events — Observer pattern (Phase 3)
category: components
tags: [backend, observer, events, decoupling, refactor-phase-3]
sources: [ITSSBE/src/main/java/com/example/importorder/event/]
created: 2026-06-06
updated: 2026-06-06
---

# Backend Events — Observer pattern (Phase 3 refactor)

> Spring `ApplicationEventPublisher` + `@EventListener` cho phép tách cross-cutting concerns (notification + email + audit) khỏi business logic. Service business chỉ publish event; listeners subscribe và handle độc lập.

## 4 event types (sau refactor 2026-06-06)

Tất cả là Java `record` (immutable value object) trong package `event/`:

| Event | Constructor | Trigger | Listener side-effects |
|-------|-------------|---------|------------------------|
| `POSentEvent` | `(Integer poId, String poCode)` | Overseas bấm "Send PO" → `PurchaseOrderServiceImpl.send()` | Email site, notification site |
| `POConfirmedEvent` | `(Integer poId, ...)` | Site confirm PO → `PurchaseOrderServiceImpl.confirm()` | **UC16**: notify WAREHOUSE; email |
| `PORejectedEvent` | `(Integer poId, String reason)` | Bất kỳ role nào cancel PO → `PurchaseOrderServiceImpl.rejectPO()`. Sau 2026-06-06, đây là **terminal** và **cascade**: service tự CANCEL parent request + sibling POs + restore stock. | Notify OVERSEAS với reason; email |
| `DiscrepancyCreatedEvent` | `(Integer receiptId, ...)` | Warehouse log discrepancy → `WarehouseServiceImpl.reportDiscrepancy()` | **UC18**: notify SITE; email |

> [!info] InquiryTimeoutEvent đã xóa (2026-06-06)
> `InquiryTimeoutEvent` đã bị xóa cùng với stock-inquiry subsystem. Xem [[decisions/remove-stock-inquiry]]. Số events từ **5 → 4**. Listener `PONotificationListener.onInquiryTimeout` cũng đã bị xóa.

## Lợi ích so với pattern cũ

**Trước Phase 3** (coupling cao):
```java
// PurchaseOrderServiceImpl.confirm() — phải biết cả notification + email
po.setStatus(CONFIRMED);
poRepository.save(po);
notificationService.create(WAREHOUSE, "PO " + po.getCode() + " confirmed");  // <-- coupling
emailService.sendPoConfirmedEmail(...);                                        // <-- coupling
auditService.log(...);                                                          // <-- coupling
```

**Sau Phase 3** (decoupled):
```java
// Business chỉ quan tâm state transition
po.setStatus(CONFIRMED);
poRepository.save(po);
eventPublisher.publishEvent(new POConfirmedEvent(po.getId(), po.getCode()));
// Listeners ở module khác tự xử lý — business KHÔNG biết
```

Tác động:
- **Test isolation**: unit test PO service không cần mock NotificationService + EmailService + AuditService nữa.
- **Extensibility**: thêm listener mới (Slack notification, metrics) không sửa business code.
- **Đa luồng dễ**: listener có thể `@Async` mà business không bị block.

## Kiểm thử

[POEventPublishTest](ITSSBE/src/test/java/com/example/importorder/event/POEventPublishTest.java) verify mỗi state transition publish đúng event (dùng `ApplicationEventsTestExecutionListener` của Spring).

## Listeners hiện tại

Cần xác minh — survey chưa list listener file cụ thể. Nếu các listener bám trong service-impl cũ (chưa tách ra `listener/` package riêng), Phase 3 chỉ "publish-side done"; "subscribe-side" có thể vẫn nằm chung. Xem [[open-questions]] nếu cần verify.

## Related

- [[components/backend-architecture]] — package layout
- [[features/uc11-12-purchase-order-lifecycle]] — PO state machine publish events
- [[features/uc16-notification-system]] — Listener của POConfirmedEvent
- [[decisions/po-cancellation-cascade]] — cascade khi cancel PO
- [[decisions/remove-stock-inquiry]] — InquiryTimeoutEvent đã xóa

---

## Backlinks
- [[components/backend-architecture]] — listed
- [[analysis/refactor-roadmap]] — Phase 3 status
