---
title: ProcessRequest Coordinator — Phase 2 ISP refactor (post-inquiry-removal)
category: components
tags: [backend, isp, refactor-phase-2, god-class-split, processrequest]
sources: [ITSSBE/src/main/java/com/example/importorder/service/impl/processrequest/]
created: 2026-06-06
updated: 2026-06-06
---

# ProcessRequest Coordinator — Phase 2 ISP refactor

> `ProcessRequestServiceImpl` từng là God Class kham đủ thứ: validation, item CRUD, site assignment, inquiry coordination, PO batch creation. Phase 2 áp dụng **Interface Segregation Principle**: tách thành services con, mỗi service một concern.

> [!info] Updated 2026-06-06
> Sau khi stock-inquiry subsystem bị xóa (xem [[decisions/remove-stock-inquiry]]), `IInquiryCoordinationService` + impl đã bị **xóa hoàn toàn**. Số services con từ **5 → 4**.

## Cấu trúc sau refactor (hiện tại)

```
service/
├── IProcessRequestService            ← Orchestrator interface (public API)
├── IRequestItemService               ← #1
├── IMerchandiseAssignmentService     ← #2
├── ISitePickingService               ← #3
├── IPOBatchCreationService           ← #4
└── impl/
    ├── ProcessRequestServiceImpl     ← Orchestrator
    └── processrequest/
        ├── RequestItemServiceImpl
        ├── MerchandiseAssignmentServiceImpl
        ├── SitePickingServiceImpl
        └── POBatchCreationServiceImpl
```

**Xóa khỏi cấu trúc cũ**: `IInquiryCoordinationService` + `InquiryCoordinationServiceImpl` (do stock-inquiry subsystem đã bị xóa).

## Phân chia trách nhiệm

| Service | Vai trò | Use case liên quan |
|---------|---------|---------------------|
| `IRequestItemService` | CRUD `request_item` (add/remove/update item bên trong 1 request) | UC4 (sales create), UC6 step 0 |
| `IMerchandiseAssignmentService` | Gán **1 site** cho mỗi mặt hàng | UC6 step 1 |
| `ISitePickingService` | Multi-site picking — khi 1 merchandise đặt ở nhiều site cùng lúc | UC6 step 1 (multi-site variant) |
| `IPOBatchCreationService` | Batch tạo PO (1 request → N PO theo site) — đọc stock thẳng từ `site_merchandise` | UC6 step 2, UC11 |

## Methods removed from `ProcessRequestServiceImpl` (2026-06-06)

- `sendInquiries(Integer)` — xóa
- `getInquiryStatus(Integer)` → `Map<Integer, InquiryStatusDTO>` — xóa (DTO class cũng bị xóa)
- `getInventoryMatrix(Integer)` → `Map<Integer, Map<Integer, StockInfoDTO>>` — xóa (DTO class cũng bị xóa)
- Field injections `StockInquiryRepository siRepo`, `StockInquiryItemRepository siiRepo`, `IStockInquiryService inquiryService` — xóa

`IProcessRequestService` cũng đã được trim tương ứng.

## Endpoint mapping (sau refactor)

| Endpoint | Service được gọi |
|----------|------------------|
| `GET /api/requests/{id}` | Orchestrator chính |
| `GET/POST /api/requests/{id}/merchandise-assignments` | `IMerchandiseAssignmentService` (qua orchestrator) |
| `GET/POST /api/requests/{id}/site-picks` | `ISitePickingService` (qua orchestrator) |
| `GET /api/requests/{id}/site-options` | Orchestrator — đọc `SiteMerchandise.findActiveStockByMerchandise` |
| `POST /api/requests/{id}/po-batch` | `IPOBatchCreationService` (qua orchestrator) |

Các endpoint đã **xóa** trong refactor: `POST /{id}/send-inquiries`, `GET /{id}/inquiry-status`, `GET /{id}/inventory-matrix`.

## Tại sao tách (ISP nhắc lại)

**Tiêu chí "1 interface không bị buộc implement method nó không cần"**:
- Test viết cho `MerchandiseAssignment` không cần mock toàn bộ ProcessRequest pipeline.
- Mở rộng: thêm chiến lược picking mới chỉ thay implementation `ISitePickingService`, không đụng phần khác.

## Kiểm thử

`AssignmentValidationTest` cover `IMerchandiseAssignmentService` business rule. Test khác chưa có riêng cho 3 services còn lại — backlog [[open-questions]].

## Related

- [[components/backend-architecture]] — package layout
- [[features/uc6-overseas-process-request]] — 2-step workflow (cập nhật)
- [[decisions/remove-stock-inquiry]] — lý do bỏ InquiryCoordination service
- [[analysis/academic-design-patterns]] — ISP pattern Before/After

---

## Backlinks
- [[components/backend-architecture]] — listed in service table
- [[analysis/refactor-roadmap]] — Phase 2 status
- [[decisions/remove-stock-inquiry]] — references this page (service count change)
