---
title: UC6 — Overseas xử lý Process Request (2 bước, sau refactor 2026-06-06)
category: features
tags: [overseas, process-request, multi-site]
sources: [DOCS/USER_GUIDE.md, ITSSFE/src/pages/overseas/process-request/[id].js]
created: 2026-06-03
updated: 2026-06-06
---

# UC6 — Overseas xử lý Process Request

> 2 bước (sau khi stock-inquiry subsystem được loại bỏ): **Assign Site cho từng mặt hàng → Tạo PO batch**. Stock đọc trực tiếp từ `SiteMerchandise.stock_quantity`.

> [!info] Refactor 2026-06-06
> Workflow đã rút từ 5 bước → 2 bước. Xem [[decisions/remove-stock-inquiry]] cho chi tiết. Mọi mô tả về "send inquiry", "track response", "PARTIAL/RESPONDED/TIMEOUT", và "stock reference vs actual" đã hết hiệu lực.

## 2-step flow

### Bước 1 — Assign Site cho mặt hàng (`Step1AssignSites.js`)

Với mỗi mặt hàng trong request:
- **Chọn đúng 1 Site** (radio-tick) trong bảng (mặt hàng × site).
- Hoặc **Reject** với lý do bắt buộc.

Mỗi mặt hàng có 1 dòng trong `request_site` với status `PICKED` hoặc `REJECTED` (enum đã rút từ 5 giá trị xuống 2).

Validation:
- Mỗi mặt hàng phải có ≥ 1 lựa chọn (Site hoặc reject + lý do).
- Site đã chọn phải đang kinh doanh mặt hàng đó (`site_merchandise` row tồn tại + active).

API: `POST /api/requests/{id}/merchandise-assignments`.

### Bước 2 — Tạo PO batch (`Step2CreatePOs.js`, mới)

Bảng hiển thị:
- Mặt hàng, số lượng yêu cầu, Site đã gán, **tồn kho hiện tại** (đọc thẳng từ `site_merchandise.stock_quantity` qua `siteMerchandiseApi.getBySite(siteId)`), status.
- Màu nền theo "có đủ stock để fulfill?": xanh đủ, vàng còn ít, đỏ hết.

Click **"Tạo PO"** → mở `POCreateDialog`:
1. Per-site per-item: nhập qty (cap ≤ stock available).
2. Preview với delivery method (SHIP/AIR/LAND) + expected delivery date.
3. "Gửi X PO" → 1 batch tạo N PO, mỗi PO 1 site.

API: `POST /api/requests/{id}/po-batch` — trừ tồn kho từ `site_merchandise.stock_quantity` ngay khi tạo, đặt request về DONE.

## API surface (hiện tại)

| Endpoint | Purpose |
|----------|---------|
| `GET /api/requests/{id}/merchandise-assignments` | Lấy assignments hiện có (PENDING/PICKED/REJECTED per mặt hàng) |
| `POST /api/requests/{id}/merchandise-assignments` | Lưu Step 1 |
| `GET /api/site-merchandise/site/{siteId}` | Stock trực tiếp từ kho Site (thay cho old inventory matrix) |
| `POST /api/requests/{id}/po-batch` | Step 2 — batch create POs |

Các endpoint đã **xóa** trong refactor: `POST /{id}/send-inquiries`, `GET /{id}/inquiry-status`, `GET /{id}/inventory-matrix`.

## Data touched

- `process_request`, `request_item`
- `request_site` (per-request × merchandise — status chỉ còn `PICKED` / `REJECTED`)
- `purchase_order`, `po_detail`
- `site_merchandise.stock_quantity` — bị trừ khi tạo PO; được **hoàn lại** nếu PO sau đó bị cancel (xem [[decisions/po-cancellation-cascade]]).

> [!warning] Cancellation cascade
> Nếu bất kỳ PO nào trong batch bị hủy, cả ProcessRequest và mọi PO anh em đều bị hủy (`status = CANCELLED` / `REJECTED`) và tồn kho được hoàn lại. Xem [[features/uc11-12-purchase-order-lifecycle]].

## Related

- [[features/uc4-sales-create-request]] — bước trước
- [[features/uc11-12-purchase-order-lifecycle]] — vòng đời PO sau khi tạo
- [[decisions/remove-stock-inquiry]] — lý do bỏ inquiry step
- [[decisions/po-cancellation-cascade]] — cascade khi cancel
- [[components/processrequest-coordinator]] — orchestrator backend

---

## Backlinks
- [[overview]] — references UC6
- [[sources/user-guide]] — workflow gốc (5 bước, nay deprecated)
- [[decisions/remove-stock-inquiry]] — supersedes old steps 3-5
