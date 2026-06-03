---
title: USER_GUIDE.md — Hướng dẫn sử dụng chi tiết (VI)
category: sources
tags: [user-guide, business-flow, multi-role]
source_path: DOCS/USER_GUIDE.md
source_type: reference
date: 2026-05-31
authors: []
created: 2026-06-03
ingested: 2026-06-03
updated: 2026-06-03
---

# USER_GUIDE.md — Hướng dẫn sử dụng chi tiết (VI)

## Abstract

USER_GUIDE.md là tài liệu hướng dẫn end-user (VI) chia theo 5 vai trò: Admin, Sales, Overseas, Site, Warehouse. Mô tả end-to-end workflow với screen-by-screen instructions. Phần quan trọng nhất là **Overseas Process Request** chia thành 5 bước rõ ràng: (1) Tìm Site → (2) Pick/Reject Site + tick merchandise muốn hỏi → (3) Gửi inquiry → (4) Theo dõi tiến độ → (5) Tổng hợp & tạo PO theo site. Tài liệu cũng giải thích **stock reference markers**: không marker = stock chính thức, (Ref) = chưa phản hồi nhưng có hàng, (Ref*) = timeout.

## Key claims

- [[claims#c-20260603-10]] — Account lockout: 5 lần sai mật khẩu → khóa 30 phút
- [[claims#c-20260603-11]] — Overseas Process Request có 5 bước rõ ràng (Find sites → Pick → Send → Track → Aggregate)
- [[claims#c-20260603-12]] — Site response window: 48 giờ, sau đó dùng stock reference
- [[claims#c-20260603-13]] — Stock display markers: `(no marker)` = chính thức, `(Ref)` = chưa PH, `(Ref*)` = timeout
- [[claims#c-20260603-14]] — Multi-site PO splitting: 1 request có thể tạo nhiều PO (mỗi PO 1 site, mỗi PO 1 shipping method + delivery date)
- [[claims#c-20260603-15]] — Discrepancy có thể là âm (thiếu) hoặc dương (thừa); Site phản hồi với lý do + phương án (gửi bù / hoàn tiền)
- [[claims#c-20260603-16]] — Site Merchandise có khái niệm "Ngừng KD" (soft delete): vẫn hiển thị nhưng không pick được
- [[claims#c-20260603-17]] — Request code format: `REQ-YYYYMMDD-NNN` (e.g. REQ-20250526-001)

## Pages updated from this source

- [[features/uc4-sales-create-request]] (sẽ tạo)
- [[features/uc5-overseas-find-sites]] (sẽ tạo)
- [[features/uc6-overseas-pick-sites-merchandise]] (sẽ tạo)
- [[features/uc7-stock-inquiry-timeout]] (sẽ tạo)
- [[features/uc11-po-draft-split]] (sẽ tạo)
- [[features/uc13-site-confirm-reject-po]] (sẽ tạo)
- [[features/uc15-warehouse-receive]] (sẽ tạo)
- [[features/uc18-discrepancy-creation]] (sẽ tạo)
- [[features/uc19-site-discrepancy-response]] (sẽ tạo)
- [[features/uc20-warehouse-resolve-discrepancy]] (sẽ tạo)

## Open questions raised

- [[open-questions#q-20260603-05]] — Stock reference value: lấy từ `site_merchandise.stock_quantity` snapshot hay realtime?
- [[open-questions#q-20260603-06]] — Khi Site response partial (phản hồi 1 phần items), workflow tiếp tục thế nào?

## Notes

- Tài liệu dùng tiếng Việt nhưng có lẫn 1 ký tự CN ở phần auth: `会自动去除空格` (autocorrect lỗi?) — Cần verify trong refactor.
- Section "Luồng Nghiệp vụ Tổng thể" có flow chart ASCII rất giá trị, dùng làm reference cho test scenarios.
- "Site Merchandise — Ngừng KD" là soft-delete pattern — quan trọng cho data integrity khi refactor.

---

## Backlinks
- [[overview]] — references this source
