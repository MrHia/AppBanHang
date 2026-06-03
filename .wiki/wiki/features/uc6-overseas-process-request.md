---
title: UC6 — Overseas xử lý Process Request (5 bước)
category: features
tags: [overseas, process-request, stock-inquiry, multi-site]
sources: [DOCS/USER_GUIDE.md]
created: 2026-06-03
updated: 2026-06-03
---

# UC6 — Overseas xử lý Process Request

> 5 bước: Find sites → Pick sites & merchandise → Send inquiries → Track responses → Aggregate & create POs (see [[claims#c-20260603-11]]).

## 5-step flow

### Bước 1 — Tìm Site (`overseas/process-request/find-sites`)

- System auto-match: Site nào đang kinh doanh merchandise trong request
- Display: Site name, country, **% mặt hàng khớp**
- Overseas tick chọn sites muốn tiếp tục
- "Tiếp tục"

> Note: chưa hiện qty tồn kho — chỉ có sau Site response.

### Bước 2 — Pick Site + Merchandise (`overseas/process-request/pick`)

**Đây là bước phức tạp nhất.**

- Với mỗi site đã tick:
  - **PICK** (✓): bao gồm trong inquiry
  - **REJECT** (✗): loại, **bắt buộc nhập lý do**
- Với mỗi site PICK: tick chọn **subset merchandise** muốn hỏi tồn kho

**Example:**
```
Request items: A, B, C
- Site US: PICK, tick A + B → inquiry hỏi A, B từ Site US
- Site JP: PICK, tick B + C → inquiry hỏi B, C từ Site JP
- Site DE: REJECT (reason: "không vận chuyển được hàng C")
```

Validation: ≥ 1 site picked với ≥ 1 merchandise.

### Bước 3 — Send Inquiries

- Review → "Gửi yêu cầu kiểm tra tồn kho"
- Mỗi site nhận notification + có **48h** để respond (see [[features/uc7-stock-inquiry-timeout]])

### Bước 4 — Track Progress

| Status | Meaning |
|--------|---------|
| Chờ PH | PENDING (chờ response) |
| Một phần | PARTIAL (response 1 phần items) |
| Đã PH | COMPLETE |
| Hết hạn | TIMEOUT (≥ 48h chưa response) |

"Làm mới" → refresh status. Có thể next step khi **≥ 1 site đã response**.

### Bước 5 — Aggregate & Create POs (`overseas/order-matrix`)

Bảng tổng hợp cross-site cross-item với markers:
- *(no marker)*: stock chính thức (Site đã PH)
- *(Ref)*: stock tham khảo (chưa PH, dùng `site_merchandise.stock_quantity`)
- *(Ref\*)*: timeout, dùng stock tham khảo (cảnh báo)

**Phân chia & Tạo PO:**
1. "Phân chia & Tạo PO"
2. Per-site per-item: nhập qty (≤ stock available)
3. Preview
4. Per-PO: shipping method (sea/air/road) + delivery date
5. "Gửi X PO" → tạo nhiều PO cùng lúc (1 PO / site)

## API surface (preliminary)

- `GET /api/process-requests/{id}/matching-sites`
- `POST /api/stock-inquiries` (create batch)
- `GET /api/stock-inquiries?processRequestId=…`
- `POST /api/po/draft` (multi-site batch — see [[features/uc11-12-purchase-order-lifecycle]])

## Data touched

- `process_request`, `request_item`
- `request_site` (per-request per-site selection)
- `stock_inquiry`, `stock_inquiry_item`
- `purchase_order`, `po_detail`

## Risks & Refactor notes

> [!warning] Complex multi-step UI state
> 5 bước = 5 sub-routes trong `pages/overseas/process-request/`. State giữa các bước có thể bị mất khi refresh. Refactor cần **persist state vào URL params hoặc backend** (thay vì context state).

> [!question] Partial response handling
> User guide ghi "Một phần" status, nhưng không nói có thể create PO với items đã PH không. Đây là [[open-questions#q-20260603-06]].

> [!tip] Stock reference snapshot
> "Ref" value lấy realtime hay snapshot? Đây là [[open-questions#q-20260603-05]] — quan trọng vì ảnh hưởng concurrent update.

## Related

- [[features/uc4-sales-create-request]] — bước trước
- [[features/uc7-stock-inquiry-timeout]] — chi tiết 48h timeout
- [[features/uc11-12-purchase-order-lifecycle]] — bước tiếp theo

---

## Backlinks
- [[overview]] — references UC6
- [[sources/user-guide]] — workflow documented chi tiết
